#!/usr/bin/env python3
"""
Control launch — e-stop, arm controller (motor_node), joystick teleop.

E-stop launches first as it's the highest-priority safety node.
All control nodes check /estop/active before publishing commands.

NOTE: Skid-steer mixing is handled by diff_drive_controller inside ros2_control,
launched from hardware.launch.py.

ARM: rover_arm (passive safety wrapper) has been replaced by motor_node from
DCR-Arm-2026, which has IK/FK mode switching and direct CAN communication.

MOCK MODE: Fully functional without physical hardware.
HARDWARE UPGRADE: No changes needed — control nodes are hardware-independent.
"""

from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    use_mock_arg = DeclareLaunchArgument(
        'use_mock', default_value='true',
        description='Use mock mode for arm (no CAN hardware)')

    use_mock_cfg = LaunchConfiguration('use_mock')

    pkg = FindPackageShare('rover_bringup')

    # -- E-Stop (must start first) --
    estop = Node(
        package='rover_estop',
        executable='estop_node',
        name='estop_node',
        parameters=[{
            'watchdog_timeout_sec': 5.0,
            'require_manual_reset': True,
        }],
        output='screen',
    )

    # -- Arm Controller (motor_node — IK/FK + CAN) --
    arm = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([
            PathJoinSubstitution([pkg, 'launch', 'arm.launch.py'])
        ]),
        launch_arguments={'use_mock': use_mock_cfg}.items(),
    )

    # -- Joystick Teleop (drive only — arm is controlled directly via /joy → motor_node) --
    joy_teleop = Node(
        package='rover_joy',
        executable='joy_teleop_node',
        name='joy_teleop_node',
        parameters=[{
            'linear_axis': 1,
            'angular_axis': 0,
            'linear_scale': 1.0,
            'angular_scale': 2.0,
            'mode_button': 0,
            'deadzone': 0.1,
            'arm_speed_scale': 0.5,
            'drive_only': True,
        }],
        output='screen',
    )

    return LaunchDescription([
        use_mock_arg,
        estop,
        arm,
        joy_teleop,
    ])

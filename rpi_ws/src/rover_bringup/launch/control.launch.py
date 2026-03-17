#!/usr/bin/env python3
"""
Control launch — e-stop, arm controller, joystick teleop.

E-stop launches first as it's the highest-priority safety node.
All control nodes check /estop/active before publishing commands.

NOTE: drive_node (rover_drive skid-steer mixer) is intentionally NOT launched here.
Skid-steer mixing is now handled by diff_drive_controller inside ros2_control,
launched from hardware.launch.py.

MOCK MODE: Fully functional without physical hardware.
HARDWARE UPGRADE: No changes needed — control nodes are hardware-independent.
"""

from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    # -- E-Stop (must start first) --
    estop = Node(
        package='rover_estop',
        executable='estop_node',
        name='estop_node',
        parameters=[{
            'watchdog_timeout_sec': 5.0,   # Generous timeout for testing
            'require_manual_reset': True,
        }],
        output='screen',
    )

    # -- Arm Controller --
    arm = Node(
        package='rover_arm',
        executable='arm_controller_node',
        name='arm_controller_node',
        parameters=[{
            'velocity_scale': 0.5,
            'publish_rate_hz': 50.0,
        }],
        output='screen',
    )

    # -- Joystick Teleop --
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
        }],
        output='screen',
    )

    return LaunchDescription([
        estop,
        arm,
        joy_teleop,
    ])

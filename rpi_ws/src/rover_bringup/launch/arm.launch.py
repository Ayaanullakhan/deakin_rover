#!/usr/bin/env python3
"""
Arm launch — motor_node (IK/FK + CAN) and socketcan_bridge (real hw only).

In mock mode, motor_node runs without CAN hardware, publishing synthetic
/motor_stat_1 feedback from current joint state.

MOCK MODE: motor_node runs with use_mock:=true; socketcan_bridge is skipped.
HARDWARE UPGRADE: Set use_mock:=false to enable socketcan_bridge and real CAN.
"""

from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch.conditions import IfCondition, UnlessCondition


def generate_launch_description():
    use_mock_arg = DeclareLaunchArgument(
        'use_mock', default_value='true',
        description='Use mock mode (skips socketcan_bridge, runs motor_node without CAN)')

    use_mock_cfg = LaunchConfiguration('use_mock')

    # socketcan_bridge — only launched on real hardware
    socketcan = Node(
        package='socketcan_bridge',
        executable='socketcan_bridge_node',
        name='socketcan_bridge_node',
        parameters=[{'can_device': 'can0'}],
        output='screen',
        condition=UnlessCondition(use_mock_cfg),
    )

    # motor_node — IK/FK arm controller
    motor = Node(
        package='motor_node',
        executable='start_controller',
        name='motor_node',
        parameters=[{'use_mock': use_mock_cfg}],
        output='screen',
    )

    return LaunchDescription([
        use_mock_arg,
        socketcan,
        motor,
    ])

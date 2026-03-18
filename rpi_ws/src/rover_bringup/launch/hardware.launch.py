#!/usr/bin/env python3
"""
Hardware launch — ros2_control drive system, CAN bridge, cameras.

Drive motors are now managed by ros2_control (controller_manager +
diff_drive_controller) instead of the old rs485_bridge_node + drive_node chain.

MOCK MODE: All nodes simulate hardware responses.
HARDWARE UPGRADE: Set use_mock:=false when deploying to real rover.
"""

import os

from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument, RegisterEventHandler
from launch.event_handlers import OnProcessStart
from launch.substitutions import (
    Command, FindExecutable, LaunchConfiguration,
    PathJoinSubstitution,
)
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    use_mock = DeclareLaunchArgument(
        'use_mock', default_value='true',
        description='Use mock mode for all hardware nodes')

    use_mock_cfg = LaunchConfiguration('use_mock')

    # ── Config paths ──────────────────────────────────────────────────────────
    camera_config = PathJoinSubstitution([
        FindPackageShare('rover_bringup'), 'config', 'camera_config.yaml'])
    arm_config = PathJoinSubstitution([
        FindPackageShare('rover_bringup'), 'config', 'arm_motors.yaml'])
    controllers_config = PathJoinSubstitution([
        FindPackageShare('rover_bringup'), 'config', 'ros2_controllers.yaml'])

    # ── Robot description (URDF with ros2_control block) ─────────────────────
    robot_description_content = Command([
        FindExecutable(name='xacro'), ' ',
        PathJoinSubstitution([
            FindPackageShare('rover_description'), 'urdf', 'rover.urdf.xacro']),
        ' use_mock_hardware:=', use_mock_cfg,
    ])
    robot_description = {'robot_description': robot_description_content}

    # ── Controller Manager ────────────────────────────────────────────────────
    controller_manager = Node(
        package='controller_manager',
        executable='ros2_control_node',
        parameters=[robot_description, controllers_config],
        output='screen',
    )

    # ── Joint State Broadcaster spawner ──────────────────────────────────────
    joint_state_broadcaster_spawner = Node(
        package='controller_manager',
        executable='spawner',
        arguments=['joint_state_broadcaster', '--controller-manager', '/controller_manager'],
        output='screen',
    )

    # ── Diff Drive Controller spawner (remaps to /cmd_vel) ───────────────────
    diff_drive_spawner = Node(
        package='controller_manager',
        executable='spawner',
        arguments=[
            'diff_drive_controller',
            '--controller-manager', '/controller_manager',
            '--ros-args', '-r', '/diff_drive_controller/cmd_vel:=/cmd_vel',
        ],
        output='screen',
    )

    # Spawn controllers after controller_manager is up
    delay_joint_state_broadcaster = RegisterEventHandler(
        event_handler=OnProcessStart(
            target_action=controller_manager,
            on_start=[joint_state_broadcaster_spawner],
        )
    )
    delay_diff_drive = RegisterEventHandler(
        event_handler=OnProcessStart(
            target_action=controller_manager,
            on_start=[diff_drive_spawner],
        )
    )

    # ── Camera Node ───────────────────────────────────────────────────────────
    camera = Node(
        package='rover_camera',
        executable='camera_node',
        name='camera_node',
        parameters=[camera_config],
        output='screen',
    )

    # NOTE: rover_can (can_bridge_node) is intentionally NOT launched here.
    # CAN arm control is now handled by motor_node (DCR-Arm-2026) + socketcan_bridge,
    # launched from control.launch.py via arm.launch.py.
    # rover_can package remains in the repo as reference only.

    return LaunchDescription([
        use_mock,
        controller_manager,
        delay_joint_state_broadcaster,
        delay_diff_drive,
        camera,
    ])

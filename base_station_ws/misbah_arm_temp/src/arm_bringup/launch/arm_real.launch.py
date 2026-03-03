"""
arm_real.launch.py — bring up the rover arm on real SocketCAN hardware.

Usage:
    ros2 launch arm_bringup arm_real.launch.py
    ros2 launch arm_bringup arm_real.launch.py can_interface:=vcan0
    ros2 launch arm_bringup arm_real.launch.py base_joint_connected:=false
"""

from moveit_configs_utils import MoveItConfigsBuilder

from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, OpaqueFunction
from launch.substitutions import LaunchConfiguration

from launch_ros.actions import Node


def launch_setup(context, *args, **kwargs):
    can_interface       = LaunchConfiguration("can_interface").perform(context)
    base_joint_connected = LaunchConfiguration("base_joint_connected").perform(context)

    moveit_config = (
        MoveItConfigsBuilder("rover_arm", package_name="arm_moveit_config")
        .robot_description(
            mappings={
                "use_mock_hardware":    "false",
                "can_interface":        can_interface,
                "base_joint_connected": base_joint_connected,
            }
        )
        .to_moveit_configs()
    )

    ros2_control_node = Node(
        package="controller_manager",
        executable="ros2_control_node",
        parameters=[
            moveit_config.robot_description,
            str(moveit_config.package_path / "config/ros2_controllers.yaml"),
        ],
        output="screen",
    )

    robot_state_publisher = Node(
        package="robot_state_publisher",
        executable="robot_state_publisher",
        parameters=[moveit_config.robot_description],
        output="screen",
    )

    joint_state_broadcaster_spawner = Node(
        package="controller_manager",
        executable="spawner",
        arguments=["joint_state_broadcaster"],
        output="screen",
    )

    arm_controller_spawner = Node(
        package="controller_manager",
        executable="spawner",
        arguments=["arm_group_controller"],
        output="screen",
    )

    move_group_node = Node(
        package="moveit_ros_move_group",
        executable="move_group",
        parameters=[moveit_config.to_dict()],
        output="screen",
    )

    rviz_node = Node(
        package="rviz2",
        executable="rviz2",
        arguments=["-d", str(moveit_config.package_path / "config/moveit.rviz")],
        parameters=[
            moveit_config.robot_description,
            moveit_config.robot_description_semantic,
            moveit_config.robot_description_kinematics,
            moveit_config.planning_pipelines,
            moveit_config.joint_limits,
        ],
        output="screen",
    )

    return [
        ros2_control_node,
        robot_state_publisher,
        joint_state_broadcaster_spawner,
        arm_controller_spawner,
        move_group_node,
        rviz_node,
    ]


def generate_launch_description():
    return LaunchDescription(
        [
            DeclareLaunchArgument(
                "can_interface",
                default_value="can0",
                description="SocketCAN interface name (e.g. can0, vcan0)",
            ),
            DeclareLaunchArgument(
                "base_joint_connected",
                default_value="true",
                description="Set false if the base motor is not physically connected",
            ),
            OpaqueFunction(function=launch_setup),
        ]
    )

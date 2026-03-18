import rclpy
from rclpy.node import Node

from arm_interfaces.msg import MotorStat1, MotorStat2
from can_msgs.msg import Frame
from sensor_msgs.msg import Joy
from geometry_msgs.msg import Point
from std_msgs.msg import Bool, String

from motor_node.iksolve import IKSolver
from motor_node.motor import Motor


class Controller(Node):

    def __init__(self):
        super().__init__('Controller')
        self.mode = 0  # 0 is fk-spd control, 1 is ik-pos control
        self.last_toggle_buttons = False
        self.estop_active = False

        self.declare_parameter('use_mock', True)
        self.use_mock = self.get_parameter('use_mock').value

        self.get_logger().info(
            f"Controller started in {'FK' if self.mode == 0 else 'IK'} mode "
            f"(mock={self.use_mock})")

        self.motor = Motor()

        self.can_publisher = self.create_publisher(Frame, 'socketcan_bridge/tx', 20)
        self.can_subscriber = self.create_subscription(
            Frame, 'socketcan_bridge/rx', self.check_can_msg_callback, 20)

        self.ik_solver = IKSolver()
        self.current_joints = [0.0, 0.0, 0.0]
        self.pos_goal = Point()  # for IK
        self.pos_current = Point()

        self.joy_subscriber = self.create_subscription(Joy, '/joy', self.joy_callback, 30)
        self.create_subscription(Bool, '/estop/active', self._on_estop, 10)

        self.stat_publisher_1 = self.create_publisher(MotorStat1, '/motor_stat_1', 15)
        self.stat_publisher_2 = self.create_publisher(MotorStat2, '/motor_stat_2', 15)
        self.mode_publisher = self.create_publisher(String, '/arm/mode', 5)

        timer_period = 1  # seconds
        self.stat_timer = self.create_timer(timer_period, self.stat_timer_callback)

        if not self.use_mock:
            for i in range(6):
                can_cmd = self.motor.set_home(i + 1)
                self.can_publisher.publish(can_cmd)

    def _on_estop(self, msg):
        self.estop_active = msg.data
        if msg.data:
            if not self.use_mock:
                zero_frame = Frame()
                for i in range(6):
                    zero_cmd = self.motor.speed_control(i + 1, 0.0)
                    self.can_publisher.publish(zero_cmd)
            self.get_logger().warn('E-STOP: arm halted')

    def joy_callback(self, joy_msg):
        if self.estop_active:
            return

        toggle_pressed = (joy_msg.buttons[4] == 1 and joy_msg.buttons[5] == 1)
        if toggle_pressed and not self.last_toggle_buttons:
            if self.mode == 0:
                self.pos_goal = self.pos_current
                self.ik_solver.old_joints = [0.0] + [j / 57.2958 for j in self.current_joints] + [0.0]
                self.mode = 1
                self.get_logger().info("going in IK mode")
            elif self.mode == 1:
                self.mode = 0
                self.get_logger().info("going in FK mode")
        self.last_toggle_buttons = toggle_pressed

        spd_cmd = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]

        if self.mode == 1:
            self.get_logger().info(f"Pos Goal is {self.pos_goal.x}, {self.pos_goal.y}, {self.pos_goal.z}")
            self.pos_goal.x += joy_msg.axes[0] / 500  # Lx
            self.pos_goal.y += joy_msg.axes[1] / 500  # Ly
            self.pos_goal.z += joy_msg.axes[4] / 500  # Ry
            angle_cmd = self.ik_solver.solve(self.pos_goal)
            if not self.use_mock:
                for i in range(3):
                    self.get_logger().info(f"Motor {i + 1} going to {angle_cmd[i]}")
                    can_cmd = self.motor.position_control(i + 1, angle_cmd[i])
                    self.can_publisher.publish(can_cmd)
        elif self.mode == 0:
            spd_cmd[0] = joy_msg.axes[0] * 5
            spd_cmd[1] = joy_msg.axes[1] * 5
            spd_cmd[2] = joy_msg.axes[4] * 5
            if not self.use_mock:
                for i in range(3):
                    can_cmd = self.motor.speed_control(i + 1, spd_cmd[i])
                    self.can_publisher.publish(can_cmd)

        spd_cmd[3] = joy_msg.axes[3] * 10  # Rx
        spd_cmd[4] = joy_msg.axes[7] * 10  # Pad y
        spd_cmd[5] = joy_msg.axes[6] * 10  # Pad x
        if not self.use_mock:
            for i in range(3, 6):
                can_cmd = self.motor.speed_control(i + 1, spd_cmd[i])
                self.can_publisher.publish(can_cmd)

        self.pos_current = self.ik_solver.desolve(self.current_joints)

    def check_can_msg_callback(self, can_rx_msg):
        if can_rx_msg.data[0] == 0xA4:
            motor_stat = self.motor.read_status_1(can_rx_msg)
            if motor_stat.id < 4:
                self.current_joints[motor_stat.id - 1] = motor_stat.angle
            self.stat_publisher_1.publish(motor_stat)
        elif can_rx_msg.data[0] == 0xAE:
            motor_stat = self.motor.read_status_2(can_rx_msg)
            self.stat_publisher_2.publish(motor_stat)

    def stat_timer_callback(self):
        # Publish mode string
        mode_msg = String()
        mode_msg.data = 'IK' if self.mode == 1 else 'FK'
        self.mode_publisher.publish(mode_msg)

        if self.use_mock:
            # In mock mode, synthesize MotorStat1 from current_joints
            for i, angle in enumerate(self.current_joints):
                stat = MotorStat1()
                stat.id = i + 1
                stat.angle = angle
                stat.speed = 0.0
                stat.current = 0.0
                stat.temp = 25.0
                self.stat_publisher_1.publish(stat)
            return

        stat_msg1 = Frame()
        stat_msg1.id = 0xFF
        stat_msg1.dlc = 0x01
        stat_msg1.data[0] = 0xA4
        self.can_publisher.publish(stat_msg1)

        stat_msg2 = Frame()
        stat_msg2.id = 0xFF
        stat_msg2.dlc = 0x01
        stat_msg2.data[0] = 0xAE
        self.can_publisher.publish(stat_msg2)


def main():
    rclpy.init()
    node = Controller()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()

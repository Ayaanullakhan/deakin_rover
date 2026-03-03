#pragma once

#include <cstdint>
#include <string>

#include <linux/can.h>

namespace my_robot_hardware
{

struct MotorFeedback
{
  double position_rad{0.0};
  double velocity_rads{0.0};
  double current_amps{0.0};
  uint8_t temperature{0};
  bool valid{false};
};

class ArmCANDriver
{
public:
  ArmCANDriver() = default;
  ~ArmCANDriver();

  /// Open the SocketCAN interface and set it non-blocking.
  bool open(const std::string & interface_name);

  void close();
  bool is_open() const;

  /// Send 0xC2 position command (int32_t LE encoder counts).
  bool send_position_command(uint8_t motor_id, double angle_rad);

  /// Send 0xC1 velocity command (int32_t LE, units of 0.01 rad/s).
  bool send_velocity_command(uint8_t motor_id, double vel_rad_s);

  /// Broadcast 0xFF/0xA4 status request to all motors.
  bool send_status_request();

  /// Non-blocking receive. Returns true and populates motor_id/fb on a valid
  /// A4 response frame. Returns false on EAGAIN (no data) or error.
  bool recv_nonblocking(uint8_t & motor_id, MotorFeedback & fb);

private:
  int socket_fd_{-1};

  static MotorFeedback parse_a4_response(const struct can_frame & frame);
};

}  // namespace my_robot_hardware

#include "my_robot_hardware/arm_can_driver.hpp"

#include <cmath>
#include <cstring>
#include <cerrno>

#include <fcntl.h>
#include <net/if.h>
#include <sys/ioctl.h>
#include <sys/socket.h>
#include <unistd.h>

#include <linux/can.h>
#include <linux/can/raw.h>

namespace my_robot_hardware
{

static constexpr double TWO_PI = 2.0 * M_PI;
static constexpr int32_t COUNTS_PER_REV = 16384;

static constexpr uint8_t CMD_POSITION       = 0xC2;
static constexpr uint8_t CMD_VELOCITY       = 0xC1;
static constexpr uint8_t CMD_STATUS_REQUEST = 0xA4;
static constexpr canid_t BROADCAST_ID       = 0xFF;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

ArmCANDriver::~ArmCANDriver()
{
  close();
}

bool ArmCANDriver::open(const std::string & interface_name)
{
  socket_fd_ = socket(PF_CAN, SOCK_RAW, CAN_RAW);
  if (socket_fd_ < 0) {
    return false;
  }

  struct ifreq ifr{};
  std::strncpy(ifr.ifr_name, interface_name.c_str(), IFNAMSIZ - 1);
  ifr.ifr_name[IFNAMSIZ - 1] = '\0';

  if (ioctl(socket_fd_, SIOCGIFINDEX, &ifr) < 0) {
    ::close(socket_fd_);
    socket_fd_ = -1;
    return false;
  }

  struct sockaddr_can addr{};
  addr.can_family  = AF_CAN;
  addr.can_ifindex = ifr.ifr_ifindex;

  if (bind(socket_fd_, reinterpret_cast<struct sockaddr *>(&addr), sizeof(addr)) < 0) {
    ::close(socket_fd_);
    socket_fd_ = -1;
    return false;
  }

  int flags = fcntl(socket_fd_, F_GETFL, 0);
  if (flags < 0 || fcntl(socket_fd_, F_SETFL, flags | O_NONBLOCK) < 0) {
    ::close(socket_fd_);
    socket_fd_ = -1;
    return false;
  }

  return true;
}

void ArmCANDriver::close()
{
  if (socket_fd_ >= 0) {
    ::close(socket_fd_);
    socket_fd_ = -1;
  }
}

bool ArmCANDriver::is_open() const
{
  return socket_fd_ >= 0;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

bool ArmCANDriver::send_position_command(uint8_t motor_id, double angle_rad)
{
  if (socket_fd_ < 0) {
    return false;
  }

  // counts = angle_rad / (2π) × 16384, stored as int32_t little-endian
  int32_t counts = static_cast<int32_t>(angle_rad / TWO_PI * COUNTS_PER_REV);

  struct can_frame frame{};
  frame.can_id  = motor_id;
  frame.can_dlc = 5;
  frame.data[0] = CMD_POSITION;
  std::memcpy(&frame.data[1], &counts, sizeof(counts));  // LE on x86/ARM

  ssize_t n = write(socket_fd_, &frame, sizeof(frame));
  return n == static_cast<ssize_t>(sizeof(frame));
}

bool ArmCANDriver::send_velocity_command(uint8_t motor_id, double vel_rad_s)
{
  if (socket_fd_ < 0) {
    return false;
  }

  // units of 0.01 rad/s → int32_t LE
  int32_t raw = static_cast<int32_t>(vel_rad_s / 0.01);

  struct can_frame frame{};
  frame.can_id  = motor_id;
  frame.can_dlc = 5;
  frame.data[0] = CMD_VELOCITY;
  std::memcpy(&frame.data[1], &raw, sizeof(raw));

  ssize_t n = write(socket_fd_, &frame, sizeof(frame));
  return n == static_cast<ssize_t>(sizeof(frame));
}

bool ArmCANDriver::send_status_request()
{
  if (socket_fd_ < 0) {
    return false;
  }

  struct can_frame frame{};
  frame.can_id  = BROADCAST_ID;
  frame.can_dlc = 1;
  frame.data[0] = CMD_STATUS_REQUEST;

  ssize_t n = write(socket_fd_, &frame, sizeof(frame));
  return n == static_cast<ssize_t>(sizeof(frame));
}

// ---------------------------------------------------------------------------
// Receive
// ---------------------------------------------------------------------------

bool ArmCANDriver::recv_nonblocking(uint8_t & motor_id, MotorFeedback & fb)
{
  if (socket_fd_ < 0) {
    return false;
  }

  // Loop internally to skip non-A4 frames; returns false only on EAGAIN.
  while (true) {
    struct can_frame frame{};
    ssize_t n = recv(socket_fd_, &frame, sizeof(frame), MSG_DONTWAIT);

    if (n < 0) {
      // EAGAIN / EWOULDBLOCK — no data available
      return false;
    }

    if (n != static_cast<ssize_t>(sizeof(frame))) {
      // Malformed frame length — skip
      continue;
    }

    // Identify A4 status response: DLC=8, data[0]=0xA4
    if (frame.can_dlc != 8 || frame.data[0] != CMD_STATUS_REQUEST) {
      continue;  // Not an A4 response — skip
    }

    motor_id = static_cast<uint8_t>(frame.can_id & CAN_SFF_MASK);
    fb = parse_a4_response(frame);
    return fb.valid;
  }
}

MotorFeedback ArmCANDriver::parse_a4_response(const struct can_frame & frame)
{
  MotorFeedback fb;
  if (frame.can_dlc < 8) {
    return fb;  // valid remains false
  }

  // data[1]: temperature (°C, uint8)
  fb.temperature = frame.data[1];

  // data[2..3]: current × 0.001 A (int16_t LE)
  int16_t raw_current = 0;
  std::memcpy(&raw_current, &frame.data[2], sizeof(raw_current));
  fb.current_amps = raw_current * 0.001;

  // data[4..5]: speed × 0.01 rad/s (int16_t LE)
  int16_t raw_speed = 0;
  std::memcpy(&raw_speed, &frame.data[4], sizeof(raw_speed));
  fb.velocity_rads = raw_speed * 0.01;

  // data[6..7]: angle ÷ 16384 × 2π rad (uint16_t LE)
  uint16_t raw_angle = 0;
  std::memcpy(&raw_angle, &frame.data[6], sizeof(raw_angle));
  fb.position_rad = static_cast<double>(raw_angle) / COUNTS_PER_REV * TWO_PI;

  fb.valid = true;
  return fb;
}

}  // namespace my_robot_hardware

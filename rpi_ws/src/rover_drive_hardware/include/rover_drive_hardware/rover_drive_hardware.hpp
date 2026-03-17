#ifndef ROVER_DRIVE_HARDWARE__ROVER_DRIVE_HARDWARE_HPP_
#define ROVER_DRIVE_HARDWARE__ROVER_DRIVE_HARDWARE_HPP_

#include <string>
#include <vector>

#include "hardware_interface/system_interface.hpp"
#include "hardware_interface/handle.hpp"
#include "hardware_interface/hardware_info.hpp"
#include "hardware_interface/types/hardware_interface_return_values.hpp"
#include "rclcpp/rclcpp.hpp"
#include "rclcpp_lifecycle/state.hpp"

// libmodbus (conditionally compiled — mock mode skips it)
#ifndef USE_MOCK_ONLY
#include <modbus/modbus.h>
#endif

namespace rover_drive_hardware
{

// Modbus register map (BLD-3055)
static constexpr uint16_t REG_CONTROL  = 0x2000;  // Control word (bit0=run, bit1=dir)
static constexpr uint16_t REG_SPEED    = 0x2001;  // Target speed  (0–3000 RPM, write)
static constexpr uint16_t REG_FEEDBACK = 0x2002;  // Actual speed  (0–3000 RPM, read)

// Motor Modbus IDs: 1–3 left side, 4–6 right side
static constexpr int NUM_MOTORS = 6;
static constexpr int MOTOR_IDS[NUM_MOTORS] = {1, 2, 3, 4, 5, 6};
// Right-side motors (IDs 4,5,6) are physically mounted reversed
static constexpr bool MOTOR_REVERSED[NUM_MOTORS] = {false, false, false, true, true, true};

class RoverDriveHardware : public hardware_interface::SystemInterface
{
public:
  RCLCPP_SHARED_PTR_DEFINITIONS(RoverDriveHardware)

  hardware_interface::CallbackReturn on_init(
    const hardware_interface::HardwareInfo & info) override;

  hardware_interface::CallbackReturn on_configure(
    const rclcpp_lifecycle::State & previous_state) override;

  hardware_interface::CallbackReturn on_activate(
    const rclcpp_lifecycle::State & previous_state) override;

  hardware_interface::CallbackReturn on_deactivate(
    const rclcpp_lifecycle::State & previous_state) override;

  hardware_interface::return_type read(
    const rclcpp::Time & time, const rclcpp::Duration & period) override;

  hardware_interface::return_type write(
    const rclcpp::Time & time, const rclcpp::Duration & period) override;

  std::vector<hardware_interface::StateInterface> export_state_interfaces() override;
  std::vector<hardware_interface::CommandInterface> export_command_interfaces() override;

private:
  // Parameters
  std::string serial_port_;
  int baud_rate_;
  bool use_mock_;
  double max_rpm_;

  // Joint state/command vectors (indexed 0–5, matching MOTOR_IDS order)
  std::vector<double> hw_commands_velocity_;   // rad/s commanded
  std::vector<double> hw_states_velocity_;     // rad/s feedback
  std::vector<double> hw_states_position_;     // rad (integrated)

  // Modbus context (null in mock mode)
#ifndef USE_MOCK_ONLY
  modbus_t * modbus_ctx_ = nullptr;
#endif

  // Mock dynamics state
  std::vector<double> mock_actual_rpm_;

  // Helper: convert rad/s ↔ RPM
  static double rad_s_to_rpm(double rad_s) { return rad_s * 60.0 / (2.0 * M_PI); }
  static double rpm_to_rad_s(double rpm)   { return rpm * 2.0 * M_PI / 60.0; }

  // Helper: send velocity to one motor via Modbus
  bool write_motor(int motor_index, double cmd_rpm);

  // Helper: read velocity from one motor via Modbus
  bool read_motor(int motor_index, double & out_rpm);

  // Helper: stop all motors (used in deactivate)
  void stop_all_motors();
};

}  // namespace rover_drive_hardware

#endif  // ROVER_DRIVE_HARDWARE__ROVER_DRIVE_HARDWARE_HPP_

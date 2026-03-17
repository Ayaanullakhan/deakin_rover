#include "rover_drive_hardware/rover_drive_hardware.hpp"

#include <cmath>
#include <limits>
#include <string>
#include <vector>

#include "hardware_interface/types/hardware_interface_type_values.hpp"
#include "rclcpp/rclcpp.hpp"

namespace rover_drive_hardware
{

// ──────────────────────────────────────────────────────────
// on_init — read parameters, size vectors
// ──────────────────────────────────────────────────────────
hardware_interface::CallbackReturn RoverDriveHardware::on_init(
  const hardware_interface::HardwareInfo & info)
{
  if (hardware_interface::SystemInterface::on_init(info) !=
    hardware_interface::CallbackReturn::SUCCESS)
  {
    return hardware_interface::CallbackReturn::ERROR;
  }

  // Read hardware parameters from URDF <ros2_control> block
  serial_port_ = info_.hardware_parameters.count("serial_port") ?
    info_.hardware_parameters.at("serial_port") : "/dev/ttyUSB0";
  baud_rate_ = info_.hardware_parameters.count("baud_rate") ?
    std::stoi(info_.hardware_parameters.at("baud_rate")) : 9600;
  max_rpm_ = info_.hardware_parameters.count("max_rpm") ?
    std::stod(info_.hardware_parameters.at("max_rpm")) : 3000.0;
  use_mock_ = info_.hardware_parameters.count("use_mock") ?
    (info_.hardware_parameters.at("use_mock") == "true") : true;

  RCLCPP_INFO(rclcpp::get_logger("RoverDriveHardware"),
    "Init: port=%s baud=%d max_rpm=%.0f mock=%s",
    serial_port_.c_str(), baud_rate_, max_rpm_, use_mock_ ? "true" : "false");

  // Validate joint count
  if (static_cast<int>(info_.joints.size()) != NUM_MOTORS) {
    RCLCPP_ERROR(rclcpp::get_logger("RoverDriveHardware"),
      "Expected %d joints, got %zu", NUM_MOTORS, info_.joints.size());
    return hardware_interface::CallbackReturn::ERROR;
  }

  // Size vectors
  hw_commands_velocity_.assign(NUM_MOTORS, 0.0);
  hw_states_velocity_.assign(NUM_MOTORS, 0.0);
  hw_states_position_.assign(NUM_MOTORS, 0.0);
  mock_actual_rpm_.assign(NUM_MOTORS, 0.0);

  return hardware_interface::CallbackReturn::SUCCESS;
}

// ──────────────────────────────────────────────────────────
// on_configure — nothing extra needed here
// ──────────────────────────────────────────────────────────
hardware_interface::CallbackReturn RoverDriveHardware::on_configure(
  const rclcpp_lifecycle::State & /*previous_state*/)
{
  return hardware_interface::CallbackReturn::SUCCESS;
}

// ──────────────────────────────────────────────────────────
// on_activate — open Modbus connection (or start mock)
// ──────────────────────────────────────────────────────────
hardware_interface::CallbackReturn RoverDriveHardware::on_activate(
  const rclcpp_lifecycle::State & /*previous_state*/)
{
  if (use_mock_) {
    RCLCPP_INFO(rclcpp::get_logger("RoverDriveHardware"),
      "Activated in MOCK mode — no hardware required");
    return hardware_interface::CallbackReturn::SUCCESS;
  }

#ifndef USE_MOCK_ONLY
  // Real hardware: open Modbus RTU connection
  modbus_ctx_ = modbus_new_rtu(serial_port_.c_str(), baud_rate_,
    'N',  // parity: none
    8,    // data bits
    1);   // stop bits

  if (modbus_ctx_ == nullptr) {
    RCLCPP_ERROR(rclcpp::get_logger("RoverDriveHardware"),
      "Failed to create Modbus RTU context: %s", modbus_strerror(errno));
    return hardware_interface::CallbackReturn::ERROR;
  }

  // Set response timeout: 100 ms
  modbus_set_response_timeout(modbus_ctx_, 0, 100000);

  if (modbus_connect(modbus_ctx_) == -1) {
    RCLCPP_ERROR(rclcpp::get_logger("RoverDriveHardware"),
      "Failed to connect to %s: %s", serial_port_.c_str(), modbus_strerror(errno));
    modbus_free(modbus_ctx_);
    modbus_ctx_ = nullptr;
    return hardware_interface::CallbackReturn::ERROR;
  }

  RCLCPP_INFO(rclcpp::get_logger("RoverDriveHardware"),
    "Connected to RS485 Modbus on %s at %d baud", serial_port_.c_str(), baud_rate_);
#endif

  return hardware_interface::CallbackReturn::SUCCESS;
}

// ──────────────────────────────────────────────────────────
// on_deactivate — stop motors, close connection
// ──────────────────────────────────────────────────────────
hardware_interface::CallbackReturn RoverDriveHardware::on_deactivate(
  const rclcpp_lifecycle::State & /*previous_state*/)
{
  stop_all_motors();

#ifndef USE_MOCK_ONLY
  if (!use_mock_ && modbus_ctx_ != nullptr) {
    modbus_close(modbus_ctx_);
    modbus_free(modbus_ctx_);
    modbus_ctx_ = nullptr;
    RCLCPP_INFO(rclcpp::get_logger("RoverDriveHardware"), "Modbus connection closed");
  }
#endif

  return hardware_interface::CallbackReturn::SUCCESS;
}

// ──────────────────────────────────────────────────────────
// export_state_interfaces
// ──────────────────────────────────────────────────────────
std::vector<hardware_interface::StateInterface>
RoverDriveHardware::export_state_interfaces()
{
  std::vector<hardware_interface::StateInterface> state_interfaces;
  for (int i = 0; i < NUM_MOTORS; ++i) {
    state_interfaces.emplace_back(
      info_.joints[i].name,
      hardware_interface::HW_IF_VELOCITY,
      &hw_states_velocity_[i]);
    state_interfaces.emplace_back(
      info_.joints[i].name,
      hardware_interface::HW_IF_POSITION,
      &hw_states_position_[i]);
  }
  return state_interfaces;
}

// ──────────────────────────────────────────────────────────
// export_command_interfaces
// ──────────────────────────────────────────────────────────
std::vector<hardware_interface::CommandInterface>
RoverDriveHardware::export_command_interfaces()
{
  std::vector<hardware_interface::CommandInterface> command_interfaces;
  for (int i = 0; i < NUM_MOTORS; ++i) {
    command_interfaces.emplace_back(
      info_.joints[i].name,
      hardware_interface::HW_IF_VELOCITY,
      &hw_commands_velocity_[i]);
  }
  return command_interfaces;
}

// ──────────────────────────────────────────────────────────
// read — get actual velocity from motors (or mock dynamics)
// ──────────────────────────────────────────────────────────
hardware_interface::return_type RoverDriveHardware::read(
  const rclcpp::Time & /*time*/, const rclcpp::Duration & period)
{
  for (int i = 0; i < NUM_MOTORS; ++i) {
    double actual_rpm = 0.0;

    if (use_mock_) {
      // First-order dynamics: alpha=0.2 → ~100 ms time constant at 50 Hz
      double target_rpm = rad_s_to_rpm(hw_commands_velocity_[i]);
      // Clamp target to motor limits
      target_rpm = std::max(-max_rpm_, std::min(max_rpm_, target_rpm));
      static constexpr double alpha = 0.2;
      mock_actual_rpm_[i] = mock_actual_rpm_[i] + alpha * (target_rpm - mock_actual_rpm_[i]);
      actual_rpm = mock_actual_rpm_[i];
    } else {
      if (!read_motor(i, actual_rpm)) {
        // On read failure, fall back to last known value
        actual_rpm = rad_s_to_rpm(hw_states_velocity_[i]);
      }
    }

    hw_states_velocity_[i] = rpm_to_rad_s(actual_rpm);
    // Integrate position
    hw_states_position_[i] += hw_states_velocity_[i] * period.seconds();
  }

  return hardware_interface::return_type::OK;
}

// ──────────────────────────────────────────────────────────
// write — send velocity commands to motors
// ──────────────────────────────────────────────────────────
hardware_interface::return_type RoverDriveHardware::write(
  const rclcpp::Time & /*time*/, const rclcpp::Duration & /*period*/)
{
  if (use_mock_) {
    // Mock mode: commands are consumed in read() via mock_actual_rpm_
    return hardware_interface::return_type::OK;
  }

  for (int i = 0; i < NUM_MOTORS; ++i) {
    double cmd_rpm = rad_s_to_rpm(hw_commands_velocity_[i]);
    // Clamp to motor limits
    cmd_rpm = std::max(-max_rpm_, std::min(max_rpm_, cmd_rpm));

    if (!write_motor(i, cmd_rpm)) {
      RCLCPP_WARN_THROTTLE(rclcpp::get_logger("RoverDriveHardware"),
        *rclcpp::Clock::make_shared(), 2000,
        "Failed to write motor %d (ID %d)", i, MOTOR_IDS[i]);
    }
  }

  return hardware_interface::return_type::OK;
}

// ──────────────────────────────────────────────────────────
// write_motor — send control word + speed to one BLD-3055
// ──────────────────────────────────────────────────────────
bool RoverDriveHardware::write_motor(int motor_index, double cmd_rpm)
{
#ifndef USE_MOCK_ONLY
  if (modbus_ctx_ == nullptr) { return false; }

  int motor_id = MOTOR_IDS[motor_index];
  modbus_set_slave(modbus_ctx_, motor_id);

  // Direction logic: right-side motors (IDs 4-6, index 3-5) are physically reversed
  bool reversed = MOTOR_REVERSED[motor_index];
  bool forward = (cmd_rpm >= 0.0) ^ reversed;

  // bit0 = run (1 = run, 0 = stop)
  // bit1 = direction (0 = forward, 1 = reverse)
  uint16_t ctrl_word = 0x0001 | (forward ? 0x0000 : 0x0002);
  uint16_t speed_reg = static_cast<uint16_t>(std::abs(cmd_rpm));

  uint16_t regs[2] = {ctrl_word, speed_reg};
  int rc = modbus_write_registers(modbus_ctx_, REG_CONTROL, 2, regs);
  return (rc == 2);
#else
  (void)motor_index; (void)cmd_rpm;
  return true;
#endif
}

// ──────────────────────────────────────────────────────────
// read_motor — read actual RPM from one BLD-3055
// ──────────────────────────────────────────────────────────
bool RoverDriveHardware::read_motor(int motor_index, double & out_rpm)
{
#ifndef USE_MOCK_ONLY
  if (modbus_ctx_ == nullptr) { return false; }

  int motor_id = MOTOR_IDS[motor_index];
  modbus_set_slave(modbus_ctx_, motor_id);

  uint16_t feedback = 0;
  int rc = modbus_read_registers(modbus_ctx_, REG_FEEDBACK, 1, &feedback);
  if (rc != 1) { return false; }

  // Convert raw feedback: right-side motors report positive RPM even when driving "backward"
  // Negate for reversed motors so velocity is in rover-forward convention
  double rpm = static_cast<double>(feedback);
  if (MOTOR_REVERSED[motor_index]) { rpm = -rpm; }
  out_rpm = rpm;
  return true;
#else
  (void)motor_index;
  out_rpm = 0.0;
  return true;
#endif
}

// ──────────────────────────────────────────────────────────
// stop_all_motors — write zero to all motors
// ──────────────────────────────────────────────────────────
void RoverDriveHardware::stop_all_motors()
{
  if (use_mock_) {
    mock_actual_rpm_.assign(NUM_MOTORS, 0.0);
    hw_commands_velocity_.assign(NUM_MOTORS, 0.0);
    return;
  }

#ifndef USE_MOCK_ONLY
  if (modbus_ctx_ == nullptr) { return; }
  for (int i = 0; i < NUM_MOTORS; ++i) {
    modbus_set_slave(modbus_ctx_, MOTOR_IDS[i]);
    // Control word: bit0=0 (stop), bit1=0 (forward)
    uint16_t regs[2] = {0x0000, 0x0000};
    modbus_write_registers(modbus_ctx_, REG_CONTROL, 2, regs);
  }
  RCLCPP_INFO(rclcpp::get_logger("RoverDriveHardware"), "All motors stopped");
#endif
}

}  // namespace rover_drive_hardware

#include "pluginlib/class_list_macros.hpp"
PLUGINLIB_EXPORT_CLASS(
  rover_drive_hardware::RoverDriveHardware, hardware_interface::SystemInterface)

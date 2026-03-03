#include "my_robot_hardware/arm_hardware_interface.hpp"

#include <string>

#include "hardware_interface/types/hardware_interface_type_values.hpp"
#include "pluginlib/class_list_macros.hpp"
#include "rclcpp/rclcpp.hpp"

namespace my_robot_hardware
{

// ---------------------------------------------------------------------------
// Lifecycle callbacks
// ---------------------------------------------------------------------------

hardware_interface::CallbackReturn ArmHardwareInterface::on_init(
  const hardware_interface::HardwareInfo & info)
{
  if (
    hardware_interface::SystemInterface::on_init(info) !=
    hardware_interface::CallbackReturn::SUCCESS)
  {
    return hardware_interface::CallbackReturn::ERROR;
  }

  // Read CAN interface name from hardware parameters (default: "can0")
  can_interface_ = "can0";
  if (info_.hardware_parameters.count("can_interface")) {
    can_interface_ = info_.hardware_parameters.at("can_interface");
  }

  const std::size_t n = info_.joints.size();
  can_ids_.resize(n, 0);
  hw_positions_.resize(n, 0.0);
  hw_velocities_.resize(n, 0.0);
  hw_commands_position_.resize(n, 0.0);
  hw_commands_velocity_.resize(n, 0.0);

  for (std::size_t i = 0; i < n; ++i) {
    if (!info_.joints[i].parameters.count("can_id")) {
      RCLCPP_ERROR(
        rclcpp::get_logger("ArmHardwareInterface"),
        "Joint '%s' is missing the 'can_id' parameter",
        info_.joints[i].name.c_str());
      return hardware_interface::CallbackReturn::ERROR;
    }
    can_ids_[i] = static_cast<uint8_t>(
      std::stoul(info_.joints[i].parameters.at("can_id")));
  }

  can_driver_ = std::make_unique<ArmCANDriver>();
  return hardware_interface::CallbackReturn::SUCCESS;
}

hardware_interface::CallbackReturn ArmHardwareInterface::on_configure(
  const rclcpp_lifecycle::State & /*previous_state*/)
{
  return hardware_interface::CallbackReturn::SUCCESS;
}

hardware_interface::CallbackReturn ArmHardwareInterface::on_activate(
  const rclcpp_lifecycle::State & /*previous_state*/)
{
  if (!can_driver_->open(can_interface_)) {
    RCLCPP_ERROR(
      rclcpp::get_logger("ArmHardwareInterface"),
      "Failed to open CAN interface '%s'", can_interface_.c_str());
    return hardware_interface::CallbackReturn::ERROR;
  }

  // Trigger an initial status poll so hw_positions_ is seeded before write().
  can_driver_->send_status_request();

  RCLCPP_INFO(
    rclcpp::get_logger("ArmHardwareInterface"),
    "CAN interface '%s' opened successfully", can_interface_.c_str());

  return hardware_interface::CallbackReturn::SUCCESS;
}

hardware_interface::CallbackReturn ArmHardwareInterface::on_deactivate(
  const rclcpp_lifecycle::State & /*previous_state*/)
{
  can_driver_->close();
  return hardware_interface::CallbackReturn::SUCCESS;
}

hardware_interface::CallbackReturn ArmHardwareInterface::on_cleanup(
  const rclcpp_lifecycle::State & /*previous_state*/)
{
  can_driver_.reset();
  return hardware_interface::CallbackReturn::SUCCESS;
}

// ---------------------------------------------------------------------------
// Interface export
// ---------------------------------------------------------------------------

std::vector<hardware_interface::StateInterface>
ArmHardwareInterface::export_state_interfaces()
{
  std::vector<hardware_interface::StateInterface> interfaces;
  interfaces.reserve(info_.joints.size() * 2);
  for (std::size_t i = 0; i < info_.joints.size(); ++i) {
    interfaces.emplace_back(
      info_.joints[i].name, hardware_interface::HW_IF_POSITION, &hw_positions_[i]);
    interfaces.emplace_back(
      info_.joints[i].name, hardware_interface::HW_IF_VELOCITY, &hw_velocities_[i]);
  }
  return interfaces;
}

std::vector<hardware_interface::CommandInterface>
ArmHardwareInterface::export_command_interfaces()
{
  std::vector<hardware_interface::CommandInterface> interfaces;
  interfaces.reserve(info_.joints.size() * 2);
  for (std::size_t i = 0; i < info_.joints.size(); ++i) {
    interfaces.emplace_back(
      info_.joints[i].name,
      hardware_interface::HW_IF_POSITION,
      &hw_commands_position_[i]);
    interfaces.emplace_back(
      info_.joints[i].name,
      hardware_interface::HW_IF_VELOCITY,
      &hw_commands_velocity_[i]);
  }
  return interfaces;
}

// ---------------------------------------------------------------------------
// Control loop
// ---------------------------------------------------------------------------

hardware_interface::return_type ArmHardwareInterface::read(
  const rclcpp::Time & /*time*/, const rclcpp::Duration & /*period*/)
{
  if (!can_driver_->is_open()) {
    return hardware_interface::return_type::ERROR;
  }

  // Drain up to 20 A4 status frames per cycle (3 motors → well within limit).
  for (int i = 0; i < 20; ++i) {
    uint8_t motor_id = 0;
    MotorFeedback fb;
    if (!can_driver_->recv_nonblocking(motor_id, fb)) {
      break;  // No more frames available (EAGAIN)
    }
    for (std::size_t j = 0; j < can_ids_.size(); ++j) {
      if (can_ids_[j] == motor_id) {
        hw_positions_[j] = fb.position_rad;
        hw_velocities_[j] = fb.velocity_rads;
        break;
      }
    }
  }

  return hardware_interface::return_type::OK;
}

hardware_interface::return_type ArmHardwareInterface::write(
  const rclcpp::Time & /*time*/, const rclcpp::Duration & /*period*/)
{
  if (!can_driver_->is_open()) {
    return hardware_interface::return_type::ERROR;
  }

  // Send position command to each motor.
  for (std::size_t i = 0; i < info_.joints.size(); ++i) {
    can_driver_->send_position_command(can_ids_[i], hw_commands_position_[i]);
  }

  // Periodically broadcast a status request (10 Hz at 100 Hz loop).
  if (++write_cycle_count_ >= STATUS_POLL_EVERY_N_CYCLES) {
    can_driver_->send_status_request();
    write_cycle_count_ = 0;
  }

  return hardware_interface::return_type::OK;
}

}  // namespace my_robot_hardware

PLUGINLIB_EXPORT_CLASS(
  my_robot_hardware::ArmHardwareInterface,
  hardware_interface::SystemInterface)

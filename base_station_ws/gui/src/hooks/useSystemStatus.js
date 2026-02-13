'use client';

import { useSystemStatusContext } from '@/context/SystemStatusContext';

/**
 * Hook to access system telemetry status.
 * Provides convenient access to individual subsystem statuses.
 *
 * @returns {Object} System status data
 */
export function useSystemStatus() {
  const { status } = useSystemStatusContext();

  return {
    // Full status object
    status,

    // Individual subsystems
    can: status.can,
    rs485: status.rs485,
    power: status.power,
    joystick: status.joystick,
    network: status.network,
    nodes: status.nodes,

    // Derived state
    isReceivingData: !!(
      status.can.lastUpdate ||
      status.rs485.lastUpdate ||
      status.power.lastUpdate
    ),
  };
}

export default useSystemStatus;

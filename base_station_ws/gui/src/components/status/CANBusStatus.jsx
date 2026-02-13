'use client';

import React from 'react';
import { SettingsInputHdmi as CANIcon } from '@mui/icons-material';
import StatusIndicator from './StatusIndicator';
import { useSystemStatus } from '@/hooks/useSystemStatus';

const CANBusStatus = () => {
  const { can } = useSystemStatus();

  return (
    <StatusIndicator
      label="CAN Bus"
      active={can.connected}
      stale={!can.lastUpdate}
      value={can.connected ? 'Online' : 'Offline'}
      icon={<CANIcon fontSize="small" />}
    />
  );
};

export default CANBusStatus;

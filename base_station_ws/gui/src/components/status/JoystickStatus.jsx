'use client';

import React from 'react';
import { SportsEsports as JoystickIcon } from '@mui/icons-material';
import StatusIndicator from './StatusIndicator';
import { useSystemStatus } from '@/hooks/useSystemStatus';

const JoystickStatus = () => {
  const { joystick } = useSystemStatus();

  return (
    <StatusIndicator
      label="Joystick"
      active={joystick.connected}
      stale={!joystick.lastUpdate}
      value={joystick.connected ? 'Connected' : 'No Signal'}
      icon={<JoystickIcon fontSize="small" />}
    />
  );
};

export default JoystickStatus;

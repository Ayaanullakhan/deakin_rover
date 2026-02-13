'use client';

import React from 'react';
import { Box } from '@mui/material';
import GlowCard from '@/components/common/GlowCard';
import CANBusStatus from './CANBusStatus';
import RS485Status from './RS485Status';
import PowerStatus from './PowerStatus';
import JoystickStatus from './JoystickStatus';

const SystemStatusCard = () => {
  return (
    <GlowCard title="System Status">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <CANBusStatus />
        <RS485Status />
        <PowerStatus />
        <JoystickStatus />
      </Box>
    </GlowCard>
  );
};

export default SystemStatusCard;

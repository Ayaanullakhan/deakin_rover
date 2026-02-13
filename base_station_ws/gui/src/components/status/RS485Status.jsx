'use client';

import React from 'react';
import { Cable as RS485Icon } from '@mui/icons-material';
import StatusIndicator from './StatusIndicator';
import { useSystemStatus } from '@/hooks/useSystemStatus';

const RS485Status = () => {
  const { rs485 } = useSystemStatus();

  return (
    <StatusIndicator
      label="RS485"
      active={rs485.connected}
      stale={!rs485.lastUpdate}
      value={rs485.connected ? 'Online' : 'Offline'}
      icon={<RS485Icon fontSize="small" />}
    />
  );
};

export default RS485Status;

'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  Wifi as WifiIcon,
  Speed as LatencyIcon,
  Router as IPIcon,
} from '@mui/icons-material';
import GlowCard from '@/components/common/GlowCard';
import StatusIndicator from './StatusIndicator';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useROSConnection } from '@/hooks/useROSConnection';

const NetworkStatusCard = () => {
  const { network } = useSystemStatus();
  const { isConnected, roverIP, roverPort } = useROSConnection();
  const stale = !network.lastUpdate;

  return (
    <GlowCard title="Network">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* ROS Connection */}
        <StatusIndicator
          label="ROS Bridge"
          active={isConnected}
          value={isConnected ? 'Connected' : 'Offline'}
          icon={<IPIcon fontSize="small" />}
        />

        {/* WiFi Status */}
        <StatusIndicator
          label="WiFi"
          active={!stale && network.signalStrength > 0}
          stale={stale}
          value={stale ? '--' : network.ssid || 'N/A'}
          icon={<WifiIcon fontSize="small" />}
        />

        {/* Latency */}
        <StatusIndicator
          label="Latency"
          active={!stale && network.latency < 100}
          stale={stale}
          value={stale ? '--' : `${network.latency}ms`}
          icon={<LatencyIcon fontSize="small" />}
        />

        {/* Rover Endpoint */}
        <Box
          sx={{
            mt: 1,
            py: 0.5,
            px: 1,
            borderRadius: 1,
            backgroundColor: 'background.default',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', fontFamily: 'monospace', fontSize: '0.7rem' }}
          >
            {roverIP}:{roverPort}
          </Typography>
        </Box>
      </Box>
    </GlowCard>
  );
};

export default NetworkStatusCard;

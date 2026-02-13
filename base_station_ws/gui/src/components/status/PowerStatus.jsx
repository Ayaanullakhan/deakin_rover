'use client';

import React from 'react';
import { BatteryChargingFull as BatteryIcon } from '@mui/icons-material';
import { Box, Typography, LinearProgress } from '@mui/material';
import { useSystemStatus } from '@/hooks/useSystemStatus';

const PowerStatus = () => {
  const { power } = useSystemStatus();
  const stale = !power.lastUpdate;
  const percentage = Math.round(power.percentage * 100);

  const getBatteryColor = () => {
    if (stale) return '#6a7a9a';
    if (percentage > 50) return '#00ff88';
    if (percentage > 20) return '#ffaa00';
    return '#ff0055';
  };

  const color = getBatteryColor();

  return (
    <Box
      sx={{
        py: 0.75,
        px: 1,
        borderRadius: 1,
        backgroundColor: 'background.default',
        border: '1px solid',
        borderColor: `${color}33`,
        transition: 'all 0.3s ease',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}, 0 0 12px ${color}66`,
            }}
          />
          <BatteryIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            Power
          </Typography>
        </Box>
        <Typography
          variant="body2"
          sx={{ color: stale ? 'text.disabled' : 'primary.main', fontWeight: 600 }}
        >
          {stale ? '--' : `${power.voltage.toFixed(1)}V`}
        </Typography>
      </Box>

      {/* Battery bar */}
      <LinearProgress
        variant="determinate"
        value={stale ? 0 : percentage}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: '#1a2045',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 3,
            boxShadow: `0 0 8px ${color}88`,
          },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
          {stale ? '--' : `${power.current.toFixed(1)}A`}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
          {stale ? '--%' : `${percentage}%`}
        </Typography>
      </Box>
    </Box>
  );
};

export default PowerStatus;

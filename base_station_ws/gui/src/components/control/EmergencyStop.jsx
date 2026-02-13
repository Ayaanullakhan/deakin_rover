'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useROSConnection } from '@/hooks/useROSConnection';
import { publishMessage } from '@/lib/ros/topicSubscriber';

const EmergencyStop = () => {
  const { ros, isConnected } = useROSConnection();
  const [activated, setActivated] = useState(false);

  const handleEmergencyStop = useCallback(() => {
    if (!ros || !isConnected) return;

    // Publish emergency stop to a standard topic
    publishMessage(ros, '/emergency_stop', 'std_msgs/msg/Bool', { data: true });
    setActivated(true);

    // Reset visual state after 3 seconds
    setTimeout(() => setActivated(false), 3000);
  }, [ros, isConnected]);

  // Keyboard shortcut: Space bar for emergency stop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleEmergencyStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEmergencyStop]);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: activated ? '#ff005533' : '#1a0010',
        border: '2px solid',
        borderColor: '#ff0055',
        boxShadow: activated
          ? '0 0 40px #ff005588, inset 0 0 40px #ff005544'
          : '0 0 20px #ff005544',
        transition: 'all 0.2s ease',
      }}
    >
      <Button
        variant="contained"
        fullWidth
        onClick={handleEmergencyStop}
        disabled={!isConnected}
        startIcon={<WarningIcon />}
        sx={{
          py: 2,
          backgroundColor: '#ff0055',
          color: '#fff',
          fontSize: '1.1rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          border: '2px solid #ff0055',
          boxShadow: '0 0 20px #ff005566',
          '&:hover': {
            backgroundColor: '#cc0044',
            boxShadow: '0 0 30px #ff005588',
            transform: 'scale(1.02)',
          },
          '&:active': {
            transform: 'scale(0.98)',
            backgroundColor: '#ff0055',
          },
          '&.Mui-disabled': {
            backgroundColor: '#330015',
            borderColor: '#660033',
            color: '#6a7a9a',
          },
        }}
      >
        EMERGENCY STOP
      </Button>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          textAlign: 'center',
          mt: 1,
          color: 'text.disabled',
          fontSize: '0.7rem',
        }}
      >
        Press SPACE for quick stop
      </Typography>
    </Box>
  );
};

export default EmergencyStop;

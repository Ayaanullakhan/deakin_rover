'use client';

import React from 'react';
import { AppBar, Toolbar, Typography, Box, Chip } from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';
import { useROSConnection } from '@/hooks/useROSConnection';

/**
 * Header component with title and connection status
 */
const Header = () => {
  const { isConnected, isConnecting, roverIP } = useROSConnection();

  const getConnectionStatus = () => {
    if (isConnecting) {
      return {
        label: 'Connecting...',
        color: 'warning',
        pulse: true,
      };
    }
    if (isConnected) {
      return {
        label: `Connected to ${roverIP}`,
        color: 'success',
        pulse: true,
      };
    }
    return {
      label: 'Disconnected',
      color: 'error',
      pulse: false,
    };
  };

  const status = getConnectionStatus();

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'background.secondary',
        boxShadow: '0 2px 20px rgba(0, 217, 255, 0.3)',
        borderBottom: '1px solid',
        borderColor: 'primary.main',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            color: 'primary.main',
            textShadow: '0 0 10px rgba(0, 217, 255, 0.5)',
            letterSpacing: '0.1em',
          }}
        >
          DEAKIN ROVER MISSION CONTROL
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={
              <CircleIcon
                sx={{
                  fontSize: '12px !important',
                  animation: status.pulse ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': {
                      opacity: 1,
                    },
                    '50%': {
                      opacity: 0.5,
                    },
                  },
                }}
              />
            }
            label={status.label}
            color={status.color}
            variant="outlined"
            sx={{
              fontWeight: 600,
              px: 2,
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

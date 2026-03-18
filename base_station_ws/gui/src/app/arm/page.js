'use client';

import { Box, Typography } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import ConnectionManager from '@/components/control/ConnectionManager';
import EmergencyStop from '@/components/control/EmergencyStop';
import ArmModeIndicator from '@/components/arm/ArmModeIndicator';
import MotorStatusPanel from '@/components/arm/MotorStatusPanel';
import { useArmGamepad } from '@/hooks/useArmGamepad';
import { useROSConnection } from '@/hooks/useROSConnection';

function ArmControlPanel() {
  const { isConnected } = useROSConnection();
  const { connected, gamepadName } = useArmGamepad();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <ConnectionManager />

      {isConnected && (
        <>
          <EmergencyStop />
          <ArmModeIndicator />
          <MotorStatusPanel />

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              background: connected ? '#1b3a1b' : '#2a2a2a',
              border: '1px solid',
              borderColor: connected ? 'success.dark' : 'divider',
              fontSize: 12,
              fontFamily: 'monospace',
              color: connected ? 'success.light' : 'text.disabled',
              userSelect: 'none',
            }}
          >
            {connected
              ? `Gamepad: ${gamepadName ?? 'connected'} — publishing /joy`
              : 'No gamepad detected — connect a controller to control the arm'}
          </Box>
        </>
      )}
    </Box>
  );
}

function ArmStatusArea() {
  const { isConnected } = useROSConnection();

  if (!isConnected) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'text.disabled',
        }}
      >
        <Typography variant="h6">Connect to rover to see arm status</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ color: 'primary.main', mb: 2 }}>
        Arm Control — Laptop B
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
        This page publishes joystick input directly to <code>/joy</code> →{' '}
        <code>motor_node</code> on the rover.
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Laptop A (Drive) connects at <code>/</code>. Both share rosbridge port 9090.
      </Typography>
    </Box>
  );
}

export default function ArmPage() {
  return (
    <MainLayout
      cameraPanel={<ArmStatusArea />}
      controlPanel={<ArmControlPanel />}
    />
  );
}

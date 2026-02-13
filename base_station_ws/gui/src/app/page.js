'use client';

import MainLayout from '@/components/layout/MainLayout';
import ConnectionManager from '@/components/control/ConnectionManager';
import ROSNodeController from '@/components/control/ROSNodeController';
import EmergencyStop from '@/components/control/EmergencyStop';
import SystemStatusCard from '@/components/status/SystemStatusCard';
import NetworkStatusCard from '@/components/status/NetworkStatusCard';
import ROSNodesCard from '@/components/status/ROSNodesCard';
import CameraFeedPanel from '@/components/camera/CameraFeedPanel';
import { Box } from '@mui/material';

export default function Home() {
  // Status Panel (left column)
  const statusPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <SystemStatusCard />
      <NetworkStatusCard />
      <ROSNodesCard />
    </Box>
  );

  // Camera Panel (center column)
  const cameraPanel = <CameraFeedPanel />;

  // Control Panel (right column)
  const controlPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <ConnectionManager />
      <ROSNodeController />
      <EmergencyStop />
    </Box>
  );

  return (
    <MainLayout
      statusPanel={statusPanel}
      cameraPanel={cameraPanel}
      controlPanel={controlPanel}
    />
  );
}

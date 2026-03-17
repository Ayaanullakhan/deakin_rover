'use client';

import MainLayout from '@/components/layout/MainLayout';
import ConnectionManager from '@/components/control/ConnectionManager';
import CameraFeedPanel from '@/components/camera/CameraFeedPanel';
import { useGamepad } from '@/hooks/useGamepad';
import { useROSConnection } from '@/hooks/useROSConnection';

function GamepadIndicator() {
  const { isConnected } = useROSConnection();
  const { connected, gamepadName } = useGamepad();

  if (!isConnected) return null;

  return (
    <div
      title={gamepadName ?? 'No gamepad detected'}
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontFamily: 'monospace',
        background: connected ? '#1b5e20' : '#37474f',
        color: '#fff',
        zIndex: 1000,
        userSelect: 'none',
      }}
    >
      {connected ? `Gamepad: ${gamepadName ?? 'connected'}` : 'No gamepad'}
    </div>
  );
}

export default function Home() {
  const cameraPanel = <CameraFeedPanel />;
  const controlPanel = <ConnectionManager />;

  return (
    <>
      <MainLayout
        cameraPanel={cameraPanel}
        controlPanel={controlPanel}
      />
      <GamepadIndicator />
    </>
  );
}

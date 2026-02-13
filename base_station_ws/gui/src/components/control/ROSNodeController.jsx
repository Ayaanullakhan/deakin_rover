'use client';

import React, { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';
import {
  PlayArrow as StartAllIcon,
  Stop as StopAllIcon,
} from '@mui/icons-material';
import GlowCard from '@/components/common/GlowCard';
import NodeLauncher from './NodeLauncher';
import { useROSNode } from '@/hooks/useROSNode';
import { useROSConnection } from '@/hooks/useROSConnection';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { DEFAULT_NODES } from '@/lib/utils/constants';

const ROSNodeController = () => {
  const { isConnected } = useROSConnection();
  const { launchNode, stopNode } = useROSNode();
  const { nodes: activeNodes } = useSystemStatus();

  // Build a map of node statuses from the active nodes list
  const nodeStatusMap = useMemo(() => {
    const map = {};
    if (Array.isArray(activeNodes)) {
      activeNodes.forEach((n) => {
        if (n.id || n.name) {
          map[n.id || n.name] = n.status || 'running';
        }
      });
    }
    return map;
  }, [activeNodes]);

  const handleStartAll = async () => {
    for (const node of DEFAULT_NODES) {
      if (nodeStatusMap[node.id] !== 'running') {
        await launchNode(node.id, node.package, node.executable);
      }
    }
  };

  const handleStopAll = async () => {
    for (const node of DEFAULT_NODES) {
      if (nodeStatusMap[node.id] === 'running') {
        await stopNode(node.id);
      }
    }
  };

  return (
    <GlowCard title="ROS Node Control">
      {!isConnected ? (
        <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}>
          Connect to rover first
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Node list */}
          {DEFAULT_NODES.map((node) => (
            <NodeLauncher
              key={node.id}
              node={node}
              status={nodeStatusMap[node.id] || 'unknown'}
            />
          ))}

          {/* Start/Stop All buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<StartAllIcon />}
              onClick={handleStartAll}
              sx={{
                flex: 1,
                color: '#00ff88',
                borderColor: '#00ff8866',
                '&:hover': { backgroundColor: '#00ff8822', borderColor: '#00ff88' },
              }}
            >
              Start All
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<StopAllIcon />}
              onClick={handleStopAll}
              sx={{
                flex: 1,
                color: '#ff0055',
                borderColor: '#ff005566',
                '&:hover': { backgroundColor: '#ff005522', borderColor: '#ff0055' },
              }}
            >
              Stop All
            </Button>
          </Box>
        </Box>
      )}
    </GlowCard>
  );
};

export default ROSNodeController;

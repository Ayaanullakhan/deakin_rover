'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { AccountTree as NodeIcon } from '@mui/icons-material';
import GlowCard from '@/components/common/GlowCard';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useROSConnection } from '@/hooks/useROSConnection';

const ROSNodesCard = () => {
  const { nodes } = useSystemStatus();
  const { isConnected } = useROSConnection();

  return (
    <GlowCard title="Active Nodes">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {!isConnected ? (
          <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}>
            Not connected
          </Typography>
        ) : nodes.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}>
            Waiting for node data...
          </Typography>
        ) : (
          nodes.map((node, index) => (
            <Box
              key={node.name || index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                backgroundColor: 'background.default',
                border: '1px solid',
                borderColor: node.status === 'running' ? '#00ff8833' : '#ff005533',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NodeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {node.name || `Node ${index}`}
                </Typography>
              </Box>
              <Chip
                label={node.status || 'unknown'}
                size="small"
                color={node.status === 'running' ? 'success' : 'error'}
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Box>
          ))
        )}
      </Box>
    </GlowCard>
  );
};

export default ROSNodesCard;

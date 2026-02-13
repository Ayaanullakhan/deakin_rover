'use client';

import React from 'react';
import { Box, Typography, IconButton, CircularProgress, Tooltip } from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { useROSNode } from '@/hooks/useROSNode';

/**
 * Individual node launcher with start/stop buttons.
 *
 * @param {Object} props
 * @param {Object} props.node - Node configuration { id, name, package, executable }
 * @param {string} props.status - Current node status ('running', 'stopped', 'unknown')
 */
const NodeLauncher = ({ node, status = 'unknown' }) => {
  const { launchNode, stopNode, isLoading, getError } = useROSNode();
  const loading = isLoading(node.id);
  const error = getError(node.id);
  const isRunning = status === 'running';

  const handleStart = () => {
    launchNode(node.id, node.package, node.executable);
  };

  const handleStop = () => {
    stopNode(node.id);
  };

  const statusColor = isRunning ? '#00ff88' : status === 'stopped' ? '#ff0055' : '#6a7a9a';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.5,
        px: 1,
        borderRadius: 1,
        backgroundColor: 'background.default',
        border: '1px solid',
        borderColor: `${statusColor}33`,
        transition: 'all 0.3s ease',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: `0 0 4px ${statusColor}`,
            flexShrink: 0,
          }}
        />
        <Tooltip title={error || ''} placement="top">
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              color: error ? 'error.main' : 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {node.name}
          </Typography>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {loading ? (
          <CircularProgress size={20} sx={{ color: 'primary.main' }} />
        ) : (
          <>
            <IconButton
              size="small"
              onClick={handleStart}
              disabled={isRunning}
              sx={{
                color: '#00ff88',
                p: 0.5,
                '&:hover': { backgroundColor: '#00ff8822' },
                '&.Mui-disabled': { color: '#6a7a9a' },
              }}
            >
              <StartIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleStop}
              disabled={!isRunning}
              sx={{
                color: '#ff0055',
                p: 0.5,
                '&:hover': { backgroundColor: '#ff005522' },
                '&.Mui-disabled': { color: '#6a7a9a' },
              }}
            >
              <StopIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </>
        )}
      </Box>
    </Box>
  );
};

export default NodeLauncher;

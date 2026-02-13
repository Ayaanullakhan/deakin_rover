'use client';

import React, { useState, useCallback } from 'react';
import { Box, Typography, Slider, Divider, TextField } from '@mui/material';
import {
  Videocam as CameraIcon,
} from '@mui/icons-material';
import GlowCard from '@/components/common/GlowCard';
import MultiCameraViewer from './MultiCameraViewer';
import { useROSConnection } from '@/hooks/useROSConnection';
import { DEFAULT_CAMERAS, STREAM_DEFAULTS } from '@/lib/utils/constants';

/**
 * Main camera panel. Contains the 2x2 camera grid, stream quality controls,
 * and video server port configuration.
 */
const CameraFeedPanel = () => {
  const { isConnected, videoPort, updateVideoPort } = useROSConnection();

  // Per-slot camera assignments (initialize from defaults)
  const [cameras, setCameras] = useState(() =>
    DEFAULT_CAMERAS.map((cam) => ({ topic: cam.topic, label: cam.label }))
  );

  // Stream quality settings
  const [quality, setQuality] = useState(STREAM_DEFAULTS.quality);

  const handleCameraChange = useCallback((index, newTopic) => {
    // Find the label for the selected topic
    const match = DEFAULT_CAMERAS.find((c) => c.topic === newTopic);
    setCameras((prev) => {
      const next = [...prev];
      next[index] = { topic: newTopic, label: match ? match.label : newTopic || 'Empty' };
      return next;
    });
  }, []);

  const handleVideoPortChange = (e) => {
    updateVideoPort(e.target.value);
  };

  const streamOptions = { quality };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      {/* Camera Grid */}
      <GlowCard
        title="Camera Feeds"
        sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {!isConnected ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              opacity: 0.5,
            }}
          >
            <CameraIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              Connect to rover to view camera feeds
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1 }}>
            <MultiCameraViewer
              cameras={cameras}
              onCameraChange={handleCameraChange}
              streamOptions={streamOptions}
            />
          </Box>
        )}
      </GlowCard>

      {/* Stream Controls */}
      <GlowCard title="Stream Settings">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Video server port */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', minWidth: 90 }}>
              Video Port
            </Typography>
            <TextField
              value={videoPort}
              onChange={handleVideoPortChange}
              size="small"
              type="number"
              inputProps={{ min: 1, max: 65535 }}
              sx={{ width: 100 }}
            />
          </Box>

          <Divider sx={{ borderColor: 'primary.main', opacity: 0.15 }} />

          {/* Quality slider */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                JPEG Quality
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                {quality}%
              </Typography>
            </Box>
            <Slider
              value={quality}
              onChange={(_, v) => setQuality(v)}
              min={10}
              max={100}
              step={5}
              size="small"
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  boxShadow: '0 0 8px #00d9ff88',
                },
                '& .MuiSlider-track': {
                  boxShadow: '0 0 6px #00d9ff66',
                },
              }}
            />
          </Box>
        </Box>
      </GlowCard>
    </Box>
  );
};

export default CameraFeedPanel;

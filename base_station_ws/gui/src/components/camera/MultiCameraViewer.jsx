'use client';

import React from 'react';
import { Box, Grid } from '@mui/material';
import CameraStream from './CameraStream';
import CameraSelector from './CameraSelector';

/**
 * 2x2 grid of camera feeds with per-cell topic selection.
 *
 * @param {Object} props
 * @param {Array<{ topic: string, label: string }>} props.cameras - Array of 4 camera configs
 * @param {Function} props.onCameraChange - Called with (index, newTopic) when user changes a camera
 * @param {Object} [props.streamOptions] - Shared quality/resolution options
 */
const MultiCameraViewer = ({ cameras, onCameraChange, streamOptions = {} }) => {
  return (
    <Grid container spacing={1} sx={{ height: '100%' }}>
      {cameras.map((cam, index) => (
        <Grid item xs={6} key={index}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, height: '100%' }}>
            {/* Camera selector dropdown */}
            <CameraSelector
              value={cam.topic}
              onChange={(newTopic) => onCameraChange(index, newTopic)}
              label={`Slot ${index + 1}`}
            />

            {/* Camera feed */}
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <CameraStream
                topic={cam.topic}
                label={cam.label}
                streamOptions={streamOptions}
              />
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default MultiCameraViewer;

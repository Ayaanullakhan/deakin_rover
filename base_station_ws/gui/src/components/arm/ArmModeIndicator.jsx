'use client';

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useROSTopic } from '@/hooks/useROSTopic';
import { TOPICS, MSG_TYPES } from '@/lib/utils/constants';

/**
 * ArmModeIndicator — shows current arm control mode (FK / IK).
 *
 * Subscribes to /arm/mode (std_msgs/String).
 * FK = speed control, IK = position control.
 */
const ArmModeIndicator = () => {
  const { message } = useROSTopic(TOPICS.ARM_MODE, MSG_TYPES.STRING);

  const mode = message?.data ?? null;
  const isIK = mode === 'IK';
  const label = isIK ? 'IK Position Control' : mode === 'FK' ? 'FK Speed Control' : 'Waiting...';
  const color = isIK ? 'primary' : mode === 'FK' ? 'success' : 'default';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Arm Mode:
        </Typography>
        <Chip label={label} color={color} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
      </Box>
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Hold L1 + L2 simultaneously to toggle FK ↔ IK mode
      </Typography>
    </Box>
  );
};

export default ArmModeIndicator;

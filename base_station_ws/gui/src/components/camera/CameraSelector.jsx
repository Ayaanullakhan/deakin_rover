'use client';

import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DEFAULT_CAMERAS } from '@/lib/utils/constants';

/**
 * Dropdown to select which camera topic to display in a grid cell.
 *
 * @param {Object} props
 * @param {string} props.value - Currently selected camera topic
 * @param {Function} props.onChange - Called with new topic string
 * @param {string} [props.label] - Dropdown label
 * @param {Array} [props.cameras] - Available cameras (defaults to DEFAULT_CAMERAS)
 */
const CameraSelector = ({ value, onChange, label = 'Camera', cameras = DEFAULT_CAMERAS }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <FormControl size="small" fullWidth>
      <InputLabel sx={{ fontSize: '0.8rem' }}>{label}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        label={label}
        sx={{ fontSize: '0.8rem' }}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {cameras.map((cam) => (
          <MenuItem key={cam.id} value={cam.topic} sx={{ fontSize: '0.8rem' }}>
            {cam.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default CameraSelector;

'use client';

import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useROSTopic } from '@/hooks/useROSTopic';
import { TOPICS, MSG_TYPES } from '@/lib/utils/constants';

/**
 * MotorStatusPanel — displays live feedback from arm motors.
 *
 * Subscribes to /motor_stat_1 (id, angle, speed, current, temp) and
 * /motor_stat_2 (id, busv, busc, mode, fault).
 */
const MotorStatusPanel = () => {
  const { message: stat1 } = useROSTopic(TOPICS.MOTOR_STAT1, MSG_TYPES.MOTOR_STAT1);
  const { message: stat2 } = useROSTopic(TOPICS.MOTOR_STAT2, MSG_TYPES.MOTOR_STAT2);

  const stat1Data = stat1 ? [stat1] : [];
  const stat2Data = stat2 ? [stat2] : [];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
        Motor Status
      </Typography>

      <TableContainer component={Paper} sx={{ backgroundColor: 'background.paper', mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Motor</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Angle (°)</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Speed (RPM)</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Current (A)</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Temp (°C)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stat1Data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'text.disabled' }}>
                  No data — waiting for /motor_stat_1
                </TableCell>
              </TableRow>
            ) : (
              stat1Data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell>{Number(s.angle).toFixed(2)}</TableCell>
                  <TableCell>{Number(s.speed).toFixed(1)}</TableCell>
                  <TableCell>{Number(s.current).toFixed(2)}</TableCell>
                  <TableCell>{s.temp}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer component={Paper} sx={{ backgroundColor: 'background.paper' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Motor</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Bus V</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Bus A</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Mode</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Fault</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stat2Data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'text.disabled' }}>
                  No data — waiting for /motor_stat_2
                </TableCell>
              </TableRow>
            ) : (
              stat2Data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell>{Number(s.busv).toFixed(1)}</TableCell>
                  <TableCell>{Number(s.busc).toFixed(2)}</TableCell>
                  <TableCell>{s.mode}</TableCell>
                  <TableCell sx={{ color: s.fault && s.fault !== 'none' ? 'error.main' : 'text.primary' }}>
                    {s.fault || '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MotorStatusPanel;

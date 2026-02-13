'use client';

import { useState, useCallback } from 'react';
import { useROSConnection } from './useROSConnection';
import { callService } from '@/lib/ros/serviceClient';
import { SERVICES, SRV_TYPES } from '@/lib/utils/constants';

/**
 * Hook for controlling ROS nodes (launch/stop).
 *
 * @returns {Object} Node control methods and state
 */
export function useROSNode() {
  const { ros, isConnected } = useROSConnection();
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const launchNode = useCallback(
    async (nodeId, packageName, executable) => {
      if (!ros || !isConnected) {
        setErrors((prev) => ({ ...prev, [nodeId]: 'Not connected to rover' }));
        return false;
      }

      setLoading((prev) => ({ ...prev, [nodeId]: true }));
      setErrors((prev) => ({ ...prev, [nodeId]: null }));

      try {
        const result = await callService(ros, SERVICES.LAUNCH_NODE, SRV_TYPES.NODE_CONTROL, {
          data: JSON.stringify({ node_id: nodeId, package: packageName, executable }),
        });
        setLoading((prev) => ({ ...prev, [nodeId]: false }));
        return result.success !== false;
      } catch (error) {
        setErrors((prev) => ({ ...prev, [nodeId]: error.message }));
        setLoading((prev) => ({ ...prev, [nodeId]: false }));
        return false;
      }
    },
    [ros, isConnected]
  );

  const stopNode = useCallback(
    async (nodeId) => {
      if (!ros || !isConnected) {
        setErrors((prev) => ({ ...prev, [nodeId]: 'Not connected to rover' }));
        return false;
      }

      setLoading((prev) => ({ ...prev, [nodeId]: true }));
      setErrors((prev) => ({ ...prev, [nodeId]: null }));

      try {
        const result = await callService(ros, SERVICES.STOP_NODE, SRV_TYPES.NODE_CONTROL, {
          data: JSON.stringify({ node_id: nodeId }),
        });
        setLoading((prev) => ({ ...prev, [nodeId]: false }));
        return result.success !== false;
      } catch (error) {
        setErrors((prev) => ({ ...prev, [nodeId]: error.message }));
        setLoading((prev) => ({ ...prev, [nodeId]: false }));
        return false;
      }
    },
    [ros, isConnected]
  );

  const isLoading = useCallback((nodeId) => !!loading[nodeId], [loading]);
  const getError = useCallback((nodeId) => errors[nodeId] || null, [errors]);

  return { launchNode, stopNode, isLoading, getError };
}

export default useROSNode;

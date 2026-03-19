'use client';

import { useEffect, useRef } from 'react';
import { Topic } from 'roslib';
import { useROSConnection } from './useROSConnection';
import { TOPICS, MSG_TYPES } from '@/lib/utils/constants';

const HEARTBEAT_INTERVAL_MS = 2000;

export function useEstopHeartbeat() {
  const { ros, isConnected } = useROSConnection();
  const topicRef = useRef(null);

  // Create/destroy Topic when connection changes
  useEffect(() => {
    if (isConnected && ros) {
      topicRef.current = new Topic({
        ros,
        name: TOPICS.EMERGENCY_STOP,
        messageType: MSG_TYPES.BOOL,
      });
    } else {
      topicRef.current = null;
    }
  }, [ros, isConnected]);

  // Publish heartbeat every 2s while connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      topicRef.current?.publish({ data: false });
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isConnected]);
}

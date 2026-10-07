import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = (roomType, roomId, onEvent) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    // Initialize Socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Join the requested room
      if (roomType === 'business') {
        socket.emit('join_business', roomId);
      } else if (roomType === 'queue') {
        socket.emit('join_queue', roomId);
      }
    });

    if (onEvent) {
      socket.on('queue_updated', (data) => onEvent('queue_updated', data));
      socket.on('customer_status_changed', (data) => onEvent('customer_status_changed', data));
      socket.on('service_time_adjusted', (data) => onEvent('service_time_adjusted', data));
    }

    return () => {
      socket.disconnect();
    };
  }, [roomType, roomId]);

  return socketRef.current;
};

export default useSocket;

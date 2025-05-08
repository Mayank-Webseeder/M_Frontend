import { useEffect } from 'react';
import { useSocket } from '../socket';

export const useSocketEvents = (eventHandlers = {}) => {
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) {
      console.log("Socket not connected, skipping event setup");
      return;
    }

    console.log("Setting up socket event listeners");
    
    // Add all event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      console.log(`Adding listener for event: ${event}`);
      socket.on(event, handler);
    });

    // Remove event listeners on cleanup
    return () => {
      if (socket) {
        Object.keys(eventHandlers).forEach(event => {
          console.log(`Removing listener for event: ${event}`);
          socket.off(event);
        });
      }
    };
  }, [socket, connected, eventHandlers]);

  return { socket, connected };
};
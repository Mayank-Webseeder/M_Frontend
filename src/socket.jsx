import { createContext, useEffect, useState, useContext } from "react";
import io from "socket.io-client";

const server = import.meta.env.VITE_BASE_URL;
const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, skipping socket connection");
      return;
    }
    
    console.log("Socket connecting to:", server);
    const socketInstance = io(server, {
      withCredentials: true,
      auth: {
        token: token
      }
    });
    
    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      setConnected(true);
    });
    
    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setConnected(false);
    });
    
    setSocket(socketInstance);
    
    return () => {
      console.log("Disconnecting socket");
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);
  
  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

// For backward compatibility - but not recommended
export const getSocket = () => {
  return useContext(SocketContext);
};
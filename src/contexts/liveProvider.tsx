import { io, Socket } from "socket.io-client";

// Keep track of socket instance
let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Get or initialize a socket.io connection
 * @returns Socket instance or null if initialization fails
 */
function getSocket() {
  if (!socket) {
    const token = localStorage.getItem("access_token");
    
    if (!token) {
      console.error("No access token found in localStorage");
      return null;
    }
    
    // Initialize socket with improved configuration
    socket = io("wss://alfacrm.kg", {
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      timeout: 8000, // Increased timeout
      query: { token },
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      forceNew: true, // Force a new connection
      rejectUnauthorized: false, // For development only - don't use in production
      extraHeaders: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    // Connection error handler
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      console.error("Error details:", error.message);
      reconnectAttempts++;
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error("Maximum reconnection attempts reached");
        // Optional: Implement fallback strategy here
      }
    });
    
    // Successful connection handler
    socket.on("connect", () => {
      console.log("Socket connected successfully");
      reconnectAttempts = 0;
    });
    
    // General error handler
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
    
    // Disconnection handler
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      
      // if (reason === "io server disconnect") {
      //   // The server has forcefully disconnected the socket
      //   socket.connect(); // Manually reconnect
      // }
    });
  }
  
  return socket;
}

/**
 * Live data provider with improved error handling
 */
export const liveProvider = {
  /**
   * Subscribe to a channel
   * @param {Object} params - Subscription parameters
   * @returns Subscription object with unsubscribe method
   */
  subscribe: ({ channel, types, callback, meta }: any) => {
    const socket = getSocket();
    
    if (!socket) {
      console.error("Cannot subscribe: Socket not initialized");
      return { 
        unsubscribe: () => {
          console.log("No active subscription to unsubscribe from");
        } 
      };
    }
    
    // Try subscribing with channel information
    try {
      socket.emit("message", { channel, types, meta });
      
      // Set up channel listener
      socket.on(channel, (data: any) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in subscription callback:", error);
        }
      });
      
      return {
        unsubscribe: () => {
          try {
            socket.emit("unsubscribe", { channel });
            socket.off(channel);
            console.log(`Unsubscribed from channel: ${channel}`);
          } catch (error) {
            console.error(`Error unsubscribing from channel ${channel}:`, error);
          }
        },
      };
    } catch (error) {
      console.error(`Error subscribing to channel ${channel}:`, error);
      return { unsubscribe: () => {} };
    }
  },
  
  /**
   * Unsubscribe from a channel
   * @param {Object} subscription - Subscription object to unsubscribe
   */
  unsubscribe: (subscription: any) => {
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
    } else {
      console.warn("Invalid subscription object provided to unsubscribe");
    }
  },
  
  /**
   * Publish a message to a channel
   * @param {Object} params - Publish parameters
   */
  publish: ({ channel, type, payload, date, meta }: any) => {
    const socket = getSocket();
    
    if (!socket) {
      console.error("Cannot publish: Socket not initialized");
      return;
    }
    
    try {
      socket.emit("message", { channel, type, payload, date, meta });
      
      // Set up success handler
      socket.once("publish_success", (response: any) => {
        console.log("Published successfully to channel:", channel, response);
      });
      
      // Set up error handler
      socket.once("publish_error", (error: any) => {
        console.error("Error publishing to channel:", channel, error);
      });
    } catch (error) {
      console.error(`Error publishing to channel ${channel}:`, error);
    }
  },
  
  /**
   * Disconnect the socket completely
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.log("Socket disconnected and reset");
    }
  },
  
  /**
   * Check if socket is currently connected
   * @returns {boolean} Connection status
   */
  isConnected: () => {
    return socket ? socket.connected : false;
  },
  
  /**
   * Get the raw socket instance (for advanced use cases)
   * @returns {Socket|null} Socket instance
   */
  getRawSocket: () => {
    return socket;
  }
};
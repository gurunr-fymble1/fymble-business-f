import React, { createContext, useContext, useEffect, useRef } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { useFocusEffect } from "@react-navigation/native";
import apiConfig from "../services/apiConfig";

const WSContext = createContext(null);

export const WebSocketProvider = ({ gymId, children, url1, url2 }) => {
  const listeners = useRef(new Set());
  const wsRef = useRef(null);
  const pingIntervalRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      if (!gymId) return;

      const url = `wss://${
        apiConfig.API_URL?.split("//")[1]
      }/${url1}/ws/${url2}/${gymId}`;
      const ws = new ReconnectingWebSocket(url, [], {
        maxRetries: 5, // Reduced from 999 to prevent infinite reconnections
        reconnectInterval: 3000, // Increased from 1500ms
        maxReconnectionDelay: 10000,
        connectionTimeout: 5000,
      });
      wsRef.current = ws;

      ws.addEventListener("message", (e) => {
        try {
          const payload = JSON.parse(e.data);
          listeners.current.forEach((fn) => fn(payload));
        } catch (err) {
          // Silently handle parse errors
        }
      });

      // Keep-alive ping with proper cleanup
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.send("{}");
        }
      }, 30000); // Increased from 20000ms to reduce network load

      return () => {
        // Proper cleanup to prevent memory leaks
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        // Clear all listeners on unmount
        listeners.current.clear();
      };
    }, [gymId, url1, url2])
  );

  const add = (fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  };

  return <WSContext.Provider value={{ add }}>{children}</WSContext.Provider>;
};

export const useWS = () => {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error("WebSocketProvider missing");
  return ctx;
};

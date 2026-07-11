"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { connectWebSocket, disconnectWebSocket, joinDocRoom, leaveDocRoom, joinSectionRoom, leaveSectionRoom, joinClauseRoom, leaveClauseRoom, joinUserRoom, leaveUserRoom, onWebSocketEvent, offWebSocketEvent, WebSocketEvent } from '@/utils/websocket';

interface WebSocketContextType {
  isConnected: boolean;
  joinDoc: (docId: string) => void;
  leaveDoc: (docId: string) => void;
  joinSection: (sectionId: string) => void;
  leaveSection: (sectionId: string) => void;
  joinClause: (clauseId: string) => void;
  leaveClause: (clauseId: string) => void;
  joinUser: (address: string) => void;
  leaveUser: (address: string) => void;
  onEvent: (callback: (data: WebSocketEvent) => void) => void;
  offEvent: (callback: (data: WebSocketEvent) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
  userAddress?: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, userAddress }) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = connectWebSocket();
    
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Join user room if address is provided
    if (userAddress) {
      joinUserRoom(userAddress);
    }

    // Cleanup on unmount
    return () => {
      if (userAddress) {
        leaveUserRoom(userAddress);
      }
      disconnectWebSocket();
    };
  }, [userAddress]);

  const joinDoc = (docId: string) => {
    joinDocRoom(docId);
  };

  const leaveDoc = (docId: string) => {
    leaveDocRoom(docId);
  };

  const joinSection = (sectionId: string) => {
    joinSectionRoom(sectionId);
  };

  const leaveSection = (sectionId: string) => {
    leaveSectionRoom(sectionId);
  };

  const joinClause = (clauseId: string) => {
    joinClauseRoom(clauseId);
  };

  const leaveClause = (clauseId: string) => {
    leaveClauseRoom(clauseId);
  };

  const joinUser = (address: string) => {
    joinUserRoom(address);
  };

  const leaveUser = (address: string) => {
    leaveUserRoom(address);
  };

  const onEvent = (callback: (data: WebSocketEvent) => void) => {
    onWebSocketEvent(callback);
  };

  const offEvent = (callback: (data: WebSocketEvent) => void) => {
    offWebSocketEvent(callback);
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        joinDoc,
        leaveDoc,
        joinSection,
        leaveSection,
        joinClause,
        leaveClause,
        joinUser,
        leaveUser,
        onEvent,
        offEvent,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { connectWebSocket, disconnectWebSocket, joinDocRoom, leaveDocRoom, joinSectionRoom, leaveSectionRoom, joinClauseRoom, leaveClauseRoom, joinUserRoom, leaveUserRoom, onWebSocketEvent, offWebSocketEvent, joinAdminRoom, WebSocketEvent } from '@/utils/websocket';
import { useUser } from './UserContext';
import { USER_ROLE } from '@/utils/constants';

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
  refetchContracts?: () => Promise<void>;
  refetchClientContracts?: () => Promise<void>;
  refetchDivisionLeaderSections?: () => Promise<void>;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  userAddress,
  refetchContracts,
  refetchClientContracts,
  refetchDivisionLeaderSections,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const { userRole } = useUser();

  // Initialize WebSocket connection once
  useEffect(() => {
    const socket = connectWebSocket();

    socket.on('connect', () => {
      console.log('WebSocket connected in provider');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected in provider');
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      // Don't disconnect here - let the socket stay connected for the app lifetime
    };
  }, []); // Empty dependency array - run once on mount

  // Handle room joining when user address or role changes
  useEffect(() => {
    if (userAddress) {
      joinUserRoom(userAddress);

      // Join admin room for legal team and admin
      if (userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN) {
        joinAdminRoom(userAddress);
      }
    }
  }, [userAddress, userRole]);

  // Update event handler when refetch functions change
  useEffect(() => {
    const handleWebSocketEvent = (data: WebSocketEvent) => {
      // Handle contract creation events
      if (data.type === 'DocCreated') {
        // Refetch contracts for admin/legal team
        if (userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN) {
          refetchContracts?.();
        }
        // Refetch client contracts for clients
        if (userRole === USER_ROLE.CLIENT) {
          refetchClientContracts?.();
        }
      }

      // Handle section assignment events for division leaders
      if (data.type === 'SectionAssigned' && userRole === USER_ROLE.DIVISION_LEADER) {
        // Refetch if the division leader in the event matches the connected user
        if (data.data?.divisionLeader?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionLeaderSections?.();
        }
      }
    };

    onWebSocketEvent(handleWebSocketEvent);

    return () => {
      offWebSocketEvent(handleWebSocketEvent);
    };
  }, [userRole, userAddress, refetchContracts, refetchClientContracts, refetchDivisionLeaderSections]);

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

"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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
  refetchDivisionMemberClauses?: () => Promise<void>;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  userAddress,
  refetchContracts,
  refetchClientContracts,
  refetchDivisionLeaderSections,
  refetchDivisionMemberClauses,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const { userRole } = useUser();

  // Use refs to store refetch functions to prevent frequent re-registrations
  const refetchContractsRef = useRef(refetchContracts);
  const refetchClientContractsRef = useRef(refetchClientContracts);
  const refetchDivisionLeaderSectionsRef = useRef(refetchDivisionLeaderSections);
  const refetchDivisionMemberClausesRef = useRef(refetchDivisionMemberClauses);

  // Update refs when functions change
  useEffect(() => {
    refetchContractsRef.current = refetchContracts;
    refetchClientContractsRef.current = refetchClientContracts;
    refetchDivisionLeaderSectionsRef.current = refetchDivisionLeaderSections;
    refetchDivisionMemberClausesRef.current = refetchDivisionMemberClauses;
  }, [refetchContracts, refetchClientContracts, refetchDivisionLeaderSections, refetchDivisionMemberClauses]);

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

  // Register event handler once (only depends on userRole and userAddress)
  useEffect(() => {
    const handleWebSocketEvent = (data: WebSocketEvent) => {
      // Handle contract creation events
      if (data.type === 'DocCreated') {
        // Refetch contracts for admin/legal team
        if (userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN) {
          refetchContractsRef.current?.();
        }
        // Refetch client contracts for clients
        if (userRole === USER_ROLE.CLIENT) {
          refetchClientContractsRef.current?.();
        }
      }

      // Handle section assignment events for division leaders
      if (data.type === 'SectionAssigned' && userRole === USER_ROLE.DIVISION_LEADER) {
        // Refetch if the division leader in the event matches the connected user
        if (data.data?.divisionLeader?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionLeaderSectionsRef.current?.();
        }
      }

      // Handle clause assignment events for division members
      if (data.type === 'ClauseAssigned' && userRole === USER_ROLE.DIVISION_MEMBER) {
        // Refetch if the division member in the event matches the connected user
        if (data.data?.member?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionMemberClausesRef.current?.();
        }
      }

      // Handle clause assignment events for division leaders (when they assign clauses to members)
      if (data.type === 'ClauseAssigned' && userRole === USER_ROLE.DIVISION_LEADER) {
        // Refetch if the division leader in the event matches the connected user
        if (data.data?.divisionLeader?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionLeaderSectionsRef.current?.();
        }
      }
    };

    onWebSocketEvent(handleWebSocketEvent);

    return () => {
      offWebSocketEvent(handleWebSocketEvent);
    };
  }, [userRole, userAddress]); // Only re-register when userRole or userAddress changes

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

"use client"
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
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
  const handleWebSocketEvent = useCallback((data: WebSocketEvent) => {
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

      // Handle document submitted to client events for legal team
      if (data.type === 'DocSubmittedToClient' && (userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN)) {
        // Refetch contracts for legal team/admin to see updated document status
        refetchContractsRef.current?.();
      }

      // Handle document submitted to client events for clients
      if (data.type === 'DocSubmittedToClient' && userRole === USER_ROLE.CLIENT) {
        // Refetch if the client in the event matches the connected user
        if (data.data?.client?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchClientContractsRef.current?.();
        }
      }

      // Handle client reviewed events for legal team
      if (data.type === 'ClientReviewed' && (userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN)) {
        // Refetch contracts for legal team/admin to see updated document status
        refetchContractsRef.current?.();
      }

      // Handle client reviewed events for clients
      if (data.type === 'ClientReviewed' && userRole === USER_ROLE.CLIENT) {
        // Refetch if the client in the event matches the connected user
        if (data.data?.client?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchClientContractsRef.current?.();
        }
      }

      // Handle client esigned events for legal team
      if (data.type === 'ClientEsigned' && (userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN)) {
        // Refetch contracts for legal team/admin to see updated document status
        refetchContractsRef.current?.();
      }

      // Handle client esigned events for clients
      if (data.type === 'ClientEsigned' && userRole === USER_ROLE.CLIENT) {
        // Refetch if the client in the event matches the connected user
        if (data.data?.client?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchClientContractsRef.current?.();
        }
      }

      // Handle legal esigned events for legal team
      if (data.type === 'LegalEsigned' && (userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN)) {
        // Refetch contracts for legal team/admin to see updated document status
        refetchContractsRef.current?.();
      }

      // Handle legal esigned events for clients
      if (data.type === 'LegalEsigned' && userRole === USER_ROLE.CLIENT) {
        // Refetch if the client in the event matches the connected user
        if (data.data?.client?.toLowerCase() === userAddress?.toLowerCase()) {
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

      // Handle section submitted events for division leaders
      if (data.type === 'SectionSubmitted' && userRole === USER_ROLE.DIVISION_LEADER) {
        // Refetch if the division leader in the event matches the connected user
        if (data.data?.divisionLeader?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionLeaderSectionsRef.current?.();
        }
      }

      // Handle section submitted events for legal team
      if (data.type === 'SectionSubmitted' && (userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN)) {
        // Refetch contracts for legal team/admin to see updated sections
        refetchContractsRef.current?.();
      }

      // Handle section approved events for legal team
      if (data.type === 'LegalApprovedSection' && (userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN)) {
        // Refetch contracts for legal team/admin to see updated sections
        refetchContractsRef.current?.();
        // Dispatch custom event for ContractDetails component to refresh
        window.dispatchEvent(new CustomEvent('LegalApprovedSection', { detail: data }));
      }

      // Handle section approved events for division leaders
      if (data.type === 'LegalApprovedSection' && userRole === USER_ROLE.DIVISION_LEADER) {
        // Refetch if the division leader in the event matches the connected user
        if (data.data?.divisionLeader?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionLeaderSectionsRef.current?.();
          // Dispatch custom event for ContractDetails component to refresh
          window.dispatchEvent(new CustomEvent('LegalApprovedSection', { detail: data }));
        }
      }

      // Handle section rejected events for legal team
      if (data.type === 'LegalRejectedSection' && (userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN)) {
        // Refetch contracts for legal team/admin to see updated sections
        refetchContractsRef.current?.();
        // Dispatch custom event for ContractDetails component to refresh
        window.dispatchEvent(new CustomEvent('LegalRejectedSection', { detail: data }));
      }

      // Handle section rejected events for division leaders
      if (data.type === 'LegalRejectedSection' && userRole === USER_ROLE.DIVISION_LEADER) {
        // Refetch if the division leader in the event matches the connected user
        if (data.data?.divisionLeader?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionLeaderSectionsRef.current?.();
          // Dispatch custom event for ContractDetails component to refresh
          window.dispatchEvent(new CustomEvent('LegalRejectedSection', { detail: data }));
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

      // Handle clause submitted events for division members
      if (data.type === 'ClauseSubmitted' && userRole === USER_ROLE.DIVISION_MEMBER) {
        // Refetch if the division member in the event matches the connected user
        if (data.data?.member?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionMemberClausesRef.current?.();
        }
      }

      // Handle clause submitted events for division leaders (when members submit clauses)
      if (data.type === 'ClauseSubmitted' && userRole === USER_ROLE.DIVISION_LEADER) {
        // Refetch if the division leader in the event matches the connected user
        if (data.data?.divisionLeader?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionLeaderSectionsRef.current?.();
        }
      }

      // Handle clause approved events for division members
      if (data.type === 'LeaderApprovedClause' && userRole === USER_ROLE.DIVISION_MEMBER) {
        // Refetch if the division member in the event matches the connected user
        if (data.data?.member?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionMemberClausesRef.current?.();
        }
      }

      // Handle clause approved events for division leaders
      if (data.type === 'LeaderApprovedClause' && userRole === USER_ROLE.DIVISION_LEADER) {
        // Refetch if the division leader in the event matches the connected user
        if (data.data?.divisionLeader?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionLeaderSectionsRef.current?.();
        }
      }

      // Handle clause rejected events for division members
      if (data.type === 'LeaderRejectedClause' && userRole === USER_ROLE.DIVISION_MEMBER) {
        // Refetch if the division member in the event matches the connected user
        if (data.data?.member?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionMemberClausesRef.current?.();
        }
      }

      // Handle clause rejected events for division leaders
      if (data.type === 'LeaderRejectedClause' && userRole === USER_ROLE.DIVISION_LEADER) {
        // Refetch if the division leader in the event matches the connected user
        if (data.data?.divisionLeader?.toLowerCase() === userAddress?.toLowerCase()) {
          refetchDivisionLeaderSectionsRef.current?.();
        }
      }

      // Handle registration status change events
      if (data.type === 'registration_status_change' && data.data?.address?.toLowerCase() === userAddress?.toLowerCase()) {
        // This event is handled by the register page component
        // We trigger a custom event that the register page can listen to
        window.dispatchEvent(new CustomEvent('registrationStatusChange', { detail: data }));
      }

      // Handle new registration request events (for admin)
      if (data.type === 'RegisterRequest' && (userRole === USER_ROLE.LEGAL_TEAM || userRole === USER_ROLE.ADMIN)) {
        // This event is handled by the PendingUsers component
        // We trigger a custom event that the PendingUsers component can listen to
        window.dispatchEvent(new CustomEvent('registerRequest', { detail: data }));
      }

      // Dispatch custom events for RealTime components
      window.dispatchEvent(new CustomEvent('docEvent', { detail: data }));
      window.dispatchEvent(new CustomEvent('sectionEvent', { detail: data }));
      window.dispatchEvent(new CustomEvent('clauseEvent', { detail: data }));
      window.dispatchEvent(new CustomEvent('userEvent', { detail: data }));
    }, [userRole, userAddress]);

  useEffect(() => {
    onWebSocketEvent(handleWebSocketEvent);

    return () => {
      offWebSocketEvent(handleWebSocketEvent);
    };
  }, [handleWebSocketEvent]); // Only re-register when handler changes

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
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

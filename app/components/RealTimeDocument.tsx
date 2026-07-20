"use client"
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { WebSocketEvent } from '@/utils/websocket';

/**
 * Example component showing how to use WebSocket for real-time document updates
 * 
 * Usage:
 * 1. Import useWebSocket hook
 * 2. Join relevant rooms (doc, section, clause, user)
 * 3. Listen for events and update state accordingly
 * 4. Clean up by leaving rooms when component unmounts
 */
interface RealTimeDocumentProps {
  docId: string;
  onDataChange?: (data: any) => void;
}

export const RealTimeDocument: React.FC<RealTimeDocumentProps> = ({ docId, onDataChange }) => {
  const { isConnected, joinDoc, leaveDoc } = useWebSocket();
  const [lastUpdate, setLastUpdate] = useState<WebSocketEvent | null>(null);

  useEffect(() => {
    // Join the document room to receive updates for this specific document
    joinDoc(docId);

    // Set up event listener via custom event
    const handleEvent = (event: CustomEvent) => {
      const data = event.detail as WebSocketEvent;
      setLastUpdate(data);
      
      // Call the callback if provided
      if (onDataChange) {
        onDataChange(data);
      }
    };

    window.addEventListener('docEvent', handleEvent as EventListener);

    // Cleanup: leave room and remove event listener
    return () => {
      leaveDoc(docId);
      window.removeEventListener('docEvent', handleEvent as EventListener);
    };
  }, [docId, joinDoc, leaveDoc, onDataChange]);

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold">Real-time Updates</h3>
        <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      {lastUpdate && (
        <div className="mt-2 p-2 bg-gray-700 rounded text-sm">
          <p className="text-gray-300">Last update:</p>
          <p className="text-white font-mono">{lastUpdate.type}</p>
          <p className="text-gray-400 text-xs">
            {new Date(lastUpdate.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Example component for real-time section updates
 */
interface RealTimeSectionProps {
  sectionId: string;
  onSectionUpdate?: (data: any) => void;
}

export const RealTimeSection: React.FC<RealTimeSectionProps> = ({ sectionId, onSectionUpdate }) => {
  const { isConnected, joinSection, leaveSection } = useWebSocket();

  useEffect(() => {
    joinSection(sectionId);

    const handleEvent = (event: CustomEvent) => {
      const data = event.detail as WebSocketEvent;
      if (data.type === 'SectionAssigned' || 
          data.type === 'SectionSubmitted' ||
          data.type === 'LegalApprovedSection' ||
          data.type === 'LegalRejectedSection') {
        if (onSectionUpdate) {
          onSectionUpdate(data);
        }
      }
    };

    window.addEventListener('sectionEvent', handleEvent as EventListener);

    return () => {
      leaveSection(sectionId);
      window.removeEventListener('sectionEvent', handleEvent as EventListener);
    };
  }, [sectionId, joinSection, leaveSection, onSectionUpdate]);

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className="text-sm text-gray-400">
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
};

/**
 * Example component for real-time clause updates
 */
interface RealTimeClauseProps {
  clauseId: string;
  onClauseUpdate?: (data: any) => void;
}

export const RealTimeClause: React.FC<RealTimeClauseProps> = ({ clauseId, onClauseUpdate }) => {
  const { isConnected, joinClause, leaveClause } = useWebSocket();

  useEffect(() => {
    joinClause(clauseId);

    const handleEvent = (event: CustomEvent) => {
      const data = event.detail as WebSocketEvent;
      if (data.type === 'ClauseAssigned' || 
          data.type === 'ClauseSubmitted' ||
          data.type === 'LeaderApprovedClause' ||
          data.type === 'LeaderRejectedClause') {
        if (onClauseUpdate) {
          onClauseUpdate(data);
        }
      }
    };

    window.addEventListener('clauseEvent', handleEvent as EventListener);

    return () => {
      leaveClause(clauseId);
      window.removeEventListener('clauseEvent', handleEvent as EventListener);
    };
  }, [clauseId, joinClause, leaveClause, onClauseUpdate]);

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className="text-sm text-gray-400">
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
};

/**
 * Example component for user-specific notifications
 */
interface RealTimeUserNotificationsProps {
  userAddress: string;
  onNotification?: (data: any) => void;
}

export const RealTimeUserNotifications: React.FC<RealTimeUserNotificationsProps> = ({ 
  userAddress, 
  onNotification 
}) => {
  const { isConnected, joinUser, leaveUser } = useWebSocket();
  const [notifications, setNotifications] = useState<WebSocketEvent[]>([]);

  useEffect(() => {
    joinUser(userAddress);

    const handleEvent = (event: CustomEvent) => {
      const data = event.detail as WebSocketEvent;
      // All user-specific events come through user:{address}:notification channel
      setNotifications(prev => [data, ...prev].slice(0, 10)); // Keep last 10
      
      if (onNotification) {
        onNotification(data);
      }
    };

    window.addEventListener('userEvent', handleEvent as EventListener);

    return () => {
      leaveUser(userAddress);
      window.removeEventListener('userEvent', handleEvent as EventListener);
    };
  }, [userAddress, joinUser, leaveUser, onNotification]);

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold">Notifications</h3>
        <div className={`flex items-center gap-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      {notifications.length > 0 && (
        <div className="space-y-2 mt-2">
          {notifications.map((notif, index) => (
            <div key={index} className="p-2 bg-gray-700 rounded text-sm">
              <p className="text-white font-mono">{notif.type}</p>
              <p className="text-gray-400 text-xs">
                {new Date(notif.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const { isConnected, joinDoc, leaveDoc, onEvent, offEvent } = useWebSocket();
  const [lastUpdate, setLastUpdate] = useState<WebSocketEvent | null>(null);

  useEffect(() => {
    // Join the document room to receive updates for this specific document
    joinDoc(docId);

    // Set up event listener
    const handleEvent = (data: WebSocketEvent) => {
      console.log('Received real-time update:', data);
      setLastUpdate(data);
      
      // Call the callback if provided
      if (onDataChange) {
        onDataChange(data);
      }

      // Handle specific event types
      switch (data.type) {
        case 'DocCreated':
          console.log('Document created:', data.data);
          break;
        case 'DocSubmittedToClient':
          console.log('Document submitted to client:', data.data);
          break;
        case 'ClientReviewed':
          console.log('Client reviewed document:', data.data);
          break;
        case 'ClientEsigned':
        case 'LegalEsigned':
          console.log('Document esigned:', data.data);
          break;
        default:
          console.log('Other event:', data.type, data.data);
      }
    };

    onEvent(handleEvent);

    // Cleanup: leave room and remove event listener
    return () => {
      leaveDoc(docId);
      offEvent(handleEvent);
    };
  }, [docId, joinDoc, leaveDoc, onEvent, offEvent, onDataChange]);

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
  const { isConnected, joinSection, leaveSection, onEvent, offEvent } = useWebSocket();

  useEffect(() => {
    joinSection(sectionId);

    const handleEvent = (data: WebSocketEvent) => {
      if (data.type === 'SectionAssigned' || 
          data.type === 'SectionSubmitted' ||
          data.type === 'LegalApprovedSection' ||
          data.type === 'LegalRejectedSection') {
        if (onSectionUpdate) {
          onSectionUpdate(data);
        }
      }
    };

    onEvent(handleEvent);

    return () => {
      leaveSection(sectionId);
      offEvent(handleEvent);
    };
  }, [sectionId, joinSection, leaveSection, onEvent, offEvent, onSectionUpdate]);

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
  const { isConnected, joinClause, leaveClause, onEvent, offEvent } = useWebSocket();

  useEffect(() => {
    joinClause(clauseId);

    const handleEvent = (data: WebSocketEvent) => {
      if (data.type === 'ClauseAssigned' || 
          data.type === 'ClauseSubmitted' ||
          data.type === 'LeaderApprovedClause' ||
          data.type === 'LeaderRejectedClause') {
        if (onClauseUpdate) {
          onClauseUpdate(data);
        }
      }
    };

    onEvent(handleEvent);

    return () => {
      leaveClause(clauseId);
      offEvent(handleEvent);
    };
  }, [clauseId, joinClause, leaveClause, onEvent, offEvent, onClauseUpdate]);

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
  const { isConnected, joinUser, leaveUser, onEvent, offEvent } = useWebSocket();
  const [notifications, setNotifications] = useState<WebSocketEvent[]>([]);

  useEffect(() => {
    joinUser(userAddress);

    const handleEvent = (data: WebSocketEvent) => {
      // All user-specific events come through user:{address}:notification channel
      setNotifications(prev => [data, ...prev].slice(0, 10)); // Keep last 10
      
      if (onNotification) {
        onNotification(data);
      }
    };

    onEvent(handleEvent);

    return () => {
      leaveUser(userAddress);
      offEvent(handleEvent);
    };
  }, [userAddress, joinUser, leaveUser, onEvent, offEvent, onNotification]);

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

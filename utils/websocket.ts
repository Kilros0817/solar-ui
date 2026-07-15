import { io, Socket } from 'socket.io-client';
import { URLs } from './constants';

const SERVER_URL = URLs.SDMS;

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: number;
}

export function getSocket(): Socket | null {
  return socket;
}

export function connectWebSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: RECONNECT_DELAY,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected:', socket?.id);
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
    reconnectAttempts++;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
    }
  });

  socket.on('event', (data: WebSocketEvent) => {
    console.log('Received event:', data);
  });

  return socket;
}

export function disconnectWebSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('WebSocket disconnected');
  }
}

// Room management functions
export function joinDocRoom(docId: string): void {
  const sock = getSocket();
  if (sock?.connected) {
    sock.emit('join:doc', docId);
    console.log(`Joined doc room: ${docId}`);
  }
}

export function leaveDocRoom(docId: string): void {
  const sock = getSocket();
  if (sock?.connected) {
    sock.emit('leave:doc', docId);
    console.log(`Left doc room: ${docId}`);
  }
}

export function joinSectionRoom(sectionId: string): void {
  const sock = getSocket();
  if (sock?.connected) {
    sock.emit('join:section', sectionId);
    console.log(`Joined section room: ${sectionId}`);
  }
}

export function leaveSectionRoom(sectionId: string): void {
  const sock = getSocket();
  if (sock?.connected) {
    sock.emit('leave:section', sectionId);
    console.log(`Left section room: ${sectionId}`);
  }
}

export function joinClauseRoom(clauseId: string): void {
  const sock = getSocket();
  if (sock?.connected) {
    sock.emit('join:clause', clauseId);
    console.log(`Joined clause room: ${clauseId}`);
  }
}

export function leaveClauseRoom(clauseId: string): void {
  const sock = getSocket();
  if (sock?.connected) {
    sock.emit('leave:clause', clauseId);
    console.log(`Left clause room: ${clauseId}`);
  }
}

export function joinUserRoom(address: string): void {
  const sock = getSocket();
  if (sock?.connected) {
    sock.emit('join:user', address.toLowerCase());
    console.log(`Joined user room: ${address}`);
  }
}

export function leaveUserRoom(address: string): void {
  const sock = getSocket();
  if (sock?.connected) {
    sock.emit('leave:user', address.toLowerCase());
    console.log(`Left user room: ${address}`);
  }
}

export function joinAdminRoom(address: string): void {
  const sock = getSocket();
  if (sock?.connected) {
    sock.emit('join:admin', address.toLowerCase());
    console.log(`Joined admin room for address: ${address}`);
  }
}

// Event listener registration
export function onWebSocketEvent(callback: (data: WebSocketEvent) => void): void {
  const sock = getSocket();
  if (sock) {
    sock.on('event', callback);
  }
}

export function offWebSocketEvent(callback: (data: WebSocketEvent) => void): void {
  const sock = getSocket();
  if (sock) {
    sock.off('event', callback);
  }
}

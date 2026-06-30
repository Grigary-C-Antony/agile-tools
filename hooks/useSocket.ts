'use client'

/**
 * useSocket — WebSocket connection hook via Socket.IO
 *
 * In production: connects to the Socket.IO server in server.ts
 * Currently: provides mock state simulation for planning poker
 *
 * Replace SOCKET_URL with your deployed backend URL for production.
 */

import { useEffect, useRef, useCallback } from 'react'
// import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000'

export type SocketEvent =
  | 'session:join'
  | 'session:leave'
  | 'session:vote'
  | 'session:reveal'
  | 'session:reset'
  | 'session:next-story'
  | 'participant:joined'
  | 'participant:left'
  | 'vote:cast'
  | 'votes:revealed'
  | 'session:reset'

export interface UseSocketOptions {
  sessionId?: string
  onVoteCast?: (userId: string, hasVoted: boolean) => void
  onVotesRevealed?: (votes: Record<string, string | number>) => void
  onSessionReset?: () => void
  onParticipantJoined?: (participant: { userId: string; name: string }) => void
  onParticipantLeft?: (userId: string) => void
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<unknown>(null)
  const { sessionId, onVoteCast, onVotesRevealed, onSessionReset, onParticipantJoined, onParticipantLeft } = options

  useEffect(() => {
    if (!sessionId) return

    // ── PRODUCTION: Uncomment below to enable real Socket.IO ──
    // const socket = io(SOCKET_URL, {
    //   path: '/api/socket',
    //   query: { sessionId },
    //   transports: ['websocket'],
    // })
    // socketRef.current = socket
    //
    // socket.on('vote:cast', ({ userId, hasVoted }) => onVoteCast?.(userId, hasVoted))
    // socket.on('votes:revealed', ({ votes }) => onVotesRevealed?.(votes))
    // socket.on('session:reset', () => onSessionReset?.())
    // socket.on('participant:joined', (p) => onParticipantJoined?.(p))
    // socket.on('participant:left', ({ userId }) => onParticipantLeft?.(userId))
    //
    // socket.emit('session:join', { sessionId })
    //
    // return () => {
    //   socket.emit('session:leave', { sessionId })
    //   socket.disconnect()
    // }

    // ── MOCK: Simulate socket events with timeouts ──
    console.log(`[Socket Mock] Connected to session: ${sessionId} @ ${SOCKET_URL}`)

    return () => {
      console.log(`[Socket Mock] Disconnected from session: ${sessionId}`)
    }
  }, [sessionId, onVoteCast, onVotesRevealed, onSessionReset, onParticipantJoined, onParticipantLeft])

  const emit = useCallback((event: SocketEvent, data?: unknown) => {
    // ── PRODUCTION: Uncomment below ──
    // if (socketRef.current) {
    //   (socketRef.current as Socket).emit(event, data)
    // }

    // ── MOCK ──
    console.log(`[Socket Mock] Emit: ${event}`, data)
  }, [])

  return { emit, isConnected: !!sessionId }
}

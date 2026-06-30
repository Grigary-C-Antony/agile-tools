/**
 * Custom Next.js server with Socket.IO integration
 *
 * Run with: npx tsx server.ts
 * Or with tsx installed globally: tsx server.ts
 */

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOST ?? 'localhost'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // ─── Socket.IO Server ───────────────────────────────────────
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  // Track participants per session
  const sessions: Map<string, Set<string>> = new Map()

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`)
    let currentSession: string | null = null

    // ── Join session ──
    socket.on('session:join', ({ sessionId, userId, name }: { sessionId: string; userId: string; name: string }) => {
      if (!sessions.has(sessionId)) sessions.set(sessionId, new Set())
      sessions.get(sessionId)!.add(userId)

      currentSession = sessionId
      socket.join(sessionId)

      // Notify others
      socket.to(sessionId).emit('participant:joined', { userId, name })
      console.log(`[Socket.IO] User ${userId} joined session ${sessionId}`)
    })

    // ── Cast vote ──
    socket.on('session:vote', ({ sessionId, userId, vote }: { sessionId: string; userId: string; vote?: string | number }) => {
      socket.to(sessionId).emit('vote:cast', { userId, hasVoted: !!vote, vote })
    })

    // ── Reveal votes ──
    socket.on('session:reveal', ({ sessionId, votes }: { sessionId: string; votes: Record<string, string | number> }) => {
      io.to(sessionId).emit('votes:revealed', { votes })
    })

    // ── Reset session ──
    socket.on('session:reset', ({ sessionId }: { sessionId: string }) => {
      io.to(sessionId).emit('session:reset', {})
    })

    // ── Next story ──
    socket.on('session:next-story', ({ sessionId, story }: { sessionId: string; story: unknown }) => {
      io.to(sessionId).emit('story:changed', { story })
    })

    // ── Leave / disconnect ──
    const handleLeave = (userId: string) => {
      if (currentSession) {
        sessions.get(currentSession)?.delete(userId)
        socket.to(currentSession).emit('participant:left', { userId })
        socket.leave(currentSession)
        currentSession = null
      }
    }

    socket.on('session:leave', ({ userId }: { userId: string }) => handleLeave(userId))
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`)
    })
  })

  // ─── Start server ────────────────────────────────────────────
  httpServer.listen(port, () => {
    console.log(`\n  > Ready on http://${hostname}:${port}`)
    console.log(`  > Socket.IO listening on ws://${hostname}:${port}/api/socket`)
    console.log(`  > Mode: ${dev ? 'development' : 'production'}\n`)
  })
})

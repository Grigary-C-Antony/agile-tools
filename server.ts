import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { db } from './lib/db'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOST ?? 'localhost'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory tracking: sessionId → memberId → { name, socketId }
const pokerRooms = new Map<string, Map<string, { name: string; socketId: string }>>()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: { origin: '*', methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`)
    let currentSessionId: string | null = null
    let currentMemberId: string | null = null

    // ── Join poker session ──────────────────────────────────────────────────
    socket.on('poker:join', ({ sessionId, memberId, memberName }: { sessionId: string; memberId: string; memberName: string }) => {
      socket.join(`poker:${sessionId}`)
      currentSessionId = sessionId
      currentMemberId = memberId

      if (!pokerRooms.has(sessionId)) pokerRooms.set(sessionId, new Map())
      pokerRooms.get(sessionId)!.set(memberId, { name: memberName, socketId: socket.id })

      const session = db.getPokerSession(sessionId)
      const stories = db.getStories(sessionId)
      const room = pokerRooms.get(sessionId)!
      const currentVotes = session?.current_story_id ? db.getVotes(sessionId, session.current_story_id) : []
      const votedIds = new Set(currentVotes.map(v => v.member_id))

      const participants = Array.from(room.entries()).map(([id, info]) => ({
        memberId: id, name: info.name, hasVoted: votedIds.has(id),
      }))

      // Send current state to the joining client
      socket.emit('poker:state', {
        session, stories, participants,
        votes: session?.status === 'revealed' ? currentVotes : [],
      })

      // Notify others
      socket.to(`poker:${sessionId}`).emit('poker:participant-joined', { memberId, memberName })
    })

    // ── Cast vote ──────────────────────────────────────────────────────────
    socket.on('poker:vote', ({ sessionId, storyId, memberId, vote }: { sessionId: string; storyId: string; memberId: string; vote: string }) => {
      db.saveVote(sessionId, storyId, memberId, vote)
      io.to(`poker:${sessionId}`).emit('poker:voted', { memberId })
    })

    // ── Reveal votes ──────────────────────────────────────────────────────
    socket.on('poker:reveal', ({ sessionId, storyId }: { sessionId: string; storyId: string }) => {
      db.updatePokerSessionStatus(sessionId, 'revealed')
      const votes = db.getVotes(sessionId, storyId)
      io.to(`poker:${sessionId}`).emit('poker:revealed', { votes, storyId })
    })

    // ── Reset round ───────────────────────────────────────────────────────
    socket.on('poker:reset', ({ sessionId, storyId }: { sessionId: string; storyId: string }) => {
      db.clearVotes(sessionId, storyId)
      db.updatePokerSessionStatus(sessionId, 'voting')
      io.to(`poker:${sessionId}`).emit('poker:reset-round', { storyId })
    })

    // ── Accept story estimate & advance ──────────────────────────────────
    socket.on('poker:accept-story', ({ sessionId, storyId, estimate }: { sessionId: string; storyId: string; estimate: string }) => {
      db.setStoryEstimate(storyId, estimate)
      db.updatePokerSessionStatus(sessionId, 'voting')
      const stories = db.getStories(sessionId)
      const idx = stories.findIndex(s => s.id === storyId)
      const next = stories[idx + 1] ?? null
      db.setCurrentStory(sessionId, next?.id ?? null)
      if (!next) db.updatePokerSessionStatus(sessionId, 'completed')
      io.to(`poker:${sessionId}`).emit('poker:story-accepted', { storyId, estimate, nextStory: next })
    })

    // ── Add story ─────────────────────────────────────────────────────────
    socket.on('poker:add-story', ({ sessionId, title, description }: { sessionId: string; title: string; description?: string }) => {
      const story = db.addStory(sessionId, title, description)
      io.to(`poker:${sessionId}`).emit('poker:story-added', { story })
    })

    // ── End session ───────────────────────────────────────────────────────
    socket.on('poker:end', ({ sessionId }: { sessionId: string }) => {
      db.updatePokerSessionStatus(sessionId, 'completed')
      io.to(`poker:${sessionId}`).emit('poker:session-ended', { sessionId })
      pokerRooms.delete(sessionId)
    })

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`)
      if (currentSessionId && currentMemberId) {
        pokerRooms.get(currentSessionId)?.delete(currentMemberId)
        socket.to(`poker:${currentSessionId}`).emit('poker:participant-left', { memberId: currentMemberId })
        if (pokerRooms.get(currentSessionId)?.size === 0) pokerRooms.delete(currentSessionId)
      }
    })
  })

  httpServer.listen(port, () => {
    console.log(`\n  > Ready on http://${hostname}:${port}`)
    console.log(`  > Socket.IO on ws://${hostname}:${port}/api/socket`)
    console.log(`  > Mode: ${dev ? 'development' : 'production'}\n`)
  })
})

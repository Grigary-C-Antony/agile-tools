'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { io, type Socket } from 'socket.io-client'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useSession } from '@/hooks/useSession'
import { calcModeVote, calcAverageVote } from '@/lib/utils'
import { FIBONACCI_DECK, TSHIRT_DECK } from '@/lib/types'
import type { PokerSession, PokerStory, PokerVote } from '@/lib/db'

interface Participant { memberId: string; name: string; hasVoted: boolean }

function MemberInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function ParticipantCard({ p, revealed, votes }: { p: Participant; revealed: boolean; votes: PokerVote[] }) {
  const vote = votes.find(v => v.member_id === p.memberId)
  return (
    <div className={['flex items-center justify-between p-4 rounded-2xl border transition-all',
      p.hasVoted ? 'bg-surface-container/40 border-white/5 hover:border-primary/20' : 'bg-surface-container/20 border-white/5 opacity-50'
    ].join(' ')}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-white border-2 border-white/10">
          {MemberInitials(p.name)}
        </div>
        <p className="text-sm font-bold text-on-surface">{p.name}</p>
      </div>
      <div>
        {revealed && vote ? (
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center font-bold text-white text-sm neon-glow-purple">
            {vote.vote}
          </div>
        ) : p.hasVoted ? (
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[16px]">check</span>
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}

function VotingCard({ value, selected, onClick }: { value: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`poker-card w-12 md:w-16 h-16 md:h-24 rounded-xl font-bold text-xl md:text-2xl flex items-center justify-center border shadow-lg ${
        selected ? 'selected bg-primary/20 border-primary text-white ring-4 ring-primary/10'
          : 'bg-surface-container-high border-white/5 text-on-surface hover:border-primary/50 hover:bg-surface-container-highest'
      }`}>
      {value}
    </button>
  )
}

export default function PokerSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const { session: userSession } = useSession()

  const [session, setSession] = useState<PokerSession | null>(null)
  const [stories, setStories] = useState<PokerStory[]>([])
  const [votes, setVotes] = useState<PokerVote[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [myVote, setMyVote] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [addStoryOpen, setAddStoryOpen] = useState(false)
  const [newStoryTitle, setNewStoryTitle] = useState('')
  const [endConfirmOpen, setEndConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const socketRef = useRef<Socket | null>(null)

  const currentStory = session?.current_story_id
    ? stories.find(s => s.id === session.current_story_id) ?? null
    : null
  const currentStoryIdx = currentStory ? stories.indexOf(currentStory) : -1
  const deck = session?.scale === 'tshirt' ? TSHIRT_DECK : FIBONACCI_DECK
  const votedCount = participants.filter(p => p.hasVoted).length
  const totalCount = participants.length

  // Build votes record for calcModeVote/calcAverageVote
  const votesRecord: Record<string, string | number> = {}
  votes.forEach(v => { votesRecord[v.member_id] = v.vote })
  const modeVote = revealed ? calcModeVote(votesRecord) : null
  const avgVote = revealed ? calcAverageVote(votesRecord) : null

  // Fetch initial state
  useEffect(() => {
    fetch(`/api/poker/${sessionId}`).then(r => r.json()).then(d => {
      if (d.session) {
        setSession(d.session)
        setStories(d.stories ?? [])
        setVotes(d.votes ?? [])
        setRevealed(d.session.status === 'revealed')
      }
      setLoading(false)
    })
  }, [sessionId])

  // Socket.IO
  useEffect(() => {
    if (!userSession) return

    const socket = io({ path: '/api/socket' })
    socketRef.current = socket

    socket.emit('poker:join', {
      sessionId,
      memberId: userSession.memberId,
      memberName: userSession.memberName,
    })

    socket.on('poker:state', ({ session: s, stories: st, participants: p, votes: v }) => {
      if (s) setSession(s)
      if (st) setStories(st)
      if (p) setParticipants(p)
      if (v) setVotes(v)
      if (s?.status === 'revealed') setRevealed(true)
    })

    socket.on('poker:participant-joined', ({ memberId, memberName }: { memberId: string; memberName: string }) => {
      setParticipants(prev => {
        if (prev.some(p => p.memberId === memberId)) return prev
        return [...prev, { memberId, memberName, name: memberName, hasVoted: false }]
      })
    })

    socket.on('poker:participant-left', ({ memberId }: { memberId: string }) => {
      setParticipants(prev => prev.filter(p => p.memberId !== memberId))
    })

    socket.on('poker:voted', ({ memberId }: { memberId: string }) => {
      setParticipants(prev => prev.map(p => p.memberId === memberId ? { ...p, hasVoted: true } : p))
    })

    socket.on('poker:revealed', ({ votes: v }: { votes: PokerVote[] }) => {
      setVotes(v)
      setRevealed(true)
      setSession(prev => prev ? { ...prev, status: 'revealed' } : prev)
    })

    socket.on('poker:reset-round', () => {
      setVotes([])
      setRevealed(false)
      setMyVote(null)
      setSession(prev => prev ? { ...prev, status: 'voting' } : prev)
      setParticipants(prev => prev.map(p => ({ ...p, hasVoted: false })))
    })

    socket.on('poker:story-accepted', ({ storyId, estimate, nextStory }: { storyId: string; estimate: string; nextStory: PokerStory | null }) => {
      setStories(prev => prev.map(s => s.id === storyId ? { ...s, estimate } : s))
      setVotes([])
      setRevealed(false)
      setMyVote(null)
      setParticipants(prev => prev.map(p => ({ ...p, hasVoted: false })))
      setSession(prev => prev ? { ...prev, current_story_id: nextStory?.id ?? null, status: nextStory ? 'voting' : 'completed' } : prev)
    })

    socket.on('poker:story-added', ({ story }: { story: PokerStory }) => {
      setStories(prev => [...prev, story])
      setSession(prev => prev && !prev.current_story_id ? { ...prev, current_story_id: story.id } : prev)
    })

    socket.on('poker:session-ended', () => { router.push('/planning-poker') })

    return () => { socket.disconnect() }
  }, [sessionId, userSession, router])

  const emit = useCallback((event: string, data: object) => {
    socketRef.current?.emit(event, data)
  }, [])

  const handleVote = (val: string) => {
    if (!currentStory || !userSession) return
    const newVote = val === myVote ? null : val
    setMyVote(newVote)
    if (newVote) {
      emit('poker:vote', { sessionId, storyId: currentStory.id, memberId: userSession.memberId, vote: newVote })
      setParticipants(prev => prev.map(p => p.memberId === userSession.memberId ? { ...p, hasVoted: true } : p))
    }
  }

  const handleReveal = () => {
    if (!currentStory) return
    emit('poker:reveal', { sessionId, storyId: currentStory.id })
  }

  const handleReset = () => {
    if (!currentStory) return
    emit('poker:reset', { sessionId, storyId: currentStory.id })
  }

  const handleAcceptStory = () => {
    if (!currentStory) return
    const estimate = modeVote ?? myVote ?? '?'
    emit('poker:accept-story', { sessionId, storyId: currentStory.id, estimate })
  }

  const handleAddStory = () => {
    if (!newStoryTitle.trim()) return
    emit('poker:add-story', { sessionId, title: newStoryTitle.trim() })
    setNewStoryTitle('')
    setAddStoryOpen(false)
  }

  const handleEnd = () => {
    emit('poker:end', { sessionId })
    router.push('/planning-poker')
  }

  const navigateStory = (idx: number) => {
    const story = stories[idx]
    if (!story || !userSession) return
    setSession(prev => prev ? { ...prev, current_story_id: story.id } : prev)
    setVotes([])
    setRevealed(false)
    setMyVote(null)
    setParticipants(prev => prev.map(p => ({ ...p, hasVoted: false })))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="text-on-surface-variant">Joining session…</p>
      </div>
    </div>
  )

  if (!session) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-on-surface-variant mb-4">Session not found.</p>
        <Link href="/planning-poker"><Button variant="primary">Back to Sessions</Button></Link>
      </div>
    </div>
  )

  const isAdmin = userSession?.role === 'admin' || session.created_by === userSession?.memberId

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="relative z-10 flex flex-col h-full p-4 lg:p-6 gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/planning-poker" className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </Link>
              <h1 className="text-display-md text-on-surface tracking-tight">{session.name}</h1>
            </div>
            <div className="flex items-center gap-3 text-sm text-on-surface-variant ml-7">
              <Badge variant={session.status === 'completed' ? 'glass' : 'tertiary'} dot={session.status !== 'completed'}>
                {session.status === 'completed' ? 'Completed' : session.status === 'revealed' ? 'Revealed' : 'Voting'}
              </Badge>
              <Badge variant="primary">{session.scale}</Badge>
              <span className="text-on-surface-variant/40">{votedCount}/{totalCount} voted</span>
            </div>
          </div>
          <div className="flex gap-2 ml-7 sm:ml-0">
            <Button variant="glass" icon="add" size="sm" onClick={() => setAddStoryOpen(true)}>Story</Button>
            <Button variant="glass" icon="share" size="sm" onClick={() => setInviteOpen(true)}>Invite</Button>
            {isAdmin && <Button variant="danger" icon="stop_circle" size="sm" onClick={() => setEndConfirmOpen(true)}>End</Button>}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
          {/* Center stage */}
          <GlassCard padding="lg" className="lg:col-span-3 flex flex-col overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent pointer-events-none" />

            {/* Story info */}
            <div className="text-center mb-auto pt-2 relative z-10">
              {currentStory ? (
                <div className="flex items-center justify-between mb-2">
                  <button className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"
                    disabled={currentStoryIdx <= 0} onClick={() => navigateStory(currentStoryIdx - 1)}>
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <div>
                    <p className="text-label-caps text-on-surface-variant/40 text-[10px] mb-1">
                      Story {currentStoryIdx + 1} of {stories.length}
                    </p>
                    <h2 className="text-xl font-bold text-on-surface">{currentStory.title}</h2>
                    {currentStory.description && (
                      <p className="text-on-surface-variant text-sm mt-1 max-w-xl mx-auto opacity-70">{currentStory.description}</p>
                    )}
                  </div>
                  <button className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"
                    disabled={currentStoryIdx >= stories.length - 1} onClick={() => navigateStory(currentStoryIdx + 1)}>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              ) : (
                <div className="text-on-surface-variant/40">
                  <span className="material-symbols-outlined text-[36px] mb-2 block">list_alt</span>
                  <p>No stories yet. Add stories to start estimating.</p>
                </div>
              )}
            </div>

            {/* Card reveal area */}
            <div className="flex-1 flex items-center justify-center py-8 relative z-10">
              {revealed ? (
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute -inset-8 bg-primary/15 rounded-full blur-3xl" />
                    <div className="relative w-36 h-52 glass-modal rounded-2xl border border-primary/30 flex flex-col items-center justify-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <span className="text-6xl font-black gradient-purple-text">{modeVote ?? '?'}</span>
                      <span className="text-label-caps text-on-surface-variant/50 text-[10px]">Consensus</span>
                    </div>
                  </div>
                  {avgVote !== null && modeVote !== String(avgVote) && (
                    <p className="text-sm text-on-surface-variant">Average: <span className="font-bold text-secondary">{avgVote}</span></p>
                  )}
                  <div className="flex justify-center gap-3 mt-4 flex-wrap">
                    {votes.map(v => {
                      const p = participants.find(pp => pp.memberId === v.member_id)
                      return (
                        <div key={v.member_id} className="text-center">
                          <div className="w-12 h-16 rounded-xl gradient-brand flex items-center justify-center font-bold text-white text-lg mb-1 neon-glow-purple">{v.vote}</div>
                          <p className="text-[10px] text-on-surface-variant/50 font-bold">{MemberInitials(p?.name ?? v.member_id)}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -inset-10 bg-primary/15 rounded-full blur-3xl animate-pulse" />
                  <div className="relative w-36 h-52 glass-modal rounded-2xl border border-white/20 flex flex-col items-center justify-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    {myVote ? (
                      <>
                        <span className="text-6xl font-black gradient-purple-text">{myVote}</span>
                        <span className="text-label-caps text-on-surface-variant/50 text-[10px]">Your Vote</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-on-surface-variant/20 text-[48px]">casino</span>
                        <span className="text-label-caps text-on-surface-variant/30 text-[10px]">Pick a card</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 pb-2 relative z-10 flex-wrap">
              {!revealed ? (
                <Button variant="primary" size="lg" onClick={handleReveal}
                  disabled={votedCount === 0 || !currentStory} className="w-48 neon-glow-purple">
                  Reveal Votes
                </Button>
              ) : (
                <Button variant="primary" size="lg" onClick={handleAcceptStory}
                  disabled={!currentStory} className="w-48 neon-glow-purple" icon="check">
                  Accept & Next
                </Button>
              )}
              <Button variant="glass" size="lg" onClick={handleReset} className="w-48" disabled={!currentStory}>
                Reset Round
              </Button>
            </div>
          </GlassCard>

          {/* Participants sidebar */}
          <GlassCard padding="none" className="flex flex-col overflow-hidden animate-fade-in" style={{ animationDelay: '80ms' } as React.CSSProperties}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-on-surface">Team</h3>
              <Badge variant="primary">{votedCount}/{totalCount}</Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {participants.length === 0 ? (
                <p className="text-xs text-on-surface-variant/40 text-center py-4">Waiting for participants…</p>
              ) : (
                participants.map(p => (
                  <ParticipantCard key={p.memberId} p={p} revealed={revealed} votes={votes} />
                ))
              )}
            </div>

            {/* Stories queue */}
            <div className="border-t border-white/5 p-3">
              <p className="text-label-caps text-on-surface-variant/40 text-[10px] mb-2">Stories Queue</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {stories.length === 0 ? (
                  <p className="text-xs text-on-surface-variant/30 text-center py-2">No stories added yet</p>
                ) : stories.map((s, idx) => (
                  <button key={s.id} onClick={() => navigateStory(idx)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-all ${
                      s.id === session.current_story_id
                        ? 'bg-primary/15 border border-primary/20 text-primary'
                        : 'text-on-surface-variant/60 hover:bg-white/5'
                    }`}>
                    <span className="truncate block">{s.title}</span>
                    {s.estimate && <span className="float-right font-mono font-bold text-secondary">{s.estimate}</span>}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Voting deck */}
        <GlassCard padding="none" className="relative overflow-hidden animate-fade-in" style={{ animationDelay: '120ms' } as React.CSSProperties}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-label-caps text-on-surface-variant/40 text-[10px]">{session.scale.toUpperCase()} DECK</span>
              {myVote && (
                <button onClick={() => setMyVote(null)} className="text-xs text-on-surface-variant/40 hover:text-primary transition-colors">
                  Clear selection
                </button>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {deck.map((val: string) => (
                <VotingCard key={val} value={val} selected={myVote === val}
                  onClick={() => handleVote(val)} />
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Members" size="md">
        <div className="space-y-4">
          <div>
            <p className="text-label-caps text-on-surface-variant/50 mb-2">Session Link</p>
            <div className="glass-card rounded-xl p-3 border-white/8 flex items-center gap-2">
              <span className="text-xs text-on-surface-variant/60 flex-1 truncate font-mono">
                {typeof window !== 'undefined' ? `${window.location.origin}/planning-poker/${sessionId}` : ''}
              </span>
              <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/planning-poker/${sessionId}`)}
                className="shrink-0 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant/40 text-center">Anyone in your organization can join by navigating to this link.</p>
        </div>
      </Modal>

      {/* Add Story Modal */}
      <Modal open={addStoryOpen} onClose={() => setAddStoryOpen(false)} title="Add Story" size="sm">
        <div className="space-y-4">
          <Input label="Story Title" placeholder="As a user, I want to…"
            value={newStoryTitle} onChange={e => setNewStoryTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddStory()} />
          <Button variant="primary" className="w-full" icon="add"
            disabled={!newStoryTitle.trim()} onClick={handleAddStory}>
            Add Story
          </Button>
        </div>
      </Modal>

      {/* End Session Modal */}
      <Modal open={endConfirmOpen} onClose={() => setEndConfirmOpen(false)} title="End Session?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">This will close the session for all participants.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEndConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" icon="stop_circle" onClick={handleEnd}>End Session</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

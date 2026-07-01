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
      className={`poker-card w-12 md:w-14 h-16 md:h-20 rounded-lg font-bold text-lg md:text-xl flex items-center justify-center border shadow-sm transition-all ${
        selected ? 'selected bg-primary/20 border-primary text-white ring-2 ring-primary/20 scale-105'
          : 'bg-surface-container-high border-white/5 text-on-surface hover:border-primary/50 hover:bg-surface-container-highest hover:scale-105'
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
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
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

  // Sort votes highest → lowest for reveal display; highlight min/max
  const sortedVotes = revealed
    ? [...votes].sort((a, b) => {
        const na = parseFloat(a.vote), nb = parseFloat(b.vote)
        if (isNaN(na) && isNaN(nb)) return 0
        if (isNaN(na)) return 1
        if (isNaN(nb)) return -1
        return nb - na
      })
    : votes
  const numericVals = votes.map(v => parseFloat(v.vote)).filter(n => !isNaN(n))
  const maxVal = numericVals.length ? Math.max(...numericVals) : null
  const minVal = numericVals.length && numericVals.length > 1 ? Math.min(...numericVals) : null

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
    setAiPrompt('')
    setAiError('')
    setAddStoryOpen(false)
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/ai/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiPrompt.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setNewStoryTitle(data.story)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI generation failed')
    } finally {
      setAiLoading(false)
    }
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
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-col h-full p-4 lg:p-6 gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shrink-0">
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

        {/* Main 3-column grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-4 min-h-0">

          {/* LEFT: Story Queue */}
          <GlassCard padding="none" className="flex flex-col overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-on-surface text-sm">Stories</h3>
              <Badge variant="glass">{stories.length}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {stories.length === 0 ? (
                <p className="text-xs text-on-surface-variant/30 text-center py-4">No stories added yet</p>
              ) : stories.map((s, idx) => (
                <button key={s.id} onClick={() => navigateStory(idx)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all ${
                    s.id === session.current_story_id
                      ? 'bg-primary/15 border border-primary/20 text-primary'
                      : s.estimate
                        ? 'text-on-surface-variant/40 hover:bg-white/5'
                        : 'text-on-surface-variant/70 hover:bg-white/5'
                  }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate flex-1">{s.title}</span>
                    {s.estimate
                      ? <span className="font-mono font-bold text-secondary shrink-0">{s.estimate}</span>
                      : s.id === session.current_story_id
                        ? <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                        : null
                    }
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-white/5 shrink-0">
              <button onClick={() => setAddStoryOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-primary/70 hover:text-primary hover:bg-primary/5 transition-all border border-dashed border-primary/20">
                <span className="material-symbols-outlined text-[14px]">add</span>
                Add Story
              </button>
            </div>
          </GlassCard>

          {/* CENTER: Voting stage */}
          <GlassCard padding="none" className="flex flex-col overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

            {/* Story title */}
            <div className="p-5 border-b border-white/5 shrink-0 relative z-10">
              {currentStory ? (
                <div className="flex items-center gap-2">
                  <button className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30 shrink-0"
                    disabled={currentStoryIdx <= 0} onClick={() => navigateStory(currentStoryIdx - 1)}>
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <div className="flex-1 text-center min-w-0">
                    <p className="text-label-caps text-on-surface-variant/40 text-[10px] mb-1">
                      Story {currentStoryIdx + 1} of {stories.length}
                    </p>
                    <h2 className="text-lg font-bold text-on-surface truncate">{currentStory.title}</h2>
                    {currentStory.description && (
                      <p className="text-on-surface-variant text-xs mt-1 opacity-70 line-clamp-2">{currentStory.description}</p>
                    )}
                  </div>
                  <button className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30 shrink-0"
                    disabled={currentStoryIdx >= stories.length - 1} onClick={() => navigateStory(currentStoryIdx + 1)}>
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              ) : (
                <div className="text-center text-on-surface-variant/40">
                  <p className="text-sm">No stories yet. Add a story to begin estimating.</p>
                </div>
              )}
            </div>

            {/* Card reveal area */}
            <div className="flex-1 flex items-center justify-center px-4 py-3 overflow-y-auto relative z-10">
              {revealed ? (
                /* Side-by-side: consensus left, individual votes right */
                <div className="flex items-center gap-6 w-full justify-center flex-wrap">
                  {/* Consensus */}
                  <div className="relative shrink-0">
                    <div className="absolute -inset-4 bg-primary/15 rounded-full blur-2xl" />
                    <div className="relative w-28 h-36 glass-modal rounded-xl border border-primary/30 flex flex-col items-center justify-center gap-1 shadow-lg">
                      <span className="text-5xl font-black gradient-purple-text">{modeVote ?? '?'}</span>
                      <span className="text-[9px] text-on-surface-variant/50 font-bold tracking-widest uppercase">Consensus</span>
                    </div>
                    {avgVote !== null && modeVote !== String(avgVote) && (
                      <p className="text-[10px] text-on-surface-variant/50 text-center mt-1.5">
                        Avg <span className="text-secondary font-bold">{avgVote}</span>
                      </p>
                    )}
                  </div>

                  <div className="h-16 w-px bg-white/5 hidden sm:block" />

                  {/* Sorted votes — highest first */}
                  <div className="flex gap-2 flex-wrap justify-center">
                    {sortedVotes.map(v => {
                      const p = participants.find(pp => pp.memberId === v.member_id)
                      const numVal = parseFloat(v.vote)
                      const isHigh = !isNaN(numVal) && numVal === maxVal
                      const isLow = !isNaN(numVal) && numVal === minVal
                      return (
                        <div key={v.member_id} className="text-center">
                          <div className={`w-10 h-14 rounded-lg flex items-center justify-center font-bold text-sm mb-1 border ${
                            isHigh
                              ? 'bg-green-500/20 border-green-500/40 text-green-400'
                              : isLow
                                ? 'bg-error/20 border-error/40 text-error'
                                : 'gradient-brand text-white border-transparent'
                          }`}>
                            {v.vote}
                          </div>
                          <p className="text-[9px] text-on-surface-variant/50 font-bold">{MemberInitials(p?.name ?? v.member_id)}</p>
                          {isHigh && <span className="text-[8px] text-green-400 font-bold block">HIGH</span>}
                          {isLow && <span className="text-[8px] text-error font-bold block">LOW</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                  <div className="relative w-28 h-40 glass-modal rounded-2xl border border-white/20 flex flex-col items-center justify-center gap-2 shadow-lg">
                    {myVote ? (
                      <>
                        <span className="text-5xl font-black gradient-purple-text">{myVote}</span>
                        <span className="text-[10px] text-on-surface-variant/50 font-bold tracking-widest uppercase">Your Vote</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-on-surface-variant/20 text-[40px]">casino</span>
                        <span className="text-[10px] text-on-surface-variant/30 font-bold tracking-widest uppercase">Pick a card</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Controls — session creator / admin only */}
            <div className="px-4 py-3 border-t border-white/5 flex justify-center gap-2 shrink-0 relative z-10">
              {isAdmin ? (
                <>
                  {!revealed ? (
                    <Button variant="primary" size="sm" onClick={handleReveal}
                      disabled={votedCount === 0 || !currentStory} className="neon-glow-purple px-6">
                      Reveal Votes
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={handleAcceptStory}
                      disabled={!currentStory} className="neon-glow-purple px-6" icon="check">
                      Accept & Next
                    </Button>
                  )}
                  <Button variant="glass" size="sm" onClick={handleReset}
                    disabled={!currentStory} className="px-6">
                    Reset Round
                  </Button>
                </>
              ) : (
                <p className="text-xs text-on-surface-variant/40 py-1">
                  Waiting for the host to reveal…
                </p>
              )}
            </div>
          </GlassCard>

          {/* RIGHT: Team */}
          <GlassCard padding="none" className="flex flex-col overflow-hidden animate-fade-in" style={{ animationDelay: '80ms' } as React.CSSProperties}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-on-surface text-sm">Team</h3>
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
          </GlassCard>
        </div>

        {/* Voting deck */}
        <GlassCard padding="none" className="relative overflow-hidden shrink-0 animate-fade-in" style={{ animationDelay: '120ms' } as React.CSSProperties}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="p-3 lg:p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-caps text-on-surface-variant/40 text-[10px]">{session.scale.toUpperCase()} DECK</span>
              {myVote && (
                <button onClick={() => setMyVote(null)} className="text-xs text-on-surface-variant/40 hover:text-primary transition-colors">
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
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
      <Modal open={addStoryOpen} onClose={() => { setAddStoryOpen(false); setAiPrompt(''); setAiError('') }} title="Add Story" size="sm">
        <div className="space-y-4">
          {/* AI generator */}
          <div className="glass-card rounded-xl border-white/8 p-3 space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-[15px] text-primary">auto_awesome</span>
              <p className="text-xs font-semibold text-primary">Generate with AI</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. user login with Google"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                className="glass-input flex-1 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30"
              />
              <button
                onClick={handleAiGenerate}
                disabled={!aiPrompt.trim() || aiLoading}
                className="px-3 py-2 rounded-lg bg-primary/15 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/25 transition-all disabled:opacity-40 shrink-0 flex items-center gap-1"
              >
                {aiLoading
                  ? <span className="w-3.5 h-3.5 border border-primary/40 border-t-primary rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-[14px]">send</span>
                }
              </button>
            </div>
            {aiError && <p className="text-[11px] text-error">{aiError}</p>}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] text-on-surface-variant/30">or write manually</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

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

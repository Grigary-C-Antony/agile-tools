'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useSocket } from '@/hooks/useSocket'
import { MOCK_POKER_SESSION } from '@/lib/mock-data'
import { calcModeVote, calcAverageVote } from '@/lib/utils'
import { FIBONACCI_DECK, TSHIRT_DECK } from '@/lib/types'
import type { PlanningPokerSession, Participant } from '@/lib/types'

// Current user (would come from auth context in production)
const CURRENT_USER_ID = 'u1'

function ParticipantCard({ participant, revealed, votes }: {
  participant: Participant
  revealed: boolean
  votes: Record<string, string | number>
}) {
  const vote = votes[participant.userId]
  const hasVoted = participant.hasVoted || !!vote

  return (
    <div className={[
      'flex items-center justify-between p-4 rounded-2xl border transition-all group',
      hasVoted
        ? 'bg-surface-container/40 border-white/5 hover:border-primary/20'
        : 'bg-surface-container/20 border-white/5 opacity-50 grayscale'
    ].join(' ')}>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {participant.avatar ? (
            <Image
              src={participant.avatar}
              alt={participant.name}
              width={40}
              height={40}
              className={`w-11 h-11 rounded-full object-cover border-2 ${hasVoted ? 'border-primary/40' : 'border-white/10'}`}
            />
          ) : (
            <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-sm font-bold ${hasVoted ? 'border-primary/40 bg-primary/20 text-primary' : 'border-white/10 bg-surface-container-highest text-on-surface-variant'}`}>
              {participant.initials}
            </div>
          )}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${participant.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{participant.name}</p>
          <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider font-bold">{participant.title}</p>
        </div>
      </div>

      <div>
        {revealed && vote ? (
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center font-bold text-white shadow-lg neon-glow-purple">
            {vote}
          </div>
        ) : hasVoted ? (
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[16px] font-bold">check</span>
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_rgba(205,205,0,0.4)]" />
          </div>
        )}
      </div>
    </div>
  )
}

function VotingCard({ value, selected, onClick }: { value: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`poker-card w-12 md:w-16 h-16 md:h-24 rounded-xl font-bold text-xl md:text-2xl flex items-center justify-center border shadow-lg ${
        selected
          ? 'selected bg-primary/20 border-primary text-white ring-4 ring-primary/10'
          : 'bg-surface-container-high border-white/5 text-on-surface hover:border-primary/50 hover:bg-surface-container-highest'
      }`}
    >
      {value}
    </button>
  )
}

function InviteModal({ open, onClose, session }: { open: boolean; onClose: () => void; session: PlanningPokerSession }) {
  const [copied, setCopied] = useState(false)
  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/planning-poker/${session.id}`

  const copy = () => {
    navigator.clipboard.writeText(session.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite Team Members" size="md">
      <div className="space-y-4">
        <div>
          <p className="text-label-caps text-on-surface-variant/50 mb-2">Session Code</p>
          <div className="glass-card rounded-xl p-4 border-white/8 flex items-center justify-between">
            <span className="font-mono text-2xl font-bold text-primary tracking-widest">{session.inviteCode}</span>
            <button onClick={copy} className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <div>
          <p className="text-label-caps text-on-surface-variant/50 mb-2">Invite Link</p>
          <div className="glass-card rounded-xl p-3 border-white/8 flex items-center gap-2">
            <span className="text-xs text-on-surface-variant/60 flex-1 truncate font-mono">{link}</span>
            <button onClick={() => navigator.clipboard.writeText(link)} className="shrink-0 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">link</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-on-surface-variant/40 text-center">
          Anyone with this code or link can join the session
        </p>
      </div>
    </Modal>
  )
}

export default function PlanningPokerSessionPage() {
  const [session, setSession] = useState<PlanningPokerSession>(MOCK_POKER_SESSION)
  const [myVote, setMyVote] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [endConfirmOpen, setEndConfirmOpen] = useState(false)
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0)

  const story = session.currentStory

  // Socket integration
  const handleVoteCast = useCallback((userId: string, hasVoted: boolean) => {
    setSession(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.userId === userId ? { ...p, hasVoted } : p
      )
    }))
  }, [])

  const handleVotesRevealed = useCallback((votes: Record<string, string | number>) => {
    setSession(prev => ({
      ...prev,
      currentStory: prev.currentStory ? { ...prev.currentStory, votes } : null,
    }))
    setRevealed(true)
  }, [])

  const handleSessionReset = useCallback(() => {
    setRevealed(false)
    setMyVote(null)
    setSession(prev => ({
      ...prev,
      participants: prev.participants.map(p => ({ ...p, hasVoted: false, vote: undefined })),
      currentStory: prev.currentStory ? { ...prev.currentStory, votes: {} } : null,
    }))
  }, [])

  const { emit } = useSocket({
    sessionId: session.id,
    onVoteCast: handleVoteCast,
    onVotesRevealed: handleVotesRevealed,
    onSessionReset: handleSessionReset,
  })

  const deck = session.scale === 'tshirt' ? TSHIRT_DECK : FIBONACCI_DECK
  const votes = story?.votes ?? {}
  const votedCount = session.participants.filter(p => p.hasVoted || !!votes[p.userId]).length
  const totalCount = session.participants.filter(p => !p.isObserver).length

  const modeVote = revealed ? calcModeVote(votes) : null
  const avgVote = revealed ? calcAverageVote(votes) : null

  const handleCastVote = (val: string) => {
    setMyVote(val === myVote ? null : val)
    const newVote = val === myVote ? undefined : val
    setSession(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.userId === CURRENT_USER_ID ? { ...p, hasVoted: !!newVote, vote: newVote } : p
      ),
      currentStory: prev.currentStory
        ? { ...prev.currentStory, votes: newVote
            ? { ...prev.currentStory.votes, [CURRENT_USER_ID]: newVote }
            : Object.fromEntries(Object.entries(prev.currentStory.votes).filter(([k]) => k !== CURRENT_USER_ID))
          }
        : null
    }))
    emit('session:vote', { sessionId: session.id, userId: CURRENT_USER_ID, vote: newVote })
  }

  const handleReveal = () => {
    setRevealed(true)
    emit('session:reveal', { sessionId: session.id })
  }

  const handleReset = () => {
    setRevealed(false)
    setMyVote(null)
    setSession(prev => ({
      ...prev,
      participants: prev.participants.map(p => ({ ...p, hasVoted: false, vote: undefined })),
      currentStory: prev.currentStory ? { ...prev.currentStory, votes: {} } : null,
    }))
    emit('session:reset', { sessionId: session.id })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Deep overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at top center, rgba(99,102,241,0.07) 0%, transparent 65%)'
      }} />

      <div className="relative z-10 flex flex-col h-full p-4 lg:p-6 gap-4">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/planning-poker" className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </Link>
              <h1 className="text-display-md text-on-surface tracking-tight">{session.name}</h1>
            </div>
            <div className="flex items-center gap-3 text-sm text-on-surface-variant ml-7">
              {story?.ticketId && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">tag</span>
                  {story.ticketId}
                </span>
              )}
              <Badge variant="tertiary" dot>In Progress</Badge>
              <Badge variant="primary">
                {session.scale}
              </Badge>
              <span className="text-on-surface-variant/40">{votedCount}/{totalCount} voted</span>
            </div>
          </div>
          <div className="flex gap-2 ml-7 sm:ml-0">
            <Button variant="glass" icon="share" size="sm" onClick={() => setInviteOpen(true)}>
              Invite
            </Button>
            <Button variant="danger" icon="stop_circle" size="sm" onClick={() => setEndConfirmOpen(true)}>
              End Session
            </Button>
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
          {/* Center stage */}
          <GlassCard padding="lg" className="lg:col-span-3 flex flex-col overflow-hidden animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent pointer-events-none" />

            {/* Story info */}
            <div className="text-center mb-auto pt-2 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <button
                  className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"
                  disabled={currentStoryIdx === 0}
                  onClick={() => setCurrentStoryIdx(i => i - 1)}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <div>
                  <p className="text-label-caps text-on-surface-variant/40 text-[10px] mb-1">
                    Story {currentStoryIdx + 1} of {session.stories.length}
                  </p>
                  <h2 className="text-xl font-bold text-on-surface tracking-tight">{story?.title}</h2>
                  <p className="text-on-surface-variant text-sm mt-1 max-w-xl mx-auto opacity-70 leading-relaxed">
                    {story?.description}
                  </p>
                </div>
                <button
                  className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"
                  disabled={currentStoryIdx >= session.stories.length - 1}
                  onClick={() => setCurrentStoryIdx(i => i + 1)}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
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
                    <p className="text-sm text-on-surface-variant">
                      Average: <span className="font-bold text-secondary">{avgVote}</span>
                    </p>
                  )}
                  {/* All votes */}
                  <div className="flex justify-center gap-3 mt-4">
                    {Object.entries(votes).map(([userId, vote]) => {
                      const p = session.participants.find(p => p.userId === userId)
                      return (
                        <div key={userId} className="text-center">
                          <div className="w-12 h-16 rounded-xl gradient-brand flex items-center justify-center font-bold text-white text-lg mb-1 neon-glow-purple">
                            {vote}
                          </div>
                          <p className="text-[10px] text-on-surface-variant/50 font-bold">{p?.initials ?? userId}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -inset-10 bg-primary/15 rounded-full blur-3xl animate-pulse" />
                  <div className="relative w-36 h-52 glass-modal rounded-2xl border border-white/20 flex flex-col items-center justify-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform">
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
            <div className="flex justify-center gap-4 pb-2 relative z-10">
              <Button
                variant="primary"
                size="lg"
                onClick={handleReveal}
                disabled={revealed || votedCount === 0}
                className="w-48 neon-glow-purple"
              >
                Reveal Votes
              </Button>
              <Button variant="glass" size="lg" onClick={handleReset} className="w-48">
                Reset Session
              </Button>
            </div>
          </GlassCard>

          {/* Participants sidebar */}
          <GlassCard padding="none" className="flex flex-col overflow-hidden animate-fade-in" style={{ animationDelay: '80ms' } as React.CSSProperties}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-on-surface">Team</h3>
              <Badge variant="primary">{votedCount}/{totalCount} Voted</Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {session.participants.map(participant => (
                <ParticipantCard
                  key={participant.userId}
                  participant={participant}
                  revealed={revealed}
                  votes={votes}
                />
              ))}
            </div>

            {/* Stories list */}
            <div className="border-t border-white/5 p-3">
              <p className="text-label-caps text-on-surface-variant/40 text-[10px] mb-2">Stories Queue</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {session.stories.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStoryIdx(idx)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-all ${
                      idx === currentStoryIdx
                        ? 'bg-primary/15 border border-primary/20 text-primary'
                        : 'text-on-surface-variant/60 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold mr-2">{s.ticketId}</span>
                    <span className="truncate">{s.title}</span>
                    {s.finalEstimate && (
                      <span className="ml-auto float-right font-mono font-bold text-secondary">{s.finalEstimate}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ── Voting Deck ── */}
        <GlassCard padding="none" className="relative overflow-hidden animate-fade-in" style={{ animationDelay: '120ms' } as React.CSSProperties}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-label-caps text-on-surface-variant/40 text-[10px]">Estimation Deck</span>
              <div className="flex gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
                {(['fibonacci', 'tshirt'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSession(prev => ({ ...prev, scale: s }))}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider ${
                      session.scale === s
                        ? 'bg-primary/20 text-primary border border-primary/20'
                        : 'text-on-surface-variant/40 hover:text-on-surface'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {deck.map((val: string) => (
                <VotingCard
                  key={val}
                  value={val}
                  selected={myVote === val}
                  onClick={() => handleCastVote(val)}
                />
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Modals */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} session={session} />

      <Modal open={endConfirmOpen} onClose={() => setEndConfirmOpen(false)} title="End Session?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">This will close the session for all participants.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEndConfirmOpen(false)}>Cancel</Button>
            <Link href="/planning-poker" className="flex-1">
              <Button variant="danger" className="w-full" icon="stop_circle">End Session</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  )
}

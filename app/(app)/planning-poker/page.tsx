'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { MOCK_POKER_SESSION, MOCK_ORG } from '@/lib/mock-data'
import { generateInviteCode } from '@/lib/utils'
import type { EstimationScale } from '@/lib/types'

const SCALE_OPTIONS: { id: EstimationScale; label: string; values: string[] }[] = [
  { id: 'fibonacci', label: 'Fibonacci', values: ['0', '1', '2', '3', '5', '8', '13', '21', '?'] },
  { id: 'tshirt', label: 'T-Shirt', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'] },
  { id: 'powers-of-2', label: 'Powers of 2', values: ['1', '2', '4', '8', '16', '32', '?'] },
]

function CreateSessionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('Sprint 24 Estimation')
  const [scale, setScale] = useState<EstimationScale>('fibonacci')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    router.push('/planning-poker/session-001')
  }

  return (
    <Modal open={open} onClose={onClose} title="New Planning Poker Session" size="md">
      <div className="space-y-5">
        <Input
          label="Session Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Sprint 24 Estimation"
          icon="casino"
        />

        <div>
          <p className="text-label-caps text-on-surface-variant/50 mb-3">Estimation Scale</p>
          <div className="grid grid-cols-3 gap-2">
            {SCALE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setScale(opt.id)}
                className={[
                  'p-3 rounded-xl border text-sm font-semibold transition-all text-left',
                  scale === opt.id
                    ? 'bg-primary/15 border-primary/40 text-primary'
                    : 'glass-card border-white/8 text-on-surface-variant hover:border-white/15 hover:text-on-surface'
                ].join(' ')}
              >
                <p className="font-bold">{opt.label}</p>
                <p className="text-[10px] font-normal opacity-60 mt-0.5">{opt.values.slice(0, 4).join(', ')}...</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 border-white/8 space-y-2">
          <p className="text-label-caps text-on-surface-variant/50 text-[10px]">Invite Code</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold text-primary">{generateInviteCode()}</span>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
            </button>
          </div>
          <p className="text-xs text-on-surface-variant/40">Share this code with your team</p>
        </div>

        <Button variant="primary" className="w-full" loading={loading} onClick={handleCreate} icon="casino">
          Create Session
        </Button>
      </div>
    </Modal>
  )
}

function JoinSessionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 800))
    if (code.toUpperCase() === 'S24-EST' || code.toUpperCase() === 'SESSION-001') {
      router.push('/planning-poker/session-001')
    } else {
      setError('Session not found. Try: S24-EST')
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Join Session" description="Enter the session invite code." size="sm">
      <div className="space-y-4">
        <Input
          label="Invite Code"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
          placeholder="e.g. S24-EST"
          icon="key"
          error={error}
        />
        <Button variant="primary" className="w-full" loading={loading} onClick={handleJoin} disabled={!code.trim()}>
          Join Session
        </Button>
      </div>
    </Modal>
  )
}

export default function PlanningPokerLobbyPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px]">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h2 className="text-display-md text-on-surface tracking-tight">Planning Poker</h2>
          <p className="text-on-surface-variant mt-1">Real-time collaborative story point estimation for your team.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon="login" onClick={() => setJoinOpen(true)}>Join Session</Button>
          <Button variant="primary" icon="add" onClick={() => setCreateOpen(true)}>New Session</Button>
        </div>
      </div>

      {/* ── Active Session Banner ── */}
      <GlassCard topGradient neonAccent="purple" className="animate-fade-in" style={{ animationDelay: '60ms' } as React.CSSProperties}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[24px] animate-pulse-glow">sensors</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-on-surface">{MOCK_POKER_SESSION.name}</h3>
                <Badge variant="success" dot>Live</Badge>
              </div>
              <p className="text-sm text-on-surface-variant">
                {MOCK_POKER_SESSION.participants.length} participants •{' '}
                {MOCK_POKER_SESSION.participants.filter(p => p.hasVoted).length} voted •{' '}
                <span className="text-label-caps">{MOCK_POKER_SESSION.scale}</span> scale
              </p>
            </div>
          </div>
          <Link href="/planning-poker/session-001">
            <Button variant="primary" icon="arrow_forward" iconPosition="right">Rejoin Session</Button>
          </Link>
        </div>
      </GlassCard>

      {/* ── Sessions Grid ── */}
      <div>
        <h3 className="text-headline text-on-surface mb-4">Recent Sessions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {[
            { id: 'session-001', name: 'Sprint 24 Estimation', status: 'voting', stories: 4, estimated: 1, scale: 'fibonacci', participants: 4 },
            { id: 'session-002', name: 'Sprint 23 Backlog', status: 'completed', stories: 12, estimated: 12, scale: 'fibonacci', participants: 5 },
            { id: 'session-003', name: 'Epic Breakdown Q1', status: 'completed', stories: 8, estimated: 8, scale: 'tshirt', participants: 3 },
          ].map(session => (
            <Link key={session.id} href={`/planning-poker/${session.id}`}>
              <GlassCard hover padding="md" className="animate-fade-in h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">casino</span>
                  </div>
                  <Badge variant={session.status === 'voting' ? 'success' : 'glass'} dot={session.status === 'voting'}>
                    {session.status}
                  </Badge>
                </div>
                <h4 className="font-bold text-on-surface mb-1">{session.name}</h4>
                <p className="text-sm text-on-surface-variant mb-4">
                  {session.estimated}/{session.stories} stories estimated
                </p>
                <div className="flex items-center justify-between text-xs text-on-surface-variant/50">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {session.participants} participants
                  </span>
                  <span className="text-label-caps bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                    {session.scale}
                  </span>
                </div>
                <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-brand rounded-full transition-all"
                    style={{ width: `${(session.estimated / session.stories) * 100}%` }}
                  />
                </div>
              </GlassCard>
            </Link>
          ))}

          {/* Create new */}
          <button onClick={() => setCreateOpen(true)} className="group">
            <GlassCard padding="md" className="h-full border-dashed border-white/10 hover:border-primary/30 hover:bg-primary/3 transition-all cursor-pointer">
              <div className="flex flex-col items-center justify-center h-full min-h-[160px] gap-3 text-on-surface-variant/40 group-hover:text-primary transition-colors">
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">add</span>
                </div>
                <p className="text-sm font-medium">Create New Session</p>
              </div>
            </GlassCard>
          </button>
        </div>
      </div>

      {/* ── How it works ── */}
      <GlassCard padding="lg" className="animate-fade-in">
        <h3 className="text-headline text-on-surface mb-6">How Planning Poker Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', icon: 'add_circle', title: 'Create Session', desc: 'Start a new session and invite your team with a code.' },
            { step: '2', icon: 'description', title: 'Add Stories', desc: 'Import user stories or add them manually to estimate.' },
            { step: '3', icon: 'casino', title: 'Vote Secretly', desc: 'Each team member picks their estimate independently.' },
            { step: '4', icon: 'visibility', title: 'Reveal & Discuss', desc: 'Reveal all votes, discuss, and agree on a final estimate.' },
          ].map(step => (
            <div key={step.step} className="text-center">
              <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-3 neon-glow-purple">
                <span className="material-symbols-outlined text-white text-[22px]">{step.icon}</span>
              </div>
              <h4 className="font-bold text-on-surface mb-1">{step.title}</h4>
              <p className="text-sm text-on-surface-variant">{step.desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <CreateSessionModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinSessionModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  )
}

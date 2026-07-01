'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { EstimationScale } from '@/lib/types'

const SCALE_OPTIONS: { id: EstimationScale; label: string; values: string[] }[] = [
  { id: 'fibonacci', label: 'Fibonacci', values: ['0', '1', '2', '3', '5', '8', '13', '21', '?'] },
  { id: 'tshirt', label: 'T-Shirt', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'] },
  { id: 'powers-of-2', label: 'Powers of 2', values: ['1', '2', '4', '8', '16', '32', '?'] },
]

interface PokerSession {
  id: string
  name: string
  scale: string
  status: string
  created_at: number
  storyCount: number
  estimatedCount: number
  creatorName: string
}

function CreateSessionModal({ open, onClose, onCreated }: {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [scale, setScale] = useState<EstimationScale>('fibonacci')
  const [storiesText, setStoriesText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    const stories = storiesText.split('\n').filter(l => l.trim()).map(l => ({ title: l.trim() }))
    const res = await fetch('/api/poker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), scale, stories }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) onCreated(data.session.id)
  }

  return (
    <Modal open={open} onClose={onClose} title="New Planning Poker Session" size="md">
      <div className="space-y-5">
        <Input label="Session Name" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Sprint 24 Estimation" icon="casino" />

        <div>
          <p className="text-label-caps text-on-surface-variant/50 mb-3">Estimation Scale</p>
          <div className="grid grid-cols-3 gap-2">
            {SCALE_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setScale(opt.id)}
                className={['p-3 rounded-xl border text-sm font-semibold transition-all text-left',
                  scale === opt.id ? 'bg-primary/15 border-primary/40 text-primary' : 'glass-card border-white/8 text-on-surface-variant hover:border-white/15'
                ].join(' ')}>
                <p className="font-bold">{opt.label}</p>
                <p className="text-[10px] font-normal opacity-60 mt-0.5">{opt.values.slice(0, 4).join(', ')}…</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-label-caps text-on-surface-variant/50 mb-2">Stories (optional)</p>
          <Textarea
            placeholder={'User story 1\nUser story 2\nUser story 3'}
            value={storiesText}
            onChange={e => setStoriesText(e.target.value)}
            rows={4}
            hint="One story per line. You can also add stories after creating the session."
          />
        </div>

        <Button variant="primary" className="w-full" icon="add" loading={loading}
          disabled={!name.trim() || loading} onClick={handleCreate}>
          Create Session
        </Button>
      </div>
    </Modal>
  )
}

export default function PlanningPokerPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<PokerSession[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const fetchSessions = () => {
    fetch('/api/poker').then(r => r.json()).then(d => {
      setSessions(d.sessions ?? [])
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchSessions()
    window.addEventListener('focus', fetchSessions)
    return () => window.removeEventListener('focus', fetchSessions)
  }, [])

  const activeSessions = sessions.filter(s => s.status !== 'completed')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h2 className="text-display-md text-on-surface tracking-tight">Planning Poker</h2>
          <p className="text-on-surface-variant mt-1">Real-time collaborative story point estimation for your team.</p>
        </div>
        <Button variant="primary" icon="add" onClick={() => setCreateOpen(true)}>
          New Session
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassCard key={i} padding="md" className="animate-pulse"><div className="h-32 bg-white/5 rounded-lg" /></GlassCard>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <GlassCard padding="lg" topGradient className="text-center animate-fade-in">
          <span className="material-symbols-outlined text-[56px] text-on-surface-variant/20 mb-4 block">casino</span>
          <h3 className="text-lg font-bold text-on-surface mb-2">No sessions yet</h3>
          <p className="text-on-surface-variant/60 text-sm mb-6">Create your first planning poker session to get started.</p>
          <Button variant="primary" icon="add" onClick={() => setCreateOpen(true)}>Create First Session</Button>
        </GlassCard>
      ) : (
        <>
          {activeSessions.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Active Sessions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSessions.map(s => (
                  <Link key={s.id} href={`/planning-poker/${s.id}`}>
                    <GlassCard hover padding="md" topGradient neonAccent="purple" className="h-full group animate-fade-in">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-[22px]">casino</span>
                        </div>
                        <Badge variant="tertiary" dot>Voting</Badge>
                      </div>
                      <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors mb-1">{s.name}</h4>
                      <p className="text-xs text-on-surface-variant/50 mb-3">
                        by {s.creatorName} · {s.scale}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant/40">{s.estimatedCount}/{s.storyCount} stories</span>
                        <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full gradient-brand rounded-full"
                            style={{ width: s.storyCount ? `${(s.estimatedCount / s.storyCount) * 100}%` : '0%' }} />
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {completedSessions.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-on-surface mb-4 text-on-surface-variant/60">Completed Sessions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedSessions.map(s => (
                  <Link key={s.id} href={`/planning-poker/${s.id}`}>
                    <GlassCard hover padding="md" className="h-full group opacity-70 hover:opacity-100 animate-fade-in">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant text-[22px]">casino</span>
                        </div>
                        <Badge variant="glass">Completed</Badge>
                      </div>
                      <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors mb-1">{s.name}</h4>
                      <p className="text-xs text-on-surface-variant/50">
                        by {s.creatorName} · {s.storyCount} stories estimated
                      </p>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <CreateSessionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={id => { setCreateOpen(false); router.push(`/planning-poker/${id}`) }}
      />
    </div>
  )
}

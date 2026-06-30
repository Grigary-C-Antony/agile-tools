'use client'

import { useState, useRef, type KeyboardEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

// OTP-style code input
function CodeInput({ length = 4, value = '', onChange }: {
  length?: number
  value?: string
  onChange: (val: string) => void
}) {
  const chars = value.split('').concat(Array(length).fill('')).slice(0, length)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleInput = (idx: number, char: string) => {
    const next = chars.map((c, i) => (i === idx ? char.toUpperCase().slice(-1) : c))
    onChange(next.join(''))
    if (char && idx < length - 1) refs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[idx] && idx > 0) refs.current[idx - 1]?.focus()
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus()
    if (e.key === 'ArrowRight' && idx < length - 1) refs.current[idx + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, length)
    onChange(text.padEnd(length, ''))
    refs.current[Math.min(text.length, length - 1)]?.focus()
  }

  return (
    <div className="flex gap-2">
      {chars.map((char, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          maxLength={1}
          value={char}
          onChange={e => handleInput(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={[
            'w-12 h-14 text-center text-xl font-bold rounded-xl font-mono',
            'glass-input text-on-surface',
            'focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all',
            char ? 'border-primary/30 text-primary' : '',
          ].join(' ')}
          aria-label={`Code character ${i + 1}`}
        />
      ))}
    </div>
  )
}

// Create Org Modal
function CreateOrgModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim() || !adminName.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), adminName: adminName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      setDone(data.inviteCode)
    } catch {
      setError('Something went wrong')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <Modal open={open} onClose={() => { setDone(null); onClose() }} title="Organization Created!" size="md">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto neon-glow-purple">
            <span className="material-symbols-outlined text-white text-3xl icon-fill">check_circle</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm mb-2">Your invite code</p>
            <div className="glass-card rounded-xl px-6 py-4 inline-block">
              <span className="font-mono text-2xl font-bold text-primary tracking-widest">{done}</span>
            </div>
            <p className="text-on-surface-variant/60 text-xs mt-2">Share this code with your team members</p>
          </div>
          <Button variant="primary" className="w-full" icon="arrow_forward" iconPosition="right"
            onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Organization" description="Set up your team workspace." size="md">
      <div className="space-y-4">
        <Input label="Organization Name" placeholder="e.g. Acme Corp Engineering"
          value={name} onChange={e => setName(e.target.value)} icon="business" required />
        <Input label="Your Name" placeholder="e.g. Jane Doe"
          value={adminName} onChange={e => setAdminName(e.target.value)} icon="person" required />
        {error && <p className="text-xs text-error">{error}</p>}
        <p className="text-xs text-on-surface-variant/50 bg-white/3 rounded-lg p-3 border border-white/5">
          <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-primary">shield</span>
          You will be the organization admin. New members need your approval before joining.
        </p>
        <Button variant="primary" className="w-full" loading={loading}
          onClick={handleCreate} disabled={!name.trim() || !adminName.trim()}>
          Create Organization
        </Button>
      </div>
    </Modal>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [part1, setPart1] = useState('')
  const [part2, setPart2] = useState('')
  const [joinName, setJoinName] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const isCodeComplete = part1.length === 4 && part2.length === 3

  const handleJoin = async () => {
    if (!isCodeComplete || !joinName.trim()) return
    setJoining(true)
    setJoinError('')
    try {
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: `${part1}-${part2}`, name: joinName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error); setJoining(false); return }
      router.push('/dashboard')
    } catch {
      setJoinError('Something went wrong. Please try again.')
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 md:px-10 py-20">
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ── Left: Branding ── */}
          <div className="flex flex-col gap-8 items-center lg:items-start text-center lg:text-left animate-fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 glass-card px-3 py-1.5 rounded-full border-white/8">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-label-caps text-green-400 text-[10px]">Now in Beta</span>
              </div>
              <h1 className="text-display-xl text-on-surface leading-tight">
                <span>Agile</span>
                <span className="gradient-brand-text"> Toolkit</span>
              </h1>
              <p className="text-base text-on-surface-variant max-w-md leading-relaxed">
                Smart tools for modern agile teams. Plan, estimate, prioritize and improve — all in one premium workspace.
              </p>
            </div>

            <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden border border-white/8 glass-card group animate-float">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtrkEULnVShe0oALSICwHVgXdiha-ynMjmfvX9VqqLtMWL_o3T8gK-AYdSMfeeremO1yuMMCVO6Ef5KIRpadkQ4ibiRgK6Z5piucID_HFBeFlRTgP9AAVq9SU3_ig8N8kl1CHWxNtlZRjCu8gqrrfQjPlNqP8sJ4Vcwfs8BSFfXGs2Y7yAPXdtfwCbcrhrZfKDSHr7ce6ydS-mRkUS7hFGmXo9na7dNjc4oRFh6l6UsaMsg1tes-up_LjnRp0dpXETmTlkVW00j78"
                alt="Agile Toolkit"
                fill
                className="object-cover mix-blend-screen opacity-80 group-hover:opacity-100 transition-opacity duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              {[
                { icon: 'casino', label: 'Planning Poker' },
                { icon: 'leaderboard', label: 'WSJF & RICE' },
                { icon: 'speed', label: 'Sprint Tools' },
                { icon: 'group', label: 'Team Mgmt' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-1.5 glass-card px-3 py-2 rounded-full border-white/8">
                  <span className="material-symbols-outlined text-primary text-[16px]">{f.icon}</span>
                  <span className="text-xs font-medium text-on-surface-variant">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <button
                onClick={() => setCreateOpen(true)}
                className="group flex items-center gap-2 gradient-brand text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 hover:shadow-[0_0_24px_rgba(114,60,235,0.4)] transition-all neon-glow-purple"
              >
                <span className="material-symbols-outlined text-[18px]">add_business</span>
                Create Organization
              </button>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 glass-card px-6 py-3 rounded-xl font-medium text-sm text-on-surface border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">explore</span>
                Explore Demo
              </Link>
            </div>
          </div>

          {/* ── Right: Join Card ── */}
          <div className="w-full max-w-md mx-auto animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="glass-card rounded-2xl p-8 relative overflow-hidden top-border-gradient">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

              <div className="text-center mb-8">
                <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 neon-glow-purple">
                  <span className="material-symbols-outlined text-white text-[22px] icon-fill">login</span>
                </div>
                <h2 className="text-headline text-on-surface">Join Organization</h2>
                <p className="text-sm text-on-surface-variant mt-1.5">Enter your invite code to join your team.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-label-caps text-on-surface-variant/50 text-center mb-4">Invite Code</p>
                  <div className="flex items-center justify-center gap-3">
                    <CodeInput length={4} value={part1} onChange={setPart1} />
                    <span className="text-on-surface-variant/40 text-xl font-bold">—</span>
                    <CodeInput length={3} value={part2} onChange={setPart2} />
                  </div>
                </div>

                <Input
                  placeholder="Your name"
                  value={joinName}
                  onChange={e => setJoinName(e.target.value)}
                  icon="person"
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />

                {joinError && <p className="text-center text-xs text-error">{joinError}</p>}

                <Button
                  variant="primary"
                  className="w-full py-3"
                  icon="arrow_forward"
                  iconPosition="right"
                  loading={joining}
                  disabled={!isCodeComplete || !joinName.trim() || joining}
                  onClick={handleJoin}
                >
                  Join Team
                </Button>

                <div className="relative flex items-center">
                  <div className="flex-grow h-px bg-white/8" />
                  <span className="mx-4 text-label-caps text-on-surface-variant/30 text-[10px]">OR</span>
                  <div className="flex-grow h-px bg-white/8" />
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="text-sm text-secondary hover:text-secondary/80 transition-colors font-medium"
                  >
                    Create a new organization instead →
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-on-surface-variant/40 mt-4 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">help</span>
              Need help? <a href="#" className="text-primary hover:underline ml-1">Contact Support</a>
            </p>
          </div>
        </div>
      </div>

      <CreateOrgModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

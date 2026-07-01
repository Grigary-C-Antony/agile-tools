'use client'

import { useState, useRef, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Mode = 'login' | 'create' | 'join'

// OTP-style invite code input
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

// ── Login Form ──────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      if (data.status === 'pending') router.push('/dashboard')
      else router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <Input label="Email" type="email" placeholder="you@company.com"
        value={email} onChange={e => setEmail(e.target.value)} icon="mail" required />
      <Input label="Password" type="password" placeholder="••••••••"
        value={password} onChange={e => setPassword(e.target.value)} icon="lock"
        onKeyDown={e => e.key === 'Enter' && handleSubmit()} required />
      {error && <p className="text-xs text-error text-center">{error}</p>}
      <Button variant="primary" className="w-full py-3" loading={loading}
        disabled={!email.trim() || !password || loading} onClick={handleSubmit}
        icon="arrow_forward" iconPosition="right">
        Sign In
      </Button>
      <div className="space-y-2 text-center text-sm text-on-surface-variant">
        <p>
          No account?{' '}
          <button onClick={() => onSwitch('create')} className="text-primary hover:underline font-medium">
            Create an organization
          </button>
        </p>
        <p>
          Have an invite code?{' '}
          <button onClick={() => onSwitch('join')} className="text-secondary hover:underline font-medium">
            Join a team
          </button>
        </p>
      </div>
    </div>
  )
}

// ── Create Org Form ─────────────────────────────────────────────────────────
function CreateOrgForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
  const router = useRouter()
  const [orgName, setOrgName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!orgName.trim() || !adminName.trim() || !email.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName.trim(), adminName: adminName.trim(), email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      setDone(data.inviteCode)
    } catch {
      setError('Something went wrong.')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto neon-glow-purple">
          <span className="material-symbols-outlined text-white text-3xl icon-fill">check_circle</span>
        </div>
        <div>
          <p className="text-on-surface-variant text-sm mb-2">Your team invite code</p>
          <div className="glass-card rounded-xl px-6 py-4 inline-block">
            <span className="font-mono text-2xl font-bold text-primary tracking-widest">{done}</span>
          </div>
          <p className="text-on-surface-variant/60 text-xs mt-2">Share this with your team members</p>
        </div>
        <Button variant="primary" className="w-full" icon="arrow_forward" iconPosition="right"
          onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Input label="Organization Name" placeholder="e.g. Acme Corp Engineering"
        value={orgName} onChange={e => setOrgName(e.target.value)} icon="business" required />
      <Input label="Your Name" placeholder="e.g. Jane Doe"
        value={adminName} onChange={e => setAdminName(e.target.value)} icon="person" required />
      <Input label="Email" type="email" placeholder="you@company.com"
        value={email} onChange={e => setEmail(e.target.value)} icon="mail" required />
      <Input label="Password" type="password" placeholder="At least 8 characters"
        value={password} onChange={e => setPassword(e.target.value)} icon="lock"
        hint="Minimum 8 characters" required />
      {error && <p className="text-xs text-error">{error}</p>}
      <p className="text-xs text-on-surface-variant/50 bg-white/3 rounded-lg p-3 border border-white/5">
        <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-primary">shield</span>
        You will be the organization admin. New members need your approval before joining.
      </p>
      <Button variant="primary" className="w-full" loading={loading} onClick={handleCreate}
        disabled={!orgName.trim() || !adminName.trim() || !email.trim() || !password || loading}>
        Create Organization
      </Button>
      <p className="text-center text-sm text-on-surface-variant">
        Already have an account?{' '}
        <button onClick={() => onSwitch('login')} className="text-primary hover:underline font-medium">
          Sign in
        </button>
      </p>
    </div>
  )
}

// ── Join Org Form ───────────────────────────────────────────────────────────
function JoinOrgForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
  const router = useRouter()
  const [part1, setPart1] = useState('')
  const [part2, setPart2] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const codeComplete = part1.length === 4 && part2.length === 3

  const handleJoin = async () => {
    if (!codeComplete || !name.trim() || !email.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: `${part1}-${part2}`, name: name.trim(), email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }
      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-label-caps text-on-surface-variant/50 text-center mb-3">Invite Code</p>
        <div className="flex items-center justify-center gap-3">
          <CodeInput length={4} value={part1} onChange={setPart1} />
          <span className="text-on-surface-variant/40 text-xl font-bold">—</span>
          <CodeInput length={3} value={part2} onChange={setPart2} />
        </div>
      </div>
      <Input label="Your Name" placeholder="e.g. Jane Doe"
        value={name} onChange={e => setName(e.target.value)} icon="person" required />
      <Input label="Email" type="email" placeholder="you@company.com"
        value={email} onChange={e => setEmail(e.target.value)} icon="mail" required />
      <Input label="Password" type="password" placeholder="At least 8 characters"
        value={password} onChange={e => setPassword(e.target.value)} icon="lock"
        hint="Minimum 8 characters"
        onKeyDown={e => e.key === 'Enter' && handleJoin()} required />
      {error && <p className="text-xs text-error text-center">{error}</p>}
      <Button variant="primary" className="w-full py-3" loading={loading}
        disabled={!codeComplete || !name.trim() || !email.trim() || !password || loading}
        onClick={handleJoin} icon="arrow_forward" iconPosition="right">
        Join Team
      </Button>
      <p className="text-center text-sm text-on-surface-variant">
        Already have an account?{' '}
        <button onClick={() => onSwitch('login')} className="text-primary hover:underline font-medium">
          Sign in
        </button>
      </p>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
const MODES: { id: Mode; label: string; icon: string }[] = [
  { id: 'login', label: 'Sign In', icon: 'login' },
  { id: 'create', label: 'Create Org', icon: 'add_business' },
  { id: 'join', label: 'Join Team', icon: 'group_add' },
]

const HEADINGS: Record<Mode, { title: string; subtitle: string }> = {
  login: { title: 'Welcome back', subtitle: 'Sign in to your Agile Toolkit workspace.' },
  create: { title: 'Create Organization', subtitle: 'Set up your team workspace and become the admin.' },
  join: { title: 'Join Organization', subtitle: 'Enter your invite code to join your team.' },
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const { title, subtitle } = HEADINGS[mode]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full border-white/8 mb-4">
            <span className="material-symbols-outlined text-primary text-[18px] icon-fill">bolt</span>
            <span className="text-sm font-semibold gradient-brand-text">Agile Toolkit</span>
          </div>
          <h1 className="text-display text-on-surface">{title}</h1>
          <p className="text-sm text-on-surface-variant mt-1.5">{subtitle}</p>
        </div>

        {/* Tab switcher */}
        <div className="glass-card rounded-2xl p-1 flex gap-1 mb-6">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                mode === m.id
                  ? 'gradient-brand text-white neon-glow-purple shadow-sm'
                  : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-white/5',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[15px]">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden top-border-gradient animate-fade-in">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
          {mode === 'login' && <LoginForm onSwitch={setMode} />}
          {mode === 'create' && <CreateOrgForm onSwitch={setMode} />}
          {mode === 'join' && <JoinOrgForm onSwitch={setMode} />}
        </div>

        <p className="text-center text-xs text-on-surface-variant/40 mt-6 flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          Sessions are secured with HTTP-only cookies
        </p>
      </div>
    </div>
  )
}

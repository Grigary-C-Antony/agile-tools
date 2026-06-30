'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useSession } from '@/hooks/useSession'
import type { Member } from '@/lib/db'

function MemberAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-base' : 'w-11 h-11 text-sm'
  return (
    <div className={`${sizeClass} rounded-full gradient-brand flex items-center justify-center text-white font-bold border-2 border-white/10`}>
      {initials}
    </div>
  )
}

export default function MembersPage() {
  const { session } = useSession()
  const [active, setActive] = useState<Member[]>([])
  const [pending, setPending] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchMembers = () => {
    fetch('/api/members').then(r => r.json()).then(d => {
      setActive(d.active ?? [])
      setPending(d.pending ?? [])
      setLoading(false)
    })
  }

  useEffect(() => { fetchMembers() }, [])

  const handleApprove = async (id: string) => {
    await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })
    fetchMembers()
  }

  const handleReject = async (id: string) => {
    await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    })
    fetchMembers()
  }

  const handleRoleChange = async (id: string, role: string) => {
    await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-role', role }),
    })
    fetchMembers()
  }

  const handleRemove = async (id: string) => {
    await fetch(`/api/members/${id}`, { method: 'DELETE' })
    fetchMembers()
  }

  const copyInviteCode = () => {
    if (session?.inviteCode) {
      navigator.clipboard.writeText(session.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isAdmin = session?.role === 'admin'

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h2 className="text-display-md text-on-surface tracking-tight">Team Members</h2>
          <p className="text-on-surface-variant mt-1">Manage your organization's members, roles, and approvals.</p>
        </div>
        {isAdmin && (
          <Button variant="primary" icon="person_add" onClick={() => setInviteOpen(true)}>
            Invite Members
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: active.length, icon: 'group', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
          { label: 'Pending Approval', value: pending.length, icon: 'pending', color: 'text-secondary', bg: 'bg-secondary/10 border-secondary/20' },
          { label: 'Admins', value: active.filter(m => m.role === 'admin').length, icon: 'admin_panel_settings', color: 'text-tertiary', bg: 'bg-tertiary/10 border-tertiary/20' },
          { label: 'Online Now', value: active.length, icon: 'sensors', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
        ].map(s => (
          <GlassCard key={s.label} padding="md">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${s.bg}`}>
                <span className={`material-symbols-outlined text-[20px] ${s.color}`}>{s.icon}</span>
              </div>
              <div>
                <p className="text-label-caps text-on-surface-variant/50 text-[10px]">{s.label}</p>
                <p className="text-2xl font-bold text-on-surface">{s.value}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Pending Approvals */}
      {isAdmin && pending.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            Pending Approvals
            <Badge variant="secondary" dot>{pending.length}</Badge>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map(m => (
              <GlassCard key={m.id} padding="md" topGradient neonAccent="orange" className="animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <MemberAvatar name={m.name} size="lg" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary border-2 border-surface flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] text-on-secondary">schedule</span>
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">{m.name}</h4>
                      <p className="text-xs text-on-surface-variant/50 mt-0.5">Requested to join</p>
                    </div>
                  </div>
                  <Badge variant="secondary" dot>Pending</Badge>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-white/3 border border-white/5 text-xs text-on-surface-variant">
                  <span className="font-semibold text-on-surface">{m.name}</span> wants to join <span className="font-semibold text-on-surface">{session?.orgName}</span> as a member.
                </div>

                <div className="flex gap-3 mt-4">
                  <Button variant="danger" size="sm" className="flex-1" icon="close" onClick={() => handleReject(m.id)}>
                    Reject
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1" icon="check" onClick={() => handleApprove(m.id)}>
                    Approve
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Active Members */}
      <div>
        <h3 className="text-lg font-bold text-on-surface mb-4">
          Active Members <span className="text-on-surface-variant/40 font-normal text-base">({active.length})</span>
        </h3>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <GlassCard key={i} padding="md" className="animate-pulse"><div className="h-12 bg-white/5 rounded-lg" /></GlassCard>
            ))}
          </div>
        ) : active.length === 0 ? (
          <GlassCard padding="lg" className="text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant/20 mb-2 block">group</span>
            <p className="text-on-surface-variant/50">No active members yet</p>
          </GlassCard>
        ) : (
          <GlassCard padding="none">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-label-caps text-on-surface-variant/50 text-[10px] p-4">Member</th>
                  <th className="text-left text-label-caps text-on-surface-variant/50 text-[10px] p-4">Role</th>
                  <th className="text-left text-label-caps text-on-surface-variant/50 text-[10px] p-4">Joined</th>
                  {isAdmin && <th className="p-4" />}
                </tr>
              </thead>
              <tbody>
                {active.map((m, idx) => (
                  <tr key={m.id} className={`border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors ${idx === 0 ? '' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <MemberAvatar name={m.name} size="sm" />
                        <div>
                          <p className="font-semibold text-sm text-on-surface">{m.name}</p>
                          {m.id === session?.memberId && <span className="text-[10px] text-primary font-bold">YOU</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {isAdmin && m.id !== session?.memberId ? (
                        <select
                          value={m.role}
                          onChange={e => handleRoleChange(m.id, e.target.value)}
                          className="glass-input rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface bg-transparent cursor-pointer"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <Badge variant={m.role === 'admin' ? 'primary' : 'glass'}>
                          {m.role === 'admin' ? 'Admin' : 'Member'}
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant/50">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="p-4 text-right">
                        {m.id !== session?.memberId && (
                          <button
                            onClick={() => handleRemove(m.id)}
                            className="text-error/40 hover:text-error transition-colors"
                            title="Remove member"
                          >
                            <span className="material-symbols-outlined text-[18px]">person_remove</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Members" size="md">
        <div className="space-y-4">
          <div>
            <p className="text-label-caps text-on-surface-variant/50 mb-2">Organization Invite Code</p>
            <div className="glass-card rounded-xl p-4 border-white/8 flex items-center justify-between">
              <span className="font-mono text-2xl font-bold text-primary tracking-widest">{session?.inviteCode ?? '—'}</span>
              <button onClick={copyInviteCode} className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div>
            <p className="text-label-caps text-on-surface-variant/50 mb-2">Invite Link</p>
            <div className="glass-card rounded-xl p-3 border-white/8 flex items-center gap-2">
              <span className="text-xs text-on-surface-variant/60 flex-1 truncate font-mono">
                {typeof window !== 'undefined' ? `${window.location.origin}/?invite=${session?.inviteCode}` : ''}
              </span>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/?invite=${session?.inviteCode}`
                  navigator.clipboard.writeText(link)
                }}
                className="shrink-0 text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">link</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant/40 text-center">
            Anyone with this code can request to join. You must approve them.
          </p>
        </div>
      </Modal>
    </div>
  )
}

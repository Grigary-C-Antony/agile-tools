'use client'

import { useState } from 'react'
import Image from 'next/image'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { MOCK_USERS, MOCK_ORG } from '@/lib/mock-data'
import { getStatusColor, timeAgo, generateInviteCode } from '@/lib/utils'
import type { User, MemberStatus } from '@/lib/types'

function MemberAvatar({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-base' : 'w-11 h-11 text-sm'
  if (user.avatar) {
    return (
      <Image
        src={user.avatar}
        alt={user.name}
        width={size === 'lg' ? 56 : size === 'sm' ? 32 : 44}
        height={size === 'lg' ? 56 : size === 'sm' ? 32 : 44}
        className={`${sizeClass} rounded-full object-cover border-2 border-white/10`}
      />
    )
  }
  return (
    <div className={`${sizeClass} rounded-full gradient-brand flex items-center justify-center text-white font-bold border-2 border-white/10`}>
      {user.initials}
    </div>
  )
}

function PendingCard({ user, onApprove, onReject }: {
  user: User
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <GlassCard padding="md" topGradient neonAccent="orange" className="animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MemberAvatar user={user} size="lg" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary border-2 border-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px] text-on-secondary">schedule</span>
            </span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface">{user.name}</h4>
            <p className="text-sm text-on-surface-variant">{user.email}</p>
            <p className="text-xs text-on-surface-variant/50 mt-0.5">
              Requested {timeAgo(user.joinedAt)}
            </p>
          </div>
        </div>
        <Badge variant="secondary" dot>Pending</Badge>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-white/3 border border-white/5">
        <p className="text-xs text-on-surface-variant/60">
          <span className="font-semibold text-on-surface-variant">{user.name}</span> wants to join{' '}
          <span className="text-primary font-semibold">{MOCK_ORG.name}</span> as a member.
        </p>
      </div>

      <div className="flex gap-3 mt-4">
        <Button variant="danger" size="sm" icon="close" className="flex-1" onClick={onReject}>
          Reject
        </Button>
        <Button variant="primary" size="sm" icon="check" className="flex-1" onClick={onApprove}>
          Approve
        </Button>
      </div>
    </GlassCard>
  )
}

function MemberRow({ user, onChangeRole, onRemove }: {
  user: User
  onChangeRole: (userId: string, role: string) => void
  onRemove: (userId: string) => void
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 group transition-all">
      <div className="relative shrink-0">
        <MemberAvatar user={user} />
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-container ${getStatusColor(user.status)}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-on-surface truncate">{user.name}</p>
          {user.orgRole === 'admin' && <Badge variant="primary">Admin</Badge>}
        </div>
        <p className="text-xs text-on-surface-variant/50 mt-0.5">{user.email}</p>
      </div>

      <div className="hidden sm:flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-medium text-on-surface">{user.role}</p>
          <p className="text-[10px] text-on-surface-variant/40">Joined {timeAgo(user.joinedAt)}</p>
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <select
            value={user.orgRole}
            onChange={e => onChangeRole(user.id, e.target.value)}
            className="glass-input rounded-lg text-xs px-2 py-1.5 text-on-surface"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          {user.orgRole !== 'admin' && (
            <button
              onClick={() => onRemove(user.id)}
              className="text-error/40 hover:text-error transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[16px]">person_remove</span>
            </button>
          )}
        </div>
      </div>

      <div className="sm:hidden">
        <span className={`w-2 h-2 rounded-full ${getStatusColor(user.status)} block`} />
      </div>
    </div>
  )
}

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const code = MOCK_ORG.inviteCode
  const link = MOCK_ORG.inviteLink

  return (
    <Modal open={open} onClose={onClose} title="Invite Team Members" size="md">
      <div className="space-y-5">
        <div className="text-center p-6 glass-card rounded-2xl border-primary/15">
          <p className="text-label-caps text-on-surface-variant/40 mb-3 text-[10px]">Organization Invite Code</p>
          <p className="font-mono text-3xl font-bold text-primary tracking-[0.2em] mb-3">{code}</p>
          <Button
            variant="primary"
            size="sm"
            icon={copied ? 'check' : 'content_copy'}
            onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
        </div>

        <div>
          <p className="text-label-caps text-on-surface-variant/40 text-[10px] mb-2">Invite Link</p>
          <div className="glass-card rounded-xl p-3 border-white/8 flex items-center gap-2">
            <span className="text-xs text-on-surface-variant/50 flex-1 truncate font-mono">{link}</span>
            <button onClick={() => navigator.clipboard.writeText(link)} className="shrink-0 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">link</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant/30 text-center">
          New members will need admin approval before accessing the workspace.
        </p>
      </div>
    </Modal>
  )
}

export default function MembersPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all')

  const pendingUsers = users.filter(u => u.memberStatus === 'pending')
  const approvedUsers = users.filter(u => u.memberStatus === 'approved')
  const rejectedUsers = users.filter(u => u.memberStatus === 'rejected')

  const filteredApproved = approvedUsers.filter(u =>
    (filterStatus === 'all' || u.memberStatus === filterStatus) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  )

  const approve = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, memberStatus: 'approved' as MemberStatus } : u))
  }

  const reject = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, memberStatus: 'rejected' as MemberStatus } : u))
  }

  const changeRole = (userId: string, role: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, orgRole: role as 'admin' | 'member' | 'viewer' } : u))
  }

  const remove = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1200px]">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h2 className="text-display-md text-on-surface tracking-tight">Team Members</h2>
          <p className="text-on-surface-variant mt-1">
            Manage your organization&apos;s members, roles, and approvals.
          </p>
        </div>
        <Button variant="primary" icon="person_add" onClick={() => setInviteOpen(true)}>
          Invite Members
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {[
          { label: 'Total Members', value: approvedUsers.length, icon: 'group', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
          { label: 'Pending Approval', value: pendingUsers.length, icon: 'pending', color: 'text-secondary', bg: 'bg-secondary/10 border-secondary/20' },
          { label: 'Admins', value: approvedUsers.filter(u => u.orgRole === 'admin').length, icon: 'admin_panel_settings', color: 'text-tertiary', bg: 'bg-tertiary/10 border-tertiary/20' },
          { label: 'Online Now', value: users.filter(u => u.status === 'online').length, icon: 'sensors', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
        ].map(stat => (
          <GlassCard key={stat.label} hover padding="md" className="animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${stat.bg}`}>
                <span className={`material-symbols-outlined text-[20px] ${stat.color}`}>{stat.icon}</span>
              </div>
              <div>
                <p className="text-label-caps text-on-surface-variant/40 text-[10px]">{stat.label}</p>
                <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── Pending approvals ── */}
      {pendingUsers.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-headline text-on-surface">Pending Approvals</h3>
            <Badge variant="secondary" dot>{pendingUsers.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map(user => (
              <PendingCard
                key={user.id}
                user={user}
                onApprove={() => approve(user.id)}
                onReject={() => reject(user.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Active members ── */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-headline text-on-surface">
            Active Members
            <span className="ml-2 text-on-surface-variant/40 text-base font-normal">({approvedUsers.length})</span>
          </h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              icon="search"
              placeholder="Search members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 sm:w-64"
            />
          </div>
        </div>

        <GlassCard padding="none" className="animate-fade-in">
          <div className="p-3 space-y-1">
            {filteredApproved.map(user => (
              <MemberRow
                key={user.id}
                user={user}
                onChangeRole={changeRole}
                onRemove={remove}
              />
            ))}
            {filteredApproved.length === 0 && (
              <div className="py-8 text-center text-on-surface-variant/40">
                <span className="material-symbols-outlined text-[32px] mb-2 block">search_off</span>
                <p>No members found</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ── Rejected (collapsed) ── */}
      {rejectedUsers.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 text-sm text-on-surface-variant/50 hover:text-on-surface cursor-pointer list-none">
            <span className="material-symbols-outlined text-[16px] group-open:rotate-90 transition-transform">chevron_right</span>
            Rejected ({rejectedUsers.length})
          </summary>
          <div className="mt-3 glass-card rounded-xl p-3 border-white/5 space-y-1">
            {rejectedUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 opacity-50">
                <MemberAvatar user={user} size="sm" />
                <span className="text-sm text-on-surface-variant">{user.name}</span>
                <span className="ml-auto text-xs text-error">Rejected</span>
                <button onClick={() => approve(user.id)} className="text-xs text-primary hover:underline">Restore</button>
              </div>
            ))}
          </div>
        </details>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  )
}

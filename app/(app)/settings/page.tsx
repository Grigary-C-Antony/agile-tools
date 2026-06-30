'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea } from '@/components/ui/Input'
import { MOCK_ORG, MOCK_USERS } from '@/lib/mock-data'
import type { AppSettings } from '@/lib/types'

const currentUser = MOCK_USERS[0]

type SettingsTab = 'general' | 'org' | 'integrations' | 'notifications' | 'team'

function SettingsSection({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-on-surface">{title}</h3>
        {description && <p className="text-sm text-on-surface-variant/60 mt-1">{description}</p>}
      </div>
      <div className="glass-card rounded-2xl border-white/5 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function SettingsRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 p-5 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-on-surface">{label}</p>
        {description && <p className="text-xs text-on-surface-variant/50 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary' : 'bg-white/10'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}

function GeneralSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    language: 'en',
    notifications: {
      sessionInvites: true,
      memberRequests: true,
      sprintReminders: false,
      weeklyDigest: true,
    },
    integrations: {
      jiraEnabled: false,
      confluenceEnabled: false,
      slackEnabled: false,
    },
  })

  return (
    <div className="space-y-6">
      <SettingsSection title="Appearance" description="Customize how the application looks.">
        <SettingsRow label="Theme" description="Choose your preferred color scheme.">
          <div className="flex gap-1 glass-card p-1 rounded-xl border-white/5">
            {(['dark', 'light', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => setSettings(p => ({ ...p, theme: t }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  settings.theme === t
                    ? 'bg-white/10 text-on-surface border border-white/10'
                    : 'text-on-surface-variant/50 hover:text-on-surface'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </SettingsRow>
        <SettingsRow label="Language" description="Interface language.">
          <select
            value={settings.language}
            onChange={e => setSettings(p => ({ ...p, language: e.target.value }))}
            className="glass-input rounded-xl px-3 py-2 text-sm text-on-surface"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Notifications" description="Control what alerts you receive.">
        {[
          { key: 'sessionInvites', label: 'Planning Poker Invites', desc: 'Get notified when invited to a session' },
          { key: 'memberRequests', label: 'Member Join Requests', desc: 'Alerts for pending approvals (admins only)' },
          { key: 'sprintReminders', label: 'Sprint Reminders', desc: 'Daily reminders during active sprints' },
          { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of team velocity and metrics' },
        ].map(item => (
          <SettingsRow key={item.key} label={item.label} description={item.desc}>
            <Toggle
              checked={settings.notifications[item.key as keyof typeof settings.notifications]}
              onChange={v => setSettings(p => ({ ...p, notifications: { ...p.notifications, [item.key]: v } }))}
            />
          </SettingsRow>
        ))}
      </SettingsSection>

      <div className="flex justify-end">
        <Button variant="primary" icon="save">Save Preferences</Button>
      </div>
    </div>
  )
}

function OrgSettings() {
  const [name, setName] = useState(MOCK_ORG.name)
  const [requireApproval, setRequireApproval] = useState(MOCK_ORG.settings.requireApproval)
  const [defaultScale, setDefaultScale] = useState(MOCK_ORG.settings.defaultEstimationScale)
  const [timezone, setTimezone] = useState(MOCK_ORG.settings.timezone)
  const [workdays, setWorkdays] = useState(MOCK_ORG.settings.workdaysPerWeek)
  const [hoursDay, setHoursDay] = useState(MOCK_ORG.settings.hoursPerDay)

  return (
    <div className="space-y-6">
      <SettingsSection title="Organization Profile">
        <SettingsRow label="Organization Name">
          <Input value={name} onChange={e => setName(e.target.value)} className="w-52" />
        </SettingsRow>
        <SettingsRow label="Invite Code" description="Share with new members to join.">
          <div className="flex items-center gap-2">
            <span className="font-mono text-primary font-bold">{MOCK_ORG.inviteCode}</span>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[16px]">refresh</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Membership" description="Control who can join the organization.">
        <SettingsRow label="Require Approval" description="New members must be approved by an admin.">
          <Toggle checked={requireApproval} onChange={setRequireApproval} />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Sprint Defaults" description="Default values for sprint calculations.">
        <SettingsRow label="Default Estimation Scale">
          <select
            value={defaultScale}
            onChange={e => setDefaultScale(e.target.value as typeof defaultScale)}
            className="glass-input rounded-xl px-3 py-2 text-sm text-on-surface"
          >
            <option value="fibonacci">Fibonacci</option>
            <option value="tshirt">T-Shirt</option>
            <option value="powers-of-2">Powers of 2</option>
          </select>
        </SettingsRow>
        <SettingsRow label="Timezone">
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-sm text-on-surface"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
          </select>
        </SettingsRow>
        <SettingsRow label="Work Days per Week">
          <input
            type="number"
            min={1}
            max={7}
            value={workdays}
            onChange={e => setWorkdays(parseInt(e.target.value))}
            className="glass-input w-16 rounded-xl px-3 py-2 text-sm text-on-surface text-center"
          />
        </SettingsRow>
        <SettingsRow label="Work Hours per Day">
          <input
            type="number"
            min={1}
            max={24}
            value={hoursDay}
            onChange={e => setHoursDay(parseInt(e.target.value))}
            className="glass-input w-16 rounded-xl px-3 py-2 text-sm text-on-surface text-center"
          />
        </SettingsRow>
      </SettingsSection>

      <div className="flex justify-between items-center">
        <button className="text-sm text-error/60 hover:text-error transition-colors flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">delete_forever</span>
          Delete Organization
        </button>
        <Button variant="primary" icon="save">Save Changes</Button>
      </div>
    </div>
  )
}

function IntegrationCard({ icon, name, description, connected, color }: {
  icon: string
  name: string
  description: string
  connected: boolean
  color: string
}) {
  const [isConnected, setIsConnected] = useState(connected)
  return (
    <GlassCard hover padding="md" className="animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ background: color }}>
            {icon}
          </div>
          <div>
            <p className="font-bold text-on-surface">{name}</p>
            <p className="text-xs text-on-surface-variant/60 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isConnected && <Badge variant="success" dot>Connected</Badge>}
          <Button
            variant={isConnected ? 'glass' : 'primary'}
            size="sm"
            onClick={() => setIsConnected(p => !p)}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </div>
      </div>
    </GlassCard>
  )
}

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'tune' },
  { id: 'org', label: 'Organization', icon: 'business' },
  { id: 'integrations', label: 'Integrations', icon: 'extension' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  return (
    <div className="p-6 lg:p-8 max-w-[1100px]">
      <div className="animate-fade-in mb-8">
        <h2 className="text-display-md text-on-surface tracking-tight">Settings</h2>
        <p className="text-on-surface-variant mt-1">Manage your account and organization preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* ── Sidebar ── */}
        <div className="space-y-1 animate-fade-in">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/8 text-on-surface border border-white/8'
                  : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-white/5'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${activeTab === tab.id ? 'text-primary' : ''}`}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}

          <div className="pt-3 border-t border-white/5 mt-3">
            {/* Profile quick view */}
            <div className="p-3 glass-card rounded-xl border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {currentUser.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-on-surface-variant/50 truncate">{currentUser.email}</p>
                </div>
              </div>
              <Badge variant="primary">Admin</Badge>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="animate-fade-in min-w-0">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'org' && <OrgSettings />}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-headline text-on-surface">Integrations</h3>
                <p className="text-sm text-on-surface-variant/60 mt-1">Connect your favorite tools to supercharge your workflow.</p>
              </div>
              <IntegrationCard icon="J" name="Jira" description="Import backlogs and sync story points." connected={false} color="#0052CC" />
              <IntegrationCard icon="C" name="Confluence" description="Link documentation to your planning sessions." connected={false} color="#0052CC" />
              <IntegrationCard icon="#" name="Slack" description="Get notifications and control sessions from Slack." connected={true} color="#4A154B" />
              <IntegrationCard icon="G" name="GitHub" description="Reference PRs and issues in estimation sessions." connected={false} color="#333333" />
              <IntegrationCard icon="N" name="Notion" description="Export reports directly to Notion databases." connected={false} color="#191919" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

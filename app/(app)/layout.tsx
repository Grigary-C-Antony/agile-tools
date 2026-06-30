import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { db } from '@/lib/db'
import { readSessionFromCookie } from '@/lib/session'

function PendingPage({ name }: { name: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary text-[32px]">pending_actions</span>
        </div>
        <h2 className="text-2xl font-bold text-on-surface">Waiting for Approval</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Hey <strong className="text-on-surface">{name}</strong>! Your request to join has been submitted.
          An admin will review and approve your access shortly.
        </p>
        <p className="text-xs text-on-surface-variant/50">Refresh once you've been approved.</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to landing
        </a>
      </div>
    </div>
  )
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const raw = store.get('agile_session')?.value
  if (!raw) redirect('/')

  const sessionData = readSessionFromCookie(raw)
  if (!sessionData) redirect('/')

  const member = await db.getMember(sessionData.memberId)
  if (!member || member.org_id !== sessionData.orgId) redirect('/')
  if (member.status === 'rejected') redirect('/')
  if (member.status === 'pending') return <PendingPage name={member.name} />

  return (
    <div className="min-h-screen">
      <Sidebar />
      <TopNav />
      <main className="ml-64 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  )
}

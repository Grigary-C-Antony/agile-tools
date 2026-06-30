'use client'
import { useState, useEffect } from 'react'

export interface SessionInfo {
  orgId: string
  memberId: string
  memberName: string
  role: 'admin' | 'member'
  status: 'active' | 'pending'
  orgName: string
  inviteCode: string
}

export function useSession() {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => { setSession(d.session ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return { session, loading }
}

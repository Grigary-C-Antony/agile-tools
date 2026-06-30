'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { calcWSJF, calcRICE, rankWSJFItems, rankRICEItems } from '@/lib/utils'
import type { WSJFItem, RICEItem } from '@/lib/types'

interface WSJFApiFeature {
  id: string; name: string; business_value: number; time_criticality: number
  risk_reduction: number; job_size: number
}
interface RICEApiFeature {
  id: string; name: string; reach: number; impact: number; confidence: number; effort: number
}

function toWSJFItem(f: WSJFApiFeature): WSJFItem {
  const item: WSJFItem = {
    id: f.id, name: f.name,
    userBusinessValue: f.business_value,
    timeCriticality: f.time_criticality,
    riskReductionOpportunityEnablement: f.risk_reduction,
    jobDuration: f.job_size,
    wsjfScore: 0,
  }
  item.wsjfScore = calcWSJF(item)
  return item
}

function toRICEItem(f: RICEApiFeature): RICEItem {
  const item: RICEItem = {
    id: f.id, name: f.name,
    reach: f.reach, impact: f.impact, confidence: f.confidence, effort: f.effort,
    riceScore: 0,
  }
  item.riceScore = calcRICE(item)
  return item
}

// ── WSJF Row ──
function WSJFRow({ item, isWinner, onChange, onDelete }: {
  item: WSJFItem; isWinner: boolean; onChange: (updated: WSJFItem) => void; onDelete: () => void
}) {
  const update = (field: keyof WSJFItem, val: number) => {
    const updated = { ...item, [field]: val }
    onChange({ ...updated, wsjfScore: calcWSJF(updated) })
  }

  return (
    <div className={`grid grid-cols-[1fr_80px_80px_80px_80px_120px_70px_36px] gap-3 px-5 py-4 rounded-2xl items-center transition-all group relative overflow-hidden ${
      isWinner ? 'bg-primary/10 border border-primary/20 hover:bg-primary/15' : 'bg-white/3 border border-white/5 hover:bg-white/6'
    }`}>
      {isWinner && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_20px_rgba(207,189,255,0.5)]" />}
      <div className="font-semibold text-on-surface text-sm pl-1 truncate">{item.name}</div>
      {(['userBusinessValue', 'timeCriticality', 'riskReductionOpportunityEnablement', 'jobDuration'] as const).map(field => (
        <div key={field} className="flex justify-center">
          <input type="number" value={item[field]}
            onChange={e => update(field, parseFloat(e.target.value) || 0)}
            className="glass-input w-16 py-1.5 rounded-lg text-center text-on-surface font-bold text-sm" min={0} />
        </div>
      ))}
      <div className={`text-center text-xl font-black ${isWinner ? 'gradient-brand-text' : 'text-on-surface font-bold text-lg'}`}>
        {item.wsjfScore}
      </div>
      <div className="flex justify-center">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-xl ${
          isWinner ? 'gradient-brand text-white shadow-primary/30 neon-glow-purple' : 'bg-white/10 text-on-surface border border-white/10'
        }`}>{item.rank}</div>
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity text-error/50 hover:text-error flex justify-center">
        <span className="material-symbols-outlined text-[18px]">delete</span>
      </button>
    </div>
  )
}

// ── RICE Row ──
function RICERow({ item, isWinner, onChange, onDelete }: {
  item: RICEItem; isWinner: boolean; onChange: (updated: RICEItem) => void; onDelete: () => void
}) {
  const update = (field: keyof RICEItem, val: number) => {
    const updated = { ...item, [field]: val }
    onChange({ ...updated, riceScore: calcRICE(updated) })
  }

  return (
    <div className={`grid grid-cols-[1fr_100px_80px_100px_80px_120px_70px_36px] gap-3 px-5 py-4 rounded-2xl items-center transition-all group relative overflow-hidden ${
      isWinner ? 'bg-secondary/10 border border-secondary/20 hover:bg-secondary/15' : 'bg-white/3 border border-white/5 hover:bg-white/6'
    }`}>
      {isWinner && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary shadow-[0_0_20px_rgba(255,183,130,0.5)]" />}
      <div className="font-semibold text-on-surface text-sm pl-1 truncate">{item.name}</div>
      {(['reach', 'impact', 'confidence', 'effort'] as const).map(field => (
        <div key={field} className="flex justify-center">
          <input type="number" value={item[field]}
            onChange={e => update(field, parseFloat(e.target.value) || 0)}
            className="glass-input py-1.5 rounded-lg text-center text-on-surface font-bold text-sm"
            style={{ width: field === 'reach' ? '5rem' : field === 'confidence' ? '4.5rem' : '4rem' }}
            min={0} max={field === 'confidence' ? 100 : undefined} step={field === 'impact' ? 0.25 : undefined} />
        </div>
      ))}
      <div className={`text-center text-xl font-black ${isWinner ? 'text-secondary' : 'text-on-surface font-bold text-lg'}`}>
        {item.riceScore}
      </div>
      <div className="flex justify-center">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-xl ${
          isWinner ? 'bg-secondary text-on-secondary shadow-secondary/30 neon-glow-orange' : 'bg-white/10 text-on-surface border border-white/10'
        }`}>{item.rank}</div>
      </div>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity text-error/50 hover:text-error flex justify-center">
        <span className="material-symbols-outlined text-[18px]">delete</span>
      </button>
    </div>
  )
}

// ── Add Feature Modal ──
function AddFeatureModal({ open, onClose, type, onAdd }: {
  open: boolean; onClose: () => void; type: 'wsjf' | 'rice'; onAdd: (name: string) => void
}) {
  const [name, setName] = useState('')
  return (
    <Modal open={open} onClose={onClose} title={`Add Feature to ${type.toUpperCase()}`} size="sm">
      <div className="space-y-4">
        <Input label="Feature Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. User Authentication" />
        <Button variant="primary" className="w-full" onClick={() => { onAdd(name); onClose(); setName('') }} disabled={!name.trim()}>
          Add Feature
        </Button>
      </div>
    </Modal>
  )
}

function PrioritizationContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'wsjf' | 'rice'>((searchParams.get('tab') as 'wsjf' | 'rice') ?? 'wsjf')
  const [wsjfItems, setWsjfItems] = useState<WSJFItem[]>([])
  const [riceItems, setRiceItems] = useState<RICEItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const wsjfTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const riceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    Promise.all([
      fetch('/api/wsjf').then(r => r.json()),
      fetch('/api/rice').then(r => r.json()),
    ]).then(([wData, rData]) => {
      setWsjfItems(rankWSJFItems((wData.features ?? []).map(toWSJFItem)))
      setRiceItems(rankRICEItems((rData.features ?? []).map(toRICEItem)))
      setLoading(false)
    })
  }, [])

  const updateWSJF = (updated: WSJFItem) => {
    setWsjfItems(prev => rankWSJFItems(prev.map(i => i.id === updated.id ? updated : i)))
    clearTimeout(wsjfTimers.current[updated.id])
    wsjfTimers.current[updated.id] = setTimeout(() => {
      fetch(`/api/wsjf/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_value: updated.userBusinessValue,
          time_criticality: updated.timeCriticality,
          risk_reduction: updated.riskReductionOpportunityEnablement,
          job_size: updated.jobDuration,
        }),
      })
    }, 400)
  }

  const updateRICE = (updated: RICEItem) => {
    setRiceItems(prev => rankRICEItems(prev.map(i => i.id === updated.id ? updated : i)))
    clearTimeout(riceTimers.current[updated.id])
    riceTimers.current[updated.id] = setTimeout(() => {
      fetch(`/api/rice/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reach: updated.reach, impact: updated.impact, confidence: updated.confidence, effort: updated.effort }),
      })
    }, 400)
  }

  const addFeature = async (name: string) => {
    if (activeTab === 'wsjf') {
      const res = await fetch('/api/wsjf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      setWsjfItems(prev => rankWSJFItems([...prev, toWSJFItem(data.feature)]))
    } else {
      const res = await fetch('/api/rice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      setRiceItems(prev => rankRICEItems([...prev, toRICEItem(data.feature)]))
    }
  }

  const deleteWSJF = async (id: string) => {
    await fetch(`/api/wsjf/${id}`, { method: 'DELETE' })
    setWsjfItems(prev => rankWSJFItems(prev.filter(i => i.id !== id)))
  }

  const deleteRICE = async (id: string) => {
    await fetch(`/api/rice/${id}`, { method: 'DELETE' })
    setRiceItems(prev => rankRICEItems(prev.filter(i => i.id !== id)))
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 animate-fade-in">
        <div>
          <h2 className="text-display-md text-on-surface tracking-tight">Prioritization</h2>
          <p className="text-on-surface-variant mt-1 max-w-xl">
            Strategic ranking via WSJF and RICE frameworks. Optimize your product roadmap with data-driven value assessments.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="glass-card p-1.5 rounded-2xl flex relative min-w-[280px] border-white/8">
          <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-3px)] bg-white/10 border border-white/10 rounded-xl transition-transform duration-500 z-0 ${
            activeTab === 'rice' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'
          }`} />
          <button onClick={() => setActiveTab('wsjf')} className={`relative z-10 flex-1 py-2.5 rounded-xl text-label-caps text-[12px] tracking-widest transition-all ${
            activeTab === 'wsjf' ? 'text-on-surface font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}>WSJF</button>
          <button onClick={() => setActiveTab('rice')} className={`relative z-10 flex-1 py-2.5 rounded-xl text-label-caps text-[12px] tracking-widest transition-all ${
            activeTab === 'rice' ? 'text-on-surface font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}>RICE</button>
        </div>
      </div>

      {/* ── WSJF View ── */}
      {activeTab === 'wsjf' && (
        <div className="glass-card rounded-3xl overflow-hidden animate-fade-in">
          <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px] icon-fill">leaderboard</span>
              </div>
              <div>
                <h3 className="text-headline text-on-surface">Weighted Shortest Job First</h3>
                <p className="text-xs text-on-surface-variant">Cost of Delay ÷ Duration</p>
              </div>
            </div>
            <Button variant="primary" size="sm" icon="add" onClick={() => setAddOpen(true)}>Add Feature</Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px] p-5">
              <div className="grid grid-cols-[1fr_80px_80px_80px_80px_120px_70px_36px] gap-3 px-5 py-3 mb-3 text-on-surface-variant text-label-caps text-[10px] border-b border-white/5">
                <div>Feature Name</div>
                <div className="text-center">Value</div>
                <div className="text-center">Time</div>
                <div className="text-center">Risk</div>
                <div className="text-center">Size</div>
                <div className="text-center text-primary">WSJF Score</div>
                <div className="text-center">Rank</div>
                <div />
              </div>
              {wsjfItems.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant/40">
                  <span className="material-symbols-outlined text-[40px] mb-2 block">leaderboard</span>
                  <p>Add your first feature to start prioritizing</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wsjfItems.map(item => (
                    <WSJFRow key={item.id} item={item} isWinner={item.rank === 1}
                      onChange={updateWSJF} onDelete={() => deleteWSJF(item.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <p className="text-xs text-on-surface-variant/40 text-center">
              WSJF = (User Business Value + Time Criticality + Risk Reduction) ÷ Job Duration
            </p>
          </div>
        </div>
      )}

      {/* ── RICE View ── */}
      {activeTab === 'rice' && (
        <div className="glass-card rounded-3xl overflow-hidden border-t-secondary/30 animate-fade-in">
          <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[24px] icon-fill">priority_high</span>
              </div>
              <div>
                <h3 className="text-headline text-on-surface">RICE Scoring Model</h3>
                <p className="text-xs text-on-surface-variant">Reach × Impact × Confidence ÷ Effort</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" icon="add" onClick={() => setAddOpen(true)}
              className="border-secondary/30 text-secondary hover:bg-secondary/10">
              Add Feature
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[950px] p-5">
              <div className="grid grid-cols-[1fr_100px_80px_100px_80px_120px_70px_36px] gap-3 px-5 py-3 mb-3 text-on-surface-variant text-label-caps text-[10px] border-b border-white/5">
                <div>Feature Name</div>
                <div className="text-center">Reach</div>
                <div className="text-center">Impact</div>
                <div className="text-center">Conf %</div>
                <div className="text-center">Effort</div>
                <div className="text-center text-secondary">RICE Score</div>
                <div className="text-center">Rank</div>
                <div />
              </div>
              {riceItems.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant/40">
                  <span className="material-symbols-outlined text-[40px] mb-2 block">priority_high</span>
                  <p>Add your first feature to start scoring</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {riceItems.map(item => (
                    <RICERow key={item.id} item={item} isWinner={item.rank === 1}
                      onChange={updateRICE} onDelete={() => deleteRICE(item.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <p className="text-xs text-on-surface-variant/40 text-center">
              RICE = (Reach × Impact × Confidence%) ÷ Effort
            </p>
          </div>
        </div>
      )}

      {/* ── Info cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <GlassCard padding="md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface mb-1">About WSJF</h4>
              <p className="text-sm text-on-surface-variant/70 leading-relaxed">
                Weighted Shortest Job First prioritizes features by dividing Cost of Delay by job size.
                Features with higher scores deliver more value sooner relative to their effort.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Value', 'Time Criticality', 'Risk Reduction', 'Job Duration'].map(tag => (
                  <Badge key={tag} variant="primary">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard padding="md">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary text-[20px]">info</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface mb-1">About RICE</h4>
              <p className="text-sm text-on-surface-variant/70 leading-relaxed">
                RICE scoring helps product teams quantify the potential value of features based on how many people they reach,
                the impact per user, your confidence level, and the effort required.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Reach', 'Impact', 'Confidence', 'Effort'].map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <AddFeatureModal open={addOpen} onClose={() => setAddOpen(false)} type={activeTab} onAdd={addFeature} />
    </div>
  )
}

export default function PrioritizationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-on-surface-variant">Loading...</div>}>
      <PrioritizationContent />
    </Suspense>
  )
}

'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea } from '@/components/ui/Input'
import { MOCK_ESTIMATION_ITEMS } from '@/lib/mock-data'
import { FIBONACCI_DECK, TSHIRT_DECK } from '@/lib/types'
import type { EstimationItem, EstimationScale } from '@/lib/types'

const DECK_MAP: Record<EstimationScale, string[]> = {
  fibonacci: FIBONACCI_DECK.filter((v: string) => v !== '☕'),
  tshirt: TSHIRT_DECK,
  'powers-of-2': ['1', '2', '4', '8', '16', '32', '64', '?'],
  custom: [],
}

function EstimationCard({ value, selected, onClick, scale }: {
  value: string
  selected: boolean
  onClick: () => void
  scale: EstimationScale
}) {
  const isText = isNaN(Number(value)) && value !== '?'
  return (
    <button
      onClick={onClick}
      className={`poker-card flex flex-col items-center justify-center rounded-xl font-bold shadow-lg border transition-all ${
        isText ? 'w-16 h-20 text-lg' : 'w-14 h-20 text-2xl'
      } ${
        selected
          ? 'selected bg-primary/20 border-primary text-white'
          : 'bg-surface-container-high border-white/8 text-on-surface hover:border-primary/40 hover:bg-surface-container-highest'
      }`}
    >
      {value}
      {scale === 'fibonacci' && !isNaN(Number(value)) && (
        <span className="text-[9px] font-normal opacity-40 mt-0.5">pts</span>
      )}
    </button>
  )
}

function ItemRow({ item, onEstimate, onDelete }: {
  item: EstimationItem
  onEstimate: (id: string, estimate: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 group transition-all">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-on-surface">{item.name}</p>
        {item.description && (
          <p className="text-xs text-on-surface-variant/50 mt-0.5 truncate">{item.description}</p>
        )}
      </div>
      {item.estimate ? (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center font-bold text-white text-sm neon-glow-purple">
            {item.estimate}
          </div>
          <button onClick={() => onEstimate(item.id, '')} className="text-on-surface-variant/30 hover:text-error transition-colors">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        </div>
      ) : (
        <Badge variant="glass">Pending</Badge>
      )}
      <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-error/40 hover:text-error">
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  )
}

function EstimatorsContent() {
  const searchParams = useSearchParams()
  const [scale, setScale] = useState<EstimationScale>(
    (searchParams.get('scale') as EstimationScale) ?? 'fibonacci'
  )
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [items, setItems] = useState<EstimationItem[]>(MOCK_ESTIMATION_ITEMS)
  const [newItemName, setNewItemName] = useState('')
  const [newItemDesc, setNewItemDesc] = useState('')
  const [activeItemId, setActiveItemId] = useState<string | null>(MOCK_ESTIMATION_ITEMS[2].id)

  const deck = DECK_MAP[scale]
  const activeItem = items.find(i => i.id === activeItemId)

  const addItem = () => {
    if (!newItemName.trim()) return
    const newItem: EstimationItem = {
      id: `e${Date.now()}`,
      name: newItemName.trim(),
      description: newItemDesc.trim() || undefined,
      scale,
    }
    setItems(prev => [...prev, newItem])
    setActiveItemId(newItem.id)
    setNewItemName('')
    setNewItemDesc('')
    setSelectedCard(null)
  }

  const applyEstimate = () => {
    if (!activeItemId || !selectedCard) return
    setItems(prev => prev.map(i =>
      i.id === activeItemId ? { ...i, estimate: selectedCard } : i
    ))
    // Move to next unestimated
    const nextUnestimated = items.find(i => !i.estimate && i.id !== activeItemId)
    if (nextUnestimated) setActiveItemId(nextUnestimated.id)
    setSelectedCard(null)
  }

  const estimatedCount = items.filter(i => i.estimate).length

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1400px]">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h2 className="text-display-md text-on-surface tracking-tight">Estimators</h2>
          <p className="text-on-surface-variant mt-1">Solo estimation using Fibonacci or T-Shirt sizing scales.</p>
        </div>
        {/* Scale selector */}
        <div className="flex gap-1 glass-card p-1 rounded-xl border-white/8">
          {(['fibonacci', 'tshirt', 'powers-of-2'] as EstimationScale[]).map(s => (
            <button
              key={s}
              onClick={() => { setScale(s); setSelectedCard(null) }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                scale === s
                  ? 'bg-primary/20 text-primary border border-primary/20'
                  : 'text-on-surface-variant/50 hover:text-on-surface'
              }`}
            >
              {s === 'powers-of-2' ? '2ⁿ' : s === 'tshirt' ? 'T-Shirt' : 'Fibonacci'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left: Items list ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Add item form */}
          <GlassCard padding="md" className="animate-fade-in">
            <h3 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">add_circle</span>
              Add Item
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="User story or task name..."
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
              <Textarea
                placeholder="Optional description..."
                value={newItemDesc}
                onChange={e => setNewItemDesc(e.target.value)}
                rows={2}
              />
              <Button variant="primary" className="w-full" icon="add" onClick={addItem} disabled={!newItemName.trim()}>
                Add to Queue
              </Button>
            </div>
          </GlassCard>

          {/* Item list */}
          <GlassCard padding="none" className="animate-fade-in" style={{ animationDelay: '60ms' } as React.CSSProperties}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">Estimation Queue</h3>
              <Badge variant="glass">{estimatedCount}/{items.length}</Badge>
            </div>
            <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto">
              {items.map(item => (
                <div
                  key={item.id}
                  onClick={() => { setActiveItemId(item.id); setSelectedCard(null) }}
                  className={`cursor-pointer transition-all ${activeItemId === item.id ? 'ring-1 ring-primary/30 rounded-xl' : ''}`}
                >
                  <ItemRow
                    item={item}
                    onEstimate={(id, est) => setItems(prev => prev.map(i => i.id === id ? { ...i, estimate: est || undefined } : i))}
                    onDelete={id => {
                      setItems(prev => prev.filter(i => i.id !== id))
                      if (activeItemId === id) setActiveItemId(null)
                    }}
                  />
                </div>
              ))}
              {items.length === 0 && (
                <div className="py-8 text-center text-on-surface-variant/40">
                  <span className="material-symbols-outlined text-[32px] mb-2 block">inbox</span>
                  <p className="text-sm">Add items to start estimating</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* ── Right: Card picker ── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Current item */}
          <GlassCard topGradient neonAccent="purple" padding="lg" className="animate-fade-in" style={{ animationDelay: '80ms' } as React.CSSProperties}>
            {activeItem ? (
              <div className="text-center space-y-4">
                <Badge variant="primary">Estimating Now</Badge>
                <h3 className="text-headline text-on-surface">{activeItem.name}</h3>
                {activeItem.description && (
                  <p className="text-sm text-on-surface-variant/70 max-w-md mx-auto">{activeItem.description}</p>
                )}

                {/* Selected value display */}
                <div className="py-6">
                  <div className="relative inline-block">
                    <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl" />
                    <div className={`relative w-24 h-32 glass-modal rounded-2xl border flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.5)] transition-all ${
                      selectedCard ? 'border-primary/40 bg-primary/10' : 'border-white/10'
                    }`}>
                      {selectedCard ? (
                        <span className="text-4xl font-black gradient-purple-text">{selectedCard}</span>
                      ) : (
                        <span className="material-symbols-outlined text-[36px] text-on-surface-variant/20">casino</span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-48 neon-glow-purple"
                  disabled={!selectedCard}
                  onClick={applyEstimate}
                  icon="check"
                >
                  Apply Estimate
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-on-surface-variant/40">
                <span className="material-symbols-outlined text-[48px] mb-3 block">touch_app</span>
                <p>Select an item from the queue to estimate</p>
              </div>
            )}
          </GlassCard>

          {/* Card deck */}
          <GlassCard padding="md" className="animate-fade-in" style={{ animationDelay: '120ms' } as React.CSSProperties}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-label-caps text-on-surface-variant/50 text-[10px]">
                {scale.toUpperCase()} DECK
              </p>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-xs text-on-surface-variant/40 hover:text-primary transition-colors disabled:opacity-20"
                disabled={!selectedCard}
              >
                Clear selection
              </button>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {deck.map(val => (
                <EstimationCard
                  key={val}
                  value={val}
                  selected={selectedCard === val}
                  onClick={() => setSelectedCard(val === selectedCard ? null : val)}
                  scale={scale}
                />
              ))}
            </div>
          </GlassCard>

          {/* Progress bar */}
          <GlassCard padding="md" className="animate-fade-in" style={{ animationDelay: '160ms' } as React.CSSProperties}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-on-surface">Progress</span>
              <span className="text-sm text-on-surface-variant">{estimatedCount} / {items.length} estimated</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full gradient-brand rounded-full transition-all duration-500"
                style={{ width: items.length ? `${(estimatedCount / items.length) * 100}%` : '0%' }}
              />
            </div>
            {estimatedCount === items.length && items.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                All items estimated!
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

export default function EstimatorsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-on-surface-variant">Loading...</div>}>
      <EstimatorsContent />
    </Suspense>
  )
}

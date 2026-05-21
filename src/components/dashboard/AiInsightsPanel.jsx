'use client'

import { useEffect, useState } from 'react'
import { Zap, RefreshCw } from 'lucide-react'

export default function AiInsightsPanel() {
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/insights')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setInsight(data.insight)
    } catch {
      setInsight('Unable to generate insights right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/[0.04] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-[#22c55e]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#22c55e]">
            AI Insights
          </span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-[#22c55e] disabled:opacity-40 cursor-pointer"
          aria-label="Refresh insights"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[80, 65, 72].map((w) => (
            <div
              key={w}
              className="h-3.5 animate-pulse rounded bg-[#22c55e]/10"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {insight.split('\n').filter(Boolean).map((line, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-300">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

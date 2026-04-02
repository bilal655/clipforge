'use client'

import { useEffect, useState, useCallback } from 'react'
import { Job, Clip } from '@/lib/types'

interface Props {
  jobId: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function StatusBadge({ status }: { status: Clip['status'] }) {
  const styles: Record<string, string> = {
    queued: 'bg-white/8 text-white/40',
    processing: 'bg-yellow-500/15 text-yellow-400 progress-pulse',
    done: 'bg-green-500/15 text-green-400',
    error: 'bg-red-500/15 text-red-400',
  }
  const labels: Record<string, string> = {
    queued: 'Queued',
    processing: 'Processing…',
    done: 'Ready',
    error: 'Error',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

export default function JobTracker({ jobId }: Props) {
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/clips?jobId=${jobId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setJob(data)
      return data.status
    } catch (err: any) {
      setError(err.message)
      return 'error'
    }
  }, [jobId])

  useEffect(() => {
    let interval: NodeJS.Timeout

    const start = async () => {
      const status = await poll()
      if (status !== 'done' && status !== 'error') {
        interval = setInterval(async () => {
          const s = await poll()
          if (s === 'done' || s === 'error') clearInterval(interval)
        }, 2000)
      }
    }

    start()
    return () => clearInterval(interval)
  }, [poll])

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400 text-sm">
        {error}
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex items-center gap-3 text-white/40 py-8">
        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"/>
        <span className="text-sm">Loading job…</span>
      </div>
    )
  }

  const isDone = job.status === 'done'
  const isError = job.status === 'error'
  const isRunning = !isDone && !isError

  return (
    <div className="max-w-xl space-y-5">
      {/* Job header */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-medium text-sm text-white">{job.originalFileName}</p>
            <p className="text-xs text-white/40 mt-0.5">{job.message}</p>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
            isDone ? 'bg-green-500/15 text-green-400'
            : isError ? 'bg-red-500/15 text-red-400'
            : 'bg-yellow-500/15 text-yellow-400 progress-pulse'
          }`}>
            {isDone ? 'Done' : isError ? 'Failed' : 'Running…'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${job.progress}%` }}
          />
        </div>
        <p className="text-xs text-white/30 mt-1.5 text-right">{job.progress}%</p>
      </div>

      {/* Settings summary */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-white/50">
          {job.settings.duration}s clips
        </span>
        <span className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-white/50">
          {job.settings.numClips} clips
        </span>
        <span className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-white/50">
          {job.settings.captionStyle} captions
        </span>
        {job.settings.platforms.map((p) => (
          <span key={p} className="text-xs px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400">
            {p}
          </span>
        ))}
      </div>

      {/* Error state */}
      {isError && job.errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
          {job.errorMessage}
        </div>
      )}

      {/* Clips list */}
      {job.clips.length > 0 && (
        <div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            Clips ({job.clips.filter((c) => c.status === 'done').length}/{job.clips.length} ready)
          </p>
          <div className="space-y-2.5">
            {job.clips.map((clip, i) => (
              <div
                key={clip.id}
                className="bg-white/4 border border-white/8 rounded-xl p-4 flex items-start gap-3 fade-in"
              >
                {/* Thumbnail placeholder */}
                <div className="w-14 h-9 rounded-md bg-white/8 shrink-0 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="white" opacity="0.3">
                    <path d="M6 3l8 5-8 5V3z"/>
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      Highlight #{i + 1}
                    </p>
                    <StatusBadge status={clip.status} />
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 truncate">{clip.reason}</p>
                  <p className="text-xs text-white/25 mt-0.5">
                    {formatTime(clip.startTime)} – {formatTime(clip.endTime)} · {clip.duration}s
                  </p>
                  {clip.transcript && (
                    <p className="text-xs text-white/30 mt-1.5 italic truncate">
                      "{clip.transcript}"
                    </p>
                  )}
                </div>

                {clip.status === 'done' && clip.downloadUrl && (
                  <a
                    href={clip.downloadUrl}
                    download
                    className="shrink-0 px-3 py-1.5 bg-brand/90 hover:bg-brand text-white text-xs rounded-lg font-medium transition-colors"
                  >
                    Download
                  </a>
                )}

                {clip.status === 'error' && (
                  <span className="shrink-0 text-xs text-red-400">Failed</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Still running — show pipeline steps */}
      {isRunning && job.clips.length === 0 && (
        <div className="space-y-2">
          {[
            { label: 'Transcribing audio', done: (job.progress ?? 0) > 10 },
            { label: 'Detecting highlights', done: (job.progress ?? 0) > 35 },
            { label: 'Cutting clips', done: (job.progress ?? 0) > 50 },
            { label: 'Burning captions', done: (job.progress ?? 0) > 75 },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                step.done
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'border-white/15'
              }`}>
                {step.done && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#4ade80" strokeWidth="2">
                    <path d="M2 6l3 3 5-5"/>
                  </svg>
                )}
              </div>
              <span className={`text-sm ${step.done ? 'text-white/60' : 'text-white/30'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

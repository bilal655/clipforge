'use client'

import { useState, useRef, useCallback } from 'react'
import { ClipSettings, CaptionStyle, Platform, Job } from '@/lib/types'
import JobTracker from '@/components/JobTracker'

const DEFAULT_SETTINGS: ClipSettings = {
  duration: 60,
  captionStyle: 'bold',
  platforms: ['tiktok', 'instagram'],
  numClips: 4,
}

const DURATIONS = [
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '3 min', value: 180 },
]

const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: 'tiktok', label: 'TikTok', color: '#111' },
  { id: 'instagram', label: 'Instagram', color: '#E1306C' },
  { id: 'youtube', label: 'YouTube Shorts', color: '#FF0000' },
  { id: 'twitter', label: 'X / Twitter', color: '#1DA1F2' },
]

const CAPTION_STYLES: { id: CaptionStyle; label: string; preview: string }[] = [
  { id: 'bold', label: 'Bold drop', preview: 'font-bold text-white [text-shadow:2px_2px_0_#000]' },
  { id: 'outline', label: 'Outline', preview: 'text-white [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]' },
  { id: 'highlight', label: 'Highlight', preview: 'font-bold bg-yellow-400 text-black px-1 rounded' },
  { id: 'none', label: 'No captions', preview: 'text-gray-500 italic' },
]

export default function Dashboard() {
  const [settings, setSettings] = useState<ClipSettings>(DEFAULT_SETTINGS)
  const [customDuration, setCustomDuration] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'setup' | 'jobs'>('setup')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('video/')) {
      setFile(dropped)
      setError(null)
    } else {
      setError('Please drop a video file (MP4, MOV, etc.)')
    }
  }, [])

  const togglePlatform = (id: Platform) => {
    setSettings((s) => ({
      ...s,
      platforms: s.platforms.includes(id)
        ? s.platforms.filter((p) => p !== id)
        : [...s.platforms, id],
    }))
  }

  const handleSubmit = async () => {
    if (!file) { setError('Please select a video file first.'); return }
    setError(null)
    setIsUploading(true)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('settings', JSON.stringify(settings))

      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      setActiveJobId(data.jobId)
      setActiveTab('jobs')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-52 border-r border-white/10 flex flex-col py-5 gap-1 shrink-0">
        <div className="px-4 pb-5 flex items-center gap-2">
          <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="white">
              <path d="M6 3l8 5-8 5V3z"/>
            </svg>
          </div>
          <span className="font-medium text-sm tracking-tight">ClipForge</span>
        </div>

        {[
          { id: 'setup', label: 'New run', icon: 'M12 5v14M5 12h14' },
          { id: 'jobs', label: 'My clips', icon: 'M4 6h16M4 10h16M4 14h16' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
              activeTab === item.id
                ? 'text-white bg-white/8 font-medium'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d={item.icon}/>
            </svg>
            {item.label}
          </button>
        ))}

        <div className="mt-auto px-4 py-3 mx-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-white/40 mb-0.5">Plan</p>
          <p className="text-xs font-medium text-white">Starter — 30 clips/mo</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0f0f0f]">
          <h1 className="font-medium text-sm">
            {activeTab === 'setup' ? 'New clip run' : 'My clips'}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-medium">● Live</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'setup' && (
            <div className="max-w-xl space-y-6 fade-in">

              {/* Upload zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-brand bg-brand/10'
                    : file
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-white/15 hover:border-white/30 hover:bg-white/3'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(null) } }}
                />
                <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-white/8 flex items-center justify-center">
                  {file ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40"><path d="M12 16V8M9 11l3-3 3 3"/><path d="M3 15v1.5A2.5 2.5 0 005.5 19h13a2.5 2.5 0 002.5-2.5V15"/></svg>
                  )}
                </div>
                <p className="font-medium text-sm text-white/80">
                  {file ? file.name : 'Drop your VOD here'}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(1)} MB · Ready to process`
                    : 'MP4, MOV up to 10GB'}
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3 block">Clip duration</label>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSettings((s) => ({ ...s, duration: d.value }))}
                      className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                        settings.duration === d.value
                          ? 'bg-brand border-brand text-white font-medium'
                          : 'border-white/15 text-white/50 hover:border-white/40 hover:text-white/80'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm text-white/40">Custom:</span>
                  <input
                    type="number"
                    value={customDuration}
                    onChange={(e) => {
                      setCustomDuration(e.target.value)
                      const v = parseInt(e.target.value)
                      if (v > 0) setSettings((s) => ({ ...s, duration: v }))
                    }}
                    placeholder="45"
                    min={5}
                    max={600}
                    className="w-16 bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand"
                  />
                  <span className="text-sm text-white/40">seconds</span>
                </div>
              </div>

              {/* Number of clips */}
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3 block">
                  Number of clips — <span className="text-white/80">{settings.numClips}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={settings.numClips}
                  onChange={(e) => setSettings((s) => ({ ...s, numClips: parseInt(e.target.value) }))}
                  className="w-full accent-brand"
                />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>1</span><span>10</span>
                </div>
              </div>

              {/* Caption style */}
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3 block">Caption style</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {CAPTION_STYLES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSettings((s) => ({ ...s, captionStyle: c.id }))}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        settings.captionStyle === c.id
                          ? 'bg-white/12 border-white/30 text-white font-medium'
                          : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/60'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                {/* Caption preview */}
                <div className="bg-black rounded-lg h-16 flex items-end justify-center pb-3">
                  {settings.captionStyle === 'bold' && (
                    <span className="text-white font-bold text-base" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000' }}>
                      let&apos;s get this dub 🔥
                    </span>
                  )}
                  {settings.captionStyle === 'outline' && (
                    <span className="text-white text-base" style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000' }}>
                      let&apos;s get this dub 🔥
                    </span>
                  )}
                  {settings.captionStyle === 'highlight' && (
                    <span className="text-base font-bold">
                      let&apos;s get <span className="bg-yellow-400 text-black px-1 rounded">this</span> dub 🔥
                    </span>
                  )}
                  {settings.captionStyle === 'none' && (
                    <span className="text-white/30 text-sm italic">no captions</span>
                  )}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3 block">Post to (for reference)</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        settings.platforms.includes(p.id)
                          ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                          : 'border-white/10 text-white/40 hover:border-white/25'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }}/>
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/30 mt-2">Auto-posting coming soon — clips will be ready to download for now.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isUploading || !file}
                className="w-full py-3 bg-brand hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-colors"
              >
                {isUploading ? 'Uploading…' : 'Generate clips →'}
              </button>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="fade-in">
              {activeJobId ? (
                <JobTracker jobId={activeJobId} />
              ) : (
                <div className="text-center py-20 text-white/30">
                  <p className="text-sm">No clips yet.</p>
                  <button onClick={() => setActiveTab('setup')} className="mt-3 text-sm text-brand hover:underline">
                    Start your first run →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

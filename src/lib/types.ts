export type CaptionStyle = 'bold' | 'outline' | 'highlight' | 'none'
export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter'

export interface ClipSettings {
  duration: number          // seconds
  captionStyle: CaptionStyle
  platforms: Platform[]
  numClips: number          // how many clips to generate
}

export interface Highlight {
  startTime: number         // seconds from start of video
  endTime: number
  score: number             // 0-100 confidence
  reason: string            // why the AI picked this moment
  transcript: string        // what was said
}

export interface Clip {
  id: string
  jobId: string
  highlightIndex: number
  startTime: number
  endTime: number
  duration: number
  reason: string
  transcript: string
  status: 'queued' | 'processing' | 'done' | 'error'
  filePath?: string
  downloadUrl?: string
  captionStyle: CaptionStyle
  createdAt: string
  errorMessage?: string
}

export interface Job {
  id: string
  status: 'uploading' | 'transcribing' | 'analyzing' | 'clipping' | 'done' | 'error'
  progress: number          // 0-100
  message: string
  originalFileName: string
  filePath?: string
  settings: ClipSettings
  clips: Clip[]
  createdAt: string
  errorMessage?: string
}

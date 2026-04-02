import OpenAI from 'openai'
import fs from 'fs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface TranscriptSegment {
  start: number   // seconds
  end: number
  text: string
}

export interface Transcript {
  fullText: string
  segments: TranscriptSegment[]
  duration: number
}

export async function transcribeVideo(videoPath: string): Promise<Transcript> {
  // Whisper accepts video files directly — no need to extract audio separately
  const fileStream = fs.createReadStream(videoPath)

  const response = await openai.audio.transcriptions.create({
    file: fileStream,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  })

  const segments: TranscriptSegment[] = (response.segments ?? []).map((s: any) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  }))

  const duration = segments.length > 0 ? segments[segments.length - 1].end : 0

  return {
    fullText: response.text,
    segments,
    duration,
  }
}

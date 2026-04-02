import Anthropic from '@anthropic-ai/sdk'
import { Transcript, TranscriptSegment } from './transcribe'
import { Highlight } from './types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function detectHighlights(
  transcript: Transcript,
  clipDuration: number,
  numClips: number
): Promise<Highlight[]> {
  // Build a readable version of the transcript with timestamps
  const formattedTranscript = transcript.segments
    .map((s: TranscriptSegment) => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`)
    .join('\n')

  const prompt = `You are an expert content editor for streamers on TikTok, Instagram, and YouTube Shorts.

Analyze this stream transcript and identify the ${numClips} most engaging highlight moments for short-form clips.

Each clip should be exactly ${clipDuration} seconds long. Pick moments that are:
- High energy, exciting, or funny
- Self-contained (make sense without context)
- Have strong emotional peaks (hype, reaction, clutch moments, funny fails)
- Would make someone stop scrolling

Transcript:
${formattedTranscript}

Total video duration: ${formatTime(transcript.duration)}

Respond ONLY with a JSON array — no preamble, no markdown. Example format:
[
  {
    "startTime": 245.5,
    "endTime": 305.5,
    "score": 92,
    "reason": "Intense clutch moment with huge reaction",
    "transcript": "The key dialogue or action happening here"
  }
]

Rules:
- startTime and endTime must be valid seconds within the video duration
- endTime - startTime must equal exactly ${clipDuration}
- score is 0-100 (how viral-worthy this clip is)
- Return exactly ${numClips} highlights, sorted by score descending
- If the video is too short for ${numClips} clips, return as many as possible`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const cleaned = text.replace(/```json|```/g, '').trim()
    const highlights: Highlight[] = JSON.parse(cleaned)

    // Validate and clamp times to video duration
    return highlights
      .filter((h) => h.startTime >= 0 && h.endTime <= transcript.duration + 5)
      .map((h) => ({
        ...h,
        startTime: Math.max(0, h.startTime),
        endTime: Math.min(transcript.duration, h.endTime),
      }))
  } catch {
    throw new Error('AI returned invalid highlight data. Try again.')
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

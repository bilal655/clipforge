import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import { Highlight } from './types'
import { CaptionStyle } from './types'

export interface ClipOptions {
  inputPath: string
  outputPath: string
  highlight: Highlight
  captionStyle: CaptionStyle
}

export async function cutClip(options: ClipOptions): Promise<void> {
  const { inputPath, outputPath, highlight, captionStyle } = options
  const duration = highlight.endTime - highlight.startTime

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .setStartTime(highlight.startTime)
      .setDuration(duration)
      // Vertical crop for TikTok/Reels (9:16 aspect ratio)
      .videoFilter([
        'crop=ih*9/16:ih:(iw-ih*9/16)/2:0',
        'scale=1080:1920',
      ])
      .audioCodec('aac')
      .audioBitrate('192k')
      .videoCodec('libx264')
      .videoBitrate('4000k')
      .outputOptions(['-preset fast', '-crf 23', '-movflags +faststart'])

    // Add captions if enabled
    if (captionStyle !== 'none' && highlight.transcript) {
      const srtPath = outputPath.replace('.mp4', '.srt')
      writeSRT(srtPath, highlight.transcript, duration)

      const captionFilter = getCaptionFilter(captionStyle, srtPath)
      command = command.videoFilter(captionFilter)
    }

    command
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .run()
  })
}

function writeSRT(srtPath: string, transcript: string, duration: number): void {
  // Split transcript into chunks of ~6 words for readable captions
  const words = transcript.split(' ').filter(Boolean)
  const chunkSize = 6
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
  }

  const timePerChunk = duration / Math.max(chunks.length, 1)
  let srtContent = ''

  chunks.forEach((chunk, i) => {
    const start = i * timePerChunk
    const end = (i + 1) * timePerChunk
    srtContent += `${i + 1}\n${toSRTTime(start)} --> ${toSRTTime(end)}\n${chunk}\n\n`
  })

  fs.writeFileSync(srtPath, srtContent)
}

function toSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)},${ms.toString().padStart(3, '0')}`
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function getCaptionFilter(style: CaptionStyle, srtPath: string): string {
  // Escape path for FFmpeg filter
  const escaped = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:')

  const baseStyle = 'FontSize=22,MarginV=80,Alignment=2'

  switch (style) {
    case 'bold':
      return `subtitles='${escaped}':force_style='${baseStyle},Bold=1,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2'`
    case 'outline':
      return `subtitles='${escaped}':force_style='${baseStyle},PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=3,Shadow=0'`
    case 'highlight':
      return `subtitles='${escaped}':force_style='${baseStyle},Bold=1,PrimaryColour=&H00FFFF,BackColour=&H80000000,BorderStyle=4'`
    default:
      return `subtitles='${escaped}':force_style='${baseStyle},PrimaryColour=&HFFFFFF'`
  }
}

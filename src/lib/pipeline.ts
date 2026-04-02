import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { jobStore } from './jobStore'
import { transcribeVideo } from './transcribe'
import { detectHighlights } from './highlights'
import { cutClip } from './ffmpeg'
import { Job, Clip, ClipSettings } from './types'

const CLIPS_DIR = path.join(process.cwd(), 'uploads', 'clips')

export async function runPipeline(job: Job): Promise<void> {
  const { id, filePath, settings } = job

  if (!filePath) {
    jobStore.update(id, { status: 'error', errorMessage: 'No file path found for job.' })
    return
  }

  try {
    // ── Step 1: Transcribe ────────────────────────────────────────────────
    jobStore.update(id, {
      status: 'transcribing',
      progress: 10,
      message: 'Transcribing audio with Whisper AI…',
    })

    const transcript = await transcribeVideo(filePath)

    // ── Step 2: Detect highlights ─────────────────────────────────────────
    jobStore.update(id, {
      status: 'analyzing',
      progress: 35,
      message: 'Detecting best highlight moments with Claude AI…',
    })

    const highlights = await detectHighlights(
      transcript,
      settings.duration,
      settings.numClips
    )

    if (highlights.length === 0) {
      throw new Error('No highlights detected. The video may be too short or silent.')
    }

    // ── Step 3: Cut clips ─────────────────────────────────────────────────
    jobStore.update(id, {
      status: 'clipping',
      progress: 50,
      message: `Cutting ${highlights.length} clips and adding captions…`,
    })

    const clips: Clip[] = highlights.map((h, i) => ({
      id: uuidv4(),
      jobId: id,
      highlightIndex: i,
      startTime: h.startTime,
      endTime: h.endTime,
      duration: h.endTime - h.startTime,
      reason: h.reason,
      transcript: h.transcript,
      status: 'queued',
      captionStyle: settings.captionStyle,
      createdAt: new Date().toISOString(),
    }))

    jobStore.update(id, { clips })

    // Process clips one by one and update progress
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const outputFileName = `clip_${id}_${i + 1}.mp4`
      const outputPath = path.join(CLIPS_DIR, outputFileName)

      // Mark as processing
      clips[i] = { ...clip, status: 'processing' }
      jobStore.update(id, {
        clips: [...clips],
        progress: 50 + Math.round((i / clips.length) * 40),
        message: `Processing clip ${i + 1} of ${clips.length}…`,
      })

      try {
        await cutClip({
          inputPath: filePath,
          outputPath,
          highlight: highlights[i],
          captionStyle: settings.captionStyle,
        })

        clips[i] = {
          ...clip,
          status: 'done',
          filePath: outputPath,
          downloadUrl: `/api/download?file=${outputFileName}`,
        }
      } catch (err: any) {
        clips[i] = {
          ...clip,
          status: 'error',
          errorMessage: err.message,
        }
      }

      jobStore.update(id, { clips: [...clips] })
    }

    // ── Step 4: Done ──────────────────────────────────────────────────────
    jobStore.update(id, {
      status: 'done',
      progress: 100,
      message: `Done! ${clips.filter((c) => c.status === 'done').length} clips ready to download.`,
      clips,
    })
  } catch (err: any) {
    jobStore.update(id, {
      status: 'error',
      errorMessage: err.message ?? 'Something went wrong.',
      message: 'Pipeline failed.',
    })
  }
}

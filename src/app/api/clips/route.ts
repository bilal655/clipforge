import { NextRequest, NextResponse } from 'next/server'
import { jobStore } from '@/lib/jobStore'

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')

  if (!jobId) {
    // Return all jobs if no jobId provided
    const jobs = jobStore.all().map((job) => ({
      id: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
      originalFileName: job.originalFileName,
      settings: job.settings,
      clips: job.clips.map((c) => ({
        id: c.id,
        highlightIndex: c.highlightIndex,
        startTime: c.startTime,
        endTime: c.endTime,
        duration: c.duration,
        reason: c.reason,
        transcript: c.transcript,
        status: c.status,
        downloadUrl: c.downloadUrl,
        captionStyle: c.captionStyle,
        createdAt: c.createdAt,
        errorMessage: c.errorMessage,
      })),
      createdAt: job.createdAt,
      errorMessage: job.errorMessage,
    }))
    return NextResponse.json({ jobs })
  }

  const job = jobStore.get(jobId)

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    originalFileName: job.originalFileName,
    settings: job.settings,
    clips: job.clips.map((c) => ({
      id: c.id,
      highlightIndex: c.highlightIndex,
      startTime: c.startTime,
      endTime: c.endTime,
      duration: c.duration,
      reason: c.reason,
      transcript: c.transcript,
      status: c.status,
      downloadUrl: c.downloadUrl,
      captionStyle: c.captionStyle,
      createdAt: c.createdAt,
      errorMessage: c.errorMessage,
    })),
    createdAt: job.createdAt,
    errorMessage: job.errorMessage,
  })
}
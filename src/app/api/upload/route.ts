import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { jobStore } from '@/lib/jobStore'
import { runPipeline } from '@/lib/pipeline'
import { ClipSettings } from '@/lib/types'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'originals')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    const settingsRaw = formData.get('settings') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (!settingsRaw) {
      return NextResponse.json({ error: 'No settings provided.' }, { status: 400 })
    }

    const settings: ClipSettings = JSON.parse(settingsRaw)

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload MP4, MOV, AVI, or WebM.' },
        { status: 400 }
      )
    }

    // Save file to disk
    await mkdir(UPLOAD_DIR, { recursive: true })
    await mkdir(path.join(process.cwd(), 'uploads', 'clips'), { recursive: true })

    const ext = path.extname(file.name) || '.mp4'
    const savedFileName = `${uuidv4()}${ext}`
    const savedFilePath = path.join(UPLOAD_DIR, savedFileName)

    const bytes = await file.arrayBuffer()
    await writeFile(savedFilePath, Buffer.from(bytes))

    // Create job
    const jobId = uuidv4()
    const job = {
      id: jobId,
      status: 'uploading' as const,
      progress: 5,
      message: 'File uploaded. Starting pipeline…',
      originalFileName: file.name,
      filePath: savedFilePath,
      settings,
      clips: [],
      createdAt: new Date().toISOString(),
    }

    jobStore.set(jobId, job)

    // Run pipeline in the background (don't await — return job ID immediately)
    runPipeline(job).catch(console.error)

    return NextResponse.json({ jobId })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message ?? 'Upload failed.' }, { status: 500 })
  }
}

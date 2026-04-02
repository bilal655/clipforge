import { NextRequest, NextResponse } from 'next/server'
import { createReadStream, statSync } from 'fs'
import path from 'path'

const CLIPS_DIR = path.join(process.cwd(), 'uploads', 'clips')

export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get('file')

  if (!fileName) {
    return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 })
  }

  // Security: prevent path traversal
  const safeFileName = path.basename(fileName)
  const filePath = path.join(CLIPS_DIR, safeFileName)

  try {
    const stat = statSync(filePath)

    // Stream the file back
    const stream = createReadStream(filePath)
    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk))
        stream.on('end', () => controller.close())
        stream.on('error', (err) => controller.error(err))
      },
    })

    return new NextResponse(readable, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}

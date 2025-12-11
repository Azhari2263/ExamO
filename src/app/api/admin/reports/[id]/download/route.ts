import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// GET: Download laporan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Cari laporan
    const report = await prisma.examReport.findUnique({
      where: { id }
    })

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    if (report.status !== 'READY') {
      return NextResponse.json(
        { error: 'Report is not ready for download' },
        { status: 400 }
      )
    }

    // Baca file
    const filePath = report.filePath || join(process.cwd(), 'public', 'reports', `report_${id}.${report.format.toLowerCase()}`)
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Report file not found' },
        { status: 404 }
      )
    }

    const fileBuffer = readFileSync(filePath)
    
    // Tentukan content type
    let contentType = 'application/octet-stream'
    switch (report.format.toLowerCase()) {
      case 'pdf':
        contentType = 'application/pdf'
        break
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break
      case 'csv':
        contentType = 'text/csv'
        break
    }

    // Update download count
    await prisma.examReport.update({
      where: { id },
      data: {
        downloadCount: (report.downloadCount || 0) + 1,
        lastDownloadedAt: new Date()
      }
    })

    // Return file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="report_${report.examId}_${new Date().toISOString().split('T')[0]}.${report.format.toLowerCase()}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error downloading report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
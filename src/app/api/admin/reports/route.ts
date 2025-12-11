import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as ExcelJS from 'exceljs'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// Helper untuk autentikasi admin
async function authenticateAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { token }
    })

    if (!admin) {
      return { error: 'Invalid token', status: 401 }
    }

    return { admin, error: null }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Authentication failed', status: 500 }
  }
}

// GET: Mendapatkan semua laporan
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    const reportType = searchParams.get('reportType')
    const format = searchParams.get('format')

    let whereClause: any = {}

    if (examId && examId !== 'all') {
      whereClause.examId = examId
    }

    if (reportType && reportType !== 'all') {
      whereClause.reportType = reportType
    }

    if (format && format !== 'all') {
      whereClause.format = format
    }

    const reports = await prisma.examReport.findMany({
      where: whereClause,
      include: {
        exam: {
          select: {
            title: true
          }
        },
        generatedByAdmin: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      }
    })

    // Format response
    const formattedReports = reports.map(report => ({
      id: report.id,
      examId: report.examId,
      examTitle: report.exam?.title || 'Unknown',
      generatedBy: report.generatedByAdmin?.user?.name || 'Admin',
      generatedAt: report.generatedAt.toISOString(),
      reportType: report.reportType,
      format: report.format,
      downloadUrl: `/api/admin/reports/${report.id}/download`,
      status: report.status
    }))

    return NextResponse.json(formattedReports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Generate laporan baru
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      )
    }

    const body = await request.json()
    const { examId, reportType, format } = body

    // Validasi input
    if (!examId || !reportType || !format) {
      return NextResponse.json(
        { error: 'Exam ID, report type, and format are required' },
        { status: 400 }
      )
    }

    // Cek apakah ujian ada
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questionBank: true,
        teacher: {
          include: {
            user: true
          }
        }
      }
    })

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Buat record laporan
    const report = await prisma.examReport.create({
      data: {
        examId,
        reportType,
        format,
        status: 'GENERATING',
        generatedByAdminId: auth.admin.id,
        fileName: `report_${examId}_${Date.now()}.${format.toLowerCase()}`
      }
    })

    // Proses generate laporan di background
    setTimeout(async () => {
      try {
        let filePath = ''
        
        switch (format) {
          case 'PDF':
            filePath = await generatePDFReport(exam, reportType, report.id)
            break
          case 'EXCEL':
            filePath = await generateExcelReport(exam, reportType, report.id)
            break
          case 'CSV':
            filePath = await generateCSVReport(exam, reportType, report.id)
            break
        }

        // Update status laporan
        await prisma.examReport.update({
          where: { id: report.id },
          data: {
            status: 'READY',
            filePath
          }
        })
      } catch (error) {
        console.error('Error generating report:', error)
        
        // Update status ke failed
        await prisma.examReport.update({
          where: { id: report.id },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }, 1000) // Delay untuk simulasi proses

    return NextResponse.json(
      {
        message: 'Report generation started',
        reportId: report.id,
        status: 'GENERATING'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error starting report generation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions untuk generate report
async function generatePDFReport(exam: any, reportType: string, reportId: string): Promise<string> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])
  const { width, height } = page.getSize()
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize = 12

  // Judul
  page.drawText(`Laporan Ujian: ${exam.title}`, {
    x: 50,
    y: height - 50,
    size: 18,
    font,
    color: rgb(0, 0, 0)
  })

  // Informasi ujian
  page.drawText(`Tanggal: ${exam.startDate.toLocaleDateString()}`, {
    x: 50,
    y: height - 100,
    size: fontSize,
    font
  })

  page.drawText(`Durasi: ${exam.duration} menit`, {
    x: 50,
    y: height - 120,
    size: fontSize,
    font
  })

  page.drawText(`Pengajar: ${exam.teacher?.user?.name || 'Unknown'}`, {
    x: 50,
    y: height - 140,
    size: fontSize,
    font
  })

  // Berdasarkan tipe laporan
  if (reportType === 'PERFORMANCE') {
    await addPerformanceData(page, exam, font, fontSize, height)
  } else if (reportType === 'PARTICIPANT') {
    await addParticipantData(page, exam, font, fontSize, height)
  } else if (reportType === 'VIOLATION') {
    await addViolationData(page, exam, font, fontSize, height)
  }

  // Save PDF
  const pdfBytes = await pdfDoc.save()
  const reportsDir = join(process.cwd(), 'public', 'reports')
  
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true })
  }

  const filePath = join(reportsDir, `report_${reportId}.pdf`)
  writeFileSync(filePath, pdfBytes)

  return filePath
}

async function generateExcelReport(exam: any, reportType: string, reportId: string): Promise<string> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Report')

  // Header
  worksheet.columns = [
    { header: 'Laporan Ujian', key: 'title' },
    { header: 'Nilai', key: 'value' }
  ]

  worksheet.addRow(['Judul Ujian', exam.title])
  worksheet.addRow(['Tanggal', exam.startDate.toLocaleDateString()])
  worksheet.addRow(['Durasi', `${exam.duration} menit`])
  worksheet.addRow(['Pengajar', exam.teacher?.user?.name || 'Unknown'])

  // Berdasarkan tipe laporan
  if (reportType === 'PERFORMANCE') {
    await addPerformanceExcelData(worksheet, exam)
  }

  // Save Excel
  const reportsDir = join(process.cwd(), 'public', 'reports')
  
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true })
  }

  const filePath = join(reportsDir, `report_${reportId}.xlsx`)
  await workbook.xlsx.writeFile(filePath)

  return filePath
}

async function generateCSVReport(exam: any, reportType: string, reportId: string): Promise<string> {
  let csvContent = 'Field,Value\n'
  csvContent += `Judul Ujian,${exam.title}\n`
  csvContent += `Tanggal,${exam.startDate.toLocaleDateString()}\n`
  csvContent += `Durasi,${exam.duration} menit\n`
  csvContent += `Pengajar,${exam.teacher?.user?.name || 'Unknown'}\n`

  // Save CSV
  const reportsDir = join(process.cwd(), 'public', 'reports')
  
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true })
  }

  const filePath = join(reportsDir, `report_${reportId}.csv`)
  writeFileSync(filePath, csvContent, 'utf-8')

  return filePath
}

// Helper functions untuk data
async function addPerformanceData(page: any, exam: any, font: any, fontSize: number, height: number) {
  // Ambil data performa dari database
  const results = await prisma.examResult.findMany({
    where: { examId: exam.id },
    include: {
      student: {
        include: {
          user: true
        }
      }
    }
  })

  let y = height - 200
  page.drawText('Data Performa Siswa:', {
    x: 50,
    y,
    size: fontSize + 2,
    font,
    color: rgb(0, 0, 0.5)
  })

  y -= 30
  page.drawText('Nama Siswa - Nilai - Status', {
    x: 50,
    y,
    size: fontSize,
    font
  })

  y -= 20
  for (const result of results) {
    if (y < 50) {
      page = page.doc.addPage([600, 800])
      y = 750
    }
    
    page.drawText(`${result.student.user.name} - ${result.score} - ${result.isPassed ? 'Lulus' : 'Tidak Lulus'}`, {
      x: 50,
      y,
      size: fontSize,
      font
    })
    y -= 20
  }
}

async function addParticipantData(page: any, exam: any, font: any, fontSize: number, height: number) {
  const participants = await prisma.examParticipant.findMany({
    where: { examId: exam.id },
    include: {
      student: {
        include: {
          user: true
        }
      }
    }
  })

  let y = height - 200
  page.drawText('Daftar Peserta:', {
    x: 50,
    y,
    size: fontSize + 2,
    font,
    color: rgb(0, 0, 0.5)
  })

  y -= 30
  page.drawText('Nama Siswa - Status Kehadiran', {
    x: 50,
    y,
    size: fontSize,
    font
  })

  y -= 20
  for (const participant of participants) {
    if (y < 50) {
      page = page.doc.addPage([600, 800])
      y = 750
    }
    
    page.drawText(`${participant.student.user.name} - ${participant.status}`, {
      x: 50,
      y,
      size: fontSize,
      font
    })
    y -= 20
  }
}

async function addViolationData(page: any, exam: any, font: any, fontSize: number, height: number) {
  const violations = await prisma.violation.findMany({
    where: { examId: exam.id },
    include: {
      student: {
        include: {
          user: true
        }
      }
    }
  })

  let y = height - 200
  page.drawText('Data Pelanggaran:', {
    x: 50,
    y,
    size: fontSize + 2,
    font,
    color: rgb(0.5, 0, 0)
  })

  y -= 30
  page.drawText('Nama Siswa - Jenis Pelanggaran - Waktu', {
    x: 50,
    y,
    size: fontSize,
    font
  })

  y -= 20
  for (const violation of violations) {
    if (y < 50) {
      page = page.doc.addPage([600, 800])
      y = 750
    }
    
    page.drawText(`${violation.student.user.name} - ${violation.type} - ${violation.timestamp.toLocaleTimeString()}`, {
      x: 50,
      y,
      size: fontSize,
      font
    })
    y -= 20
  }
}

async function addPerformanceExcelData(worksheet: ExcelJS.Worksheet, exam: any) {
  worksheet.addRow([]) // Empty row
  worksheet.addRow(['Data Performa Siswa'])
  worksheet.addRow(['Nama Siswa', 'Nilai', 'Status'])

  const results = await prisma.examResult.findMany({
    where: { examId: exam.id },
    include: {
      student: {
        include: {
          user: true
        }
      }
    }
  })

  for (const result of results) {
    worksheet.addRow([
      result.student.user.name,
      result.score,
      result.isPassed ? 'Lulus' : 'Tidak Lulus'
    ])
  }
}
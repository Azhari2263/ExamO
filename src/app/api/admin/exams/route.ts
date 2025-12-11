import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

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

// GET: Mendapatkan semua ujian
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
    const status = searchParams.get('status')
    const teacherId = searchParams.get('teacherId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let whereClause: any = {}

    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (teacherId && teacherId !== 'all') {
      whereClause.teacherId = teacherId
    }

    if (startDate) {
      whereClause.startDate = {
        gte: new Date(startDate)
      }
    }

    if (endDate) {
      whereClause.endDate = {
        lte: new Date(endDate)
      }
    }

    const exams = await prisma.exam.findMany({
      where: whereClause,
      include: {
        questionBank: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        teacher: {
          select: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            participants: true,
            examResults: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format response
    const formattedExams = exams.map(exam => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      questionBankId: exam.questionBankId,
      questionBankTitle: exam.questionBank?.title || 'Unknown',
      duration: exam.duration,
      startDate: exam.startDate.toISOString(),
      endDate: exam.endDate.toISOString(),
      status: exam.status,
      totalParticipants: exam._count.participants,
      completedParticipants: exam._count.examResults,
      passingGrade: exam.passingGrade,
      isPublished: exam.isPublished,
      accessCode: exam.accessCode,
      createdBy: exam.teacher?.user?.name || 'Unknown',
      createdAt: exam.createdAt.toISOString()
    }))

    return NextResponse.json(formattedExams)
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Membuat ujian baru
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
    const {
      title,
      description,
      questionBankId,
      duration,
      startDate,
      endDate,
      passingGrade,
      teacherId,
      settings
    } = body

    // Validasi input
    if (!title || !questionBankId || !duration || !startDate || !endDate || !teacherId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Cek apakah bank soal ada
    const questionBank = await prisma.questionBank.findUnique({
      where: { id: questionBankId }
    })

    if (!questionBank) {
      return NextResponse.json(
        { error: 'Question bank not found' },
        { status: 404 }
      )
    }

    // Cek apakah teacher ada
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId }
    })

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    // Generate access code
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Buat ujian
    const exam = await prisma.exam.create({
      data: {
        title,
        description: description || '',
        questionBankId,
        duration: parseInt(duration),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        passingGrade: passingGrade || 70,
        teacherId,
        accessCode,
        isPublished: false,
        status: 'DRAFT',
        settings: settings || {}
      }
    })

    return NextResponse.json(
      {
        message: 'Exam created successfully',
        exam,
        accessCode
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating exam:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
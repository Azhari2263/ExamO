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

// GET: Mendapatkan detail ujian
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateAdmin(request)
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      )
    }

    const { id } = params

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questionBank: {
          include: {
            questions: {
              include: {
                answers: true
              }
            }
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
        participants: {
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        },
        examResults: {
          include: {
            student: {
              include: {
                user: true
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
      }
    })

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update ujian
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateAdmin(request)
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Cek apakah ujian ada
    const existingExam = await prisma.exam.findUnique({
      where: { id }
    })

    if (!existingExam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Update ujian
    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        title: body.title || existingExam.title,
        description: body.description !== undefined ? body.description : existingExam.description,
        duration: body.duration ? parseInt(body.duration) : existingExam.duration,
        startDate: body.startDate ? new Date(body.startDate) : existingExam.startDate,
        endDate: body.endDate ? new Date(body.endDate) : existingExam.endDate,
        passingGrade: body.passingGrade || existingExam.passingGrade,
        status: body.status || existingExam.status,
        settings: body.settings || existingExam.settings
      }
    })

    return NextResponse.json({
      message: 'Exam updated successfully',
      exam: updatedExam
    })
  } catch (error) {
    console.error('Error updating exam:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Hapus ujian
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateAdmin(request)
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      )
    }

    const { id } = params

    // Cek apakah ujian ada
    const existingExam = await prisma.exam.findUnique({
      where: { id }
    })

    if (!existingExam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Hapus ujian
    await prisma.exam.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Exam deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting exam:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Publish/Unpublish ujian
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateAdmin(request)
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { publish } = body

    // Cek apakah ujian ada
    const existingExam = await prisma.exam.findUnique({
      where: { id }
    })

    if (!existingExam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      )
    }

    // Update status publish
    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        isPublished: publish,
        status: publish ? 'SCHEDULED' : 'DRAFT'
      }
    })

    return NextResponse.json({
      message: publish ? 'Exam published successfully' : 'Exam unpublished successfully',
      exam: updatedExam
    })
  } catch (error) {
    console.error('Error publishing exam:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
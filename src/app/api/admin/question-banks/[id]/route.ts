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

// GET: Mendapatkan detail bank soal
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

    const questionBank = await prisma.questionBank.findUnique({
      where: { id },
      include: {
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
        questions: {
          include: {
            answers: true
          }
        },
        _count: {
          select: {
            questions: true,
            exams: true
          }
        }
      }
    })

    if (!questionBank) {
      return NextResponse.json(
        { error: 'Question bank not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(questionBank)
  } catch (error) {
    console.error('Error fetching question bank:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update bank soal
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
    const { title, description, category, subject, difficulty, tags, accessType, isActive } = body

    // Cek apakah bank soal ada
    const existingBank = await prisma.questionBank.findUnique({
      where: { id }
    })

    if (!existingBank) {
      return NextResponse.json(
        { error: 'Question bank not found' },
        { status: 404 }
      )
    }

    // Update bank soal
    const updatedBank = await prisma.questionBank.update({
      where: { id },
      data: {
        title: title || existingBank.title,
        description: description !== undefined ? description : existingBank.description,
        category: category || existingBank.category,
        subject: subject !== undefined ? subject : existingBank.subject,
        difficulty: difficulty || existingBank.difficulty,
        tags: tags || existingBank.tags,
        accessType: accessType || existingBank.accessType,
        isActive: isActive !== undefined ? isActive : existingBank.isActive
      }
    })

    return NextResponse.json({
      message: 'Question bank updated successfully',
      questionBank: updatedBank
    })
  } catch (error) {
    console.error('Error updating question bank:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Hapus bank soal
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

    // Cek apakah bank soal ada
    const existingBank = await prisma.questionBank.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            exams: true,
            questions: true
          }
        }
      }
    })

    if (!existingBank) {
      return NextResponse.json(
        { error: 'Question bank not found' },
        { status: 404 }
      )
    }

    // Cek jika bank soal digunakan dalam ujian
    if (existingBank._count.exams > 0) {
      return NextResponse.json(
        { error: 'Cannot delete question bank that is used in exams' },
        { status: 400 }
      )
    }

    // Hapus semua pertanyaan terlebih dahulu
    await prisma.question.deleteMany({
      where: { questionBankId: id }
    })

    // Hapus bank soal
    await prisma.questionBank.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Question bank deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting question bank:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
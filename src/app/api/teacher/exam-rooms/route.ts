import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get teacher's exam rooms
    const examRooms = await db.examRoom.findMany({
      where: {
        teacherId: authUser.teacherId
      },
      include: {
        questionBank: {
          include: {
            questions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(examRooms)

  } catch (error) {
    console.error('Get exam rooms error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      title,
      description,
      questionBankId,
      classCode,
      accessType,
      allowedStudents,
      allowedClasses,
      maxQuestions,
      duration,
      attemptType,
      randomizeOrder,
      randomizeAnswers
    } = await request.json()

    if (!title || !questionBankId) {
      return NextResponse.json(
        { error: 'Title and question bank are required' },
        { status: 400 }
      )
    }

    // Create new exam room
    const examRoom = await db.examRoom.create({
      data: {
        title,
        description,
        questionBankId,
        teacherId: authUser.teacherId!,
        classCode,
        accessType,
        allowedStudents: allowedStudents ? JSON.stringify(allowedStudents.split(',').map((s: string) => s.trim())) : '[]',
        allowedClasses: allowedClasses ? JSON.stringify(allowedClasses.split(',').map((s: string) => s.trim())) : '[]',
        maxQuestions: maxQuestions ? parseInt(maxQuestions) : null,
        duration: duration || 60,
        attemptType,
        randomizeOrder: randomizeOrder || false,
        randomizeAnswers: randomizeAnswers || false
      }
    })

    return NextResponse.json(examRoom, { status: 201 })

  } catch (error) {
    console.error('Create exam room error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
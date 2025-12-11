import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const examRoomId = params.id

    // Get student information
    const student = await db.student.findUnique({
      where: { id: authUser.studentId! },
      include: {
        user: {
          select: {
            status: true
          }
        }
      }
    })

    if (!student || student.user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Student not found or inactive' },
        { status: 404 }
      )
    }

    // Get exam room
    const examRoom = await db.examRoom.findUnique({
      where: { id: examRoomId },
      include: {
        questionBank: true
      }
    })

    if (!examRoom || !examRoom.isActive) {
      return NextResponse.json(
        { error: 'Exam room not found or inactive' },
        { status: 404 }
      )
    }

    // Check access permissions
    if (examRoom.accessType === 'CLASS_RESTRICTED') {
      const allowedClasses = JSON.parse(examRoom.allowedClasses || '[]')
      if (!allowedClasses.includes(student.class)) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }
    
    if (examRoom.accessType === 'STUDENT_RESTRICTED') {
      const allowedStudents = JSON.parse(examRoom.allowedStudents || '[]')
      if (!allowedStudents.includes(student.nim)) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Check if student already has an attempt for single attempt exams
    if (examRoom.attemptType === 'SINGLE') {
      const existingAttempt = await db.examAttempt.findFirst({
        where: {
          examRoomId,
          studentId: student.id,
          status: 'COMPLETED'
        }
      })

      if (existingAttempt) {
        return NextResponse.json(
          { error: 'You have already completed this exam' },
          { status: 400 }
        )
      }
    }

    // Create new exam attempt
    const attempt = await db.examAttempt.create({
      data: {
        examRoomId,
        studentId: student.id,
        status: 'IN_PROGRESS',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      message: 'Exam started successfully',
      attemptId: attempt.id,
      examRoom: {
        id: examRoom.id,
        title: examRoom.title,
        duration: examRoom.duration,
        randomizeOrder: examRoom.randomizeOrder,
        randomizeAnswers: examRoom.randomizeAnswers
      }
    })

  } catch (error) {
    console.error('Start exam error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
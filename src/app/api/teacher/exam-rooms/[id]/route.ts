import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Get exam room with its question bank to verify ownership
    const examRoom = await db.examRoom.findFirst({
      include: {
        questionBank: true
      },
      where: { id }
    })

    if (!examRoom || examRoom.questionBank.teacherId !== authUser.teacherId!) {
      return NextResponse.json(
        { error: 'Exam room not found or access denied' },
        { status: 404 }
      )
    }

    // Update exam room
    const updatedExamRoom = await db.examRoom.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        classCode: body.classCode,
        accessType: body.accessType,
        allowedStudents: body.allowedStudents ? JSON.stringify(body.allowedStudents) : examRoom.allowedStudents,
        allowedClasses: body.allowedClasses ? JSON.stringify(body.allowedClasses) : examRoom.allowedClasses,
        maxQuestions: body.maxQuestions,
        duration: body.duration,
        attemptType: body.attemptType,
        randomizeOrder: body.randomizeOrder,
        randomizeAnswers: body.randomizeAnswers,
        isActive: body.isActive !== undefined ? body.isActive : examRoom.isActive
      }
    })

    return NextResponse.json(updatedExamRoom)

  } catch (error) {
    console.error('Update exam room error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Get exam room with its question bank to verify ownership
    const examRoom = await db.examRoom.findFirst({
      include: {
        questionBank: true
      },
      where: { id }
    })

    if (!examRoom || examRoom.questionBank.teacherId !== authUser.teacherId!) {
      return NextResponse.json(
        { error: 'Exam room not found or access denied' },
        { status: 404 }
      )
    }

    // Delete exam room and related attempts/questions
    await db.examQuestion.deleteMany({
      where: {
        examRoomId: id
      }
    })

    await db.examAttempt.deleteMany({
      where: {
        examRoomId: id
      }
    })

    await db.examRoom.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Exam room deleted successfully' })

  } catch (error) {
    console.error('Delete exam room error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
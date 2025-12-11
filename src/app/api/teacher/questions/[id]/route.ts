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

    // Get question with its question bank to verify ownership
    const question = await db.question.findFirst({
      include: {
        questionBank: true
      },
      where: { id }
    })

    if (!question || question.questionBank.teacherId !== authUser.teacherId!) {
      return NextResponse.json(
        { error: 'Question not found or access denied' },
        { status: 404 }
      )
    }

    // Update question
    const updatedQuestion = await db.question.update({
      where: { id },
      data: {
        type: body.type,
        question: body.question,
        options: body.options,
        correctAnswer: body.correctAnswer,
        explanation: body.explanation,
        points: body.points,
        order: body.order
      }
    })

    return NextResponse.json(updatedQuestion)

  } catch (error) {
    console.error('Update question error:', error)
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

    // Get question with its question bank to verify ownership
    const question = await db.question.findFirst({
      include: {
        questionBank: true
      },
      where: { id }
    })

    if (!question || question.questionBank.teacherId !== authUser.teacherId!) {
      return NextResponse.json(
        { error: 'Question not found or access denied' },
        { status: 404 }
      )
    }

    // Delete question
    await db.question.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Question deleted successfully' })

  } catch (error) {
    console.error('Delete question error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
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

    // Check if question bank belongs to teacher
    const questionBank = await db.questionBank.findFirst({
      where: {
        id,
        teacherId: authUser.teacherId!
      }
    })

    if (!questionBank) {
      return NextResponse.json(
        { error: 'Question bank not found' },
        { status: 404 }
      )
    }

    // Update question bank
    const updatedBank = await db.questionBank.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        difficulty: body.difficulty,
        isActive: body.isActive !== undefined ? body.isActive : questionBank.isActive
      }
    })

    return NextResponse.json(updatedBank)

  } catch (error) {
    console.error('Update question bank error:', error)
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

    // Check if question bank belongs to teacher
    const questionBank = await db.questionBank.findFirst({
      where: {
        id,
        teacherId: authUser.teacherId!
      }
    })

    if (!questionBank) {
      return NextResponse.json(
        { error: 'Question bank not found' },
        { status: 404 }
      )
    }

    // Delete question bank and related questions
    await db.question.deleteMany({
      where: {
        questionBankId: id
      }
    })

    await db.questionBank.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Question bank deleted successfully' })

  } catch (error) {
    console.error('Delete question bank error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
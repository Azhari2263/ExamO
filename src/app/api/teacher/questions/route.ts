import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(
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

    // Get questions for this question bank
    const questions = await db.question.findMany({
      where: {
        questionBankId: id
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(questions)

  } catch (error) {
    console.error('Get questions error:', error)
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

    const { questionBankId, question, options, correctAnswer, explanation, points, order } = await request.json()

    if (!questionBankId || !question) {
      return NextResponse.json(
        { error: 'Question bank ID and question are required' },
        { status: 400 }
      )
    }

    // Check if question bank belongs to teacher
    const questionBank = await db.questionBank.findFirst({
      where: {
        id: questionBankId,
        teacherId: authUser.teacherId!
      }
    })

    if (!questionBank) {
      return NextResponse.json(
        { error: 'Question bank not found' },
        { status: 404 }
      )
    }

    // Create new question
    const newQuestion = await db.question.create({
      data: {
        questionBankId,
        type: question.type || 'MULTIPLE_CHOICE',
        question: question.question,
        options: Array.isArray(options) ? JSON.stringify(options) : options,
        correctAnswer,
        explanation,
        points: points || 1,
        order: order || 0
      }
    })

    return NextResponse.json(newQuestion, { status: 201 })

  } catch (error) {
    console.error('Create question error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
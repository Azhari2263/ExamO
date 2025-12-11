import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const questionBanks = await db.questionBank.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        questions: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedBanks = questionBanks.map(bank => ({
      ...bank,
      questionCount: bank.questions.length,
      teacherName: bank.teacher.user.name
    }))

    return NextResponse.json(formattedBanks)

  } catch (error) {
    console.error('Get question banks error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { title, description, category, difficulty, teacherId } = await request.json()

    if (!title || !teacherId) {
      return NextResponse.json(
        { error: 'Title and teacher are required' },
        { status: 400 }
      )
    }

    // Create new question bank
    const questionBank = await db.questionBank.create({
      data: {
        title,
        description,
        category,
        difficulty,
        teacherId
      }
    })

    return NextResponse.json(questionBank, { status: 201 })

  } catch (error) {
    console.error('Create question bank error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
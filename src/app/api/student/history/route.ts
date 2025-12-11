import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get student's exam attempts
    const attempts = await db.examAttempt.findMany({
      where: {
        studentId: authUser.studentId
      },
      include: {
        examRoom: {
          select: {
            title: true
          }
        },
        result: true
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    return NextResponse.json(attempts)

  } catch (error) {
    console.error('Get exam history error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
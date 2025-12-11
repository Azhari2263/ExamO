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

    const examReports = await db.examReport.findMany({
      include: {
        examRoom: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(examReports)

  } catch (error) {
    console.error('Get exam reports error:', error)
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

    const { examRoomId, title, description, statistics, issues, conclusions } = await request.json()

    if (!examRoomId || !title) {
      return NextResponse.json(
        { error: 'Exam room ID and title are required' },
        { status: 400 }
      )
    }

    // Create exam report
    const examReport = await db.examReport.create({
      data: {
        examRoomId,
        title,
        description,
        statistics: statistics ? JSON.stringify(statistics) : null,
        issues,
        conclusions,
        createdBy: authUser.adminId!
      }
    })

    return NextResponse.json(examReport, { status: 201 })

  } catch (error) {
    console.error('Create exam report error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
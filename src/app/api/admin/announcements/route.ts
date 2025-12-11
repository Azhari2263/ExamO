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

    const announcements = await db.announcement.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(announcements)

  } catch (error) {
    console.error('Get announcements error:', error)
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

    const { title, content, type, target, examRoomId } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Create announcement
    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        type: type || 'GENERAL',
        target: target || 'ALL',
        examRoomId,
        teacherId: authUser.adminId!
      }
    })

    return NextResponse.json(announcement, { status: 201 })

  } catch (error) {
    console.error('Create announcement error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
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

    // Get exam attempts for teacher's exam rooms
    const examAttempts = await db.examAttempt.findMany({
      where: {
        examRoom: {
          teacherId: authUser.teacherId!
        }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
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

    return NextResponse.json(examAttempts)

  } catch (error) {
    console.error('Get exam attempts error:', error)
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

    const { examRoomId, action, data } = await request.json()

    if (!examRoomId || !action) {
      return NextResponse.json(
        { error: 'Exam room ID and action are required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const examRoom = await db.examRoom.findFirst({
      where: {
        id: examRoomId,
        teacherId: authUser.teacherId!
      }
    })

    if (!examRoom) {
      return NextResponse.json(
        { error: 'Exam room not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'terminate':
        // Terminate specific student's attempt
        if (!data.studentId) {
          return NextResponse.json(
            { error: 'Student ID is required' },
            { status: 400 }
          )
        }

        const attempt = await db.examAttempt.findFirst({
          where: {
            examRoomId,
            studentId: data.studentId,
            status: 'IN_PROGRESS'
          }
        })

        if (!attempt) {
          return NextResponse.json(
            { error: 'No active attempt found' },
            { status: 404 }
          )
        }

        await db.examAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'TERMINATED',
            finishedAt: new Date(),
            violations: JSON.stringify(['FORCE_TERMINATED'])
          }
        })

        return NextResponse.json({ message: 'Exam attempt terminated successfully' })

      case 'bulk_terminate':
        // Terminate all active attempts for this exam room
        const attempts = await db.examAttempt.findMany({
          where: {
            examRoomId,
            status: 'IN_PROGRESS'
          }
        })

        for (const attempt of attempts) {
          await db.examAttempt.update({
            where: { id: attempt.id },
            data: {
              status: 'TERMINATED',
              finishedAt: new Date(),
              violations: JSON.stringify(['BULK_TERMINATED'])
            }
          })
        }

        return NextResponse.json({ 
          message: `${attempts.length} exam attempts terminated successfully` 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Exam attempts action error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
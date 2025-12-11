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

    // Get student info
    const student = await db.student.findUnique({
      where: {
        id: authUser.studentId
      },
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

    // Get available exams
    const examRooms = await db.examRoom.findMany({
      where: {
        isActive: true,
        OR: [
          { accessType: 'ALL' },
          { 
            accessType: 'CLASS_RESTRICTED',
            allowedClasses: {
              contains: student.class
            }
          },
          {
            accessType: 'STUDENT_RESTRICTED',
            allowedStudents: {
              contains: student.nim
            }
          }
        ]
      },
      include: {
        questionBank: {
          include: {
            questions: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter exams based on attempt limits
    const availableExams = []
    for (const examRoom of examRooms) {
      if (examRoom.attemptType === 'UNLIMITED') {
        availableExams.push(examRoom)
        continue
      }

      // Check if student has already attempted this exam
      const existingAttempt = await db.examAttempt.findFirst({
        where: {
          examRoomId: examRoom.id,
          studentId: student.id,
          status: 'COMPLETED'
        }
      })

      if (!existingAttempt) {
        availableExams.push(examRoom)
      }
    }

    return NextResponse.json(availableExams)

  } catch (error) {
    console.error('Get available exams error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
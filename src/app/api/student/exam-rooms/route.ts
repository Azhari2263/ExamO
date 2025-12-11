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

    // Get student information
    const student = await db.student.findUnique({
      where: { id: authUser.studentId! },
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

    // Get available exam rooms
    const examRooms = await db.examRoom.findMany({
      where: {
        isActive: true
      },
      include: {
        questionBank: {
          select: {
            id: true,
            title: true,
            category: true,
            difficulty: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter exam rooms based on access permissions
    const availableExamRooms = examRooms.filter(examRoom => {
      if (examRoom.accessType === 'ALL') {
        return true
      }
      
      if (examRoom.accessType === 'CLASS_RESTRICTED') {
        const allowedClasses = JSON.parse(examRoom.allowedClasses || '[]')
        return allowedClasses.includes(student.class)
      }
      
      if (examRoom.accessType === 'STUDENT_RESTRICTED') {
        const allowedStudents = JSON.parse(examRoom.allowedStudents || '[]')
        return allowedStudents.includes(student.nim)
      }
      
      return false
    })

    return NextResponse.json(availableExamRooms)

  } catch (error) {
    console.error('Get student exam rooms error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
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

    // Get dashboard statistics
    const [
      totalStudents,
      totalTeachers,
      totalQuestionBanks,
      totalExamRooms,
      activeExams,
      completedExams,
      suspendedStudents,
      alumniStudents
    ] = await Promise.all([
      db.student.count(),
      db.teacher.count(),
      db.questionBank.count(),
      db.examRoom.count(),
      db.examRoom.count({ where: { isActive: true } }),
      db.examResult.count(),
      db.student.count({
        where: {
          user: {
            status: 'SUSPENDED'
          }
        }
      }),
      db.student.count({
        where: {
          user: {
            status: 'ALUMNI'
          }
        }
      })
    ])

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalQuestionBanks,
      totalExamRooms,
      activeExams,
      completedExams,
      suspendedStudents,
      alumniStudents
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
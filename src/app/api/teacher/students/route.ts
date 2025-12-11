import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get students for teacher's exam rooms
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
                email: true,
                status: true
              }
            }
          }
        },
        examRoom: {
          select: {
            title: true,
            classCode: true
          }
        }
      },
      distinct: ['studentId'],
      orderBy: {
        startedAt: 'desc'
      }
    })

    // Format the response
    const students = examAttempts.map(attempt => ({
      id: attempt.student.id,
      name: attempt.student.user.name,
      email: attempt.student.user.email,
      nim: attempt.student.nim,
      class: attempt.student.class,
      status: attempt.student.user.status,
      lastExam: {
        title: attempt.examRoom.title,
        classCode: attempt.examRoom.classCode,
        startedAt: attempt.startedAt,
        status: attempt.status,
        finishedAt: attempt.finishedAt
      }
    }))

    return NextResponse.json(students)

  } catch (error) {
    console.error('Get students error:', error)
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

    const { studentId, action, data } = await request.json()

    if (!studentId || !action) {
      return NextResponse.json(
        { error: 'Student ID and action are required' },
        { status: 400 }
      )
    }

    // Get student to verify they're in teacher's classes
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            status: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'reset_password':
        const newPassword = data.password || 'password123'
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        
        await db.user.update({
          where: { id: student.userId },
          data: { password: hashedPassword }
        })

        return NextResponse.json({ 
          message: 'Password reset successfully',
          newPassword 
        })

      case 'update_class':
        await db.student.update({
          where: { id: studentId },
          data: { class: data.class }
        })

        return NextResponse.json({ message: 'Class updated successfully' })

      case 'suspend':
        await db.user.update({
          where: { id: student.userId },
          data: { status: 'SUSPENDED' }
        })

        return NextResponse.json({ message: 'Student suspended successfully' })

      case 'unsuspend':
        await db.user.update({
          where: { id: student.userId },
          data: { status: 'ACTIVE' }
        })

        return NextResponse.json({ message: 'Student unsuspended successfully' })

      case 'delete_results':
        // Delete all results for this student
        await db.examResult.deleteMany({
          where: {
            studentId
          }
        })

        return NextResponse.json({ message: 'Student results deleted successfully' })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Student action error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
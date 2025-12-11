import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const { action, data } = await request.json()

    const student = await db.student.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    switch (action) {
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

      case 'alumni':
        await db.user.update({
          where: { id: student.userId },
          data: { status: 'ALUMNI' }
        })
        return NextResponse.json({ message: 'Student marked as alumni successfully' })

      case 'reset_password':
        const newPassword = data?.password || 'password123'
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await db.user.update({
          where: { id: student.userId },
          data: { password: hashedPassword }
        })
        return NextResponse.json({ message: 'Password reset successfully', newPassword })

      case 'update_class':
        await db.student.update({
          where: { id },
          data: { class: data?.class }
        })
        return NextResponse.json({ message: 'Class updated successfully' })

      case 'update_info':
        await db.user.update({
          where: { id: student.userId },
          data: {
            name: data?.name,
            email: data?.email
          }
        })
        await db.student.update({
          where: { id },
          data: {
            class: data?.class,
            grade: data?.grade
          }
        })
        return NextResponse.json({ message: 'Student information updated successfully' })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    const student = await db.student.findUnique({
      where: { id }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Delete student and related user
    await db.student.delete({
      where: { id }
    })

    await db.user.delete({
      where: { id: student.userId }
    })

    return NextResponse.json({ message: 'Student deleted successfully' })

  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
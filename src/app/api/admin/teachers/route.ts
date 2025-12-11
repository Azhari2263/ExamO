import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const teachers = await db.teacher.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(teachers)

  } catch (error) {
    console.error('Get teachers error:', error)
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

    const { name, email, nip, department, password, permissions } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and teacher
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'TEACHER',
        status: 'ACTIVE'
      }
    })

    const teacher = await db.teacher.create({
      data: {
        userId: user.id,
        nip,
        department,
        permissions: JSON.stringify(permissions || ['manage_exams', 'manage_questions'])
      }
    })

    return NextResponse.json(
      { 
        message: 'Teacher created successfully',
        teacher: {
          ...teacher,
          user: {
            name: user.name,
            email: user.email,
            status: user.status
          }
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Create teacher error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
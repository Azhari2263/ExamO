import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { nim, password } = await request.json()

    if (!nim || !password) {
      return NextResponse.json(
        { error: 'NIM dan password harus diisi' },
        { status: 400 }
      )
    }

    // Ambil student + user + password
    const student = await db.student.findUnique({
      where: { nim },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            avatar: true,
            password: true,   // ← WAJIB
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'NIM tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if student is active
    if (student.user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Akun siswa tidak aktif. Hubungi administrator.' },
        { status: 403 }
      )
    }

    // VERIFY PASSWORD
    const isPasswordValid = await bcrypt.compare(password, student.user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: student.user.id,
        studentId: student.id,
        role: 'STUDENT',
        nim: student.nim
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      message: 'Login berhasil',
      token,
      student: {
        id: student.id,
        nim: student.nim,
        class: student.class,
        grade: student.grade,
        user: {
          id: student.user.id,
          name: student.user.name,
          email: student.user.email,
          avatar: student.user.avatar,
          status: student.user.status,
        }
      }
    })

  } catch (error) {
    console.error('Student login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

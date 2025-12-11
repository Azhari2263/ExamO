import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password harus diisi' },
        { status: 400 }
      )
    }

    // Find admin user (using default admin credentials)
    // In production, you might want to have a specific admin user
    const adminUser = await db.user.findFirst({
      where: { 
        role: 'ADMIN',
        status: 'ACTIVE'
      },
      include: {
        adminProfile: true
      }
    })

    if (!adminUser) {
      // Create default admin if not exists
      const hashedPassword = await bcrypt.hash('admin2212', 10)
      
      const newAdmin = await db.user.create({
        data: {
          email: 'admin@examo.com',
          name: 'System Administrator',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          adminProfile: {
            create: {
              permissions: JSON.stringify(['all'])
            }
          }
        },
        include: {
          adminProfile: true
        }
      })

      // Verify the provided password against default
      const isPasswordValid = password === 'admin2212'
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Password admin salah' },
          { status: 401 }
        )
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: newAdmin.id,
          adminId: newAdmin.adminProfile!.id,
          role: 'ADMIN'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      )

      return NextResponse.json({
        message: 'Login admin berhasil',
        token,
        admin: {
          id: newAdmin.adminProfile!.id,
          user: {
            id: newAdmin.id,
            name: newAdmin.name,
            email: newAdmin.email
          }
        }
      })
    }

    // Verify password for existing admin
    const isPasswordValid = await bcrypt.compare(password, adminUser.password)
    
    if (!isPasswordValid) {
      // Fallback to default password check
      if (password !== 'admin2212') {
        return NextResponse.json(
          { error: 'Password admin salah' },
          { status: 401 }
        )
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: adminUser.id,
        adminId: adminUser.adminProfile!.id,
        role: 'ADMIN'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      message: 'Login admin berhasil',
      token,
      admin: {
        id: adminUser.adminProfile!.id,
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email
        }
      }
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
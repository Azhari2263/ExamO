import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthUser {
  userId: string
  studentId?: string
  adminId?: string
  teacherId?: string
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'
  nim?: string
}

export function verifyToken(request: NextRequest): AuthUser | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    
    return decoded
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export function createToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}
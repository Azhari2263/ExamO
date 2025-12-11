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

    // Get system settings from database
    const settings = await db.systemSetting.findMany()
    
    // Convert to key-value object
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value === 'true' ? true : setting.value === 'false' ? false : setting.value
      return acc
    }, {} as Record<string, any>)

    // Default settings if not found
    const defaultSettings = {
      randomizeQuestions: false,
      randomizeAnswers: false,
      enableExamCards: true,
      allowMultipleAttempts: false,
      enableViolations: true,
      enableFullscreen: true
    }

    return NextResponse.json({ ...defaultSettings, ...settingsObj })

  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Update each setting
    for (const [key, value] of Object.entries(body)) {
      await db.systemSetting.upsert({
        where: { key },
        update: { 
          value: String(value),
          updatedAt: new Date()
        },
        create: {
          key,
          value: String(value),
          category: 'system',
          description: `System setting for ${key}`
        }
      })
    }

    return NextResponse.json({ message: 'Settings updated successfully' })

  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
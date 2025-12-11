import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper untuk autentikasi admin
async function authenticateAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { token }
    })

    if (!admin) {
      return { error: 'Invalid token', status: 401 }
    }

    return { admin, error: null }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Authentication failed', status: 500 }
  }
}

// GET: Mendapatkan semua pengumuman
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')

    let whereClause: any = {}

    if (status === 'published') {
      whereClause.isPublished = true
    } else if (status === 'draft') {
      whereClause.isPublished = false
    }

    if (type && type !== 'all') {
      whereClause.type = type
    }

    if (priority && priority !== 'all') {
      whereClause.priority = priority
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      include: {
        createdByAdmin: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format response
    const formattedAnnouncements = announcements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      isPublished: announcement.isPublished,
      publishDate: announcement.publishDate.toISOString(),
      expiryDate: announcement.expiryDate.toISOString(),
      createdAt: announcement.createdAt.toISOString(),
      createdBy: announcement.createdByAdmin?.user?.name || 'Admin',
      attachments: announcement.attachments
    }))

    return NextResponse.json(formattedAnnouncements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Membuat pengumuman baru
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request)
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      content,
      type,
      priority,
      publishDate,
      expiryDate,
      attachments,
      isPublished
    } = body

    // Validasi input
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Buat pengumuman
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type || 'INFO',
        priority: priority || 'MEDIUM',
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 hari default
        attachments: attachments || [],
        isPublished: isPublished || false,
        createdByAdminId: auth.admin.id
      }
    })

    return NextResponse.json(
      {
        message: 'Announcement created successfully',
        announcement
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
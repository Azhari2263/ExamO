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

// GET: Mendapatkan detail pengumuman
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateAdmin(request)
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      )
    }

    const { id } = params

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        createdByAdmin: {
          select: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error fetching announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update pengumuman
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateAdmin(request)
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Cek apakah pengumuman ada
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Update pengumuman
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        title: body.title || existingAnnouncement.title,
        content: body.content || existingAnnouncement.content,
        type: body.type || existingAnnouncement.type,
        priority: body.priority || existingAnnouncement.priority,
        publishDate: body.publishDate ? new Date(body.publishDate) : existingAnnouncement.publishDate,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : existingAnnouncement.expiryDate,
        attachments: body.attachments || existingAnnouncement.attachments,
        isPublished: body.isPublished !== undefined ? body.isPublished : existingAnnouncement.isPublished
      }
    })

    return NextResponse.json({
      message: 'Announcement updated successfully',
      announcement: updatedAnnouncement
    })
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Hapus pengumuman
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateAdmin(request)
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      )
    }

    const { id } = params

    // Cek apakah pengumuman ada
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Hapus pengumuman
    await prisma.announcement.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Announcement deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
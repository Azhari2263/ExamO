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

// GET: Mendapatkan detail FAQ
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

    const faq = await prisma.faq.findUnique({
      where: { id }
    })

    if (!faq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      )
    }

    // Tambah view count
    await prisma.faq.update({
      where: { id },
      data: {
        views: faq.views + 1
      }
    })

    return NextResponse.json(faq)
  } catch (error) {
    console.error('Error fetching FAQ:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update FAQ
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

    // Cek apakah FAQ ada
    const existingFaq = await prisma.faq.findUnique({
      where: { id }
    })

    if (!existingFaq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      )
    }

    // Update FAQ
    const updatedFaq = await prisma.faq.update({
      where: { id },
      data: {
        question: body.question || existingFaq.question,
        answer: body.answer || existingFaq.answer,
        category: body.category || existingFaq.category,
        order: body.order !== undefined ? body.order : existingFaq.order,
        isPublished: body.isPublished !== undefined ? body.isPublished : existingFaq.isPublished
      }
    })

    return NextResponse.json({
      message: 'FAQ updated successfully',
      faq: updatedFaq
    })
  } catch (error) {
    console.error('Error updating FAQ:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Hapus FAQ
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

    // Cek apakah FAQ ada
    const existingFaq = await prisma.faq.findUnique({
      where: { id }
    })

    if (!existingFaq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      )
    }

    // Hapus FAQ
    await prisma.faq.delete({
      where: { id }
    })

    // Update order FAQ lain dalam kategori yang sama
    await prisma.faq.updateMany({
      where: {
        category: existingFaq.category,
        order: { gt: existingFaq.order }
      },
      data: {
        order: { decrement: 1 }
      }
    })

    return NextResponse.json({
      message: 'FAQ deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Feedback untuk FAQ
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { helpful } = body

    // Cek apakah FAQ ada
    const existingFaq = await prisma.faq.findUnique({
      where: { id }
    })

    if (!existingFaq) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      )
    }

    // Update feedback
    const updatedFaq = await prisma.faq.update({
      where: { id },
      data: helpful === true 
        ? { helpful: existingFaq.helpful + 1 }
        : { notHelpful: existingFaq.notHelpful + 1 }
    })

    return NextResponse.json({
      message: 'Feedback recorded successfully',
      faq: updatedFaq
    })
  } catch (error) {
    console.error('Error recording feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
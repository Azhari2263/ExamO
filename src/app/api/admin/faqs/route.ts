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

// GET: Mendapatkan semua FAQ
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
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let whereClause: any = {}

    if (category && category !== 'all') {
      whereClause.category = category
    }

    if (status === 'published') {
      whereClause.isPublished = true
    } else if (status === 'draft') {
      whereClause.isPublished = false
    }

    if (search) {
      whereClause.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    const faqs = await prisma.faq.findMany({
      where: whereClause,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(faqs)
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Membuat FAQ baru
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
    const { question, answer, category, order, isPublished } = body

    // Validasi input
    if (!question || !answer || !category) {
      return NextResponse.json(
        { error: 'Question, answer, and category are required' },
        { status: 400 }
      )
    }

    // Cari order terakhir jika tidak disediakan
    let finalOrder = order
    if (!order) {
      const lastFaq = await prisma.faq.findFirst({
        where: { category },
        orderBy: { order: 'desc' }
      })
      finalOrder = lastFaq ? lastFaq.order + 1 : 1
    }

    // Buat FAQ
    const faq = await prisma.faq.create({
      data: {
        question,
        answer,
        category,
        order: finalOrder,
        isPublished: isPublished || false,
        views: 0,
        helpful: 0,
        notHelpful: 0
      }
    })

    return NextResponse.json(
      {
        message: 'FAQ created successfully',
        faq
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating FAQ:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
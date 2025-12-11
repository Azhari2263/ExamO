import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authUser = verifyToken(request)
    if (!authUser || authUser.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { examRoomId } = await request.json()

    if (!examRoomId) {
      return NextResponse.json(
        { error: 'Exam room ID is required' },
        { status: 400 }
      )
    }

    // Get exam room details
    const examRoom = await db.examRoom.findUnique({
      where: {
        id: examRoomId,
        isActive: true
      },
      include: {
        questionBank: {
          include: {
            questions: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    })

    if (!examRoom) {
      return NextResponse.json(
        { error: 'Exam room not found or inactive' },
        { status: 404 }
      )
    }

    // Get student info
    const student = await db.student.findUnique({
      where: {
        id: authUser.studentId
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    if (examRoom.accessType === 'CLASS_RESTRICTED') {
      const allowedClasses = JSON.parse(examRoom.allowedClasses || '[]')
      if (!allowedClasses.includes(student.class)) {
        return NextResponse.json(
          { error: 'Access denied - class not allowed' },
          { status: 403 }
        )
      }
    } else if (examRoom.accessType === 'STUDENT_RESTRICTED') {
      const allowedStudents = JSON.parse(examRoom.allowedStudents || '[]')
      if (!allowedStudents.includes(student.nim)) {
        return NextResponse.json(
          { error: 'Access denied - student not allowed' },
          { status: 403 }
        )
      }
    }

    // Check if student has already attempted this exam (for single attempt)
    if (examRoom.attemptType === 'SINGLE') {
      const existingAttempt = await db.examAttempt.findFirst({
        where: {
          examRoomId,
          studentId: student.id,
          status: 'COMPLETED'
        }
      })

      if (existingAttempt) {
        return NextResponse.json(
          { error: 'You have already attempted this exam' },
          { status: 403 }
        )
      }
    }

    // Create exam attempt
    const attempt = await db.examAttempt.create({
      data: {
        examRoomId,
        studentId: student.id,
        status: 'IN_PROGRESS',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Prepare questions (with randomization if enabled)
    let questions = examRoom.questionBank.questions
    
    if (examRoom.randomizeOrder) {
      questions = questions.sort(() => Math.random() - 0.5)
    }

    // Limit questions if maxQuestions is set
    if (examRoom.maxQuestions && examRoom.maxQuestions < questions.length) {
      questions = questions.slice(0, examRoom.maxQuestions)
    }

    // Create exam questions for this attempt
    for (let i = 0; i < questions.length; i++) {
      await db.examQuestion.create({
        data: {
          examRoomId,
          questionId: questions[i].id,
          order: i + 1
        }
      })
    }

    // Process questions for client (randomize answers if needed)
    const processedQuestions = questions.map(q => {
      let options = JSON.parse(q.options || '[]')
      
      if (examRoom.randomizeAnswers && options.length > 0) {
        options = options.sort(() => Math.random() - 0.5)
      }

      return {
        ...q,
        options: JSON.stringify(options)
      }
    })

    return NextResponse.json({
      attemptId: attempt.id,
      questions: processedQuestions
    })

  } catch (error) {
    console.error('Start exam error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
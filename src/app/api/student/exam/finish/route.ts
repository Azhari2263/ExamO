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

    const { examRoomId, answers, timeSpent } = await request.json()

    if (!examRoomId || !answers) {
      return NextResponse.json(
        { error: 'Exam room ID and answers are required' },
        { status: 400 }
      )
    }

    // Get the exam attempt
    const attempt = await db.examAttempt.findFirst({
      where: {
        examRoomId,
        studentId: authUser.studentId,
        status: 'IN_PROGRESS'
      },
      include: {
        examRoom: {
          include: {
            questionBank: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    })

    if (!attempt) {
      return NextResponse.json(
        { error: 'No active exam attempt found' },
        { status: 404 }
      )
    }

    // Calculate results
    const questions = attempt.examRoom.questionBank.questions
    let correctAnswers = 0
    let wrongAnswers = 0
    let unanswered = 0
    let totalPoints = 0
    let earnedPoints = 0

    // Save answers and calculate results
    for (const question of questions) {
      const studentAnswer = answers[question.id]
      const isCorrect = studentAnswer === question.correctAnswer
      
      totalPoints += question.points
      
      if (studentAnswer) {
        if (isCorrect) {
          correctAnswers++
          earnedPoints += question.points
        } else {
          wrongAnswers++
        }
        
        // Save answer
        await db.examAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: attempt.id,
              questionId: question.id
            }
          },
          update: {
            answer: studentAnswer,
            isCorrect,
            pointsEarned: isCorrect ? question.points : 0,
            timeSpent: Math.floor(timeSpent / questions.length) // Approximate time per question
          },
          create: {
            attemptId: attempt.id,
            questionId: question.id,
            answer: studentAnswer,
            isCorrect,
            pointsEarned: isCorrect ? question.points : 0,
            timeSpent: Math.floor(timeSpent / questions.length)
          }
        })
      } else {
        unanswered++
      }
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0

    // Update attempt
    await db.examAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        timeSpent
      }
    })

    // Create result
    const result = await db.examResult.create({
      data: {
        attemptId: attempt.id,
        studentId: authUser.studentId,
        examRoomId,
        totalQuestions: questions.length,
        correctAnswers,
        wrongAnswers,
        unanswered,
        totalPoints,
        earnedPoints,
        percentage,
        timeSpent,
        violations: attempt.violations
      }
    })

    return NextResponse.json({
      message: 'Exam completed successfully',
      result: {
        totalQuestions: questions.length,
        correctAnswers,
        wrongAnswers,
        unanswered,
        percentage: Math.round(percentage * 100) / 100,
        grade: percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'D'
      }
    })

  } catch (error) {
    console.error('Finish exam error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
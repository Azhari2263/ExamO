import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    try {
        // Hash password
        const hashedPassword = await hash('admin123', 10)

        // Create admin user - FIXED: menggunakan relasi yang benar
        const adminUser = await prisma.user.create({
            data: {
                name: 'Admin Examo',
                email: 'admin@examo.com',
                password: hashedPassword,
                role: 'ADMIN'
            }
        })

        // Create admin profile separately
        await prisma.admin.create({
            data: {
                userId: adminUser.id,
                permissions: '["ALL"]'
            }
        })

        console.log('✅ Admin created:', adminUser.email)

        // Create teacher user - FIXED
        const teacherUser = await prisma.user.create({
            data: {
                name: 'Prof. Ahmad',
                email: 'ahmad@examo.com',
                password: hashedPassword,
                role: 'TEACHER'
            }
        })

        // Create teacher profile separately
        await prisma.teacher.create({
            data: {
                userId: teacherUser.id,
                nip: '198001012001011001',
                department: 'Matematika',
                permissions: '["MANAGE_EXAMS", "VIEW_STUDENTS"]'
            }
        })

        console.log('✅ Teacher created:', teacherUser.email)

        // Create student users - FIXED
        const studentData = [
            {
                name: 'John Doe',
                email: 'john@examo.com',
                nim: '20210001',
                className: 'XII IPA 1',
                grade: '12',
                major: 'IPA'
            },
            {
                name: 'Jane Smith',
                email: 'jane@examo.com',
                nim: '20210002',
                className: 'XII IPA 2',
                grade: '12',
                major: 'IPA'
            },
            {
                name: 'Bob Johnson',
                email: 'bob@examo.com',
                nim: '20210003',
                className: 'XI IPA 1',
                grade: '11',
                major: 'IPA'
            }
        ]

        for (const student of studentData) {
            const studentUser = await prisma.user.create({
                data: {
                    name: student.name,
                    email: student.email,
                    password: hashedPassword,
                    role: 'STUDENT'
                }
            })

            // Create student profile separately
            await prisma.student.create({
                data: {
                    userId: studentUser.id,
                    nim: student.nim,
                    class: student.className,
                    grade: student.grade,
                    major: student.major
                }
            })

            console.log(`✅ Student created: ${studentUser.email}`)
        }

        // Get teacher
        const teacher = await prisma.teacher.findFirst({
            where: { userId: teacherUser.id }
        })

        if (!teacher) {
            throw new Error('Teacher not found')
        }

        // Create question bank
        const questionBank = await prisma.questionBank.create({
            data: {
                title: 'Matematika Dasar Kelas 12',
                description: 'Kumpulan soal matematika dasar untuk persiapan ujian akhir',
                category: 'REGULAR',
                difficulty: 'MEDIUM',
                teacherId: teacher.id,
                isPublic: true,
                questions: {
                    create: [
                        {
                            type: 'MULTIPLE_CHOICE',
                            question: 'Berapakah hasil dari 2 + 2?',
                            options: '["3", "4", "5", "6"]',
                            correctAnswer: '4',
                            points: 1,
                            order: 1
                        },
                        {
                            type: 'MULTIPLE_CHOICE',
                            question: 'Berapakah nilai dari π (pi) yang umum digunakan?',
                            options: '["3.14", "2.71", "1.61", "9.81"]',
                            correctAnswer: '3.14',
                            points: 1,
                            order: 2
                        },
                        {
                            type: 'MULTIPLE_CHOICE',
                            question: 'Berapakah hasil dari 5 × 8?',
                            options: '["35", "40", "45", "50"]',
                            correctAnswer: '40',
                            points: 1,
                            order: 3
                        }
                    ]
                }
            }
        })

        console.log('✅ Question bank created:', questionBank.title)

        // Get questions for exam
        const questions = await prisma.question.findMany({
            where: { questionBankId: questionBank.id },
            take: 3
        })

        // Create exam room - FIXED: menggunakan relasi yang benar
        const examRoom = await prisma.examRoom.create({
            data: {
                title: 'Ujian Matematika Semester 1',
                description: 'Ujian akhir semester 1 mata pelajaran matematika',
                questionBankId: questionBank.id,
                teacherId: teacher.id,
                classCode: 'MATH2024',
                duration: 120,
                attemptType: 'SINGLE',
                randomizeOrder: true,
                randomizeAnswers: true,
                isActive: true,
                scheduledStart: new Date('2024-12-20T08:00:00'),
                scheduledEnd: new Date('2024-12-20T10:00:00')
            }
        })

        // Create exam questions separately - FIXED
        for (const [index, question] of questions.entries()) {
            await prisma.examQuestion.create({
                data: {
                    examRoomId: examRoom.id,
                    questionId: question.id,
                    order: index
                }
            })
        }

        console.log('✅ Exam room created:', examRoom.title)

        // Create second exam room (completed)
        const completedExamRoom = await prisma.examRoom.create({
            data: {
                title: 'Tryout UTBK Fisika',
                description: 'Tryout persiapan UTBK mata pelajaran fisika',
                questionBankId: questionBank.id,
                teacherId: teacher.id,
                classCode: 'FISIKA2024',
                duration: 90,
                attemptType: 'UNLIMITED',
                randomizeOrder: true,
                randomizeAnswers: false,
                isActive: false,
                scheduledStart: new Date('2024-11-15T09:00:00'),
                scheduledEnd: new Date('2024-11-15T10:30:00')
            }
        })

        // Create exam questions for second room
        for (const [index, question] of questions.entries()) {
            await prisma.examQuestion.create({
                data: {
                    examRoomId: completedExamRoom.id,
                    questionId: question.id,
                    order: index
                }
            })
        }

        console.log('✅ Completed exam room created:', completedExamRoom.title)

        // Get admin
        const admin = await prisma.admin.findFirst({
            where: { userId: adminUser.id }
        })

        if (!admin) {
            throw new Error('Admin not found')
        }

        // Create announcement
        const announcement = await prisma.announcement.create({
            data: {
                title: 'Maintenance Sistem',
                content: 'Sistem akan down untuk maintenance pada tanggal 15 Februari 2024 pukul 00:00 - 04:00 WIB. Mohon maaf atas ketidaknyamanannya.',
                type: 'WARNING',
                target: 'ALL',
                priority: 'HIGH',
                isPublished: true,
                publishDate: new Date(),
                expiryDate: new Date('2024-12-31'),
                attachments: '[]',
                createdByAdminId: admin.id
            }
        })

        console.log('✅ Announcement created:', announcement.title)

        // Create exam report
        const examReport = await prisma.examReport.create({
            data: {
                title: 'Laporan Ujian Matematika Semester 1',
                description: 'Analisis hasil ujian matematika semester 1',
                examRoomId: examRoom.id,
                createdBy: admin.id,
                statistics: JSON.stringify({
                    totalStudents: 45,
                    averageScore: 75.5,
                    highestScore: 98,
                    lowestScore: 42,
                    passRate: 82.2
                }),
                issues: 'Beberapa siswa mengalami kesulitan pada soal nomor 5 dan 8',
                conclusions: 'Perlu tambahan materi pada topik trigonometri'
            }
        })

        console.log('✅ Exam report created:', examReport.title)

        // Create system settings
        const settingsData = [
            { key: 'randomizeQuestions', value: JSON.stringify(false), description: 'Acak urutan soal', category: 'system' },
            { key: 'randomizeAnswers', value: JSON.stringify(false), description: 'Acak urutan jawaban', category: 'system' },
            { key: 'enableFullscreen', value: JSON.stringify(true), description: 'Mode layar penuh saat ujian', category: 'security' },
            { key: 'allowMultipleAttempts', value: JSON.stringify(false), description: 'Izinkan percobaan ulang', category: 'exam' },
            { key: 'enableViolations', value: JSON.stringify(true), description: 'Deteksi pelanggaran', category: 'security' },
            { key: 'enableExamCards', value: JSON.stringify(true), description: 'Kartu ujian', category: 'exam' },
            { key: 'showResultsImmediately', value: JSON.stringify(false), description: 'Tampilkan hasil langsung', category: 'exam' }
        ]

        for (const setting of settingsData) {
            await prisma.systemSetting.create({
                data: setting
            })
            console.log(`✅ Setting created: ${setting.key}`)
        }

        // Get all students
        const students = await prisma.student.findMany({
            include: { user: true }
        })

        // For each student, create an exam attempt in the first exam room
        for (const student of students) {
            const attempt = await prisma.examAttempt.create({
                data: {
                    examRoomId: examRoom.id,
                    studentId: student.id,
                    status: 'COMPLETED',
                    startedAt: new Date('2024-12-20T08:00:00'),
                    finishedAt: new Date('2024-12-20T09:30:00'),
                    timeSpent: 5400,
                    violations: '[]',
                    ipAddress: '192.168.1.100',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            })

            // Create exam answers for this attempt - FIXED: menggunakan UncheckedCreateInput
            for (const question of questions) {
                const isCorrect = Math.random() > 0.3 // 70% chance correct
                await prisma.examAnswer.create({
                    data: {
                        attemptId: attempt.id,
                        questionId: question.id,
                        studentId: student.id,
                        answer: question.correctAnswer,
                        isCorrect: isCorrect,
                        pointsEarned: isCorrect ? question.points : 0,
                        timeSpent: Math.floor(Math.random() * 300) + 60
                    }
                })
            }

            // Create exam result
            const correctAnswers = Math.floor(Math.random() * questions.length) + 1
            const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
            const earnedPoints = Math.floor(totalPoints * (correctAnswers / questions.length))

            await prisma.examResult.create({
                data: {
                    attemptId: attempt.id,
                    studentId: student.id,
                    examRoomId: examRoom.id,
                    totalQuestions: questions.length,
                    correctAnswers: correctAnswers,
                    wrongAnswers: questions.length - correctAnswers,
                    unanswered: 0,
                    totalPoints: totalPoints,
                    earnedPoints: earnedPoints,
                    percentage: (correctAnswers / questions.length) * 100,
                    timeSpent: 5400,
                    violations: '[]'
                }
            })

            console.log(`✅ Exam attempt created for student: ${student.user.name}`)
        }


        console.log('\n🎉 Seeding completed successfully!')
        console.log('📊 Summary:')
        console.log('- 👑 Admin: 1')
        console.log('- 👨‍🏫 Teacher: 1')
        console.log('- 👨‍🎓 Students: 3')
        console.log('- 📚 Question Banks: 1')
        console.log('- 📝 Questions: 3')
        console.log('- 🏫 Exam Rooms: 2')
        console.log('- 📄 Exam Reports: 1')
        console.log('- 📊 Exam Attempts: 3')
        console.log('- 📝 Exam Answers: 9 (3 questions × 3 students)')
        console.log('- 📈 Exam Results: 3')
        console.log('- ⚙️ Settings: 7')
        console.log('\n🔑 Admin Password: admin123')
        console.log('📧 Admin Email: admin@examo.com')
        console.log('📧 Teacher Email: ahmad@examo.com')
        console.log('\n🚀 Ready to run the application!')

    } catch (error) {
        console.error('❌ Error during seeding:', error)
        throw error
    }
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed!')
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
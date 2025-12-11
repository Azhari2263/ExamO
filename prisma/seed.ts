import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  try {
    // Hash password
    const hashedPassword = await hash('admin123', 10)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin Examo',
        email: 'admin@examo.com',
        password: hashedPassword,
        role: 'ADMIN',
        admin: {
          create: {
            permissions: ['ALL'],
            token: 'admin_token_123'
          }
        }
      }
    })

    console.log('✅ Admin created:', adminUser.email)

    // Create teacher user
    const teacherUser = await prisma.user.create({
      data: {
        name: 'Prof. Ahmad',
        email: 'ahmad@examo.com',
        password: hashedPassword,
        role: 'TEACHER',
        teacher: {
          create: {
            nip: '198001012001011001',
            department: 'Matematika',
            expertise: ['Aljabar', 'Kalkulus', 'Statistika']
          }
        }
      }
    })

    console.log('✅ Teacher created:', teacherUser.email)

    // Create student users
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
          role: 'STUDENT',
          student: {
            create: {
              nim: student.nim,
              class: student.className,
              grade: student.grade,
              major: student.major
            }
          }
        }
      })
      console.log(`✅ Student created: ${studentUser.email}`)
    }

    // Create question bank
    const questionBank = await prisma.questionBank.create({
      data: {
        title: 'Matematika Dasar Kelas 12',
        description: 'Kumpulan soal matematika dasar untuk persiapan ujian akhir',
        category: 'REGULAR',
        subject: 'Matematika',
        difficulty: 'MEDIUM',
        teacherId: (await prisma.teacher.findFirst())!.id,
        tags: ['matematika', 'kelas-12', 'dasar'],
        accessType: 'PUBLIC',
        questions: {
          create: [
            {
              text: 'Berapakah hasil dari 2 + 2?',
              type: 'MULTIPLE_CHOICE',
              difficulty: 'EASY',
              points: 1,
              answers: {
                create: [
                  { text: '3', isCorrect: false, order: 1 },
                  { text: '4', isCorrect: true, order: 2 },
                  { text: '5', isCorrect: false, order: 3 },
                  { text: '6', isCorrect: false, order: 4 }
                ]
              }
            },
            {
              text: 'Berapakah nilai dari π (pi) yang umum digunakan?',
              type: 'MULTIPLE_CHOICE',
              difficulty: 'EASY',
              points: 1,
              answers: {
                create: [
                  { text: '3.14', isCorrect: true, order: 1 },
                  { text: '2.71', isCorrect: false, order: 2 },
                  { text: '1.61', isCorrect: false, order: 3 },
                  { text: '9.81', isCorrect: false, order: 4 }
                ]
              }
            },
            {
              text: 'Berapakah hasil dari 5 × 8?',
              type: 'MULTIPLE_CHOICE',
              difficulty: 'EASY',
              points: 1,
              answers: {
                create: [
                  { text: '35', isCorrect: false, order: 1 },
                  { text: '40', isCorrect: true, order: 2 },
                  { text: '45', isCorrect: false, order: 3 },
                  { text: '50', isCorrect: false, order: 4 }
                ]
              }
            }
          ]
        }
      }
    })

    console.log('✅ Question bank created:', questionBank.title)

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        title: 'Ujian Matematika Semester 1',
        description: 'Ujian akhir semester 1 mata pelajaran matematika',
        questionBankId: questionBank.id,
        duration: 120,
        startDate: new Date('2024-12-20T08:00:00'),
        endDate: new Date('2024-12-20T10:00:00'),
        passingGrade: 70,
        teacherId: (await prisma.teacher.findFirst())!.id,
        accessCode: 'MATH2024',
        isPublished: true,
        status: 'SCHEDULED',
        settings: JSON.stringify({
          randomizeQuestions: true,
          randomizeAnswers: true,
          enableFullscreen: true,
          allowMultipleAttempts: false,
          enableViolations: true
        })
      }
    })

    console.log('✅ Exam created:', exam.title)

    // Create second exam (completed)
    const completedExam = await prisma.exam.create({
      data: {
        title: 'Tryout UTBK Fisika',
        description: 'Tryout persiapan UTBK mata pelajaran fisika',
        questionBankId: questionBank.id,
        duration: 90,
        startDate: new Date('2024-11-15T09:00:00'),
        endDate: new Date('2024-11-15T10:30:00'),
        passingGrade: 65,
        teacherId: (await prisma.teacher.findFirst())!.id,
        accessCode: 'FISIKA2024',
        isPublished: true,
        status: 'COMPLETED',
        settings: JSON.stringify({
          randomizeQuestions: true,
          randomizeAnswers: false,
          enableFullscreen: true,
          allowMultipleAttempts: true,
          enableViolations: false
        })
      }
    })

    console.log('✅ Completed exam created:', completedExam.title)

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title: 'Maintenance Sistem',
        content: 'Sistem akan down untuk maintenance pada tanggal 15 Februari 2024 pukul 00:00 - 04:00 WIB. Mohon maaf atas ketidaknyamanannya.',
        type: 'WARNING',
        priority: 'HIGH',
        isPublished: true,
        publishDate: new Date(),
        expiryDate: new Date('2024-12-31'),
        attachments: [],
        createdByAdminId: (await prisma.admin.findFirst())!.id
      }
    })

    console.log('✅ Announcement created:', announcement.title)

    // Create FAQ
    const faqData = [
      {
        question: 'Bagaimana cara reset password?',
        answer: 'Anda dapat reset password melalui menu "Lupa Password" di halaman login atau hubungi admin melalui email admin@examo.com.',
        category: 'account',
        order: 1,
        isPublished: true
      },
      {
        question: 'Apa yang harus dilakukan jika tidak bisa mengakses ujian?',
        answer: 'Pastikan koneksi internet stabil dan browser yang digunakan sudah up-to-date. Jika masih bermasalah, hubungi technical support.',
        category: 'technical',
        order: 2,
        isPublished: true
      },
      {
        question: 'Berapa lama waktu yang diberikan untuk mengerjakan ujian?',
        answer: 'Waktu ujian bervariasi tergantung jenis ujian. Biasanya antara 90-120 menit. Informasi lengkap dapat dilihat di halaman detail ujian.',
        category: 'exam',
        order: 3,
        isPublished: true
      }
    ]

    for (const faq of faqData) {
      await prisma.faq.create({
        data: faq
      })
      console.log(`✅ FAQ created: ${faq.question.substring(0, 50)}...`)
    }

    // Create system settings
    const settingsData = [
      { key: 'randomizeQuestions', value: false, description: 'Acak urutan soal', category: 'EXAM' },
      { key: 'randomizeAnswers', value: false, description: 'Acak urutan jawaban', category: 'EXAM' },
      { key: 'enableFullscreen', value: true, description: 'Mode layar penuh saat ujian', category: 'SECURITY' },
      { key: 'allowMultipleAttempts', value: false, description: 'Izinkan percobaan ulang', category: 'EXAM' },
      { key: 'enableViolations', value: true, description: 'Deteksi pelanggaran', category: 'SECURITY' },
      { key: 'enableExamCards', value: true, description: 'Kartu ujian', category: 'EXAM' },
      { key: 'showResultsImmediately', value: false, description: 'Tampilkan hasil langsung', category: 'EXAM' }
    ]

    for (const setting of settingsData) {
      await prisma.systemSetting.create({
        data: {
          ...setting,
          value: JSON.stringify(setting.value)
        }
      })
      console.log(`✅ Setting created: ${setting.key}`)
    }

    console.log('\n🎉 Seeding completed successfully!')
    console.log('📊 Summary:')
    console.log('- 👑 Admin: 1')
    console.log('- 👨‍🏫 Teacher: 1')
    console.log('- 👨‍🎓 Students: 3')
    console.log('- 📚 Question Banks: 1')
    console.log('- 📝 Exams: 2')
    console.log('- 📢 Announcements: 1')
    console.log('- ❓ FAQs: 3')
    console.log('- ⚙️ Settings: 7')
    console.log('\n🔑 Admin Token: admin_token_123')
    console.log('🔑 Admin Password: admin123')
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
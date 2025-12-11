'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  FileQuestion, 
  Clock, 
  User, 
  LogOut,
  Play,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  History,
  AlertTriangle,
  Timer,
  Eye,
  Monitor
} from 'lucide-react'
import { Label } from '@/components/ui/label'

interface ExamRoom {
  id: string
  title: string
  description?: string
  classCode?: string
  accessType: string
  allowedStudents: string
  allowedClasses: string
  maxQuestions?: number
  duration: number
  attemptType: string
  randomizeOrder: boolean
  randomizeAnswers: boolean
  isActive: boolean
  scheduledStart?: string
  scheduledEnd?: string
  questionBank: {
    title: string
    questions: Question[]
  }
}

interface Question {
  id: string
  type: string
  question: string
  options: string
  correctAnswer: string
  explanation?: string
  points: number
  order: number
}

interface ExamAttempt {
  id: string
  examRoomId: string
  status: string
  startedAt: string
  finishedAt?: string
  timeSpent?: number
  violations: string
  result?: {
    totalQuestions: number
    correctAnswers: number
    wrongAnswers: number
    unanswered: number
    percentage: number
    grade?: string
  }
}

interface Student {
  id: string
  nim: string
  class: string
  grade?: string
  user: {
    name: string
    email: string
    avatar?: string
  }
}

export default function StudentDashboard() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [availableExams, setAvailableExams] = useState<ExamRoom[]>([])
  const [examHistory, setExamHistory] = useState<ExamAttempt[]>([])
  const [currentExam, setCurrentExam] = useState<ExamRoom | null>(null)
  const [examQuestions, setExamQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [examStartTime, setExamStartTime] = useState<Date | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('exams')
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [selectedExam, setSelectedExam] = useState<ExamRoom | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('studentToken')
    if (!token) {
      router.push('/')
      return
    }

    fetchStudentData()
  }, [router])

  useEffect(() => {
    if (timeRemaining > 0 && currentExam) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeRemaining === 0 && currentExam) {
      finishExam()
    }
  }, [timeRemaining, currentExam])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      if (currentExam && !document.fullscreenElement) {
        // Violation detected
        handleViolation('FULLSCREEN_EXIT')
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      if (currentExam) {
        handleViolation('RIGHT_CLICK')
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentExam) {
        if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
          e.preventDefault()
          handleViolation('COPY_PASTE')
        }
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault()
          handleViolation('KEYBOARD_SHORTCUT')
        }
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentExam])

  const fetchStudentData = async () => {
    try {
      // Get student data
      const studentResponse = await fetch('/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
        }
      })

      if (studentResponse.ok) {
        const data = await studentResponse.json()
        setStudent(data)
      }

      // Get available exams
      const examsResponse = await fetch('/api/student/exams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
        }
      })

      if (examsResponse.ok) {
        const data = await examsResponse.json()
        setAvailableExams(data)
      }

      // Get exam history
      const historyResponse = await fetch('/api/student/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
        }
      })

      if (historyResponse.ok) {
        const data = await historyResponse.json()
        setExamHistory(data)
      }
    } catch (error) {
      console.error('Error fetching student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('studentToken')
    localStorage.removeItem('studentData')
    router.push('/')
  }

  const startExam = async (exam: ExamRoom) => {
    try {
      const response = await fetch('/api/student/exam/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
        },
        body: JSON.stringify({ examRoomId: exam.id })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentExam(exam)
        setExamQuestions(data.questions)
        setTimeRemaining(exam.duration * 60)
        setExamStartTime(new Date())
        setShowStartConfirm(false)
        
        // Request fullscreen
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen()
        }
      }
    } catch (error) {
      console.error('Error starting exam:', error)
    }
  }

  const finishExam = async () => {
    if (!currentExam) return

    try {
      const response = await fetch('/api/student/exam/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
        },
        body: JSON.stringify({
          examRoomId: currentExam.id,
          answers,
          timeSpent: currentExam.duration * 60 - timeRemaining
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
        
        setCurrentExam(null)
        setExamQuestions([])
        setAnswers({})
        setCurrentQuestionIndex(0)
        setTimeRemaining(0)
        setExamStartTime(null)
        
        // Show result
        alert(`Ujian selesai! Nilai Anda: ${data.result.percentage}%`)
        
        // Refresh data
        fetchStudentData()
      }
    } catch (error) {
      console.error('Error finishing exam:', error)
    }
  }

  const handleViolation = (type: string) => {
    console.warn(`Violation detected: ${type}`)
    // In a real implementation, you would send this to the server
  }

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (currentExam) {
    const currentQuestion = examQuestions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / examQuestions.length) * 100

    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Exam Header */}
        <header className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold">
              E
            </div>
            <div>
              <h1 className="font-bold">{currentExam.title}</h1>
              <p className="text-sm text-slate-300">Mode Ujian</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span className={`font-mono font-bold ${timeRemaining < 300 ? 'text-red-400' : ''}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span className="text-sm">
                {isFullscreen ? 'Layar Penuh' : 'Keluar Layar Penuh'}
              </span>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={finishExam}
            >
              Selesaikan Ujian
            </Button>
          </div>
        </header>

        {/* Exam Content */}
        <div className="flex-1 flex">
          {/* Question Navigation */}
          <aside className="w-64 bg-slate-50 p-4 border-r">
            <h3 className="font-bold text-sm mb-4 text-slate-700">Navigasi Soal</h3>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {examQuestions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-full aspect-square rounded-lg text-sm font-bold transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[question.id]
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Dijawab:</span>
                <span className="font-bold text-green-600">{Object.keys(answers).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Belum:</span>
                <span className="font-bold text-red-600">{examQuestions.length - Object.keys(answers).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Progress:</span>
                <span className="font-bold">{Math.round(progress)}%</span>
              </div>
            </div>
            
            <Progress value={progress} className="mt-4" />
          </aside>

          {/* Question Content */}
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                  {currentQuestionIndex + 1}
                </div>
                <div className="flex-1">
                  <div className="text-lg font-medium text-slate-800 leading-relaxed">
                    {currentQuestion.question}
                  </div>
                  <div className="text-sm text-slate-500 mt-2">
                    Poin: {currentQuestion.points}
                  </div>
                </div>
              </div>

              {/* Answer Options */}
              <div className="space-y-3 ml-16">
                {JSON.parse(currentQuestion.options || '[]').map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => selectAnswer(currentQuestion.id, option)}
                    className={`w-full p-4 text-left border rounded-lg transition-all ${
                      answers[currentQuestion.id] === option
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        answers[currentQuestion.id] === option
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-400'
                      }`}>
                        {answers[currentQuestion.id] === option && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 ml-16">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Sebelumnya
                </Button>
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(examQuestions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === examQuestions.length - 1}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl">
              E
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Examo Student</h1>
              <p className="text-sm text-slate-500">Portal Siswa</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {student && (
              <div className="text-right">
                <div className="font-medium text-slate-800">{student.user.name}</div>
                <div className="text-sm text-slate-500">{student.nim} • {student.class}</div>
              </div>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exams">Ujian Tersedia</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
          </TabsList>

          {/* Available Exams */}
          <TabsContent value="exams" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Ujian Tersedia</h2>
              <p className="text-slate-600">Pilih ujian yang ingin Anda kerjakan</p>
            </div>

            {availableExams.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileQuestion className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">Tidak Ada Ujian</h3>
                  <p className="text-slate-500">Belum ada ujian yang tersedia saat ini</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableExams.map((exam) => (
                  <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{exam.title}</CardTitle>
                          <CardDescription>{exam.description}</CardDescription>
                        </div>
                        <Badge variant={exam.isActive ? "default" : "secondary"}>
                          {exam.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Bank Soal:</span>
                          <span>{exam.questionBank.title}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Jumlah Soal:</span>
                          <span>{exam.maxQuestions || exam.questionBank.questions.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Durasi:</span>
                          <span>{exam.duration} menit</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Percobaan:</span>
                          <span>{exam.attemptType}</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={() => {
                          setSelectedExam(exam)
                          setShowStartConfirm(true)
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Mulai Ujian
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Exam History */}
          <TabsContent value="history" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Riwayat Ujian</h2>
              <p className="text-slate-600">Hasil ujian yang telah Anda kerjakan</p>
            </div>

            {examHistory.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">Belum Ada Riwayat</h3>
                  <p className="text-slate-500">Anda belum pernah mengerjakan ujian</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {examHistory.map((attempt) => (
                  <Card key={attempt.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            attempt.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {attempt.status === 'COMPLETED' ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : (
                              <XCircle className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {attempt.examRoomId} {/* Replace with exam title */}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {new Date(attempt.startedAt).toLocaleDateString()} • 
                              {attempt.timeSpent ? ` ${Math.floor(attempt.timeSpent / 60)} menit` : ''}
                            </p>
                          </div>
                        </div>
                        
                        {attempt.result && (
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getGradeColor(attempt.result.percentage)}`}>
                              {attempt.result.percentage}%
                            </div>
                            <div className="text-sm text-slate-500">
                              {attempt.result.correctAnswers}/{attempt.result.totalQuestions} benar
                            </div>
                            {attempt.result.grade && (
                              <Badge variant="outline" className="mt-1">
                                {attempt.result.grade}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Profil Saya</h2>
              <p className="text-slate-600">Informasi akun dan pengaturan</p>
            </div>

            {student && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardContent className="p-6 text-center">
                    <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                      {student.user.name.charAt(0)}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{student.user.name}</h3>
                    <p className="text-slate-500">{student.nim}</p>
                    <Badge variant="outline" className="mt-2">
                      {student.class}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Informasi Akun</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-500">Nama Lengkap</Label>
                        <p className="font-medium">{student.user.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-500">NIM</Label>
                        <p className="font-medium">{student.nim}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-500">Kelas</Label>
                        <p className="font-medium">{student.class}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-500">Email</Label>
                        <p className="font-medium">{student.user.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Start Exam Confirmation Modal */}
      {showStartConfirm && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Mulai Ujian?</CardTitle>
              <CardDescription>
                {selectedExam.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Penting!</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Ujian akan berjalan dalam mode layar penuh</li>
                  <li>• Keluar dari layar penuh akan menghentikan ujian</li>
                  <li>• Pastikan koneksi internet stabil</li>
                  <li>• Waktu akan terus berjalan</li>
                </ul>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-slate-500">Durasi</Label>
                  <p className="font-medium">{selectedExam.duration} menit</p>
                </div>
                <div>
                  <Label className="text-slate-500">Jumlah Soal</Label>
                  <p className="font-medium">{selectedExam.maxQuestions || selectedExam.questionBank.questions.length}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowStartConfirm(false)}
                >
                  Batal
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => startExam(selectedExam)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Mulai Ujian
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
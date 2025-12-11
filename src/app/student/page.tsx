'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  FileQuestion,
  LogOut,
  Play,
  CheckCircle,
  XCircle,
  History,
  AlertTriangle,
  Timer,
  Monitor,
  BookOpen,
  UserCircle,
  Bell,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
  Info,
  Calendar,
  FileText,
  Clock,
  Users,
  Download,
  Mail,
  Shield,
  Moon,
  Zap,
  Globe,
  Smartphone,
  Headphones,
  Phone,
  Key,
  Database,
  ShieldCheck,
  Lock,
  Eye,
  ExternalLink,
  DownloadCloud,
  User,
  CreditCard,
  LifeBuoy,
  Book,
  Video,
  Users as UsersIcon,
  File,
  MessageCircle
} from 'lucide-react'

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

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  timestamp: string
  read: boolean
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Ujian Baru Tersedia',
      message: 'Ujian Matematika Dasar telah dibuka untuk kelas Anda',
      type: 'info',
      timestamp: '2024-01-15T10:30:00',
      read: false
    },
    {
      id: '2',
      title: 'Pengingat Ujian',
      message: 'Ujian Fisika akan dimulai besok jam 09:00',
      type: 'warning',
      timestamp: '2024-01-14T14:20:00',
      read: false
    },
    {
      id: '3',
      title: 'Hasil Ujian Diterbitkan',
      message: 'Hasil ujian Kimia sudah bisa dilihat',
      type: 'success',
      timestamp: '2024-01-13T16:45:00',
      read: true
    },
    {
      id: '4',
      title: 'Perubahan Jadwal',
      message: 'Ujian Biologi diundur ke minggu depan',
      type: 'info',
      timestamp: '2024-01-12T11:15:00',
      read: true
    }
  ])

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
      const studentResponse = await fetch('/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
        }
      })

      if (studentResponse.ok) {
        const data = await studentResponse.json()
        setStudent(data)
      }

      const examsResponse = await fetch('/api/student/exams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
        }
      })

      if (examsResponse.ok) {
        const data = await examsResponse.json()
        setAvailableExams(data)
      }

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
        
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
        
        setCurrentExam(null)
        setExamQuestions([])
        setAnswers({})
        setCurrentQuestionIndex(0)
        setTimeRemaining(0)
        setExamStartTime(null)
        
        alert(`Ujian selesai! Nilai Anda: ${data.result.percentage}%`)
        fetchStudentData()
      }
    } catch (error) {
      console.error('Error finishing exam:', error)
    }
  }

  const handleViolation = (type: string) => {
    console.warn(`Violation detected: ${type}`)
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

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-100'
      case 'warning': return 'bg-yellow-50 border-yellow-100'
      case 'success': return 'bg-green-50 border-green-100'
      case 'error': return 'bg-red-50 border-red-100'
    }
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length

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
        <header className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl shadow-lg shadow-blue-600/20 overflow-hidden">
              <img
                src="/Logo_Examo.png"
                alt="ExamO Logo"
                className="w-full h-full object-cover"
              />
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

        <div className="flex-1 flex">
          <aside className="w-64 bg-slate-50 p-4 border-r">
            <h3 className="font-bold text-sm mb-4 text-slate-700">Navigasi Soal</h3>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {examQuestions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-full aspect-square rounded-lg text-sm font-bold transition-colors ${index === currentQuestionIndex
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

              <div className="space-y-3 ml-16">
                {JSON.parse(currentQuestion.options || '[]').map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => selectAnswer(currentQuestion.id, option)}
                    className={`w-full p-4 text-left border rounded-lg transition-all ${answers[currentQuestion.id] === option
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion.id] === option
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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-slate-200 min-h-screen transition-all duration-300 sticky top-0 flex flex-col`}>
        <div className="p-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg shadow shadow-blue-600/10 overflow-hidden">
                  <img
                    src="/Logo_Examo.png"
                    alt="ExamO Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800 text-sm">ExamO</h1>
                  <p className="text-xs text-slate-500">Student</p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg shadow shadow-blue-600/10 overflow-hidden mx-auto">
                <img
                  src="/Logo_Examo.png"
                  alt="ExamO Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors ml-2"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        <nav className="p-2 space-y-1 flex-1">
          <button
            onClick={() => setActiveTab('exams')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'} py-2.5 rounded-lg transition-colors ${activeTab === 'exams' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            title="Ujian Tersedia"
          >
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">Ujian Tersedia</span>}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'} py-2.5 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            title="Riwayat Ujian"
          >
            <History className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">Riwayat Ujian</span>}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'} py-2.5 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            title="Profil Saya"
          >
            <UserCircle className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">Profil Saya</span>}
          </button>

          <div className="pt-2 mt-2">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'} py-2.5 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              title="Pengaturan"
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm">Pengaturan</span>}
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'} py-2.5 rounded-lg transition-colors ${activeTab === 'help' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              title="Bantuan"
            >
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm">Bantuan</span>}
            </button>
          </div>
        </nav>

        {!sidebarCollapsed && student && (
          <div className="p-4 border-t border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {student.user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{student.user.name}</p>
                <p className="text-xs text-slate-500 truncate">{student.class}</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'} p-2.5 rounded-lg transition-colors text-red-600 hover:bg-red-50 text-sm`}
            title={sidebarCollapsed ? 'Keluar' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {activeTab === 'exams' && 'Ujian Tersedia'}
                {activeTab === 'history' && 'Riwayat Ujian'}
                {activeTab === 'profile' && 'Profil Saya'}
                {activeTab === 'settings' && 'Pengaturan'}
                {activeTab === 'help' && 'Bantuan & Dukungan'}
              </h2>
              <p className="text-sm text-slate-500">
                {activeTab === 'exams' && 'Pilih ujian yang ingin Anda kerjakan'}
                {activeTab === 'history' && 'Hasil ujian yang telah Anda kerjakan'}
                {activeTab === 'profile' && 'Informasi akun dan pengaturan profil'}
                {activeTab === 'settings' && 'Atur preferensi dan keamanan akun Anda'}
                {activeTab === 'help' && 'Panduan penggunaan dan dukungan teknis'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                      <div className="p-4 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-800">Notifikasi</h3>
                          <div className="flex items-center gap-2">
                            {unreadNotificationsCount > 0 && (
                              <button
                                onClick={markAllNotificationsAsRead}
                                className="text-sm text-blue-600 hover:text-blue-700"
                              >
                                Tandai semua sudah dibaca
                              </button>
                            )}
                            <button
                              onClick={() => setShowNotifications(false)}
                              className="p-1 hover:bg-slate-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">Tidak ada notifikasi</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-slate-100 last:border-b-0 cursor-pointer hover:bg-slate-50 transition-colors ${getNotificationColor(notification.type)} ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-medium text-slate-800">{notification.title}</h4>
                                    <span className="text-xs text-slate-500">
                                      {new Date(notification.timestamp).toLocaleDateString('id-ID')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600">{notification.message}</p>
                                  {!notification.read && (
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-lg">
                        <button className="text-sm text-blue-600 hover:text-blue-700 w-full text-center">
                          Lihat semua notifikasi
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {student && (
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium text-slate-800 text-sm">{student.user.name}</div>
                    <div className="text-xs text-slate-500">{student.nim}</div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                    {student.user.name.charAt(0)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'exams' && (
            <div className="max-w-7xl mx-auto">
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
                    <Card key={exam.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <CardTitle className="text-lg mb-1">{exam.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
                          </div>
                          <Badge variant={exam.isActive ? "default" : "secondary"}>
                            {exam.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 flex-1">
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            <span>{exam.questionBank.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span>{exam.maxQuestions || exam.questionBank.questions.length} soal</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{exam.duration} menit</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>{exam.attemptType}</span>
                          </div>
                        </div>

                        <Button
                          className="w-full mt-auto"
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
            </div>
          )}

          {activeTab === 'history' && (
            <div className="max-w-7xl mx-auto">
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
                    <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start md:items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${attempt.status === 'COMPLETED'
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
                              <h3 className="font-semibold text-slate-800 mb-1">
                                {attempt.examRoomId}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                <span>{new Date(attempt.startedAt).toLocaleDateString('id-ID', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}</span>
                                <span>•</span>
                                {attempt.timeSpent && (
                                  <span>{Math.floor(attempt.timeSpent / 60)} menit</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {attempt.result && (
                            <div className="text-center md:text-right">
                              <div className={`text-2xl font-bold ${getGradeColor(attempt.result.percentage)}`}>
                                {attempt.result.percentage}%
                              </div>
                              <div className="text-sm text-slate-500 mb-2">
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
            </div>
          )}

          {activeTab === 'profile' && student && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 h-fit">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                        {student.user.name.charAt(0)}
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1">{student.user.name}</h3>
                      <p className="text-slate-500 mb-3">{student.nim}</p>
                      <Badge variant="outline" className="mb-6">
                        {student.class}
                      </Badge>

                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Total Ujian:</span>
                          <span className="font-medium">{examHistory.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Rata-rata Nilai:</span>
                          <span className="font-medium">
                            {examHistory.length > 0
                              ? Math.round(examHistory.reduce((sum, attempt) =>
                                sum + (attempt.result?.percentage || 0), 0) / examHistory.length)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Status:</span>
                          <Badge variant="success">Aktif</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Informasi Akun</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-slate-500 mb-2 block">Nama Lengkap</Label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{student.user.name}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-500 mb-2 block">NIM</Label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{student.nim}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-500 mb-2 block">Kelas</Label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{student.class}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-500 mb-2 block">Email</Label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{student.user.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium text-slate-800 mb-4">Statistik Ujian</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="text-2xl font-bold text-blue-600 mb-1">{examHistory.length}</div>
                          <div className="text-sm text-blue-600">Total Ujian</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {examHistory.filter(e => e.status === 'COMPLETED').length}
                          </div>
                          <div className="text-sm text-green-600">Selesai</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            {Math.round(examHistory.reduce((sum, attempt) =>
                              sum + (attempt.result?.percentage || 0), 0) / Math.max(examHistory.length, 1))}%
                          </div>
                          <div className="text-sm text-purple-600">Rata-rata</div>
                        </div>
                        <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
                          <div className="text-2xl font-bold text-amber-600 mb-1">
                            {examHistory.length > 0
                              ? Math.max(...examHistory.map(e => e.result?.percentage || 0))
                              : 0}%
                          </div>
                          <div className="text-sm text-amber-600">Tertinggi</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pengaturan Akun</CardTitle>
                      <CardDescription>Atur preferensi dan keamanan akun Anda</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Bell className="w-5 h-5" />
                          Notifikasi
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-500" />
                                <Label className="font-medium text-slate-700">Notifikasi Email</Label>
                              </div>
                              <p className="text-sm text-slate-500 ml-6">Kirim notifikasi via email</p>
                            </div>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-slate-500" />
                                <Label className="font-medium text-slate-700">Notifikasi Browser</Label>
                              </div>
                              <p className="text-sm text-slate-500 ml-6">Tampilkan notifikasi di browser</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-slate-500" />
                                <Label className="font-medium text-slate-700">Notifikasi Aplikasi</Label>
                              </div>
                              <p className="text-sm text-slate-500 ml-6">Notifikasi push di perangkat mobile</p>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          Tampilan
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4 text-slate-500" />
                                <Label className="font-medium text-slate-700">Mode Gelap</Label>
                              </div>
                              <p className="text-sm text-slate-500 ml-6">Tema gelap untuk kenyamanan mata</p>
                            </div>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-slate-500" />
                                <Label className="font-medium text-slate-700">Sidebar Otomatis</Label>
                              </div>
                              <p className="text-sm text-slate-500 ml-6">Sembunyikan sidebar secara otomatis</p>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Keamanan & Privasi
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <DownloadCloud className="w-4 h-4 text-slate-500" />
                                  <Label className="font-medium text-slate-700">Ekspor Data Pribadi</Label>
                                </div>
                                <p className="text-sm text-slate-500 ml-6">Unduh semua data pribadi Anda</p>
                              </div>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Ekspor
                              </Button>
                            </div>
                          </div>
                          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-red-500" />
                                  <Label className="font-medium text-red-700">Hapus Akun</Label>
                                </div>
                                <p className="text-sm text-red-500 ml-6">Tindakan ini tidak dapat dibatalkan</p>
                              </div>
                              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-100">
                                <Lock className="w-4 h-4 mr-2" />
                                Hapus
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-6 border-t border-slate-200 bg-slate-50">
                      <Button className="w-full">Simpan Perubahan</Button>
                    </div>
                  </Card>
                </div>

                <div className="lg:col-span-1">
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle className="text-lg">Tips & Panduan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Optimalkan Pengalaman
                        </h4>
                        <p className="text-sm text-blue-600">
                          Aktifkan notifikasi browser untuk pengingat ujian real-time.
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Keamanan Akun
                        </h4>
                        <p className="text-sm text-green-600">
                          Selalu logout setelah selesai menggunakan komputer publik.
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          Privasi Data
                        </h4>
                        <p className="text-sm text-purple-600">
                          Ekspor data pribadi untuk cadangan atau keperluan administrasi.
                        </p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                        <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          Kata Sandi
                        </h4>
                        <p className="text-sm text-amber-600">
                          Gunakan kata sandi yang kuat dan jangan bagikan dengan siapapun.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Panduan Penggunaan</CardTitle>
                      <CardDescription>Pelajari cara menggunakan sistem ujian online ExamO</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Book className="w-5 h-5" />
                          Cara Mengikuti Ujian
                        </h3>
                        <div className="space-y-3 pl-2">
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                1
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-800 mb-1">Pilih Ujian</h4>
                                <p className="text-sm text-slate-600">Pilih ujian yang tersedia dari menu "Ujian Tersedia"</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                2
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-800 mb-1">Baca Petunjuk</h4>
                                <p className="text-sm text-slate-600">Baca petunjuk dan ketentuan ujian dengan seksama sebelum memulai</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                3
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-800 mb-1">Mulai Ujian</h4>
                                <p className="text-sm text-slate-600">Klik tombol "Mulai Ujian" untuk memulai ujian</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                4
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-800 mb-1">Kerjakan Soal</h4>
                                <p className="text-sm text-slate-600">Jawab soal dengan mengklik pilihan jawaban yang tersedia</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                5
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-800 mb-1">Selesaikan</h4>
                                <p className="text-sm text-slate-600">Klik "Selesaikan Ujian" ketika sudah selesai atau waktu habis</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Ketentuan Penting
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <Monitor className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-yellow-800 mb-1">Mode Layar Penuh</h4>
                              <p className="text-sm text-yellow-700">Ujian harus dikerjakan dalam mode layar penuh. Keluar dari mode ini dapat menghentikan ujian.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                            <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-red-800 mb-1">Kunci Browser</h4>
                              <p className="text-sm text-red-700">Klik kanan, copy-paste, dan shortcut keyboard tertentu dinonaktifkan selama ujian.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <Globe className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-800 mb-1">Koneksi Internet</h4>
                              <p className="text-sm text-blue-700">Pastikan koneksi internet stabil selama ujian berlangsung.</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <Clock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-purple-800 mb-1">Waktu Ujian</h4>
                              <p className="text-sm text-purple-700">Waktu akan terus berjalan meskipun browser ditutup atau terjadi gangguan.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Kontak Dukungan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-blue-800">Email</h4>
                            <p className="text-sm text-blue-600">support@examo.edu</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                          <Phone className="w-5 h-5 text-green-600" />
                          <div>
                            <h4 className="font-medium text-green-800">Telepon</h4>
                            <p className="text-sm text-green-600">(021) 1234-5678</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                          <Globe className="w-5 h-5 text-purple-600" />
                          <div>
                            <h4 className="font-medium text-purple-800">Website</h4>
                            <p className="text-sm text-purple-600">www.examo.edu/support</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                          <Headphones className="w-5 h-5 text-amber-600" />
                          <div>
                            <h4 className="font-medium text-amber-800">Jam Operasional</h4>
                            <p className="text-sm text-amber-600">Senin - Jumat, 08:00 - 17:00 WIB</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-6 border-t border-slate-200 bg-slate-50">
                      <Button className="w-full">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Hubungi Dukungan
                      </Button>
                    </div>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Video Panduan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <Video className="w-4 h-4 mr-2" />
                          Cara Daftar Ujian
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Video className="w-4 h-4 mr-2" />
                          Tips Sukses Ujian
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Video className="w-4 h-4 mr-2" />
                          Troubleshooting
                        </Button>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600">
                          Tonton panduan video untuk penjelasan lebih detail tentang fitur-fitur ExamO.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Start Exam Confirmation Modal */}
      {showStartConfirm && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
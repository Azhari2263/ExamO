'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Users,
  FileQuestion,
  ChartBar,
  Settings,
  LogOut,
  Shield,
  GraduationCap,
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Power,
  PowerOff,
  UserPlus,
  UserMinus,
  Key,
  Copy,
  Calendar,
  FileText,
  HelpCircle,
  Video,
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  BookMarked,
  FileCheck,
  Bell,
  List,
  FileSpreadsheet,
  Printer,
  Share2,
  Lock,
  Unlock,
  CalendarDays,
  Hash,
  Type,
  CheckSquare,
  BarChart,
  TrendingUp,
  Award,
  Clock3,
  FileBarChart,
  DownloadCloud,
  Users2,
  School,
  FolderOpen,
  Archive,
  Tag,
  Edit2,
  EyeOff,
  Send,
  Pin,
  BellRing,
  Globe,
  UserCheck,
  ClipboardCheck,
  ShieldCheck,
  History,
  BarChart3,
  PieChart
} from 'lucide-react'

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalQuestionBanks: number
  totalExams: number
  activeExams: number
  completedExams: number
  pendingExams: number
  suspendedStudents: number
  alumniStudents: number
  totalAnnouncements: number
  totalFAQs: number
  totalReports: number
}

interface SystemSettings {
  randomizeQuestions: boolean
  randomizeAnswers: boolean
  enableExamCards: boolean
  allowMultipleAttempts: boolean
  enableViolations: boolean
  enableFullscreen: boolean
  enableProctoring: boolean
  timeLimitStrict: boolean
  showResultsImmediately: boolean
  allowQuestionReview: boolean
}

interface QuestionBank {
  id: string
  title: string
  description: string
  category: string
  subject: string
  difficulty: string
  questionCount: number
  teacherName: string
  teacherId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  tags: string[]
  accessType: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED'
}

interface Exam {
  id: string
  title: string
  description: string
  questionBankId: string
  questionBankTitle: string
  duration: number
  startDate: string
  endDate: string
  status: 'DRAFT' | 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  totalParticipants: number
  completedParticipants: number
  passingGrade: number
  isPublished: boolean
  accessCode: string
  createdBy: string
  createdAt: string
}

interface Announcement {
  id: string
  title: string
  content: string
  type: 'INFO' | 'WARNING' | 'IMPORTANT' | 'EVENT'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  isPublished: boolean
  publishDate: string
  expiryDate: string
  createdAt: string
  createdBy: string
  attachments: string[]
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  views: number
  helpful: number
  notHelpful: number
}

interface ExamReport {
  id: string
  examId: string
  examTitle: string
  generatedBy: string
  generatedAt: string
  reportType: 'PARTICIPANT' | 'PERFORMANCE' | 'VIOLATION' | 'COMPREHENSIVE'
  format: 'PDF' | 'EXCEL' | 'CSV'
  downloadUrl: string
  status: 'GENERATING' | 'READY' | 'FAILED'
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalQuestionBanks: 0,
    totalExams: 0,
    activeExams: 0,
    completedExams: 0,
    pendingExams: 0,
    suspendedStudents: 0,
    alumniStudents: 0,
    totalAnnouncements: 0,
    totalFAQs: 0,
    totalReports: 0
  })

  const [settings, setSettings] = useState<SystemSettings>({
    randomizeQuestions: false,
    randomizeAnswers: false,
    enableExamCards: true,
    allowMultipleAttempts: false,
    enableViolations: true,
    enableFullscreen: true,
    enableProctoring: false,
    timeLimitStrict: true,
    showResultsImmediately: false,
    allowQuestionReview: true
  })

  // Student Management States
  const [students, setStudents] = useState<any[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [studentStatusFilter, setStudentStatusFilter] = useState('all')
  const [studentClassFilter, setStudentClassFilter] = useState('all')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showImportStudents, setShowImportStudents] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)

  // Teacher Management States
  const [teachers, setTeachers] = useState<any[]>([])
  const [teacherSearch, setTeacherSearch] = useState('')
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<any>(null)

  // Question Banks States
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([])
  const [showAddQuestionBank, setShowAddQuestionBank] = useState(false)
  const [editingQuestionBank, setEditingQuestionBank] = useState<QuestionBank | null>(null)
  const [questionBankFilter, setQuestionBankFilter] = useState('all')
  const [questionBankSearch, setQuestionBankSearch] = useState('')

  // Exams States
  const [exams, setExams] = useState<Exam[]>([])
  const [showAddExam, setShowAddExam] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [examFilter, setExamFilter] = useState('all')
  const [examSearch, setExamSearch] = useState('')

  // Announcements States
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [announcementFilter, setAnnouncementFilter] = useState('all')

  // FAQ States
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [showAddFAQ, setShowAddFAQ] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [faqFilter, setFaqFilter] = useState('all')
  const [faqSearch, setFaqSearch] = useState('')

  // Reports States
  const [reports, setReports] = useState<ExamReport[]>([])
  const [showGenerateReport, setShowGenerateReport] = useState(false)
  const [selectedExamForReport, setSelectedExamForReport] = useState<string>('')
  const [reportType, setReportType] = useState<'PARTICIPANT' | 'PERFORMANCE' | 'VIOLATION' | 'COMPREHENSIVE'>('PERFORMANCE')
  const [reportFormat, setReportFormat] = useState<'PDF' | 'EXCEL' | 'CSV'>('PDF')

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/')
      return
    }

    fetchDashboardData()
    if (activeTab === 'students') fetchStudents()
    if (activeTab === 'teachers') fetchTeachers()
    if (activeTab === 'question-banks') fetchQuestionBanks()
    if (activeTab === 'exams') fetchExams()
    if (activeTab === 'announcements') fetchAnnouncements()
    if (activeTab === 'faq') fetchFAQs()
    if (activeTab === 'reports') fetchReports()
  }, [router, activeTab])

  // Computed properties
  const availableClasses = [...new Set(students.map(s => s.class))].filter(Boolean)
  
  const filteredStudents = students.filter(student => {
    const matchesSearch = !studentSearch ||
      student.user.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.nim.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.class.toLowerCase().includes(studentSearch.toLowerCase())

    const matchesStatus = studentStatusFilter === 'all' || student.user.status === studentStatusFilter
    const matchesClass = studentClassFilter === 'all' || student.class === studentClassFilter

    return matchesSearch && matchesStatus && matchesClass
  })

  const filteredTeachers = teachers.filter(teacher => {
    return !teacherSearch ||
      teacher.user.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      teacher.user.email.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      (teacher.department && teacher.department.toLowerCase().includes(teacherSearch.toLowerCase()))
  })

  const filteredQuestionBanks = questionBanks.filter(bank => {
    const matchesSearch = !questionBankSearch ||
      bank.title.toLowerCase().includes(questionBankSearch.toLowerCase()) ||
      bank.description.toLowerCase().includes(questionBankSearch.toLowerCase()) ||
      bank.category.toLowerCase().includes(questionBankSearch.toLowerCase())

    const matchesFilter = questionBankFilter === 'all' ||
      (questionBankFilter === 'active' && bank.isActive) ||
      (questionBankFilter === 'inactive' && !bank.isActive)

    return matchesSearch && matchesFilter
  })

  const filteredExams = exams.filter(exam => {
    const matchesSearch = !examSearch ||
      exam.title.toLowerCase().includes(examSearch.toLowerCase()) ||
      exam.description.toLowerCase().includes(examSearch.toLowerCase())

    const matchesFilter = examFilter === 'all' ||
      exam.status === examFilter

    return matchesSearch && matchesFilter
  })

  const filteredAnnouncements = announcements.filter(announcement => {
    return announcementFilter === 'all' ||
      (announcementFilter === 'published' && announcement.isPublished) ||
      (announcementFilter === 'draft' && !announcement.isPublished)
  })

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = !faqSearch ||
      faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.category.toLowerCase().includes(faqSearch.toLowerCase())

    const matchesFilter = faqFilter === 'all' ||
      (faqFilter === 'published' && faq.isPublished) ||
      (faqFilter === 'draft' && !faq.isPublished)

    return matchesSearch && matchesFilter
  })

  // Dashboard Data Fetching
  const fetchDashboardData = async () => {
    try {
      const [statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }),
        fetch('/api/admin/settings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        })
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSettings(settingsData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Student Management Functions
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      // Set dummy data for development
      setStudents([
        {
          id: '1',
          user: { name: 'John Doe', email: 'john@example.com', status: 'ACTIVE' },
          nim: '20210001',
          class: 'XII IPA 1',
          grade: '12'
        },
        {
          id: '2',
          user: { name: 'Jane Smith', email: 'jane@example.com', status: 'ACTIVE' },
          nim: '20210002',
          class: 'XII IPA 2',
          grade: '12'
        },
        {
          id: '3',
          user: { name: 'Bob Johnson', email: 'bob@example.com', status: 'SUSPENDED' },
          nim: '20210003',
          class: 'XI IPA 1',
          grade: '11'
        }
      ])
    }
  }

  const addStudent = async (studentData: any) => {
    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(studentData)
      })
      if (response.ok) {
        setShowAddStudent(false)
        fetchStudents()
        alert('Siswa berhasil ditambahkan')
      }
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Gagal menambahkan siswa')
    }
  }

  const updateStudent = async (id: string, action: string, data?: any) => {
    try {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ action, data })
      })
      if (response.ok) {
        fetchStudents()
        alert('Aksi berhasil dilakukan')
      }
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Gagal melakukan aksi')
    }
  }

  const deleteStudent = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return
    try {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        fetchStudents()
        alert('Siswa berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Gagal menghapus siswa')
    }
  }

  const editStudent = (student: any) => {
    setEditingStudent(student)
    setShowAddStudent(true)
  }

  const resetStudentPassword = async (id: string) => {
    if (!confirm('Reset password siswa ini?')) return
    try {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ action: 'reset_password' })
      })
      if (response.ok) {
        const data = await response.json()
        alert(`Password berhasil direset: ${data.newPassword}`)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Gagal reset password')
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedStudents.length === 0) {
      alert('Pilih siswa terlebih dahulu')
      return
    }

    let confirmMessage = ''
    switch (action) {
      case 'suspend':
        confirmMessage = `Suspend ${selectedStudents.length} siswa?`
        break
      case 'unsuspend':
        confirmMessage = `Unsuspend ${selectedStudents.length} siswa?`
        break
      case 'alumni':
        confirmMessage = `Jadikan ${selectedStudents.length} siswa sebagai alumni?`
        break
      case 'reset_password':
        confirmMessage = `Reset password ${selectedStudents.length} siswa?`
        break
      case 'delete':
        confirmMessage = `Hapus ${selectedStudents.length} siswa?`
        break
      default:
        return
    }

    if (!confirm(confirmMessage)) return

    try {
      const promises = selectedStudents.map(id =>
        fetch(`/api/admin/students/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({ action })
        })
      )

      await Promise.all(promises)
      setSelectedStudents([])
      fetchStudents()
      alert('Aksi massal berhasil dilakukan')
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert('Gagal melakukan aksi massal')
    }
  }

  const exportStudents = () => {
    const csv = [
      ['Nama', 'NIM', 'Kelas', 'Email', 'Status'].join(','),
      ...filteredStudents.map(student => [
        student.user.name,
        student.nim,
        student.class,
        student.user.email,
        student.user.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students.csv'
    a.click()
  }

  // Teacher Management Functions
  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTeachers(data)
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
      // Set dummy data for development
      setTeachers([
        {
          id: '1',
          user: { name: 'Prof. Ahmad', email: 'ahmad@example.com', status: 'ACTIVE' },
          nip: '198001012001011001',
          department: 'Matematika'
        },
        {
          id: '2',
          user: { name: 'Dr. Sari', email: 'sari@example.com', status: 'ACTIVE' },
          nip: '198202022002022002',
          department: 'Fisika'
        },
        {
          id: '3',
          user: { name: 'Mrs. Lisa', email: 'lisa@example.com', status: 'ACTIVE' },
          nip: '198303032003033003',
          department: 'Bahasa Inggris'
        }
      ])
    }
  }

  const addTeacher = async (teacherData: any) => {
    try {
      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(teacherData)
      })
      if (response.ok) {
        setShowAddTeacher(false)
        fetchTeachers()
        alert('Guru berhasil ditambahkan')
      }
    } catch (error) {
      console.error('Error adding teacher:', error)
      alert('Gagal menambahkan guru')
    }
  }

  const updateTeacher = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/admin/teachers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        fetchTeachers()
        alert('Guru berhasil diperbarui')
      }
    } catch (error) {
      console.error('Error updating teacher:', error)
      alert('Gagal memperbarui guru')
    }
  }

  const deleteTeacher = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus guru ini?')) return
    try {
      const response = await fetch(`/api/admin/teachers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        fetchTeachers()
        alert('Guru berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
      alert('Gagal menghapus guru')
    }
  }

  const editTeacher = (teacher: any) => {
    setEditingTeacher(teacher)
    setShowAddTeacher(true)
  }

  // Question Banks Functions
  const fetchQuestionBanks = async () => {
    try {
      const response = await fetch('/api/admin/question-banks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setQuestionBanks(data)
      }
    } catch (error) {
      console.error('Error fetching question banks:', error)
      // Set dummy data for development
      setQuestionBanks([
        {
          id: '1',
          title: 'Matematika Dasar',
          description: 'Kumpulan soal matematika dasar untuk kelas 10',
          category: 'REGULAR',
          subject: 'Matematika',
          difficulty: 'MEDIUM',
          questionCount: 50,
          teacherName: 'Prof. Ahmad',
          teacherId: '1',
          isActive: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          tags: ['matematika', 'dasar', 'kelas-10'],
          accessType: 'PUBLIC'
        },
        {
          id: '2',
          title: 'Fisika Mekanika',
          description: 'Soal-soal fisika mekanika untuk persiapan ujian',
          category: 'TRYOUT_UTBK',
          subject: 'Fisika',
          difficulty: 'HARD',
          questionCount: 75,
          teacherName: 'Dr. Sari',
          teacherId: '2',
          isActive: true,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
          tags: ['fisika', 'mekanika', 'utbk'],
          accessType: 'PRIVATE'
        }
      ])
    }
  }

  const addQuestionBank = async (bankData: any) => {
    try {
      const response = await fetch('/api/admin/question-banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(bankData)
      })
      if (response.ok) {
        setShowAddQuestionBank(false)
        fetchQuestionBanks()
        alert('Bank soal berhasil ditambahkan')
      }
    } catch (error) {
      console.error('Error adding question bank:', error)
      alert('Gagal menambahkan bank soal')
    }
  }

  const updateQuestionBank = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/admin/question-banks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        fetchQuestionBanks()
        alert('Bank soal berhasil diperbarui')
      }
    } catch (error) {
      console.error('Error updating question bank:', error)
      alert('Gagal memperbarui bank soal')
    }
  }

  const deleteQuestionBank = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bank soal ini?')) return
    try {
      const response = await fetch(`/api/admin/question-banks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        fetchQuestionBanks()
        alert('Bank soal berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting question bank:', error)
      alert('Gagal menghapus bank soal')
    }
  }

  // Exams Functions
  const fetchExams = async () => {
    try {
      const response = await fetch('/api/admin/exams', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setExams(data)
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
      // Set dummy data for development
      setExams([
        {
          id: '1',
          title: 'Ujian Matematika Semester 1',
          description: 'Ujian akhir semester 1 mata pelajaran matematika',
          questionBankId: '1',
          questionBankTitle: 'Matematika Dasar',
          duration: 120,
          startDate: '2024-02-01T08:00:00',
          endDate: '2024-02-01T10:00:00',
          status: 'COMPLETED',
          totalParticipants: 50,
          completedParticipants: 48,
          passingGrade: 70,
          isPublished: true,
          accessCode: 'MATH2024',
          createdBy: 'Prof. Ahmad',
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          title: 'Tryout UTBK Fisika',
          description: 'Tryout persiapan UTBK mata pelajaran fisika',
          questionBankId: '2',
          questionBankTitle: 'Fisika Mekanika',
          duration: 90,
          startDate: '2024-02-10T09:00:00',
          endDate: '2024-02-10T10:30:00',
          status: 'SCHEDULED',
          totalParticipants: 100,
          completedParticipants: 0,
          passingGrade: 65,
          isPublished: true,
          accessCode: 'FISIKA2024',
          createdBy: 'Dr. Sari',
          createdAt: '2024-01-20'
        }
      ])
    }
  }

  const addExam = async (examData: any) => {
    try {
      const response = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(examData)
      })
      if (response.ok) {
        setShowAddExam(false)
        fetchExams()
        alert('Ujian berhasil ditambahkan')
      }
    } catch (error) {
      console.error('Error adding exam:', error)
      alert('Gagal menambahkan ujian')
    }
  }

  const updateExam = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/admin/exams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        fetchExams()
        alert('Ujian berhasil diperbarui')
      }
    } catch (error) {
      console.error('Error updating exam:', error)
      alert('Gagal memperbarui ujian')
    }
  }

  const deleteExam = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ujian ini?')) return
    try {
      const response = await fetch(`/api/admin/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        fetchExams()
        alert('Ujian berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting exam:', error)
      alert('Gagal menghapus ujian')
    }
  }

  const toggleExamPublish = async (id: string, publish: boolean) => {
    try {
      const response = await fetch(`/api/admin/exams/${id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ publish })
      })
      if (response.ok) {
        fetchExams()
        alert(publish ? 'Ujian berhasil dipublikasikan' : 'Ujian berhasil disimpan sebagai draft')
      }
    } catch (error) {
      console.error('Error toggling exam publish:', error)
      alert('Gagal mengubah status publikasi')
    }
  }

  // Announcements Functions
  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      // Set dummy data for development
      setAnnouncements([
        {
          id: '1',
          title: 'Maintenance Sistem',
          content: 'Sistem akan down untuk maintenance pada tanggal 15 Februari 2024 pukul 00:00 - 04:00 WIB',
          type: 'WARNING',
          priority: 'HIGH',
          isPublished: true,
          publishDate: '2024-02-10',
          expiryDate: '2024-02-16',
          createdAt: '2024-02-10',
          createdBy: 'Admin',
          attachments: []
        },
        {
          id: '2',
          title: 'Jadwal Ujian Semester',
          content: 'Ujian semester akan dilaksanakan mulai tanggal 20 Februari 2024. Silakan persiapkan diri dengan baik.',
          type: 'INFO',
          priority: 'MEDIUM',
          isPublished: true,
          publishDate: '2024-02-01',
          expiryDate: '2024-02-28',
          createdAt: '2024-02-01',
          createdBy: 'Admin',
          attachments: ['jadwal-ujian.pdf']
        }
      ])
    }
  }

  const addAnnouncement = async (announcementData: any) => {
    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(announcementData)
      })
      if (response.ok) {
        setShowAddAnnouncement(false)
        fetchAnnouncements()
        alert('Pengumuman berhasil ditambahkan')
      }
    } catch (error) {
      console.error('Error adding announcement:', error)
      alert('Gagal menambahkan pengumuman')
    }
  }

  const updateAnnouncement = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        fetchAnnouncements()
        alert('Pengumuman berhasil diperbarui')
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
      alert('Gagal memperbarui pengumuman')
    }
  }

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        fetchAnnouncements()
        alert('Pengumuman berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('Gagal menghapus pengumuman')
    }
  }

  // FAQ Functions
  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/admin/faqs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFaqs(data)
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      // Set dummy data for development
      setFaqs([
        {
          id: '1',
          question: 'Bagaimana cara reset password?',
          answer: 'Anda dapat reset password melalui menu "Lupa Password" di halaman login atau hubungi admin.',
          category: 'account',
          order: 1,
          isPublished: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          views: 150,
          helpful: 120,
          notHelpful: 5
        },
        {
          id: '2',
          question: 'Apa yang harus dilakukan jika tidak bisa mengakses ujian?',
          answer: 'Pastikan koneksi internet stabil dan browser yang digunakan sudah up-to-date. Jika masih bermasalah, hubungi technical support.',
          category: 'technical',
          order: 2,
          isPublished: true,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
          views: 89,
          helpful: 75,
          notHelpful: 3
        }
      ])
    }
  }

  const addFAQ = async (faqData: any) => {
    try {
      const response = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(faqData)
      })
      if (response.ok) {
        setShowAddFAQ(false)
        fetchFAQs()
        alert('FAQ berhasil ditambahkan')
      }
    } catch (error) {
      console.error('Error adding FAQ:', error)
      alert('Gagal menambahkan FAQ')
    }
  }

  const updateFAQ = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        fetchFAQs()
        alert('FAQ berhasil diperbarui')
      }
    } catch (error) {
      console.error('Error updating FAQ:', error)
      alert('Gagal memperbarui FAQ')
    }
  }

  const deleteFAQ = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus FAQ ini?')) return
    try {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        fetchFAQs()
        alert('FAQ berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      alert('Gagal menghapus FAQ')
    }
  }

  // Reports Functions
  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      // Set dummy data for development
      setReports([
        {
          id: '1',
          examId: '1',
          examTitle: 'Ujian Matematika Semester 1',
          generatedBy: 'Admin',
          generatedAt: '2024-02-01T11:00:00',
          reportType: 'PERFORMANCE',
          format: 'PDF',
          downloadUrl: '/reports/exam1-performance.pdf',
          status: 'READY'
        },
        {
          id: '2',
          examId: '1',
          examTitle: 'Ujian Matematika Semester 1',
          generatedBy: 'Admin',
          generatedAt: '2024-02-01T11:30:00',
          reportType: 'PARTICIPANT',
          format: 'EXCEL',
          downloadUrl: '/reports/exam1-participant.xlsx',
          status: 'READY'
        }
      ])
    }
  }

  const generateReport = async () => {
    if (!selectedExamForReport) {
      alert('Pilih ujian terlebih dahulu')
      return
    }

    try {
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          examId: selectedExamForReport,
          reportType,
          format: reportFormat
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Laporan sedang diproses. ID: ${data.reportId}`)
        setShowGenerateReport(false)
        fetchReports()
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Gagal menghasilkan laporan')
    }
  }

  const downloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/download`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${reportId}.${reportFormat.toLowerCase()}`
        a.click()
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Gagal mengunduh laporan')
    }
  }

  // Settings Functions
  const updateSetting = async (key: keyof SystemSettings, value: boolean) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ [key]: value })
      })

      if (response.ok) {
        setSettings(prev => ({ ...prev, [key]: value }))
      }
    } catch (error) {
      console.error('Error updating setting:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    router.push('/')
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl shadow-lg shadow-blue-600/20 overflow-hidden">
              <img src="/Logo_Examo.png" alt="ExamO Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Examo Admin</h1>
              <p className="text-sm text-slate-500">Dashboard Administrator</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Shield className="w-3 h-3 mr-1" />
              Administrator
            </Badge>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 min-h-screen">
          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('overview')}
            >
              <ChartBar className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'students' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('students')}
            >
              <Users className="w-4 h-4 mr-2" />
              Manajemen Siswa
            </Button>
            <Button
              variant={activeTab === 'teachers' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('teachers')}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Manajemen Guru
            </Button>
            <Button
              variant={activeTab === 'question-banks' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('question-banks')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Bank Soal
            </Button>
            <Button
              variant={activeTab === 'exams' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('exams')}
            >
              <FileQuestion className="w-4 h-4 mr-2" />
              Manajemen Ujian
            </Button>
            <Button
              variant={activeTab === 'announcements' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('announcements')}
            >
              <Bell className="w-4 h-4 mr-2" />
              Pengumuman
            </Button>
            <Button
              variant={activeTab === 'faq' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('faq')}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('reports')}
            >
              <FileBarChart className="w-4 h-4 mr-2" />
              Berita Acara
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan Sistem
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Overview Tab - Sama seperti sebelumnya */}
            <TabsContent value="overview" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Overview</h2>
                <p className="text-slate-600">Ringkasan statistik sistem Examo</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{students.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {students.filter(s => s.user.status === 'SUSPENDED').length} suspended
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
                    <GraduationCap className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teachers.length}</div>
                    <p className="text-xs text-muted-foreground">Pengajar aktif</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bank Soal</CardTitle>
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{questionBanks.length}</div>
                    <p className="text-xs text-muted-foreground">Koleksi soal</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ujian Aktif</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{exams.filter(e => e.status === 'ONGOING').length}</div>
                    <p className="text-xs text-muted-foreground">{exams.filter(e => e.status === 'COMPLETED').length} selesai</p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pengumuman</CardTitle>
                    <Bell className="h-4 w-4 text-indigo-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{announcements.length}</div>
                    <p className="text-xs text-muted-foreground">Pengumuman terpublikasi</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">FAQ</CardTitle>
                    <HelpCircle className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{faqs.length}</div>
                    <p className="text-xs text-muted-foreground">Pertanyaan umum</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Laporan</CardTitle>
                    <FileBarChart className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reports.length}</div>
                    <p className="text-xs text-muted-foreground">Berita acara tersedia</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Cepat</CardTitle>
                  <CardDescription>Pengaturan dan aksi administrator yang sering digunakan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={() => setActiveTab('students')}>
                      <UserPlus className="w-6 h-6 mb-2 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">Tambah Siswa</div>
                        <div className="text-sm text-slate-500">Tambah siswa baru</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={() => setActiveTab('exams')}>
                      <FileQuestion className="w-6 h-6 mb-2 text-purple-600" />
                      <div className="text-left">
                        <div className="font-medium">Buat Ujian</div>
                        <div className="text-sm text-slate-500">Buat ujian baru</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={() => setActiveTab('announcements')}>
                      <BellRing className="w-6 h-6 mb-2 text-orange-600" />
                      <div className="text-left">
                        <div className="font-medium">Buat Pengumuman</div>
                        <div className="text-sm text-slate-500">Buat pengumuman baru</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={() => setActiveTab('reports')}>
                      <FileBarChart className="w-6 h-6 mb-2 text-emerald-600" />
                      <div className="text-left">
                        <div className="font-medium">Generate Laporan</div>
                        <div className="text-sm text-slate-500">Buat laporan ujian</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={() => setActiveTab('question-banks')}>
                      <BookOpen className="w-6 h-6 mb-2 text-indigo-600" />
                      <div className="text-left">
                        <div className="font-medium">Tambah Bank Soal</div>
                        <div className="text-sm text-slate-500">Buat bank soal baru</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start" onClick={() => setActiveTab('faq')}>
                      <HelpCircle className="w-6 h-6 mb-2 text-amber-600" />
                      <div className="text-left">
                        <div className="font-medium">Kelola FAQ</div>
                        <div className="text-sm text-slate-500">Tambah pertanyaan umum</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Students Management Tab */}
            <TabsContent value="students" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Manajemen Siswa</h2>
                  <p className="text-slate-600">Kelola data akun siswa dan informasi kelas</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowAddStudent(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Tambah Siswa
                  </Button>
                  <Button variant="outline" onClick={() => setShowImportStudents(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Excel
                  </Button>
                  <Button variant="outline" onClick={exportStudents}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              </div>

              {/* Filter dan Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Search</Label>
                      <Input
                        placeholder="Cari nama, NIM, atau kelas..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Select value={studentStatusFilter} onValueChange={setStudentStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="ACTIVE">Aktif</SelectItem>
                          <SelectItem value="SUSPENDED">Suspend</SelectItem>
                          <SelectItem value="ALUMNI">Alumni</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Kelas</Label>
                      <Select value={studentClassFilter} onValueChange={setStudentClassFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Kelas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kelas</SelectItem>
                          {availableClasses.map(cls => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Aksi Massal</Label>
                      <Select onValueChange={handleBulkAction}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Aksi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="suspend">Suspend</SelectItem>
                          <SelectItem value="unsuspend">Unsuspend</SelectItem>
                          <SelectItem value="alumni">Jadikan Alumni</SelectItem>
                          <SelectItem value="reset_password">Reset Password</SelectItem>
                          <SelectItem value="change_class">Ubah Kelas</SelectItem>
                          <SelectItem value="delete">Hapus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Students Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="p-4 text-left">
                            <input
                              type="checkbox"
                              checked={selectedStudents.length === filteredStudents.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents(filteredStudents.map(s => s.id))
                                } else {
                                  setSelectedStudents([])
                                }
                              }}
                            />
                          </th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Nama</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">NIM</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Kelas</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="border-b hover:bg-slate-50">
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudents([...selectedStudents, student.id])
                                  } else {
                                    setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                                  }
                                }}
                              />
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                                  {student.user.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium">{student.user.name}</div>
                                  <div className="text-sm text-slate-500">{student.grade || '-'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-sm">{student.nim}</td>
                            <td className="p-4">
                              <Badge variant="outline">{student.class}</Badge>
                            </td>
                            <td className="p-4 text-sm">{student.user.email}</td>
                            <td className="p-4">
                              <Badge variant={
                                student.user.status === 'ACTIVE' ? 'default' :
                                  student.user.status === 'SUSPENDED' ? 'destructive' : 'secondary'
                              }>
                                {student.user.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => editStudent(student)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => resetStudentPassword(student.id)}>
                                  <Key className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deleteStudent(student.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Teachers Management Tab */}
            <TabsContent value="teachers" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Manajemen Guru</h2>
                  <p className="text-slate-600">Kelola data guru dan pengajar</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowAddTeacher(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Tambah Guru
                  </Button>
                </div>
              </div>

              {/* Search */}
              <Card>
                <CardContent className="p-4">
                  <Input
                    placeholder="Cari nama, email, atau departemen..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Teachers Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Nama</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">NIP</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Departemen</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeachers.map((teacher) => (
                          <tr key={teacher.id} className="border-b hover:bg-slate-50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                                  {teacher.user.name.charAt(0)}
                                </div>
                                <div className="font-medium">{teacher.user.name}</div>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{teacher.user.email}</td>
                            <td className="p-4 font-mono text-sm">{teacher.nip || '-'}</td>
                            <td className="p-4 text-sm">{teacher.department || '-'}</td>
                            <td className="p-4">
                              <Badge variant={teacher.user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {teacher.user.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => editTeacher(teacher)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deleteTeacher(teacher.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Question Banks Tab - Sama seperti sebelumnya */}
            <TabsContent value="question-banks" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Bank Soal</h2>
                  <p className="text-slate-600">Kelola bank soal dan kategori ujian</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowAddQuestionBank(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Bank Soal
                  </Button>
                  <Button variant="outline" onClick={() => {/* Import question bank */}}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Cari Bank Soal</Label>
                      <Input
                        placeholder="Cari judul, deskripsi, atau kategori..."
                        value={questionBankSearch}
                        onChange={(e) => setQuestionBankSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Filter Status</Label>
                      <Select value={questionBankFilter} onValueChange={setQuestionBankFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Nonaktif</SelectItem>
                          <SelectItem value="public">Publik</SelectItem>
                          <SelectItem value="private">Privat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Urutkan</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Terbaru" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Terbaru</SelectItem>
                          <SelectItem value="oldest">Terlama</SelectItem>
                          <SelectItem value="most_questions">Paling Banyak Soal</SelectItem>
                          <SelectItem value="title_asc">Judul A-Z</SelectItem>
                          <SelectItem value="title_desc">Judul Z-A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Question Banks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuestionBanks.map((bank) => (
                  <Card key={bank.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{bank.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{bank.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={bank.isActive ? "default" : "secondary"}>
                            {bank.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                          {bank.accessType === 'PRIVATE' && <Lock className="w-4 h-4 text-slate-500" />}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Kategori:</span>
                          <Badge variant="outline">{bank.category}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Jumlah Soal:</span>
                          <span className="font-medium">{bank.questionCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Kesulitan:</span>
                          <span className="font-medium">{bank.difficulty}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Pembuat:</span>
                          <span>{bank.teacherName}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {bank.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingQuestionBank(bank)
                          setShowAddQuestionBank(true)
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteQuestionBank(bank.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Exams Tab - Sama seperti sebelumnya */}
            <TabsContent value="exams" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Manajemen Ujian</h2>
                  <p className="text-slate-600">Kelola jadwal, peserta, dan pengaturan ujian</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowAddExam(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Ujian
                  </Button>
                  <Button variant="outline" onClick={() => {/* Bulk actions */}}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Cari Ujian</Label>
                      <Input
                        placeholder="Cari judul atau deskripsi..."
                        value={examSearch}
                        onChange={(e) => setExamSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={examFilter} onValueChange={setExamFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="SCHEDULED">Terjadwal</SelectItem>
                          <SelectItem value="ONGOING">Berlangsung</SelectItem>
                          <SelectItem value="COMPLETED">Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tanggal Mulai</Label>
                      <Input type="date" />
                    </div>
                    <div>
                      <Label>Durasi</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Durasi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua</SelectItem>
                          <SelectItem value="30">≤ 30 menit</SelectItem>
                          <SelectItem value="60">≤ 60 menit</SelectItem>
                          <SelectItem value="120">≤ 120 menit</SelectItem>
                          <SelectItem value="120+"> 120 menit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exams Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Judul Ujian</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Bank Soal</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Jadwal</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Durasi</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Peserta</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExams.map((exam) => (
                          <tr key={exam.id} className="border-b hover:bg-slate-50">
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{exam.title}</div>
                                <div className="text-sm text-slate-500">{exam.description}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">{exam.questionBankTitle}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">
                                <div>{new Date(exam.startDate).toLocaleDateString()}</div>
                                <div className="text-slate-500">
                                  {new Date(exam.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">{exam.duration} menit</div>
                            </td>
                            <td className="p-4">
                              <Badge variant={
                                exam.status === 'ONGOING' ? 'default' :
                                exam.status === 'SCHEDULED' ? 'secondary' :
                                exam.status === 'COMPLETED' ? 'outline' : 'destructive'
                              }>
                                {exam.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">
                                {exam.completedParticipants}/{exam.totalParticipants}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                  setEditingExam(exam)
                                  setShowAddExam(true)
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => toggleExamPublish(exam.id, !exam.isPublished)}
                                >
                                  {exam.isPublished ? <EyeOff className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Announcements Tab - Sama seperti sebelumnya */}
            <TabsContent value="announcements" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Pengumuman</h2>
                  <p className="text-slate-600">Kelola pengumuman untuk siswa dan guru</p>
                </div>
                <Button onClick={() => setShowAddAnnouncement(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Pengumuman
                </Button>
              </div>

              {/* Filters */}
              <div className="flex gap-4">
                <Select value={announcementFilter} onValueChange={setAnnouncementFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status Pengumuman" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="published">Terpublikasi</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="urgent">Penting</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Cari pengumuman..." className="flex-1" />
              </div>

              {/* Announcements List */}
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {announcement.title}
                            {announcement.priority === 'URGENT' && (
                              <Badge variant="destructive">URGENT</Badge>
                            )}
                            {announcement.priority === 'HIGH' && (
                              <Badge variant="outline" className="bg-red-50 text-red-700">PENTING</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Diposting: {new Date(announcement.createdAt).toLocaleDateString()} • 
                            Berlaku hingga: {new Date(announcement.expiryDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={announcement.isPublished ? "default" : "secondary"}>
                            {announcement.isPublished ? "Terpublikasi" : "Draft"}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingAnnouncement(announcement)
                            setShowAddAnnouncement(true)
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteAnnouncement(announcement.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p>{announcement.content}</p>
                      </div>
                      {announcement.attachments && announcement.attachments.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Lampiran:</p>
                          <div className="flex flex-wrap gap-2">
                            {announcement.attachments.map((attachment, index) => (
                              <Badge key={index} variant="outline" className="cursor-pointer hover:bg-slate-100">
                                <FileText className="w-3 h-3 mr-1" />
                                {attachment}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* FAQ Tab - Sama seperti sebelumnya */}
            <TabsContent value="faq" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">FAQ (Pertanyaan Umum)</h2>
                  <p className="text-slate-600">Kelola pertanyaan dan jawaban yang sering ditanyakan</p>
                </div>
                <Button onClick={() => setShowAddFAQ(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah FAQ
                </Button>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Cari FAQ</Label>
                      <Input
                        placeholder="Cari pertanyaan atau jawaban..."
                        value={faqSearch}
                        onChange={(e) => setFaqSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Kategori</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kategori</SelectItem>
                          <SelectItem value="general">Umum</SelectItem>
                          <SelectItem value="technical">Teknis</SelectItem>
                          <SelectItem value="account">Akun</SelectItem>
                          <SelectItem value="exam">Ujian</SelectItem>
                          <SelectItem value="payment">Pembayaran</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={faqFilter} onValueChange={setFaqFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua</SelectItem>
                          <SelectItem value="published">Terpublikasi</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ List */}
              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <Card key={faq.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {faq.question}
                            <Badge variant="outline">{faq.category}</Badge>
                          </CardTitle>
                          <CardDescription>
                            Dilihat: {faq.views} kali • Bermanfaat: {faq.helpful}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={faq.isPublished ? "default" : "secondary"}>
                            {faq.isPublished ? "Terpublikasi" : "Draft"}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingFAQ(faq)
                            setShowAddFAQ(true)
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteFAQ(faq.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p>{faq.answer}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Reports Tab - Sama seperti sebelumnya */}
            <TabsContent value="reports" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Berita Acara & Laporan</h2>
                  <p className="text-slate-600">Generate dan kelola laporan hasil ujian</p>
                </div>
                <Button onClick={() => setShowGenerateReport(true)}>
                  <FileBarChart className="w-4 h-4 mr-2" />
                  Generate Laporan
                </Button>
              </div>

              {/* Report Generation Form */}
              {showGenerateReport && (
                <Card>
                  <CardHeader>
                    <CardTitle>Generate Laporan Baru</CardTitle>
                    <CardDescription>Pilih ujian dan jenis laporan yang ingin dibuat</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Pilih Ujian</Label>
                        <Select value={selectedExamForReport} onValueChange={setSelectedExamForReport}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih ujian" />
                          </SelectTrigger>
                          <SelectContent>
                            {exams.filter(e => e.status === 'COMPLETED').map(exam => (
                              <SelectItem key={exam.id} value={exam.id}>
                                {exam.title} ({new Date(exam.startDate).toLocaleDateString()})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Jenis Laporan</Label>
                        <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis laporan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PARTICIPANT">Laporan Peserta</SelectItem>
                            <SelectItem value="PERFORMANCE">Laporan Performa</SelectItem>
                            <SelectItem value="VIOLATION">Laporan Pelanggaran</SelectItem>
                            <SelectItem value="COMPREHENSIVE">Laporan Komprehensif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Format</Label>
                        <Select value={reportFormat} onValueChange={(value: any) => setReportFormat(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF">PDF</SelectItem>
                            <SelectItem value="EXCEL">Excel</SelectItem>
                            <SelectItem value="CSV">CSV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowGenerateReport(false)}>
                        Batal
                      </Button>
                      <Button onClick={generateReport}>
                        Generate Laporan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reports List */}
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Laporan</CardTitle>
                  <CardDescription>Laporan yang telah digenerate sebelumnya</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Ujian</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Jenis Laporan</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Format</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Tanggal Generate</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                          <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((report) => (
                          <tr key={report.id} className="border-b hover:bg-slate-50">
                            <td className="p-4">
                              <div className="font-medium">{report.examTitle}</div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline">{report.reportType}</Badge>
                            </td>
                            <td className="p-4">
                              <Badge variant="secondary">{report.format}</Badge>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">
                                {new Date(report.generatedAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant={
                                report.status === 'READY' ? 'default' :
                                report.status === 'GENERATING' ? 'secondary' : 'destructive'
                              }>
                                {report.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadReport(report.id)}
                                disabled={report.status !== 'READY'}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab - Sama seperti sebelumnya */}
            <TabsContent value="settings" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Pengaturan Sistem</h2>
                <p className="text-slate-600">Konfigurasi fitur-fitur sistem Examo</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Exam Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pengaturan Ujian</CardTitle>
                    <CardDescription>Konfigurasi perilaku ujian</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Acak Urutan Soal</div>
                        <div className="text-sm text-slate-500">Randomize question order</div>
                      </div>
                      <Switch
                        checked={settings.randomizeQuestions}
                        onCheckedChange={(checked) => updateSetting('randomizeQuestions', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Acak Urutan Jawaban</div>
                        <div className="text-sm text-slate-500">Randomize answer options</div>
                      </div>
                      <Switch
                        checked={settings.randomizeAnswers}
                        onCheckedChange={(checked) => updateSetting('randomizeAnswers', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Izinkan Multi Attempt</div>
                        <div className="text-sm text-slate-500">Allow multiple exam attempts</div>
                      </div>
                      <Switch
                        checked={settings.allowMultipleAttempts}
                        onCheckedChange={(checked) => updateSetting('allowMultipleAttempts', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Tampilkan Hasil Segera</div>
                        <div className="text-sm text-slate-500">Show results immediately after submission</div>
                      </div>
                      <Switch
                        checked={settings.showResultsImmediately}
                        onCheckedChange={(checked) => updateSetting('showResultsImmediately', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Izinkan Review Soal</div>
                        <div className="text-sm text-slate-500">Allow question review after exam</div>
                      </div>
                      <Switch
                        checked={settings.allowQuestionReview}
                        onCheckedChange={(checked) => updateSetting('allowQuestionReview', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Keamanan Ujian</CardTitle>
                    <CardDescription>Pengaturan keamanan dan anti-kecurangan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Mode Layar Penuh</div>
                        <div className="text-sm text-slate-500">Force fullscreen mode</div>
                      </div>
                      <Switch
                        checked={settings.enableFullscreen}
                        onCheckedChange={(checked) => updateSetting('enableFullscreen', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Deteksi Pelanggaran</div>
                        <div className="text-sm text-slate-500">Enable violation detection</div>
                      </div>
                      <Switch
                        checked={settings.enableViolations}
                        onCheckedChange={(checked) => updateSetting('enableViolations', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Kartu Ujian</div>
                        <div className="text-sm text-slate-500">Enable exam cards</div>
                      </div>
                      <Switch
                        checked={settings.enableExamCards}
                        onCheckedChange={(checked) => updateSetting('enableExamCards', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Proctoring</div>
                        <div className="text-sm text-slate-500">Enable webcam proctoring</div>
                      </div>
                      <Switch
                        checked={settings.enableProctoring}
                        onCheckedChange={(checked) => updateSetting('enableProctoring', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Batas Waktu Ketat</div>
                        <div className="text-sm text-slate-500">Strict time limit enforcement</div>
                      </div>
                      <Switch
                        checked={settings.timeLimitStrict}
                        onCheckedChange={(checked) => updateSetting('timeLimitStrict', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Maintenance */}
              <Card>
                <CardHeader>
                  <CardTitle>Pemeliharaan Sistem</CardTitle>
                  <CardDescription>Aksi administratif untuk sistem</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Archive className="w-4 h-4 mr-2" />
                      Backup Database
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <History className="w-4 h-4 mr-2" />
                      Riwayat Sistem
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset Cache
                    </Button>
                    <Button variant="outline" className="justify-start text-red-600">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Mode Pemeliharaan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Modals */}
          {/* Add/Edit Student Modal */}
          {showAddStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>{editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}</CardTitle>
                  <CardDescription>
                    {editingStudent ? 'Edit data siswa yang ada' : 'Tambah siswa baru ke sistem'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nama Lengkap</Label>
                      <Input
                        defaultValue={editingStudent?.user.name || ''}
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        defaultValue={editingStudent?.user.email || ''}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label>NIM</Label>
                      <Input
                        defaultValue={editingStudent?.nim || ''}
                        placeholder="Masukkan NIM"
                      />
                    </div>
                    <div>
                      <Label>Kelas</Label>
                      <Input
                        defaultValue={editingStudent?.class || ''}
                        placeholder="Contoh: XII-IPA-1"
                      />
                    </div>
                    <div>
                      <Label>Grade/Angkatan</Label>
                      <Input
                        defaultValue={editingStudent?.grade || ''}
                        placeholder="Contoh: 12"
                      />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input
                        type="password"
                        defaultValue={editingStudent ? '•••••••' : ''}
                        placeholder={editingStudent ? 'Kosongkan untuk tidak mengubah' : 'Masukkan password'}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowAddStudent(false)
                      setEditingStudent(null)
                    }}>
                      Batal
                    </Button>
                    <Button onClick={() => {
                      const formData = {
                        name: document.querySelector('input[placeholder="Masukkan nama lengkap"]')?.value,
                        email: document.querySelector('input[type="email"]')?.value,
                        nim: document.querySelector('input[placeholder="Masukkan NIM"]')?.value,
                        class: document.querySelector('input[placeholder="Contoh: XII-IPA-1"]')?.value,
                        grade: document.querySelector('input[placeholder="Contoh: 12"]')?.value,
                        password: document.querySelector('input[type="password"]')?.value
                      }

                      if (editingStudent) {
                        updateStudent(editingStudent.id, 'update_info', formData)
                      } else {
                        addStudent(formData)
                      }
                    }}>
                      {editingStudent ? 'Update Siswa' : 'Tambah Siswa'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Add Teacher Modal */}
          {showAddTeacher && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>{editingTeacher ? 'Edit Guru' : 'Tambah Guru Baru'}</CardTitle>
                  <CardDescription>{editingTeacher ? 'Edit data guru yang ada' : 'Tambah guru baru ke sistem'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nama Lengkap</Label>
                    <Input 
                      defaultValue={editingTeacher?.user.name || ''}
                      placeholder="Masukkan nama lengkap" 
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      type="email" 
                      defaultValue={editingTeacher?.user.email || ''}
                      placeholder="email@example.com" 
                    />
                  </div>
                  <div>
                    <Label>NIP (Opsional)</Label>
                    <Input 
                      defaultValue={editingTeacher?.nip || ''}
                      placeholder="Masukkan NIP" 
                    />
                  </div>
                  <div>
                    <Label>Departemen</Label>
                    <Input 
                      defaultValue={editingTeacher?.department || ''}
                      placeholder="Contoh: Matematika" 
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input 
                      type="password" 
                      defaultValue={editingTeacher ? '•••••••' : ''}
                      placeholder={editingTeacher ? 'Kosongkan untuk tidak mengubah' : 'Masukkan password'} 
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowAddTeacher(false)
                      setEditingTeacher(null)
                    }}>
                      Batal
                    </Button>
                    <Button onClick={() => {
                      const formData = {
                        name: document.querySelector('input[placeholder="Masukkan nama lengkap"]')?.value,
                        email: document.querySelector('input[type="email"]')?.value,
                        nip: document.querySelector('input[placeholder="Masukkan NIP"]')?.value,
                        department: document.querySelector('input[placeholder="Contoh: Matematika"]')?.value,
                        password: document.querySelector('input[type="password"]')?.value
                      }
                      if (editingTeacher) {
                        updateTeacher(editingTeacher.id, formData)
                      } else {
                        addTeacher(formData)
                      }
                    }}>
                      {editingTeacher ? 'Update Guru' : 'Tambah Guru'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
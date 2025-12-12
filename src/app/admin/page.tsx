'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

import {
  // ... icon lainnya
  Save,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter, // ADD THIS
  // ... other card imports
} from '@/components/ui/card'

// ==================== INTERFACE DEFINITIONS ====================
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

interface Student {
  id: string
  user: {
    name: string
    email: string
    status: 'ACTIVE' | 'SUSPENDED' | 'ALUMNI'
  }
  nim: string
  class: string
  grade?: string
}

interface Teacher {
  id: string
  user: {
    name: string
    email: string
    status: 'ACTIVE' | 'INACTIVE'
  }
  nip?: string
  department?: string
}

// ==================== KOMPONEN UTAMA ====================
export default function AdminDashboard() {
  const router = useRouter()

  // ==================== STATE MANAGEMENT ====================
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
  const [students, setStudents] = useState<Student[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [studentStatusFilter, setStudentStatusFilter] = useState('all')
  const [studentClassFilter, setStudentClassFilter] = useState('all')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showImportStudents, setShowImportStudents] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    nim: '',
    class: '',
    grade: '',
    password: ''
  })

  // Teacher Management States
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teacherSearch, setTeacherSearch] = useState('')
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    nip: '',
    department: '',
    password: ''
  })

  // Question Banks States
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([])
  const [showAddQuestionBank, setShowAddQuestionBank] = useState(false)
  const [editingQuestionBank, setEditingQuestionBank] = useState<QuestionBank | null>(null)
  const [questionBankFilter, setQuestionBankFilter] = useState('all')
  const [questionBankSearch, setQuestionBankSearch] = useState('')
  const [newQuestionBank, setNewQuestionBank] = useState({
    title: '',
    description: '',
    category: '',
    subject: '',
    difficulty: 'MEDIUM',
    tags: [] as string[],
    accessType: 'PRIVATE' as 'PUBLIC' | 'PRIVATE' | 'RESTRICTED'
  })

  // Exams States
  const [exams, setExams] = useState<Exam[]>([])
  const [showAddExam, setShowAddExam] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [examFilter, setExamFilter] = useState('all')
  const [examSearch, setExamSearch] = useState('')
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    questionBankId: '',
    duration: 60,
    startDate: '',
    endDate: '',
    passingGrade: 70
  })

  // Announcements States
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [announcementFilter, setAnnouncementFilter] = useState('all')
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'IMPORTANT' | 'EVENT',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    attachments: [] as string[]
  })

  // FAQ States
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [showAddFAQ, setShowAddFAQ] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [faqFilter, setFaqFilter] = useState('all')
  const [faqSearch, setFaqSearch] = useState('')
  const [newFAQ, setNewFAQ] = useState({
    question: '',
    answer: '',
    category: '',
    order: 1
  })

  // Reports States
  const [reports, setReports] = useState<ExamReport[]>([])
  const [showGenerateReport, setShowGenerateReport] = useState(false)
  const [selectedExamForReport, setSelectedExamForReport] = useState<string>('')
  const [reportType, setReportType] = useState<'PARTICIPANT' | 'PERFORMANCE' | 'VIOLATION' | 'COMPREHENSIVE'>('PERFORMANCE')
  const [reportFormat, setReportFormat] = useState<'PDF' | 'EXCEL' | 'CSV'>('PDF')

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState<string | null>(null)

  // ==================== EFFECT HOOKS ====================
  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (activeTab) {
      loadTabData()
    }
  }, [activeTab])

  // ==================== AUTHENTICATION ====================
  const checkAuth = () => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    loadInitialData()
  }

  // ==================== DATA LOADING ====================
  const loadInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchDashboardData(),
        fetchStudents(),
        fetchTeachers(),
        fetchQuestionBanks(),
        fetchExams(),
        fetchAnnouncements(),
        fetchFAQs(),
        fetchReports()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const loadTabData = async () => {
    try {
      switch (activeTab) {
        case 'students':
          await fetchStudents()
          break
        case 'teachers':
          await fetchTeachers()
          break
        case 'question-banks':
          await fetchQuestionBanks()
          break
        case 'exams':
          await fetchExams()
          break
        case 'announcements':
          await fetchAnnouncements()
          break
        case 'faq':
          await fetchFAQs()
          break
        case 'reports':
          await fetchReports()
          break
      }
    } catch (error) {
      console.error(`Error loading ${activeTab} data:`, error)
    }
  }

  // ==================== DASHBOARD FUNCTIONS ====================
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch dashboard stats')

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Fallback data untuk development
      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalQuestionBanks: questionBanks.length,
        totalExams: exams.length,
        activeExams: exams.filter(e => e.status === 'ONGOING').length,
        completedExams: exams.filter(e => e.status === 'COMPLETED').length,
        pendingExams: exams.filter(e => e.status === 'SCHEDULED').length,
        suspendedStudents: students.filter(s => s.user.status === 'SUSPENDED').length,
        alumniStudents: students.filter(s => s.user.status === 'ALUMNI').length,
        totalAnnouncements: announcements.length,
        totalFAQs: faqs.length,
        totalReports: reports.length
      })
    }
  }

  // ==================== STUDENT MANAGEMENT ====================
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      } else {
        // Fallback data untuk development
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
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const addStudent = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStudent)
      })

      if (response.ok) {
        setShowAddStudent(false)
        setNewStudent({
          name: '',
          email: '',
          nim: '',
          class: '',
          grade: '',
          password: ''
        })
        await fetchStudents()
        alert('Siswa berhasil ditambahkan')
      } else {
        alert('Gagal menambahkan siswa')
      }
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Gagal menambahkan siswa')
    }
  }

  const updateStudent = async (id: string, data: Partial<Student>) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchStudents()
        alert('Data siswa berhasil diperbarui')
      }
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Gagal memperbarui data siswa')
    }
  }

  const deleteStudent = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        await fetchStudents()
        alert('Siswa berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Gagal menghapus siswa')
    }
  }

  // ==================== TEACHER MANAGEMENT ====================
  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/teachers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTeachers(data)
      } else {
        // Fallback data untuk development
        setTeachers([
          {
            id: '1',
            user: { name: 'Budi Santoso', email: 'budi@example.com', status: 'ACTIVE' },
            nip: '1980123456',
            department: 'Matematika'
          },
          {
            id: '2',
            user: { name: 'Siti Rahayu', email: 'siti@example.com', status: 'ACTIVE' },
            nip: '1981123456',
            department: 'Bahasa Indonesia'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const addTeacher = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTeacher)
      })

      if (response.ok) {
        setShowAddTeacher(false)
        setNewTeacher({
          name: '',
          email: '',
          nip: '',
          department: '',
          password: ''
        })
        await fetchTeachers()
        alert('Guru berhasil ditambahkan')
      } else {
        alert('Gagal menambahkan guru')
      }
    } catch (error) {
      console.error('Error adding teacher:', error)
      alert('Gagal menambahkan guru')
    }
  }

  const updateTeacher = async (id: string, data: Partial<Teacher>) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/teachers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchTeachers()
        alert('Data guru berhasil diperbarui')
      }
    } catch (error) {
      console.error('Error updating teacher:', error)
      alert('Gagal memperbarui data guru')
    }
  }

  const deleteTeacher = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus guru ini?')) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/teachers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        await fetchTeachers()
        alert('Guru berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
      alert('Gagal menghapus guru')
    }
  }

  // ==================== QUESTION BANK MANAGEMENT ====================
  const fetchQuestionBanks = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/question-banks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setQuestionBanks(data)
      } else {
        // Fallback data untuk development
        setQuestionBanks([
          {
            id: '1',
            title: 'Matematika Dasar',
            description: 'Bank soal untuk materi matematika dasar kelas X',
            category: 'Matematika',
            subject: 'Matematika Dasar',
            difficulty: 'MEDIUM',
            questionCount: 50,
            teacherName: 'Budi Santoso',
            teacherId: '1',
            isActive: true,
            createdAt: '2024-01-15',
            updatedAt: '2024-03-10',
            tags: ['matematika', 'dasar', 'kelas-10'],
            accessType: 'PUBLIC'
          },
          {
            id: '2',
            title: 'Fisika Mekanika',
            description: 'Soal-soal fisika mekanika untuk kelas XI',
            category: 'Fisika',
            subject: 'Mekanika',
            difficulty: 'HARD',
            questionCount: 35,
            teacherName: 'Siti Rahayu',
            teacherId: '2',
            isActive: true,
            createdAt: '2024-02-20',
            updatedAt: '2024-03-12',
            tags: ['fisika', 'mekanika', 'kelas-11'],
            accessType: 'PRIVATE'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching question banks:', error)
    }
  }

  const addQuestionBank = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/question-banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newQuestionBank)
      })

      if (response.ok) {
        setShowAddQuestionBank(false)
        setNewQuestionBank({
          title: '',
          description: '',
          category: '',
          subject: '',
          difficulty: 'MEDIUM',
          tags: [],
          accessType: 'PRIVATE'
        })
        await fetchQuestionBanks()
        alert('Bank soal berhasil ditambahkan')
      } else {
        alert('Gagal menambahkan bank soal')
      }
    } catch (error) {
      console.error('Error adding question bank:', error)
      alert('Gagal menambahkan bank soal')
    }
  }

  const updateQuestionBank = async (id: string, data: Partial<QuestionBank>) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/question-banks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchQuestionBanks()
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
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/question-banks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        await fetchQuestionBanks()
        alert('Bank soal berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting question bank:', error)
      alert('Gagal menghapus bank soal')
    }
  }

  // ==================== EXAM MANAGEMENT ====================
  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/exams', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setExams(data)
      } else {
        // Fallback data untuk development
        setExams([
          {
            id: '1',
            title: 'UTS Matematika Semester 1',
            description: 'Ujian Tengah Semester Matematika',
            questionBankId: '1',
            questionBankTitle: 'Matematika Dasar',
            duration: 120,
            startDate: '2024-04-01T08:00:00',
            endDate: '2024-04-01T10:00:00',
            status: 'SCHEDULED',
            totalParticipants: 150,
            completedParticipants: 0,
            passingGrade: 70,
            isPublished: true,
            accessCode: 'MAT123',
            createdBy: 'Budi Santoso',
            createdAt: '2024-03-15'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
    }
  }

  // ==================== ANNOUNCEMENT MANAGEMENT ====================
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      } else {
        // Fallback data
        setAnnouncements([
          {
            id: '1',
            title: 'Jadwal Ujian Semester',
            content: 'Ujian semester akan dilaksanakan mulai tanggal 1 April 2024',
            type: 'IMPORTANT',
            priority: 'HIGH',
            isPublished: true,
            publishDate: '2024-03-20',
            expiryDate: '2024-04-30',
            createdAt: '2024-03-15',
            createdBy: 'Admin',
            attachments: []
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  // ==================== FAQ MANAGEMENT ====================
  const fetchFAQs = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/faqs', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setFaqs(data)
      } else {
        // Fallback data
        setFaqs([
          {
            id: '1',
            question: 'Bagaimana cara mengikuti ujian?',
            answer: 'Login ke sistem, pilih ujian yang tersedia, dan klik tombol "Mulai Ujian"',
            category: 'Ujian',
            order: 1,
            isPublished: true,
            createdAt: '2024-01-10',
            updatedAt: '2024-02-15',
            views: 120,
            helpful: 95,
            notHelpful: 5
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    }
  }

  // ==================== REPORT MANAGEMENT ====================
  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data)
      } else {
        // Fallback data
        setReports([
          {
            id: '1',
            examId: '1',
            examTitle: 'UTS Matematika',
            generatedBy: 'Admin',
            generatedAt: '2024-03-20T10:30:00',
            reportType: 'PERFORMANCE',
            format: 'PDF',
            downloadUrl: '/reports/uts-math.pdf',
            status: 'READY'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  // ==================== COMPUTED PROPERTIES ====================
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
      (questionBankFilter === 'inactive' && !bank.isActive) ||
      (questionBankFilter === 'public' && bank.accessType === 'PUBLIC') ||
      (questionBankFilter === 'private' && bank.accessType === 'PRIVATE')

    return matchesSearch && matchesFilter
  })

  const filteredExams = exams.filter(exam => {
    const matchesSearch = !examSearch ||
      exam.title.toLowerCase().includes(examSearch.toLowerCase()) ||
      exam.description.toLowerCase().includes(examSearch.toLowerCase())

    const matchesFilter = examFilter === 'all' || exam.status === examFilter

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

  // ==================== LOGOUT ====================
  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  // ==================== RENDER LOADING ====================
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

  // ==================== RENDER ERROR ====================
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Halaman
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl shadow-lg shadow-blue-600/20 overflow-hidden">
              <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold">
                E
              </div>
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
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
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

            {/* ============ OVERVIEW TAB ============ */}
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
                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.suspendedStudents} suspended
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
                    <GraduationCap className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                    <p className="text-xs text-muted-foreground">Pengajar aktif</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bank Soal</CardTitle>
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalQuestionBanks}</div>
                    <p className="text-xs text-muted-foreground">Koleksi soal</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ujian Aktif</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeExams}</div>
                    <p className="text-xs text-muted-foreground">{stats.completedExams} selesai</p>
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
                    <div className="text-2xl font-bold">{stats.totalAnnouncements}</div>
                    <p className="text-xs text-muted-foreground">Pengumuman terpublikasi</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">FAQ</CardTitle>
                    <HelpCircle className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalFAQs}</div>
                    <p className="text-xs text-muted-foreground">Pertanyaan umum</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Laporan</CardTitle>
                    <FileBarChart className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalReports}</div>
                    <p className="text-xs text-muted-foreground">Berita acara tersedia</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ============ STUDENTS TAB ============ */}
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
                </div>
              </div>

              {/* Filter dan Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </div>
                </CardContent>
              </Card>

              {/* Students Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>NIM</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                                {student.user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium">{student.user.name}</div>
                                <div className="text-sm text-slate-500">{student.grade || '-'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{student.nim}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.class}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{student.user.email}</TableCell>
                          <TableCell>
                            <Badge variant={
                              student.user.status === 'ACTIVE' ? 'default' :
                                student.user.status === 'SUSPENDED' ? 'destructive' : 'secondary'
                            }>
                              {student.user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditingStudent(student)
                                setNewStudent({
                                  name: student.user.name,
                                  email: student.user.email,
                                  nim: student.nim,
                                  class: student.class,
                                  grade: student.grade || '',
                                  password: ''
                                })
                                setShowAddStudent(true)
                              }}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteStudent(student.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ TEACHERS TAB ============ */}
            <TabsContent value="teachers" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Manajemen Guru</h2>
                  <p className="text-slate-600">Kelola data guru dan pengajar</p>
                </div>
                <Button onClick={() => setShowAddTeacher(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tambah Guru
                </Button>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>NIP</TableHead>
                        <TableHead>Departemen</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">
                                {teacher.user.name.charAt(0)}
                              </div>
                              <div className="font-medium">{teacher.user.name}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{teacher.user.email}</TableCell>
                          <TableCell className="font-mono text-sm">{teacher.nip || '-'}</TableCell>
                          <TableCell className="text-sm">{teacher.department || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={teacher.user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {teacher.user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingTeacher(teacher)
                                  setNewTeacher({
                                    name: teacher.user.name,
                                    email: teacher.user.email,
                                    nip: teacher.nip || '',
                                    department: teacher.department || '',
                                    password: ''
                                  })
                                  setShowAddTeacher(true)
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteTeacher(teacher.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ QUESTION BANKS TAB ============ */}
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
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* // ============ EXAMS TAB ============ */}
            <TabsContent value="exams" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Manajemen Ujian</h2>
                  <p className="text-slate-600">Kelola jadwal, pengaturan, dan monitoring ujian</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowAddExam(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Ujian Baru
                  </Button>
                  <Button variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Kalender Ujian
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Cari Ujian</Label>
                      <Input
                        placeholder="Cari judul, deskripsi, atau kode..."
                        value={examSearch}
                        onChange={(e) => setExamSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Filter Status</Label>
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
                          <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
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
                          <SelectItem value="start_date">Tanggal Mulai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exams Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judul Ujian</TableHead>
                        <TableHead>Bank Soal</TableHead>
                        <TableHead>Jadwal</TableHead>
                        <TableHead>Durasi</TableHead>
                        <TableHead>Peserta</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{exam.title}</div>
                              <div className="text-sm text-slate-500">{exam.description}</div>
                              {exam.accessCode && (
                                <div className="text-xs font-mono text-blue-600 mt-1">
                                  Kode: {exam.accessCode}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{exam.questionBankTitle}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Mulai: {new Date(exam.startDate).toLocaleString()}</div>
                              <div>Selesai: {new Date(exam.endDate).toLocaleString()}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <span>{exam.duration} menit</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Total: {exam.totalParticipants}</div>
                              <div>Selesai: {exam.completedParticipants}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              exam.status === 'ONGOING' ? 'default' :
                                exam.status === 'SCHEDULED' ? 'secondary' :
                                  exam.status === 'COMPLETED' ? 'outline' :
                                    exam.status === 'CANCELLED' ? 'destructive' : 'secondary'
                            }>
                              {exam.status === 'ONGOING' ? 'Berlangsung' :
                                exam.status === 'SCHEDULED' ? 'Terjadwal' :
                                  exam.status === 'COMPLETED' ? 'Selesai' :
                                    exam.status === 'CANCELLED' ? 'Dibatalkan' : 'Draft'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <FileBarChart className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ ANNOUNCEMENTS TAB ============ */}
            <TabsContent value="announcements" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Pengumuman</h2>
                  <p className="text-slate-600">Kelola pengumuman sistem untuk semua pengguna</p>
                </div>
                <Button onClick={() => setShowAddAnnouncement(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Pengumuman
                </Button>
              </div>

              {/* Filter */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Filter Status</Label>
                      <Select value={announcementFilter} onValueChange={setAnnouncementFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Pengumuman" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Pengumuman</SelectItem>
                          <SelectItem value="published">Terpublikasi</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
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
                          <SelectItem value="priority">Prioritas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Announcements List */}
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {announcement.type === 'IMPORTANT' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                            {announcement.type === 'WARNING' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                            {announcement.type === 'INFO' && <Bell className="w-5 h-5 text-blue-600" />}
                            {announcement.type === 'EVENT' && <Calendar className="w-5 h-5 text-green-600" />}
                            {announcement.title}
                          </CardTitle>
                          <CardDescription>
                            Dipublikasikan: {new Date(announcement.publishDate).toLocaleDateString()} |
                            Berakhir: {new Date(announcement.expiryDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            announcement.priority === 'URGENT' ? 'destructive' :
                              announcement.priority === 'HIGH' ? 'default' :
                                announcement.priority === 'MEDIUM' ? 'secondary' : 'outline'
                          }>
                            {announcement.priority}
                          </Badge>
                          <Badge variant={announcement.isPublished ? "default" : "secondary"}>
                            {announcement.isPublished ? "PUBLISHED" : "DRAFT"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-line">{announcement.content}</p>
                      </div>
                      {announcement.attachments.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm font-medium mb-2">Lampiran:</div>
                          <div className="flex flex-wrap gap-2">
                            {announcement.attachments.map((attachment, index) => (
                              <Badge key={index} variant="outline">
                                <FileText className="w-3 h-3 mr-1" />
                                {attachment}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          {announcement.isPublished ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                          {announcement.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ============ FAQ TAB ============ */}
            <TabsContent value="faq" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Frequently Asked Questions</h2>
                  <p className="text-slate-600">Kelola pertanyaan dan jawaban umum</p>
                </div>
                <Button onClick={() => setShowAddFAQ(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah FAQ
                </Button>
              </div>

              {/* Search and Filter */}
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
                      <Label>Filter Status</Label>
                      <Select value={faqFilter} onValueChange={setFaqFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="published">Terpublikasi</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Kategori</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kategori</SelectItem>
                          <SelectItem value="exam">Ujian</SelectItem>
                          <SelectItem value="account">Akun</SelectItem>
                          <SelectItem value="technical">Teknis</SelectItem>
                          <SelectItem value="general">Umum</SelectItem>
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
                          <CardTitle className="text-lg">{faq.question}</CardTitle>
                          <CardDescription>
                            Kategori: {faq.category} | Urutan: {faq.order} |
                            Dilihat: {faq.views}x |
                            Berguna: {faq.helpful} | Tidak Berguna: {faq.notHelpful}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={faq.isPublished ? "default" : "secondary"}>
                            {faq.isPublished ? "PUBLISHED" : "DRAFT"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-line">{faq.answer}</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          {faq.isPublished ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                          {faq.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ============ REPORTS TAB ============ */}
            <TabsContent value="reports" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Berita Acara & Laporan</h2>
                  <p className="text-slate-600">Generate dan kelola laporan ujian</p>
                </div>
                <Button onClick={() => setShowGenerateReport(true)}>
                  <FileBarChart className="w-4 h-4 mr-2" />
                  Generate Laporan
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Total Laporan</p>
                        <p className="text-2xl font-bold">{stats.totalReports}</p>
                      </div>
                      <FileBarChart className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Siap Download</p>
                        <p className="text-2xl font-bold">{reports.filter(r => r.status === 'READY').length}</p>
                      </div>
                      <DownloadCloud className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Sedang Diproses</p>
                        <p className="text-2xl font-bold">{reports.filter(r => r.status === 'GENERATING').length}</p>
                      </div>
                      <RefreshCw className="w-8 h-8 text-amber-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Gagal</p>
                        <p className="text-2xl font-bold">{reports.filter(r => r.status === 'FAILED').length}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reports Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judul Ujian</TableHead>
                        <TableHead>Jenis Laporan</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Dibuat Oleh</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.examTitle}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {report.reportType === 'PERFORMANCE' ? 'Performa' :
                                report.reportType === 'PARTICIPANT' ? 'Peserta' :
                                  report.reportType === 'VIOLATION' ? 'Pelanggaran' : 'Komprehensif'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{report.format}</Badge>
                          </TableCell>
                          <TableCell>{report.generatedBy}</TableCell>
                          <TableCell>{new Date(report.generatedAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              report.status === 'READY' ? 'default' :
                                report.status === 'GENERATING' ? 'secondary' : 'destructive'
                            }>
                              {report.status === 'READY' ? 'Siap' :
                                report.status === 'GENERATING' ? 'Diproses' : 'Gagal'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {report.status === 'READY' && (
                                <Button size="sm" variant="outline">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============ SETTINGS TAB ============ */}
            <TabsContent value="settings" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Pengaturan Sistem</h2>
                <p className="text-slate-600">Konfigurasi sistem ujian online</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Exam Settings */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Pengaturan Ujian</CardTitle>
                    <CardDescription>Konfigurasi pengaturan umum ujian</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Acak Urutan Soal</Label>
                        <p className="text-sm text-slate-500">Soal akan ditampilkan secara acak untuk setiap peserta</p>
                      </div>
                      <Switch
                        checked={settings.randomizeQuestions}
                        onCheckedChange={(checked) => setSettings({ ...settings, randomizeQuestions: checked })}
                      />
                    </div>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Acak Pilihan Jawaban</Label>
                        <p className="text-sm text-slate-500">Urutan pilihan jawaban akan diacak</p>
                      </div>
                      <Switch
                        checked={settings.randomizeAnswers}
                        onCheckedChange={(checked) => setSettings({ ...settings, randomizeAnswers: checked })}
                      />
                    </div>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Kartu Ujian</Label>
                        <p className="text-sm text-slate-500">Tampilkan kartu ujian di dashboard siswa</p>
                      </div>
                      <Switch
                        checked={settings.enableExamCards}
                        onCheckedChange={(checked) => setSettings({ ...settings, enableExamCards: checked })}
                      />
                    </div>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Multiple Attempts</Label>
                        <p className="text-sm text-slate-500">Izinkan peserta mengulang ujian</p>
                      </div>
                      <Switch
                        checked={settings.allowMultipleAttempts}
                        onCheckedChange={(checked) => setSettings({ ...settings, allowMultipleAttempts: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Keamanan</CardTitle>
                    <CardDescription>Pengaturan keamanan ujian</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Deteksi Pelanggaran</Label>
                        <p className="text-sm text-slate-500">Aktifkan monitoring pelanggaran</p>
                      </div>
                      <Switch
                        checked={settings.enableViolations}
                        onCheckedChange={(checked) => setSettings({ ...settings, enableViolations: checked })}
                      />
                    </div>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Mode Fullscreen</Label>
                        <p className="text-sm text-slate-500">Wajibkan mode fullscreen saat ujian</p>
                      </div>
                      <Switch
                        checked={settings.enableFullscreen}
                        onCheckedChange={(checked) => setSettings({ ...settings, enableFullscreen: checked })}
                      />
                    </div>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Proctoring</Label>
                        <p className="text-sm text-slate-500">Aktifkan sistem proctoring (kamera)</p>
                      </div>
                      <Switch
                        checked={settings.enableProctoring}
                        onCheckedChange={(checked) => setSettings({ ...settings, enableProctoring: checked })}
                      />
                    </div>
                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Strict Time Limit</Label>
                        <p className="text-sm text-slate-500">Otomatis submit saat waktu habis</p>
                      </div>
                      <Switch
                        checked={settings.timeLimitStrict}
                        onCheckedChange={(checked) => setSettings({ ...settings, timeLimitStrict: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Result Settings */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Pengaturan Hasil</CardTitle>
                    <CardDescription>Konfigurasi tampilan hasil ujian</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Tampilkan Hasil Langsung</Label>
                            <p className="text-sm text-slate-500">Tampilkan hasil langsung setelah submit</p>
                          </div>
                          <Switch
                            checked={settings.showResultsImmediately}
                            onCheckedChange={(checked) => setSettings({ ...settings, showResultsImmediately: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Review Soal</Label>
                            <p className="text-sm text-slate-500">Izinkan peserta review soal setelah ujian</p>
                          </div>
                          <Switch
                            checked={settings.allowQuestionReview}
                            onCheckedChange={(checked) => setSettings({ ...settings, allowQuestionReview: checked })}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label>Passing Grade Default</Label>
                          <Input type="number" defaultValue="70" className="mt-2" />
                          <p className="text-sm text-slate-500 mt-1">Nilai minimal untuk lulus (dalam persen)</p>
                        </div>

                        <div>
                          <Label>Durasi Default Ujian (menit)</Label>
                          <Input type="number" defaultValue="120" className="mt-2" />
                          <p className="text-sm text-slate-500 mt-1">Durasi default ujian baru</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button className="ml-auto">
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Pengaturan
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            {/* ============ MODALS ============ */}

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
                        <Label>Nama Lengkap *</Label>
                        <Input
                          value={newStudent.name}
                          onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                          placeholder="Masukkan nama lengkap"
                        />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={newStudent.email}
                          onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <Label>NIM *</Label>
                        <Input
                          value={newStudent.nim}
                          onChange={(e) => setNewStudent({ ...newStudent, nim: e.target.value })}
                          placeholder="Masukkan NIM"
                        />
                      </div>
                      <div>
                        <Label>Kelas</Label>
                        <Input
                          value={newStudent.class}
                          onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                          placeholder="Contoh: XII-IPA-1"
                        />
                      </div>
                      <div>
                        <Label>Grade/Angkatan</Label>
                        <Input
                          value={newStudent.grade}
                          onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                          placeholder="Contoh: 12"
                        />
                      </div>
                      <div>
                        <Label>Password {!editingStudent && '*'}</Label>
                        <Input
                          type="password"
                          value={newStudent.password}
                          onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                          placeholder={editingStudent ? 'Kosongkan untuk tidak mengubah' : 'Masukkan password'}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                        setShowAddStudent(false)
                        setEditingStudent(null)
                        setNewStudent({
                          name: '',
                          email: '',
                          nim: '',
                          class: '',
                          grade: '',
                          password: ''
                        })
                      }}>
                        Batal
                      </Button>
                      <Button onClick={addStudent}>
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
                      <Label>Nama Lengkap *</Label>
                      <Input
                        value={newTeacher.name}
                        onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newTeacher.email}
                        onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label>NIP (Opsional)</Label>
                      <Input
                        value={newTeacher.nip}
                        onChange={(e) => setNewTeacher({ ...newTeacher, nip: e.target.value })}
                        placeholder="Masukkan NIP"
                      />
                    </div>
                    <div>
                      <Label>Departemen</Label>
                      <Input
                        value={newTeacher.department}
                        onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
                        placeholder="Contoh: Matematika"
                      />
                    </div>
                    <div>
                      <Label>Password {!editingTeacher && '*'}</Label>
                      <Input
                        type="password"
                        value={newTeacher.password}
                        onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                        placeholder={editingTeacher ? 'Kosongkan untuk tidak mengubah' : 'Masukkan password'}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => {
                        setShowAddTeacher(false)
                        setEditingTeacher(null)
                        setNewTeacher({
                          name: '',
                          email: '',
                          nip: '',
                          department: '',
                          password: ''
                        })
                      }}>
                        Batal
                      </Button>
                      <Button onClick={editingTeacher ? () => updateTeacher(editingTeacher.id, newTeacher) : addTeacher}>
                        {editingTeacher ? 'Update Guru' : 'Tambah Guru'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  )
}
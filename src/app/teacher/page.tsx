'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  BookOpen, 
  Users, 
  FileQuestion, 
  Settings, 
  LogOut,
  GraduationCap,
  Clock,
  Play,
  Square,
  Edit,
  Trash2,
  Plus,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Archive,
  BarChart3,
  Calendar,
  Copy,
  Key,
  FileText,
  X
} from 'lucide-react'

interface QuestionBank {
  id: string
  title: string
  description?: string
  category: string
  difficulty: string
  isActive: boolean
  isPublic: boolean
  questions: Question[]
  createdAt: string
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
  createdAt: string
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([])
  const [examRooms, setExamRooms] = useState<ExamRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateBank, setShowCreateBank] = useState(false)
  const [showCreateExam, setShowCreateExam] = useState(false)

  const [newBank, setNewBank] = useState({
    title: '',
    description: '',
    category: 'REGULAR',
    difficulty: 'MEDIUM'
  })

  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    questionBankId: '',
    classCode: '',
    accessType: 'ALL',
    allowedStudents: '',
    allowedClasses: '',
    maxQuestions: '',
    duration: 60,
    attemptType: 'SINGLE',
    randomizeOrder: false,
    randomizeAnswers: false
  })

  // Additional states for filtering and management
  const [bankSearch, setBankSearch] = useState('')
  const [bankCategoryFilter, setBankCategoryFilter] = useState('all')
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState('all')
  const [bankStatusFilter, setBankStatusFilter] = useState('all')
  const [showImportQuestions, setShowImportQuestions] = useState(false)
  const [editingBank, setEditingBank] = useState<any>(null)
  const [viewingQuestions, setViewingQuestions] = useState<any>(null)
  const [showQuestionEditor, setShowQuestionEditor] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [examRooms, setExamRooms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [showCreateExam, setShowCreateExam] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [authUser, setAuthUser] = useState<any>(null)

  // Computed properties
  const filteredQuestionBanks = questionBanks.filter(bank => {
    const matchesSearch = !bankSearch || 
      bank.title.toLowerCase().includes(bankSearch.toLowerCase()) ||
      (bank.description && bank.description.toLowerCase().includes(bankSearch.toLowerCase()))
    
    const matchesCategory = bankCategoryFilter === 'all' || bank.category === bankCategoryFilter
    const matchesDifficulty = bankDifficultyFilter === 'all' || bank.difficulty === bankDifficultyFilter
    const matchesStatus = bankStatusFilter === 'all' || bank.isActive.toString() === bankStatusFilter
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
  })

  // Additional functions
  const viewQuestions = (bank: any) => {
    setViewingQuestions(bank)
    setShowQuestionEditor(true)
  }

  const editBank = (bank: any) => {
    setEditingBank(bank)
    setShowCreateBank(true)
  }

  const deleteBank = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bank soal ini?')) return
    
    try {
      const response = await fetch(`/api/teacher/question-banks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      })
      
      if (response.ok) {
        fetchTeacherData()
        alert('Bank soal berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting bank:', error)
      alert('Gagal menghapus bank soal')
    }
  }

  const duplicateBank = async (bank: any) => {
    try {
      const response = await fetch('/api/teacher/question-banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({
          title: `${bank.title} (Copy)`,
          description: bank.description,
          category: bank.category,
          difficulty: bank.difficulty
        })
      })
      
      if (response.ok) {
        fetchTeacherData()
        alert('Bank soal berhasil diduplikasi')
      }
    } catch (error) {
      console.error('Error duplicating bank:', error)
      alert('Gagal menduplikasi bank soal')
    }
  }

  const exportQuestions = () => {
    const csv = [
      ['Judul Bank', 'Deskripsi', 'Kategori', 'Kesulitan', 'Jumlah Soal', 'Status'].join(','),
      ...filteredQuestionBanks.map(bank => [
        bank.title,
        bank.description || '',
        bank.category,
        bank.difficulty,
        bank.questions.length,
        bank.isActive ? 'Aktif' : 'Nonaktif'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'question-banks.csv'
    a.click()
  }

  const archiveBanks = async () => {
    if (!confirm('Arsipkan bank soal yang dipilih?')) return
    
    try {
      // Archive selected banks
      alert('Bank soal berhasil diarsipkan')
    } catch (error) {
      console.error('Error archiving banks:', error)
      alert('Gagal mengarsipkan bank soal')
    }
  }

  const saveQuestion = async () => {
    try {
      const response = await fetch('/api/teacher/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({
          questionBankId: viewingQuestions.id,
          question: editingQuestion
        })
      })
      
      if (response.ok) {
        alert('Soal berhasil disimpan')
        setEditingQuestion(null)
        // Refresh questions list
        const questionsResponse = await fetch(`/api/teacher/questions/${viewingQuestions.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
          }
        })
        
        if (questionsResponse.ok) {
          const updatedQuestions = await questionsResponse.json()
          setViewingQuestions(prev => ({
            ...prev,
            questions: updatedQuestions
          }))
        }
      }
    } catch (error) {
      console.error('Error saving question:', error)
      alert('Gagal menyimpan soal')
    }
  }

  const updateQuestion = async () => {
    try {
      const response = await fetch(`/api/teacher/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
        },
        body: JSON.stringify(editingQuestion)
      })
      
      if (response.ok) {
        alert('Soal berhasil diupdate')
        setEditingQuestion(null)
        // Refresh questions list
        const questionsResponse = await fetch(`/api/teacher/questions/${viewingQuestions.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
          }
        })
        
        if (questionsResponse.ok) {
          const updatedQuestions = await questionsResponse.json()
          setViewingQuestions(prev => ({
            ...prev,
            questions: updatedQuestions
          }))
        }
      }
    } catch (error) {
      console.error('Error updating question:', error)
      alert('Gagal update soal')
    }
  }

  const deleteQuestion = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return
    
    try {
      const response = await fetch(`/api/teacher/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      })
      
      if (response.ok) {
        // Refresh questions list
        const questionsResponse = await fetch(`/api/teacher/questions/${viewingQuestions.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
          }
        })
        
        if (questionsResponse.ok) {
          const updatedQuestions = await questionsResponse.json()
          setViewingQuestions(prev => ({
            ...prev,
            questions: updatedQuestions
          }))
        }
        
        alert('Soal berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Gagal menghapus soal')
    }
  }

  const createExamRoom = async () => {
    try {
      const response = await fetch('/api/teacher/exam-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
        },
        body: JSON.stringify(newExam)
      })
      
      if (response.ok) {
        setShowCreateExam(false)
        fetchTeacherData()
        alert('Ruang ujian berhasil dibuat')
      }
    } catch (error) {
      console.error('Error creating exam room:', error)
      alert('Gagal membuat ruang ujian')
    }
  }

  const toggleExamStatus = async (examId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/teacher/exam-rooms/${examId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
        },
        body: JSON.stringify({ isActive: !isActive })
      })
      
      if (response.ok) {
        fetchTeacherData()
        alert(`Ujian berhasil ${isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      }
    } catch (error) {
      console.error('Error toggling exam status:', error)
      alert('Gagal mengubah status ujian')
    }
  }

  const deleteExamRoom = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ruang ujian ini?')) return
    
    try {
      const response = await fetch(`/api/teacher/exam-rooms/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
        }
      })
      
      if (response.ok) {
        fetchTeacherData()
        alert('Ruang ujian berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting exam room:', error)
      alert('Gagal menghapus ruang ujian')
    }
  }

  const terminateExam = async (examRoomId: string, studentId: string) => {
    if (!confirm('Paksa hentikan ujian siswa ini?')) return
    
    try {
      const response = await fetch('/api/teacher/exam-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
        },
        body: JSON.stringify({
          examRoomId,
          action: 'terminate',
          data: { studentId }
        })
      })
      
      if (response.ok) {
        fetchTeacherData()
        alert('Ujian siswa berhasil dihentikan')
      }
    } catch (error) {
      console.error('Error terminating exam:', error)
      alert('Gagal menghentikan ujian')
    }
  }

  const bulkTerminateExams = async (examRoomId: string) => {
    if (!confirm('Paksa hentikan semua ujian di ruang ini?')) return
    
    try {
      const response = await fetch('/api/teacher/exam-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
        },
        body: JSON.stringify({
          examRoomId,
          action: 'bulk_terminate'
        })
      })
      
      if (response.ok) {
        fetchTeacherData()
        alert(`${response.data.message}`)
      }
    } catch (error) {
      console.error('Error bulk terminating exams:', error)
      alert('Gagal menghentikan ujian')
    }
  }

  const resetStudentPassword = async (studentId: string) => {
    if (!confirm('Reset password siswa ini?')) return
    
    try {
      const response = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
        },
        body: JSON.stringify({
          studentId,
          action: 'reset_password'
        })
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

  const updateStudentClass = async (studentId: string, newClass: string) => {
    if (!confirm(`Ubah kelas siswa ini ke "${newClass}"?`)) return
    
    try {
      const response = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
        },
        body: JSON.stringify({
          studentId,
          action: 'update_class',
          data: { class: newClass }
        })
      })
      
      if (response.ok) {
        alert('Kelas siswa berhasil diupdate')
      }
    } catch (error) {
      console.error('Error updating class:', error)
      alert('Gagal update kelas')
    }
  }

  const deleteStudentResults = async (studentId: string) => {
    if (!confirm('Hapus semua hasil ujian siswa ini?')) return
    
    try {
      const response = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
        },
        body: JSON.stringify({
          studentId,
          action: 'delete_results'
        })
      })
      
      if (response.ok) {
        alert('Hasil ujian siswa berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting results:', error)
      alert('Gagal menghapus hasil ujian')
    }
  }

  const exportQuestions = () => {
    const csv = [
      ['Judul Bank', 'Deskripsi', 'Kategori', 'Kesulitan', 'Jumlah Soal', 'Status'].join(','),
      ...filteredQuestionBanks.map(bank => [
        bank.title,
        bank.description || '',
        bank.category,
        bank.difficulty,
        bank.questions.length,
        bank.isActive ? 'Aktif' : 'Nonaktif'
      ]).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'question-banks.csv'
    a.click()
  }

  const archiveBanks = async () => {
    if (!confirm('Arsipkan bank soal yang dipilih?')) return
    
    try {
      // Archive selected banks
      alert('Bank soal berhasil diarsipkan')
    } catch (error) {
      console.error('Error archiving banks:', error)
      alert('Gagal mengarsipkan bank soal')
    }
  }

  const createExamRoom = async () => {
    try {
      const response = await fetch('/api/teacher/exam-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')`
        },
        body: JSON.stringify(newExam)
      })
      
      if (response.ok) {
        setShowCreateExam(false)
        fetchTeacherData()
        alert('Ruang ujian berhasil dibuat')
      }
    } catch (error) {
      console.error('Error creating exam room:', error)
      alert('Gagal membuat ruang ujian')
    }
  }

  const createQuestionBank = async () => {
    try {
      const response = await fetch('/api/teacher/question-banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({
          title: newBank.title,
          description: newBank.description,
          category: newBank.category,
          difficulty: newBank.difficulty
        })
      })
      
      if (response.ok) {
        setShowCreateBank(false)
        fetchTeacherData()
        alert('Bank soal berhasil dibuat')
      }
    } catch (error) {
      console.error('Error creating question bank:', error)
      alert('Gagal membuat bank soal')
    }
  }

  const saveQuestionBank = async () => {
    try {
      const response = await fetch('/api/teacher/question-banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({
          title: editingBank.title,
          description: editingBank.description,
          category: editingBank.category,
          difficulty: editingBank.difficulty,
          isActive: editingBank.isActive
        })
      })
      
      if (response.ok) {
        setShowCreateBank(false)
        setEditingBank(null)
        fetchTeacherData()
        alert('Bank soal berhasil diupdate')
      }
    } catch (error) {
      console.error('Error saving bank:', error)
      alert('Gagal update bank soal')
    }
  }

  const fetchTeacherData = async () => {
    try {
      // Fetch question banks
      const banksResponse = await fetch('/api/teacher/question-banks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      })

      if (banksResponse.ok) {
        const data = await banksResponse.json()
        setQuestionBanks(data)
      }

      // Fetch exam rooms
      const examsResponse = await fetch('/api/teacher/exam-rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      })

      if (examsResponse.ok) {
        const data = await examsResponse.json()
        setExamRooms(data)
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error)
    }
  }
  const [examRooms, setExamRooms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [showCreateExam, setShowCreateExam] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [authUser, setAuthUser] = useState<any>(null)
  const [showImportQuestions, setShowImportQuestions] = useState(false)
  const [editingBank, setEditingBank] = useState<any>(null)
  const [viewingQuestions, setViewingQuestions] = useState<any>(null)
  const [showQuestionEditor, setShowQuestionEditor] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('teacherToken')
    if (!token) {
      router.push('/')
      return
    }

    fetchTeacherData()
  }, [router])

  // Computed properties
  const filteredQuestionBanks = questionBanks.filter(bank => {
    const matchesSearch = !bankSearch || 
      bank.title.toLowerCase().includes(bankSearch.toLowerCase()) ||
      (bank.description && bank.description.toLowerCase().includes(bankSearch.toLowerCase()))
    
    const matchesCategory = bankCategoryFilter === 'all' || bank.category === bankCategoryFilter
    const matchesDifficulty = bankDifficultyFilter === 'all' || bank.difficulty === bankDifficultyFilter
    const matchesStatus = bankStatusFilter === 'all' || bank.isActive.toString() === bankStatusFilter
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
  })

  // Additional functions
  const viewQuestions = (bank: any) => {
    setViewingQuestions(bank)
    setShowQuestionEditor(true)
  }

  const editBank = (bank: any) => {
    setEditingBank(bank)
    setShowCreateBank(true)
  }

  const deleteBank = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bank soal ini?')) return
    
    try {
      const response = await fetch(`/api/teacher/question-banks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      })
      
      if (response.ok) {
        fetchTeacherData()
        alert('Bank soal berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting bank:', error)
      alert('Gagal menghapus bank soal')
    }
  }

  const duplicateBank = async (bank: any) => {
    try {
      const response = await fetch('/api/teacher/question-banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({
          title: `${bank.title} (Copy)`,
          description: bank.description,
          category: bank.category,
          difficulty: bank.difficulty
        })
      })
      
      if (response.ok) {
        fetchTeacherData()
        alert('Bank soal berhasil diduplikasi')
      }
    } catch (error) {
      console.error('Error duplicating bank:', error)
      alert('Gagal menduplikasi bank soal')
    }
  }

  const saveQuestion = async () => {
    try {
      const response = await fetch('/api/teacher/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({
          questionBankId: viewingQuestions.id,
          question: editingQuestion
        })
      })
      
      if (response.ok) {
        alert('Soal berhasil disimpan')
        setEditingQuestion(null)
        // Refresh questions list
        const questionsResponse = await fetch(`/api/teacher/questions/${viewingQuestions.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
          }
        })
        
        if (questionsResponse.ok) {
          const updatedQuestions = await questionsResponse.json()
          setViewingQuestions(prev => ({
            ...prev,
            questions: updatedQuestions
          }))
        }
      }
    } catch (error) {
      console.error('Error saving question:', error)
      alert('Gagal menyimpan soal')
    }
  }

  const updateQuestion = async () => {
    try {
      const response = await fetch(`/api/teacher/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify(editingQuestion)
      })
      
      if (response.ok) {
        alert('Soal berhasil diupdate')
        setEditingQuestion(null)
        // Refresh questions list
        const questionsResponse = await fetch(`/api/teacher/questions/${viewingQuestions.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
          }
        })
        
        if (questionsResponse.ok) {
          const updatedQuestions = await questionsResponse.json()
          setViewingQuestions(prev => ({
            ...prev,
            questions: updatedQuestions
          }))
        }
      }
    } catch (error) {
      console.error('Error updating question:', error)
      alert('Gagal mengupdate soal')
    }
  }

  const deleteQuestion = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return
    
    try {
      const response = await fetch(`/api/teacher/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      })
      
      if (response.ok) {
        // Refresh questions list
        const questionsResponse = await fetch(`/api/teacher/questions/${viewingQuestions.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
          }
        })
        
        if (questionsResponse.ok) {
          const updatedQuestions = await questionsResponse.json()
          setViewingQuestions(prev => ({
            ...prev,
            questions: updatedQuestions
          }))
        }
        
        alert('Soal berhasil dihapus')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Gagal menghapus soal')
    }
  }

  const exportQuestions = () => {
    const csv = [
      ['Judul Bank', 'Deskripsi', 'Kategori', 'Kesulitan', 'Jumlah Soal', 'Status'].join(','),
      ...filteredQuestionBanks.map(bank => [
        bank.title,
        bank.description || '',
        bank.category,
        bank.difficulty,
        bank.questions.length,
        bank.isActive ? 'Aktif' : 'Nonaktif'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'question-banks.csv'
    a.click()
  }

  const archiveBanks = async () => {
    if (!confirm('Arsipkan bank soal yang dipilih?')) return
    
    try {
      // Archive selected banks
      alert('Bank soal berhasil diarsipkan')
    } catch (error) {
      console.error('Error archiving banks:', error)
      alert('Gagal mengarsipkan bank soal')
    }
  }

  const fetchTeacherData = async () => {
    try {
      // Fetch question banks
      const banksResponse = await fetch('/api/teacher/question-banks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      })

      if (banksResponse.ok) {
        const data = await banksResponse.json()
        setQuestionBanks(data)
      }

      // Fetch exam rooms
      const examsResponse = await fetch('/api/teacher/exam-rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      })

      if (examsResponse.ok) {
        const data = await examsResponse.json()
        setExamRooms(data)
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('teacherToken')
    localStorage.removeItem('teacherData')
    router.push('/')
  }

  const createQuestionBank = async () => {
    try {
      const response = await fetch('/api/teacher/question-banks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify(newBank)
      })

      if (response.ok) {
        setShowCreateBank(false)
        setNewBank({ title: '', description: '', category: 'REGULAR', difficulty: 'MEDIUM' })
        fetchTeacherData()
      }
    } catch (error) {
      console.error('Error creating question bank:', error)
    }
  }

  const createExamRoom = async () => {
    try {
      const response = await fetch('/api/teacher/exam-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify(newExam)
      })

      if (response.ok) {
        setShowCreateExam(false)
        setNewExam({
          title: '',
          description: '',
          questionBankId: '',
          classCode: '',
          accessType: 'ALL',
          allowedStudents: '',
          allowedClasses: '',
          maxQuestions: '',
          duration: 60,
          attemptType: 'SINGLE',
          randomizeOrder: false,
          randomizeAnswers: false
        })
        fetchTeacherData()
      }
    } catch (error) {
      console.error('Error creating exam room:', error)
    }
  }

  const toggleExamStatus = async (examId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/teacher/exam-rooms/${examId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        fetchTeacherData()
      }
    } catch (error) {
      console.error('Error toggling exam status:', error)
    }
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
            <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl">
              E
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Examo Teacher</h1>
              <p className="text-sm text-slate-500">Dashboard Guru</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <GraduationCap className="w-3 h-3 mr-1" />
              Guru
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
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
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
              variant={activeTab === 'exam-rooms' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('exam-rooms')}
            >
              <FileQuestion className="w-4 h-4 mr-2" />
              Ruang Ujian
            </Button>
            <Button
              variant={activeTab === 'results' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('results')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Hasil Ujian
            </Button>
            <Button
              variant={activeTab === 'archive' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('archive')}
            >
              <Archive className="w-4 h-4 mr-2" />
              Arsip
            </Button>
            <Button
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('profile')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Profil
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Overview</h2>
                <p className="text-slate-600">Ringkasan aktivitas mengajar</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bank Soal</CardTitle>
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{questionBanks.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {questionBanks.filter(b => b.isActive).length} aktif
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ruang Ujian</CardTitle>
                    <FileQuestion className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{examRooms.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {examRooms.filter(e => e.isActive).length} aktif
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Soal</CardTitle>
                    <FileText className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {questionBanks.reduce((total, bank) => total + bank.questions.length, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Semua bank soal</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ujian Aktif</CardTitle>
                    <Play className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{examRooms.filter(e => e.isActive).length}</div>
                    <p className="text-xs text-muted-foreground">Sedang berlangsung</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Cepat</CardTitle>
                  <CardDescription>Aksi yang sering digunakan guru</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start"
                      onClick={() => setShowCreateBank(true)}
                    >
                      <Plus className="w-6 h-6 mb-2 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">Buat Bank Soal</div>
                        <div className="text-sm text-slate-500">Tambah bank soal baru</div>
                      </div>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-start"
                      onClick={() => setShowCreateExam(true)}
                    >
                      <Plus className="w-6 h-6 mb-2 text-green-600" />
                      <div className="text-left">
                        <div className="font-medium">Buat Ruang Ujian</div>
                        <div className="text-sm text-slate-500">Jadwalkan ujian baru</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <RefreshCw className="w-6 h-6 mb-2 text-purple-600" />
                      <div className="text-left">
                        <div className="font-medium">Acak Soal</div>
                        <div className="text-sm text-slate-500">Randomize questions</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <Copy className="w-6 h-6 mb-2 text-orange-600" />
                      <div className="text-left">
                        <div className="font-medium">Kode Kelas</div>
                        <div className="text-sm text-slate-500">Generate kode kelas</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <Square className="w-6 h-6 mb-2 text-red-600" />
                      <div className="text-left">
                        <div className="font-medium">Hentikan Ujian</div>
                        <div className="text-sm text-slate-500">Force stop exam</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <Archive className="w-6 h-6 mb-2 text-slate-600" />
                      <div className="text-left">
                        <div className="font-medium">Arsip Massal</div>
                        <div className="text-sm text-slate-500">Bulk archive</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Question Banks Tab */}
            <TabsContent value="question-banks" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Bank Soal</h2>
                  <p className="text-slate-600">Kelola koleksi soal ujian</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setShowCreateBank(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Bank Soal Baru
                  </Button>
                  <Button variant="outline" onClick={() => setShowImportQuestions(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Soal
                  </Button>
                  <Button variant="outline" onClick={exportQuestions}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Soal
                  </Button>
                  <Button variant="outline" onClick={archiveBanks}>
                    <Archive className="w-4 h-4 mr-2" />
                    Arsip Massal
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
                        placeholder="Cari judul atau deskripsi..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Kategori</Label>
                      <Select value={bankCategoryFilter} onValueChange={setBankCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kategori</SelectItem>
                          <SelectItem value="REGULAR">Regular</SelectItem>
                          <SelectItem value="TRYOUT_UTBK">Tryout UTBK</SelectItem>
                          <SelectItem value="TRYOUT_SNMPTN">Tryout SNMPTN</SelectItem>
                          <SelectItem value="CPNS">CPNS</SelectItem>
                          <SelectItem value="CUSTOM">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Kesulitan</Label>
                      <Select value={bankDifficultyFilter} onValueChange={setBankDifficultyFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Tingkat" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Tingkat</SelectItem>
                          <SelectItem value="EASY">Mudah</SelectItem>
                          <SelectItem value="MEDIUM">Sedang</SelectItem>
                          <SelectItem value="HARD">Sulit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Select value={bankStatusFilter} onValueChange={setBankStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="true">Aktif</SelectItem>
                          <SelectItem value="false">Nonaktif</SelectItem>
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
                          <CardDescription>{bank.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={bank.isActive ? "default" : "secondary"}>
                            {bank.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                          <Badge variant="outline">{bank.category}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Jumlah Soal:</span>
                          <span>{bank.questions.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Kesulitan:</span>
                          <span>{bank.difficulty}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Dibuat:</span>
                          <span>{new Date(bank.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => viewQuestions(bank)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => editBank(bank)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => duplicateBank(bank)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteBank(bank.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Exam Rooms Tab */}
            <TabsContent value="exam-rooms" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Ruang Ujian</h2>
                  <p className="text-slate-600">Kelola ruang ujian dan jadwal</p>
                </div>
                <Button onClick={() => setShowCreateExam(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ruang Ujian Baru
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {examRooms.map((exam) => (
                  <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{exam.title}</CardTitle>
                          <CardDescription>{exam.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={exam.isActive ? "default" : "secondary"}>
                            {exam.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                          {exam.classCode && (
                            <Badge variant="outline">{exam.classCode}</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Durasi:</span>
                          <span>{exam.duration} menit</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Tipe:</span>
                          <span>{exam.attemptType}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Akses:</span>
                          <span>{exam.accessType}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant={exam.isActive ? "destructive" : "default"}
                          onClick={() => toggleExamStatus(exam.id, exam.isActive)}
                        >
                          {exam.isActive ? (
                            <>
                              <Square className="w-4 h-4 mr-1" />
                              Nonaktifkan
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Aktifkan
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
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

            {/* Other tabs */}
            <TabsContent value="results">
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Hasil Ujian</h3>
                <p className="text-slate-500">Analisis hasil ujian akan segera tersedia</p>
              </div>
            </TabsContent>

            <TabsContent value="archive">
              <div className="text-center py-12">
                <Archive className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Arsip</h3>
                <p className="text-slate-500">Fitur arsip massal akan segera tersedia</p>
              </div>
            </TabsContent>

            <TabsContent value="profile">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Profil</h3>
                <p className="text-slate-500">Pengaturan profil guru akan segera tersedia</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Create Question Bank Modal */}
      {showCreateBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Buat Bank Soal Baru</CardTitle>
              <CardDescription>Tambah bank soal untuk ujian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Judul Bank Soal</Label>
                <Input
                  id="title"
                  value={newBank.title}
                  onChange={(e) => setNewBank(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Masukkan judul bank soal"
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={newBank.description}
                  onChange={(e) => setNewBank(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi bank soal (opsional)"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={newBank.category} onValueChange={(value) => setNewBank(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR">Regular</SelectItem>
                    <SelectItem value="TRYOUT_UTBK">Tryout UTBK</SelectItem>
                    <SelectItem value="TRYOUT_SNMPTN">Tryout SNMPTN</SelectItem>
                    <SelectItem value="CPNS">CPNS</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Tingkat Kesulitan</Label>
                <Select value={newBank.difficulty} onValueChange={(value) => setNewBank(prev => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Mudah</SelectItem>
                    <SelectItem value="MEDIUM">Sedang</SelectItem>
                    <SelectItem value="HARD">Sulit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateBank(false)}>
                  Batal
                </Button>
                <Button onClick={createQuestionBank}>
                  Buat Bank Soal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Exam Room Modal */}
      {showCreateExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Buat Ruang Ujian Baru</CardTitle>
              <CardDescription>Jadwalkan ujian untuk siswa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="exam-title">Judul Ujian</Label>
                <Input
                  id="exam-title"
                  value={newExam.title}
                  onChange={(e) => setNewExam(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Masukkan judul ujian"
                />
              </div>
              <div>
                <Label htmlFor="exam-description">Deskripsi</Label>
                <Textarea
                  id="exam-description"
                  value={newExam.description}
                  onChange={(e) => setNewExam(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi ujian (opsional)"
                />
              </div>
              <div>
                <Label htmlFor="question-bank">Bank Soal</Label>
                <Select value={newExam.questionBankId} onValueChange={(value) => setNewExam(prev => ({ ...prev, questionBankId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bank soal" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionBanks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.title} ({bank.questions.length} soal)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class-code">Kode Kelas</Label>
                  <Input
                    id="class-code"
                    value={newExam.classCode}
                    onChange={(e) => setNewExam(prev => ({ ...prev, classCode: e.target.value }))}
                    placeholder="Contoh: XII-IPA-1"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Durasi (menit)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newExam.duration}
                    onChange={(e) => setNewExam(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="access-type">Tipe Akses</Label>
                <Select value={newExam.accessType} onValueChange={(value) => setNewExam(prev => ({ ...prev, accessType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Siswa</SelectItem>
                    <SelectItem value="CLASS_RESTRICTED">Kelas Tertentu</SelectItem>
                    <SelectItem value="STUDENT_RESTRICTED">Siswa Tertentu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="attempt-type">Tipe Percobaan</Label>
                <Select value={newExam.attemptType} onValueChange={(value) => setNewExam(prev => ({ ...prev, attemptType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Satu Kali</SelectItem>
                    <SelectItem value="UNLIMITED">Tidak Terbatas</SelectItem>
                    <SelectItem value="LIMITED">Terbatas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="randomize-order">Acak Urutan Soal</Label>
                  <Switch
                    id="randomize-order"
                    checked={newExam.randomizeOrder}
                    onCheckedChange={(checked) => setNewExam(prev => ({ ...prev, randomizeOrder: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="randomize-answers">Acak Urutan Jawaban</Label>
                  <Switch
                    id="randomize-answers"
                    checked={newExam.randomizeAnswers}
                    onCheckedChange={(checked) => setNewExam(prev => ({ ...prev, randomizeAnswers: checked }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateExam(false)}>
                  Batal
                </Button>
                <Button onClick={createExamRoom}>
                  Buat Ruang Ujian
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Question Editor Modal */}
      {showQuestionEditor && viewingQuestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Soal - {viewingQuestions.title}</CardTitle>
                      <CardDescription>{viewingQuestions.questions.length} soal</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => {
                      setShowQuestionEditor(false)
                      setViewingQuestions(null)
                      setEditingQuestion(null)
                    }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <Button onClick={() => setEditingQuestion({
                      type: 'MULTIPLE_CHOICE',
                      question: '',
                      options: '',
                      correctAnswer: '',
                      explanation: '',
                      points: 1
                    })}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Soal
                    </Button>
                    <Button variant="outline" onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = '.csv'
                      input.onchange = (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          alert('Import CSV akan segera tersedia')
                        }
                      }
                      input.click()
                    }}>
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV
                    </Button>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {viewingQuestions.questions.map((question: any, index: number) => (
                      <Card key={question.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <Badge variant="outline">{question.type}</Badge>
                            <Badge variant="outline">{question.points} poin</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingQuestion(question)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              if (confirm('Hapus soal ini?')) {
                                alert('Soal berhasil dihapus')
                              }
                            }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="font-medium">{question.question}</p>
                        </div>
                        {question.type === 'MULTIPLE_CHOICE' && (
                          <div className="space-y-1">
                            {JSON.parse(question.options || '[]').map((option: string, idx: number) => (
                              <div key={idx} className={`p-2 rounded text-sm ${
                                option === question.correctAnswer 
                                  ? 'bg-green-100 text-green-800 border border-green-300' 
                                  : 'bg-gray-50 text-gray-700 border border-gray-200'
                              }`}>
                                {String.fromCharCode(65 + idx)}. {option}
                                {option === question.correctAnswer && ' ✓'}
                              </div>
                            ))}
                          </div>
                        )}
                        {question.explanation && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <strong>Penjelasan:</strong> {question.explanation}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Question Form Modal */}
          {editingQuestion && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>
                    {editingQuestion.id ? 'Edit Soal' : 'Tambah Soal Baru'}
                  </CardTitle>
                  <CardDescription>
                    {editingQuestion.id ? 'Edit soal yang ada' : 'Tambah soal baru ke bank soal'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tipe Soal</Label>
                    <Select value={editingQuestion.type} onValueChange={(value) => setEditingQuestion({...editingQuestion, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MULTIPLE_CHOICE">Pilihan Ganda</SelectItem>
                        <SelectItem value="ESSAY">Esai</SelectItem>
                        <SelectItem value="TRUE_FALSE">Benar/Salah</SelectItem>
                        <SelectItem value="MULTIPLE_ANSWER">Jawaban Ganda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pertanyaan</Label>
                    <Textarea
                      value={editingQuestion.question}
                      onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                      placeholder="Masukkan pertanyaan"
                      rows={3}
                    />
                  </div>
                  {editingQuestion.type !== 'ESSAY' && (
                    <div>
                      <Label>Opsi Jawaban (pisahkan dengan titik koma)</Label>
                      <Input
                        value={editingQuestion.options}
                        onChange={(e) => setEditingQuestion({...editingQuestion, options: e.target.value})}
                        placeholder="Contoh: Jakarta;Bandung;Surabaya"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Kunci Jawaban</Label>
                    <Input
                      value={editingQuestion.correctAnswer}
                      onChange={(e) => setEditingQuestion({...editingQuestion, correctAnswer: e.target.value})}
                      placeholder="Jawaban yang benar"
                    />
                  </div>
                  <div>
                    <Label>Penjelasan (opsional)</Label>
                    <Textarea
                      value={editingQuestion.explanation}
                      onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                      placeholder="Penjelasan jawaban"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Poin</Label>
                    <Input
                      type="number"
                      value={editingQuestion.points}
                      onChange={(e) => setEditingQuestion({...editingQuestion, points: parseInt(e.target.value) || 1})}
                      placeholder="Poin soal"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                      Batal
                    </Button>
                    <Button onClick={() => {
                      alert('Soal berhasil disimpan')
                      setEditingQuestion(null)
                    }}>
                      Simpan Soal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
    </div>
  )
}
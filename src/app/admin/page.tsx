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
  MessageSquare
} from 'lucide-react'

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalQuestionBanks: number
  totalExamRooms: number
  activeExams: number
  completedExams: number
  suspendedStudents: number
  alumniStudents: number
}

interface SystemSettings {
  randomizeQuestions: boolean
  randomizeAnswers: boolean
  enableExamCards: boolean
  allowMultipleAttempts: boolean
  enableViolations: boolean
  enableFullscreen: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalQuestionBanks: 0,
    totalExamRooms: 0,
    activeExams: 0,
    completedExams: 0,
    suspendedStudents: 0,
    alumniStudents: 0
  })

  const [settings, setSettings] = useState<SystemSettings>({
    randomizeQuestions: false,
    randomizeAnswers: false,
    enableExamCards: true,
    allowMultipleAttempts: false,
    enableViolations: true,
    enableFullscreen: true
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
  const [questionBanks, setQuestionBanks] = useState<any[]>([])
  const [showAddQuestionBank, setShowAddQuestionBank] = useState(false)
  const [editingQuestionBank, setEditingQuestionBank] = useState<any>(null)

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

  // Student Management Functions
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTeachers(data)
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
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

  const editTeacher = (teacher: any) => {
    setEditingTeacher(teacher)
    setShowAddTeacher(true)
  }

  // Question Banks Functions
  const fetchQuestionBanks = async () => {
    try {
      const response = await fetch('/api/admin/question-banks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setQuestionBanks(data)
      }
    } catch (error) {
      console.error('Error fetching question banks:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard statistics
      const statsResponse = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })

      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data)
      }

      // Fetch system settings
      const settingsResponse = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })

      if (settingsResponse.ok) {
        const data = await settingsResponse.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    router.push('/')
  }

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
            {/* <div className="bg-slate-900 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl">
              E
            </div> */}
            <div className="w-12 h-12 rounded-xl shadow-lg shadow-blue-600/20 overflow-hidden">
              <img
                src="/Logo_Examo.png"
                alt="ExamO Logo"
                className="w-full h-full object-cover"
              />
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
              variant={activeTab === 'exams' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('exams')}
            >
              <FileQuestion className="w-4 h-4 mr-2" />
              Bank Soal & Ujian
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan Sistem
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('reports')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Berita Acara
            </Button>
            <Button
              variant={activeTab === 'announcements' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('announcements')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
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
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Overview Tab */}
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
                      {stats.suspendedStudents} suspended, {stats.alumniStudents} alumni
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

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Cepat</CardTitle>
                  <CardDescription>Pengaturan dan aksi administrator yang sering digunakan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <UserPlus className="w-6 h-6 mb-2 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">Tambah Siswa</div>
                        <div className="text-sm text-slate-500">Tambah siswa baru</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <UserMinus className="w-6 h-6 mb-2 text-red-600" />
                      <div className="text-left">
                        <div className="font-medium">Suspend Siswa</div>
                        <div className="text-sm text-slate-500">Nonaktifkan akun</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <Key className="w-6 h-6 mb-2 text-green-600" />
                      <div className="text-left">
                        <div className="font-medium">Reset Password</div>
                        <div className="text-sm text-slate-500">Reset password siswa</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <FileText className="w-6 h-6 mb-2 text-purple-600" />
                      <div className="text-left">
                        <div className="font-medium">Cetak Kartu Ujian</div>
                        <div className="text-sm text-slate-500">Generate kartu ujian</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <RefreshCw className="w-6 h-6 mb-2 text-orange-600" />
                      <div className="text-left">
                        <div className="font-medium">Acak Soal</div>
                        <div className="text-sm text-slate-500">Randomize questions</div>
                      </div>
                    </Button>

                    <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <Video className="w-6 h-6 mb-2 text-red-600" />
                      <div className="text-left">
                        <div className="font-medium">YouTube Video</div>
                        <div className="text-sm text-slate-500">Tambah video</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
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
                      <Button
                        variant={settings.randomizeQuestions ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('randomizeQuestions', !settings.randomizeQuestions)}
                      >
                        {settings.randomizeQuestions ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Acak Urutan Jawaban</div>
                        <div className="text-sm text-slate-500">Randomize answer options</div>
                      </div>
                      <Button
                        variant={settings.randomizeAnswers ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('randomizeAnswers', !settings.randomizeAnswers)}
                      >
                        {settings.randomizeAnswers ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Izinkan Multi Attempt</div>
                        <div className="text-sm text-slate-500">Allow multiple exam attempts</div>
                      </div>
                      <Button
                        variant={settings.allowMultipleAttempts ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('allowMultipleAttempts', !settings.allowMultipleAttempts)}
                      >
                        {settings.allowMultipleAttempts ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </Button>
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
                      <Button
                        variant={settings.enableFullscreen ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('enableFullscreen', !settings.enableFullscreen)}
                      >
                        {settings.enableFullscreen ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Deteksi Pelanggaran</div>
                        <div className="text-sm text-slate-500">Enable violation detection</div>
                      </div>
                      <Button
                        variant={settings.enableViolations ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('enableViolations', !settings.enableViolations)}
                      >
                        {settings.enableViolations ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Kartu Ujian</div>
                        <div className="text-sm text-slate-500">Enable exam cards</div>
                      </div>
                      <Button
                        variant={settings.enableExamCards ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('enableExamCards', !settings.enableExamCards)}
                      >
                        {settings.enableExamCards ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                                <Button size="sm" variant="outline">
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

            {/* Question Banks Tab */}
            <TabsContent value="question-banks" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Bank Soal</h2>
                  <p className="text-slate-600">Kelola bank soal dan kategori ujian</p>
                </div>
                <Button onClick={() => setShowAddQuestionBank(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Bank Soal Baru
                </Button>
              </div>

              {/* Question Banks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {questionBanks.map((bank) => (
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
                          <span>{bank.questionCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Kesulitan:</span>
                          <span>{bank.difficulty}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Pembuat:</span>
                          <span>{bank.teacherName}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
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

            <TabsContent value="reports">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Berita Acara</h3>
                <p className="text-slate-500">Fitur berita acara ujian akan segera tersedia</p>
              </div>
            </TabsContent>

            <TabsContent value="announcements">
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">Pengumuman</h3>
                <p className="text-slate-500">Fitur pengumuman akan segera tersedia</p>
              </div>
            </TabsContent>

            <TabsContent value="faq">
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 mb-2">FAQ</h3>
                <p className="text-slate-500">Fitur FAQ akan segera tersedia</p>
              </div>
            </TabsContent>
          </Tabs>
          {/* Add/Edit Student Modal */}
          {showAddStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>
                    {editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
                  </CardTitle>
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Tambah Guru Baru</CardTitle>
                  <CardDescription>Tambah guru baru ke sistem</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nama Lengkap</Label>
                    <Input placeholder="Masukkan nama lengkap" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@example.com" />
                  </div>
                  <div>
                    <Label>NIP (Opsional)</Label>
                    <Input placeholder="Masukkan NIP" />
                  </div>
                  <div>
                    <Label>Departemen</Label>
                    <Input placeholder="Contoh: Matematika" />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" placeholder="Masukkan password" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddTeacher(false)}>
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
                      addTeacher(formData)
                    }}>
                      Tambah Guru
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Add Question Bank Modal */}
          {showAddQuestionBank && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Tambah Bank Soal Baru</CardTitle>
                  <CardDescription>Buat bank soal baru untuk ujian</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Judul Bank Soal</Label>
                    <Input placeholder="Masukkan judul bank soal" />
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Textarea placeholder="Deskripsi bank soal (opsional)" />
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
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
                    <Label>Tingkat Kesulitan</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tingkat kesulitan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">Mudah</SelectItem>
                        <SelectItem value="MEDIUM">Sedang</SelectItem>
                        <SelectItem value="HARD">Sulit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assign ke Guru</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih guru" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(teacher => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddQuestionBank(false)}>
                      Batal
                    </Button>
                    <Button onClick={() => {
                      const formData = {
                        title: document.querySelector('input[placeholder="Masukkan judul bank soal"]')?.value,
                        description: document.querySelector('textarea')?.value,
                        category: document.querySelector('[role="combobox"]')?.textContent,
                        difficulty: document.querySelector('[role="combobox"]:nth-child(2)')?.textContent,
                        teacherId: document.querySelector('[role="combobox"]:nth-child(3)')?.textContent
                      }
                      addQuestionBank(formData)
                    }}>
                      Tambah Bank Soal
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
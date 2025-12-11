'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { User, Lock, GraduationCap, Shield, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [studentForm, setStudentForm] = useState({
    nim: '',
    password: ''
  })

  const [adminForm, setAdminForm] = useState({
    password: ''
  })

  const router = useRouter()

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setSuccess(message)
      setError('')
    } else {
      setError(message)
      setSuccess('')
    }
    setTimeout(() => {
      setSuccess('')
      setError('')
    }, 3000)
  }

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentForm),
      })

      const data = await response.json()

      if (response.ok) {
        showToast('Login berhasil! Mengarahkan ke dashboard...', 'success')
        localStorage.setItem('studentToken', data.token)
        localStorage.setItem('studentData', JSON.stringify(data.student))

        setTimeout(() => {
          router.push('/student')
        }, 1500)
      } else {
        showToast(data.error || 'Login gagal', 'error')
      }
    } catch (error) {
      showToast('Terjadi kesalahan. Silakan coba lagi.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminForm),
      })

      const data = await response.json()

      if (response.ok) {
        showToast('Login Admin berhasil! Mengarahkan ke dashboard...', 'success')
        localStorage.setItem('adminToken', data.token)
        localStorage.setItem('adminData', JSON.stringify(data.admin))

        setTimeout(() => {
          router.push('/admin')
        }, 1500)
      } else {
        showToast(data.error || 'Password Admin salah', 'error')
      }
    } catch (error) {
      showToast('Terjadi kesalahan. Silakan coba lagi.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-50" />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Toast Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
          <Alert variant="destructive" className="shadow-lg">
            <Lock className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right">
          <Alert className="bg-green-50 border-green-200 shadow-lg">
            <GraduationCap className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="relative z-10 w-full max-w-4xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[480px]">

          {/* Left Side - Brand */}
          <div className="w-full lg:w-5/12 bg-gradient-to-br from-slate-900 to-slate-800 p-10 flex flex-col justify-between text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(#60a5fa 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}
              />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                {/* <div className="bg-blue-600 text-slate-900 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-600/20">
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
                  <span className="font-bold text-3xl">Examo</span>
                  <div className="text-sm text-slate-400">E-Learning Management System Online</div>
                </div>
              </div>

              <h2 className="text-4xl font-bold mb-6 leading-tight">
                Ujian Online Terintegrasi
              </h2>
              {/* <p className="text-slate-300 text-lg leading-relaxed mb-8">
                Platform aman dengan statistik lengkap, antisipasi kecurangan, dan mudah digunakan untuk pendidikan modern.
              </p> */}

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm">Keamanan terjamin dengan enkripsi data</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-sm">Analisis hasil ujian yang komprehensif</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-sm">Multi-role untuk Admin, Guru, dan Siswa</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8">
              <div className="text-xs text-slate-400 mb-2">Version 2.0</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                  System Online
                </Badge>
              </div>
            </div>
          </div>

          {/* Right Side - Login Forms */}
          <div className="w-full lg:w-7/12 p-10 flex flex-col justify-center">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger
                  value="student"
                  className="data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-slate-800 rounded-lg font-bold transition-all"
                >
                  <User className="w-4 h-4 mr-2" />
                  Siswa
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-slate-800 rounded-lg font-bold transition-all"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Guru/Admin
                </TabsTrigger>
              </TabsList>

              {/* Student Login Form */}
              <TabsContent value="student" className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Login Peserta</h3>
                  <p className="text-slate-500">Masukkan NIM dan password untuk mengakses ujian</p>
                </div>

                <form onSubmit={handleStudentLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="nim" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      NIM / ID Siswa
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="nim"
                        type="text"
                        placeholder="Masukkan NIM"
                        value={studentForm.nim}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, nim: e.target.value }))}
                        className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password"
                        value={studentForm.password}
                        onChange={(e) => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/30"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Memproses...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Masuk Ujian
                      </div>
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <p className="text-xs text-slate-400">
                    Belum punya akun? Hubungi administrator sekolah
                  </p>
                </div>
              </TabsContent>

              {/* Admin Login Form */}
              <TabsContent value="admin" className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Login Admin</h3>
                  <p className="text-slate-500">Akses dashboard manajemen sistem</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Password Admin
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="admin-password"
                        type={showAdminPassword ? "text" : "password"}
                        placeholder="Masukkan password admin"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10 h-12 border-slate-200 focus:border-slate-800 focus:ring-slate-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-800/20 transition-all hover:shadow-slate-800/30"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Memproses...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Masuk Dashboard
                      </div>
                    )}
                  </Button>
                </form>

                {/* <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">
                    <strong>Default Password:</strong> <span className="font-mono bg-slate-200 px-2 py-1 rounded">admin123</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Untuk keamanan, ubah password setelah login pertama
                  </p>
                </div> */}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>© 2025 Examo - Platform Ujian Online Terpercaya</p>
        </div>
      </div>
    </div>
  )
}
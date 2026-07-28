import { useState } from 'react'
import { useNavigate } from 'react-router'
import { loginWithSupabase, isSupabaseConfigured, registerStudentWithSupabase } from '../data/supabaseSync.js'
import { loadInternship, saveInternship } from '../data/internshipStore.js'

function Login({ role = 'mahasiswa' }) {
  const navigate = useNavigate()

  // Predefined configuration and demo accounts
  const demoAccounts = {
    mahasiswa: {
      username: '22.11.4321',
      password: 'password123',
      redirect: '/mahasiswa',
      placeholder: 'Masukkan NIM / Email',
      label: 'NIM atau Email',
      roleTitle: 'Mahasiswa',
    },
    prodi: {
      username: 'admin.prodi',
      password: 'admin123',
      redirect: '/admin',
      placeholder: 'Masukkan username / Email',
      label: 'Username atau Email',
      roleTitle: 'Admin Prodi',
    },
    kaprodi: {
      username: 'kaprodi.if',
      password: 'kaprodi123',
      redirect: '/kaprodi',
      placeholder: 'Masukkan username / Email',
      label: 'Username atau Email',
      roleTitle: 'Kaprodi',
    },
  }

  const [activeRole, setActiveRole] = useState(role)
  const [username, setUsername] = useState(demoAccounts[role]?.username || '')
  const [password, setPassword] = useState(demoAccounts[role]?.password || '')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [prevRole, setPrevRole] = useState(role)

  // Loading indicator to prevent double click
  const [loading, setLoading] = useState(false)

  // Registration States for Student
  const [isRegister, setIsRegister] = useState(false)
  const [fullName, setFullName] = useState('')
  const [nim, setNim] = useState('')
  const [studyProgram, setStudyProgram] = useState('Informatika')
  const [semester, setSemester] = useState('7')
  const [email, setEmail] = useState('')

  // Sync state if role prop changes from routes (Directly in render)
  if (role !== prevRole) {
    setPrevRole(role)
    setActiveRole(role)
    setIsRegister(false)
    const demo = demoAccounts[role]
    if (demo) {
      setUsername(demo.username)
      setPassword(demo.password)
    }
    setError('')
    setSuccessMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setSuccessMessage('')

    if (!username.trim() || !password.trim()) {
      setError('Username/Email dan password wajib diisi.')
      return
    }

    setLoading(true)
    try {
      if (isSupabaseConfigured) {
        await loginWithSupabase(username, password).catch((err) => {
          console.warn('Supabase auth fallback:', err)
        })
      }

      if (activeRole === 'mahasiswa') {
        const cleanNim = username.trim()
        const storedProfile = JSON.parse(localStorage.getItem(`profile_${cleanNim}`) || 'null')
        
        let userFullName = cleanNim.includes('@') ? cleanNim.split('@')[0] : `Mahasiswa (${cleanNim})`
        let userNim = cleanNim
        let userEmail = cleanNim.includes('@') ? cleanNim : `${cleanNim}@students.amikom.ac.id`

        if (storedProfile) {
          userFullName = storedProfile.fullName || storedProfile.full_name || userFullName
          userNim = cleanNim
          userEmail = storedProfile.email || userEmail
        } else if (cleanNim !== '22.11.4321') {
          userFullName = cleanNim.includes('@') ? cleanNim.split('@')[0] : `Mahasiswa (${cleanNim})`
        }

        const sessionUser = {
          full_name: userFullName,
          nim: userNim,
          email: userEmail,
          study_program: storedProfile?.studyProgram || 'Informatika',
          semester: storedProfile?.semester || '7',
        }

        localStorage.setItem('active_user_session', JSON.stringify(sessionUser))

        // Update active internship data in local storage
        const currentData = loadInternship(userNim)
        saveInternship({
          ...currentData,
          studentName: userFullName,
          studentId: userNim,
          studentEmail: userEmail,
        })
      }

      const demo = demoAccounts[activeRole]
      if (demo) {
        navigate(demo.redirect)
      }
    } catch (err) {
      console.error(err)
      const demo = demoAccounts[activeRole]
      if (demo) {
        navigate(demo.redirect)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setSuccessMessage('')

    if (!fullName.trim() || !nim.trim() || !studyProgram.trim() || !email.trim() || !password.trim()) {
      setError('Semua kolom wajib diisi.')
      return
    }

    setLoading(true)
    try {
      if (isSupabaseConfigured) {
        const res = await registerStudentWithSupabase({
          email,
          password,
          fullName,
          nim,
          studyProgram
        })

        if (!res.success) {
          setError(res.error || 'Registrasi gagal. Silakan coba kembali.')
          return
        }
      }

      // Save student profile to localStorage
      const newProfile = {
        fullName,
        full_name: fullName,
        nim,
        studyProgram,
        semester,
        email,
      }

      localStorage.setItem(`profile_${nim}`, JSON.stringify(newProfile))
      localStorage.setItem('active_user_session', JSON.stringify(newProfile))

      const currentData = loadInternship()
      saveInternship({
        ...currentData,
        studentName: fullName,
        studentId: nim,
        studentEmail: email,
        studyProgram: studyProgram,
      })

      setSuccessMessage('Pendaftaran akun mahasiswa berhasil! Silakan masuk.')
      setUsername(nim)
      setPassword(password)
      setIsRegister(false)
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan koneksi saat registrasi.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    const demo = demoAccounts[activeRole]
    if (demo) {
      navigate(demo.redirect)
    }
  }

  const currentTheme = demoAccounts[activeRole] || demoAccounts.mahasiswa

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12 font-sans antialiased">
      {/* Floating Top Left Back Button */}
      <div className="absolute top-6 left-6">
        <button
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3 text-slate-400 transition group-hover:-translate-x-0.5 group-hover:text-slate-600">
            <path d="M19 12H5M5 12l6-6M5 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kembali ke Beranda
        </button>
      </div>

      {/* Card */}
      <div className="w-full max-w-[400px] rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-sm">
        {isRegister ? (
          <>
            <h1 className="text-2xl font-bold text-slate-900">
              Daftar Akun Baru
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Portal Pendaftaran Mahasiswa
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Nama Lengkap Mahasiswa
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nadia Putri Ramadhani"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#7C3AED] disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  NIM (Nomor Induk Mahasiswa)
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="22.11.4321"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#7C3AED] disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Program Studi
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={studyProgram}
                  onChange={(e) => setStudyProgram(e.target.value)}
                  placeholder="Informatika"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#7C3AED] disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Semester
                </label>
                <select
                  value={semester}
                  disabled={loading}
                  onChange={(e) => setSemester(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#7C3AED] disabled:bg-slate-50"
                >
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nadia.demo@mahasiswa.ac.id"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#7C3AED] disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#7C3AED] disabled:bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#7C3AED] py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Mendaftarkan...' : 'Daftar Akun'}
              </button>

              <p className="mt-4 text-center text-xs text-slate-500">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setIsRegister(false)
                    setError('')
                  }}
                  className="font-semibold text-[#7C3AED] hover:underline cursor-pointer disabled:text-slate-400"
                >
                  Masuk Sekarang
                </button>
              </p>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900">
              Masuk
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Portal <span className="font-semibold text-[#7C3AED]">{currentTheme.roleTitle}</span>
            </p>

            {successMessage && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-700">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {currentTheme.label}
                </label>
                <input
                  type="text"
                  disabled={loading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={currentTheme.placeholder}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#7C3AED] disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-3.5 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#7C3AED] disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={loading}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED] disabled:opacity-50"
                  />
                  Ingat Saya
                </label>

                <button type="button" disabled={loading} className="font-semibold text-[#7C3AED] hover:underline disabled:text-slate-400">
                  Lupa Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#7C3AED] py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Memproses...' : 'Log In'}
              </button>

              {activeRole === 'mahasiswa' && (
                <p className="mt-4 text-center text-xs text-slate-500">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setIsRegister(true)
                      setError('')
                      setSuccessMessage('')
                    }}
                    className="font-semibold text-[#7C3AED] hover:underline cursor-pointer disabled:text-slate-400"
                  >
                    Daftar Sekarang
                  </button>
                </p>
              )}
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-medium text-slate-400">atau</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.72 5.72 0 0 1-2.48 3.75v3.12h4.02c2.35-2.17 3.7-5.36 3.7-8.72z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.02-3.12c-1.12.75-2.55 1.19-3.94 1.19-3.03 0-5.6-2.05-6.52-4.81H1.31v3.23A11.99 11.99 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.48 14.35A7.16 7.16 0 0 1 5 12c0-.82.14-1.63.4-2.39V6.38H1.31A11.99 11.99 0 0 0 0 12c0 2.21.6 4.29 1.63 6.08l3.85-3.73z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.92 11.92 0 0 0 12 0C7.31 0 3.26 2.72 1.31 6.38l4.17 3.23c.92-2.76 3.49-4.86 6.52-4.86z" />
              </svg>
              Google Account
            </button>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">
        Prototype Sistem Konversi Nilai Magang &copy; 2026 &middot; Hackathon IP
      </div>
    </main>
  )
}

export default Login
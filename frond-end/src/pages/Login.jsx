import { useState } from 'react'
import { useNavigate } from 'react-router'

function Login({ role = 'mahasiswa' }) {
  const navigate = useNavigate()

  // Predefined configuration and demo accounts
  const demoAccounts = {
    mahasiswa: {
      username: '22.11.4321',
      password: 'password123',
      redirect: '/mahasiswa',
      placeholder: 'Masukkan NIM / Email (contoh: 22.11.4321)',
      label: 'NIM atau Email',
      themeColor: '#7C3AED',
      hoverColor: '#6D28D9',
      ringColor: 'focus:ring-[#7C3AED]/15',
      focusBorder: 'focus:border-[#7C3AED]',
      leftBg: 'bg-[#7C3AED]',
      leftTitle: 'Sistem Konversi Magang OBE',
      leftDesc: 'Pantau usulan konversi magang Anda dengan mudah. Masuk untuk menyusun usulan, mengunggah berkas realisasi, serta melihat hasil konversi nilai akademik Anda secara transparan.',
    },
    prodi: {
      username: 'admin.prodi',
      password: 'admin123',
      redirect: '/admin',
      placeholder: 'Masukkan username / Email (contoh: admin.prodi)',
      label: 'Username atau Email',
      themeColor: '#7C3AED',
      hoverColor: '#6D28D9',
      ringColor: 'focus:ring-[#7C3AED]/15',
      focusBorder: 'focus:border-[#7C3AED]',
      leftBg: 'bg-[#7C3AED]',
      leftTitle: 'Dashboard Verifikasi Prodi',
      leftDesc: 'Kelola berkas pendaftaran mahasiswa, validasi bobot usulan SKS konversi, serta monitoring penilaian Mitra & DPL secara langsung dalam satu dasbor terpadu.',
    },
    kaprodi: {
      username: 'kaprodi.if',
      password: 'kaprodi123',
      redirect: '/kaprodi',
      placeholder: 'Masukkan username / Email (contoh: kaprodi.if)',
      label: 'Username atau Email',
      themeColor: '#7C3AED',
      hoverColor: '#6D28D9',
      ringColor: 'focus:ring-[#7C3AED]/15',
      focusBorder: 'focus:border-[#7C3AED]',
      leftBg: 'bg-[#7C3AED]',
      leftTitle: 'Portal Pengawasan Kaprodi',
      leftDesc: 'Akses pemantauan statistik kelulusan konversi magang, tinjau laporan rekapitulasi nilai mahasiswa, serta lakukan verifikasi persetujuan akhir.',
    },
  }

  const [activeRole, setActiveRole] = useState(role)
  const [username, setUsername] = useState(demoAccounts[role]?.username || '')
  const [password, setPassword] = useState(demoAccounts[role]?.password || '')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [prevRole, setPrevRole] = useState(role)

  // Sync state if role prop changes from routes (Directly in render)
  if (role !== prevRole) {
    setPrevRole(role)
    setActiveRole(role)
    const demo = demoAccounts[role]
    if (demo) {
      setUsername(demo.username)
      setPassword(demo.password)
    }
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Username/Email dan password wajib diisi.')
      return
    }

    const demo = demoAccounts[activeRole]
    if (demo) {
      navigate(demo.redirect)
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
    <main className="flex min-h-screen font-sans antialiased bg-white">
      {/* Left Column: Login Form */}
      <section className="flex w-full flex-col justify-between p-8 sm:p-16 md:w-1/2 bg-white">
        {/* Top bar back button */}
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5 text-slate-400 group-hover:text-slate-600">
              <path d="M19 12H5M5 12l6-6M5 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kembali ke Beranda
          </button>
        </div>

        {/* Welcome Back Card */}
        <div className="mx-auto my-auto w-full max-w-[390px] py-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome Back
            </h1>
            <p className="mt-2 text-xs leading-5 text-slate-400 font-medium">
              Enter your email and password to access your account.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-800">
                Email / NIM
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={currentTheme.placeholder}
                className={`mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition ${currentTheme.focusBorder} focus:ring-4 ${currentTheme.ringColor}`}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm text-slate-800 outline-none transition ${currentTheme.focusBorder} focus:ring-4 ${currentTheme.ringColor}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                  style={{ color: currentTheme.themeColor }}
                />
                Remember Me
              </label>

              <button
                type="button"
                className="font-bold text-[#7C3AED] hover:underline"
                style={{ color: currentTheme.themeColor }}
              >
                Forgot Your Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all cursor-pointer"
              style={{ backgroundColor: currentTheme.themeColor }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = currentTheme.hoverColor)}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = currentTheme.themeColor)}
            >
              Log In
            </button>
          </form>

          {/* Social Logins */}
          <div className="mt-8">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-150" />
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Or Login With
              </span>
              <div className="flex-grow border-t border-slate-150" />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.72 5.72 0 0 1-2.48 3.75v3.12h4.02c2.35-2.17 3.7-5.36 3.7-8.72z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.02-3.12c-1.12.75-2.55 1.19-3.94 1.19-3.03 0-5.6-2.05-6.52-4.81H1.31v3.23A11.99 11.99 0 0 0 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.48 14.35A7.16 7.16 0 0 1 5 12c0-.82.14-1.63.4-2.39V6.38H1.31A11.99 11.99 0 0 0 0 12c0 2.21.6 4.29 1.63 6.08l3.85-3.73z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.92 11.92 0 0 0 12 0C7.31 0 3.26 2.72 1.31 6.38l4.17 3.23c.92-2.76 3.49-4.86 6.52-4.86z"
                  />
                </svg>
                Google
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer Info */}
        <div className="text-[10px] text-slate-400 text-center">
          Prototype Sistem Konversi Nilang Magang &copy; 2026 &middot; Hackathon IP
        </div>
      </section>

      {/* Right Column: Solid Role-colored Brand Sidebar (Hidden on mobile) */}
      <section className={`hidden w-1/2 flex-col justify-between p-12 lg:p-16 text-white md:flex ${currentTheme.leftBg}`}>
        <div>
          {/* Logo Mark */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4.5 w-4.5">
                <path d="M8 3h6l4 4v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.5 12.5h5M9.5 15.5h5M9.5 9.5h2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-xs font-bold tracking-wider uppercase">
              Konversi Magang
            </span>
          </div>
        </div>

        {/* Centered Text Only Panel */}
        <div className="max-w-md my-auto">
          <h2 className="text-4xl font-extrabold leading-tight text-white">
            {currentTheme.leftTitle}
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-white/80 font-medium">
            {currentTheme.leftDesc}
          </p>
        </div>

        {/* Small Footer Info */}
        <div className="text-xs text-white/50">
          Prototype Sistem Konversi Nilai Magang &copy; 2026 &middot; Hackathon IP
        </div>
      </section>
    </main>
  )
}

export default Login

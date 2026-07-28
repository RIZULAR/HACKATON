import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
export { isSupabaseConfigured }
import { CONVERSION_MASTER } from './conversionMaster.js'

// Cache of current authenticated profile
let currentProfile = null

/**
 * Get active student ID from auth session
 */
export async function getStudentId() {
  if (!isSupabaseConfigured) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

/**
 * Translate frontend roles to backend email format
 */
export function getDemoEmail(username) {
  if (username === '22.11.4321') return 'mahasiswa.demo@students.amikom.ac.id'
  if (username === 'admin.prodi' || username === 'admin') return 'fakultas.demo@amikom.ac.id'
  if (username === 'kaprodi.if' || username === 'kaprodi') return 'kaprodi.demo@amikom.ac.id'
  if (username === 'dpl.ade') return 'dpl.ade@amikom.ac.id'
  if (username === 'dpl.budi') return 'dpl.budi@amikom.ac.id'
  return username.includes('@') ? username : `${username}@example.com`
}

/**
 * Sign in using Supabase Auth
 */
export async function loginWithSupabase(username, password) {
  if (!isSupabaseConfigured) return { success: true, user: null }

  let email = username
  if (!username.includes('@')) {
    if (username === '22.11.4321') {
      email = 'mahasiswa.demo@students.amikom.ac.id'
    } else if (username === 'admin.prodi' || username === 'admin') {
      email = 'fakultas.demo@amikom.ac.id'
    } else if (username === 'kaprodi.if' || username === 'kaprodi') {
      email = 'kaprodi.demo@amikom.ac.id'
    } else if (username === 'dpl.ade') {
      email = 'dpl.ade@amikom.ac.id'
    } else if (username === 'dpl.budi') {
      email = 'dpl.budi@amikom.ac.id'
    } else {
      // Query profiles table to resolve NIM to registered Email
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('nim', username)
          .maybeSingle()

        if (profile?.email) {
          email = profile.email
        } else {
          email = `${username}@example.com`
        }
      } catch (err) {
        console.error('NIM lookup error:', err)
        email = `${username}@example.com`
      }
    }
  }

  const cleanPassword = password === 'password123' ? 'Password123!' : password

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: cleanPassword
  })

  if (error) {
    console.error('Supabase Auth error:', error.message)
    return { success: false, error: error.message }
  }

  // Fetch profile details
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  currentProfile = profile
  return { success: true, user: data.user, profile }
}

/**
 * Register a new student user in Supabase Auth & Profile table
 */
export async function registerStudentWithSupabase({ email, password, fullName, nim, studyProgram }) {
  if (!isSupabaseConfigured) return { success: true, user: null }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          role: 'mahasiswa',
          full_name: fullName,
          nim: nim,
          study_program: studyProgram,
          email: email
        })

      if (profileError) throw profileError
    }

    return { success: true, user: data.user }
  } catch (error) {
    console.error('Registration error:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Sign out from Supabase Auth
 */
export async function logoutFromSupabase() {
  if (!isSupabaseConfigured) return true
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  } catch (error) {
    console.error('Sign out error:', error.message)
    return false
  }
}

/**
 * Fetch the currently logged-in user's profile details
 */
export async function getLoggedInUserProfile() {
  if (!isSupabaseConfigured) return null

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return profile
  } catch (error) {
    console.error('Error fetching user profile:', error.message)
    return null
  }
}

/**
 * Upload a document to Supabase Storage
 */
export async function uploadToStorage(bucket, path, file) {
  if (!isSupabaseConfigured) return { success: true, url: URL.createObjectURL(file) }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })

  if (error) {
    console.error(`Upload error on bucket ${bucket}:`, error.message)
    return { success: false, error: error.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return { success: true, url: publicUrl }
}

/**
 * Map PostgreSQL DB status to frontend status
 */
function mapDbStatusToFrontend(app, proposal, claim) {
  if (!app) return 'DRAFT_PENGAJUAN'

  if (app.status === 'draft') return 'DRAFT_PENGAJUAN'
  if (app.status === 'submitted' || app.status === 'admin_review') return 'MENUNGGU_VERIFIKASI'
  if (app.status === 'revision') return 'PERLU_PERBAIKAN_PENGAJUAN'
  if (app.status === 'rejected') return 'PENGAJUAN_DITOLAK'

  // If application is approved, look at proposal
  if (app.status === 'approved') {
    if (!proposal) return 'MAGANG_TERVERIFIKASI'

    if (proposal.status === 'draft') return 'DRAFT_USULAN'
    if (proposal.status === 'submitted') return 'MENUNGGU_VALIDASI_USULAN'
    if (proposal.status === 'revision') return 'PERLU_REVISI_USULAN'
    if (proposal.status === 'approved') {
      if (!claim) return 'USULAN_DISETUJUI'

      if (claim.status === 'draft') return 'DRAFT_KLAIM'
      if (claim.status === 'submitted') return 'MENUNGGU_PENILAIAN_MITRA' // Or DPL Review based on token
      if (claim.status === 'approved') return 'SELESAI'
      if (claim.status === 'rejected') return 'PERLU_REVISI_KLAIM'
    }
  }

  return 'DRAFT_PENGAJUAN'
}

/**
 * Map frontend status to public DB internship status
 */
function mapFrontendStatusToDb(status) {
  switch (status) {
    case 'DRAFT_PENGAJUAN':
      return 'draft'
    case 'MENUNGGU_VERIFIKASI':
      return 'submitted'
    case 'PERLU_PERBAIKAN_PENGAJUAN':
      return 'revision'
    case 'PENGAJUAN_DITOLAK':
      return 'rejected'
    case 'MAGANG_TERVERIFIKASI':
    default:
      return 'approved'
  }
}

/**
 * Fetch dynamic statistics from Supabase for Admin & Kaprodi Dashboard
 */
export async function fetchStatsFromSupabase() {
  if (!isSupabaseConfigured) return null

  try {
    const { data: apps } = await supabase.from('internship_applications').select('status')
    const { data: claims } = await supabase.from('conversion_claims').select('status')
    const { data: profiles } = await supabase.from('profiles').select('role')

    const totalMagang = apps?.length || 0
    const totalMitra = profiles?.filter(p => p.role === 'mitra')?.length || 0
    const totalDPL = profiles?.filter(p => p.role === 'dpl')?.length || 0

    const stats = {
      totalMagang,
      totalMitra,
      totalDPL,
      waitingVerification: apps?.filter(a => a.status === 'submitted')?.length || 0,
      needRevision: apps?.filter(a => a.status === 'revision')?.length || 0,
      verified: apps?.filter(a => a.status === 'approved')?.length || 0,
      claimsCount: claims?.length || 0,
    }

    return stats
  } catch (e) {
    console.error('Error fetching statistics from Supabase:', e)
    return null
  }
}

/**
 * Fetch and construct standard internship object tree from Supabase
 */
export async function fetchInternshipFromSupabase(routeId) {
  if (!isSupabaseConfigured) return null

  try {
    const currentUserId = await getStudentId()
    if (!currentUserId) return null

    // Determine target application ID
    let appId = routeId
    if (routeId === 'baru' || !routeId) {
      // Find latest application for current student
      const { data: latest } = await supabase
        .from('internship_applications')
        .select('id')
        .eq('student_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (latest && latest.length > 0) {
        appId = latest[0].id
      } else {
        return null // No saved application
      }
    }

    // 1. Load application
    const { data: app, error: appError } = await supabase
      .from('internship_applications')
      .select('*')
      .eq('id', appId)
      .single()

    if (appError || !app) return null

    // Load student profile
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', app.student_id)
      .single()

    // Load DPL details
    let dplName = ''
    if (app.assigned_dpl_id) {
      const { data: dplProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', app.assigned_dpl_id)
        .single()
      dplName = dplProfile?.full_name || ''
    }

    // 2. Load Proposal
    const { data: proposal } = await supabase
      .from('conversion_proposals')
      .select('*')
      .eq('internship_application_id', app.id)
      .single()

    let proposalData = { activities: [], generalNote: '', revisionNote: '', createdAt: '', updatedAt: '' }
    let courses = []

    if (proposal) {
      proposalData.id = proposal.id
      proposalData.generalNote = proposal.dpl_notes || ''
      proposalData.createdAt = proposal.created_at
      proposalData.updatedAt = proposal.updated_at
      proposalData.submittedAt = proposal.submitted_at
      proposalData.approvedAt = proposal.approved_at

      // Load Courses
      const { data: dbCourses } = await supabase
        .from('conversion_courses')
        .select('*')
        .eq('proposal_id', proposal.id)

      courses = dbCourses || []

      if (courses.length > 0) {
        // Load Activities
        const courseIds = courses.map(c => c.id)
        const { data: dbActivities } = await supabase
          .from('conversion_activities')
          .select('*')
          .in('course_id', courseIds)

        const activities = dbActivities || []

        // Map activities back to UI objects
        // We group activities by description/estimated hours
        const grouped = {}
        activities.forEach(act => {
          const key = `${act.description}_${act.hours}`
          const course = courses.find(c => c.id === act.course_id)
          if (!grouped[key]) {
            grouped[key] = {
              id: act.id,
              description: act.description,
              estimatedHours: act.hours,
              selectedCourseCodes: course ? [course.course_code] : []
            }
          } else {
            if (course && !grouped[key].selectedCourseCodes.includes(course.course_code)) {
              grouped[key].selectedCourseCodes.push(course.course_code)
            }
          }
        })

        proposalData.activities = Object.values(grouped)
      }
    }

    // 3. Load Claim
    let claimData = { activities: [], generalNote: '', revisionNote: '', createdAt: '', updatedAt: '' }
    let claim = null

    if (proposal) {
      const { data: dbClaim } = await supabase
        .from('conversion_claims')
        .select('*')
        .eq('proposal_id', proposal.id)
        .single()
      
      claim = dbClaim

      if (claim) {
        claimData.id = claim.id
        claimData.createdAt = claim.created_at
        claimData.updatedAt = claim.updated_at
        claimData.submittedAt = claim.submitted_at

        // Load Claim Documents
        const { data: docs } = await supabase
          .from('claim_documents')
          .select('*')
          .eq('claim_id', claim.id)

        // Map claim activities based on proposal activities
        // In Supabase, proposal and claim activities are linked
        claimData.activities = proposalData.activities.map(pa => {
          const fileDoc = docs?.find(d => d.document_type === `evidence_${pa.id}`)
          return {
            id: `CLM-${pa.id}`,
            proposalActivityId: pa.id,
            proposalDescription: pa.description,
            estimatedHours: pa.estimatedHours,
            actualDescription: pa.description,
            actualHours: pa.estimatedHours,
            achievement: '100% Selesai',
            differenceExplanation: '',
            selectedCourseCodes: [...pa.selectedCourseCodes],
            evidence: fileDoc ? { name: 'Dokumen Bukti.pdf', dataUrl: fileDoc.file_url } : null
          }
        })
      }
    }

    // 4. Load Reviews/Grades
    let partnerAssessment = { reviewerName: '', reviewerPosition: '', scores: [], generalComment: '' }
    let dplReview = { reviewerName: '', scores: [], generalComment: '', decision: '' }

    if (claim) {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('claim_id', claim.id)

      if (reviews) {
        const pr = reviews.find(r => r.reviewer_role === 'mitra')
        const dr = reviews.find(r => r.reviewer_role === 'dpl')

        if (pr) {
          partnerAssessment = {
            reviewerName: pr.comments ? 'Mitra Supervisor' : '',
            scores: [
              { label: 'Disiplin', score: pr.discipline_score || 0 },
              { label: 'Kerjasama', score: pr.teamwork_score || 0 },
              { label: 'Komunikasi', score: pr.communication_score || 0 },
              { label: 'Inisiatif', score: pr.initiative_score || 0 },
              { label: 'Teknis', score: pr.technical_score || 0 }
            ],
            generalComment: pr.comments || '',
            submittedAt: pr.submitted_at
          }
        }

        if (dr) {
          dplReview = {
            reviewerName: 'Ade Putranto, M.Kom.',
            scores: [
              { label: 'Laporan', score: dr.report_score || 0 },
              { label: 'Presentasi', score: dr.presentation_score || 0 }
            ],
            generalComment: dr.comments || '',
            decision: dr.status === 'submitted' ? 'approve' : '',
            submittedAt: dr.submitted_at
          }
        }
      }
    }

    const mappedStatus = mapDbStatusToFrontend(app, proposal, claim)

    return {
      id: app.id,
      bimaId: app.application_code || '',
      status: mappedStatus,
      studentName: studentProfile?.full_name || 'Nadia Putri Ramadhani',
      studentId: studentProfile?.nim || '22.11.4321',
      studyProgram: studentProfile?.study_program || 'Informatika',
      semester: '7',
      studentEmail: studentProfile?.email || 'mahasiswa.demo@students.amikom.ac.id',
      partnerName: app.partner_name,
      position: app.position,
      startDate: app.start_date,
      endDate: app.end_date,
      partnerSupervisor: app.supervisor_name,
      dplName,
      description: app.admin_notes || '',
      proposal: proposalData,
      claim: claimData,
      partnerAssessment,
      dplReview,
      gradeSettings: { partnerWeight: 70, dplWeight: 30 } // Default formula is 70% / 30%
    }
  } catch (err) {
    console.error('Error loading data from Supabase:', err)
    return null
  }
}

/**
 * Save and Sync standard internship object tree to Supabase
 */
export async function saveInternshipToSupabase(internship) {
  if (!isSupabaseConfigured) return { success: true, id: internship.id || 'MAG-2026-001' }

  try {
    const currentUserId = await getStudentId()
    if (!currentUserId) return { success: false, error: 'Sesi user tidak ditemukan.' }

    // Map DB status
    const dbStatus = mapFrontendStatusToDb(internship.status)

    // Find default DPL if needed
    let dplId = null
    const { data: dpls } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'dpl')
      .limit(1)

    if (dpls && dpls.length > 0) {
      dplId = dpls[0].id
    }

    const appData = {
      student_id: currentUserId,
      scheme: 'mitra',
      partner_name: internship.partnerName || 'Unknown Partner',
      position: internship.position || 'Developer',
      start_date: internship.startDate || new Date().toISOString().split('T')[0],
      end_date: internship.endDate || new Date().toISOString().split('T')[0],
      supervisor_name: internship.partnerSupervisor || 'Mitra Supervisor',
      status: dbStatus,
      admin_notes: internship.description || '',
      application_code: internship.bimaId || `APP-${Date.now()}`,
      updated_at: new Date().toISOString()
    }

    let appId = internship.id
    if (!appId) {
      // Create new application
      const { data: newApp, error: newAppErr } = await supabase
        .from('internship_applications')
        .insert({
          ...appData,
          proposed_dpl_id: dplId,
          assigned_dpl_id: dplId
        })
        .select()
        .single()

      if (newAppErr) throw newAppErr
      appId = newApp.id
      internship.id = appId
    } else {
      // Update existing application
      const { error: updateErr } = await supabase
        .from('internship_applications')
        .update(appData)
        .eq('id', appId)

      if (updateErr) throw updateErr
    }

    // 2. Proposal Sync
    const isProposalActive = [
      'DRAFT_USULAN', 'MENUNGGU_VALIDASI_USULAN', 'PERLU_REVISI_USULAN', 'USULAN_DISETUJUI',
      'DRAFT_KLAIM', 'MENUNGGU_PENILAIAN_MITRA', 'MENUNGGU_REVIEW_DPL', 'PERLU_REVISI_KLAIM',
      'SIAP_FINALISASI', 'SELESAI'
    ].includes(internship.status)

    if (isProposalActive && internship.proposal) {
      let propStatus = 'draft'
      if (['MENUNGGU_VALIDASI_USULAN'].includes(internship.status)) propStatus = 'submitted'
      if (['PERLU_REVISI_USULAN'].includes(internship.status)) propStatus = 'revision'
      if (['USULAN_DISETUJUI', 'DRAFT_KLAIM', 'MENUNGGU_PENILAIAN_MITRA', 'MENUNGGU_REVIEW_DPL', 'SIAP_FINALISASI', 'SELESAI'].includes(internship.status)) propStatus = 'approved'

      const proposalData = {
        internship_application_id: appId,
        student_id: currentUserId,
        status: propStatus,
        total_hours: internship.proposal.activities.reduce((sum, a) => sum + parseInt(a.estimatedHours || 0), 0),
        updated_at: new Date().toISOString()
      }

      let propId = internship.proposal.id
      if (!propId) {
        const { data: newProp, error: newPropErr } = await supabase
          .from('conversion_proposals')
          .insert(proposalData)
          .select()
          .single()

        if (newPropErr) throw newPropErr
        propId = newProp.id
        internship.proposal.id = propId
      } else {
        const { error: updatePropErr } = await supabase
          .from('conversion_proposals')
          .update(proposalData)
          .eq('id', propId)

        if (updatePropErr) throw updatePropErr
      }

      // Upsert Courses and Activities
      if (internship.proposal.activities && internship.proposal.activities.length > 0) {
        // Collect all selected course codes
        const courseCodes = new Set()
        internship.proposal.activities.forEach(a => {
          a.selectedCourseCodes?.forEach(code => courseCodes.add(code))
        })

        // Upsert conversion_courses
        for (const code of courseCodes) {
          const master = CONVERSION_MASTER.find(m => m.courseCode === code)
          if (master) {
            const courseData = {
              proposal_id: propId,
              course_code: code,
              course_name: master.courseName,
              credits: master.credits,
              minimum_hours: master.credits * 45
            }

            // Find if course already exists for this proposal
            const { data: existingCourse } = await supabase
              .from('conversion_courses')
              .select('id')
              .eq('proposal_id', propId)
              .eq('course_code', code)
              .limit(1)

            let courseId = existingCourse?.[0]?.id

            if (!courseId) {
              const { data: newCourse } = await supabase
                .from('conversion_courses')
                .insert(courseData)
                .select()
                .single()
              courseId = newCourse?.id
            }

            // Upsert activities pointing to this course
            const matchingActivities = internship.proposal.activities.filter(a => a.selectedCourseCodes?.includes(code))
            for (const act of matchingActivities) {
              const actData = {
                course_id: courseId,
                activity: act.description,
                hours: parseInt(act.estimatedHours || 0),
                description: act.description
              }

              // Check if activity already exists
              const { data: existingAct } = await supabase
                .from('conversion_activities')
                .select('id')
                .eq('course_id', courseId)
                .eq('activity', act.description)
                .limit(1)

              if (!existingAct || existingAct.length === 0) {
                await supabase.from('conversion_activities').insert(actData)
              }
            }
          }
        }
      }
    }

    // 3. Claims Sync
    const isClaimActive = [
      'DRAFT_KLAIM', 'MENUNGGU_PENILAIAN_MITRA', 'MENUNGGU_REVIEW_DPL', 'PERLU_REVISI_KLAIM',
      'SIAP_FINALISASI', 'SELESAI'
    ].includes(internship.status)

    if (isClaimActive && internship.claim) {
      let claimStatus = 'draft'
      if (['MENUNGGU_PENILAIAN_MITRA', 'MENUNGGU_REVIEW_DPL'].includes(internship.status)) claimStatus = 'submitted'
      if (['SELESAI'].includes(internship.status)) claimStatus = 'approved'

      const claimData = {
        proposal_id: internship.proposal.id,
        student_id: currentUserId,
        status: claimStatus,
        updated_at: new Date().toISOString()
      }

      let claimId = internship.claim.id
      if (!claimId) {
        const { data: newClaim, error: newClaimErr } = await supabase
          .from('conversion_claims')
          .insert(claimData)
          .select()
          .single()

        if (newClaimErr) throw newClaimErr
        claimId = newClaim.id
        internship.claim.id = claimId
      } else {
        await supabase
          .from('conversion_claims')
          .update(claimData)
          .eq('id', claimId)
      }

      // Upsert claim documents if present
      if (internship.claim.activities) {
        for (const act of internship.claim.activities) {
          if (act.evidence && act.evidence.dataUrl) {
            const docData = {
              claim_id: claimId,
              document_type: `evidence_${act.proposalActivityId}`,
              file_url: act.evidence.dataUrl
            }

            const { data: existingDoc } = await supabase
              .from('claim_documents')
              .select('id')
              .eq('claim_id', claimId)
              .eq('document_type', docData.document_type)
              .limit(1)

            if (!existingDoc || existingDoc.length === 0) {
              await supabase.from('claim_documents').insert(docData)
            }
          }
        }
      }
    }

    return { success: true, id: appId }
  } catch (err) {
    console.error('Error syncing to Supabase:', err)
    return { success: false, error: err.message || String(err) }
  }
}

/**
 * Invoke the Supabase Edge Function to send review email to DPL / Mitra
 */
export async function sendReviewEmail({ type, recipientEmail, recipientName, studentName, reviewUrl, subject, html }) {
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY

  // If VITE_RESEND_API_KEY is configured in .env, send real emails directly via Resend API
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'MAGISTA Portal <onboarding@resend.dev>',
          to: [recipientEmail],
          subject: subject || `[MAGISTA] Tautan Akses Review/Penilaian Magang - ${studentName || 'Mahasiswa'}`,
          html: html || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #0F172A; font-size: 20px; margin-bottom: 8px;">Permintaan Review / Penilaian Magang</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Halo <strong>${recipientName || 'Bpk/Ibu Penilai'}</strong>,
              </p>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Mahasiswa <strong>${studentName || 'Mahasiswa'}</strong> telah mengajukan berkas magang di platform MAGISTA. Mohon dapat melakukan peninjauan/penilaian melalui tautan khusus di bawah ini:
              </p>

              <div style="margin: 28px 0; text-align: center;">
                <a href="${reviewUrl}" style="background-color: #7C3AED; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                  Buka Form Review / Penilaian
                </a>
              </div>

              <p style="color: #94A3B8; font-size: 12px; line-height: 1.5;">
                Tautan langsung: <br />
                <a href="${reviewUrl}" style="color: #7C3AED;">${reviewUrl}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 24px 0;" />
              <p style="color: #94A3B8; font-size: 11px; text-align: center;">
                Pesan ini dikirimkan secara otomatis oleh Sistem Integrasi Konversi Magang MAGISTA.
              </p>
            </div>
          `
        })
      })

      if (response.ok) {
        console.log(`[RESEND EMAIL SUCCESS] Email sungguhan berhasil dikirim ke: ${recipientEmail}`)
        return { success: true, realEmailSent: true }
      } else {
        const errJson = await response.json()
        console.error('[RESEND EMAIL FAILED]', errJson)
      }
    } catch (err) {
      console.error('[RESEND FETCH ERROR]', err)
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('send-review-email', {
        body: { type, recipientEmail, recipientName, studentName, reviewUrl }
      })
      
      if (!error && data) return data
    } catch (err) {
      console.error('Failed to invoke send-review-email:', err.message)
    }
  }

  console.log(`[LOCAL PREVIEW EMAIL] Ke: ${recipientEmail} | Link: ${reviewUrl}`)
  return { success: true, previewMode: true }
}

export async function fetchAllInternshipsFromSupabase() {
  if (!isSupabaseConfigured) return []

  try {
    const { data: apps, error } = await supabase
      .from('internship_applications')
      .select('*, profiles:student_id(*)')
      .order('created_at', { ascending: false })

    if (error || !apps) return []

    return apps.map((app) => ({
      id: app.id,
      bimaId: app.application_code || '',
      status: mapDbStatusToFrontend(app, null, null),
      studentName: app.profiles?.full_name || 'Mahasiswa',
      studentId: app.profiles?.nim || '',
      studyProgram: app.profiles?.study_program || 'Informatika',
      semester: '7',
      studentEmail: app.profiles?.email || '',
      partnerName: app.partner_name,
      position: app.position,
      startDate: app.start_date,
      endDate: app.end_date,
      partnerSupervisor: app.supervisor_name,
      description: app.admin_notes || '',
      createdAt: app.created_at,
      updatedAt: app.updated_at,
    }))
  } catch (err) {
    console.error('Error fetching all internships from Supabase:', err)
    return []
  }
}

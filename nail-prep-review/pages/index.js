import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import styles from '../styles/Submit.module.css'

const ISSUES = ['Cuticle work', 'Lifting issues', 'Drill problems', 'Filing', 'Speed']
const EXP = ['Under 1 yr', '1–2 yrs', '3–5 yrs', '5+ yrs']

export default function Home() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', exp: '', issues: [], notes: '' })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleIssue = (val) => {
    setForm(f => ({
      ...f,
      issues: f.issues.includes(val) ? f.issues.filter(i => i !== val) : [...f.issues, val]
    }))
  }

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    const oneHour = 60 * 60 * 1024 * 1024
    if (f.size > oneHour) { setError('Video must be under 1 hour / ~3.6GB'); return }
    setError('')
    setFile(f)
  }

  const goStep2 = () => {
    if (!form.firstName.trim() || !form.email.trim()) { setError('Please enter your name and email.'); return }
    setError(''); setStep(2)
  }

  const goStep3 = () => {
    if (!file) { setError('Please upload your prep video.'); return }
    setError(''); setStep(3)
  }

  const submit = async () => {
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}-${form.firstName.toLowerCase().replace(/\s/g,'-')}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('videos')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(path)

      const { error: dbErr } = await supabase.from('submissions').insert({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        experience: form.exp,
        issues: form.issues,
        notes: form.notes,
        video_path: path,
        video_url: publicUrl,
        status: 'pending',
      })

      if (dbErr) throw dbErr

      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${form.firstName} ${form.lastName}`, email: form.email, issues: form.issues })
      })

      setDone(true)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      console.error(e)
    } finally {
      setUploading(false)
    }
  }

  if (done) return <SuccessScreen name={form.firstName} />

  return (
    <div className={styles.page}>
      <div className={styles.wordmark}>
        <div className={styles.rule} />
        <span className={styles.wordmarkText}>Nail Prep Review</span>
        <div className={styles.rule} />
      </div>

      <div className={styles.hero}>
        <h1 className={styles.h1}>Submit your prep.<br /><em>Get expert eyes on it.</em></h1>
        <div className={styles.goldBar} />
        <p className={styles.heroSub}>Upload a video of your nail prep and receive timestamped feedback on exactly where to level up — plus a full written review.</p>
      </div>

      <StepNav step={step} />

      {error && <div className={styles.errorBanner}>{error}</div>}

      {step === 1 && (
        <div>
          <div className={`${styles.card} ${styles.cardGold}`}>
            <div className={styles.secLabel}>Your details</div>
            <div className={styles.twoCol}>
              <Field label="First name"><input placeholder="e.g. Jordan" value={form.firstName} onChange={e => set('firstName', e.target.value)} /></Field>
              <Field label="Last name"><input placeholder="e.g. Williams" value={form.lastName} onChange={e => set('lastName', e.target.value)} /></Field>
            </div>
            <Field label="Email address"><input type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} /></Field>
          </div>

          <div className={styles.card}>
            <div className={styles.secLabel}>Years of experience</div>
            <div className={styles.expGrid}>
              {EXP.map(e => (
                <button key={e} className={`${styles.chip} ${form.exp === e ? styles.chipOn : ''}`} onClick={() => set('exp', e)}>{e}</button>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.secLabel}>What are you currently struggling with?</div>
            <div className={styles.pills}>
              {ISSUES.map(i => (
                <button key={i} className={`${styles.pill} ${form.issues.includes(i) ? styles.pillOn : ''}`} onClick={() => toggleIssue(i)}>{i}</button>
              ))}
            </div>
            <Field label="Tell me more about what's going on" style={{ marginTop: '1rem' }}>
              <textarea rows={3} placeholder="Describe what's happening, what you've tried, or anything specific you want me to look for…" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </Field>
          </div>

          <button className={styles.btnPrimary} onClick={goStep2}>Continue to upload</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className={styles.angleGuide}>
            <div className={styles.angleTitle}>How to film your video</div>
            <div className={styles.angleLayout}>
              <AngleDiagram />
              <div className={styles.anglePoints}>
                {[
                  'Position your phone directly above the nail, pointing straight down',
                  'Keep the full nail plate in frame — both edges visible',
                  'Good lighting matters — natural light or a ring light works best',
                  'Film the complete prep sequence from start to finish on one nail',
                ].map((p, i) => (
                  <div key={i} className={styles.anglePoint}><div className={styles.angleDot} />{p}</div>
                ))}
              </div>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardGold}`}>
            <div className={styles.secLabel}>Your prep video</div>
            {!file ? (
              <div className={styles.uploadZone} onClick={() => fileRef.current.click()}>
                <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFile} />
                <div className={styles.uploadIconWrap}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className={styles.uploadTitle}>Drop your video here</div>
                <div className={styles.uploadSub}>or click to browse</div>
                <div className={styles.uploadBadge}>Max 1 hour · MP4, MOV, AVI</div>
              </div>
            ) : (
              <div className={styles.fileRow}>
                <div className={styles.fileIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                  </svg>
                </div>
                <div className={styles.fileMeta}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>{(file.size / 1048576).toFixed(1)} MB</div>
                </div>
                <button className={styles.rmBtn} onClick={() => setFile(null)}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className={styles.btnRow}>
            <button className={styles.btnGhost} onClick={() => setStep(1)}>Back</button>
            <button className={styles.btnPrimary} style={{ flex: 1 }} onClick={goStep3}>Review & submit</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className={`${styles.card} ${styles.cardGold}`}>
            <div className={styles.secLabel}>Confirm your submission</div>
            <div className={styles.confirmBlock}>
              {[
                ['Name', `${form.firstName} ${form.lastName}`.trim()],
                ['Email', form.email],
                ['Experience', form.exp || '—'],
                ['Struggling with', form.issues.length ? form.issues.join(', ') : '—'],
                ['Notes', form.notes || '—'],
                ['Video', file?.name || '—'],
              ].map(([k, v]) => (
                <div key={k} className={styles.confirmRow}>
                  <span className={styles.confirmKey}>{k}</span>
                  <span className={styles.confirmVal}>{v}</span>
                </div>
              ))}
            </div>
            <p className={styles.confirmNote}>You'll receive timestamped notes and a full written review within <strong style={{ color: 'var(--gold)' }}>2–3 business days</strong>.</p>
          </div>

          <div className={styles.btnRow}>
            <button className={styles.btnGhost} onClick={() => setStep(2)}>Back</button>
            <button className={styles.btnPrimary} style={{ flex: 1 }} onClick={submit} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Submit for review'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.trustRow}>
        <span className={styles.trustItem}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Private & secure
        </span>
        <div className={styles.trustDot} />
        <span className={styles.trustItem}>Prep-focused review</span>
        <div className={styles.trustDot} />
        <span className={styles.trustItem}>2–3 day turnaround</span>
      </div>
    </div>
  )
}

function StepNav({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem' }}>
      {['About you', 'Upload', 'Submit'].map((label, i) => {
        const n = i + 1
        const active = step === n
        const done = step > n
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 500,
                background: active ? 'var(--gold)' : done ? 'var(--gold-light)' : 'white',
                color: active ? 'white' : done ? 'var(--gold)' : 'var(--subtle)',
                border: active ? '0.5px solid var(--gold)' : done ? '0.5px solid var(--gold-border)' : '0.5px solid var(--border)',
                transition: 'all 0.25s'
              }}>{n}</div>
              <div style={{ fontSize: 10, letterSpacing: '0.07em', color: active ? 'var(--gold)' : 'var(--subtle)', textTransform: 'uppercase' }}>{label}</div>
            </div>
            {i < 2 && <div style={{ width: 52, height: 0.5, background: done ? 'var(--gold-rule)' : 'var(--border)', opacity: done ? 0.5 : 1, marginBottom: 20 }} />}
          </div>
        )
      })}
    </div>
  )
}

function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: '1.2rem', ...style }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--mid)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function AngleDiagram() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect x="28" y="54" width="32" height="20" rx="4" fill="#F5EDD6" stroke="#C9A84C" strokeWidth="0.75"/>
      <rect x="34" y="58" width="20" height="12" rx="2" fill="#B8952A" opacity="0.25"/>
      <line x1="44" y1="54" x2="44" y2="14" stroke="#C9A84C" strokeWidth="0.75" strokeDasharray="3 2"/>
      <rect x="34" y="6" width="20" height="14" rx="3" fill="#1A1A1A"/>
      <rect x="37" y="9" width="14" height="8" rx="1.5" fill="#2e2e2e"/>
      <circle cx="44" cy="13" r="2.5" fill="#B8952A" opacity="0.7"/>
      <text x="44" y="36" textAnchor="middle" fontSize="8" fill="#9A9A9A" fontFamily="DM Sans,sans-serif">top-down</text>
    </svg>
  )
}

function SuccessScreen({ name }) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ background: 'white', border: '0.5px solid var(--border)', borderRadius: 14, padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--gold-light)', border: '0.5px solid var(--gold-border)', margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 400, marginBottom: '0.5rem' }}>You're all set{name ? `, ${name}` : ''}.</h2>
        <div style={{ width: 32, height: 1, background: 'var(--gold)', margin: '0.75rem auto 1rem' }} />
        <p style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.75, maxWidth: 320, margin: '0 auto' }}>Your prep video is in. Expect detailed timestamped notes and a written review in your inbox within 2–3 business days.</p>
      </div>
    </div>
  )
}

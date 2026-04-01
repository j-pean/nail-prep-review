import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import styles from '../../styles/Review.module.css'

export default function ReviewDashboard() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)
  const [submissions, setSubmissions] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = () => {
    if (pw === process.env.NEXT_PUBLIC_REVIEW_PASSWORD) {
      setAuthed(true)
      setPwError(false)
    } else {
      setPwError(true)
    }
  }

  useEffect(() => {
    if (!authed) return
    supabase.from('submissions').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setSubmissions(data || [])
      setLoading(false)
    })
  }, [authed])

  if (!authed) return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <div className={styles.wordmark}>
          <div className={styles.rule} /><span className={styles.wordmarkText}>Review Dashboard</span><div className={styles.rule} />
        </div>
        <p className={styles.loginSub}>Enter your password to access submissions.</p>
        <input
          type="password" placeholder="Password" className={styles.pwInput}
          value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkAuth()}
        />
        {pwError && <div className={styles.pwError}>Incorrect password</div>}
        <button className={styles.btnPrimary} onClick={checkAuth}>Enter</button>
      </div>
    </div>
  )

  return (
    <div className={styles.dash}>
      <div className={styles.sidebar}>
        <div className={styles.sideHeader}>
          <div className={styles.sideTitle}>Submissions</div>
          <div className={styles.sideCount}>{submissions.length}</div>
        </div>
        {loading ? <div className={styles.sideLoading}>Loading…</div> : submissions.map(s => (
          <div
            key={s.id}
            className={`${styles.subCard} ${selected?.id === s.id ? styles.subCardActive : ''}`}
            onClick={() => setSelected(s)}
          >
            <div className={styles.subName}>{s.first_name} {s.last_name}</div>
            <div className={styles.subMeta}>{s.experience} · {new Date(s.created_at).toLocaleDateString()}</div>
            <div className={styles.subIssues}>{s.issues?.join(', ')}</div>
            <div className={`${styles.subStatus} ${s.status === 'reviewed' ? styles.statusDone : styles.statusPending}`}>
              {s.status === 'reviewed' ? 'Reviewed' : 'Pending'}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.main}>
        {selected
          ? <ReviewPane submission={selected} onSaved={(updated) => {
              setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s))
              setSelected(updated)
            }} />
          : <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              </div>
              <div className={styles.emptyText}>Select a submission to review</div>
            </div>
        }
      </div>
    </div>
  )
}

function ReviewPane({ submission: s, onSaved }) {
  const videoRef = useRef()
  const [timestamps, setTimestamps] = useState(s.timestamps || [])
  const [tsNote, setTsNote] = useState('')
  const [tsCategory, setTsCategory] = useState('Cuticle work')
  const [overall, setOverall] = useState(s.overall_feedback || '')
  const [rating, setRating] = useState(s.rating || 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const CATS = ['Cuticle work', 'Lifting issues', 'Drill problems', 'Filing', 'Speed', 'General']

  const currentTime = () => {
    const v = videoRef.current
    if (!v) return '0:00'
    const t = Math.floor(v.currentTime)
    const m = Math.floor(t / 60)
    const sec = String(t % 60).padStart(2, '0')
    return `${m}:${sec}`
  }

  const addTimestamp = () => {
    if (!tsNote.trim()) return
    const t = { time: currentTime(), category: tsCategory, note: tsNote.trim(), id: Date.now() }
    setTimestamps(prev => [...prev, t].sort((a, b) => {
      const toSecs = str => { const [m, s] = str.split(':').map(Number); return m * 60 + s }
      return toSecs(a.time) - toSecs(b.time)
    }))
    setTsNote('')
  }

  const removeTs = (id) => setTimestamps(prev => prev.filter(t => t.id !== id))

  const jumpTo = (timeStr) => {
    if (!videoRef.current) return
    const [m, s] = timeStr.split(':').map(Number)
    videoRef.current.currentTime = m * 60 + s
    videoRef.current.play()
  }

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: s.id,
          timestamps,
          overallFeedback: overall,
          rating,
          techEmail: s.email,
          techName: s.first_name,
        })
      })
      setSaved(true)
      onSaved({ ...s, timestamps, overall_feedback: overall, rating, status: 'reviewed' })
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.reviewPane}>
      <div className={styles.reviewHeader}>
        <div>
          <div className={styles.reviewName}>{s.first_name} {s.last_name}</div>
          <div className={styles.reviewMeta}>{s.email} · {s.experience} · Submitted {new Date(s.created_at).toLocaleDateString()}</div>
        </div>
        <button className={styles.sendBtn} onClick={save} disabled={saving}>
          {saved ? 'Sent!' : saving ? 'Sending…' : 'Send feedback'}
        </button>
      </div>

      {s.issues?.length > 0 && (
        <div className={styles.issueRow}>
          {s.issues.map(i => <span key={i} className={styles.issuePill}>{i}</span>)}
        </div>
      )}

      {s.notes && <div className={styles.notesBlock}><span className={styles.notesLabel}>Their notes: </span>{s.notes}</div>}

      <div className={styles.videoWrap}>
        <video ref={videoRef} className={styles.video} controls src={s.video_url} />
      </div>

      <div className={styles.tsSection}>
        <div className={styles.tsSectionLabel}>Timestamped notes</div>

        {timestamps.length > 0 && (
          <div className={styles.tsList}>
            {timestamps.map(t => (
              <div key={t.id} className={styles.tsItem}>
                <button className={styles.tsTime} onClick={() => jumpTo(t.time)}>{t.time}</button>
                <div className={styles.tsBody}>
                  <div className={styles.tsCat}>{t.category}</div>
                  <div className={styles.tsNote}>{t.note}</div>
                </div>
                <button className={styles.tsRemove} onClick={() => removeTs(t.id)}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.tsInput}>
          <select className={styles.tsCatSelect} value={tsCategory} onChange={e => setTsCategory(e.target.value)}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
          <textarea
            className={styles.tsTextarea}
            placeholder="Add a note at current video timestamp…"
            value={tsNote}
            onChange={e => setTsNote(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addTimestamp() } }}
            rows={2}
          />
          <button className={styles.tsAddBtn} onClick={addTimestamp}>
            + Add at {currentTime()}
          </button>
        </div>
      </div>

      <div className={styles.overallSection}>
        <div className={styles.tsSectionLabel}>Overall feedback</div>
        <div className={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} className={`${styles.ratingBtn} ${rating >= n ? styles.ratingOn : ''}`} onClick={() => setRating(n)}>{n}</button>
          ))}
          <span className={styles.ratingLabel}>Prep quality score</span>
        </div>
        <textarea
          className={styles.overallTextarea}
          placeholder="Write your overall assessment here — strengths, key areas to improve, and next steps for this tech…"
          value={overall}
          onChange={e => setOverall(e.target.value)}
          rows={6}
        />
      </div>
    </div>
  )
}

// ============================================================
//  JOURNAL TAB — Full Journal Management
//  Entry Editor · Date Groups · Mood · Tags · Search
// ============================================================

import { useState, useMemo, useEffect } from 'react'

// ===== SVG ICONS (JournalTab only) =====
const IconPlus = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconX = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconChevronDown = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const IconChevronUp = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const IconTrash = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconSave = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
)

const IconCalendar = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconTag = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)

const IconMood = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
)

// ============================================================
//  JOURNAL TAB COMPONENT
// ============================================================

export default function JournalTab({
  user,
  journalEntries = [],
  loadingStates = { journal: false },
  onFetchJournal,
  onNavigate,
  showToast,
  addToTrash,
  supabase
}) {
  // ===== Local State =====
  const [journalEntry, setJournalEntry] = useState('')
  const [journalMood, setJournalMood] = useState('')
  const [journalTags, setJournalTags] = useState('')
  const [journalDateFilter, setJournalDateFilter] = useState('')
  const [journalTagFilter, setJournalTagFilter] = useState('')
  const [journalSaving, setJournalSaving] = useState(false)
  const [expandedEntries, setExpandedEntries] = useState({})
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])

  // ============================================================
  //  HELPERS
  // ============================================================

  const formatEntryDate = (date) => {
    const now = new Date()
    const entry = new Date(date)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const entryDay = new Date(entry.getFullYear(), entry.getMonth(), entry.getDate())

    if (entryDay.getTime() === today.getTime()) return 'Today'
    if (entryDay.getTime() === yesterday.getTime()) return 'Yesterday'

    const diffDays = Math.floor((today - entryDay) / (1000 * 60 * 60 * 24))
    if (diffDays <= 7) return 'This Week'
    return 'Earlier'
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  // ============================================================
  //  CRUD FUNCTIONS
  // ============================================================

  async function saveJournal() {
    if (!journalEntry.trim() || !user) {
      showToast('Please write something', 'error')
      return
    }
    setJournalSaving(true)

    const { error } = await supabase.from('journal').insert({
      user_id: user.id,
      content: journalEntry.trim(),
      date: new Date().toISOString().split('T')[0],
      mood: journalMood.trim(),
      tags: journalTags.trim()
    })

    if (error) {
      showToast('Error saving journal: ' + error.message, 'error')
    } else {
      setJournalEntry('')
      setJournalMood('')
      setJournalTags('')
      showToast('Journal entry saved!', 'success')
      onFetchJournal()
    }
    setJournalSaving(false)
  }

  async function deleteJournalEntry(id) {
    const entry = journalEntries.find(e => e.id === id)
    const { error } = await supabase
      .from('journal')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      if (entry) addToTrash('journal', entry)
      showToast('Entry moved to trash', 'success')
      onFetchJournal()
    }
  }

  // ============================================================
  //  MEMOIZED FILTERS
  // ============================================================

  const filteredEntries = useMemo(() => {
    let entries = journalEntries

    if (journalDateFilter) {
      entries = entries.filter(e => e.date === journalDateFilter)
    }

    if (journalTagFilter) {
      entries = entries.filter(e => {
        const tags = (e.tags || '').split(',').map(t => t.trim())
        return tags.includes(journalTagFilter)
      })
    }

    return entries
  }, [journalEntries, journalDateFilter, journalTagFilter])

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups = {}
    filteredEntries.forEach((entry) => {
      const group = formatEntryDate(entry.created_at)
      if (!groups[group]) groups[group] = []
      groups[group].push(entry)
    })
    return groups
  }, [filteredEntries])

  // Get unique tags for filter dropdown
  const allTags = useMemo(() => {
    const tagSet = new Set()
    journalEntries.forEach((e) => {
      if (e.tags) {
        e.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => tagSet.add(t))
      }
    })
    return Array.from(tagSet)
  }, [journalEntries])

  // ============================================================
  //  RENDER
  // ============================================================

  return (
    <div>
      <div className="section-title">Journal</div>
      <div className="section-subtitle">Reflect on your progress and track your growth over time.</div>

      {/* ===== FILTERS ===== */}
      <div
        className="glass"
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--glass-border)'
        }}
      >
        <span className="tiny-label">Date</span>
        <input
          type="date"
          value={journalDateFilter}
          onChange={(e) => {
            setJournalDateFilter(e.target.value)
          }}
          className="input"
          style={{ width: '160px', padding: '6px 12px', fontSize: '12px' }}
        />
        {journalDateFilter && (
          <button
            onClick={() => {
              setJournalDateFilter('')
            }}
            className="btn btn-sm btn-danger"
            style={{ gap: '4px' }}
          >
            <IconX size={14} /> Clear
          </button>
        )}

        <span className="tiny-label" style={{ marginLeft: '8px' }}>
          <IconTag size={14} style={{ marginRight: '4px' }} /> Tag
        </span>
        <select
          value={journalTagFilter}
          onChange={(e) => setJournalTagFilter(e.target.value)}
          className="select"
          style={{ width: '140px', padding: '6px 12px', fontSize: '12px' }}
        >
          <option value="">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        {journalTagFilter && (
          <button
            onClick={() => setJournalTagFilter('')}
            className="btn btn-sm btn-danger"
            style={{ gap: '4px' }}
          >
            <IconX size={14} /> Clear
          </button>
        )}
      </div>

      {/* ===== ENTRY EDITOR ===== */}
      <div
        className="glass"
        style={{
          marginBottom: '20px',
          padding: '16px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--glass-border)'
        }}
      >
        <textarea
          value={journalEntry}
          onChange={(e) => setJournalEntry(e.target.value)}
          placeholder="What's on your mind today?"
          className="textarea"
          style={{
            width: '100%',
            minHeight: '160px',
            padding: '16px',
            fontSize: '16px',
            lineHeight: 1.8,
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            outline: 'none',
            resize: 'vertical'
          }}
        />
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '10px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <div style={{ flex: 1, minWidth: '120px' }}>
            <span className="tiny-label" style={{ display: 'block', marginBottom: '2px' }}>
              <IconMood size={14} style={{ marginRight: '4px' }} /> Mood
            </span>
            <input
              value={journalMood}
              onChange={(e) => setJournalMood(e.target.value)}
              placeholder="e.g., happy, stressed, calm"
              className="input"
              style={{ padding: '6px 12px', fontSize: '12px', width: '100%' }}
            />
          </div>
          <div style={{ flex: 2, minWidth: '180px' }}>
            <span className="tiny-label" style={{ display: 'block', marginBottom: '2px' }}>
              <IconTag size={14} style={{ marginRight: '4px' }} /> Tags (comma separated)
            </span>
            <input
              value={journalTags}
              onChange={(e) => setJournalTags(e.target.value)}
              placeholder="e.g., work, personal, ideas"
              className="input"
              style={{ padding: '6px 12px', fontSize: '12px', width: '100%' }}
            />
          </div>
          <button
            onClick={saveJournal}
            disabled={journalSaving}
            className="btn btn-primary"
            style={{ alignSelf: 'flex-end', marginTop: '8px', minWidth: '100px', gap: '6px' }}
          >
            <IconSave /> {journalSaving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      {/* ===== JOURNAL ENTRIES ===== */}
      {loadingStates.journal ? (
        <div className="card" style={{ padding: '16px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ marginBottom: i < 3 ? '16px' : '0' }}>
              <div className="skeleton skeleton-title" style={{ width: '40%', height: '18px', marginBottom: '4px' }} />
              <div className="skeleton skeleton-text" style={{ width: '70%', height: '14px' }} />
              <div className="skeleton skeleton-text" style={{ width: '50%', height: '12px' }} />
            </div>
          ))}
        </div>
      ) : filteredEntries.length > 0 ? (
        (() => {
          const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier']

          return groupOrder.map((group) => {
            if (!groupedEntries[group] || groupedEntries[group].length === 0) return null
            return (
              <div key={group} style={{ marginBottom: '16px' }}>
                <div
                  className="tiny-label"
                  style={{
                    marginBottom: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  {group}
                </div>
                {groupedEntries[group].map((entry, index) => {
                  const isExpanded = expandedEntries[entry.id] || false
                  const previewLength = 120

                  return (
                    <div
                      key={entry.id}
                      className="card"
                      style={{
                        padding: '16px',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        animation: `slideUp 0.5s var(--spring) both`,
                        animationDelay: `${index * 30}ms`
                      }}
                      onClick={() =>
                        setExpandedEntries((prev) => ({
                          ...prev,
                          [entry.id]: !prev[entry.id]
                        }))
                      }
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="caption" style={{ fontSize: '12px' }}>
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                          {entry.mood && (
                            <span
                              className="chip chip-tag"
                              style={{
                                height: '24px',
                                fontSize: '10px',
                                padding: '0 10px',
                                background: 'rgba(79, 140, 255, 0.08)',
                                color: 'var(--brand-blue)'
                              }}
                            >
                              <IconMood size={12} style={{ marginRight: '4px' }} />
                              {entry.mood}
                            </span>
                          )}
                          {entry.tags &&
                            entry.tags
                              .split(',')
                              .map((t) => t.trim())
                              .filter(Boolean)
                              .map((tag) => (
                                <span
                                  key={tag}
                                  className="chip chip-tag"
                                  style={{ height: '24px', fontSize: '10px', padding: '0 10px' }}
                                >
                                  <IconTag size={12} style={{ marginRight: '4px' }} />
                                  {tag}
                                </span>
                              ))}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Delete this entry?')) deleteJournalEntry(entry.id)
                          }}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>

                      <div
                        style={{
                          fontSize: '15px',
                          lineHeight: 1.8,
                          color: 'var(--text-primary)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxWidth: '70ch'
                        }}
                      >
                        {isExpanded
                          ? entry.content
                          : entry.content.length > previewLength
                          ? entry.content.slice(0, previewLength) + '...'
                          : entry.content}
                      </div>

                      {entry.content.length > previewLength && (
                        <div style={{ marginTop: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedEntries((prev) => ({
                                ...prev,
                                [entry.id]: !prev[entry.id]
                              }))
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{
                              padding: '2px 12px',
                              fontSize: '12px',
                              height: '28px',
                              borderRadius: '999px'
                            }}
                          >
                            {isExpanded ? <IconChevronUp /> : <IconChevronDown />}
                            {isExpanded ? ' Show less' : ' Read more'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })
        })()
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px', opacity: 0.5 }}>📖</div>
          <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-secondary)' }}>
            No journal entries yet.
          </p>
          <p style={{ fontSize: '14px', marginTop: '4px', color: 'var(--text-tertiary)' }}>
            Write your first entry above to start tracking your journey.
          </p>
          <button
            onClick={() => {
              document.querySelector('textarea')?.focus()
            }}
            className="btn btn-primary"
            style={{ marginTop: '16px', gap: '6px' }}
          >
            <IconPlus /> Write First Entry
          </button>
        </div>
      )}
    </div>
  )
}

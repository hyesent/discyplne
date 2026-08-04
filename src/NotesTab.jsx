// ============================================================
//  NOTES TAB — Full Notes Management
//  Search · Categories · Grid · Add/Edit/Delete · Bulk Actions
// ============================================================

import { useState, useMemo, useRef } from 'react'

// ===== SVG ICONS (NotesTab only) =====
const IconSearch = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

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

const IconCheck = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconTrash = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconBack = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const IconSave = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
)

const IconMic = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const IconMicOff = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 10v2a5 5 0 0 1-4.46 4.96" />
    <path d="M12 19v4" />
    <path d="M8 23h8" />
    <path d="M12 12a3 3 0 0 1-3-3" />
  </svg>
)

const IconImage = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const IconCopy = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const IconShare = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const IconTranslate = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

// ============================================================
//  NOTES TAB COMPONENT
// ============================================================

export default function NotesTab({
  user,
  notes = [],
  loadingStates = { notes: false },
  onFetchNotes,
  onNavigate,
  showToast,
  addToTrash,
  supabase
}) {
  // ===== Local State =====
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedNotes, setSelectedNotes] = useState([])
  const [selectionMode, setSelectionMode] = useState(false)
  const [viewMode, setViewMode] = useState('home') // 'home' | 'add' | 'edit'
  const [editingNote, setEditingNote] = useState(null)
  
  // ===== Note Form State =====
  const [title, setTitle] = useState('')
  const [noteText, setNoteText] = useState('')
  const [category, setCategory] = useState('')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState('16')
  const [titleFont, setTitleFont] = useState('Inter')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // ===== Voice Recognition =====
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)

  // ===== Memoized =====
  const allCategories = useMemo(
    () => ['All', ...new Set(notes.map((n) => n.category || 'Uncategorized'))],
    [notes]
  )

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        activeCategory === 'All' || (note.category || 'Uncategorized') === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [notes, searchQuery, activeCategory])

  // ============================================================
  //  HELPERS
  // ============================================================

  const getWordCount = (text) => {
    if (!text) return 0
    return text.trim().split(/\s+/).length
  }

  const getReadingTime = (text) => {
    const words = getWordCount(text)
    if (words < 1) return 0
    return Math.max(1, Math.round(words / 200))
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  const formatNoteTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // ============================================================
  //  CRUD FUNCTIONS
  // ============================================================

  async function saveNote() {
    if (!title.trim() || !noteText.trim()) {
      showToast('Title and note required', 'error')
      return
    }
    setIsSaving(true)
    setSaveStatus('Saving...')

    const noteData = {
      title: title.trim(),
      content: noteText.trim(),
      font_family: fontFamily,
      title_font: titleFont,
      font_size: parseInt(fontSize),
      category: category.trim() || 'Uncategorized',
      user_id: user.id,
      date: selectedDate
    }

    if (editingNote) {
      const { error } = await supabase
        .from('notes')
        .update(noteData)
        .eq('id', editingNote.id)
        .eq('user_id', user.id)

      if (error) {
        showToast('Error: ' + error.message, 'error')
        setIsSaving(false)
        setSaveStatus('')
      } else {
        setSaveStatus('Saved')
        setTimeout(() => setSaveStatus(''), 1500)
        showToast('Note updated!', 'success')
        setEditingNote(null)
        setTitle('')
        setNoteText('')
        setCategory('')
        await onFetchNotes()
        setViewMode('home')
        setIsSaving(false)
      }
    } else {
      const { error } = await supabase.from('notes').insert([noteData])

      if (error) {
        showToast('Error: ' + error.message, 'error')
        setIsSaving(false)
        setSaveStatus('')
      } else {
        setSaveStatus('Saved')
        setTimeout(() => setSaveStatus(''), 1500)
        showToast('Note saved!', 'success')
        setTitle('')
        setNoteText('')
        setCategory('')
        await onFetchNotes()
        setViewMode('home')
        setIsSaving(false)
      }
    }
  }

  function openAddNote() {
    setEditingNote(null)
    setTitle('')
    setNoteText('')
    setCategory('')
    setViewMode('add')
    setSaveStatus('')
  }

  function openEditNote(note) {
    setEditingNote(note)
    setTitle(note.title)
    setNoteText(note.content)
    setFontFamily(note.font_family || 'Inter')
    setTitleFont(note.title_font || 'Inter')
    setFontSize(note.font_size?.toString() || '16')
    setCategory(note.category || '')
    setViewMode('edit')
    setSaveStatus('')
  }

  async function deleteNote(id) {
    const note = notes.find(n => n.id === id)
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) {
      showToast('Delete failed: ' + error.message, 'error')
    } else {
      if (note) addToTrash('notes', note)
      showToast('Note moved to trash', 'success', () => {})
      await onFetchNotes()
      setViewMode('home')
    }
  }

  async function deleteMultipleNotes() {
    const notesToDelete = notes.filter(n => selectedNotes.includes(n.id))
    const { error } = await supabase
      .from('notes')
      .delete()
      .in('id', selectedNotes)
      .eq('user_id', user.id)

    if (error) {
      showToast('Delete failed: ' + error.message, 'error')
    } else {
      notesToDelete.forEach(n => addToTrash('notes', n))
      showToast(`${selectedNotes.length} note(s) moved to trash`, 'success')
      setSelectedNotes([])
      setSelectionMode(false)
      await onFetchNotes()
      setViewMode('home')
    }
  }

  function toggleSelect(id) {
    setSelectedNotes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function exportSelectedNotes() {
    const notesToExport = notes.filter((n) => selectedNotes.includes(n.id))
    if (notesToExport.length === 0) {
      showToast('Select notes to export', 'error')
      return
    }
    
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text(`Discypln Notes - ${selectedDate}`, 20, 20)
      let yPos = 40
      notesToExport.forEach((note, idx) => {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        doc.setFontSize(14)
        doc.text(`${idx + 1}. ${note.title}`, 20, yPos)
        doc.setFontSize(11)
        const splitText = doc.splitTextToSize(note.content, 170)
        splitText.forEach((line) => {
          if (yPos > 270) {
            doc.addPage()
            yPos = 20
          }
          doc.text(line, 20, yPos)
          yPos += 6
        })
        doc.text(`Category: ${note.category || 'Uncategorized'}`, 20, yPos)
        yPos += 12
      })
      doc.save(`discypln-notes-${selectedDate}.pdf`)
      showToast(`${selectedNotes.length} note(s) exported!`, 'success')
      setSelectedNotes([])
      setSelectionMode(false)
    })
  }

  // ============================================================
  //  VOICE RECOGNITION
  // ============================================================

  const toggleMic = () => {
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        showToast('Speech Recognition not supported', 'error')
        return
      }
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.continuous = true
      recognition.interimResults = true
      
      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onresult = (event) => {
        let final = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' '
          }
        }
        if (final) {
          setNoteText(prev => prev + ' ' + final)
        }
      }
      recognitionRef.current = recognition
    }
    
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => recognitionRef.current.start())
        .catch(() => showToast('Microphone permission denied', 'error'))
    }
  }

  // ============================================================
  //  RENDER
  // ============================================================

  // ===== EDITOR VIEW =====
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={() => setViewMode('home')} className="btn btn-ghost" style={{ gap: '6px' }}>
            <IconBack /> <span>Back</span>
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={saveNote} disabled={isSaving} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <IconSave /> {isSaving ? 'Saving...' : 'Save'}
            </button>
            {saveStatus && <span className="tiny-label" style={{ color: 'var(--brand-blue)' }}>{saveStatus}</span>}
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          {viewMode === 'add' && (
            <>
              <select
                value={titleFont}
                onChange={(e) => setTitleFont(e.target.value)}
                className="select"
                style={{ marginBottom: '10px' }}
              >
                <option value="Inter">Inter - Clean</option>
                <option value="Georgia">Georgia - Book</option>
                <option value="Poppins">Poppins - Modern</option>
                <option value="Merriweather">Merriweather - Readable</option>
                <option value="'Times New Roman'">Times - Classic</option>
                <option value="Arial">Arial - Simple</option>
                <option value="Pacifico">Pacifico - Cursive</option>
                <option value="Caveat">Caveat - Handwriting</option>
              </select>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="input"
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  fontFamily: titleFont.includes(' ') ? `'${titleFont}', serif` : titleFont,
                  marginBottom: '10px'
                }}
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Add a category"
                className="input"
                style={{ fontSize: '14px', marginBottom: '12px' }}
              />
            </>
          )}
          {viewMode === 'edit' && (
            <>
              <h2 className="card-title" style={{ marginBottom: '12px' }}>{title}</h2>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Add a category"
                className="input"
                style={{ fontSize: '14px', marginBottom: '12px' }}
              />
            </>
          )}
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Start typing..."
            className="textarea"
            style={{
              minHeight: '320px',
              fontFamily: fontFamily.includes(' ') ? `'${fontFamily}', serif` : fontFamily,
              fontSize: fontSize + 'px',
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'vertical',
              lineHeight: '1.7'
            }}
            autoFocus
          />
        </div>

        <nav style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
          <button onClick={toggleMic} className={`btn btn-ghost btn-sm ${isListening ? 'btn-danger' : ''}`} style={{ gap: '6px' }}>
            {isListening ? <IconMicOff /> : <IconMic />}
            {isListening ? ' Stop' : ' Voice'}
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
            <IconImage /> Scan
          </button>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="select"
            style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', minWidth: '100px' }}
          >
            <option value="Inter">Inter</option>
            <option value="Georgia">Georgia</option>
            <option value="'Times New Roman'">Times</option>
            <option value="'Courier New'">Courier</option>
            <option value="Arial">Arial</option>
            <option value="Poppins">Poppins</option>
            <option value="'Roboto Slab'">Roboto Slab</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Lora">Lora</option>
            <option value="Merriweather">Merriweather</option>
            <option value="Ubuntu">Ubuntu</option>
            <option value="Quicksand">Quicksand</option>
            <option value="Caveat">Caveat</option>
            <option value="Pacifico">Pacifico</option>
          </select>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="select"
            style={{ padding: '6px 12px', fontSize: '12px', width: 'auto', minWidth: '70px' }}
          >
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
          </select>
          {viewMode === 'edit' && (
            <>
              <button onClick={() => navigator.clipboard.writeText(noteText)} className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
                <IconCopy /> Copy
              </button>
              <button onClick={() => { if (confirm('Delete this note?')) deleteNote(editingNote.id) }} className="btn btn-danger btn-sm" style={{ gap: '6px' }}>
                <IconTrash /> Delete
              </button>
              <button onClick={() => { if (navigator.share) { navigator.share({ title, text: noteText }) } else { navigator.clipboard.writeText(noteText); showToast('Copied!', 'success') } }} className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
                <IconShare /> Share
              </button>
            </>
          )}
        </nav>

        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} />
      </div>
    )
  }

  // ===== MAIN NOTES VIEW =====
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Notes</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {selectionMode ? (
            <>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedNotes.length} selected</span>
              <button
                onClick={() => {
                  if (selectedNotes.length === filteredNotes.length) {
                    setSelectedNotes([])
                  } else {
                    setSelectedNotes(filteredNotes.map(n => n.id))
                  }
                }}
                className="btn btn-sm btn-ghost"
                style={{ borderRadius: '999px', padding: '6px 16px', fontSize: '12px', height: '32px' }}
              >
                {selectedNotes.length === filteredNotes.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={() => {
                  if (selectedNotes.length === 0) {
                    showToast('Select notes first', 'error')
                    return
                  }
                  if (confirm(`Delete ${selectedNotes.length} selected note(s)?`)) {
                    deleteMultipleNotes()
                  }
                }}
                className="btn btn-danger btn-sm"
                style={{ borderRadius: '999px', padding: '6px 16px', fontSize: '12px', height: '32px', gap: '4px' }}
              >
                <IconTrash /> Delete {selectedNotes.length > 0 && `(${selectedNotes.length})`}
              </button>
              <button
                onClick={() => {
                  if (selectedNotes.length === 0) {
                    showToast('Select notes to export', 'error')
                    return
                  }
                  exportSelectedNotes()
                }}
                className="btn btn-primary btn-sm"
                style={{ borderRadius: '999px', padding: '6px 16px', fontSize: '12px', height: '32px' }}
              >
                Export {selectedNotes.length > 0 && `(${selectedNotes.length})`}
              </button>
              <button
                onClick={() => { setSelectionMode(false); setSelectedNotes([]) }}
                className="btn btn-ghost btn-sm"
                style={{ borderRadius: '999px', padding: '6px 16px', fontSize: '12px', height: '32px' }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setSelectionMode(true); setSelectedNotes([]) }}
                className="btn btn-ghost btn-sm"
                style={{ borderRadius: '999px', padding: '6px 16px', fontSize: '12px', height: '32px' }}
              >
                Select
              </button>
              <button
                onClick={openAddNote}
                className="btn btn-primary"
                style={{ borderRadius: '999px', padding: '6px 20px', fontSize: '12px', height: '32px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <IconPlus /> New
              </button>
            </>
          )}
        </div>
      </div>

      <div className="section-subtitle">Capture, organize and retrieve information quickly.</div>

      {/* Search Bar */}
      <div className="search-wrapper" style={{ position: 'relative', marginBottom: '16px' }}>
        <span className="search-icon" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
          <IconSearch />
        </span>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 16px 10px 44px',
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--brand-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(79, 140, 255, 0.10)' }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none' }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <IconX />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {allCategories.map((cat) => {
          const count = cat === 'All' 
            ? notes.length 
            : notes.filter((n) => (n.category || 'Uncategorized') === cat).length
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                borderRadius: '999px',
                padding: '6px 16px',
                fontSize: '12px',
                height: '32px',
                background: activeCategory === cat ? 'var(--gradient-primary)' : 'transparent',
                color: activeCategory === cat ? 'var(--text-inverse)' : 'var(--text-secondary)',
                borderColor: activeCategory === cat ? 'transparent' : 'var(--glass-border)'
              }}
            >
              {cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Notes Grid */}
      {loadingStates.notes ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card" style={{ padding: '20px', minHeight: '120px' }}>
              <div className="skeleton skeleton-title" style={{ width: '70%', height: '20px', marginBottom: '8px' }} />
              <div className="skeleton skeleton-text" style={{ width: '90%', height: '14px' }} />
              <div className="skeleton skeleton-text" style={{ width: '60%', height: '14px' }} />
            </div>
          ))}
        </div>
      ) : filteredNotes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {filteredNotes.map((note, index) => {
            const isSelected = selectedNotes.includes(note.id)
            return (
              <div
                key={note.id}
                className="card"
                onClick={() => {
                  if (selectionMode) {
                    toggleSelect(note.id)
                  } else {
                    openEditNote(note)
                  }
                }}
                style={{
                  cursor: selectionMode ? 'pointer' : 'pointer',
                  padding: '20px',
                  transition: 'all 0.2s ease',
                  border: selectionMode && isSelected 
                    ? '2px solid var(--brand-blue)' 
                    : selectionMode 
                      ? '2px solid var(--glass-border)' 
                      : '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-xl)',
                  background: selectionMode && isSelected 
                    ? 'rgba(79, 140, 255, 0.06)' 
                    : 'var(--glass-bg)',
                  transform: selectionMode && isSelected ? 'scale(0.98)' : 'scale(1)',
                  position: 'relative',
                  animation: `slideUp 0.5s var(--spring) both`,
                  animationDelay: `${index * 40}ms`
                }}
                onMouseEnter={(e) => {
                  if (!selectionMode) {
                    e.currentTarget.style.borderColor = 'var(--glass-border-hover)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectionMode) {
                    e.currentTarget.style.borderColor = 'var(--glass-border)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {selectionMode && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: isSelected ? '2px solid var(--brand-blue)' : '2px solid var(--text-muted)',
                    background: isSelected ? 'var(--brand-blue)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 700,
                    transition: 'all 0.2s ease'
                  }}>
                    {isSelected && <IconCheck />}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.3,
                    flex: 1,
                    marginRight: '8px'
                  }}>
                    {note.title || 'Untitled'}
                  </div>
                  <span className="chip chip-tag" style={{ flexShrink: 0, marginTop: '2px', fontSize: '10px', height: '24px', padding: '0 10px' }}>
                    {note.category || 'Uncategorized'}
                  </span>
                </div>

                <div style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.5,
                  marginTop: '8px'
                }}>
                  {note.content || 'No content'}
                </div>

                <div style={{
                  marginTop: '12px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>
                    Updated {formatDate(note.date)}
                    <span style={{ marginLeft: '8px', opacity: 0.5 }}>•</span>
                    <span style={{ marginLeft: '8px' }}>{getWordCount(note.content)} words</span>
                    <span style={{ marginLeft: '8px', opacity: 0.5 }}>•</span>
                    <span style={{ marginLeft: '8px' }}>{getReadingTime(note.content)} min read</span>
                  </span>
                  <span style={{ fontSize: '11px', opacity: 0.6 }}>{formatNoteTime(note.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📭</div>
          <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-secondary)' }}>No notes available.</p>
          <p style={{ fontSize: '14px', marginTop: '4px', color: 'var(--text-tertiary)' }}>Create your first note to start building your knowledge base.</p>
          <button onClick={openAddNote} className="btn btn-primary" style={{ marginTop: '16px', gap: '6px' }}>
            <IconPlus /> New Note
          </button>
        </div>
      )}
    </div>
  )
}

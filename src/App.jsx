import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Tesseract from 'tesseract.js'
import './index.css'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const VOICE_COMMANDS = {
  'comma': ',',
  'full stop': '.',
  'period': '.',
  'question mark': '?',
  'exclamation mark': '!',
  'new line': '\n',
  'new paragraph': '\n\n'
}

export default function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [noteText, setNoteText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)

  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [editingNote, setEditingNote] = useState(null)
  const [viewMode, setViewMode] = useState('list')

  const [task, setTask] = useState('')
  const [tasks, setTasks] = useState([])
  const [taskCategory, setTaskCategory] = useState('daily')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskTime, setTaskTime] = useState('')
  const [taskWeekDay, setTaskWeekDay] = useState('monday')
  const [activeCategory, setActiveCategory] = useState('all')

  const [currentTime, setCurrentTime] = useState(new Date())
  const [stopwatchTime, setStopwatchTime] = useState(0)
  const [stopwatchRunning, setStopwatchRunning] = useState(false)

  const [showExport, setShowExport] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user?? null)
    })
    const { data: { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?? null)
    })}
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchNotes()
      fetchTasks()
    }
  }, [selectedDate, user])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let interval
    if (stopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [stopwatchRunning])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMessage('Speech Recognition not supported. Use Chrome/Brave.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript
        }
      }
      if (!transcript) return

      let processedText = transcript.toLowerCase()
      Object.keys(VOICE_COMMANDS).forEach(cmd => {
        const regex = new RegExp(`\\b${cmd}\\b`, 'gi')
        processedText = processedText.replace(regex, VOICE_COMMANDS[cmd])
      })
      processedText = processedText.replace(/(^\w|\.\s+\w|\n\n\w)/g, (match) => match.toUpperCase())

      setNoteText(prev => prev + (prev? ' : '') + processedText)
      setMessage('')
    }

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error)
      if (event.error!== 'no-speech') {
        setMessage(`Mic error: ${event.error}`)
      }
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
  }, [])

  const toggleMic = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
       .then(() => {
          recognitionRef.current.start()
          setIsListening(true)
          setMessage('🎤 Say comma, full stop, new line for punctuation')
        })
       .catch((err) => {
          console.error(err)
          setMessage('Microphone permission denied. Tap the lock icon in Brave/Chrome > Site settings > Microphone > Allow')
          setIsListening(false)
        })
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsProcessing(true)
    setMessage('Reading image...')
    Tesseract.recognize(file, 'eng', {
      logger: m => console.log(m.status, m.progress)
    }).then(({ data: { text } }) => {
      setNoteText(prev => prev + (prev? '\n\n' : '') + text)
      setMessage('✅ Text extracted!')
      setIsProcessing(false)
      e.target.value = ''
    }).catch(() => {
      setMessage('Failed to read image')
      setIsProcessing(false)
    })
  }

  async function fetchNotes() {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
     .from('notes')
     .select('*')
     .eq('user_id', user.id)
     .eq('date', selectedDate)
     .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('Fetch error:', error)
      setMessage('Failed to load notes')
    } else {
      setNotes(data || [])
    }
  }

  async function fetchTasks() {
    if (!user) return
    const { data, error } = await supabase
     .from('tasks')
     .select('*')
     .eq('user_id', user.id)
     .order('created_at', { ascending: false })
    if (error) {
      console.error('Fetch tasks error:', error)
    } else {
      setTasks(data || [])
    }
  }

  async function signUp() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) setMessage(error.message)
    else setMessage('Check email for confirmation link')
  }

  async function signIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMessage(error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setNotes([])
    setTasks([])
    setTitle('')
    setNoteText('')
    setEditingNote(null)
    setViewMode('list')
  }

  async function saveNote() {
    if (!title.trim() ||!noteText.trim()) {
      setMessage('Title and note required')
      return
    }
    setLoading(true)
    setMessage('')

    if (editingNote) {
      const { error } = await supabase
       .from('notes')
       .update({
          title: title.trim(),
          content: noteText.trim(),
          priority
        })
       .eq('id', editingNote.id)
       .eq('user_id', user.id)

      if (error) setMessage('Error: ' + error.message)
      else {
        setMessage('✅ Note updated!')
        setEditingNote(null)
        setTitle('')
        setNoteText('')
        setPriority('medium')
        setViewMode('list')
        fetchNotes()
      }
    } else {
      const { error } = await supabase
       .from('notes')
       .insert({
          user_id: user.id,
          date: selectedDate,
          title: title.trim(),
          content: noteText.trim(),
          priority
        })

      if (error) setMessage('Error: ' + error.message)
      else {
        setMessage('✅ Note saved!')
        setTitle('')
        setNoteText('')
        setPriority('medium')
        setViewMode('list')
        fetchNotes()
      }
    }
    setLoading(false)
  }

  function openAddNote() {
    setEditingNote(null)
    setTitle('')
    setNoteText('')
    setPriority('')
    setViewMode('add')
  }

  function openEditNote(note) {
    setEditingNote(note)
    setTitle(note.title)
    setNoteText(note.content)
    setPriority(note.priority)
    setViewMode('edit')
  }

  function goBack() {
    setViewMode('list')
    setEditingNote(null)
    setTitle('')
    setNoteText('')
    setPriority('medium')
  }

  async function deleteNote(id) {
    const { error } = await supabase
     .from('notes')
     .delete()
     .eq('id', id)
     .eq('user_id', user.id)
    if (error) {
      setMessage('Delete failed: ' + error.message)
    } else {
      setMessage('🗑️ Note deleted')
      setViewMode('list')
      fetchNotes()
    }
  }

  async function addTask() {
    if (!task.trim() ||!user) return
    let dueDate = selectedDate
    if (taskCategory === 'weekly') {
      const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
      const targetDay = days.indexOf(taskWeekDay)
      const today = new Date()
      const diff = (targetDay - today.getDay() + 7) % 7
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + diff)
      dueDate = nextDate.toISOString().split('T')[0]
    } else if (taskCategory === 'custom') {
      dueDate = taskDueDate || selectedDate
    }
    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      content: task.trim(),
      category: taskCategory,
      weekday: taskCategory === 'weekly'? taskWeekDay : null,
      time: taskCategory === 'daily'? taskTime : null,
      due_date: dueDate,
      done: false
    })
    if (error) {
      setMessage('Error adding task: ' + error.message)
    } else {
      setTask('')
      setTaskTime('')
      setTaskDueDate('')
      setMessage('✅ Task added')
      fetchTasks()
    }
  }

  async function toggleTask(id) {
    const task = tasks.find(t => t.id === id)
    const { error } = await supabase
     .from('tasks')
     .update({ done:!task.done })
     .eq('id', id)
     .eq('user_id', user.id)
    if (!error) fetchTasks()
  }

  async function deleteTask(id) {
    const { error } = await supabase
     .from('tasks')
     .delete()
     .eq('id', id)
     .eq('user_id', user.id)
    if (!error) {
      setMessage('🗑️ Task deleted')
      fetchTasks()
    }
  }

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date) => {
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  const toggleStopwatch = () => {
    setStopwatchRunning(!stopwatchRunning)
  }

  const resetStopwatch = () => {
    setStopwatchRunning(false)
    setStopwatchTime(0)
  }

  const toggleSelect = (id) => {
    setSelectedNotes(prev =>
      prev.includes(id)? prev.filter(x => x!== id) : [...prev, id]
    )
  }

  const exportNotesPDF = () => {
    const notesToExport = showExport? notes.filter(n => selectedNotes.includes(n.id)) : notes
    if (notesToExport.length === 0) {
      setMessage(showExport? 'Select notes to export' : 'No notes to export')
      return
    }
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

      splitText.forEach(line => {
        if (yPos > 270) {
          doc.addPage()
          yPos = 20
        }
        doc.text(line, 20, yPos)
        yPos += 6
      })

      doc.text(`Priority: ${note.priority}`, 20, yPos)
      yPos += 12
    })
    doc.save(`discypln-notes-${selectedDate}.pdf`)
    setMessage('✅ PDF exported!')
    setShowExport(false)
    setSelectedNotes([])
  }

  const exportTasksWord = async () => {
    if (tasks.length === 0) {
      setMessage('No tasks to export')
      return
    }
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Discypln Tasks`, bold: true, size: 32 })]
          }),
         ...tasks.map(t => new Paragraph({
            children: [
              new TextRun({ text: t.done? '✓ ' : '☐ ', bold: true }),
              new TextRun({ text: t.content }),
              new TextRun({ text: ` [${t.category}]`, italics: true, size: 20 })
            ]
          }))
        ]
      }]
    })
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `discypln-tasks.docx`)
    setMessage('✅ Word file exported!')
  }

  const filteredTasks = activeCategory === 'all'
   ? tasks.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
    : tasks.filter(t => t.category === activeCategory)
     .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))

  const completedTasks = tasks.filter(t => t.done).length
  const totalTasks = tasks.length
  const disciplineScore = totalTasks > 0? Math.round((completedTasks / totalTasks) * 100) : 0

  const getWeekDays = () => {
    const today = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push(d.toISOString().split('T')[0])
    }
    return days
  }

  const weekDays = getWeekDays()
  const weeklyCompleted = tasks.filter(t => t.done && weekDays.includes(t.due_date || selectedDate)).length
  const weeklyTotal = tasks.filter(t => weekDays.includes(t.due_date || selectedDate)).length

  const getStreak = () => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayTasks = tasks.filter(t => (t.due_date || selectedDate) === dateStr)

      if (dayTasks.length === 0) continue

      const dayCompleted = dayTasks.filter(t => t.done).length
      if (dayCompleted === dayTasks.length) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  const streak = getStreak()

  if (!user) {
    return (
      <div className="auth-container">
        <h1 className="logo">Discypln</h1>
        <div className="auth-box">
          <h2>Login / Sign Up</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
          <div className="btn-group">
            <button onClick={signIn} disabled={loading} className="btn primary">{loading? 'Loading...' : 'Sign In'}</button>
            <button onClick={signUp} disabled={loading} className="btn">{loading? 'Loading...' : 'Sign Up'}</button>
          </div>
          {message && <p className="message error">{message}</p>}
        </div>
        <footer className="auth-footer">©️ Hyesent.dev</footer>
      </div>
    )
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="editor-page">
        <header className="editor-header">
          <button onClick={goBack}>{'<'}</button>
          <button onClick={saveNote}>Save</button>
        </header>

        <div className="editor-body">
          {viewMode === 'add' &&!priority && (
            <div className="priority-picker">
              <h3>Select Priority</h3>
              <button onClick={() => setPriority('high')}>High</button>
              <button onClick={() => setPriority('medium')}>Medium</button>
              <button onClick={() => setPriority('low')}>Low</button>
            </div>
          )}

          {(viewMode === 'edit' || priority) && (
            <>
              {viewMode === 'add' && (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="title-input"
                />
              )}
              {viewMode === 'edit' && <h3 className="note-title-display">{title}</h3>}

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Start typing..."
                className="content-editor"
                autoFocus
              />
            </>
          )}
        </div>

        <nav className="editor-nav">
          {viewMode === 'add'? (
            <>
              <button onClick={toggleMic}>{isListening? '⏹️' : '🎤'} Voice</button>
              <button onClick={() => fileInputRef.current.click()}>📷 Scan</button>
              <button>Fonts</button>
            </>
          ) : (
            <>
              <button onClick={() => navigator.clipboard.writeText(noteText)}>Copy</button>
              <button onClick={() => deleteNote(editingNote.id)}>Delete</button>
              <button>Share</button>
              <button>Fonts</button>
            </>
          )}
        </nav>

        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
        {message && <p className={`message ${message.includes('✅')? 'success' : 'error'}`} style={{ position: 'fixed', bottom: 80, left: 20, right: 20 }}>{message}</p>}
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header">
        <h1 className="logo">Discypln</h1>
        <button onClick={signOut} className="btn logout">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y1="12"/>
          </svg>
        </button>
      </header>

      <div className="dashboard-grid">
        <div className="card clock-card">
          <div className="clock-time">{currentTime.toLocaleTimeString()}</div>
          <div className="clock-date">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
          <div className="clock-status">{stopwatchRunning? '🟢 Discypln Active' : '🔴 Paused'}</div>
          <div className="stopwatch">
            <h4>Focus Timer</h4>
            <div className="stopwatch-time">{formatTime(stopwatchTime)}</div>
            <div className="stopwatch-buttons">
              <button onClick={toggleStopwatch} className="btn primary">{stopwatchRunning? 'Pause' : 'Start'}</button>
              <button onClick={resetStopwatch} className="btn">Restart</button>
            </div>
          </div>
        </div>

        <div className="card stats-card">
          <h3>Your Progress</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Discipline Score</span>
              <strong className="stat-value">{disciplineScore}%</strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tasks Done</span>
              <strong className="stat-value">{completedTasks}/{totalTasks}</strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">This Week</span>
              <strong className="stat-value">{weeklyCompleted}/{weeklyTotal}</strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">Streak</span>
              <strong className="stat-value">{streak} 🔥</strong>
            </div>
          </div>
          <div className="heatmap">
            {weekDays.map(day => {
              const dayTasks = tasks.filter(t => (t.due_date || selectedDate) === day)
              const active = dayTasks.length > 0 && dayTasks.every(t => t.done)
              return <div key={day} className={`heat-cell ${active? 'active' : ''}`} title={day}></div>
            })}
          </div>
        </div>
      </div>

      <div className="notes-header">
        <span>Notes</span>
        <span>| {notes.length} Notes |</span>
        <button onClick={openAddNote}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y1="12"/>
            <line x1="9" y1="15" x2="15" y1="15"/>
          </svg> Add Notes
        </button>
      </div>

      {loading && <p className="loading">Loading...</p>}
      {notes.length === 0 &&!loading && <p className="empty">No notes for this date</p>}

      {showExport && notes.length > 0 && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <h4>Select Notes to Export</h4>
          {notes.map(note => (
            <label key={note.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedNotes.includes(note.id)} onChange={() => toggleSelect(note.id)} style={{ marginRight: '12px' }} />
              <span>{note.title}</span>
            </label>
          ))}
          <div className="button-row" style={{ marginTop: '12px' }}>
            <button onClick={exportNotesPDF} disabled={selectedNotes.length === 0} className="btn primary">Export {selectedNotes.length} Selected</button>
            <button onClick={() => { setShowExport(false); setSelectedNotes([]) }} className="btn">Cancel</button>
          </div>
        </div>
      )}

      {notes.map(note => (
        <div key={note.id} className="note-summary" onClick={() =>!showExport && openEditNote(note)} style={showExport? { cursor: 'default', opacity: selectedNotes.includes(note.id)? 1 : 0.6 } : {}}>
          {showExport && (
            <input type="checkbox" checked={selectedNotes.includes(note.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(note.id) }} style={{ marginRight: '12px' }} />
          )}
          <div style={{ flex: 1 }}>
            <h4>{note.title}</h4>
            <small>{formatDate(note.date)} • {note.priority} priority</small>
          </div>
        </div>
      ))}

      {notes.length > 0 && (
        <div className="button-row">
          {!showExport && <button onClick={() => setShowExport(true)} className="btn primary">📄 Export Notes PDF</button>}
          {showExport && <button onClick={exportNotesPDF} className="btn primary">Export Selected</button>}
          <button onClick={exportTasksWord} className="btn">📝 Export Tasks Word</button>
        </div>
      )}

      <h3 className="section-title">Task Manager</h3>
      <div className="category-tabs">
        {['all', 'daily', 'weekly', 'custom'].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`btn tab ${activeCategory === cat? 'active' : ''}`}>
            {cat === 'all'? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="task-input">
        <input value={task} onChange={e => setTask(e.target.value)} placeholder="Add task..." className="input" />
        <select value={taskCategory} onChange={e => setTaskCategory(e.target.value)} className="select">
          <option value="daily">Daily - with time</option>
          <option value="weekly">Weekly - pick day</option>
          <option value="custom">Custom - pick date</option>
        </select>
        {taskCategory === 'daily' && (
          <input type="time" value={taskTime} onChange={e => setTaskTime(e.target.value)} className="input time-input" />
        )}
        {taskCategory === 'weekly' && (
          <select value={taskWeekDay} onChange={e => setTaskWeekDay(e.target.value)} className="select">
            <option value="monday">Monday</option>
            <option value="tuesday">Tuesday</option>
            <option value="wednesday">Wednesday</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
            <option value="saturday">Saturday</option>
            <option value="sunday">Sunday</option>
          </select>
        )}
        {taskCategory === 'custom' && (
          <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} className="input" />
        )}
        <button onClick={addTask} className="btn primary">Add Task</button>
      </div>

      {filteredTasks.map(t => (
        <div key={t.id} className={`task-item category-${t.category}`}>
          <label className="checkbox-wrapper">
            <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
            <span className="checkmark"></span>
          </label>
          <div className="task-content">
            <span className={t.done? 'done' : ''}>{t.content}</span>
            <div className="task-meta">
              {t.time && <span className="task-time">🕐 {t.time}</span>}
              {t.weekday && <span className="task-tag">{t.weekday}</span>}
              {t.due_date && taskCategory!== 'daily' && <span className="task-date">{t.due_date}</span>}
            </div>
          </div>
          <button onClick={() => deleteTask(t.id)} className="btn-delete">×</button>
        </div>
      ))}
      {filteredTasks.length === 0 && <p className="empty">No tasks in {activeCategory}</p>}
    </div>
  )
}

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
  comma: ',',
  'full stop': '.',
  period: '.',
  'question mark': '?',
  'exclamation mark': '!',
  'new line': '\n',
  'new paragraph': '\n\n'
}

const ALL_LANGUAGES = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'ny', name: 'Chichewa' },
  { code: 'zh-CN', name: 'Chinese Simplified' },
  { code: 'zh-TW', name: 'Chinese Traditional' },
  { code: 'co', name: 'Corsican' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'tl', name: 'Filipino' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'fy', name: 'Frisian' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'haw', name: 'Hawaiian' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hmn', name: 'Hmong' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'jw', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'my', name: 'Myanmar' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'or', name: 'Odia' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sm', name: 'Samoan' },
  { code: 'gd', name: 'Scots Gaelic' },
  { code: 'sr', name: 'Serbian' },
  { code: 'st', name: 'Sesotho' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ug', name: 'Uyghur' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' }
]

// ============================================================
// HELPERS
// ============================================================

const detectCodeLanguage = (text) => {
  const patterns = [
    { regex: /import\s+.*from\s+['"].*['"]|export\s+(default\s+)?|const\s+.*=\s*\(/, name: 'JavaScript/React' },
    { regex: /def\s+\w+\s*\(.*\):|import\s+\w+|from\s+\w+\s+import/, name: 'Python' },
    { regex: /public\s+class\s+\w+|System\.out\.println|import\s+java\./, name: 'Java' },
    { regex: /#include\s*<.*>|std::|int\s+main\s*\(/, name: 'C++' },
    { regex: /<\?php|\$\w+\s*=|echo\s+/, name: 'PHP' },
    { regex: /SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+.*SET/i, name: 'SQL' },
    { regex: /<html|<div|<body|<head|<!DOCTYPE/, name: 'HTML' },
    { regex: /\{\s*"[\w]+"\s*:|JSON\.parse|JSON\.stringify/, name: 'JSON' },
    { regex: /^\s*[\w-]+\s*:\s*.+$/m, name: 'YAML' }
  ]
  for (const { regex, name } of patterns) {
    if (regex.test(text)) return name
  }
  return null
}

const getNLLBLangCode = (code) => {
  const map = {
    en: 'eng_Latn',
    es: 'spa_Latn',
    fr: 'fra_Latn',
    de: 'deu_Latn',
    it: 'ita_Latn',
    pt: 'por_Latn',
    ru: 'rus_Cyrl',
    'zh-CN': 'zho_Hans',
    'zh-TW': 'zho_Hant',
    ja: 'jpn_Jpan',
    ko: 'kor_Hang',
    ar: 'arb_Arab',
    hi: 'hin_Deva',
    nl: 'nld_Latn',
    pl: 'pol_Latn',
    tr: 'tur_Latn',
    vi: 'vie_Latn',
    th: 'tha_Thai',
    he: 'heb_Hebr',
    sv: 'swe_Latn',
    da: 'dan_Latn',
    fi: 'fin_Latn',
    no: 'nob_Latn',
    cs: 'ces_Latn',
    el: 'ell_Grek',
    hu: 'hun_Latn',
    ro: 'ron_Latn',
    uk: 'ukr_Cyrl',
    id: 'ind_Latn',
    ms: 'zsm_Latn',
    fa: 'pes_Arab',
    bn: 'ben_Beng',
    ta: 'tam_Taml',
    te: 'tel_Telu',
    mr: 'mar_Deva',
    ur: 'urd_Arab',
    sw: 'swh_Latn',
    fil: 'tgl_Latn',
    tl: 'tgl_Latn'
  }
  return map[code] || 'eng_Latn'
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// ============================================================
// APP COMPONENT
// ============================================================

export default function App() {
  // ===== AUTH =====
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // ===== UI =====
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState('notes')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [expandedEntries, setExpandedEntries] = useState({})

  // ===== THREE DOTS MENU =====
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  // ===== NOTES =====
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [noteText, setNoteText] = useState('')
  const [category, setCategory] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [viewMode, setViewMode] = useState('home')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [detectedCode, setDetectedCode] = useState(null)
  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState('16')
  const [titleFont, setTitleFont] = useState('Inter')
  const [showNotesDropdown, setShowNotesDropdown] = useState(false)
  const [activeNoteCategory, setActiveNoteCategory] = useState('All')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  // ===== TASKS =====
  const [tasks, setTasks] = useState([])
  const [task, setTask] = useState('')
  const [taskCategory, setTaskCategory] = useState('daily')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskTime, setTaskTime] = useState('')
  const [taskWeekDay, setTaskWeekDay] = useState('monday')
  const [taskDifficulty, setTaskDifficulty] = useState('medium')
  const [taskMinutes, setTaskMinutes] = useState(30)
  const [taskTag, setTaskTag] = useState('general')
  const [editingTask, setEditingTask] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [subTasks, setSubTasks] = useState({})
  const [newSubTask, setNewSubTask] = useState('')
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [subTasksToAdd, setSubTasksToAdd] = useState([])
  const [taskSaving, setTaskSaving] = useState(false)

  // ===== JOURNAL =====
  const [journalEntries, setJournalEntries] = useState([])
  const [journalEntry, setJournalEntry] = useState('')
  const [journalMood, setJournalMood] = useState('')
  const [journalTags, setJournalTags] = useState('')
  const [journalDateFilter, setJournalDateFilter] = useState('')
  const [journalTagFilter, setJournalTagFilter] = useState('')
  const [journalSaving, setJournalSaving] = useState(false)

  // ===== POMODORO =====
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [pomodoroSessions, setPomodoroSessions] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [pomodoroState, setPomodoroState] = useState('idle') // idle | running | paused | finished
  const [showCelebration, setShowCelebration] = useState(false)

  // ===== VOICE =====
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)

  // ===== EXPORT =====
  const [showExport, setShowExport] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState([])
  const [targetLang, setTargetLang] = useState('fr')

  // ===== TOAST =====
  const [toast, setToast] = useState({ show: false, message: '', type: 'success', undo: null })
  const toastTimeout = useRef(null)

  // ===== THEME =====
  const theme = {
    bg: isDarkMode ? '#0F1115' : '#F8F9FA',
    bgCard: isDarkMode ? '#181C23' : '#FFFFFF',
    bgInput: isDarkMode ? '#14181F' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#1A1D23',
    textSecondary: isDarkMode ? '#B9C0CC' : '#5A6373',
    textMuted: isDarkMode ? '#7C8592' : '#8E96A3',
    border: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    borderHover: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    accent: '#4F8CFF',
    accentLight: isDarkMode ? 'rgba(79,140,255,0.12)' : 'rgba(79,140,255,0.10)',
    shadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.22)' : '0 8px 24px rgba(0,0,0,0.06)'
  }

  // ===== FORMAT HELPERS =====
  const formatMinutes = (mins) => {
    if (!mins || mins === 0) return '0m'
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
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

  const formatNoteTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

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

  const getWordCount = (text) => {
    if (!text) return 0
    return text.trim().split(/\s+/).length
  }

  const getReadingTime = (text) => {
    const words = getWordCount(text)
    if (words < 1) return 0
    return Math.max(1, Math.round(words / 200))
  }

  // ===== STREAK =====
  const getStreak = () => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayHabits = tasks.filter(t => t.type === 'habit' && t.due_date === dateStr)
      if (dayHabits.length === 0) continue
      const allDone = dayHabits.every(t => t.done)
      if (allDone) streak++
      else break
    }
    return streak
  }
  const streak = getStreak()

  const weeklyTasks = tasks.filter(t => t.category === 'weekly')
  const weeklyCompleted = weeklyTasks.filter(t => t.done).length
  const weeklyScore = weeklyTasks.length > 0 ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) : 0

  const getFailedDays = () => {
    const failed = []
    const today = new Date()
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayHabits = tasks.filter(t => t.type === 'habit' && t.due_date === dateStr)
      if (dayHabits.length > 0) {
        const completed = dayHabits.filter(t => t.done).length
        if (completed < dayHabits.length) {
          failed.push({ date: dateStr, completed, total: dayHabits.length })
        }
      }
    }
    return failed
  }
  const failedDays = getFailedDays()

  // ===== TASK RESET =====
  const shouldResetTask = (task) => {
    if (!task.done) return false
    const now = new Date()
    const taskDate = new Date(task.updated_at || task.created_at)
    if (task.type === 'habit') {
      if (task.category === 'daily') {
        return (now - taskDate) / (1000 * 60 * 60) >= 24
      } else if (task.category === 'weekly') {
        return (now - taskDate) / (1000 * 60 * 60 * 24) >= 7
      }
    }
    return false
  }

  // ===== TOAST SYSTEM =====
  const showToast = (message, type = 'success', undo = null) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast({ show: true, message, type, undo })
    toastTimeout.current = setTimeout(() => {
      setToast({ show: false, message: '', type: 'success', undo: null })
    }, 2500)
  }

  // ===== EFFECTS =====
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // ===== CLOSE MENU ON CLICK OUTSIDE =====
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchNotes()
        fetchTasks()
        fetchJournal()
        fetchPomodoroStats()
      }
    })
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchNotes()
        fetchTasks()
        fetchJournal()
        fetchPomodoroStats()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchNotes()
      fetchTasks()
      fetchJournal()
    }
  }, [selectedDate, user])

  useEffect(() => {
    if (noteText) {
      const codeLang = detectCodeLanguage(noteText)
      if (codeLang) {
        setDetectedCode(codeLang)
        setMessage(`Code detected: ${codeLang}`)
        setTimeout(() => setMessage(''), 2000)
      } else {
        setDetectedCode(null)
      }
    }
  }, [noteText])

  // ===== TASK RESET CHECK =====
  useEffect(() => {
    if (!user || tasks.length === 0) return

    const resetTasks = async () => {
      let resetCount = 0
      for (const task of tasks) {
        if (shouldResetTask(task)) {
          const { error } = await supabase
            .from('tasks')
            .update({ done: false, updated_at: new Date().toISOString() })
            .eq('id', task.id)
            .eq('user_id', user.id)
          if (!error) resetCount++
        }
      }
      if (resetCount > 0) {
        showToast(`🔄 ${resetCount} task${resetCount > 1 ? 's' : ''} reset!`, 'success')
        fetchTasks()
      }
    }

    const interval = setInterval(resetTasks, 30000)
    resetTasks()
    return () => clearInterval(interval)
  }, [user, tasks])

  // ===== POMODORO =====
  useEffect(() => {
    let interval
    if (pomodoroRunning) {
      setPomodoroState('running')
      interval = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            handlePomodoroComplete()
            return isBreak ? 25 * 60 : 5 * 60
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setPomodoroState(pomodoroTime === 0 ? 'finished' : 'idle')
    }
    return () => clearInterval(interval)
  }, [pomodoroRunning, isBreak])

  const togglePomodoro = () => {
    if (!pomodoroRunning && pomodoroTime === 0) {
      setPomodoroTime(25 * 60)
      setIsBreak(false)
    }
    setPomodoroRunning(!pomodoroRunning)
    setPomodoroState(!pomodoroRunning ? 'running' : 'paused')
  }

  const resetPomodoro = () => {
    setPomodoroRunning(false)
    setIsBreak(false)
    setPomodoroTime(25 * 60)
    setPomodoroState('idle')
    setShowCelebration(false)
  }

  const handlePomodoroComplete = async () => {
    if (!isBreak) {
      const newSessions = pomodoroSessions + 1
      const newMinutes = totalMinutes + 25
      setPomodoroSessions(newSessions)
      setTotalMinutes(newMinutes)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)

      const today = new Date().toISOString().split('T')[0]
      await supabase.from('pomodoro_sessions').upsert({
        user_id: user.id,
        date: today,
        sessions_completed: newSessions,
        total_minutes: newMinutes
      })
      showToast('🎯 Focus Session Complete! Take a break.', 'success')
    } else {
      showToast('☕ Break over. Ready to focus?', 'success')
    }
    setIsBreak(!isBreak)
    setPomodoroRunning(false)
    setPomodoroState('finished')
  }
  // ========== VOICE RECOGNITION ==========
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMessage('Speech Recognition not supported. Use Chrome/Safari')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    let userStopped = false

    recognition.onstart = () => {
      setIsListening(true)
      setMessage('Listening... Say: comma, full stop, new line')
    }

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim()
        if (event.results[i].isFinal) {
          final += transcript + ' '
        } else {
          interim += transcript + ' '
        }
      }

      const process = (text) => {
        let out = text.toLowerCase()
        Object.keys(VOICE_COMMANDS).forEach(cmd => {
          const regex = new RegExp(`\\b${cmd}\\b`, 'gi')
          out = out.replace(regex, VOICE_COMMANDS[cmd])
        })
        return out
      }

      setNoteText(prev => {
        const base = prev.replace(/\s*\[[^\]]*\]$/, '')
        const processedFinal = process(final)
        const processedInterim = process(interim)
        return base + processedFinal + (processedInterim ? ` [${processedInterim}]` : '')
      })
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setMessage('Microphone denied. Allow mic permission')
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setMessage(`Mic error: ${event.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (!userStopped) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch {}
        }, 200)
      }
    }

    recognitionRef.current = recognition
    return () => {
      userStopped = true
      recognition.stop()
    }
  }, [])

  const toggleMic = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          recognitionRef.current.start()
          setIsListening(true)
          setMessage('Say comma, full stop, new line for punctuation')
        })
        .catch(() => {
          setMessage('Microphone permission denied')
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
      logger: (m) => console.log(m.status, m.progress)
    })
      .then(({ data: { text } }) => {
        setNoteText((prev) => prev + (prev ? '\n\n' : '') + text)
        setMessage('Text extracted!')
        setIsProcessing(false)
        e.target.value = ''
      })
      .catch(() => {
        setMessage('Failed to read image')
        setIsProcessing(false)
      })
  }

  // ========== AUTH FUNCTIONS ==========
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
    setJournalEntries([])
    setTitle('')
    setNoteText('')
    setEditingNote(null)
    setViewMode('home')
  }

  // ========== NOTES FUNCTIONS ==========
  async function fetchNotes() {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('Fetch error:', error)
      setMessage('Failed to load notes')
    } else {
      setNotes(data || [])
    }
  }

  async function saveNote() {
    if (!title.trim() || !noteText.trim()) {
      setMessage('Title and note required')
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
        setMessage('Error: ' + error.message)
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
        await fetchNotes()
        setViewMode('home')
        setIsSaving(false)
      }
    } else {
      const { error } = await supabase.from('notes').insert([noteData])

      if (error) {
        setMessage('Error: ' + error.message)
        setIsSaving(false)
        setSaveStatus('')
      } else {
        setSaveStatus('Saved')
        setTimeout(() => setSaveStatus(''), 1500)
        showToast('Note saved!', 'success')
        setTitle('')
        setNoteText('')
        setCategory('')
        await fetchNotes()
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

  function goBack() {
    setViewMode('home')
    setEditingNote(null)
    setTitle('')
    setNoteText('')
    setCategory('')
    setSaveStatus('')
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
      showToast('Note deleted', 'success', () => {})
      await fetchNotes()
      setViewMode('home')
    }
  }

  async function shareNote() {
    if (!editingNote) return
    const shareText = `${editingNote.title}\n\n${editingNote.content}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: editingNote.title,
          text: shareText
        })
        showToast('Note shared!', 'success')
      } catch (err) {
        if (err.name !== 'AbortError') {
          setMessage('Sharing failed')
        }
      }
    } else {
      navigator.clipboard.writeText(shareText)
      showToast('Copied to clipboard', 'success')
    }
  }

  // ========== TRANSLATION ==========
  async function translateNote() {
    if (!noteText.trim()) {
      setMessage('Note empty. Type something first.')
      return
    }

    setLoading(true)
    setMessage('Translating...')

    const textToTranslate = noteText.trim()
    const langName = ALL_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang

    // 1. Hugging Face NLLB-200
    try {
      const res = await fetch(
        'https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: textToTranslate,
            parameters: {
              src_lang: 'eng_Latn',
              tgt_lang: getNLLBLangCode(targetLang)
            }
          })
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (data[0]?.translation_text) {
          setNoteText(data[0].translation_text)
          showToast(`Translated to ${langName}!`, 'success')
          setLoading(false)
          return
        }
      }
    } catch (e) {
      console.log('HuggingFace failed:', e)
    }

    // 2. LibreTranslate
    try {
      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: textToTranslate,
          source: 'auto',
          target: targetLang,
          format: 'text'
        })
      })
      if (response.ok) {
        const data = await response.json()
        if (data.translatedText) {
          setNoteText(data.translatedText)
          showToast(`Translated to ${langName}!`, 'success')
          setLoading(false)
          return
        }
      }
    } catch {}

    // 3. Google Translate
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`
      const res = await fetch(url)
      const parsed = await res.json()
      const translated = parsed[0].map((item) => item[0]).join('')
      if (translated) {
        setNoteText(translated)
        showToast(`Translated to ${langName}!`, 'success')
        setLoading(false)
        return
      }
    } catch {}

    // 4. MyMemory
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|${targetLang}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        setNoteText(data.responseData.translatedText)
        showToast(`Translated to ${langName}!`, 'success')
      } else {
        setMessage('Translation failed. Try shorter text.')
      }
    } catch (e) {
      setMessage('No internet: ' + e.message)
    }
    setLoading(false)
  }

  // ========== TASKS FUNCTIONS ==========
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
      const subtaskMap = {}
      data?.forEach((t) => {
        subtaskMap[t.id] = t.subtasks || []
      })
      setSubTasks(subtaskMap)
    }
  }

  async function addTask() {
    if (!task.trim() || !user) return
    setTaskSaving(true)

    let dueDate = selectedDate
    let taskType = 'task'

    if (taskCategory === 'daily') {
      taskType = 'habit'
      dueDate = new Date().toISOString().split('T')[0]
    } else if (taskCategory === 'weekly') {
      taskType = 'habit'
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = days.indexOf(taskWeekDay)
      const today = new Date()
      const diff = (targetDay - today.getDay() + 7) % 7
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + diff)
      dueDate = nextDate.toISOString().split('T')[0]
    } else if (taskCategory === 'custom') {
      dueDate = taskDueDate || selectedDate
    }

    const subtasksArray = subTasksToAdd.map((st) => ({
      id: st.id,
      text: st.text,
      done: false
    }))

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      content: task.trim(),
      category: taskCategory,
      type: taskType,
      weekday: taskCategory === 'weekly' ? taskWeekDay : null,
      time: taskCategory === 'daily' ? taskTime : null,
      due_date: dueDate,
      difficulty: taskDifficulty,
      estimated_minutes: taskMinutes,
      category_tag: taskTag,
      done: false,
      subtasks: subtasksArray
    })

    if (error) {
      setMessage('Error adding task: ' + error.message)
    } else {
      setTask('')
      setTaskTime('')
      setTaskDueDate('')
      setTaskMinutes(30)
      setTaskTag('general')
      setSubTasksToAdd([])
      setNewSubTask('')
      showToast('Task added!', 'success')
      fetchTasks()
    }
    setTaskSaving(false)
  }

  async function toggleTask(id) {
    const task = tasks.find((t) => t.id === id)
    const { error } = await supabase
      .from('tasks')
      .update({ done: !task.done, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      if (!task.done) {
        showToast(' Task completed!', 'success')
      }
      fetchTasks()
    }
  }

  async function deleteTask(id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      showToast('Task deleted', 'success', () => {})
      fetchTasks()
    }
  }

  // ========== SUBTASKS FUNCTIONS ==========
  const addSubTask = async (taskId) => {
    if (!newSubTask.trim()) return
    const currentSubtasks = subTasks[taskId] || []
    const updatedSubtasks = [
      ...currentSubtasks,
      { id: Date.now().toString(), text: newSubTask.trim(), done: false }
    ]

    const { error } = await supabase
      .from('tasks')
      .update({ subtasks: updatedSubtasks })
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (!error) {
      setSubTasks((prev) => ({ ...prev, [taskId]: updatedSubtasks }))
      setNewSubTask('')
      showToast('Subtask added', 'success')
    }
  }

  const toggleSubTask = async (taskId, subTaskId) => {
    const currentSubtasks = subTasks[taskId] || []
    const updatedSubtasks = currentSubtasks.map((st) =>
      st.id === subTaskId ? { ...st, done: !st.done } : st
    )

    const { error } = await supabase
      .from('tasks')
      .update({ subtasks: updatedSubtasks })
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (!error) {
      setSubTasks((prev) => ({ ...prev, [taskId]: updatedSubtasks }))
    }
  }

  const deleteSubTask = async (taskId, subTaskId) => {
    const currentSubtasks = subTasks[taskId] || []
    const updatedSubtasks = currentSubtasks.filter((st) => st.id !== subTaskId)

    const { error } = await supabase
      .from('tasks')
      .update({ subtasks: updatedSubtasks })
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (!error) {
      setSubTasks((prev) => ({ ...prev, [taskId]: updatedSubtasks }))
      showToast('Subtask deleted', 'success')
    }
  }

  // ========== JOURNAL FUNCTIONS ==========
  async function fetchJournal() {
    if (!user) return
    let query = supabase
      .from('journal')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (journalDateFilter) {
      query = query.eq('date', journalDateFilter)
    }

    const { data, error } = await query
    if (error) {
      console.error('Fetch journal error:', error)
    } else {
      setJournalEntries(data || [])
    }
  }

  async function saveJournal() {
    if (!journalEntry.trim() || !user) return
    setJournalSaving(true)

    const { error } = await supabase.from('journal').insert({
      user_id: user.id,
      content: journalEntry.trim(),
      date: new Date().toISOString().split('T')[0],
      mood: journalMood.trim(),
      tags: journalTags.trim()
    })

    if (error) {
      setMessage('Error saving journal: ' + error.message)
    } else {
      setJournalEntry('')
      setJournalMood('')
      setJournalTags('')
      showToast('Journal entry saved!', 'success')
      fetchJournal()
    }
    setJournalSaving(false)
  }

  async function deleteJournalEntry(id) {
    const { error } = await supabase
      .from('journal')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      showToast('Entry deleted', 'success')
      fetchJournal()
    }
  }

  // ========== POMODORO STATS ==========
  async function fetchPomodoroStats() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('date', today)
      .eq('user_id', user.id)
    if (data && data[0]) {
      setPomodoroSessions(data[0].sessions_completed || 0)
      setTotalMinutes(data[0].total_minutes || 0)
    }
  }

    // ========== EXPORT FUNCTIONS ==========
  const toggleSelect = (id) => {
    setSelectedNotes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const exportNotesPDF = () => {
    const notesToExport = showExport ? notes.filter((n) => selectedNotes.includes(n.id)) : notes
    if (notesToExport.length === 0) {
      setMessage(showExport ? 'Select notes to export' : 'No notes to export')
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
    showToast('PDF exported!', 'success')
    setShowExport(false)
    setSelectedNotes([])
  }

  const exportTasksWord = async () => {
    if (tasks.length === 0) {
      setMessage('No tasks to export')
      return
    }
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Discypln Tasks', bold: true, size: 32 })]
            }),
            ...tasks.map((t) =>
              new Paragraph({
                children: [
                  new TextRun({ text: t.done ? '✓ ' : '☐ ', bold: true }),
                  new TextRun({ text: t.content }),
                  new TextRun({ text: ` [${t.category}]`, italics: true, size: 20 }),
                  new TextRun({
                    text: t.category_tag && t.category_tag !== 'general' ? ` #${t.category_tag}` : '',
                    italics: true,
                    size: 20
                  })
                ]
              })
            )
          ]
        }
      ]
    })
    const blob = await Packer.toBlob(doc)
    saveAs(blob, 'discypln-tasks.docx')
    showToast('Word file exported!', 'success')
  }

  const exportWeeklyReport = async () => {
    const autoTable = (await import('jspdf-autotable')).default

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const weekStr = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`

    const weekTasks = tasks.filter((t) => {
      if (!t.done) return false
      const taskDate = new Date(t.updated_at || t.due_date)
      return taskDate >= startOfWeek && taskDate <= endOfWeek
    })

    const totalMins = weekTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)

    const categoryStats = {}
    weekTasks.forEach((t) => {
      const cat = t.category_tag || 'Uncategorized'
      if (!categoryStats[cat]) categoryStats[cat] = { count: 0, mins: 0 }
      categoryStats[cat].count += 1
      categoryStats[cat].mins += t.estimated_minutes || 0
    })

    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Discypln Weekly Report - Tasks', 14, 20)
    doc.setFontSize(12)
    doc.text(`Week: ${weekStr}`, 14, 30)
    doc.text(`Tasks Completed: ${weekTasks.length}`, 14, 38)
    doc.text(`Total Focus Time: ${formatMinutes(totalMins)}`, 14, 46)
    doc.text(`Current Streak: ${streak} days`, 14, 54)

    let yPos = 54
    Object.entries(categoryStats).forEach(([cat, stats]) => {
      yPos += 7
      doc.setFontSize(11)
      doc.text(`• ${cat}: ${stats.count} tasks, ${formatMinutes(stats.mins)}`, 14, yPos)
    })

    autoTable(doc, {
      startY: yPos + 10,
      head: [['Date', 'Task', 'Category', 'Time']],
      body: weekTasks.map((t) => [
        new Date(t.updated_at || t.due_date).toLocaleDateString(),
        t.content,
        t.category_tag,
        formatMinutes(t.estimated_minutes)
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    })

    doc.save(`Discypln_Weekly_Tasks_${weekStr.replace(/\//g, '-')}.pdf`)
    showToast('Weekly report generated!', 'success')
  }

  // ========== FILTERS ==========
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
        activeNoteCategory === 'All' || (note.category || 'Uncategorized') === activeNoteCategory
      return matchesSearch && matchesCategory
    })
  }, [notes, searchQuery, activeNoteCategory])

  const filteredTasks = useMemo(() => {
    return activeCategory === 'all'
      ? [...tasks].sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
      : tasks
          .filter((t) => t.category === activeCategory)
          .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
  }, [tasks, activeCategory])

  // ========== RENDER ==========

  if (!user) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <h1 className="page-title text-center" style={{ marginBottom: '8px' }}>
            Discypln
          </h1>
          <p className="text-secondary text-center" style={{ marginBottom: '24px' }}>
            Stay focused. Stay disciplined.
          </p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          <div className="flex gap-3" style={{ marginTop: '8px' }}>
            <button onClick={signIn} disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
              {loading ? 'Loading...' : 'Sign In'}
            </button>
            <button onClick={signUp} disabled={loading} className="btn" style={{ flex: 1 }}>
              {loading ? 'Loading...' : 'Sign Up'}
            </button>
          </div>
          {message && (
            <p className="text-center" style={{ marginTop: '16px', color: '#EF4444', fontSize: '13px' }}>
              {message}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="container" style={{ maxWidth: '900px' }}>
        <header className="app-header">
          <div className="header-left">
            <button
              onClick={goBack}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px 0'
              }}
            >
              ← Back
            </button>
          </div>
          <div className="header-right" style={{ gap: '8px' }}>
            <div className="flex items-center gap-2">
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="select"
                style={{ padding: '8px 12px', fontSize: '12px', width: 'auto', minWidth: '100px' }}
              >
                {ALL_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <button onClick={translateNote} className="btn btn-ghost btn-sm" style={{ fontSize: '16px' }}>
                🌍
              </button>
              <button
                onClick={saveNote}
                disabled={isSaving}
                className="btn btn-primary btn-sm"
                style={{ minWidth: '80px' }}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              {saveStatus && (
                <span className="tiny-label" style={{ color: 'var(--success)' }}>
                  {saveStatus}
                </span>
              )}
            </div>
          </div>
        </header>

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
                <option value="Pacifico">Pacifico - Cursive ✨</option>
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
                  fontFamily: titleFont.includes(' ') ? `'${titleFont}', serif` : titleFont
                }}
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Add a category (e.g., Discypln, Hyezen, Work)"
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
                placeholder="Add a category (e.g., Discypln, Hyezen, Work)"
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
              fontFamily: detectedCode ? "'JetBrains Mono', monospace" : fontFamily.includes(' ') ? `'${fontFamily}', serif` : fontFamily,
              fontSize: fontSize + 'px',
              background: detectedCode ? '#0d1117' : undefined
            }}
            autoFocus
          />
        </div>

        <nav
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={toggleMic}
            className={`btn btn-ghost btn-sm ${isListening ? 'btn-danger' : ''}`}
          >
            {isListening ? ' Stop' : '🎤 Voice'}
          </button>
          <button onClick={() => fileInputRef.current.click()} className="btn btn-ghost btn-sm">
            📷 Scan
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
              <button
                onClick={() => navigator.clipboard.writeText(noteText)}
                className="btn btn-ghost btn-sm"
              >
                Copy
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this note?')) deleteNote(editingNote.id)
                }}
                className="btn btn-danger btn-sm"
              >
                Delete
              </button>
              <button onClick={shareNote} className="btn btn-ghost btn-sm">
                Share
              </button>
            </>
          )}
        </nav>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        {message && (
          <p
            className="text-center"
            style={{
              marginTop: '16px',
              color: message.includes('✅') ? 'var(--success)' : 'var(--danger)',
              fontSize: '13px'
            }}
          >
            {message}
          </p>
        )}
      </div>
    )
  }

  // ===== MAIN DASHBOARD =====
  const greeting = getGreeting()

  return (
    <div className="container" data-theme={isDarkMode ? 'dark' : 'light'}>
    {/* ===== HEADER ===== */}
<header style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '20px',
  paddingBottom: '16px',
  borderBottom: '1px solid var(--border-subtle)'
}}>
  {/* Row 1: Logo + Three Dots */}
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    {/* Logo - Bigger */}
    <div className="logo" style={{
      fontSize: '42px',
      fontWeight: 900,
      letterSpacing: '-1.5px',
      lineHeight: 1,
    }}>
      Discypln
    </div>

    {/* Three Dots Menu */}
    <div style={{ position: 'relative' }} ref={userMenuRef}>
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '8px',
          transition: 'background 0.2s',
          letterSpacing: '2px',
          fontWeight: 700
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        •••
      </button>

      {/* Dropdown Menu */}
      {showUserMenu && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          minWidth: '200px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '8px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          animation: 'fadeIn 0.15s ease'
        }}>
          {/* Email */}
          <div style={{
            padding: '10px 14px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '4px',
            fontWeight: 500
          }}>
            {user?.email || 'user@example.com'}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => {
              setIsDarkMode(!isDarkMode)
              setShowUserMenu(false)
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s',
              fontFamily: 'var(--font-family)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '18px' }}>{isDarkMode ? '🌙' : '☀️'}</span>
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              signOut()
              setShowUserMenu(false)
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--danger)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s',
              fontFamily: 'var(--font-family)',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '4px',
              paddingTop: '10px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-light)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '18px' }}></span>
            Logout
          </button>
        </div>
      )}
    </div>
  </div>

  {/* Row 2: Greeting + Date under logo */}
  <div>
    <div style={{
      fontSize: '15px',
      color: 'var(--text-secondary)',
      marginTop: '2px'
    }}>
      {greeting}
      <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
    <div style={{
      fontSize: '13px',
      color: 'var(--text-muted)'
    }}>
      {currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })}
    </div>
  </div>

  {/* Row 3: Search Bar */}
  <div style={{ marginTop: '8px' }}>
    <div className="search-wrapper">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Search notes, tasks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        style={{
          width: '100%',
          padding: '10px 16px 10px 40px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-input)',
          color: 'var(--text-primary)',
          fontSize: '14px',
          outline: 'none',
          transition: 'all 0.2s'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent)'
          e.target.style.boxShadow = '0 0 0 3px var(--accent-light)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-subtle)'
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>
  </div>
</header>

      {/* ===== CAPSULE NAVIGATION ===== */}
      <nav className="capsule-nav">
        <div className="capsule-nav-inner">
          {[
            { id: 'notes', label: 'Notes' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'journal', label: 'Journal' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'journal') fetchJournal()
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

            {/* ===== POMODORO & STATS DASHBOARD ===== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        {/* Pomodoro Card */}
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div
              style={{
                fontSize: '56px',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--text-primary)',
                letterSpacing: '-1px',
                lineHeight: 1,
                padding: '8px 0'
              }}
            >
              {formatTime(pomodoroTime)}
            </div>
            {/* Simplified ring indicator - shown as a subtle glow around the timer */}
            <div
              style={{
                position: 'absolute',
                inset: '-8px',
                borderRadius: '50%',
                border: '2px solid transparent',
                borderColor: pomodoroRunning ? 'var(--accent)' : pomodoroState === 'paused' ? 'var(--warning)' : 'transparent',
                opacity: pomodoroState === 'running' ? 0.3 : 0.1,
                transition: 'all 0.3s ease'
              }}
            />
          </div>

          <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isBreak ? '☕ Break Time' : 'Focus Session'}
            <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>
              {pomodoroSessions} sessions completed
            </span>
            <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>
              {formatMinutes(totalMinutes)} total
            </span>
          </div>

          <div
            className="progress-bar"
            style={{ marginTop: '16px', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}
          >
            <div
              className="progress-bar-fill"
              style={{
                width: `${((25 * 60 - pomodoroTime) / (25 * 60)) * 100}%`,
                background: pomodoroRunning ? 'var(--accent)' : 'var(--text-muted)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={togglePomodoro}
              className={`btn ${pomodoroRunning ? 'btn-danger' : 'btn-primary'}`}
              style={{ minWidth: '100px' }}
            >
              {pomodoroRunning ? ' Pause' : pomodoroState === 'paused' ? '▶ Resume' : '▶ Start'}
            </button>
            <button onClick={resetPomodoro} className="btn btn-ghost">
              ↺ Reset
            </button>
          </div>

          {showCelebration && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                background: 'var(--success-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--success)',
                fontSize: '14px',
                fontWeight: 600,
                animation: 'fadeIn 0.5s ease'
              }}
            >
              🎯 Focus Session Complete!
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#F59E0B' }}>{streak}</div>
            <div className="caption" style={{ marginTop: '4px' }}>🔥 Streak</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)' }}>
              {formatMinutes(totalMinutes)}
            </div>
            <div className="caption" style={{ marginTop: '4px' }}>Focus Time</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#22C55E' }}>
              {tasks.filter((t) => t.done).length}
            </div>
            <div className="caption" style={{ marginTop: '4px' }}>Tasks Done</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#A855F7' }}>{weeklyScore}%</div>
            <div className="caption" style={{ marginTop: '4px' }}>Weekly Score</div>
          </div>
        </div>
      </div>

      {/* ===== HEATMAP ===== */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div className="card-title" style={{ marginBottom: '0' }}>Heatmap</div>
            <div className="caption" style={{ marginTop: '2px' }}>
              {tasks.filter((t) => t.done).length} tasks done in last 30 days
            </div>
          </div>
        </div>
        <div className="heatmap-grid">
          {Array.from({ length: 30 }).map((_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - (29 - i))
            const dateStr = date.toISOString().split('T')[0]

            const dayTasks = tasks.filter((t) => {
              if (!t.done) return false
              const taskDate = new Date(t.updated_at || t.due_date).toISOString().split('T')[0]
              return taskDate === dateStr
            })

            const minutes = dayTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
            const intensity = minutes === 0 ? 0 : minutes < 30 ? 1 : minutes < 60 ? 2 : minutes < 120 ? 3 : 4
            const colors = ['#1a1a1a', '#0e4429', '#006d32', '#26a641', '#39d353']
            const isToday = dateStr === new Date().toISOString().split('T')[0]

            return (
              <div
                key={dateStr}
                className={`heatmap-cell ${isToday ? 'today' : ''}`}
                title={`${dateStr}: ${dayTasks.length} tasks, ${formatMinutes(minutes)}`}
                style={{
                  background: colors[intensity],
                  borderColor: isToday ? 'var(--accent)' : 'var(--border-subtle)',
                  borderWidth: isToday ? '2px' : '1px'
                }}
              >
                {date.getDate()}
              </div>
            )
          })}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '12px',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}
        >
          <span>Less</span>
          {['#1a1a1a', '#0e4429', '#006d32', '#26a641', '#39d353'].map((color) => (
            <div
              key={color}
              style={{
                width: '16px',
                height: '16px',
                background: color,
                borderRadius: '3px',
                border: '1px solid var(--border-subtle)'
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* ===== FAILED DAYS ===== */}
      {failedDays.length > 0 && (
        <div
          className="card"
          style={{
            borderColor: 'var(--danger)',
            marginBottom: '16px',
            padding: '16px 20px'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}>
            ⚠️ Failed Days This Week
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {failedDays.map((day) => (
              <span key={day.date} className="text-secondary" style={{ fontSize: '13px' }}>
                {formatDate(day.date)}: {day.completed}/{day.total} habits
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ===== CONTENT AREA ===== */}
      <div className="card" style={{ minHeight: '400px', padding: '24px' }}>
        {/* ===== NOTES TAB ===== */}
        {activeTab === 'notes' && (
  <div>
    {/* Heading row with "+" button */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '4px'
    }}>
      <div className="section-title" style={{ marginBottom: 0 }}>Notes</div>
      <button
        onClick={openAddNote}
        className="btn btn-primary"
        style={{
          borderRadius: '999px',
          padding: '8px 20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span> New Note
      </button>
    </div>

    <div className="section-subtitle">Capture, organize and retrieve information quickly.</div>

    {/* Category Tabs  */}
    
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {allCategories.map((cat) => (
              {allCategories.map((cat) => {
  const count = cat === 'All' 
    ? notes.length 
    : notes.filter((n) => (n.category || 'Uncategorized') === cat).length;
  return (
    <button
      key={cat}
      onClick={() => setActiveNoteCategory(cat)}
      className={`btn btn-sm ${activeNoteCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
      style={{
        borderRadius: '999px',
        padding: '6px 16px',
        fontSize: '12px',
        height: '32px',
        background: activeNoteCategory === cat ? 'var(--accent)' : 'transparent',
        color: activeNoteCategory === cat ? 'var(--text-inverse)' : 'var(--text-secondary)',
        borderColor: activeNoteCategory === cat ? 'var(--accent)' : 'var(--border-subtle)'
      }}
    >
      {cat} ({count})
    </button>
  );
})}
            </div>

            {/* Notes Grid */}
            {filteredNotes.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="card"
                    onClick={() => openEditNote(note)}
                    style={{
                      cursor: 'pointer',
                      padding: '20px',
                      transition: 'all 0.2s ease',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '20px',
                      background: 'var(--bg-card)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-hover)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div
                        style={{
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
                        }}
                      >
                        {note.title || 'Untitled'}
                      </div>
                      <span
                        className="chip chip-tag"
                        style={{
                          flexShrink: 0,
                          marginTop: '2px',
                          fontSize: '10px',
                          height: '24px',
                          padding: '0 10px'
                        }}
                      >
                        {note.category || 'Uncategorized'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.5,
                        marginTop: '8px'
                      }}
                    >
                      {note.content || 'No content'}
                    </div>

                    <div
                      style={{
                        marginTop: '12px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
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
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-secondary)' }}>
                  No notes available.
                </p>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>
                  Create your first note to start building your knowledge base.
                </p>
                <button onClick={openAddNote} className="btn btn-primary" style={{ marginTop: '16px' }}>
                  + New Note
                </button>
              </div>
            )}

            {/* Export Section */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowExport(!showExport)}
                  className={`btn btn-sm ${showExport ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {showExport ? 'Hide Export' : '📄 Export Notes'}
                </button>
              </div>

              {showExport && notes.length > 0 && (
                <div
                  className="card"
                  style={{ marginTop: '12px', padding: '16px', background: 'var(--bg-secondary)' }}
                >
                  <div className="caption" style={{ marginBottom: '10px' }}>
                    Select Notes to Export as PDF
                  </div>
                  {notes.map((note) => (
                    <label
                      key={note.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '4px 0',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedNotes.includes(note.id)}
                        onChange={() => toggleSelect(note.id)}
                        className="custom-checkbox"
                        style={{ width: '18px', height: '18px' }}
                      />
                      {note.title || 'Untitled'}
                    </label>
                  ))}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button
                      onClick={exportNotesPDF}
                      disabled={selectedNotes.length === 0}
                      className="btn btn-primary btn-sm"
                    >
                      Export {selectedNotes.length} Selected
                    </button>
                    <button
                      onClick={() => {
                        setShowExport(false)
                        setSelectedNotes([])
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== TASKS TAB ===== */}
        {activeTab === 'tasks' && (
          <div>
            <div className="section-title">Tasks</div>
            <div className="section-subtitle">Organize your day efficiently.</div>

            {/* Task Category Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['all', 'daily', 'weekly', 'custom'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    borderRadius: '999px',
                    padding: '6px 16px',
                    fontSize: '12px',
                    height: '32px',
                    background: activeCategory === cat ? 'var(--accent)' : 'transparent',
                    color: activeCategory === cat ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    borderColor: activeCategory === cat ? 'var(--accent)' : 'var(--border-subtle)'
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

                        {/* Task Input */}
            <div
              className="card"
              style={{
                padding: '20px',
                marginBottom: '16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Add a task..."
                className="input"
                style={{ marginBottom: '12px' }}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="select"
                  style={{ flex: 1, minWidth: '120px' }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">One-time</option>
                </select>

                {taskCategory === 'daily' && (
                  <input
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="input"
                    style={{ width: '140px' }}
                  />
                )}

                {taskCategory === 'weekly' && (
                  <select
                    value={taskWeekDay}
                    onChange={(e) => setTaskWeekDay(e.target.value)}
                    className="select"
                    style={{ width: '140px' }}
                  >
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
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="input"
                    style={{ width: '160px' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="tiny-label" style={{ minWidth: '60px' }}>Difficulty</span>
                  <select
                    value={taskDifficulty}
                    onChange={(e) => setTaskDifficulty(e.target.value)}
                    className="select"
                    style={{ width: '140px' }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>

                  <span className="tiny-label" style={{ minWidth: '50px' }}>Mins</span>
                  <input
                    type="number"
                    value={taskMinutes}
                    onChange={(e) => setTaskMinutes(Number(e.target.value))}
                    placeholder="30"
                    className="input"
                    style={{ width: '80px' }}
                  />

                  <span className="tiny-label" style={{ minWidth: '30px' }}>Tag</span>
                  <select
                    value={taskTag}
                    onChange={(e) => setTaskTag(e.target.value)}
                    className="select"
                    style={{ width: '140px' }}
                  >
                    <option value="general">General</option>
                    <option value="school">School</option>
                    <option value="work">Work</option>
                    <option value="health">Health</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    value={newSubTask}
                    onChange={(e) => setNewSubTask(e.target.value)}
                    placeholder="Add a subtask"
                    className="input"
                    style={{ flex: 1, maxWidth: '260px', fontSize: '13px', padding: '6px 12px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSubTask.trim()) {
                        setSubTasksToAdd([
                          ...subTasksToAdd,
                          { id: Date.now().toString(), text: newSubTask.trim(), done: false }
                        ])
                        setNewSubTask('')
                        showToast('Subtask added!', 'success')
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newSubTask.trim()) {
                        setSubTasksToAdd([
                          ...subTasksToAdd,
                          { id: Date.now().toString(), text: newSubTask.trim(), done: false }
                        ])
                        setNewSubTask('')
                        showToast('Subtask added!', 'success')
                      }
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    Add
                  </button>
                </div>

                {subTasksToAdd.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {subTasksToAdd.map((st) => (
                      <div
                        key={st.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 10px',
                          background: 'var(--accent-light)',
                          borderRadius: '6px',
                          width: 'fit-content'
                        }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📋 {st.text}</span>
                        <button
                          onClick={() =>
                            setSubTasksToAdd(subTasksToAdd.filter((s) => s.id !== st.id))
                          }
                          style={{
                            padding: '1px 4px',
                            borderRadius: '4px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={addTask} disabled={taskSaving} className="btn btn-primary" style={{ width: '100%' }}>
                  {taskSaving ? 'Adding...' : '+ Add Task'}
                </button>
              </div>
            </div>

            {/* Task List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((t) => {
                  const taskSubtasks = subTasks[t.id] || []
                  const completedSubtasks = taskSubtasks.filter((st) => st.done).length
                  const isExpanded = activeTaskId === t.id

                  return (
                    <div
                      key={t.id}
                      className="card"
                      style={{
                        padding: '14px 16px',
                        overflow: 'hidden',
                        border: isExpanded ? '1px solid var(--accent-light)' : '1px solid var(--border-subtle)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setActiveTaskId(isExpanded ? null : t.id)}
                      >
                        <input
                          type="checkbox"
                          checked={t.done}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleTask(t.id)
                          }}
                          className="custom-checkbox"
                        />

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: t.done ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: t.done ? 'line-through' : 'none',
                              letterSpacing: '-0.2px'
                            }}
                          >
                            {t.content}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {t.difficulty && (
                              <span
                                className={`chip ${
                                  t.difficulty === 'hard'
                                    ? 'chip-hard'
                                    : t.difficulty === 'medium'
                                    ? 'chip-medium'
                                    : 'chip-easy'
                                }`}
                                style={{ height: '28px', fontSize: '11px' }}
                              >
                                {t.difficulty}
                              </span>
                            )}
                            {t.estimated_minutes && (
                              <span className="chip chip-minutes" style={{ height: '28px', fontSize: '11px' }}>
                                {t.estimated_minutes}m
                              </span>
                            )}
                            {t.category_tag && t.category_tag !== 'general' && (
                              <span className="chip chip-tag" style={{ height: '28px', fontSize: '11px' }}>
                                #{t.category_tag}
                              </span>
                            )}
                            {t.time && (
                              <span
                                className="chip"
                                style={{
                                  background: 'var(--danger-light)',
                                  color: 'var(--danger)',
                                  height: '28px',
                                  fontSize: '11px'
                                }}
                              >
                                {t.time}
                              </span>
                            )}
                            {taskSubtasks.length > 0 && (
                              <span
                                className="chip chip-progress"
                                style={{ height: '28px', fontSize: '11px' }}
                              >
                                📋 {completedSubtasks}/{taskSubtasks.length}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteTask(t.id)
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '18px'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Subtasks Section */}
                      {isExpanded && (
                        <div
                          style={{
                            paddingTop: '12px',
                            marginTop: '12px',
                            borderTop: '1px solid var(--border-subtle)',
                            animation: 'fadeIn 0.25s ease'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <input
                              value={newSubTask}
                              onChange={(e) => setNewSubTask(e.target.value)}
                              placeholder="Add subtask..."
                              className="input"
                              style={{ flex: 1, fontSize: '13px', padding: '6px 12px' }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addSubTask(t.id)
                                }
                              }}
                            />
                            <button onClick={() => addSubTask(t.id)} className="btn btn-primary btn-sm">
                              Add
                            </button>
                          </div>
                          {taskSubtasks.length > 0 ? (
                            taskSubtasks.map((st) => (
                              <div
                                key={st.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '4px 0'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={st.done}
                                  onChange={() => toggleSubTask(t.id, st.id)}
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    accentColor: 'var(--accent)',
                                    cursor: 'pointer'
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: '14px',
                                    color: st.done ? 'var(--text-muted)' : 'var(--text-secondary)',
                                    textDecoration: st.done ? 'line-through' : 'none',
                                    flex: 1
                                  }}
                                >
                                  {st.text}
                                </span>
                                <button
                                  onClick={() => deleteSubTask(t.id, st.id)}
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-center" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              No subtasks yet
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎯</div>
                  <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-secondary)' }}>
                    Nothing scheduled today.
                  </p>
                  <p style={{ fontSize: '14px', marginTop: '4px' }}>Enjoy the calm or add a new challenge.</p>
                  <button
                    onClick={() => {
                      // Focus the task input
                      document.querySelector('input[placeholder="Add a task..."]')?.focus()
                    }}
                    className="btn btn-primary"
                    style={{ marginTop: '16px' }}
                  >
                    + Add Task
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

                {/* ===== JOURNAL TAB ===== */}
        {activeTab === 'journal' && (
          <div>
            <div className="section-title">Journal</div>
            <div className="section-subtitle">Reflect on your progress.</div>

            {/* Filters */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <span className="tiny-label">📅 Date</span>
              <input
                type="date"
                value={journalDateFilter}
                onChange={(e) => {
                  setJournalDateFilter(e.target.value)
                  fetchJournal()
                }}
                className="input"
                style={{ width: '160px', padding: '6px 12px', fontSize: '12px' }}
              />
              {journalDateFilter && (
                <button
                  onClick={() => {
                    setJournalDateFilter('')
                    fetchJournal()
                  }}
                  className="btn btn-sm"
                  style={{ background: 'var(--danger)', color: 'var(--text-inverse)', border: 'none' }}
                >
                  Clear
                </button>
              )}

              <span className="tiny-label" style={{ marginLeft: '8px' }}>
                🏷️ Tag
              </span>
              <select
                value={journalTagFilter}
                onChange={(e) => setJournalTagFilter(e.target.value)}
                className="select"
                style={{ width: '140px', padding: '6px 12px', fontSize: '12px' }}
              >
                <option value="">All Tags</option>
                {[...new Set(journalEntries.map((e) => e.tags || '').filter((t) => t.trim()))].map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              {journalTagFilter && (
                <button
                  onClick={() => setJournalTagFilter('')}
                  className="btn btn-sm"
                  style={{ background: 'var(--danger)', color: 'var(--text-inverse)', border: 'none' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Journal Editor */}
            <div
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="What's on your mind today? ✍️"
                className="textarea"
                style={{
                  minHeight: '200px',
                  fontSize: '16px',
                  lineHeight: 1.8,
                  maxWidth: '100%'
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
                    Mood
                  </span>
                  <input
                    value={journalMood}
                    onChange={(e) => setJournalMood(e.target.value)}
                    placeholder="e.g., happy, stressed, calm"
                    className="input"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  />
                </div>
                <div style={{ flex: 2, minWidth: '180px' }}>
                  <span className="tiny-label" style={{ display: 'block', marginBottom: '2px' }}>
                    Tags (comma separated)
                  </span>
                  <input
                    value={journalTags}
                    onChange={(e) => setJournalTags(e.target.value)}
                    placeholder="e.g., work, personal, ideas"
                    className="input"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  />
                </div>
                <button
                  onClick={saveJournal}
                  disabled={journalSaving}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-end', marginTop: '8px', minWidth: '100px' }}
                >
                  {journalSaving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>

            {/* Journal Entries - Grouped by Today/Yesterday/This Week/Earlier */}
            {journalEntries.length > 0 ? (
              (() => {
                const groups = {}
                journalEntries.forEach((entry) => {
                  const group = formatEntryDate(entry.created_at)
                  if (!groups[group]) groups[group] = []
                  groups[group].push(entry)
                })

                const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier']

                return groupOrder.map((group) => {
                  if (!groups[group] || groups[group].length === 0) return null
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
                      {groups[group]
                        .filter((entry) => {
                          if (!journalTagFilter) return true
                          const tags = (entry.tags || '').split(',').map((t) => t.trim())
                          return tags.includes(journalTagFilter)
                        })
                        .map((entry) => {
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
                                transition: 'all 0.2s ease'
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
                                        background: 'var(--accent-light)',
                                        color: 'var(--accent)'
                                      }}
                                    >
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
                                          #{tag}
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
                                    fontSize: '16px'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                                >
                                  ×
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
                                    {isExpanded ? '▲ Show less' : '▼ Read more'}
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
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>📖</div>
                <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-secondary)' }}>
                  No journal entries yet.
                </p>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>Write your first entry above.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== TOAST ===== */}
      {toast.show && (
        <div className={`toast show ${toast.type}`}>
          {toast.message}
          {toast.undo && (
            <span className="undo" onClick={toast.undo}>
              Undo
            </span>
          )}
        </div>
      )}

      {/* ===== INJECT ANIMATION STYLES ===== */}
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.22s ease-out;
        }
        .card-press:active {
          transform: scale(0.98);
          transition-duration: 120ms;
        }
      `}</style>
    </div>
  )
        }

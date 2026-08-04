import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import './index.css'
import Dashboard from './Dashboard'
import NotesTab from './NotesTab'
import TasksTab from './TasksTab'
import JournalTab from './JournalTab'
import StatsModal from './StatsModal'
import TrashModal from './TrashModal'

// ===== Supabase =====
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
} catch (e) {
  console.warn('Supabase init failed:', e)
}

// ===== SVG ICONS =====
const IconMoon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const IconSun = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const IconAmber = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const IconSolarized = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const IconMenuDots = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
)

const IconLogout = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
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

const LogoIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22E2FF"/>
        <stop offset="48%" stopColor="#4A8EFF"/>
        <stop offset="100%" stopColor="#B43DFF"/>
      </linearGradient>
      <linearGradient id="innerGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="7"/>
      </filter>
      <filter id="shadow">
        <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#4A8EFF" floodOpacity="0.3"/>
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#B43DFF" floodOpacity="0.2"/>
      </filter>
      <mask id="cutouts">
        <rect width="512" height="512" fill="white"/>
        <path fill="black" d="M70 162 H198 Q212 162 212 174 Q212 186 198 186 H70 Q54 186 54 174 Q54 162 70 162 Z"/>
        <path fill="black" d="M60 228 H222 Q238 228 238 242 Q238 256 222 256 H60 Q44 256 44 242 Q44 228 60 228 Z"/>
        <path fill="black" d="M72 296 H184 L212 330 H70 Q54 330 54 314 Q54 296 72 296 Z"/>
      </mask>
      <g id="sparkle">
        <path d="M0-24 C0-8 8 0 24 0 C8 0 0 8 0 24 C0 8 -8 0 -24 0 C-8 0 0-8 0-24Z" fill="#ffffff"/>
      </g>
    </defs>
    <g filter="url(#glow) url(#shadow)">
      <g mask="url(#cutouts)">
        <path fill="url(#logoGrad)" d="M176 74 H288 C408 74 472 150 472 256 C472 362 408 438 288 438 H176 Q146 438 146 406 V106 Q146 74 176 74 Z"/>
        <path fill="url(#innerGlow)" d="M176 74 H288 C408 74 472 150 472 256 C472 362 408 438 288 438 H176 Q146 438 146 406 V106 Q146 74 176 74 Z"/>
      </g>
      <path fill="#0F1115" d="M236 122 Q214 122 214 144 V368 Q214 390 236 390 H282 C365 390 414 338 414 256 C414 174 365 122 282 122 Z"/>
      <path fill="none" stroke="#000" strokeOpacity="0.3" strokeWidth="4" d="M236 122 Q214 122 214 144 V368 Q214 390 236 390 H282 C365 390 414 338 414 256 C414 174 365 122 282 122 Z"/>
      <path fill="none" stroke="#ffffff" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" d="M242 262 L274 296 L338 214"/>
      <path fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="50" strokeLinecap="round" strokeLinejoin="round" d="M242 262 L274 296 L338 214"/>
    </g>
    <use href="#sparkle" x="80" y="80" transform="scale(0.8)" opacity="0.9">
      <animateTransform attributeName="transform" type="translate" values="0,0; -6,-6; 0,0" dur="4s" repeatCount="indefinite"/>
    </use>
    <use href="#sparkle" x="410" y="120" transform="scale(0.6)" opacity="0.7">
      <animateTransform attributeName="transform" type="translate" values="0,0; 4,-8; 0,0" dur="5s" repeatCount="indefinite"/>
    </use>
    <use href="#sparkle" x="430" y="380" transform="scale(0.7)" opacity="0.8">
      <animateTransform attributeName="transform" type="translate" values="0,0; -8,4; 0,0" dur="4.5s" repeatCount="indefinite"/>
    </use>
    <use href="#sparkle" x="90" y="420" transform="scale(0.5)" opacity="0.6">
      <animateTransform attributeName="transform" type="translate" values="0,0; 6,4; 0,0" dur="3.5s" repeatCount="indefinite"/>
    </use>
  </svg>
)

// ===== HELPERS =====
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const formatTime = (sec) => {
  if (!sec && sec !== 0) return '00:00'
  const mins = Math.floor(sec / 60)
  const secs = Math.floor(sec % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatMinutes = (mins) => {
  if (!mins || mins === 0) return '0m'
  const hours = Math.floor(mins / 60)
  const minutes = mins % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

const CACHE_KEY = 'discypln_cache'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000

const saveToCache = (data) => {
  try {
    const cache = { data, timestamp: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (e) {}
}

const loadFromCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch (e) { return null }
}

// ============================================================
//  APP COMPONENT
// ============================================================

export default function App() {
  // ===== Auth =====
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // ===== Theme =====
  const [themeMode, setThemeMode] = useState('dark')

  // ===== Navigation =====
  const [currentView, setCurrentView] = useState('dashboard')
  const [activeTab, setActiveTab] = useState('notes')

  // ===== UI =====
  const [currentTime, setCurrentTime] = useState(new Date())
  const [message, setMessage] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showTrashModal, setShowTrashModal] = useState(false)

  // ===== Data =====
  const [notes, setNotes] = useState([])
  const [tasks, setTasks] = useState([])
  const [journalEntries, setJournalEntries] = useState([])
  const [trash, setTrash] = useState({ notes: [], tasks: [], journal: [] })
  const [loadingStates, setLoadingStates] = useState({ notes: false, tasks: false, journal: false, stats: false })

  // ===== Pomodoro =====
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [pomodoroSessions, setPomodoroSessions] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [pomodoroState, setPomodoroState] = useState('idle')
  const [showCelebration, setShowCelebration] = useState(false)
  const [focusDuration, setFocusDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)

  // ===== Session (FIXED) =====
  const [activeSession, setActiveSession] = useState(null)
  const [sessionTaskId, setSessionTaskId] = useState(null)
  const [sessionPomodoroTime, setSessionPomodoroTime] = useState(25 * 60)
  const [sessionRunning, setSessionRunning] = useState(false)
  const [sessionPaused, setSessionPaused] = useState(false)
  const sessionIntervalRef = useRef(null)

  // ===== Stats =====
  const [statsData, setStatsData] = useState({
    disciplineScore: 0,
    disciplineLevel: 'Novice',
    disciplineBadge: '🌱',
    longestStreak: 0,
    dailyAverage: 0,
    bestDay: null,
    bestDayCount: 0,
    commitmentRate: 0,
    focusScore: 0,
    monthlyProgress: 0,
    habitCompletion: 0,
    taskVelocity: 0,
    weeklyBreakdown: [],
    dailyHabitsDone: 0,
    dailyHabitsTotal: 0,
    weeklyHabitsDone: 0,
    weeklyHabitsTotal: 0,
    monthlyHabitsDone: 0,
    monthlyHabitsTotal: 0,
    todayFocus: 0,
    weekFocus: 0,
    monthFocus: 0,
    bestFocusDay: null,
    bestFocusMinutes: 0,
    avgFocusPerDay: 0,
    streakEndangered: false,
    daysUntilStreakLoss: 0,
    nextMilestone: 0,
    totalTasksEver: 0,
    completionRate: 0,
    averageTaskTime: 0,
    mostProductiveHour: '--',
    weeklyGoalProgress: 0
  })

  // ===== Toast =====
  const [toast, setToast] = useState({ show: false, message: '', type: 'success', undo: null })
  const toastTimeout = useRef(null)

  // ============================================================
  //  HELPERS
  // ============================================================

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

  const showToast = (message, type = 'success', undo = null) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    setToast({ show: true, message, type, undo })
    toastTimeout.current = setTimeout(() => {
      setToast({ show: false, message: '', type: 'success', undo: null })
    }, 2500)
  }

  const getThemeIcon = () => {
    switch(themeMode) {
      case 'dark': return <IconMoon />
      case 'light': return <IconSun />
      case 'amber': return <IconAmber style={{ color: '#F59E0B' }} />
      case 'solarized': return <IconSolarized style={{ color: '#B58900' }} />
      default: return <IconMoon />
    }
  }

  const getThemeName = () => {
    switch(themeMode) {
      case 'dark': return 'Dark Mode'
      case 'light': return 'Light Mode'
      case 'amber': return 'Amber Mode'
      case 'solarized': return 'Solarized Mode'
      default: return 'Dark Mode'
    }
  }

  // ============================================================
  //  EFFECTS
  // ============================================================

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    document.body.setAttribute('data-theme', themeMode)
  }, [themeMode])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ===== SESSION TIMER EFFECT (FIXED) =====
  useEffect(() => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current)
      sessionIntervalRef.current = null
    }

    if (sessionRunning && sessionPomodoroTime > 0) {
      sessionIntervalRef.current = setInterval(() => {
        setSessionPomodoroTime(prev => {
          if (prev <= 1) {
            setSessionRunning(false)
            showToast('Time\'s up! Take a break.', 'success')
            const task = tasks.find(t => t.id === sessionTaskId)
            return (task?.estimated_minutes || 25) * 60
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
        sessionIntervalRef.current = null
      }
    }
  }, [sessionRunning, sessionPomodoroTime, sessionTaskId, tasks])

  // ===== Supabase Auth =====
  useEffect(() => {
    if (!supabase) {
      setAuthError('Supabase not configured. Check your .env file.')
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchAllData()
      } else {
        const cached = loadFromCache()
        if (cached) {
          setNotes(cached.notes || [])
          setTasks(cached.tasks || [])
          setJournalEntries(cached.journal || [])
          setPomodoroSessions(cached.pomodoroSessions || 0)
          setTotalMinutes(cached.totalMinutes || 0)
        }
      }
    }).catch(err => {
      console.error('Auth session error:', err)
      setAuthError('Failed to connect to Supabase')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchAllData()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ============================================================
  //  SESSION FUNCTIONS
  // ============================================================

  const startTaskSession = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const duration = (task.estimated_minutes || 25) * 60
    
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current)
      sessionIntervalRef.current = null
    }
    
    setSessionTaskId(taskId)
    setActiveSession(taskId)
    setSessionPomodoroTime(duration)
    setSessionRunning(true)
    setSessionPaused(false)
    showToast('Focusing on: "' + task.content + '"', 'success')
  }

  const pauseSession = () => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current)
      sessionIntervalRef.current = null
    }
    setSessionRunning(false)
    setSessionPaused(true)
    showToast('Session paused', 'info')
  }

  const resumeSession = () => {
    setSessionRunning(true)
    setSessionPaused(false)
    showToast('Session resumed', 'info')
  }

  const stopSession = () => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current)
      sessionIntervalRef.current = null
    }
    setSessionRunning(false)
    setSessionPaused(false)
    setActiveSession(null)
    setSessionTaskId(null)
    const task = tasks.find(t => t.id === sessionTaskId)
    setSessionPomodoroTime((task?.estimated_minutes || 25) * 60)
    showToast('Session stopped', 'info')
  }

  const completeTaskFromSession = async () => {
    if (!sessionTaskId) return
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current)
      sessionIntervalRef.current = null
    }
    await toggleTask(sessionTaskId)
    setSessionRunning(false)
    setActiveSession(null)
    setSessionTaskId(null)
    const task = tasks.find(t => t.id === sessionTaskId)
    setSessionPomodoroTime((task?.estimated_minutes || 25) * 60)
    showToast('Task completed! Great focus!', 'success')
  }

  // ============================================================
  //  TOGGLE TASK
  // ============================================================

  async function toggleTask(id) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    if (!supabase) return
    const { error } = await supabase
      .from('tasks')
      .update({ done: !task.done, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      if (!task.done) {
        showToast('Task completed!', 'success')
      }
      fetchTasks()
    }
  }

  // ============================================================
  //  AUTH FUNCTIONS
  // ============================================================

  async function signUp() {
    if (!supabase) { setAuthError('Supabase not configured'); return }
    setLoading(true); setAuthError('')
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setAuthError(error.message)
      else setAuthError('Check email for confirmation link')
    } catch (e) { setAuthError('Network error. Please try again.') }
    setLoading(false)
  }

  async function signIn() {
    if (!supabase) { setAuthError('Supabase not configured'); return }
    setLoading(true); setAuthError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setAuthError(error.message)
    } catch (e) { setAuthError('Network error. Please try again.') }
    setLoading(false)
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setNotes([]); setTasks([]); setJournalEntries([])
    setCurrentView('dashboard')
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current)
      sessionIntervalRef.current = null
    }
    setSessionRunning(false)
    setActiveSession(null)
  }

  // ============================================================
  //  DATA FETCHING
  // ============================================================

  async function fetchNotes() {
    if (!user || !supabase) return
    setLoadingStates(prev => ({ ...prev, notes: true }))
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error) setNotes(data || [])
    } catch (e) { console.error('Fetch notes error:', e) }
    setLoadingStates(prev => ({ ...prev, notes: false }))
  }

  async function fetchTasks() {
    if (!user || !supabase) return
    setLoadingStates(prev => ({ ...prev, tasks: true }))
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error) {
        setTasks(data || [])
        const subtaskMap = {}
        data?.forEach((t) => { subtaskMap[t.id] = t.subtasks || [] })
        setSubTasks(subtaskMap)
      }
    } catch (e) { console.error('Fetch tasks error:', e) }
    setLoadingStates(prev => ({ ...prev, tasks: false }))
  }

  async function fetchJournal() {
    if (!user || !supabase) return
    setLoadingStates(prev => ({ ...prev, journal: true }))
    try {
      const { data, error } = await supabase
        .from('journal')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error) setJournalEntries(data || [])
    } catch (e) { console.error('Fetch journal error:', e) }
    setLoadingStates(prev => ({ ...prev, journal: false }))
  }

  async function fetchPomodoroStats() {
    if (!user || !supabase) return
    try {
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
    } catch (e) { console.error('Fetch pomodoro error:', e) }
  }

  const fetchAllData = async () => {
    await Promise.all([fetchNotes(), fetchTasks(), fetchJournal(), fetchPomodoroStats()])
    saveToCache({ notes, tasks, journal: journalEntries, pomodoroSessions, totalMinutes })
  }

  // ============================================================
  //  POMODORO FUNCTIONS
  // ============================================================

  const togglePomodoro = () => {
    if (!pomodoroRunning && pomodoroTime === 0) {
      setPomodoroTime(focusDuration * 60)
      setIsBreak(false)
    }
    setPomodoroRunning(!pomodoroRunning)
    setPomodoroState(!pomodoroRunning ? 'running' : 'paused')
  }

  const resetPomodoro = () => {
    setPomodoroRunning(false)
    setIsBreak(false)
    setPomodoroTime(Math.round(focusDuration * 60))
    setPomodoroState('idle')
    setShowCelebration(false)
  }

  const handlePomodoroComplete = async () => {
    if (!isBreak) {
      const newSessions = pomodoroSessions + 1
      const newMinutes = totalMinutes + focusDuration
      setPomodoroSessions(newSessions)
      setTotalMinutes(newMinutes)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
      if (supabase && user) {
        try {
          const today = new Date().toISOString().split('T')[0]
          await supabase.from('pomodoro_sessions').upsert({
            user_id: user.id,
            date: today,
            sessions_completed: newSessions,
            total_minutes: newMinutes
          })
        } catch (e) {}
      }
      showToast('Focus Session Complete! Take a break.', 'success')
      setPomodoroTime(Math.round(breakDuration * 60))
    } else {
      showToast('Break over. Ready to focus?', 'success')
      setPomodoroTime(Math.round(focusDuration * 60))
    }
    setIsBreak(!isBreak)
    setPomodoroRunning(false)
    setPomodoroState('finished')
  }

  // ============================================================
  //  TRASH FUNCTIONS
  // ============================================================

  const addToTrash = (type, item) => {
    const trashItem = {
      ...item,
      deletedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_DURATION).toISOString()
    }
    setTrash(prev => ({ ...prev, [type]: [...prev[type], trashItem] }))
    try { localStorage.setItem('discypln_trash', JSON.stringify(trash)) } catch (e) {}
  }

  const restoreFromTrash = (type, id) => {
    const item = trash[type].find(t => t.id === id)
    if (!item) return null
    setTrash(prev => ({ ...prev, [type]: prev[type].filter(t => t.id !== id) }))
    return item
  }

  const emptyTrash = (type) => {
    setTrash(prev => ({ ...prev, [type]: [] }))
    showToast('Trash emptied', 'success')
  }

  // ============================================================
  //  SUBTASKS STATE
  // ============================================================

  const [subTasks, setSubTasks] = useState({})

  // ============================================================
  //  RENDER
  // ============================================================

  if (!user) {
    return (
      <>
        <div className="bg-glow" />
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', position: 'relative', zIndex: 1 }}>
          <div className="glass glass-heavy" style={{ maxWidth: '400px', width: '100%', padding: '32px', borderRadius: 'var(--radius-2xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginBottom: '12px' }}>
              <LogoIcon className="logo-svg" style={{ width: '48px', height: '48px' }} />
              <span className="hero-title" style={{ fontSize: '32px' }}>iscypln</span>
            </div>
            <p className="text-secondary text-center" style={{ marginBottom: '24px', fontSize: '14px' }}>Stay focused. Stay disciplined.</p>
            {authError && <p className="text-center" style={{ marginBottom: '12px', color: '#EF4444', fontSize: '13px' }}>{authError}</p>}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" style={{ marginBottom: '12px', width: '100%', padding: '12px 16px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: '15px', outline: 'none' }} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" style={{ marginBottom: '16px', width: '100%', padding: '12px 16px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: '15px', outline: 'none' }} />
            <div className="flex gap-3">
              <button onClick={signIn} disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>{loading ? 'Loading...' : 'Sign In'}</button>
              <button onClick={signUp} disabled={loading} className="btn btn-ghost" style={{ flex: 1 }}>{loading ? 'Loading...' : 'Sign Up'}</button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ===== RENDER CURRENT VIEW =====
  const renderContent = () => {
    switch(currentView) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            currentTime={currentTime}
            greeting={getGreeting()}
            statsData={statsData}
            streak={getStreak()}
            tasks={tasks}
            notes={notes}
            journalEntries={journalEntries}
            totalMinutes={totalMinutes}
            onNavigate={(view) => { setCurrentView(view); setActiveTab(view) }}
            onOpenStats={() => setShowStatsModal(true)}
          />
        )
      case 'notes':
        return (
          <NotesTab
            user={user}
            notes={notes}
            loadingStates={loadingStates}
            onFetchNotes={fetchNotes}
            onNavigate={(view) => { setCurrentView(view); setActiveTab(view) }}
            showToast={showToast}
            addToTrash={addToTrash}
            supabase={supabase}
          />
        )
      case 'tasks':
        return (
          <TasksTab
            user={user}
            tasks={tasks}
            loadingStates={loadingStates}
            onFetchTasks={fetchTasks}
            onNavigate={(view) => { setCurrentView(view); setActiveTab(view) }}
            showToast={showToast}
            addToTrash={addToTrash}
            supabase={supabase}
            // Pomodoro
            pomodoroTime={pomodoroTime}
            pomodoroRunning={pomodoroRunning}
            isBreak={isBreak}
            pomodoroSessions={pomodoroSessions}
            totalMinutes={totalMinutes}
            pomodoroState={pomodoroState}
            showCelebration={showCelebration}
            focusDuration={focusDuration}
            breakDuration={breakDuration}
            onTogglePomodoro={togglePomodoro}
            onResetPomodoro={resetPomodoro}
            onSetFocusDuration={setFocusDuration}
            onSetBreakDuration={setBreakDuration}
            // Session
            activeSession={activeSession}
            sessionTaskId={sessionTaskId}
            sessionPomodoroTime={sessionPomodoroTime}
            sessionRunning={sessionRunning}
            sessionPaused={sessionPaused}
            onStartSession={startTaskSession}
            onPauseSession={pauseSession}
            onResumeSession={resumeSession}
            onStopSession={stopSession}
            onCompleteSession={completeTaskFromSession}
            // Stats
            statsData={statsData}
            subTasks={subTasks}
            setSubTasks={setSubTasks}
          />
        )
      case 'journal':
        return (
          <JournalTab
            user={user}
            journalEntries={journalEntries}
            loadingStates={loadingStates}
            onFetchJournal={fetchJournal}
            onNavigate={(view) => { setCurrentView(view); setActiveTab(view) }}
            showToast={showToast}
            addToTrash={addToTrash}
            supabase={supabase}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="bg-glow" />
      <div className="container fade-in" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* ===== HEADER ===== */}
        <header className="app-header" style={{ position: 'relative', zIndex: 100 }}>
          <div className="header-left">
            <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
              <LogoIcon className="logo-svg" style={{ width: '40px', height: '40px' }} />
              <span className="logo-text" style={{ 
                fontSize: '26px', 
                fontWeight: 900, 
                letterSpacing: '-0.03em',
                marginLeft: '-4px',
                background: 'var(--gradient-primary)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'gradientShift 15s ease infinite'
              }}>
                iscypln
              </span>
            </div>
            <div className="header-center">
              <span className="greeting-text">
                {getGreeting()}{' '}
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
              <span className="date-text">
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="header-right" style={{ position: 'relative', zIndex: 1000 }} ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="btn btn-ghost btn-icon" style={{ padding: '0', fontSize: '22px' }}>
              <IconMenuDots />
            </button>
            {showUserMenu && (
              <div className="glass glass-heavy" style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: '200px',
                borderRadius: 'var(--radius-lg)',
                padding: '8px',
                zIndex: 9999,
                animation: 'slideDown 0.2s ease',
                background: 'var(--bg-secondary)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.4)'
              }}>
                <div style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)', marginBottom: '4px' }}>
                  {user?.email}
                </div>
                <button onClick={() => {
                  const themes = ['dark', 'light', 'amber', 'solarized']
                  const currentIndex = themes.indexOf(themeMode)
                  const nextIndex = (currentIndex + 1) % themes.length
                  setThemeMode(themes[nextIndex])
                  setShowUserMenu(false)
                }} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 14px' }}>
                  {getThemeIcon()} {getThemeName()}
                </button>
                <button onClick={() => setShowTrashModal(true)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: '10px', padding: '10px 14px' }}>
                  <IconTrash /> Trash ({trash.notes.length + trash.tasks.length + trash.journal.length})
                </button>
                <button onClick={() => { signOut(); setShowUserMenu(false) }} className="btn btn-ghost" style={{
                  width: '100%', justifyContent: 'flex-start', gap: '10px', color: 'var(--text-muted)',
                  borderTop: '1px solid var(--glass-border)', marginTop: '4px', padding: '10px 14px'
                }}>
                  <IconLogout /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {renderContent()}

        {showStatsModal && (
          <StatsModal
            onClose={() => setShowStatsModal(false)}
            statsData={statsData}
            streak={getStreak()}
            tasks={tasks}
            totalMinutes={totalMinutes}
            formatMinutes={formatMinutes}
            showToast={showToast}
          />
        )}

        {showTrashModal && (
          <TrashModal
            onClose={() => setShowTrashModal(false)}
            trash={trash}
            onRestore={(type, id) => {
              const item = restoreFromTrash(type, id)
              if (item) {
                if (type === 'notes') setNotes(prev => [item, ...prev])
                else if (type === 'tasks') setTasks(prev => [item, ...prev])
                else if (type === 'journal') setJournalEntries(prev => [item, ...prev])
                showToast('Restored!', 'success')
              }
            }}
            onEmptyTrash={emptyTrash}
            formatDate={formatDate}
          />
        )}

        {toast.show && (
          <div className={`toast show ${toast.type}`}>
            {toast.message}
            {toast.undo && <span className="undo" onClick={toast.undo}>Undo</span>}
          </div>
        )}

      </div>
    </>
  )
  }

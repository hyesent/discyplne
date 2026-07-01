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

const ALL_LANGUAGES = [
  {code:"af",name:"Afrikaans"},{code:"sq",name:"Albanian"},{code:"am",name:"Amharic"},{code:"ar",name:"Arabic"},
  {code:"hy",name:"Armenian"},{code:"az",name:"Azerbaijani"},{code:"eu",name:"Basque"},{code:"be",name:"Belarusian"},
  {code:"bn",name:"Bengali"},{code:"bs",name:"Bosnian"},{code:"bg",name:"Bulgarian"},{code:"ca",name:"Catalan"},
  {code:"ceb",name:"Cebuano"},{code:"ny",name:"Chichewa"},{code:"zh-CN",name:"Chinese Simplified"},{code:"zh-TW",name:"Chinese Traditional"},
  {code:"co",name:"Corsican"},{code:"hr",name:"Croatian"},{code:"cs",name:"Czech"},{code:"da",name:"Danish"},
  {code:"nl",name:"Dutch"},{code:"en",name:"English"},{code:"eo",name:"Esperanto"},{code:"et",name:"Estonian"},
  {code:"tl",name:"Filipino"},{code:"fi",name:"Finnish"},{code:"fr",name:"French"},{code:"fy",name:"Frisian"},
  {code:"gl",name:"Galician"},{code:"ka",name:"Georgian"},{code:"de",name:"German"},{code:"el",name:"Greek"},
  {code:"gu",name:"Gujarati"},{code:"ht",name:"Haitian Creole"},{code:"ha",name:"Hausa"},{code:"haw",name:"Hawaiian"},
  {code:"he",name:"Hebrew"},{code:"hi",name:"Hindi"},{code:"hmn",name:"Hmong"},{code:"hu",name:"Hungarian"},
  {code:"is",name:"Icelandic"},{code:"ig",name:"Igbo"},{code:"id",name:"Indonesian"},{code:"ga",name:"Irish"},
  {code:"it",name:"Italian"},{code:"ja",name:"Japanese"},{code:"jw",name:"Javanese"},{code:"kn",name:"Kannada"},
  {code:"kk",name:"Kazakh"},{code:"km",name:"Khmer"},{code:"rw",name:"Kinyarwanda"},{code:"ko",name:"Korean"},
  {code:"ku",name:"Kurdish"},{code:"ky",name:"Kyrgyz"},{code:"lo",name:"Lao"},{code:"la",name:"Latin"},
  {code:"lv",name:"Latvian"},{code:"lt",name:"Lithuanian"},{code:"lb",name:"Luxembourgish"},{code:"mk",name:"Macedonian"},
  {code:"mg",name:"Malagasy"},{code:"ms",name:"Malay"},{code:"ml",name:"Malayalam"},{code:"mt",name:"Maltese"},
  {code:"mi",name:"Maori"},{code:"mr",name:"Marathi"},{code:"mn",name:"Mongolian"},{code:"my",name:"Myanmar"},
  {code:"ne",name:"Nepali"},{code:"no",name:"Norwegian"},{code:"or",name:"Odia"},{code:"ps",name:"Pashto"},
  {code:"fa",name:"Persian"},{code:"pl",name:"Polish"},{code:"pt",name:"Portuguese"},{code:"pa",name:"Punjabi"},
  {code:"ro",name:"Romanian"},{code:"ru",name:"Russian"},{code:"sm",name:"Samoan"},{code:"gd",name:"Scots Gaelic"},
  {code:"sr",name:"Serbian"},{code:"st",name:"Sesotho"},{code:"sn",name:"Shona"},{code:"sd",name:"Sindhi"},
  {code:"si",name:"Sinhala"},{code:"sk",name:"Slovak"},{code:"sl",name:"Slovenian"},{code:"so",name:"Somali"},
  {code:"es",name:"Spanish"},{code:"su",name:"Sundanese"},{code:"sw",name:"Swahili"},{code:"sv",name:"Swedish"},
  {code:"tg",name:"Tajik"},{code:"ta",name:"Tamil"},{code:"tt",name:"Tatar"},{code:"te",name:"Telugu"},
  {code:"th",name:"Thai"},{code:"tr",name:"Turkish"},{code:"tk",name:"Turkmen"},{code:"uk",name:"Ukrainian"},
  {code:"ur",name:"Urdu"},{code:"ug",name:"Uyghur"},{code:"uz",name:"Uzbek"},{code:"vi",name:"Vietnamese"},
  {code:"cy",name:"Welsh"},{code:"xh",name:"Xhosa"},{code:"yi",name:"Yiddish"},{code:"yo",name:"Yoruba"},{code:"zu",name:"Zulu"}
]

// CODE LANGUAGE DETECTOR
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

// HELPER: Convert ISO lang codes to NLLB format for HuggingFace
const getNLLBLangCode = (code) => {
  const map = {
    'en': 'eng_Latn', 'es': 'spa_Latn', 'fr': 'fra_Latn', 'de': 'deu_Latn',
    'it': 'ita_Latn', 'pt': 'por_Latn', 'ru': 'rus_Cyrl', 'zh-CN': 'zho_Hans',
    'zh-TW': 'zho_Hant', 'ja': 'jpn_Jpan', 'ko': 'kor_Hang', 'ar': 'arb_Arab',
    'hi': 'hin_Deva', 'nl': 'nld_Latn', 'pl': 'pol_Latn', 'tr': 'tur_Latn',
    'vi': 'vie_Latn', 'th': 'tha_Thai', 'he': 'heb_Hebr', 'sv': 'swe_Latn',
    'da': 'dan_Latn', 'fi': 'fin_Latn', 'no': 'nob_Latn', 'cs': 'ces_Latn',
    'el': 'ell_Grek', 'hu': 'hun_Latn', 'ro': 'ron_Latn', 'uk': 'ukr_Cyrl',
    'id': 'ind_Latn', 'ms': 'zsm_Latn', 'fa': 'pes_Arab', 'bn': 'ben_Beng',
    'ta': 'tam_Taml', 'te': 'tel_Telu', 'mr': 'mar_Deva', 'ur': 'urd_Arab',
    'sw': 'swh_Latn', 'fil': 'tgl_Latn', 'tl': 'tgl_Latn'
  }
  return map[code] || 'eng_Latn'
}

export default function App() {
  // ========== AUTH STATE ==========
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // ========== UI STATE ==========
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [activeTab, setActiveTab] = useState('notes') // 'notes' | 'tasks' | 'journal'
  const [currentTime, setCurrentTime] = useState(new Date())
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // ========== NOTES STATE ==========
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [noteText, setNoteText] = useState('')
  const [priority, setPriority] = useState('medium')
  const [editingNote, setEditingNote] = useState(null)
  const [viewMode, setViewMode] = useState('home') // 'home' | 'add' | 'edit'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [detectedCode, setDetectedCode] = useState(null)
  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState('16')
  const [titleFont, setTitleFont] = useState('Inter')
  const [showNotesDropdown, setShowNotesDropdown] = useState(false)

  // ========== TASKS STATE ==========
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
  
  // ========== TODO SUBTASKS STATE ==========
  const [subTasks, setSubTasks] = useState({})
  const [newSubTask, setNewSubTask] = useState('')
  const [activeTaskId, setActiveTaskId] = useState(null)

  // ========== JOURNAL STATE ==========
  const [journalEntries, setJournalEntries] = useState([])
  const [journalEntry, setJournalEntry] = useState('')

  // ========== POMODORO STATE ==========
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [pomodoroSessions, setPomodoroSessions] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)

  // ========== VOICE RECOGNITION ==========
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)

  // ========== EXPORT STATE ==========
  const [showExport, setShowExport] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState([])
  const [targetLang, setTargetLang] = useState("fr")

  // ========== FORMAT HELPERS ==========
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
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ========== STREAK CALCULATION ==========
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
          failed.push({
            date: dateStr,
            completed,
            total: dayHabits.length
          })
        }
      }
    }
    return failed
  }
  const failedDays = getFailedDays()

  // ========== EFFECTS ==========
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
        setMessage(`💻 Code detected: ${codeLang}`)
        setTimeout(() => setMessage(''), 2000)
      } else {
        setDetectedCode(null)
      }
    }
  }, [noteText])

  // ========== POMODORO ==========
  useEffect(() => {
    let interval
    if (pomodoroRunning) {
      interval = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            handlePomodoroComplete()
            return isBreak ? 25 * 60 : 5 * 60
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [pomodoroRunning, isBreak])

  const togglePomodoro = () => {
    setPomodoroRunning(!pomodoroRunning)
  }

  const resetPomodoro = () => {
    setPomodoroRunning(false)
    setIsBreak(false)
    setPomodoroTime(25 * 60)
  }

  const handlePomodoroComplete = async () => {
    if (!isBreak) {
      const newSessions = pomodoroSessions + 1
      const newMinutes = totalMinutes + 25
      setPomodoroSessions(newSessions)
      setTotalMinutes(newMinutes)
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('pomodoro_sessions').upsert({
        user_id: user.id,
        date: today,
        sessions_completed: newSessions,
        total_minutes: newMinutes
      })
    }
    setIsBreak(!isBreak)
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
      setMessage('🎤 Listening... Say: comma, full stop, new line')
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
          try { recognition.start() } catch {}
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
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          recognitionRef.current.start()
          setIsListening(true)
          setMessage('🎤 Say comma, full stop, new line for punctuation')
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
      logger: m => console.log(m.status, m.progress)
    }).then(({ data: { text } }) => {
      setNoteText(prev => prev + (prev ? '\n\n' : '') + text)
      setMessage('✅ Text extracted!')
      setIsProcessing(false)
      e.target.value = ''
    }).catch(() => {
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
    setLoading(true)
    setMessage('')

    const noteData = {
      title: title.trim(),
      content: noteText.trim(),
      font_family: fontFamily,
      title_font: titleFont,
      font_size: parseInt(fontSize),
      priority: priority || 'medium',
      user_id: user.id,
      date: selectedDate
    }

    if (editingNote) {
      const { error } = await supabase
        .from('notes')
        .update(noteData)
        .eq('id', editingNote.id)
        .eq('user_id', user.id)

      if (error) setMessage('Error: ' + error.message)
      else {
        setMessage('✅ Note updated!')
        setEditingNote(null)
        setTitle('')
        setNoteText('')
        setPriority('medium')
        await fetchNotes()
        setViewMode('home')
      }
    } else {
      const { error } = await supabase
        .from('notes')
        .insert([noteData])

      if (error) setMessage('Error: ' + error.message)
      else {
        setMessage('✅ Note saved!')
        setTitle('')
        setNoteText('')
        setPriority('medium')
        await fetchNotes()
        setViewMode('home')
      }
    }
    setLoading(false)
  }

  function openAddNote() {
    setEditingNote(null)
    setTitle('')
    setNoteText('')
    setPriority('medium')
    setViewMode('add')
  }

  function openEditNote(note) {
    setEditingNote(note)
    setTitle(note.title)
    setNoteText(note.content)
    setFontFamily(note.font_family || 'Inter')
    setTitleFont(note.title_font || 'Inter')
    setFontSize(note.font_size?.toString() || '16')
    setPriority(note.priority)
    setViewMode('edit')
  }

  function goBack() {
    setViewMode('home')
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
        setMessage('✅ Note shared!')
      } catch (err) {
        if (err.name !== 'AbortError') {
          setMessage('Sharing failed')
        }
      }
    } else {
      navigator.clipboard.writeText(shareText)
      setMessage('📋 Copied instead')
    }
  }

  // ========== TRANSLATION ==========
  async function translateNote() {
    if (!noteText.trim()) {
      setMessage("Note empty. Type something first.")
      return
    }

    setLoading(true)
    setMessage("🌍 Translating ...")

    const textToTranslate = noteText.trim()
    const langName = ALL_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang

    // 1. Hugging Face NLLB-200
    try {
      const res = await fetch(
        "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputs: textToTranslate,
            parameters: {
              src_lang: "eng_Latn",
              tgt_lang: getNLLBLangCode(targetLang)
            }
          })
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (data[0]?.translation_text) {
          setNoteText(data[0].translation_text)
          setMessage(`✅ Translated to ${langName}!`)
          setLoading(false)
          return
        }
      }
    } catch (e) {
      console.log('HuggingFace failed:', e)
    }

    // 2. LibreTranslate
    try {
      const response = await fetch("https://libretranslate.com/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: textToTranslate,
          source: "auto",
          target: targetLang,
          format: "text"
        })
      })
      if (response.ok) {
        const data = await response.json()
        if (data.translatedText) {
          setNoteText(data.translatedText)
          setMessage(`✅ Translated to ${langName}!`)
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
      const translated = parsed[0].map(item => item[0]).join('')
      if (translated) {
        setNoteText(translated)
        setMessage(`✅ Translated to ${langName}!`)
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
        setMessage(`✅ Translated to ${langName}!`)
      } else {
        setMessage("❌ Translation failed. Try shorter text.")
      }
    } catch (e) {
      setMessage("❌ No internet: " + e.message)
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
      // Initialize subtasks for each task
      const subtaskMap = {}
      data?.forEach(t => {
        subtaskMap[t.id] = t.subtasks || []
      })
      setSubTasks(subtaskMap)
    }
  }

  async function addTask() {
    if (!task.trim() || !user) return
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
      subtasks: []
    })

    if (error) {
      setMessage('Error adding task: ' + error.message)
    } else {
      setTask('')
      setTaskTime('')
      setTaskDueDate('')
      setTaskMinutes(30)
      setTaskTag('general')
      setMessage('✅ Task added')
      fetchTasks()
    }
  }

  async function toggleTask(id) {
    const task = tasks.find(t => t.id === id)
    const { error } = await supabase
      .from('tasks')
      .update({ done: !task.done, updated_at: new Date().toISOString() })
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

  // ========== SUBTASKS FUNCTIONS ==========
  const addSubTask = async (taskId) => {
    if (!newSubTask.trim()) return
    const currentSubtasks = subTasks[taskId] || []
    const updatedSubtasks = [...currentSubtasks, { id: Date.now().toString(), text: newSubTask.trim(), done: false }]
    
    const { error } = await supabase
      .from('tasks')
      .update({ subtasks: updatedSubtasks })
      .eq('id', taskId)
      .eq('user_id', user.id)
    
    if (!error) {
      setSubTasks(prev => ({ ...prev, [taskId]: updatedSubtasks }))
      setNewSubTask('')
      setMessage('✅ Subtask added')
    }
  }

  const toggleSubTask = async (taskId, subTaskId) => {
    const currentSubtasks = subTasks[taskId] || []
    const updatedSubtasks = currentSubtasks.map(st => 
      st.id === subTaskId ? { ...st, done: !st.done } : st
    )
    
    const { error } = await supabase
      .from('tasks')
      .update({ subtasks: updatedSubtasks })
      .eq('id', taskId)
      .eq('user_id', user.id)
    
    if (!error) {
      setSubTasks(prev => ({ ...prev, [taskId]: updatedSubtasks }))
    }
  }

  const deleteSubTask = async (taskId, subTaskId) => {
    const currentSubtasks = subTasks[taskId] || []
    const updatedSubtasks = currentSubtasks.filter(st => st.id !== subTaskId)
    
    const { error } = await supabase
      .from('tasks')
      .update({ subtasks: updatedSubtasks })
      .eq('id', taskId)
      .eq('user_id', user.id)
    
    if (!error) {
      setSubTasks(prev => ({ ...prev, [taskId]: updatedSubtasks }))
      setMessage('🗑️ Subtask deleted')
    }
  }

  // ========== JOURNAL FUNCTIONS ==========
  async function fetchJournal() {
    if (!user) return
    const { data, error } = await supabase
      .from('journal')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Fetch journal error:', error)
    } else {
      setJournalEntries(data || [])
    }
  }

  async function saveJournal() {
    if (!journalEntry.trim() || !user) return
    const { error } = await supabase
      .from('journal')
      .insert({
        user_id: user.id,
        content: journalEntry.trim(),
        date: new Date().toISOString().split('T')[0]
      })
    if (error) {
      setMessage('Error saving journal: ' + error.message)
    } else {
      setJournalEntry('')
      setMessage('✅ Journal entry saved!')
      fetchJournal()
    }
  }

  async function deleteJournalEntry(id) {
    const { error } = await supabase
      .from('journal')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      setMessage('🗑️ Entry deleted')
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
    setSelectedNotes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const exportNotesPDF = () => {
    const notesToExport = showExport ? notes.filter(n => selectedNotes.includes(n.id)) : notes
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
              new TextRun({ text: t.done ? '✓ ' : '☐ ', bold: true }),
              new TextRun({ text: t.content }),
              new TextRun({ text: ` [${t.category}]`, italics: true, size: 20 }),
              new TextRun({ text: t.category_tag && t.category_tag !== 'general' ? ` #${t.category_tag}` : '', italics: true, size: 20 })
            ]
          }))
        ]
      }]
    })
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `discypln-tasks.docx`)
    setMessage('✅ Word file exported!')
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

    const weekTasks = tasks.filter(t => {
      if (!t.done) return false
      const taskDate = new Date(t.updated_at || t.due_date)
      return taskDate >= startOfWeek && taskDate <= endOfWeek
    })

    const totalMins = weekTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)

    const categoryStats = {}
    weekTasks.forEach(t => {
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
      body: weekTasks.map(t => [
        new Date(t.updated_at || t.due_date).toLocaleDateString(),
        t.content,
        t.category_tag,
        formatMinutes(t.estimated_minutes)
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    })

    doc.save(`Discypln_Weekly_Tasks_${weekStr.replace(/\//g, '-')}.pdf`)
    setMessage('✅ Weekly report generated!')
  }

  // ========== FILTERED DATA ==========
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTasks = activeCategory === 'all'
    ? [...tasks].sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
    : tasks
      .filter(t => t.category === activeCategory)
      .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))

  // ========== THEME HELPERS ==========
  const theme = {
    bg: isDarkMode ? '#0a0a0a' : '#f0f0f0',
    bgCard: isDarkMode ? '#1a1a1a' : '#ffffff',
    bgCardHover: isDarkMode ? '#222' : '#f8f8f8',
    bgInput: isDarkMode ? '#111' : '#f5f5f5',
    text: isDarkMode ? '#fff' : '#1a1a1a',
    textSecondary: isDarkMode ? '#888' : '#666',
    textMuted: isDarkMode ? '#444' : '#bbb',
    border: isDarkMode ? '#2a2a2a' : '#e0e0e0',
    borderHover: isDarkMode ? '#2563eb' : '#2563eb',
    accent: '#2563eb',
    accentHover: '#1d4ed8',
    shadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.08)'
  }

  // ========== RENDER ==========
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.bg,
        color: theme.text,
        padding: '20px'
      }}>
        <div style={{
          background: theme.bgCard,
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          border: `1px solid ${theme.border}`,
          boxShadow: theme.shadow
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Discypln
          </h1>
          <p style={{
            textAlign: 'center',
            color: theme.textSecondary,
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            Stay focused. Stay disciplined.
          </p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${theme.border}`,
              background: theme.bgInput,
              color: theme.text,
              fontSize: '14px',
              marginBottom: '12px',
              outline: 'none'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${theme.border}`,
              background: theme.bgInput,
              color: theme.text,
              fontSize: '14px',
              marginBottom: '16px',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={signIn}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: theme.accent,
                color: '#fff',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'Sign In'}
            </button>
            <button
              onClick={signUp}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                background: 'transparent',
                color: theme.text,
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'Sign Up'}
            </button>
          </div>
          {message && (
            <p style={{
              marginTop: '16px',
              color: message.includes('✅') ? '#22c55e' : '#ef4444',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              {message}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        color: theme.text,
        padding: '20px',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
                <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={goBack}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.text,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: `1px solid ${theme.border}`,
                background: theme.bgInput,
                color: theme.text,
                fontSize: '12px'
              }}
            >
              {ALL_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <button
              onClick={translateNote}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: theme.accent,
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              🌍 Translate
            </button>
            <button
              onClick={saveNote}
              style={{
                padding: '8px 20px',
                borderRadius: '10px',
                border: 'none',
                background: '#22c55e',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Save
            </button>
          </div>
        </header>

        <div>
          {viewMode === 'add' && (
            <>
              <select
                value={titleFont}
                onChange={(e) => setTitleFont(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.bgInput,
                  color: theme.text,
                  marginBottom: '10px',
                  fontSize: '14px'
                }}
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
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.bgInput,
                  color: theme.text,
                  fontSize: '24px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  outline: 'none',
                  fontFamily: titleFont.includes(' ') ? `'${titleFont}', serif` : titleFont
                }}
              />
            </>
          )}
          {viewMode === 'edit' && (
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '12px',
              fontFamily: titleFont.includes(' ') ? `'${titleFont}', serif` : titleFont
            }}>
              {title}
            </h2>
          )}

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Start typing..."
            style={{
              width: '100%',
              minHeight: '300px',
              padding: '16px',
              borderRadius: '12px',
              border: `1px solid ${theme.border}`,
              background: detectedCode ? '#0d1117' : theme.bgInput,
              color: detectedCode ? '#c9d1d9' : theme.text,
              fontSize: fontSize + 'px',
              lineHeight: '1.8',
              fontFamily: detectedCode ? "'Courier New', monospace" : (fontFamily.includes(' ') ? `'${fontFamily}', serif` : fontFamily),
              outline: 'none',
              resize: 'vertical'
            }}
            autoFocus
          />
        </div>

        <nav style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px solid ${theme.border}`,
          flexWrap: 'wrap'
        }}>
          <button
            onClick={toggleMic}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              background: isListening ? '#dc2626' : 'transparent',
              color: isListening ? '#fff' : theme.text,
              cursor: 'pointer'
            }}
          >
            {isListening ? '⏹️ Stop' : '🎤 Voice'}
          </button>
          <button
            onClick={() => fileInputRef.current.click()}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.text,
              cursor: 'pointer'
            }}
          >
            📷 Scan
          </button>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              background: theme.bgInput,
              color: theme.text,
              fontSize: '13px'
            }}
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
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              background: theme.bgInput,
              color: theme.text,
              fontSize: '13px'
            }}
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
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  color: theme.text,
                  cursor: 'pointer'
                }}
              >
                Copy
              </button>
              <button
                onClick={() => deleteNote(editingNote.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
              <button
                onClick={shareNote}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.border}`,
                  background: 'transparent',
                  color: theme.text,
                  cursor: 'pointer'
                }}
              >
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
          <p style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '12px',
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            color: theme.text,
            boxShadow: theme.shadow,
            fontSize: '14px',
            zIndex: 9999
          }}>
            {message}
          </p>
        )}
      </div>
    )
  }

  // ========== MAIN DASHBOARD ==========
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      color: theme.text,
      padding: '20px',
      maxWidth: '1000px',
      margin: '0 auto',
      transition: 'all 0.3s ease'
    }}>
      
      {/* ===== TOP BAR ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Clock */}
        <div>
          <div style={{
            fontSize: '36px',
            fontWeight: '700',
            letterSpacing: '-0.5px',
            color: theme.text
          }}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.textSecondary,
            marginTop: '2px'
          }}>
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: `1px solid ${theme.border}`,
              background: theme.bgInput,
              color: theme.text,
              fontSize: '13px',
              outline: 'none',
              width: '140px',
              transition: 'all 0.3s'
            }}
          />
          
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              width: '52px',
              height: '28px',
              borderRadius: '14px',
              border: 'none',
              background: isDarkMode ? '#2a2a2a' : '#ddd',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.3s ease',
              flexShrink: 0
            }}
          >
            <div style={{
              position: 'absolute',
              top: '3px',
              left: isDarkMode ? '26px' : '3px',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: isDarkMode ? '#f59e0b' : '#2563eb',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              {isDarkMode ? '🌙' : '☀️'}
            </div>
          </button>

          <button
            onClick={signOut}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.textSecondary,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ===== CAPSULE NAVIGATION ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '28px'
      }}>
        <div style={{
          display: 'flex',
          background: theme.bgCard,
          borderRadius: '30px',
          padding: '4px',
          gap: '4px',
          border: `1px solid ${theme.border}`
        }}>
          {[
            { id: 'notes', label: ' Notes' },
            { id: 'tasks', label: ' Tasks' },
            { id: 'journal', label: ' Journal' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'journal') fetchJournal()
              }}
              style={{
                padding: '10px 28px',
                borderRadius: '24px',
                border: 'none',
                background: activeTab === tab.id 
                  ? (isDarkMode ? '#2a2a2a' : '#e8e8e8')
                  : 'transparent',
                color: activeTab === tab.id 
                  ? (isDarkMode ? '#fff' : '#1a1a1a')
                  : (isDarkMode ? '#666' : '#999'),
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === tab.id 
                  ? (isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.1)')
                  : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    {/* ===== POMODORO & STATS DASHBOARD - SINGLE COLUMN ===== */}
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  marginBottom: '20px'
}}>
  {/* Pomodoro Card */}
  <div style={{
    background: theme.bgCard,
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${theme.border}`
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ 
          fontSize: '12px', 
          color: theme.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: '600'
        }}>
          {isBreak ? '☕ Break' : '🍅 Focus'}
        </div>
        <div style={{
          fontSize: '48px',
          fontWeight: '700',
          color: theme.text,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: '1.1',
          marginTop: '4px'
        }}>
          {formatTime(pomodoroTime)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={togglePomodoro}
          style={{
            padding: '10px 24px',
            borderRadius: '12px',
            border: 'none',
            background: pomodoroRunning ? '#ef4444' : '#22c55e',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          {pomodoroRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button
          onClick={resetPomodoro}
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
            background: 'transparent',
            color: theme.textSecondary,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ↺
        </button>
      </div>
    </div>
    
    {/* Progress Bar */}
    <div style={{
      marginTop: '14px',
      height: '4px',
      background: isDarkMode ? '#2a2a2a' : '#e0e0e0',
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${((25 * 60 - pomodoroTime) / (25 * 60)) * 100}%`,
        height: '100%',
        background: pomodoroRunning 
          ? (isBreak ? '#f59e0b' : '#22c55e')
          : isDarkMode ? '#444' : '#ccc',
        transition: 'width 1s linear',
        borderRadius: '4px'
      }} />
    </div>
    
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '13px',
      color: theme.textMuted,
      marginTop: '8px'
    }}>
      <span>{pomodoroSessions} sessions completed</span>
      <span>{formatMinutes(totalMinutes)} total</span>
    </div>
  </div>

  {/* Stats Card - Single Row */}
  <div style={{
    background: theme.bgCard,
    borderRadius: '16px',
    padding: '20px 24px',
    border: `1px solid ${theme.border}`
  }}>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px'
    }}>
      <div style={{
        background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
        padding: '14px 12px',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{streak}</div>
        <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>🔥 Streak</div>
      </div>
      <div style={{
        background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
        padding: '14px 12px',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>{formatMinutes(totalMinutes)}</div>
        <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>⏱️ Focus Time</div>
      </div>
      <div style={{
        background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
        padding: '14px 12px',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#34d399' }}>{tasks.filter(t => t.done).length}</div>
        <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>✅ Done</div>
      </div>
      <div style={{
        background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
        padding: '14px 12px',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#a78bfa' }}>{weeklyScore}%</div>
        <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>📊 Weekly</div>
      </div>
    </div>
  </div>
</div>

{/* ===== HEATMAP - FIXED TO FIT CARD ===== */}
<div style={{
  background: theme.bgCard,
  borderRadius: '16px',
  padding: '20px 24px',
  border: `1px solid ${theme.border}`,
  marginBottom: '16px'
}}>
  <div style={{ 
    fontSize: '14px', 
    fontWeight: '600', 
    color: theme.text, 
    marginBottom: '12px'
  }}>
    📊 Heatmap
    <span style={{ 
      fontSize: '12px', 
      fontWeight: '400', 
      color: theme.textMuted,
      marginLeft: '8px'
    }}>
      {tasks.filter(t => t.done).length} tasks done in last 30 days
    </span>
  </div>
  
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gap: '4px',
    maxWidth: '100%',
    width: '100%'
  }}>
    {Array.from({length: 30}).map((_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      const dateStr = date.toISOString().split('T')[0]

      const dayTasks = tasks.filter(t => {
        if (!t.done) return false
        const taskDate = new Date(t.updated_at || t.due_date).toISOString().split('T')[0]
        return taskDate === dateStr
      })

      const minutes = dayTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
      const intensity = minutes === 0 ? 0 : minutes < 30 ? 1 : minutes < 60 ? 2 : minutes < 120 ? 3 : 4
      const colors = ['#1a1a1a', '#0e4429', '#006d32', '#26a641', '#39d353']

      return (
        <div
          key={dateStr}
          title={`${dateStr}: ${dayTasks.length} tasks, ${formatMinutes(minutes)}`}
          style={{
            aspectRatio: '1',
            background: colors[intensity],
            border: `1px solid ${isDarkMode ? '#2a2a2a' : '#e0e0e0'}`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            color: intensity > 2 ? '#fff' : (isDarkMode ? '#666' : '#999'),
            cursor: 'default',
            transition: 'all 0.2s'
          }}
        >
          {date.getDate()}
        </div>
      )
    })}
  </div>
  
  <div style={{
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    marginTop: '10px',
    fontSize: '10px',
    color: theme.textMuted
  }}>
    <span>Less</span>
    <div style={{ width: '16px', height: '16px', background: '#1a1a1a', border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`, borderRadius: '3px' }}></div>
    <div style={{ width: '16px', height: '16px', background: '#0e4429', border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`, borderRadius: '3px' }}></div>
    <div style={{ width: '16px', height: '16px', background: '#006d32', border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`, borderRadius: '3px' }}></div>
    <div style={{ width: '16px', height: '16px', background: '#26a641', border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`, borderRadius: '3px' }}></div>
    <div style={{ width: '16px', height: '16px', background: '#39d353', border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`, borderRadius: '3px' }}></div>
    <span>More</span>
  </div>
</div>

{/* ===== FAILED DAYS ===== */}
{failedDays.length > 0 && (
  <div style={{
    background: theme.bgCard,
    borderRadius: '16px',
    padding: '16px 20px',
    border: `1px solid #dc2626`,
    marginBottom: '16px'
  }}>
    <div style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', marginBottom: '4px' }}>
      ⚠️ Failed Days This Week
    </div>
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {failedDays.map(day => (
        <span key={day.date} style={{ fontSize: '13px', color: theme.textSecondary }}>
          {formatDate(day.date)}: {day.completed}/{day.total} habits
        </span>
      ))}
    </div>
  </div>
)}
  
      {/* ===== CONTENT AREA ===== */}
      <div style={{
        background: theme.bgCard,
        borderRadius: '20px',
        padding: '24px',
        border: `1px solid ${theme.border}`,
        minHeight: '400px',
        transition: 'all 0.3s ease'
      }}>

        {/* ===== NOTES TAB ===== */}
        {activeTab === 'notes' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: 0,
                color: theme.text
              }}>
                📝 Notes
                <span style={{
                  fontSize: '13px',
                  color: theme.textMuted,
                  marginLeft: '10px',
                  fontWeight: '400'
                }}>
                  {notes.length}
                </span>
              </h2>
              <button
                onClick={openAddNote}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: 'none',
                  background: theme.accent,
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                + New Note
              </button>
            </div>

            {filteredNotes.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px'
              }}>
                {filteredNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => openEditNote(note)}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                      border: `1px solid ${theme.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.borderColor = theme.borderHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.borderColor = theme.border
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '6px'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: 0,
                        color: theme.text
                      }}>
                        {note.title || 'Untitled'}
                      </h4>
                      <span style={{
                        fontSize: '9px',
                        padding: '1px 10px',
                        borderRadius: '12px',
                        background: note.priority === 'high' ? '#dc2626' :
                                   note.priority === 'medium' ? '#f59e0b' : '#22c55e',
                        color: '#fff',
                        flexShrink: 0
                      }}>
                        {note.priority}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: theme.textSecondary,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: '1.5'
                    }}>
                      {note.content || 'No content'}
                    </p>
                    <div style={{
                      marginTop: '10px',
                      fontSize: '11px',
                      color: theme.textMuted,
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                                            <span>{formatDate(note.date)}</span>
                      <span>{formatNoteTime(note.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: theme.textMuted
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <p style={{ fontSize: '16px', margin: 0 }}>No notes yet</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>Create your first note</p>
              </div>
            )}
          </div>
        )}

        {/* ===== TASKS TAB ===== */}
        {activeTab === 'tasks' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: 0,
                color: theme.text
              }}>
                ✅ Tasks
                <span style={{
                  fontSize: '13px',
                  color: theme.textMuted,
                  marginLeft: '10px',
                  fontWeight: '400'
                }}>
                  {tasks.filter(t => t.done).length}/{tasks.length} done
                </span>
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={exportTasksWord}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    border: `1px solid ${theme.border}`,
                    background: 'transparent',
                    color: theme.textSecondary,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Export
                </button>
                <button
                  onClick={exportWeeklyReport}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: theme.accent,
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Weekly Report
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              {['all', 'daily', 'weekly', 'custom'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: activeCategory === cat 
                      ? `1px solid ${theme.accent}`
                      : `1px solid ${theme.border}`,
                    background: activeCategory === cat 
                      ? (isDarkMode ? '#1a3a5c' : '#e8f0fe')
                      : 'transparent',
                    color: activeCategory === cat 
                      ? (isDarkMode ? '#60a5fa' : theme.accent)
                      : theme.textSecondary,
                    fontSize: '12px',
                    fontWeight: activeCategory === cat ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Task Input */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <input
                value={task}
                onChange={e => setTask(e.target.value)}
                placeholder="Add a task..."
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.bgInput,
                  color: theme.text,
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <select
                value={taskCategory}
                onChange={e => setTaskCategory(e.target.value)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.border}`,
                  background: theme.bgInput,
                  color: theme.text,
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">One-time</option>
              </select>
              <button
                onClick={addTask}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: theme.accent,
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
            </div>

            {/* Task List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredTasks.length > 0 ? (
                filteredTasks.map(t => {
                  const taskSubtasks = subTasks[t.id] || []
                  const completedSubtasks = taskSubtasks.filter(st => st.done).length
                  const isExpanded = activeTaskId === t.id

                  return (
                    <div
                      key={t.id}
                      style={{
                        background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                        borderRadius: '14px',
                        border: `1px solid ${theme.border}`,
                        overflow: 'hidden',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px'
                      }}>
                        <input
                          type="checkbox"
                          checked={t.done}
                          onChange={() => toggleTask(t.id)}
                          style={{
                            width: '20px',
                            height: '20px',
                            accentColor: theme.accent,
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            color: t.done ? theme.textMuted : theme.text,
                            textDecoration: t.done ? 'line-through' : 'none'
                          }}>
                            {t.content}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {t.difficulty && (
                              <span style={{
                                fontSize: '9px',
                                padding: '1px 10px',
                                borderRadius: '12px',
                                background: t.difficulty === 'hard' ? '#dc2626' :
                                           t.difficulty === 'medium' ? '#f59e0b' : '#22c55e',
                                color: '#fff'
                              }}>
                                {t.difficulty}
                              </span>
                            )}
                            {t.estimated_minutes && (
                              <span style={{
                                fontSize: '9px',
                                padding: '1px 10px',
                                borderRadius: '12px',
                                background: isDarkMode ? '#2a2a2a' : '#e8e8e8',
                                color: theme.textSecondary
                              }}>
                                {t.estimated_minutes}m
                              </span>
                            )}
                            {t.category_tag && t.category_tag !== 'general' && (
                              <span style={{
                                fontSize: '9px',
                                padding: '1px 10px',
                                borderRadius: '12px',
                                background: isDarkMode ? '#1a3a5c' : '#e8f0fe',
                                color: isDarkMode ? '#60a5fa' : theme.accent
                              }}>
                                #{t.category_tag}
                              </span>
                            )}
                            {t.time && (
                              <span style={{
                                fontSize: '9px',
                                padding: '1px 10px',
                                borderRadius: '12px',
                                background: isDarkMode ? '#2a1a1a' : '#fde8e8',
                                color: isDarkMode ? '#f87171' : '#dc2626'
                              }}>
                                {t.time}
                              </span>
                            )}
                            {taskSubtasks.length > 0 && (
                              <span style={{
                                fontSize: '9px',
                                padding: '1px 10px',
                                borderRadius: '12px',
                                background: isDarkMode ? '#1a1a3a' : '#e8e8f0',
                                color: isDarkMode ? '#818cf8' : '#4f46e5'
                              }}>
                                📋 {completedSubtasks}/{taskSubtasks.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTaskId(isExpanded ? null : t.id)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'transparent',
                            color: theme.textSecondary,
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                        <button
                          onClick={() => deleteTask(t.id)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'transparent',
                            color: theme.textMuted,
                            cursor: 'pointer',
                            fontSize: '18px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = theme.textMuted}
                        >
                          ×
                        </button>
                      </div>

                      {/* Subtasks Section */}
                      {isExpanded && (
                        <div style={{
                          padding: '12px 16px',
                          borderTop: `1px solid ${theme.border}`,
                          background: isDarkMode ? '#111' : '#fafafa'
                        }}>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <input
                              value={newSubTask}
                              onChange={(e) => setNewSubTask(e.target.value)}
                              placeholder="Add subtask..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addSubTask(t.id)
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: `1px solid ${theme.border}`,
                                background: theme.bgInput,
                                color: theme.text,
                                fontSize: '13px',
                                outline: 'none'
                              }}
                            />
                            <button
                              onClick={() => addSubTask(t.id)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: 'none',
                                background: theme.accent,
                                color: '#fff',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Add
                            </button>
                          </div>
                          {taskSubtasks.length > 0 ? (
                            taskSubtasks.map(st => (
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
                                    accentColor: theme.accent,
                                    cursor: 'pointer'
                                  }}
                                />
                                <span style={{
                                  fontSize: '13px',
                                  color: st.done ? theme.textMuted : theme.text,
                                  textDecoration: st.done ? 'line-through' : 'none',
                                  flex: 1
                                }}>
                                  {st.text}
                                </span>
                                <button
                                  onClick={() => deleteSubTask(t.id, st.id)}
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: theme.textMuted,
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = theme.textMuted}
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          ) : (
                            <p style={{
                              fontSize: '13px',
                              color: theme.textMuted,
                              margin: 0,
                              textAlign: 'center'
                            }}>
                              No subtasks yet
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: theme.textMuted
                }}>
                  No tasks in this category
                </div>
              )}
            </div>
          </div>
        )}

                {/* ===== JOURNAL TAB ===== */}
        {activeTab === 'journal' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: 0,
                color: theme.text
              }}>
                📖 Journal
                <span style={{
                  fontSize: '13px',
                  color: theme.textMuted,
                  marginLeft: '10px',
                  fontWeight: '400'
                }}>
                  {journalEntries.length} entries
                </span>
              </h2>
            </div>

            {/* Journal Entry Input */}
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
              borderRadius: '14px',
              border: `1px solid ${theme.border}`
            }}>
              <textarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="What's on your mind today? ✍️"
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.border}`,
                  background: theme.bgInput,
                  color: theme.text,
                  fontSize: '14px',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '10px',
                gap: '8px'
              }}>
                <button
                  onClick={() => setJournalEntry('')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${theme.border}`,
                    background: 'transparent',
                    color: theme.textSecondary,
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={saveJournal}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: theme.accent,
                    color: '#fff',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Save Entry 💾
                </button>
              </div>
            </div>

            {/* Journal Entries List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {journalEntries.length > 0 ? (
                journalEntries.map(entry => (
                  <div
                    key={entry.id}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                      border: `1px solid ${theme.border}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: theme.textMuted
                      }}>
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                      <button
                        onClick={() => deleteJournalEntry(entry.id)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'transparent',
                          color: theme.textMuted,
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = theme.textMuted}
                      >
                        ×
                      </button>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      lineHeight: '1.6',
                      margin: 0,
                      color: theme.text,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {entry.content}
                    </p>
                  </div>
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: theme.textMuted
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>📖</div>
                  <p style={{ fontSize: '14px', margin: 0 }}>No journal entries yet</p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>Write your first entry above</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== MESSAGE TOAST ===== */}
      {message && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          borderRadius: '12px',
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          color: theme.text,
          boxShadow: theme.shadow,
          fontSize: '14px',
          zIndex: 9999,
          animation: 'fadeInUp 0.3s ease'
        }}>
          {message}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: ${theme.bg};
        }
        ::-webkit-scrollbar-thumb {
          background: ${theme.border};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme.textMuted};
        }
      `}</style>
    </div>
  )
}

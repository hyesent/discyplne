import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Tesseract from 'tesseract.js'
import './index.css'
import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'
import autoTable from 'jspdf-autotable'

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
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)

  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [editingNote, setEditingNote] = useState(null)
  const [viewMode, setViewMode] = useState('home')
  const [detectedCode, setDetectedCode] = useState(null)

  const [task, setTask] = useState('')
  const [tasks, setTasks] = useState([])
  const [taskCategory, setTaskCategory] = useState('daily')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskTime, setTaskTime] = useState('')
  const [taskWeekDay, setTaskWeekDay] = useState('monday')
  const [taskDifficulty, setTaskDifficulty] = useState('medium')
  const [taskMinutes, setTaskMinutes] = useState(30)
  const [taskTag, setTaskTag] = useState('general')
  const [editingTask, setEditingTask] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [targetLang, setTargetLang] = useState("fr")
  const [message, setMessage] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')

  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [pomodoroSessions, setPomodoroSessions] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0) // FIX 1: Added missing state

  const [showExport, setShowExport] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState([])

  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState('16')
  const [titleFont, setTitleFont] = useState('Inter')
  const formatMinutes = (mins) => {
    if (!mins || mins === 0) return '0m'
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [message])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user?? null)
      if (session?.user) {
        fetchNotes()
        fetchTasks()
        fetchPomodoroStats()
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user?? null)
      if (session?.user) {
        fetchNotes()
        fetchTasks()
        fetchPomodoroStats()
      }
    })
    return () => subscription.unsubscribe()
  }, []) // FIX 2: Added missing closing )

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
    if (pomodoroRunning) {
      interval = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            handlePomodoroComplete()
            return isBreak? 1500 : 300
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [pomodoroRunning, isBreak])

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

      setNoteText(prev => prev + (prev ? ` : ` : '') + processedText)
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

  async function fetchPomodoroStats() {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('pomodoro_sessions').select('*').eq('date', today).eq('user_id', user.id)
    if (data && data[0]) {
      setPomodoroSessions(data[0].sessions_completed || 0)
      setTotalMinutes(data[0].total_minutes || 0)
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
    setViewMode('home')
  }

  async function saveNote() {
    if (!title.trim() ||!noteText.trim()) {
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
      const { error } = await supabase.from('notes').update(noteData).eq('id', editingNote.id).eq('user_id', user.id)
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
      const { error } = await supabase.from('notes').insert([noteData])
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
    const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', user.id)
    if (error) setMessage('Delete failed: ' + error.message)
    else {
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
        await navigator.share({ title: editingNote.title, text: shareText })
        setMessage('✅ Note shared!')
      } catch (err) {
        if (err.name!== 'AbortError') setMessage('Sharing failed')
      }
    } else {
      navigator.clipboard.writeText(shareText)
      setMessage('📋 Copied instead')
    }
  }

  async function addTask() {
    if (!task.trim() ||!user) return
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
      weekday: taskCategory === 'weekly'? taskWeekDay : null,
      time: taskCategory === 'daily'? taskTime : null,
      due_date: dueDate,
      difficulty: taskDifficulty,
      estimated_minutes: taskMinutes,
      category_tag: taskTag,
      done: false
    })

    if (error) setMessage('Error adding task: ' + error.message)
    else {
      setTask('')
      setTaskTime('')
      setTaskDueDate('')
      setTaskMinutes(30)
      setTaskTag('general')
      setMessage('✅ Added')
      fetchTasks()
    }
  }

  async function toggleTask(id) {
    const task = tasks.find(t => t.id === id)
    const { error } = await supabase.from('tasks').update({ done:!task.done, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id)
    if (!error) fetchTasks()
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id)
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

  const formatNoteTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const togglePomodoro = () => setPomodoroRunning(!pomodoroRunning)
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

  async function translateNote() {
    if (!noteText.trim()) {
      setMessage("Note empty. Type something first.")
      return
    }
    setLoading(true)
    setMessage("🌍 Translating...")
    const textToTranslate = noteText.trim()
    const langName = ALL_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang

    try {
      const res = await fetch("https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: textToTranslate,
          parameters: { src_lang: "eng_Latn", tgt_lang: getNLLBLangCode(targetLang) }
        })
      })
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

    setMessage("🌍 Trying LibreTranslate...")
    try {
      const response = await fetch("https://libretranslate.com/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: textToTranslate, source: "auto", target: targetLang, format: "text" })
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

    setMessage("❌ Translation failed")
    setLoading(false)
  }

  const toggleSelect = (id) => {
    setSelectedNotes(prev => prev.includes(id)? prev.filter(x => x!== id) : [...prev, id])
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
          new Paragraph({ children: [new TextRun({ text: `Discypln Tasks`, bold: true, size: 32 })] }),
         ...tasks.map(t => new Paragraph({
            children: [
              new TextRun({ text: t.done? '✓ ' : '☐ ', bold: true }),
              new TextRun({ text: t.content }),
              new TextRun({ text: ` [${t.category}]`, italics: true, size: 20 }),
              new TextRun({ text: t.category_tag && t.category_tag!== 'general'? ` #${t.category_tag}` : '', italics: true, size: 20 })
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

    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Discypln Weekly Report - Tasks', 14, 20)
    doc.setFontSize(12)
    doc.text(`Week: ${weekStr}`, 14, 30)
    doc.text(`Tasks Completed: ${weekTasks.length}`, 14, 38)
    doc.text(`Total Focus Time: ${formatMinutes(totalMins)}`, 14, 46)
    doc.text(`Current Streak: ${streak} days`, 14, 54)

    autoTable(doc, {
      startY: 64,
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

  // FIX 3: getStreak function now INSIDE component
  const getStreak = () => {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayHabits = tasks.filter(t => t.type === 'habit' && t.due_date === dateStr)
      if (dayHabits.length === 0) continue
      const dayCompleted = dayHabits.filter(t => t.done).length
      if (dayCompleted === dayHabits.length && dayHabits.length > 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  }
  const streak = getStreak()

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
  const todayStr = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter(t => t.due_date === todayStr || (t.category === 'daily' && t.type === 'habit'))
  const todayCompleted = todayTasks.filter(t => t.done).length
  const todayScore = todayTasks.length > 0? Math.round((todayCompleted / todayTasks.length) * 100) : 0

  const weeklyTasks = tasks.filter(t => t.due_date && weekDays.includes(t.due_date))
  const weeklyCompleted = weeklyTasks.filter(t => t.done).length
  const weeklyScore = weeklyTasks.length > 0? Math.round((weeklyCompleted / weeklyTasks.length) * 100) : 0

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

  const filteredTasks = activeCategory === 'all'
   ? [...tasks].sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
    : tasks.filter(t => t.category === activeCategory).sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  )
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
          {message && <p className={`message ${message.includes('✅')? 'success' : 'error'}`}>{message}</p>}
        </div>
        <footer className="auth-footer">©️ Hyesent.dev</footer>
      </div>
    )
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="editor-page">
        <header className="editor-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', gap:'8px'}}>
          <button onClick={goBack} style={{flex:'0 0 auto'}}>{'<'}</button>
          <div style={{display:'flex', gap:'4px', flex:'1 1 auto', justifyContent:'center', maxWidth:'200px'}}>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              style={{background:'#1a1a1a', color:'#fff', border:'1px solid #333', padding:'4px 6px', borderRadius:'6px', fontSize:'11px', flex:'1'}}
            >
              {ALL_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <button onClick={translateNote} style={{padding:'4px 8px', fontSize:'14px'}}>🌍</button>
          </div>
          <button onClick={saveNote} style={{flex:'0 0 auto'}}>Save</button>
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
                <>
                  <select value={titleFont}
                    onChange={(e) => setTitleFont(e.target.value)}
                    style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '6px', borderRadius: '6px', marginBottom: '8px', width: '100%' }}
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
                    className="title-input"
                    style={{ fontFamily: titleFont.includes(' ')? `'${titleFont}', serif` : titleFont, fontSize: '24px', fontWeight: '600' }}
                  />
                </>
              )}
              {viewMode === 'edit' && <h3 className="note-title-display" style={{ fontFamily: titleFont.includes(' ')? `'${titleFont}', serif` : titleFont, fontSize: '24px' }}>{title}</h3>}

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Start typing..."
                className="content-editor"
                style={{
                  fontFamily: detectedCode? "'Courier New', monospace" : (fontFamily.includes(' ')? `'${fontFamily}', serif` : fontFamily),
                  fontSize: fontSize + 'px',
                  lineHeight: '1.6',
                  background: detectedCode? '#0d1117' : undefined,
                  color: detectedCode? '#c9d1d9' : undefined
                }}
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
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '6px 8px', borderRadius: '6px' }}>
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
              <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '6px 8px', borderRadius: '6px', marginLeft: '6px' }}>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
              </select>
            </>
          ) : (
            <>
              <button onClick={() => navigator.clipboard.writeText(noteText)}>Copy</button>
              <button onClick={() => deleteNote(editingNote.id)}>Delete</button>
              <button onClick={shareNote}>Share</button>
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '6px 8px', borderRadius: '6px' }}>
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
              <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333', padding: '6px 8px', borderRadius: '6px', marginLeft: '6px' }}>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
              </select>
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y1="12" />
          </svg>
        </button>
      </header>

      <div className="notes-header">
        <span>Notes</span>
        <span>| {notes.length} Notes |</span>
        <button onClick={openAddNote}>+ Add Note</button>
      </div>

      <input
        type="text"
        placeholder="Search notes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="input"
        style={{ marginTop: '12px', marginBottom: '16px' }}
      />

      {loading && <p className="loading">Loading...</p>}
      {filteredNotes.length === 0 && !loading && <p className="empty">No notes for this date</p>}

      {filteredNotes.map(note => (
        <div key={note.id} className={`note-summary priority-${note.priority}`} onClick={() => openEditNote(note)}>
          <h4>{note.title}</h4>
          <small>{formatNoteTime(note.created_at)} • {note.priority}</small>
        </div>
      ))}

      <h3 className="section-title">Tasks</h3>
      <div className="category-tabs">
        {['all', 'daily', 'weekly', 'custom'].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`btn tab ${activeCategory === cat? 'active' : ''}`}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="tasks-list">
        {filteredTasks.map(t => (
          <div key={t.id} className="task-item">
            <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
            <span className={t.done? 'done' : ''}>{t.content}</span>
            <button onClick={() => deleteTask(t.id)} className="btn-delete">×</button>
          </div>
        ))}
      </div>

      {message && <p className={`message ${message.includes('✅')? 'success' : 'error'}`}>{message}</p>}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
    </div>
  )
        }
  

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

// CODE DETECTION HELPER
const detectCodeLanguage = (text) => {
  if (!text) return null

  const patterns = {
    'JavaScript/React': /import.*from|useState|useEffect|export default|const.*=.*=>|return\s*\(/,
    'Python': /def |import |print\(|if __name__|elif |:\s*$/m,
    'HTML': /<html|<div|<body|<script|<style|<!DOCTYPE/,
    'CSS': /{[\s\S]*:[\s\S]*}|@media|#[\w-]+\s*{|\.[\w-]+\s*{/,
    'Java': /public class|System\.out|public static void main/,
    'C/C++': /#include|int main\(|std::|cout\s*<</,
    'SQL': /SELECT.* FROM|INSERT INTO|CREATE TABLE|UPDATE.* SET/i,
    'JSON': /^\s*{[\s\S]*}\s*$/m,
    'Shell/Bash': /#!\/bin\/bash|echo |npm |git |cd |ls /,
    'PHP': /<\?php|\$\w+\s*=|echo\s+/
  }

  for (const [lang, regex] of Object.entries(patterns)) {
    if (regex.test(text)) return lang
  }

  if (text.includes('{') && text.includes('}') && text.includes(';')) return 'Code'
  return null
}

export default function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedCode, setDetectedCode] = useState(null)
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
  const [taskDifficulty, setTaskDifficulty] = useState('medium')
  const [taskMinutes, setTaskMinutes] = useState(30)
  const [taskTag, setTaskTag] = useState('general')
  const [editingTask, setEditingTask] = useState(null)
  const formatMinutes = (mins) => {
    if (!mins || mins === 0) return '0m'
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }
  const [activeCategory, setActiveCategory] = useState('all')
  const [targetLang, setTargetLang] = useState("fr")

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
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // AUTO-DETECT CODE
  useEffect(() => {
    const codeType = detectCodeLanguage(noteText)
    if (codeType && noteText.length > 50) {
      setDetectedCode(codeType)
      if (!message.includes('detected')) {
        setMessage(`💻 ${codeType} detected`)
      }
    } else {
      setDetectedCode(null)
    }
  }, [noteText])

  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')

  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [pomodoroSessions, setPomodoroSessions] = useState(0)

  const [showExport, setShowExport] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState([])

  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState('16')
  const [titleFont, setTitleFont] = useState('Inter')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?? null)
    })
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
    if (pomodoroRunning) {
      interval = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            if (isBreak) {
              setIsBreak(false)
              setPomodoroSessions(prev => prev + 1)
              return 25 * 60
            } else {
              setIsBreak(true)
              return 5 * 60
            }
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

      setNoteText(prev => prev + (prev? ' ' : '') + processedText)
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
        await fetchNotes()
        setViewMode('list')
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
        await fetchNotes()
        setViewMode('list')
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
      await fetchNotes()
      setViewMode('list')
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
        if (err.name!== 'AbortError') {
          setMessage('Sharing failed')
        }
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

    if (error) {
      setMessage('Error adding task: ' + error.message)
    } else {
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

  const formatNoteTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const togglePomodoro = () => {
    setPomodoroRunning(!pomodoroRunning)
  }

  const resetPomodoro = () => {
    setPomodoroRunning(false)
    setIsBreak(false)
    setPomodoroTime(25 * 60)
  }

  // TRANSLATION WITH 4 APIs: Lingva -> LibreTranslate -> Google Free -> MyMemory
  async function translateNote() {
    if (!noteText.trim()) {
      setMessage("Note empty. Type something first.")
      return
    }

    setLoading(true)
    setMessage("🌍 Translating...")

    // 1. Try Lingva - best limits 10k chars
    try {
      const res = await fetch(`https://lingva.ml/api/v1/en/${targetLang}/${encodeURIComponent(noteText)}`)
      const data = await res.json()
      if (data.translation) {
        setNoteText(data.translation)
        const langName = ALL_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang
        setMessage(`✅ Translated to ${langName}!`)
        setLoading(false)
        return
      }
    } catch {}

    // 2. Try LibreTranslate
    try {
      const res = await fetch(`https://libretranslate.de/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: noteText, source: "en", target: targetLang })
      })
      const data = await res.json()
      if (data.translatedText) {
        setNoteText(data.translatedText)
        const langName = ALL_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang
        setMessage(`✅ Translated to ${langName}!`)
        setLoading(false)
        return
      }
    } catch {}

    // 3. Try Google Free via proxy
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(noteText)}`
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      const res = await fetch(proxyUrl)
      const data = await res.json()
      const parsed = JSON.parse(data.contents)
      const translated = parsed[0].map(item => item[0]).join('')

      if (translated) {
        setNoteText(translated)
        const langName = ALL_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang
        setMessage(`✅ Translated to ${langName}!`)
        setLoading(false)
        return
      }
    } catch {}

    // 4. Try MyMemory as last resort
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(noteText)}&langpair=en|${targetLang}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        setNoteText(data.responseData.translatedText)
        const langName = ALL_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang
        setMessage(`✅ Translated to ${langName}!`)
      } else if (data.responseStatus === 403) {
        setMessage("⚠️ Translation limit reached. Try shorter text.")
      } else {
        setMessage("❌ All translators failed. Text too long or service down.")
      }
    } catch (e) {
      setMessage("❌ No internet: " + e.message)
    }
    setLoading(false)
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

  const exportWeeklyReport = async () => {
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    startOfWeek.setHours(0,0,0,0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23,59,59,999)

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
      if (!categoryStats[cat]) categoryStats[cat] = {count: 0, mins: 0}
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
  }

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

  const totalMinutes = tasks.filter(t => t.done).reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)

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

  const filteredTasks =
    activeCategory === 'all'
    ? [...tasks].sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
      : tasks
      .filter(t => t.category === activeCategory)
      .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))

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
          {message && <p className="message error">{message}</p>}
        </div>
        <footer className="auth-footer">©️ Hyesent.dev</footer>
      </div>
    )
  }

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="editor-page">
        <header className="editor-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', gap:
        '8px'}}>
          <button onClick={goBack} className="btn-icon">←</button>
          <h1 className="editor-title">{viewMode === 'add' ? 'New Note' : 'Edit Note'}</h1>
          <div style={{display:'flex', gap:'8px'}}>
            {editingNote && <button onClick={shareNote} className="btn-icon">📤</button>}
            <button onClick={saveNote} disabled={loading} className="btn primary">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </header>

        <div className="editor-body" style={{padding:'16px', display:'flex', flexDirection:'column', gap:'12px'}}>
          <input
            type="text"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
            style={{
              fontFamily: titleFont,
              fontSize: '24px',
              fontWeight: '600',
              border: 'none',
              outline: 'none',
              background: 'transparent'
            }}
            autoFocus
          />

          <div className="toolbar" style={{display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center'}}>
            <button onClick={toggleMic} className={`btn ${isListening ? 'listening' : ''}`}>
              {isListening ? '🔴 Stop' : '🎤 Speak'}
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="btn">
              {isProcessing ? '📸 Processing...' : '📸 OCR'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="select">
              {ALL_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            <button onClick={translateNote} disabled={loading} className="btn">🌍 Translate</button>

            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="select">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="select">
              <option value="Inter">Inter</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier</option>
              <option value="Comic Sans MS">Comic Sans</option>
            </select>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              min="12"
              max="32"
              className="input"
              style={{width:'70px'}}
            />
          </div>

          <div style={{position:'relative', flex:1}}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Start typing... or paste code"
              className="content-editor"
              style={{
                fontFamily: detectedCode ? "'Courier New', monospace" : fontFamily,
                fontSize: fontSize + 'px',
                lineHeight: '1.6',
                background: detectedCode ? '#0d1117' : undefined,
                color: detectedCode ? '#c9d1d9' : undefined,
                width: '100%',
                minHeight: '60vh',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                resize: 'vertical'
              }}
            />
            {detectedCode && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#238636',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'sans-serif',
                pointerEvents: 'none'
              }}>
                {detectedCode}
              </div>
            )}
          </div>

          {message && (
            <p className={`message ${message.includes('❌') || message.includes('Error') ? 'error' : ''}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1 className="logo">Discypln</h1>
          <div className="time">{currentTime.toLocaleTimeString()}</div>
          <button onClick={signOut} className="btn">Sign Out</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{todayScore}%</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{weeklyScore}%</div>
            <div className="stat-label">This Week</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{streak}</div>
            <div className="stat-label">Streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatMinutes(totalMinutes)}</div>
            <div className="stat-label">Total Time</div>
          </div>
        </div>

        <div className="pomodoro">
          <div className="pomodoro-display">{formatTime(pomodoroTime)}</div>
          <div className="pomodoro-label">{isBreak ? 'Break' : 'Focus'} • Session {pomodoroSessions + 1}</div>
          <div className="pomodoro-controls">
            <button onClick={togglePomodoro} className="btn primary">
              {pomodoroRunning ? '⏸️ Pause' : '▶️ Start'}
            </button>
            <button onClick={resetPomodoro} className="btn">Reset</button>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="section">
          <div className="section-header">
            <h2>Notes - {formatDate(selectedDate)}</h2>
            <div className="section-actions">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
              <button onClick={openAddNote} className="btn primary">+ New Note</button>
              <button onClick={() => setShowExport(!showExport)} className="btn">📤 Export</button>
            </div>
          </div>

          {showExport && (
            <div className="export-panel">
              <p>Select notes to export:</p>
              <div className="note-checkboxes">
                {notes.map(note => (
                  <label key={note.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedNotes.includes(note.id)}
                      onChange={() => toggleSelect(note.id)}
                    />
                    {note.title}
                  </label>
                ))}
              </div>
              <button onClick={exportNotesPDF} className="btn primary">Export Selected to PDF</button>
              <button onClick={() => {setShowExport(false); setSelectedNotes([])}} className="btn">Cancel</button>
            </div>
          )}

          <input
            type="text"
            placeholder="🔍 Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />

          {loading ? (
            <p className="message">Loading notes...</p>
          ) : filteredNotes.length === 0 ? (
            <p className="message empty">No notes for this date</p>
          ) : (
            <div className="notes-grid">
              {filteredNotes.map(note => (
                <div key={note.id} className={`note-card priority-${note.priority}`}>
                  <div className="note-header">
                    <h3 onClick={() => openEditNote(note)}>{note.title}</h3>
                    <button onClick={() => deleteNote(note.id)} className="btn-icon delete">🗑️</button>
                  </div>
                  <p className="note-preview" onClick={() => openEditNote(note)}>
                    {note.content.substring(0, 150)}{note.content.length > 150 ? '...' : ''}
                  </p>
                  <div className="note-footer">
                    <span className="note-time">{formatNoteTime(note.created_at)}</span>
                    <span className={`priority-badge ${note.priority}`}>{note.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-header">
            <h2>Tasks & Habits</h2>
            <button onClick={exportTasksWord} className="btn">📄 Export Word</button>
            <button onClick={exportWeeklyReport} className="btn">📊 Weekly Report</button>
          </div>

          <div className="task-input-group">
            <input
              type="text"
              placeholder="Add task or habit..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              className="input"
            />
            <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="select">
              <option value="daily">Daily Habit</option>
              <option value="weekly">Weekly Habit</option>
              <option value="custom">Custom Task</option>
            </select>

            {taskCategory === 'daily' && (
              <input
                type="time"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                className="input"
              />
            )}

            {taskCategory === 'weekly' && (
              <select value={taskWeekDay} onChange={(e) => setTaskWeekDay(e.target.value)} className="select">
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
              />
            )}

            <select value={taskDifficulty} onChange={(e) => setTaskDifficulty(e.target.value)} className="select">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <input
              type="number"
              placeholder="Minutes"
              value={taskMinutes}
              onChange={(e) => setTaskMinutes(parseInt(e.target.value) || 30)}
              min="5"
              max="480"
              className="input"
              style={{width:'100px'}}
            />

            <input
              type="text"
              placeholder="Tag"
              value={taskTag}
              onChange={(e) => setTaskTag(e.target.value)}
              className="input"
              style={{width:'120px'}}
            />

            <button onClick={addTask} className="btn primary">Add</button>
          </div>

          <div className="filter-tabs">
            <button onClick={() => setActiveCategory('all')} className={`tab ${activeCategory === 'all' ? 'active' : ''}`}>
              All
            </button>
            <button onClick={() => setActiveCategory('daily')} className={`tab ${activeCategory === 'daily' ? 'active' : ''}`}>
              Daily
            </button>
            <button onClick={() => setActiveCategory('weekly')} className={`tab ${activeCategory === 'weekly' ? 'active' : ''}`}>
              Weekly
            </button>
            <button onClick={() => setActiveCategory('custom')} className={`tab ${activeCategory === 'custom' ? 'active' : ''}`}>
              Custom
            </button>
          </div>

          {filteredTasks.length === 0 ? (
            <p className="message empty">No tasks yet</p>
          ) : (
            <div className="tasks-list">
              {filteredTasks.map(task => (
                <div key={task.id} className={`task-item ${task.done ? 'done' : ''} difficulty-${task.difficulty}`}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    className="task-checkbox"
                  />
                  <div className="task-content">
                    <span className="task-text">{task.content}</span>
                    <div className="task-meta">
                      {task.time && <span className="task-time">⏰ {task.time}</span>}
                      {task.weekday && <span className="task-day">📅 {task.weekday}</span>}
                      {task.due_date && <span className="task-date">📆 {task.due_date}</span>}
                      <span className={`difficulty-badge ${task.difficulty}`}>{task.difficulty}</span>
                      <span className="time-badge">⏱️ {formatMinutes(task.estimated_minutes)}</span>
                      {task.category_tag && task.category_tag !== 'general' && (
                        <span className="tag-badge">#{task.category_tag}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="btn-icon delete">🗑️</button>
                </div>
              ))}
            </div>
          )}

          {failedDays.length > 0 && (
            <div className="failed-days">
              <h3>⚠️ Missed Days This Week</h3>
              {failedDays.map((day, idx) => (
                <div key={idx} className="failed-day">
                  {day.date}: {day.completed}/{day.total} habits completed
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {message && (
        <div className={`toast ${message.includes('❌') || message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <footer className="footer">©️ Hyesent.dev</footer>
    </div>
  )
        }

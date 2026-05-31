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

  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState('16')
  const [titleFont, setTitleFont] = useState('Inter')

  useEffect(() => {

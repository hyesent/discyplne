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

export default function App() {

const [user, setUser] = useState(null)
const [session, setSession] = useState(null)
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [loading, setLoading] = useState(false)
const [message, setMessage] = useState('')

const [notes, setNotes] = useState([])
const [title, setTitle] = useState('')
const [noteText, setNoteText] = useState('')
const [priority, setPriority] = useState('medium')
const [editingNote, setEditingNote] = useState(null)

const [tasks, setTasks] = useState([])
const [task, setTask] = useState('')
const [editingTask, setEditingTask] = useState(null)

const [viewMode, setViewMode] = useState('home')

const [selectedDate, setSelectedDate] = useState(
new Date().toISOString().split('T')[0]
)

const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
const [pomodoroRunning, setPomodoroRunning] = useState(false)
const [pomodoroSessions, setPomodoroSessions] = useState(0)

const [totalMinutes, setTotalMinutes] = useState(0)

const [isBreak, setIsBreak] = useState(false)
const [currentTime, setCurrentTime] = useState(new Date())

const recognitionRef = useRef(null)
const fileInputRef = useRef(null)
  useEffect(() => {

supabase.auth.getSession().then(({ data: { session } }) => {
setSession(session)
setUser(session?.user ?? null)

if (session?.user) {
fetchNotes()
fetchTasks()
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
}

})

return () => subscription.unsubscribe()

}, [])

useEffect(() => {

const timer = setInterval(() => {
setCurrentTime(new Date())
}, 1000)

return () => clearInterval(timer)

}, [])

async function fetchNotes() {

if (!user) return

const { data, error } = await supabase
.from('notes')
.select('*')
.eq('user_id', user.id)
.order('created_at', { ascending: false })

if (!error) {
setNotes(data || [])
}

}

async function fetchTasks() {

if (!user) return

const { data, error } = await supabase
.from('tasks')
.select('*')
.eq('user_id', user.id)

if (!error) {
setTasks(data || [])
}

}

async function signUp() {

setLoading(true)

const { error } = await supabase.auth.signUp({
email,
password
})

setLoading(false)

if (error) {
setMessage(error.message)
} else {
setMessage('Check your email')
}

}

async function signIn() {

setLoading(true)

const { error } = await supabase.auth.signInWithPassword({
email,
password
})

setLoading(false)

if (error) {
setMessage(error.message)
}

}

async function signOut() {

await supabase.auth.signOut()

setUser(null)
setNotes([])
setTasks([])

}

const getStreak = () => {

let streak = 0
const today = new Date()

for (let i = 0; i < 30; i++) {

const d = new Date(today)
d.setDate(today.getDate() - i)

const dateStr = d.toISOString().split('T')[0]

const dayHabits = tasks.filter(
t => t.done && t.due_date === dateStr
)

if (dayHabits.length > 0) {
streak++
} else {
break
}

}

return streak

}

const streak = getStreak()
  async function saveNote() {

if (!title.trim() || !noteText.trim()) {
setMessage('Title and note required')
return
}

const noteData = {
title,
content: noteText,
priority,
user_id: user.id,
date: selectedDate
}

if (editingNote) {

await supabase
.from('notes')
.update(noteData)
.eq('id', editingNote.id)

setMessage('Note updated')

} else {

await supabase
.from('notes')
.insert([noteData])

setMessage('Note saved')

}

setTitle('')
setNoteText('')
setEditingNote(null)

fetchNotes()

}

async function deleteNote(id) {

await supabase
.from('notes')
.delete()
.eq('id', id)

fetchNotes()

}

async function addTask() {

if (!task.trim()) return

await supabase.from('tasks').insert({
content: task,
user_id: user.id,
done: false,
due_date: selectedDate
})

setTask('')

fetchTasks()

}

async function toggleTask(id, done) {

await supabase
.from('tasks')
.update({ done: !done })
.eq('id', id)

fetchTasks()

}

async function deleteTask(id) {

await supabase
.from('tasks')
.delete()
.eq('id', id)

fetchTasks()

}

const togglePomodoro = () => {
setPomodoroRunning(!pomodoroRunning)
}

const resetPomodoro = () => {
setPomodoroRunning(false)
setPomodoroTime(25 * 60)
}

useEffect(() => {

let interval

if (pomodoroRunning) {

interval = setInterval(() => {

setPomodoroTime(prev => {

if (prev <= 1) {

setPomodoroSessions(prev => prev + 1)
setTotalMinutes(prev => prev + 25)

return 25 * 60

}

return prev - 1

})

}, 1000)

}

return () => clearInterval(interval)

}, [pomodoroRunning])
  if (!user) {

return (

<div className="auth-container">

<h1>Discypln</h1>

<input
type="email"
placeholder="Email"
value={email}
onChange={(e) => setEmail(e.target.value)}
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e) => setPassword(e.target.value)}
/>

<button onClick={signIn}>
Sign In
</button>

<button onClick={signUp}>
Sign Up
</button>

<p>{message}</p>

</div>

)

}

return (

<div className="container">

<header className="header">

<h1>Discypln</h1>

<button onClick={signOut}>
Logout
</button>

</header>

<div className="stats-card">

<h3>Progress</h3>

<p>🔥 Streak: {streak}</p>
<p>🍅 Sessions: {pomodoroSessions}</p>
<p>⏱️ Focus: {totalMinutes} mins</p>

</div>

<div className="notes-section">

<h2>Notes</h2>

<input
value={title}
onChange={(e) => setTitle(e.target.value)}
placeholder="Title"
/>

<textarea
value={noteText}
onChange={(e) => setNoteText(e.target.value)}
placeholder="Write note..."
/>

<button onClick={saveNote}>
Save Note
</button>

{notes.map(note => (

<div key={note.id}>

<h4>{note.title}</h4>

<p>{note.content}</p>

<button onClick={() => deleteNote(note.id)}>
Delete
</button>

</div>

))}

</div>

<div className="tasks-section">

<h2>Tasks</h2>

<input
value={task}
onChange={(e) => setTask(e.target.value)}
placeholder="Add task"
/>

<button onClick={addTask}>
Add
</button>

{tasks.map(t => (

<div key={t.id}>

<input
type="checkbox"
checked={t.done}
onChange={() => toggleTask(t.id, t.done)}
/>

<span>{t.content}</span>

<button onClick={() => deleteTask(t.id)}>
×
</button>

</div>

))}

</div>

<div className="pomodoro-section">

<h2>Pomodoro</h2>

<h1>
{Math.floor(pomodoroTime / 60)}:
{String(pomodoroTime % 60).padStart(2, '0')}
</h1>

<button onClick={togglePomodoro}>
{pomodoroRunning ? 'Pause' : 'Start'}
</button>

<button onClick={resetPomodoro}>
Reset
</button>

</div>

</div>

)

  }

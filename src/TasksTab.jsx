import { useState, useMemo, useEffect } from 'react'

// ===== SVG ICONS =====
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

const IconPlay = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const IconPause = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

const IconReset = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
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

const IconTarget = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const IconClock = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconTrendingUp = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
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

const IconSparkle = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
  </svg>
)

// ============================================================
//  TASKS TAB COMPONENT
// ============================================================

export default function TasksTab({
  user,
  tasks = [],
  loadingStates = { tasks: false },
  onFetchTasks,
  onNavigate,
  showToast,
  addToTrash,
  supabase,
  // Pomodoro
  pomodoroTime,
  pomodoroRunning,
  isBreak,
  pomodoroSessions,
  totalMinutes,
  pomodoroState,
  showCelebration,
  focusDuration,
  breakDuration,
  onTogglePomodoro,
  onResetPomodoro,
  onSetFocusDuration,
  onSetBreakDuration,
  // Session
  activeSession,
  sessionTaskId,
  sessionPomodoroTime,
  sessionRunning,
  sessionPaused,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onStopSession,
  onCompleteSession,
  // Stats
  statsData,
  subTasks,
  setSubTasks
}) {
  // ===== Local State =====
  const [task, setTask] = useState('')
  const [taskCategory, setTaskCategory] = useState('daily')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskTime, setTaskTime] = useState('')
  const [taskWeekDay, setTaskWeekDay] = useState('monday')
  const [taskDifficulty, setTaskDifficulty] = useState('medium')
  const [taskMinutes, setTaskMinutes] = useState(30)
  const [taskTag, setTaskTag] = useState('general')
  const [activeCategory, setActiveCategory] = useState('all')
  const [newSubTask, setNewSubTask] = useState('')
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [subTasksToAdd, setSubTasksToAdd] = useState([])
  const [taskSaving, setTaskSaving] = useState(false)
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])

  // ============================================================
  //  HELPERS
  // ============================================================

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

  const formatDate = (date) => {
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
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

  // ============================================================
  //  EFFECTS
  // ============================================================

  useEffect(() => {
    const subtaskMap = {}
    tasks.forEach((t) => {
      subtaskMap[t.id] = t.subtasks || []
    })
    setSubTasks(subtaskMap)
  }, [tasks])

  // ============================================================
  //  TASK CRUD
  // ============================================================

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
      showToast('Error adding task: ' + error.message, 'error')
    } else {
      setTask('')
      setTaskTime('')
      setTaskDueDate('')
      setTaskMinutes(30)
      setTaskTag('general')
      setSubTasksToAdd([])
      setNewSubTask('')
      showToast('Task added!', 'success')
      onFetchTasks()
    }
    setTaskSaving(false)
  }

  async function toggleTask(id) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const { error } = await supabase
      .from('tasks')
      .update({ done: !task.done, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      if (!task.done) {
        showToast('Task completed!', 'success')
        if (activeSession === id) {
          onCompleteSession?.()
        }
      }
      onFetchTasks()
    }
  }

  async function deleteTask(id) {
    const task = tasks.find(t => t.id === id)
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      if (task) addToTrash('tasks', task)
      showToast('Task moved to trash', 'success')
      onFetchTasks()
    }
  }

  // ============================================================
  //  SUBTASKS
  // ============================================================

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

  // ============================================================
  //  MEMOIZED FILTERS
  // ============================================================

  const filteredTasks = useMemo(() => {
    return activeCategory === 'all'
      ? [...tasks].sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
      : tasks
          .filter((t) => t.category === activeCategory)
          .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
  }, [tasks, activeCategory])

  const failedDays = getFailedDays()
  const streak = getStreak()

  // ============================================================
  //  RENDER
  // ============================================================

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      <div className="section-title">Task List</div>
      <div className="section-subtitle">Organize your day, track your focus, and build discipline.</div>

      {/* ===== TASKS STATS GRID ===== */}
      <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#F59E0B' }}>
              <IconTarget size={14} color="#F59E0B" style={{ marginRight: '4px' }} />
              {tasks.filter(t => t.done).length}
            </div>
            <div className="stat-label">Done</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--brand-blue)' }}>
              <IconClock size={14} color="var(--brand-blue)" style={{ marginRight: '4px' }} />
              {tasks.filter(t => !t.done).length}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#22C55E' }}>
              <IconTrendingUp size={14} color="#22C55E" style={{ marginRight: '4px' }} />
              {formatMinutes(totalMinutes)}
            </div>
            <div className="stat-label">Focus Time</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#A855F7' }}>
              <IconTarget size={14} color="#A855F7" style={{ marginRight: '4px' }} />
              {pomodoroSessions}
            </div>
            <div className="stat-label">Sessions</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#F97316' }}>
              <IconCalendar size={14} color="#F97316" style={{ marginRight: '4px' }} />
              {statsData?.completionRate || 0}%
            </div>
            <div className="stat-label">Completion</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--brand-purple)' }}>
              <IconCheck size={14} color="var(--brand-purple)" style={{ marginRight: '4px' }} />
              {statsData?.habitCompletion || 0}%
            </div>
            <div className="stat-label">Habits</div>
          </div>
        </div>
      </div>

      {/* ===== POMODORO + HEATMAP ROW ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        
        {/* Pomodoro */}
        <div className="card" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div className="tiny-label" style={{ marginBottom: '8px' }}>Focus Timer</div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-primary)',
              letterSpacing: '-1px',
              lineHeight: 1,
              padding: '4px 0'
            }}>
              {formatTime(pomodoroTime)}
            </div>
            <div style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '50%',
              border: '2px solid transparent',
              borderColor: pomodoroRunning ? 'var(--brand-blue)' : pomodoroState === 'paused' ? '#F59E0B' : 'transparent',
              opacity: pomodoroRunning ? 0.3 : 0.1,
              transition: 'all 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="tiny-label">Focus</span>
              <input type="number" min="10" max="60" value={focusDuration}
                onChange={(e) => { const val = Number(e.target.value); if (!isNaN(val) && val >= 10 && val <= 60) { onSetFocusDuration?.(val) } }}
                className="input" style={{ width: '50px', padding: '2px 4px', fontSize: '12px', textAlign: 'center' }} />
              <span className="tiny-label">min</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="tiny-label">Break</span>
              <input type="number" min="1" max="15" value={breakDuration}
                onChange={(e) => { const val = Number(e.target.value); if (!isNaN(val) && val >= 1 && val <= 15) { onSetBreakDuration?.(val) } }}
                className="input" style={{ width: '50px', padding: '2px 4px', fontSize: '12px', textAlign: 'center' }} />
              <span className="tiny-label">min</span>
            </div>
          </div>

          <div className="progress-bar" style={{ marginTop: '10px', maxWidth: '200px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="progress-bar-fill" style={{ width: `${((focusDuration * 60 - pomodoroTime) / (focusDuration * 60)) * 100}%` }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
            <button onClick={onTogglePomodoro} className={`btn ${pomodoroRunning ? 'btn-danger' : 'btn-primary'}`} style={{ minWidth: '80px', gap: '4px', height: '34px', fontSize: '13px' }}>
              {pomodoroRunning ? <IconPause /> : <IconPlay />}
              {pomodoroRunning ? ' Pause' : pomodoroState === 'paused' ? ' Resume' : ' Start'}
            </button>
            <button onClick={onResetPomodoro} className="btn btn-ghost" style={{ gap: '4px', height: '34px', fontSize: '13px' }}>
              <IconReset /> Reset
            </button>
          </div>

          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {isBreak ? 'Break Time' : 'Focus Session'}
            <span style={{ marginLeft: '8px' }}>{pomodoroSessions} sessions</span>
          </div>

          {showCelebration && (
            <div style={{
              marginTop: '8px',
              padding: '6px 12px',
              background: 'rgba(34, 197, 94, 0.08)',
              borderRadius: 'var(--radius-md)',
              color: '#22C55E',
              fontSize: '12px',
              fontWeight: 600
            }}>
              <IconSparkle /> Focus Session Complete!
            </div>
          )}
        </div>

   {/* Heatmap */}
        <div className="card">
          <div className="tiny-label" style={{ marginBottom: '8px' }}>30-Day Heatmap</div>
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
              const colors = ['transparent', 'rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.5)', 'rgba(34, 197, 94, 0.8)']
              const isToday = dateStr === new Date().toISOString().split('T')[0]

              return (
                <div key={dateStr} className={`heatmap-cell ${isToday ? 'today' : ''}`}
                  title={`${dateStr}: ${dayTasks.length} tasks, ${formatMinutes(minutes)}`}
                  style={{
                    background: colors[intensity],
                    borderColor: isToday ? 'var(--brand-blue)' : 'var(--glass-border)',
                    borderWidth: isToday ? '2px' : '1px'
                  }}>
                  {date.getDate()}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span>Less</span>
            {['transparent', 'rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.5)', 'rgba(34, 197, 94, 0.8)'].map((color) => (
              <div key={color} style={{ width: '14px', height: '14px', background: color, borderRadius: '2px', border: '1px solid var(--glass-border)' }} />
            ))}
            <span>More</span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {tasks.filter(t => t.done).length} tasks done • {streak} day streak
          </div>
        </div>
      </div>

      {/* ===== FAILED DAYS ===== */}
      {failedDays.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: '16px', padding: '12px 16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>
            Failed Days This Week
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {failedDays.map((day) => (
              <span key={day.date} className="text-secondary" style={{ fontSize: '11px' }}>
                {formatDate(day.date)}: {day.completed}/{day.total} habits
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ===== TASK LIST ===== */}
      <div className="section-title" style={{ marginTop: '16px' }}>Task List</div>
      <div className="section-subtitle">Complete tasks to build your discipline.</div>

      {/* Task Category Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'daily', 'weekly', 'custom'].map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              borderRadius: '999px',
              padding: '6px 16px',
              fontSize: '12px',
              height: '32px',
              background: activeCategory === cat ? 'var(--gradient-primary)' : 'transparent',
              color: activeCategory === cat ? 'var(--text-inverse)' : 'var(--text-secondary)',
              borderColor: activeCategory === cat ? 'transparent' : 'var(--glass-border)'
            }}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* ===== ADD TASK FORM ===== */}
      <div className="glass" style={{ padding: '16px', marginBottom: '16px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)' }}>
        <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Add a task..."
          className="input" style={{ marginBottom: '10px', width: '100%', padding: '12px 16px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: '15px', outline: 'none' }}
          onKeyDown={(e) => e.key === 'Enter' && addTask()} />

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)}
            className="select" style={{ flex: 1, minWidth: '100px', padding: '10px 12px', fontSize: '13px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">One-time</option>
          </select>

          {taskCategory === 'daily' && (
            <input type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)}
              className="input" style={{ width: '140px', padding: '10px 12px', fontSize: '13px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }} />
          )}

          {taskCategory === 'weekly' && (
            <select value={taskWeekDay} onChange={(e) => setTaskWeekDay(e.target.value)}
              className="select" style={{ width: '140px', padding: '10px 12px', fontSize: '13px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}>
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
            <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)}
              className="input" style={{ width: '160px', padding: '10px 12px', fontSize: '13px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }} />
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={taskDifficulty} onChange={(e) => setTaskDifficulty(e.target.value)}
            className="select" style={{ width: '100px', padding: '8px 12px', fontSize: '12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <input type="number" value={taskMinutes} onChange={(e) => setTaskMinutes(Number(e.target.value))} placeholder="Mins"
            className="input" style={{ width: '80px', padding: '8px 12px', fontSize: '12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }} />

          <select value={taskTag} onChange={(e) => setTaskTag(e.target.value)}
            className="select" style={{ width: '110px', padding: '8px 12px', fontSize: '12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}>
            <option value="general">General</option>
            <option value="school">School</option>
            <option value="work">Work</option>
            <option value="health">Health</option>
            <option value="personal">Personal</option>
          </select>

          <button onClick={addTask} disabled={taskSaving} className="btn btn-primary" style={{ gap: '4px', flex: 1 }}>
            <IconPlus /> {taskSaving ? 'Adding...' : 'Add Task'}
          </button>
        </div>

        {/* ===== ADD SUBTASK ===== */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
          <input value={newSubTask} onChange={(e) => setNewSubTask(e.target.value)} placeholder="Add a subtask..."
            className="input" style={{ flex: 1, maxWidth: '280px', fontSize: '13px', padding: '8px 12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', outline: 'none' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSubTask.trim()) {
                setSubTasksToAdd([...subTasksToAdd, { id: Date.now().toString(), text: newSubTask.trim(), done: false }])
                setNewSubTask('')
                showToast('Subtask added!', 'success')
              }
            }} />
          <button onClick={() => {
            if (newSubTask.trim()) {
              setSubTasksToAdd([...subTasksToAdd, { id: Date.now().toString(), text: newSubTask.trim(), done: false }])
              setNewSubTask('')
              showToast('Subtask added!', 'success')
            }
          }} className="btn btn-ghost btn-sm">Add</button>
        </div>

         {/* Subtasks to add */}
        {subTasksToAdd.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
            {subTasksToAdd.map((st) => (
              <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'rgba(79, 140, 255, 0.06)', borderRadius: '6px', width: 'fit-content' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{st.text}</span>
                <button onClick={() => setSubTasksToAdd(subTasksToAdd.filter((s) => s.id !== st.id))} style={{ padding: '1px 4px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}>
                  <IconX />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== TASK LIST ===== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loadingStates.tasks ? (
          <div className="card" style={{ padding: '16px' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--glass-border)' : 'none' }}>
                <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: '60%', height: '16px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '40%', height: '12px', marginTop: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((t, index) => {
            const taskSubtasks = subTasks[t.id] || []
            const completedSubtasks = taskSubtasks.filter((st) => st.done).length
            const isExpanded = activeTaskId === t.id
            const isActiveSession = activeSession === t.id
            const sessionTimeRemaining = isActiveSession ? formatTime(sessionPomodoroTime) : null

            return (
              <div key={t.id} className="card" style={{
                padding: '12px 16px',
                overflow: 'hidden',
                border: isActiveSession ? '2px solid var(--brand-blue)' : isExpanded ? '1px solid var(--brand-blue)' : '1px solid var(--glass-border)',
                transition: 'all 0.2s ease',
                animation: `slideUp 0.4s var(--spring) both`,
                animationDelay: `${index * 30}ms`,
                background: isActiveSession ? 'rgba(79, 140, 255, 0.06)' : 'var(--glass-bg)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  onClick={() => setActiveTaskId(isExpanded ? null : t.id)}>
                  <input type="checkbox" checked={t.done}
                    onChange={(e) => { e.stopPropagation(); toggleTask(t.id) }}
                    className="custom-checkbox" style={{ width: '18px', height: '18px' }} />

                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: t.done ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: t.done ? 'line-through' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      {t.content}
                      {isActiveSession && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--brand-blue)',
                          background: 'rgba(79, 140, 255, 0.12)',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: sessionRunning ? '#22C55E' : '#F59E0B',
                            animation: sessionRunning ? 'pulse 1s ease-in-out infinite' : 'none'
                          }} />
                          {sessionRunning ? 'LIVE' : 'PAUSED'} • {sessionTimeRemaining}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {t.difficulty && (
                        <span className={`chip ${t.difficulty === 'hard' ? 'chip-hard' : t.difficulty === 'medium' ? 'chip-medium' : 'chip-easy'}`}
                          style={{ height: '22px', fontSize: '10px', padding: '0 8px' }}>
                          {t.difficulty}
                        </span>
                      )}
                      {t.estimated_minutes && (
                        <span className="chip chip-minutes" style={{ height: '22px', fontSize: '10px', padding: '0 8px' }}>
                          {t.estimated_minutes}m
                        </span>
                      )}
                      {t.category_tag && t.category_tag !== 'general' && (
                        <span className="chip chip-tag" style={{ height: '22px', fontSize: '10px', padding: '0 8px' }}>
                          #{t.category_tag}
                        </span>
                      )}
                      {taskSubtasks.length > 0 && (
                        <span className="chip chip-progress" style={{ height: '22px', fontSize: '10px', padding: '0 8px' }}>
                          {completedSubtasks}/{taskSubtasks.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {!t.done && (
                      isActiveSession ? (
                        <button onClick={(e) => { e.stopPropagation(); onStopSession?.() }}
                          className="btn btn-danger btn-sm" style={{ height: '28px', padding: '0 12px', fontSize: '11px', gap: '4px' }}>
                          <IconX size={14} /> Stop
                        </button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); onStartSession?.(t.id) }}
                          className="btn btn-primary btn-sm" style={{ height: '28px', padding: '0 12px', fontSize: '11px', gap: '4px' }}>
                          <IconPlay size={14} /> Focus
                        </button>
                      )
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {isExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); deleteTask(t.id) }}
                      style={{ padding: '2px 6px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>

                {/* Subtasks (expanded) */}
                {isExpanded && (
                  <div style={{ paddingTop: '10px', marginTop: '10px', borderTop: '1px solid var(--glass-border)', animation: 'fadeIn 0.25s ease' }}>
                    {/* Session Controls (when active) */}
                    {isActiveSession && (
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '10px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(79, 140, 255, 0.06)',
                        border: '1px solid rgba(79, 140, 255, 0.1)',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Focusing on:</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {tasks.find(t => t.id === sessionTaskId)?.content}
                        </span>
                        <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--brand-blue)', marginLeft: 'auto' }}>
                          {formatTime(sessionPomodoroTime)}
                        </span>
                        {sessionRunning ? (
                          <button onClick={onPauseSession} className="btn btn-sm btn-ghost" style={{ height: '28px' }}>Pause</button>
                        ) : (
                          <button onClick={onResumeSession} className="btn btn-sm btn-primary" style={{ height: '28px' }}>Resume</button>
                        )}
                        <button onClick={() => { toggleTask(sessionTaskId); onStopSession?.() }}
                          className="btn btn-sm btn-success" style={{ height: '28px', gap: '4px' }}>
                          <IconCheck size={14} /> Complete
                        </button>
                      </div>
                    )}

                    {/* Subtask Input */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <input value={newSubTask} onChange={(e) => setNewSubTask(e.target.value)} placeholder="Add subtask..."
                        className="input" style={{ flex: 1, fontSize: '12px', padding: '4px 10px' }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { addSubTask(t.id) } }} />
                      <button onClick={() => addSubTask(t.id)} className="btn btn-primary btn-sm" style={{ height: '30px' }}>Add</button>
                    </div>

                    {/* Subtask List */}
                    {taskSubtasks.length > 0 ? (
                      taskSubtasks.map((st) => (
                        <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
                          <input type="checkbox" checked={st.done} onChange={() => toggleSubTask(t.id, st.id)}
                            style={{ width: '14px', height: '14px', accentColor: 'var(--brand-blue)', cursor: 'pointer' }} />
                          <span style={{ fontSize: '13px', color: st.done ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: st.done ? 'line-through' : 'none', flex: 1 }}>
                            {st.text}
                          </span>
                          <button onClick={() => deleteSubTask(t.id, st.id)}
                            style={{ padding: '2px 4px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
                            <IconTrash size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No subtasks yet</p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '6px', opacity: 0.5 }}>🎯</div>
            <p style={{ fontSize: '15px', margin: 0, color: 'var(--text-secondary)' }}>Nothing scheduled.</p>
            <p style={{ fontSize: '13px', marginTop: '2px', color: 'var(--text-tertiary)' }}>Add a task above to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
            }

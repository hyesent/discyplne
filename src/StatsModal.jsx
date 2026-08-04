// ============================================================
//  STATS MODAL — Full Stats Dashboard
//  Discipline · Weekly Breakdown · Habit Rings · Focus · Metrics
// ============================================================

import { useRef } from 'react'

// ===== SVG ICONS (StatsModal only) =====
const IconX = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconTrophy = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
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

const IconCheck = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconAlertTriangle = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

// ============================================================
//  STATS MODAL COMPONENT
// ============================================================

export default function StatsModal({
  onClose,
  statsData,
  streak,
  tasks,
  totalMinutes,
  formatMinutes,
  showToast
}) {
  const modalRef = useRef(null)

  // ============================================================
  //  EXPORT STATS REPORT
  // ============================================================

  const exportStatsReport = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      
      doc.setFontSize(24)
      doc.setTextColor(79, 140, 255)
      doc.text('Discypln Stats Report', 20, 30)
      
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42)
      
      doc.setDrawColor(79, 140, 255)
      doc.line(20, 48, pageWidth - 20, 48)
      
      let y = 60
      
      // 1. Discipline Overview
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text('Discipline Overview', 20, y)
      y += 10
      
      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)
      doc.text(`Discipline Score: ${statsData.disciplineScore}/100`, 25, y)
      y += 8
      doc.text(`Level: ${statsData.disciplineBadge} ${statsData.disciplineLevel}`, 25, y)
      y += 8
      doc.text(`Current Streak: ${streak} days`, 25, y)
      y += 8
      doc.text(`Longest Streak: ${statsData.longestStreak} days`, 25, y)
      y += 12
      
      // 2. Weekly Breakdown
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text('Weekly Breakdown', 20, y)
      y += 10
      
      doc.setFontSize(11)
      doc.setTextColor(60, 60, 60)
      statsData.weeklyBreakdown.forEach(day => {
        doc.text(`${day.day}: ${day.percent}% (${day.done}/${day.total})`, 25, y)
        y += 7
      })
      y += 6
      
      // 3. Habit Tracker
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text('Habit Tracker', 20, y)
      y += 10
      
      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)
      const dailyPct = statsData.dailyHabitsTotal > 0 
        ? Math.round((statsData.dailyHabitsDone / statsData.dailyHabitsTotal) * 100)
        : 0
      const weeklyPct = statsData.weeklyHabitsTotal > 0 
        ? Math.round((statsData.weeklyHabitsDone / statsData.weeklyHabitsTotal) * 100)
        : 0
      const monthlyPct = statsData.monthlyHabitsTotal > 0 
        ? Math.round((statsData.monthlyHabitsDone / statsData.monthlyHabitsTotal) * 100)
        : 0
      
      doc.text(`Daily Habits: ${dailyPct}% (${statsData.dailyHabitsDone}/${statsData.dailyHabitsTotal})`, 25, y)
      y += 8
      doc.text(`Weekly Habits: ${weeklyPct}% (${statsData.weeklyHabitsDone}/${statsData.weeklyHabitsTotal})`, 25, y)
      y += 8
      doc.text(`Monthly Habits: ${monthlyPct}% (${statsData.monthlyHabitsDone}/${statsData.monthlyHabitsTotal})`, 25, y)
      y += 12
      
      // 4. Focus Analysis
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text('Focus Analysis', 20, y)
      y += 10
      
      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)
      doc.text(`Today: ${formatMinutes(statsData.todayFocus)}`, 25, y)
      y += 8
      doc.text(`This Week: ${formatMinutes(statsData.weekFocus)}`, 25, y)
      y += 8
      doc.text(`This Month: ${formatMinutes(statsData.monthFocus)}`, 25, y)
      y += 8
      doc.text(`Average Per Day: ${formatMinutes(statsData.avgFocusPerDay)}`, 25, y)
      y += 8
      if (statsData.bestFocusDay) {
        doc.text(`Best Day: ${statsData.bestFocusDay} (${formatMinutes(statsData.bestFocusMinutes)})`, 25, y)
        y += 8
      }
      y += 6
      
      // 5. Additional Metrics
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text('Additional Metrics', 20, y)
      y += 10
      
      doc.setFontSize(12)
      doc.setTextColor(60, 60, 60)
      doc.text(`Commitment Rate: ${statsData.commitmentRate}%`, 25, y)
      y += 8
      doc.text(`Monthly Progress: ${statsData.monthlyProgress}%`, 25, y)
      y += 8
      doc.text(`Habit Completion: ${statsData.habitCompletion}%`, 25, y)
      y += 8
      doc.text(`Task Velocity: ${statsData.taskVelocity} tasks/hour`, 25, y)
      y += 8
      doc.text(`Daily Average (30d): ${statsData.dailyAverage} tasks`, 25, y)
      y += 8
      if (statsData.bestDay) {
        doc.text(`Best Day: ${statsData.bestDay} (${statsData.bestDayCount} tasks)`, 25, y)
        y += 8
      }
      doc.text(`Total Tasks Ever: ${statsData.totalTasksEver}`, 25, y)
      y += 8
      doc.text(`Completion Rate: ${statsData.completionRate}%`, 25, y)
      y += 8
      doc.text(`Average Task Time: ${formatMinutes(statsData.averageTaskTime)}`, 25, y)
      y += 8
      doc.text(`Most Productive Hour: ${statsData.mostProductiveHour}`, 25, y)
      y += 8
      doc.text(`Weekly Goal Progress: ${statsData.weeklyGoalProgress}%`, 25, y)
      
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text('Generated by Discypln - Stay Focused. Stay Disciplined.', 20, 280)
      
      doc.save(`Discypln_Stats_Report_${new Date().toISOString().split('T')[0]}.pdf`)
      showToast('Stats report exported!', 'success')
    })
  }

  // ============================================================
  //  RENDER
  // ============================================================

  return (
    <div className="stats-modal-overlay" onClick={onClose}>
      <div className="stats-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="stats-modal-header">
          <div className="stats-modal-title">
            <IconTrophy size={22} style={{ marginRight: '8px' }} />
            Full Stats Dashboard
          </div>
          <button className="stats-modal-close" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>

        <div className="stats-modal-content">

          {/* ===== 1. Discipline Overview ===== */}
          <div className="stats-section">
            <div className="stats-section-title">
              <IconTrophy size={16} style={{ marginRight: '6px' }} />
              Discipline Overview
            </div>
            <div className="stats-section-divider" />
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: '16px' 
            }}>
              <div className="stat-item">
                <div className="stat-value" style={{ color: 'var(--brand-blue)' }}>
                  {statsData.disciplineScore}/100
                </div>
                <div className="stat-label">Discipline Score</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ 
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '20px'
                }}>
                  {statsData.disciplineBadge} {statsData.disciplineLevel}
                </div>
                <div className="stat-label">Level</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#F59E0B' }}>{streak}</div>
                <div className="stat-label">Current Streak</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: 'var(--brand-purple)' }}>{statsData.longestStreak}</div>
                <div className="stat-label">Longest Streak</div>
              </div>
            </div>
          </div>

          {/* ===== 2. Weekly Breakdown ===== */}
          <div className="stats-section">
            <div className="stats-section-title">
              <IconCalendar size={16} style={{ marginRight: '6px' }} />
              Weekly Breakdown
            </div>
            <div className="stats-section-divider" />
            {statsData.weeklyBreakdown.map((day, index) => (
              <div key={index} className="weekly-bar">
                <span className="weekly-bar-label">{day.day}</span>
                <div className="weekly-bar-track">
                  <div 
                    className="weekly-bar-fill" 
                    style={{ 
                      width: `${day.percent}%`,
                      background: day.percent >= 80 
                        ? 'var(--gradient-primary)' 
                        : day.percent >= 50 
                          ? 'linear-gradient(90deg, #F59E0B, #F97316)'
                          : 'linear-gradient(90deg, #EF4444, #DC2626)'
                    }}
                  />
                </div>
                <span className="weekly-bar-percent">{day.percent}%</span>
              </div>
            ))}
          </div>

          {/* ===== 3. Habit Tracker Rings ===== */}
          <div className="stats-section">
            <div className="stats-section-title">
              <IconTarget size={16} style={{ marginRight: '6px' }} />
              Habit Tracker
            </div>
            <div className="stats-section-divider" />
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
              gap: '16px',
              justifyContent: 'center'
            }}>
              {/* Daily Ring */}
              <div style={{ textAlign: 'center' }}>
                <div className="habit-ring" style={{ margin: '0 auto' }}>
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    <circle cx="35" cy="35" r="30" className="habit-ring-circle habit-ring-bg" />
                    <circle 
                      cx="35" 
                      cy="35" 
                      r="30" 
                      className="habit-ring-circle habit-ring-progress"
                      style={{
                        strokeDashoffset: 188.5 * (1 - (statsData.dailyHabitsTotal > 0 
                          ? statsData.dailyHabitsDone / statsData.dailyHabitsTotal 
                          : 0))
                      }}
                    />
                  </svg>
                  <div className="habit-ring-label">
                    <div className="habit-ring-value">
                      {statsData.dailyHabitsTotal > 0 
                        ? Math.round((statsData.dailyHabitsDone / statsData.dailyHabitsTotal) * 100)
                        : 0}%
                    </div>
                    Daily
                  </div>
                </div>
              </div>

              {/* Weekly Ring */}
              <div style={{ textAlign: 'center' }}>
                <div className="habit-ring" style={{ margin: '0 auto' }}>
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    <circle cx="35" cy="35" r="30" className="habit-ring-circle habit-ring-bg" />
                    <circle 
                      cx="35" 
                      cy="35" 
                      r="30" 
                      className="habit-ring-circle habit-ring-progress"
                      style={{
                        strokeDashoffset: 188.5 * (1 - (statsData.weeklyHabitsTotal > 0 
                          ? statsData.weeklyHabitsDone / statsData.weeklyHabitsTotal 
                          : 0))
                      }}
                    />
                  </svg>
                  <div className="habit-ring-label">
                    <div className="habit-ring-value">
                      {statsData.weeklyHabitsTotal > 0 
                        ? Math.round((statsData.weeklyHabitsDone / statsData.weeklyHabitsTotal) * 100)
                        : 0}%
                    </div>
                    Weekly
                  </div>
                </div>
              </div>

              {/* Monthly Ring */}
              <div style={{ textAlign: 'center' }}>
                <div className="habit-ring" style={{ margin: '0 auto' }}>
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    <circle cx="35" cy="35" r="30" className="habit-ring-circle habit-ring-bg" />
                    <circle 
                      cx="35" 
                      cy="35" 
                      r="30" 
                      className="habit-ring-circle habit-ring-progress"
                      style={{
                        strokeDashoffset: 188.5 * (1 - (statsData.monthlyHabitsTotal > 0 
                          ? statsData.monthlyHabitsDone / statsData.monthlyHabitsTotal 
                          : 0))
                      }}
                    />
                  </svg>
                  <div className="habit-ring-label">
                    <div className="habit-ring-value">
                      {statsData.monthlyHabitsTotal > 0 
                        ? Math.round((statsData.monthlyHabitsDone / statsData.monthlyHabitsTotal) * 100)
                        : 0}%
                    </div>
                    Monthly
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== 4. Focus Analysis ===== */}
          <div className="stats-section">
            <div className="stats-section-title">
              <IconClock size={16} style={{ marginRight: '6px' }} />
              Focus Analysis
            </div>
            <div className="stats-section-divider" />
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
              gap: '12px' 
            }}>
              <div className="stat-item">
                <div className="stat-value" style={{ color: 'var(--brand-blue)' }}>
                  {formatMinutes(statsData.todayFocus)}
                </div>
                <div className="stat-label">Today</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#22C55E' }}>
                  {formatMinutes(statsData.weekFocus)}
                </div>
                <div className="stat-label">This Week</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: 'var(--brand-purple)' }}>
                  {formatMinutes(statsData.monthFocus)}
                </div>
                <div className="stat-label">This Month</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#F59E0B' }}>
                  {formatMinutes(statsData.avgFocusPerDay)}
                </div>
                <div className="stat-label">Avg / Day</div>
              </div>
              {statsData.bestFocusDay && (
                <div className="stat-item">
                  <div className="stat-value" style={{ color: '#F97316', fontSize: '18px' }}>
                    {formatMinutes(statsData.bestFocusMinutes)}
                  </div>
                  <div className="stat-label">Best: {statsData.bestFocusDay}</div>
                </div>
              )}
            </div>
          </div>

          {/* ===== 5. Additional Metrics ===== */}
          <div className="stats-section">
            <div className="stats-section-title">
              <IconTrendingUp size={16} style={{ marginRight: '6px' }} />
              Additional Metrics
            </div>
            <div className="stats-section-divider" />
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
              gap: '12px' 
            }}>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#22C55E' }}>
                  {statsData.commitmentRate}%
                </div>
                <div className="stat-label">Commitment Rate</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: 'var(--brand-blue)' }}>
                  {statsData.monthlyProgress}%
                </div>
                <div className="stat-label">Monthly Progress</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: 'var(--brand-purple)' }}>
                  {statsData.habitCompletion}%
                </div>
                <div className="stat-label">Habit Completion</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#F59E0B' }}>
                  {statsData.taskVelocity}
                </div>
                <div className="stat-label">Tasks / Hour</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#22C55E' }}>
                  {statsData.dailyAverage}
                </div>
                <div className="stat-label">Daily Avg (30d)</div>
              </div>
              {statsData.bestDay && (
                <div className="stat-item">
                  <div className="stat-value" style={{ color: '#F97316', fontSize: '18px' }}>
                    {statsData.bestDayCount}
                  </div>
                  <div className="stat-label">Best Day: {statsData.bestDay}</div>
                </div>
              )}
              <div className="stat-item">
                <div className="stat-value" style={{ color: 'var(--brand-blue)' }}>
                  {statsData.totalTasksEver}
                </div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#22C55E' }}>
                  {statsData.completionRate}%
                </div>
                <div className="stat-label">Completion Rate</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#A855F7' }}>
                  {formatMinutes(statsData.averageTaskTime)}
                </div>
                <div className="stat-label">Avg Task Time</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: '#F59E0B', fontSize: '16px' }}>
                  {statsData.mostProductiveHour}
                </div>
                <div className="stat-label">Most Productive</div>
              </div>
              <div className="stat-item">
                <div className="stat-value" style={{ color: 'var(--brand-purple)' }}>
                  {statsData.weeklyGoalProgress}%
                </div>
                <div className="stat-label">Weekly Goal</div>
              </div>
            </div>
          </div>

          {/* ===== 6. Streak Protection ===== */}
          {statsData.streakEndangered && (
            <div className="stats-section">
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <IconAlertTriangle size={24} color="var(--text-muted)" />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                    You're {statsData.daysUntilStreakLoss} day{statsData.daysUntilStreakLoss > 1 ? 's' : ''} from losing your {streak}-day streak!
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                    {statsData.nextMilestone > 0 && `Complete today to reach ${statsData.nextMilestone} days!`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== 7. Milestone ===== */}
          {statsData.nextMilestone > 0 && streak > 0 && (
            <div className="stats-section">
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(34, 197, 94, 0.06)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Next Milestone: <strong style={{ color: '#22C55E' }}>{statsData.nextMilestone} days</strong>
                  <span style={{ marginLeft: '12px', color: 'var(--text-tertiary)' }}>
                    ({statsData.nextMilestone - streak} days to go!)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ===== 8. Export ===== */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '12px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--glass-border)'
          }}>
            <button
              onClick={exportStatsReport}
              className="btn btn-primary"
              style={{ gap: '6px' }}
            >
              <IconTrophy size={16} /> Export Stats Report
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

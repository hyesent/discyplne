// ============================================================
//  TRASH MODAL — 7-Day Restore
//  Notes · Tasks · Journal · Restore · Empty
// ============================================================

// ===== SVG ICONS (TrashModal only) =====
const IconX = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconTrash = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconRestore = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9m0 0v6m0-6h-6" />
    <path d="M21 12a9 9 0 1 1-9 9m0 0v-6m0 6h6" />
  </svg>
)

const IconNotes = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

const IconTasks = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const IconJournal = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="10" y1="8" x2="16" y2="8" />
    <line x1="10" y1="12" x2="16" y2="12" />
    <line x1="10" y1="16" x2="14" y2="16" />
  </svg>
)

// ============================================================
//  TRASH MODAL COMPONENT
// ============================================================

export default function TrashModal({
  onClose,
  trash,
  onRestore,
  onEmptyTrash,
  formatDate
}) {
  const totalTrash = trash.notes.length + trash.tasks.length + trash.journal.length

  // ============================================================
  //  RENDER
  // ============================================================

  return (
    <div className="stats-modal-overlay" onClick={onClose}>
      <div className="stats-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="stats-modal-header">
          <div className="stats-modal-title">
            <IconTrash size={22} style={{ marginRight: '8px' }} />
            Trash
          </div>
          <button className="stats-modal-close" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>

        <div className="stats-modal-content">
          {totalTrash === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>🗑️</div>
              <p style={{ fontSize: '16px', margin: 0, color: 'var(--text-secondary)' }}>
                Trash is empty.
              </p>
              <p style={{ fontSize: '14px', marginTop: '4px', color: 'var(--text-tertiary)' }}>
                Deleted items appear here for 7 days before being permanently removed.
              </p>
            </div>
          ) : (
            <>
              {/* ===== Notes Trash ===== */}
              {trash.notes.length > 0 && (
                <div className="stats-section">
                  <div className="stats-section-title">
                    <IconNotes size={16} style={{ marginRight: '6px' }} />
                    Notes ({trash.notes.length})
                  </div>
                  <div className="stats-section-divider" />
                  {trash.notes.map((item) => (
                    <div 
                      key={item.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '8px 0', 
                        borderBottom: '1px solid var(--glass-border)' 
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Deleted: {formatDate(item.deletedAt)}
                          <span style={{ marginLeft: '8px', opacity: 0.5 }}>•</span>
                          <span style={{ fontSize: '11px' }}>
                            Expires: {formatDate(item.expiresAt)}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => onRestore('notes', item.id)}
                        className="btn btn-primary btn-sm"
                        style={{ height: '28px', padding: '0 12px', fontSize: '11px', gap: '4px' }}
                      >
                        <IconRestore size={14} /> Restore
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      if (confirm('Empty all notes in trash? This cannot be undone.')) {
                        onEmptyTrash('notes')
                      }
                    }}
                    className="btn btn-danger btn-sm"
                    style={{ marginTop: '8px', height: '28px', padding: '0 12px', fontSize: '11px' }}
                  >
                    Empty Notes Trash
                  </button>
                </div>
              )}

              {/* ===== Tasks Trash ===== */}
              {trash.tasks.length > 0 && (
                <div className="stats-section">
                  <div className="stats-section-title">
                    <IconTasks size={16} style={{ marginRight: '6px' }} />
                    Tasks ({trash.tasks.length})
                  </div>
                  <div className="stats-section-divider" />
                  {trash.tasks.map((item) => (
                    <div 
                      key={item.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '8px 0', 
                        borderBottom: '1px solid var(--glass-border)' 
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.content}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Deleted: {formatDate(item.deletedAt)}
                          <span style={{ marginLeft: '8px', opacity: 0.5 }}>•</span>
                          <span style={{ fontSize: '11px' }}>
                            Expires: {formatDate(item.expiresAt)}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => onRestore('tasks', item.id)}
                        className="btn btn-primary btn-sm"
                        style={{ height: '28px', padding: '0 12px', fontSize: '11px', gap: '4px' }}
                      >
                        <IconRestore size={14} /> Restore
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      if (confirm('Empty all tasks in trash? This cannot be undone.')) {
                        onEmptyTrash('tasks')
                      }
                    }}
                    className="btn btn-danger btn-sm"
                    style={{ marginTop: '8px', height: '28px', padding: '0 12px', fontSize: '11px' }}
                  >
                    Empty Tasks Trash
                  </button>
                </div>
              )}

              {/* ===== Journal Trash ===== */}
              {trash.journal.length > 0 && (
                <div className="stats-section">
                  <div className="stats-section-title">
                    <IconJournal size={16} style={{ marginRight: '6px' }} />
                    Journal ({trash.journal.length})
                  </div>
                  <div className="stats-section-divider" />
                  {trash.journal.map((item) => (
                    <div 
                      key={item.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '8px 0', 
                        borderBottom: '1px solid var(--glass-border)' 
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>
                          {item.content?.slice(0, 50)}...
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Deleted: {formatDate(item.deletedAt)}
                          <span style={{ marginLeft: '8px', opacity: 0.5 }}>•</span>
                          <span style={{ fontSize: '11px' }}>
                            Expires: {formatDate(item.expiresAt)}
                          </span>
                          {item.mood && (
                            <span style={{ marginLeft: '8px' }}>
                              Mood: {item.mood}
                            </span>
                          )}
                          {item.tags && (
                            <span style={{ marginLeft: '8px' }}>
                              Tags: {item.tags}
                            </span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => onRestore('journal', item.id)}
                        className="btn btn-primary btn-sm"
                        style={{ height: '28px', padding: '0 12px', fontSize: '11px', gap: '4px' }}
                      >
                        <IconRestore size={14} /> Restore
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      if (confirm('Empty all journal entries in trash? This cannot be undone.')) {
                        onEmptyTrash('journal')
                      }
                    }}
                    className="btn btn-danger btn-sm"
                    style={{ marginTop: '8px', height: '28px', padding: '0 12px', fontSize: '11px' }}
                  >
                    Empty Journal Trash
                  </button>
                </div>
              )}

              {/* ===== Empty All Trash ===== */}
              {totalTrash > 0 && (
                <div style={{ 
                  marginTop: '16px', 
                  paddingTop: '16px', 
                  borderTop: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}>
                  <button 
                    onClick={() => {
                      if (confirm('Empty ALL trash? This cannot be undone.')) {
                        onEmptyTrash('notes')
                        onEmptyTrash('tasks')
                        onEmptyTrash('journal')
                      }
                    }}
                    className="btn btn-danger"
                    style={{ gap: '6px' }}
                  >
                    <IconTrash /> Empty All Trash
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

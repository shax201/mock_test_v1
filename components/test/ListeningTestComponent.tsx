'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ResultRow = { question: number; userAnswer: string; correctAnswer: string; isCorrect: boolean }

export type ListeningTestData = {
  audioSource: string
  instructions: string[]
  parts: any[]
  correctAnswers: Record<string, string | string[]>
}

export default function ListeningTestComponent({ data, onSubmit }: { data: ListeningTestData, onSubmit?: (payload: { score: number; rows: ResultRow[] }) => void }) {
  const [currentPart, setCurrentPart] = useState<number>(1)
  const [currentQuestion, setCurrentQuestion] = useState<number>(1)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const [isReviewTime, setIsReviewTime] = useState<boolean>(false)
  const [overlayStage, setOverlayStage] = useState<'instructions' | 'loading' | 'play' | 'hidden'>('instructions')
  const [totalTime, setTotalTime] = useState<number>(0)
  const [results, setResults] = useState<{ score: number; rows: ResultRow[] } | null>(null)
  const [resultModalOpen, setResultModalOpen] = useState<boolean>(false)
  const [notesOpen, setNotesOpen] = useState<boolean>(false)
  const [noteModalOpen, setNoteModalOpen] = useState<boolean>(false)
  const [selectedQuote, setSelectedQuote] = useState<string>('')
  const [noteText, setNoteText] = useState<string>('')
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false)
  const [showSubmittingModal, setShowSubmittingModal] = useState<boolean>(false)
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false)
  const [showContrastPanel, setShowContrastPanel] = useState<boolean>(false)
  const [showTextSizePanel, setShowTextSizePanel] = useState<boolean>(false)
  const [showInstructionsPanel, setShowInstructionsPanel] = useState<boolean>(false)
  const [showFullscreenModal, setShowFullscreenModal] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadingProgress, setLoadingProgress] = useState<number>(0)
  const [contrastTheme, setContrastTheme] = useState<'black-on-white' | 'white-on-black' | 'yellow-on-black'>('black-on-white')
  const [textSize, setTextSize] = useState<'regular' | 'large' | 'extra-large'>('regular')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const selectionRef = useRef<Range | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const notesListRef = useRef<HTMLDivElement | null>(null)
  const mainContentAreaRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (notesOpen) document.body.classList.add('notes-visible')
    else document.body.classList.remove('notes-visible')
    return () => document.body.classList.remove('notes-visible')
  }, [notesOpen])

  const correctAnswers = useMemo(() => data.correctAnswers, [data])

  const formatTime = useCallback((seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`
  }, [])

  const startTimer = useCallback(() => {
    if (!audioRef.current) return
    const d = Math.floor(audioRef.current.duration || 0)
    setTotalTime(d)
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setTotalTime(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
  }, [])

  useEffect(() => {
    if (totalTime <= 0 && !isSubmitted) {
      if (!isReviewTime) {
        setIsReviewTime(true)
        setTotalTime(120)
      } else {
        if (timerRef.current) window.clearInterval(timerRef.current)
        checkAnswers()
      }
    }
  }, [totalTime, isReviewTime, isSubmitted])

  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch (error) {
      console.error('Error requesting fullscreen:', error)
    }
  }, [])

  const startLoading = useCallback(() => {
    setIsLoading(true)
    setLoadingProgress(0)
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsLoading(false)
            // Continue with normal flow - overlayStage will handle the rest
          }, 500)
          return 100
        }
        return prev + 2 // Increment by 2% each time
      })
    }, 100) // Update every 100ms
  }, [])

  const handleFullscreenYes = useCallback(async () => {
    await requestFullscreen()
    setShowFullscreenModal(false)
    startLoading()
  }, [requestFullscreen, startLoading])

  const handleFullscreenNo = useCallback(() => {
    setShowFullscreenModal(false)
    startLoading()
  }, [startLoading])

  const onStartClick = () => {
    setOverlayStage('loading')
    window.setTimeout(() => setOverlayStage('play'), 1500)
  }
  const onCentralPlay = () => {
    setOverlayStage('hidden')
    audioRef.current?.play()
    startTimer()
  }

  const goToQuestion = (q: number) => {
    setCurrentQuestion(q)
    const el = document.getElementById(`q${q}`) || document.querySelector(`input[name="q${q}"]`) as HTMLElement | null
    if (el) {
      const container = el.closest('.question-item, .single-choice, .question-row, .notes-list li, .question') as HTMLElement | null
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const isFillInBlank = (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'text')
        ;(isFillInBlank ? el : container).classList.add('flash')
        window.setTimeout(() => (isFillInBlank ? el : container).classList.remove('flash'), 1200)
      }
    }
  }

  const switchToPart = (part: number) => {
    const p = Math.max(1, Math.min(4, part))
    setCurrentPart(p)
    const firstQuestion = (p - 1) * 10 + 1
    goToQuestion(firstQuestion)
  }

  const updateNavButtonState = (questionNumber: number) => {
    const btn = document.querySelector(`.subQuestion[data-q="${questionNumber}"]`)
    if (!btn) return
    const element = document.getElementById(`q${questionNumber}`) as HTMLInputElement | HTMLSelectElement | null
    const radioChecked = document.querySelector(`input[name="q${questionNumber}"]:checked`) as HTMLInputElement | null
    const hasValue = element ? (('type' in element && (element as any).type === 'radio') ? true : (element as any).value?.trim() !== '') : !!radioChecked
    btn.classList.toggle('answered', !!hasValue)
  }

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error)
    }
  }, [])

  const checkAnswers = () => {
    if (isSubmitted) return
    setIsSubmitted(true)
    if (timerRef.current) window.clearInterval(timerRef.current)
    
    // Exit fullscreen mode
    exitFullscreen()
    
    const rows: ResultRow[] = []
    let score = 0
    for (let i = 1; i <= 40; i++) {
      const key = `q${i}`
      const textOrSelect = document.getElementById(key) as HTMLInputElement | HTMLSelectElement | null
      const navBtn = document.querySelector(`.subQuestion[data-q="${i}"]`)
      let userAnswer = ''
      let isCorrect = false
      let correctAnswerText = ''
      if (textOrSelect) {
        const element = textOrSelect as HTMLInputElement | HTMLSelectElement
        element.setAttribute('disabled', 'true')
        userAnswer = (element as HTMLInputElement).value?.trim() || ''
        const accepted = Array.isArray(correctAnswers[key]) ? (correctAnswers[key] as string[]) : [String(correctAnswers[key])]
        isCorrect = accepted.some(a => a.toLowerCase() === userAnswer.toLowerCase())
        correctAnswerText = accepted.join(' / ')
        element.classList.add(isCorrect ? 'correct' : 'incorrect')
        const correctSpan = document.createElement('span')
        correctSpan.className = 'correct-answer-text'
        correctSpan.innerHTML = isCorrect ? ' ✔' : `&nbsp;✔ (${correctAnswerText})`
        element.parentElement?.insertBefore(correctSpan, element.nextSibling)
      } else {
        const radioChecked = document.querySelector(`input[name="${key}"]:checked`) as HTMLInputElement | null
        const radios = document.querySelectorAll(`input[name="${key}"]`) as NodeListOf<HTMLInputElement>
        userAnswer = radioChecked ? radioChecked.value : ''
        const correct = String(correctAnswers[key])
        correctAnswerText = correct
        isCorrect = userAnswer.toLowerCase() === correct.toLowerCase()
        radios.forEach(r => {
          const label = r.closest('label')
          if (!label) return
          if (r.value.toLowerCase() === correct.toLowerCase()) label.innerHTML += ' <span class="result-correct">✔</span>'
          else if (r.checked) label.innerHTML += ` <span class="result-incorrect">✖ (${correct})</span>`
          r.setAttribute('disabled', 'true')
        })
      }
      if (isCorrect) score++
      navBtn?.classList.add(isCorrect ? 'correct' : 'incorrect')
      rows.push({ question: i, userAnswer: userAnswer || 'No Answer', correctAnswer: correctAnswerText, isCorrect })
    }
    setResults({ score, rows })
    if (onSubmit) {
      try { onSubmit({ score, rows }) } catch {}
    }
    // Don't show modal - let parent handle navigation to results page
    // setResultModalOpen(true)
  }

  const handleSubmit = () => {
    if (isSubmitted) return
    setShowSubmitModal(true)
  }

  useEffect(() => {
    const onChange = (ev: Event) => {
      const el = ev.target as HTMLInputElement | HTMLSelectElement
      const qNum = el.id ? el.id.replace('q', '') : (el as HTMLInputElement).name?.replace('q', '')
      if (!qNum) return
      updateNavButtonState(Number(qNum))
    }
    const inputs = document.querySelectorAll('.answer-input, input[type="radio"]')
    inputs.forEach(el => el.addEventListener('change', onChange))
    return () => inputs.forEach(el => el.removeEventListener('change', onChange))
  }, [])

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges()
    selectionRef.current = null
    if (contextMenuRef.current) contextMenuRef.current.style.display = 'none'
  }

  const applyHighlight = (className: string) => {
    const currentSelection = selectionRef.current
    if (!currentSelection || currentSelection.collapsed) return null
    const span = document.createElement('span')
    span.className = className
    try {
      const contents = currentSelection.extractContents()
      span.appendChild(contents)
      currentSelection.insertNode(span)
    } catch (e) {
      return null
    }
    clearSelection()
    return span
  }

  const onContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement)?.closest('input, textarea, select, .answer-input')) return
    e.preventDefault()
    const sel = window.getSelection()
    if (sel && sel.toString().trim().length > 0) {
      selectionRef.current = sel.getRangeAt(0).cloneRange()
      const menu = contextMenuRef.current
      if (menu) {
        menu.style.left = `${e.pageX}px`
        menu.style.top = `${e.pageY}px`
        menu.style.display = 'block'
      }
    } else {
      clearSelection()
    }
  }

  const onHighlightClick = () => {
    applyHighlight('highlight')
  }

  const onNoteClick = () => {
    const currentSelection = selectionRef.current
    if (currentSelection) {
      setSelectedQuote(currentSelection.toString())
      setNoteModalOpen(true)
      if (contextMenuRef.current) contextMenuRef.current.style.display = 'none'
    }
  }

  const onSaveNote = () => {
    const currentSelection = selectionRef.current
    if (!currentSelection) return
    const highlightSpan = applyHighlight('note-highlight')
    if (!highlightSpan) return
    const noteId = `note-${Date.now()}`
    highlightSpan.id = noteId

    // Create note item
    const noteItem = document.createElement('div')
    noteItem.className = 'note-item'
    noteItem.dataset.targetId = noteId
    noteItem.innerHTML = `<button class="delete-note-btn" title="Delete note">&times;</button><div class="quoted-text">"${selectedQuote}"</div><div class="note-content">${noteText || '<i>No additional comment.</i>'}</div>`
    noteItem.addEventListener('click', (evt) => {
      evt.stopPropagation()
      if ((evt.target as HTMLElement).classList.contains('delete-note-btn')) return
      const targetEl = document.getElementById(noteId)
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        targetEl.classList.add('flash')
        window.setTimeout(() => targetEl.classList.remove('flash'), 1200)
      }
    })
    notesListRef.current?.appendChild(noteItem)

    setNoteText('')
    setSelectedQuote('')
    setNoteModalOpen(false)
    if (!notesOpen) setNotesOpen(true)
  }

  // Delete notes via delegation
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement
      if (!target.classList.contains('delete-note-btn')) return
      e.stopPropagation()
      const noteItem = target.closest('.note-item') as HTMLElement | null
      if (!noteItem) return
      const noteId = noteItem.dataset.targetId
      const highlightSpan = noteId ? document.getElementById(noteId) : null
      if (highlightSpan) {
        const parent = highlightSpan.parentNode as HTMLElement
        while (highlightSpan.firstChild) parent.insertBefore(highlightSpan.firstChild, highlightSpan)
        parent.removeChild(highlightSpan)
        parent.normalize()
      }
      noteItem.remove()
    }
    const container = notesListRef.current
    container?.addEventListener('click', handler)
    return () => container?.removeEventListener('click', handler)
  }, [])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!contextMenuRef.current) return
      if (!(contextMenuRef.current.contains(e.target as Node))) {
        contextMenuRef.current.style.display = 'none'
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const timerCritical = isReviewTime

  return (
    <div className={`contrast-${contrastTheme} text-size-${textSize}`}>
      {/* Fullscreen Modal */}
      {showFullscreenModal && overlayStage === 'instructions' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(to bottom, #1a1a1a, #2d2d2d)',
              padding: '20px 24px'
            }}>
              <h2 style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: 0,
                textAlign: 'left',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
              }}>Alert!</h2>
            </div>
            <div style={{
              background: '#d0d8e0',
              padding: '24px',
              textAlign: 'left'
            }}>
              <p style={{
                color: '#000',
                fontSize: '16px',
                margin: '0 0 24px 0',
                lineHeight: '1.5',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
              }}>
                Would you like to attempt this test in fullscreen mode?
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '20px'
              }}>
                <button 
                  onClick={handleFullscreenYes}
                  style={{
                    background: 'linear-gradient(to bottom, #e8e8e8, #d0d0d0)',
                    border: '1px solid #000',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#000',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #f0f0f0, #d8d8d8)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #e8e8e8, #d0d0d0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #d8d8d8, #c0c0c0)'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #f0f0f0, #d8d8d8)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  Yes
                </button>
                <button 
                  onClick={handleFullscreenNo}
                  style={{
                    background: 'linear-gradient(to bottom, #e8e8e8, #d0d0d0)',
                    border: '1px solid #000',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#000',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #f0f0f0, #d8d8d8)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #e8e8e8, #d0d0d0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #d8d8d8, #c0c0c0)'
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to bottom, #f0f0f0, #d8d8d8)'
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {!showFullscreenModal && isLoading && overlayStage === 'instructions' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#2d2d2d',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <p style={{
            color: 'white',
            fontSize: '18px',
            marginBottom: '30px',
            textAlign: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
          }}>
            Please wait while we are loading the questions. This may take a while.
          </p>
          <div style={{
            width: '400px',
            maxWidth: '90%',
            height: '20px',
            backgroundColor: '#1a1a1a',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '15px'
          }}>
            <div style={{
              width: `${loadingProgress}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              transition: 'width 0.1s ease',
              borderRadius: '10px'
            }}></div>
          </div>
          <p style={{
            color: 'white',
            fontSize: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
          }}>
            {loadingProgress}%
          </p>
        </div>
      )}

      {overlayStage !== 'hidden' && !showFullscreenModal && !isLoading && (
        <div className="pre-exam-overlay" id="pre-exam-overlay">
          {overlayStage === 'instructions' && (
            <div className="instruction-modal" id="instruction-modal">
              <h2>Listening Test Instructions</h2>
              {data.instructions.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
              <button id="start-exam-btn" onClick={onStartClick}>Start Exam</button>
            </div>
          )}
          {overlayStage === 'loading' && (<div className="loader" id="loader" />)}
          {overlayStage === 'play' && (
            <button id="central-play-btn" onClick={onCentralPlay}>
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M8 5v14l11-7L8 5z"/></svg>
            </button>
          )}
        </div>
      )}

      <header className="test-header">
        <div className="test-header-left">
          <div className="test-header-logo">
            <img src="/file.svg" alt="Logo" className="test-ielts-logo" />
          </div>
          <div className="test-header-logo">
            <img src="/ielts-logo.png" alt="IELTS" className="test-ielts-logo" />
          </div>
        </div>
        <div className="test-header-right">
          <button
            className="test-header-menu-btn"
            onClick={() => setShowOptionsModal(true)}
            title="Menu"
          >
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
          <div className="test-timer-container">
            <svg width="24" height="24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span className={`test-timer-display ${timerCritical ? 'timer-critical' : ''}`}>{formatTime(totalTime)}</span>
          </div>
          <button
            className={`test-header-notes-toggle-btn ${notesOpen ? 'active-icon' : ''}`}
            onClick={() => setNotesOpen(v => !v)}
            title="Toggle Notes Panel"
          >
            <svg width="24" height="24" fill="currentColor">
              <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
            </svg>
          </button>
        </div>
      </header>

      <div className={`main-container contrast-${contrastTheme} text-size-${textSize} ${overlayStage !== 'hidden' ? 'blur-background' : ''}`} id="main-test-container">
        <div className="left-panel" id="main-content-area" ref={mainContentAreaRef} onContextMenu={onContextMenu}>
          {currentPart === 1 && (
            <div id="part-1" className="question-part">
              <div className="part-header"><p><strong>{data.parts[0].title}</strong></p></div>
              <div className="question">
                <div className="question-prompt">
                  {(data.parts[0].prompt as string[]).map((p: string, i: number) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: p.replace('ONE WORD AND/OR A NUMBER', '<strong>ONE WORD AND/OR A NUMBER</strong>') }} />
                  ))}
                </div>
                <h3 className="centered-title">{data.parts[0].sectionTitle}</h3>
                <div style={{ border: '1px solid #ddd', padding: 25, borderRadius: 5 }}>
                  <p><strong>Course required:</strong> {data.parts[0].courseRequired}</p>
                  <div className="aligned-form" style={{ marginTop: 20 }}>
                    {(data.parts[0].fillRows || []).map((row: any) => (
                      <div key={row.q} className="question-row"><span className="question-label">{row.labelPrefix}</span> {row.textPrefix}<strong>{row.q}</strong> <input type="text" id={`q${row.q}`} className="answer-input" placeholder={`${row.q}`} spellCheck={false} autoComplete="off" />{row.textSuffix}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPart === 2 && (
            <div id="part-2" className="question-part">
              <div className="part-header"><p><strong>{data.parts[1].title}</strong></p></div>
              <div className="question">
                <div className="question-prompt"><p><strong>Questions 11-15</strong><br />Choose the correct letter, <strong>A, B or C</strong>.</p></div>
                <div className="single-choice-container">
                  {(data.parts[1].singleChoice || []).map((sc: any) => (
                    <div key={sc.number} className="single-choice"><p>{sc.number} {sc.question}</p>{sc.options.map((opt: string) => {
                      const val = opt.substring(0,1)
                      return <label key={val}><input type="radio" name={`q${sc.number}`} value={val} /> {opt}</label>
                    })}</div>
                  ))}
                </div>
              </div>
              <div className="question">
                <div className="question-prompt"><p><strong>Questions 16-20</strong></p><p>What did each of the following studies find?</p><p>Choose <strong>FIVE</strong> answers from the box and write the correct letter, <strong>A-G</strong>, next to Questions 16-20.</p></div>
                <div className="task-wrapper">
                  <div className="options-box"><h3>Information</h3><ul>{(data.parts[1].matching?.options || []).map((opt: string, i: number) => {
                    const code = opt.substring(0,1)
                    return <li key={i}><strong>{code}</strong> {opt.substring(2)}</li>
                  })}</ul></div>
                  <div className="matching-questions-container"><p style={{ fontWeight: 'bold', marginBottom: 15 }}>{data.parts[1].matching?.heading}</p>
                    {(data.parts[1].matching?.items || []).map((it: any) => (
                      <div key={it.q} className="question-item"><label htmlFor={`q${it.q}`}><strong>{it.q}</strong> {it.label}</label> <select id={`q${it.q}`} className="answer-input"><option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option></select></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPart === 3 && (
            <div id="part-3" className="question-part">
              <div className="part-header"><p><strong>{data.parts[2].title}</strong></p></div>
              <div className="question">
                <div className="question-prompt"><p><strong>Questions 21-26</strong></p><p>Choose the correct letter, <strong>A, B or C</strong>.</p></div>
                <div className="single-choice-container">
                  {(data.parts[2].singleChoice || []).map((sc: any) => (
                    <div key={sc.number} className="single-choice"><p>{sc.number} {sc.question}</p>{sc.options.map((opt: string) => {
                      const val = opt.substring(0,1)
                      return <label key={val}><input type="radio" name={`q${sc.number}`} value={val} /> {opt}</label>
                    })}</div>
                  ))}
                </div>
              </div>
              <div className="question">
                <div className="question-prompt"><p><strong>Questions 27-30</strong></p><p>What will Daniel and Fiona do at the meeting to help students with debate?</p><p>Choose <strong>FOUR</strong> answers from the box and write the correct letter, <strong>A-F</strong>, next to questions 27-30.</p></div>
                <div className="task-wrapper">
                  <div className="options-box"><h3>Actions at the meeting</h3><ul>{(data.parts[2].matching?.options || []).map((opt: string, i: number) => {
                    const code = opt.substring(0,1)
                    return <li key={i}><strong>{code}</strong> {opt.substring(2)}</li>
                  })}</ul></div>
                  <div className="matching-questions-container"><p style={{ fontWeight: 'bold', marginBottom: 15 }}>{data.parts[2].matching?.heading}</p>
                    {(data.parts[2].matching?.items || []).map((it: any) => (
                      <div key={it.q} className="question-item"><label htmlFor={`q${it.q}`}><strong>{it.q}</strong> {it.label}</label> <select id={`q${it.q}`} className="answer-input"><option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option></select></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPart === 4 && (
            <div id="part-4" className="question-part">
              <div className="part-header"><p><strong>{data.parts[3].title}</strong></p></div>
              <div className="question">
                <div className="question-prompt">{(data.parts[3].prompt as string[]).map((p: string, i: number) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: p.replace('ONE WORD ONLY', '<strong>ONE WORD ONLY</strong>') }} />
                ))}</div>
                <div style={{ border: '1px solid #ddd', padding: 25, borderRadius: 5 }}>
                  <h4 className="centered-title">{data.parts[3].sectionTitle}</h4>
                  <div className="notes-list">
                    {(data.parts[3].notes || []).map((section: any, idx: number) => (
                      <div key={idx}>
                        <p><strong>{section.heading}</strong></p>
                        {section.subsections ? (
                          <div style={{ paddingLeft: 20 }}>
                            {section.subsections.map((sub: any, i: number) => (
                              <div key={i}>
                                <p><u>{sub.title}</u></p>
                                <ul>
                                  {sub.items.map((it: any, j: number) => (
                                    <li key={j}>
                                      {it.prefix ? it.prefix : ''}
                                      {it.q ? (<><strong>{it.q}</strong><input type="text" id={`q${it.q}`} className="answer-input" placeholder={`${it.q}`} spellCheck={false} autoComplete="off" /></>) : null}
                                      {it.text ? it.text : ''}
                                      {it.suffix ? it.suffix : ''}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <ul>
                            {section.items.map((it: any, j: number) => (
                              <li key={j}>
                                {it.prefix ? it.prefix : ''}
                                {it.q ? (<><strong>{it.q}</strong><input type="text" id={`q${it.q}`} className="answer-input" placeholder={`${it.q}`} spellCheck={false} autoComplete="off" /></>) : null}
                                {it.text ? it.text : ''}
                                {it.suffix ? it.suffix : ''}
                                {it.children ? (
                                  <ul>
                                    {it.children.map((ch: any, k: number) => (
                                      <li key={k}>
                                        {ch.prefix ? ch.prefix : ''}
                                        {ch.q ? (<><strong>{ch.q}</strong><input type="text" id={`q${ch.q}`} className="answer-input" placeholder={`${ch.q}`} spellCheck={false} autoComplete="off" /></>) : null}
                                        {ch.text ? ch.text : ''}
                                        {ch.suffix ? ch.suffix : ''}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`notes-panel ${notesOpen ? '' : 'hidden'}`} id="notes-panel">
          <div className="notes-panel-header"><h3>My Notes</h3></div>
          <div id="notes-list" ref={notesListRef} />
        </div>
      </div>

      <audio id="global-audio-player" className="hidden" preload="auto" ref={audioRef} src={data.audioSource} />

      <nav className="nav-row">
        {[1, 2, 3, 4].map((p) => (
          <div key={p} className={`footer__questionWrapper___1tZ46 ${currentPart === p ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); switchToPart(p) }}>
            <button className="footer__questionNo___3WNct"><span>{`Part ${p}`}</span></button>
            <div className="footer__subquestionWrapper___9GgoP">
              {Array.from({ length: 10 }, (_, idx) => (p - 1) * 10 + idx + 1).map(q => (
                <button key={q} className={`subQuestion ${currentQuestion === q ? 'active' : ''}`} data-q={q} onClick={(e) => { e.stopPropagation(); goToQuestion(q) }}>{q}</button>
              ))}
            </div>
          </div>
        ))}
        <div className="volume-container">
          <button id="volume-btn" className="icon" aria-label="Volume">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </button>
          <input type="range" id="new-volume-slider" min={0} max={1} step={0.01} defaultValue={1} onInput={(e) => { if (audioRef.current) audioRef.current.volume = Number((e.target as HTMLInputElement).value) }} />
        </div>
        <button id="deliver-button" className="footer__deliverButton___3FM07" onClick={isSubmitted ? () => setResultModalOpen(true) : handleSubmit} disabled={false}>{isSubmitted ? 'Checked' : 'Exit'}</button>
      </nav>

      {/* Results Modal */}
      {resultModalOpen && results && (
        <div id="result-modal" className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h2>Your Results</h2><button id="modal-close-button" className="modal-close-btn" onClick={() => setResultModalOpen(false)}>&times;</button></div>
            <div id="score-summary">{`You scored ${results.score} out of 40 (Band ${((raw:number)=>{if(raw>=39)return 9; if(raw>=37)return 8.5; if(raw>=35)return 8; if(raw>=32)return 7.5; if(raw>=30)return 7; if(raw>=26)return 6.5; if(raw>=23)return 6; if(raw>=18)return 5.5; if(raw>=16)return 5; if(raw>=13)return 4.5; if(raw>=10)return 4; if(raw>=8)return 3.5; return 0;})(results.score)}).`}</div>
            <div id="result-details">
              <table>
                <thead><tr><th>Question</th><th>Your Answer</th><th>Correct Answer</th><th>Result</th></tr></thead>
                <tbody>
                  {results.rows.map(r => (
                    <tr key={r.question}>
                      <td>{r.question}</td>
                      <td>{r.userAnswer}</td>
                      <td>{r.correctAnswer}</td>
                      <td className={r.isCorrect ? 'result-correct' : 'result-incorrect'}>{r.isCorrect ? '✔' : '✖'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      <div id="context-menu" ref={contextMenuRef} className="context-menu">
        <button id="highlight-btn" onClick={onHighlightClick}>Highlight</button>
        <button id="note-btn" onClick={onNoteClick}>Note</button>
      </div>

      {/* Note modal */}
      {noteModalOpen && (
        <div id="note-modal">
          <h4>Add a Note</h4>
          <p>Selected Text:</p>
          <blockquote>{selectedQuote}</blockquote>
          <textarea id="note-textarea" placeholder="Type your note here..." spellCheck={false} autoComplete="off" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button id="save-note-btn" onClick={onSaveNote}>Save Note</button>
            <button id="cancel-note-btn" onClick={() => { setNoteText(''); setSelectedQuote(''); setNoteModalOpen(false); clearSelection() }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Drawer */}
      {showSubmitModal && (
        <>
          <div className="drawer-overlay" onClick={() => setShowSubmitModal(false)}></div>
          <div className="submit-drawer">
            <div className="submit-drawer-content">
              <span className="submit-modal-text">Click next to continue</span>
              <button 
                className="submit-modal-next-button"
                onClick={() => {
                  setShowSubmitModal(false)
                  setShowSubmittingModal(true)
                  setTimeout(() => {
                    checkAnswers()
                    setShowSubmittingModal(false)
                  }, 1500)
                }}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Submitting Answers Full Screen Modal */}
      {showSubmittingModal && (
        <div className="full-screen-modal">
          <div className="submitting-modal-content">
            <div className="submitting-spinner"></div>
            <p className="submitting-text">Submitting your answers</p>
          </div>
        </div>
      )}

      {/* Options Modal */}
      {showOptionsModal && (
        <div 
          className="options-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOptionsModal(false)
            }
          }}
        >
          <div className="options-modal">
            <h2 className="options-modal-title">Options</h2>
            {!showContrastPanel && !showTextSizePanel && !showInstructionsPanel ? (
              <div className="options-menu-list">
                <div 
                  className="options-menu-item"
                  onClick={() => setShowContrastPanel(true)}
                >
                  <div className="options-menu-item-left">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 2 A 10 10 0 0 1 12 22 Z" fill="currentColor"/>
                    </svg>
                    <span>Contrast</span>
                  </div>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
                <div className="options-menu-divider"></div>
                <div 
                  className="options-menu-item"
                  onClick={() => setShowTextSizePanel(true)}
                >
                  <div className="options-menu-item-left">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
                    </svg>
                    <span>Text size</span>
                  </div>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
                <div className="options-menu-divider"></div>
                <div 
                  className="options-menu-item"
                  onClick={() => setShowInstructionsPanel(true)}
                >
                  <div className="options-menu-item-left">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="currentColor"/>
                      <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Test Instructions</span>
                  </div>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            ) : showContrastPanel ? (
              <div className="contrast-panel">
                <div className="contrast-panel-header">
                  <button 
                    className="contrast-back-button"
                    onClick={() => setShowContrastPanel(false)}
                  >
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                  </button>
                  <h3 className="contrast-panel-title">Contrast</h3>
                </div>
                <div className="contrast-options-list">
                  <div 
                    className="contrast-option"
                    onClick={() => setContrastTheme('black-on-white')}
                  >
                    <div className="contrast-checkmark-container">
                      {contrastTheme === 'black-on-white' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="contrast-checkmark">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>Black on white</span>
                  </div>
                  <div className="contrast-option-divider"></div>
                  <div 
                    className="contrast-option"
                    onClick={() => setContrastTheme('white-on-black')}
                  >
                    <div className="contrast-checkmark-container">
                      {contrastTheme === 'white-on-black' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="contrast-checkmark">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>White on black</span>
                  </div>
                  <div className="contrast-option-divider"></div>
                  <div 
                    className="contrast-option"
                    onClick={() => setContrastTheme('yellow-on-black')}
                  >
                    <div className="contrast-checkmark-container">
                      {contrastTheme === 'yellow-on-black' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="contrast-checkmark">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>Yellow on black</span>
                  </div>
                </div>
              </div>
            ) : showTextSizePanel ? (
              <div className="contrast-panel">
                <div className="contrast-panel-header">
                  <button 
                    className="contrast-back-button"
                    onClick={() => setShowTextSizePanel(false)}
                  >
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                  </button>
                  <h3 className="contrast-panel-title">Text size</h3>
                </div>
                <div className="contrast-options-list">
                  <div 
                    className="contrast-option"
                    onClick={() => setTextSize('regular')}
                  >
                    <div className="contrast-checkmark-container">
                      {textSize === 'regular' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="contrast-checkmark">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>Regular</span>
                  </div>
                  <div className="contrast-option-divider"></div>
                  <div 
                    className="contrast-option"
                    onClick={() => setTextSize('large')}
                  >
                    <div className="contrast-checkmark-container">
                      {textSize === 'large' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="contrast-checkmark">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>Large</span>
                  </div>
                  <div className="contrast-option-divider"></div>
                  <div 
                    className="contrast-option"
                    onClick={() => setTextSize('extra-large')}
                  >
                    <div className="contrast-checkmark-container">
                      {textSize === 'extra-large' && (
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="contrast-checkmark">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </div>
                    <span>Extra Large</span>
                  </div>
                </div>
              </div>
            ) : showInstructionsPanel ? (
              <div className="contrast-panel">
                <div className="contrast-panel-header">
                  <button 
                    className="contrast-back-button"
                    onClick={() => setShowInstructionsPanel(false)}
                  >
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                  </button>
                  <h3 className="contrast-panel-title">Test Instructions</h3>
                </div>
                <div className="instructions-content">
                  <div className="instructions-section">
                    <h4 className="instructions-section-title">General Instructions</h4>
                    <ul className="instructions-list">
                      <li>You will hear the audio recording once only.</li>
                      <li>The test consists of 4 parts with 40 questions in total.</li>
                      <li>Listen carefully and answer all questions as you hear the audio.</li>
                      <li>You can navigate between questions using the question numbers at the bottom.</li>
                      <li>You have time to review your answers after the audio finishes playing.</li>
                    </ul>
                  </div>
                  <div className="instructions-section">
                    <h4 className="instructions-section-title">Question Types</h4>
                    <ul className="instructions-list">
                      <li><strong>Fill in the blanks:</strong> Write ONE WORD AND/OR A NUMBER for each answer.</li>
                      <li><strong>Multiple Choice:</strong> Choose the correct letter (A, B, or C) for each question.</li>
                      <li><strong>Matching:</strong> Match items from a list to questions by writing the correct letter (A-G).</li>
                      <li><strong>Note completion:</strong> Complete notes by writing ONE WORD ONLY for each answer.</li>
                    </ul>
                  </div>
                  <div className="instructions-section">
                    <h4 className="instructions-section-title">Tips</h4>
                    <ul className="instructions-list">
                      <li>Use the highlight feature to mark important information in the questions.</li>
                      <li>You can add notes to help you remember key points.</li>
                      <li>Pay attention to spelling and grammar - incorrect spelling will result in a wrong answer.</li>
                      <li>Listen for keywords and synonyms that match the questions.</li>
                      <li>Review your answers during the review time before submitting.</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background-color: #f0f2f5; line-height: 1.6; font-size: 16px; padding-bottom: 90px; }
        .test-header { background-color: #ffffff; padding: 12px 20px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; position: fixed; top: 0; left: 0; right: 0; z-index: 100; height: 60px; transition: filter 0.3s ease; }
        .test-header-left { display: flex; align-items: center; gap: 15px; }
        .test-header-logo { height: 45px; width: auto; }
        .test-ielts-logo { height: 35px; width: auto; }
        .test-header-right { display: flex; align-items: center; gap: 20px; }
        .test-timer-container { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 500; }
        .test-timer-display { font-weight: bold; color: #333; }
        .test-timer-display.timer-critical { color: #dc3545; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        .main-container { margin-top: 80px; display: flex; justify-content: center; padding: 10px; }
        .left-panel { width: 100%; max-width: 900px; padding: 20px 30px; transition: all 0.3s; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px; }
        .notes-panel { width: 300px; min-width: 280px; background-color: #f8f9fa; border-left: 1px solid #ccc; display: none; flex-direction: column; flex-shrink: 0; height: calc(100vh - 60px); position: fixed; right: 0; top: 60px; box-shadow: -2px 0 5px rgba(0,0,0,0.1); }
        body.notes-visible .left-panel { margin-right: 310px; }
        body.notes-visible .notes-panel { display: flex; }
        .notes-panel.hidden { display: none; }
        .notes-panel-header { padding: 10px 15px; background-color: #e9ecef; border-bottom: 1px solid #ccc; position: sticky; top: 0; z-index: 10; }
        .notes-panel-header h3 { margin: 0; font-size: 1.1em; }
        #notes-list { flex-grow: 1; overflow-y: auto; padding: 15px; }
        .part-header { background-color: #f1f2ec; padding: 15px; border-radius: 5px; margin-bottom: 30px; border: 1px solid #e0e0e0; }
        .question { margin-bottom: 40px; }
        .question-prompt p { margin-bottom: 15px; line-height: 1.7; }
        .aligned-form .question-row { display: flex; align-items: center; margin-bottom: 15px; }
        .aligned-form .question-label { width: 300px; flex-shrink: 0; }
        .centered-title { text-align: center; font-size: 1.2em; font-weight: bold; margin-bottom: 25px; margin-top: 10px; }
        .single-choice-container { margin: 10px 0; display: flex; flex-direction: column; gap: 20px; }
        .single-choice label { display: block; margin: 8px 0; font-size: 16px; cursor: pointer; padding-left: 5px; }
        .single-choice input { margin-right: 12px; }
        .single-choice p { font-weight: bold; margin-bottom: 8px; }
        .task-wrapper { max-width: 1000px; margin: 20px auto; display: flex; flex-wrap: wrap; gap: 30px; align-items: flex-start; }
        .options-box { flex: 1 1 400px; background-color: #f8f9fa; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; }
        .options-box h3 { margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; font-size: 1.1em; }
        .options-box ul { list-style-type: none; padding: 0; }
        .options-box li { margin-bottom: 10px; line-height: 1.5; }
        .matching-questions-container { flex: 1 1 400px; padding: 10px; }
        .matching-questions-container .question-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 17px; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
        .matching-questions-container .question-item:last-child { border-bottom: none; }
        .answer-input { border: 1px solid #888; border-radius: 4px; background-color: #fff; padding: 6px 8px; font-size: 16px; cursor: pointer; -webkit-appearance: none; appearance: none; background-repeat: no-repeat; background-position: right 8px top 50%; background-size: .65em auto; padding-right: 30px; color: #333; margin: 0 8px; }
        select.answer-input { background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23AAA%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); }
        .answer-input[type="text"] { min-width: 120px; text-align: center; }
        .answer-input.correct { border-color: #28a745; background-color: #e9f7ef; }
        .answer-input.incorrect { border-color: #dc3545; background-color: #f8d7da; color: #721c24; }
        .correct-answer-text { color: #28a745; font-weight: bold; margin-left: 10px; }
        .nav-row { position: fixed; bottom: 0; left: 0; right: 0; background: #ffffff; padding: 0 20px; display: flex; align-items: center; height: 80px; z-index: 100; overflow-x: auto; white-space: nowrap; border-top: 1px solid #ddd; }
        .footer__questionWrapper___1tZ46 { display: flex; align-items: center; margin-right: 20px; flex-shrink: 0; }
        .footer__questionNo___3WNct { background: none; border: none; padding: 10px 15px; font-size: 16px; font-weight: 600; color: #333; cursor: pointer; display: flex; align-items: center; gap: 5px; }
        .footer__subquestionWrapper___9GgoP { display: none; gap: 2px; margin-left: 10px; }
        .footer__questionWrapper___1tZ46.selected .footer__subquestionWrapper___9GgoP { display: flex; }
        .subQuestion { width: 32px; height: 32px; border: 1px solid #ccc; background: white; color: #333; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 2px; }
        .subQuestion.answered { background: #e9ecef; color: #555; border-color: #ced4da; }
        .subQuestion.correct { background-color: #28a745; color: white; border-color: #28a745; }
        .subQuestion.incorrect { background-color: #dc3545; color: white; border-color: #dc3545; }
        .subQuestion.active { background-color: #4a90e2; color: white; border-color: #4a90e2; }
        .footer__deliverButton___3FM07 { margin-left: auto; background-color: #f0f0f0; color: #333; border: 1px solid #ccc; padding: 12px 20px; border-radius: 4px; font-size: 16px; font-weight: 600; cursor: pointer; }
        .volume-container { display: flex; align-items: Right; gap: 8px; margin-left: auto; }
        .volume-container input[type="range"] { width: 100px; }
        .hidden { display: none !important; }
        .blur-background { filter: blur(5px); pointer-events: none; }
        .pre-exam-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; justify-content: center; align-items: center; flex-direction: column; }
        .instruction-modal, .loader, #central-play-btn { background: white; padding: 30px; border-radius: 10px; text-align: Left; max-width: 800px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .instruction-modal h2 { margin-bottom: 20px; text-align: Center; }
        .instruction-modal p { margin-bottom: 25px; text-align: Left; }
        .instruction-modal button { background-color: #007bff; color: white; border: none; padding: 12px 25px; border-radius: 5px; font-size: 16px; cursor: pointer; }
        .loader { width: 60px; height: 60px; border: 6px solid #f3f3f3; border-top: 6px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; padding: 0; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #central-play-btn { width: 100px; height: 100px; border-radius: 50%; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; padding: 0; }
        #central-play-btn svg { width: 50px; height: 50px; fill: #333; }
        .audio-player-container { display: none; }
        @keyframes flash { 0% { background-color: #e6f4ff; } 100% { background-color: transparent; } }
        .flash { animation: flash 1.2s ease-out; }
        @keyframes flash-red { from { background-color: #f8d7da; } to { background-color: transparent; } }
        .note-highlight.flash { animation-name: flash-red; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .modal-content { background: white; padding: 25px; border-radius: 8px; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 15px; }
        .modal-close-btn { background: none; border: none; font-size: 28px; cursor: pointer; }
        #score-summary { font-size: 18px; font-weight: bold; margin: 20px 0; }
        #result-details table { width: 100%; border-collapse: collapse; font-size: 14px; }
        #result-details th, #result-details td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .result-correct { color: #28a745; font-weight: bold; }
        .result-incorrect { color: #dc3545; font-weight: bold; }
        .highlight { background-color: #fffb8b !important; display: inline; }
        .note-highlight { background-color: #c8e6c9 !important; display: inline; }
        .notes-list { list-style: none; padding-left: 0; }
        .notes-list p { font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
        .notes-list p:first-child { margin-top: 0; }
        .notes-list > li { margin-bottom: 15px; padding-left: 20px; position: relative; line-height: 2.2; }
        .notes-list > li::before { content: '•'; position: absolute; left: 0; top: 8px; color: #333; line-height: 1; }
        .notes-list ul { list-style: disc; padding-left: 40px; margin-top: 15px; }
        .notes-list ul li { margin-bottom: 15px; padding-left: 0; }
        .notes-list ul li::before { display: none; }
        .note-item { position: relative; margin-bottom: 15px; padding: 12px; background-color: #fff; border: 1px solid #eee; border-left: 4px solid #28a745; border-radius: 4px; cursor: pointer; }
        .delete-note-btn { position: absolute; top: 5px; right: 5px; background: transparent; border: none; font-size: 1.4em; color: #aaa; cursor: pointer; padding: 0 5px; line-height: 1; }
        .delete-note-btn:hover { color: #333; }
        .note-item .quoted-text { font-style: italic; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 8px; font-size: 0.9em; padding-right: 20px; }
        .note-item .note-content { font-size: 1em; color: #333; }
        .context-menu { position: absolute; display: none; background-color: #fff; border: 1px solid #ccc; box-shadow: 2px 2px 5px rgba(0,0,0,0.2); border-radius: 5px; padding: 5px; z-index: 1000; }
        .context-menu button { display: block; width: 100%; padding: 8px 12px; border: none; background-color: transparent; cursor: pointer; text-align: left; }
        .context-menu button:hover { background-color: #f0f0f0; }
        #note-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; background: white; border: 1px solid #ccc; box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index: 1001; padding: 20px; border-radius: 8px; }
        #note-modal h4 { margin-top: 0; }
        #note-modal blockquote { background: #f9f9f9; border-left: 5px solid #ccc; margin: 1em 0; padding: 0.5em 10px; font-style: italic; }
        #note-textarea { width: 100%; height: 100px; margin-top: 10px; padding: 5px; font-family: Arial, sans-serif; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .drawer-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 1999; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .submit-drawer { position: fixed; top: 0; left: 0; right: 0; background: white; z-index: 2000; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); animation: slideDown 0.3s ease; border-bottom: 1px solid #e0e0e0; }
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        .submit-drawer-content { background: white; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; gap: 24px; max-width: 1200px; margin: 0 auto; }
        .submit-modal-text { font-size: 16px; color: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; flex: 1; }
        .submit-modal-next-button { background-color: #000; color: #fff; border: none; border-radius: 6px; padding: 10px 20px; font-size: 16px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s ease; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
        .submit-modal-next-button:hover { background-color: #333; }
        .submit-modal-next-button:active { background-color: #555; }
        .full-screen-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.8); z-index: 3000; display: flex; align-items: center; justify-content: center; }
        .submitting-modal-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; }
        .submitting-spinner { width: 50px; height: 50px; border: 4px solid rgba(255, 255, 255, 0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; }
        .submitting-text { color: white; font-size: 20px; font-weight: 500; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
        .test-header-menu-btn { background: none; border: none; cursor: pointer; padding: 5px; display: flex; align-items: center; border-radius: 4px; transition: background-color 0.2s ease; color: #333; }
        .test-header-menu-btn:hover { background-color: #f0f0f0; }
        .test-header-notes-toggle-btn { background: none; border: none; cursor: pointer; padding: 5px; display: flex; align-items: center; border-radius: 50%; transition: background-color 0.2s ease; color: #333; }
        .test-header-notes-toggle-btn.active-icon { background-color: #e6f7ff; }
        .test-header-notes-toggle-btn.active-icon svg { fill: #007bff; }
        .options-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 2000; display: flex; justify-content: center; align-items: center; }
        .options-modal { background: white; border-radius: 8px; width: 90%; max-width: 600px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); position: relative; }
        .options-modal-title { font-size: 24px; font-weight: 600; color: #000; margin: 0; padding: 20px 20px 16px 20px; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
        .options-menu-list { display: flex; flex-direction: column; }
        .options-menu-item { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; cursor: pointer; transition: background-color 0.2s ease; }
        .options-menu-item:hover { background-color: #f5f5f5; }
        .options-menu-item-left { display: flex; align-items: center; gap: 12px; flex: 1; }
        .options-menu-item-left svg { color: #000; flex-shrink: 0; }
        .options-menu-item-left span { font-size: 16px; color: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
        .options-menu-item > svg:last-child { color: #000; flex-shrink: 0; }
        .options-menu-divider { height: 1px; background-color: #e0e0e0; margin: 0 20px; }
        .contrast-panel { padding: 20px; }
        .contrast-panel-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .contrast-back-button { background: none; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; color: #333; border-radius: 4px; transition: background-color 0.2s ease; }
        .contrast-back-button:hover { background-color: #f0f0f0; }
        .contrast-panel-title { font-size: 20px; font-weight: 600; color: #000; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
        .contrast-options-list { display: flex; flex-direction: column; }
        .contrast-option { display: flex; align-items: center; padding: 16px 20px; cursor: pointer; transition: background-color 0.2s ease; gap: 12px; }
        .contrast-option:hover { background-color: #f5f5f5; }
        .contrast-option span { font-size: 16px; color: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; flex: 1; }
        .contrast-checkmark-container { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .contrast-checkmark { width: 24px; height: 24px; color: #000; }
        .contrast-option-divider { height: 1px; background-color: #e0e0e0; margin: 0 20px; }
        .instructions-content { padding: 0 20px 20px 20px; max-height: 60vh; overflow-y: auto; }
        .instructions-section { margin-bottom: 24px; }
        .instructions-section:last-child { margin-bottom: 0; }
        .instructions-section-title { font-size: 18px; font-weight: 600; color: #000; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
        .instructions-list { list-style: none; padding: 0; margin: 0; }
        .instructions-list li { font-size: 14px; color: #333; line-height: 1.6; margin-bottom: 10px; padding-left: 20px; position: relative; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
        .instructions-list li:before { content: '•'; position: absolute; left: 0; color: #666; font-weight: bold; }
        .instructions-list li:last-child { margin-bottom: 0; }
        .instructions-list li strong { font-weight: 600; color: #000; }
        .contrast-white-on-black { background-color: #000000 !important; color: #ffffff !important; }
        .contrast-white-on-black .test-header,
        .contrast-white-on-black .main-container,
        .contrast-white-on-black .left-panel,
        .contrast-white-on-black .part-header,
        .contrast-white-on-black .nav-row { background-color: #000000 !important; color: #ffffff !important; border-color: #333333 !important; }
        .contrast-white-on-black .question,
        .contrast-white-on-black .question p,
        .contrast-white-on-black .question-prompt,
        .contrast-white-on-black .part-header p,
        .contrast-white-on-black .part-header strong,
        .contrast-white-on-black .test-timer-display,
        .contrast-white-on-black .footer__questionNo___3WNct,
        .contrast-white-on-black .centered-title,
        .contrast-white-on-black .single-choice p,
        .contrast-white-on-black .matching-questions-container,
        .contrast-white-on-black .options-box,
        .contrast-white-on-black .notes-list { color: #ffffff !important; }
        .contrast-yellow-on-black { background-color: #000000 !important; }
        .contrast-yellow-on-black .test-header,
        .contrast-yellow-on-black .main-container,
        .contrast-yellow-on-black .left-panel,
        .contrast-yellow-on-black .part-header,
        .contrast-yellow-on-black .nav-row { background-color: #000000 !important; border-color: #333333 !important; }
        .contrast-yellow-on-black .question,
        .contrast-yellow-on-black .question p,
        .contrast-yellow-on-black .question-prompt,
        .contrast-yellow-on-black .part-header p,
        .contrast-yellow-on-black .part-header strong,
        .contrast-yellow-on-black .test-timer-display,
        .contrast-yellow-on-black .footer__questionNo___3WNct,
        .contrast-yellow-on-black .centered-title,
        .contrast-yellow-on-black .single-choice p,
        .contrast-yellow-on-black .matching-questions-container,
        .contrast-yellow-on-black .options-box,
        .contrast-yellow-on-black .notes-list { color: #ffff00 !important; }
        .text-size-large .question,
        .text-size-large .question p,
        .text-size-large .question-prompt,
        .text-size-large .part-header p,
        .text-size-large .centered-title,
        .text-size-large .single-choice label,
        .text-size-large .answer-input,
        .text-size-large .matching-questions-container { font-size: 1.25em !important; }
        .text-size-extra-large .question,
        .text-size-extra-large .question p,
        .text-size-extra-large .question-prompt,
        .text-size-extra-large .part-header p,
        .text-size-extra-large .centered-title,
        .text-size-extra-large .single-choice label,
        .text-size-extra-large .answer-input,
        .text-size-extra-large .matching-questions-container { font-size: 1.5em !important; }
      `}</style>
    </div>
  )
}



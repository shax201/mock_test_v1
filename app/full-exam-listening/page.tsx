'use client'

import { useState, useEffect, useRef } from 'react'

export default function FullExamListeningPage() {
  // Global State
  const [currentPart, setCurrentPart] = useState(1)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [currentSelection, setCurrentSelection] = useState<Range | null>(null)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [totalTime, setTotalTime] = useState(0)
  const [isReviewTime, setIsReviewTime] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  // Element refs
  const audioPlayerRef = useRef<HTMLAudioElement>(null)
  const mainContainerRef = useRef<HTMLDivElement>(null)
  const preExamOverlayRef = useRef<HTMLDivElement>(null)
  const instructionModalRef = useRef<HTMLDivElement>(null)
  const loaderRef = useRef<HTMLDivElement>(null)
  const centralPlayBtnRef = useRef<HTMLButtonElement>(null)
  const timerTextRef = useRef<HTMLSpanElement>(null)
  const timerDisplayRef = useRef<HTMLDivElement>(null)
  const volumeSliderRef = useRef<HTMLInputElement>(null)
  const deliverButtonRef = useRef<HTMLButtonElement>(null)
  const resultModalRef = useRef<HTMLDivElement>(null)
  const scoreSummaryRef = useRef<HTMLDivElement>(null)
  const resultDetailsRef = useRef<HTMLDivElement>(null)
  const modalCloseButtonRef = useRef<HTMLButtonElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const noteModalRef = useRef<HTMLDivElement>(null)
  const selectedTextQuoteRef = useRef<HTMLQuoteElement>(null)
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null)
  const saveNoteBtnRef = useRef<HTMLButtonElement>(null)
  const cancelNoteBtnRef = useRef<HTMLButtonElement>(null)
  const notesListRef = useRef<HTMLDivElement>(null)
  const toggleNotesBtnRef = useRef<HTMLButtonElement>(null)

  const audioSource = 'https://ia600302.us.archive.org/19/items/ricu-listening/RICU%20Listening.MP3'
  const correctAnswers = {
    'q1':['Creswick'],
    'q2':['Theatre'],
    'q3':['Place'],
    'q4':['Waitress'],
    'q5':['13th June','June 13th'],
    'q6':['5.30','5:30'],
    'q7':['Milk'],
    'q8':['Comic'],
    'q9':['Internet'],
    'q10':['leaflet'],
    'q11':'B',
    'q12':'A',
    'q13':'C',
    'q14':'B',
    'q15':'C',
    'q16':'C',
    'q17':'F',
    'q18':'B',
    'q19':'A',
    'q20':'G',
    'q21':'C',
    'q22':'C',
    'q23':'C',
    'q24':'A',
    'q25':'B',
    'q26':'A',
    'q27':'F',
    'q28':'C',
    'q29':'E',
    'q30':'B',
    'q31':['logic'],
    'q32':['guess'],
    'q33':['rumour'],
    'q34':['mistake'],
    'q35':['action'],
    'q36':['evidence'],
    'q37':['negative'],
    'q38':['threat'],
    'q39':['apology'],
    'q40':['compensation']
  }

  // --- PRE-EXAM FLOW ---
  const handleStartExam = () => {
    if (!instructionModalRef.current || !loaderRef.current || !centralPlayBtnRef.current) return

    instructionModalRef.current.classList.add('hidden')
    loaderRef.current.classList.remove('hidden')
    setTimeout(() => {
      if (!loaderRef.current || !centralPlayBtnRef.current) return
      loaderRef.current.classList.add('hidden')
      centralPlayBtnRef.current.classList.remove('hidden')
    }, 1500)
  }

  const handleCentralPlay = async () => {
    if (!preExamOverlayRef.current || !mainContainerRef.current || !audioPlayerRef.current) return

    preExamOverlayRef.current.classList.add('hidden')
    mainContainerRef.current.classList.remove('blur-background')

    try {
      await audioPlayerRef.current.play()
      console.log('Audio started playing')
      startTimer()
    } catch (error) {
      console.error('Audio play failed:', error)
      // Fallback: show an error message or provide manual play button
      alert('Audio failed to play. Please check your browser settings or try again.')
    }
  }

  const initializeExam = () => {
    if (!mainContainerRef.current || !preExamOverlayRef.current || !audioPlayerRef.current) return

    mainContainerRef.current.classList.add('blur-background')
  }

  // --- TIMER LOGIC ---
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`
  }

  const startTimer = () => {
    if (!audioPlayerRef.current || !timerTextRef.current) return

    const duration = Math.floor(audioPlayerRef.current.duration)
    setTotalTime(duration)
    timerTextRef.current.textContent = formatTime(duration)

    const interval = setInterval(updateTimer, 1000)
    setTimerInterval(interval)
  }

  const updateTimer = () => {
    setTotalTime(prev => {
      if (prev > 0) {
        const newTime = prev - 1
        if (timerTextRef.current) {
          timerTextRef.current.textContent = formatTime(newTime)
        }
        return newTime
      }
      if (!isReviewTime) {
        switchToReviewTimer()
      } else {
        if (timerInterval) {
          clearInterval(timerInterval)
          setTimerInterval(null)
        }
        checkAnswers() // Auto-submit
      }
      return prev
    })
  }

  const switchToReviewTimer = () => {
    setIsReviewTime(true)
    setTotalTime(120) // 2 minutes
    if (timerDisplayRef.current) {
      timerDisplayRef.current.classList.add('timer-critical')
    }
    if (timerTextRef.current) {
      timerTextRef.current.textContent = formatTime(120)
    }
  }

  // --- ANSWERING & NAVIGATION ---
  const switchToPart = (partNumber: number, event?: React.MouseEvent) => {
    if (event) event.stopPropagation()
    setCurrentPart(partNumber)
    document.querySelectorAll('.question-part').forEach(p => p.classList.add('hidden'))
    const partElement = document.getElementById(`part-${partNumber}`)
    if (partElement) partElement.classList.remove('hidden')
    const firstQuestionOfPart = (partNumber - 1) * 10 + 1
    goToQuestion(firstQuestionOfPart)
  }

  const updateNavigation = () => {
    document.querySelectorAll('.footer__questionWrapper___1tZ46').forEach((wrapper, index) =>
      wrapper.classList.toggle('selected', index + 1 === currentPart)
    )
    document.querySelectorAll('.subQuestion').forEach(btn => btn.classList.remove('active'))
    const activeBtn = document.querySelector(`.subQuestion[onclick="goToQuestion(${currentQuestion}, event)"]`)
    if (activeBtn) activeBtn.classList.add('active')
  }

  const updateNavButtonState = (questionNumber: number) => {
    const btn = document.querySelector(`.subQuestion[onclick="goToQuestion(${questionNumber}, event)"]`)
    if (!btn) return
    const element = document.getElementById(`q${questionNumber}`) || document.querySelector(`input[name="q${questionNumber}"]:checked`)
    const hasValue = element ? ((element as HTMLInputElement).type === 'radio' ? true : (element as HTMLInputElement).value.trim() !== '') : false
    btn.classList.toggle('answered', hasValue)
  }

  const goToQuestion = (questionNumber: number, event?: React.MouseEvent) => {
    if (event) event.stopPropagation()
    setCurrentQuestion(questionNumber)
    let partNumber = Math.ceil(questionNumber / 10)
    if (partNumber > 4) partNumber = 4
    if (currentPart !== partNumber) {
      setCurrentPart(partNumber)
      document.querySelectorAll('.question-part').forEach(p => p.classList.add('hidden'))
      const partElement = document.getElementById(`part-${partNumber}`)
      if (partElement) partElement.classList.remove('hidden')
    }
    const element = document.getElementById(`q${questionNumber}`) || document.querySelector(`input[name="q${questionNumber}"]`)
    if (element) {
      const container = element.closest('.question-item, .single-choice, .question-row, .notes-list li, .question')
      if (container) container.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const isFillInBlank = element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text'
      const targetForFlash = isFillInBlank ? element : container
      if (targetForFlash) {
        targetForFlash.classList.add('flash')
        setTimeout(() => targetForFlash.classList.remove('flash'), 1200)
      }
    }
    updateNavigation()
  }

  // --- SUBMISSION LOGIC ---
  const checkAnswers = () => {
    if (isSubmitted) return
    setIsSubmitted(true)
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
    let score = 0
    const resultsData = []

    // Reset previous results visuals
    document.querySelectorAll('.correct, .incorrect, .correct-answer-text').forEach(el => {
      if (el.classList.contains('correct-answer-text')) el.remove()
      else el.classList.remove('correct', 'incorrect')
    })
    document.querySelectorAll('.single-choice label').forEach(label => label.classList.remove('correct', 'incorrect'))
    document.querySelectorAll('input, select').forEach(input => (input as HTMLInputElement | HTMLSelectElement).disabled = true)
    if (deliverButtonRef.current) {
      deliverButtonRef.current.textContent = 'Submitted'
      deliverButtonRef.current.disabled = true
    }

    for (let i = 1; i <= 40; i++) {
      const key = `q${i}`
      const element = document.getElementById(key) as HTMLInputElement | HTMLSelectElement
      const btn = document.querySelector(`.subQuestion[onclick="goToQuestion(${i}, event)"]`)
      let userAnswer: string | undefined
      let isCorrect = false
      let correctAnswerText = ''

      if (element) { // Text or Select
        userAnswer = element.value.trim()
        const correctAnswer = correctAnswers[key as keyof typeof correctAnswers]
        const acceptedAnswers = Array.isArray(correctAnswer) ? correctAnswer : [String(correctAnswer)]
        isCorrect = acceptedAnswers.some((ans: string) => ans.toLowerCase() === (userAnswer || '').toLowerCase())
        element.classList.add(isCorrect ? 'correct' : 'incorrect')
        correctAnswerText = acceptedAnswers.join(' / ')
        if (!isCorrect) {
          const correctAnswerSpan = document.createElement('span')
          correctAnswerSpan.className = 'correct-answer-text'
          correctAnswerSpan.innerHTML = `&nbsp;✔ (${correctAnswerText})`
          element.parentNode?.insertBefore(correctAnswerSpan, element.nextSibling)
        } else {
          const correctIcon = document.createElement('span')
          correctIcon.className = 'correct-answer-text'
          correctIcon.textContent = ' ✔'
          element.parentNode?.insertBefore(correctIcon, element.nextSibling)
        }
      } else { // Radio buttons
        const radioGroup = document.querySelectorAll(`input[name="${key}"]`)
        const radioChecked = document.querySelector(`input[name="${key}"]:checked`) as HTMLInputElement | null
        userAnswer = radioChecked ? radioChecked.value : ''
        correctAnswerText = String(correctAnswers[key as keyof typeof correctAnswers])
        isCorrect = userAnswer.toLowerCase() === correctAnswerText.toLowerCase()
        radioGroup.forEach(radio => {
          const htmlRadio = radio as HTMLInputElement
          const label = htmlRadio.closest('label')
          if (label && htmlRadio.value.toLowerCase() === correctAnswerText.toLowerCase()) {
            label.innerHTML += ' <span class="result-correct">✔</span>'
          } else if (label && htmlRadio.checked) {
            label.innerHTML += ` <span class="result-incorrect">✖ (${correctAnswerText})</span>`
          }
        })
      }
      if (isCorrect) score++
      if (btn) btn.classList.add(isCorrect ? 'correct' : 'incorrect')
      resultsData.push({ question: i, userAnswer: userAnswer || 'No Answer', correctAnswer: correctAnswerText, isCorrect })
    }

    const results = { score, resultsData }
    setTestResults(results)
    showResultsModal()
  }

  const showResultsModal = () => {
    if (!testResults || !resultModalRef.current || !scoreSummaryRef.current || !resultDetailsRef.current) return

    const { score, resultsData } = testResults
    const band = (raw => {
      if(raw>=39)return 9;if(raw>=37)return 8.5;if(raw>=35)return 8;if(raw>=32)return 7.5;if(raw>=30)return 7;if(raw>=26)return 6.5;if(raw>=23)return 6;if(raw>=18)return 5.5;if(raw>=16)return 5;if(raw>=13)return 4.5;if(raw>=10)return 4;if(raw>=8)return 3.5;return 0
    })(score)

    if (scoreSummaryRef.current) {
      scoreSummaryRef.current.textContent = `You scored ${score} out of 40 (Band ${band}).`
    }

    let tableHTML = '<table><thead><tr><th>Question</th><th>Your Answer</th><th>Correct Answer</th><th>Result</th></tr></thead><tbody>'
    resultsData.forEach((res: any) => {
      tableHTML += `<tr><td>${res.question}</td><td>${res.userAnswer}</td><td>${res.correctAnswer}</td><td class="${res.isCorrect?'result-correct':'result-incorrect'}">${res.isCorrect?'✔':'✖'}</td></tr>`
    })
    tableHTML += '</tbody></table>'

    if (resultDetailsRef.current) {
      resultDetailsRef.current.innerHTML = tableHTML
    }
    resultModalRef.current.classList.remove('hidden')
  }

  // --- Event Listeners Setup ---
  useEffect(() => {
    // Volume slider
    if (volumeSliderRef.current && audioPlayerRef.current) {
      volumeSliderRef.current.addEventListener('input', (e) => {
        audioPlayerRef.current!.volume = parseFloat((e.target as HTMLInputElement).value)
      })
    }

    // Deliver button
    if (deliverButtonRef.current) {
      deliverButtonRef.current.addEventListener('click', checkAnswers)
    }

    // Modal close button
    if (modalCloseButtonRef.current && resultModalRef.current) {
      modalCloseButtonRef.current.addEventListener('click', () => {
        resultModalRef.current!.classList.add('hidden')
      })
    }

    // Audio player event listeners
    if (audioPlayerRef.current) {
      audioPlayerRef.current.addEventListener('ended', () => {
        if (!isReviewTime) {
          switchToReviewTimer()
          // To ensure it syncs, we restart the interval for the new countdown
          const interval = setInterval(updateTimer, 1000)
          setTimerInterval(interval)
        }
      }, { once: true })

      // Add error handling for audio
      audioPlayerRef.current.addEventListener('error', (e) => {
        console.error('Audio loading error:', e)
      })

      audioPlayerRef.current.addEventListener('loadeddata', () => {
        console.log('Audio loaded successfully')
      })

      audioPlayerRef.current.addEventListener('canplay', () => {
        console.log('Audio can play')
      })
    }

    // Attach listeners to all inputs for nav bar color change
    document.querySelectorAll('.answer-input, input[type="radio"]').forEach(el => {
      el.addEventListener('change', () => {
        const qNum = el.id ? el.id.replace('q', '') : (el as HTMLInputElement).name.replace('q', '')
        updateNavButtonState(parseInt(qNum))
      })
    })

    // --- Note & Highlight functionality ---
    const applyHighlight = (className: string) => {
      if (!currentSelection || currentSelection.collapsed) return null
      const span = document.createElement('span')
      span.className = className
      try {
        const contents = currentSelection.extractContents()
        span.appendChild(contents)
        currentSelection.insertNode(span)
      } catch (error) {
        console.error("Highlighting failed:", error)
        return null
      }
      clearSelection()
      return span
    }

    const showContextMenu = (e: MouseEvent) => {
      if (e.target && (e.target as HTMLElement).closest('input, textarea, select, .answer-input')) return
      e.preventDefault()
      const selection = window.getSelection()
      if (selection && selection.toString().trim().length > 0) {
        setCurrentSelection(selection.getRangeAt(0).cloneRange())
        if (contextMenuRef.current) {
          contextMenuRef.current.style.left = `${e.pageX}px`
          contextMenuRef.current.style.top = `${e.pageY}px`
          contextMenuRef.current.style.display = 'block'
        }
      } else {
        clearSelection()
      }
    }

    const closeNoteModal = () => {
      if (noteTextareaRef.current) noteTextareaRef.current.value = ''
      if (noteModalRef.current) noteModalRef.current.style.display = 'none'
      clearSelection()
    }

    const clearSelection = () => {
      window.getSelection()?.removeAllRanges()
      setCurrentSelection(null)
      if (contextMenuRef.current) contextMenuRef.current.style.display = 'none'
    }

    const mainContentArea = document.getElementById('main-content-area')
    if (mainContentArea) {
      mainContentArea.addEventListener('contextmenu', showContextMenu)
    }

    document.addEventListener('click', (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        contextMenuRef.current.style.display = 'none'
      }
    })

    // Context menu buttons
    const highlightBtn = document.getElementById('highlight-btn')
    const noteBtn = document.getElementById('note-btn')

    if (highlightBtn) {
      highlightBtn.addEventListener('click', () => applyHighlight('highlight'))
    }

    if (noteBtn) {
      noteBtn.addEventListener('click', () => {
        if (currentSelection && selectedTextQuoteRef.current && noteModalRef.current) {
          selectedTextQuoteRef.current.textContent = currentSelection.toString()
          noteModalRef.current.style.display = 'block'
          if (contextMenuRef.current) contextMenuRef.current.style.display = 'none'
        }
      })
    }

    if (saveNoteBtnRef.current) {
      saveNoteBtnRef.current.addEventListener('click', () => {
        const noteText = noteTextareaRef.current?.value.trim()
        const selectedText = selectedTextQuoteRef.current?.textContent
        if (currentSelection && (noteText || selectedText) && notesListRef.current) {
          const highlightSpan = applyHighlight('note-highlight')
          if (!highlightSpan) return
          const noteId = `note-${Date.now()}`
          highlightSpan.id = noteId
          const noteItem = document.createElement('div')
          noteItem.className = 'note-item'
          noteItem.dataset.targetId = noteId
          noteItem.innerHTML = `<button class="delete-note-btn" title="Delete note">&times;</button><div class="quoted-text">"${selectedText}"</div><div class="note-content">${noteText || '<i>No additional comment.</i>'}</div>`
          noteItem.addEventListener('click', (e) => {
            e.stopPropagation()
            if ((e.target as HTMLElement).classList.contains('delete-note-btn')) return
            const targetElement = document.getElementById(noteId)
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
              targetElement.classList.add('flash')
              setTimeout(() => targetElement.classList.remove('flash'), 1200)
            }
          })
          notesListRef.current.appendChild(noteItem)
          if (!document.body.classList.contains('notes-visible') && toggleNotesBtnRef.current) {
            document.body.classList.add('notes-visible')
            toggleNotesBtnRef.current.classList.add('active')
          }
          closeNoteModal()
        }
      })
    }

    if (notesListRef.current) {
      notesListRef.current.addEventListener('click', function(e) {
        if ((e.target as HTMLElement).classList.contains('delete-note-btn')) {
          e.stopPropagation()
          const noteItem = (e.target as HTMLElement).closest('.note-item')
          if (!noteItem) return
          const noteId = (noteItem as HTMLElement).dataset.targetId
          const highlightSpan = document.getElementById(noteId!)
          if (highlightSpan) {
            const parent = highlightSpan.parentNode
            if (parent) {
              while (highlightSpan.firstChild) {
                parent.insertBefore(highlightSpan.firstChild, highlightSpan)
              }
              parent.removeChild(highlightSpan)
              parent.normalize()
            }
          }
          noteItem.remove()
          if (notesListRef.current && notesListRef.current.children.length === 0 && toggleNotesBtnRef.current) {
            document.body.classList.remove('notes-visible')
            toggleNotesBtnRef.current.classList.remove('active')
          }
        }
      })
    }

    if (cancelNoteBtnRef.current) {
      cancelNoteBtnRef.current.addEventListener('click', closeNoteModal)
    }

    if (toggleNotesBtnRef.current) {
      toggleNotesBtnRef.current.addEventListener('click', () => {
        document.body.classList.toggle('notes-visible')
        toggleNotesBtnRef.current!.classList.toggle('active')
      })
    }

    // Setup input placeholders and attributes
    document.querySelectorAll('.answer-input[type="text"]').forEach(input => {
      const questionNumber = (input as HTMLElement).id.replace('q', '')
      ;(input as HTMLInputElement).placeholder = questionNumber
      ;(input as HTMLInputElement).setAttribute('spellcheck', 'false')
      ;(input as HTMLInputElement).setAttribute('autocomplete', 'off')
    })

    // Initialize
    switchToPart(1, undefined)
    initializeExam()

    // Cleanup
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [])

  return (
    <>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background-color: #f0f2f5; line-height: 1.6; font-size: 16px; padding-bottom: 90px; }
        .header { background-color: #ffffff; padding: 12px 20px; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; position: fixed; top: 0; left: 0; right: 0; z-index: 100; height: 60px; }
        .header-logo { height: 45px; width: auto; }
        .header-right-controls { display: flex; align-items: center; gap: 20px; }
        .icon { width: 24px; height: 24px; cursor: pointer; color: #555; display: flex; align-items: center; justify-content: center; background: none; border: none; padding: 0; transition: color 0.2s; }
        .icon:hover { color: #007bff; }
        .icon.active { color: #007bff; }
        #timer-display { display: flex; align-items: center; font-weight: bold; font-size: 18px; color: #333; }
        #timer-display.timer-critical { color: #dc3545; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        #timer-display svg { margin-right: 8px; }
        .main-container { margin-top: 80px; display: flex; justify-content: center; padding: 10px; }
        .left-panel { width: 100%; max-width: 900px; padding: 20px 30px; transition: all 0.3s; background-color: #ffffff; border: 1px solid #ddd; border-radius: 5px; }
        .notes-panel { width: 300px; min-width: 280px; background-color: #f8f9fa; border-left: 1px solid #ccc; display: none; flex-direction: column; flex-shrink: 0; height: calc(100vh - 60px); position: fixed; right: 0; top: 60px; box-shadow: -2px 0 5px rgba(0,0,0,0.1); }
        body.notes-visible .left-panel { margin-right: 310px; }
        body.notes-visible .notes-panel { display: flex; }
        .notes-panel-header { padding: 10px 15px; background-color: #e9ecef; border-bottom: 1px solid #ccc; position: sticky; top: 0; z-index: 10; }
        .notes-panel-header h3 { margin: 0; font-size: 1.1em; }
        #notes-list { flex-grow: 1; overflow-y: auto; padding: 15px; }
        .note-item { position: relative; margin-bottom: 15px; padding: 12px; background-color: #fff; border: 1px solid #eee; border-left: 4px solid #28a745; border-radius: 4px; cursor: pointer; }
        .delete-note-btn { position: absolute; top: 5px; right: 5px; background: transparent; border: none; font-size: 1.4em; color: #aaa; cursor: pointer; padding: 0 5px; line-height: 1; }
        .delete-note-btn:hover { color: #333; }
        .note-item:hover { background-color: #f1f1f1; }
        .note-item .quoted-text { font-style: italic; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 8px; font-size: 0.9em; padding-right: 20px; }
        .note-item .note-content { font-size: 1em; color: #333; }
        .part-header { background-color: #f1f2ec; padding: 15px; border-radius: 5px; margin-bottom: 30px; border: 1px solid #e0e0e0; }
        .part-header p { margin: 0; }
        .question { margin-bottom: 40px; }
        .question-prompt p { margin-bottom: 15px; line-height: 1.7; }
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
        .highlight { background-color: #fffb8b; }
        .note-highlight { background-color: #c8e6c9; }
        #context-menu { position: absolute; display: none; background-color: #fff; border: 1px solid #ccc; box-shadow: 2px 2px 5px rgba(0,0,0,0.2); border-radius: 5px; padding: 5px; z-index: 1000; }
        #context-menu button { display: block; width: 100%; padding: 8px 12px; border: none; background-color: transparent; cursor: pointer; text-align: left; }
        #context-menu button:hover { background-color: #f0f0f0; }
        #note-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; background: white; border: 1px solid #ccc; box-shadow: 0 5px 15px rgba(0,0,0,0.3); z-index: 1001; padding: 20px; border-radius: 8px; display: none; }
        #note-modal h4 { margin-top: 0; }
        #note-modal blockquote { background: #f9f9f9; border-left: 5px solid #ccc; margin: 1em 0; padding: 0.5em 10px; font-style: italic; }
        #note-textarea { width: 100%; height: 100px; margin-top: 10px; padding: 5px; font-family: Arial, sans-serif; }
        #note-modal button { margin-top: 10px; padding: 8px 15px; }
        .aligned-form .question-row { display: flex; align-items: center; margin-bottom: 15px; }
        .aligned-form .question-label { width: 300px; flex-shrink: 0; }
        .notes-list { list-style: none; padding-left: 0; }
        .notes-list p { font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
        .notes-list p:first-child { margin-top: 0; }
        .notes-list > li { margin-bottom: 15px; padding-left: 20px; position: relative; line-height: 2.2; }
        .notes-list > li::before { content: '•'; position: absolute; left: 0; top: 8px; color: #333; line-height: 1; }
        .notes-list ul { list-style: disc; padding-left: 40px; margin-top: 15px; }
        .notes-list ul li { margin-bottom: 15px; padding-left: 0; }
        .notes-list ul li::before { display: none; }
        .centered-title { text-align: center; font-size: 1.2em; font-weight: bold; margin-bottom: 25px; margin-top: 10px; }
        .single-choice-container { margin: 10px 0; display: flex; flex-direction: column; gap: 20px; }
        .single-choice label { display: block; margin: 8px 0; font-size: 16px; cursor: pointer; padding-left: 5px;}
        .single-choice input { margin-right: 12px; }
        .single-choice p { font-weight: bold; margin-bottom: 8px; }
      `}</style>

      <div className="pre-exam-overlay" ref={preExamOverlayRef} id="pre-exam-overlay">
        <div className="instruction-modal" ref={instructionModalRef} id="instruction-modal">
          <h2>Listening Test Instructions</h2>
          <p>◉ Check your headphones carefully before you start.</p>
          <p>◉ The Listening test has 4 parts.</p>
          <p>◉ There are 40 questions in total.</p>
          <p>◉ You will hear each recording once only.</p>
          <p>◉ You can adjust the volume during the test.</p>
          <p>◉ You can check and change your answers while you are listening.</p>
          <p>◉ After the recording ends, you will have 2 minutes to check your answers.</p>
          <p>◉ Spelling and grammar are important.</p>
          <p>◉ When you are ready, click Start Test to begin.</p>
          <button onClick={handleStartExam} id="start-exam-btn">Start Exam</button>
        </div>
        <div className="loader hidden" ref={loaderRef} id="loader"></div>
        <button ref={centralPlayBtnRef} onClick={handleCentralPlay} id="central-play-btn" className="hidden">
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M8 5v14l11-7L8 5z"/></svg>
        </button>
      </div>

      <div className="header">
        <a href="https://radianceedu.com/" target="_blank">
          <img src="https://radianceedu.com/wp-content/uploads/2025/08/New-Logo-1.png" alt="Radiance Edu Logo" className="header-logo" />
        </a>
        <div className="header-right-controls">
          <div ref={timerDisplayRef} id="timer-display">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
            <span ref={timerTextRef} id="timer-text">00:00</span>
          </div>
          <button ref={toggleNotesBtnRef} id="toggle-notes-panel-btn" className="icon" title="Show Notes">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </button>
        </div>
      </div>

      <div className="main-container" ref={mainContainerRef} id="main-test-container">
        <div className="left-panel" id="main-content-area">

          <div id="part-1" className="question-part">
            <div className="part-header"><p><strong>Part 1: Questions 1–10</strong></p></div>
            <div className="question">
              <div className="question-prompt">
                <p>Complete the notes below.</p>
                <p>Write <strong>ONE WORD AND/OR A NUMBER</strong> for each answer.</p>
              </div>
              <h3 className="centered-title">Booking a residential workshop</h3>
              <div style={{border: '1px solid #ddd', padding: '25px', borderRadius: '5px'}}>
                <p><strong>Course required:</strong> drama workshop</p>
                <div className="aligned-form" style={{marginTop: '20px'}}>
                  <div className="question-row"><span className="question-label">Full name of participant:</span> Jan <strong>1</strong> <input type="text" id="q1" className="answer-input" /></div>
                  <div className="question-row"><span className="question-label">Previous course attended:</span> Writing for the <strong>2</strong> <input type="text" id="q2" className="answer-input" /></div>
                  <div className="question-row"><span className="question-label">Address:</span> 20, Gregory <strong>3</strong> <input type="text" id="q3" className="answer-input" /></div>
                  <div className="question-row"><span className="question-label">Current occupation:</span> <strong>4</strong> <input type="text" id="q4" className="answer-input" /></div>
                  <div className="question-row"><span className="question-label">Date chosen course begins:</span> <strong>5</strong> <input type="text" id="q5" className="answer-input" /></div>
                  <div className="question-row"><span className="question-label">Estimated arrival time:</span> <strong>6</strong> <input type="text" id="q6" className="answer-input" /> PM</div>
                  <div className="question-row"><span className="question-label">Special dietary requests:</span> No <strong>7</strong> <input type="text" id="q7" className="answer-input" /> products</div>
                  <div className="question-row"><span className="question-label">Preferred afternoon course:</span> <strong>8</strong> <input type="text" id="q8" className="answer-input" /> work</div>
                  <div className="question-row"><span className="question-label">First source of course information:</span> <strong>9</strong> <input type="text" id="q9" className="answer-input" /></div>
                  <div className="question-row"><span className="question-label">Pre-course material requested:</span> the <strong>10</strong> <input type="text" id="q10" className="answer-input" /> mentioned in the publicity</div>
                </div>
              </div>
            </div>
          </div>

          <div id="part-2" className="question-part hidden">
            <div className="part-header"><p><strong>Part 2: Questions 11–20</strong></p></div>
            <div className="question">
              <div className="question-prompt"><p><strong>Questions 11-15</strong><br />Choose the correct letter, <strong>A, B or C</strong>.</p></div>
              <div className="single-choice-container">
                <div className="single-choice"><p>11 What does Mark say first attracts people to working for Johnson Jones?</p><label><input type="radio" name="q11" value="A" /> A the pay</label><label><input type="radio" name="q11" value="B" /> B the staff discount</label><label><input type="radio" name="q11" value="C" /> C the working hours</label></div>
                <div className="single-choice"><p>12 Mark says the company is one of the country's most successful retailers because it</p><label><input type="radio" name="q12" value="A" /> A is focused on long term planning.</label><label><input type="radio" name="q12" value="B" /> B provides excellent customer service.</label><label><input type="radio" name="q12" value="C" /> C offers value for money.</label></div>
                <div className="single-choice"><p>13 Mark says that because Johnson Jones is a partnership, the staff</p><label><input type="radio" name="q13" value="A" /> A are better trained.</label><label><input type="radio" name="q13" value="B" /> B have better job security.</label><label><input type="radio" name="q13" value="C" /> C are given more responsibility.</label></div>
                <div className="single-choice"><p>14 What is the typical annual bonus that partners receive?</p><label><input type="radio" name="q14" value="A" /> A 8%</label><label><input type="radio" name="q14" value="B" /> B 15%</label><label><input type="radio" name="q14" value="C" /> C 20%</label></div>
                <div className="single-choice"><p>15 To qualify for the leisure and holiday facilities, partners must have worked for the company for</p><label><input type="radio" name="q15" value="A" /> A one year.</label><label><input type="radio" name="q15" value="B" /> B six months.</label><label><input type="radio" name="q15" value="C" /> C three months.</label></div>
              </div>
            </div>
            <div className="question">
              <div className="question-prompt"><p><strong>Questions 16-20</strong></p><p>What did each of the following studies find?</p><p>Choose <strong>FIVE</strong> answers from the box and write the correct letter, <strong>A-G</strong>, next to Questions 16-20.</p></div>
              <div className="task-wrapper">
                <div className="options-box"><h3>Information</h3><ul><li><strong>A</strong> available for celebrations and parties</li><li><strong>B</strong> suitable for families with children</li><li><strong>C</strong> regularly used by senior management</li><li><strong>D</strong> also supplies food to the company's supermarkets</li><li><strong>E</strong> spa facilities available</li><li><strong>F</strong> similar to being in someone's home</li><li><strong>G</strong> good for short breaks</li></ul></div>
                <div className="matching-questions-container"><p style={{fontWeight: 'bold', marginBottom: '15px'}}>Staff Holiday Centres</p>
                  <div className="question-item"><label htmlFor="q16"><strong>16</strong> The Grange</label> <select id="q16" className="answer-input"><option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option></select></div>
                  <div className="question-item"><label htmlFor="q17"><strong>17</strong> Meadow House</label> <select id="q17" className="answer-input"><option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option></select></div>
                  <div className="question-item"><label htmlFor="q18"><strong>18</strong> Coombe Manor</label> <select id="q18" className="answer-input"><option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option></select></div>
                  <div className="question-item"><label htmlFor="q19"><strong>19</strong> The Barn</label> <select id="q19" className="answer-input"><option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option></select></div>
                  <div className="question-item"><label htmlFor="q20"><strong>20</strong> The Stable</label> <select id="q20" className="answer-input"><option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option></select></div>
                </div>
              </div>
            </div>
          </div>

          <div id="part-3" className="question-part hidden">
            <div className="part-header"><p><strong>Part 3: Questions 21–30</strong></p></div>
            <div className="question">
              <div className="question-prompt"><p><strong>Questions 21-26</strong></p><p>Choose the correct letter, <strong>A, B or C</strong>.</p></div>
              <div className="single-choice-container">
                <div className="single-choice"><p>21 Why is Fiona keen to organise a debate?</p><label><input type="radio" name="q21" value="A" /> A. She has attended debates while at secondary school.</label><label><input type="radio" name="q21" value="B" /> B. She organised debating with a friend.</label><label><input type="radio" name="q21" value="C" /> C. She has talked about debating with Daniel.</label></div>
                <div className="single-choice"><p>22 Fiona says that an advantage of debating is that it can</p><label><input type="radio" name="q22" value="A" /> A. help students to form opinions.</label><label><input type="radio" name="q22" value="B" /> B. improve students' listening skills.</label><label><input type="radio" name="q22" value="C" /> C. develop students' self-confidence.</label></div>
                <div className="single-choice"><p>23 How will the debate topic be selected?</p><label><input type="radio" name="q23" value="A" /> A. Daniel and Fiona will ask the lecturer to choose one from a list.</label><label><input type="radio" name="q23" value="B" /> B. The other students will select one of Daniel and Fiona's Suggestions.</label><label><input type="radio" name="q23" value="C" /> C. Daniel and Fiona will collect Suggestions from the other students.</label></div>
                <div className="single-choice"><p>24 Daniel and Fiona think one key to a successful debate is for students to</p><label><input type="radio" name="q24" value="A" /> A. have a topic that really involves them.</label><label><input type="radio" name="q24" value="B" /> B. plan their speech Carefully.</label><label><input type="radio" name="q24" value="C" /> C. be given positions to defend.</label></div>
                <div className="single-choice"><p>25 Daniel thinks it would be good for the students to be in two teams because it would</p><label><input type="radio" name="q25" value="A" /> A. give everyone a chance to speak.</label><label><input type="radio" name="q25" value="B" /> B. help students with less confidence.</label><label><input type="radio" name="q25" value="C" /> C. share out the preparation required.</label></div>
                <div className="single-choice"><p>26 What does the lecturer agree to do after the debate?</p><label><input type="radio" name="q26" value="A" /> A. make comments on students' written work.</label><label><input type="radio" name="q26" value="B" /> B. help Daniel and Fiona to write a report.</label><label><input type="radio" name="q26" value="C" /> C. set the students an essay on a different topic.</label></div>
              </div>
            </div>
            <div className="question">
              <div className="question-prompt"><p><strong>Questions 27-30</strong></p><p>What will Daniel and Fiona do at the meeting to help students with debate?</p><p>Choose <strong>FOUR</strong> answers from the box and write the correct letter, <strong>A-F</strong>, next to questions 27-30.</p></div>
              <div className="task-wrapper">
                <div className="options-box"><h3>Actions at the meeting</h3><ul><li><strong>A</strong> ask for suggestion</li><li><strong>B</strong> give a handout of key points</li><li><strong>C</strong> write on the board</li><li><strong>D</strong> provide a photocopy of an article</li><li><strong>E</strong> recommend a textbook</li><li><strong>F</strong> give a demonstration</li></ul></div>
                <div className="matching-questions-container"><p style={{fontWeight: 'bold', marginBottom: '15px'}}>Aspects of a debate</p>
                  <div className="question-item"><label htmlFor="q27"><strong>27</strong> understanding debating procedures</label> <select id="q27" className="answer-input"><option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option></select></div>
                  <div className="question-item"><label htmlFor="q28"><strong>28</strong> using body language</label> <select id="q28" className="answer-input"><option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option></select></div>
                  <div className="question-item"><label htmlFor="q29"><strong>29</strong> accessing resources</label> <select id="q29" className="answer-input"><option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option></select></div>
                  <div className="question-item"><label htmlFor="q30"><strong>30</strong> asking and answering questions</label> <select id="q30" className="answer-input"><option value=""></option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option></select></div>
                </div>
              </div>
            </div>
          </div>

          <div id="part-4" className="question-part hidden">
            <div className="part-header"><p><strong>Part 4: Questions 31–40</strong></p></div>
            <div className="question">
              <div className="question-prompt"><p>Complete the notes below.</p><p>Write <strong>ONE WORD ONLY</strong> for each answer.</p></div>
              <div style={{border: '1px solid #ddd', padding: '25px', borderRadius: '5px'}}>
                <h4 className="centered-title">Crisis Communication Theory</h4>
                <div className="notes-list">
                  <p><strong>Why do we need theory?</strong></p><ul><li>Some people think using <strong>31</strong><input type="text" id="q31" className="answer-input" /> is better than theory</li><li>But a lot of advice is simply a <strong>32</strong><input type="text" id="q32" className="answer-input" /></li></ul>
                  <p><strong>Types of crisis</strong></p><ul><li>The organisation can be a victim - e.g. due to a <strong>33</strong><input type="text" id="q33" className="answer-input" /></li><li>Crisis can be accidental - caused by external factors</li><li>Crisis can be preventable - resulting from a <strong>34</strong><input type="text" id="q34" className="answer-input" /> in the organisation</li></ul>
                  <p><strong>Suggested response for all crises</strong></p><ul><li>Give information to prevent any more damage</li><li>Communicate what <strong>35</strong><input type="text" id="q35" className="answer-input" /> is to be taken</li></ul>
                  <p><strong>Strategies to influence people's thinking</strong></p>
                  <div style={{paddingLeft: '20px'}}><p><u>Diminish the crisis</u></p><ul><li>Provide <strong>36</strong><input type="text" id="q36" className="answer-input" /> that the crisis is not so bad</li></ul><p><u>Give excuses for the crisis</u></p><ul><li>Highlight that it was not intentional!</li></ul></div>
                  <p><strong>Protecting the organisation's reputation</strong></p>
                  <ul><li>Initial objective is to lessen <strong>37</strong><input type="text" id="q37" className="answer-input" /> opinions</li><li>Rebuild strategies are important when<ul><li>there is a serious <strong>38</strong><input type="text" id="q38" className="answer-input" /> to the organisation's reputation</li><li>the impact of the crisis needs lessening</li></ul></li><li>Things can be improved by providing an <strong>39</strong><input type="text" id="q39" className="answer-input" /></li><li>In serious cases, <strong>40</strong><input type="text" id="q40" className="answer-input" /> is usually offered</li></ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="notes-panel" id="notes-panel">
          <div className="notes-panel-header"><h3>My Notes</h3></div>
          <div ref={notesListRef} id="notes-list"></div>
        </div>
      </div>

      <audio ref={audioPlayerRef} id="global-audio-player" src={audioSource} className="hidden" preload="auto" />

      <nav className="nav-row">
        <div className="footer__questionWrapper___1tZ46" onClick={(e) => switchToPart(1, e)}><button className="footer__questionNo___3WNct"><span>Part 1</span></button>
          <div className="footer__subquestionWrapper___9GgoP">
            <button className="subQuestion" onClick={(e) => goToQuestion(1, e)}>1</button><button className="subQuestion" onClick={(e) => goToQuestion(2, e)}>2</button><button className="subQuestion" onClick={(e) => goToQuestion(3, e)}>3</button><button className="subQuestion" onClick={(e) => goToQuestion(4, e)}>4</button><button className="subQuestion" onClick={(e) => goToQuestion(5, e)}>5</button><button className="subQuestion" onClick={(e) => goToQuestion(6, e)}>6</button><button className="subQuestion" onClick={(e) => goToQuestion(7, e)}>7</button><button className="subQuestion" onClick={(e) => goToQuestion(8, e)}>8</button><button className="subQuestion" onClick={(e) => goToQuestion(9, e)}>9</button><button className="subQuestion" onClick={(e) => goToQuestion(10, e)}>10</button>
          </div>
        </div>
        <div className="footer__questionWrapper___1tZ46" onClick={(e) => switchToPart(2, e)}><button className="footer__questionNo___3WNct"><span>Part 2</span></button>
          <div className="footer__subquestionWrapper___9GgoP">
            <button className="subQuestion" onClick={(e) => goToQuestion(11, e)}>11</button><button className="subQuestion" onClick={(e) => goToQuestion(12, e)}>12</button><button className="subQuestion" onClick={(e) => goToQuestion(13, e)}>13</button><button className="subQuestion" onClick={(e) => goToQuestion(14, e)}>14</button><button className="subQuestion" onClick={(e) => goToQuestion(15, e)}>15</button><button className="subQuestion" onClick={(e) => goToQuestion(16, e)}>16</button><button className="subQuestion" onClick={(e) => goToQuestion(17, e)}>17</button><button className="subQuestion" onClick={(e) => goToQuestion(18, e)}>18</button><button className="subQuestion" onClick={(e) => goToQuestion(19, e)}>19</button><button className="subQuestion" onClick={(e) => goToQuestion(20, e)}>20</button>
          </div>
        </div>
        <div className="footer__questionWrapper___1tZ46" onClick={(e) => switchToPart(3, e)}><button className="footer__questionNo___3WNct"><span>Part 3</span></button>
          <div className="footer__subquestionWrapper___9GgoP">
            <button className="subQuestion" onClick={(e) => goToQuestion(21, e)}>21</button><button className="subQuestion" onClick={(e) => goToQuestion(22, e)}>22</button><button className="subQuestion" onClick={(e) => goToQuestion(23, e)}>23</button><button className="subQuestion" onClick={(e) => goToQuestion(24, e)}>24</button><button className="subQuestion" onClick={(e) => goToQuestion(25, e)}>25</button><button className="subQuestion" onClick={(e) => goToQuestion(26, e)}>26</button><button className="subQuestion" onClick={(e) => goToQuestion(27, e)}>27</button><button className="subQuestion" onClick={(e) => goToQuestion(28, e)}>28</button><button className="subQuestion" onClick={(e) => goToQuestion(29, e)}>29</button><button className="subQuestion" onClick={(e) => goToQuestion(30, e)}>30</button>
          </div>
        </div>
        <div className="footer__questionWrapper___1tZ46" onClick={(e) => switchToPart(4, e)}><button className="footer__questionNo___3WNct"><span>Part 4</span></button>
          <div className="footer__subquestionWrapper___9GgoP">
            <button className="subQuestion" onClick={(e) => goToQuestion(31, e)}>31</button><button className="subQuestion" onClick={(e) => goToQuestion(32, e)}>32</button><button className="subQuestion" onClick={(e) => goToQuestion(33, e)}>33</button><button className="subQuestion" onClick={(e) => goToQuestion(34, e)}>34</button><button className="subQuestion" onClick={(e) => goToQuestion(35, e)}>35</button><button className="subQuestion" onClick={(e) => goToQuestion(36, e)}>36</button><button className="subQuestion" onClick={(e) => goToQuestion(37, e)}>37</button><button className="subQuestion" onClick={(e) => goToQuestion(38, e)}>38</button><button className="subQuestion" onClick={(e) => goToQuestion(39, e)}>39</button><button className="subQuestion" onClick={(e) => goToQuestion(40, e)}>40</button>
          </div>
        </div>
        <div className="volume-container">
          <button id="volume-btn" className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </button>
          <input ref={volumeSliderRef} type="range" id="new-volume-slider" min="0" max="1" step="0.01" defaultValue="1" />
        </div>
        <button ref={deliverButtonRef} id="deliver-button" className="footer__deliverButton___3FM07">Submit</button>
      </nav>

      <div ref={resultModalRef} id="result-modal" className="modal-overlay hidden">
        <div className="modal-content">
          <div className="modal-header"><h2>Your Results</h2><button ref={modalCloseButtonRef} id="modal-close-button" className="modal-close-btn">&times;</button></div>
          <div ref={scoreSummaryRef} id="score-summary"></div>
          <div ref={resultDetailsRef} id="result-details"></div>
        </div>
      </div>
      <div id="context-menu"><button id="highlight-btn">Highlight</button><button id="note-btn">Note</button></div>
      <div ref={noteModalRef} id="note-modal"><h4>Add a Note</h4><p>Selected Text:</p><blockquote ref={selectedTextQuoteRef} id="selected-text-quote"></blockquote><textarea ref={noteTextareaRef} id="note-textarea" placeholder="Type your note here..." spellCheck="false" autoComplete="off"></textarea><button ref={saveNoteBtnRef} id="save-note-btn">Save Note</button><button ref={cancelNoteBtnRef} id="cancel-note-btn">Cancel</button></div>
    </>
  )
}

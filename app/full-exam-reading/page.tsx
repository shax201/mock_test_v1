'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ReadingTest.module.css';
import testData from './reading-test-data.json';

interface Note {
  id: number;
  text: string;
  highlightedText: string;
  element: HTMLElement;
}

interface ResultDetail {
  qNum: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

const ReadingTest: React.FC = () => {
  const [currentPassage, setCurrentPassage] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeInSeconds, setTimeInSeconds] = useState(3600);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [activeQuestionElement, setActiveQuestionElement] = useState<HTMLElement | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteIdCounter, setNoteIdCounter] = useState(0);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [results, setResults] = useState<{ score: number; band: number; details: ResultDetail[] }>({
    score: 0,
    band: 0,
    details: []
  });
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [attemptedCounts, setAttemptedCounts] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0
  });
  const [subQuestionButtons, setSubQuestionButtons] = useState<{part: number, buttons: number[]}>({
    part: 1,
    buttons: []
  });

  const timerDisplayRef = useRef<HTMLDivElement>(null);
  const deliverButtonRef = useRef<HTMLButtonElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const passagePanelRef = useRef<HTMLDivElement>(null);
  const questionsPanelRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const notesListRef = useRef<HTMLDivElement>(null);
  const headerNotesBtnRef = useRef<HTMLButtonElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const headingsListRef = useRef<HTMLUListElement>(null);

  const correctAnswers = testData.correctAnswers as Record<string, string>;

  const passageConfigs = testData.passageConfigs;

  const startExam = useCallback(() => {
    setIsTestStarted(true);
    initializeTest();
  }, []);

  const initializeTest = useCallback(() => {
    startTimer();
    initializeDragAndDrop();
    setupEventListeners();
  }, []);

  const startTimer = useCallback(() => {
    const interval = setInterval(() => {
      setTimeInSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          checkAnswers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerInterval(interval);
  }, []);

  const setupBottomNav = useCallback(() => {
    // Setup bottom navigation sub-questions for the current part
    const currentConfig = passageConfigs.find(config => config.part === currentPassage);
    if (currentConfig) {
      const buttons = [];
      for (let i = 0; i < currentConfig.total; i++) {
        buttons.push(currentConfig.start + i);
      }
      setSubQuestionButtons({ part: currentPassage, buttons });
    }
  }, [currentPassage]);

  const initializeDragAndDrop = useCallback(() => {
    // Drag and drop is now handled through React event handlers in JSX
    // No need for manual DOM event listener attachment
  }, []);

  const setupEventListeners = useCallback(() => {
    // Add input and change event listeners for updating indicators
    document.addEventListener('input', updateAllIndicators);
    document.addEventListener('change', updateAllIndicators);

    // Context menu setup
    const panels = [passagePanelRef.current, questionsPanelRef.current].filter(Boolean);
    panels.forEach(panel => {
      if (panel) {
        panel.addEventListener('contextmenu', showContextMenu);
      }
    });

    document.addEventListener('click', (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    });

    // Selection change listener
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const panels = [passagePanelRef.current, questionsPanelRef.current].filter(Boolean);
        if (panels.some(panel => panel?.contains(range.commonAncestorContainer))) {
          setSelectedRange(range);
        }
      }
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, headingValue: string) => {
    e.dataTransfer.setData('text/plain', headingValue);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetBoxId: string) => {
    e.preventDefault();
    const draggedHeadingValue = e.dataTransfer.getData('text/plain');
    if (!draggedHeadingValue) return;

    const targetBox = e.currentTarget as HTMLElement;
    const headingsList = headingsListRef.current;

    // Find the dragged heading element
    const draggedHeading = document.querySelector(`[data-value="${draggedHeadingValue}"]`) as HTMLElement;
    if (!draggedHeading) return;

    const origin = draggedHeading.parentElement;

    // Handle drop into drop box
    if (targetBox.classList.contains(styles.dropBox)) {
      const existingItem = targetBox.querySelector(`.${styles.headingItem}`);
      if (existingItem) {
        headingsList?.appendChild(existingItem);
      }
      targetBox.innerHTML = '';
      targetBox.appendChild(draggedHeading);
      targetBox.classList.add('answered');
    }
    // Handle drop back to headings list
    else if (targetBox === headingsList) {
      headingsList?.appendChild(draggedHeading);
    }

    // Clean up origin if it's a drop box and now empty
    if (origin && origin.classList.contains(styles.dropBox) && !origin.querySelector(`.${styles.headingItem}`)) {
      origin.classList.remove('answered');
      const qNum = origin.getAttribute('data-q-num');
      if (qNum) {
        origin.innerHTML = `<span>${qNum}</span>`;
      }
    }

    updateAllIndicators();
  }, []);

  const checkAnswers = useCallback(() => {
    if (timerInterval) clearInterval(timerInterval);

    let score = 0;
    const resultDetails: ResultDetail[] = [];

    for (let i = 1; i <= 40; i++) {
      const { value, text } = getUserAnswer(i);
      const correctAnswer = correctAnswers[i.toString()];
      const isCorrect = checkValue(value, correctAnswer);

      if (isCorrect) score++;

      markQuestionContainer(i, isCorrect);
      markSubQuestionButton(i, isCorrect);

      if (!isCorrect) {
        displayCorrectAnswer(i, correctAnswer);
      }

      resultDetails.push({
        qNum: i,
        userAnswer: text,
        correctAnswer: correctAnswer || '',
        isCorrect
      });
    }

    const band = calculateIELTSBand(score);
    setResults({ score, band, details: resultDetails });
    setShowResultsModal(true);

    if (deliverButtonRef.current) {
      deliverButtonRef.current.textContent = 'Checked';
      deliverButtonRef.current.style.backgroundColor = '#dc3545';
      deliverButtonRef.current.style.color = 'white';
      deliverButtonRef.current.style.borderColor = '#dc3545';
      deliverButtonRef.current.onclick = () => setShowResultsModal(true);
    }
  }, [timerInterval]);

  const getUserAnswer = useCallback((qNum: number): { value: string; text: string } => {
    if (qNum >= 27 && qNum <= 33) {
      const dropBox = document.getElementById(`drop-box-3-${qNum}`);
      const droppedItem = dropBox ? dropBox.querySelector(`.${styles.headingItem}`) : null;
      if (droppedItem) {
        return { value: droppedItem.getAttribute('data-value') || '', text: droppedItem.textContent?.trim() || '' };
      }
      return { value: '', text: 'No Answer' };
    }

    const textInput = document.getElementById(`q${qNum}`) as HTMLInputElement;
    if (textInput) {
      return { value: textInput.value, text: textInput.value.trim() || 'No Answer' };
    }

    const radioInput = document.querySelector(`input[name="q${qNum}"]:checked`) as HTMLInputElement;
    if (radioInput) {
      return { value: radioInput.value, text: radioInput.value };
    }

    return { value: '', text: 'No Answer' };
  }, []);

  const checkValue = useCallback((userValue: string, correctValue: string): boolean => {
    if (!userValue) return false;
    return userValue.trim().toLowerCase() === correctValue.trim().toLowerCase();
  }, []);

  const markSubQuestionButton = useCallback((qNum: number, isCorrect: boolean) => {
    const subQuestionButton = Array.from(document.querySelectorAll(`.${styles.subQuestion}`)).find(btn => btn.textContent === qNum.toString());
    if (subQuestionButton) {
      subQuestionButton.classList.add(isCorrect ? styles.correct : styles.incorrect);
    }
  }, []);

  const findQuestionElement = useCallback((qNum: number): HTMLElement | null => {
    let el = document.querySelector(`.${styles.question}[data-q-start="${qNum}"]`);
    if (!el) el = document.querySelector(`.${styles.questionGrid} tr[data-q-num="${qNum}"]`);
    return el as HTMLElement;
  }, []);

  const markQuestionContainer = useCallback((qNum: number, isCorrect: boolean) => {
    const questionEl = findQuestionElement(qNum);
    if (questionEl) {
      questionEl.classList.add(isCorrect ? styles.correct : styles.incorrect);
    }
  }, [findQuestionElement]);

  const displayCorrectAnswer = useCallback((qNum: number, correctAnswer: string) => {
    const inputEl = document.getElementById(`q${qNum}`) as HTMLInputElement;
    if (inputEl) {
      inputEl.classList.add(styles.incorrect);
      const displaySpan = document.createElement('span');
      displaySpan.className = styles.correctAnswerDisplay;
      displaySpan.textContent = ` ✓ ${correctAnswer}`;
      inputEl.insertAdjacentElement('afterend', displaySpan);
      return;
    }

    const radioEl = document.querySelector(`input[name="q${qNum}"][value="${correctAnswer}"]`) as HTMLInputElement;
    if (radioEl) {
      const parentOption = radioEl.closest(`.${styles.tfngOption}`);
      if (parentOption) parentOption.classList.add(styles.correctAnswerHighlight);
      return;
    }

    const tableRow = document.querySelector(`.${styles.questionGrid} tr[data-q-num="${qNum}"]`);
    if (tableRow) {
      const correctCell = tableRow.querySelector(`input[value="${correctAnswer}"]`);
      if (correctCell) correctCell.closest('td')?.classList.add(styles.correctAnswerHighlight);
    }
  }, []);

  const calculateIELTSBand = useCallback((score: number): number => {
    for (const range of testData.bandCalculation.ranges) {
      if (score >= range.minScore) {
        return range.band;
      }
    }
    return 0.0;
  }, []);

  const switchToPart = useCallback((partNumber: number) => {
    setCurrentPassage(partNumber);
    const firstQuestionOfPart = { 1: 1, 2: 14, 3: 27 }[partNumber] || 1;
    goToQuestion(firstQuestionOfPart, true);
    setupBottomNav();
  }, [setupBottomNav]);

  const goToQuestion = useCallback((questionNumber: number, skipAnimation = false) => {
    setCurrentQuestion(questionNumber);

    let passageNumber = 1;
    if (questionNumber >= 14 && questionNumber <= 26) passageNumber = 2;
    else if (questionNumber >= 27) passageNumber = 3;

    if (currentPassage !== passageNumber) {
      switchToPart(passageNumber);
      return;
    }

    if (activeQuestionElement) {
      activeQuestionElement.classList.remove(styles.activeQuestion, styles.activeInput);
    }

    let targetEl: HTMLElement | null = null;
    if (questionNumber >= 27 && questionNumber <= 33) {
      targetEl = document.getElementById(`drop-box-3-${questionNumber}`);
    } else {
      targetEl = document.getElementById(`q${questionNumber}`);
      if (!targetEl) {
        const radio = document.querySelector(`input[name="q${questionNumber}"]`);
        if (radio) targetEl = radio.closest(`.${styles.question}`) as HTMLElement;
      }
      if (!targetEl) targetEl = document.querySelector(`[data-q-start="${questionNumber}"]`) as HTMLElement;
    }

    if (targetEl) {
      setActiveQuestionElement(targetEl);
      if (targetEl.matches('input') || targetEl.matches('select')) {
        targetEl.classList.add(styles.activeInput);
      } else if (!targetEl.matches('tr')) {
        // Only apply activeQuestion to non-table-row elements
        targetEl.classList.add(styles.activeQuestion);
      }
      if (!skipAnimation) {
        scrollIntoViewIfNeeded(targetEl);
      }
    }

    updateNavigation(skipAnimation);
  }, [currentPassage, activeQuestionElement]);

  const updateNavigation = useCallback((skipAnimation = false) => {
    // Update navigation button states
    if (prevBtnRef.current) prevBtnRef.current.disabled = currentQuestion === 1;
    if (nextBtnRef.current) nextBtnRef.current.disabled = currentQuestion === 40;
  }, [currentQuestion]);

  const updateAllIndicators = useCallback(() => {
    updateAnsweredIndicators();
    updateAttemptedCounts();
  }, []);

  const updateAnsweredIndicators = useCallback(() => {
    // This is now handled by React rendering based on userAnswers state
    // The buttons will re-render with the correct classes
  }, []);

  const updateAttemptedCounts = useCallback(() => {
    const newCounts: Record<number, number> = {};

    passageConfigs.forEach(config => {
      let count = 0;
      for (let i = config.start; i < config.start + config.total; i++) {
        const { value } = getUserAnswer(i);
        if (value && value !== 'No Answer') count++;
      }
      newCounts[config.part] = count;

      const countEl = document.querySelector(`.${styles.footerQuestionWrapper}:nth-child(${config.part}) .${styles.attemptedCount}`);
      if (countEl) countEl.textContent = `${count} of ${config.total}`;
    });

    setAttemptedCounts(newCounts);
  }, [getUserAnswer]);

  const scrollIntoViewIfNeeded = useCallback((element: HTMLElement) => {
    const panel = element.closest(`.${styles.questionsPanel}, .${styles.passagePanel}`);
    if (!panel) return;
    const panelRect = panel.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    if (elementRect.top < panelRect.top || elementRect.bottom > panelRect.bottom) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const nextQuestion = useCallback(() => {
    if (currentQuestion < 40) {
      goToQuestion(currentQuestion + 1);
    }
  }, [currentQuestion, goToQuestion]);

  const previousQuestion = useCallback(() => {
    if (currentQuestion > 1) {
      goToQuestion(currentQuestion - 1);
    }
  }, [currentQuestion, goToQuestion]);

  const toggleNotesPanel = useCallback(() => {
    if (notesContainerRef.current) {
      notesContainerRef.current.classList.toggle(styles.visible);
    }
    if (headerNotesBtnRef.current) {
      headerNotesBtnRef.current.classList.toggle(styles.activeIcon);
    }
  }, []);

  const showContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const isClickOnHighlight = target.closest('.highlight, .comment-highlight');
    const isSelectionActive = selectedRange && selectedRange.toString().trim().length > 0;

    let showMenu = false;

    if (isClickOnHighlight) {
      const menuHighlight = contextMenuRef.current?.querySelector('#menu-highlight') as HTMLElement | null;
      const menuNote = contextMenuRef.current?.querySelector('#menu-note') as HTMLElement | null;
      if (menuHighlight) menuHighlight.style.display = 'none';
      if (menuNote) menuNote.style.display = 'none';
      // contextMenu.targetElementForClear = isClickOnHighlight;
      showMenu = true;
    } else if (isSelectionActive) {
      const menuHighlight = contextMenuRef.current?.querySelector('#menu-highlight') as HTMLElement | null;
      const menuNote = contextMenuRef.current?.querySelector('#menu-note') as HTMLElement | null;
      if (menuHighlight) menuHighlight.style.display = 'flex';
      if (menuNote) menuNote.style.display = 'flex';
      showMenu = true;
    }

    if (showMenu && contextMenuRef.current) {
      contextMenuRef.current.style.display = 'block';
      const menuHeight = contextMenuRef.current.offsetHeight;
      const menuWidth = contextMenuRef.current.offsetWidth;
      let left = e.pageX;
      let top = e.pageY;
      if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 5;
      if (top + menuHeight > window.innerHeight) top = e.pageY - menuHeight - 5;
      else top = e.pageY - menuHeight - 5;

      contextMenuRef.current.style.left = `${left}px`;
      contextMenuRef.current.style.top = `${top}px`;
    }
  }, [selectedRange]);

  const closeContextMenu = useCallback(() => {
    if (contextMenuRef.current) {
      contextMenuRef.current.style.display = 'none';
    }
    setSelectedRange(null);
  }, []);

  const highlightText = useCallback(() => {
    if (selectedRange && !selectedRange.collapsed) {
      const span = document.createElement('span');
      span.className = 'highlight';
      span.appendChild(selectedRange.extractContents());
      selectedRange.insertNode(span);
    }
    closeContextMenu();
    window.getSelection()?.removeAllRanges();
  }, [selectedRange, closeContextMenu]);

  const addNote = useCallback(() => {
    const noteText = prompt('Enter your note:');
    if (noteText && selectedRange && !selectedRange.collapsed) {
      const highlightedText = selectedRange.toString().trim();
      const newNoteId = noteIdCounter + 1;
      setNoteIdCounter(newNoteId);

      const span = document.createElement('span');
      span.className = 'comment-highlight';
      span.setAttribute('data-note-ref-id', newNoteId.toString());

      const tooltip = document.createElement('span');
      tooltip.className = 'comment-tooltip';
      tooltip.textContent = noteText;

      span.appendChild(selectedRange.extractContents());
      span.appendChild(tooltip);
      selectedRange.insertNode(span);

      const newNote: Note = {
        id: newNoteId,
        text: noteText,
        highlightedText: highlightedText,
        element: span
      };

      setNotes(prev => [...prev, newNote]);
    }
    closeContextMenu();
    window.getSelection()?.removeAllRanges();
  }, [selectedRange, noteIdCounter, closeContextMenu]);

  const deleteNote = useCallback((noteId: number) => {
    setNotes(prev => {
      const noteToDelete = prev.find(note => note.id === noteId);
      if (noteToDelete) {
        unwrapElement(noteToDelete.element);
      }
      return prev.filter(note => note.id !== noteId);
    });
  }, []);

  const clearHighlight = useCallback(() => {
    // Implementation for clearing specific highlight
    closeContextMenu();
    window.getSelection()?.removeAllRanges();
  }, [closeContextMenu]);

  const clearAllHighlights = useCallback(() => {
    document.querySelectorAll('.highlight').forEach(el => unwrapElement(el as HTMLElement));
    document.querySelectorAll('.comment-highlight').forEach(el => {
      const noteRefId = el.getAttribute('data-note-ref-id');
      if (noteRefId) {
        deleteNote(parseInt(noteRefId, 10));
      }
      unwrapElement(el as HTMLElement);
    });
    closeContextMenu();
    window.getSelection()?.removeAllRanges();
  }, [deleteNote, closeContextMenu]);

  const unwrapElement = (element: HTMLElement) => {
    const parent = element.parentNode;
    if (!parent) return;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
    parent.normalize();
  };

  const renderQuestion = (questionId: string, questionData: any, currentQuestion: number) => {
    const questionNum = parseInt(questionId);
    const isActive = currentQuestion === questionNum;

    switch (questionData.type) {
      case 'matching-headings':
        return (
          <div
            key={questionId}
            className={`${styles.question} ${isActive ? styles.activeQuestion : ''}`}
            data-q-start={questionId}
          >
            <div className={styles.questionPrompt}>
              <p><strong>Question {questionId}</strong></p>
              <p>{questionData.questionText}</p>
            </div>
            {questionData.options && (
              <table className={styles.questionGrid}>
                <thead>
                  <tr>
                    <th></th>
                    {questionData.options.map((option: string) => (
                      <th key={option}>{option}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr data-q-num={questionId}>
                    <td><strong>{questionId}</strong> {questionData.questionText}</td>
                    {questionData.options.map((option: string) => (
                      <td key={option}>
                        <input type="radio" name={`q${questionId}`} value={option} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}
            {questionData.headingsList && (
              <ul
                ref={questionId === '27' ? headingsListRef : undefined}
                id={`headings-list-${questionId}`}
                className={styles.headingsList}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, `headings-list-${questionId}`)}
              >
                {questionData.headingsList.map((heading: string, index: number) => {
                  const headingValue = questionData.options[index];
                  return (
                    <li
                      key={heading}
                      className={styles.headingItem}
                      draggable="true"
                      data-value={headingValue}
                      onDragStart={(e) => handleDragStart(e, headingValue)}
                    >
                      {heading}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );

      case 'summary-completion':
        return (
          <div
            key={questionId}
            className={`${styles.question} ${isActive ? styles.activeQuestion : ''}`}
            data-q-start={questionId}
          >
            <div className={styles.questionPrompt}>
              <p><strong>Question {questionId}</strong></p>
              <p>{questionData.questionText}</p>
            </div>
            <div className={styles.summaryText}>
              <p dangerouslySetInnerHTML={{
                __html: questionData.summaryText.replace(
                  new RegExp(`\\[${questionId}\\]`, 'g'),
                  `<input type="text" className="${styles.answerInput}" id="q${questionId}" size="12" spellCheck="false" autoCorrect="off" />`
                )
              }} />
            </div>
          </div>
        );

      case 'true-false-not-given':
        return (
          <div
            key={questionId}
            className={`${styles.question} ${isActive ? styles.activeQuestion : ''}`}
            data-q-start={questionId}
          >
            <div className={styles.questionPrompt}>
              <p><strong>Question {questionId}</strong></p>
              <p>Do the following statements agree with the information given in Reading Passage {questionData.passageId}? Write</p>
              <ul style={{listStyle: 'none', paddingLeft: 0}}>
                <li><strong>TRUE</strong> if the statement agrees with the information</li>
                <li><strong>FALSE</strong> if the statement contradicts the information</li>
                <li><strong>NOT GIVEN</strong> if there is no information on this</li>
              </ul>
            </div>
            <div className={styles.question} data-q-start={questionId}>
              <p><b>{questionId}</b> {questionData.questionText}</p>
              <ul className={styles.tfngOptions}>
                <li className={styles.tfngOption}>
                  <input type="radio" id={`q${questionId}_true`} name={`q${questionId}`} value="TRUE" />
                  <label htmlFor={`q${questionId}_true`}>TRUE</label>
                </li>
                <li className={styles.tfngOption}>
                  <input type="radio" id={`q${questionId}_false`} name={`q${questionId}`} value="FALSE" />
                  <label htmlFor={`q${questionId}_false`}>FALSE</label>
                </li>
                <li className={styles.tfngOption}>
                  <input type="radio" id={`q${questionId}_notgiven`} name={`q${questionId}`} value="NOT GIVEN" />
                  <label htmlFor={`q${questionId}_notgiven`}>NOT GIVEN</label>
                </li>
              </ul>
            </div>
          </div>
        );

      case 'multiple-choice':
        return (
          <div
            key={questionId}
            className={`${styles.question} ${isActive ? styles.activeQuestion : ''}`}
            data-q-start={questionId}
          >
            <div className={styles.questionPrompt}>
              <p><strong>Question {questionId}</strong></p>
              <p>Choose the correct letter, <strong>A, B, C or D</strong>.</p>
            </div>
            <div className={styles.question} data-q-start={questionId}>
              <p><b>{questionId}</b> {questionData.questionText}</p>
              <ul className={styles.tfngOptions}>
                {questionData.options.map((option: string, index: number) => {
                  const letter = String.fromCharCode(65 + index); // A, B, C, D
                  return (
                    <li key={option} className={styles.tfngOption}>
                      <input
                        type="radio"
                        id={`q${questionId}_${letter.toLowerCase()}`}
                        name={`q${questionId}`}
                        value={letter}
                      />
                      <label htmlFor={`q${questionId}_${letter.toLowerCase()}`}>
                        {letter}. {option}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Time's up!";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Effect to update navigation when current question or passage changes
  useEffect(() => {
    updateNavigation();
  }, [currentQuestion, currentPassage, updateNavigation]);

  // Effect to setup bottom navigation when passage changes
  useEffect(() => {
    if (isTestStarted) {
      setupBottomNav();
    }
  }, [currentPassage, isTestStarted, setupBottomNav]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  return (
    <>
      {/* Start Exam Modal */}
      {!isTestStarted && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>IELTS Reading Practice Test</h2>
            <p>You have 60 minutes to complete this test.</p>
            <p>Click "Start Test" when you are ready to begin.</p>
            <div className={styles.startModalButtons}>
              <button id="start-exam-yes" onClick={startExam}>
                Start Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Test Interface */}
      {isTestStarted && (
        <div className={styles.testContainer}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerLogo}>
                <img src="/file.svg" alt="Logo" className={styles.ieltsLogo} />
              </div>
              <div className={styles.headerLogo}>
                <img src="/ielts-logo.png" alt="IELTS" className={styles.ieltsLogo} />
              </div>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.timerContainer}>
                <svg width="24" height="24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span ref={timerDisplayRef} className={styles.timerDisplay}>
                  {formatTime(timeInSeconds)}
                </span>
              </div>
              <button
                ref={headerNotesBtnRef}
                className={styles.headerNotesToggleBtn}
                onClick={toggleNotesPanel}
                title="Toggle Notes Panel"
              >
                <svg width="24" height="24" fill="currentColor">
                  <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                </svg>
              </button>
            </div>
          </header>

          {/* Part Headers */}
          {testData.passages.map((passage, index) => (
            <div
              key={passage.id}
              id={`part-header-${passage.id}`}
              className={`${styles.partHeader} ${currentPassage === passage.id ? '' : styles.hidden}`}
            >
              <p><strong>Part {passage.id}</strong></p>
              <p>{passage.title}</p>
            </div>
          ))}

          {/* Main Container */}
          <div className={styles.mainContainer}>
            <div className={styles.panelsContainer}>
              {/* Passage Panel */}
              <div ref={passagePanelRef} className={styles.passagePanel}>
                {/* Passage 1 */}
                <div id="passage-text-1" className={`${styles.readingPassage} ${currentPassage === 1 ? '' : styles.hidden}`}>
                  <h4 className={styles.textCenter}>{testData.passages[0].title}</h4>
                  {testData.passages[0].content.map(paragraph => (
                    <p key={paragraph.id}><strong>{paragraph.id}</strong> {paragraph.text}</p>
                  ))}
                </div>

                {/* Passage 2 */}
                <div id="passage-text-2" className={`${styles.readingPassage} ${currentPassage === 2 ? '' : styles.hidden}`}>
                  <h4 className={styles.textCenter}>{testData.passages[1].title}</h4>
                  {testData.passages[1].content.map(paragraph => (
                    <p key={paragraph.id}><strong>{paragraph.id}</strong> {paragraph.text}</p>
                  ))}
                </div>

                {/* Passage 3 */}
                <div id="passage-text-3" className={`${styles.readingPassage} ${currentPassage === 3 ? '' : styles.hidden}`}>
                  <h4 className={styles.textCenter}>{testData.passages[2].title}</h4>
                  {testData.passages[2].content.map((paragraph, index) => {
                    const questionNumber = 27 + index;
                    return (
                      <div key={paragraph.id} className={styles.passageSection} data-section-id={`3-${paragraph.id}`}>
                        {questionNumber >= 27 && questionNumber <= 33 && (
                          <div
                            id={`drop-box-3-${questionNumber}`}
                            className={styles.dropBox}
                            data-q-num={questionNumber}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, `drop-box-3-${questionNumber}`)}
                          >
                            <span>{questionNumber}</span>
                          </div>
                        )}
                        <p><strong>{paragraph.id}</strong> {paragraph.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resizer */}
              <div ref={resizerRef} className={styles.resizer}></div>

              {/* Questions Panel */}
              <div ref={questionsPanelRef} className={styles.questionsPanel}>
                {/* Questions content will be added here */}
                {testData.passages.map((passage, passageIndex) => {
                  const passageId = passageIndex + 1;
                  const passageQuestions = Object.entries(testData.questions).filter(
                    ([, questionData]: [string, any]) => questionData.passageId === passageId
                  );

                  if (passageQuestions.length === 0) return null;

                  return (
                    <div
                      key={passageId}
                      id={`questions-${passageId}`}
                      className={`${styles.questionSet} ${currentPassage === passageId ? '' : styles.hidden}`}
                    >
                      <div className={styles.questionsContainer}>
                        {passageQuestions.map(([questionId, questionData]: [string, any]) =>
                          renderQuestion(questionId, questionData, currentQuestion)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes Panel */}
              <div ref={notesContainerRef} className={styles.notesPanelContainer}>
                <div className={styles.notesPanel}>
                  <div className={styles.notesHeader}>
                    <h4>My Notes</h4>
                  </div>
                  <div ref={notesListRef}>
                    {notes.map(note => (
                      <div key={note.id} className="note-item" data-note-id={note.id}>
                        <div className="note-source-text">"{note.highlightedText}"</div>
                        <div className="note-text">{note.text}</div>
                        <button
                          className="note-delete-btn"
                          data-note-id={note.id}
                          onClick={() => deleteNote(note.id)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className={styles.navArrows}>
            <button ref={prevBtnRef} className={styles.navArrow} onClick={previousQuestion} disabled={currentQuestion === 1}>‹</button>
            <button ref={nextBtnRef} className={styles.navArrow} onClick={nextQuestion} disabled={currentQuestion === 40}>›</button>
          </div>

          {/* Bottom Navigation */}
          <nav className={styles.navRow} aria-label="Questions">
            <div className={`${styles.footerQuestionWrapper} ${currentPassage === 1 ? styles.selected : ''}`} role="tablist">
              <button role="tab" className={styles.footerQuestionNo} onClick={() => switchToPart(1)}>
                <span>Part 1</span><span className={styles.attemptedCount}>{attemptedCounts[1]} of 13</span>
              </button>
              <div className={styles.footerSubquestionWrapper}>
                {currentPassage === 1 && subQuestionButtons.part === 1 && subQuestionButtons.buttons.map(qNum => {
                  const { value } = getUserAnswer(qNum);
                  const isAnswered = !!value && value !== 'No Answer';
                  return (
                    <button
                      key={qNum}
                      className={`${styles.subQuestion} ${currentQuestion === qNum ? styles.active : ''} ${isAnswered ? styles.answered : ''}`}
                      onClick={() => goToQuestion(qNum)}
                    >
                      {qNum}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={`${styles.footerQuestionWrapper} ${currentPassage === 2 ? styles.selected : ''}`} role="tablist">
              <button role="tab" className={styles.footerQuestionNo} onClick={() => switchToPart(2)}>
                <span>Part 2</span><span className={styles.attemptedCount}>{attemptedCounts[2]} of 13</span>
              </button>
              <div className={styles.footerSubquestionWrapper}>
                {currentPassage === 2 && subQuestionButtons.part === 2 && subQuestionButtons.buttons.map(qNum => {
                  const { value } = getUserAnswer(qNum);
                  const isAnswered = !!value && value !== 'No Answer';
                  return (
                    <button
                      key={qNum}
                      className={`${styles.subQuestion} ${currentQuestion === qNum ? styles.active : ''} ${isAnswered ? styles.answered : ''}`}
                      onClick={() => goToQuestion(qNum)}
                    >
                      {qNum}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={`${styles.footerQuestionWrapper} ${currentPassage === 3 ? styles.selected : ''}`} role="tablist">
              <button role="tab" className={styles.footerQuestionNo} onClick={() => switchToPart(3)}>
                <span>Part 3</span><span className={styles.attemptedCount}>{attemptedCounts[3]} of 14</span>
              </button>
              <div className={styles.footerSubquestionWrapper}>
                {currentPassage === 3 && subQuestionButtons.part === 3 && subQuestionButtons.buttons.map(qNum => {
                  const { value } = getUserAnswer(qNum);
                  const isAnswered = !!value && value !== 'No Answer';
                  return (
                    <button
                      key={qNum}
                      className={`${styles.subQuestion} ${currentQuestion === qNum ? styles.active : ''} ${isAnswered ? styles.answered : ''}`}
                      onClick={() => goToQuestion(qNum)}
                    >
                      {qNum}
                    </button>
                  );
                })}
              </div>
            </div>
            <button ref={deliverButtonRef} className={styles.footerDeliverButton} onClick={checkAnswers}>
              SUBMIT
            </button>
          </nav>

          {/* Context Menu */}
          <div ref={contextMenuRef} className={styles.contextMenu}>
            <div id="menu-highlight" className={styles.contextMenuItem} onClick={highlightText}>
              Highlight
            </div>
            <div id="menu-note" className={styles.contextMenuItem} onClick={addNote}>
              Note
            </div>
            <div id="menu-clear" className={styles.contextMenuItem} onClick={clearHighlight}>
              Clear
            </div>
            <div id="menu-clear-all" className={styles.contextMenuItem} onClick={clearAllHighlights}>
              Clear All
            </div>
          </div>

          {/* Results Modal */}
          {showResultsModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <button className={styles.modalCloseBtn} onClick={() => setShowResultsModal(false)}>&times;</button>
                <h2>Results</h2>
                <div className={styles.resultsSummary}>
                  <p>Score: <span>{results.score}</span> / 40</p>
                  <p>IELTS Band: <span>{results.band}</span></p>
                </div>
                <div className={styles.resultsDetailsContainer}>
                  <div className={styles.resultRow} style={{fontWeight: 'bold', backgroundColor: '#f8f9fa'}}>
                    <span>Q. No.</span>
                    <span>Your Answer</span>
                    <span>Correct Answer</span>
                  </div>
                  {results.details.map((detail: any, index: number) => (
                    <div key={index} className={`${styles.resultRow} ${detail.isCorrect ? '' : styles.incorrect}`}>
                      <span>{detail.qNum}</span>
                      <span>{detail.userAnswer}</span>
                      <span>{detail.correctAnswer || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ReadingTest;

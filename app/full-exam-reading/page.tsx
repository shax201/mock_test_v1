'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ReadingTest.module.css';

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

  const correctAnswers: Record<string, string> = {
    '1': 'A', '2': 'E', '3': 'G', '4': 'C', '5': 'ancient Rome',
    '6': 'Persia', '7': 'Mallorca', '8': 'Japan', '9': 'Australia', '10': 'Bahrain',
    '11': 'TRUE', '12': 'NOT GIVEN', '13': 'TRUE', '14': 'B', '15': 'G',
    '16': 'A', '17': 'H', '18': 'F', '19': 'C', '20': 'C',
    '21': 'TRUE', '22': 'NOT GIVEN', '23': 'FALSE', '24': 'TRUE', '25': 'NOT GIVEN',
    '26': 'FALSE', '27': 'v', '28': 'ii', '29': 'vi', '30': 'iii',
    '31': 'vii', '32': 'iv', '33': 'viii', '34': 'thunderstorms', '35': 'Condensation',
    '36': 'heat', '37': 'eye', '38': 'land', '39': 'B', '40': 'C'
  };

  const passageConfigs = [
    { part: 1, total: 13, start: 1 },
    { part: 2, total: 13, start: 14 },
    { part: 3, total: 14, start: 27 }
  ];

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
    if (score >= 39) return 9.0;
    if (score >= 37) return 8.5;
    if (score >= 35) return 8.0;
    if (score >= 33) return 7.5;
    if (score >= 30) return 7.0;
    if (score >= 27) return 6.5;
    if (score >= 23) return 6.0;
    if (score >= 19) return 5.5;
    if (score >= 15) return 5.0;
    if (score >= 13) return 4.5;
    if (score >= 10) return 4.0;
    if (score >= 7) return 3.5;
    if (score >= 4) return 3.0;
    if (score === 3) return 2.5;
    if (score > 0) return 2.0;
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
      const menuHighlight = contextMenuRef.current?.querySelector('#menu-highlight');
      const menuNote = contextMenuRef.current?.querySelector('#menu-note');
      if (menuHighlight) menuHighlight.style.display = 'none';
      if (menuNote) menuNote.style.display = 'none';
      // contextMenu.targetElementForClear = isClickOnHighlight;
      showMenu = true;
    } else if (isSelectionActive) {
      const menuHighlight = contextMenuRef.current?.querySelector('#menu-highlight');
      const menuNote = contextMenuRef.current?.querySelector('#menu-note');
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
    document.querySelectorAll('.highlight').forEach(unwrapElement);
    document.querySelectorAll('.comment-highlight').forEach(el => {
      const noteRefId = el.getAttribute('data-note-ref-id');
      if (noteRefId) {
        deleteNote(parseInt(noteRefId, 10));
      }
      unwrapElement(el);
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
          <div id="part-header-1" className={`${styles.partHeader} ${currentPassage === 1 ? '' : styles.hidden}`}>
            <p><strong>Part 1</strong></p>
            <p>The History of Pearls</p>
          </div>
          <div id="part-header-2" className={`${styles.partHeader} ${currentPassage === 2 ? '' : styles.hidden}`}>
            <p><strong>Part 2</strong></p>
            <p>How Deserts are Formed?</p>
          </div>
          <div id="part-header-3" className={`${styles.partHeader} ${currentPassage === 3 ? '' : styles.hidden}`}>
            <p><strong>Part 3</strong></p>
            <p>Can Hurricanes be Moderated or Diverted?</p>
          </div>

          {/* Main Container */}
          <div className={styles.mainContainer}>
            <div className={styles.panelsContainer}>
              {/* Passage Panel */}
              <div ref={passagePanelRef} className={styles.passagePanel}>
                {/* Passage 1 */}
                <div id="passage-text-1" className={`${styles.readingPassage} ${currentPassage === 1 ? '' : styles.hidden}`}>
                  <h4 className={styles.textCenter}>The History of Pearls</h4>
                  <p><strong>A</strong> Pearls have long been considered one of the most precious jewels, and throughout history they have been a symbol of wealth, power and status. In ancient Rome, pearls were worth more than gold and were often used to decorate the clothing of emperors and nobles. In medieval Europe, pearls were believed to have medicinal properties and were used to treat various ailments. In Persia, pearls were so highly valued that they were often used as currency.</p>
                  <p><strong>B</strong> There are three main types of pearls: natural, cultured and imitation. Natural pearls are extremely rare and valuable, formed when an irritant enters an oyster and the oyster secretes layers of nacre around it. Cultured pearls are created when humans insert a nucleus into an oyster, stimulating the formation of nacre. Imitation pearls are made from glass or plastic coated with a pearl-like substance.</p>
                  <p><strong>C</strong> The value of natural pearls depends on several factors including size, shape, color, luster and surface quality. Larger pearls are generally more valuable, as are perfectly round ones. The most prized natural pearls come from the Arabian Gulf, particularly Bahrain, where they can reach extraordinary sizes. Japanese pearls are renowned for their exceptional luster, while Australian pearls are valued for their large size and unique colors.</p>
                  <p><strong>D</strong> The process of pearl cultivation was first developed in Japan in the early 20th century. This involves carefully inserting a small piece of mantle tissue along with a nucleus into an oyster. The oyster then secretes nacre around the nucleus, forming a pearl over a period of several years. This technique revolutionized the pearl industry, making pearls more accessible and affordable.</p>
                  <p><strong>E</strong> Mallorca in Spain became famous in the 19th century for producing imitation pearls. These were made by coating glass beads with a mixture of lacquer and fish scales, creating a convincing pearl-like appearance. While these pearls lack the natural beauty and value of real pearls, they played an important role in making pearl jewelry accessible to a wider audience.</p>
                  <p><strong>F</strong> Today, China is the world's largest producer of freshwater cultured pearls, while Japan and Australia dominate the saltwater cultured pearl market. The pearl industry continues to evolve with new cultivation techniques and sustainable practices ensuring the longevity of this precious gem.</p>
                  <p><strong>G</strong> Pearls have maintained their allure throughout history, symbolizing purity, wisdom and prosperity in various cultures. From ancient civilizations to modern times, pearls continue to captivate with their natural beauty and timeless elegance.</p>
                  <p><strong>H</strong> Recent advances in pearl farming technology have led to the development of ethically sourced, high-quality pearls. Conservation efforts are also underway to protect natural pearl-producing oysters and maintain the delicate balance of marine ecosystems.</p>
                </div>

                {/* Passage 2 */}
                <div id="passage-text-2" className={`${styles.readingPassage} ${currentPassage === 2 ? '' : styles.hidden}`}>
                  <h4 className={styles.textCenter}>How deserts are formed?</h4>
                  <p><strong>A</strong> A desert refers to a barren section of land, mainly in arid and semi-arid areas, where there is almost no precipitation, and the environment is hostile for any creature to inhabit. Deserts have been classified in a number of ways, generally combining total precipitation, how many days the rainfall occurs, temperature, humidity, and sometimes additional factors. In some places, deserts have clear boundaries marked by rivers, mountains or other landforms, while in other places, there are no clear-cut borders between desert and other landscape features.</p>
                  <p><strong>B</strong> In arid areas where there is not any covering of vegetation protecting the land, sand and dust storms will frequently take place. This phenomenon often occurs along the desert margins instead of within the deserts, where there are already no finer materials left. When a steady wind starts to blow, fine particles on the open ground will begin vibrating. As the wind picks up, some of the particles are lifted into the air. When they fall onto the ground, they hit other particles which will then be jerked into the air in their turn, initiating a chain reaction.</p>
                  <p><strong>C</strong> There has been a tremendous deal of publicity on how severe desertification can be, but the academic circle has never agreed on the causes of desertification. A common misunderstanding is that a shortage of precipitation causes the desertification-even the land in some barren areas will soon recover after the rain falls. In fact, more often than not, human activities are responsible for desertification. It might be true that the explosion in world population, especially in developing countries, is the primary cause of soil degradation and desertification. Since the population has become denser, the cultivation of crops has gone into progressively drier areas. It's especially possible for these regions to go through periods of severe drought, which explains why crop failures are common. The raising of most crops requires the natural vegetation cover to be removed first; when crop failures occur, extensive tracts of land are devoid of a plant cover and thus susceptible to wind and water erosion. All through the 1990s, dryland areas went through a population growth of 18.5 per cent, mostly in severely impoverished developing countries.</p>
                  <p><strong>D</strong> Livestock farming in semi-arid areas accelerates the erosion of soil and becomes one of the reasons for advancing desertification. In such areas where the vegetation is dominated by grasses, the breeding of livestock is a major economic activity. Grasses are necessary for anchoring barren topsoil in a dryland area. When a specific field is used to graze an excessive herd, it will experience a loss in vegetation coverage, and the soil will be trampled as well as be pulverised, leaving the topsoil exposed to destructive erosion elements such as winds and unexpected thunderstorms. For centuries, nomads have grazed their flocks and herds to any place where pasture can be found, and oases have offered chances for a more settled way of living. For some nomads, wherever they move to, the desert follows.</p>
                  <p><strong>E</strong> Trees are of great importance when it comes to maintaining topsoil and slowing down the wind speed. In many Asian countries, firewood is the chief fuel used for cooking and heating, which has caused uncontrolled clear-cutting of forests in dryland ecosystems. When too many trees are cut down, windstorms and dust storms tend to occur.</p>
                  <p><strong>F</strong> What's worse, even political conflicts and wars can also contribute to desertification. To escape from the invading enemies, the refugees will move altogether into some of the most vulnerable ecosystems on the planet. They bring along their cultivation traditions, which might not be the right kind of practice for their new settlement.</p>
                  <p><strong>G</strong> In the 20th century, one of the states of America had a large section of farmland that had turned into desert. Since then, actions have been enforced so that such a phenomenon of desertification will not happen again. To avoid the reoccurring of desertification, people shall find other livelihoods which do not rely on traditional land uses, are not as demanding on local land and natural resource, but can still generate viable income. Such livelihoods include but are not limited to dryland aquaculture for the raising of fish, crustaceans and industrial compounds derived from microalgae, greenhouse agriculture, and activities that are related to tourism. Another way to prevent the reoccurring of desertification is bringing about economic prospects in the city centres of drylands and places outside drylands. Changing the general economic and institutional structures that generate new chances for people to support themselves would alleviate the current pressures accompanying the desertification processes.</p>
                  <p><strong>H</strong> In nowadays society, new technologies are serving as a method to resolve the problems brought by desertification. Satellites have been utilised to investigate the influence that people and livestock have on our planet Earth. Nevertheless, it doesn't mean that alternative technologies are not needed to help with the problems and process of desertification.</p>
                </div>

                {/* Passage 3 */}
                <div id="passage-text-3" className={`${styles.readingPassage} ${currentPassage === 3 ? '' : styles.hidden}`}>
                  <h4 className={styles.textCenter}>Can Hurricanes be Moderated or Diverted?</h4>
                  <div className={styles.passageSection} data-section-id="3-A">
                    <div
                      id="drop-box-3-27"
                      className={styles.dropBox}
                      data-q-num="27"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'drop-box-3-27')}
                    >
                      <span>27</span>
                    </div>
                    <p><strong>A</strong> Each year, massive swirling storms bringing along winds greater than 74 miles per hour wipe across tropical oceans and land on shorelines—usually devastating vast swaths of territory. When these roiling tempests strike densely inhabited territories, they have the power to kill thousands and cause property damage worth of billions of dollars. Besides, absolutely nothing stands in their way. But can we ever find a way to control these formidable forces of nature?</p>
                  </div>
                  <div className={styles.passageSection} data-section-id="3-B">
                    <div
                      id="drop-box-3-28"
                      className={styles.dropBox}
                      data-q-num="28"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'drop-box-3-28')}
                    >
                      <span>28</span>
                    </div>
                    <p><strong>B</strong> To see why hurricanes and other severe tropical storms may be susceptible to human intervention, a researcher must first learn about their nature and origins. Hurricanes grow in the form of thunderstorm clusters above the tropical seas. Oceans in low-latitude areas never stop giving out heat and moisture to the atmosphere, which brings about warm, wet air above the sea surface. When this kind of air rises, the water vapour in it condenses to form clouds and precipitation. Condensation gives out heat in the process the solar heat is used to evaporate the water at the ocean surface. This so-called invisible heat of condensation makes the air more buoyant, leading to it ascending higher while reinforcing itself in the feedback process. At last, the tropical depression starts to form and grow stronger, creating the familiar eye the calm centre hub that a hurricane spins around. When reaching the land, the hurricane no longer has a continuous supply of warm water, which causes it to swiftly weaken.</p>
                  </div>
                  <div className={styles.passageSection} data-section-id="3-C">
                    <div
                      id="drop-box-3-29"
                      className={styles.dropBox}
                      data-q-num="29"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'drop-box-3-29')}
                    >
                      <span>29</span>
                    </div>
                    <p><strong>C</strong> Our current studies are inspired by my past intuition when I was learning about chaos theory 30 years ago. The reason why long-range forecasting is complicated is that the atmosphere is highly sensitive to small influences and tiny mistakes can compound fast in the weather-forecasting models. However, this sensitivity also made me realise a possibility: if we intentionally applied some slight inputs to a hurricane, we might create a strong influence that could affect the storms, either by steering them away from densely populated areas or by slowing them down. Back then, I was not able to test my ideas, but thanks to the advancement of computer simulation and remote-sensing technologies over the last 10 years, I can now renew my enthusiasm in large-scale weather control.</p>
                  </div>
                  <div className={styles.passageSection} data-section-id="3-D">
                    <div
                      id="drop-box-3-30"
                      className={styles.dropBox}
                      data-q-num="30"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'drop-box-3-30')}
                    >
                      <span>30</span>
                    </div>
                    <p><strong>D</strong> To find out whether the sensitivity of the atmospheric system could be exploited to adjust such robust atmospheric phenomena as hurricanes, our research team ran simulation experiments on a computer for a hurricane named Iniki that occurred in 1992. The current forecasting technologies were far from perfect, so it took us by surprise that our first simulation turned out to be an immediate success. With the goal of altering the path of Iniki in mind, we first picked the spot where we wanted the storm to stop after six hours. Then we used this target to generate artificial observations and put these into the computer model.</p>
                  </div>
                  <div className={styles.passageSection} data-section-id="3-E">
                    <div
                      id="drop-box-3-31"
                      className={styles.dropBox}
                      data-q-num="31"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'drop-box-3-31')}
                    >
                      <span>31</span>
                    </div>
                    <p><strong>E</strong> The most significant alteration turned out to be the initial temperatures and winds. Usually, the temperature changes across the grid were only tenths of a degree, but the most noteworthy change, which was an increase of almost two degrees Celsius, took place in the lowest model layer to the west of the storm centre. The calculations produced wind-speed changes of two or three miles per hour. However, in several spots, the rates shifted by as much as 20 mph due to minor redirections of the winds close to the storm's centre. In terms of structure, the initial and altered versions of Hurricane Iniki seemed almost the same, but the changes in critical variables were so substantial that the latter one went off the track to the west during the first six hours of the simulation and then travelled due north, leaving Kauai untouched.</p>
                  </div>
                  <div className={styles.passageSection} data-section-id="3-F">
                    <div
                      id="drop-box-3-32"
                      className={styles.dropBox}
                      data-q-num="32"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'drop-box-3-32')}
                    >
                      <span>32</span>
                    </div>
                    <p><strong>F</strong> Future earth-orbiting solar power stations, equipped with large mirrors to focus the sun's rays and panels of photovoltaic cells to gather and send energy to the Earth, might be adapted to beam microwaves which turn to be absorbed by water vapour molecules inside or around the storm. The microwaves would cause the water molecules to vibrate and heat up the surrounding air, which then leads to the hurricane slowing down or moving in a preferred direction.</p>
                  </div>
                  <div className={styles.passageSection} data-section-id="3-G">
                    <div
                      id="drop-box-3-33"
                      className={styles.dropBox}
                      data-q-num="33"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'drop-box-3-33')}
                    >
                      <span>33</span>
                    </div>
                    <p><strong>G</strong> Simulations of hurricanes conducted on a computer have implied that by changing the precipitation, evaporation and air temperature, we could make a difference to a storm's route or abate its winds. Intervention could be in many different forms: exquisitely targeted clouds bearing silver iodide or other rainfall-inducing elements might deprive a hurricane of the water it needs to grow and multiply from its formidable eyewall, which is the essential characteristic of a severe tropical storm.</p>
                  </div>
                </div>
              </div>

              {/* Resizer */}
              <div ref={resizerRef} className={styles.resizer}></div>

              {/* Questions Panel */}
              <div ref={questionsPanelRef} className={styles.questionsPanel}>
                {/* Questions content will be added here */}
                <div id="questions-1" className={`${styles.questionSet} ${currentPassage === 1 ? '' : styles.hidden}`}>
                  {/* Questions 1-4: Matching headings */}
                  <div className={styles.questionsContainer}>
                    <div className={`${styles.question} ${currentQuestion >= 1 && currentQuestion <= 4 ? styles.activeQuestion : ''}`} data-q-start="1" data-q-end="4">
                      <div className={styles.questionPrompt}>
                        <p><strong>Questions 1-4</strong></p>
                        <p>Reading Passage 1 has eight paragraphs, A-H. Which paragraph contains the following information?</p>
                      </div>
                      <table className={styles.questionGrid}>
                        <thead>
                          <tr>
                            <th></th>
                            <th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr data-q-num="1">
                            <td><strong>1</strong> ancient stories around pearls and its customers.</td>
                            <td><input type="radio" name="q1" value="A" /></td>
                            <td><input type="radio" name="q1" value="B" /></td>
                            <td><input type="radio" name="q1" value="C" /></td>
                            <td><input type="radio" name="q1" value="D" /></td>
                            <td><input type="radio" name="q1" value="E" /></td>
                            <td><input type="radio" name="q1" value="F" /></td>
                            <td><input type="radio" name="q1" value="G" /></td>
                            <td><input type="radio" name="q1" value="H" /></td>
                          </tr>
                          <tr data-q-num="2">
                            <td><strong>2</strong> difficulties in cultivating process.</td>
                            <td><input type="radio" name="q2" value="A" /></td>
                            <td><input type="radio" name="q2" value="B" /></td>
                            <td><input type="radio" name="q2" value="C" /></td>
                            <td><input type="radio" name="q2" value="D" /></td>
                            <td><input type="radio" name="q2" value="E" /></td>
                            <td><input type="radio" name="q2" value="F" /></td>
                            <td><input type="radio" name="q2" value="G" /></td>
                            <td><input type="radio" name="q2" value="H" /></td>
                          </tr>
                          <tr data-q-num="3">
                            <td><strong>3</strong> factors which decide the value of natural pearls.</td>
                            <td><input type="radio" name="q3" value="A" /></td>
                            <td><input type="radio" name="q3" value="B" /></td>
                            <td><input type="radio" name="q3" value="C" /></td>
                            <td><input type="radio" name="q3" value="D" /></td>
                            <td><input type="radio" name="q3" value="E" /></td>
                            <td><input type="radio" name="q3" value="F" /></td>
                            <td><input type="radio" name="q3" value="G" /></td>
                            <td><input type="radio" name="q3" value="H" /></td>
                          </tr>
                          <tr data-q-num="4">
                            <td><strong>4</strong> a growth mechanism that distinguishes cultured pearls from natural ones.</td>
                            <td><input type="radio" name="q4" value="A" /></td>
                            <td><input type="radio" name="q4" value="B" /></td>
                            <td><input type="radio" name="q4" value="C" /></td>
                            <td><input type="radio" name="q4" value="D" /></td>
                            <td><input type="radio" name="q4" value="E" /></td>
                            <td><input type="radio" name="q4" value="F" /></td>
                            <td><input type="radio" name="q4" value="G" /></td>
                            <td><input type="radio" name="q4" value="H" /></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Questions 5-10: Summary completion */}
                    <div className={`${styles.question} ${currentQuestion >= 5 && currentQuestion <= 10 ? styles.activeQuestion : ''}`} data-q-start="5" data-q-end="10">
                      <div className={styles.questionPrompt}>
                        <p><strong>Questions 5-10</strong></p>
                        <p>Complete the summary below. Choose <strong>NO MORE THAN TWO WORDS</strong> from the passage for each answer.</p>
                      </div>
                      <div className={styles.summaryText}>
                        <p>In history, pearls have had great importance within the men of wealth and power, which were treated as gems for women in <input type="text" className={styles.answerInput} id="q5" size={12} spellCheck="false" autoCorrect="off" />. Also, pearls were even used as a medicine for people in <input type="text" className={styles.answerInput} id="q6" size={8} spellCheck="false" autoCorrect="off" />. There are essentially three types of pearls: natural, cultured and imitation. Most freshwater cultured pearls sold today come from China while <input type="text" className={styles.answerInput} id="q7" size={10} spellCheck="false" autoCorrect="off" /> Island is famous for its imitation pearl industry. Good-quality natural pearls are exceedingly unusual. <input type="text" className={styles.answerInput} id="q8" size={8} spellCheck="false" autoCorrect="off" /> often manufactures some of the glitteriest pearls while <input type="text" className={styles.answerInput} id="q9" size={10} spellCheck="false" autoCorrect="off" /> produces larger size ones due to the favourable environment along the coastline. In the past, <input type="text" className={styles.answerInput} id="q10" size={10} spellCheck="false" autoCorrect="off" /> in Persian Gulf produced the world's best pearls. Nowadays, the major remaining suppliers of natural pearls belong to India.</p>
                      </div>
                    </div>

                    {/* Questions 11-13: True/False/Not Given */}
                    <div className={`${styles.question} ${currentQuestion >= 11 && currentQuestion <= 13 ? styles.activeQuestion : ''}`} data-q-start="11" data-q-end="13">
                      <div className={styles.questionPrompt}>
                        <p><strong>Questions 11-13</strong></p>
                        <p>Do the following statements agree with the information given in Reading Passage 1? Write</p>
                        <ul style={{listStyle: 'none', paddingLeft: 0}}>
                          <li><strong>TRUE</strong> if the statement agrees with the information</li>
                          <li><strong>FALSE</strong> if the statement contradicts the information</li>
                          <li><strong>NOT GIVEN</strong> if there is no information on this</li>
                        </ul>
                      </div>
                      <div className={styles.question} data-q-start="11">
                        <p><b>11</b> Generally speaking, the centre of cultured pearl is significantly larger than that of a natural pearl.</p>
                        <ul className={styles.tfngOptions}>
                          <li className={styles.tfngOption}><input type="radio" id="q11_true" name="q11" value="TRUE" /><label htmlFor="q11_true">TRUE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q11_false" name="q11" value="FALSE" /><label htmlFor="q11_false">FALSE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q11_notgiven" name="q11" value="NOT GIVEN" /><label htmlFor="q11_notgiven">NOT GIVEN</label></li>
                        </ul>
                      </div>
                      <div className={styles.question} data-q-start="12">
                        <p><b>12</b> Sometimes, fake pearls can be more expensive.</p>
                        <ul className={styles.tfngOptions}>
                          <li className={styles.tfngOption}><input type="radio" id="q12_true" name="q12" value="TRUE" /><label htmlFor="q12_true">TRUE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q12_false" name="q12" value="FALSE" /><label htmlFor="q12_false">FALSE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q12_notgiven" name="q12" value="NOT GIVEN" /><label htmlFor="q12_notgiven">NOT GIVEN</label></li>
                        </ul>
                      </div>
                      <div className={styles.question} data-q-start="13">
                        <p><b>13</b> The size of the pearls produced in Japan is usually smaller than those in Australia.</p>
                        <ul className={styles.tfngOptions}>
                          <li className={styles.tfngOption}><input type="radio" id="q13_true" name="q13" value="TRUE" /><label htmlFor="q13_true">TRUE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q13_false" name="q13" value="FALSE" /><label htmlFor="q13_false">FALSE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q13_notgiven" name="q13" value="NOT GIVEN" /><label htmlFor="q13_notgiven">NOT GIVEN</label></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions 2 */}
                <div id="questions-2" className={`${styles.questionSet} ${currentPassage === 2 ? '' : styles.hidden}`}>
                  <div className={styles.questionsContainer}>
                    <div className={`${styles.question} ${currentQuestion >= 14 && currentQuestion <= 20 ? styles.activeQuestion : ''}`} data-q-start="14" data-q-end="20">
                      <div className={styles.questionPrompt}>
                        <p><strong>Questions 14-20</strong></p>
                        <p>Reading Passage 2 has eight paragraphs, A-H. Which paragraph contains the following information?</p>
                        <p><strong>NB</strong> You may use any letter more than once.</p>
                      </div>
                      <table className={styles.questionGrid}>
                        <thead>
                          <tr>
                            <th></th>
                            <th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th><th>H</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr data-q-num="14">
                            <td><strong>14</strong> a reference to the irregular movement of particles.</td>
                            <td><input type="radio" name="q14" value="A" /></td>
                            <td><input type="radio" name="q14" value="B" /></td>
                            <td><input type="radio" name="q14" value="C" /></td>
                            <td><input type="radio" name="q14" value="D" /></td>
                            <td><input type="radio" name="q14" value="E" /></td>
                            <td><input type="radio" name="q14" value="F" /></td>
                            <td><input type="radio" name="q14" value="G" /></td>
                            <td><input type="radio" name="q14" value="H" /></td>
                          </tr>
                          <tr data-q-num="15">
                            <td><strong>15</strong> mention of a productive land turning into a desert in the 20th century.</td>
                            <td><input type="radio" name="q15" value="A" /></td>
                            <td><input type="radio" name="q15" value="B" /></td>
                            <td><input type="radio" name="q15" value="C" /></td>
                            <td><input type="radio" name="q15" value="D" /></td>
                            <td><input type="radio" name="q15" value="E" /></td>
                            <td><input type="radio" name="q15" value="F" /></td>
                            <td><input type="radio" name="q15" value="G" /></td>
                            <td><input type="radio" name="q15" value="H" /></td>
                          </tr>
                          <tr data-q-num="16">
                            <td><strong>16</strong> types of deserts.</td>
                            <td><input type="radio" name="q16" value="A" /></td>
                            <td><input type="radio" name="q16" value="B" /></td>
                            <td><input type="radio" name="q16" value="C" /></td>
                            <td><input type="radio" name="q16" value="D" /></td>
                            <td><input type="radio" name="q16" value="E" /></td>
                            <td><input type="radio" name="q16" value="F" /></td>
                            <td><input type="radio" name="q16" value="G" /></td>
                            <td><input type="radio" name="q16" value="H" /></td>
                          </tr>
                          <tr data-q-num="17">
                            <td><strong>17</strong> mention of technical methods used to tackle the problems of deserts.</td>
                            <td><input type="radio" name="q17" value="A" /></td>
                            <td><input type="radio" name="q17" value="B" /></td>
                            <td><input type="radio" name="q17" value="C" /></td>
                            <td><input type="radio" name="q17" value="D" /></td>
                            <td><input type="radio" name="q17" value="E" /></td>
                            <td><input type="radio" name="q17" value="F" /></td>
                            <td><input type="radio" name="q17" value="G" /></td>
                            <td><input type="radio" name="q17" value="H" /></td>
                          </tr>
                          <tr data-q-num="18">
                            <td><strong>18</strong> the influence of migration on desertification.</td>
                            <td><input type="radio" name="q18" value="A" /></td>
                            <td><input type="radio" name="q18" value="B" /></td>
                            <td><input type="radio" name="q18" value="C" /></td>
                            <td><input type="radio" name="q18" value="D" /></td>
                            <td><input type="radio" name="q18" value="E" /></td>
                            <td><input type="radio" name="q18" value="F" /></td>
                            <td><input type="radio" name="q18" value="G" /></td>
                            <td><input type="radio" name="q18" value="H" /></td>
                          </tr>
                          <tr data-q-num="19">
                            <td><strong>19</strong> lack of agreement among the scientists about the causes of desertification.</td>
                            <td><input type="radio" name="q19" value="A" /></td>
                            <td><input type="radio" name="q19" value="B" /></td>
                            <td><input type="radio" name="q19" value="C" /></td>
                            <td><input type="radio" name="q19" value="D" /></td>
                            <td><input type="radio" name="q19" value="E" /></td>
                            <td><input type="radio" name="q19" value="F" /></td>
                            <td><input type="radio" name="q19" value="G" /></td>
                            <td><input type="radio" name="q19" value="H" /></td>
                          </tr>
                          <tr data-q-num="20">
                            <td><strong>20</strong> a description of the fatal effects of farming practice.</td>
                            <td><input type="radio" name="q20" value="A" /></td>
                            <td><input type="radio" name="q20" value="B" /></td>
                            <td><input type="radio" name="q20" value="C" /></td>
                            <td><input type="radio" name="q20" value="D" /></td>
                            <td><input type="radio" name="q20" value="E" /></td>
                            <td><input type="radio" name="q20" value="F" /></td>
                            <td><input type="radio" name="q20" value="G" /></td>
                            <td><input type="radio" name="q20" value="H" /></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className={`${styles.question} ${currentQuestion >= 21 && currentQuestion <= 26 ? styles.activeQuestion : ''}`} data-q-start="21" data-q-end="26">
                      <div className={styles.questionPrompt}>
                        <p><strong>Questions 21-26</strong></p>
                        <p>Do the following statements agree with the information given in Reading Passage 2? Write</p>
                        <ul style={{listStyle: 'none', paddingLeft: 0}}>
                          <li><strong>TRUE</strong> if the statement is true</li>
                          <li><strong>FALSE</strong> if the statement is false</li>
                          <li><strong>NOT GIVEN</strong> if the information is not given in the passage</li>
                        </ul>
                      </div>

                      <div className={styles.question} data-q-start="21">
                        <p><b>21</b> It is difficult to ascertain where the deserts end in some areas.</p>
                        <ul className={styles.tfngOptions}>
                          <li className={styles.tfngOption}><input type="radio" id="q21_true" name="q21" value="TRUE" /><label htmlFor="q21_true">TRUE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q21_false" name="q21" value="FALSE" /><label htmlFor="q21_false">FALSE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q21_notgiven" name="q21" value="NOT GIVEN" /><label htmlFor="q21_notgiven">NOT GIVEN</label></li>
                        </ul>
                      </div>

                      <div className={styles.question} data-q-start="22">
                        <p><b>22</b> Media is uninterested in the problems of desertification.</p>
                        <ul className={styles.tfngOptions}>
                          <li className={styles.tfngOption}><input type="radio" id="q22_true" name="q22" value="TRUE" /><label htmlFor="q22_true">TRUE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q22_false" name="q22" value="FALSE" /><label htmlFor="q22_false">FALSE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q22_notgiven" name="q22" value="NOT GIVEN" /><label htmlFor="q22_notgiven">NOT GIVEN</label></li>
                        </ul>
                      </div>

                      <div className={styles.question} data-q-start="23">
                        <p><b>23</b> The most common cause of desertification is the lack of rainfall.</p>
                        <ul className={styles.tfngOptions}>
                          <li className={styles.tfngOption}><input type="radio" id="q23_true" name="q23" value="TRUE" /><label htmlFor="q23_true">TRUE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q23_false" name="q23" value="FALSE" /><label htmlFor="q23_false">FALSE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q23_notgiven" name="q23" value="NOT GIVEN" /><label htmlFor="q23_notgiven">NOT GIVEN</label></li>
                        </ul>
                      </div>

                      <div className={styles.question} data-q-start="24">
                        <p><b>24</b> Farming animals in semi-arid areas will increase soil erosion.</p>
                        <ul className={styles.tfngOptions}>
                          <li className={styles.tfngOption}><input type="radio" id="q24_true" name="q24" value="TRUE" /><label htmlFor="q24_true">TRUE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q24_false" name="q24" value="FALSE" /><label htmlFor="q24_false">FALSE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q24_notgiven" name="q24" value="NOT GIVEN" /><label htmlFor="q24_notgiven">NOT GIVEN</label></li>
                        </ul>
                      </div>

                      <div className={styles.question} data-q-start="25">
                        <p><b>25</b> People in Asian countries no longer use firewood as the chief fuel.</p>
                        <ul className={styles.tfngOptions}>
                          <li className={styles.tfngOption}><input type="radio" id="q25_true" name="q25" value="TRUE" /><label htmlFor="q25_true">TRUE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q25_false" name="q25" value="FALSE" /><label htmlFor="q25_false">FALSE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q25_notgiven" name="q25" value="NOT GIVEN" /><label htmlFor="q25_notgiven">NOT GIVEN</label></li>
                        </ul>
                      </div>

                      <div className={styles.question} data-q-start="26">
                        <p><b>26</b> Technology studying the relationship of people, livestock and desertification has not yet been invented.</p>
                        <ul className={styles.tfngOptions}>
                          <li className={styles.tfngOption}><input type="radio" id="q26_true" name="q26" value="TRUE" /><label htmlFor="q26_true">TRUE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q26_false" name="q26" value="FALSE" /><label htmlFor="q26_false">FALSE</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q26_notgiven" name="q26" value="NOT GIVEN" /><label htmlFor="q26_notgiven">NOT GIVEN</label></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Questions 3 content */}
                <div id="questions-3" className={`${styles.questionSet} ${currentPassage === 3 ? '' : styles.hidden}`}>
                  <div className={styles.questionsContainer}>
                    {/* Questions 27-33: Matching headings */}
                    <div className={`${styles.question} ${currentQuestion >= 27 && currentQuestion <= 33 ? styles.activeQuestion : ''}`} data-q-start="27" data-q-end="33">
                      <div className={styles.questionPrompt}>
                        <p><strong>Questions 27-33</strong></p>
                        <p>Reading Passage 3 has seven paragraphs, A-G. Choose the correct heading for each paragraph from the list of headings below.</p>
                      </div>
                      <ul
                        ref={headingsListRef}
                        id="headings-list-3"
                        className={styles.headingsList}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'headings-list')}
                      >
                        <li
                          className={styles.headingItem}
                          draggable="true"
                          data-value="i"
                          onDragStart={(e) => handleDragStart(e, 'i')}
                        >
                          Hurricanes in history
                        </li>
                        <li
                          className={styles.headingItem}
                          draggable="true"
                          data-value="ii"
                          onDragStart={(e) => handleDragStart(e, 'ii')}
                        >
                          How hurricanes form
                        </li>
                        <li
                          className={styles.headingItem}
                          draggable="true"
                          data-value="iii"
                          onDragStart={(e) => handleDragStart(e, 'iii')}
                        >
                          How a laboratory exercise re-route a hurricane
                        </li>
                        <li
                          className={styles.headingItem}
                          draggable="true"
                          data-value="iv"
                          onDragStart={(e) => handleDragStart(e, 'iv')}
                        >
                          Exciting ways to utilise future technologies
                        </li>
                        <li
                          className={styles.headingItem}
                          draggable="true"
                          data-value="v"
                          onDragStart={(e) => handleDragStart(e, 'v')}
                        >
                          Are hurricanes unbeatable?
                        </li>
                        <li
                          className={styles.headingItem}
                          draggable="true"
                          data-value="vi"
                          onDragStart={(e) => handleDragStart(e, 'vi')}
                        >
                          Re-visit earlier ideas
                        </li>
                        <li
                          className={styles.headingItem}
                          draggable="true"
                          data-value="vii"
                          onDragStart={(e) => handleDragStart(e, 'vii')}
                        >
                          How lives might have been saved
                        </li>
                        <li
                          className={styles.headingItem}
                          draggable="true"
                          data-value="viii"
                          onDragStart={(e) => handleDragStart(e, 'viii')}
                        >
                          A range of low-tech methods
                        </li>
                      </ul>
                    </div>

                    {/* Questions 34-38: Summary completion */}
                    <div className={`${styles.question} ${currentQuestion >= 34 && currentQuestion <= 38 ? styles.activeQuestion : ''}`} data-q-start="34" data-q-end="38">
                      <div className={styles.questionPrompt}>
                        <p><strong>Questions 34-38</strong></p>
                        <p>Complete the summary below. Choose <strong>ONE WORD ONLY</strong> from the passage for each answer.</p>
                      </div>
                      <div className={styles.summaryText}>
                        <p>Hurricanes originate as groups of <strong>34</strong> <input type="text" className={styles.answerInput} id="q34" size={15} spellCheck="false" autoCorrect="off" /> over the tropical oceans. Low-latitude seas continuously provide heat and moisture to the atmosphere, producing warm, humid air above the sea surface. When this air rises, the water vapour in it condenses to form clouds and precipitation. <strong>35</strong> <input type="text" className={styles.answerInput} id="q35" size={15} spellCheck="false" autoCorrect="off" /> releases heat—the solar heat it took to evaporate the water at the ocean surface. This so-called latent <strong>36</strong> <input type="text" className={styles.answerInput} id="q36" size={8} spellCheck="false" autoCorrect="off" /> of condensation makes the air more buoyant, causing it to ascend still higher in a self-reinforcing feedback process. Eventually, the tropical depression begins to organise and strengthen, forming the familiar <strong>37</strong> <input type="text" className={styles.answerInput} id="q37" size={8} spellCheck="false" autoCorrect="off" />—the calm central hub around which a hurricane spins. On passing over <strong>38</strong> <input type="text" className={styles.answerInput} id="q38" size={8} spellCheck="false" autoCorrect="off" />, the hurricane's sustaining source of warm water is cut off, which leads to the storm's rapid weakening.</p>
                      </div>
                    </div>

                    {/* Questions 39-40: Multiple choice */}
                    <div className={`${styles.question} ${currentQuestion >= 39 && currentQuestion <= 40 ? styles.activeQuestion : ''}`} data-q-start="39" data-q-end="40">
                      <div className={styles.questionPrompt}><p><strong>Questions 39-40</strong><br/>Choose the correct letter, <strong>A, B, C or D</strong>.</p></div>
                      <div className={styles.question} data-q-start="39">
                        <p><b>39</b> What encouraged the writer to restart researching hurricane control?</p>
                        <ul className={styles.tfngOptions}>
                          <li className={styles.tfngOption}><input type="radio" id="q39_a" name="q39" value="A" /><label htmlFor="q39_a"> A. the huge damage hurricane triggers</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q39_b" name="q39" value="B" /><label htmlFor="q39_b"> B. the developments in computer technologies</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q39_c" name="q39" value="C" /><label htmlFor="q39_c"> C. the requirement of some local people</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q39_d" name="q39" value="D" /><label htmlFor="q39_d"> D. the chaos theory learnt as a student</label></li>
                        </ul>
                      </div>
                      <div className={styles.question} data-q-start="40">
                        <p><b>40</b> What was the writer's reaction after their first experiment?</p>
                        <ul className={styles.tfngOptions}>
                          <li className={styles.tfngOption}><input type="radio" id="q40_a" name="q40" value="A" /><label htmlFor="q40_a"> A. surprised that their intervention had not achieve a lot.</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q40_b" name="q40" value="B" /><label htmlFor="q40_b"> B. ecstatic with the achievement the first experiment had</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q40_c" name="q40" value="C" /><label htmlFor="q40_c"> C. surprised that their intervention had the intended effect</label></li>
                          <li className={styles.tfngOption}><input type="radio" id="q40_d" name="q40" value="D" /><label htmlFor="q40_d"> D. regretful about the impending success.</label></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
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

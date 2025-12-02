'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../../app/full-exam-reading/ReadingTest.module.css';
import { ReadingTestData } from '@/lib/types/reading-test';


type FlowChartField = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  questionNumber?: number; // Optional question number for each field
};

interface FlowChartImageProps {
  imageUrl: string;
  questionNumbers: number[];
  fields: FlowChartField[];
  userAnswers: Record<string, string>;
  onAnswerChange: (qNum: number, value: string) => void;
}

// Simple flow chart image renderer for reading test
// Reuses field coordinates from admin ImageChartEditor to position inputs
const FlowChartImage: React.FC<FlowChartImageProps> = ({
  imageUrl,
  questionNumbers,
  fields,
  userAnswers,
  onAnswerChange,
}) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const updateScale = useCallback(() => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const displayedWidth = img.clientWidth;
    const displayedHeight = img.clientHeight;
    if (!naturalWidth || !naturalHeight || !displayedWidth || !displayedHeight) return;
    setScale({
      x: displayedWidth / naturalWidth,
      y: displayedHeight / naturalHeight,
    });
  }, []);

  useEffect(() => {
    if (!imageLoaded) return;
    const handle = setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(handle);
      window.removeEventListener('resize', updateScale);
    };
  }, [imageLoaded, updateScale]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setTimeout(updateScale, 50);
  };

  // Ensure we have matching lengths
  const safeFields = Array.isArray(fields) ? fields : [];
  
  // Match fields to question numbers:
  // 1. If field has questionNumber, use it to match
  // 2. Otherwise, match by index (for backward compatibility)
  // Display sequential numbers (1, 2, 3, 4...) but use actual question numbers for answer tracking
  const pairs = questionNumbers.map((qNum, idx) => {
    // First try to find field by questionNumber
    const fieldByQuestionNumber = safeFields.find((f: FlowChartField) => f.questionNumber === qNum);
    
    // If found, use it; otherwise fall back to index-based matching
    const field = fieldByQuestionNumber || safeFields[idx];
    
    return {
      qNum, // Actual question number (for answer tracking)
      displayQNum: idx + 1, // Sequential display number (1, 2, 3, 4...)
      field,
    };
  }).filter(pair => pair.field); // Filter out pairs without valid fields

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f9fafb',
        marginTop: 16,
      }}
    >
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Flow chart"
        style={{ maxWidth: '100%', height: 'auto', display: 'block', width: '100%' }}
        onLoad={handleImageLoad}
      />
      {imageLoaded &&
        pairs.map(({ qNum, displayQNum, field }) => {
          if (!field || typeof field.x !== 'number' || typeof field.y !== 'number') return null;
          const width = (field.width ?? 140) * scale.x;
          const height = (field.height ?? 32) * scale.y;
          const left = field.x * scale.x;
          const top = field.y * scale.y;
          const value = userAnswers[qNum.toString()] ?? '';
          const labelHeight = 20;
          const showLabelAbove = top >= labelHeight; // Show label above if there's enough space
          
          return (
            <div
              key={qNum}
              style={{
                position: 'absolute',
                left,
                top,
                width,
                zIndex: 10,
              }}
            >
              {/* Input Field - Question number shown only in placeholder */}
              <input
                id={`q${qNum}`}
                type="text"
                className={styles.answerInput}
                placeholder={`${displayQNum}`}
                spellCheck={false}
                autoComplete="off"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height,
                  border: '2px solid #333',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: 14,
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                }}
                value={value}
                onChange={(e) => onAnswerChange(qNum, e.target.value)}
              />
            </div>
          );
        })}
    </div>
  );
};


interface ResultDetail {
  qNum: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}


interface ReadingTestComponentProps {
  testData: ReadingTestData;
  onTestComplete?: (results: any) => void;
}

const ReadingTestComponent: React.FC<ReadingTestComponentProps> = ({ testData, onTestComplete }) => {
  const [currentPassage, setCurrentPassage] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeInSeconds, setTimeInSeconds] = useState((testData.test?.totalTimeMinutes || 60) * 60);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeQuestionElement, setActiveQuestionElement] = useState<HTMLElement | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState<boolean>(false);
  const [selectedQuote, setSelectedQuote] = useState<string>('');
  const [noteText, setNoteText] = useState<string>('');
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showContrastPanel, setShowContrastPanel] = useState(false);
  const [showTextSizePanel, setShowTextSizePanel] = useState(false);
  const [showInstructionsPanel, setShowInstructionsPanel] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimerEndModal, setShowTimerEndModal] = useState(false);
  const [showSubmittingModal, setShowSubmittingModal] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [contrastTheme, setContrastTheme] = useState<'black-on-white' | 'white-on-black' | 'yellow-on-black'>('black-on-white');
  const [textSize, setTextSize] = useState<'regular' | 'large' | 'extra-large'>('regular');
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
  const optionsModalRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);

  const correctAnswers = testData.correctAnswers as Record<string, string>;
  const passageConfigs = testData.passageConfigs;

  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error('Error requesting fullscreen:', error);
    }
  }, []);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setLoadingProgress(0);
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            setIsTestStarted(true);
          }, 500);
          return 100;
        }
        return prev + 2; // Increment by 2% each time
      });
    }, 100); // Update every 100ms
  }, []);

  const handleFullscreenRequired = useCallback(async () => {
    try {
      await requestFullscreen();
    } catch (error) {
      console.error('Error requesting fullscreen:', error);
      // Continue even if fullscreen fails
    }
    setShowFullscreenModal(false);
    startLoading();
  }, [requestFullscreen, startLoading]);

  const startExam = useCallback(() => {
    if (!isLoading) {
      startLoading();
    }
  }, [isLoading, startLoading]);

  const startTimer = useCallback(() => {
    const interval = setInterval(() => {
      setTimeInSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowTimerEndModal(true);
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
    // Note: updateAllIndicators is defined later, but we access it via closure
    const updateIndicators = () => {
      updateAnsweredIndicators();
      updateAttemptedCounts();
    };
    document.addEventListener('input', updateIndicators);
    document.addEventListener('change', updateIndicators);
  }, []);

  const initializeTest = useCallback(() => {
    startTimer();
    initializeDragAndDrop();
    setupEventListeners();
  }, [startTimer, initializeDragAndDrop, setupEventListeners]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    selectionRef.current = null;
    if (contextMenuRef.current) contextMenuRef.current.style.display = 'none';
  }, []);

  const applyHighlight = useCallback((className: string) => {
    const currentSelection = selectionRef.current;
    if (!currentSelection || currentSelection.collapsed) return null;
    const span = document.createElement('span');
    span.className = className;
    try {
      const contents = currentSelection.extractContents();
      span.appendChild(contents);
      currentSelection.insertNode(span);
    } catch (e) {
      return null;
    }
    clearSelection();
    return span;
  }, [clearSelection]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't interfere with input fields, buttons, or form elements
    // Early return for any input-related elements
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' || 
        target.tagName === 'BUTTON' ||
        target.closest('input, textarea, select, button') !== null) {
      return; // Allow default behavior for input fields
    }
    
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      e.preventDefault();
      selectionRef.current = sel.getRangeAt(0).cloneRange();
      const menu = contextMenuRef.current;
      if (menu) {
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        menu.style.display = 'block';
      }
    }
    // If no selection, don't prevent default - allow normal context menu
  }, []);

  const closeContextMenu = useCallback(() => {
    if (contextMenuRef.current) {
      contextMenuRef.current.style.display = 'none';
    }
    clearSelection();
  }, [clearSelection]);

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
    
    // Find the headings list - try to find it in the same passage/question set as the target
    let headingsList = headingsListRef.current;
    const targetPassage = targetBox.closest(`.${styles.questionSet}`);
    if (targetPassage) {
      const passageHeadingsList = targetPassage.querySelector(`.${styles.headingsList}`) as HTMLUListElement | null;
      if (passageHeadingsList) {
        headingsList = passageHeadingsList;
      }
    }

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
    else if (targetBox === headingsList || targetBox.classList.contains(styles.headingsList)) {
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

  const getUserAnswer = useCallback((qNum: number): { value: string; text: string } => {
    // Handle drag-and-drop questions (27-33)
    if (qNum >= 27 && qNum <= 33) {
      const dropBox = document.getElementById(`drop-box-3-${qNum}`);
      const droppedItem = dropBox ? dropBox.querySelector(`.${styles.headingItem}`) : null;
      if (droppedItem) {
        const dataValue = droppedItem.getAttribute('data-value') || '';
        const textValue = droppedItem.textContent?.trim() || '';
        if (dataValue || textValue) {
          return { value: dataValue || textValue, text: textValue || dataValue };
        }
      }
      return { value: '', text: 'No Answer' };
    }

    // First check userAnswers state (most reliable - this is updated by handleAnswerChange)
    const stateAnswer = userAnswers[qNum.toString()];
    if (stateAnswer !== undefined && stateAnswer !== null && stateAnswer !== '') {
      const trimmedValue = stateAnswer.trim();
      return { value: trimmedValue, text: trimmedValue || 'No Answer' };
    }

    // Fallback to DOM for backwards compatibility
    // Check for text input fields by ID first (most common)
    const textInputById = document.getElementById(`q${qNum}`) as HTMLInputElement;
    if (textInputById && textInputById.type === 'text' && textInputById.value) {
      const inputValue = textInputById.value.trim();
      if (inputValue) {
        return { value: inputValue, text: inputValue };
    }
    }

    // Check for radio buttons (multiple choice, true/false/not given, matching information)
    const radioInput = document.querySelector(`input[name="q${qNum}"]:checked`) as HTMLInputElement;
    if (radioInput && radioInput.value) {
      return { value: radioInput.value, text: radioInput.value };
    }

    return { value: '', text: 'No Answer' };
  }, [userAnswers]);

  const checkValue = useCallback((userValue: string, correctValue: string | undefined): boolean => {
    if (!userValue || !correctValue) return false;
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
    if (!el) {
      // Check if this question is part of a multi-blank summary completion
      // Look for questions that have subQuestions containing this qNum
      const allQuestions = Object.values(testData.questions);
      for (const question of allQuestions) {
        if (question.subQuestions && question.subQuestions.includes(qNum.toString())) {
          el = document.querySelector(`.${styles.question}[data-q-start="${question.subQuestions[0]}"]`);
          break;
        }
      }
    }
    if (!el) el = document.querySelector(`.${styles.questionGrid} tr[data-q-num="${qNum}"]`);
    return el as HTMLElement;
  }, []);

  const markQuestionContainer = useCallback((qNum: number, isCorrect: boolean) => {
    const questionEl = findQuestionElement(qNum);
    if (questionEl) {
      questionEl.classList.add(isCorrect ? styles.correct : styles.incorrect);
    }
  }, [findQuestionElement]);

  const displayCorrectAnswer = useCallback((qNum: number, correctAnswer: string | undefined) => {
    if (!correctAnswer) return;
    
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
  }, [testData.bandCalculation]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
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

      // Do not display correct answers after submission

      resultDetails.push({
        qNum: i,
        userAnswer: text,
        correctAnswer: correctAnswer || '',
        isCorrect
      });
    }

    const band = calculateIELTSBand(score);
    setResults({ score, band, details: resultDetails });
    // Don't show modal - let parent handle navigation to results page
    // setShowResultsModal(true);

    // Exit fullscreen mode
    exitFullscreen();

    // Call the completion callback if provided
    if (onTestComplete) {
      try {
        onTestComplete({ score, band, details: resultDetails });
      } catch (error) {
        console.error('Error in onTestComplete callback:', error);
      }
    } else {
      console.warn('onTestComplete callback is not provided');
    }

    if (deliverButtonRef.current) {
      deliverButtonRef.current.textContent = 'Checked';
      deliverButtonRef.current.style.backgroundColor = '#dc3545';
      deliverButtonRef.current.style.color = 'white';
      deliverButtonRef.current.style.borderColor = '#dc3545';
      deliverButtonRef.current.onclick = () => setShowResultsModal(true);
    }
  }, [timerInterval, getUserAnswer, correctAnswers, checkValue, markQuestionContainer, markSubQuestionButton, displayCorrectAnswer, calculateIELTSBand, onTestComplete, exitFullscreen]);

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
  }, [getUserAnswer, passageConfigs]);

  const updateAllIndicators = useCallback(() => {
    updateAnsweredIndicators();
    updateAttemptedCounts();
  }, [updateAnsweredIndicators, updateAttemptedCounts]);

  const handleAnswerChange = useCallback((qNum: number, value: string) => {
    setUserAnswers(prev => {
      const updated = { ...prev, [qNum.toString()]: value };
      return updated;
    });
    // Update indicators after state update
    setTimeout(() => updateAllIndicators(), 0);
  }, [updateAllIndicators]);

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

  const [notesOpen, setNotesOpen] = useState<boolean>(false);

  const toggleNotesPanel = useCallback(() => {
    setNotesOpen(prev => !prev);
  }, []);

  useEffect(() => {
    if (notesOpen) document.body.classList.add('notes-visible');
    else document.body.classList.remove('notes-visible');
    return () => document.body.classList.remove('notes-visible');
  }, [notesOpen]);

  const onHighlightClick = useCallback(() => {
    applyHighlight(styles.highlight);
  }, [applyHighlight]);

  const onNoteClick = useCallback(() => {
    const currentSelection = selectionRef.current;
    if (currentSelection) {
      setSelectedQuote(currentSelection.toString());
      setNoteModalOpen(true);
      if (contextMenuRef.current) contextMenuRef.current.style.display = 'none';
    }
  }, []);

  const onSaveNote = useCallback(() => {
    const currentSelection = selectionRef.current;
    if (!currentSelection) return;
    const highlightSpan = applyHighlight(styles.noteHighlight);
    if (!highlightSpan) return;
    const noteId = `note-${Date.now()}`;
    highlightSpan.id = noteId;

    // Create note item
    const noteItem = document.createElement('div');
    noteItem.className = styles.noteItem;
    noteItem.dataset.targetId = noteId;
    noteItem.innerHTML = `<button class="${styles.noteDeleteBtn}" title="Delete note">&times;</button><div class="${styles.noteSourceText}">"${selectedQuote}"</div><div class="${styles.noteText}">${noteText || '<i>No additional comment.</i>'}</div>`;
    noteItem.addEventListener('click', (evt) => {
      const target = evt.target as HTMLElement;
      // Don't stop propagation for delete button - let it bubble to deletion handler
      const deleteBtn = target.closest(`.${styles.noteDeleteBtn}`);
      if (deleteBtn) {
        return; // Let the event bubble to the container's deletion handler
      }
      evt.stopPropagation();
      const targetEl = document.getElementById(noteId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.add('flash');
        window.setTimeout(() => targetEl.classList.remove('flash'), 1200);
      }
    });
    notesListRef.current?.appendChild(noteItem);

    setNoteText('');
    setSelectedQuote('');
    setNoteModalOpen(false);
    if (!notesOpen) setNotesOpen(true);
  }, [applyHighlight, selectedQuote, noteText, notesOpen]);

  const unwrapElement = (element: HTMLElement) => {
    const parent = element.parentNode;
    if (!parent) return;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
    parent.normalize();
  };

  const renderMatchingHeadingsGroup = (groupQuestions: Array<[string, any]>, currentQuestion: number) => {
    if (groupQuestions.length === 0) return null;
    
    const firstQuestionId = parseInt(groupQuestions[0][0]);
    const lastQuestionId = parseInt(groupQuestions[groupQuestions.length - 1][0]);
    const firstQuestionData = groupQuestions[0][1];
    const isActive = currentQuestion >= firstQuestionId && currentQuestion <= lastQuestionId;
    
    // Get headings list from first question (they should all have the same list)
    const headingsList = firstQuestionData.headingsList || [];
    
    // Determine paragraph letters based on number of questions
    const paragraphCount = groupQuestions.length;
    const firstParagraph = 'A';
    const lastParagraph = String.fromCharCode(65 + paragraphCount - 1); // A, B, C, etc.

    return (
      <div
        key={`matching-headings-${firstQuestionId}`}
        className={`${styles.question} ${isActive ? styles.activeQuestion : ''}`}
        data-q-start={firstQuestionId.toString()}
      >
        <div className={styles.questionPrompt}>
          <p><strong>Questions {firstQuestionId}-{lastQuestionId}</strong></p>
          <p>Reading Passage {firstQuestionData.passageId} has {paragraphCount} paragraph{paragraphCount !== 1 ? 's' : ''}, {firstParagraph}{paragraphCount > 1 ? `-${lastParagraph}` : ''}. Choose the correct heading for each paragraph from the list of headings below.</p>
        </div>
        <ul 
          ref={headingsListRef} 
          className={styles.headingsList}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, `headings-list-${firstQuestionId}`)}
        >
          {headingsList.map((heading: string, index: number) => (
            <li
              key={`heading-${index}`}
              className={styles.headingItem}
              data-value={heading}
              draggable
              onDragStart={(e) => handleDragStart(e, heading)}
            >
              {heading}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderMatchingInformationGroup = (groupQuestions: Array<[string, any]>, currentQuestion: number) => {
    if (!groupQuestions || groupQuestions.length === 0) return null;
    
    const firstQuestionId = parseInt(groupQuestions[0][0]);
    const lastQuestionId = parseInt(groupQuestions[groupQuestions.length - 1][0]);
    const firstQuestionData = groupQuestions[0][1];
    
    if (!firstQuestionData) return null;
    
    const isActive = currentQuestion >= firstQuestionId && currentQuestion <= lastQuestionId;
    
    // Get options (paragraph letters) from first question
    const options = firstQuestionData.options || [];
    const passageId = firstQuestionData.passageId;
    
    if (!options || options.length === 0) return null;

    return (
      <div
        key={`matching-information-${firstQuestionId}`}
        className={`${styles.question} ${isActive ? styles.activeQuestion : ''}`}
        data-q-start={firstQuestionId.toString()}
        data-q-end={lastQuestionId.toString()}
      >
        <div className={styles.questionPrompt}>
          <p><strong>Questions {firstQuestionId}-{lastQuestionId}</strong></p>
          <p>Reading Passage {passageId} has eight paragraphs, A-H. Which paragraph contains the following information?</p>
          {passageId === 2 && (
            <p><strong>NB</strong> You may use any letter more than once.</p>
          )}
        </div>
        <table className={styles.questionGrid}>
          <thead>
            <tr>
              <th></th>
              {options.map((option: string) => (
                <th key={option}>{option}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupQuestions.map(([questionId, questionData]) => {
              const qNum = parseInt(questionId);
              const isQuestionActive = currentQuestion === qNum;
              return (
                <tr 
                  key={questionId}
                  data-q-num={qNum}
                  className={isQuestionActive ? styles.activeQuestion : ''}
                >
                  <td><strong>{questionId}</strong> {questionData.questionText}</td>
                  {options.map((option: string) => (
                    <td key={option}>
                      <input 
                        type="radio" 
                        name={`q${questionId}`} 
                        value={option}
                        id={`q${questionId}_${option}`}
                        checked={userAnswers[questionId] === option}
                        onChange={(e) => handleAnswerChange(parseInt(questionId), e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderQuestion = (questionId: string, questionData: any, currentQuestion: number, isGrouped: boolean = false) => {
    const questionNum = parseInt(questionId);
    const isActive = currentQuestion === questionNum;

    // Skip rendering individual matching-headings or matching-information questions if they're part of a group
    if (isGrouped && (questionData.type === 'matching-headings' || questionData.type === 'matching-information')) {
      return null;
    }

    switch (questionData.type) {
      case 'matching-headings':
        // This should not be reached if grouping is working correctly
        return null;

      case 'matching-information':
        // This should not be reached if grouping is working correctly
        return null;

      case 'summary-completion':
        // Check if this is a multi-blank summary completion
        if (questionData.subQuestions) {
          // Split the summary text by placeholders and render with React inputs
          const renderSummaryWithInputs = () => {
            let summaryText = questionData.summaryText;
            const parts: Array<{ type: 'text' | 'input'; content?: string; qNum?: string }> = [];
            
            // Find all placeholders
            const placeholderRegex = new RegExp(`\\[(${questionData.subQuestions.join('|')})\\]`, 'g');
            let lastIndex = 0;
            let match;
            
            while ((match = placeholderRegex.exec(summaryText)) !== null) {
              // Add text before placeholder
              if (match.index > lastIndex) {
                parts.push({ type: 'text', content: summaryText.substring(lastIndex, match.index) });
              }
              // Add input placeholder
              parts.push({ type: 'input', qNum: match[1] });
              lastIndex = match.index + match[0].length;
            }
            
            // Add remaining text
            if (lastIndex < summaryText.length) {
              parts.push({ type: 'text', content: summaryText.substring(lastIndex) });
            }
            
            return (
              <p>
                {parts.map((part, index) => {
                  if (part.type === 'input' && part.qNum) {
                    const qNum = parseInt(part.qNum);
                    return (
                      <input
                        key={`input-${part.qNum}-${index}`}
                        type="text"
                        className={styles.answerInput}
                        placeholder={part.qNum}
                        id={`q${part.qNum}`}
                        size={12}
                        spellCheck={false}
                        autoCorrect="off"
                        value={userAnswers[part.qNum] || ''}
                        onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                      />
                    );
                  }
                  return <span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: part.content || '' }} />;
                })}
              </p>
            );
          };

          return (
            <div
              key={questionId}
              className={`${styles.question} ${isActive ? styles.activeQuestion : ''}`}
              data-q-start={questionId}
            >
              <div className={styles.questionPrompt}>
                <p><strong>Questions {questionData.subQuestions[0]}-{questionData.subQuestions[questionData.subQuestions.length - 1]}</strong></p>
                <p>{questionData.questionText}</p>
              </div>
              <div className={styles.summaryText}>
                {renderSummaryWithInputs()}
              </div>
            </div>
          );
        } else {
          // Single blank summary completion
          const renderSingleSummaryWithInput = () => {
            const summaryText = questionData.summaryText;
            const placeholderRegex = new RegExp(`\\[${questionId}\\]`, 'g');
            const parts: Array<{ type: 'text' | 'input'; content?: string }> = [];
            let lastIndex = 0;
            let match;
            
            while ((match = placeholderRegex.exec(summaryText)) !== null) {
              if (match.index > lastIndex) {
                parts.push({ type: 'text', content: summaryText.substring(lastIndex, match.index) });
              }
              parts.push({ type: 'input' });
              lastIndex = match.index + match[0].length;
            }
            
            if (lastIndex < summaryText.length) {
              parts.push({ type: 'text', content: summaryText.substring(lastIndex) });
            }
            
            return (
              <p>
                {parts.map((part, index) => {
                  if (part.type === 'input') {
                    const qNum = parseInt(questionId);
                    return (
                      <input
                        key={`input-${questionId}-${index}`}
                        type="text"
                        className={styles.answerInput}
                        placeholder={questionId}
                        id={`q${questionId}`}
                        size={12}
                        spellCheck={false}
                        autoCorrect="off"
                        value={userAnswers[questionId] || ''}
                        onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                      />
                    );
                  }
                  return <span key={`text-${index}`} dangerouslySetInnerHTML={{ __html: part.content || '' }} />;
                })}
              </p>
            );
          };

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
                {renderSingleSummaryWithInput()}
              </div>
            </div>
          );
        }

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
                  <input 
                    type="radio" 
                    id={`q${questionId}_true`} 
                    name={`q${questionId}`} 
                    value="TRUE"
                    checked={userAnswers[questionId] === 'TRUE'}
                    onChange={(e) => handleAnswerChange(parseInt(questionId), e.target.value)}
                  />
                  <label htmlFor={`q${questionId}_true`}>TRUE</label>
                </li>
                <li className={styles.tfngOption}>
                  <input 
                    type="radio" 
                    id={`q${questionId}_false`} 
                    name={`q${questionId}`} 
                    value="FALSE"
                    checked={userAnswers[questionId] === 'FALSE'}
                    onChange={(e) => handleAnswerChange(parseInt(questionId), e.target.value)}
                  />
                  <label htmlFor={`q${questionId}_false`}>FALSE</label>
                </li>
                <li className={styles.tfngOption}>
                  <input 
                    type="radio" 
                    id={`q${questionId}_notgiven`} 
                    name={`q${questionId}`} 
                    value="NOT GIVEN"
                    checked={userAnswers[questionId] === 'NOT GIVEN'}
                    onChange={(e) => handleAnswerChange(parseInt(questionId), e.target.value)}
                  />
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
                        checked={userAnswers[questionId] === letter}
                        onChange={(e) => handleAnswerChange(parseInt(questionId), e.target.value)}
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

      case 'flow-chart':
        // Flow chart questions: render image with positioned inputs
        if (!questionData.imageUrl || !Array.isArray(questionData.fields) || !Array.isArray(questionData.subQuestions)) {
          return null;
        }

        // subQuestions holds the actual question numbers for each blank
        const flowQuestionNumbers: number[] = questionData.subQuestions.map((q: string) =>
          parseInt(q, 10)
        );
        
        // Ensure we only show question numbers that match the number of fields
        // This prevents showing "Questions 1-7" when there are only 4 fields
        const fieldsCount = questionData.fields?.length || 0
        const displayQuestionNumbers = flowQuestionNumbers.slice(0, fieldsCount)

        return (
          <div
            key={questionId}
            className={`${styles.question} ${isActive ? styles.activeQuestion : ''}`}
            data-q-start={questionId}
          >
            <div className={styles.questionPrompt}>
              <p>
                <strong>
                  Questions {displayQuestionNumbers[0]}-{displayQuestionNumbers[displayQuestionNumbers.length - 1]}
                </strong>
              </p>
              <p>Complete the flow chart below.</p>
              <p>
                Write <strong>ONE WORD AND/OR A NUMBER</strong> for each answer.
              </p>
            </div>
            <FlowChartImage
              imageUrl={questionData.imageUrl}
              questionNumbers={displayQuestionNumbers}
              fields={questionData.fields || []}
              userAnswers={userAnswers}
              onAnswerChange={handleAnswerChange}
            />
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

  // Effect to initialize test when it starts
  useEffect(() => {
    if (isTestStarted) {
      initializeTest();
    }
  }, [isTestStarted, initializeTest]);

  // Effect to setup bottom navigation when passage changes
  useEffect(() => {
    if (isTestStarted) {
      setupBottomNav();
    }
  }, [currentPassage, isTestStarted, setupBottomNav]);

  // Show fullscreen modal when component mounts
  useEffect(() => {
    if (!isTestStarted && !isLoading) {
      setShowFullscreenModal(true);
    }
  }, [isTestStarted, isLoading]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  // Delete notes via delegation
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      // Check if the target is the delete button or a child of it
      const deleteBtn = target.closest(`.${styles.noteDeleteBtn}`) as HTMLElement | null;
      if (!deleteBtn) return;
      e.stopPropagation();
      const noteItem = deleteBtn.closest(`.${styles.noteItem}`) as HTMLElement | null;
      if (!noteItem) return;
      const noteId = noteItem.dataset.targetId;
      const highlightSpan = noteId ? document.getElementById(noteId) : null;
      if (highlightSpan) {
        const parent = highlightSpan.parentNode as HTMLElement;
        while (highlightSpan.firstChild) parent.insertBefore(highlightSpan.firstChild, highlightSpan);
        parent.removeChild(highlightSpan);
        parent.normalize();
      }
      noteItem.remove();
    };
    const container = notesListRef.current;
    container?.addEventListener('click', handler);
    return () => container?.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!contextMenuRef.current) return;
      if (!(contextMenuRef.current.contains(e.target as Node))) {
        contextMenuRef.current.style.display = 'none';
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <>
      {/* Fullscreen Required Modal */}
      {showFullscreenModal && !isTestStarted && (
        <div className={styles.modalOverlay}>
          <div className={styles.fullscreenModal}>
            <div className={styles.fullscreenModalHeader}>
              <h2 className={styles.fullscreenModalTitle}>Fullscreen Required</h2>
            </div>
            <div className={styles.fullscreenModalBody}>
              <p className={styles.fullscreenModalMessage}>
                This test must be taken in fullscreen mode. Click the button below to continue.
              </p>
              <div className={styles.fullscreenModalButtons}>
                <button 
                  className={styles.fullscreenModalButton}
                  onClick={handleFullscreenRequired}
                >
                  Enter Fullscreen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {!showFullscreenModal && !isTestStarted && isLoading && (
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

      {/* Main Test Interface */}
      {isTestStarted && (
        <div 
          className={`${styles.testContainer} ${styles[`contrast-${contrastTheme}`]} ${styles[`text-size-${textSize}`]}`}
        >
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerLogo}>
                <img 
                  src="https://res.cloudinary.com/dza2t1htw/image/upload/v1763020133/IELTS-logo_d7an4g.png" 
                  alt="IELTS Logo" 
                  className={styles.ieltsLogo} 
                />
              </div>
            </div>
            <div className={styles.headerRight}>
              <button
                className={styles.headerMenuBtn}
                onClick={() => setShowOptionsModal(true)}
                title="Menu"
              >
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              </button>
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
                className={`${styles.headerNotesToggleBtn} ${notesOpen ? styles.activeIcon : ''}`}
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
          {/* {testData.passages.map((passage, index) => (
            <div
              key={passage.id}
              id={`part-header-${passage.id}`}
              className={`${styles.partHeader} ${currentPassage === passage.id ? '' : styles.hidden}`}
            >
              <p><strong>Part {passage.id}</strong></p>
              <p>{passage.title}</p>
          </div>
          ))} */}

          {/* Main Container */}
          <div className={styles.mainContainer}>
            <div className={styles.panelsContainer}>
              {/* Passage Panel */}
              <div ref={passagePanelRef} id="passage-panel" className={styles.passagePanel} onContextMenu={onContextMenu}>
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
              <div ref={questionsPanelRef} id="questions-panel" className={styles.questionsPanel} onContextMenu={onContextMenu}>
                {/* Questions content will be added here */}
                {testData.passages.map((passage, passageIndex) => {
                  const passageId = passageIndex + 1;
                  const passageQuestions = Object.entries(testData.questions)
                    .filter(([, questionData]: [string, any]) => questionData.passageId === passageId)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b)); // Sort by question number

                  if (passageQuestions.length === 0) return null;

                  return (
                    <div
                      key={passageId}
                      id={`questions-${passageId}`}
                      className={`${styles.questionSet} ${currentPassage === passageId ? '' : styles.hidden}`}
                    >
                  <div className={styles.questionsContainer}>
                        {(() => {
                          const renderedQuestions: React.ReactNode[] = [];
                          let i = 0;
                          
                          while (i < passageQuestions.length) {
                            const [questionId, questionData] = passageQuestions[i];
                            
                            // Check if this is a matching-headings question
                            if (questionData.type === 'matching-headings') {
                              // Group consecutive matching-headings questions
                              const group: Array<[string, any]> = [];
                              let j = i;
                              
                              while (j < passageQuestions.length && passageQuestions[j][1].type === 'matching-headings') {
                                group.push(passageQuestions[j]);
                                j++;
                              }
                              
                              // Render the grouped matching-headings questions
                              renderedQuestions.push(renderMatchingHeadingsGroup(group, currentQuestion));
                              
                              // Skip the grouped questions
                              i = j;
                            } else if (questionData.type === 'matching-information') {
                              // Group consecutive matching-information questions
                              const group: Array<[string, any]> = [];
                              let j = i;
                              
                              while (j < passageQuestions.length && passageQuestions[j][1].type === 'matching-information') {
                                group.push(passageQuestions[j]);
                                j++;
                              }
                              
                              // Render the grouped matching-information questions
                              const renderedGroup = renderMatchingInformationGroup(group, currentQuestion);
                              if (renderedGroup) {
                                renderedQuestions.push(renderedGroup);
                              }
                              
                              // Skip the grouped questions
                              i = j;
                            } else {
                              // Render other question types normally
                              renderedQuestions.push(renderQuestion(questionId, questionData, currentQuestion, false));
                              i++;
                            }
                          }
                          
                          return renderedQuestions;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes Panel */}
              <div className={`${styles.notesPanelContainer} ${notesOpen ? styles.visible : ''}`}>
                <div className={styles.notesPanel}>
                  <div className={styles.notesHeader}>
                    <h4>My Notes</h4>
                  </div>
                  <div ref={notesListRef} id="notes-list">
                    {/* Notes are added via DOM manipulation */}
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
            <button ref={deliverButtonRef} className={styles.footerDeliverButton} onClick={() => setShowSubmitModal(true)}>
              Exit
            </button>
          </nav>

          {/* Context Menu */}
          <div ref={contextMenuRef} className={styles.contextMenu} style={{ display: 'none' }}>
            <button id="highlight-btn" onClick={onHighlightClick}>Highlight</button>
            <button id="note-btn" onClick={onNoteClick}>Note</button>
          </div>

          {/* Note Modal */}
          {noteModalOpen && (
            <div id="note-modal" className={styles.noteModal}>
              <h4>Add a Note</h4>
              <p>Selected Text:</p>
              <blockquote>{selectedQuote}</blockquote>
              <textarea 
                id="note-textarea" 
                className={styles.noteTextarea}
                placeholder="Type your note here..." 
                spellCheck={false} 
                autoComplete="off" 
                value={noteText} 
                onChange={(e) => setNoteText(e.target.value)} 
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button id="save-note-btn" onClick={onSaveNote}>Save Note</button>
                <button id="cancel-note-btn" onClick={() => { setNoteText(''); setSelectedQuote(''); setNoteModalOpen(false); clearSelection(); }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Options Modal */}
          {showOptionsModal && (
            <div 
              className={styles.modalOverlay}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowOptionsModal(false);
                }
              }}
            >
              <div ref={optionsModalRef} className={styles.optionsModal}>
                <h2 className={styles.optionsModalTitle}>Options</h2>
                {!showContrastPanel && !showTextSizePanel && !showInstructionsPanel ? (
                  <div className={styles.optionsMenuList}>
                    <div 
                      className={styles.optionsMenuItem}
                      onClick={() => setShowContrastPanel(true)}
                    >
                      <div className={styles.optionsMenuItemLeft}>
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
                    <div className={styles.optionsMenuDivider}></div>
                    <div 
                      className={styles.optionsMenuItem}
                      onClick={() => setShowTextSizePanel(true)}
                    >
                      <div className={styles.optionsMenuItemLeft}>
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
                    <div className={styles.optionsMenuDivider}></div>
                    <div 
                      className={styles.optionsMenuItem}
                      onClick={() => setShowInstructionsPanel(true)}
                    >
                      <div className={styles.optionsMenuItemLeft}>
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
                  <div className={styles.contrastPanel}>
                    <div className={styles.contrastPanelHeader}>
                      <button 
                        className={styles.contrastBackButton}
                        onClick={() => setShowContrastPanel(false)}
                      >
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                        </svg>
                      </button>
                      <h3 className={styles.contrastPanelTitle}>Contrast</h3>
                    </div>
                    <div className={styles.contrastOptionsList}>
                      <div 
                        className={styles.contrastOption}
                        onClick={() => setContrastTheme('black-on-white')}
                      >
                        <div className={styles.contrastCheckmarkContainer}>
                          {contrastTheme === 'black-on-white' && (
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                        </div>
                        <span>Black on white</span>
                      </div>
                      <div className={styles.contrastOptionDivider}></div>
                      <div 
                        className={styles.contrastOption}
                        onClick={() => setContrastTheme('white-on-black')}
                      >
                        <div className={styles.contrastCheckmarkContainer}>
                          {contrastTheme === 'white-on-black' && (
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                        </div>
                        <span>White on black</span>
                      </div>
                      <div className={styles.contrastOptionDivider}></div>
                      <div 
                        className={styles.contrastOption}
                        onClick={() => setContrastTheme('yellow-on-black')}
                      >
                        <div className={styles.contrastCheckmarkContainer}>
                          {contrastTheme === 'yellow-on-black' && (
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                        </div>
                        <span>Yellow on black</span>
                      </div>
                    </div>
                  </div>
                ) : showTextSizePanel ? (
                  <div className={styles.contrastPanel}>
                    <div className={styles.contrastPanelHeader}>
                      <button 
                        className={styles.contrastBackButton}
                        onClick={() => setShowTextSizePanel(false)}
                      >
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                        </svg>
                      </button>
                      <h3 className={styles.contrastPanelTitle}>Text size</h3>
                    </div>
                    <div className={styles.contrastOptionsList}>
                      <div 
                        className={styles.contrastOption}
                        onClick={() => setTextSize('regular')}
                      >
                        <div className={styles.contrastCheckmarkContainer}>
                          {textSize === 'regular' && (
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                        </div>
                        <span>Regular</span>
                      </div>
                      <div className={styles.contrastOptionDivider}></div>
                      <div 
                        className={styles.contrastOption}
                        onClick={() => setTextSize('large')}
                      >
                        <div className={styles.contrastCheckmarkContainer}>
                          {textSize === 'large' && (
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                        </div>
                        <span>Large</span>
                      </div>
                      <div className={styles.contrastOptionDivider}></div>
                      <div 
                        className={styles.contrastOption}
                        onClick={() => setTextSize('extra-large')}
                      >
                        <div className={styles.contrastCheckmarkContainer}>
                          {textSize === 'extra-large' && (
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className={styles.contrastCheckmark}>
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          )}
                        </div>
                        <span>Extra Large</span>
                      </div>
                    </div>
                  </div>
                ) : showInstructionsPanel ? (
                  <div className={styles.contrastPanel}>
                    <div className={styles.contrastPanelHeader}>
                      <button 
                        className={styles.contrastBackButton}
                        onClick={() => setShowInstructionsPanel(false)}
                      >
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                        </svg>
                      </button>
                      <h3 className={styles.contrastPanelTitle}>Test Instructions</h3>
                    </div>
                    <div className={styles.instructionsContent}>
                      <div className={styles.instructionsSection}>
                        <h4 className={styles.instructionsSectionTitle}>General Instructions</h4>
                        <ul className={styles.instructionsList}>
                          <li>You have 60 minutes to complete the Reading test.</li>
                          <li>The test consists of 3 passages with 40 questions in total.</li>
                          <li>Read each passage carefully and answer all questions.</li>
                          <li>You can navigate between questions using the navigation arrows or the question numbers at the bottom.</li>
                        </ul>
                      </div>
                      <div className={styles.instructionsSection}>
                        <h4 className={styles.instructionsSectionTitle}>Question Types</h4>
                        <ul className={styles.instructionsList}>
                          <li><strong>Multiple Choice:</strong> Choose the best answer from the options provided.</li>
                          <li><strong>True/False/Not Given:</strong> Determine if statements are true, false, or not given based on the passage.</li>
                          <li><strong>Yes/No/Not Given:</strong> Determine if statements agree, disagree, or are not mentioned in the passage.</li>
                          <li><strong>Matching Headings:</strong> Match headings to paragraphs or sections.</li>
                          <li><strong>Summary Completion:</strong> Fill in the blanks in a summary using words from the passage.</li>
                        </ul>
                      </div>
                      <div className={styles.instructionsSection}>
                        <h4 className={styles.instructionsSectionTitle}>Tips</h4>
                        <ul className={styles.instructionsList}>
                          <li>Use the highlight feature to mark important information in the passage.</li>
                          <li>You can add notes to help you remember key points.</li>
                          <li>Manage your time wisely - spend about 20 minutes per passage.</li>
                          <li>Review your answers before submitting the test.</li>
                          <li>You can change your answers at any time before submitting.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Submit Confirmation Drawer */}
          {showSubmitModal && (
            <>
              <div className={styles.drawerOverlay} onClick={() => setShowSubmitModal(false)}></div>
              <div className={styles.submitDrawer}>
                <div className={styles.submitDrawerContent}>
                  <span className={styles.submitModalText}>Click next to continue</span>
                  <button 
                    className={styles.submitModalNextButton}
                    onClick={() => {
                      setShowSubmitModal(false);
                      setShowSubmittingModal(true);
                      // Wait a moment to show the submitting message, then check answers
                      setTimeout(() => {
                        checkAnswers();
                        setShowSubmittingModal(false);
                      }, 1500);
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
            <div className={styles.fullScreenModal}>
              <div className={styles.submittingModalContent}>
                <div className={styles.submittingSpinner}></div>
                <p className={styles.submittingText}>Submitting your answers</p>
              </div>
            </div>
          )}

          {/* Timer End Modal */}
          {showTimerEndModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.timerEndModal}>
                <div className={styles.timerEndModalHeader}>
                  <h2 className={styles.timerEndModalTitle}>Alert!</h2>
                </div>
                <div className={styles.timerEndModalBody}>
                  <p className={styles.timerEndModalMessage}>
                    This is the end of the IELTS Reading Test. Thank You!
                  </p>
                  <button 
                    className={styles.timerEndModalButton}
                    onClick={() => {
                      setShowTimerEndModal(false);
                      checkAnswers();
                    }}
                  >
                    End Exam
                  </button>
                </div>
              </div>
            </div>
          )}

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

export default ReadingTestComponent;

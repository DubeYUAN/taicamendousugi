import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Volume2,
  Sparkles,
  RotateCw,
  ArrowRight,
  Check,
  X,
  HelpCircle,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  BookOpen,
  Keyboard,
  Headphones,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Deck,
  Flashcard,
  QuizConfig,
  QuizMode,
  QuizQuestion,
  QuizSource,
  QuestionResult,
  SRSRating,
} from '../types';
import { speak } from '../utils/speech';
import { isDue } from '../utils/srs';

interface QuizViewProps {
  cards: Flashcard[];
  decks: Deck[];
  initialSource?: QuizSource;
  initialDeckId?: string;
  onRecordAnswer: (
    cardId: string,
    wasCorrect: boolean,
    mode: string,
    userAnswer?: string,
    rating?: SRSRating
  ) => void;
  onExitQuiz: () => void;
  onGoToMistakes: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  cards,
  decks,
  initialSource = 'all',
  initialDeckId,
  onRecordAnswer,
  onExitQuiz,
  onGoToMistakes,
}) => {
  // Quiz setup states
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  const [mode, setMode] = useState<QuizMode>('multiple-choice');
  const [source, setSource] = useState<QuizSource>(initialSource);
  const [deckId, setDeckId] = useState<string>(initialDeckId || decks[0]?.id || '');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [slowAudio, setSlowAudio] = useState<boolean>(false);

  // In-quiz states
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typingInput, setTypingInput] = useState('');
  const [revealedHintLetters, setRevealedHintLetters] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [quizResults, setQuizResults] = useState<QuestionResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Precomputed pools
  const dueCards = useMemo(() => cards.filter((c) => isDue(c.srs.dueDate)), [cards]);
  const mistakeCards = useMemo(
    () => cards.filter((c) => c.mistakes.isMistakeMarked || c.mistakes.wrongCount > 0),
    [cards]
  );

  // Sound playback helper
  const playCurrentQuestionAudio = useCallback(
    async (text?: string, lang?: string) => {
      const q = questions[currentIndex];
      if (!q && !text) return;
      const targetText = text || q.audioText;
      const targetLang = lang || q.audioLang;

      setIsPlayingAudio(true);
      await speak(targetText, targetLang, slowAudio ? 0.75 : 1.0);
      setTimeout(() => setIsPlayingAudio(false), 600);
    },
    [questions, currentIndex, slowAudio]
  );

  // Generate question list
  const startQuiz = (overrideSource?: QuizSource, specificCards?: Flashcard[]) => {
    const activeSource = overrideSource || source;
    let pool: Flashcard[] = [];

    if (specificCards && specificCards.length > 0) {
      pool = specificCards;
    } else if (activeSource === 'mistakes') {
      pool = mistakeCards;
    } else if (activeSource === 'due') {
      pool = dueCards;
    } else if (activeSource === 'deck') {
      pool = cards.filter((c) => c.deckId === deckId);
    } else {
      pool = cards;
    }

    if (pool.length === 0) {
      return;
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = questionCount === -1 ? shuffled : shuffled.slice(0, questionCount);

    const generatedQuestions: QuizQuestion[] = selected.map((card, idx) => {
      // Direction: In listening mode, question is audio, answer is definition
      const isListening = mode === 'listening';
      const direction: 'term-to-def' | 'def-to-term' = isListening ? 'term-to-def' : 'term-to-def';

      const questionText = isListening
        ? '請仔細聆聽發音，選出正確的中文釋義：'
        : card.term;
      const answerText = card.definition;

      // Generate 3 distractors from other cards
      const otherCards = cards.filter((c) => c.id !== card.id);
      const shuffledOthers = [...otherCards].sort(() => Math.random() - 0.5);
      const distractors = shuffledOthers.slice(0, 3).map((c) => c.definition);

      const options = [answerText, ...distractors].sort(() => Math.random() - 0.5);

      return {
        id: `q-${idx}-${card.id}`,
        card,
        direction,
        questionText,
        answerText,
        options,
        audioText: card.term,
        audioLang: card.lang,
      };
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setTypingInput('');
    setRevealedHintLetters(0);
    setIsCardFlipped(false);
    setHasAnsweredCurrent(false);
    setQuizResults([]);
    setStreak(0);
    setIsQuizActive(true);
    setIsQuizCompleted(false);

    // Auto play audio for 1st question if enabled
    if (autoPlayAudio && generatedQuestions[0]) {
      setTimeout(() => {
        speak(
          generatedQuestions[0].audioText,
          generatedQuestions[0].audioLang,
          slowAudio ? 0.75 : 1.0
        );
      }, 300);
    }
  };

  // Trigger audio on question index change
  useEffect(() => {
    if (isQuizActive && !isQuizCompleted && questions[currentIndex]) {
      setSelectedOption(null);
      setTypingInput('');
      setRevealedHintLetters(0);
      setIsCardFlipped(false);
      setHasAnsweredCurrent(false);

      if (autoPlayAudio || mode === 'listening') {
        const timer = setTimeout(() => {
          playCurrentQuestionAudio();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, isQuizActive, isQuizCompleted]);

  // Handle Option Selection (Multiple Choice / Listening)
  const handleSelectOption = (option: string) => {
    if (hasAnsweredCurrent) return;

    const currentQ = questions[currentIndex];
    setSelectedOption(option);
    setHasAnsweredCurrent(true);

    const isCorrect = option === currentQ.answerText;
    setIsCurrentCorrect(isCorrect);
    setStreak((prev) => (isCorrect ? prev + 1 : 0));

    // Record in storage
    onRecordAnswer(currentQ.card.id, isCorrect, mode, option);

    setQuizResults((prev) => [
      ...prev,
      {
        question: currentQ,
        userAnswer: option,
        isCorrect,
        timestamp: Date.now(),
      },
    ]);
  };

  // Handle Typing Submission
  const handleCheckTyping = () => {
    if (hasAnsweredCurrent) return;
    if (!typingInput.trim()) return;

    const currentQ = questions[currentIndex];
    setHasAnsweredCurrent(true);

    // Case-insensitive & trimmed comparison
    const target = currentQ.card.term.toLowerCase().trim();
    const input = typingInput.toLowerCase().trim();
    const isCorrect = input === target;

    setIsCurrentCorrect(isCorrect);
    setStreak((prev) => (isCorrect ? prev + 1 : 0));

    onRecordAnswer(currentQ.card.id, isCorrect, 'spelling', typingInput);

    setQuizResults((prev) => [
      ...prev,
      {
        question: currentQ,
        userAnswer: typingInput.trim(),
        isCorrect,
        timestamp: Date.now(),
      },
    ]);
  };

  // Handle Flashcard Self-Rating (SM-2: again, hard, good, easy)
  const handleRateFlashcard = (rating: SRSRating) => {
    const currentQ = questions[currentIndex];
    const isCorrect = rating !== 'again';

    setStreak((prev) => (isCorrect ? prev + 1 : 0));

    onRecordAnswer(currentQ.card.id, isCorrect, 'flashcard', rating, rating);

    setQuizResults((prev) => [
      ...prev,
      {
        question: currentQ,
        userAnswer: rating,
        isCorrect,
        rating,
        timestamp: Date.now(),
      },
    ]);

    handleNextQuestion();
  };

  // Next Question or Complete
  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsQuizCompleted(true);
    // Calculate final accuracy
    const correctCount = quizResults.filter((r) => r.isCorrect).length;
    const total = quizResults.length || 1;
    const ratio = correctCount / total;

    if (ratio >= 0.7) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  };

  // Progressive letter hint for typing mode
  const handleRevealHint = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const term = currentQ.card.term;
    if (revealedHintLetters < term.length) {
      setRevealedHintLetters((prev) => prev + 1);
      setTypingInput(term.slice(0, revealedHintLetters + 1));
    }
  };

  // Retest only missed questions
  const handleRetestMistakes = () => {
    const missed = quizResults.filter((r) => !r.isCorrect).map((r) => r.question.card);
    if (missed.length > 0) {
      startQuiz('mistakes', missed);
    }
  };

  // Global Keyboard shortcuts during quiz
  useEffect(() => {
    if (!isQuizActive || isQuizCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in the input box
      if (mode === 'spelling' && document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!hasAnsweredCurrent) {
            handleCheckTyping();
          } else {
            handleNextQuestion();
          }
        }
        return;
      }

      if (e.key === ' ' && !hasAnsweredCurrent) {
        e.preventDefault();
        if (mode === 'flashcard') {
          setIsCardFlipped((prev) => !prev);
        } else {
          playCurrentQuestionAudio();
        }
        return;
      }

      if (e.key === 'Enter' && hasAnsweredCurrent) {
        e.preventDefault();
        handleNextQuestion();
        return;
      }

      // Numbers 1-4 for options
      if ((mode === 'multiple-choice' || mode === 'listening') && !hasAnsweredCurrent) {
        const currentQ = questions[currentIndex];
        if (!currentQ || !currentQ.options) return;
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= currentQ.options.length) {
          e.preventDefault();
          handleSelectOption(currentQ.options[num - 1]);
        }
      }

      // Numbers 1-4 for Flashcard ratings
      if (mode === 'flashcard' && isCardFlipped) {
        if (e.key === '1') handleRateFlashcard('again');
        if (e.key === '2') handleRateFlashcard('hard');
        if (e.key === '3') handleRateFlashcard('good');
        if (e.key === '4') handleRateFlashcard('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isQuizActive,
    isQuizCompleted,
    mode,
    hasAnsweredCurrent,
    currentIndex,
    questions,
    isCardFlipped,
    typingInput,
  ]);

  // -------------------------------------------------------------
  // VIEW 1: QUIZ LAUNCH & CONFIGURATION SCREEN
  // -------------------------------------------------------------
  if (!isQuizActive) {
    const selectedPoolSize =
      source === 'mistakes'
        ? mistakeCards.length
        : source === 'due'
        ? dueCards.length
        : source === 'deck'
        ? cards.filter((c) => c.deckId === deckId).length
        : cards.length;

    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            單字出題測驗與間隔複習
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            支援多種語言自動語音朗讀、智慧選擇題、拼寫記憶、翻卡自評與專屬錯題加強。
          </p>
        </div>

        {/* Source Selection - Highlight Mistake Option */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            出題題目來源
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Option 1: Mistake Notebook (User requirement) */}
            <button
              onClick={() => setSource('mistakes')}
              className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                source === 'mistakes'
                  ? 'border-rose-500 bg-rose-50/70 dark:border-rose-500/80 dark:bg-rose-950/30 ring-1 ring-rose-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <AlertTriangle
                  className={`h-5 w-5 ${
                    source === 'mistakes' ? 'text-rose-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  {mistakeCards.length} 題
                </span>
              </div>
              <span className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                專練錯題本
              </span>
              <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                專注攻克過去曾答錯或標記的生詞
              </span>
            </button>

            {/* Option 2: Due Today (SRS) */}
            <button
              onClick={() => setSource('due')}
              className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                source === 'due'
                  ? 'border-amber-500 bg-amber-50/70 dark:border-amber-500/80 dark:bg-amber-950/30 ring-1 ring-amber-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <Clock
                  className={`h-5 w-5 ${
                    source === 'due' ? 'text-amber-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {dueCards.length} 題
                </span>
              </div>
              <span className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                今日到期複習
              </span>
              <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                基於 SM-2 間隔演算法推薦複習
              </span>
            </button>

            {/* Option 3: All cards */}
            <button
              onClick={() => setSource('all')}
              className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                source === 'all'
                  ? 'border-indigo-500 bg-indigo-50/70 dark:border-indigo-500/80 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <BookOpen
                  className={`h-5 w-5 ${
                    source === 'all' ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {cards.length} 題
                </span>
              </div>
              <span className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                全部單字庫
              </span>
              <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                包含所有卡組與所有進度單字
              </span>
            </button>

            {/* Option 4: By Deck */}
            <button
              onClick={() => setSource('deck')}
              className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                source === 'deck'
                  ? 'border-indigo-500 bg-indigo-50/70 dark:border-indigo-500/80 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <Sparkles
                  className={`h-5 w-5 ${
                    source === 'deck' ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  指定分類
                </span>
              </div>
              <span className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                指定單一卡組
              </span>
              <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                針對特定語言或主題集中測驗
              </span>
            </button>
          </div>

          {source === 'deck' && (
            <div className="pt-2">
              <select
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name} ({cards.filter((c) => c.deckId === deck.id).length} 個單字)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quiz Mode Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            出題測驗模式
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Multiple Choice */}
            <button
              onClick={() => setMode('multiple-choice')}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'multiple-choice'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                四選一選擇題
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                出單字並選出正確釋義，快速檢視記憶熟悉度
              </p>
            </button>

            {/* Spelling & Typing */}
            <button
              onClick={() => setMode('spelling')}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'spelling'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                拼寫鍵入測驗
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                看釋義或聽發音輸入完整單字，支援漸進提示
              </p>
            </button>

            {/* Flashcard SRS */}
            <button
              onClick={() => setMode('flashcard')}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'flashcard'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                翻卡間隔複習 (SRS)
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                經典翻卡機制，透過四級自評調適複習週期
              </p>
            </button>

            {/* Listening */}
            <button
              onClick={() => setMode('listening')}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'listening'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Headphones className="h-4 w-4 text-indigo-600" />
                <span>純聽力挑戰</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                先聽原生語音發音，再辨識正確意思，強化聽感
              </p>
            </button>
          </div>
        </div>

        {/* Options & Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              出題題數
            </label>
            <div className="flex items-center gap-2">
              {[5, 10, 20, -1].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setQuestionCount(cnt)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    questionCount === cnt
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {cnt === -1 ? '全部' : `${cnt} 題`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              語音與發音偏好
            </label>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={autoPlayAudio}
                  onChange={(e) => setAutoPlayAudio(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>切換題目時自動朗讀發音</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={slowAudio}
                  onChange={(e) => setSlowAudio(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>0.75x 慢速發音</span>
              </label>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            目前篩選條件共可出 <span className="font-bold text-slate-900 dark:text-white tabular-nums">{selectedPoolSize}</span> 題
          </div>

          <button
            onClick={() => startQuiz()}
            disabled={selectedPoolSize === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Play className="h-4 w-4" />
            <span>開始測驗</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: QUIZ COMPLETED / RESULTS SUMMARY SCREEN
  // -------------------------------------------------------------
  if (isQuizCompleted) {
    const total = quizResults.length;
    const correctCount = quizResults.filter((r) => r.isCorrect).length;
    const wrongCount = total - correctCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const missedQuestions = quizResults.filter((r) => !r.isCorrect);

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Score Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-indigo-50 dark:bg-indigo-950/60 mb-4">
            <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {accuracy}%
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {accuracy >= 80 ? '太棒了！測驗順利完成 🎉' : accuracy >= 50 ? '表現不錯，再接再厲！💪' : '已將錯題存入錯題本，隨時可複習 ✍️'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            已自動更新卡片的間隔複習進度（SM-2）與錯題記錄
          </p>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">總測驗題數</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{total}</div>
            </div>
            <div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">答對題數</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{correctCount}</div>
            </div>
            <div>
              <div className="text-xs text-rose-600 dark:text-rose-400">需加強錯題</div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">{wrongCount}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {wrongCount > 0 && (
              <button
                onClick={handleRetestMistakes}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>立即重測本次錯題 ({wrongCount})</span>
              </button>
            )}

            <button
              onClick={() => startQuiz()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <RotateCw className="h-4 w-4" />
              <span>重新進行完整測驗</span>
            </button>

            <button
              onClick={onGoToMistakes}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span>前往錯題本查看</span>
            </button>
          </div>
        </div>

        {/* Missed questions breakdown */}
        {missedQuestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span>本次需要加強的單字</span>
            </h4>
            <div className="space-y-2">
              {missedQuestions.map((res, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-xs dark:border-slate-800 dark:bg-slate-900 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {res.question.card.term}
                      </span>
                      {res.question.card.phonetic && (
                        <span className="font-mono text-slate-400">
                          {res.question.card.phonetic}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">
                      正確釋義：{res.question.card.definition}
                    </p>
                    {res.userAnswer && res.userAnswer !== 'again' && (
                      <p className="text-rose-500">
                        你的回答：{res.userAnswer}
                      </p>
                    )}
                    {res.question.card.example && (
                      <p className="text-slate-500 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                        "{res.question.card.example}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => speak(res.question.card.term, res.question.card.lang)}
                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
                    title="重聽發音"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ACTIVE IN-QUIZ STAGE
  // -------------------------------------------------------------
  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Top Header: Progress, Streak, Exit button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => {
            if (confirm('確定要結束目前的測驗嗎？已記錄的進度會保留。')) {
              setIsQuizActive(false);
            }
          }}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          ✕ 結束測驗
        </button>

        {/* Progress bar */}
        <div className="flex-1 max-w-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span className="tabular-nums">
              第 {currentIndex + 1} / {questions.length} 題
            </span>
            <span className="tabular-nums">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Streak indicator */}
        <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <span>🔥</span>
          <span className="tabular-nums">{streak}</span>
        </div>
      </div>

      {/* Main Question Card Stage */}
      <div className="relative rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {/* Mode & Audio Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {mode === 'multiple-choice'
                ? '四選一選擇題'
                : mode === 'spelling'
                ? '拼寫記憶'
                : mode === 'listening'
                ? '聽力辨析'
                : '翻卡自評'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{currentQ.audioLang}</span>
          </div>

          {/* Sound Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => playCurrentQuestionAudio()}
              disabled={isPlayingAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900 transition-colors text-xs font-medium"
            >
              <Volume2 className={`h-4 w-4 ${isPlayingAudio ? 'animate-pulse text-indigo-700' : ''}`} />
              <span>播放發音</span>
            </button>

            <button
              onClick={() => setSlowAudio(!slowAudio)}
              className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                slowAudio
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              0.75x
            </button>
          </div>
        </div>

        {/* Question Center Display */}
        <div className="py-8 text-center">
          {mode === 'listening' && !hasAnsweredCurrent ? (
            /* Listening Hidden Mode */
            <div className="space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Headphones className="h-8 w-8 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                請聽取上方語音發音，選出對應的中文釋義
              </p>
            </div>
          ) : mode === 'spelling' ? (
            /* Spelling Prompt */
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {currentQ.card.definition}
              </h3>
              {currentQ.card.partOfSpeech && (
                <span className="text-xs italic text-indigo-600 dark:text-indigo-400 font-serif">
                  ({currentQ.card.partOfSpeech})
                </span>
              )}
              {currentQ.card.exampleTranslation && (
                <p className="text-xs text-slate-500 italic max-w-md mx-auto pt-1">
                  例句意："{currentQ.card.exampleTranslation}"
                </p>
              )}
            </div>
          ) : (
            /* Standard Display */
            <div className="space-y-2">
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {currentQ.card.term}
              </h3>
              {currentQ.card.phonetic && (
                <p className="text-sm font-mono text-slate-400">
                  {currentQ.card.phonetic}
                </p>
              )}
              {currentQ.card.partOfSpeech && (
                <span className="inline-block text-xs italic text-indigo-600 dark:text-indigo-400 font-serif">
                  {currentQ.card.partOfSpeech}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* INTERACTION SECTION BASED ON QUIZ MODE */}
        {/* ------------------------------------------------------------- */}

        {/* Mode A: Multiple Choice or Listening Mode */}
        {(mode === 'multiple-choice' || mode === 'listening') && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2.5">
              {currentQ.options?.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrectOption = option === currentQ.answerText;

                let btnStyle =
                  'border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-slate-700';

                if (hasAnsweredCurrent) {
                  if (isCorrectOption) {
                    btnStyle =
                      'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                  } else if (isSelected && !isCorrectOption) {
                    btnStyle =
                      'border-rose-500 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-200 ring-1 ring-rose-500';
                  } else {
                    btnStyle = 'opacity-50 border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnsweredCurrent}
                    onClick={() => handleSelectOption(option)}
                    className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium">{option}</span>
                    </div>

                    {hasAnsweredCurrent && (
                      <div>
                        {isCorrectOption ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : isSelected ? (
                          <XCircle className="h-5 w-5 text-rose-600" />
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode B: Spelling & Typing Mode */}
        {mode === 'spelling' && (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={typingInput}
                onChange={(e) => setTypingInput(e.target.value)}
                disabled={hasAnsweredCurrent}
                placeholder="在此輸入正確的單字拼寫..."
                autoFocus
                className={`w-full rounded-xl border px-4 py-3 text-center text-lg font-bold outline-none transition-all ${
                  hasAnsweredCurrent
                    ? isCurrentCorrect
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                    : 'border-slate-300 bg-slate-50 focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900'
                }`}
              />

              {!hasAnsweredCurrent && (
                <button
                  type="button"
                  onClick={handleRevealHint}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  提示首字
                </button>
              )}
            </div>

            {!hasAnsweredCurrent ? (
              <button
                onClick={handleCheckTyping}
                disabled={!typingInput.trim()}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40 transition-colors"
              >
                檢查答案 (Enter)
              </button>
            ) : null}
          </div>
        )}

        {/* Mode C: Flashcard & SRS Mode */}
        {mode === 'flashcard' && (
          <div className="space-y-4">
            {!isCardFlipped ? (
              <button
                onClick={() => setIsCardFlipped(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
              >
                <RotateCw className="h-4 w-4" />
                <span>翻轉卡片查看釋義 (按空白鍵 Space)</span>
              </button>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800 text-center space-y-1">
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {currentQ.card.definition}
                  </div>
                  {currentQ.card.example && (
                    <p className="text-xs text-slate-500 italic">
                      "{currentQ.card.example}"
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                    自評記憶程度（按 1-4 鍵快速評判）：
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleRateFlashcard('again')}
                      className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 font-bold text-xs text-center"
                    >
                      <div>1. 重來 (Again)</div>
                      <div className="text-[10px] font-normal opacity-80 mt-0.5">忘記了 · 立即重學</div>
                    </button>
                    <button
                      onClick={() => handleRateFlashcard('hard')}
                      className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-xs text-center"
                    >
                      <div>2. 困難 (Hard)</div>
                      <div className="text-[10px] font-normal opacity-80 mt-0.5">想了很久</div>
                    </button>
                    <button
                      onClick={() => handleRateFlashcard('good')}
                      className="p-3 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold text-xs text-center"
                    >
                      <div>3. 良好 (Good)</div>
                      <div className="text-[10px] font-normal opacity-80 mt-0.5">正常記住</div>
                    </button>
                    <button
                      onClick={() => handleRateFlashcard('easy')}
                      className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs text-center"
                    >
                      <div>4. 簡單 (Easy)</div>
                      <div className="text-[10px] font-normal opacity-80 mt-0.5">完全熟練</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback & Next Button (For Multiple Choice, Spelling, Listening) */}
        {hasAnsweredCurrent && mode !== 'flashcard' && (
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800 space-y-4 animate-fadeIn">
            <div
              className={`rounded-xl p-4 text-xs ${
                isCurrentCorrect
                  ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-sm">
                {isCurrentCorrect ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>回答正確！</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-rose-600" />
                    <span>答錯了，已自動加入錯題本！</span>
                  </>
                )}
              </div>

              <div className="mt-2 space-y-1">
                <div>
                  <span className="font-semibold">單字：</span>
                  <span className="font-bold">{currentQ.card.term}</span>
                  {currentQ.card.phonetic && ` (${currentQ.card.phonetic})`}
                </div>
                <div>
                  <span className="font-semibold">正確釋義：</span>
                  <span>{currentQ.card.definition}</span>
                </div>
                {currentQ.card.example && (
                  <div className="italic text-slate-600 dark:text-slate-300 pt-1">
                    例句："{currentQ.card.example}"
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleNextQuestion}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
            >
              <span>{currentIndex + 1 < questions.length ? '下一題 (Enter)' : '檢視測驗結果'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Bar */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <Keyboard className="h-3 w-3" /> 鍵盤支援：
        </span>
        <span>[1-4] 選項/評級</span>
        <span>·</span>
        <span>[Space] 發音/翻卡</span>
        <span>·</span>
        <span>[Enter] 提問/下題</span>
      </div>
    </div>
  );
};

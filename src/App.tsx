import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Deck, Flashcard, SRSRating, QuizSource } from './types';
import {
  getStoredCards,
  getStoredDecks,
  saveCards,
  saveDecks,
  createNewCard,
  recordQuizAnswer,
  toggleCardMistakeMark,
  clearResolvedMistakes,
} from './utils/storage';
import { isDue } from './utils/srs';
import { Header } from './components/Header';
import { CardList } from './components/CardList';
import { QuizView } from './components/QuizView';
import { MistakeNotebook } from './components/MistakeNotebook';
import { StatsView } from './components/StatsView';
import { CardFormModal } from './components/CardFormModal';
import { DeckManagerModal } from './components/DeckManagerModal';
import { ImportExportModal } from './components/ImportExportModal';

export default function App() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeTab, setActiveTab] = useState<'cards' | 'quiz' | 'mistakes' | 'stats'>('cards');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Modals state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [targetDeckIdForCard, setTargetDeckIdForCard] = useState<string | undefined>(undefined);

  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Active quiz config shortcuts
  const [quizInitialSource, setQuizInitialSource] = useState<QuizSource>('all');
  const [quizInitialDeckId, setQuizInitialDeckId] = useState<string | undefined>(undefined);

  // Initialize storage & theme
  useEffect(() => {
    const loadedCards = getStoredCards();
    const loadedDecks = getStoredDecks();
    setCards(loadedCards);
    setDecks(loadedDecks);

    const savedTheme = localStorage.getItem('linguadeck_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('linguadeck_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('linguadeck_theme', 'light');
    }
  };

  // Card Operations
  const handleSaveCard = (cardData: Partial<Flashcard>) => {
    if (editingCard) {
      // Update existing
      const updated = cards.map((c) =>
        c.id === editingCard.id
          ? {
              ...c,
              ...cardData,
              updatedAt: Date.now(),
            }
          : c
      );
      setCards(updated);
      saveCards(updated);
    } else {
      // Create new
      const newCard = createNewCard(cardData);
      const updated = [newCard, ...cards];
      setCards(updated);
      saveCards(updated);
    }
    setEditingCard(null);
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm('確定要刪除這張單字卡嗎？此操作無法撤銷。')) {
      const updated = cards.filter((c) => c.id !== cardId);
      setCards(updated);
      saveCards(updated);
    }
  };

  const handleToggleMistake = (cardId: string) => {
    const updated = toggleCardMistakeMark(cardId);
    setCards(updated);
  };

  const handleClearAllMistakes = () => {
    const updated = clearResolvedMistakes();
    setCards(updated);
  };

  // Deck Operations
  const handleSaveDeck = (deckData: Partial<Deck>) => {
    if (deckData.id) {
      const updated = decks.map((d) => (d.id === deckData.id ? { ...d, ...deckData } : d));
      setDecks(updated);
      saveDecks(updated);
    } else {
      const newDeck: Deck = {
        id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: deckData.name || '未命名卡組',
        description: deckData.description || '',
        defaultLang: deckData.defaultLang || 'en-US',
        createdAt: Date.now(),
      };
      const updated = [...decks, newDeck];
      setDecks(updated);
      saveDecks(updated);
    }
    setEditingDeck(null);
  };

  // Answer recording in quiz
  const handleRecordAnswer = (
    cardId: string,
    wasCorrect: boolean,
    mode: string,
    userAnswer?: string,
    rating?: SRSRating
  ) => {
    const updated = recordQuizAnswer(cardId, wasCorrect, mode, userAnswer, rating);
    setCards(updated);
  };

  // Quick launch quiz shortcuts
  const handleStartQuizWithDeck = (deckId?: string, onlyDue?: boolean) => {
    setQuizInitialSource(onlyDue ? 'due' : deckId ? 'deck' : 'all');
    setQuizInitialDeckId(deckId);
    setActiveTab('quiz');
  };

  const handleStartQuizWithMistakes = () => {
    setQuizInitialSource('mistakes');
    setActiveTab('quiz');
  };

  // Modal open helpers
  const handleOpenAddCard = (deckId?: string) => {
    setEditingCard(null);
    setTargetDeckIdForCard(deckId);
    setIsCardModalOpen(true);
  };

  const handleOpenEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setIsCardModalOpen(true);
  };

  const handleReloadAfterImport = () => {
    const freshCards = getStoredCards();
    const freshDecks = getStoredDecks();
    setCards(freshCards);
    setDecks(freshDecks);
  };

  // Badge calculations
  const dueCount = useMemo(() => cards.filter((c) => isDue(c.srs.dueDate)).length, [cards]);
  const mistakeCount = useMemo(
    () => cards.filter((c) => c.mistakes.isMistakeMarked || (c.mistakes.wrongCount && c.mistakes.wrongCount > 0)).length,
    [cards]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <Header
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddCard={() => handleOpenAddCard()}
        onOpenNewDeck={() => {
          setEditingDeck(null);
          setIsDeckModalOpen(true);
        }}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        dueCount={dueCount}
        mistakeCount={mistakeCount}
        totalCards={cards.length}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Content Container (Baseline 1440px desktop with 900-1200px inner container) */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'cards' && (
          <CardList
            cards={cards}
            decks={decks}
            onAddCard={handleOpenAddCard}
            onEditCard={handleOpenEditCard}
            onDeleteCard={handleDeleteCard}
            onToggleMistake={handleToggleMistake}
            onStartQuizWithDeck={handleStartQuizWithDeck}
            onOpenImportExport={() => setIsImportExportOpen(true)}
            onOpenNewDeck={() => {
              setEditingDeck(null);
              setIsDeckModalOpen(true);
            }}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            cards={cards}
            decks={decks}
            initialSource={quizInitialSource}
            initialDeckId={quizInitialDeckId}
            onRecordAnswer={handleRecordAnswer}
            onExitQuiz={() => setActiveTab('cards')}
            onGoToMistakes={() => setActiveTab('mistakes')}
          />
        )}

        {activeTab === 'mistakes' && (
          <MistakeNotebook
            cards={cards}
            decks={decks}
            onStartQuizWithMistakes={handleStartQuizWithMistakes}
            onToggleMistake={handleToggleMistake}
            onClearAllMistakes={handleClearAllMistakes}
            onEditCard={handleOpenEditCard}
          />
        )}

        {activeTab === 'stats' && <StatsView cards={cards} decks={decks} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">LinguaDeck</span>
            <span aria-hidden="true">·</span>
            <span>智慧單字卡與間隔複習系統</span>
          </div>
          <div className="flex items-center gap-3">
            <span>支援全語言發音 (Web Speech API)</span>
            <span aria-hidden="true">·</span>
            <span>SM-2 間隔演算法</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsImportExportOpen(true)}
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
            >
              匯出 / 備份至 GitHub
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CardFormModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
        }}
        onSave={handleSaveCard}
        decks={decks}
        editingCard={editingCard}
        defaultDeckId={targetDeckIdForCard}
      />

      <DeckManagerModal
        isOpen={isDeckModalOpen}
        onClose={() => {
          setIsDeckModalOpen(false);
          setEditingDeck(null);
        }}
        onSaveDeck={handleSaveDeck}
        editingDeck={editingDeck}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        decks={decks}
        onImportSuccess={handleReloadAfterImport}
      />
    </div>
  );
}

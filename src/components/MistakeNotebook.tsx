import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Play,
  Volume2,
  Trash2,
  CheckCircle,
  Search,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Deck, Flashcard } from '../types';
import { speak } from '../utils/speech';

interface MistakeNotebookProps {
  cards: Flashcard[];
  decks: Deck[];
  onStartQuizWithMistakes: () => void;
  onToggleMistake: (cardId: string) => void;
  onClearAllMistakes: () => void;
  onEditCard: (card: Flashcard) => void;
}

export const MistakeNotebook: React.FC<MistakeNotebookProps> = ({
  cards,
  decks,
  onStartQuizWithMistakes,
  onToggleMistake,
  onClearAllMistakes,
  onEditCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'wrong-desc' | 'recent'>('wrong-desc');

  const deckMap = useMemo(() => new Map(decks.map((d) => [d.id, d.name])), [decks]);

  // All cards that are marked as mistakes or have wrongCount > 0
  const mistakeCards = useMemo(() => {
    return cards.filter(
      (c) => c.mistakes.isMistakeMarked || (c.mistakes.wrongCount && c.mistakes.wrongCount > 0)
    );
  }, [cards]);

  const filteredMistakes = useMemo(() => {
    return mistakeCards
      .filter((card) => {
        if (selectedDeckId !== 'all' && card.deckId !== selectedDeckId) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return (
            card.term.toLowerCase().includes(q) ||
            card.definition.toLowerCase().includes(q) ||
            card.phonetic?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'wrong-desc') {
          return b.mistakes.wrongCount - a.mistakes.wrongCount;
        }
        return (b.mistakes.lastReviewedAt || 0) - (a.mistakes.lastReviewedAt || 0);
      });
  }, [mistakeCards, selectedDeckId, searchQuery, sortBy]);

  const totalWrongCount = useMemo(() => {
    return mistakeCards.reduce((acc, c) => acc + (c.mistakes.wrongCount || 0), 0);
  }, [mistakeCards]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              專屬錯題本 (Mistake Notebook)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>收錄 {mistakeCards.length} 個待加強生詞</span>
            <span aria-hidden="true">·</span>
            <span>累計答錯 {totalWrongCount} 次</span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              自動記錄測驗錯題與手動標記卡
            </span>
          </div>
        </div>

        {/* Big Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {mistakeCards.length > 0 && (
            <>
              <button
                onClick={onStartQuizWithMistakes}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition-colors whitespace-nowrap"
              >
                <Play className="h-4 w-4" />
                <span>🚀 專練這些錯題 ({mistakeCards.length})</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('確定要將所有已標記的錯題標記重設嗎？')) {
                    onClearAllMistakes();
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <span>清除錯題標記</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋錯題本中的單字或中文釋義..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Deck selector */}
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">所有卡組</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="wrong-desc">按答錯次數最多</option>
            <option value="recent">按最近答錯時間</option>
          </select>
        </div>
      </div>

      {/* Mistake Cards List */}
      {filteredMistakes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMistakes.map((card) => {
            const wrongCount = card.mistakes.wrongCount || 0;
            const correctCount = card.mistakes.correctCount || 0;
            const totalAttempts = wrongCount + correctCount;
            const errorRate =
              totalAttempts > 0 ? Math.round((wrongCount / totalAttempts) * 100) : 100;

            return (
              <div
                key={card.id}
                className="flex flex-col justify-between rounded-xl border border-rose-200/80 bg-white p-5 shadow-xs dark:border-rose-900/40 dark:bg-slate-900"
              >
                <div>
                  {/* Card Header: Deck & Mistake Count Tag */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {deckMap.get(card.deckId) || '未分類'}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                        答錯 {wrongCount} 次
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500 tabular-nums">
                        錯誤率 {errorRate}%
                      </span>
                    </div>
                  </div>

                  {/* Term and Meaning */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                        {card.term}
                      </h4>
                      <button
                        onClick={() => speak(card.term, card.lang)}
                        className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                        title="朗讀發音"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    {card.phonetic && (
                      <p className="text-xs font-mono text-slate-400">
                        {card.phonetic}
                      </p>
                    )}

                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 pt-1">
                      {card.definition}
                    </p>

                    {card.example && (
                      <p className="text-xs text-slate-500 italic pt-1">
                        "{card.example}"
                      </p>
                    )}

                    {card.notes && (
                      <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg mt-2">
                        💡 備忘：{card.notes}
                      </p>
                    )}
                  </div>

                  {/* Recent History if present */}
                  {card.mistakes.history && card.mistakes.history.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        最近錯誤記錄：
                      </span>
                      {card.mistakes.history.slice(0, 2).map((h, i) => (
                        <div key={i} className="text-slate-500 flex items-center justify-between">
                          <span>
                            {h.mode} 模式
                            {h.userAnswer ? ` (曾回答: ${h.userAnswer})` : ''}
                          </span>
                          <span className="tabular-nums">
                            {new Date(h.date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onToggleMistake(card.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>已熟記，移出錯題本</span>
                  </button>

                  <button
                    onClick={() => onEditCard(card)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    編輯內容
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Mistake State */
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
            太棒了！目前沒有任何待解決的錯題 🎉
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            進行出題測驗時若有答錯，系統會自動歸納進此錯題本；您也可以在單字卡右上角點擊書籤手動加入！
          </p>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Play,
  Upload,
  Layers,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react';
import { Deck, Flashcard } from '../types';
import { CardItem } from './CardItem';
import { isDue } from '../utils/srs';

interface CardListProps {
  cards: Flashcard[];
  decks: Deck[];
  onAddCard: (deckId?: string) => void;
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (cardId: string) => void;
  onToggleMistake: (cardId: string) => void;
  onStartQuizWithDeck: (deckId?: string, onlyDue?: boolean) => void;
  onOpenImportExport: () => void;
  onOpenNewDeck: () => void;
}

export const CardList: React.FC<CardListProps> = ({
  cards,
  decks,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onToggleMistake,
  onStartQuizWithDeck,
  onOpenImportExport,
  onOpenNewDeck,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'learning' | 'mastered' | 'mistakes'>('all');
  const [langFilter, setLangFilter] = useState<string>('all');

  const deckMap = useMemo(() => {
    return new Map(decks.map((d) => [d.id, d.name]));
  }, [decks]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Deck filter
      if (selectedDeckId !== 'all' && card.deckId !== selectedDeckId) {
        return false;
      }

      // Language filter
      if (langFilter !== 'all' && card.lang !== langFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'due' && !isDue(card.srs.dueDate)) {
        return false;
      }
      if (statusFilter === 'learning' && card.srs.state !== 'learning' && card.srs.state !== 'new') {
        return false;
      }
      if (statusFilter === 'mastered' && card.srs.state !== 'mastered') {
        return false;
      }
      if (statusFilter === 'mistakes' && !card.mistakes.isMistakeMarked && card.mistakes.wrongCount === 0) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTerm = card.term.toLowerCase().includes(query);
        const matchesDef = card.definition.toLowerCase().includes(query);
        const matchesPhonetic = card.phonetic?.toLowerCase().includes(query);
        const matchesTags = card.tags.some((t) => t.toLowerCase().includes(query));
        const matchesExample = card.example?.toLowerCase().includes(query);
        return matchesTerm || matchesDef || matchesPhonetic || matchesTags || matchesExample;
      }

      return true;
    });
  }, [cards, selectedDeckId, langFilter, statusFilter, searchQuery]);

  const dueCountInDeck = useMemo(() => {
    return cards.filter(
      (c) => (selectedDeckId === 'all' || c.deckId === selectedDeckId) && isDue(c.srs.dueDate)
    ).length;
  }, [cards, selectedDeckId]);

  return (
    <div className="space-y-6">
      {/* Top Controls: Deck Selector & Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            我的單字記憶庫
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>共 {cards.length} 個單字</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {cards.filter((c) => isDue(c.srs.dueDate)).length} 個今日待複習
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {cards.filter((c) => c.srs.state === 'mastered').length} 個已熟記
            </span>
          </div>
        </div>

        {/* Quick Quiz & Add CTAs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {dueCountInDeck > 0 && (
            <button
              onClick={() => onStartQuizWithDeck(selectedDeckId === 'all' ? undefined : selectedDeckId, true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors whitespace-nowrap"
            >
              <Clock className="h-4 w-4" />
              <span>複習今日到期 ({dueCountInDeck})</span>
            </button>
          )}

          <button
            onClick={() => onStartQuizWithDeck(selectedDeckId === 'all' ? undefined : selectedDeckId, false)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors whitespace-nowrap"
          >
            <Play className="h-4 w-4" />
            <span>開始出題測驗</span>
          </button>

          <button
            onClick={() => onAddCard(selectedDeckId === 'all' ? decks[0]?.id : selectedDeckId)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>新增卡片</span>
          </button>

          <button
            onClick={onOpenImportExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
          >
            <Upload className="h-4 w-4" />
            <span>批次匯入/匯出</span>
          </button>
        </div>
      </div>

      {/* Deck Selector Tabs (Interactive functional buttons) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
        <button
          onClick={() => setSelectedDeckId('all')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            selectedDeckId === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>全部卡組 ({cards.length})</span>
        </button>

        {decks.map((deck) => {
          const count = cards.filter((c) => c.deckId === deck.id).length;
          return (
            <button
              key={deck.id}
              onClick={() => setSelectedDeckId(deck.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedDeckId === deck.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <span>{deck.name}</span>
              <span className="opacity-75 tabular-nums">({count})</span>
            </button>
          );
        })}

        <button
          onClick={onOpenNewDeck}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 whitespace-nowrap transition-colors"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          <span>+ 建立新卡組</span>
        </button>
      </div>

      {/* Search and Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋單字、中文釋義、音標、標籤或例句..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
          />
        </div>

        {/* Filter Badges & Lang Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setStatusFilter('due')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                statusFilter === 'due'
                  ? 'bg-white text-amber-700 shadow-xs dark:bg-slate-700 dark:text-amber-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>待複習</span>
            </button>
            <button
              onClick={() => setStatusFilter('mistakes')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                statusFilter === 'mistakes'
                  ? 'bg-white text-rose-700 shadow-xs dark:bg-slate-700 dark:text-rose-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>錯題標記</span>
            </button>
            <button
              onClick={() => setStatusFilter('mastered')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                statusFilter === 'mastered'
                  ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>已熟記</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              deckName={deckMap.get(card.deckId) || '未分類'}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onToggleMistake={onToggleMistake}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <Layers className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
            未找到符合條件的單字卡
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? '請嘗試使用不同關鍵字搜尋，或切換狀態篩選條件。'
              : '此卡組尚無單字卡，立即新增您的第一個單字卡或匯入單字庫！'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => onAddCard(selectedDeckId === 'all' ? decks[0]?.id : selectedDeckId)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>新增單字卡</span>
            </button>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                清除搜尋條件
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

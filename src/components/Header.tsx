import React from 'react';
import {
  BookOpen,
  HelpCircle,
  AlertTriangle,
  BarChart3,
  Plus,
  Moon,
  Sun,
  Download,
  FolderPlus,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'cards' | 'quiz' | 'mistakes' | 'stats';
  onSelectTab: (tab: 'cards' | 'quiz' | 'mistakes' | 'stats') => void;
  onOpenAddCard: () => void;
  onOpenNewDeck: () => void;
  onOpenImportExport: () => void;
  dueCount: number;
  mistakeCount: number;
  totalCards: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddCard,
  onOpenNewDeck,
  onOpenImportExport,
  dueCount,
  mistakeCount,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:gap-8 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <button
            onClick={() => onSelectTab('cards')}
            className="text-left cursor-pointer focus-visible:outline-none"
          >
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              LinguaDeck
            </span>
          </button>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="flex items-center gap-1 sm:gap-4 md:gap-6 text-sm font-medium overflow-x-auto py-1">
          <button
            onClick={() => onSelectTab('cards')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'cards'
                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>單字庫</span>
          </button>

          <button
            onClick={() => onSelectTab('quiz')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'quiz'
                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>出題測驗</span>
            {dueCount > 0 && (
              <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[11px] font-semibold text-white">
                {dueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('mistakes')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'mistakes'
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400 font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>錯題本</span>
            {mistakeCount > 0 && (
              <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
                {mistakeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('stats')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              currentTab === 'stats'
                ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>學習統計</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions & Utility */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenImportExport}
            title="資料備份與匯出入 (相容 GitHub)"
            className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenNewDeck}
            title="建立新卡組"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>新增卡組</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            title={darkMode ? '切換淺色模式' : '切換深色模式'}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={onOpenAddCard}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 whitespace-nowrap shrink-0 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>新增單字</span>
          </button>
        </div>
      </div>
    </header>
  );
};

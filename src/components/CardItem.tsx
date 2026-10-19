import React, { useState } from 'react';
import { Volume2, RotateCw, Edit2, Trash2, Bookmark, BookmarkCheck } from 'lucide-react';
import { Flashcard } from '../types';
import { speak } from '../utils/speech';
import { formatDueDate } from '../utils/srs';

interface CardItemProps {
  card: Flashcard;
  deckName: string;
  onEdit: (card: Flashcard) => void;
  onDelete: (cardId: string) => void;
  onToggleMistake: (cardId: string) => void;
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  deckName,
  onEdit,
  onDelete,
  onToggleMistake,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

  const handlePlayAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    await speak(card.term, card.lang, isSlow ? 0.75 : 1.0);
    setTimeout(() => setIsPlayingAudio(false), 800);
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSlow(!isSlow);
  };

  const getSrsLabel = () => {
    switch (card.srs.state) {
      case 'new':
        return '新單字';
      case 'learning':
        return '學習中';
      case 'review':
        return '複習中';
      case 'mastered':
        return '已精通';
      default:
        return '未學習';
    }
  };

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 transition-all cursor-pointer min-h-[220px]"
    >
      {/* Top Bar: Deck & Unboxed Metadata */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
            {deckName}
          </span>
          <span aria-hidden="true">·</span>
          <span>{getSrsLabel()}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{formatDueDate(card.srs.dueDate)}</span>
        </div>

        {/* Mistake Notebook bookmark toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMistake(card.id);
          }}
          title={card.mistakes.isMistakeMarked ? '從錯題本移除' : '加入錯題本'}
          className={`p-1 rounded-md transition-colors ${
            card.mistakes.isMistakeMarked
              ? 'text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40'
              : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400'
          }`}
        >
          {card.mistakes.isMistakeMarked ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main Content: Front vs Back */}
      <div className="my-3">
        {!isFlipped ? (
          /* Front: Term + Phonetic + POS */
          <div className="space-y-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h4 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {card.term}
              </h4>
              {card.partOfSpeech && (
                <span className="text-xs italic text-indigo-600 dark:text-indigo-400 font-serif">
                  {card.partOfSpeech}
                </span>
              )}
            </div>

            {card.phonetic && (
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {card.phonetic}
              </p>
            )}

            {card.example && (
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                "{card.example}"
              </p>
            )}
          </div>
        ) : (
          /* Back: Definition + Translation + Notes */
          <div className="space-y-2 animate-fadeIn">
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              {card.definition}
            </p>

            {card.exampleTranslation && (
              <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                {card.exampleTranslation}
              </p>
            )}

            {card.notes && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                💡 {card.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Bar: Audio controls & Card actions */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800 mt-2">
        {/* Audio controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePlayAudio}
            disabled={isPlayingAudio}
            title="發音播放 (單字)"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900/60 transition-colors"
          >
            <Volume2 className={`h-3.5 w-3.5 ${isPlayingAudio ? 'animate-pulse text-indigo-700' : ''}`} />
            <span>發音</span>
          </button>

          <button
            onClick={toggleSpeed}
            title="發音速度切換"
            className={`px-1.5 py-0.5 text-[11px] font-mono rounded transition-colors ${
              isSlow
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {isSlow ? '0.75x 慢速' : '1.0x'}
          </button>
        </div>

        {/* Flip hint & Action tools */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
            <RotateCw className="h-3 w-3" />
            {isFlipped ? '背面' : '正面'}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
            title="編輯單字"
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            title="刪除單字"
            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Volume2, Sparkles, Check } from 'lucide-react';
import { Deck, Flashcard } from '../types';
import { SUPPORTED_LANGUAGES, detectLanguage, speak } from '../utils/speech';

interface CardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Partial<Flashcard>) => void;
  decks: Deck[];
  editingCard?: Flashcard | null;
  defaultDeckId?: string;
}

export const CardFormModal: React.FC<CardFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  decks,
  editingCard,
  defaultDeckId,
}) => {
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [example, setExample] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [notes, setNotes] = useState('');
  const [deckId, setDeckId] = useState(defaultDeckId || (decks[0]?.id ?? ''));
  const [lang, setLang] = useState('en-US');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (editingCard) {
      setTerm(editingCard.term);
      setDefinition(editingCard.definition);
      setPhonetic(editingCard.phonetic || '');
      setPartOfSpeech(editingCard.partOfSpeech || '');
      setExample(editingCard.example || '');
      setExampleTranslation(editingCard.exampleTranslation || '');
      setNotes(editingCard.notes || '');
      setDeckId(editingCard.deckId);
      setLang(editingCard.lang || 'en-US');
      setTags(editingCard.tags || []);
    } else {
      setTerm('');
      setDefinition('');
      setPhonetic('');
      setPartOfSpeech('');
      setExample('');
      setExampleTranslation('');
      setNotes('');
      setDeckId(defaultDeckId || (decks[0]?.id ?? ''));
      const activeDeck = decks.find((d) => d.id === defaultDeckId) || decks[0];
      setLang(activeDeck?.defaultLang || 'en-US');
      setTags([]);
    }
  }, [editingCard, defaultDeckId, decks, isOpen]);

  if (!isOpen) return null;

  const handleAutoDetect = () => {
    if (!term.trim()) return;
    const detected = detectLanguage(term);
    setLang(detected);
  };

  const handleTestAudio = async () => {
    if (!term.trim()) return;
    setIsPlayingAudio(true);
    await speak(term, lang);
    setTimeout(() => setIsPlayingAudio(false), 800);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) return;

    onSave({
      term: term.trim(),
      definition: definition.trim(),
      phonetic: phonetic.trim(),
      partOfSpeech: partOfSpeech.trim(),
      example: example.trim(),
      exampleTranslation: exampleTranslation.trim(),
      notes: notes.trim(),
      deckId,
      lang,
      tags,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingCard ? '編輯單字卡' : '新增單字卡'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              支援任意語言、拼音/音標、例句與即時發音試聽
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Deck & Language Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                所屬卡組
              </label>
              <select
                value={deckId}
                onChange={(e) => {
                  setDeckId(e.target.value);
                  const selected = decks.find((d) => d.id === e.target.value);
                  if (selected && !editingCard) {
                    setLang(selected.defaultLang);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                發音與語言代碼
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Term Input + Test Pronunciation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                單字 / 片語 <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  title="依輸入內容自動推測語言"
                >
                  <Sparkles className="h-3 w-3" />
                  自動辨識語言
                </button>
                <button
                  type="button"
                  onClick={handleTestAudio}
                  disabled={!term.trim() || isPlayingAudio}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400 dark:hover:text-slate-200"
                  title="試聽發音"
                >
                  <Volume2 className={`h-3 w-3 ${isPlayingAudio ? 'text-indigo-600 animate-pulse' : ''}`} />
                  試聽發音
                </button>
              </div>
            </div>
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="例如：serendipity 或 木漏れ日"
              required
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Definition */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              釋義 / 中文翻譯 <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="例如：意外發現的美好事物；機緣湊巧"
              required
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Phonetic & Part of Speech */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                音標 / 假名標音 (選填)
              </label>
              <input
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="例如：/ˌser.ənˈdɪp.ə.t̬i/ 或 こもれび"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                詞性 (選填)
              </label>
              <input
                type="text"
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                placeholder="例如：noun, v., adj., 名詞, 片語"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Example Sentence & Translation */}
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                例句 (選填)
              </label>
              <input
                type="text"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="例如：Finding this cafe in the rain was pure serendipity."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                例句翻譯 (選填)
              </label>
              <input
                type="text"
                value={exampleTranslation}
                onChange={(e) => setExampleTranslation(e.target.value)}
                placeholder="例如：在雨中偶然發現這家咖啡館完全是件幸運的巧合。"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Notes & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                記憶要點 / 提示備註 (選填)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="記憶口訣、同義詞或考點"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                自訂標籤 (按 Enter 新增)
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="例如：職場, 高頻, JLPT"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Active Tags list */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>{editingCard ? '儲存變更' : '建立單字卡'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

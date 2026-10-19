import { Deck, Flashcard, SRSRating } from '../types';
import { createDefaultSRS, updateSRS } from './srs';

const STORAGE_KEYS = {
  CARDS: 'linguadeck_cards_v1',
  DECKS: 'linguadeck_decks_v1',
  SETTINGS: 'linguadeck_settings_v1',
};

export const INITIAL_DECKS: Deck[] = [
  {
    id: 'deck-english-core',
    name: '日常高頻英語 (Core English)',
    description: '日常交流與職場高頻實用詞彙、例句與道地用法',
    defaultLang: 'en-US',
    color: 'from-blue-600 to-indigo-600',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'deck-japanese-n5',
    name: '基礎實用日語 (Essential Japanese)',
    description: '日常生活與旅行常用日文單字，附假名標音與例句',
    defaultLang: 'ja-JP',
    color: 'from-rose-500 to-pink-600',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'deck-spanish-travel',
    name: '西語旅遊會話 (Spanish Travel)',
    description: '西班牙與拉丁美洲旅行高頻單字、餐廳與問路片語',
    defaultLang: 'es-ES',
    color: 'from-amber-500 to-orange-600',
    createdAt: Date.now() - 86400000 * 3,
  },
];

export const INITIAL_CARDS: Flashcard[] = [
  // English cards
  {
    id: 'card-en-1',
    term: 'serendipity',
    definition: '意外發現的美好事物；機緣湊巧',
    phonetic: '/ˌser.ənˈdɪp.ə.t̬i/',
    partOfSpeech: 'noun',
    example: 'Finding this cozy cafe in the rain was pure serendipity.',
    exampleTranslation: '在雨中偶然發現這家舒適的咖啡館完全是件幸運的巧合。',
    notes: '文學與日常中常形容意外收穫的美好驚喜',
    deckId: 'deck-english-core',
    tags: ['進階詞彙', '文學'],
    lang: 'en-US',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    srs: { reps: 1, interval: 2, easeFactor: 2.5, dueDate: Date.now() - 3600000, state: 'review' },
    mistakes: { wrongCount: 1, correctCount: 2, isMistakeMarked: true, history: [] },
  },
  {
    id: 'card-en-2',
    term: 'resilience',
    definition: '復原力；韌性；適應力',
    phonetic: '/rɪˈzɪl.jəns/',
    partOfSpeech: 'noun',
    example: 'She showed great courage and resilience during the crisis.',
    exampleTranslation: '她在危機中展現了極大的勇氣與堅韌。',
    notes: '職場與心理學常用詞彙',
    deckId: 'deck-english-core',
    tags: ['職場', '心理學'],
    lang: 'en-US',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    srs: { reps: 2, interval: 4, easeFactor: 2.5, dueDate: Date.now() + 86400000 * 2, state: 'review' },
    mistakes: { wrongCount: 0, correctCount: 3, isMistakeMarked: false, history: [] },
  },
  {
    id: 'card-en-3',
    term: 'lucid',
    definition: '清晰易懂的；神智清醒的',
    phonetic: '/ˈluː.sɪd/',
    partOfSpeech: 'adjective',
    example: 'He gave a very lucid explanation of the complex system.',
    exampleTranslation: '他對這個複雜系統做出了非常清晰易懂的解釋。',
    notes: '常搭配 explanation, dream',
    deckId: 'deck-english-core',
    tags: ['商務', '寫作'],
    lang: 'en-US',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    srs: { reps: 0, interval: 0, easeFactor: 2.5, dueDate: Date.now() - 10000, state: 'learning' },
    mistakes: { wrongCount: 2, correctCount: 1, isMistakeMarked: true, history: [] },
  },
  {
    id: 'card-en-4',
    term: 'ubiquitous',
    definition: '無所不在的；普遍存在的',
    phonetic: '/juːˈbɪk.wə.t̬əs/',
    partOfSpeech: 'adjective',
    example: 'Smartphones have become ubiquitous in modern society.',
    exampleTranslation: '智慧型手機在現代社會中已經無所不在。',
    notes: '同義詞 omnipresent',
    deckId: 'deck-english-core',
    tags: ['科技', '學術'],
    lang: 'en-US',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    srs: { reps: 0, interval: 0, easeFactor: 2.5, dueDate: Date.now() - 5000, state: 'new' },
    mistakes: { wrongCount: 0, correctCount: 0, isMistakeMarked: false, history: [] },
  },

  // Japanese cards
  {
    id: 'card-ja-1',
    term: '一期一会',
    definition: '一期一會；珍惜難得相遇的機緣',
    phonetic: 'いちごいちえ (ichigo ichie)',
    partOfSpeech: '四字熟語',
    example: '今日のお客様との出会いも一期一会です。',
    exampleTranslation: '今天與客人的相遇也是難能可貴的一期一會。',
    notes: '源自日本茶道精神',
    deckId: 'deck-japanese-n5',
    tags: ['四字熟語', '文化'],
    lang: 'ja-JP',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
    srs: { reps: 1, interval: 1, easeFactor: 2.5, dueDate: Date.now() - 7200000, state: 'learning' },
    mistakes: { wrongCount: 1, correctCount: 2, isMistakeMarked: true, history: [] },
  },
  {
    id: 'card-ja-2',
    term: '木漏れ日',
    definition: '透過樹葉灑落的陽光',
    phonetic: 'こもれび (komorebi)',
    partOfSpeech: '名詞',
    example: '森の中で木漏れ日を浴びながら散歩した。',
    exampleTranslation: '在森林中一邊沐浴著透過樹葉灑落的陽光一邊散步。',
    notes: '日語獨特的詩意自然詞彙',
    deckId: 'deck-japanese-n5',
    tags: ['自然', '美詞'],
    lang: 'ja-JP',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
    srs: { reps: 3, interval: 6, easeFactor: 2.5, dueDate: Date.now() + 86400000 * 3, state: 'review' },
    mistakes: { wrongCount: 0, correctCount: 4, isMistakeMarked: false, history: [] },
  },
  {
    id: 'card-ja-3',
    term: 'おすすめ',
    definition: '推薦；推薦的餐點或物品',
    phonetic: 'おすすめ (osusume)',
    partOfSpeech: '名詞',
    example: '今日のおすすめ料理は何ですか？',
    exampleTranslation: '今天的推薦料理是什麼呢？',
    notes: '居酒屋與餐廳必備問句',
    deckId: 'deck-japanese-n5',
    tags: ['旅行', '美食'],
    lang: 'ja-JP',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    srs: { reps: 0, interval: 0, easeFactor: 2.5, dueDate: Date.now() - 1000, state: 'new' },
    mistakes: { wrongCount: 0, correctCount: 1, isMistakeMarked: false, history: [] },
  },

  // Spanish cards
  {
    id: 'card-es-1',
    term: 'despacito',
    definition: '慢慢地；緩慢地',
    phonetic: 'des-pa-SI-to',
    partOfSpeech: 'adverbio',
    example: 'Por favor, habla más despacito.',
    exampleTranslation: '請說得稍微慢一點。',
    notes: 'despacio 的指小詞形式',
    deckId: 'deck-spanish-travel',
    tags: ['日常交流'],
    lang: 'es-ES',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    srs: { reps: 1, interval: 2, easeFactor: 2.5, dueDate: Date.now() - 50000, state: 'learning' },
    mistakes: { wrongCount: 2, correctCount: 1, isMistakeMarked: true, history: [] },
  },
  {
    id: 'card-es-2',
    term: 'la cuenta',
    definition: '帳單（結帳時用）',
    phonetic: 'la KWEN-ta',
    partOfSpeech: 'sustantivo',
    example: 'La cuenta, por favor.',
    exampleTranslation: '麻煩結帳，謝謝。',
    notes: '餐廳付款最實用金句',
    deckId: 'deck-spanish-travel',
    tags: ['餐廳', '生活'],
    lang: 'es-ES',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    srs: { reps: 2, interval: 4, easeFactor: 2.5, dueDate: Date.now() + 86400000, state: 'review' },
    mistakes: { wrongCount: 0, correctCount: 3, isMistakeMarked: false, history: [] },
  },
  {
    id: 'card-es-3',
    term: 'sobremesa',
    definition: '飯後圍坐餐桌閒聊的悠閒時光',
    phonetic: 'so-bre-ME-sa',
    partOfSpeech: 'sustantivo',
    example: 'Disfrutamos de una larga sobremesa con amigos.',
    exampleTranslation: '我們與朋友們享受了一段漫長愉快的飯後餐桌閒聊時光。',
    notes: '西班牙深具代表性的慢活飲食文化概念',
    deckId: 'deck-spanish-travel',
    tags: ['文化', '社交'],
    lang: 'es-ES',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
    srs: { reps: 0, interval: 0, easeFactor: 2.5, dueDate: Date.now() - 100, state: 'new' },
    mistakes: { wrongCount: 1, correctCount: 0, isMistakeMarked: true, history: [] },
  },
];

export function getStoredDecks(): Deck[] {
  if (typeof window === 'undefined') return INITIAL_DECKS;
  const raw = localStorage.getItem(STORAGE_KEYS.DECKS);
  if (!raw) {
    saveDecks(INITIAL_DECKS);
    return INITIAL_DECKS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_DECKS;
  }
}

export function saveDecks(decks: Deck[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
}

export function getStoredCards(): Flashcard[] {
  if (typeof window === 'undefined') return INITIAL_CARDS;
  const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
  if (!raw) {
    saveCards(INITIAL_CARDS);
    return INITIAL_CARDS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_CARDS;
  }
}

export function saveCards(cards: Flashcard[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
}

export function createNewCard(partial: Partial<Flashcard>): Flashcard {
  const now = Date.now();
  return {
    id: `card-${now}-${Math.random().toString(36).substring(2, 7)}`,
    term: partial.term?.trim() || '',
    definition: partial.definition?.trim() || '',
    phonetic: partial.phonetic?.trim() || '',
    partOfSpeech: partial.partOfSpeech?.trim() || '',
    example: partial.example?.trim() || '',
    exampleTranslation: partial.exampleTranslation?.trim() || '',
    notes: partial.notes?.trim() || '',
    deckId: partial.deckId || 'deck-english-core',
    tags: partial.tags || [],
    lang: partial.lang || 'en-US',
    createdAt: now,
    updatedAt: now,
    srs: partial.srs || createDefaultSRS(),
    mistakes: partial.mistakes || {
      wrongCount: 0,
      correctCount: 0,
      isMistakeMarked: false,
      history: [],
    },
  };
}

export function recordQuizAnswer(
  cardId: string,
  wasCorrect: boolean,
  mode: string,
  userAnswer: string = '',
  rating?: SRSRating
): Flashcard[] {
  const cards = getStoredCards();
  const updated = cards.map((c) => {
    if (c.id !== cardId) return c;

    // Determine SRS rating if not manually provided
    const resolvedRating: SRSRating =
      rating || (wasCorrect ? 'good' : 'again');
    const newSRS = updateSRS(c.srs, resolvedRating);

    const historyItem = {
      date: Date.now(),
      mode,
      userAnswer,
      correctAnswer: c.definition,
    };

    const newMistakes = {
      ...c.mistakes,
      wrongCount: wasCorrect ? c.mistakes.wrongCount : c.mistakes.wrongCount + 1,
      correctCount: wasCorrect ? c.mistakes.correctCount + 1 : c.mistakes.correctCount,
      lastReviewedAt: Date.now(),
      lastResult: (wasCorrect ? 'correct' : 'wrong') as 'correct' | 'wrong',
      // If wrong, automatically mark into mistakes notebook; if correct and previously marked, keep or user can dismiss
      isMistakeMarked: wasCorrect ? c.mistakes.isMistakeMarked : true,
      history: [historyItem, ...(c.mistakes.history || [])].slice(0, 10), // keep last 10 entries
    };

    return {
      ...c,
      updatedAt: Date.now(),
      srs: newSRS,
      mistakes: newMistakes,
    };
  });

  saveCards(updated);
  return updated;
}

export function toggleCardMistakeMark(cardId: string): Flashcard[] {
  const cards = getStoredCards();
  const updated = cards.map((c) => {
    if (c.id !== cardId) return c;
    return {
      ...c,
      mistakes: {
        ...c.mistakes,
        isMistakeMarked: !c.mistakes.isMistakeMarked,
      },
    };
  });
  saveCards(updated);
  return updated;
}

export function clearResolvedMistakes(): Flashcard[] {
  const cards = getStoredCards();
  const updated = cards.map((c) => {
    // If user got it right more times or wants to unmark all
    return {
      ...c,
      mistakes: {
        ...c.mistakes,
        isMistakeMarked: false,
      },
    };
  });
  saveCards(updated);
  return updated;
}

export function exportDataAsJSON(): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    decks: getStoredDecks(),
    cards: getStoredCards(),
  };
  return JSON.stringify(data, null, 2);
}

export function exportCardsAsCSV(deckId?: string): string {
  const cards = getStoredCards().filter((c) => !deckId || c.deckId === deckId);
  const headers = ['單字/片語 (Term)', '定義/翻譯 (Definition)', '語言代碼 (Lang)', '音標/假名 (Phonetic)', '詞性 (POS)', '例句 (Example)', '例句翻譯 (Example Translation)', '備註 (Notes)'];
  const rows = cards.map((c) => [
    `"${(c.term || '').replace(/"/g, '""')}"`,
    `"${(c.definition || '').replace(/"/g, '""')}"`,
    `"${(c.lang || 'en-US').replace(/"/g, '""')}"`,
    `"${(c.phonetic || '').replace(/"/g, '""')}"`,
    `"${(c.partOfSpeech || '').replace(/"/g, '""')}"`,
    `"${(c.example || '').replace(/"/g, '""')}"`,
    `"${(c.exampleTranslation || '').replace(/"/g, '""')}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function importCardsFromText(
  rawText: string,
  targetDeckId: string,
  targetLang: string = 'en-US'
): { addedCount: number; errors: string[] } {
  const errors: string[] = [];
  let addedCount = 0;
  const currentCards = getStoredCards();
  const newCards: Flashcard[] = [];

  // Try parsing as JSON first
  try {
    const parsed = JSON.parse(rawText);
    if (parsed && Array.isArray(parsed.cards)) {
      parsed.cards.forEach((item: Partial<Flashcard>) => {
        if (item.term && item.definition) {
          newCards.push(
            createNewCard({
              ...item,
              deckId: item.deckId || targetDeckId,
              lang: item.lang || targetLang,
            })
          );
          addedCount++;
        }
      });
      if (addedCount > 0) {
        saveCards([...currentCards, ...newCards]);
        return { addedCount, errors };
      }
    }
  } catch {
    // Not valid JSON, proceed to CSV/TSV parse
  }

  // Parse lines (supports comma, tab, or hyphen separator)
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (i === 0 && (line.includes('單字') || line.toLowerCase().includes('term'))) {
      // Header row, skip
      continue;
    }

    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(',')) {
      // Basic CSV splitter respecting quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      parts = matches ? matches.map((m) => m.replace(/^"|"$/g, '')) : line.split(',');
    } else if (line.includes(' - ')) {
      parts = line.split(' - ');
    } else if (line.includes('：') || line.includes(':')) {
      parts = line.split(/[:：]/);
    }

    if (parts.length >= 2) {
      const term = parts[0]?.trim();
      const definition = parts[1]?.trim();
      const lang = parts[2]?.trim() || targetLang;
      const phonetic = parts[3]?.trim() || '';
      const partOfSpeech = parts[4]?.trim() || '';
      const example = parts[5]?.trim() || '';
      const exampleTranslation = parts[6]?.trim() || '';

      if (term && definition) {
        newCards.push(
          createNewCard({
            term,
            definition,
            lang,
            phonetic,
            partOfSpeech,
            example,
            exampleTranslation,
            deckId: targetDeckId,
          })
        );
        addedCount++;
      } else {
        errors.push(`第 ${i + 1} 行格式缺少單字或定義：${line}`);
      }
    } else {
      errors.push(`第 ${i + 1} 行無法解析分隔符：${line}`);
    }
  }

  if (newCards.length > 0) {
    saveCards([...currentCards, ...newCards]);
  }

  return { addedCount, errors };
}

import React, { useMemo } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  Award,
  Layers,
  Brain,
} from 'lucide-react';
import { Deck, Flashcard } from '../types';
import { isDue } from '../utils/srs';

interface StatsViewProps {
  cards: Flashcard[];
  decks: Deck[];
}

export const StatsView: React.FC<StatsViewProps> = ({ cards, decks }) => {
  const stats = useMemo(() => {
    const totalCards = cards.length;
    const dueCount = cards.filter((c) => isDue(c.srs.dueDate)).length;

    const newCards = cards.filter((c) => c.srs.state === 'new').length;
    const learningCards = cards.filter((c) => c.srs.state === 'learning').length;
    const reviewCards = cards.filter((c) => c.srs.state === 'review').length;
    const masteredCards = cards.filter((c) => c.srs.state === 'mastered').length;

    let totalCorrect = 0;
    let totalWrong = 0;
    cards.forEach((c) => {
      totalCorrect += c.mistakes.correctCount || 0;
      totalWrong += c.mistakes.wrongCount || 0;
    });

    const totalReviews = totalCorrect + totalWrong;
    const overallAccuracy =
      totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

    // By Language count
    const langMap = new Map<string, number>();
    cards.forEach((c) => {
      const l = c.lang || 'en-US';
      langMap.set(l, (langMap.get(l) || 0) + 1);
    });

    return {
      totalCards,
      dueCount,
      newCards,
      learningCards,
      reviewCards,
      masteredCards,
      totalCorrect,
      totalWrong,
      totalReviews,
      overallAccuracy,
      langStats: Array.from(langMap.entries()).map(([lang, count]) => ({
        lang,
        count,
        percent: totalCards > 0 ? Math.round((count / totalCards) * 100) : 0,
      })),
    };
  }, [cards]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          學習進度與記憶統計
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          基於艾賓浩斯遺忘曲線與 SM-2 間隔複習演算法的科學記憶分析
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>收錄單字量</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.totalCards}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">跨 {decks.length} 個卡組</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span>今日到期複習</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {stats.dueCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">建議今日完成鞏固</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span>已熟記單字</span>
            <Award className="h-4 w-4" />
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {stats.masteredCards}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            佔總量 {stats.totalCards > 0 ? Math.round((stats.masteredCards / stats.totalCards) * 100) : 0}%
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>累計測驗準確率</span>
            <Brain className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.overallAccuracy}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            共完成 {stats.totalReviews} 次問答
          </div>
        </div>
      </div>

      {/* Spaced Repetition Stage Distribution */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          <span>間隔記憶階段分佈 (SRS Progression)</span>
        </h3>

        {/* Progress bar split */}
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div
            title={`已精通: ${stats.masteredCards}`}
            className="h-full bg-emerald-500"
            style={{ width: `${(stats.masteredCards / (stats.totalCards || 1)) * 100}%` }}
          />
          <div
            title={`複習中: ${stats.reviewCards}`}
            className="h-full bg-indigo-500"
            style={{ width: `${(stats.reviewCards / (stats.totalCards || 1)) * 100}%` }}
          />
          <div
            title={`學習中: ${stats.learningCards}`}
            className="h-full bg-amber-400"
            style={{ width: `${(stats.learningCards / (stats.totalCards || 1)) * 100}%` }}
          />
          <div
            title={`新單字: ${stats.newCards}`}
            className="h-full bg-slate-300 dark:bg-slate-600"
            style={{ width: `${(stats.newCards / (stats.totalCards || 1)) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">已精通 (Mastered)</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.masteredCards}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span className="text-slate-600 dark:text-slate-300">複習中 (Review)</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.reviewCards}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-600 dark:text-slate-300">學習中 (Learning)</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.learningCards}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-slate-600 dark:text-slate-300">新單字 (New)</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {stats.newCards}
            </span>
          </div>
        </div>
      </div>

      {/* Language Breakdown & Learning Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            語言比例分佈
          </h4>
          <div className="space-y-2.5">
            {stats.langStats.map((item) => (
              <div key={item.lang} className="text-xs space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{item.lang}</span>
                  <span className="tabular-nums font-semibold">
                    {item.count} 個 ({item.percent}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>間隔複習原理提示</span>
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            LinguaDeck 採用經過驗證的 SuperMemo SM-2 演算法。當您在測驗中答對或在翻卡時選擇「良好 / 簡單」，系統會自動拉長下一次複習的時間間隔（從 1 天、4 天、7 天逐步遞增）。
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            若遺忘或答錯，系統會立即將複習週期重置為 1 天，並自動標註至「錯題本」，讓您隨時針對薄弱環節集中衝刺！
          </p>
        </div>
      </div>
    </div>
  );
};

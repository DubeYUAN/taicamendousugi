import React, { useState } from 'react';
import { X, Download, Upload, Copy, Check, FileText, Code } from 'lucide-react';
import { Deck, Flashcard } from '../types';
import { exportDataAsJSON, exportCardsAsCSV, importCardsFromText } from '../utils/storage';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  onImportSuccess: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  decks,
  onImportSuccess,
}) => {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [importText, setImportText] = useState('');
  const [importDeckId, setImportDeckId] = useState<string>(decks[0]?.id || '');
  const [importLang, setImportLang] = useState('en-US');
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadFile = () => {
    let content = '';
    let filename = '';
    let mimeType = '';

    if (exportFormat === 'json') {
      content = exportDataAsJSON();
      filename = `linguadeck-backup-${new Date().toISOString().slice(0, 10)}.json`;
      mimeType = 'application/json';
    } else {
      content = exportCardsAsCSV(selectedDeckId === 'all' ? undefined : selectedDeckId);
      filename = `linguadeck-words-${new Date().toISOString().slice(0, 10)}.csv`;
      mimeType = 'text/csv;charset=utf-8;';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyExport = () => {
    const content =
      exportFormat === 'json'
        ? exportDataAsJSON()
        : exportCardsAsCSV(selectedDeckId === 'all' ? undefined : selectedDeckId);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunImport = () => {
    if (!importText.trim()) return;
    const result = importCardsFromText(importText, importDeckId, importLang);
    setImportResult({ count: result.addedCount, errors: result.errors });
    if (result.addedCount > 0) {
      onImportSuccess();
    }
  };

  const handleLoadSampleCSV = () => {
    const sample = `單字,釋義,語言,音標,詞性,例句,例句翻譯
ephemeral,短暫的；轉瞬即逝的,en-US,/ɪˈfem.ər.əl/,adjective,Fame in the digital age is often ephemeral.,數位時代的名氣往往轉瞬即逝。
花鳥風月,大自然的美麗景色,ja-JP,かちょうふうげつ,四字熟語,日本の花鳥風月を愛でる旅に出た。,踏上了欣賞日本大自然四季美景的旅程。
buen provecho,祝你用餐愉快,es-ES,bwen pro-VE-cho,frase,¡Buen provecho a todos!,祝大家用餐愉快！`;
    setImportText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              資料備份與批次匯出入
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              可無縫備份至 GitHub、Excel 或跨裝置轉移
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pt-4 pb-2">
          <button
            onClick={() => setTab('export')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'export'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>匯出 / 備份資料</span>
          </button>

          <button
            onClick={() => setTab('import')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'import'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>批次匯入單字</span>
          </button>
        </div>

        {/* Content Tab: Export */}
        {tab === 'export' && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  匯出格式
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium ${
                      exportFormat === 'json'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <Code className="h-3.5 w-3.5" />
                    <span>JSON (完整備份)</span>
                  </button>

                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium ${
                      exportFormat === 'csv'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>CSV (試算表格式)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  匯出範圍
                </label>
                <select
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="all">所有卡組與單字</option>
                  {decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              {exportFormat === 'json'
                ? '💡 JSON 包含卡片詳細資訊、SM-2 間隔複習狀態、錯題答題歷史與卡組設定，適合長期儲存於 GitHub 倉庫或跨瀏覽器還原。'
                : '💡 CSV 格式以逗號分隔，可直接以 Excel、Google Sheets 或文字編輯器開啟編輯。'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopyExport}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? '已複製內容' : '複製到剪貼簿'}</span>
              </button>

              <button
                onClick={handleDownloadFile}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>下載檔案 (.${exportFormat})</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Tab: Import */}
        {tab === 'import' && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  匯入至目標卡組
                </label>
                <select
                  value={importDeckId}
                  onChange={(e) => setImportDeckId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                  預設發音語言
                </label>
                <input
                  type="text"
                  value={importLang}
                  onChange={(e) => setImportLang(e.target.value)}
                  placeholder="en-US, ja-JP, es-ES..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  貼上 CSV / TSV / JSON 文字
                </label>
                <button
                  type="button"
                  onClick={handleLoadSampleCSV}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  載入範例格式
                </button>
              </div>
              <textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="每行一個單字，可用逗號、Tab 或破折號分隔：&#10;serendipity,意外的美好事物&#10;resilience,復原力；韌性"
                className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {importResult && (
              <div
                className={`p-3 rounded-lg text-xs ${
                  importResult.count > 0
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                }`}
              >
                <div className="font-bold">
                  {importResult.count > 0
                    ? `✓ 成功匯入 ${importResult.count} 個單字卡！`
                    : '未成功匯入任何單字，請檢查格式。'}
                </div>
                {importResult.errors.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    {importResult.errors.slice(0, 3).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              >
                關閉
              </button>
              <button
                type="button"
                onClick={handleRunImport}
                disabled={!importText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>執行匯入</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Hash,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Save,
  Edit3,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { MajorItem } from '../types/memory';
import {
  ALL_HEBREW_LETTERS,
  DEFAULT_CONNECTING_LETTERS,
  validateHebrewLogic,
  extractHebrewLettersOnly,
  normalizeHebrewChar,
  buildLetterToDigitMap,
} from '../lib/hebrewLogicValidator';
import { AIFieldGeneratorButton } from './AIFieldGeneratorButton';

export interface NumberLogicModuleProps {
  majorDigits: MajorItem[];
  connectingLetters: string[];
  onUpdateMajorDigit: (digit: number, consonants: string, word: string, hint: string) => void;
  onResetMajorDigit: (digit: number) => void;
  onUpdateConnectingLetters: (letters: string[]) => void;
  onRecalculateMajor00_99FromDigits: (customDigits?: MajorItem[]) => void;
  onEarnPoints?: (amount: number, reason?: string) => void;
  onNavigateToWorkout?: (category: 'major' | 'pao') => void;
}

export const NumberLogicModule: React.FC<NumberLogicModuleProps> = ({
  majorDigits,
  connectingLetters,
  onUpdateMajorDigit,
  onResetMajorDigit,
  onUpdateConnectingLetters,
  onRecalculateMajor00_99FromDigits,
  onEarnPoints,
  onNavigateToWorkout,
}) => {
  // Digit editing state
  const [editingDigit, setEditingDigit] = useState<number | null>(null);
  const [editConsonants, setEditConsonants] = useState('');
  const [editWord, setEditWord] = useState('');
  const [editHint, setEditHint] = useState('');

  // Interactive Live Tester state
  const [testNumber, setTestNumber] = useState<string>('0');
  const [testWord, setTestWord] = useState<string>('לוויתן');
  const [testMode, setTestMode] = useState<'major' | 'pao'>('major');

  // Success toast / notice
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSaveSuccessNotice(msg);
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  const handleStartEditDigit = (d: MajorItem) => {
    setEditingDigit(d.number);
    setEditConsonants(d.consonants);
    setEditWord(d.defaultWord);
    setEditHint(d.imageHint || '');
  };

  const handleSaveDigit = (digitNum: number) => {
    onUpdateMajorDigit(digitNum, editConsonants.trim(), editWord.trim(), editHint.trim());
    setEditingDigit(null);
    showNotification(`הגדרות ספרה ${digitNum} נשמרו בהצלחה!`);
    onEarnPoints?.(10, `עדכון חוקי ספרה ${digitNum}`);
  };

  const handleToggleConnectingLetter = (letter: string) => {
    const norm = normalizeHebrewChar(letter);
    let updated: string[];
    if (connectingLetters.includes(norm)) {
      updated = connectingLetters.filter((l) => l !== norm);
    } else {
      updated = [...connectingLetters, norm];
    }
    onUpdateConnectingLetters(updated);
    showNotification(`אותיות מקשרות עודכנו: ${updated.join(', ')}`);
  };

  const handleSetConnectingPreset = (preset: 'ani_one' | 'ahoy' | 'clear') => {
    let presetLetters: string[] = [];
    if (preset === 'ani_one') {
      presetLetters = [...DEFAULT_CONNECTING_LETTERS]; // א, ה, ו, י, נ, ע
    } else if (preset === 'ahoy') {
      presetLetters = ['א', 'ה', 'ו', 'י'];
    } else if (preset === 'clear') {
      presetLetters = [];
    }
    onUpdateConnectingLetters(presetLetters);
    showNotification(`נקבע פריסט אותיות מקשרות`);
  };

  const handleRecalculateAll = () => {
    onRecalculateMajor00_99FromDigits(majorDigits);
    showNotification('כל 100 מילות המאגר (00-99) חושבו ועודכנו מחדש לפי הלוגיקה!');
    onEarnPoints?.(20, 'חישוב מחדש של מאגר המילים לפי לוגיקה מעודכנת');
  };

  // Build letter-to-digit map for overview
  const letterMap = buildLetterToDigitMap(majorDigits);

  // Live validator analysis
  const parsedTestNum = parseInt(testNumber, 10);
  const liveValidation = !isNaN(parsedTestNum)
    ? validateHebrewLogic(testWord, parsedTestNum, majorDigits, connectingLetters, testMode)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 text-right" dir="rtl">
      {/* Save Success Banner */}
      {saveSuccessNotice && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-l from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Sliders className="w-3.5 h-3.5" />
              <span>מרכז חוקי הזיכרון הרוחבי (Global Logic Rules)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              הגדרת לוגיקת המספרים והאותיות
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              טבלה זו היא המוח המרכזי של האפליקציה: כאן קובעים אילו אותיות מייצגות כל ספרה (0 עד 9), ואילו אותיות מוגדרות כ״אותיות מקשרות״ (ללא ערך מספרי).
              כל שינוי כאן מוחל אוטומטית על מודולות <strong>שיטת מז׳ור</strong> ו-<strong>PAO</strong>, ומפעיל ולידציה אוטומטית על ערכים שאינם תואמים לחוקים או ערכים כפולים!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              onClick={handleRecalculateAll}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>החל וחשב מחדש מילים (00-99)</span>
            </button>
            <div className="flex items-center gap-2">
              {onNavigateToWorkout && (
                <>
                  <button
                    onClick={() => onNavigateToWorkout('major')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>עבור ל-Major</span>
                    <ArrowRight className="w-3 h-3 rotate-180" />
                  </button>
                  <button
                    onClick={() => onNavigateToWorkout('pao')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>עבור ל-PAO</span>
                    <ArrowRight className="w-3 h-3 rotate-180" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: אותיות מקשרות */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <h2 className="text-lg sm:text-xl font-black text-white">
                חוק ״אותיות הקישור״ (שקופות / ללא ערך מספרי)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              לאותיות אלו אין שיוך מספרי. הן משמשות כחומרי הדבקה חופשיים לחיבור מילים בעברית. לחץ על אות כדי להגדירה או להסירה כמקשרת.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-bold">פריסטים:</span>
            <button
              onClick={() => handleSetConnectingPreset('ani_one')}
              className="text-xs bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
              title="א, ה, ו, י, נ, ע (אני עונה)"
            >
              ✨ אני עונה (מומלץ)
            </button>
            <button
              onClick={() => handleSetConnectingPreset('ahoy')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
              title="א, ה, ו, י בלבד"
            >
              אהו״י בלבד
            </button>
            <button
              onClick={() => handleSetConnectingPreset('clear')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
              title="נקה את כל אותיות הקישור"
            >
              נקה
            </button>
          </div>
        </div>

        {/* Current Active Letters Summary Badge */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">אותיות מקשרות פעילות כעת ({connectingLetters.length}):</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {connectingLetters.map((letter) => (
                <span
                  key={letter}
                  className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-black text-sm"
                >
                  {letter}
                </span>
              ))}
              {connectingLetters.length === 0 && (
                <span className="text-rose-400 font-medium">אין אותיות מקשרות (כל אות תיחשב כעיצור)</span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            לחץ על כרטיס אות מטה כדי להפעיל או לבטל
          </span>
        </div>

        {/* 22 Hebrew Letters Interactive Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-2.5">
          {ALL_HEBREW_LETTERS.map((letter) => {
            const isConnecting = connectingLetters.includes(letter);
            const assignedDigit = letterMap.get(letter);

            return (
              <button
                key={letter}
                type="button"
                onClick={() => handleToggleConnectingLetter(letter)}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-1.5 cursor-pointer relative group ${
                  isConnecting
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200 shadow-md shadow-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-2xl font-black font-mono">
                  {letter}
                </span>

                <div className="text-[10px] font-bold">
                  {isConnecting ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>מקשרת</span>
                    </span>
                  ) : assignedDigit !== undefined ? (
                    <span className="text-amber-400 font-mono">
                      ספרה {assignedDigit}
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      ללא ספרה
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: טבלת קישורי הספרות (0-9) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <h2 className="text-lg sm:text-xl font-black text-white">
                טבלת קישורי הספרות לעיצורים ומילות עוגן (ספרות 0 עד 9)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              לכל ספרה משויכים עיצורים בעלי צליל או צורה דומה, ומילת עוגן ראשית. לחץ על כפתור העריכה בכל כרטיס כדי לשנות עיצורים או מילה.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            ↵ לחיצה על Enter בכל שדה שומרת אותו מיידית
          </div>
        </div>

        {/* 10 Digits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {majorDigits.map((d) => {
            const isEditing = editingDigit === d.number;

            return (
              <div
                key={d.number}
                className={`bg-slate-950 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                  isEditing
                    ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-black text-2xl flex items-center justify-center">
                      {d.number}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setEditingDigit(null);
                          } else {
                            handleStartEditDigit(d);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-400 cursor-pointer rounded-lg hover:bg-slate-900"
                        title="ערוך ספרה זו"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onResetMajorDigit(d.number)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer rounded-lg hover:bg-slate-900"
                        title="אפס ספרה לברירת מחדל"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2.5 text-right pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-slate-300 font-bold">עיצורים משויכים:</label>
                          <AIFieldGeneratorButton
                            promptType="major_consonants"
                            inputContext={d.number.toString()}
                            onGenerated={(val) => setEditConsonants(val)}
                            label="עיצורים"
                            compact
                          />
                        </div>
                        <input
                          type="text"
                          value={editConsonants}
                          onChange={(e) => setEditConsonants(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveDigit(d.number);
                            }
                          }}
                          placeholder="למשל: ס, ז, ש..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-slate-300 font-bold">מילת עוגן:</label>
                          <AIFieldGeneratorButton
                            promptType="major_word"
                            inputContext={d.number.toString()}
                            extraContext={editConsonants}
                            onGenerated={(val) => setEditWord(val)}
                            label="מילה עם AI"
                            compact
                          />
                        </div>
                        <input
                          type="text"
                          value={editWord}
                          onChange={(e) => setEditWord(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveDigit(d.number);
                            }
                          }}
                          placeholder="למשל: סוס..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-slate-300 font-bold">דימוי חושי / סצנה:</label>
                          <AIFieldGeneratorButton
                            promptType="major_hint"
                            inputContext={d.number.toString()}
                            extraContext={editWord}
                            onGenerated={(val) => setEditHint(val)}
                            label="סצנה AI"
                            compact
                          />
                        </div>
                        <input
                          type="text"
                          value={editHint}
                          onChange={(e) => setEditHint(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveDigit(d.number);
                            }
                          }}
                          placeholder="דימוי חושי קינטי..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1">
                        <span className="text-[10px] text-slate-500 font-mono">↵ Enter</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingDigit(null)}
                            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
                          >
                            ביטול
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveDigit(d.number)}
                            className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg cursor-pointer"
                          >
                            שמור
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-right">
                      <div>
                        <span className="text-[11px] text-slate-400 font-bold block mb-0.5">עיצורים:</span>
                        <div className="text-sm font-black text-amber-300 bg-amber-950/20 border border-amber-500/20 rounded-lg px-2 py-1 inline-block">
                          {d.consonants || '-'}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 font-bold block mb-0.5">מילת עוגן:</span>
                        <div className="text-base font-bold text-white">
                          {d.defaultWord || '-'}
                        </div>
                      </div>

                      {d.imageHint && (
                        <p className="text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 leading-relaxed">
                          {d.imageHint}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: בודק ולידציה אינטראקטיבי בזמן אמת */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-lg">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400" />
              <h2 className="text-lg sm:text-xl font-black text-white">
                בודק ולידציית לוגיקה בזמן אמת (Live Logic Tester)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              בדוק כיצד האפליקציה תפענח כל מילה או אסוציאציה מול המספר שתבחר, בדיוק כפי שהיא פועלת בעת עריכת שדות ב-Major וב-PAO.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* Controls */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                מספר לבדיקה (0 עד 99):
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                מילה / דמות / חפץ לבדיקה:
              </label>
              <input
                type="text"
                value={testWord}
                onChange={(e) => setTestWord(e.target.value)}
                placeholder="למשל: לוויתן, סוס, לב..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                מודולת הבדיקה:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestMode('major')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    testMode === 'major'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  שיטת מז׳ור
                </button>
                <button
                  type="button"
                  onClick={() => setTestMode('pao')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    testMode === 'pao'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  מודולת PAO
                </button>
              </div>
            </div>

            {/* Quick Test Pre-sets */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold block mb-1.5">דוגמאות לבדיקה מהירה:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { num: '0', word: 'לוויתן', desc: 'שגיאה (ל+ת=14 במקום 0)' },
                  { num: '0', word: 'סוס', desc: 'תקין (0)' },
                  { num: '14', word: 'לוויתן', desc: 'תקין ל-14 (ל+ת)' },
                  { num: '14', word: 'ילד', desc: 'תקין ל-14 (ל+ד)' },
                  { num: '14', word: 'לאונרדו דה וינצ\'י', desc: 'תקין ל-PAO (ל.ד)' },
                ].map((sample) => (
                  <button
                    key={sample.word + sample.num}
                    type="button"
                    onClick={() => {
                      setTestNumber(sample.num);
                      setTestWord(sample.word);
                    }}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-2 py-1 rounded-lg cursor-pointer"
                  >
                    {sample.word} ({sample.num})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Analysis Feedback */}
          <div className="md:col-span-2 space-y-4">
            {liveValidation ? (
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  liveValidation.isValid
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/25 border-rose-500/60 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {liveValidation.isValid ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <h3 className="text-base sm:text-lg font-black">
                    {liveValidation.isValid
                      ? 'האסוציאציה תקינה ועונה במדויק לחוקי הלוגיקה!'
                      : liveValidation.message}
                  </h3>
                </div>

                {liveValidation.details && (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mr-8">
                    {liveValidation.details}
                  </p>
                )}

                {/* Phonetic Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-bold block mb-1">ספרות צפויות לפי המספר:</span>
                    <span className="font-mono text-base font-black text-amber-400">
                      {liveValidation.expectedDigits?.join(', ') || testNumber}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-bold block mb-1">ספרות שפוענחו מתוך המילה:</span>
                    <span className="font-mono text-base font-black text-cyan-400">
                      {liveValidation.detectedDigits && liveValidation.detectedDigits.length > 0
                        ? liveValidation.detectedDigits.join(', ')
                        : 'ללא עיצורים'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm">
                הזן מספר ומילה לבדיקה
              </div>
            )}

            {/* Explanation box */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs text-slate-400 space-y-1.5 leading-relaxed">
              <span className="font-bold text-slate-300 block mb-1">
                💡 כיצד פועל מנוע הולידציה של האפליקציה?
              </span>
              <p>
                1. <strong>סינון אותיות קישור:</strong> המנוע מתעלם מאותיות הקישור ({connectingLetters.join(', ')}).
              </p>
              <p>
                2. <strong>פענוח עיצורים לספרות:</strong> כל אות שנשארה מתורגמת לספרה לפי הטבלה שלמעלה.
              </p>
              <p>
                3. <strong>השוואה מול המספר:</strong> אם מתקבלות ספרות אחרות או אם המילה אינה מתאימה לספרה (כמו ״לוויתן״ מול 0), קופצת התרעת ולידציה המונעת טעויות זיכרון.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

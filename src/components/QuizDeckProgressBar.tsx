import React, { useState } from 'react';
import { RotateCcw, CheckCircle2, Shuffle } from 'lucide-react';
import { DeckProgress } from '../lib/quizDeckManager';

interface QuizDeckProgressBarProps {
  progress: DeckProgress | null;
  onResetDeck: () => void;
  deckTitle?: string;
  className?: string;
}

export const QuizDeckProgressBar: React.FC<QuizDeckProgressBarProps> = ({
  progress,
  onResetDeck,
  deckTitle,
  className = '',
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!progress || progress.totalInCycle <= 0) {
    return null;
  }

  const percentage = Math.min(
    100,
    Math.max(0, Math.round((progress.currentQuestionNumber / progress.totalInCycle) * 100))
  );

  return (
    <div className={`space-y-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 sm:p-4 text-right ${className}`}>
      {/* Top row info */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-mono font-bold text-amber-400">
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>
              שאלה {progress.currentQuestionNumber} מתוך {progress.totalInCycle}
            </span>
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300 font-medium">
            סבב אקראי #{progress.cycleNumber}
          </span>
          {deckTitle && (
            <>
              <span className="text-slate-500 hidden sm:inline">·</span>
              <span className="text-slate-400 hidden sm:inline">{deckTitle}</span>
            </>
          )}
        </div>

        {/* Reset deck controls */}
        <div className="flex items-center gap-2">
          {showConfirmReset ? (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <span className="text-[11px] text-amber-300 font-medium">לאפס סבב?</span>
              <button
                type="button"
                onClick={() => {
                  onResetDeck();
                  setShowConfirmReset(false);
                }}
                className="text-[11px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded cursor-pointer transition-all"
              >
                אישור
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="text-[11px] text-slate-400 hover:text-white px-1 py-0.5 cursor-pointer"
              >
                ביטול
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="ערבב מחדש והתחל סבב חדש מהתחלה"
            >
              <RotateCcw className="w-3 h-3" />
              <span>אתחל סבב</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Cycle Guarantee Explanation & Completion Notification */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-1">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>סדר אקראי מלא ללא חזרות — כל ערך מוצג בדיוק פעם אחת לפני שמתחיל סבב חדש</span>
        </span>
        <span className="font-mono text-slate-400">
          נותרו {progress.remainingInCycle} שאלות בסבב
        </span>
      </div>

      {/* New cycle started celebration badge */}
      {progress.isNewCycleJustStarted && progress.cycleNumber > 1 && (
        <div className="mt-2 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl p-2.5 text-xs flex items-center gap-2 animate-fadeIn">
          <span>🎉</span>
          <span>
            כל הכבוד! עברת על כל {progress.totalInCycle} הערכים במאגר. כעת מתחיל סבב אקראי חדש (#{progress.cycleNumber}) בסדר מעורבב מחדש.
          </span>
        </div>
      )}
    </div>
  );
};

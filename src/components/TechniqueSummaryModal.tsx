import React, { useEffect } from 'react';
import {
  X,
  BookOpen,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Brain,
  Hash,
  User,
  Smile,
  Layers,
  Compass,
  ExternalLink,
} from 'lucide-react';
import { TECHNIQUE_SUMMARIES, TechniqueSummaryData } from '../data/techniqueSummaries';

interface TechniqueSummaryModalProps {
  techniqueId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTheory?: (chapterId: string) => void;
}

export const TechniqueSummaryModal: React.FC<TechniqueSummaryModalProps> = ({
  techniqueId,
  isOpen,
  onClose,
  onNavigateToTheory,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !techniqueId) return null;

  const data: TechniqueSummaryData | undefined = TECHNIQUE_SUMMARIES[techniqueId];
  if (!data) return null;

  const renderIcon = () => {
    switch (data.iconName) {
      case 'hash':
        return <Hash className="w-5 h-5 text-amber-400" />;
      case 'user':
        return <User className="w-5 h-5 text-indigo-400" />;
      case 'smile':
        return <Smile className="w-5 h-5 text-emerald-400" />;
      case 'layers':
        return <Layers className="w-5 h-5 text-yellow-400" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-teal-400" />;
      case 'book':
        return <BookOpen className="w-5 h-5 text-purple-400" />;
      case 'compass':
        return <Compass className="w-5 h-5 text-rose-400" />;
      default:
        return <Brain className="w-5 h-5 text-white" />;
    }
  };

  const getBorderColor = () => {
    switch (data.colorTheme) {
      case 'amber':
        return 'border-amber-500/40 shadow-amber-500/10';
      case 'indigo':
        return 'border-indigo-500/40 shadow-indigo-500/10';
      case 'emerald':
        return 'border-emerald-500/40 shadow-emerald-500/10';
      case 'yellow':
        return 'border-yellow-500/40 shadow-yellow-500/10';
      case 'teal':
        return 'border-teal-500/40 shadow-teal-500/10';
      case 'purple':
        return 'border-purple-500/40 shadow-purple-500/10';
      case 'rose':
        return 'border-rose-500/40 shadow-rose-500/10';
      default:
        return 'border-slate-700';
    }
  };

  const getTagBg = () => {
    switch (data.colorTheme) {
      case 'amber':
        return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
      case 'indigo':
        return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300';
      case 'emerald':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      case 'yellow':
        return 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300';
      case 'teal':
        return 'bg-teal-500/15 border-teal-500/30 text-teal-300';
      case 'purple':
        return 'bg-purple-500/15 border-purple-500/30 text-purple-300';
      case 'rose':
        return 'bg-rose-500/15 border-rose-500/30 text-rose-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className={`bg-white border rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative ${getBorderColor()}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              {renderIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getTagBg()}`}>
                  {data.categoryTag}
                </span>
                <span className="text-[10px] text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md font-mono">
                  סיכום ודוגמאות מעשיות
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">{data.title}</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{data.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="סגור חלון"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-right">
          {/* Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>עקרון הליבה של השיטה</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {data.overview}
            </p>
          </div>

          {/* Scientific Basis */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs sm:text-sm space-y-1.5">
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <Brain className="w-4 h-4" />
              <h4>התשתית הנוירוביולוגית והמדע מאחורי השיטה:</h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{data.scientificBasis}</p>
          </div>

          {/* Core Rules */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>חוקי הברזל ליישום מוצלח</span>
            </h3>
            <div className="space-y-2">
              {data.coreRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800"
                >
                  <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connecting Letters Note if available */}
          {data.connectingLettersNote && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-800 block mb-0.5">אותיות קישור "אני עונה":</strong>
                <span>{data.connectingLettersNote}</span>
              </div>
            </div>
          )}

          {/* Examples Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>דוגמאות מעשיות ליישום מהחיים:</span>
              </h3>
              <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                2 דוגמאות מפורטות
              </span>
            </div>

            <div className="space-y-4">
              {data.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center border border-indigo-200">
                        {idx + 1}
                      </span>
                      {ex.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      תרחיש אמיתי
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 italic">{ex.context}</p>

                  {/* Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {ex.steps.map((st, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-xs"
                      >
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                          {st.label}
                        </span>
                        <strong className="text-slate-900 font-mono">{st.value}</strong>
                      </div>
                    ))}
                  </div>

                  {/* Kinetic Scene */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 via-white to-indigo-50 rounded-xl border border-amber-300 text-xs text-amber-900 space-y-1">
                    <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                      ⚡ הסצנה הקינטית במוח:
                    </span>
                    <p className="font-medium leading-relaxed text-slate-800">{ex.kineticScene}</p>
                  </div>

                  {/* Takeaway */}
                  <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{ex.takeaway}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {onNavigateToTheory ? (
            <button
              onClick={() => {
                onClose();
                onNavigateToTheory(data.theoryTabId);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-300 transition-colors cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
              <span>עבור לפרק המלא באנציקלופדיית הזיכרון</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl btn-duo-green text-xs font-bold cursor-pointer"
          >
            הבנתי, חזור לאימון
          </button>
        </div>
      </div>
    </div>
  );
};

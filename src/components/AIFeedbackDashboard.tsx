import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  TrendingUp,
  Award,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Compass,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  Brain,
  History,
} from 'lucide-react';
import { AIFeedbackReport, TestResult } from '../types/memory';
import { UserProfileData } from '../lib/firebase';

interface AIFeedbackDashboardProps {
  feedbackReports: AIFeedbackReport[];
  isAnalyzing: boolean;
  onGenerateAnalysis: () => Promise<void>;
  testResults: TestResult[];
  profile: UserProfileData;
  onEarnPoints: (amount: number, reason?: string) => void;
}

export const AIFeedbackDashboard: React.FC<AIFeedbackDashboardProps> = ({
  feedbackReports,
  isAnalyzing,
  onGenerateAnalysis,
  testResults,
  profile,
  onEarnPoints,
}) => {
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);

  const currentReport = feedbackReports[selectedReportIndex] || feedbackReports[0];

  const handleRunAnalysis = async () => {
    await onGenerateAnalysis();
    onEarnPoints(20, 'קבלת משוב AI וניתוח קוגניטיבי');
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-3.5 py-1 rounded-full text-xs font-semibold">
              <Brain className="w-3.5 h-3.5" />
              <span>מערכת משוב נוירו-קוגניטיבית מבוססת Gemini AI</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              ניתוח ביצועים ומשוב טכניקות אישי
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              ה-AI מנתח את התרגילים שלך לאורך זמן, מזהה חוזקות וצווארי בקבוק (קינטיקה, פענוח פונטי,
              שליפה פעילה ועגינה מרחבית), ומעניק המלצות פעולה מדויקות ומעצימות.
            </p>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-500 to-teal-400 hover:from-indigo-400 hover:to-teal-300 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-xl shadow-indigo-500/20 text-sm transition-all disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                <span>מבצע ניתוח נוירונלי...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-slate-950" />
                <span>צור ניתוח ביצועים עדכני ב-AI</span>
              </>
            )}
          </button>
        </div>

        {/* History of Reports selector */}
        {feedbackReports.length > 1 && (
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto no-scrollbar">
            <span className="text-xs text-slate-400 font-medium ml-2 flex items-center gap-1">
              <History className="w-3.5 h-3.5" /> היסטוריית דוחות:
            </span>
            {feedbackReports.map((rep, idx) => (
              <button
                key={rep.id}
                onClick={() => setSelectedReportIndex(idx)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedReportIndex === idx
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                דו"ח {new Date(rep.createdAt).toLocaleDateString('he-IL')}
              </button>
            ))}
          </div>
        )}
      </div>

      {currentReport ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Executive Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-400 pb-3 border-b border-slate-800">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="font-extrabold text-white text-lg sm:text-xl">
                סיכום הערכה נוירו-קוגניטיבית
              </h2>
            </div>
            <p className="text-slate-200 leading-relaxed text-sm sm:text-base font-medium bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
              "{currentReport.executiveSummary}"
            </p>
          </div>

          {/* Cognitive Radar Metrics Bars */}
          {currentReport.cognitiveScores && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Activity className="w-5 h-5" />
                  <h3 className="font-extrabold text-white text-lg">
                    פרופיל יכולות וטכניקות זיכרון (Cognitive Matrix)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">סולם 0-100</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    title: 'ניווט מרחבי וארמונות זיכרון (Spatial Navigation)',
                    score: currentReport.cognitiveScores.spatialNavigation,
                    desc: 'שליטה ברצף תחנות ליניארי, מניעת רוויה והפעלת תאי מקום בהיפוקמפוס.',
                  },
                  {
                    title: 'קידוד קינטי והגזמה רגשית (Kinetic & Bizarre Encoding)',
                    score: currentReport.cognitiveScores.kineticEncoding,
                    desc: 'עוצמת התנועה, ההתנגשות, ההומור והאינטראקציה החושית בדימויים.',
                  },
                  {
                    title: 'פענוח פונטי ומספרים (Phonetic Decoding - Major & PAO)',
                    score: currentReport.cognitiveScores.phoneticDecoding,
                    desc: 'מהירות תרגום עיצורים למילים ודחיסת שלשות PAO ביחס 6:1.',
                  },
                  {
                    title: 'מהירות ודיוק שליפה פעילה (Active Recall Speed)',
                    score: currentReport.cognitiveScores.activeRecallSpeed,
                    desc: 'שליפה סמנטית עצמאית של אסוציאציות בשפה חופשית ללא רמזים.',
                  },
                  {
                    title: 'ייצוב סינפטי ושימור לטווח ארוך (Synaptic Consolidation & SRS)',
                    score: currentReport.cognitiveScores.longTermRetention,
                    desc: 'עמידות הזיכרון בפני עקומת השכחה הודות לחזרות מרווחות עקביות.',
                  },
                ].map((metric) => (
                  <div
                    key={metric.title}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-200 text-xs sm:text-sm">{metric.title}</h4>
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${getScoreColor(
                          metric.score
                        )}`}
                      >
                        {metric.score}/100
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full transition-all duration-700"
                        style={{ width: `${metric.score}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 leading-tight">{metric.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Growth Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Strengths */}
            <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-400 pb-3 border-b border-slate-800">
                <Award className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  חוזקות בולטות שהוכחו בביצועים
                </h3>
              </div>

              <div className="space-y-3">
                {currentReport.strengths.map((str, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Friction Points / Weaknesses */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 text-amber-400 pb-3 border-b border-slate-800">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  צווארי בקבוק ונקודות לחיזוק
                </h3>
              </div>

              <div className="space-y-3">
                {currentReport.weaknesses.map((weak, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-amber-950/20 border border-amber-500/20 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{weak}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actionable Recommendations Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 text-cyan-400 pb-3 border-b border-slate-800">
              <Lightbulb className="w-5 h-5" />
              <h3 className="font-extrabold text-white text-lg">
                המלצות פעולה מעשיות לאימונים הקרובים
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentReport.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-cyan-950/20 border border-cyan-800/40 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 space-y-1"
                >
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px] font-black">
                      {idx + 1}
                    </span>
                    <span>שלב אימון מומלץ</span>
                  </div>
                  <p className="pt-1 leading-relaxed text-slate-300">{rec}</p>
                </div>
              ))}
            </div>

            {/* Prescribed Training Plan */}
            {currentReport.nextTrainingPlan && (
              <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs sm:text-sm">
                <span className="font-black text-amber-400 block mb-1">
                  📅 תוכנית אימון שבועית מומלצת:
                </span>
                <p className="text-slate-300 leading-relaxed font-medium">
                  {currentReport.nextTrainingPlan}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Brain className="w-16 h-16 text-indigo-400 mx-auto opacity-70" />
          <h3 className="text-xl font-bold text-white">עדיין לא הופק ניתוח ביצועים</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            בצע כמה תרגילים בבוחן ה-AI החכם ובאימוני המספרים, ולאחר מכן לחץ על הכפתור כדי שה-AI
            ינתח את טכניקות הזיכרון שלך!
          </p>
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>בצע ניתוח ראשוני עכשיו</span>
          </button>
        </div>
      )}
    </div>
  );
};

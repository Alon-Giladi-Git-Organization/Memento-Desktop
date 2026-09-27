import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Send,
  Loader2,
  ArrowRight,
  RotateCw,
  Trophy,
  Lightbulb,
  History,
  Phone,
  Hash,
  User,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  MajorItem,
  PAOItem,
  PersonFaceCard,
  PersonalContactAssociation,
  MemoryPalace,
  TestResult,
} from '../types/memory';

interface SmartAITesterProps {
  majorItems: MajorItem[];
  paoItems: PAOItem[];
  peopleCards: PersonFaceCard[];
  personalAssociations: PersonalContactAssociation[];
  palaces: MemoryPalace[];
  testResults: TestResult[];
  onSaveTestResult: (result: Omit<TestResult, 'id' | 'timestamp'>) => void;
  onUpdatePersonalContactSuccess?: (id: string, isSuccess: boolean) => void;
}

type TestCategory = 'personal' | 'major' | 'pao' | 'names' | 'palace' | 'random';

export const SmartAITester: React.FC<SmartAITesterProps> = ({
  majorItems,
  paoItems,
  peopleCards,
  personalAssociations,
  palaces,
  testResults,
  onSaveTestResult,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>('personal');
  const [currentQuestion, setCurrentQuestion] = useState<{
    id: string;
    category: TestCategory;
    question: string;
    hint?: string;
    targetAssociation: string;
    context?: string;
    avatarUrl?: string;
  } | null>(null);

  const [userResponse, setUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    isCorrect: boolean;
    score: number;
    verdictTitle: string;
    explanation: string;
    memoryTip: string;
  } | null>(null);

  const [showHistory, setShowHistory] = useState(false);

  // Generate a new question based on the selected category
  const generateNewQuestion = (cat: TestCategory = selectedCategory) => {
    setEvaluation(null);
    setUserResponse('');

    let effectiveCat = cat;
    // Filter ready items for strict whitelist practice
    const readyMajor = majorItems.filter((i) => Boolean(i.is_ready_for_practice));
    const readyPAO = paoItems.filter((i) => Boolean(i.is_ready_for_practice));
    const readyPeople = peopleCards.filter((p) => Boolean(p.is_ready_for_practice));
    const readyPalaceLoci = palaces.flatMap((p) =>
      p.loci
        .filter((l) => l.is_ready_for_practice !== false)
        .map((l) => ({ ...l, palaceName: p.name }))
    );

    if (cat === 'random') {
      const pool: TestCategory[] = [];
      if (personalAssociations.length > 0) pool.push('personal');
      if (readyMajor.length > 0) pool.push('major');
      if (readyPAO.length > 0) pool.push('pao');
      if (readyPeople.length > 0) pool.push('names');
      if (readyPalaceLoci.length > 0) pool.push('palace');

      if (pool.length === 0) {
        // Default to major if nothing ready
        effectiveCat = 'major';
      } else {
        effectiveCat = pool[Math.floor(Math.random() * pool.length)];
      }
    }

    if (effectiveCat === 'personal') {
      if (personalAssociations.length === 0) {
        generateNewQuestion('major');
        return;
      }
      const item = personalAssociations[Math.floor(Math.random() * personalAssociations.length)];
      setCurrentQuestion({
        id: item.id,
        category: 'personal',
        question: `מהי האסוציאציה או התמונה המנטלית שקישרת ל: "${item.targetSubject}"?`,
        hint: `נתון מקורי: ${item.storedNumberOrFact} (שיטה: ${item.methodUsed})`,
        targetAssociation: item.encodedMnemonic,
        context: `זיכרון אישי עבור ${item.targetSubject}`,
      });
    } else if (effectiveCat === 'major') {
      const pool = readyMajor.length > 0 ? readyMajor : majorItems;
      const item = pool[Math.floor(Math.random() * pool.length)];
      const targetWord = item.userWord || item.defaultWord;
      setCurrentQuestion({
        id: `major-${item.number}`,
        category: 'major',
        question: `מהי המילה או התמונה המנמונית שקישרת למספר ${item.numberStr} (עיצורים: ${item.consonants})?`,
        hint: `מערכת ה-Major בעברית`,
        targetAssociation: `${targetWord}. ${item.imageHint}`,
        context: `ספרת Major ${item.numberStr}`,
      });
    } else if (effectiveCat === 'pao') {
      const pool = readyPAO.length > 0 ? readyPAO : paoItems;
      const item = pool[Math.floor(Math.random() * pool.length)];
      const person = item.userPerson || item.person;
      const action = item.userAction || item.action;
      const obj = item.userObject || item.object;
      setCurrentQuestion({
        id: `pao-${item.number}`,
        category: 'pao',
        question: `בשיטת PAO, מהי השלשה (אדם, פעולה, חפץ) המקושרת למספר ${item.numberStr}?`,
        hint: `דמות + פעולה קינטית + חפץ פסיבי`,
        targetAssociation: `אדם: ${person}, פעולה: ${action}, חפץ: ${obj}`,
        context: `PAO למספר ${item.numberStr}`,
      });
    } else if (effectiveCat === 'names') {
      const pool = readyPeople.length > 0 ? readyPeople : peopleCards;
      const person = pool[Math.floor(Math.random() * pool.length)];
      setCurrentQuestion({
        id: person.id,
        category: 'names',
        question: `איזו אסוציאציה ואיזה עוגן מורפולוגי קישרת לפנים של ${person.name} (${person.roleOrJob})?`,
        hint: `רמז: התבונן בפנים וחפש את העוגן וההתנגשות הקינטית`,
        targetAssociation: `עוגן: ${person.morphologicalAnchor}. מילת תחליף: ${person.substituteWord}. תסריט: ${person.mnemonicScene}`,
        avatarUrl: person.avatarUrl,
        context: `שם ופנים: ${person.name}`,
      });
    } else if (effectiveCat === 'palace') {
      if (readyPalaceLoci.length === 0) {
        generateNewQuestion('major');
        return;
      }
      const locus = readyPalaceLoci[Math.floor(Math.random() * readyPalaceLoci.length)];
      setCurrentQuestion({
        id: locus.id,
        category: 'palace',
        question: `בארמון "${locus.palaceName}", מה נמצא בתחנה מספר ${locus.stepNumber} (${locus.roomName} - ${locus.title})?`,
        hint: `מיקום: ${locus.positionDescription}`,
        targetAssociation: locus.storedContent || locus.title,
        context: `ארמון זיכרון תחנה ${locus.stepNumber}`,
      });
    }
  };

  // Run on mount if no question
  React.useEffect(() => {
    if (!currentQuestion) {
      generateNewQuestion();
    }
  }, [selectedCategory]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userResponse.trim() || !currentQuestion || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/evaluate-association', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          targetAssociation: currentQuestion.targetAssociation,
          userResponse: userResponse.trim(),
          context: currentQuestion.context,
        }),
      });

      const data = await res.json();
      setEvaluation(data);

      // Save to test results store
      onSaveTestResult({
        category: currentQuestion.category as any,
        question: currentQuestion.question,
        targetAssociation: currentQuestion.targetAssociation,
        userResponse: userResponse.trim(),
        isCorrect: data.isCorrect,
        score: data.score,
        verdictTitle: data.verdictTitle,
        explanation: data.explanation,
        memoryTip: data.memoryTip,
      });

      // Confetti burst for high scores
      if (data.score >= 75) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-slate-900">
      {/* Hero Header */}
      <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1 rounded-full text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>שליפה פעילה (Active Recall) ובדיקת שפה חופשית</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              בוחן האסוציאציות החכם ב-AI
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-xl font-medium">
              בדוק את זיכרון האסוציאציות האישיות שלך. ענה בשפה חופשית וטבעית — מנוע ה-AI ינתח את המהות
              הסמנטית והדימוי הוויזואלי ויקבע בדיוק אם השליפה המוטורית הצליחה!
            </p>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold border-2 border-slate-200 transition-colors self-start md:self-auto cursor-pointer shadow-2xs"
          >
            <History className="w-4 h-4 text-emerald-600" />
            <span>היסטוריית מבחנים ({testResults.length})</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500 self-center font-bold ml-1">בחר תחום לבחינה:</span>
          {[
            { id: 'personal', label: 'האסוציאציות האישיות שלי', icon: <Phone className="w-3.5 h-3.5" /> },
            { id: 'major', label: 'שיטת Major (ספרות 00-99)', icon: <Hash className="w-3.5 h-3.5" /> },
            { id: 'pao', label: 'שלשות PAO (אדם-פעולה-חפץ)', icon: <User className="w-3.5 h-3.5" /> },
            { id: 'names', label: 'שמות ופנים (עוגנים בפנים)', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'palace', label: 'ארמון הזיכרון (תחנות)', icon: <Compass className="w-3.5 h-3.5" /> },
            { id: 'random', label: 'מעורב אקראי (אתגר מאסטר)', icon: <Trophy className="w-3.5 h-3.5 text-[#FFC800]" /> },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id as TestCategory);
                generateNewQuestion(cat.id as TestCategory);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer active:translate-y-0.5 ${
                selectedCategory === cat.id
                  ? 'bg-[#58CC02]/20 text-[#46a302] border-2 border-[#58CC02] border-b-4 border-b-[#46a302] shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-2 border-slate-200 border-b-4 hover:bg-white'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Testing Card */}
      {currentQuestion && (
        <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Question Banner */}
          <div className="flex flex-col sm:flex-row items-start gap-4 pb-4 border-b-2 border-slate-200">
            {currentQuestion.avatarUrl ? (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#58CC02] shadow-md shrink-0">
                <img
                  src={currentQuestion.avatarUrl}
                  alt="Target"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 bg-white/95 text-[10px] text-[#46a302] font-black px-1.5 py-0.5 rounded-lg border border-[#58CC02]/40 shadow-xs">
                  עוגן מורפולוגי
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 shrink-0">
                <HelpCircle className="w-7 h-7" />
              </div>
            )}

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#58CC02] uppercase tracking-wider">
                  משימת שליפה פעילה
                </span>
                <button
                  onClick={() => generateNewQuestion()}
                  className="btn-duo-neutral flex items-center gap-1 text-xs px-3 py-1 cursor-pointer"
                  title="החלף שאלה"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>שאלה אחרת</span>
                </button>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                {currentQuestion.question}
              </h2>

              {currentQuestion.hint && (
                <p className="text-xs text-slate-600 bg-slate-50 inline-block px-3 py-1 rounded-xl border border-slate-200 font-medium">
                  💡 {currentQuestion.hint}
                </p>
              )}
            </div>
          </div>

          {/* User Input Form */}
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                התשובה שלך בשפה חופשית (תאר את הדימוי, התנועה, העוגן, האדם או הפעולה שנזכרת בהם):
              </label>
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (userResponse.trim() && !isLoading && evaluation === null) {
                      handleSubmitAnswer(e);
                    }
                  }
                }}
                placeholder="למשל: דמיינתי פיל ענק שמתנגש בטירה ומפוצץ אותה עם פטיש כבד..."
                rows={3}
                disabled={isLoading || evaluation !== null}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#58CC02] transition-all disabled:opacity-60"
              />
            </div>

            {/* Actions */}
            {!evaluation ? (
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-500 font-medium">
                  * ה-AI בודק התאמה סמנטית ואינו מחייב ניסוח אות-באות.
                </p>
                <button
                  type="submit"
                  disabled={!userResponse.trim() || isLoading}
                  className="btn-duo-green flex items-center gap-2 px-6 py-2.5 text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>מנתח שליפה נוירו-קוגניטיבית...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>בדוק את התשובה שלי</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => generateNewQuestion()}
                  className="btn-duo-blue flex items-center gap-2 px-6 py-2.5 text-xs cursor-pointer shadow-xs"
                >
                  <span>לשאלה הבאה</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            )}
          </form>

          {/* AI Evaluation Box */}
          {evaluation && (
            <div
              className={`rounded-2xl p-5 border-2 transition-all animate-fadeIn ${
                evaluation.isCorrect
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-amber-50 border-amber-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {evaluation.isCorrect ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {evaluation.verdictTitle}
                    </h3>
                    <p className="text-xs text-slate-700 mt-0.5 font-medium">{evaluation.explanation}</p>
                  </div>
                </div>

                {/* Score Ring */}
                <div className="text-center px-3 py-1.5 rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs">
                  <div className="text-xl font-black text-emerald-600">{evaluation.score}</div>
                  <div className="text-[10px] text-slate-500 font-bold">ציון שליפה</div>
                </div>
              </div>

              {/* Reveal Reference Target */}
              <div className="mt-4 pt-4 border-t border-slate-200 bg-white/70 rounded-xl p-3 text-xs">
                <span className="font-bold text-slate-600 ml-1">האסוציאציה השמורה במקור:</span>
                <span className="text-amber-800 font-bold">{currentQuestion.targetAssociation}</span>
              </div>

              {/* Cognitive Tip */}
              {evaluation.memoryTip && (
                <div className="mt-3 flex items-start gap-2 text-xs text-cyan-900 bg-cyan-50 border border-cyan-200 rounded-xl p-3 font-medium">
                  <Lightbulb className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">טיפ מנטור לחיזוק הסינפסות: </span>
                    {evaluation.memoryTip}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Modal / Drawer */}
      {showHistory && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">היסטוריית בדיקות הזיכרון שלך</h3>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              סגור
            </button>
          </div>

          {testResults.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              טרם בוצעו מבחנים. התחל לענות על שאלות למעלה!
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {testResults.slice(0, 15).map((res) => (
                <div
                  key={res.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{res.question}</span>
                    <span
                      className={`font-black px-2 py-0.5 rounded text-[11px] ${
                        res.score >= 70
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {res.score}/100
                    </span>
                  </div>
                  <p className="text-slate-600">
                    <span className="font-medium text-slate-500 ml-1">התשובה שלך:</span>
                    "{res.userResponse}"
                  </p>
                  <p className="text-emerald-700 text-[11px] font-medium">{res.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  GraduationCap,
  Brain,
  Compass,
  Zap,
  Clock,
  Layers,
  Award,
  BookOpen,
  Hash,
  User,
  Smile,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface TheorySectionProps {
  onNavigateToTable?: () => void;
  initialTab?: string;
}

export const TheorySection: React.FC<TheorySectionProps> = ({ onNavigateToTable, initialTab }) => {
  const [activeTab, setActiveTab] = useState<
    'major' | 'pao' | 'palaces' | 'names' | 'pegs' | 'kinetic' | 'neuroscience'
  >((initialTab as any) || 'major');

  React.useEffect(() => {
    if (
      initialTab &&
      ['major', 'pao', 'palaces', 'names', 'pegs', 'kinetic', 'neuroscience'].includes(initialTab)
    ) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden text-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-1 rounded-full text-xs font-bold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>אנציקלופדיית המנמוניקה • מדריך השיטות והמדע</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900">
              המדריך המקיף לשיטות הזיכרון של אלופי העולם
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
              הסבר מפורט, שלב-אחר-שלב, על כל שיטה ושיטה: מנגנון הפעולה הפונטי, חוקי הקידוד המדויקים,
              ארכיטקטורת ארמונות זיכרון, והתשתית הנוירוביולוגית מאחוריהם.
            </p>
          </div>
        </div>

        {/* Chapters navigation */}
        <div className="flex items-center gap-1.5 mt-8 pt-4 border-t border-slate-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'major', label: '1. שיטת ה-Major (00-100)', icon: <Hash className="w-3.5 h-3.5" /> },
            { id: 'pao', label: '2. שלשות PAO (6:1)', icon: <User className="w-3.5 h-3.5" /> },
            { id: 'palaces', label: '3. ארמונות זיכרון (Loci)', icon: <Compass className="w-3.5 h-3.5" /> },
            { id: 'names', label: '4. שמות ופנים', icon: <Smile className="w-3.5 h-3.5" /> },
            { id: 'pegs', label: '5. מתלי צורה וגוף', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'kinetic', label: '6. חוקי הקידוד הקינטי', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'neuroscience', label: '7. המדע והמוח (נובל)', icon: <Brain className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
                activeTab === tab.id
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CHAPTER 1: MAJOR SYSTEM */}
      {activeTab === 'major' && (
        <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn text-slate-900">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                שיטת ה-Major למספרים בעברית (המרה פונטית 00-100)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                השיטה הוותיקה והיציבה ביותר בעולם לשינון מספרים ארוכים, תאריכים וקודים
              </p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
            <h3 className="text-base font-bold text-amber-700">💡 מדוע מספרים קשים כל כך לזיכרון?</h3>
            <p>
              המוח האנושי התפתח במשך מאות אלפי שנים לזכור <strong>מרחבים, תמונות וסכנות</strong>, ולא
              סמלים מופשטים כמו 7, 4 או 9. שיטת ה-Major פותחה במאה ה-17 על ידי סטניסלאוס מינק פון וונסהיים
              ושוכללה לאורך השנים (והותאמה לעברית על ידי ערן כץ ומומחי זיכרון). הרעיון המרכזי:
              <strong> כל ספרה (0 עד 9) מתורגמת לצליל עיצור קבוע</strong>.
            </p>
            <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sky-800">💡 חוק "אותיות הקישור" (ללא ספרה):</span>
                <span className="font-mono font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
                  א', ה', ו', י, נ', ע'
                </span>
                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  ביטוי עזר אנגרמתי לזיכרון: "אני עונה"
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                לאותיות אלו אין שיוך מספרי. הן משמשות חופשי כחומרי הדבקה וקישור. כל מילות המאגר מורכבות <strong>אך ורק</strong> מעיצורי המספר עצמו + אותיות הקישור הללו.
              </p>
            </div>
          </div>

          {/* Consonants Table */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-amber-700">
              📜 מפתח העיצורים המותאם (0 עד 9):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  num: '0',
                  consonants: 'ס, ז, שׂ',
                  hint: 'צליל שורק (Zero). האות ס\' עגולה כמו הספרה 0.',
                  word: 'סוס',
                },
                {
                  num: '1',
                  consonants: 'ל',
                  hint: 'אות למ"ד. ברומית L שווה 50, צורתה קו אנכי עם בסיס.',
                  word: 'לב',
                },
                {
                  num: '2',
                  consonants: 'ב, פ (דגושה)',
                  hint: 'צליל B/P דגושות. ב\' היא האות השנייה באלפבית.',
                  word: 'פה',
                },
                {
                  num: '3',
                  consonants: 'כ, ק, ג',
                  hint: 'צלילי G/K גרוניות-חיכיות. ג\' היא האות השלישית.',
                  word: 'כוס',
                },
                {
                  num: '4',
                  consonants: 'ט, ת, ד',
                  hint: 'אותיות דנטליות (D/T). ד\' היא האות הרביעית באלפבית.',
                  word: 'תה',
                },
                {
                  num: '5',
                  consonants: 'ח',
                  hint: 'האות ח\' גרונית חמה (ח"י = 5 בשיטה המותאמת).',
                  word: 'חי',
                },
                {
                  num: '6',
                  consonants: 'שׁ, צ\', ג\'',
                  hint: 'צליל שורק עמוק Sh/Ts/Ch. המילה "שש" מתחילה בש\'.',
                  word: 'אש',
                },
                {
                  num: '7',
                  consonants: 'ר',
                  hint: 'צליל רי"ש רוטט.',
                  word: 'אור',
                },
                {
                  num: '8',
                  consonants: 'מ',
                  hint: 'אות מ"ם שפתית מהדהדת.',
                  word: 'ים',
                },
                {
                  num: '9',
                  consonants: 'פ, ב (רפה)',
                  hint: 'צליל F/V שפתי רפה. צורת 9 מזכירה פ\' בכתב.',
                  word: 'אף',
                },
              ].map((item) => (
                <div
                  key={item.num}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 hover:border-amber-400 hover:bg-white transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center border border-amber-300">
                      {item.num}
                    </span>
                    <span className="text-slate-900 font-black text-base">{item.consonants}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{item.hint}</p>
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-lg font-medium">
                    דוגמאות למילים: <strong>{item.word}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* How to use for numbers */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-amber-700">
              🛠️ חוקי הברזל לבניית מילים מ-2 ספרות (00 עד 99):
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 list-disc list-inside">
              <li>
                <strong>סדר העיצורים קובע:</strong> המספר <strong>14</strong> חייב להתחיל בעיצור של 1 (ט/ד/ת) ולהסתיים בעיצור של 4 (ר). למשל: <strong>טירה</strong> (ט + ר).
              </li>
              <li>
                <strong>אותיות אהו"י שקופות:</strong> האותיות א', ה', ו', י' (כאשר אינן עיצוריות) אינן נספרות ויכולות להופיע בכל מקום כדי לחבר מילה הגיונית.
              </li>
              <li>
                <strong>אותיות כפולות נספרות פעם אחת:</strong> במילה "סוס" יש שתי סמ"ך (ס + ס), ולכן היא מייצגת <strong>00</strong>.
              </li>
              <li>
                <strong>הצמדה קינטית:</strong> המילה שנבחרה חייבת להעלות מיד דימוי חזותי עז (סיר מרק רותח שמתפוצץ, טירת ברקים).
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-xs sm:text-sm text-amber-900 flex items-center justify-between">
            <div>
              <strong className="text-amber-800 block mb-0.5">איפה הרשימה המלאה עם כל 100 המספרים?</strong>
              <span>
                הרשימה המלאה (00-99) מובנית באפליקציה בתוך לשונית <strong>מרכז האימונים &gt; שיטת Major</strong>,
                שם תוכל לחפש, לסנן לפי עשרות, לערוך כל מילה ולהתאים אותה לטעמך האישי!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER 2: PAO SYSTEM */}
      {activeTab === 'pao' && (
        <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn text-slate-900">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                שיטת שלשות PAO (Person - Action - Object)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                נשק המחץ של אלופי העולם: דחיסת 6 ספרות לתמונה מנטלית יחידה (יחס דחיסה 6:1)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
            <h3 className="text-base font-bold text-indigo-700">💡 מהו עקרון ה-PAO?</h3>
            <p>
              לכל מספר דו-ספרתי (00 עד 99) מוצמדת שלשה קבועה:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-50 p-4 rounded-2xl border border-indigo-200">
                <span className="text-xs text-amber-800 font-bold block mb-1">1. דמות (Person)</span>
                <p className="text-xs text-slate-600">אדם מפורסם, דמות קולנועית או קרוב משפחה ייחודי.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-indigo-200">
                <span className="text-xs text-indigo-800 font-bold block mb-1">2. פעולה (Action)</span>
                <p className="text-xs text-slate-600">תנועה פיזית מובהקת ואינטנסיבית (בועט, יורה, מגלף, רוכב).</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-indigo-200">
                <span className="text-xs text-teal-800 font-bold block mb-1">3. חפץ (Object)</span>
                <p className="text-xs text-slate-600">חפץ מוחשי ספציפי (לוח שחור, כדורסל בוער, גלימת עטלף).</p>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">דוגמה מעשית: שינון רצף של 6 ספרות: 15-23-83</h4>
              <p className="text-xs text-slate-600">
                במקום לזכור 6 ספרות נפרדות, מחלקים אותן לזוגות:
              </p>
              <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                <li>ספרות 15 (הדמות): <strong>אלברט איינשטיין</strong></li>
                <li>ספרות 23 (הפעולה): <strong>מזנק ומטביע בהטבעה אדירה לתוך...</strong></li>
                <li>ספרות 83 (החפץ): <strong>בובת פינוקיו מעץ!</strong></li>
              </ul>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 text-xs font-semibold">
                ⚡ הסצנה המאוחדת: "אלברט איינשטיין מזנק באוויר ורומס בהטבעה כדורסלנית לתוך בובת פינוקיו מעץ!"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER 3: MEMORY PALACES */}
      {activeTab === 'palaces' && (
        <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn text-slate-900">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-black">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                ארכיטקטורת ארמונות זיכרון (Method of Loci)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                טכניקת היסוד של יוון ורומא העתיקה המבוססת על תאי המקום בהיפוקמפוס
              </p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
            <h3 className="text-base font-bold text-rose-700">🏰 חמשת חוקי הברזל לבניית ארמון מושלם:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: '1. חוק המסלול בכיוון השעון',
                  desc: 'התחנות בחדר חייבות להיקבע לפי כיוון סיבוב השעון בלבד. לעולם אל תחצה חדר באלכסון או תלך קדימה-אחורה.',
                },
                {
                  title: '2. חוק חמש התחנות (5 Loci Rule)',
                  desc: 'בכל חדר מקצים בדיוק 5 תחנות עוגן (4 פינות/קירות + מרכז החדר). דיוק זה מונע עומס קוגניטיבי.',
                },
                {
                  title: '3. חוק העוגן הפיזי המוגדר',
                  desc: 'התחנה חייבת להיות חפץ דומם יציב ובגובה העיניים: מנעול הדלת, פינת שולחן הקפה, מסך הטלוויזיה, ידית הארון.',
                },
                {
                  title: '4. מניעת רוויה והתאבכות (Anti-Ghosting)',
                  desc: 'לאחר שימוש בארמון למידע זמני, תן לו "לנוח" 24 שעות כדי שהדימויים הקודמים יתפוגגו לפני שתציב בו מידע חדש.',
                },
              ].map((rule) => (
                <div key={rule.title} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
                  <h4 className="font-bold text-slate-900 text-sm">{rule.title}</h4>
                  <p className="text-xs text-slate-600 font-medium">{rule.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER 4: NAMES & FACES */}
      {activeTab === 'names' && (
        <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn text-slate-900">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-black">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                האלגוריתם לזכירת שמות ופנים (עוגנים מורפולוגיים)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                איך לזכור עשרות אנשים באירוע או פגישה עסקית ללא היסוס
              </p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-emerald-200 space-y-2 shadow-2xs">
                <span className="text-xs font-black text-emerald-700">שלב 1: איתור עוגן מורפולוגי</span>
                <p className="text-xs text-slate-600 font-medium">
                  הבט באדם וחפש את התו הבולט ביותר בפניו: גבות עבות, אף נשרי, סנטר מחורץ, שומה, תסרוקת ייחודית או חיוך רחב.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-emerald-200 space-y-2 shadow-2xs">
                <span className="text-xs font-black text-cyan-700">שלב 2: מילת תחליף פונטית (Substitute)</span>
                <p className="text-xs text-slate-600 font-medium">
                  המר את השם הפרטי לחפץ ממשי שנשמע דומה: דני &rarr; דונאטס; רונן &rarr; רימון; אורית &rarr; אור / פנס; אילן &rarr; אילן / עץ.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-emerald-200 space-y-2 shadow-2xs">
                <span className="text-xs font-black text-amber-700">שלב 3: התנגשות קינטית</span>
                <p className="text-xs text-slate-600 font-medium">
                  הדבק את החפץ ישירות על העוגן בפנים בפעולה מוגזמת: אם לדני יש גבות עבות, דמיין דונאטס מצופים שוקולד נתקעים לו בגבות ונמסים!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER 5: PEGS */}
      {activeTab === 'pegs' && (
        <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn text-slate-900">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 flex items-center justify-center font-black">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                שיטות המתלים (Peg Systems)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                מתלי צורת ספרה (0-9) ומתלי 10 תחנות הגוף לשינון רשימות קצרות ומשימות יומיות
              </p>
            </div>
          </div>

          <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
            <p>
              במקום לבנות ארמון זיכרון שלם, מתלים מספקים "קולבים מנטליים" מוכנים מראש. מתלי צורת הספרה מבוססים על הדמיון הוויזואלי של צורת הספרה לחפץ ממשי:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { n: '0', s: 'גלגל / ביצה' },
                { n: '1', s: 'חנית / נר' },
                { n: '2', s: 'ברבור במים' },
                { n: '3', s: 'אזיקים / שחף' },
                { n: '4', s: 'סירת מפרש' },
                { n: '5', s: 'עוגן פלדה' },
                { n: '6', s: 'מנעול תלייה' },
                { n: '7', s: 'גרזן קרב' },
                { n: '8', s: 'שעון חול' },
                { n: '9', s: 'בלון על חוט' },
              ].map((p) => (
                <div key={p.n} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                  <span className="text-amber-700 font-black text-lg block">{p.n}</span>
                  <span className="text-xs text-slate-900 font-bold">{p.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER 6: KINETIC RULES */}
      {activeTab === 'kinetic' && (
        <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn text-slate-900">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-black">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                חוקי הקידוד הקינטי וההגזמה הרגשית (Bizarre & Vivid)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                התכונות שהופכות דימוי מנטלי לבלתי נשכח עבור האמיגדלה וההיפוקמפוס
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
              <span className="font-bold text-orange-700 block">1. תנועה ומהירות (Action & Motion)</span>
              <p className="text-slate-600">תמונות סטטיות נשכחות. דימוי חייב לנוע, לזנק, להסתובב, ליפול או להתרסק.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
              <span className="font-bold text-orange-700 block">2. שבירה והרס (Destruction)</span>
              <p className="text-slate-600">התנפצות זכוכית, פיצוץ, התבקעות סלעים או שריפה מפעילים רפלקס אבולוציוני של תשומת לב.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
              <span className="font-bold text-orange-700 block">3. חוסר פרופורציה (Exaggerated Scale)</span>
              <p className="text-slate-600">הגדל חפצים לממדי ענק מפלצתיים (עט בגודל בניין עזריאלי) או כווץ אותם לגודל של נמלה.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 shadow-2xs">
              <span className="font-bold text-orange-700 block">4. חושים מרובים (Multi-Sensory)</span>
              <p className="text-slate-600">הוסף קול חזק, ריח חריף (וואסאבי, עשן), טעם מוזר ותחושת מגע (קור מקפיא, חום צורב).</p>
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER 7: NEUROSCIENCE */}
      {activeTab === 'neuroscience' && (
        <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn text-slate-900">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-black">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                התשתית המדעית והמחקרית של אומנות הזיכרון
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                סקירה אקדמית של מנגנוני ההיפוקמפוס, תאי מקום, קידוד כפול וייצוב סינפטי
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <Compass className="w-4 h-4" />
                <h3>תאי מקום ורשת (Place & Grid Cells) • פרס נובל 2014</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                מחקריהם של ג'ון או'קיף, מאי-בריט מוזר ואדווארד מוזר חשפו את "ה-GPS הפנימי של המוח".
                תאי מקום בהיפוקמפוס יורים בדיוק מופלא כשאדם נמצא במיקום פיזי מוכר. שיטת המקומות (ארמונות
                זיכרון) "רוכבת" על רשת נוירונלית עתיקה זו וממירה נתונים מופשטים לעוגנים גאוגרפיים
                בלתי נמחקים.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <Brain className="w-4 h-4" />
                <h3>מחקרי אלינור מגווייר (נהגי המוניות של לונדון)</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                מחקרי fMRI ו-MRI של פרופ' מגווייר מאוניברסיטת UCL הדגימו פלסטיות מוחית יוצאת דופן: נהגי
                מוניות ואלופי זיכרון מציגים התעבות מובהקת של ההיפוקמפוס האחורי. בדיקות fMRI הראו כי
                אלופי עולם אינם בעלי IQ חריג, אלא מפעילים באופן שיטתי אזורי ניווט מרחבי בזמן שינון.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <Layers className="w-4 h-4" />
                <h3>תאוריית הקידוד הכפול (Dual Coding Theory)</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                אלן פייביו (Allan Paivio) הוכיח שמידע הנקלט הן בערוץ הוורבלי-לשוני והן בערוץ החזותי-תמונתי
                נשמר ביציבות גבוהה פי 3. מערכות ה-Major וה-PAO ממירות מספרים עיוורים למילים בעלות תמונה
                מוחשית קינטית, וכך מייצרות קישור כפול המאפשר שליפה משני הנתיבים בו-זמנית.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Clock className="w-4 h-4" />
                <h3>חזרות מרווחות (SRS) והגברה ארוכת-טווח (LTP)</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                עקומת השכחה של הרמן אבינגהאוס מראה איבוד של 70% מהחומר תוך 24 שעות ללא חזרה. חזרה
                במרווחים הולכים וגדלים (SRS) מפעילה שחרור גלוטמט וקולטני NMDA, המובילים ל-Long-Term
                Potentiation (LTP) וקיבוע הזיכרון בקליפת המוח (Autonomous Semanticization).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

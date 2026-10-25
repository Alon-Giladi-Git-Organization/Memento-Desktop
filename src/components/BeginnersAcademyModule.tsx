import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Hash,
  User,
  Compass,
  Smile,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Play,
  Trophy,
  RotateCcw,
  BookOpen,
  Zap,
  Eye,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MajorItem, PAOItem, MemoryPalace, PersonFaceCard } from '../types/memory';
import { soundEffects } from '../lib/soundEffects';

export type AcademyTrackId = 'major' | 'pao' | 'palaces' | 'names';
type LessonStepPhase = 'theory' | 'demo' | 'practice' | 'completed';

interface MicroDrillQuestion {
  id: string;
  prompt: string;
  highlightBadge?: string;
  subPrompt?: string;
  options: {
    id: string;
    label: string;
    subLabel?: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

interface AcademyLesson {
  id: string;
  trackId: AcademyTrackId;
  lessonNumber: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  theoryParagraphs: string[];
  keyTakeaway: string;
  demoTitle: string;
  demoDescription: string;
  demoType:
    | 'major-digits-0-4'
    | 'major-digits-5-9'
    | 'major-word-builder'
    | 'pao-initials'
    | 'pao-person-action-link'
    | 'pao-6digit-compressor'
    | 'palace-clockwise-room'
    | 'palace-station-collision'
    | 'names-substitute-word'
    | 'names-face-anchor-fusion';
  drills: MicroDrillQuestion[];
}

interface BeginnersAcademyModuleProps {
  majorDigits: MajorItem[];
  connectingLetters: string[];
  majorItems: MajorItem[];
  paoItems: PAOItem[];
  palaces: MemoryPalace[];
  peopleCards: PersonFaceCard[];
  onEarnPoints: (amount: number, reason: string) => void;
  onUnlockBadge: (badge: string) => void;
  onNavigateToPractice: (target: 'major' | 'pao' | 'palaces' | 'names' | 'logic') => void;
}

const COMPLETED_LESSONS_STORAGE_KEY = 'mem_beginners_academy_completed_v1';

export const BeginnersAcademyModule: React.FC<BeginnersAcademyModuleProps> = ({
  majorDigits,
  connectingLetters,
  onEarnPoints,
  onUnlockBadge,
  onNavigateToPractice,
}) => {
  // Helper to get user's live consonant mapping for any digit 0-9
  const getDigitConsonants = (digit: number): string => {
    const found = majorDigits.find((d) => d.number === digit);
    return found?.consonants || String(digit);
  };

  const getDigitWord = (digit: number): string => {
    const found = majorDigits.find((d) => d.number === digit);
    return found?.defaultWord || '';
  };

  const getPrimaryLetter = (digit: number): string => {
    const raw = getDigitConsonants(digit);
    const match = raw.match(/[\u0590-\u05FF]/);
    return match ? match[0] : 'ס';
  };

  const connLettersStr = connectingLetters.length > 0 ? connectingLetters.join(', ') : 'א, ה, ו, י, נ, ע';

  // Build lessons dynamically so they always reflect the user's live Numbers Logic mapping
  const lessons: AcademyLesson[] = useMemo(() => {
    const l0 = getDigitConsonants(0);
    const l1 = getDigitConsonants(1);
    const l2 = getDigitConsonants(2);
    const l3 = getDigitConsonants(3);
    const l4 = getDigitConsonants(4);
    const l5 = getDigitConsonants(5);
    const l6 = getDigitConsonants(6);
    const l7 = getDigitConsonants(7);
    const l8 = getDigitConsonants(8);
    const l9 = getDigitConsonants(9);

    const p0 = getPrimaryLetter(0);
    const p1 = getPrimaryLetter(1);
    const p2 = getPrimaryLetter(2);
    const p3 = getPrimaryLetter(3);
    const p4 = getPrimaryLetter(4);
    const p8 = getPrimaryLetter(8);

    return [
      // =======================================================================
      // TRACK 1: THE MAJOR SYSTEM (שיטת ה-MAJOR)
      // =======================================================================
      {
        id: 'major-1',
        trackId: 'major',
        lessonNumber: 1,
        title: 'שפת הסתרים של המספרים (ספרות 0 עד 4)',
        subtitle: 'איך מתרגמים ספרות יבשות לצלילים ועיצורים שהמוח זוכר בקלות',
        estimatedMinutes: 3,
        theoryParagraphs: [
          'המוח האנושי לא תוכנן לזכור מספרים מופשטים כמו 42 או 13, אבל הוא אלוף בלזכור תמונות של חפצים מוחשיים. שיטת ה-Major פותרת את הבעיה הזו באמצעות כלל אחד פשוט: לכל ספרה (מ-0 עד 9) יש צליל עיצור קבוע משלה.',
          `בחלק הראשון נכיר את 5 הספרות הראשונות (0 עד 4) לפי הגדרות הלוגיקה שלך: 0 = ${l0} | 1 = ${l1} | 2 = ${l2} | 3 = ${l3} | 4 = ${l4}. כשאתה רואה ספרה, אתה מיד שומע בראש את האות שלה!`,
        ],
        keyTakeaway: `לכל ספרה יש עיצור קבוע: 0 (${l0}), 1 (${l1}), 2 (${l2}), 3 (${l3}), 4 (${l4}).`,
        demoTitle: 'הדגמה אינטראקטיבית: לחץ על ספרה כדי לחשוף את העיצור והטריק לזכירתה',
        demoDescription: 'לחץ על כל אחת מהספרות 0–4 כדי לראות איך הצורה או הצליל שלה מתחברים לעיצור:',
        demoType: 'major-digits-0-4',
        drills: [
          {
            id: 'm1-q1',
            prompt: 'איזה עיצור שייך לספרה 0 בשיטת ה-Major?',
            highlightBadge: '0',
            subPrompt: 'רמז: חשוב על הצליל השורק של המילה Zero או על הצורה העגולה.',
            options: [
              {
                id: 'a',
                label: l0,
                subLabel: `למשל במילה "${getDigitWord(0) || 'סוס'}"`,
                isCorrect: true,
                feedback: `מדויק! הספרה 0 ממופה לעיצור ${l0} (צליל שורק עגול כמו באנגלית Zero).`,
              },
              {
                id: 'b',
                label: l1,
                subLabel: 'קו אנכי גבוה',
                isCorrect: false,
                feedback: `לא מדויק – האות ${l1} שייכת לספרה 1. הספרה 0 ממופה ל-${l0}.`,
              },
              {
                id: 'c',
                label: l2,
                subLabel: 'האות השנייה באלפבית',
                isCorrect: false,
                feedback: `לא מדויק – האות ${l2} שייכת לספרה 2. הספרה 0 ממופה ל-${l0}.`,
              },
              {
                id: 'd',
                label: l4,
                subLabel: 'האות הרביעית באלפבית',
                isCorrect: false,
                feedback: `לא מדויק – ${l4} שייכים לספרה 4. הספרה 0 ממופה ל-${l0}.`,
              },
            ],
          },
          {
            id: 'm1-q2',
            prompt: 'איזה עיצור שייך לספרה 2?',
            highlightBadge: '2',
            subPrompt: 'רמז: זכור את מיקום האות באלפבית העברי (א׳ = 1, ב׳ = 2).',
            options: [
              {
                id: 'a',
                label: l1,
                isCorrect: false,
                feedback: `האות ${l1} שייכת לספרה 1 (דומה לקו אנכי). לספרה 2 שייך העיצור ${l2}.`,
              },
              {
                id: 'b',
                label: l2,
                isCorrect: true,
                feedback: `נכון מאוד! הספרה 2 ממופה לעיצור ${l2} (כמו במילה "${getDigitWord(2) || 'בננה'}").`,
              },
              {
                id: 'c',
                label: l3,
                isCorrect: false,
                feedback: `העיצורים ${l3} שייכים לספרה 3 (ג׳ בגימטריה = 3). לספרה 2 שייך ${l2}.`,
              },
              {
                id: 'd',
                label: l0,
                isCorrect: false,
                feedback: `העיצור ${l0} שייך לספרה 0. לספרה 2 שייך העיצור ${l2}.`,
              },
            ],
          },
          {
            id: 'm1-q3',
            prompt: 'אם אתה רואה את המספר הדו-ספרתי 14, אילו שני עיצורים (משמאל לימין) מרכיבים אותו?',
            highlightBadge: '14',
            subPrompt: 'קרא את הספרה הראשונה (1) ואז את הספרה השנייה (4).',
            options: [
              {
                id: 'a',
                label: `${p1} ואז ${p4}`,
                subLabel: 'למשל במילה "ילד"',
                isCorrect: true,
                feedback: `אלוף! ספרה 1 היא ${p1} וספרה 4 היא ${p4}, ולכן 14 נותן את העיצורים ${p1}+${p4} (כמו במילה "ילד").`,
              },
              {
                id: 'b',
                label: `${p2} ואז ${p3}`,
                subLabel: 'למשל במילה "בנק"',
                isCorrect: false,
                feedback: `${p2} ו-${p3} מייצגים את המספר 23. עבור 14 אנו צריכים את העיצור של 1 (${p1}) והעיצור של 4 (${p4}).`,
              },
              {
                id: 'c',
                label: `${p0} ואז ${p1}`,
                subLabel: 'למשל במילה "סל"',
                isCorrect: false,
                feedback: `${p0} ו-${p1} מייצגים את המספר 01 ("סל"). עבור 14 אנו צריכים ${p1} ואז ${p4}.`,
              },
              {
                id: 'd',
                label: `${p4} ואז ${p1}`,
                subLabel: 'למשל במילה "דלי"',
                isCorrect: false,
                feedback: `שים לב לסדר! ${p4} ואז ${p1} זה המספר 41 ("דלי"). במספר 14 הספרה 1 באה ראשונה ולכן ${p1} לפני ${p4}.`,
              },
            ],
          },
        ],
      },
      {
        id: 'major-2',
        trackId: 'major',
        lessonNumber: 2,
        title: 'השלמת מפת הצלילים (ספרות 5 עד 9)',
        subtitle: 'משלימים את כל 10 הספרות כדי שנוכל לקודד כל מספר בעולם',
        estimatedMinutes: 3,
        theoryParagraphs: [
          `עכשיו כששלטת בספרות 0 עד 4, נשלים את החצי השני של המפה (ספרות 5 עד 9): 5 = ${l5} | 6 = ${l6} | 7 = ${l7} | 8 = ${l8} | 9 = ${l9}.`,
          'ברגע שיש לך בראש את 10 הצלילים האלו, כל מספר – מתאריך היסטורי ועד קוד כספת – הופך מיד לרצף של אותיות עבריות שאפשר להרכיב מהן מילים!',
        ],
        keyTakeaway: `החצי השני של המפה: 5 (${l5}), 6 (${l6}), 7 (${l7}), 8 (${l8}), 9 (${l9}).`,
        demoTitle: 'הדגמה אינטראקטיבית: מפת 5 עד 9 והקשר הוויזואלי שלהן',
        demoDescription: 'לחץ על כל ספרה מ-5 עד 9 כדי לגלות את הטריק המהיר לזכירת העיצור שלה:',
        demoType: 'major-digits-5-9',
        drills: [
          {
            id: 'm2-q1',
            prompt: 'איזה עיצור שייך לספרה 7?',
            highlightBadge: '7',
            subPrompt: 'רמז: דמיין את צורת הספרה 7 כמקל או בומרנג הפוך של האות ר׳.',
            options: [
              {
                id: 'a',
                label: l5,
                isCorrect: false,
                feedback: `האות ${l5} שייכת לספרה 5 (חמש מתחילה בח׳). לספרה 7 שייך העיצור ${l7}.`,
              },
              {
                id: 'b',
                label: l7,
                isCorrect: true,
                feedback: `בול! הספרה 7 ממופה לעיצור ${l7} (כמו במילה "${getDigitWord(7) || 'נר'}").`,
              },
              {
                id: 'c',
                label: l8,
                isCorrect: false,
                feedback: `האות ${l8} שייכת לספרה 8. לספרה 7 שייך העיצור ${l7}.`,
              },
              {
                id: 'd',
                label: l9,
                isCorrect: false,
                feedback: `האות ${l9} שייכת לספרה 9 (צורת 9 הפוכה ל-פ׳). לספרה 7 שייך העיצור ${l7}.`,
              },
            ],
          },
          {
            id: 'm2-q2',
            prompt: 'איזה עיצור שייך לספרה 8?',
            highlightBadge: '8',
            subPrompt: 'רמז: המילה "שמונה" מדגישה את הצליל מ׳ במרכזה.',
            options: [
              {
                id: 'a',
                label: l8,
                isCorrect: true,
                feedback: `מצוין! הספרה 8 ממופה לעיצור ${l8} (כמו במילה "${getDigitWord(8) || 'ים'}").`,
              },
              {
                id: 'b',
                label: l6,
                isCorrect: false,
                feedback: `העיצורים ${l6} שייכים לספרה 6 ("שש"). לספרה 8 שייך העיצור ${l8}.`,
              },
              {
                id: 'c',
                label: l5,
                isCorrect: false,
                feedback: `האות ${l5} שייכת לספרה 5 ("חמש"). לספרה 8 שייך העיצור ${l8}.`,
              },
              {
                id: 'd',
                label: l9,
                isCorrect: false,
                feedback: `האות ${l9} שייכת לספרה 9. לספרה 8 שייך העיצור ${l8}.`,
              },
            ],
          },
          {
            id: 'm2-q3',
            prompt: 'איזו ספרה מיוצגת על ידי העיצור פ׳ (רפה או דגושה)?',
            highlightBadge: 'פ',
            subPrompt: 'רמז: הבט בצורה העגולה של האות פ׳ בכתב יד.',
            options: [
              {
                id: 'a',
                label: '5',
                isCorrect: false,
                feedback: `הספרה 5 מיוצגת על ידי ${l5}. האות פ׳ מייצגת את הספרה 9.`,
              },
              {
                id: 'b',
                label: '6',
                isCorrect: false,
                feedback: `הספרה 6 מיוצגת על ידי ${l6}. האות פ׳ מייצגת את הספרה 9.`,
              },
              {
                id: 'c',
                label: '9',
                isCorrect: true,
                feedback: `נכון מאוד! האות פ׳ מייצגת את הספרה 9 (למשל במילה "${getDigitWord(9) || 'אף'}").`,
              },
              {
                id: 'd',
                label: '7',
                isCorrect: false,
                feedback: `הספרה 7 מיוצגת על ידי ${l7}. האות פ׳ מייצגת את הספרה 9.`,
              },
            ],
          },
        ],
      },
      {
        id: 'major-3',
        trackId: 'major',
        lessonNumber: 3,
        title: 'חוק "אותיות החיבור" ובניית חפצים מוחשיים',
        subtitle: 'איך מחברים עיצורים למילה אמיתית של חפץ בעזרת אותיות הדבק השקופות',
        estimatedMinutes: 4,
        theoryParagraphs: [
          `איך הופכים שני עיצורים כמו ס׳ (0) ו-ר׳ (7) למילה אמיתית? כאן נכנסות "אותיות החיבור השקופות": [${connLettersStr}] (סימן זיכרון קל: המשפט "אני עונה").`,
          'לאותיות החיבור אין שום ערך מספרי! מותר לשבץ אותן חופשי לפני, באמצע או אחרי עיצורי המספר כדי ליצור שם של חפץ פיזי מוחשי. למשל: 0 (ס) + אות חיבור (י) + 7 (ר) = "סיר"!',
        ],
        keyTakeaway: `מילת Major חוקית מורכבת אך ורק מעיצורי המספר + אותיות החיבור השקופות (${connLettersStr}), וחייבת לתאר חפץ מוחשי!`,
        demoTitle: 'מעבדת בניית מילים: ראה איך אותיות החיבור מדביקות עיצורים לחפץ',
        demoDescription: 'בחר דוגמה כדי לראות איך המערכת מפרקת מילה לעיצורים (בעלי ערך מספרי) ואותיות חיבור (שקופות):',
        demoType: 'major-word-builder',
        drills: [
          {
            id: 'm3-q1',
            prompt: 'איזו מהמילים הבאות היא מילת Major חוקית עבור הספרה 2 (עיצור ב׳ בלבד)?',
            highlightBadge: '2 (ב)',
            subPrompt: `זכור: מותר להשתמש רק בעיצור ב׳ ובאותיות החיבור (${connLettersStr}), והמילה חייבת להיות חפץ מוחשי.`,
            options: [
              {
                id: 'a',
                label: 'בננה',
                subLabel: 'ב + נ + נ + ה',
                isCorrect: true,
                feedback: 'מדויק! במילה "בננה" יש את העיצור ב׳ (2), והאותיות נ׳ ו-ה׳ הן אותיות חיבור שקופות מתוך "אני עונה". בנוסף, בננה היא חפץ מוחשי!',
              },
              {
                id: 'b',
                label: 'ברז',
                subLabel: 'ב + ר + ז',
                isCorrect: false,
                feedback: 'שגוי! במילה "ברז" מופיעים גם העיצורים ר׳ (7) ו-ז׳ (0), ולכן היא בכלל מייצגת 270 ולא את הספרה 2.',
              },
              {
                id: 'c',
                label: 'בלון',
                subLabel: 'ב + ל + ו + ן',
                isCorrect: false,
                feedback: 'שגוי עבור 2! במילה "בלון" מופיע גם העיצור ל׳ (1), ולכן "בלון" מייצג את המספר הדו-ספרתי 21.',
              },
              {
                id: 'd',
                label: 'בני',
                subLabel: 'שם פרטי / שייכות',
                isCorrect: false,
                feedback: 'שים לב: למרות שהאותיות תואמות, במערכת ה-Major אנו בוחרים אך ורק חפצים ועצמים פיזיים מוחשיים (כמו "בננה" או "אבן") ולא שמות פרטיים.',
              },
            ],
          },
          {
            id: 'm3-q2',
            prompt: 'איזה מספר דו-ספרתי מקודד בתוך החפץ "לפיד"?',
            highlightBadge: 'לפיד',
            subPrompt: 'סנן החוצה את אותיות החיבור השקופות (י׳) ובדוק את שני העיצורים שנשארו: ל׳ ואז פ׳ (+ ד׳ אם סופרים 2 עיצורים ראשונים, או בדוק איזו מילה מתאימה ל-19: "לפה" / "אלוף"). בוא נבדוק את המילה "סולם" או "כלב" — רגע, איזה מספר מייצגת המילה "סיר"?',
            options: [
              {
                id: 'a',
                label: '07 (ס + ר)',
                subLabel: 'ס (0) + י (חיבור) + ר (7)',
                isCorrect: true,
                feedback: 'נכון מאוד! במילה "סיר", האות י׳ היא אות חיבור שקופה, ס׳ = 0 ו-ר׳ = 7, ולכן "סיר" מייצג בדיוק את המספר 07!',
              },
              {
                id: 'b',
                label: '70 (ר + ס)',
                subLabel: 'הפוך בסדר האותיות',
                isCorrect: false,
                feedback: 'כמעט! קוראים מימין לשמאל: ס׳ מופיעה ראשונה (0) ו-ר׳ שנייה (7), ולכן זה 07 ולא 70.',
              },
              {
                id: 'c',
                label: '17 (ל + ר)',
                subLabel: 'כמו במילה "לירה"',
                isCorrect: false,
                feedback: '17 מתחיל בעיצור ל׳ (1). המילה "סיר" מתחילה ב-ס׳ (0) ולכן היא 07.',
              },
              {
                id: 'd',
                label: '01 (ס + ל)',
                subLabel: 'כמו במילה "סל"',
                isCorrect: false,
                feedback: '01 מסתיים ב-ל׳ ("סל"). המילה "סיר" מסתיימת ב-ר׳ (7) ולכן היא 07.',
              },
            ],
          },
        ],
      },

      // =======================================================================
      // TRACK 2: THE PAO SYSTEM (שיטת ה-PAO)
      // =======================================================================
      {
        id: 'pao-1',
        trackId: 'pao',
        lessonNumber: 1,
        title: 'מהי שלשת PAO ואיך בוחרים דמות (Person)?',
        subtitle: 'הכרת שלושת המרכיבים: אדם (Person), פעולה (Action), חפץ (Object) וחוק ראשי התיבות',
        estimatedMinutes: 3,
        theoryParagraphs: [
          'שיטת PAO לוקחת את שיטת ה-Major צעד אחד קדימה: במקום שלכל מספר דו-ספרתי (00–99) יהיה רק חפץ אחד, אנחנו מצמידים לכל מספר שלשה קבועה: אדם מפורסם או דמות מוכרת (Person), פעולה שהוא מבצע (Action), וחפץ מוחשי (Object).',
          `איך זוכרים איזה אדם שייך לאיזה מספר? לפי ראשי התיבות שלו! השם הפרטי מתחיל בעיצור של ספרת העשרות, ושם המשפחה בעיצור של ספרת היחידות. למשל עבור 00 (${p0}.${p0}.): סילבסטר סטאלון. עבור 14 (${p1}.${p4}.): ליאונרדו דיקפריו.`,
        ],
        keyTakeaway: 'בשדה "אדם" ב-PAO, ראשי התיבות של השם הפרטי ושם המשפחה תואמים לשתי הספרות של המספר!',
        demoTitle: 'הדגמה אינטראקטיבית: מפענח ראשי התיבות של דמויות PAO',
        demoDescription: 'לחץ על כל מספר כדי לראות איך שתי הספרות הופכות לראשי תיבות של דמות בלתי נשכחת:',
        demoType: 'pao-initials',
        drills: [
          {
            id: 'p1-q1',
            prompt: `עבור המספר 00 (עיצור ${p0} ואז עיצור ${p0}), איזו דמות מתאימה לפי חוק ראשי התיבות?`,
            highlightBadge: `00 (${p0}.${p0}.)`,
            subPrompt: `חפש שם פרטי ושם משפחה שמתחילים שניהם באותיות של הספרה 0 (${l0}).`,
            options: [
              {
                id: 'a',
                label: 'סילבסטר סטאלון',
                subLabel: 'ס.ס. (00)',
                isCorrect: true,
                feedback: 'בול! סילבסטר (ס = 0) סטאלון (ס = 0) נותן ראשי תיבות ס.ס. שמתאימים בדיוק למספר 00!',
              },
              {
                id: 'b',
                label: 'אלברט איינשטיין',
                subLabel: 'א.א.',
                isCorrect: false,
                feedback: 'האות א׳ היא אות חיבור חסרת ערך מספרי. עבור 00 אנו צריכים ראשי תיבות ס.ס. כמו סילבסטר סטאלון.',
              },
              {
                id: 'c',
                label: 'בראד פיט',
                subLabel: 'ב.פ. (29)',
                isCorrect: false,
                feedback: 'בראד (ב = 2) פיט (פ = 9) שייך למספר 29, לא ל-00.',
              },
              {
                id: 'd',
                label: 'ליאונרדו דיקפריו',
                subLabel: 'ל.ד. (14)',
                isCorrect: false,
                feedback: 'ליאונרדו (ל = 1) דיקפריו (ד = 4) שייך למספר 14.',
              },
            ],
          },
          {
            id: 'p1-q2',
            prompt: `הדמות "ביל גייטס" (ראשי תיבות ב.ג.) מייצגת איזה מספר דו-ספרתי?`,
            highlightBadge: 'ביל גייטס (ב.ג.)',
            subPrompt: `זכור: ב׳ = 2, ג׳ = 3.`,
            options: [
              {
                id: 'a',
                label: '23',
                subLabel: 'ב (2) + ג (3)',
                isCorrect: true,
                feedback: 'מצוין! ביל (ב = 2) גייטס (ג = 3) מתרגם ישירות למספר 23!',
              },
              {
                id: 'b',
                label: '32',
                subLabel: 'ג (3) + ב (2)',
                isCorrect: false,
                feedback: 'שים לב לסדר! השם הפרטי "ביל" מתחיל ב-ב׳ (2) ושם המשפחה "גייטס" ב-ג׳ (3), לכן זה 23 ולא 32.',
              },
              {
                id: 'c',
                label: '13',
                subLabel: 'ל (1) + ג (3)',
                isCorrect: false,
                feedback: '13 הוא ל.ג. (למשל ליידי גאגא). ביל גייטס (ב.ג.) הוא 23.',
              },
              {
                id: 'd',
                label: '28',
                subLabel: 'ב (2) + מ (8)',
                isCorrect: false,
                feedback: '28 הוא ב.מ. (למשל ברונו מארס). ביל גייטס (ב.ג.) הוא 23.',
              },
            ],
          },
        ],
      },
      {
        id: 'pao-2',
        trackId: 'pao',
        lessonNumber: 2,
        title: 'קישור פעולה מאפיינת לדמות (Action) ובחירת חפץ (Object)',
        subtitle: 'איך בוחרים פועל שמתחבר טבעית לדמות כדי שלא נצטרך לשנן אותו בכוח',
        estimatedMinutes: 4,
        theoryParagraphs: [
          'הסוד הגדול של PAO הוא שאתה לא צריך לשנן את הפעולה בנפרד! הפעולה (Action) חייבת להיות הפעולה הכי מזוהה ואופיינית לדמות שבחרת. כשחושבים על סילבסטר סטאלון (רוקי), מיד רואים אותו "מתאגרף". כשחושבים על ליאונרדוו דיקפריו (טיטאניק), מיד רואים אותו "פורש ידיים על חרטום ספינה".',
          'והחפץ (Object)? הוא נבנה בדיוק לפי חוק ה-Major שלמדנו (עיצורי המספר + אותיות החיבור בלבד). כך כל שלשת PAO יושבת על היגיון ברזל!',
        ],
        keyTakeaway: 'הפעולה חייבת לאפיין באופן מובהק את הדמות, והחפץ בנוי מעיצורי המספר + אותיות החיבור.',
        demoTitle: 'הדגמה אינטראקטיבית: חיבור דמות לפעולה המאפיינת שלה',
        demoDescription: 'בחר דמות וראה כיצד הפעולה שלה נובעת ממנה באופן אוטומטי ללא מאמץ שינון:',
        demoType: 'pao-person-action-link',
        drills: [
          {
            id: 'p2-q1',
            prompt: 'לפניך הדמות של מספר 00: "סילבסטר סטאלון" (רוקי בלבואה). איזו פעולה (Action) הכי כדאי לקשר אליו כדי שהמוח ישלוף אותה בשבריר שנייה?',
            highlightBadge: '👤 סילבסטר סטאלון',
            subPrompt: 'בחר בפעולה הפיזית והדינמית שמאפיינת את הדמות באופן מובהק:',
            options: [
              {
                id: 'a',
                label: 'מתאגרף בעוצמה',
                subLabel: 'פעולה מזוהה ישירות עם רוקי',
                isCorrect: true,
                feedback: 'מדויק! ברגע שתחשוב על סילבסטר סטאלון, המוח שלך ישלוף מיד את הפעולה "מתאגרף" בלי שום מאמץ!',
              },
              {
                id: 'b',
                label: 'סורג סוודר',
                subLabel: 'פעולה אקראית ללא קשר לדמות',
                isCorrect: false,
                feedback: 'פעולה אקראית כמו "סורג" תדרוש ממך שינון מלאכותי וקשה. תמיד בחר פעולה שמאפיינת את הדמות עצמה, כמו "מתאגרף"!',
              },
              {
                id: 'c',
                label: 'חושב בשקט',
                subLabel: 'פעולה פסיבית וחסרת תנועה',
                isCorrect: false,
                feedback: 'פעולה פסיבית ומופשטת כמו "חושב" נעלמת מהזיכרון. ב-PAO אנו חייבים פעולה פיזית, דינמית ומזוהה עם הדמות!',
              },
              {
                id: 'd',
                label: 'ממתין בתור',
                subLabel: 'סטטי וחסר ייחוד',
                isCorrect: false,
                feedback: 'חסר תנועה ואינו מאפיין את סטאלון. "מתאגרף בעוצמה" יוצר קישור אוטומטי וקינטי!',
              },
            ],
          },
          {
            id: 'p2-q2',
            prompt: 'לפניך הדמות של מספר 18 (ל.מ.): "ליונל מסי". איזו פעולה (Action) תיצור את הקישור החזק והטבעי ביותר?',
            highlightBadge: '👤 ליונל מסי',
            subPrompt: 'איזו תנועה אקטיבית מזוהה מיד עם מסי?',
            options: [
              {
                id: 'a',
                label: 'מבשל מרק',
                isCorrect: false,
                feedback: 'אין קשר מובהק למסי ולכן תתקשה לשלוף זאת בזמן אמת.',
              },
              {
                id: 'b',
                label: 'מכדרר ובועט לחיבורים',
                isCorrect: true,
                feedback: 'מעולה! "מכדרר ובועט" מאפיין את ליונל מסי באופן מוחלט ויוצר תנועה קינטית חזקה בסצנה.',
              },
              {
                id: 'c',
                label: 'מנגן בכינור',
                isCorrect: false,
                feedback: 'פעולה זו אינה קשורה למסי. תמיד בחר בפעולה שמאפיינת את הדמות!',
              },
              {
                id: 'd',
                label: 'ישן על ספה',
                isCorrect: false,
                feedback: 'פעולה סטטית ולא אופיינית. "מכדרר ובועט" היא הפעולה המושלמת למסי.',
              },
            ],
          },
        ],
      },
      {
        id: 'pao-3',
        trackId: 'pao',
        lessonNumber: 3,
        title: 'קסם הדחיסה 6:1 ועקרון ה-SEE ליצירת סצנה',
        subtitle: 'איך הופכים 6 ספרות לתמונה קולנועית אחת מוגזמת ובלתי נשכחת',
        estimatedMinutes: 4,
        theoryParagraphs: [
          'עכשיו מגיע הקסם האמיתי של אלופי העולם בזיכרון: איך זוכרים מספר בן 6 ספרות כמו 00-14-21 בתמונה אחת בלבד? מחלקים אותו ל-3 זוגות! הזוג הראשון (00) נותן רק את האדם, הזוג השני (14) נותן רק את הפעולה, והזוג השלישי (21) נותן רק את החפץ!',
          'כדי שהסצנה תיצרב במוח, אנו משתמשים בעקרון ה-SEE: חושים מרובים (Senses – רעש, ריח, מגע), רגש קיצוני והומור פרוע (Emotion), והגזמת פרופורציות (Exaggeration) על רקע נקי (אפקט פון רסטורף).',
        ],
        keyTakeaway: 'בכל רצף של 6 ספרות: זוג ראשון = אדם (P), זוג שני = פעולה (A), זוג שלישי = חפץ (O)!',
        demoTitle: 'סימולטור דחיסת 6 ספרות (PAO 6:1)',
        demoDescription: 'לחץ על חלקי המספר הדו-ספרתיים וראה איך 6 ספרות מתמזגות לסצנה קולנועית אחת:',
        demoType: 'pao-6digit-compressor',
        drills: [
          {
            id: 'p3-q1',
            prompt: 'נתון המספר בן 6 הספרות: 00-18-07. אם 00 = סילבסטר סטאלון (אדם), 18 = מכדרר ובועט (פעולה), ו-07 = סיר (חפץ) – איזו סצנה מקודדת את 00-18-07?',
            highlightBadge: '00 - 18 - 07',
            subPrompt: 'זכור את הסדר הקבוע: אדם (מ-00) -> פעולה (מ-18) -> חפץ (מ-07).',
            options: [
              {
                id: 'a',
                label: 'סילבסטר סטאלון מכדרר ובועט בעוצמה בסיר ענק שמתפוצץ!',
                subLabel: 'אדם (00) + פעולה (18) + חפץ (07)',
                isCorrect: true,
                feedback: 'מושלם! תמונה אחת של סטאלון (00) בועט (18) בסיר (07) שומרת בזיכרון שלך 6 ספרות שלמות במכה אחת!',
              },
              {
                id: 'b',
                label: 'ליונל מסי מתאגרף עם סיר',
                subLabel: 'אדם (18) + פעולה (00) + חפץ (07)',
                isCorrect: false,
                feedback: 'שים לב לסדר הזוגות! מסי (18) ומתאגרף (00) יתנו את המספר 18-00-07 במקום 00-18-07.',
              },
              {
                id: 'c',
                label: 'סילבסטר סטאלון מתאגרף עם כדורגל',
                subLabel: 'חסר החפץ של 07',
                isCorrect: false,
                feedback: 'כאן השתמשת בפעולה של 00 במקום של 18, ולא כללת את החפץ של 07 ("סיר").',
              },
              {
                id: 'd',
                label: 'סיר עומד בשקט על המדף במטבח',
                subLabel: 'ללא דמות וללא פעולה',
                isCorrect: false,
                feedback: 'תמונה זו כוללת רק את 07 ("סיר") וחסרה את הדמות (00) והפעולה (18), וגם אינה מקיימת את עקרון התנועה וההגזמה.',
              },
            ],
          },
          {
            id: 'p3-q2',
            prompt: 'לפי עקרון ה-SEE ליצירת סצנה מנמונית, איזה תיאור ייחקק במוח בצורה החזקה ביותר?',
            highlightBadge: 'עקרון ה-SEE',
            subPrompt: 'Senses (חושים), Emotion (רגש/הומור), Exaggeration (הגזמה ותנועה).',
            options: [
              {
                id: 'a',
                label: 'האדם מחזיק את החפץ בידו ועומד בחדר עמוס ברהיטים, תמונות ושטיחים.',
                isCorrect: false,
                feedback: 'עמידה סטטית נשכחת מהר, ורקע עמוס בפרטים מיותרים פוגע במיקוד (אפקט פון רסטורף).',
              },
              {
                id: 'b',
                label: 'הדמות מנפצת את החפץ העצום לרסיסים בקול נפץ אדיר, עם ריח עשן חריף והומור אבסורדי על רקע נקי!',
                isCorrect: true,
                feedback: 'מדויק! שילוב של תנועה מתפרצת, הגזמת גודל, קול וריח (חושים) על רקע נקי מפעיל את ההיפוקמפוס והאמיגדלה בעוצמה מרבית!',
              },
              {
                id: 'c',
                label: 'שינון המילים בעל פה עשר פעמים ברציפות ללא דמיון חזותי.',
                isCorrect: false,
                feedback: 'שינון תוכי מכאני מתפוגג תוך דקות. המוח זוכר חוויות רב-חושיות ומוגזמות!',
              },
              {
                id: 'd',
                label: 'ציור החפץ בגודל זעיר ובשחור-לבן ללא תנועה.',
                isCorrect: false,
                feedback: 'דימוי קטן, אפור וסטטי אינו מעורר קשב במוח. הגזמה וצבעוניות הן המפתח!',
              },
            ],
          },
        ],
      },

      // =======================================================================
      // TRACK 3: MEMORY PALACES (ארמונות זיכרון)
      // =======================================================================
      {
        id: 'palaces-1',
        trackId: 'palaces',
        lessonNumber: 1,
        title: 'ה-GPS של המוח: מהו ארמון זיכרון וחוק כיוון השעון',
        subtitle: 'איך רותמים את הבית שאתה כבר מכיר כדי לזכור עשרות פריטים לפי הסדר',
        estimatedMinutes: 3,
        theoryParagraphs: [
          'אם אבקש ממך לעצום עיניים ולטייל בדמיון מדלת הכניסה של הבית שלך אל הסלון והמטבח – תוכל לתאר עשרות רהיטים וחפצים לפי הסדר בלי שום מאמץ. למה? כי בהיפוקמפוס במוח יש "תאי מקום" (תגלית זוכת פרס נובל) שנועדו לזכור מסלולים פיזיים!',
          'בשיטת "ארמון הזיכרון" (Method of Loci), אנחנו בוחרים 5 רהיטים או חפצים קבועים בכל חדר (שנקראים "תחנות" או Loci) ותמיד צועדים ביניהם בכיוון השעון (או משמאל לימין בכניסה לחדר) כדי שהסדר לעולם לא יתבלבל.',
        ],
        keyTakeaway: 'ארמון זיכרון הוא מקום אמיתי שאתה מכיר היטב, שבו בוחרים 5 תחנות קבועות בכל חדר לפי כיוון השעון.',
        demoTitle: 'הדגמה אינטראקטיבית: סיור ב-5 תחנות הסלון לפי כיוון השעון',
        demoDescription: 'לחץ על התחנות בסלון לפי המסלול (1 עד 5) כדי להבין איך בונים מסלול יציב:',
        demoType: 'palace-clockwise-room',
        drills: [
          {
            id: 'pal1-q1',
            prompt: 'מדוע בארמון זיכרון אנחנו תמיד קובעים את התחנות בחדר לפי כיוון קבוע (כיוון השעון) ולא קופצים באקראי מצד לצד?',
            highlightBadge: '🧭 חוק כיוון השעון',
            subPrompt: 'חשוב מה קורה בזמן שליפה כשמנסים להיזכר מה הייתה תחנה מספר 3.',
            options: [
              {
                id: 'a',
                label: 'כדי שהמוח יוכל לשחזר את המסלול בסדר מדויק (1->2->3->4->5) בלי לדלג על אף תחנה',
                isCorrect: true,
                feedback: 'נכון מאוד! מסלול רציף בכיוון השעון מבטיח שתמיד תדע בדיוק מה התחנה הבאה ומה התחנה הקודמת, ואפילו תוכל לצעוד בארמון מהסוף להתחלה!',
              },
              {
                id: 'b',
                label: 'כי אסור להשתמש ברהיטים שנמצאים בצד ימין של החדר',
                isCorrect: false,
                feedback: 'מותר ורצוי להשתמש בכל הרהיטים סביב החדר! פשוט מגיעים אליהם ברצף מסודר בכיוון השעון.',
              },
              {
                id: 'c',
                label: 'כי ארמון זיכרון חייב להיות אך ורק חדר עגול',
                isCorrect: false,
                feedback: 'כל חדר רגיל (מרובע או מלבני) מתאים מצוין – פשוט סורקים את קירותיו ופינותיו בכיוון סיבוב השעון.',
              },
              {
                id: 'd',
                label: 'אין לכך שום חשיבות, עדיף לבחור תחנות באקראי בכל פעם',
                isCorrect: false,
                feedback: 'בחירה אקראית גורמת לבלבול ולשכחת תחנות. קביעות המסלול היא סוד הכוח של ארמון הזיכרון!',
              },
            ],
          },
          {
            id: 'pal1-q2',
            prompt: 'איזה מהפריטים הבאים הוא "תחנה" (Locus) מצוינת ויציבה בתוך ארמון זיכרון?',
            highlightBadge: 'בחירת תחנה',
            subPrompt: 'תחנה טובה חייבת להיות חפץ/רהיט פיזי קבוע וייחודי בחדר.',
            options: [
              {
                id: 'a',
                label: 'ספת העור הגדולה בסלון',
                subLabel: 'רהיט קבוע, ברור ומוחשי',
                isCorrect: true,
                feedback: 'מצוין! ספת העור בסלון היא עצם פיזי גדול, קבוע וברור בעיני הרוח – תחנה מושלמת!',
              },
              {
                id: 'b',
                label: 'האוויר באמצע החדר',
                subLabel: 'חסר צורה ומוחשיות',
                isCorrect: false,
                feedback: 'אוויר ריק אינו נותן לעיני הרוח שום עוגן להצמיד אליו את המידע. תמיד בחר חפץ או רהיט מוחשי!',
              },
              {
                id: 'c',
                label: 'זבוב שעף לרגע בחדר',
                subLabel: 'זמני ומשתנה',
                isCorrect: false,
                feedback: 'תחנה בארמון חייבת להיות קבועה במקומה תמיד כשאתה מדמיין את החדר.',
              },
              {
                id: 'd',
                label: 'שלושה כיסאות זהים לחלוטין שעומדים יחד',
                subLabel: 'כפילות מבלבלת',
                isCorrect: false,
                feedback: 'אם שתי תחנות נראות בדיוק אותו דבר, המוח יתבלבל ביניהן. כל תחנה צריכה להיות ייחודית (למשל: דלת כניסה -> ספה -> טלוויזיה).',
              },
            ],
          },
        ],
      },
      {
        id: 'palaces-2',
        trackId: 'palaces',
        lessonNumber: 2,
        title: 'הצבת מידע בתחנות ושליפה מהירה',
        subtitle: 'איך "מדביקים" את המידע שרוצים לזכור אל התחנה בארמון',
        estimatedMinutes: 4,
        theoryParagraphs: [
          'אחרי שיש לנו מסלול של תחנות (למשל: 1. דלת הכניסה, 2. ספת הסלון, 3. מסך הטלוויזיה), איך שומרים בהן מידע? אם נניח את החפץ בצורה רגילה ושקטה, נשכח אותו. לכן יוצרים "התנגשות קינטית" בין הפריט שרוצים לזכור לבין התחנה עצמה!',
          'לדוגמה, אם צריך לזכור לקנות (1) חלב, (2) בננות, ו-(3) לחם: בדלת הכניסה (תחנה 1) מתנפץ בקבוק חלב ענק ומציף את המנעול; על ספת הסלון (תחנה 2) קופצת בננה ענקית וקורעת את הכריות; ומתוך מסך הטלוויזיה (תחנה 3) פורצת כיכר לחם לוהטת ומעלה עשן ריחני!',
        ],
        keyTakeaway: 'אל תניח פריטים בפסיביות על התחנה – גרום לפריט להתנגש, לשבור או להפעיל את התחנה עצמה!',
        demoTitle: 'הדגמה אינטראקטיבית: הצבה ושליפה מ-3 תחנות בארמון',
        demoDescription: 'ראה איך 3 פריטים מוצבים ב-3 תחנות הסלון, ואז נסה לשלוף אותם מתוך התחנות:',
        demoType: 'palace-station-collision',
        drills: [
          {
            id: 'pal2-q1',
            prompt: 'בהדגמה שלמדנו כרגע: מה הצבנו בתחנה מספר 2 ("ספת הסלון")?',
            highlightBadge: 'תחנה #2: ספת הסלון',
            subPrompt: 'חזור בעיני רוחך אל ספת הסלון והיזכר מה קפץ עליה וקרע את הכריות.',
            options: [
              {
                id: 'a',
                label: 'בננה ענקית',
                isCorrect: true,
                feedback: 'ראית כמה זה קל?! ברגע שדמיינת את ספת הסלון, הבננה שקופצת עליה מיד קפצה לך לראש!',
              },
              {
                id: 'b',
                label: 'בקבוק חלב',
                isCorrect: false,
                feedback: 'בקבוק החלב התנפץ בתחנה מספר 1 (דלת הכניסה). על ספת הסלון (תחנה 2) קפצה בננה ענקית!',
              },
              {
                id: 'c',
                label: 'כיכר לחם לוהטת',
                isCorrect: false,
                feedback: 'כיכר הלחם פרצה מתוך תחנה מספר 3 (מסך הטלוויזיה). בתחנה 2 (הספה) הייתה בננה ענקית!',
              },
              {
                id: 'd',
                label: 'מפתח זהב',
                isCorrect: false,
                feedback: 'מפתח זהב לא היה ברשימה. על ספת הסלון (תחנה 2) קפצה בננה ענקית!',
              },
            ],
          },
          {
            id: 'pal2-q2',
            prompt: 'אתה רוצה לזכור את המספר 07 (שמילת ה-Major שלו היא "סיר") בתחנה מספר 1 בארמון שלך ("דלת הכניסה"). מהי הדרך הטובה ביותר לקודד זאת?',
            highlightBadge: 'שילוב Major + ארמון זיכרון',
            subPrompt: 'חבר את החפץ של המספר ("סיר") אל התחנה ("דלת הכניסה") באינטראקציה עוצמתית:',
            options: [
              {
                id: 'a',
                label: 'לדמיין סיר מרק רותח שנתקע בידית דלת הכניסה, מתיז אדים רועשים וממיס את הדלת!',
                isCorrect: true,
                feedback: 'אלוף! כשתגיע לדלת הכניסה (תחנה 1), תראה מיד את ה"סיר" הרותח -> תפרק את המילה "סיר" ל-ס׳ (0) ו-ר׳ (7) -> ותשלוף את המספר 07!',
              },
              {
                id: 'b',
                label: 'לדמיין את הספרות 0 ו-7 כתובות בעיפרון קטן בפינת הדלת.',
                isCorrect: false,
                feedback: 'ספרות כתובות דוהות ונעלמות מעיני הרוח. תמיד הצב את החפץ המוחשי ("סיר") בפעולה מול התחנה!',
              },
              {
                id: 'c',
                label: 'להניח סיר במטבח במקום בדלת הכניסה.',
                isCorrect: false,
                feedback: 'אם תשים אותו במטבח, תשבור את סדר התחנות (תחנה 1 היא דלת הכניסה) ולא תדע שהוא הפריט הראשון ברשימה!',
              },
              {
                id: 'd',
                label: 'לחזור בלב על המשפט "בדלת יש שבע" בלי לדמיין תמונה.',
                isCorrect: false,
                feedback: 'ארמון זיכרון עובד דרך הראייה המרחבית. תמונה חיה של סיר רותח על הדלת חזקה פי עשרה ממשפט מילולי!',
              },
            ],
          },
        ],
      },

      // =======================================================================
      // TRACK 4: REMEMBERING NAMES & FACES (זכירת שמות ופנים)
      // =======================================================================
      {
        id: 'names-1',
        trackId: 'names',
        lessonNumber: 1,
        title: 'איתור "עוגן בפנים" והמרת שם ל"מילת תחליף מוחשית"',
        subtitle: 'איך הופכים שם מופשט (כמו דני או רונן) לחפץ שאפשר לראות ולחבר לפנים',
        estimatedMinutes: 3,
        theoryParagraphs: [
          'למה כולנו אומרים "הפנים שלו מוכרות לי, אבל שכחתי איך קוראים לו"? כי פנים הן ויזואליות, ואילו שם (כמו "רונן" או "דני") הוא צליל מופשט שנכנס מאוזן אחת ויוצא מהשנייה!',
          'הפתרון מורכב משני צעדים מהירים: (1) מוצאים תו אחד בולט בפנים של האדם ("עוגן מורפולוגי" – למשל גבות עבות, תלתלים, משקפיים עגולים או חיוך רחב). (2) הופכים את השם שלו ל"מילת תחליף" של חפץ שנשמע דומה (למשל: דני -> דונאטס, רונן -> רימון, אילן -> עץ אילן, אורית -> אור/פנס).',
        ],
        keyTakeaway: 'לכל שם מוצאים מילת תחליף מוחשית שנשמעת דומה (דני -> דונאטס, רונן -> רימון).',
        demoTitle: 'הדגמה אינטראקטיבית: מתרגם השמות למילות תחליף מוחשיות',
        demoDescription: 'לחץ על כל שם כדי לראות איך הופכים אותו בשנייה לחפץ מוחשי שאפשר לדמיין:',
        demoType: 'names-substitute-word',
        drills: [
          {
            id: 'n1-q1',
            prompt: 'פגשת אדם חדש בשם "רונן". איזו "מילת תחליף" (Substitute Word) תאפשר לך לדמיין חפץ מוחשי שיזכיר לך מיד את הצליל של השם "רונן"?',
            highlightBadge: 'השם: רונן',
            subPrompt: 'חפש חפץ פיזי מוחשי שהצליל שלו קרוב מאוד ל"רונן":',
            options: [
              {
                id: 'a',
                label: 'רימון אדום ועסיסי',
                subLabel: 'רונן <-> רימון (צליל דומה וחפץ מוחשי)',
                isCorrect: true,
                feedback: 'מצוין! המילה "רימון" חולקת את העיצורים ר׳-מ/נ-ן עם "רונן" והיא חפץ בולט וצבעוני שקל מאוד לדמיין!',
              },
              {
                id: 'b',
                label: 'שמחה גדולה',
                subLabel: 'מושג מופשט',
                isCorrect: false,
                feedback: '"שמחה" היא רגש מופשט ולא חפץ מוחשי, וגם אינה נשמעת כמו "רונן". "רימון" נותן גם תמונה מוחשית וגם צליל דומה!',
              },
              {
                id: 'c',
                label: 'שולחן כתיבה',
                subLabel: 'אין קשר פונטי לשם רונן',
                isCorrect: false,
                feedback: 'אין דמיון צלילי בין "שולחן" לבין "רונן", ולכן כשתראה שולחן לא תיזכר בשם רונן.',
              },
              {
                id: 'd',
                label: 'האות ר׳ בלבד',
                subLabel: 'אות בודדת',
                isCorrect: false,
                feedback: 'אות בודדת לא תגיד לך אם שמו רונן, רמי, רועי או רפאל. "רימון" מוביל ישירות לצליל של "רונן"!',
              },
            ],
          },
          {
            id: 'n1-q2',
            prompt: 'הכרת באירוע אישה בשם " כרמל ". איזו מילת תחליף מוחשית תעזור לך לזכור את שמה?',
            highlightBadge: 'השם: כרמל',
            subPrompt: 'איזה מאכל/חפץ נשמע ממש כמו "כרמל"?',
            options: [
              {
                id: 'a',
                label: 'סוכריית קרמל נוזלית ומתוקה',
                isCorrect: true,
                feedback: 'מדויק! "קרמל" נשמע זהה ל"כרמל" ונותן לך דימוי חושי חזק (צבע זהוב, מרקם דביק וטעם מתוק)!',
              },
              {
                id: 'b',
                label: 'מחשב נייד',
                isCorrect: false,
                feedback: 'אין דמיון צלילי בין "מחשב" ל"כרמל". "קרמל" נשמע בדיוק כמו השם!',
              },
              {
                id: 'c',
                label: 'אישה נחמדה',
                isCorrect: false,
                feedback: 'תיאור כללי לא יעזור לך לשלוף את השם "כרמל". סוכריית קרמל תעשה זאת מיד!',
              },
              {
                id: 'd',
                label: 'כובע צמר',
                isCorrect: false,
                feedback: 'מתחיל באותו צליל כ׳, אך "סוכריית קרמל" מכילה את כל הצליל של השם "כרמל" בשלמותו!',
              },
            ],
          },
        ],
      },
      {
        id: 'names-2',
        trackId: 'names',
        lessonNumber: 2,
        title: 'החיבור הסופי: הדבקת מילת התחליף לעוגן בפנים',
        subtitle: 'איך מחברים את החפץ אל הפנים כך שבפעם הבאה שתראה את האדם – השם יקפוץ מעצמו!',
        estimatedMinutes: 4,
        theoryParagraphs: [
          'מצאנו עוגן בפנים (למשל: לרונן יש זקן עבה ומרשים) ומצאנו מילת תחליף לשם (רונן -> רימון). עכשיו מגיע שלב החיבור: אנחנו מדמיינים את מילת התחליף ("רימון") מתנגשת או צומחת ישירות מתוך העוגן בפנים ("הזקן")!',
          'מה יקרה בפגישה הבאה שלכם? תסתכל על פניו -> העיניים שלך ימשכו אוטומטית אל התו הבולט ביותר (הזקן העבה) -> הזקן יקפיץ לך את התמונה של הרימונים שמתפוצצים מתוכו -> "רימון" יזכיר לך מיד את השם "רונן"!',
        ],
        keyTakeaway: 'הנוסחה המלאה: פנים -> תו בולט (עוגן) -> חיבור מילת התחליף לעוגן -> שליפת השם!',
        demoTitle: 'הדגמה אינטראקטיבית: מעבדת חיבור פנים ושמות',
        demoDescription: 'עבור על 3 דמויות וראה איך העוגן בפנים + מילת התחליף יוצרים זיכרון מיידי:',
        demoType: 'names-face-anchor-fusion',
        drills: [
          {
            id: 'n2-q1',
            prompt: 'פגשת את "דני", שיש לו גבות עבות ובולטות במיוחד. מילת התחליף לדני היא "דונאטס". איך תחבר ביניהם בצורה הטובה ביותר?',
            highlightBadge: 'דני + גבות עבות + דונאטס',
            subPrompt: 'חבר את מילת התחליף ישירות אל העוגן בפנים:',
            options: [
              {
                id: 'a',
                label: 'לדמיין שני דונאטס מצופים שוקולד תקועים על הגבות העבות שלו ונמסים עליהן!',
                isCorrect: true,
                feedback: 'מושלם! ברגע שתראה שוב את הפנים שלו, הגבות העבות יקפיצו לך את הדונאטס, ו"דונאטס" יגיד לך מיד: "זה דני!"',
              },
              {
                id: 'b',
                label: 'לדמיין דונאטס מונח בחנות מאפים רחוקה בלי קשר לפנים של דני.',
                isCorrect: false,
                feedback: 'אם הדונאטס לא מחובר לעוגן בפנים של דני, כשתראה את הפנים שלו לא יהיה שום טריגר שיקפיץ לך את הדונאטס!',
              },
              {
                id: 'c',
                label: 'להסתכל על הנעליים שלו במקום על הפנים שלו.',
                isCorrect: false,
                feedback: 'בפגישה הבאה הוא ינעל נעליים אחרות! תמיד בחר עוגן קבוע בפנים עצמן (גבות, אף, עיניים, סנטר, תלתלים).',
              },
              {
                id: 'd',
                label: 'לחזור בראש על המילה "גבות" בלי לקשר אותה לדונאטס.',
                isCorrect: false,
                feedback: 'אז תזכור שיש לו גבות עבות, אבל לא תזכור איך קוראים לו! החיבור בין הגבות לבין הדונאטס (דני) הוא הקריטי.',
              },
            ],
          },
          {
            id: 'n2-q2',
            prompt: 'בוא נבדוק את הזיכרון שלך מההדגמה! כשאתה פוגש את האדם עם ה"זקן העבה" שעליו דמיינו רימונים אדומים מתפוצצים – איך קוראים לו?',
            highlightBadge: 'שליפה בזמן אמת',
            subPrompt: 'זקן עבה -> רימונים מתפוצצים -> השם הוא...',
            options: [
              {
                id: 'a',
                label: 'רונן',
                subLabel: 'רימון -> רונן',
                isCorrect: true,
                feedback: 'בום! שלפת את השם בלי מאמץ! זקן -> רימון -> רונן. ככה בדיוק עובדים אלופי הזיכרון!',
              },
              {
                id: 'b',
                label: 'דני',
                subLabel: 'דונאטס -> דני',
                isCorrect: false,
                feedback: 'דני היה עם הגבות והדונאטס. הרימונים בזקן שייכים ל"רונן" (רימון -> רונן)!',
              },
              {
                id: 'c',
                label: 'כרמל',
                subLabel: 'קרמל -> כרמל',
                isCorrect: false,
                feedback: 'רימון מוביל לצליל של השם "רונן"!',
              },
              {
                id: 'd',
                label: 'אלון',
                subLabel: 'עץ אלון',
                isCorrect: false,
                feedback: 'הדימוי בזקן היה רימון, ולכן השם הוא "רונן"!',
              },
            ],
          },
        ],
      },
    ];
  }, [majorDigits, connectingLetters]);

  // Completed lessons state persisted in localStorage
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(COMPLETED_LESSONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(COMPLETED_LESSONS_STORAGE_KEY, JSON.stringify(completedLessonIds));
    } catch {}
  }, [completedLessonIds]);

  const [selectedTrack, setSelectedTrack] = useState<AcademyTrackId>('major');
  const [activeLessonId, setActiveLessonId] = useState<string>('major-1');
  const [stepPhase, setStepPhase] = useState<LessonStepPhase>('theory');

  // Interactive Demo internal state
  const [demoSelectedDigit, setDemoSelectedDigit] = useState<number>(0);
  const [demoSelectedExampleIdx, setDemoSelectedExampleIdx] = useState<number>(0);

  // Micro-Drill state
  const [currentDrillIndex, setCurrentDrillIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [drillAnsweredCorrectly, setDrillAnsweredCorrectly] = useState<boolean>(false);

  const trackLessons = useMemo(
    () => lessons.filter((l) => l.trackId === selectedTrack),
    [lessons, selectedTrack]
  );

  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === activeLessonId) || trackLessons[0] || lessons[0],
    [lessons, activeLessonId, trackLessons]
  );

  // Reset lesson phase when switching lessons
  const handleSelectLesson = (lesson: AcademyLesson) => {
    setSelectedTrack(lesson.trackId);
    setActiveLessonId(lesson.id);
    setStepPhase('theory');
    setCurrentDrillIndex(0);
    setSelectedOptionId(null);
    setDrillAnsweredCorrectly(false);
    setDemoSelectedDigit(lesson.id === 'major-2' ? 5 : 0);
    setDemoSelectedExampleIdx(0);
  };

  const handleSelectTrack = (trackId: AcademyTrackId) => {
    setSelectedTrack(trackId);
    const tLessons = lessons.filter((l) => l.trackId === trackId);
    // Pick first uncompleted lesson in this track, or the first lesson
    const firstUncompleted = tLessons.find((l) => !completedLessonIds.includes(l.id));
    const targetLesson = firstUncompleted || tLessons[0];
    if (targetLesson) {
      handleSelectLesson(targetLesson);
    }
  };

  const currentDrill = activeLesson.drills[currentDrillIndex] || activeLesson.drills[0];
  const selectedOption = currentDrill?.options.find((o) => o.id === selectedOptionId) || null;

  const handleChooseOption = (optionId: string) => {
    if (drillAnsweredCorrectly) return; // Lock after correct answer
    setSelectedOptionId(optionId);
    const opt = currentDrill?.options.find((o) => o.id === optionId);
    if (opt?.isCorrect) {
      setDrillAnsweredCorrectly(true);
      soundEffects.playSuccessChime();
    } else {
      soundEffects.playErrorBuzzer();
    }
  };

  const handleNextDrillOrFinish = () => {
    if (currentDrillIndex < activeLesson.drills.length - 1) {
      setCurrentDrillIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setDrillAnsweredCorrectly(false);
    } else {
      // Lesson completed!
      setStepPhase('completed');
      if (!completedLessonIds.includes(activeLesson.id)) {
        const updated = [...completedLessonIds, activeLesson.id];
        setCompletedLessonIds(updated);
        onEarnPoints(25, `השלמת שיעור באקדמיית המתחילים: ${activeLesson.title}`);
        if (updated.length >= 4) {
          onUnlockBadge('בוגר אקדמיית המתחילים');
        }
      }
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.6 },
      });
    }
  };

  const handleGoToNextLesson = () => {
    const idxInAll = lessons.findIndex((l) => l.id === activeLesson.id);
    if (idxInAll >= 0 && idxInAll < lessons.length - 1) {
      const nextLesson = lessons[idxInAll + 1];
      handleSelectLesson(nextLesson);
    }
  };

  // Progress calculations
  const totalLessonsCount = lessons.length;
  const totalCompletedCount = completedLessonIds.length;
  const overallProgressPercent = Math.round((totalCompletedCount / totalLessonsCount) * 100);

  const trackCompletedCount = trackLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const trackProgressPercent = Math.round((trackCompletedCount / Math.max(1, trackLessons.length)) * 100);

  const lessonInternalProgressPercent = useMemo(() => {
    if (stepPhase === 'theory') return 20;
    if (stepPhase === 'demo') return 50;
    if (stepPhase === 'practice') {
      const drillWeight = 45 / Math.max(1, activeLesson.drills.length);
      return Math.round(50 + currentDrillIndex * drillWeight + (drillAnsweredCorrectly ? drillWeight : 0));
    }
    return 100;
  }, [stepPhase, currentDrillIndex, activeLesson.drills.length, drillAnsweredCorrectly]);

  const tracksMeta: {
    id: AcademyTrackId;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    accentColor: string;
    activeClass: string;
    practiceTarget: 'major' | 'pao' | 'palaces' | 'names';
  }[] = [
    {
      id: 'major',
      title: '1. שיטת ה-MAJOR',
      subtitle: 'המרת מספרים לצלילים וחפצים',
      icon: <Hash className="w-5 h-5" />,
      accentColor: 'text-amber-600',
      activeClass: 'border-amber-500 bg-amber-50/90 text-slate-900',
      practiceTarget: 'major',
    },
    {
      id: 'pao',
      title: '2. שיטת ה-PAO',
      subtitle: 'דמות • פעולה • חפץ (דחיסת 6 ספרות)',
      icon: <User className="w-5 h-5" />,
      accentColor: 'text-sky-600',
      activeClass: 'border-sky-500 bg-sky-50/90 text-slate-900',
      practiceTarget: 'pao',
    },
    {
      id: 'palaces',
      title: '3. ארמונות זיכרון',
      subtitle: 'ניווט מרחבי ב-5 תחנות בחדר',
      icon: <Compass className="w-5 h-5" />,
      accentColor: 'text-indigo-600',
      activeClass: 'border-indigo-500 bg-indigo-50/90 text-slate-900',
      practiceTarget: 'palaces',
    },
    {
      id: 'names',
      title: '4. שמות ופנים',
      subtitle: 'עוגן בפנים + מילת תחליף מוחשית',
      icon: <Smile className="w-5 h-5" />,
      accentColor: 'text-emerald-600',
      activeClass: 'border-emerald-500 bg-emerald-50/90 text-slate-900',
      practiceTarget: 'names',
    },
  ];

  // Render the interactive demonstration for the active lesson
  const renderInteractiveDemo = () => {
    switch (activeLesson.demoType) {
      case 'major-digits-0-4':
      case 'major-digits-5-9': {
        const digitsRange = activeLesson.demoType === 'major-digits-0-4' ? [0, 1, 2, 3, 4] : [5, 6, 7, 8, 9];
        const memoryVisualTricks: Record<number, string> = {
          0: 'צליל שורק כמו במילה Zero, והאות ס׳ עגולה בדיוק כמו הספרה 0.',
          1: 'הספרה 1 היא קו אנכי גבוה, בדיוק כמו החלק העליון של האות ל׳.',
          2: 'ב׳ היא האות ה-2 באלפבית העברי (בגימטריה ב = 2).',
          3: 'ג׳ היא האות ה-3 באלפבית (ומביאה איתה את אחיותיה הפונטיות ק׳ ו-כ׳).',
          4: 'ד׳ היא האות ה-4 באלפבית (ומביאה איתה את האותיות הדנטליות ת׳ ו-ט׳).',
          5: 'המילה "חמש" מתחילה באות ח׳ (5).',
          6: 'המילה "שש" מתחילה באות ש׳ (6).',
          7: 'צורת הספרה 7 נראית כמו האות ר׳ הפוכה.',
          8: 'במילה "שמונה" הצליל הבולט באמצע הוא מ׳.',
          9: 'הספרה 9 נראית במראה בדיוק כמו האות פ׳ בכתב יד.',
        };
        const selectedD = digitsRange.includes(demoSelectedDigit) ? demoSelectedDigit : digitsRange[0];

        return (
          <div className="space-y-5">
            <div className="grid grid-cols-5 gap-2.5 sm:gap-4">
              {digitsRange.map((d) => {
                const isSelected = selectedD === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDemoSelectedDigit(d)}
                    className={`p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl font-black tabular-nums">{d}</span>
                    <span className={`text-xs sm:text-sm font-extrabold ${isSelected ? 'text-amber-100' : 'text-amber-700'}`}>
                      {getDigitConsonants(d)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-amber-700">
                  הספרה {selectedD} &larr; העיצור הקבוע שלך: <span className="text-base font-black text-slate-900">{getDigitConsonants(selectedD)}</span>
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  <strong>איך זוכרים בקלות?</strong> {memoryVisualTricks[selectedD]}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center shrink-0 min-w-[140px]">
                <span className="text-[11px] text-slate-500 block font-semibold">חפץ עוגן לדוגמה:</span>
                <span className="text-lg font-black text-amber-900">{getDigitWord(selectedD) || 'סוס'}</span>
              </div>
            </div>
          </div>
        );
      }

      case 'major-word-builder': {
        const examples = [
          {
            numStr: '07',
            word: 'סיר',
            breakdown: [
              { char: 'ס', role: 'עיצור של הספרה 0', isConsonant: true },
              { char: 'י', role: 'אות חיבור שקופה (ללא ערך מספרי)', isConsonant: false },
              { char: 'ר', role: 'עיצור של הספרה 7', isConsonant: true },
            ],
            summary: 'העיצורים הם ס (0) + ר (7) = 07. האות י׳ רק מחברת ביניהם לחפץ "סיר"!',
          },
          {
            numStr: '2',
            word: 'בננה',
            breakdown: [
              { char: 'ב', role: 'עיצור של הספרה 2', isConsonant: true },
              { char: 'נ', role: 'אות חיבור שקופה ("אני עונה")', isConsonant: false },
              { char: 'נ', role: 'אות חיבור שקופה ("אני עונה")', isConsonant: false },
              { char: 'ה', role: 'אות חיבור שקופה ("אני עונה")', isConsonant: false },
            ],
            summary: 'למרות שהמילה בת 4 אותיות, יש בה רק עיצור מספרי אחד בלבד: ב (2)!',
          },
          {
            numStr: '81',
            word: 'מעיל',
            breakdown: [
              { char: 'מ', role: 'עיצור של הספרה 8', isConsonant: true },
              { char: 'ע', role: 'אות חיבור שקופה ("אני עונה")', isConsonant: false },
              { char: 'י', role: 'אות חיבור שקופה ("אני עונה")', isConsonant: false },
              { char: 'ל', role: 'עיצור של הספרה 1', isConsonant: true },
            ],
            summary: 'מ (8) + ל (1) = 81. האותיות ע׳ ו-י׳ הן דבק שקוף ללא ערך מספרי!',
          },
        ];
        const currentEx = examples[demoSelectedExampleIdx % examples.length];

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {examples.map((ex, idx) => (
                <button
                  key={ex.numStr}
                  type="button"
                  onClick={() => setDemoSelectedExampleIdx(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                    demoSelectedExampleIdx === idx
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  דוגמה: מספר {ex.numStr} &larr; &quot;{ex.word}&quot;
                </button>
              ))}
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-center gap-3 flex-wrap py-2">
                {currentEx.breakdown.map((part, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 rounded-2xl border-2 text-center min-w-[95px] ${
                      part.isConsonant
                        ? 'bg-amber-50 border-amber-400 text-amber-900'
                        : 'bg-slate-50 border-dashed border-slate-300 text-slate-500'
                    }`}
                  >
                    <div className="text-2xl font-black mb-1">{part.char}</div>
                    <div className="text-[11px] font-bold leading-tight">{part.role}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                {currentEx.summary}
              </p>
            </div>
          </div>
        );
      }

      case 'pao-initials': {
        const paoExamples = [
          {
            num: '00',
            tens: `0 (${getPrimaryLetter(0)})`,
            units: `0 (${getPrimaryLetter(0)})`,
            person: 'סילבסטר סטאלון',
            initials: 'ס.ס.',
            why: 'סילבסטר מתחיל ב-ס׳ (0), סטאלון מתחיל ב-ס׳ (0).',
          },
          {
            num: '14',
            tens: `1 (${getPrimaryLetter(1)})`,
            units: `4 (${getPrimaryLetter(4)})`,
            person: 'ליאונרדו דיקפריו',
            initials: 'ל.ד.',
            why: 'ליאונרדו מתחיל ב-ל׳ (1), דיקפריו מתחיל ב-ד׳ (4).',
          },
          {
            num: '23',
            tens: `2 (${getPrimaryLetter(2)})`,
            units: `3 (${getPrimaryLetter(3)})`,
            person: 'ביל גייטס',
            initials: 'ב.ג.',
            why: 'ביל מתחיל ב-ב׳ (2), גייטס מתחיל ב-ג׳ (3).',
          },
        ];
        const curr = paoExamples[demoSelectedExampleIdx % paoExamples.length];

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {paoExamples.map((ex, idx) => (
                <button
                  key={ex.num}
                  type="button"
                  onClick={() => setDemoSelectedExampleIdx(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                    demoSelectedExampleIdx === idx
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
                  }`}
                >
                  מספר #{ex.num} ({ex.initials})
                </button>
              ))}
            </div>

            <div className="bg-white border-2 border-sky-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block font-bold">ספרת עשרות + יחידות</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {curr.tens} + {curr.units}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                <span className="text-xs text-sky-700 block font-bold">ראשי תיבות נדרשים</span>
                <span className="text-2xl font-black text-sky-900 mt-1 block">{curr.initials}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs text-emerald-700 block font-bold">דמות PAO נבחרת</span>
                <span className="text-lg font-black text-emerald-900 mt-1 block">{curr.person}</span>
              </div>
              <div className="sm:col-span-3 text-xs font-semibold text-slate-600 pt-1">
                {curr.why}
              </div>
            </div>
          </div>
        );
      }

      case 'pao-person-action-link': {
        const links = [
          {
            num: '00',
            person: 'סילבסטר סטאלון (רוקי)',
            action: 'מתאגרף עם כפפות אגרוף',
            object: 'סוס (ס+ס)',
            explanation: 'לא צריך לשנן שסטאלון מתאגרף – זה הדבר הראשון שעולה לראש כשחושבים על רוקי!',
          },
          {
            num: '14',
            person: 'ליאונרדו דיקפריו',
            action: 'פורש ידיים על חרטום ספינה',
            object: 'ילד (ל+ד)',
            explanation: 'התנועה המפורסמת ביותר של דיקפריו מ"טיטאניק" הופכת לפעולה הקבועה של מספר 14.',
          },
          {
            num: '21',
            person: 'ברוס לי (ב.ל.)',
            action: 'מנחית בעיטת קראטה מעופפת',
            object: 'בלון (ב+ל)',
            explanation: 'ברוס לי מזוהה מיד עם בעיטת קראטה מעופפת – כך הפעולה נשלפת מאליה!',
          },
        ];
        const curr = links[demoSelectedExampleIdx % links.length];

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {links.map((item, idx) => (
                <button
                  key={item.num}
                  type="button"
                  onClick={() => setDemoSelectedExampleIdx(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                    demoSelectedExampleIdx === idx
                      ? 'bg-sky-600 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
                  }`}
                >
                  שלשת #{item.num}: {item.person}
                </button>
              ))}
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 block">1. אדם (Person)</span>
                  <span className="text-base font-black text-slate-900">{curr.person}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                  <span className="text-[11px] font-bold text-sky-800 block">2. פעולה מאפיינת (Action)</span>
                  <span className="text-base font-black text-slate-900">{curr.action}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 block">3. חפץ פונטי (Object)</span>
                  <span className="text-base font-black text-slate-900">{curr.object}</span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                💡 למה זה עובד? {curr.explanation}
              </p>
            </div>
          </div>
        );
      }

      case 'pao-6digit-compressor': {
        return (
          <div className="bg-white border-2 border-sky-200 rounded-2xl p-5 space-y-4">
            <div className="text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">מספר יעד בן 6 ספרות לשינון:</span>
              <div className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-mono font-black tracking-wider bg-slate-900 text-white px-5 py-2.5 rounded-2xl">
                <span className="text-amber-400">00</span>
                <span className="text-slate-500">-</span>
                <span className="text-sky-400">21</span>
                <span className="text-slate-500">-</span>
                <span className="text-emerald-400">07</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300">
                <span className="text-xs font-black text-amber-800 block">זוג ראשון (00) &larr; רק האדם</span>
                <span className="text-base font-black text-slate-900 mt-1 block">סילבסטר סטאלון</span>
              </div>
              <div className="p-3.5 rounded-xl bg-sky-50 border-2 border-sky-300">
                <span className="text-xs font-black text-sky-800 block">זוג שני (21) &larr; רק הפעולה</span>
                <span className="text-base font-black text-slate-900 mt-1 block">בועט בעיטת קראטה ב...</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300">
                <span className="text-xs font-black text-emerald-800 block">זוג שלישי (07) &larr; רק החפץ</span>
                <span className="text-base font-black text-slate-900 mt-1 block">סיר מרק רותח!</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
              <span className="text-xs font-bold text-indigo-700 block mb-1">🎬 התמונה המאוחדת בעיני הרוח (שווה 6 ספרות!):</span>
              <p className="text-sm sm:text-base font-black text-indigo-950">
                &quot;סילבסטר סטאלון (00) מזנק באוויר ובועט בעיטת קראטה אדירה (21) שמעיפה סיר מרק רותח (07) לרסיסים!&quot;
              </p>
            </div>
          </div>
        );
      }

      case 'palace-clockwise-room': {
        const stations = [
          { num: 1, name: 'דלת הכניסה', pos: 'כניסה לחדר (נקודת ההתחלה)', desc: 'ידית הפלדה והמנעול של דלת הכניסה.' },
          { num: 2, name: 'מתלה המעילים', pos: 'קיר שמאלי (הולכים עם כיוון השעון)', desc: 'מתלה עץ גבוה בצד שמאל של הכניסה.' },
          { num: 3, name: 'ספת הסלון', pos: 'קיר מרכזי', desc: 'ספת שלושת המושבים הרחבה.' },
          { num: 4, name: 'חלון המרפסת הגדול', pos: 'קיר צפוני', desc: 'וילון הזכוכית והאדנית של המרפסת.' },
          { num: 5, name: 'מסך הטלוויזיה', pos: 'קיר ימני (סגירת מעגל השעון)', desc: 'מסך הטלוויזיה הרחב שתלוי על הקיר הימני.' },
        ];
        const activeSt = stations[demoSelectedExampleIdx % stations.length];

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {stations.map((st, idx) => (
                <button
                  key={st.num}
                  type="button"
                  onClick={() => setDemoSelectedExampleIdx(idx)}
                  className={`p-3 rounded-xl border-2 text-right transition-all cursor-pointer ${
                    demoSelectedExampleIdx === idx
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="text-xs font-bold opacity-80">תחנה #{st.num}</div>
                  <div className="text-sm font-black mt-0.5">{st.name}</div>
                </button>
              ))}
            </div>

            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-indigo-700 block">
                  תחנה #{activeSt.num}: {activeSt.name} ({activeSt.pos})
                </span>
                <p className="text-sm text-slate-700 font-medium mt-1">{activeSt.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setDemoSelectedExampleIdx((prev) => (prev + 1) % stations.length)}
                className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold cursor-pointer shrink-0"
              >
                צעד לתחנה הבאה בכיוון השעון &larr;
              </button>
            </div>
          </div>
        );
      }

      case 'palace-station-collision': {
        const placements = [
          {
            station: 'תחנה #1: דלת הכניסה',
            item: 'בקבוק חלב',
            collision: 'בקבוק חלב ענק בגודל מקרר מתנפץ על מנעול דלת הכניסה ומציף את השטיחון בקצף לבן!',
          },
          {
            station: 'תחנה #2: ספת הסלון',
            item: 'בננה צהובה',
            collision: 'בננה ענקית עם משקפי שמש קופצת כמו טרמפולינה על ספת הסלון וקורעת את הכריות!',
          },
          {
            station: 'תחנה #3: מסך הטלוויזיה',
            item: 'כיכר לחם חמה',
            collision: 'כיכר לחם לוהטת פורצת מתוך זכוכית מסך הטלוויזיה וממלאת את כל הסלון בריח מאפייה!',
          },
        ];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {placements.map((p) => (
              <div key={p.station} className="bg-white border-2 border-indigo-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-700">{p.station}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    פריט: {p.item}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">{p.collision}</p>
              </div>
            ))}
          </div>
        );
      }

      case 'names-substitute-word': {
        const nameSubs = [
          { name: 'רונן', substitute: 'רימון אדום', why: 'רונן נשמע ממש כמו רימון (ר-ו-נ-ן / ר-י-מ-ו-ן).' },
          { name: 'דני', substitute: 'דונאטס מצופה שוקולד', why: 'דני פותח בצליל ד-נ כמו דונאטס מתוק ומוחשי.' },
          { name: 'כרמל', substitute: 'סוכריית קרמל נמסה', why: 'כרמל נשמע זהה לקרמל זהוב ודביק.' },
          { name: 'אילן', substitute: 'עץ אילן עם ענפים', why: 'השם אילן הוא בעצמו חפץ מוחשי בטבע (עץ).' },
        ];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nameSubs.map((ns) => (
              <div key={ns.name} className="bg-white border-2 border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    השם: <span className="text-emerald-700">{ns.name}</span> &larr; חפץ תחליף: <span className="text-amber-700">{ns.substitute}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{ns.why}</p>
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'names-face-anchor-fusion': {
        const fusions = [
          {
            person: 'רונן',
            anchor: 'זקן עבה ומרשים',
            substitute: 'רימון אדום',
            scene: 'מתוך הזקן העבה של רונן צומחים ומתפוצצים רימונים אדומים שמתיזים מיץ לכל עבר!',
          },
          {
            person: 'דני',
            anchor: 'גבות עבות ובולטות',
            substitute: 'דונאטס שוקולד',
            scene: 'על שתי הגבות העבות של דני מסתובבים דונאטס מצופים שוקולד וזורים סוכריות צבעוניות!',
          },
          {
            person: 'כרמל',
            anchor: 'תלתלים גולשים',
            substitute: 'סוכריות קרמל',
            scene: 'התלתלים של כרמל עשויים מסירופ קרמל זהוב ומתוק שמטפטף בריח משכר!',
          },
        ];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {fusions.map((f) => (
              <div key={f.person} className="bg-white border-2 border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="text-sm font-black text-slate-900 border-b border-slate-100 pb-1.5">
                  👤 {f.person}
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div><strong>עוגן בפנים:</strong> {f.anchor}</div>
                  <div><strong>מילת תחליף:</strong> {f.substitute}</div>
                </div>
                <p className="text-xs font-bold text-emerald-900 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  ⚡ {f.scene}
                </p>
              </div>
            ))}
          </div>
        );
      }
    }
  };

  return (
    <div className="w-full max-w-none space-y-6 pb-16 text-slate-900">
      {/* Top Academy Hero & Overall Progress */}
      <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <GraduationCap className="w-4 h-4" />
              <span>אקדמיית המתחילים • מסלול לימוד אינטראקטיבי מאפס</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              לימוד שיטות הזיכרון צעד-אחר-צעד
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
              לא מכיר עדיין את שיטות הזיכרון? כאן לומדים הכל מהיסוד בשיטת המיקרו-למידה: הסבר קצרצר,
              הדגמה חיה ותרגול מיידי קצר שבונה ביטחון לפני שעוברים למרכז האימונים.
            </p>
          </div>

          {/* Overall Academy Progress Box */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 min-w-[260px] space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>התקדמות כוללת באקדמיה</span>
              </span>
              <span className="font-mono font-black text-emerald-700 tabular-nums">
                {totalCompletedCount} / {totalLessonsCount} שיעורים ({overallProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${overallProgressPercent}%` }}
              />
            </div>
            {totalCompletedCount > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCompletedLessonIds([])}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>אפס התקדמות לימוד</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4 Core Technique Tracks Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200">
          {tracksMeta.map((track) => {
            const isSelected = selectedTrack === track.id;
            const tLessons = lessons.filter((l) => l.trackId === track.id);
            const tDone = tLessons.filter((l) => completedLessonIds.includes(l.id)).length;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => handleSelectTrack(track.id)}
                className={`p-4 rounded-2xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? `${track.activeClass} border-b-4 shadow-xs`
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={track.accentColor}>{track.icon}</span>
                    <span className="font-black text-sm text-slate-900">{track.title}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500 tabular-nums">
                    {tDone}/{tLessons.length}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">{track.subtitle}</p>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.round((tDone / Math.max(1, tLessons.length)) * 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Workspace: Lesson Sidebar + Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right Column (in RTL): Lessons List in Current Technique */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">
                שיעורים במסלול זה
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                הושלמו {trackCompletedCount} מתוך {trackLessons.length} ({trackProgressPercent}%)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const meta = tracksMeta.find((t) => t.id === selectedTrack);
                if (meta) onNavigateToPractice(meta.practiceTarget);
              }}
              className="text-xs font-bold text-sky-700 hover:text-sky-900 underline cursor-pointer"
            >
              עבור למודולת התרגול &larr;
            </button>
          </div>

          <div className="space-y-2.5">
            {trackLessons.map((lesson) => {
              const isCurrent = lesson.id === activeLesson.id;
              const isDone = completedLessonIds.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => handleSelectLesson(lesson)}
                  className={`w-full p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer flex items-start gap-3 ${
                    isCurrent
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : lesson.lessonNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-slate-900 leading-snug">
                      {lesson.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {lesson.subtitle}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">
                      כ-{lesson.estimatedMinutes} דקות לימוד • {lesson.drills.length} תרגילים קצרים
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Left Column (in RTL): Active Lesson Interactive Stage */}
        <div className="lg:col-span-8 bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Lesson Header & Current Lesson Progress Bar */}
          <div className="space-y-4 border-b border-slate-200 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-500">
                שיעור {activeLesson.lessonNumber} מתוך {trackLessons.length} &middot;{' '}
                <span className="text-emerald-700">
                  {stepPhase === 'theory'
                    ? 'שלב 1: הסבר הרעיון'
                    : stepPhase === 'demo'
                    ? 'שלב 2: הדגמה מוחשית'
                    : stepPhase === 'practice'
                    ? `שלב 3: תרגול מיידי (${currentDrillIndex + 1}/${activeLesson.drills.length})`
                    : 'השיעור הושלם!'}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-600 tabular-nums">
                התקדמות בשיעור: {lessonInternalProgressPercent}%
              </div>
            </div>

            {/* Lesson Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${lessonInternalProgressPercent}%` }}
              />
            </div>

            {/* Step Tabs (Theory -> Demo -> Practice) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'theory', label: '1. הסבר קצר', icon: <BookOpen className="w-3.5 h-3.5" /> },
                { id: 'demo', label: '2. הדגמה חיה', icon: <Eye className="w-3.5 h-3.5" /> },
                { id: 'practice', label: '3. תרגול מיידי', icon: <Zap className="w-3.5 h-3.5" /> },
              ].map((st) => {
                const isActive = stepPhase === st.id || (stepPhase === 'completed' && st.id === 'practice');
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setStepPhase(st.id as LessonStepPhase);
                      if (st.id === 'practice') {
                        setCurrentDrillIndex(0);
                        setSelectedOptionId(null);
                        setDrillAnsweredCorrectly(false);
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.icon}
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {activeLesson.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {activeLesson.subtitle}
              </p>
            </div>
          </div>

          {/* ===============================================================
              STAGE 1: BITE-SIZED THEORY (הסבר תמציתי)
             =============================================================== */}
          {stepPhase === 'theory' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6">
                {activeLesson.theoryParagraphs.map((para, idx) => (
                  <p key={idx} className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                    {para}
                  </p>
                ))}
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-amber-950">
                  <strong className="font-black block mb-0.5">כלל המפתח של השיעור:</strong>
                  <span className="font-medium">{activeLesson.keyTakeaway}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStepPhase('demo')}
                  className="btn-duo-green flex items-center gap-2 px-6 py-3 text-sm font-black cursor-pointer"
                >
                  <span>המשך להדגמה מוחשית</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ===============================================================
              STAGE 2: INTERACTIVE DEMONSTRATION (הדגמה חיה)
             =============================================================== */}
          {stepPhase === 'demo' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{activeLesson.demoTitle}</span>
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {activeLesson.demoDescription}
                  </p>
                </div>

                {renderInteractiveDemo()}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStepPhase('theory')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>חזרה להסבר</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStepPhase('practice');
                    setCurrentDrillIndex(0);
                    setSelectedOptionId(null);
                    setDrillAnsweredCorrectly(false);
                  }}
                  className="btn-duo-green flex items-center gap-2 px-6 py-3 text-sm font-black cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>הבנתי, בוא נתרגל!</span>
                </button>
              </div>
            </div>
          )}

          {/* ===============================================================
              STAGE 3: IMMEDIATE MICRO-DRILLS (תרגול בסיסי מיידי)
             =============================================================== */}
          {stepPhase === 'practice' && currentDrill && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-700">
                    תרגיל מהיר {currentDrillIndex + 1} מתוך {activeLesson.drills.length}
                  </span>
                  {currentDrill.highlightBadge && (
                    <span className="px-3.5 py-1 rounded-xl bg-slate-900 text-amber-300 font-mono font-black text-base shadow-2xs">
                      {currentDrill.highlightBadge}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {currentDrill.prompt}
                  </h3>
                  {currentDrill.subPrompt && (
                    <p className="text-xs text-slate-500 font-medium">{currentDrill.subPrompt}</p>
                  )}
                </div>

                {/* 4 Multiple-Choice Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentDrill.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    let cardStyle = 'bg-white border-slate-200 hover:border-slate-400 text-slate-900';
                    if (isSelected) {
                      cardStyle = opt.isCorrect
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-400/20';
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleChooseOption(opt.id)}
                        className={`p-4 rounded-2xl border-2 text-right transition-all cursor-pointer flex items-center justify-between gap-3 ${cardStyle}`}
                      >
                        <div>
                          <div className="text-sm sm:text-base font-black">{opt.label}</div>
                          {opt.subLabel && (
                            <div className="text-xs text-slate-500 font-medium mt-0.5">
                              {opt.subLabel}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="shrink-0">
                            {opt.isCorrect ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            ) : (
                              <XCircle className="w-6 h-6 text-rose-600" />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Immediate Visual Feedback Banner */}
                {selectedOption && (
                  <div
                    className={`p-4 rounded-2xl border-2 flex items-start gap-3 animate-fadeIn ${
                      selectedOption.isCorrect
                        ? 'bg-emerald-100/80 border-emerald-400 text-emerald-950'
                        : 'bg-rose-100/80 border-rose-300 text-rose-950'
                    }`}
                  >
                    {selectedOption.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 text-xs sm:text-sm">
                      <strong className="font-black block">
                        {selectedOption.isCorrect ? 'תשובה נכונה! כל הכבוד!' : 'לא בדיוק – נסה שוב:'}
                      </strong>
                      <p className="font-medium leading-relaxed">{selectedOption.feedback}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStepPhase('demo')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>חזרה להדגמה</span>
                </button>

                {drillAnsweredCorrectly && (
                  <button
                    type="button"
                    onClick={handleNextDrillOrFinish}
                    className="btn-duo-green flex items-center gap-2 px-6 py-3 text-sm font-black cursor-pointer animate-fadeIn"
                  >
                    <span>
                      {currentDrillIndex < activeLesson.drills.length - 1
                        ? 'המשך לתרגיל הבא'
                        : 'סיים שיעור וקבל 25+ XP!'}
                    </span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ===============================================================
              STAGE 4: LESSON COMPLETED SUMMARY
             =============================================================== */}
          {stepPhase === 'completed' && (
            <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-3xl p-6 sm:p-8 text-center space-y-5 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <Trophy className="w-9 h-9" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-slate-900">
                  כל הכבוד! השלמת את שיעור &quot;{activeLesson.title}&quot;
                </h3>
                <p className="text-sm text-slate-600 font-medium max-w-lg mx-auto">
                  {activeLesson.keyTakeaway}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                {lessons.findIndex((l) => l.id === activeLesson.id) < lessons.length - 1 && (
                  <button
                    type="button"
                    onClick={handleGoToNextLesson}
                    className="btn-duo-green flex items-center gap-2 px-6 py-3 text-sm font-black cursor-pointer"
                  >
                    <span>המשך לשיעור הבא</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const meta = tracksMeta.find((t) => t.id === selectedTrack);
                    if (meta) onNavigateToPractice(meta.practiceTarget);
                  }}
                  className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold cursor-pointer transition-all"
                >
                  עבור לתרגול מעשי מלא במודולה זו &larr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

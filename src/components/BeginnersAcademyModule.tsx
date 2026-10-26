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
  Award,
  Check,
  Target,
  Brain,
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

interface TechniqueComprehensiveGuide {
  trackId: AcademyTrackId;
  formalTitle: string;
  academicSubtitle: string;
  overviewParagraph: string;
  scientificBasisTitle: string;
  scientificBasisText: string;
  stepByStepTitle: string;
  steps: {
    stepNumber: number;
    heading: string;
    description: string;
  }[];
  realWorldExamplesTitle: string;
  realWorldExamples: {
    scenario: string;
    inputData: string;
    encodedProcess: string;
    finalMentalImage: string;
  }[];
  summaryConclusion: string;
  handsOnDrills: MicroDrillQuestion[];
}

interface AcademyLesson {
  id: string;
  trackId: AcademyTrackId;
  lessonNumber: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  theorySections: {
    heading: string;
    content: string;
  }[];
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
const COMPLETED_TECHNIQUE_PRACTICE_KEY = 'mem_beginners_academy_tech_practice_v1';

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

  const connLettersStr =
    connectingLetters.length > 0 ? connectingLetters.join(', ') : 'א, ה, ו, י, נ, ע';

  // =========================================================================
  // COMPREHENSIVE FORMAL GUIDES (~300 WORDS PER TECHNIQUE) + 6 EASY EXERCISES
  // =========================================================================
  const techniqueGuides: Record<AcademyTrackId, TechniqueComprehensiveGuide> = useMemo(() => {
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
    const p7 = getPrimaryLetter(7);
    const p8 = getPrimaryLetter(8);
    const p9 = getPrimaryLetter(9);

    return {
      major: {
        trackId: 'major',
        formalTitle: 'המערכת הפונטית (The Major System) – מדריך מתודולוגי מלא',
        academicSubtitle: 'קידוד דו-כיווני של מידע מספרי מופשט לעצמים פיזיים מוחשיים באמצעות מיפוי עיצורים ואותיות חיבור',
        overviewParagraph:
          'המערכת הפונטית (Major System) מהווה את אבן הראשה של עולם המנמוניקה המודרני. הזיכרון האנושי מתקשה באופן טבעי בשימור רצפים מספריים מופשטים – כגון תאריכים היסטוריים, מספרי טלפון, קודי גישה או נתונים פיננסיים – משום שספרות חסרות משמעות חושית או מרחבית. שיטת ה-Major פותרת מגבלה קוגניטיבית זו באמצעות תרגום שיטתי של כל ספרה (0 עד 9) לעיצור פונטי קבוע בשפה העברית, והרכבת מילים המתארות חפצים פיזיים מוחשיים שאותם המוח מסוגל לדמיין ולשלוף ללא מאמץ.',
        scientificBasisTitle: 'הבסיס הנוירו-קוגניטיבי: תאוריית הקידוד הכפול (Dual Coding Theory)',
        scientificBasisText:
          'על פי מחקריו של פרופ׳ אלן פאביו (Allan Paivio), המוח האנושי מעבד מידע בשני ערוצים מקבילים: הערוץ המילולי-פונטי והערוץ החזותי-מרחבי. כאשר אנו ממירים מספר יבש (כגון 07) למילה בעלת דימוי חזותי מובהק של חפץ מוחשי ("סיר"), אנו מפעילים במקביל את קליפת המוח השמיעתית ואת קליפת המוח הראייתית, ובכך מכפילים את חוזק הקשר הסינפטי.',
        stepByStepTitle: 'תהליך הלמידה והיישום שלב-אחר-שלב',
        steps: [
          {
            stepNumber: 1,
            heading: 'שלב א׳: הפנמת טבלת המיפוי הפונטית (ספרות 0–9)',
            description: `לכל ספרה מוקצה עיצור קבוע: 0=${l0}, 1=${l1}, 2=${l2}, 3=${l3}, 4=${l4}, 5=${l5}, 6=${l6}, 7=${l7}, 8=${l8}, 9=${l9}.`,
          },
          {
            stepNumber: 2,
            heading: 'שלב ב׳: פירוק המספר לרצף עיצורים עוקב',
            description:
              'בעת קבלת מספר יעד, קוראים את הספרות משמאל לימין וממירים כל ספרה לעיצור המקביל לה במיפוי האישי.',
          },
          {
            stepNumber: 3,
            heading: 'שלב ג׳: שיבוץ "אותיות החיבור השקופות" ("אני עונה")',
            description: `אותיות החיבור המותרות [${connLettersStr}] אינן נושאות ערך מספרי כלל. הן משמשות כ"דבק לשוני" שניתן לשבץ בחופשיות בין העיצורים לצורך יצירת מילה תקנית בעברית.`,
          },
          {
            stepNumber: 4,
            heading: 'שלב ד׳: בחירת חפץ פיזי מוחשי בלבד ויצירת דימוי חי',
            description:
              'המילה הנבחרת חייבת לתאר עצם פיזי או חפץ מוחשי שניתן לראות ולגעת בו (כגון "סיר", "בננה", "לפיד"), ולא מושג מופשט או שם פרטי.',
          },
        ],
        realWorldExamplesTitle: 'דוגמאות מעשיות מהעולם האמיתי',
        realWorldExamples: [
          {
            scenario: 'זכירת קוד כספת או קוד דלת כניסה (4 ספרות)',
            inputData: 'הקוד: 07-81',
            encodedProcess: `זוג ראשון 07 (${p0}+${p7} עם אות חיבור י׳) = "סיר". זוג שני 81 (${p8}+${p1} עם אותיות חיבור ע׳, י׳) = "מעיל".`,
            finalMentalImage: 'מדמיינים סיר מרק רותח שנשפך ישירות לתוך כיס של מעיל עור ענק התלוי על דלת הכניסה.',
          },
          {
            scenario: 'זכירת שנת אירוע היסטורי (למשל הצהרת בלפור – 1917)',
            inputData: 'השנה: 19-17',
            encodedProcess: `זוג ראשון 19 (${p1}+${p9}) = "לף" / "אלוף". זוג שני 17 (${p1}+${p7}) = "לירה" (מטבע).`,
            finalMentalImage: 'אלוף מעוטר בדרגות מושיט ללורד בלפור מטבע לירה מזהב נוצץ.',
          },
        ],
        summaryConclusion:
          'שליטה מלאה בשיטת ה-Major מאפשרת לתרגם כל מספר דו-ספרתי לחפץ מוחשי בתוך שבריר שנייה, ומהווה את הבסיס הישיר לבניית מערכת ה-PAO המתקדמת.',
        handsOnDrills: [
          {
            id: 'tech-major-1',
            prompt: 'תרגיל 1 (רמת בסיס): איזה עיצור מייצג את הספרה 0 במיפוי ה-Major?',
            highlightBadge: 'ספרה: 0',
            subPrompt: 'רמז: הצליל הפותח של המילה האנגלית Zero והצורה העגולה של האות.',
            options: [
              { id: 'a', label: l0, subLabel: 'למשל בחפץ "סוס"', isCorrect: true, feedback: `נכון מאוד! הספרה 0 ממופה לעיצור ${l0}.` },
              { id: 'b', label: l1, subLabel: 'קו אנכי', isCorrect: false, feedback: `לא מדויק. העיצור ${l1} שייך לספרה 1. הספרה 0 היא ${l0}.` },
              { id: 'c', label: l2, subLabel: 'האות השנייה', isCorrect: false, feedback: `העיצור ${l2} שייך לספרה 2. הספרה 0 היא ${l0}.` },
              { id: 'd', label: l8, subLabel: 'אמצע המילה שמונה', isCorrect: false, feedback: `העיצור ${l8} שייך לספרה 8. הספרה 0 היא ${l0}.` },
            ],
          },
          {
            id: 'tech-major-2',
            prompt: 'תרגיל 2 (רמת בסיס): איזו ספרה מיוצגת על ידי העיצור ל׳?',
            highlightBadge: 'עיצור: ל׳',
            subPrompt: 'התבונן בקו האנכי הגבוה של האות ל׳.',
            options: [
              { id: 'a', label: '1', subLabel: 'קו אנכי בודד', isCorrect: true, feedback: 'מצוין! האות ל׳ מייצגת את הספרה 1 (כמו בחפץ "עלה").' },
              { id: 'b', label: '3', subLabel: 'ג / ק / כ', isCorrect: false, feedback: 'הספרה 3 מיוצגת על ידי ג, ק, כ. האות ל׳ מייצגת את הספרה 1.' },
              { id: 'c', label: '5', subLabel: 'חמש', isCorrect: false, feedback: 'הספרה 5 מיוצגת על ידי ח׳. האות ל׳ מייצגת את הספרה 1.' },
              { id: 'd', label: '7', subLabel: 'ר׳ הפוכה', isCorrect: false, feedback: 'הספרה 7 מיוצגת על ידי ר׳. האות ל׳ מייצגת את הספרה 1.' },
            ],
          },
          {
            id: 'tech-major-3',
            prompt: 'תרגיל 3 (רמת בסיס): איזו מהמילים הבאות היא חפץ מוחשי חוקי עבור הספרה 2 (עיצור ב׳)?',
            highlightBadge: 'ספרה: 2 (ב׳)',
            subPrompt: `זכור: מותר להשתמש רק בעיצור ב׳ ובאותיות החיבור השקופות (${connLettersStr}).`,
            options: [
              { id: 'a', label: 'בננה', subLabel: 'ב + נ + נ + ה (חפץ מוחשי)', isCorrect: true, feedback: 'מדויק! "בננה" מכילה רק את העיצור ב׳ (2) ואותיות חיבור שקופות (נ, ה), והיא עצם מוחשי ברור.' },
              { id: 'b', label: 'ברק', subLabel: 'ב + ר + ק', isCorrect: false, feedback: 'שגוי עבור 2: המילה "ברק" מכילה גם את העיצורים ר׳ (7) ו-ק׳ (3).' },
              { id: 'c', label: 'בלון', subLabel: 'ב + ל + ו + ן', isCorrect: false, feedback: 'במילה "בלון" מופיע גם העיצור ל׳ (1), ולכן היא מייצגת את המספר הדו-ספרתי 21.' },
              { id: 'd', label: 'בני', subLabel: 'שם פרטי / שייכות', isCorrect: false, feedback: 'שיטת ה-Major דורשת אך ורק חפצים ועצמים פיזיים מוחשיים, ולא שמות פרטיים או כינויים.' },
            ],
          },
          {
            id: 'tech-major-4',
            prompt: 'תרגיל 4 (רמת בסיס): מהו תפקידן של "אותיות החיבור" (א, ה, ו, י, נ, ע) בשיטת ה-Major?',
            highlightBadge: 'אותיות חיבור: אני עונה',
            subPrompt: 'האם לאותיות אלו יש ערך מספרי?',
            options: [
              { id: 'a', label: 'אין להן שום ערך מספרי – הן משמשות כדבק חופשי להרכבת מילים של חפצים', isCorrect: true, feedback: 'נכון מאוד! אותיות "אני עונה" הן שקופות לחלוטין ומאפשרות לחבר עיצורים למילה תקנית.' },
              { id: 'b', label: 'כל אות חיבור שווה לספרה 0', isCorrect: false, feedback: 'שגוי – הספרה 0 מיוצגת על ידי ס, ז, שׂ. לאותיות החיבור אין שום ערך מספרי.' },
              { id: 'c', label: 'מותר להשתמש בהן רק בתחילת המילה', isCorrect: false, feedback: 'מותר לשבץ אותיות חיבור בתחילת המילה, באמצעה ובסופה ללא הגבלה.' },
              { id: 'd', label: 'הן מחליפות את העיצורים של המספר', isCorrect: false, feedback: 'הן אינן מחליפות את עיצורי המספר אלא מצטרפות אליהם כדי ליצור מילה קריאה.' },
            ],
          },
          {
            id: 'tech-major-5',
            prompt: 'תרגיל 5 (רמת בסיס): איזה מספר דו-ספרתי מיוצג על ידי החפץ "סיר"?',
            highlightBadge: 'חפץ: סיר',
            subPrompt: 'סנן את אות החיבור השקופה י׳ ובדוק את ערך העיצורים ס׳ ו-ר׳.',
            options: [
              { id: 'a', label: '07', subLabel: 'ס (0) + י (חיבור) + ר (7)', isCorrect: true, feedback: 'מצוין! ס׳ = 0, י׳ = אות חיבור שקופה, ר׳ = 7. לכן החפץ "סיר" מקודד את המספר 07.' },
              { id: 'b', label: '70', subLabel: 'ר (7) + ס (0)', isCorrect: false, feedback: 'שים לב לכיוון הקריאה: האות ס׳ (0) מופיעה ראשונה והאות ר׳ (7) שנייה, ולכן המספר הוא 07.' },
              { id: 'c', label: '01', subLabel: 'ס (0) + ל (1)', isCorrect: false, feedback: '01 מתאים למילה "סל". במילה "סיר" העיצור השני הוא ר׳ (7).' },
              { id: 'd', label: '67', subLabel: 'ש (6) + ר (7)', isCorrect: false, feedback: 'המילה "סיר" נפתחת באות ס׳ (0) ולא ב-שׁ׳ (6), ולכן היא 07.' },
            ],
          },
          {
            id: 'tech-major-6',
            prompt: 'תרגיל 6 (רמת בסיס): איזה חפץ מתאים לקידוד המספר הדו-ספרתי 21 (עיצורים ב׳ ואז ל׳)?',
            highlightBadge: 'מספר: 21 (ב + ל)',
            subPrompt: 'חפש חפץ שהעיצור הראשון שלו הוא ב׳ (2) והשני ל׳ (1) בתוספת אותיות חיבור בלבד.',
            options: [
              { id: 'a', label: 'בלון', subLabel: 'ב (2) + ל (1) + ו, ן (אותיות חיבור)', isCorrect: true, feedback: 'כל הכבוד! "בלון" מורכב מ-ב׳ (2), ל׳ (1) ואותיות החיבור ו׳, ן׳ – התאמה מושלמת למספר 21!' },
              { id: 'b', label: 'לב', subLabel: 'ל (1) + ב (2)', isCorrect: false, feedback: '"לב" מתחיל ב-ל׳ (1) ומסתיים ב-ב׳ (2), ולכן הוא מייצג את המספר 12 ולא 21.' },
              { id: 'c', label: 'ברז', subLabel: 'ב + ר + ז', isCorrect: false, feedback: 'במילה "ברז" אין את האות ל׳ כלל.' },
              { id: 'd', label: 'סולם', subLabel: 'ס + ל + מ', isCorrect: false, feedback: '"סולם" מתחיל ב-ס׳ (0) ולא ב-ב׳ (2).' },
            ],
          },
        ],
      },

      pao: {
        trackId: 'pao',
        formalTitle: 'מערכת השלשות (PAO System: Person-Action-Object) – מדריך מתודולוגי מלא',
        academicSubtitle: 'דחיסת רצפים של 6 ספרות לסצנה אפיזודית אחת באמצעות הפרדה לדמות, פעולה וחפץ',
        overviewParagraph:
          'מערכת ה-PAO (ראשי תיבות של Person – אדם, Action – פעולה, Object – חפץ) היא הטכניקה המרכזית המשמשת את אלופי הזיכרון העולמיים לשינון מהיר של מאות ואלפי ספרות. בעוד שבשיטת ה-Major כל מספר דו-ספרתי (00–99) מיוצג על ידי חפץ אחד בלבד, בשיטת ה-PAO מוקצית לכל מספר דו-ספרתי שלשה קבועה: דמות מוכרת בעלת ראשי תיבות תואמים, פעולה דינמית המאפיינת את הדמות באופן מובהק, וחפץ מוחשי הבנוי לפי חוקי ה-Major. מבנה זה מאפשר למזג שלושה מספרים דו-ספרתיים (6 ספרות סך הכל) לתמונה קולנועית אחת.',
        scientificBasisTitle: 'הבסיס הנוירו-קוגניטיבי: דחיסת מידע (Chunking) ואפקט פון רסטורף',
        scientificBasisText:
          'זיכרון העבודה האנושי מוגבל לקליטת יחידות מידע בודדות בו-זמנית. באמצעות איחוד של 6 ספרות לסצנה אחת (אדם מהזוג הראשון + פעולה מהזוג השני + חפץ מהזוג השלישי), אנו משיגים יחס דחיסה של 6:1. שילוב עקרון ה-SEE (חושים, רגש והגזמה) על רקע נקי מפעיל את אפקט פון רסטורף (Von Restorff Isolation Effect), המבטיח שהאירוע החריג ייחרט בזיכרון האפיזודי.',
        stepByStepTitle: 'תהליך הלמידה והיישום שלב-אחר-שלב',
        steps: [
          {
            stepNumber: 1,
            heading: 'שלב א׳: בחירת הדמות (Person) לפי חוק ראשי התיבות',
            description: `לכל מספר דו-ספרתי בוחרים אדם אמיתי או דמות מוכרת שראשי התיבות של שמה הפרטי ושם משפחתה תואמים לשתי ספרות המספר (למשל 00 = ${p0}.${p0}. סילבסטר סטאלון; 14 = ${p1}.${p4}. ליאונרדו דיקפריו).`,
          },
          {
            stepNumber: 2,
            heading: 'שלב ב׳: הצמדת פעולה מאפיינת מובהקת (Action)',
            description:
              'בוחרים פועל אקטיבי וקינטי בגוף שלישי הווה המזוהה באופן טבעי ובלתי נפרד עם הדמות (למשל: סטאלון -> "מתאגרף"; מסי -> "מכדרר ובועט"). כך אין צורך לשנן את הפעולה בנפרד.',
          },
          {
            stepNumber: 3,
            heading: 'שלב ג׳: הגדרת החפץ המוחשי (Object)',
            description:
              'בוחרים עצם פיזי מוחשי המקודד את המספר לפי חוקי ה-Major (עיצורי המספר + אותיות החיבור השקופות בלבד).',
          },
          {
            stepNumber: 4,
            heading: 'שלב ד׳: דחיסת 6 ספרות לסצנה אחת לפי הסדר הקבוע (P -> A -> O)',
            description:
              'מחלקים כל מספר בן 6 ספרות ל-3 זוגות משמאל לימין: הזוג הראשון מספק רק את האדם, הזוג השני רק את הפעולה, והזוג השלישי רק את החפץ.',
          },
        ],
        realWorldExamplesTitle: 'דוגמאות מעשיות מהעולם האמיתי',
        realWorldExamples: [
          {
            scenario: 'זכירת קוד אימות דו-שלבי (OTP) או מספר חשבון בן 6 ספרות',
            inputData: 'המספר: 00-21-07',
            encodedProcess:
              'זוג ראשון 00 (אדם) = סילבסטר סטאלון. זוג שני 21 (פעולה של ברוס לי) = בועט בעיטת קראטה. זוג שלישי 07 (חפץ) = סיר מרק.',
            finalMentalImage: 'סילבסטר סטאלון מזנק באוויר ומנחית בעיטת קראטה אדירה שמנפצת סיר מרק רותח לרסיסים.',
          },
          {
            scenario: 'זכירת 6 הספרות האחרונות של כרטיס אשראי או תעודת זהות',
            inputData: 'המספר: 23-18-81',
            encodedProcess:
              'זוג ראשון 23 (אדם ב.ג.) = ביל גייטס. זוג שני 18 (פעולה של ליונל מסי) = מכדרר ובועט. זוג שלישי 81 (חפץ מ+ל) = מעיל.',
            finalMentalImage: 'ביל גייטס מכדרר ובועט בעוצמה במעיל מתנפח שעף לתוך שער כדורגל.',
          },
        ],
        summaryConclusion:
          'מערכת ה-PAO מעניקה לך יכולת לדחוס מספרי טלפון, תאריכים ונתונים מורכבים לתמונות קולנועיות חדות, תוך שמירה על סדר הספרות המדויק.',
        handsOnDrills: [
          {
            id: 'tech-pao-1',
            prompt: 'תרגיל 1 (רמת בסיס): מה מייצגות האותיות P-A-O במערכת השלשות?',
            highlightBadge: 'P - A - O',
            subPrompt: 'בחר את שלושת המרכיבים בסדר הנכון משמאל לימין.',
            options: [
              { id: 'a', label: 'אדם (Person) • פעולה (Action) • חפץ (Object)', isCorrect: true, feedback: 'מדויק! הסדר הקבוע ב-PAO הוא תמיד: 1. אדם, 2. פעולה, 3. חפץ.' },
              { id: 'b', label: 'ארמון (Palace) • אזור (Area) • חפץ (Object)', isCorrect: false, feedback: 'לא מדויק. P-A-O מייצג Person (אדם), Action (פעולה), Object (חפץ).' },
              { id: 'c', label: 'תמונה (Picture) • אסוציאציה (Association) • סדר (Order)', isCorrect: false, feedback: 'שגוי. ראשי התיבות הם Person, Action, Object.' },
              { id: 'd', label: 'חפץ • אדם • פעולה', isCorrect: false, feedback: 'שים לב לסדר המחייב: תמיד אדם (P) ראשון, פעולה (A) שנייה, וחפץ (O) שלישי.' },
            ],
          },
          {
            id: 'tech-pao-2',
            prompt: `תרגיל 2 (רמת בסיס): לפי חוק ראשי התיבות של שדה "אדם", איזו דמות מתאימה למספר 14 (${p1}.${p4}.)?`,
            highlightBadge: `מספר 14 (${p1}.${p4}.)`,
            subPrompt: `השם הפרטי צריך להתחיל ב-${p1} (1) ושם המשפחה ב-${p4} (4).`,
            options: [
              { id: 'a', label: 'ליאונרדו דיקפריו', subLabel: 'ל.ד. (14)', isCorrect: true, feedback: 'מצוין! ליאונרדו (ל = 1) דיקפריו (ד = 4) מקיים במדויק את ראשי התיבות ל.ד. של מספר 14.' },
              { id: 'b', label: 'סילבסטר סטאלון', subLabel: 'ס.ס. (00)', isCorrect: false, feedback: 'סילבסטר סטאלון (ס.ס.) מתאים למספר 00.' },
              { id: 'c', label: 'ביל גייטס', subLabel: 'ב.ג. (23)', isCorrect: false, feedback: 'ביל גייטס (ב.ג.) מתאים למספר 23.' },
              { id: 'd', label: 'בראד פיט', subLabel: 'ב.פ. (29)', isCorrect: false, feedback: 'בראד פיט (ב.פ.) מתאים למספר 29.' },
            ],
          },
          {
            id: 'tech-pao-3',
            prompt: 'תרגיל 3 (רמת בסיס): כיצד יש לבחור את ה"פעולה" (Action) עבור דמות ב-PAO?',
            highlightBadge: 'בחירת פעולה (Action)',
            subPrompt: 'מה יגרום לפעולה להישלף מהזיכרון באופן אוטומטי ללא מאמץ?',
            options: [
              { id: 'a', label: 'לבחור פעולה אקטיבית המזוהה ומאפיינת באופן מובהק את הדמות עצמה', isCorrect: true, feedback: 'נכון מאוד! כשהפעולה נובעת ישירות מזהות הדמות (למשל רוקי -> מתאגרף), אין צורך לשנן אותה בנפרד.' },
              { id: 'b', label: 'לבחור פעולה פסיבית ושקטה כמו "חושב" או "ממתין"', isCorrect: false, feedback: 'פעולות פסיביות ומופשטות אינן יוצרות תמונה ויזואלית חדה ונשכחות במהירות.' },
              { id: 'c', label: 'לבחור את אותה הפעולה בדיוק לכל 100 הדמויות במערכת', isCorrect: false, feedback: 'חובה שכל פעולה תהיה ייחודית למספר שלה כדי שנדע לפענח איזה מספר היא מייצגת!' },
              { id: 'd', label: 'לבחור פעולה אקראית לחלוטין שאין לה שום קשר לדמות', isCorrect: false, feedback: 'פעולה אקראית תדרוש שינון מלאכותי קשה. קישור טבעי לדמות הוא סוד המהירות של PAO.' },
            ],
          },
          {
            id: 'tech-pao-4',
            prompt: 'תרגיל 4 (רמת בסיס): כמה ספרות נדחסות לתוך תמונה מנטלית אחת בודדת בשיטת PAO?',
            highlightBadge: 'דחיסת PAO',
            subPrompt: 'זוג ספרות לאדם + זוג ספרות לפעולה + זוג ספרות לחפץ.',
            options: [
              { id: 'a', label: '6 ספרות (3 זוגות של מספרים דו-ספרתיים)', isCorrect: true, feedback: 'מדויק! 2 ספרות לאדם + 2 ספרות לפעולה + 2 ספרות לחפץ = 6 ספרות בסצנה אחת!' },
              { id: 'b', label: '2 ספרות בלבד', isCorrect: false, feedback: '2 ספרות הן רק מרכיב אחד מתוך השלשה. סצנת PAO מלאה משלבת 3 זוגות = 6 ספרות.' },
              { id: 'c', label: 'ספרה אחת בלבד', isCorrect: false, feedback: 'סצנת PAO שלמה מקודדת 6 ספרות שלמות בתמונה אחת.' },
              { id: 'd', label: '3 ספרות בלבד', isCorrect: false, feedback: 'כל רכיב ב-PAO (אדם, פעולה, חפץ) מייצג מספר דו-ספרתי (00–99), ולכן יחד הם מייצגים 6 ספרות.' },
            ],
          },
          {
            id: 'tech-pao-5',
            prompt: 'תרגיל 5 (רמת בסיס): במספר בן 6 הספרות 23-00-07, איזה חלק מהמספר קובע את ה"פעולה" (Action) בסצנה?',
            highlightBadge: '23 - 00 - 07',
            subPrompt: 'זכור: זוג ראשון = אדם (P), זוג שני = פעולה (A), זוג שלישי = חפץ (O).',
            options: [
              { id: 'a', label: 'הזוג האמצעי: 00 (למשל הפעולה "מתאגרף")', isCorrect: true, feedback: 'בול! הזוג השני (00) מספק תמיד את הפעולה (Action), בעוד 23 מספק את האדם ו-07 את החפץ.' },
              { id: 'b', label: 'הזוג הראשון: 23', isCorrect: false, feedback: 'הזוג הראשון (23) קובע את האדם (Person) שמבצע את הפעולה.' },
              { id: 'c', label: 'הזוג השלישי: 07', isCorrect: false, feedback: 'הזוג השלישי (07) קובע את החפץ (Object) שעליו מתבצעת הפעולה.' },
              { id: 'd', label: 'כל שלושת הזוגות קובעים שלוש פעולות שונות', isCorrect: false, feedback: 'בסצנת PAO יש רק אדם אחד, פעולה אחת וחפץ אחד כדי לשמור על תמונה מאוחדת וברורה.' },
            ],
          },
          {
            id: 'tech-pao-6',
            prompt: 'תרגיל 6 (רמת בסיס): אם ביל גייטס = 23, מתאגרף = 00, וסיר = 07, איזה מספר בן 6 ספרות מקודד בסצנה: "ביל גייטס מתאגרף עם סיר"?',
            highlightBadge: 'פענוח סצנה למספר',
            subPrompt: 'תרגם לפי הסדר: אדם (ביל גייטס) -> פעולה (מתאגרף) -> חפץ (סיר).',
            options: [
              { id: 'a', label: '230007 (23-00-07)', isCorrect: true, feedback: 'אלוף! ביל גייטס (23) + מתאגרף (00) + סיר (07) מתפענחים מיד לרצף 230007!' },
              { id: 'b', label: '002307 (00-23-07)', isCorrect: false, feedback: 'שים לב: האדם בסצנה הוא ביל גייטס (23), ולכן המספר חייב להתחיל ב-23.' },
              { id: 'c', label: '070023 (07-00-23)', isCorrect: false, feedback: 'סדר הקריאה הוא תמיד אדם -> פעולה -> חפץ (23-00-07).' },
              { id: 'd', label: '230700 (23-07-00)', isCorrect: false, feedback: 'הפעולה "מתאגרף" (00) באה לפני החפץ "סיר" (07), ולכן הסדר הוא 23-00-07.' },
            ],
          },
        ],
      },

      palaces: {
        trackId: 'palaces',
        formalTitle: 'שיטת ארמונות הזיכרון (Method of Loci / Memory Palaces) – מדריך מתודולוגי מלא',
        academicSubtitle: 'רתימת מערכת הניווט המרחבי של ההיפוקמפוס לעיגון רשימות, מושגים ורצפים ארוכים בסדר מופתי',
        overviewParagraph:
          'שיטת ארמונות הזיכרון (Method of Loci), שפותחה ביוון וברומא העתיקה והוכחה במחקרי הדמיה מוחית מודרניים, נחשבת למערכת הארגון והשליפה החזקה ביותר העומדת לרשות הזיכרון האנושי. במקום לנסות לשנן פריטי מידע כשהם "תלויים באוויר", השיטה עושה שימוש במבנה פיזי אמיתי ומוכר היטב למשתמש – כגון בית המגורים, מקום העבודה או קמפוס הלימודים – ומשתמשת ברהיטים ובחפצים הקבועים שבו כ"תחנות עגינה" (Loci) שעליהן מציבים את המידע החדש לפי מסלול הליכה קבוע מראש.',
        scientificBasisTitle: 'הבסיס הנוירו-קוגניטיבי: תאי מקום ותאי רשת בהיפוקמפוס (פרס נובל 2014)',
        scientificBasisText:
          'תגליתם של פרופ׳ ג׳ון אוקיף ובני הזוג מוזר (זוכי פרס נובל לפיזיולוגיה או לרפואה לשנת 2014) הוכיחה כי בהיפוקמפוס ובקורטקס האנטורינאלי קיימת מערכת GPS ביולוגית של "תאי מקום" (Place Cells) ו"תאי רשת" (Grid Cells). מחקריה של פרופ׳ אלינור מגווייר הראו כי אצל אלופי זיכרון, אזורי הניווט המרחבי הללו מופעלים בעוצמה גבוהה בעת שינון מידע מופשט באמצעות ארמון זיכרון.',
        stepByStepTitle: 'תהליך הלמידה והיישום שלב-אחר-שלב',
        steps: [
          {
            stepNumber: 1,
            heading: 'שלב א׳: בחירת מבנה פיזי מוכר וחלוקה לחדרים',
            description:
              'בוחרים סביבה אמיתית שניתן לשחזר בעיני הרוח בבירור מוחלט (למשל: סלון הבית -> מטבח -> חדר שינה).',
          },
          {
            stepNumber: 2,
            heading: 'שלב ב׳: קביעת 5 תחנות ייחודיות בכל חדר לפי "חוק כיוון השעון"',
            description:
              'בכל חדר מגדירים 5 עצמים פיזיים קבועים ונבדלים זה מזה (למשל: 1. דלת כניסה, 2. מתלה מעילים, 3. ספה, 4. חלון מרפסת, 5. טלוויזיה) תוך צעידה עקבית בכיוון השעון.',
          },
          {
            stepNumber: 3,
            heading: 'שלב ג׳: הצבת המידע באמצעות "התנגשות קינטית" בתחנה',
            description:
              'מחברים כל פריט מידע (או סצנת PAO / חפץ Major) אל התחנה הפיזית באמצעות פעולה אקטיבית שבה הפריט מתנגש, ממיס, מרעיד או מפעיל את התחנה עצמה.',
          },
          {
            stepNumber: 4,
            heading: 'שלב ד׳: שליפה סדרתית באמצעות סיור מנטלי',
            description:
              'בעת המבחן או ההרצאה, צועדים בדמיון מתחנה לתחנה לפי המסלול הקבוע, והתמונה הקינטית קופצת לעיני הרוח באופן מיידי.',
          },
        ],
        realWorldExamplesTitle: 'דוגמאות מעשיות מהעולם האמיתי',
        realWorldExamples: [
          {
            scenario: 'זכירת ראשי פרקים למצגת עסקית או נאום ללא דפים',
            inputData: '1. פתיחה על צמיחה, 2. תקציב שנתי, 3. השקת מוצר חדש',
            encodedProcess:
              'תחנה 1 (דלת כניסה) = עץ צומח ענק שבוקע מידית הדלת. תחנה 2 (ספת הסלון) = מטילי זהב שמוחצים את כריות הספה. תחנה 3 (טלוויזיה) = טיל שיגור שמזנק מתוך המסך.',
            finalMentalImage: 'בזמן העמידה מול הקהל, צועדים בדמיון מהדלת לספה ולטלוויזיה ושולפים את כל נושאי ההרצאה בביטחון מלא.',
          },
          {
            scenario: 'שילוב ארמון זיכרון עם PAO לשינון מספר בן 18 ספרות',
            inputData: '3 סצנות PAO (כל אחת בת 6 ספרות)',
            encodedProcess:
              'מציבים את סצנת ה-PAO הראשונה בתחנה #1, את הסצנה השנייה בתחנה #2, ואת הסצנה השלישית בתחנה #3.',
            finalMentalImage: 'סיור ב-3 תחנות הסלון משחזר 18 ספרות ברצף מדויק.',
          },
        ],
        summaryConclusion:
          'ארמון הזיכרון מעניק לך "מגירות אחסון" מסודרות ונצחיות במוח, המונעות בלבול בסדר הפריטים ומאפשרות שליפה קדימה, אחורה וישירות לפי מספר תחנה.',
        handsOnDrills: [
          {
            id: 'tech-pal-1',
            prompt: 'תרגיל 1 (רמת בסיס): על איזה אזור במוח מתבססת שיטת ארמונות הזיכרון (Method of Loci)?',
            highlightBadge: 'מדע המוח',
            subPrompt: 'איבר במוח האחראי על ניווט מרחבי וזיכרון אפיזודי.',
            options: [
              { id: 'a', label: 'ההיפוקמפוס (תאי מקום ותאי רשת לניווט מרחבי)', isCorrect: true, feedback: 'מדויק! ההיפוקמפוס מכיל תאי מקום שממפים סביבות פיזיות ומאפשרים עיגון זיכרונות חזק במיוחד.' },
              { id: 'b', label: 'רפלקס השרירים בכף היד', isCorrect: false, feedback: 'ארמון זיכרון מבוסס על ניווט מרחבי בהיפוקמפוס במוח.' },
              { id: 'c', label: 'שינון שמיעתי מונוטוני ללא תמונות', isCorrect: false, feedback: 'ארמון זיכרון מבוסס על ראייה מרחבית ותחנות פיזיות בהיפוקמפוס.' },
              { id: 'd', label: 'מחיקת זיכרונות ישנים', isCorrect: false, feedback: 'אין צורך למחוק דבר – ההיפוקמפוס יוצר רשתות סינפטיות עשירות לשימור מידע.' },
            ],
          },
          {
            id: 'tech-pal-2',
            prompt: 'תרגיל 2 (רמת בסיס): מהו "חוק כיוון השעון" בבניית ארמון זיכרון?',
            highlightBadge: '🧭 חוק כיוון השעון',
            subPrompt: 'כיצד מסדרים את התחנות בתוך כל חדר בארמון?',
            options: [
              { id: 'a', label: 'סורקים וקובעים את התחנות ברצף עקבי לאורך קירות החדר בכיוון השעון (למשל משמאל לימין)', isCorrect: true, feedback: 'נכון מאוד! הליכה בכיוון השעון מונעת דילוג על תחנות ומבטיחה סדר שליפה מושלם.' },
              { id: 'b', label: 'בוחרים תחנות רק אם יש שעון קיר תלוי מעליהן', isCorrect: false, feedback: 'אין צורך בשעון אמיתי – הכוונה היא לכיוון ההליכה המעגלי לאורך קירות החדר.' },
              { id: 'c', label: 'קופצים באקראי מפינה לפינה בכל פעם שנכנסים לחדר', isCorrect: false, feedback: 'קפיצה אקראית הורסת את סדר הפריטים. מסלול קבוע בכיוון השעון הוא המפתח!' },
              { id: 'd', label: 'מתחילים תמיד מהחדר האחרון בבית', isCorrect: false, feedback: 'מתחילים מנקודת כניסה טבעית (כמו דלת הכניסה) ומתקדמים בכיוון השעון.' },
            ],
          },
          {
            id: 'tech-pal-3',
            prompt: 'תרגיל 3 (רמת בסיס): כמה תחנות (Loci) מומלץ להגדיר בכל חדר בארמון זיכרון תקני?',
            highlightBadge: 'מספר תחנות לחדר',
            subPrompt: 'כמות אופטימלית שמונעת צפיפות ומאפשרת חלוקה נוחה לחמישיות.',
            options: [
              { id: 'a', label: '5 תחנות קבועות וברורות בכל חדר', isCorrect: true, feedback: 'מצוין! 5 תחנות לחדר שומרות על מרווח ויזואלי נקי ומאפשרות לך לדעת מיד שתחנה 10 היא סוף חדר 2.' },
              { id: 'b', label: '100 תחנות צפופות בתוך אותה מגירה קטנה', isCorrect: false, feedback: 'צפיפות יתר גורמת להתנגשות זיכרונות. 5 תחנות מובחנות בחדר הן המינון האופטימלי.' },
              { id: 'c', label: 'תחנה אחת בלבד בכל הבית', isCorrect: false, feedback: 'תחנה אחת לא תאפשר לך לזכור רשימות. 5 תחנות בכל חדר נותנות עשרות עוגנים חזקים.' },
              { id: 'd', label: 'אפס תחנות', isCorrect: false, feedback: 'התחנות (Loci) הן הבסיס של ארמון הזיכרון – מומלץ להגדיר 5 תחנות בכל חדר.' },
            ],
          },
          {
            id: 'tech-pal-4',
            prompt: 'תרגיל 4 (רמת בסיס): איזה מהעצמים הבאים מהווה "תחנה" (Locus) אידיאלית בסלון הבית?',
            highlightBadge: 'בחירת תחנה תקנית',
            subPrompt: 'חפש רהיט/עצם קבוע, מוחשי וייחודי בחדר.',
            options: [
              { id: 'a', label: 'ספת הסלון המרכזית', subLabel: 'רהיט קבוע, גדול וברור בעיני הרוח', isCorrect: true, feedback: 'מדויק! ספת הסלון היא עצם קבוע ומוחשי שתמיד נמצא באותו מיקום במסלול.' },
              { id: 'b', label: 'כוס מים זמנית שהונחה לרגע על הרצפה', isCorrect: false, feedback: 'חפץ זמני שמשנה מיקום אינו מתאים כתחנה קבועה בארמון.' },
              { id: 'c', label: 'האוויר במרכז החדר', isCorrect: false, feedback: 'אוויר ריק אינו מספק עוגן ויזואלי להצמדת המידע.' },
              { id: 'd', label: 'מחשבה מופשטת', isCorrect: false, feedback: 'תחנה בארמון חייבת להיות אובייקט פיזי מוחשי במרחב.' },
            ],
          },
          {
            id: 'tech-pal-5',
            prompt: 'תרגיל 5 (רמת בסיס): כיצד מציבים פריט מידע (למשל "בקבוק חלב") על גבי תחנה בארמון (למשל "דלת הכניסה")?',
            highlightBadge: 'התנגשות קינטית בתחנה',
            subPrompt: 'מה יגרום לדלת הכניסה להקפיץ לך מיד את בקבוק החלב?',
            options: [
              { id: 'a', label: 'יוצרים אינטראקציה קינטית מוגזמת: בקבוק חלב ענק מתנפץ על ידית הדלת ומציף את המנעול!', isCorrect: true, feedback: 'מעולה! כשהחלב מתנגש בדלת עצמה, עצם המבט על הדלת ישלוף מיד את החלב.' },
              { id: 'b', label: 'מדמיינים בקבוק חלב סגור שעומד בשקט במכולת רחוקה מהבית', isCorrect: false, feedback: 'אם החלב אינו נוגע בתחנה (דלת הכניסה), הדלת לא תזכיר לך אותו בזמן השליפה.' },
              { id: 'c', label: 'כותבים בדמיון אותיות קטנות ואפורות על הרצפה', isCorrect: false, feedback: 'טקסט כתוב בעיני הרוח נמחק במהירות. תמיד השתמש בחפץ מתנגש ורב-חושי!' },
              { id: 'd', label: 'מדלגים על התחנה בלי לדמיין דבר', isCorrect: false, feedback: 'חובה ליצור תמונת אינטראקציה קצרה (שנייה או שתיים) בין הפריט לתחנה.' },
            ],
          },
          {
            id: 'tech-pal-6',
            prompt: 'תרגיל 6 (רמת בסיס): אם תחנה #1 היא דלת הכניסה, תחנה #2 היא מתלה המעילים, ותחנה #3 היא ספת הסלון – והצבת על ספת הסלון "בננה ענקית קורעת כריות", מהו הפריט השלישי ברשימה שלך?',
            highlightBadge: 'שליפה מתחנה #3',
            subPrompt: 'צעד בדמיון לתחנה #3 (ספת הסלון) ובדוק מה פועל עליה.',
            options: [
              { id: 'a', label: 'בננה', subLabel: 'מוצבת על תחנה #3 (ספת הסלון)', isCorrect: true, feedback: 'ראית כמה זה מיידי? תחנה #3 היא הספה -> על הספה קופצת בננה -> הפריט השלישי הוא בננה!' },
              { id: 'b', label: 'מעיל', subLabel: 'שם של תחנה #2', isCorrect: false, feedback: 'מתלה המעילים הוא תחנה #2. בתחנה #3 (הספה) הצבנו בננה.' },
              { id: 'c', label: 'דלת', subLabel: 'שם של תחנה #1', isCorrect: false, feedback: 'דלת הכניסה היא התחנה הראשונה עצמה. הפריט שהוצב בתחנה #3 הוא בננה.' },
              { id: 'd', label: 'אי אפשר לדעת מה מקומו ברשימה', isCorrect: false, feedback: 'זהו בדיוק היתרון של ארמון הזיכרון: כיוון שהספה היא תחנה #3, אנחנו יודעים בוודאות שהבננה היא פריט מספר 3!' },
            ],
          },
        ],
      },

      names: {
        trackId: 'names',
        formalTitle: 'שיטת זכירת שמות ופנים (Names & Faces Protocol) – מדריך מתודולוגי מלא',
        academicSubtitle: 'קישור פונטי-מורפולוגי בין תווי פנים בולטים למילות תחליף מוחשיות לשליפה חברתית ועסקית מיידית',
        overviewParagraph:
          'הקושי הנפוץ ביותר בחיי היומיום והעסקים הוא תופעת "הפנים מוכרות לי, אך השם פרח מזיכרוני". הסיבה הנוירולוגית לכך היא אסימטריה קוגניטיבית: המוח האנושי מצויד באזור ייעודי לעיבוד וזיהוי פנים חזותי, בעוד ששמות פרטיים (כגון "רונן", "דני" או "כרמל") הם צלילים שרירותיים חסרי משמעות מוחשית. פרוטוקול שמות ופנים מגשר על הפער הזה באמצעות המרת השם המופשט ל"מילת תחליף מוחשית" (Substitute Word) וחיבורה הפיזי לתו בולט בפניו של האדם ("עוגן מורפולוגי").',
        scientificBasisTitle: 'הבסיס הנוירו-קוגניטיבי: גישור אזור הפנים הפוסיפורמי (FFA) לקורטקס השמיעתי',
        scientificBasisText:
          'כאשר אנו מתבוננים בפניו של אדם, "אזור הפנים הפוסיפורמי" (Fusiform Face Area - FFA) מזהה אוטומטית את המאפיין הוויזואלי הבולט ביותר בפנים. באמצעות הצמדת חפץ תחליף פונטי ישירות לאותו איבר בולט בפנים, אנו הופכים את הפנים עצמן לטריגר ויזואלי שמפעיל את השליפה הפונטית של השם בפגישה הבאה.',
        stepByStepTitle: 'תהליך הלמידה והיישום שלב-אחר-שלב',
        steps: [
          {
            stepNumber: 1,
            heading: 'שלב א׳: קשב ממוקד וזיהוי "עוגן מורפולוגי" קבוע בפנים',
            description:
              'מתבוננים בפני האדם ובוחרים תו פנים קבוע אחד שלוכד את העין ראשונה (למשל: גבות עבות, זקן מרשים, תלתלים גולשים, חיוך רחב או מצח גבוה). לעולם אין לבחור פריט לבוש משתנה.',
          },
          {
            stepNumber: 2,
            heading: 'שלב ב׳: המרת השם ל"מילת תחליף מוחשית" (Substitute Word)',
            description:
              'מתרגמים את צליל השם לעצם פיזי מוחשי בעל צליל דומה או זהה (למשל: רונן -> רימון; דני -> דונאטס; כרמל -> סוכריית קרמל; אילן -> עץ אילן; ברק -> חזיז ברק).',
          },
          {
            stepNumber: 3,
            heading: 'שלב ג׳: היתוך קינטי (Fusion) בין מילת התחליף לעוגן בפנים',
            description:
              'מדמיינים במשך 2 שניות את חפץ התחליף צומח, מתנגש או פועל ישירות על העוגן בפנים (למשל: רימונים אדומים מתפוצצים מתוך הזקן העבה של רונן).',
          },
          {
            stepNumber: 4,
            heading: 'שלב ד׳: מסלול השליפה ההפוך בעת מפגש חוזר',
            description:
              'מבט בפנים -> העין נמשכת לעוגן הבולט (הזקן) -> העוגן מקפיץ את החפץ (רימון) -> החפץ מתרגם מיד לשם ("רונן").',
          },
        ],
        realWorldExamplesTitle: 'דוגמאות מעשיות מהעולם האמיתי',
        realWorldExamples: [
          {
            scenario: 'היכרות עם לקוח או שותף עסקי בכנס מקצועי',
            inputData: 'שם: דני • תו פנים בולט: גבות עבות במיוחד',
            encodedProcess: 'מילת תחליף ל"דני" = דונאטס מצופה שוקולד. עוגן בפנים = גבות עבות.',
            finalMentalImage: 'מדמיינים שני דונאטס מתוקים מסתובבים על גבי הגבות העבות של דני וזורים סוכריות צבעוניות.',
          },
          {
            scenario: 'זכירת שם של מרצה או קולגה חדשה בצוות',
            inputData: 'שם: כרמל • תו פנים בולט: שיער מתולתל וגולש',
            encodedProcess: 'מילת תחליף ל"כרמל" = קרמל זהוב. עוגן בפנים = תלתלים.',
            finalMentalImage: 'התלתלים של כרמל עשויים מסירופ קרמל זהוב, ריחני ומבריק.',
          },
        ],
        summaryConclusion:
          'יישום פרוטוקול עוגן-פנים + מילת-תחליף הופך כל היכרות חברתית או מקצועית לחוויה ויזואלית שנשמרת בזיכרון לטווח ארוך.',
        handsOnDrills: [
          {
            id: 'tech-names-1',
            prompt: 'תרגיל 1 (רמת בסיס): מדוע אסור לבחור "חולצה כחולה" או "עניבה אדומה" כעוגן לזכירת שמו של אדם?',
            highlightBadge: 'בחירת עוגן בפנים',
            subPrompt: 'מה יקרה כשתיפגשו שוב בשבוע הבא?',
            options: [
              { id: 'a', label: 'כי בגדים מתחלפים מיום ליום – חייבים לבחור תו קבוע בפנים עצמן (גבות, עיניים, זקן, חיוך, תלתלים)', isCorrect: true, feedback: 'מדויק! תווי הפנים נשארים עם האדם תמיד, בעוד שבגדים משתנים בכל פגישה.' },
              { id: 'b', label: 'כי הצבע הכחול קשה לדמיון', isCorrect: false, feedback: 'הבעיה אינה הצבע אלא העובדה שבגד אינו קבוע על פניו של האדם.' },
              { id: 'c', label: 'כי מותר לבחור רק נעליים כעוגן', isCorrect: false, feedback: 'גם נעליים מתחלפות! תמיד בוחרים עוגן מורפולוגי קבוע בפנים.' },
              { id: 'd', label: 'אין שום בעיה בבחירת חולצה', isCorrect: false, feedback: 'אם תקשר את השם לחולצה, לא תזהה את שמו כשהוא ילבש חולצה אחרת.' },
            ],
          },
          {
            id: 'tech-names-2',
            prompt: 'תרגיל 2 (רמת בסיס): מהי "מילת תחליף מוחשית" (Substitute Word) מצוינת עבור השם "רונן"?',
            highlightBadge: 'השם: רונן',
            subPrompt: 'חפש חפץ/פרי מוחשי שהצליל שלו קרוב מאוד לצליל השם "רונן".',
            options: [
              { id: 'a', label: 'רימון אדום ועסיסי', subLabel: 'רונן <-> רימון', isCorrect: true, feedback: 'מצוין! "רימון" נשמע דומה מאוד ל"רונן" ומעניק תמונה צבעונית ומוחשית שקל להצמיד לפנים.' },
              { id: 'b', label: 'כיסא משרדי', subLabel: 'אין קשר צלילי', isCorrect: false, feedback: 'בין "כיסא" ל"רונן" אין דמיון פונטי ולכן הכיסא לא יזכיר לך את השם.' },
              { id: 'c', label: 'אדם נחמד', subLabel: 'תיאור כללי מופשט', isCorrect: false, feedback: 'תיאור מופשט אינו נותן רמז פונטי לשליפת השם "רונן".' },
              { id: 'd', label: 'מקלדת מחשב', subLabel: 'אין דמיון פונטי', isCorrect: false, feedback: 'אין קשר צלילי לשם רונן. "רימון" מוביל ישירות ל"רונן"!' },
            ],
          },
          {
            id: 'tech-names-3',
            prompt: 'תרגיל 3 (רמת בסיס): איזו מילת תחליף מוחשית תתאים בצורה הטובה ביותר לשם הפרטי "דני"?',
            highlightBadge: 'השם: דני',
            subPrompt: 'חפש מאכל או חפץ מוחשי שמתחיל בצלילים ד-נ.',
            options: [
              { id: 'a', label: 'דונאטס מצופה שוקולד', subLabel: 'דני <-> דונאטס', isCorrect: true, feedback: 'בול! "דונאטס" חולק את העיצורים הפותחים ד-נ של "דני" והוא חפץ ויזואלי בולט מאוד.' },
              { id: 'b', label: 'שעון יד', isCorrect: false, feedback: 'אין דמיון פונטי בין "שעון" לבין "דני".' },
              { id: 'c', label: 'מנורת לילה', isCorrect: false, feedback: 'אין דמיון פונטי לשם דני.' },
              { id: 'd', label: 'ספר היסטוריה', isCorrect: false, feedback: 'אין דמיון פונטי לשם דני. "דונאטס" מזכיר מיד את הצליל "דני"!' },
            ],
          },
          {
            id: 'tech-names-4',
            prompt: 'תרגיל 4 (רמת בסיס): הכרת אדם בשם "ברק" שיש לו מצח גבוה ובולט. כיצד תחבר את שמו לפניו לפי השיטה?',
            highlightBadge: 'ברק + מצח גבוה',
            subPrompt: 'חבר את החפץ המוחשי ("חזיז ברק חשמלי") ישירות אל העוגן בפנים ("המצח הגבוה").',
            options: [
              { id: 'a', label: 'לדמיין חזיז ברק כחול וזוהר שיוצא מתוך המצח הגבוה שלו ומאיר את פניו!', isCorrect: true, feedback: 'מעולה! בפגישה הבאה המצח הגבוה יקפיץ מיד את תמונת חזיז הברק -> ותדע ששמו ברק!' },
              { id: 'b', label: 'לדמיין ברק בשמיים מעל עיר רחוקה בלי קשר לפנים שלו', isCorrect: false, feedback: 'ללא חיבור ישיר לתו בפנים שלו, המראה של פניו לא יפעיל את הזיכרון.' },
              { id: 'c', label: 'לומר לעצמך בלב "קוראים לו ברק" בלי לדמיין שום תמונה', isCorrect: false, feedback: 'חזרה מילולית בלבד מתפוגגת תוך שניות.' },
              { id: 'd', label: 'להביט ברצפה בזמן לחיצת היד', isCorrect: false, feedback: 'התבוננות קשובה בפנים ואיתור עוגן הם תנאי הכרחי ליצירת הקישור.' },
            ],
          },
          {
            id: 'tech-names-5',
            prompt: 'תרגיל 5 (רמת בסיס): מהו סדר הפעולות הנכון (בתוך 3 שניות) כשמכירים אדם חדש?',
            highlightBadge: 'סדר 3 הצעדים',
            subPrompt: 'מהעין -> אל הצליל -> אל החיבור.',
            options: [
              { id: 'a', label: '1. איתור עוגן בולט בפנים -> 2. המרת השם למילת תחליף מוחשית -> 3. חיבור מילת התחליף לעוגן בפנים', isCorrect: true, feedback: 'מדויק לחלוטין! שלושת הצעדים המהירים האלו מבטיחים זכירה מיידית של כל שם.' },
              { id: 'b', label: '1. ניחוש גילו -> 2. שאלה על מזג האוויר -> 3. שכחת השם', isCorrect: false, feedback: 'הנוסחה המקצועית היא: עוגן בפנים -> מילת תחליף -> חיבור ויזואלי.' },
              { id: 'c', label: 'כתיבת השם על פתק בלי להסתכל על פני האדם', isCorrect: false, feedback: 'פתק לא יעזור לך כשתפגוש את האדם במסדרון. החיבור לפניו הוא שעובד!' },
              { id: 'd', label: 'המרת השם למספר דו-ספרתי', isCorrect: false, feedback: 'בשמות ופנים אנו ממירים את השם ישירות למילת תחליף פונטית ומחברים לתו בפנים.' },
            ],
          },
          {
            id: 'tech-names-6',
            prompt: 'תרגיל 6 (רמת בסיס): פגשת שוב את האישה עם התלתלים הגולשים שעליהם דמיינת סירופ קרמל זהוב ומתוק. מהו שמה?',
            highlightBadge: 'תלתלים + קרמל זהוב',
            subPrompt: 'תלתלים -> קרמל -> השם הוא...',
            options: [
              { id: 'a', label: 'כרמל', subLabel: 'קרמל -> כרמל', isCorrect: true, feedback: 'כל הכבוד! תלתלים -> קרמל -> כרמל. השליפה עובדת באופן חלק וטבעי!' },
              { id: 'b', label: 'רונן', subLabel: 'רימון -> רונן', isCorrect: false, feedback: 'רימון בזקן שייך לרונן. קרמל בתלתלים שייך לכרמל!' },
              { id: 'c', label: 'דני', subLabel: 'דונאטס -> דני', isCorrect: false, feedback: 'דונאטס על הגבות שייך לדני. קרמל בתלתלים שייך לכרמל!' },
              { id: 'd', label: 'אילן', subLabel: 'עץ אילן', isCorrect: false, feedback: 'קרמל מוביל ישירות לשם "כרמל"!' },
            ],
          },
        ],
      },
    };
  }, [majorDigits, connectingLetters]);

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

    return [
      // =======================================================================
      // TRACK 1: THE MAJOR SYSTEM (שיטת ה-MAJOR)
      // =======================================================================
      {
        id: 'major-1',
        trackId: 'major',
        lessonNumber: 1,
        title: 'יסודות הקידוד הפונטי (ספרות 0 עד 4)',
        subtitle: 'המרת חמש הספרות הראשונות לעיצורים קבועים בעברית באמצעות עוגנים חזותיים ופונטיים',
        estimatedMinutes: 3,
        theorySections: [
          {
            heading: 'עקרון ההמרה הפונטית',
            content:
              'הזיכרון האנושי מתקשה בשימור ספרות מופשטות, אך מצטיין בזכירת תמונות של עצמים מוחשיים. שיטת ה-Major מגשרת על פער זה באמצעות חוק יסוד אחיד: לכל ספרה בין 0 ל-9 מוקצה צליל עיצור קבוע בשפה העברית.',
          },
          {
            heading: 'מיפוי הספרות 0 עד 4 במערכת שלך',
            content: `בחלק זה נפנים את חמש הספרות הראשונות לפי הגדרות הלוגיקה שלך: 0 = ${l0} (צליל שורק כבמילה Zero וצורה עגולה) | 1 = ${l1} (קו אנכי גבוה) | 2 = ${l2} (האות השנייה באלפבית) | 3 = ${l3} (האות השלישית ומשפחת החך) | 4 = ${l4} (האות הרביעית ומשפחת השיניים).`,
          },
        ],
        keyTakeaway: `מיפוי מחצית המפה הראשונה: 0 (${l0}), 1 (${l1}), 2 (${l2}), 3 (${l3}), 4 (${l4}).`,
        demoTitle: 'הדגמה אינטראקטיבית: מעבדת הספרות 0–4 והעוגן החזותי שלהן',
        demoDescription: 'לחץ על כל אחת מהספרות 0–4 כדי לבחון את העיצור הקבוע שלה ואת חפץ העוגן המייצג אותה:',
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
            prompt: 'במספר הדו-ספרתי 14, אילו שני עיצורים (לפי הסדר) מרכיבים את המספר?',
            highlightBadge: '14',
            subPrompt: 'קרא את הספרה הראשונה (1) ואחריה את הספרה השנייה (4).',
            options: [
              {
                id: 'a',
                label: `${p1} ואז ${p4}`,
                subLabel: 'למשל במילה "ילד"',
                isCorrect: true,
                feedback: `מצוין! ספרה 1 היא ${p1} וספרה 4 היא ${p4}, ולכן 14 נותן את העיצורים ${p1}+${p4} (כמו במילה "ילד").`,
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
        title: 'השלמת המפה הפונטית (ספרות 5 עד 9)',
        subtitle: 'הפנמת חמש הספרות המשלימות להשגת יכולת קידוד מלאה של כל מספר עשרוני',
        estimatedMinutes: 3,
        theorySections: [
          {
            heading: 'השלמת מערכת עשר הספרות',
            content: `לאחר רכישת השליטה בספרות 0 עד 4, נשלים את המחצית השנייה של המפה הפונטית (ספרות 5 עד 9): 5 = ${l5} (פותחת את המילה "חמש") | 6 = ${l6} (פותחת את המילה "שש") | 7 = ${l7} (צורת הספרה 7 כמקל הפוך של ר׳) | 8 = ${l8} (העיצור המרכזי במילה "שמונה") | 9 = ${l9} (צורת הספרה 9 כראי לאות פ׳).`,
          },
          {
            heading: 'מעבר אוטומטי מספרה לצליל',
            content:
              'שילוב כלל עשר הספרות מעניק לך אלפבית פונטי שלם. מעתה, כל רצף מספרי – מתאריך היסטורי ועד מספר תעודת זהות – מתורגם באופן מיידי לרצף עיצורים עבריים.',
          },
        ],
        keyTakeaway: `החצי השני של המפה: 5 (${l5}), 6 (${l6}), 7 (${l7}), 8 (${l8}), 9 (${l9}).`,
        demoTitle: 'הדגמה אינטראקטיבית: מפת הספרות 5 עד 9 והקשר המורפולוגי שלהן',
        demoDescription: 'לחץ על כל ספרה מ-5 עד 9 כדי לבחון את העיצור שלה ואת כלל הזיכרון החזותי:',
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
                feedback: `מדויק! הספרה 7 ממופה לעיצור ${l7} (כמו במילה "${getDigitWord(7) || 'נר'}").`,
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
                feedback: `נכון מאוד! האות פ׳ מייצגת את הספרה 9 (למשל במילה "${getDigitWord(9) || 'עפיפון'}").`,
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
        title: 'חוק "אותיות החיבור" והרכבת חפצים מוחשיים',
        subtitle: 'שימוש באותיות הדבק השקופות לבניית שמות עצם מוחשיים ללא שגיאות קידוד',
        estimatedMinutes: 4,
        theorySections: [
          {
            heading: 'תפקיד אותיות החיבור השקופות ("אני עונה")',
            content: `כדי להפוך צמד עיצורים כגון ס׳ (0) ו-ר׳ (7) למילה עברית תקנית, אנו נעזרים ב"אותיות החיבור השקופות": [${connLettersStr}]. לאותיות אלו אין ערך מספרי כלל – הן מתפקדות כ"דבק פונטי" שמותר לשבץ לפני, בין או אחרי עיצורי המספר.`,
          },
          {
            heading: 'דרישת המוחשיות הפיזית',
            content:
              'מילת Major תקנית חייבת לתאר חפץ פיזי או עצם מוחשי שניתן לראות בעיני הרוח (כגון "סיר", "בננה", "מעיל"), ואסור שתכיל אף עיצור מספרי זר שאינו שייך למספר היעד.',
          },
        ],
        keyTakeaway: `מילת Major חוקית מורכבת אך ורק מעיצורי המספר + אותיות החיבור השקופות (${connLettersStr}), ומתארת חפץ מוחשי!`,
        demoTitle: 'מעבדת פירוק והרכבת מילים: עיצורים מספריים לעומת אותיות חיבור שקופות',
        demoDescription: 'בחר דוגמה כדי לראות כיצד המערכת מפרידה בין עיצורים בעלי ערך מספרי לבין אותיות חיבור שקופות:',
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
                feedback: 'שגוי! במילה "ברז" מופיעים גם העיצורים ר׳ (7) ו-ז׳ (0), ולכן היא מייצגת 270 ולא את הספרה 2.',
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
                feedback: 'שים לב: במערכת ה-Major אנו בוחרים אך ורק חפצים ועצמים פיזיים מוחשיים (כמו "בננה" או "אבן") ולא שמות פרטיים.',
              },
            ],
          },
          {
            id: 'm3-q2',
            prompt: 'איזה מספר דו-ספרתי מקודד בתוך החפץ המוחשי "סיר"?',
            highlightBadge: 'סיר',
            subPrompt: 'סנן החוצה את אות החיבור השקופה (י׳) ובדוק את שני העיצורים שנשארו: ס׳ ואז ר׳.',
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
        title: 'מבנה שלשת ה-PAO וחוק ראשי התיבות לבחירת דמות (Person)',
        subtitle: 'הגדרת אדם, פעולה וחפץ לכל מספר דו-ספרתי (00–99) לפי ראשי תיבות קבועים',
        estimatedMinutes: 3,
        theorySections: [
          {
            heading: 'שלושת מרכיבי מערכת ה-PAO',
            content:
              'מערכת ה-PAO מרחיבה את שיטת ה-Major: במקום שלכל מספר דו-ספרתי (00–99) יוצמד חפץ בודד, אנו מצמידים לכל מספר שלשה קבועה: אדם מוכר (Person), פעולה אופיינית (Action), וחפץ מוחשי (Object).',
          },
          {
            heading: 'חוק ראשי התיבות לבחירת ה"אדם" (Person)',
            content: `כיצד מקשרים דמות למספר? לפי ראשי התיבות של שמה הפרטי ושם משפחתה! האות הראשונה של השם הפרטי תואמת לספרת העשרות, והאות הראשונה של שם המשפחה תואמת לספרת היחידות. לדוגמה: 00 (${p0}.${p0}.) = סילבסטר סטאלון; 14 (${p1}.${p4}.) = ליאונרדו דיקפריו.`,
          },
        ],
        keyTakeaway: 'בשדה "אדם" ב-PAO, ראשי התיבות של השם הפרטי ושם המשפחה תואמים לשתי הספרות של המספר!',
        demoTitle: 'הדגמה אינטראקטיבית: מפענח ראשי התיבות של דמויות PAO',
        demoDescription: 'לחץ על כל מספר כדי לראות כיצד שתי הספרות מכתיבות את ראשי התיבות של הדמות:',
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
                feedback: 'מדויק! סילבסטר (ס = 0) סטאלון (ס = 0) נותן ראשי תיבות ס.ס. שמתאימים בדיוק למספר 00!',
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
            prompt: 'הדמות "ביל גייטס" (ראשי תיבות ב.ג.) מייצגת איזה מספר דו-ספרתי?',
            highlightBadge: 'ביל גייטס (ב.ג.)',
            subPrompt: 'זכור: ב׳ = 2, ג׳ = 3.',
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
        subtitle: 'בחירת פועל דינמי הנובע מזהות הדמות להבטחת שליפה אוטומטית',
        estimatedMinutes: 4,
        theorySections: [
          {
            heading: 'עקרון הפעולה המאפיינת (Characteristic Action)',
            content:
              'יתרונה המרכזי של מערכת ה-PAO הוא שאין צורך לשנן את הפעולה כפרט מידע נפרד. הפעולה (Action) נבחרת כך שתהיה הפעולה המזוהה והאופיינית ביותר לדמות. כאשר חושבים על סילבסטר סטאלון (רוקי), הפעולה "מתאגרף" עולה בזיכרון באופן אוטומטי.',
          },
          {
            heading: 'הגדרת החפץ (Object) לפי חוקי ה-Major',
            content:
              'הרכיב השלישי בשלשה – החפץ – נבנה בדיוק לפי חוקי ה-Major שלמדנו (עיצורי המספר בתוספת אותיות החיבור השקופות בלבד). כך כל שלשת PAO מבוססת על חוקיות פונטית וסמנטית הדוקה.',
          },
        ],
        keyTakeaway: 'הפעולה חייבת לאפיין באופן מובהק את הדמות, והחפץ בנוי מעיצורי המספר + אותיות החיבור.',
        demoTitle: 'הדגמה אינטראקטיבית: זרימה טבעית מדמות לפעולה המאפיינת שלה',
        demoDescription: 'בחר דמות וראה כיצד הפעולה שלה נגזרת מזהותה המקצועית או התרבותית:',
        demoType: 'pao-person-action-link',
        drills: [
          {
            id: 'p2-q1',
            prompt: 'לפניך הדמות של מספר 00: "סילבסטר סטאלון" (רוקי בלבואה). איזו פעולה (Action) תאפשר שליפה מיידית ללא מאמץ?',
            highlightBadge: '👤 סילבסטר סטאלון',
            subPrompt: 'בחר בפעולה הפיזית והדינמית שמאפיינת את הדמות באופן מובהק:',
            options: [
              {
                id: 'a',
                label: 'מתאגרף בעוצמה',
                subLabel: 'פעולה מזוהה ישירות עם רוקי',
                isCorrect: true,
                feedback: 'מדויק! ברגע שתחשוב על סילבסטר סטאלון, המוח שלך ישלוף מיד את הפעולה "מתאגרף" ללא מאמץ!',
              },
              {
                id: 'b',
                label: 'סורג סוודר',
                subLabel: 'פעולה אקראית ללא קשר לדמות',
                isCorrect: false,
                feedback: 'פעולה אקראית כמו "סורג" תדרוש ממך שינון מלאכותי. תמיד בחר פעולה שמאפיינת את הדמות עצמה!',
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
        title: 'דחיסת 6 ספרות (6:1) ועקרון ה-SEE ליצירת סצנה',
        subtitle: 'מיזוג שלושה זוגות ספרות לסצנה רב-חושית אחת בעלת סדר פענוח חד-משמעי',
        estimatedMinutes: 4,
        theorySections: [
          {
            heading: 'נוסחת הדחיסה 6:1 (אדם -> פעולה -> חפץ)',
            content:
              'כדי לזכור מספר בן 6 ספרות (כגון 00-18-07) בתמונה מנטלית אחת, מחלקים אותו לשלושה זוגות משמאל לימין: הזוג הראשון (00) קובע אך ורק את האדם, הזוג השני (18) קובע אך ורק את הפעולה, והזוג השלישי (07) קובע אך ורק את החפץ.',
          },
          {
            heading: 'עקרון ה-SEE ואפקט פון רסטורף',
            content:
              'לצורך הטמעה עמוקה בזיכרון האפיזודי, הסצנה נבנית לפי עקרון ה-SEE: שילוב חושים מרובים (Senses – קול, ריח, מגע), עוררות רגשית והומור אבסורדי (Emotion), והגזמת פרופורציות ותנועה מתפרצת (Exaggeration) על רקע נקי (אפקט פון רסטורף).',
          },
        ],
        keyTakeaway: 'בכל רצף של 6 ספרות: זוג ראשון = אדם (P), זוג שני = פעולה (A), זוג שלישי = חפץ (O)!',
        demoTitle: 'סימולטור דחיסת 6 ספרות (PAO 6:1)',
        demoDescription: 'צפה כיצד שלושה זוגות ספרות מתמזגים לסצנה קולנועית אחת:',
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
                feedback: 'תמונה זו כוללת רק את 07 ("סיר") וחסרה את הדמות (00) והפעולה (18).',
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
                feedback: 'שינון מכאני מתפוגג תוך דקות. המוח זוכר חוויות רב-חושיות ומוגזמות!',
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
        title: 'ארכיטקטורת ארמון הזיכרון וחוק כיוון השעון',
        subtitle: 'שימוש במבנים מוכרים ובתאי המקום בהיפוקמפוס ליצירת מסלול תחנות קבוע',
        estimatedMinutes: 3,
        theorySections: [
          {
            heading: 'מערכת הניווט המרחבי של המוח (Method of Loci)',
            content:
              'בהיפוקמפוס האנושי פועלים "תאי מקום" ו"תאי רשת" (תגלית זוכת פרס נובל 2014) שתפקידם למפות סביבות פיזיות מוכרות. שיטת ארמון הזיכרון רותמת יכולת מולדת זו: אנו בוחרים מבנה מוכר היטב (כגון בית המגורים) והופכים את הרהיטים הקבועים שבו לתחנות עגינה למידע.',
          },
          {
            heading: 'חוק כיוון השעון וחלוקה ל-5 תחנות בחדר',
            content:
              'בכל חדר בארמון אנו מגדירים 5 עצמים פיזיים קבועים וייחודיים ("תחנות" או Loci) וצועדים ביניהם תמיד בכיוון השעון (משמאל לימין בכניסה לחדר), כדי להבטיח שסדר התחנות לעולם לא יתבלבל.',
          },
        ],
        keyTakeaway: 'ארמון זיכרון הוא מקום אמיתי שאתה מכיר היטב, שבו בוחרים 5 תחנות קבועות בכל חדר לפי כיוון השעון.',
        demoTitle: 'הדגמה אינטראקטיבית: סיור ב-5 תחנות הסלון לפי כיוון השעון',
        demoDescription: 'לחץ על התחנות בסלון לפי המסלול (1 עד 5) כדי להבין כיצד בונים מסלול יציב:',
        demoType: 'palace-clockwise-room',
        drills: [
          {
            id: 'pal1-q1',
            prompt: 'מדוע בארמון זיכרון אנו קובעים את התחנות בחדר לפי כיוון קבוע (כיוון השעון) ולא קופצים באקראי מצד לצד?',
            highlightBadge: '🧭 חוק כיוון השעון',
            subPrompt: 'חשוב מה קורה בזמן שליפה כשמנסים להיזכר מה הייתה תחנה מספר 3.',
            options: [
              {
                id: 'a',
                label: 'כדי שהמוח יוכל לשחזר את המסלול בסדר מדויק (1->2->3->4->5) בלי לדלג על אף תחנה',
                isCorrect: true,
                feedback: 'נכון מאוד! מסלול רציף בכיוון השעון מבטיח שתמיד תדע בדיוק מה התחנה הבאה ומה התחנה הקודמת!',
              },
              {
                id: 'b',
                label: 'כי אסור להשתמש ברהיטים שנמצאים בצד ימין של החדר',
                isCorrect: false,
                feedback: 'מותר ורצוי להשתמש בכל הרהיטים סביב החדר – פשוט מגיעים אליהם ברצף מסודר בכיוון השעון.',
              },
              {
                id: 'c',
                label: 'כי ארמון זיכרון חייב להיות אך ורק חדר עגול',
                isCorrect: false,
                feedback: 'כל חדר רגיל (מרובע או מלבני) מתאים מצוין – פשוט סורקים את קירותיו בכיוון סיבוב השעון.',
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
                feedback: 'אם שתי תחנות נראות בדיוק אותו דבר, המוח יתבלבל ביניהן. כל תחנה צריכה להיות ייחודית.',
              },
            ],
          },
        ],
      },
      {
        id: 'palaces-2',
        trackId: 'palaces',
        lessonNumber: 2,
        title: 'הצבת מידע בתחנות באמצעות התנגשות קינטית ושליפה',
        subtitle: 'חיבור פעיל ורב-חושי בין המידע הנלמד לבין התחנה הפיזית בארמון',
        estimatedMinutes: 4,
        theorySections: [
          {
            heading: 'עקרון ההתנגשות הקינטית בתחנה',
            content:
              'לאחר שהגדרנו מסלול תחנות קבוע (למשל: 1. דלת הכניסה, 2. ספת הסלון, 3. מסך הטלוויזיה), אנו מציבים בהן את המידע. הנחה פסיבית של חפץ על התחנה תוביל לשכחה; לכן אנו יוצרים "התנגשות קינטית" שבה הפריט מתנפץ, ממיס, מרעיד או מפעיל את התחנה הפיזית.',
          },
          {
            heading: 'שילוב Major ו-PAO בתוך תחנות הארמון',
            content:
              'ניתן להציב בכל תחנה פריט מתוך רשימה, מושג אקדמי, או סצנת PAO שלמה (המייצגת 6 ספרות). בעת השליפה, די להתבונן בעיני הרוח בתחנה כדי שהסצנה שהתרחשה בה תקפוץ מיד לתודעה.',
          },
        ],
        keyTakeaway: 'אל תניח פריטים בפסיביות על התחנה – גרום לפריט להתנגש, לשבור או להפעיל את התחנה עצמה!',
        demoTitle: 'הדגמה אינטראקטיבית: הצבה ושליפה מ-3 תחנות בארמון',
        demoDescription: 'ראה כיצד 3 פריטים מוצבים ב-3 תחנות הסלון באינטראקציה קינטית:',
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
                feedback: 'מדויק! ברגע שדמיינת את ספת הסלון, הבננה שקופצת עליה מיד עלתה בזיכרון!',
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
            prompt: 'ברצונך לזכור את המספר 07 (שמילת ה-Major שלו היא "סיר") בתחנה מספר 1 בארמון שלך ("דלת הכניסה"). מהי הדרך המקצועית לקודד זאת?',
            highlightBadge: 'שילוב Major + ארמון זיכרון',
            subPrompt: 'חבר את החפץ של המספר ("סיר") אל התחנה ("דלת הכניסה") באינטראקציה עוצמתית:',
            options: [
              {
                id: 'a',
                label: 'לדמיין סיר מרק רותח שנתקע בידית דלת הכניסה, מתיז אדים רועשים וממיס את הדלת!',
                isCorrect: true,
                feedback: 'מצוין! כשתגיע לדלת הכניסה (תחנה 1), תראה מיד את ה"סיר" הרותח -> תפרק את המילה "סיר" ל-ס׳ (0) ו-ר׳ (7) -> ותשלוף את המספר 07!',
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
        title: 'איתור "עוגן מורפולוגי בפנים" והמרת שם ל"מילת תחליף מוחשית"',
        subtitle: 'תרגום שמות מופשטים לחפצים פיזיים בעלי דמיון פונטי',
        estimatedMinutes: 3,
        theorySections: [
          {
            heading: 'פתרון האסימטריה בין זיהוי פנים לזכירת שמות',
            content:
              'פנים נחרתות בזיכרון החזותי מאחר שהן ויזואליות, ואילו שם פרטי (כגון "רונן" או "דני") הוא צליל מופשט. כדי לזכור שם של אדם חדש, אנו מבצעים שני שלבים: (1) מאתרים תו קבוע ובולט בפניו ("עוגן מורפולוגי" – כגון גבות עבות, זקן או תלתלים).',
          },
          {
            heading: 'יצירת מילת תחליף פונטית (Substitute Word)',
            content:
              'בשלב השני אנו ממירים את צליל השם ל"מילת תחליף" המתארת חפץ מוחשי שנשמע דומה (למשל: דני -> דונאטס; רונן -> רימון; כרמל -> סוכריית קרמל; אילן -> עץ אילן).',
          },
        ],
        keyTakeaway: 'לכל שם מוצאים מילת תחליף מוחשית שנשמעת דומה (דני -> דונאטס, רונן -> רימון).',
        demoTitle: 'הדגמה אינטראקטיבית: מתרגם השמות למילות תחליף מוחשיות',
        demoDescription: 'עיין בדוגמאות הבאות וראה כיצד כל שם מומר לחפץ מוחשי שקל לדמיין:',
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
                feedback: 'מצוין! המילה "רימון" חולקת את העיצורים עם "רונן" והיא חפץ בולט וצבעוני שקל מאוד לדמיין!',
              },
              {
                id: 'b',
                label: 'שמחה גדולה',
                subLabel: 'מושג מופשט',
                isCorrect: false,
                feedback: '"שמחה" היא רגש מופשט ולא חפץ מוחשי, וגם אינה נשמעת כמו "רונן".',
              },
              {
                id: 'c',
                label: 'שולחן כתיבה',
                subLabel: 'אין קשר פונטי לשם רונן',
                isCorrect: false,
                feedback: 'אין דמיון צלילי בין "שולחן" לבין "רונן".',
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
            prompt: 'הכרת באירוע אישה בשם "כרמל". איזו מילת תחליף מוחשית תעזור לך לזכור את שמה?',
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
        title: 'היתוך ויזואלי: חיבור מילת התחליף לעוגן בפנים',
        subtitle: 'יצירת טריגר אוטומטי שבו המבט בפני האדם שולף את שמו ללא מאמץ',
        estimatedMinutes: 4,
        theorySections: [
          {
            heading: 'שלב ההיתוך (Fusion) בין החפץ לתו הפנים',
            content:
              'לאחר שבחרנו עוגן בפנים (למשל: זקן עבה אצל רונן) ומילת תחליף לשם (רונן -> רימון), אנו יוצרים תמונה מנטלית שבה מילת התחליף פועלת ישירות על העוגן בפנים (רימונים אדומים מתפוצצים מתוך הזקן העבה).',
          },
          {
            heading: 'שרשרת השליפה האוטומטית במפגש חוזר',
            content:
              'בפגישה הבאה, עצם ההתבוננות בפניו של האדם תמשוך את עיניך אל התו הבולט ביותר (הזקן) -> הזקן יקפיץ לתודעה את תמונת הרימונים -> והמילה "רימון" תוביל מיד לשם "רונן".',
          },
        ],
        keyTakeaway: 'הנוסחה המלאה: פנים -> תו בולט (עוגן) -> חיבור מילת התחליף לעוגן -> שליפת השם!',
        demoTitle: 'הדגמה אינטראקטיבית: מעבדת חיבור פנים ושמות',
        demoDescription: 'עבור על 3 דמויות וראה כיצד העוגן בפנים + מילת התחליף יוצרים זיכרון מיידי:',
        demoType: 'names-face-anchor-fusion',
        drills: [
          {
            id: 'n2-q1',
            prompt: 'פגשת את "דני", שיש לו גבות עבות ובולטות במיוחד. מילת התחליף לדני היא "דונאטס". כיצד תחבר ביניהם בצורה המקצועית ביותר?',
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
            prompt: 'בדיקת שליפה מההדגמה: כשאתה פוגש את האדם עם ה"זקן העבה" שעליו דמיינו רימונים אדומים מתפוצצים – מהו שמו?',
            highlightBadge: 'שליפה בזמן אמת',
            subPrompt: 'זקן עבה -> רימונים מתפוצצים -> השם הוא...',
            options: [
              {
                id: 'a',
                label: 'רונן',
                subLabel: 'רימון -> רונן',
                isCorrect: true,
                feedback: 'מצוין! שלפת את השם בלי מאמץ! זקן -> רימון -> רונן.',
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

  // Completed hands-on technique practice exercises state
  const [completedPracticeIds, setCompletedPracticeIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(COMPLETED_TECHNIQUE_PRACTICE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(COMPLETED_TECHNIQUE_PRACTICE_KEY, JSON.stringify(completedPracticeIds));
    } catch {}
  }, [completedPracticeIds]);

  const [selectedTrack, setSelectedTrack] = useState<AcademyTrackId>('major');
  const [activeLessonId, setActiveLessonId] = useState<string>('major-1');
  const [stepPhase, setStepPhase] = useState<LessonStepPhase>('theory');

  // Dedicated Technique Practice Section state (at least 5-6 easy exercises per technique)
  const [activePracticeDrillIdx, setActivePracticeDrillIdx] = useState<number>(0);
  const [practiceSelectedOptId, setPracticeSelectedOptId] = useState<string | null>(null);
  const [practiceAnsweredCorrectly, setPracticeAnsweredCorrectly] = useState<boolean>(false);

  // Interactive Demo internal state
  const [demoSelectedDigit, setDemoSelectedDigit] = useState<number>(0);
  const [demoSelectedExampleIdx, setDemoSelectedExampleIdx] = useState<number>(0);

  // Micro-Drill state (inside individual lesson)
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

  const currentGuide = techniqueGuides[selectedTrack];
  const currentPracticeDrills = currentGuide.handsOnDrills;
  const activePracticeDrill =
    currentPracticeDrills[activePracticeDrillIdx] || currentPracticeDrills[0];
  const selectedPracticeOpt =
    activePracticeDrill?.options.find((o) => o.id === practiceSelectedOptId) || null;

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
    setActivePracticeDrillIdx(0);
    setPracticeSelectedOptId(null);
    setPracticeAnsweredCorrectly(false);
    const tLessons = lessons.filter((l) => l.trackId === trackId);
    const firstUncompleted = tLessons.find((l) => !completedLessonIds.includes(l.id));
    const targetLesson = firstUncompleted || tLessons[0];
    if (targetLesson) {
      handleSelectLesson(targetLesson);
    }
  };

  const handleChoosePracticeOption = (optId: string) => {
    if (practiceAnsweredCorrectly) return;
    setPracticeSelectedOptId(optId);
    const opt = activePracticeDrill?.options.find((o) => o.id === optId);
    if (opt?.isCorrect) {
      setPracticeAnsweredCorrectly(true);
      soundEffects.playSuccessChime();
      if (!completedPracticeIds.includes(activePracticeDrill.id)) {
        setCompletedPracticeIds((prev) => [...prev, activePracticeDrill.id]);
        onEarnPoints(15, `פתרון תרגיל מעשי באקדמיה: ${currentGuide.formalTitle}`);
      }
    } else {
      soundEffects.playErrorBuzzer();
    }
  };

  const handleNextPracticeDrill = () => {
    if (activePracticeDrillIdx < currentPracticeDrills.length - 1) {
      setActivePracticeDrillIdx((prev) => prev + 1);
      setPracticeSelectedOptId(null);
      setPracticeAnsweredCorrectly(false);
    } else {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.65 } });
      onEarnPoints(30, `השלמת כל תרגילי הבסיס בטכניקת ${currentGuide.formalTitle}`);
      setActivePracticeDrillIdx(0);
      setPracticeSelectedOptId(null);
      setPracticeAnsweredCorrectly(false);
    }
  };

  const currentDrill = activeLesson.drills[currentDrillIndex] || activeLesson.drills[0];
  const selectedOption = currentDrill?.options.find((o) => o.id === selectedOptionId) || null;

  const handleChooseOption = (optionId: string) => {
    if (drillAnsweredCorrectly) return;
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
  const trackProgressPercent = Math.round(
    (trackCompletedCount / Math.max(1, trackLessons.length)) * 100
  );

  const lessonInternalProgressPercent = useMemo(() => {
    if (stepPhase === 'theory') return 20;
    if (stepPhase === 'demo') return 50;
    if (stepPhase === 'practice') {
      const drillWeight = 45 / Math.max(1, activeLesson.drills.length);
      return Math.round(
        50 + currentDrillIndex * drillWeight + (drillAnsweredCorrectly ? drillWeight : 0)
      );
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

  // =========================================================================
  // COLORFUL ANIMATED SVG ILLUSTRATIONS FOR EACH TECHNIQUE
  // =========================================================================
  const renderTechniqueAnimatedVisual = (trackId: AcademyTrackId) => {
    switch (trackId) {
      case 'major':
        return (
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/15 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-right max-w-md">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>המחשה ויזואלית מונפשת: הגשר הפונטי</span>
                </span>
                <h4 className="text-lg font-black text-slate-900">
                  מספר מופשט &larr; עיצור פונטי &larr; חפץ מוחשי חי
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  צפה בתרשים הזרימה המונפש: הספרות <strong className="text-amber-800">07</strong> מתורגמות לעיצורים{' '}
                  <strong className="text-amber-800">ס + ר</strong>, מתחברות באמצעות אות החיבור השקופה{' '}
                  <strong className="text-emerald-700">י׳</strong>, ויוצרות דימוי חי של <strong className="text-amber-900">סיר מרק רותח</strong>.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                {/* Step 1: Digits */}
                <div className="w-24 h-24 rounded-2xl bg-slate-900 text-amber-400 border-2 border-amber-400 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105">
                  <span className="text-[10px] text-slate-300 font-bold">מספר יעד</span>
                  <span className="text-3xl font-mono font-black tracking-wider animate-pulse">07</span>
                </div>

                <div className="text-amber-600 font-black text-xl animate-bounce">&larr;</div>

                {/* Step 2: Consonants + Connecting Vowel */}
                <div className="px-4 h-24 rounded-2xl bg-white border-2 border-amber-400 flex flex-col items-center justify-center shadow-md">
                  <span className="text-[10px] text-slate-500 font-bold mb-1">פירוק פונטי</span>
                  <div className="flex items-center gap-1.5 text-xl font-black">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">ס (0)</span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-sm">+ י +</span>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">ר (7)</span>
                  </div>
                </div>

                <div className="text-amber-600 font-black text-xl animate-bounce">&larr;</div>

                {/* Step 3: Tangible Object Illustration */}
                <div className="w-28 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white border-2 border-amber-300 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105">
                  <svg className="w-10 h-10 mb-0.5" viewBox="0 0 64 64" fill="none">
                    <path d="M16 28H48V46C48 51.5228 43.5228 56 38 56H26C20.4772 56 16 51.5228 16 46V28Z" fill="#FEF3C7" stroke="#FFF" strokeWidth="3" />
                    <path d="M10 28H54" stroke="#FFF" strokeWidth="4" strokeLinecap="round" />
                    <path d="M24 18C24 14 28 14 28 10" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" className="animate-pulse" />
                    <path d="M34 18C34 14 38 14 38 10" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" className="animate-pulse" />
                  </svg>
                  <span className="text-xs font-black">חפץ: &quot;סיר&quot;</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pao':
        return (
          <div className="bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-emerald-500/10 border-2 border-sky-300 rounded-3xl p-5 sm:p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-right max-w-md">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-600 text-white text-xs font-black shadow-xs">
                  <Layers className="w-3.5 h-3.5" />
                  <span>המחשה ויזואלית מונפשת: מנוע הדחיסה 6:1</span>
                </span>
                <h4 className="text-lg font-black text-slate-900">
                  שלושה זוגות ספרות מתמזגים לפריים קולנועי אחד
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  במקום לשנן 6 ספרות נפרדות (<strong className="text-sky-900">00-21-07</strong>), המוח יוצר תמונה אחת של{' '}
                  <strong className="text-amber-700">אדם (00)</strong> המבצע <strong className="text-sky-700">פעולה (21)</strong> על{' '}
                  <strong className="text-emerald-700">חפץ (07)</strong>.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full md:w-auto">
                <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-400 text-center shadow-sm transition-transform hover:-translate-y-1">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-mono font-black text-sm flex items-center justify-center mx-auto mb-1">
                    00
                  </div>
                  <div className="text-[11px] font-black text-amber-900">1. אדם (Person)</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">סילבסטר סטאלון</div>
                </div>
                <div className="p-3 rounded-2xl bg-sky-50 border-2 border-sky-400 text-center shadow-sm transition-transform hover:-translate-y-1">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-mono font-black text-sm flex items-center justify-center mx-auto mb-1 animate-pulse">
                    21
                  </div>
                  <div className="text-[11px] font-black text-sky-900">2. פעולה (Action)</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">בועט קראטה ב...</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-center shadow-sm transition-transform hover:-translate-y-1">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-mono font-black text-sm flex items-center justify-center mx-auto mb-1">
                    07
                  </div>
                  <div className="text-[11px] font-black text-emerald-900">3. חפץ (Object)</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">סיר מרק רותח</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'palaces':
        return (
          <div className="bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-sky-500/10 border-2 border-indigo-300 rounded-3xl p-5 sm:p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-right max-w-md">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black shadow-xs">
                  <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>תרשים אדריכלי מונפש: מסלול 5 תחנות בכיוון השעון</span>
                </span>
                <h4 className="text-lg font-black text-slate-900">
                  ניווט מרחבי עקבי מונע שכחה או דילוג על פריטים
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  כל חדר בארמון הזיכרון מחולק ל-5 תחנות קבועות המסודרות בכיוון השעון: מדלת הכניסה (#1) דרך הקיר השמאלי (#2), מרכז החדר (#3), החלון (#4) ועד הקיר הימני (#5).
                </p>
              </div>

              {/* Animated SVG Room Blueprint */}
              <div className="bg-slate-900 border-2 border-indigo-400 rounded-2xl p-4 w-full md:w-80 shadow-lg">
                <svg className="w-full h-36" viewBox="0 0 280 130" fill="none">
                  <rect x="10" y="10" width="260" height="110" rx="14" fill="#0F172A" stroke="#6366F1" strokeWidth="2.5" strokeDasharray="6 4" />
                  {/* Clockwise Arrows */}
                  <path d="M55 95 L55 40 L140 30 L225 40 L225 95" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  {/* Station 1 */}
                  <circle cx="55" cy="100" r="13" fill="#F59E0B" />
                  <text x="55" y="104" textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="900">1</text>
                  {/* Station 2 */}
                  <circle cx="55" cy="36" r="13" fill="#6366F1" />
                  <text x="55" y="40" textAnchor="middle" fill="#FFF" fontSize="11" fontWeight="900">2</text>
                  {/* Station 3 */}
                  <circle cx="140" cy="28" r="13" fill="#10B981" />
                  <text x="140" y="32" textAnchor="middle" fill="#FFF" fontSize="11" fontWeight="900">3</text>
                  {/* Station 4 */}
                  <circle cx="225" cy="36" r="13" fill="#6366F1" />
                  <text x="225" y="40" textAnchor="middle" fill="#FFF" fontSize="11" fontWeight="900">4</text>
                  {/* Station 5 */}
                  <circle cx="225" cy="100" r="13" fill="#EC4899" />
                  <text x="225" y="104" textAnchor="middle" fill="#FFF" fontSize="11" fontWeight="900">5</text>
                  <text x="140" y="75" textAnchor="middle" fill="#CBD5E1" fontSize="11" fontWeight="700">↻ כיוון השעון הקבוע</text>
                </svg>
              </div>
            </div>
          </div>
        );

      case 'names':
        return (
          <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-amber-500/10 border-2 border-emerald-300 rounded-3xl p-5 sm:p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-right max-w-md">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-xs">
                  <Smile className="w-3.5 h-3.5" />
                  <span>המחשה ויזואלית מונפשת: פרוטוקול פנים ושמות</span>
                </span>
                <h4 className="text-lg font-black text-slate-900">
                  עוגן קבוע בפנים + מילת תחליף מוחשית = שליפה מיידית
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  כאשר תפגוש שוב את האדם, העין תימשך אוטומטית אל <strong className="text-emerald-800">העוגן הבולט בפנים</strong>, אשר יקפיץ את <strong className="text-amber-800">חפץ התחליף</strong> ויתרגם אותו מיד לשם הפרטי.
                </p>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center">
                <div className="p-3.5 rounded-2xl bg-white border-2 border-emerald-400 text-center shadow-sm">
                  <span className="text-2xl block mb-1">🧔</span>
                  <span className="text-xs font-black text-slate-900 block">1. עוגן בפנים</span>
                  <span className="text-[11px] text-emerald-700 font-bold">זקן עבה</span>
                </div>
                <span className="text-emerald-600 font-black text-lg animate-pulse">+</span>
                <div className="p-3.5 rounded-2xl bg-white border-2 border-amber-400 text-center shadow-sm">
                  <span className="text-2xl block mb-1">🍎</span>
                  <span className="text-xs font-black text-slate-900 block">2. חפץ תחליף</span>
                  <span className="text-[11px] text-amber-700 font-bold">רימון אדום</span>
                </div>
                <span className="text-emerald-600 font-black text-lg animate-bounce">&larr;</span>
                <div className="p-3.5 rounded-2xl bg-emerald-600 text-white border-2 border-emerald-700 text-center shadow-md">
                  <span className="text-2xl block mb-1">🎯</span>
                  <span className="text-xs font-black block">3. שליפת השם</span>
                  <span className="text-sm font-black text-amber-200">&quot;רונן!&quot;</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  // Render the interactive demonstration for the active lesson
  const renderInteractiveDemo = () => {
    switch (activeLesson.demoType) {
      case 'major-digits-0-4':
      case 'major-digits-5-9': {
        const digitsRange =
          activeLesson.demoType === 'major-digits-0-4' ? [0, 1, 2, 3, 4] : [5, 6, 7, 8, 9];
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
        const selectedD = digitsRange.includes(demoSelectedDigit)
          ? demoSelectedDigit
          : digitsRange[0];

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
                    <span
                      className={`text-xs sm:text-sm font-extrabold ${
                        isSelected ? 'text-amber-100' : 'text-amber-700'
                      }`}
                    >
                      {getDigitConsonants(d)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-amber-700">
                  הספרה {selectedD} &larr; העיצור הקבוע שלך:{' '}
                  <span className="text-base font-black text-slate-900">
                    {getDigitConsonants(selectedD)}
                  </span>
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  <strong>כלל הזיכרון החזותי-פונטי:</strong> {memoryVisualTricks[selectedD]}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center shrink-0 min-w-[140px]">
                <span className="text-[11px] text-slate-500 block font-semibold">
                  חפץ עוגן מוחשי:
                </span>
                <span className="text-lg font-black text-amber-900">
                  {getDigitWord(selectedD) || 'סוס'}
                </span>
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
            explanation:
              'לא צריך לשנן שסטאלון מתאגרף – זה הדבר הראשון שעולה לראש כשחושבים על רוקי!',
          },
          {
            num: '14',
            person: 'ליאונרדו דיקפריו',
            action: 'פורש ידיים על חרטום ספינה',
            object: 'ילד (ל+ד)',
            explanation:
              'התנועה המפורסמת ביותר של דיקפריו מ"טיטאניק" הופכת לפעולה הקבועה של מספר 14.',
          },
          {
            num: '21',
            person: 'ברוס לי (ב.ל.)',
            action: 'מנחית בעיטת קראטה מעופפת',
            object: 'בלון (ב+ל)',
            explanation:
              'ברוס לי מזוהה מיד עם בעיטת קראטה מעופפת – כך הפעולה נשלפת מאליה!',
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
                  <span className="text-[11px] font-bold text-sky-800 block">
                    2. פעולה מאפיינת (Action)
                  </span>
                  <span className="text-base font-black text-slate-900">{curr.action}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 block">
                    3. חפץ פונטי (Object)
                  </span>
                  <span className="text-base font-black text-slate-900">{curr.object}</span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                💡 עיקרון קוגניטיבי: {curr.explanation}
              </p>
            </div>
          </div>
        );
      }

      case 'pao-6digit-compressor': {
        return (
          <div className="bg-white border-2 border-sky-200 rounded-2xl p-5 space-y-4">
            <div className="text-center">
              <span className="text-xs font-bold text-slate-500 block mb-1">
                מספר יעד בן 6 ספרות לשינון:
              </span>
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
                <span className="text-xs font-black text-amber-800 block">
                  זוג ראשון (00) &larr; רק האדם
                </span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  סילבסטר סטאלון
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-sky-50 border-2 border-sky-300">
                <span className="text-xs font-black text-sky-800 block">
                  זוג שני (21) &larr; רק הפעולה
                </span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  בועט בעיטת קראטה ב...
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300">
                <span className="text-xs font-black text-emerald-800 block">
                  זוג שלישי (07) &larr; רק החפץ
                </span>
                <span className="text-base font-black text-slate-900 mt-1 block">
                  סיר מרק רותח!
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
              <span className="text-xs font-bold text-indigo-700 block mb-1">
                🎬 התמונה המאוחדת בעיני הרוח (שווה 6 ספרות!):
              </span>
              <p className="text-sm sm:text-base font-black text-indigo-950">
                &quot;סילבסטר סטאלון (00) מזנק באוויר ובועט בעיטת קראטה אדירה (21) שמעיפה סיר מרק רותח (07) לרסיסים!&quot;
              </p>
            </div>
          </div>
        );
      }

      case 'palace-clockwise-room': {
        const stations = [
          {
            num: 1,
            name: 'דלת הכניסה',
            pos: 'כניסה לחדר (נקודת ההתחלה)',
            desc: 'ידית הפלדה והמנעול של דלת הכניסה.',
          },
          {
            num: 2,
            name: 'מתלה המעילים',
            pos: 'קיר שמאלי (הולכים עם כיוון השעון)',
            desc: 'מתלה עץ גבוה בצד שמאל של הכניסה.',
          },
          {
            num: 3,
            name: 'ספת הסלון',
            pos: 'קיר מרכזי',
            desc: 'ספת שלושת המושבים הרחבה.',
          },
          {
            num: 4,
            name: 'חלון המרפסת הגדול',
            pos: 'קיר צפוני',
            desc: 'וילון הזכוכית והאדנית של המרפסת.',
          },
          {
            num: 5,
            name: 'מסך הטלוויזיה',
            pos: 'קיר ימני (סגירת מעגל השעון)',
            desc: 'מסך הטלוויזיה הרחב שתלוי על הקיר הימני.',
          },
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
                onClick={() =>
                  setDemoSelectedExampleIdx((prev) => (prev + 1) % stations.length)
                }
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
            collision:
              'בקבוק חלב ענק בגודל מקרר מתנפץ על מנעול דלת הכניסה ומציף את השטיחון בקצף לבן!',
          },
          {
            station: 'תחנה #2: ספת הסלון',
            item: 'בננה צהובה',
            collision:
              'בננה ענקית עם משקפי שמש קופצת כמו טרמפולינה על ספת הסלון וקורעת את הכריות!',
          },
          {
            station: 'תחנה #3: מסך הטלוויזיה',
            item: 'כיכר לחם חמה',
            collision:
              'כיכר לחם לוהטת פורצת מתוך זכוכית מסך הטלוויזיה וממלאת את כל הסלון בריח מאפייה!',
          },
        ];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {placements.map((p) => (
              <div
                key={p.station}
                className="bg-white border-2 border-indigo-200 rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-700">{p.station}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    פריט: {p.item}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {p.collision}
                </p>
              </div>
            ))}
          </div>
        );
      }

      case 'names-substitute-word': {
        const nameSubs = [
          {
            name: 'רונן',
            substitute: 'רימון אדום',
            why: 'רונן נשמע ממש כמו רימון (ר-ו-נ-ן / ר-י-מ-ו-ן).',
          },
          {
            name: 'דני',
            substitute: 'דונאטס מצופה שוקולד',
            why: 'דני פותח בצליל ד-נ כמו דונאטס מתוק ומוחשי.',
          },
          {
            name: 'כרמל',
            substitute: 'סוכריית קרמל נמסה',
            why: 'כרמל נשמע זהה לקרמל זהוב ודביק.',
          },
          {
            name: 'אילן',
            substitute: 'עץ אילן עם ענפים',
            why: 'השם אילן הוא בעצמו חפץ מוחשי בטבע (עץ).',
          },
        ];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nameSubs.map((ns) => (
              <div
                key={ns.name}
                className="bg-white border-2 border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-black text-slate-900">
                    השם: <span className="text-emerald-700">{ns.name}</span> &larr; חפץ תחליף:{' '}
                    <span className="text-amber-700">{ns.substitute}</span>
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
            scene:
              'מתוך הזקן העבה של רונן צומחים ומתפוצצים רימונים אדומים שמתיזים מיץ לכל עבר!',
          },
          {
            person: 'דני',
            anchor: 'גבות עבות ובולטות',
            substitute: 'דונאטס שוקולד',
            scene:
              'על שתי הגבות העבות של דני מסתובבים דונאטס מצופים שוקולד וזורים סוכריות צבעוניות!',
          },
          {
            person: 'כרמל',
            anchor: 'תלתלים גולשים',
            substitute: 'סוכריות קרמל',
            scene:
              'התלתלים של כרמל עשויים מסירופ קרמל זהוב ומתוק שמטפטף בריח משכר!',
          },
        ];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {fusions.map((f) => (
              <div
                key={f.person}
                className="bg-white border-2 border-emerald-200 rounded-2xl p-4 space-y-2"
              >
                <div className="text-sm font-black text-slate-900 border-b border-slate-100 pb-1.5">
                  👤 {f.person}
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    <strong>עוגן בפנים:</strong> {f.anchor}
                  </div>
                  <div>
                    <strong>מילת תחליף:</strong> {f.substitute}
                  </div>
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

  const trackPracticeDoneCount = currentPracticeDrills.filter((d) =>
    completedPracticeIds.includes(d.id)
  ).length;

  return (
    <div className="w-full max-w-none space-y-8 pb-16 text-slate-900">
      {/* Top Academy Hero & Overall Progress */}
      <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <GraduationCap className="w-4 h-4" />
              <span>אקדמיית המתחילים • הכשרה מתודולוגית ומעשית בטכניקות הזיכרון</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              לימוד ותרגול שיטות הזיכרון צעד-אחר-צעד
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed font-medium">
              מערכת הכשרה מובנית ללימוד ארבע מתודולוגיות הליבה של עולם המנמוניקה: שיטת ה-Major, מערכת השלשות PAO, ארמונות זיכרון ופרוטוקול שמות ופנים – כולל מדריך מקצועי מפורט, המחשות ויזואליות מונפשות ומתחם תרגול מעשי לכל טכניקה.
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
                  onClick={() => {
                    setCompletedLessonIds([]);
                    setCompletedPracticeIds([]);
                  }}
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
                    style={{
                      width: `${Math.round((tDone / Math.max(1, tLessons.length)) * 100)}%`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          COMPREHENSIVE PROFESSIONAL GUIDE (~300 WORDS) & ANIMATED VISUALS
         ===================================================================== */}
      <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full mb-2">
              <Brain className="w-3.5 h-3.5" />
              <span>סקירה מתודולוגית מקיפה והוראה שלב-אחר-שלב</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {currentGuide.formalTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              {currentGuide.academicSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const meta = tracksMeta.find((t) => t.id === selectedTrack);
              if (meta) onNavigateToPractice(meta.practiceTarget);
            }}
            className="btn-duo-blue px-4 py-2.5 text-xs font-black shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>עבור למודולת האימון המלאה</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Colorful Animated Visual Banner for Current Technique */}
        {renderTechniqueAnimatedVisual(selectedTrack)}

        {/* Structured ~300-word Professional Content with Subheadings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Right Column: Overview & Scientific Basis */}
          <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1.5 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>1. מבוא ורציונל השיטה</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {currentGuide.overviewParagraph}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>2. {currentGuide.scientificBasisTitle}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {currentGuide.scientificBasisText}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs sm:text-sm font-bold text-indigo-950 bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                🎯 <strong>סיכום מתודולוגי:</strong> {currentGuide.summaryConclusion}
              </p>
            </div>
          </div>

          {/* Left Column: Step-by-Step Process */}
          <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>3. {currentGuide.stepByStepTitle}</span>
            </h3>
            <div className="space-y-2.5">
              {currentGuide.steps.map((st) => (
                <div
                  key={st.stepNumber}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs"
                >
                  <div className="text-xs sm:text-sm font-black text-slate-900">
                    {st.heading}
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                    {st.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Practical Real-World Examples Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-600" />
            <span>4. {currentGuide.realWorldExamplesTitle}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentGuide.realWorldExamples.map((ex, i) => (
              <div
                key={i}
                className="bg-amber-50/60 border-2 border-amber-200 rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-amber-900">{ex.scenario}</span>
                  <span className="text-xs font-mono font-bold bg-white px-2.5 py-0.5 rounded-lg border border-amber-300 text-slate-900">
                    {ex.inputData}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  <strong>תהליך הקידוד:</strong> {ex.encodedProcess}
                </p>
                <p className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                  🎬 <strong>התמונה המנטלית:</strong> {ex.finalMentalImage}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          DEDICATED HANDS-ON TECHNIQUE PRACTICE ARENA (6 BASIC EXERCISES PER TECHNIQUE)
         ===================================================================== */}
      <div className="bg-white border-2 border-emerald-300 border-b-6 border-b-emerald-400 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black mb-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>מתחם תרגול מעשי ייעודי • {currentPracticeDrills.length} תרגילים בסיסיים מדורגים</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              תרגול מעשי בטכניקה: {tracksMeta.find((t) => t.id === selectedTrack)?.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              יישם את עקרונות הטכניקה באמצעות {currentPracticeDrills.length} תרגילים בסיסיים (רמת קושי קלה) עם משוב מיידי והסבר מפורט.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-center shrink-0">
            <span className="text-[11px] font-bold text-emerald-800 block">הושלמו בטכניקה זו</span>
            <span className="text-lg font-mono font-black text-emerald-950">
              {trackPracticeDoneCount} / {currentPracticeDrills.length} תרגילים
            </span>
          </div>
        </div>

        {/* Exercise Selector Pills (1 to 6) */}
        <div className="flex items-center gap-2 flex-wrap">
          {currentPracticeDrills.map((d, idx) => {
            const isCurr = idx === activePracticeDrillIdx;
            const isDone = completedPracticeIds.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setActivePracticeDrillIdx(idx);
                  setPracticeSelectedOptId(null);
                  setPracticeAnsweredCorrectly(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCurr
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                }`}
              >
                {isDone && <Check className="w-3.5 h-3.5" />}
                <span>תרגיל {idx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Active Practice Exercise Card */}
        {activePracticeDrill && (
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-emerald-700">
                שאלה {activePracticeDrillIdx + 1} מתוך {currentPracticeDrills.length} • רמת קושי: בסיסית (קל)
              </span>
              {activePracticeDrill.highlightBadge && (
                <span className="px-3.5 py-1 rounded-xl bg-slate-900 text-amber-300 font-mono font-black text-sm shadow-2xs">
                  {activePracticeDrill.highlightBadge}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {activePracticeDrill.prompt}
              </h3>
              {activePracticeDrill.subPrompt && (
                <p className="text-xs text-slate-500 font-medium">
                  {activePracticeDrill.subPrompt}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activePracticeDrill.options.map((opt) => {
                const isSelected = practiceSelectedOptId === opt.id;
                let styleClass =
                  'bg-white border-slate-200 hover:border-slate-400 text-slate-900';
                if (isSelected) {
                  styleClass = opt.isCorrect
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-400/20';
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChoosePracticeOption(opt.id)}
                    className={`p-4 rounded-2xl border-2 text-right transition-all cursor-pointer flex items-center justify-between gap-3 ${styleClass}`}
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

            {selectedPracticeOpt && (
              <div
                className={`p-4 rounded-2xl border-2 flex items-start justify-between gap-4 flex-wrap animate-fadeIn ${
                  selectedPracticeOpt.isCorrect
                    ? 'bg-emerald-100/80 border-emerald-400 text-emerald-950'
                    : 'bg-rose-100/80 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-[240px]">
                  {selectedPracticeOpt.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 text-xs sm:text-sm">
                    <strong className="font-black block">
                      {selectedPracticeOpt.isCorrect
                        ? 'תשובה נכונה! (+15 XP)'
                        : 'לא מדויק – קרא את ההסבר ונסה שוב:'}
                    </strong>
                    <p className="font-medium leading-relaxed">{selectedPracticeOpt.feedback}</p>
                  </div>
                </div>

                {practiceAnsweredCorrectly && (
                  <button
                    type="button"
                    onClick={handleNextPracticeDrill}
                    className="btn-duo-green px-5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>
                      {activePracticeDrillIdx < currentPracticeDrills.length - 1
                        ? 'המשך לתרגיל הבא'
                        : 'סיום סבב התרגילים (+30 XP)'}
                    </span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Split Workspace: Lesson Sidebar + Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right Column (in RTL): Lessons List in Current Technique */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">שיעורים ממוקדים במסלול</h2>
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
                    ? 'שלב 1: הסבר מובנה'
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
                { id: 'theory', label: '1. הסבר מובנה', icon: <BookOpen className="w-3.5 h-3.5" /> },
                { id: 'demo', label: '2. הדגמה חיה', icon: <Eye className="w-3.5 h-3.5" /> },
                { id: 'practice', label: '3. תרגול שיעור', icon: <Zap className="w-3.5 h-3.5" /> },
              ].map((st) => {
                const isActive =
                  stepPhase === st.id || (stepPhase === 'completed' && st.id === 'practice');
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
              STAGE 1: STRUCTURED THEORY (הסבר מובנה עם כותרות משנה)
             =============================================================== */}
          {stepPhase === 'theory' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6">
                {activeLesson.theorySections.map((sec, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      {sec.heading}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      {sec.content}
                    </p>
                  </div>
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
                    תרגיל שיעור {currentDrillIndex + 1} מתוך {activeLesson.drills.length}
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
                    <p className="text-xs text-slate-500 font-medium">
                      {currentDrill.subPrompt}
                    </p>
                  )}
                </div>

                {/* 4 Multiple-Choice Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentDrill.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    let cardStyle =
                      'bg-white border-slate-200 hover:border-slate-400 text-slate-900';
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
                        {selectedOption.isCorrect
                          ? 'תשובה נכונה! כל הכבוד!'
                          : 'לא בדיוק – נסה שוב:'}
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

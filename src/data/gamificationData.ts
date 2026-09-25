import { BadgeDefinition, DailyChallenge } from '../types/memory';

export const ALL_BADGES: BadgeDefinition[] = [
  {
    id: 'first_step',
    title: 'צעד ראשון בהיפוקמפוס',
    description: 'השלמת תרגיל זיכרון ראשון בהצלחה והפעלת מעגלי הניווט המוחיים.',
    icon: '🌱',
    category: 'master',
    conditionDescription: 'השלם תרגיל אחד כלשהו',
  },
  {
    id: 'palace_architect',
    title: 'ארכיטקט ארמונות',
    description: 'בניית ארמון זיכרון אישי עם לפחות 5 מיקרו-תחנות מסודרות בכיוון השעון.',
    icon: '🏛️',
    category: 'palace',
    conditionDescription: 'צור ארמון עם 5 תחנות או יותר',
  },
  {
    id: 'major_master',
    title: 'אלוף המספרים (Major)',
    description: 'שליטה בעיצורים השמיים של השפה העברית ותרגול 10 מספרי Major שונים.',
    icon: '⚡',
    category: 'major',
    conditionDescription: 'תרגל 10 מספרי Major',
  },
  {
    id: 'pao_champion',
    title: 'שלשת אלופים (PAO)',
    description: 'הרכבת סצנות תלת-שלביות ביזאריות של אדם-פעולה-חפץ (יחס דחיסה 6:1).',
    icon: '🎭',
    category: 'pao',
    conditionDescription: 'שליטה בשלשות PAO',
  },
  {
    id: 'face_detective',
    title: 'מזהה עוגנים ושמות',
    description: 'איתור עוגן מורפולוגי בפנים והדבקה קינטית של מילת תחליף פונטית.',
    icon: '👁️',
    category: 'names',
    conditionDescription: 'תרגול שמות ופנים בהצלחה',
  },
  {
    id: 'flame_streak',
    title: 'להבת ההתמדה (Streak)',
    description: 'שמירה על רצף אימונים מרווחים (SRS) של 3 ימים ומעלה לחיזוק ה-LTP.',
    icon: '🔥',
    category: 'streak',
    conditionDescription: 'השג רצף של 3 ימי אימון יומי',
  },
  {
    id: 'perfect_recall',
    title: 'דיוק פנומנלי בשפה חופשית',
    description: 'קבלת ציון 95 ומעלה בבוחן האסוציאציות החכם מבוסס AI.',
    icon: '🎯',
    category: 'master',
    conditionDescription: 'השג ציון 95+ בבוחן AI',
  },
  {
    id: 'association_guru',
    title: 'מאסטר האסוציאציות',
    description: 'תיעוד וקידוד של לפחות 4 אסוציאציות אישיות (טלפונים, קודים, תאריכים).',
    icon: '📚',
    category: 'master',
    conditionDescription: 'תעד 4 אסוציאציות אישיות בפנקס',
  },
  {
    id: 'world_champion',
    title: 'גרנד-מאסטר בינלאומי',
    description: 'צבירת 1,000 נקודות XP ומעלה בספורט הזיכרון המנמוני.',
    icon: '👑',
    category: 'master',
    requiredPoints: 1000,
    conditionDescription: 'צבור 1,000 נקודות XP',
  },
];

export const BENCHMARK_LEADERBOARD = [
  {
    uid: 'bench-1',
    displayName: 'בן פרידמור (אלוף עולם פי 3)',
    email: 'ben@worldmemorychampionships.com',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    points: 3850,
    level: 6,
    levelTitle: 'גרנד-מאסטר בינלאומי',
    badges: ['גרנד-מאסטר בינלאומי', 'ארכיטקט ארמונות', 'שלשת אלופים (PAO)', 'אלוף המספרים (Major)'],
    dailyStreak: 42,
    lastChallengeDate: '2026-09-24',
    exercisesCompleted: 248,
  },
  {
    uid: 'bench-2',
    displayName: 'ערן כץ (שיאן גינס בזיכרון)',
    email: 'eran@memory-mastery.co.il',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    points: 3420,
    level: 6,
    levelTitle: 'גרנד-מאסטר בינלאומי',
    badges: ['מאסטר האסוציאציות', 'מזהה עוגנים ושמות', 'ארכיטקט ארמונות'],
    dailyStreak: 31,
    lastChallengeDate: '2026-09-24',
    exercisesCompleted: 195,
  },
  {
    uid: 'bench-3',
    displayName: 'קייטי קרמוד (שיאנית שמות ופנים)',
    email: 'katie@namesandfaces.org',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    points: 2980,
    level: 5,
    levelTitle: 'אלוף הזיכרון הלאומי',
    badges: ['מזהה עוגנים ושמות', 'דיוק פנומנלי בשפה חופשית', 'להבת ההתמדה (Streak)'],
    dailyStreak: 19,
    lastChallengeDate: '2026-09-24',
    exercisesCompleted: 160,
  },
  {
    uid: 'bench-4',
    displayName: 'לאנס טשירהארט (ממציא Shadow)',
    email: 'lance@shadowsystem.com',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    points: 2450,
    level: 5,
    levelTitle: 'אלוף הזיכרון הלאומי',
    badges: ['ארכיטקט ארמונות', 'שלשת אלופים (PAO)'],
    dailyStreak: 14,
    lastChallengeDate: '2026-09-23',
    exercisesCompleted: 130,
  },
];

export const getDailyChallengeForToday = (): DailyChallenge => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );

  const challenges: Omit<DailyChallenge, 'completed'>[] = [
    {
      id: 'dc-1',
      title: 'אתגר היום: פיענוח שלשת PAO דחוסה',
      subtitle: 'יחס דחיסה 6:1 לזיכרון תחרותי',
      category: 'pao',
      rewardPoints: 60,
      description: 'המספר 152383 חולק ל-3 צמדים: 15 (אדם), 23 (פעולה), 83 (חפץ). מהי הסצנה המאוחדת שמציבים בתחנה בארמון הזיכרון?',
      prompt: 'מי הדמות (15), מה היא עושה (23), ועל איזה חפץ (83)?',
      targetAnswer: 'אלברט איינשטיין (15) מזנק ומטביע (23) לתוך לוח עץ / בובת עץ (83).',
      explanation: 'שיטת PAO מאפשרת דחיסה של 6 ספרות לתחנה מרחבית בודדת ומונעת הצפת תחנות (Saturation).',
    },
    {
      id: 'dc-2',
      title: 'אתגר היום: המרת שנת 1455 ב-Major',
      subtitle: 'שינון תאריך המצאת הדפוס בעברית',
      category: 'major',
      rewardPoints: 50,
      description: 'לפי הכלל המנמוני, שנת המילניום 1 מושמטת. המספר 455 מומר לעיצורים: 4=ר\', 5=ל\', 5=ל\'. מה הדימוי שנוצר וכיצד הוא נקשר לגוטנברג?',
      prompt: 'תאר את החפץ (המילה הפונטית של 455) ואת החיבור שלו למכבש הדפוס של גוטנברג.',
      targetAnswer: 'המילה היא רעלה (ר-ל-ל) או לולב. גוטנברג מדפיס דפי תנ"ך שכרוכים ברעלה ארוכה מתנופפת ונחבטים בלולבים ענקיים.',
      explanation: 'חיבור שלוש ספרות למילה בעלת צליל ומשמעות מעגן את התאריך במערכת הסמנטית.',
    },
    {
      id: 'dc-3',
      title: 'אתגר היום: זיהוי עוגן מורפולוגי והדבקה קינטית',
      subtitle: 'הצמדת שם מורכב לתווי פנים',
      category: 'names',
      rewardPoints: 50,
      description: 'נפגשת עם אישה בשם "רונית" בעלת אף נשרי בולט. מהי מילת התחליף ואיזו אינטראקציה קינטית חריפה תדביק את השם לאף?',
      prompt: 'תאר את מילת התחליף של רונית ואת ההתנגשות החזותית עם האף.',
      targetAnswer: 'רונית = מונית צהובה. מונית צהובה דוהרת במהירות ומתנגשת חזיתית ישירות באף הנשרי שלה, צופרת ברעש עז.',
      explanation: 'במפגש הבא, העין נמשכת אוטומטית לעוגן הבולט (האף), הדימוי של המונית מתעורר מיד, וממנו מפוענח השם רונית.',
    },
  ];

  const selected = challenges[dayOfYear % challenges.length];
  return {
    ...selected,
    completed: false,
  };
};

export const calculateLevel = (points: number) => {
  if (points >= 3000) return { level: 6, title: 'גרנד-מאסטר בינלאומי', nextThreshold: 5000, currentBase: 3000 };
  if (points >= 1500) return { level: 5, title: 'אלוף הזיכרון הלאומי', nextThreshold: 3000, currentBase: 1500 };
  if (points >= 800) return { level: 4, title: 'לוחש האסוציאציות', nextThreshold: 1500, currentBase: 800 };
  if (points >= 400) return { level: 3, title: 'מאסטר שלשות PAO', nextThreshold: 800, currentBase: 400 };
  if (points >= 150) return { level: 2, title: 'מנווט בארמונות', nextThreshold: 400, currentBase: 150 };
  return { level: 1, title: 'שוליית מנמוניקה', nextThreshold: 150, currentBase: 0 };
};

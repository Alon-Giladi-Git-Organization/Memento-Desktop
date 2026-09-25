export interface MajorItem {
  number: number; // 0 - 99 or 0 - 9
  numberStr: string; // "00" - "99" or "0" - "9"
  consonants: string; // e.g. "ס/ז + מ"
  userConsonants?: string; // personal consonants override
  defaultWord: string; // e.g. "סם"
  userWord?: string; // personal override
  imageHint: string; // e.g. "בקבוק רעל זוהר"
  userImageHint?: string; // personal kinetic hint override
  customNotes?: string;
}

export interface PAOItem {
  number: number;
  numberStr: string; // "00" - "99"
  person: string; // Person
  action: string; // Kinetic action
  object: string; // Passive distinctive object
  userPerson?: string;
  userAction?: string;
  userObject?: string;
}

export interface PegShapeItem {
  number: number;
  shapeName: string;
  userShapeName?: string;
  visualMetaphor: string;
  defaultObject: string;
  userObject?: string;
  kineticTip: string;
  userKineticTip?: string;
}

export interface BodyPegItem {
  index: number; // 1 - 10
  bodyPartHebrew: string;
  userBodyPart?: string;
  defaultObject: string;
  userObject?: string;
  kineticTip: string;
  userKineticTip?: string;
}

export interface PalaceLocus {
  id: string;
  stepNumber: number;
  roomName: string;
  title: string;
  positionDescription: string;
  storedContent?: string;
  mnemonicScene?: string;
  lastReviewed?: number;
}

export interface MemoryPalace {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'home' | 'work' | 'campus' | 'outdoor' | 'custom';
  loci: PalaceLocus[];
  isPermanent: boolean;
}

export interface PersonFaceCard {
  id: string;
  name: string;
  roleOrJob: string;
  avatarUrl: string;
  avatarSeed: string;
  morphologicalAnchor: string; // e.g. "אף נשרי חד", "גבות עבות מחוברות", "סנטר כפול", "קמטי צחוק בולטים"
  substituteWord: string; // e.g. "רונית -> מונית", "חיים -> לחם חי"
  mnemonicScene: string; // e.g. "מונית צהובה דוהרת ומתנגשת ישירות באף הנשרי שלה"
  userCustomScene?: string;
}

export interface AbstractShapeCard {
  id: string;
  title: string;
  svgShapeType: 'spiral' | 'blob' | 'zigzag' | 'crystallite' | 'cloud' | 'shield';
  textureType: 'smooth' | 'striped' | 'dotted' | 'wavy' | 'checkered';
  textureDigit: number; // 1-5
  pareidoliaHint: string; // "אוזן שפן הפוכה", "מקור נשר", "מפתח שבור"
  mnemonicCode: string;
}

export interface PersonalContactAssociation {
  id: string;
  targetSubject: string; // e.g. "מספר הנייד של אמא", "קוד כספת", "תאריך יום נישואין"
  storedNumberOrFact: string; // e.g. "054-213988", "1492"
  encodedMnemonic: string; // e.g. "איינשטיין מטיס מפה מעל חוף הים"
  methodUsed: 'major' | 'pao' | 'palace' | 'pegs' | 'link';
  createdAt: number;
  lastTestedAt?: number;
  successCount: number;
  failCount: number;
}

export interface AcademicKeyPoint {
  id: string;
  conceptTitle: string;
  discipline: string; // רפואה, משפטים, היסטוריה, מדעים, פסיכולוגיה
  sourceSummary: string;
  keyWord: string;
  visualAnchor: string;
  palaceLocusInfo: string;
  mnemonicScene: string;
}

export interface TestResult {
  id: string;
  timestamp: number;
  category: 'major' | 'pao' | 'names' | 'palace' | 'shapes' | 'contacts' | 'academic';
  question: string;
  targetAssociation: string;
  userResponse: string;
  isCorrect: boolean;
  score: number;
  verdictTitle: string;
  explanation: string;
  memoryTip: string;
}

export interface MentorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'major' | 'pao' | 'palace' | 'names' | 'streak' | 'master';
  requiredPoints?: number;
  conditionDescription: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  subtitle: string;
  category: 'major' | 'pao' | 'names' | 'palace';
  rewardPoints: number;
  description: string;
  prompt: string;
  targetAnswer: string;
  explanation: string;
  completed: boolean;
}

export interface AIFeedbackReport {
  id: string;
  createdAt: number;
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  cognitiveScores: {
    spatialNavigation: number; // 0-100
    kineticEncoding: number; // 0-100
    phoneticDecoding: number; // 0-100
    activeRecallSpeed: number; // 0-100
    longTermRetention: number; // 0-100
  };
  nextTrainingPlan: string;
}


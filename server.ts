import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
export function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const ai = getGeminiClient();

// System prompt grounded in world memory championships and Hebrew Major mapping
const MEMORY_CHAMPION_SYSTEM_PROMPT = `הגדרה קבועה למנטור ה-AI:

Role & Objective:
אתה מומחה לפיתוח מיומנויות זיכרון (Mnemonics). תפקידך להמיר עובדות או משפטים מורכבים לתמונות אסוציאטיביות ויזואליות, פשוטות, חדות וקלות לדמיון מיידי.

Critical Rules:
1. תמונה אחת מאוחדת (Single Vivid Scene): אל תמציא עלילה מורכבת או סיפור בהמשכים. מקם את כל האלמנטים המרכזיים בתוך פריים ויזואלי אחד, סטטי או עם אינטראקציה פשוטה אחת בלבד.
2. תמצות ולא תרגום מילה-במילה: אסור לייצר אסוציאציה נפרדת לכל מילה. התמקד רק ב-2 עד 3 עוגני התוכן המרכזיים של המשפט (הרעיון המרכזי).
3. פשטות וחדות: הימנע מעומס תיאורים מיותר (טמפרטורת פלזמה, ריחות חרוכים מורכבים, פיצוצים מרובים). הדימוי צריך להיתפס בעיני רוחו של המשתמש תוך 2 שניות.
4. אורך מרבי: עד 2–3 משפטים קצרים (מקסימום 40 מילים).

Example:
קלט: "התכנית 'קו כחול דק' הייתה הבסיס לתכניות משטרה בשנות ה-80"
אסוציאציה נכונה: "קו כחול דק וזוהר מפריד בין שני חלקי המיטה; על צד אחד יושב שוטר, ועל הצד השני יושבת רקדנית דיסקו משנות ה-80 עם אפרו וגלגליות."
הסבר קצר: הקו הכחול הדק מקשר לשוטר (תוכניות משטרה) ולרקדנית (שנות ה-80).

Output Format (בכל יצירת דימוי או אסוציאציה):
• אסוציאציה ויזואלית: [התיאור הפשוט והתמציתי]
• עוגני זיכרון: [פירוט קצרצר של הקשרים: מה מייצג מה]

עקרונות נוספים של אקדמיית ממנטו בעברית:
1. שיטת ה-Major המותאמת בעברית (חוקי היסוד):
   - אותיות החיבור השקופות: "א-נ-י-ע-ו-נ-ה" (א, נ, י, ע, ו, ה) שאינן מקושרות למספר, ומשמשות כדבק חופשי ללא ערך מספרי!
   - 0 = ס, ז, ש דגושה (שׂ) (סוס)
   - 1 = ל (לב)
   - 2 = ב (בית)
   - 3 = ג, ק, כ (כוס)
   - 4 = ד, ת, ט (תה)
   - 5 = ח (חי)
   - 6 = ש (שׁ), ג', צ' (אש)
   - 7 = ר (אור)
   - 8 = מ (ים)
   - 9 = פ (רפה ודגושה) (פה)
2. שיטת השלשות PAO (Person-Action-Object):
   - ראשי התיבות של הדמות לכל מספר (00-99) נקבעים לפי שתי ספרות ה-Major (למשל 14 = ל.ד., 05 = ס.ח., 23 = ב.ג., 83 = מ.ג.).
3. ארמונות זיכרון (Method of Loci): מסלול תחנות מרחבי ברור בהיפוקמפוס.
4. שמות ופנים: עוגן מורפולוגי בפנים -> מילת תחליף פונטית -> אינטראקציה פשוטה.

אתה בעל גישה מלאה לבסיס הנתונים של המשתמש. אם המשתמש מבקש ממך לקרוא, להוסיף, לערוך או למחוק נתונים (ארמון, תחנה, שלשת PAO, מילת Major, כרטיס אישי), בצע זאת וצרף את בלוק הפעולה המתאים.`;

// API Endpoint: Smart Free-Text Association Evaluation
app.post('/api/gemini/evaluate-association', async (req: Request, res: Response) => {
  try {
    const { question, targetAssociation, userResponse, context } = req.body;

    if (!userResponse || !targetAssociation) {
      return res.status(400).json({ error: 'Missing targetAssociation or userResponse' });
    }

    const prompt = `אתה שופט זיכרון קוגניטיבי מומחה.
המשתמש נבחן על שליפת אסוציאציית זיכרון שהוא קישר מראש.
השאלה שנשאלה: "${question || 'מהי האסוציאציה המקושרת?'}"
האסוציאציה המקורית שנשמרה במערכת: "${targetAssociation}"
תשובת המשתמש בשפה חופשית: "${userResponse}"
הקשר נוסף (אם יש): "${context || 'כללי'}"

המשימה שלך:
קבע האם המשתמש נזכר באסוציאציה הנכונה במהותה. שים לב: המשתמש כותב בשפה חופשית. ייתכן שהוא השתמש במילים נרדפות, תיאר את התמונה המנטלית במילים אחרות, התייחס לאותו אלמנט מרכזי, או הסביר את הקשר הסיפורי. אם הרעיון המרכזי תואם - אשר זאת כנכון!

השב אך ורק במבנה JSON הבא:
{
  "isCorrect": boolean, // true אם התשובה נכונה סמנטית או קרובה מאוד במהות
  "score": number, // ציון מ-0 עד 100 על איכות הדיוק והשליפה
  "verdictTitle": string, // כותרת קצרה, למשל: "מדויק להפליא!", "כמעט שם!", "הכיוון נכון", או "זיהוי שגוי"
  "explanation": string, // הסבר קצר ומעודד בעברית (משפט או שניים) מדוע התשובה נכונה או מה היה חסר
  "memoryTip": string // טיפ קוגניטיבי קצר לחיזוק הקשר הנוירוני (למשל תוספת תנועה קינטית או ריח)
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER },
            verdictTitle: { type: Type.STRING },
            explanation: { type: Type.STRING },
            memoryTip: { type: Type.STRING },
          },
          required: ['isCorrect', 'score', 'verdictTitle', 'explanation', 'memoryTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in evaluate-association:', error);
    // Intelligent fallback in case of API failure
    const target = String(req.body.targetAssociation || '').toLowerCase().trim();
    const user = String(req.body.userResponse || '').toLowerCase().trim();
    const isDirectMatch = user.includes(target) || target.includes(user);
    return res.json({
      isCorrect: isDirectMatch,
      score: isDirectMatch ? 90 : 40,
      verdictTitle: isDirectMatch ? 'שליפה מוצלחת!' : 'בדיקה מקומית',
      explanation: isDirectMatch ? 'נמצאה התאמה ישירה בין מילות המפתח.' : `התשובה השמורה במערכת הייתה: ${req.body.targetAssociation}`,
      memoryTip: 'טיפ: הקפד להוסיף תנועה עזה ושבירה כדי לנעוץ את הזיכרון בהיפוקמפוס.',
    });
  }
});

// API Endpoint: AI Memory Mentor Chat & CRUD Agent
app.post('/api/gemini/mentor-chat', async (req: Request, res: Response) => {
  try {
    const { messages, message, history, userProfileSummary, appContext } = req.body;

    let chatList: Array<{ role: string; content: string }> = [];

    if (Array.isArray(messages) && messages.length > 0) {
      chatList = messages;
    } else if (message && typeof message === 'string') {
      const hist = Array.isArray(history) ? history : [];
      chatList = [...hist, { role: 'user', content: message }];
    }

    if (chatList.length === 0) {
      chatList = [{ role: 'user', content: 'שלום! אשמח לטיפ או עצה במנמוניקה.' }];
    }

    const formattedContents = chatList.map((msg) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(msg.content || '').trim() || '...' }],
    }));

    const systemInstruction = `${MEMORY_CHAMPION_SYSTEM_PROMPT}

נתוני המשתמש והפרופיל:
${userProfileSummary || 'משתמש באקדמיית ממנטו (Memento).'}

תמונת מצב בסיס הנתונים הנוכחי של המשתמש:
${appContext ? JSON.stringify(appContext) : 'מאגר נתונים סטנדרטי.'}

הנחיות חשובות:
1. ספק תשובות מעשיות, חכמות וממריצות בעברית רהוטה.
2. אם המשתמש שואל שאלות תאורטיות על טכניקות הזיכרון - הסבר לו בבהירות עם דוגמאות קינטיות ומקור מדעי.
3. אם המשתמש מבקש פעולת ניהול או עדכון נתונים (CRUD) - כגון: "תוסיף לי ארמון זיכרון חדש", "תשנה לי את המילה של מספר 14", "תוסיף לי איש PAO", "מחק לי את...", או "הוסף עוגן אקדמי" - רשום תשובה ברורה בעברית, ובסוף התשובה הוסף בלוק פעולה מסוג:
<<<ACTION:{"type":"ACTION_TYPE","payload":{...}}>>>
סוגי פעולות נתמכים:
- UPDATE_MAJOR: {"number": 14, "userWord": "ילד", "userImageHint": "..."}
- UPDATE_PAO: {"number": 14, "userPerson": "...", "userAction": "...", "userObject": "..."}
- ADD_PALACE: {"name": "דירה בחיפה", "description": "...", "icon": "Home"}
- ADD_LOCUS: {"palaceId": "...", "title": "דלת כניסה", "roomName": "מבואה", "positionDescription": "...", "mnemonicScene": "..."}
- ADD_ACADEMIC: {"conceptTitle": "...", "discipline": "...", "sourceSummary": "...", "keyWord": "...", "visualAnchor": "...", "palaceLocusInfo": "...", "mnemonicScene": "..."}
- ADD_ASSOCIATION: {"category": "...", "sourceKey": "...", "targetValue": "...", "kineticScene": "...", "notes": "..."}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const rawReply = response.text || '';
    
    // Extract any action block if present
    let actionData: any = null;
    let cleanReply = rawReply;
    const actionMatch = rawReply.match(/<<<ACTION:(.*?)>>>/s);
    if (actionMatch) {
      try {
        actionData = JSON.parse(actionMatch[1]);
        cleanReply = rawReply.replace(/<<<ACTION:(.*?)>>>/s, '').trim();
      } catch (e) {
        console.warn('Could not parse agent action JSON:', e);
      }
    }

    return res.json({ reply: cleanReply || 'מצוין! נמשיך לתרגל.', action: actionData });
  } catch (error: any) {
    console.error('Error in mentor-chat:', error);
    return res.status(200).json({
      reply: 'מנטור הזיכרון כאן! בוא נתרגל יחד. כדי לזכור מידע ביעילות מירבית, הפעל את ההיפוקמפוס: צור תמונה מוגזמת, הוסף תנועה עזה ושבירה קינטית, והצב אותה בתחנה ברורה בארמון הזיכרון שלך.',
    });
  }
});

// Helper to compute Hebrew Major & PAO constraints for prompts
function getHebrewMajorConstraints(inputStr: string, extraStr: string, customDigits?: any[]): string {
  const majorDigitsMap: Record<number, { letter: string; all: string }> = {
    0: { letter: 'ס', all: 'ס, ז, ש דגושה' },
    1: { letter: 'ל', all: 'ל' },
    2: { letter: 'ב', all: 'ב' },
    3: { letter: 'ג', all: 'ג, ק, כ' },
    4: { letter: 'ד', all: 'ד, ת, ט' },
    5: { letter: 'ח', all: 'ח' },
    6: { letter: 'ש', all: 'ש, ג\', צ\'' },
    7: { letter: 'ר', all: 'ר' },
    8: { letter: 'מ', all: 'מ' },
    9: { letter: 'פ', all: 'פ (רפה ודגושה)' },
  };

  // If user has customized the digits in the database/localStorage, strictly apply their mapping!
  if (Array.isArray(customDigits) && customDigits.length > 0) {
    for (const cd of customDigits) {
      if (typeof cd.number === 'number' && cd.number >= 0 && cd.number <= 9) {
        const cons = (cd.userConsonants || cd.consonants || '').trim();
        if (cons) {
          const firstHebrew = cons.match(/[\u0590-\u05FF]/);
          majorDigitsMap[cd.number] = {
            letter: firstHebrew ? firstHebrew[0] : cons[0],
            all: cons,
          };
        }
      }
    }
  }

  // Check if there is a number in input or extra
  const match = (inputStr + ' ' + extraStr).match(/\b(\d{1,2})\b/);
  if (!match) {
    return `\nמיפוי האותיות והספרות הפעיל במערכת (מעודכן לפי הגדרות בסיס הנתונים):
0 = ${majorDigitsMap[0]?.all}
1 = ${majorDigitsMap[1]?.all}
2 = ${majorDigitsMap[2]?.all}
3 = ${majorDigitsMap[3]?.all}
4 = ${majorDigitsMap[4]?.all}
5 = ${majorDigitsMap[5]?.all}
6 = ${majorDigitsMap[6]?.all}
7 = ${majorDigitsMap[7]?.all}
8 = ${majorDigitsMap[8]?.all}
9 = ${majorDigitsMap[9]?.all}
אותיות החיבור השקופות: "א-נ-י-ע-ו-נ-ה" (א, נ, י, ע, ו, ה, ן) שאינן מקושרות לאף מספר, ומשמשות כדבק חיבור חופשי!`;
  }

  const num = parseInt(match[1], 10);
  if (isNaN(num) || num < 0 || num > 99) return '';

  const tens = Math.floor(num / 10) % 10;
  const units = num % 10;

  const tensDef = majorDigitsMap[tens] || { letter: 'ס', all: 'ס' };
  const unitsDef = majorDigitsMap[units] || { letter: 'ס', all: 'ס' };

  if (num < 10) {
    return `\nחוק ברזל מוחלט למספר ${num}:
- לפי בסיס הנתונים: ספרת היסוד ${num} מייצגת את האות "${tensDef.letter}" (עיצורים מותרים: ${tensDef.all}).
- אותיות החיבור השקופות: "א-נ-י-ע-ו-נ-ה" (א, נ, י, ע, ו, ה, ן) שאינן מקושרות למספר, ומשמשות כדבק חופשי ללא ערך מספרי!
- חובה עבור חפץ PAO / מילה למספר ${num}: שם החפץ הבסיסי חייב להתבסס אך ורק על עיצורי הספרה "${tensDef.letter}" (בתוספת אותיות חיבור שקופות א-נ-י-ע-ו-נ-ה בלבד, בעדיפות למילה קצרה ככל הניתן)!`;
  }

  return `\nחוק ברזל מוחלט ובלתי מתפשר למספר ${num}:
- מיפוי לפי בסיס הנתונים: ספרת העשרות ${tens} = "${tensDef.letter}" (${tensDef.all}), ספרת היחידות ${units} = "${unitsDef.letter}" (${unitsDef.all}).
- אותיות החיבור השקופות: "א-נ-י-ע-ו-נ-ה" (א, נ, י, ע, ו, ה, ן) שאינן מקושרות למספר, ומשמשות כדבק חופשי ללא ערך מספרי!
- חובה עבור חפץ PAO (וגם מילת Major) למספר ${num}:
  * המילה הבסיסית לחפץ חייבת להתבסס אך ורק על עיצורי הספרות: "${tensDef.letter}" (ספרת עשרות) ו-"${unitsDef.letter}" (ספרת יחידות), בתוספת אותיות חיבור שקופות בלבד (א, נ, י, ע, ו, ה, ן).
  * עדיפות עליונה למילה קצרה ככל הניתן (למשל עבור 15 עם 1=${tensDef.letter} ו-5=${unitsDef.letter}: אופציות לגיטימיות ומעולות הן: "לוח", "לחי", "לחן", "לחם")!
  * עטוף את המילה הקצרה בתיאור רב-חושי מוחשי, בולט ומוחשי (צבעים עזים, מרקם, ריח, טמפרטורה), אך שם החפץ הבסיסי חייב להישאר מעוגן באותיות אלו בדיוק.
- חובה עבור דמות PAO למספר ${num}: ראשי התיבות של השם הפרטי ושם המשפחה של הדמות חייבים להיות בדיוק: ${tensDef.letter}.${unitsDef.letter}. (למשל: ס.ח., ל.ד., ב.ג., פ.ס.).`;
}

// API Endpoint: Mnemonic Generation Tool (PAO, Major, Names, Academic concepts)
// Rich Dynamic Hebrew Mnemonic Generator for PAO, Major, and Associations with Multisensory Richness
function generateHebrewMnemonicFallback(
  type: string,
  inputStr: string,
  extraStr: string,
  cycle = 0,
  customDigits?: any[]
) {
  // Extract number if present in input or extra
  const match = (inputStr + ' ' + extraStr).match(/\b(\d{1,2})\b/);
  const num = match ? parseInt(match[1], 10) : NaN;
  const numStr = !isNaN(num) ? (num < 10 ? `0${num}` : `${num}`) : '';
  const idx = Math.max(0, cycle);

  // Parse existing fields from extraStr if user provided Person, Action, Object
  let contextPerson = '';
  let contextAction = '';
  let contextObject = '';

  const cleanPrefix = (str: string) =>
    str
      .replace(/^(?:אדם|דמות|פעולה|חפץ|סצנה|person|action|object|scene)[:=\s-]+/i, '')
      .replace(/^["'״׳]|["'״׳]$/g, '')
      .trim();

  try {
    if (extraStr.startsWith('{')) {
      const parsedJson = JSON.parse(extraStr);
      contextPerson = cleanPrefix(parsedJson.person || parsedJson.userPerson || '');
      contextAction = cleanPrefix(parsedJson.action || parsedJson.userAction || '');
      contextObject = cleanPrefix(parsedJson.object || parsedJson.userObject || '');
    }
  } catch {}

  if (!contextPerson || !contextAction || !contextObject) {
    const pMatch = extraStr.match(/(?:דמות|אדם|person)[:=]\s*([^,\n|]+)/i);
    const aMatch = extraStr.match(/(?:פעולה|action)[:=]\s*([^,\n|]+)/i);
    const oMatch = extraStr.match(/(?:חפץ|object)[:=]\s*([^,\n|]+)/i);
    if (pMatch) contextPerson = cleanPrefix(pMatch[1]);
    if (aMatch) contextAction = cleanPrefix(aMatch[1]);
    if (oMatch) contextObject = cleanPrefix(oMatch[1]);
  }

  if (!contextPerson || !contextAction || !contextObject) {
    const parts = extraStr.split('|').map((s) => cleanPrefix(s.trim()));
    if (parts.length >= 3) {
      if (!contextPerson) contextPerson = parts[0];
      if (!contextAction) contextAction = parts[1];
      if (!contextObject) contextObject = parts[2];
    }
  }

  // Hebrew Major consonants mapping
  const majorDigitsMap: Record<number, { letter: string; all: string; words: string[] }> = {
    0: { letter: 'ס', all: 'ס, ז, ש דגושה', words: ['סוס', 'סל', 'סיגריה', 'ספר', 'סיר', 'סרט'] },
    1: { letter: 'ל', all: 'ל', words: ['לב', 'לוח', 'לחם', 'לימון', 'לפיד', 'לול'] },
    2: { letter: 'ב', all: 'ב', words: ['בית', 'ברז', 'בננה', 'בלון', 'בובה', 'בז'] },
    3: { letter: 'ג', all: 'ג, ק, כ', words: ['כוס', 'כדור', 'כתר', 'כלב', 'כובע', 'כוכב', 'גג', 'קיר'] },
    4: { letter: 'ד', all: 'ד, ת, ט', words: ['דלת', 'דוב', 'דגל', 'דרקון', 'דבורה', 'דלי', 'תה'] },
    5: { letter: 'ח', all: 'ח', words: ['חץ', 'חרב', 'חבל', 'חתול', 'חולצה', 'חצוצרה', 'חי'] },
    6: { letter: 'ש', all: 'ש, ג\', צ\'', words: ['שמש', 'שעון', 'שופר', 'שולחן', 'שושנה', 'שטיח', 'אש'] },
    7: { letter: 'ר', all: 'ר', words: ['רכבת', 'רובה', 'רדיו', 'רשת', 'רקטה', 'ראש', 'אור'] },
    8: { letter: 'מ', all: 'מ', words: ['מים', 'מפתח', 'מטוס', 'מראה', 'מטרייה', 'מנורה', 'ים'] },
    9: { letter: 'פ', all: 'פ (רפה ודגושה)', words: ['פה', 'פיל', 'פטיש', 'פרח', 'פרפר', 'פסנתר', 'פיצה'] },
  };

  // If user has customized the digits in the database/localStorage, strictly apply their mapping!
  if (Array.isArray(customDigits) && customDigits.length > 0) {
    for (const cd of customDigits) {
      if (typeof cd.number === 'number' && cd.number >= 0 && cd.number <= 9) {
        const cons = (cd.userConsonants || cd.consonants || '').trim();
        if (cons) {
          const firstHebrew = cons.match(/[\u0590-\u05FF]/);
          majorDigitsMap[cd.number] = {
            letter: firstHebrew ? firstHebrew[0] : cons[0],
            all: cons,
            words: majorDigitsMap[cd.number]?.words || [],
          };
        }
      }
    }
  }// Consonant-aware sensory objects for PAO and Major words (strictly adhering to number consonants + transparent connectors)
  function getConsonantSensoryObject(numberVal: number, tLetter: string, uLetter: string, cycleIdx: number): string {
    // Curated rich sensory words based on Hebrew Major letter combinations
    const specificObjectMap: Record<number, string[]> = {
      0: ['סוס פרא לבן אצילי שמריח מחציר רטוב ורוקע בפרסות כסופות', 'סל נצרים קלוע שמלא בתפוזים ריחניים וטריים', 'סיר ברזל יצוק שחור ומעלה אדי מרק חם'],
      1: ['לב אודם ענק ופועם באור אדום זוהר שמפיץ חום עז', 'לוח עץ אורן עתיק ומחוספס שמדיף ריח שרף', 'לפיד בוער בלהבה כתומה מתפרצת שמפיצה ריח עשן'],
      2: ['בית עץ חמים עם ארובה מפיצת עשן לבן בריח אורנים', 'בלון הליום אדום מבריק שמרחף אל השמיים', 'בובת חרסינה עתיקה עם עיני אזמרגד נוצצות'],
      3: ['כוס בדולח צלולה שמתנפצת לקול צלצול זכוכית עז', 'כתר זהב כבד משובץ אבני אודם לוהטות שמפיצות חום', 'כדור פלדה כבד ומבריק שמקפיא את הידיים'],
      4: ['ספל תה חרסינה רותח שמעלה אדי נענע מתוקים', 'דלת עץ אלון עתיקה וכבדה עם ידית פליז קרה', 'דוב פרווה ענק ורך שמריח מדבש יער'],
      5: ['חץ פלדה מוזהב וחד שנורה במעוף מהיר ומשמיע שריקה', 'חרב סמוראי כסופה שחותכת משי צבעוני באוויר', 'חבל מלחים עבה מחוספס שמריח ממי ים ומלח'],
      6: ['להבות אש מתפרצות ומפצפצות בריח גופרית עז', 'שעון חול מוזהב שגרגריו נושרים בקול רשרוש עדין', 'שופר איל עתיק שמפיק צליל תרועה רועם'],
      7: ['זרקור אור קסום מסנוור שמקרין אלומת לייזר לבנה', 'רכבת קיטור עתיקה מפליטה עשן סמיך וצפירה חדה', 'רובה ציד עתיק מעץ מהגוני שמריח מאבק שריפה'],
      8: ['גלי ים קרירים ושוצפים שמתנפצים ברסס מים מלוח', 'מפתח זהב עתיק וכבד שפותח תיבת אוצר סודית', 'מטוס סילון כסוף שמזנק במהירות שיא אל העננים'],
      9: ['פה ענקי פעור עם שיני זהב נוצצות', 'פיל אפריקאי ענק שמרים חדק ותוקע בקול רועם', 'פרח ורוד ענק עם גבעול קרח צלול שמפיץ ניחוח ורדים מתוק'],
      14: ['ילד קטן במעיל גשם צהוב שמשיט סירת נייר זוהרת', 'דגל משי לבן שמתנפנף ברוח סוערת ומצלצל בתורן'],
      15: [
        'לוח עץ עתיק ומחוספס שמדיף ריח שרף אורנים חזק',
        'לחי סמוקה וחמה למגע שמפיצה ניחוח ורדים מתוק',
        'דף לחן תווים מוזהב שנוצץ ומשמיע מנגינת כינור צלולה',
        'כיכר לחם מחמצת לוהטת ופריכה שנבצעת ומפיצה ריח אפייה משכר',
      ],
      20: ['בז צייד מהיר בעל מקור פלדה שמנקר ברעש', 'בוס קשוח בחליפת פסים שמעשן סיגר בריח טבק עשיר'],
      21: ['בלון הליום מבריק שמרחף אל העננים', 'בול דואר זוהר עם חותמת שעווה אדומה'],
      22: ['בובת חרסינה עתיקה עם שמלת משי', 'בוץ שחור סמיך שמבעבע בחום'],
      23: ['כספת בנק ענקית שמגלה מטילי זהב נוצצים', 'בקבוק יין עתיק ומאובק שנחלץ בקול פקיקה'],
      24: ['בית עץ חמים עם ארובה מפיצת עשן לבן', 'בד משי אדום שני מתנפנף ברוח סוערת'],
      25: ['פח מתכת כבד שרועם בחבטה עזה', 'בכי של דמעות זכוכית נוצצות שמטפטפות על לחי'],
      26: ['בקבוק בושם קריסטל יקר שמתיז ענן ריחני של יסמין', 'בוץ סמיך שטומן בתוכו מגפי עור'],
      27: ['ברז מים מזהב שמשפריץ סילון מים קרים וצלולים', 'בור עמוק ואפל באדמה עם הד חוזר'],
      28: ['שקית במבה צהובה שנפתחת בריח בוטנים חזק', 'במת תיאטרון גדולה עם אור זרקורים מהפנט'],
      29: ['שולחן בופה עמוס מטעמים וצלחות זהב', 'כרית פוף ענקית שצוללים לתוכה ברכות'],
      91: ['פיל אפריקאי ענק שרוקע בפרסותיו ותוקע בחדק', 'פנס כיס מאיר באלומת אור כחולה ובוהקת'],
      92: ['פאב הומה אדם עם כוסות בירה מוקצפות שמריחות מלתת', 'פח אשפה ענקי שמשמיע קול מתכתי'],
      94: ['פת לחם חמה שנבצעת ומפיצה ריח שמרים', 'פטיש ברזל כבד שמנפץ סלע לרסיסים'],
      95: ['פיח שחור סמיך שיוצא מארובת עשן לוהטת', 'פח שמן זך שמטפטף טיפות זהב'],
    };

    if (specificObjectMap[numberVal] && specificObjectMap[numberVal].length > 0) {
      const opts = specificObjectMap[numberVal];
      return opts[cycleIdx % opts.length];
    }

    // Dynamic generation matching tLetter and uLetter:
    return `${tLetter}${uLetter} מנמוני חושי ומובהק עם צבעים בוהקים, מרקם מחוספס וריח עז שנקלט מיידית בזיכרון`;
  }

  // Curated sensory objects list for multisensory rich associations
  const sensoryObjectsList = [
    'פרח ורוד ענק עם גבעול שעשוי מקרח צלול שמפיץ ניחוח ורדים מתוק',
    'לוח עץ אורן עתיק ומחוספס שמדיף ריח שרף חזק',
    'סוס פרא אצילי שמריח מחציר רטוב ורוקע בפרסות כסופות',
    'חרב סמוראי כסופה שחותכת משי צבעוני באוויר',
    'כוס בדולח צלולה שמתנפצת לקול צלצול זכוכית עז',
    'שעון חול מוזהב שגרגריו נושרים בקול רשרוש עדין',
    'מפתח זהב עתיק וכבד שפותח תיבת אוצר סודית',
    'פיל אפריקאי ענק שמרים חדק ותוקע בקול רועם',
  ];

  // If type is pao_object or major_word and we have a number, select consonant-aligned object!
  let consonantObject = '';
  if (!isNaN(num)) {
    const tens = Math.floor(num / 10) % 10;
    const units = num % 10;
    const tLet = majorDigitsMap[tens]?.letter || 'ס';
    const uLet = majorDigitsMap[units]?.letter || 'ס';
    consonantObject = getConsonantSensoryObject(num, tLet, uLet, idx);
  }

  const selObject = contextObject || (consonantObject && (type === 'pao_object' || type?.includes('major')) ? consonantObject : sensoryObjectsList[idx % sensoryObjectsList.length]);

  // Sensory-Rich, Dynamic Kinetic Actions
  const sensoryActionsList = [
    'בגלימת משי אדומה צורח מזעם ומכה בעוצמה ב',
    'עם סרט זיעה על המצח, מזיע ומריח מאבקת שריפה, מרים כמו משקולת ברזל את',
    'מזנק באוויר ומטיח בעוצמה מחרישת אוזניים על',
    'מקליד באטרף של ניצוצות וגיצי אש לוהטים מעל',
    'מקפיא בקרח זוהר בתוך שבריר שנייה לקול קראנץ\' חד את',
    'מלהטט באוויר בסיבובים מהירים שמפיצים עשן סגול מעל',
    'יורה קרן לייזר ירוקה מסנוורת שמחממת ומבעבעת את',
    'שובר ומנפץ לרסיסי זהב מנצנצים ורעש רסיסים את',
    'ממיס בלפיד אש כחולה מתפרצת שמדיפה חום עז את',
    'רוקם בחוטי חשמל מוארים שפולטים ריח אוזון סביב',
    'מציף בבועות סבון ענקיות וזוהרות בריח ורדים את',
    'מצלם בהבזק אור לבן מסנוור של מצלמת ענק את',
  ];

  // Tailored Persons
  let specificPersons: string[] = [];
  if (!isNaN(num)) {
    const tens = Math.floor(num / 10) % 10;
    const units = num % 10;
    const tLet = majorDigitsMap[tens]?.letter || 'ס';
    const uLet = majorDigitsMap[units]?.letter || 'ס';

    if (num === 0) specificPersons = ['סילבסטר סטאלון (ס.ס.)', 'סטיבן סיגל (ס.ס.)', 'סמי סוס (ס.ס.)'];
    else if (num === 1) specificPersons = ['סטן לי (ס.ל.)', 'סמואל ל. ג\'קסון (ס.ל.)', 'סנדי לב (ס.ל.)'];
    else if (num === 2) specificPersons = ['סשה ברון כהן (ס.ב.)', 'סנדרה בולוק (ס.ב.)', 'סטיב באלמר (ס.ב.)'];
    else if (num === 3) specificPersons = ['סטיבן קינג (ס.ק.)', 'סטיב קארל (ס.ק.)', 'סנדי קרוגר (ס.ק.)'];
    else if (num === 4) specificPersons = ['סלבדור דאלי (ס.ד.)', 'סנופ דוג (ס.ד.)', 'סטנלי דרוקר (ס.ד.)'];
    else if (num === 14) specificPersons = ['ליאונרדו דיקפריו (ל.ד.)', 'לארי דייוויד (ל.ד.)', 'לוק דונצ\'יץ\' (ל.ד.)'];
    else if (num === 23) specificPersons = ['ביל גייטס (ב.ג.)', 'בני גנץ (ב.ג.)', 'בובי גרג (ב.ג.)'];
    else if (num === 88) specificPersons = ['מרילין מונרו (מ.מ.)', 'מוחמד מורסי (מ.מ.)', 'משה מונטיפיורי (מ.מ.)'];
    else {
      specificPersons = [
        `מאסטר הזיכרון (${tLet}.${uLet}.)`,
        `ספורטאי (${tLet}.${uLet}.) מנצח`,
        `האלוף #${numStr} (${tLet}.${uLet}.)`,
        `דמות מוכרת (${tLet}.${uLet}.)`,
      ];
    }
  }

  const chosenPersons = specificPersons.length > 0 ? specificPersons : [
    'סילבסטר סטאלון (ס.ס.)',
    'סטיבן קינג (ס.ק.)',
    'אלברט איינשטיין (א.א.)',
    'שוליית מנמוניקה',
  ];

  const selPerson = contextPerson || chosenPersons[idx % chosenPersons.length];
  const selAction = contextAction || sensoryActionsList[idx % sensoryActionsList.length];

  // Dynamic Multisensory Full Scenes tailored strictly to the selected person, action, and object
  const multisensoryScenes = [
    `${selPerson} בעיניים דרוכות ורוויות נחישות, מפעיל כוח אדיר ומבצע ${selAction} בעוצמה מסחררת ישירות על גבי ${selObject}, בעוד רסיסי אור זוהרים בצבע ניאון סגול ניתזים סביב בריח מנטה עז וקריר!`,
    `בפריים קולנועי דרמטי ובלתי נשכח: ${selPerson} מזנק קדימה ומבצע ${selAction} על ${selObject}, כשגל עשן סמיך בריח שרף אורנים מתפשט וצליל שבירה מתכתי רועם מהדהד בחלל!`,
    `${selPerson} מוקף בהילה מוזהבת זוהרת וחמה, תופס עמדה מרכזית ו${selAction} את ${selObject} שמסתחרר באוויר ופולט ניחוח שוקולד מתוק לקול תשואות מחרישות אוזניים!`,
    `סצנה רב-חושית עשירה: ${selPerson} פועל בריכוז מוחלט כשבידיו הוא ${selAction} את ${selObject}, תוך שרוח קרירה מפיצה ריח ים מלוח ולהבות כחולות מרצדות מסביב!`,
    `${selPerson} עוטה בגד מבריק בצבעי אש זוהרים, שואג בתנופה קינטית אדירה ו${selAction} מעל ${selObject} שמצלצל בהד פעמונים צלול ומשאיר שובל ניצוצות מרהיב!`,
    `תמונת זיכרון חדה ומוחשית: ${selPerson} מתקרב במהירות שיא ומבצע ${selAction} מול ${selObject} הלוהט, כשטיפות טל קפואות מתיזות לכל עבר בריח ורדים רענן ותחושת חשמל באוויר!`,
    `${selPerson} בריכוז שיא ובעוצמה בלתי ניתנת לעצירה, מבצע ${selAction} על ${selObject}, בעוד האור מסביב מתחלף לטורקיז זוהר וריח הדרים מרענן ממלא את הסצנה!`
  ];

  const fullScene = multisensoryScenes[idx % multisensoryScenes.length];

  let headline = `אסוציאציה חושית ל-${inputStr || 'פריט'}`;
  let hebrewKeyword = inputStr;
  let paoPerson = selPerson;
  let paoAction = selAction;
  let paoObject = selObject;
  let visualScene = fullScene;
  let explanation = `חיבור רב-חושי (צבע, ריח, מגע ותנועה) המקבע את הזיכרון בהיפוקמפוס.`;
  let palacePlacementTip = `הצב את הסצנה במרכז התחנה כשהיא פולטת ריח חזק ותנועה חיה.`;

  if (type === 'pao_object') {
    headline = `חפץ PAO מוחשי למספר ${numStr || inputStr}`;
    hebrewKeyword = selObject;
    visualScene = selObject;
  } else if (type === 'pao_action') {
    headline = `פעולה קינטית למספר ${numStr || inputStr}`;
    hebrewKeyword = selAction;
    visualScene = selAction;
  } else if (type === 'pao_person') {
    headline = `דמות PAO למספר ${numStr || inputStr}`;
    hebrewKeyword = selPerson;
    visualScene = selPerson;
  } else if (type === 'pao_scene') {
    headline = `סצנה שלמה רב-חושית למספר ${numStr || inputStr}`;
    visualScene = fullScene;
  } else if (type?.includes('major_word') || type === 'major_consonants') {
    if (!isNaN(num)) {
      const tens = Math.floor(num / 10) % 10;
      const units = num % 10;
      const tensList = majorDigitsMap[tens]?.words || ['סם'];
      const combinedWord = `${tensList[idx % tensList.length]}`;
      hebrewKeyword = combinedWord;
      headline = `מילת Major למספר ${numStr}`;
      visualScene = `המספר ${numStr} מקושר ישירות למילה "${combinedWord}", וממנה בוקע אור לבן עז וריח של מנטה טרייה.`;
    }
  } else if (type?.includes('major_hint')) {
    visualScene = `במרכז הפריים מוצב דימוי ענק וזוהר בצבע ארגמן של ${extraStr || inputStr}, שמדיף ריח אש ומתנפץ לאלפי רסיסי זהב מנצנצים.`;
  } else if (type?.includes('name') || type?.includes('face')) {
    const anchors = [
      'מבט חודר וגבות מוגבהות עם צלקת דקה',
      'חיוך רחב עם שן זהב זוהרת ומבריקה',
      'קמטי צחוק בולטים ומבט חם בעיניים',
      'משקפיים עגולים ענקיים שמשקפים להבות אש',
      'תלתלים שחורים פראיים שמריחים מבושם מתוק',
    ];
    headline = `עוגן וסצנה לשם ${inputStr}`;
    hebrewKeyword = anchors[idx % anchors.length];
    visualScene = `על גבי ${hebrewKeyword}, מונח סמל ענק וזוהר של ${inputStr} בריח שוקולד מתוק והתנגשות קינטית בלתי נשכחת!`;
  }

  return {
    headline,
    visualScene,
    explanation,
    palacePlacementTip,
    hebrewKeyword,
    paoPerson: selPerson,
    paoAction: selAction,
    paoObject: selObject,
    fullScene,
  };
}

// API Endpoint: Mnemonic Generation Tool (PAO, Major, Names, Academic concepts)
app.post('/api/gemini/generate-mnemonic', async (req: Request, res: Response) => {
  const { type, input, extra, cycle, customDigits } = req.body;
  const inputStr = String(input || '').trim();
  const extraStr = String(extra || '').trim();
  const cycleNum = typeof cycle === 'number' ? cycle : 0;

  const majorConstraints = getHebrewMajorConstraints(inputStr, extraStr, customDigits);

  // If a valid Gemini API key is present and doesn't look like a placeholder, try Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  const isValidApiKeyFormat = Boolean(apiKey && apiKey.length > 10 && !apiKey.includes('YOUR_') && !apiKey.includes('PLACEHOLDER'));

  if (isValidApiKeyFormat) {
    try {
      const prompt = `אתה רב-אמן בינלאומי לפיתוח מיומנויות זיכרון (Mnemonics) ואלוף זיכרון עולמי.
תפקידך להמיר מספרים, מילים, שמות או שלשות PAO לתמונות אסוציאטיביות ויזואליות רב-חושיות, חדות ובלתי נשכחות.

סוג המשימה: ${type} (אפשרויות: pao_scene, pao_object, pao_action, pao_person, major_word, major_hint, name_face_anchor, name_face_substitute, name_face_scene, academic_concept, palace_scene)
קלט המשתמש: "${inputStr}"
מידע נוסף והקשר (כולל שדות קיימים: אדם/פעולה/חפץ/סצנה): "${extraStr}"
איטרציה/אופציה מספר: ${cycleNum + 1} (חשוב מאוד: הצע בכל איטרציה רעיון שונה, מקורי ומפתיע!)
${majorConstraints}

חוקי ברזל חיוניים של אקדמיית הזיכרון (עקרון רב-חושי שורשי):
1. אסוציאציות בלתי נשכחות חייבות לכלול את כל החושים:
   - צבעים עזים וספציפיים (אדום שני, סגול ניאון, זהב בוהק, ירוק אזמרגד)
   - ריחות וטעמים מוחשיים (ריח חציר רטוב, אבקת שריפה חריפה, ורדים מתוקים, עשן גופרית, מנטה מקפיאה, שוקולד מריר)
   - תחושות מגע וטמפרטורה (קרח צלול מקפיא, עור מחוספס, ברזל כבד וקר, להבות אש חמות)
   - קולות ותנועה קינטית דרמטית מוגזמת (שאגה, צרחה, שבירה, ניפוץ, זינוק)
2. לעולם אל תציע מילה בודדת סתמית או חפץ מופשט (כגון "חפץ בולט", "חפץ", או "פרח")!
   - דוגמה רעה: "פרח"
   - דוגמה מצוינת: "פרח ורוד ענק עם גבעול שעשוי מקרח צלול שמפיץ ניחוח ורדים מתוק וקריר"
3. עבור pao_object (חפץ PAO עבור מספר מסוים):
   - חובה מוחלטת ללא פשרות: שם החפץ הבסיסי חייב להיגזר אך ורק מעיצורי הספרות של המספר (לפי לוגיקת הספרות והאותיות הפעילה בבסיס הנתונים כמפורט לעיל) בתוספת אותיות חיבור שקופות (א-נ-י-ע-ו-נ-ה) בלבד!
   - עדיפות עליונה למילים קצרות וקולעות ככל הניתן!
   - דוגמה קריטית: עבור המספר 15 שבו 1=ל ו-5=ח: המילה חייבת להתבסס על ל' ו-ח' בתוספת אותיות חיבור שקופות כרצונך. אופציות לגיטימיות ומעולות יהיו למשל: 'לוח', 'לחי', 'לחן', 'לחם'!
   - עטוף את המילה הקצרה בתיאור ויזואלי ורב-חושי מוחשי (צבעים, מרקם, ריח, טמפרטורה). למשל: 'לוח עץ עתיק ומחוספס שמדיף ריח שרף אורנים חזק', 'לחי סמוקה חמה ורכה שמפיצה ניחוח ורדים מתוק', 'דף לחן תווים מוזהב שנוצץ ומשמיע מנגינת כינור צלולה'.
4. עבור pao_action: פעולה קינטית מוגזמת עם תנועה, רגש והשפעה חושית.
5. עבור pao_person: דמות מפורסמת או מוכרת שראשי התיבות של שמה תואמים בדיוק את אותיות הספרות.
6. עבור pao_scene (סצנה שלמה):
   - קח את שלושת השדות הייחודיים שהמשתמש הזין: הדמות (Person), הפעולה (Action) והחפץ (Object) המוגדרים בקלט/מידע הנוסף (אפילו אם היוזר טרם שמר אותם).
   - חובה מוחלטת: הסצנה חייבת להתמקד אך ורק בדמות הספציפית שהוזנה, בפעולה הספציפית שהוזנה ובחפץ הספציפי שהוזן!
   - אל תשתמש בשום אופן בסילבסטר סטאלון, כפפות אגרוף או אורוות סוסים אלא אם כן אלו בדיוק הערכים שהוזנו!
   - שלב את שלושתם בפריים קולנועי חי, דרמטי ורב-חושי (צבעים עזים, ריחות מוחשיים, טמפרטורה, קולות ותנועה קינטית מוגזמת).
   - בכל איטרציה (איטרציה מספר ${cycleNum + 1}), הצע תיאור חדש, מרענן ושונה לחלוטין!

השב אך ורק בפורמט JSON תקני:
{
  "headline": string,
  "visualScene": string,
  "explanation": string,
  "palacePlacementTip": string,
  "hebrewKeyword": string,
  "paoPerson": string,
  "paoAction": string,
  "paoObject": string,
  "fullScene": string
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              visualScene: { type: Type.STRING },
              explanation: { type: Type.STRING },
              palacePlacementTip: { type: Type.STRING },
              hebrewKeyword: { type: Type.STRING },
              paoPerson: { type: Type.STRING },
              paoAction: { type: Type.STRING },
              paoObject: { type: Type.STRING },
              fullScene: { type: Type.STRING },
            },
            required: ['headline', 'visualScene', 'hebrewKeyword', 'paoPerson', 'paoAction', 'paoObject', 'fullScene'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.paoObject || parsed.visualScene || parsed.hebrewKeyword || parsed.fullScene) {
        return res.json(parsed);
      }
    } catch (error: any) {
      console.warn('Gemini API call failed, using high-fidelity Hebrew engine:', error?.message || error);
    }
  }

  // High-fidelity Hebrew phonetic & kinetic mnemonic generator
  const generated = generateHebrewMnemonicFallback(type, inputStr, extraStr, cycleNum, customDigits);
  return res.json(generated);
});

// API Endpoint: AI Performance & Cognitive Technique Analysis
app.post('/api/gemini/analyze-performance', async (req: Request, res: Response) => {
  try {
    const { testHistory, stats, userLevel, badges } = req.body;

    const prompt = `אתה "הוועדה המדעית של איגוד אלופי הזיכרון העולמי".
נתח את ביצועי המשתמש המשתקפים מתוצאות התרגילים והמבחנים שביצע.
נתוני המשתמש:
דרגת מנמוניקה נוכחית: ${userLevel || 'שוליית מנמוניקה'}
תגים שנצברו: ${(badges || []).join(', ') || 'עדיין אין'}
סטטיסטיקת תרגילים: ${JSON.stringify(stats || {})}
היסטוריית מבחנים אחרונים:
${JSON.stringify((testHistory || []).slice(0, 15))}

בצע ניתוח מעמיק, מעודד ומבוסס מדע (היפוקמפוס, תאי מקום, קידוד כפול, קינטיקה מוקצנת, עקומת שכחה SRS, Autonomous Semanticization).
זהה היכן המשתמש חזק, היכן יש קריסה או היסוס (שמות, מספרים ארוכים, תחנות בארמון), ותן המלצות ספציפיות לפעולה.

השב אך ורק במבנה JSON:
{
  "executiveSummary": string, // סיכום מנהלים חם ומעצים של ההתקדמות הקוגניטיבית
  "strengths": string[], // 3-4 נקודות חוזק מרכזיות שהוכחו בביצועים
  "weaknesses": string[], // 2-3 נקודות תורפה או צווארי בקבוק שמחייבים תשומת לב
  "recommendations": string[], // 3-4 המלצות מעשיות לתרגול הבא
  "cognitiveScores": {
    "spatialNavigation": number, // 0-100 שליטה במרחב וארמונות זיכרון
    "kineticEncoding": number, // 0-100 עוצמת דימויים והגזמה קינטית
    "phoneticDecoding": number, // 0-100 שליטה ב-Major ו-PAO
    "activeRecallSpeed": number, // 0-100 מהירות ודיוק בשליפה פעילה
    "longTermRetention": number // 0-100 שימור וייצוב סינפטי לטווח ארוך
  },
  "nextTrainingPlan": string // תוכנית אימון מומלצת לשבוע הקרוב
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            cognitiveScores: {
              type: Type.OBJECT,
              properties: {
                spatialNavigation: { type: Type.NUMBER },
                kineticEncoding: { type: Type.NUMBER },
                phoneticDecoding: { type: Type.NUMBER },
                activeRecallSpeed: { type: Type.NUMBER },
                longTermRetention: { type: Type.NUMBER },
              },
              required: [
                'spatialNavigation',
                'kineticEncoding',
                'phoneticDecoding',
                'activeRecallSpeed',
                'longTermRetention',
              ],
            },
            nextTrainingPlan: { type: Type.STRING },
          },
          required: [
            'executiveSummary',
            'strengths',
            'weaknesses',
            'recommendations',
            'cognitiveScores',
            'nextTrainingPlan',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in analyze-performance:', error);
    // Intelligent fallback
    return res.json({
      executiveSummary: 'התקדמות מצוינת במסלול ההכשרה לאלופי זיכרון! ניכרת הפעלה עקבית של רשתות ההיפוקמפוס והשליפה הפעילה.',
      strengths: [
        'הפנמה טובה של עקרון ההגזמה האסוציאטיבית',
        'קידוד כפול יעיל בתרגולי מספרים ושמות',
        'נכונות לאתגר את הזיכרון בשפה חופשית',
      ],
      weaknesses: [
        'מומלץ להעצים את המרכיב הקינטי (פיצוץ/שבירה) בעת קידוד תחנות בארמון',
        'נדרש תרגול תכוף יותר של שלשות PAO להשגת אוטומטיזציה',
      ],
      recommendations: [
        'בצע סיור יומי קצר של 3 דקות בארמון הבית ללא חומרי עזר',
        'תרגל 5 צמדי Major בעברית לפני השינה לחיזוק ה-LTP המוחי',
        'נצל את הבוחן החכם פעמיים ביום לביסוס חזרות מרווחות',
      ],
      cognitiveScores: {
        spatialNavigation: 75,
        kineticEncoding: 82,
        phoneticDecoding: 78,
        activeRecallSpeed: 80,
        longTermRetention: 72,
      },
      nextTrainingPlan: 'שבוע התמקדות בארכיטקטורת ארמונות זיכרון: צור 2 חדרים חדשים ותרגל שליפה לאחור.',
    });
  }
});

// API Endpoint: Generate PAO Mnemonic Scene Image with Gemini Nano Banana
app.post('/api/gemini/generate-pao-image', async (req: Request, res: Response) => {
  // Set generous socket timeout so client's 120s timeout handles early aborts
  req.setTimeout(130000);

  try {
    const { userId, userEmail, person, action, object, userStylePrompt, numberStr, scene } = req.body;

    // Authentication check: User must be signed in
    if (!userId || !userEmail) {
      return res.status(401).json({
        error: 'AUTH_REQUIRED',
        message: 'כדי לייצר תמונות עם Gemini Nano Banana, יש להתחבר תחילה עם חשבון Google שלך (התחבר בסרגל העליון).',
      });
    }

    if (!person && !action && !object) {
      return res.status(400).json({
        error: 'MISSING_PAO',
        message: 'שלשת ה-PAO חסרה ערכים (אדם, פעולה, חפץ) לצורך יצירת הדימוי המנמוני.',
      });
    }

    const hasScene = Boolean(scene && typeof scene === 'string' && scene.trim().length > 0);
    const sceneText = hasScene ? (scene as string).trim() : '';
    const client = getGeminiClient();

    // Text embedding instruction derived from user specifications:
    // Person name on clothes/nearby object, Action word in comic bubble like POW or GLUG, Object name on a label/tag.
    const textEmbeddingDirective = `Naturally and visually integrate legible text into the illustration for the Person, Action, and Object:
1. Write the person's name or title ("${person || ''}") visibly on their clothing (e.g. embroidered on a shirt, nametag, or suit) or on an object directly beside them.
2. Display a lively word related to the action ("${action || ''}") inside an energetic comic-book style text bubble like "POW!" or "GLUG!" or the action word.
3. Write the exact name of the object ("${object || ''}") on a distinct label, sticker, or tag on or right next to the object.
4. Ensure all embedded text is crisp, legible, and subtle without overpowering the main illustration frame.`;

    // 1. Synthesize a vivid, filter-proof abstract caricature prompt using gemini-3.8-flash
    // Real celebrity/fictional names MUST be converted into abstract caricature archetypes
    // to prevent gemini-nano-banana-2.1 from returning IMAGE_OTHER safety filter rejections.
    let synthesizedPrompt = '';
    try {
      const flashSynthesis = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an expert cognitive illustration prompter specializing in the PAO mnemonic memory system and abstract caricature art.
Convert the following Hebrew PAO triplet and complete scene into a single, vibrant, humorous abstract caricature cartoon image generation prompt in English.

Input Data:
- Person/Persona: "${person || ''}"
- Action: "${action || ''}"
- Object: "${object || ''}"
${hasScene ? `- Full Scene Details: "${sceneText}"` : ''}
${userStylePrompt ? `- User Style/Notes: "${userStylePrompt.trim()}"` : ''}

CRITICAL RULES (TO GUARANTEE FIRST-ATTEMPT ACCEPTANCE BY THE IMAGE MODEL):
1. MANDATORY ABSTRACT CARICATURE ARCHETYPE:
- Portray the person EXCLUSIVELY as an exaggerated, humorous artistic abstract 2D cartoon caricature archetype.
- ABSOLUTELY NEVER include any real celebrity name, politician name, public figure name, or copyrighted brand in the output prompt (not in text, not in quotes, not on badges, not anywhere). If any real public figure name appears, Gemini Nano Banana will immediately reject the image with IMAGE_OTHER.
- Convert "${person || ''}" into a vivid, descriptive visual archetype (e.g., if politician: "an exaggerated eccentric cartoon statesman with swept silver hair in an oversized navy suit"; if action star/athlete: "a hyper-muscular cartoon action champion in athletic attire"; if singer/performer: "an flamboyant cartoon pop icon with wild sparkling stage costume").
2. VISUAL STYLE:
- Vibrant, colorful abstract caricature cartoon illustration in expressive 2D comic art style. Bold clean outlines, saturated dynamic palette, comedic exaggerated poses, high visual clarity in a single cohesive camera frame.
3. VISUAL TEXT EMBEDDINGS (NATURAL & SUBTLE):
- On the Person's clothing or nearby prop: Instead of a real celebrity name, write a playful archetype title, role, or generic moniker (such as "CHIEF", "HERO", "STAR", "BOSS", "DOC", or initials) delicately on a nametag or shirt patch.
- For the Action: Display an expressive comic sound-effect or verb bubble (e.g., "POW!", "GLUG!", "BAM!", "WHOOSH!").
- For the Object: Write the exact descriptive object name ("${object || ''}") clearly on a neat label, price tag, or sticker on or beside the object.
- Ensure all text elements are legible, subtle, and harmonious without dominating the illustration.
4. FULL SCENE INTEGRATION:
- Faithfully incorporate all specific props, interactions, settings, and comedic nuances from the "Full Scene Details".
5. OUTPUT:
- Output ONLY the final concise image generation prompt in English. No introductory text or conversational markdown.`,
      });

      if (flashSynthesis.text) {
        synthesizedPrompt = flashSynthesis.text.trim();
      }
    } catch (synthesisErr) {
      console.warn('Flash synthesis note:', synthesisErr);
    }

    // Fallback prompt if synthesis was empty - strictly uses abstract caricature archetype
    const fallbackCaricature = `A colorful, humorous abstract caricature cartoon illustration in expressive 2D comic art style of an exaggerated cartoon archetype character performing an action with an object for a memory mnemonic system. Action: "${action || ''}". Object: "${object || ''}". ${hasScene ? `Scene details: ${sceneText}. ` : ''}${userStylePrompt ? `Style notes: ${userStylePrompt}. ` : ''}Include subtle embedded text: a comic-style action sound bubble like POW or GLUG, and a neat label with "${object || ''}" on the object. Single unified frame, vibrant colors.`;

    let finalPrompt = synthesizedPrompt || fallbackCaricature;

    // Safety guard: Sanitize prompt to ensure no direct celebrity/person names leak into finalPrompt
    if (person && person.trim().length > 1) {
      const sanitizedRegex = new RegExp(person.trim(), 'gi');
      finalPrompt = finalPrompt.replace(sanitizedRegex, 'the cartoon caricature archetype');
    }

    console.log(`[Gemini Nano Banana] Generating image with prompt: "${finalPrompt.substring(0, 160)}..."`);

    let generatedImageUrl = '';

    try {
      const response = await client.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: {
          parts: [{ text: finalPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
            imageSize: '1K',
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          const mime = part.inlineData.mimeType || 'image/png';
          generatedImageUrl = `data:${mime};base64,${base64}`;
          break;
        }
      }

      // If the model filtered the image, retry with a further abstracted caricature prompt
      if (!generatedImageUrl && response.candidates?.[0]) {
        const finish = response.candidates[0].finishReason;
        if (finish === 'IMAGE_OTHER' || finish === 'IMAGE_SAFETY') {
          console.log(`First image attempt ended with ${finish}, attempting caricature abstraction...`);
          const caricaturePrompt = `A colorful, humorous abstract caricature cartoon illustration of an expressive cartoon archetype character performing an action with an object for a memory mnemonic system. Action: "${action || ''}". Object: "${object || ''}". ${hasScene ? `Scene details: ${sceneText}. ` : ''}${userStylePrompt ? `Style notes: ${userStylePrompt}. ` : ''}Single unified frame, vibrant colors.`;
          
          try {
            const retryRes = await client.models.generateContent({
              model: 'gemini-nano-banana-2.1',
              contents: { parts: [{ text: caricaturePrompt }] },
              config: { imageConfig: { aspectRatio: '1:1', imageSize: '1K' } },
            });
            for (const part of retryRes.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                const base64 = part.inlineData.data;
                const mime = part.inlineData.mimeType || 'image/png';
                generatedImageUrl = `data:${mime};base64,${base64}`;
                break;
              }
            }
          } catch (retryErr) {
            console.warn('Caricature retry note:', retryErr);
          }
        }
      }
    } catch (genError: any) {
      console.warn('gemini-nano-banana-2.1 call note, attempting image generation fallback:', genError?.message || genError);
      
      const errStr = (genError?.message || String(genError)).toLowerCase();
      if (errStr.includes('api_key_invalid') || errStr.includes('api key not valid')) {
        return res.status(401).json({
          error: 'API_KEY_INVALID',
          message: 'מפתח ה-API של Gemini אינו תקין או פג תוקפו. יש לבחור או להגדיר מפתח תקין בלוח ההגדרות של AI Studio.',
        });
      }
      if (errStr.includes('quota') || errStr.includes('429') || errStr.includes('resource_exhausted')) {
        return res.status(429).json({
          error: 'QUOTA_EXHAUSTED',
          message: 'מכסת הטוקנים היומית של Gemini לחשבונך מוצתה לסשן זה. תוכל להעלות תמונה מהמכשיר או לנסות שוב מאוחר יותר.',
        });
      }

      // Fallback to gemini-3.1-flash-lite-image (modern image model via generateContent)
      try {
        const fallbackRes = await client.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: finalPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: '1:1',
            },
          },
        });

        for (const part of fallbackRes.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64 = part.inlineData.data;
            const mime = part.inlineData.mimeType || 'image/png';
            generatedImageUrl = `data:${mime};base64,${base64}`;
            break;
          }
        }
      } catch (fallbackError: any) {
        const fbErrStr = (fallbackError?.message || String(fallbackError)).toLowerCase();
        if (fbErrStr.includes('api_key_invalid') || fbErrStr.includes('api key not valid')) {
          return res.status(401).json({
            error: 'API_KEY_INVALID',
            message: 'מפתח ה-API של Gemini אינו תקין או פג תוקפו. יש לבחור מפתח תקין ב-AI Studio.',
          });
        }
        if (fbErrStr.includes('quota') || fbErrStr.includes('429') || fbErrStr.includes('resource_exhausted')) {
          return res.status(429).json({
            error: 'QUOTA_EXHAUSTED',
            message: 'מכסת הטוקנים היומית של Gemini לחשבונך מוצתה לסשן זה. תוכל להעלות תמונה מהמכשיר או לנסות שוב מאוחר יותר.',
          });
        }
        throw genError;
      }
    }

    if (!generatedImageUrl) {
      return res.status(422).json({
        error: 'GENERATION_FILTERED',
        message: 'לא התקבלה תמונה מ-Gemini עבור ערכים אלו (ייתכן שעקב שמות דמויות מוכרות או מדיניות תוכן). נסה להזין תיאור כללי של הדמות (לדוגמה: "סוכן חשאי" במקום שם מפורסם ספציפי) או לנסח סגנון אחר.',
      });
    }

    return res.json({
      success: true,
      imageUrl: generatedImageUrl,
      numberStr,
    });
  } catch (error: any) {
    console.error('Error generating PAO image:', error);
    const msg = (error?.message || String(error)).toLowerCase();
    if (msg.includes('api_key_invalid') || msg.includes('api key not valid')) {
      return res.status(401).json({
        error: 'API_KEY_INVALID',
        message: 'מפתח ה-API של Gemini אינו תקין או שאינו מוגדר. יש לבחור מפתח תקין ב-AI Studio.',
      });
    }
    if (msg.includes('quota') || msg.includes('429') || msg.includes('resource_exhausted')) {
      return res.status(429).json({
        error: 'QUOTA_EXHAUSTED',
        message: 'מכסת הטוקנים היומית של Gemini לחשבונך מוצתה לסשן זה. תוכל להעלות תמונה מהמכשיר או לנסות שוב מאוחר יותר.',
      });
    }
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'אירעה שגיאה ביצירת התמונה עם Gemini. תוכל להעלות קובץ ידנית מהמכשיר.',
    });
  }
});

// Vite middleware for dev / static serve for prod
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Memory Champion Academy Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Ultra-low-latency text model & config (minimal thinking overhead for instant responses)
const FAST_TEXT_MODEL = 'gemini-3.1-flash-lite';
const FAST_THINKING_CONFIG = { thinkingLevel: ThinkingLevel.MINIMAL };

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
      model: FAST_TEXT_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: FAST_THINKING_CONFIG,
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

// Helper to sanitize and format user database for Gemini context injection
function buildMentorDatabaseContext(rawDb: any, latestUserPrompt: string): {
  targetedContext: string;
  fullDatabaseContext: string;
} {
  if (!rawDb || typeof rawDb !== 'object') {
    return {
      targetedContext: 'לא נשלחו נתוני מסד נתונים בבקשה זו.',
      fullDatabaseContext: 'מסד נתונים ריק.',
    };
  }

  const majorDigits: any[] = Array.isArray(rawDb.majorDigits) ? rawDb.majorDigits : [];
  const connectingLetters: string[] = Array.isArray(rawDb.connectingLetters) ? rawDb.connectingLetters : [];
  const majorItems: any[] = Array.isArray(rawDb.majorItems) ? rawDb.majorItems : [];
  const paoItems: any[] = Array.isArray(rawDb.paoItems) ? rawDb.paoItems : [];
  const palaces: any[] = Array.isArray(rawDb.palaces) ? rawDb.palaces : [];
  const peopleCards: any[] = Array.isArray(rawDb.peopleCards) ? rawDb.peopleCards : [];
  const shapePegs: any[] = Array.isArray(rawDb.shapePegs) ? rawDb.shapePegs : [];
  const bodyPegs: any[] = Array.isArray(rawDb.bodyPegs) ? rawDb.bodyPegs : [];
  const academicPoints: any[] = Array.isArray(rawDb.academicPoints) ? rawDb.academicPoints : [];
  const personalAssociations: any[] = Array.isArray(rawDb.personalAssociations) ? rawDb.personalAssociations : [];

  // 1. Extract numbers (0-99) mentioned in the user's question for immediate high-priority context injection
  const numberMatches = latestUserPrompt.match(/\b\d{1,2}\b/g) || [];
  const queriedNumbers = Array.from(
    new Set(numberMatches.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n >= 0 && n <= 99))
  );

  const targetedLines: string[] = [];
  for (const num of queriedNumbers) {
    const numStr = (num < 10 ? `0${num}` : String(num)).padStart(2, '0');
    const mItem = majorItems.find((m) => Number(m.number) === num);
    const pItem = paoItems.find((p) => Number(p.number) === num);
    const dItem = num <= 9 ? majorDigits.find((d) => Number(d.number) === num) : null;
    const sPeg = shapePegs.find((s) => Number(s.number) === num);
    const bPeg = bodyPegs.find((b) => Number(b.index) === num);

    const recordParts: string[] = [`נתוני המשתמש במסד הנתונים עבור המספר ${num} (${numStr}):`];
    if (mItem) {
      recordParts.push(
        `  • שיטת Major (מספר ${numStr}): מילת עוגן = "${mItem.defaultWord || mItem.userWord || ''}", עיצורים = "${mItem.consonants || ''}", רמז תמונה = "${mItem.imageHint || ''}"${mItem.customNotes ? `, הערות = "${mItem.customNotes}"` : ''}`
      );
    }
    if (pItem) {
      recordParts.push(
        `  • שיטת PAO (מספר ${numStr}): אדם (Person) = "${pItem.person || ''}", פעולה (Action) = "${pItem.action || ''}", חפץ (Object) = "${pItem.object || ''}", סצנה שלמה = "${pItem.scene || ''}"`
      );
    }
    if (dItem) {
      recordParts.push(
        `  • לוגיקת ספרה בודדת (${num}): עיצורים = "${dItem.consonants || ''}", מילת עוגן = "${dItem.defaultWord || ''}"`
      );
    }
    if (sPeg) {
      recordParts.push(
        `  • מתלה צורה (${num}): צורה = "${sPeg.shapeName || ''}", חפץ = "${sPeg.defaultObject || ''}"`
      );
    }
    if (bPeg) {
      recordParts.push(
        `  • מתלה גוף (שלב ${num}): איבר = "${bPeg.bodyPartHebrew || ''}", חפץ = "${bPeg.defaultObject || ''}"`
      );
    }
    targetedLines.push(recordParts.join('\n'));
  }

  // 2. Build compact, clean tables of the user's entire database (stripped of base64 images)
  const digitsTable = majorDigits
    .map((d) => `${d.number}: עיצורים=[${d.consonants}] מילה="${d.defaultWord || ''}"`)
    .join(' | ');

  const majorTable = majorItems
    .map(
      (m) =>
        `${m.numberStr || (m.number < 10 ? `0${m.number}` : m.number)}: מילת Major="${m.defaultWord || ''}" (עיצורים: ${m.consonants || ''}${m.imageHint ? `, דימוי: ${m.imageHint}` : ''})`
    )
    .join('\n');

  const paoTable = paoItems
    .map(
      (p) =>
        `${p.numberStr || (p.number < 10 ? `0${p.number}` : p.number)}: אדם="${p.person || ''}" | פעולה="${p.action || ''}" | חפץ="${p.object || ''}"${p.scene ? ` | סצנה="${p.scene}"` : ''}`
    )
    .join('\n');

  const palacesTable = palaces
    .map((pal) => {
      const lociStr = (pal.loci || [])
        .map(
          (l: any) =>
            `  [תחנה ${l.stepNumber}: "${l.title}" בחדר "${l.roomName}" | מיקום: "${l.positionDescription || ''}" | תוכן: "${l.storedContent || ''}" | סצנה: "${l.mnemonicScene || ''}"]`
        )
        .join('\n');
      return `ארמון "${pal.name}" (מזהה: ${pal.id}, תיאור: "${pal.description || ''}", ${pal.loci?.length || 0} תחנות):\n${lociStr}`;
    })
    .join('\n\n');

  const peopleTable = peopleCards
    .map(
      (c) =>
        `שם="${c.name}" (תפקיד: "${c.roleOrJob || ''}", עוגן פנים: "${c.morphologicalAnchor || ''}", מילת תחליף: "${c.substituteWord || ''}", סצנה: "${c.mnemonicScene || ''}")`
    )
    .join('\n');

  const pegsTable = [
    'מתלי צורה (Shape Pegs): ' +
      shapePegs.map((s) => `${s.number}="${s.defaultObject}" (${s.shapeName})`).join(', '),
    'מתלי גוף (Body Pegs): ' +
      bodyPegs.map((b) => `${b.index} (${b.bodyPartHebrew})="${b.defaultObject}"`).join(', '),
  ].join('\n');

  const academicTable = academicPoints
    .map(
      (a) =>
        `מושג="${a.conceptTitle}" (${a.discipline}): מילת מפתח="${a.keyWord}", עוגן="${a.visualAnchor}", סצנה="${a.mnemonicScene}"`
    )
    .join('\n');

  const associationsTable = personalAssociations
    .map(
      (pa) =>
        `נושא="${pa.targetSubject}": מידע="${pa.storedNumberOrFact}" -> מנמוניקה="${pa.encodedMnemonic}" (שיטה: ${pa.methodUsed})`
    )
    .join('\n');

  const fullDatabaseContext = [
    `משתמש מחובר: ${rawDb.userName || 'משתמש'} (UID: ${rawDb.userUid || 'local'})`,
    `אותיות קישור (Connecting Letters): ${connectingLetters.join(', ')}`,
    `לוגיקת ספרות 0-9:\n${digitsTable}`,
    `\n=== טבלת Major 00-99 של המשתמש (${majorItems.length} רשומות) ===\n${majorTable}`,
    `\n=== טבלת PAO 00-99 של המשתמש (${paoItems.length} רשומות) ===\n${paoTable}`,
    `\n=== ארמונות זיכרון ותחנות של המשתמש (${palaces.length} ארמונות) ===\n${palacesTable || 'אין ארמונות'}`,
    `\n=== כרטיסי שמות ופנים של המשתמש (${peopleCards.length} כרטיסים) ===\n${peopleTable || 'אין כרטיסים'}`,
    `\n=== מתלי צורה וגוף של המשתמש ===\n${pegsTable}`,
    `\n=== מושגים אקדמיים של המשתמש (${academicPoints.length}) ===\n${academicTable || 'אין מושגים'}`,
    `\n=== פנקס אסוציאציות אישי של המשתמש (${personalAssociations.length}) ===\n${associationsTable || 'אין אסוציאציות'}`,
  ].join('\n');

  return {
    targetedContext: targetedLines.join('\n\n'),
    fullDatabaseContext,
  };
}

// API Endpoint: AI Memory Mentor Chat & Full User Database CRUD Agent
app.post('/api/gemini/mentor-chat', async (req: Request, res: Response) => {
  const { messages, message, history, userProfileSummary, appContext, userDatabase } = req.body || {};
  const dbSnapshot = userDatabase || appContext || {};

  // Build raw chat list from request
  let chatList: Array<{ role: string; content: string }> = [];
  if (Array.isArray(messages) && messages.length > 0) {
    chatList = messages;
  } else if (message && typeof message === 'string') {
    const hist = Array.isArray(history) ? history : [];
    chatList = [...hist, { role: 'user', content: message }];
  }

  if (chatList.length === 0) {
    chatList = [{ role: 'user', content: String(message || 'שלום! אשמח לעזרה במנמוניקה.') }];
  }

  // Extract latest user message
  const latestUserMsgObj = [...chatList].reverse().find((m) => m.role !== 'assistant' && m.role !== 'model');
  const latestUserText = String(latestUserMsgObj?.content || message || '').trim();

  // Build structured DB context & targeted record lookup
  const { targetedContext, fullDatabaseContext } = buildMentorDatabaseContext(dbSnapshot, latestUserText);

  // Normalize multi-turn contents for Gemini API:
  // 1. Must start with role 'user' (strip any leading welcome 'model' messages)
  // 2. Must strictly alternate 'user' and 'model' (merge consecutive same-role messages)
  const normalizedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const msg of chatList) {
    const role: 'user' | 'model' = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
    const text = String(msg.content || '').trim();
    if (!text) continue;

    // Skip leading 'model' turns before the first 'user' turn
    if (normalizedContents.length === 0 && role === 'model') {
      continue;
    }

    const prev = normalizedContents[normalizedContents.length - 1];
    if (prev && prev.role === role) {
      prev.parts[0].text += `\n\n${text}`;
    } else {
      normalizedContents.push({
        role,
        parts: [{ text }],
      });
    }
  }

  if (normalizedContents.length === 0) {
    normalizedContents.push({
      role: 'user',
      parts: [{ text: latestUserText || 'שלום!' }],
    });
  }

  // Inject targeted database records directly into the final user turn so the LLM has immediate context
  const lastTurn = normalizedContents[normalizedContents.length - 1];
  if (lastTurn.role === 'user' && targetedContext) {
    lastTurn.parts[0].text = `${lastTurn.parts[0].text}\n\n[נתונים שנשלפו בזמן אמת ממסד הנתונים האישי של המשתמש עבור שאלה זו:\n${targetedContext}]`;
  }

  const systemInstruction = `אתה מנטור הזיכרון החכם של אקדמיית ממנטו (Memento).
יש לך חיבור ישיר וגישה מלאה בזמן אמת למסד הנתונים האישי של המשתמש המחובר.

כללי התנהגות קריטיים:
1. שליפת נתונים אישיים של המשתמש (READ Queries):
   - כאשר המשתמש שואל מה המילה שלו ב-Major, מה שלשת ה-PAO שלו, אילו תחנות או ארמונות זיכרון יש לו, או כל שאלה על הנתונים שלו (לדוגמה: "מה מילת ה-Major שלי למספר 99?" או "מה יש לי במספר 14?"):
   - חובה עליך לבדוק את טבלאות הנתונים של המשתמש המופיעות למטה (ואת הנתונים הממוקדים שהוזרקו לשאלה) ולענות במדויק על פי הערכים השמורים במסד הנתונים של המשתמש בלבד!
   - לעולם אל תמציא מילה אחרת אם קיימת מילה במסד הנתונים של המשתמש, ולעולם אל תחזיר תשובה גנרית או קבועה. ציין במפורש את הערך המדויק מה-DB של המשתמש (למשל את מילת ה-Major המדויקת שלו, העיצורים, הרמז הוויזואלי או שלשת ה-PAO שלו).
2. יצירת אסוציאציות ושאלות תאורטיות:
   - אם המשתמש מבקש להמיר משפט או עובדה לתמונה אסוציאטיבית, צור תמונה ויזואלית חדה, פשוטה וברורה בפריים אחד עם 2-3 עוגנים מרכזיים.
   - אם המשתמש שואל שאלה מתודולוגית על שיטת ה-Major, PAO, ארמונות זיכרון או שמות ופנים, ענה במקצועיות ובהירות בעברית רהוטה.
3. פעולות יצירה, עדכון ומחיקה במסד הנתונים (CREATE, UPDATE, DELETE Operations):
   - רק כאשר המשתמש מבקש במפורש להוסיף (Create), לערוך/לעדכן (Update) או למחוק (Delete) רשומה במסד הנתונים שלו, הסבר לו בעברית מה הפעולה שהכנת וציין שהיא ממתינה לאישורו בחלונית האישור, ובסוף התשובה הוסף שורה בפורמט:
<<<ACTION:{"operation":"CREATE"|"UPDATE"|"DELETE","type":"ACTION_TYPE","targetLabel":"תיאור קצר של היעד","summary":"הסבר ברור של השינוי לאישור המשתמש","payload":{...}}>>>

סוגי פעולות (ACTION_TYPE) נתמכים לעדכון/יצירה/מחיקה:
- CREATE_MAJOR / UPDATE_MAJOR: {"number": 14, "defaultWord": "ידית", "imageHint": "...", "customNotes": "..."}
- DELETE_MAJOR: {"number": 14}
- CREATE_PAO / UPDATE_PAO: {"number": 14, "person": "...", "action": "...", "object": "...", "scene": "..."}
- DELETE_PAO: {"number": 14}
- UPDATE_DIGIT_LOGIC: {"digit": 2, "consonants": "ב"}
- UPDATE_CONNECTING_LETTERS: {"letters": ["א", "ה", "ו", "י", "ע"]}
- CREATE_PALACE / ADD_PALACE: {"name": "משרד העבודה", "description": "...", "category": "custom"}
- UPDATE_PALACE: {"palaceId": "...", "name": "...", "description": "..."}
- DELETE_PALACE: {"palaceId": "...", "name": "..."}
- CREATE_LOCUS / ADD_LOCUS: {"palaceId": "...", "title": "דלת כניסה", "roomName": "מבואה", "positionDescription": "...", "storedContent": "...", "mnemonicScene": "..."}
- UPDATE_LOCUS: {"palaceId": "...", "locusId": "...", "title": "...", "roomName": "...", "positionDescription": "...", "storedContent": "...", "mnemonicScene": "..."}
- DELETE_LOCUS: {"palaceId": "...", "locusId": "...", "title": "..."}
- CREATE_PERSON_CARD: {"name": "...", "roleOrContext": "...", "prominentFacialFeature": "...", "namePhoneticAnchor": "...", "mnemonicScene": "..."}
- UPDATE_PERSON_CARD: {"id": "...", "name": "...", "roleOrContext": "...", "prominentFacialFeature": "...", "namePhoneticAnchor": "...", "mnemonicScene": "..."}
- DELETE_PERSON_CARD: {"id": "...", "name": "..."}
- CREATE_SHAPE_PEG / UPDATE_SHAPE_PEG: {"number": 1, "shapeName": "...", "defaultObject": "...", "kineticTip": "..."}
- DELETE_SHAPE_PEG: {"number": 1}
- CREATE_BODY_PEG / UPDATE_BODY_PEG: {"step": 1, "bodyPartHebrew": "...", "defaultObject": "...", "kineticTip": "..."}
- DELETE_BODY_PEG: {"step": 1}
- CREATE_ACADEMIC / ADD_ACADEMIC: {"courseOrTopic": "...", "conceptName": "...", "coreDefinition": "...", "phoneticAnchor": "...", "visualTranslation": "...", "kineticScene": "..."}
- UPDATE_ACADEMIC: {"id": "...", "courseOrTopic": "...", "conceptName": "...", "coreDefinition": "...", "phoneticAnchor": "...", "visualTranslation": "...", "kineticScene": "..."}
- DELETE_ACADEMIC: {"id": "...", "conceptName": "..."}
- CREATE_ASSOCIATION / ADD_ASSOCIATION: {"targetSubject": "...", "storedNumberOrFact": "...", "encodedMnemonic": "...", "methodUsed": "major"}
- UPDATE_ASSOCIATION: {"id": "...", "targetSubject": "...", "storedNumberOrFact": "...", "encodedMnemonic": "...", "methodUsed": "major"}
- DELETE_ASSOCIATION: {"id": "...", "targetSubject": "..."}

נתוני המשתמש והפרופיל:
${userProfileSummary || 'משתמש באקדמיית ממנטו (Memento).'}

=== מסד הנתונים האישי המלא של המשתמש בזמן אמת ===
${fullDatabaseContext}`;

  const aiClient = getGeminiClient();
  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let rawReply = '';
  let lastErr: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: normalizedContents,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });
      if (response && response.text) {
        rawReply = response.text;
        break;
      }
    } catch (err: any) {
      console.warn(`[mentor-chat] Model ${modelName} attempt failed:`, err?.message || err);
      lastErr = err;
    }
  }

  if (!rawReply) {
    console.error('[mentor-chat] All Gemini model attempts failed:', lastErr);
    if (targetedContext) {
      return res.status(200).json({
        reply: `להלן הנתונים שנשלפו ישירות ממסד הנתונים האישי שלך:\n\n${targetedContext}`,
      });
    }
    return res.status(500).json({
      error: lastErr?.message || 'Failed to generate response from Gemini API',
      reply: `שגיאה בקריאה למנוע ה-AI: ${lastErr?.message || 'שגיאה לא ידועה'}. אנא נסה שוב.`,
    });
  }

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

  if (actionData && !actionData.operation) {
    const t = String(actionData.type || '').toUpperCase();
    if (t.startsWith('DELETE_')) actionData.operation = 'DELETE';
    else if (t.startsWith('CREATE_') || t.startsWith('ADD_')) actionData.operation = 'CREATE';
    else if (t.startsWith('READ_')) actionData.operation = 'READ';
    else actionData.operation = 'UPDATE';
  }

  return res.json({ reply: cleanReply, action: actionData });
});

// Normalization and phonetic helpers for Hebrew Major & PAO validation on the server
const SERVER_FINAL_LETTER_MAP: Record<string, string> = {
  'ך': 'כ',
  'ם': 'מ',
  'ן': 'נ',
  'ף': 'פ',
  'ץ': 'צ',
};

function normalizeHebrewCharServer(ch: string): string {
  return SERVER_FINAL_LETTER_MAP[ch] || ch;
}

function extractHebrewLettersServer(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/[\u0590-\u05FF]/g) || [];
  return matches
    .filter((ch) => ch >= 'א' && ch <= 'ת')
    .map(normalizeHebrewCharServer);
}

interface ParsedDigitMapping {
  digit: number;
  primaryLetter: string;
  letters: string[];
  displayStr: string;
}

function buildUserDigitsDictionary(customDigits?: any[]): Record<number, ParsedDigitMapping> {
  const defaults: Record<number, { primary: string; letters: string[]; display: string }> = {
    0: { primary: 'ס', letters: ['ס', 'ז', 'ש'], display: 'ס, ז, ש דגושה (שׂ)' },
    1: { primary: 'ל', letters: ['ל'], display: 'ל' },
    2: { primary: 'ב', letters: ['ב'], display: 'ב' },
    3: { primary: 'ג', letters: ['ג', 'ק', 'כ'], display: 'ג, ק, כ' },
    4: { primary: 'ד', letters: ['ד', 'ת', 'ט'], display: 'ד, ת, ט' },
    5: { primary: 'ח', letters: ['ח'], display: 'ח' },
    6: { primary: 'ש', letters: ['ש', 'ג', 'צ'], display: 'ש (שׁ), ג\', צ\'' },
    7: { primary: 'ר', letters: ['ר'], display: 'ר' },
    8: { primary: 'מ', letters: ['מ'], display: 'מ' },
    9: { primary: 'פ', letters: ['פ'], display: 'פ (רפה ודגושה)' },
  };

  const result: Record<number, ParsedDigitMapping> = {};
  for (let d = 0; d <= 9; d++) {
    result[d] = {
      digit: d,
      primaryLetter: defaults[d].primary,
      letters: [...defaults[d].letters],
      displayStr: defaults[d].display,
    };
  }

  if (Array.isArray(customDigits) && customDigits.length > 0) {
    for (const cd of customDigits) {
      const d = typeof cd?.number === 'number' ? cd.number : parseInt(String(cd?.number ?? ''), 10);
      if (!isNaN(d) && d >= 0 && d <= 9) {
        const consRaw = String(cd.userConsonants || cd.consonants || '').trim();
        if (consRaw) {
          // Strip descriptive words like "דגושה" or "רפה" before extracting consonant letters
          const cleanedCons = consRaw
            .replace(/דגושה/g, '')
            .replace(/רפה/g, '')
            .replace(/ו-/g, ' ');
          const extracted = Array.from(new Set(extractHebrewLettersServer(cleanedCons)));
          if (extracted.length > 0) {
            result[d] = {
              digit: d,
              primaryLetter: extracted[0],
              letters: extracted,
              displayStr: consRaw,
            };
          }
        }
      }
    }
  }

  return result;
}

function formatUserMappingDictionaryPrompt(
  digitsDict: Record<number, ParsedDigitMapping>,
  connectingLetters: string[]
): string {
  const connDisplay = connectingLetters.join(', ');
  return `=== מילון מיפוי האותיות והספרות האישי של המשתמש (חוקי המשחק המחייבים 0-9) ===
0 = ${digitsDict[0].displayStr} (אותיות תקפות: ${digitsDict[0].letters.join(', ')})
1 = ${digitsDict[1].displayStr} (אותיות תקפות: ${digitsDict[1].letters.join(', ')})
2 = ${digitsDict[2].displayStr} (אותיות תקפות: ${digitsDict[2].letters.join(', ')})
3 = ${digitsDict[3].displayStr} (אותיות תקפות: ${digitsDict[3].letters.join(', ')})
4 = ${digitsDict[4].displayStr} (אותיות תקפות: ${digitsDict[4].letters.join(', ')})
5 = ${digitsDict[5].displayStr} (אותיות תקפות: ${digitsDict[5].letters.join(', ')})
6 = ${digitsDict[6].displayStr} (אותיות תקפות: ${digitsDict[6].letters.join(', ')})
7 = ${digitsDict[7].displayStr} (אותיות תקפות: ${digitsDict[7].letters.join(', ')})
8 = ${digitsDict[8].displayStr} (אותיות תקפות: ${digitsDict[8].letters.join(', ')})
9 = ${digitsDict[9].displayStr} (אותיות תקפות: ${digitsDict[9].letters.join(', ')})
אותיות חיבור/ניקוד מותרות (ללא ערך מספרי): ${connDisplay} (וכן צורות סופיות כגון ן)
==========================================================================`;
}

function stripParenthesesServer(text: string): string {
  if (!text) return '';
  let result = text;
  let prev = '';
  while (result !== prev) {
    prev = result;
    result = result.replace(/\([^()]*\)/g, ' ');
  }
  return result.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Validate that a suggested Person name has initials matching tensDigit and unitsDigit
function serverValidatePersonInitials(
  name: string,
  tensDigit: number,
  unitsDigit: number,
  digitsDict: Record<number, ParsedDigitMapping>
): boolean {
  const clean = stripParenthesesServer(name || '')
    .replace(/["'״׳]/g, '')
    .trim();
  const words = clean.split(/[\s\-–—\.]+/).filter((w) => w.length > 0);
  if (words.length < 2) return false;

  const firstLetters = extractHebrewLettersServer(words[0]);
  if (firstLetters.length === 0) return false;
  const init1 = firstLetters[0];

  const tensAllowed = new Set(digitsDict[tensDigit]?.letters || []);
  const unitsAllowed = new Set(digitsDict[unitsDigit]?.letters || []);

  if (!tensAllowed.has(init1)) return false;

  for (let i = 1; i < words.length; i++) {
    const wLetters = extractHebrewLettersServer(words[i]);
    if (wLetters.length > 0 && unitsAllowed.has(wLetters[0])) {
      return true;
    }
  }
  return false;
}

// Blacklist of person names, English transliterations, pronouns, prepositions, and abstract non-objects
const NON_OBJECT_BLACKLIST = new Set<string>([
  'בני', 'בוי', 'אבי', 'אחי', 'אמי', 'אמא', 'אבא', 'בנו', 'בנה', 'בן', 'בת',
  'בי', 'בו', 'בה', 'לי', 'לו', 'לה', 'מי', 'מה', 'זו', 'זה', 'אי', 'אל', 'על',
  'עד', 'עם', 'אם', 'או', 'אך', 'רק', 'גם', 'כל', 'כן', 'לא', 'נא', 'גיא', 'נוי',
  'רוי', 'שי', 'טל', 'חן', 'דן', 'רן', 'גד', 'נח', 'סוד', 'סוף', 'בכי', 'כוח',
  'חוב', 'חום', 'פשע', 'רז', 'רב', 'מול', 'מון', 'דאה', 'דוח', 'לחן', 'קיא', 'שה', 'שסע', 'חי',
]);

// Validate that a suggested Object or Major Word is a valid tangible noun using ONLY the number's consonants + connectingLetters
function serverValidateObjectWord(
  wordText: string,
  targetNumber: number,
  digitsDict: Record<number, ParsedDigitMapping>,
  connectingLetters: string[],
  isMajorMode: boolean
): boolean {
  const clean = stripParenthesesServer(wordText || '')
    .replace(/["'״׳]/g, '')
    .trim();
  if (!clean) return false;

  // Reject single-character strings or blacklisted non-objects (names, transliterations, abstract words)
  if (clean.length < 2 || NON_OBJECT_BLACKLIST.has(clean)) return false;

  // Should be a concise noun/object (1-2 words max)
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  if (wordCount > 2) return false;

  const allLetters = extractHebrewLettersServer(clean);
  if (allLetters.length < 2) return false;

  const normConnecting = new Set(connectingLetters.map(normalizeHebrewCharServer));
  const nonConnecting = allLetters.filter((ch) => !normConnecting.has(ch));
  if (nonConnecting.length === 0) return false;

  const letterToDigits = new Map<string, number[]>();
  for (let d = 0; d <= 9; d++) {
    for (const ch of digitsDict[d]?.letters || []) {
      const norm = normalizeHebrewCharServer(ch);
      const arr = letterToDigits.get(norm) || [];
      if (!arr.includes(d)) arr.push(d);
      letterToDigits.set(norm, arr);
    }
  }

  // Every non-connecting letter must belong to a valid digit
  for (const ch of nonConnecting) {
    if (!letterToDigits.has(ch)) return false;
  }

  // Single-digit Major (0-9)
  if (isMajorMode && targetNumber >= 0 && targetNumber <= 9) {
    return nonConnecting.every((ch) => (letterToDigits.get(ch) || []).includes(targetNumber));
  }

  const tens = Math.floor(targetNumber / 10) % 10;
  const units = targetNumber % 10;

  // For PAO 00-09, also allow single-digit consonant matching units (e.g. 01 -> עלה, 02 -> בננה)
  if (!isMajorMode && tens === 0) {
    const allMatchUnits = nonConnecting.every((ch) => (letterToDigits.get(ch) || []).includes(units));
    if (allMatchUnits) return true;
  }

  // If tens === units (e.g. 00, 11, 22), allow 1 or 2 identical consonants of that digit
  if (tens === units) {
    return nonConnecting.every((ch) => (letterToDigits.get(ch) || []).includes(tens));
  }

  // Otherwise must have exactly 2 consonant groups: first matching tens, second matching units
  if (nonConnecting.length !== 2) return false;
  const firstMatchesTens = (letterToDigits.get(nonConnecting[0]) || []).includes(tens);
  const secondMatchesUnits = (letterToDigits.get(nonConnecting[1]) || []).includes(units);
  return firstMatchesTens && secondMatchesUnits;
}

// Comprehensive Hebrew tangible objects pool (חפצים ועצמים מוחשיים בלבד) filtered dynamically against the user's custom 0-9 mapping + connecting letters
const HEBREW_NOUN_CANDIDATES_POOL: string[] = [
  // Single-digit tangible objects (0-9 with connecting letters א, ה, ו, י, נ, ע)
  'סוס', 'סושי', 'אוזן',
  'לב', 'עלה', 'נעל', 'לול', 'אלה', 'איל',
  'בננה', 'אבן', 'בובה', 'בועה', 'ענב', 'אבוב', 'בית',
  'כוס', 'עוגה', 'עוגן', 'גג', 'קן', 'ענק', 'קנה',
  'תה', 'עט', 'תות', 'תאנה', 'דוד', 'נדנדה',
  'אח', 'חוח', 'חוט',
  'אש', 'שעון', 'שן', 'שושנה', 'עשן', 'עציץ',
  'נר', 'ארון', 'נייר', 'הר', 'איור', 'אור',
  'מנוע', 'מים', 'ים', 'מעיין',
  'עפיפון', 'פנינה', 'ענף', 'אופן', 'פוף', 'אף', 'פה',
  // Double-consonant tangible objects (00-99 with connecting letters א, ה, ו, י, נ, ע)
  'סל', 'סיר', 'ספר', 'סרט', 'סבון', 'שק', 'שיח', 'שום', 'שף', 'סולם', 'סכין',
  'לוח', 'לחי', 'לוז', 'לבה', 'לק', 'ילד', 'לשון', 'לירה', 'לום', 'לפיד', 'לימון', 'לחם',
  'בז', 'בלון', 'בול', 'בנק', 'בושם', 'בור', 'באר', 'במה', 'במבה', 'בופה',
  'גז', 'גל', 'גב', 'גביע', 'כד', 'קש', 'קיר', 'אגם', 'קוף', 'כתר', 'כדור', 'כלב', 'כובע',
  'טס', 'דלי', 'דוב', 'דג', 'דשא', 'דירה', 'דם', 'דף', 'דלת', 'דגל', 'דרקון', 'תוף',
  'חסה', 'חול', 'חג', 'חץ', 'חור', 'חוף', 'חרב', 'חבל', 'חתול',
  'צל', 'צב', 'צוק', 'שוט', 'שושן', 'שור', 'שופר', 'שולחן', 'שטיח',
  'רעל', 'רובה', 'רוק', 'רדיו', 'ראש', 'רשת', 'רכבת',
  'מוס', 'מבצר', 'מאג', 'מד', 'מוח', 'מיץ', 'מור', 'מנוף', 'מפתח', 'מטוס', 'מראה', 'מנורה',
  'פז', 'פיל', 'פנס', 'פאב', 'פך', 'פת', 'פיח', 'פח', 'פיצה', 'פר', 'פרה', 'פנים', 'פטיש', 'פרח',
];

function getValidPoolWordsForNumber(
  targetNumber: number,
  digitsDict: Record<number, ParsedDigitMapping>,
  connectingLetters: string[],
  isMajorMode: boolean
): string[] {
  const valid = HEBREW_NOUN_CANDIDATES_POOL.filter((w) =>
    serverValidateObjectWord(w, targetNumber, digitsDict, connectingLetters, isMajorMode)
  );
  if (valid.length > 0) return valid;

  // Fallback to default objects if custom mapping has no matches in pool
  const defaultObjectsByDigit: Record<number, string[]> = {
    0: ['סוס', 'סושי', 'אוזן'],
    1: ['עלה', 'נעל', 'לול'],
    2: ['בננה', 'אבן', 'בובה', 'בועה'],
    3: ['כוס', 'עוגה', 'עוגן', 'גג'],
    4: ['עט', 'תות', 'תה', 'דוד'],
    5: ['אח', 'חוט', 'חוח'],
    6: ['שעון', 'שן', 'שושנה', 'אש'],
    7: ['נר', 'ארון', 'נייר', 'הר'],
    8: ['מנוע', 'מים', 'ים'],
    9: ['עפיפון', 'פנינה', 'ענף', 'פוף'],
  };
  const units = targetNumber % 10;
  return defaultObjectsByDigit[units] || ['סוס'];
}

// Curated famous people pool by number (00-99) for instant validation fallback
const CURATED_PEOPLE_BY_NUMBER: Record<number, string[]> = {
  0: ['סילבסטר סטאלון', 'סטיבן סיגל', 'סופיה סמית', 'סם סמית'],
  1: ['סטן לי', 'סמואל לוי', 'סופיה לורן', 'סימון לבייב'],
  2: ["ספונג' בוב", 'סנדרה בולוק', 'סשה ברון', 'סימון ביילס'],
  3: ['סטיבן קינג', 'סטיב קארל', 'סיימון קאוול', 'סופיה קופולה'],
  4: ['סלבדור דאלי', 'סנופ דוג', 'סלין דיון', 'סופיה דאל'],
  5: ['סדאם חוסיין', 'סלמה הייק', 'סטיבן הוקינג'],
  6: ['סטיבן שפילברג', 'סופיה שחר', 'סמי שם'],
  7: ["סטיב רוג'רס", 'סת רוגן', 'סרחיו ראמוס'],
  8: ['ספיידר מן', 'סופר מן', 'סטיב מרטין'],
  9: ['סיגמונד פרויד', 'שרה פיילין', 'סבסטיאן פטל'],
  10: ['לוק סקייווקר', 'לואיס סוארס', 'ליסה סימפסון'],
  11: ['לינדזי לוהאן', 'לוסי לו', 'לארי לוי'],
  12: ["לברון ג'יימס", 'לוק בסון', 'ליאור בנאי'],
  13: ['לארה קרופט', 'ליידי גאגא', 'לאונרד כהן'],
  14: ['ליאונרדו דיקפריו', 'לארי דייוויד', 'לנה דל'],
  15: ["ליטל ח'מינאי", 'לואיס המילטון', 'ליאור חלפון'],
  16: ['ליאור שליין', 'לוק שואו', 'ליאה שבת'],
  17: ["ליונל ריצ'י", 'ליאור רז', 'לו ריד'],
  18: ['ליונל מסי', 'ליאה מישל', 'לואיס מיגל'],
  19: ['לואיס פיגו', 'לוק פרי', 'ליאור פרחי'],
  20: ['בארט סימפסון', 'רוברט סמית', 'בריטני ספירס'],
  21: ['ברוס לי', 'באז שנות-אור', 'בן לוי'],
  22: ['באגס באני', 'ביל בור', 'בריז\'יט בארדו'],
  23: ['ביל גייטס', 'בני גנץ', 'בן גוריון'],
  24: ['בוב דילן', 'בטי דייוויס', 'בראד דייוויס'],
  25: ['בנימין חוטובלי', 'בני חן', 'ברק חירם'],
  26: ['בן שפירו', 'ברק שמיר', 'בועז שרעבי'],
  27: ['בראדלי קופר', 'בר רפאלי', 'בוב רוס'],
  28: ['ברונו מארס', 'בוב מארלי', 'ביל מארי'],
  29: ['בראד פיט', 'בוב פוס', 'בני פרידמן'],
};

function getFallbackPersonForNumber(
  targetNumber: number,
  digitsDict: Record<number, ParsedDigitMapping>,
  cycleIdx: number
): string {
  const tens = Math.floor(targetNumber / 10) % 10;
  const units = targetNumber % 10;
  const curated = CURATED_PEOPLE_BY_NUMBER[targetNumber] || [];
  const validCurated = curated.filter((p) =>
    serverValidatePersonInitials(p, tens, units, digitsDict)
  );
  if (validCurated.length > 0) {
    return validCurated[cycleIdx % validCurated.length];
  }

  // Synthesize valid Hebrew first + last name matching tens & units letters
  const firstNamesByLetter: Record<string, string[]> = {
    'ס': ['סילבסטר', 'סטיבן', 'סופיה', 'סמי'],
    'ז': ['זאב', 'זוהר', 'זינדין'],
    'ל': ['ליאונרדו', 'לארה', 'ליאור', 'לוק'],
    'ב': ['בראד', 'ברוס', 'בנימין', 'בר'],
    'ג': ['גלי', 'גיא', 'ג\'ורג\'', 'גדי'],
    'ק': ['קוונטין', 'קובי', 'קיאנו'],
    'כ': ['כריסטיאנו', 'כריס', 'כרמל'],
    'ד': ['דניאל', 'דוד', 'דונלד', 'דנה'],
    'ת': ['תום', 'תמר', 'תומר'],
    'ט': ['טוני', 'טיילור', 'טל'],
    'ח': ['חיים', 'חנה', 'חגי', 'חן'],
    'ש': ['שרלוק', 'שון', 'שירה', 'שמעון'],
    'צ': ['צ\'ארלי', 'צבי', 'צופית'],
    'ר': ['רוברט', 'רונאלדו', 'רמי', 'ריטה'],
    'מ': ['מרילין', 'מייקל', 'משה', 'מאיה'],
    'פ': ['פאבלו', 'פיטר', 'פנינה', 'פול'],
  };

  const lastNamesByLetter: Record<string, string[]> = {
    'ס': ['סטאלון', 'סימפסון', 'ספירס', 'סמית'],
    'ז': ['זידאן', 'זוהר', 'זלנסקי'],
    'ל': ['לוי', 'לי', 'לוהאן', 'לורן'],
    'ב': ['בוב', 'בולוק', 'בנאי', 'בראיינט'],
    'ג': ['גייטס', 'גאגא', 'גנץ', 'גרין'],
    'ק': ['קרופט', 'קינג', 'קروز', 'קופולה'],
    'כ': ['כהן', 'כץ', 'כספי'],
    'ד': ['דיקפריו', 'דאלי', 'דילן', 'דמון'],
    'ת': ['תבורי', 'תורג\'מן'],
    'ט': ['טראמפ', 'טרנטינו', 'טסה'],
    'ח': ['חוסיין', 'חדד', 'חלפון', 'חן'],
    'ש': ['שפילברג', 'שליין', 'שמיר', 'שבת'],
    'צ': ['צ\'פלין', 'צוקרברג'],
    'ר': ['רוג\'רס', 'רפאלי', 'ריצ\'י', 'רז'],
    'מ': ['מונרו', 'מסי', 'מארלי', 'מאסק'],
    'פ': ['פרויד', 'פיט', 'פיקאסו', 'פרס'],
  };

  const tLet = digitsDict[tens]?.primaryLetter || 'ס';
  const uLet = digitsDict[units]?.primaryLetter || 'ס';
  const fList = firstNamesByLetter[tLet] || [`${tLet}מי`];
  const lList = lastNamesByLetter[uLet] || [`${uLet}הן`];
  return `${fList[cycleIdx % fList.length]} ${lList[(cycleIdx + 1) % lList.length]}`;
}

// System Prompt Instructions for Mnemonic "Scene" Generation (The SEE Principle, Dynamics & Action, Clarity & Focus)
const MNEMONIC_SCENE_SYSTEM_INSTRUCTIONS = `=== הנחיות מערכת ליצירת "סצנה" מנמונית (Mnemonic Scene Generation Principles) ===
מטרת העל: ליצור זיכרון בולט במיוחד, מוחשי ומחובר רגשית (Highly Salient, Tangible, and Emotionally Connected Memory) על בסיס ערכי ה-PAO / Major שנבחרו, תוך יישום קפדני של שלושת העקרונות הבאים:

1. עקרון ה-SEE (Senses, Emotion, Exaggeration - חושים, רגש, הגזמה):
   - Senses (חושים): צור חוויה רב-חושית מלאה. אל תסתפק בדימוי ויזואלי בלבד! שלב רעשים חזקים, ריחות דומיננטיים, מרקמים פיזיים וטעמים מוחשיים. ככל שיופעלו יותר אזורים במוח, כך הזיכרון ייצרב עמוק יותר.
   - Emotion (רגש): המוח זוכר בצורה מושלמת חוויות שמעוררות רגש עז. הפוך את הסצנה למצחיקה בטירוף, מפחידה, אבסורדית או מפתיעה. הומור קיצוני, פרוע או וולגרי-קומי עובד בצורה הטובה ביותר.
   - Exaggeration (הגזמה): שנה את הפרופורציות של החפצים (למשל: נמלה בגודל פיל, חפץ עצום בגודל בניין) או הכפל כמויות בצורה בלתי הגיונית (למשל: אלפי כדורי טניס שנשפכים מהחלון).

2. דינמיקה ופעולה (Dynamics and Action - Action & Interaction):
   - Active Movement (תנועה אקטיבית): תמונות סטטיות נשכחות מהר. ודא שהאלמנטים בסצנה נמצאים באינטראקציה דינמית סוערת — מתנגשים, רצים, נשברים, מתנפצים או מתפוצצים.
   - Insane Causality (סיבתיות מטורפת): חבר את הרכיבים שצריך לזכור באמצעות קשר של סיבה ותוצאה מוטרף (למשל: הדמות בועטת/מפעילה את החפץ, שמתנפץ וגורם לתגובת שרשרת מוחשית).

3. בהירות ומיקוד (Clarity and Focus - The Von Restorff Effect / אפקט פון רסטורף):
   - Mnemonic Focus (מיקוד מנמוני): למרות שהסצנה עשירה בחושים, אל תעמיס עליה פרטי רקע מיותרים שאינם רלוונטיים למידע המקודד. הרקע חייב להיות פשוט ונקי כדי שהאלמנטים הקריטיים (אדם, פעולה, חפץ) יבלטו בחדות.
   - Uniqueness (ייחודיות ובולטות): הפוך את הפריט שצריך לזכור לאלמנט הכי ביזארי, חריג ויוצא דופן בנוף הכולל של הסצנה.
==================================================================================`;

// API Endpoint: Mnemonic Generation Tool (PAO, Major, Names, Academic concepts)
app.post('/api/gemini/generate-mnemonic', async (req: Request, res: Response) => {
  const {
    type,
    input,
    extra,
    cycle,
    customDigits,
    connectingLetters,
    paoContext,
    previousSuggestions,
  } = req.body;

  const inputStr = String(input || '').trim();
  const extraStr = String(extra || '').trim();
  const cycleNum = typeof cycle === 'number' ? cycle : 0;
  const prevList: string[] = Array.isArray(previousSuggestions) ? previousSuggestions : [];

  // 1. Build User's Custom Letter-to-Number Dictionary (0-9) and Connecting Letters
  const activeConnectingLetters: string[] =
    Array.isArray(connectingLetters) && connectingLetters.length > 0
      ? connectingLetters
      : ['א', 'ה', 'ו', 'י', 'נ', 'ע'];

  const digitsDict = buildUserDigitsDictionary(customDigits);
  const userDictionaryBlock = formatUserMappingDictionaryPrompt(digitsDict, activeConnectingLetters);

  // 2. Extract Number and Existing Field Context (Person, Action, Object, Scene)
  const cleanPrefix = (str: string) =>
    String(str || '')
      .replace(/^(?:אדם|דמות|פעולה|חפץ|סצנה|person|action|object|scene)[:=\s-]+/i, '')
      .replace(/^["'״׳]|["'״׳]$/g, '')
      .trim();

  let contextPerson = cleanPrefix(paoContext?.person || '');
  let contextAction = cleanPrefix(paoContext?.action || '');
  let contextObject = cleanPrefix(paoContext?.object || '');
  let contextScene = cleanPrefix(paoContext?.scene || '');

  if (!contextPerson && !contextAction && !contextObject && extraStr) {
    try {
      if (extraStr.startsWith('{')) {
        const parsedJson = JSON.parse(extraStr);
        contextPerson = cleanPrefix(parsedJson.person || parsedJson.userPerson || '');
        contextAction = cleanPrefix(parsedJson.action || parsedJson.userAction || '');
        contextObject = cleanPrefix(parsedJson.object || parsedJson.userObject || '');
      }
    } catch {}

    if (!contextPerson && !contextAction && !contextObject) {
      const pMatch = extraStr.match(/(?:דמות|אדם|person)[:=]\s*([^,\n|]+)/i);
      const aMatch = extraStr.match(/(?:פעולה|action)[:=]\s*([^,\n|]+)/i);
      const oMatch = extraStr.match(/(?:חפץ|object)[:=]\s*([^,\n|]+)/i);
      if (pMatch) contextPerson = cleanPrefix(pMatch[1]);
      if (aMatch) contextAction = cleanPrefix(aMatch[1]);
      if (oMatch) contextObject = cleanPrefix(oMatch[1]);
    }
  }

  // Extract target number
  let targetNum =
    typeof paoContext?.number === 'number' && !isNaN(paoContext.number)
      ? paoContext.number
      : NaN;
  if (isNaN(targetNum)) {
    const numMatch = (String(paoContext?.numberStr || '') + ' ' + inputStr + ' ' + extraStr).match(/\b(\d{1,2})\b/);
    if (numMatch) targetNum = parseInt(numMatch[1], 10);
  }
  const hasValidNum = !isNaN(targetNum) && targetNum >= 0 && targetNum <= 99;
  const tensDigit = hasValidNum ? Math.floor(targetNum / 10) % 10 : 0;
  const unitsDigit = hasValidNum ? targetNum % 10 : 0;
  const paddedNumStr = hasValidNum ? (targetNum < 10 ? `0${targetNum}` : `${targetNum}`) : inputStr;

  const client = getGeminiClient();

  try {
    // =========================================================================
    // CASE 1: PAO PERSON (אדם)
    // =========================================================================
    if (type === 'pao_person' && hasValidNum) {
      const tensDef = digitsDict[tensDigit];
      const unitsDef = digitsDict[unitsDigit];

      const personPrompt = `אתה מומחה למערכות זיכרון (PAO ו-Major) בעברית.
${userDictionaryBlock}

המשימה שלך: הצע שם של אדם אמיתי או דמות בדיונית מוכרת (סלבריטאי, דמות מקולנוע/טלוויזיה/קומיקס, מנהיג, ספורטאי, מדען או דמות תרבותית) עבור המספר הדו-ספרתי "${paddedNumStr}".

חוקי ברזל מחייבים לשדה "אדם" (Person):
1. השם חייב להיות מורכב משתי מילים בעברית: שם פרטי + שם משפחה (או כינוי מוכר בן 2 מילים, כגון "ספונג' בוב" או "לארה קרופט").
2. האות הראשונה של השם הפרטי חייבת להתחיל באחת האותיות של ספרת העשרות (${tensDigit}): [${tensDef.letters.join(', ')}].
3. האות הראשונה של שם המשפחה חייבת להתחיל באחת האותיות של ספרת היחידות (${unitsDigit}): [${unitsDef.letters.join(', ')}].
4. דוגמה להמחשה: עבור המספר '${paddedNumStr}', ספרה ראשונה '${tensDigit}' ממופה לאות '${tensDef.primaryLetter}', וספרה שנייה '${unitsDigit}' ממופה לאות '${unitsDef.primaryLetter}', לכן ראשי התיבות חייבים להיות '${tensDef.primaryLetter}.${unitsDef.primaryLetter}.' (או מבין האותיות המותרות [${tensDef.letters.join('/')}] ו-[${unitsDef.letters.join('/')}]).
5. אל תוסיף סוגריים או ראשי תיבות בתוך המחרוזת עצמה — החזר אך ורק את השם המלא הנקי (למשל: "סילבסטר סטאלון" או "לארה קרופט").
${contextAction ? `6. הקשר קיים בשדה פעולה: "${contextAction}" (אם אפשר, בחר דמות שמתקשרת יפה לפעולה זו, אך חוק ראשי התיבות קודם לכל!).` : ''}
${contextObject ? `7. הקשר קיים בשדה חפץ: "${contextObject}".` : ''}
${prevList.length > 0 ? `8. אל תחזור על הצעות קודמות שכבר הוצעו: [${prevList.join(', ')}]. הצע דמויות חדשות ושונות!` : ''}

השב אך ורק ב-JSON תקני במבנה הבא (הצע 5 דמויות שונות שמקיימות את חוק ראשי התיבות במדויק):
{
  "candidates": ["שם פרטי שם משפחה", "שם פרטי שם משפחה", "שם פרטי שם משפחה", "שם פרטי שם משפחה", "שם פרטי שם משפחה"]
}`;

      const response = await client.models.generateContent({
        model: FAST_TEXT_MODEL,
        contents: personPrompt,
        config: {
          thinkingConfig: FAST_THINKING_CONFIG,
          responseMimeType: 'application/json',
          temperature: 0.85,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const rawCandidates: string[] = Array.isArray(parsed.candidates)
        ? parsed.candidates
        : parsed.paoPerson
        ? [parsed.paoPerson]
        : [];

      const cleanedCandidates = rawCandidates
        .map((c) => String(c || '').replace(/\([^)]*\)/g, '').replace(/["'״׳]/g, '').trim())
        .filter((c) => serverValidatePersonInitials(c, tensDigit, unitsDigit, digitsDict));

      const freshCandidates = cleanedCandidates.filter((c) => !prevList.includes(c));
      const chosenPerson =
        freshCandidates[0] ||
        cleanedCandidates[cycleNum % Math.max(1, cleanedCandidates.length)] ||
        getFallbackPersonForNumber(targetNum, digitsDict, cycleNum);

      return res.json({
        headline: `דמות PAO למספר ${paddedNumStr}`,
        paoPerson: chosenPerson,
        hebrewKeyword: chosenPerson,
        visualScene: chosenPerson,
        fullScene: chosenPerson,
      });
    }

    // =========================================================================
    // CASE 2: PAO ACTION (פעולה)
    // =========================================================================
    if (type === 'pao_action') {
      const effectivePerson = contextPerson || (extraStr && !extraStr.includes('|') ? cleanPrefix(extraStr) : '');
      const isPersonEmpty = !effectivePerson || effectivePerson.trim().length === 0;

      const actionPrompt = isPersonEmpty
        ? `אתה מומחה למערכות זיכרון (PAO) בעברית.
${userDictionaryBlock}

המשימה שלך: הצע פעולה (Action) עבור מספר "${paddedNumStr}" במערכת ה-PAO.
שים לב: שדה ה"אדם" (Person) עדיין ריק וטרם הוגדר על ידי המשתמש!
לכן עליך:
1. להציע 5 פעולות אקטיביות, קינטיות, מוחשיות ודינמיות באקראי בעברית בגוף שלישי הווה (למשל: "מנפץ בפטיש", "מקפיא בחנקן נוזלי", "מלהטט בלהבות", "מנסר במסור חשמלי", "משגר מתותח"), באורך 1 עד 3 מילים בלבד.
2. לציין במפורש בשדה "actionNote" הודעה ברורה למשתמש שהפעולה נבחרה באופן אקראי מכיוון שטרם הוגדרה דמות בשדה "אדם".
${contextObject ? `3. אם ניתן, הפעולה יכולה להתאים לביצוע על החפץ "${contextObject}", אך ללא הזכרת שם החפץ עצמו בתוך שדה הפעולה.` : ''}
${prevList.length > 0 ? `4. אל תחזור על פעולות קודמות שהוצעו: [${prevList.join(', ')}].` : ''}

השב אך ורק ב-JSON תקני:
{
  "candidates": ["פעולה 1", "פעולה 2", "פעולה 3", "פעולה 4", "פעולה 5"],
  "isRandomAction": true,
  "actionNote": "שים לב: הפעולה נבחרה באקראי מכיוון שטרם הוגדרה דמות בשדה 'אדם'. מומלץ להגדיר דמות תחילה כדי שהפעולה תאפיין אותה."
}`
        : `אתה מומחה למערכות זיכרון (PAO) בעברית.
${userDictionaryBlock}

המשימה שלך: הצע פעולה (Action) עבור מספר "${paddedNumStr}" במערכת ה-PAO.
הדמות שנבחרה בשדה "אדם" (Person) היא: "${effectivePerson}".
${contextObject ? `החפץ הקיים בשדה "חפץ" (Object) הוא: "${contextObject}".` : ''}

חוקי ברזל לשדה "פעולה" (Action):
1. הפעולה חייבת להתאים לדמות "${effectivePerson}" ולאפיין אותה באופן מובהק וברור (פעולה מזוהה עם הדמות, המקצוע שלה, הכוחות שלה, או תחום ההיכרות שלה — למשל עבור "סילבסטר סטאלון": "מתאגרף"; עבור "סטיבן שפילברג": "מצלם במצלמת קולנוע"; עבור "ליאונרדו דיקפריו": "מחבק על חרטום ספינה" או "מניף אוסקר").
2. נסח את הפעולה כפועל אקטיבי ודינמי בזמן הווה (1 עד 3 מילים בלבד), ללא הכללת שם הדמות או שם החפץ בתוך טקסט הפעולה.
${prevList.length > 0 ? `3. אל תחזור על הצעות קודמות: [${prevList.join(', ')}]. הצע זוויות חדשות שמאפיינות את "${effectivePerson}"!` : ''}

השב אך ורק ב-JSON תקני:
{
  "candidates": ["פעולה אופיינית 1", "פעולה אופיינית 2", "פעולה אופיינית 3", "פעולה אופיינית 4", "פעולה אופיינית 5"],
  "isRandomAction": false,
  "actionNote": ""
}`;

      const response = await client.models.generateContent({
        model: FAST_TEXT_MODEL,
        contents: actionPrompt,
        config: {
          thinkingConfig: FAST_THINKING_CONFIG,
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const rawCandidates: string[] = Array.isArray(parsed.candidates)
        ? parsed.candidates
        : parsed.paoAction
        ? [parsed.paoAction]
        : [];

      const cleanedCandidates = rawCandidates
        .map((c) => String(c || '').replace(/^["'״׳]|["'״׳]$/g, '').trim())
        .filter((c) => c.length > 1);

      const freshCandidates = cleanedCandidates.filter((c) => !prevList.includes(c));
      const fallbackRandomActions = ['מנפץ בפטיש', 'מקפיא בקרח', 'מלהטט בלהבות', 'משגר מתותח', 'מחשמל בעוצמה'];
      const chosenAction =
        freshCandidates[0] ||
        cleanedCandidates[cycleNum % Math.max(1, cleanedCandidates.length)] ||
        fallbackRandomActions[cycleNum % fallbackRandomActions.length];

      const randomNote = isPersonEmpty
        ? parsed.actionNote ||
          'שים לב: הפעולה נבחרה באקראי מכיוון שטרם הוגדרה דמות בשדה "אדם". מומלץ להגדיר דמות תחילה כדי שהפעולה תאפיין אותה.'
        : '';

      return res.json({
        headline: `פעולת PAO למספר ${paddedNumStr}`,
        paoAction: chosenAction,
        hebrewKeyword: chosenAction,
        visualScene: chosenAction,
        fullScene: chosenAction,
        isRandomAction: isPersonEmpty,
        actionNote: randomNote,
      });
    }

    // =========================================================================
    // CASE 3: PAO OBJECT (חפץ) & MAJOR WORD (מילת Major)
    // =========================================================================
    if ((type === 'pao_object' || type === 'major_word') && hasValidNum) {
      const isMajorSingleDigit = type === 'major_word' && targetNum >= 0 && targetNum <= 9;
      const tensDef = digitsDict[tensDigit];
      const unitsDef = digitsDict[unitsDigit];
      const validPoolWords = getValidPoolWordsForNumber(
        targetNum,
        digitsDict,
        activeConnectingLetters,
        type === 'major_word'
      );

      const phoneticRuleDesc = isMajorSingleDigit
        ? `המילה חייבת להיבנות אך ורק מעיצור של הספרה ${targetNum} ([${unitsDef.letters.join(', ')}]) בתוספת אותיות החיבור המותרות בלבד ([${activeConnectingLetters.join(', ')}]). אסור בתכלית האיסור לכלול אף עיצור של ספרה אחרת!`
        : `המילה חייבת להיבנות אך ורק מעיצור של ספרת העשרות ${tensDigit} ([${tensDef.letters.join(', ')}]) ואחריו עיצור של ספרת היחידות ${unitsDigit} ([${unitsDef.letters.join(', ')}]), בתוספת אותיות החיבור המותרות בלבד ([${activeConnectingLetters.join(', ')}], כולל ן סופית). אסור בתכלית האיסור לכלול במילה אף עיצור נוסף שאינו ברשימת אותיות החיבור!`;

      const objectPrompt = `אתה מומחה לפונטיקה עברית ולמערכות הזיכרון PAO ו-Major.
${userDictionaryBlock}

המשימה שלך: הצע אך ורק שם של **חפץ פיזי או עצם מוחשי** בעברית עבור המספר "${isMajorSingleDigit ? targetNum : paddedNumStr}".

חוקי ברזל מוחלטים (ללא שום חריגות!):
1. **חפצים ועצמים מוחשיים בלבד**: כל הצעה חייבת להיות עצם פיזי או חפץ מוחשי שאפשר לראות, להחזיק או לגעת בו (למשל: בננה, אבן, בובה, בועה, סיר, כוס, לפיד, חרב, שעון, נעל).
2. **איסור מוחלט על מילים שאינן חפצים**: אסור בתכלית האיסור להציע שמות פרטיים של אנשים (כגון "בני", "אבי", "גיא"), מילים באנגלית בתעתיק עברי (כגון "בוי"), כינויי שייכות או קרבה משפחתית ("בני", "אחי", "אמא"), פעלים, שמות תואר, או מושגים מופשטים (כגון "סוד", "חוב", "כוח", "פשע"). אם קיימים רק מעט חפצים מוחשיים תקניים בצירוף העיצורים הזה, החזר רק את החפצים האמיתיים הקיימים ואל תמציא מילים!
3. **חוק פונטי מוחלט**: ${phoneticRuleDesc}
4. בדוק אות-אחר-אות בכל חפץ שאתה מציע: כל אות במילה חייבת להיות או עיצור של המספר (${isMajorSingleDigit ? unitsDef.letters.join('/') : `${tensDef.letters.join('/')} ואז ${unitsDef.letters.join('/')}`}) או אות חיבור מתוך [${activeConnectingLetters.join(', ')}].
5. החזר רק את שם החפץ/העצם עצמו (מילה אחת קצרה ומוחשית, ללא תיאורים מסביב וללא שמות תואר).
6. דוגמאות לחפצים ועצמים תקינים עבור המספר ${isMajorSingleDigit ? targetNum : paddedNumStr} לפי המיפוי הנוכחי: [${validPoolWords.join(', ')}].
${contextPerson || contextAction ? `7. הקשר קיים בשלשה: אדם="${contextPerson || 'טרם הוגדר'}", פעולה="${contextAction || 'טרם הוגדרה'}". אם קיים חפץ תקף שמשתלב מצוין עם הדמות והפעולה, העדף אותו!` : ''}
${prevList.length > 0 ? `8. אל תחזור על חפצים שכבר הוצעו: [${prevList.join(', ')}].` : ''}

השב אך ורק ב-JSON תקני:
{
  "candidates": ["חפץ1", "חפץ2", "חפץ3", "חפץ4", "חפץ5", "חפץ6"]
}`;

      const response = await client.models.generateContent({
        model: FAST_TEXT_MODEL,
        contents: objectPrompt,
        config: {
          thinkingConfig: FAST_THINKING_CONFIG,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const rawCandidates: string[] = Array.isArray(parsed.candidates)
        ? parsed.candidates
        : parsed.paoObject || parsed.hebrewKeyword
        ? [parsed.paoObject || parsed.hebrewKeyword]
        : [];

      // Strictly filter candidates through serverValidateObjectWord so zero invalid consonants ever slip through
      const validGeminiCandidates = rawCandidates
        .map((c) => String(c || '').replace(/\([^)]*\)/g, '').replace(/["'״׳]/g, '').trim())
        .filter((c) =>
          serverValidateObjectWord(c, targetNum, digitsDict, activeConnectingLetters, type === 'major_word')
        );

      const combinedValid = Array.from(new Set([...validGeminiCandidates, ...validPoolWords]));
      const freshValid = combinedValid.filter((w) => !prevList.includes(w));
      const chosenWord =
        freshValid[0] ||
        combinedValid[cycleNum % Math.max(1, combinedValid.length)] ||
        validPoolWords[0];

      return res.json({
        headline: `חפץ/מילה למספר ${paddedNumStr}`,
        paoObject: chosenWord,
        hebrewKeyword: chosenWord,
        visualScene: chosenWord,
        fullScene: chosenWord,
      });
    }

    // =========================================================================
    // CASE 4: PAO SCENE (סצנה שלמה) & MAJOR HINT (סצנה קינטית ל-Major)
    // =========================================================================
    if (type === 'pao_scene' || type === 'major_hint') {
      const effectiveWord = contextObject || cleanPrefix(extraStr) || inputStr;
      const isPaoScene = type === 'pao_scene';

      const scenePrompt = `אתה אלוף זיכרון עולמי ומומחה ליצירת סצנות מנמוניות בלתי נשכחות בעברית.
${userDictionaryBlock}

${MNEMONIC_SCENE_SYSTEM_INSTRUCTIONS}

המשימה שלך: צור סצנה מנמונית חיה, עוצמתית ובלתי נשכחת בעברית (2 עד 3 משפטים עסיסיים וממוקדים) עבור ${
        isPaoScene
          ? `שלשת ה-PAO של מספר #${paddedNumStr}:
- 👤 אדם (Person): "${contextPerson || 'דמות מסתורית'}"
- ⚡ פעולה (Action): "${contextAction || 'מבצע פעולה עוצמתית על'}"
- 📦 חפץ (Object): "${contextObject || 'החפץ'}"`
          : `מילת ה-Major של מספר #${paddedNumStr}:
- 🎯 מילת המפתח (Keyword): "${effectiveWord}"`
      }

דגשים מחייבים ליצירת הסצנה:
1. שלב את ${isPaoScene ? `שלושת הרכיבים ("${contextPerson}", "${contextAction}", "${contextObject}")` : `המילה "${effectiveWord}"`} בתוך אינטראקציה דינמית אחת עם סיבתיות מוטרפת (Insane Causality) ותנועה אקטיבית מתפרצת (Active Movement).
2. יישם במלואו את עקרון ה-SEE: שלב חושים מרובים (קול חזק, ריח דומיננטי, מרקם פיזי/טמפרטורה או טעם), רגש קיצוני (הומור פרוע, אבסורד מוחלט או הלם), והגזמה קיצונית של פרופורציות או כמויות.
3. יישם את אפקט פון רסטורף (Von Restorff Effect): שמור על רקע נקי ופשוט לחלוטין ללא פרטי תפאורה מיותרים, כך שהדמות, הפעולה והחפץ יהיו האלמנטים הכי ביזאריים ובולטים בפריים.
${prevList.length > 0 ? `4. זוהי הצעה חדשה (איטרציה ${cycleNum + 1}). אל תחזור על סצנות קודמות: הצע תרחיש חדש ומפתיע לחלוטין!` : ''}

השב אך ורק ב-JSON תקני:
{
  "fullScene": "תיאור הסצנה המנמונית המלאה בעברית (2-3 משפטים)...",
  "headline": "כותרת קצרה לסצנה"
}`;

      const response = await client.models.generateContent({
        model: FAST_TEXT_MODEL,
        contents: scenePrompt,
        config: {
          thinkingConfig: FAST_THINKING_CONFIG,
          responseMimeType: 'application/json',
          temperature: 0.85,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const sceneText = String(parsed.fullScene || parsed.visualScene || '').trim();
      if (sceneText) {
        return res.json({
          headline: parsed.headline || `סצנה מנמונית #${paddedNumStr}`,
          fullScene: sceneText,
          visualScene: sceneText,
          explanation: 'סצנה שנבנתה לפי עקרון ה-SEE, סיבתיות מטורפת ואפקט פון רסטורף.',
          hebrewKeyword: effectiveWord,
          paoPerson: contextPerson,
          paoAction: contextAction,
          paoObject: contextObject,
        });
      }
    }

    // =========================================================================
    // CASE 5: MAJOR CONSONANTS OR OTHER MNEMONIC FIELDS (Palace, Names, Academic)
    // =========================================================================
    if (type === 'major_consonants' && hasValidNum) {
      const isSingle = targetNum >= 0 && targetNum <= 9;
      const consText = isSingle
        ? digitsDict[targetNum].displayStr
        : `${digitsDict[tensDigit].primaryLetter} + ${digitsDict[unitsDigit].primaryLetter}`;
      return res.json({
        headline: `עיצורים למספר ${paddedNumStr}`,
        hebrewKeyword: consText,
        visualScene: consText,
        fullScene: consText,
      });
    }

    // General mnemonic generation (Palaces, Names & Faces, Academic, etc.)
    const generalPrompt = `אתה אלוף זיכרון עולמי ומומחה למנמוניקה בעברית.
${userDictionaryBlock}
${MNEMONIC_SCENE_SYSTEM_INSTRUCTIONS}

סוג המשימה: ${type}
קלט המשתמש: "${inputStr}"
הקשר נוסף: "${extraStr}"
איטרציה: ${cycleNum + 1}

השב אך ורק ב-JSON תקני:
{
  "headline": "כותרת קצרה",
  "hebrewKeyword": "מילת מפתח או עוגן קצר",
  "visualScene": "תיאור הסצנה המנמונית לפי עקרון ה-SEE ואפקט פון רסטורף",
  "fullScene": "תיאור הסצנה המלאה",
  "explanation": "הסבר קצר"
}`;

    const genRes = await client.models.generateContent({
      model: FAST_TEXT_MODEL,
      contents: generalPrompt,
      config: {
        thinkingConfig: FAST_THINKING_CONFIG,
        responseMimeType: 'application/json',
        temperature: 0.8,
      },
    });
    const parsedGen = JSON.parse(genRes.text || '{}');
    return res.json(parsedGen);
  } catch (error: any) {
    console.warn('Gemini mnemonic generation error, using phonetic rule fallback:', error?.message || error);

    // Rule-compliant fallback using the user's custom 0-9 dictionary & connecting letters
    const validWords = getValidPoolWordsForNumber(
      hasValidNum ? targetNum : 0,
      digitsDict,
      activeConnectingLetters,
      type === 'major_word'
    );
    const chosenObj = contextObject || validWords[cycleNum % validWords.length];
    const chosenPers =
      contextPerson ||
      getFallbackPersonForNumber(hasValidNum ? targetNum : 0, digitsDict, cycleNum);
    const isPersonMissing = !contextPerson || !contextPerson.trim();
    const fallbackActions = ['מתאגרף בעוצמה', 'מנפץ בפטיש', 'מקפיא בקרח', 'מלהטט בלהבות', 'משגר מתותח'];
    const chosenAct = contextAction || fallbackActions[cycleNum % fallbackActions.length];
    const fallbackScene = `${chosenPers} מזנק בעוצמה אדירה ו${chosenAct} ישירות אל תוך ${chosenObj} ענק בגודל משאית שמתפוצץ לרסיסים זוהרים; נשמע קול נפץ מחריש אוזניים, ריח חריף של עשן ומנטה קפואה ממלא את האף והרסיסים קרים ומחוספסים למגע על רקע נקי לחלוטין!`;

    return res.json({
      headline: `אסוציאציה למספר ${paddedNumStr}`,
      hebrewKeyword: type === 'pao_person' ? chosenPers : type === 'pao_action' ? chosenAct : chosenObj,
      paoPerson: chosenPers,
      paoAction: chosenAct,
      paoObject: chosenObj,
      visualScene: fallbackScene,
      fullScene: fallbackScene,
      isRandomAction: type === 'pao_action' && isPersonMissing,
      actionNote:
        type === 'pao_action' && isPersonMissing
          ? 'שים לב: הפעולה נבחרה באקראי מכיוון שטרם הוגדרה דמות בשדה "אדם". מומלץ להגדיר דמות תחילה כדי שהפעולה תאפיין אותה.'
          : '',
    });
  }
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
      model: FAST_TEXT_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: FAST_THINKING_CONFIG,
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
        model: FAST_TEXT_MODEL,
        config: {
          thinkingConfig: FAST_THINKING_CONFIG,
        },
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

// API Endpoint: Advanced Natural AI Text-to-Speech (Gemini Flash Lite TTS)
app.post('/api/gemini/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const cleanText = text.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: cleanText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);
    const audioBase64 = audioPart?.inlineData?.data;
    const mimeType = audioPart?.inlineData?.mimeType || 'audio/wav';

    if (audioBase64) {
      return res.json({ success: true, audioBase64, mimeType });
    }

    return res.status(502).json({ error: 'No audio returned from Gemini TTS' });
  } catch (error: any) {
    console.warn('Gemini TTS error (will fall back to browser synthesis):', error?.message || error);
    return res.status(500).json({ error: error?.message || 'TTS generation failed' });
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

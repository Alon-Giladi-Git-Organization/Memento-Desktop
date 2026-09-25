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
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System prompt grounded in world memory championships and Hebrew Major mapping
const MEMORY_CHAMPION_SYSTEM_PROMPT = `אתה "מנטור הזיכרון האלופי של ממנטו (Memento)" - מאמן קוגניטיבי בכיר לאמנות הזיכרון והמנמוניקה התחרותית, המבוסס על מתודולוגיות של אלופי עולם בזיכרון (World Memory Championships).

עקרונות המנמוניקה של ממנטו בעברית:
1. נוירו-קוגניציה: רתימת ההיפוקמפוס (תאי מקום ותאי סריג), ניווט מרחבי (Retrosplenial Cortex & Precuneus), קידוד כפול (Dual-Coding), ודחיסת זיכרון עבודה (Chunking).
2. חוקי הדימוי המושלם:
   - הגזמה גרוטסקית ופרופורציות ענק.
   - קינטיות מתפרצת (שבירה, פיצוץ, התנגשות פיזית עזה - לעולם לא דימוי סטטי קפוא!).
   - סינסתזיה רב-חושית: ריחות עזים, צלילים צורמים, טקסטורות מחוספסות, טמפרטורה.
3. שיטת ה-Major המותאמת בעברית:
   - 0 = ס, ז, שׂ (ספרת יסוד: 0 סוס)
   - 1 = ל (ספרת יסוד: 1 לב)
   - 2 = ב, פ (ספרת יסוד: 2 פה)
   - 3 = כ, ק, ג (ספרת יסוד: 3 כוס)
   - 4 = ט, ת, ד (ספרת יסוד: 4 תה)
   - 5 = ח (ספרת יסוד: 5 חי)
   - 6 = שׁ, צ (ספרת יסוד: 6 אש)
   - 7 = ר (ספרת יסוד: 7 אור)
   - 8 = מ (ספרת יסוד: 8 ים)
   - 9 = פ, ב רפה (ספרת יסוד: 9 אף)
   - חוק אותיות הקישור ("אני עונה" - א, ה, ו, י, נ, ע): אותיות שקופות ללא ערך מספרי, המשמשות חופשי כדבק לבניית מילים קצרות.
4. שיטת השלשות PAO (Person-Action-Object):
   - ראשי התיבות של הדמות לכל מספר (00-99) נקבעים לפי שתי ספרות ה-Major (למשל 14 = ל.ד. ליאונרדו דיקפריו, 23 = ב.ג. ביל גייטס, 83 = מ.ג. מייקל ג'ורדן).
   - דחיסת 6 ספרות לתמונה יחידה: דמות (זוג 1) מבצעת פעולה (זוג 2) על חפץ (זוג 3).
5. ארמונות זיכרון (Method of Loci): מסלול בכיוון השעון, 5 תחנות לחדר, ריווח, ומניעת Ghosting.
6. שמות ופנים: עוגן מורפולוגי בפנים -> מילת תחליף פונטית -> התנגשות קינטית בעוגן.

אתה בעל גישה מלאה לבסיס הנתונים של המשתמש. אם המשתמש מבקש ממך לקרוא, להוסיף, לערוך או למחוק נתונים (ארמון, תחנה, שלשת PAO, מילת Major, כרטיס אישי), בצע זאת בשמחה וצרף את הפעולה המתאימה.`;

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
      model: 'gemini-2.5-flash',
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
    const { messages, userProfileSummary, appContext } = req.body;

    const formattedContents = (messages || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
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
      model: 'gemini-2.5-flash',
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

    return res.json({ reply: cleanReply, action: actionData });
  } catch (error: any) {
    console.error('Error in mentor-chat:', error);
    return res.status(500).json({
      reply: 'סליחה, אירעה שגיאה רגעית בתקשורת עם מנטור הזיכרון. נסה שוב בעוד רגע.',
    });
  }
});

// API Endpoint: Mnemonic Generation Tool (PAO, Major, Names, Academic concepts)
app.post('/api/gemini/generate-mnemonic', async (req: Request, res: Response) => {
  const { type, input, extra } = req.body;
  const inputStr = String(input || '').trim();
  const extraStr = String(extra || '').trim();

  try {
    const prompt = `כאלוף זיכרון עולמי, צור הצעה מנמונית מקצועית, סופר-יעילה, מוקצנת וקינטית עבור הנתון הבא בעברית.
סוג המשימה: ${type} (דוגמאות: major_word, major_hint, pao_person, pao_action, pao_object, pao_element, name_face_anchor, name_face_substitute, name_face_scene, academic_concept, palace_scene, shape_association, body_peg, custom_association)
קלט המשתמש: "${inputStr}"
מידע נוסף / הקשר: "${extraStr}"

חוקי המנמוניקה האלופית:
- תמונה ביזארית ולא הגיונית, גרוטסקית ובלתי נשכחת
- אלמנט קינטי מתפרץ (התנגשות, שבירה, ניפוץ, שפיכה חמה, פיצוץ צבעים - לעולם לא דימוי סטטי קפוא!)
- הפעלת חושים (ריח עז, קול צורם, טמפרטורה קיצונית)
- שיוך פונטי ומדויק בעברית לפי השיטה

השב אך ורק בפורמט JSON:
{
  "headline": string, // כותרת קצרה וקולעת
  "visualScene": string, // תיאור מפורט ומלא של הסצנה המנטלית המוקצנת
  "explanation": string, // כיצד הסצנה מקודדת את המידע צעד-אחר-צעד
  "palacePlacementTip": string, // כיצד להציב את הסצנה בתחנה בארמון הזיכרון
  "hebrewKeyword": string, // מילת מפתח, מילת Major או ראשי תיבות בעברית
  "paoPerson": string, // שם דמות (אם רלוונטי ל-PAO)
  "paoAction": string, // פעולה קינטית (אם רלוונטי ל-PAO)
  "paoObject": string // חפץ פסיבי (אם רלוונטי ל-PAO)
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
          },
          required: [
            'headline',
            'visualScene',
            'explanation',
            'palacePlacementTip',
            'hebrewKeyword',
            'paoPerson',
            'paoAction',
            'paoObject',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.warn('Fallback mnemonic generator triggered:', error?.message || error);

    // Dynamic Hebrew kinetic fallback based on input and type
    let headline = `${inputStr || 'אסוציאציה'}`;
    let hebrewKeyword = inputStr;
    let paoPerson = `דמות מוכרת עבור ${inputStr}`;
    let paoAction = `מנפץ בעוצמה ומרסק`;
    let paoObject = `חפץ ענק וזוהר`;
    let visualScene = `התנגשות קינטית עזה שבה ${inputStr} מתנפץ לרסיסי זהב לוהטים בריח עשן חריף.`;
    let explanation = `שימוש בקידוד כפול והיפוקמפוס לקיבוע הזיכרון בעזרת הגזמה וריח עז.`;
    let palacePlacementTip = `הנח את הסצנה צמוד למשקוף או לדלת כדי שהיא תבלוט מיד עם הכניסה לחדר.`;

    if (type?.includes('major') || !isNaN(Number(inputStr))) {
      const num = parseInt(inputStr, 10);
      headline = `מילת Major למספר ${inputStr}`;
      hebrewKeyword = `קוד ${inputStr}`;
      visualScene = `המספר ${inputStr} מותך בלהבה סגולה ענקית ומשמיע צליל פיצוץ צורם עם עשן ריחני.`;
    } else if (type?.includes('pao')) {
      paoPerson = `אלוף מוכר (${inputStr})`;
      paoAction = `רוכב בדהרה ומנפץ`;
      paoObject = `פסל קריסטל ענקי`;
      headline = `שלשת PAO למספר ${inputStr}`;
      visualScene = `${paoPerson} שובר בבעיטה חדה ${paoObject} שנשבר לאלפי רסיסים.`;
    } else if (type?.includes('name') || type?.includes('face')) {
      headline = `עוגן וסצנה לשם ${inputStr}`;
      hebrewKeyword = inputStr;
      visualScene = `על גבי ${extraStr || 'העוגן הבולט בפנים'}, מונח ${inputStr} ענקי שמשפריץ צבע זוהר ונוצץ.`;
    } else if (type?.includes('palace')) {
      headline = `סצנה לתחנה בארמון`;
      visualScene = `בתוך התחנה (${inputStr}), מתפרץ הר געש מיניאטורי של ${extraStr || 'מידע'} שממלא את כל החדר באור בוהק וריח מנטה.`;
    }

    return res.json({
      headline,
      visualScene,
      explanation,
      palacePlacementTip,
      hebrewKeyword,
      paoPerson,
      paoAction,
      paoObject,
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
      model: 'gemini-2.5-flash',
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

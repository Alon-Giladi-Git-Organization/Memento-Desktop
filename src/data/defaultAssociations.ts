import {
  MajorItem,
  PAOItem,
  PegShapeItem,
  BodyPegItem,
  MemoryPalace,
  PersonFaceCard,
  AbstractShapeCard,
  PersonalContactAssociation,
  AcademicKeyPoint,
} from '../types/memory';

// Hebrew Major System Consonants Map (ערכת המשתמש המותאמת אישית):
// 0: ס, ז, שׂ (שמאלית)
// 1: ל
// 2: ב, פ (דגושה)
// 3: ג, ק, כ
// 4: ד, ת, ט
// 5: ח, ה, ע
// 6: שׁ, צ
// 7: ז, ס (צליל ז/ס)
// 8: ח, כ (גרוניות/חיכיות ח/כ)
// 9: פ (רפה), ב (רפה), ו

export const DEFAULT_MAJOR_DIGITS: MajorItem[] = [
  { number: 0, numberStr: '0', consonants: 'ס, ז, שׂ', defaultWord: 'סוס', imageHint: 'סוס לבן דוהר ורוקע בפרסות' },
  { number: 1, numberStr: '1', consonants: 'ל', defaultWord: 'לב', imageHint: 'לב ענק פועם באדום זוהר' },
  { number: 2, numberStr: '2', consonants: 'ב, פ (דגושה)', defaultWord: 'פה', imageHint: 'פה ענקי פעור עם שיני זהב' },
  { number: 3, numberStr: '3', consonants: 'כ, ק, ג', defaultWord: 'כוס', imageHint: 'כוס זכוכית מתנפצת לרסיסים' },
  { number: 4, numberStr: '4', consonants: 'ט, ת, ד', defaultWord: 'תה', imageHint: 'ספל תה רותח שמעלה אדים' },
  { number: 5, numberStr: '5', consonants: 'ח', defaultWord: 'חי', imageHint: 'שרשרת ח"י ענקית מזהב' },
  { number: 6, numberStr: '6', consonants: 'שׁ, צ\', ג\'', defaultWord: 'אש', imageHint: 'להבות אש מתפרצות ומפצפצות' },
  { number: 7, numberStr: '7', consonants: 'ר', defaultWord: 'אור', imageHint: 'פנס זרקור מסנוור בעוצמה' },
  { number: 8, numberStr: '8', consonants: 'מ', defaultWord: 'ים', imageHint: 'גלי ים ענקיים מתנפצים' },
  { number: 9, numberStr: '9', consonants: 'פ, ב (רפה)', defaultWord: 'אף', imageHint: 'אף פינוקיו שצומח ומשפד בלון' },
];

// Complete 00-99 Hebrew Major System (לפי מיפוי העיצורים החדש)
export const DEFAULT_MAJOR_00_99: MajorItem[] = [
  { number: 0, numberStr: '0', consonants: 'ס, ז, שׂ', defaultWord: 'סוס', imageHint: 'סוס לבן דוהר ורוקע בפרסות' },
  { number: 1, numberStr: '1', consonants: 'ל', defaultWord: 'לב', imageHint: 'לב ענק פועם באדום זוהר' },
  { number: 2, numberStr: '2', consonants: 'ב, פ (דגושה)', defaultWord: 'פה', imageHint: 'פה ענקי פעור עם שיני זהב' },
  { number: 3, numberStr: '3', consonants: 'כ, ק, ג', defaultWord: 'כוס', imageHint: 'כוס זכוכית מתנפצת לרסיסים' },
  { number: 4, numberStr: '4', consonants: 'ט, ת, ד', defaultWord: 'תה', imageHint: 'ספל תה רותח שמעלה אדים' },
  { number: 5, numberStr: '5', consonants: 'ח', defaultWord: 'חי', imageHint: 'שרשרת ח"י ענקית מזהב' },
  { number: 6, numberStr: '6', consonants: 'שׁ, צ\', ג\'', defaultWord: 'אש', imageHint: 'להבות אש מתפרצות ומפצפצות' },
  { number: 7, numberStr: '7', consonants: 'ר', defaultWord: 'אור', imageHint: 'פנס זרקור מסנוור בעוצמה' },
  { number: 8, numberStr: '8', consonants: 'מ', defaultWord: 'ים', imageHint: 'גלי ים ענקיים מתנפצים' },
  { number: 9, numberStr: '9', consonants: 'פ, ב (רפה)', defaultWord: 'אף', imageHint: 'אף פינוקיו שצומח ומשפד בלון' },

  // עשור 10-19 (ספרת עשרות 1: ל)
  { number: 10, numberStr: '10', consonants: 'ל + ס/ז', defaultWord: 'לוז', imageHint: 'אגוז לוז עגול שמתפצח בפטיש' },
  { number: 11, numberStr: '11', consonants: 'ל + ל', defaultWord: 'לול', imageHint: 'לול תרנגולות מקרקרות שמטילות ביצים' },
  { number: 12, numberStr: '12', consonants: 'ל + ב/פ', defaultWord: 'לבה', imageHint: 'לבה רותחת שפורצת מהר געש' },
  { number: 13, numberStr: '13', consonants: 'ל + כ/ק/ג', defaultWord: 'לק', imageHint: 'בקבוק לק ציפורניים אדום ובוהק' },
  { number: 14, numberStr: '14', consonants: 'ל + ט/ת/ד', defaultWord: 'ילד', imageHint: 'ילד קטן רץ ומעיף עפיפון זוהר' },
  { number: 15, numberStr: '15', consonants: 'ל + ח', defaultWord: 'לוח', imageHint: 'לוח עץ ענק שנשבר לשניים' },
  { number: 16, numberStr: '16', consonants: 'ל + שׁ/צ', defaultWord: 'לשון', imageHint: 'לשון ענקית ורודה שמתגלגלת החוצה' },
  { number: 17, numberStr: '17', consonants: 'ל + ר', defaultWord: 'לירה', imageHint: 'מטבע לירה מזהב נוצץ שמסתובב מהר' },
  { number: 18, numberStr: '18', consonants: 'ל + מ', defaultWord: 'לום', imageHint: 'לום ברזל כבד שמפרק ארגז עץ ברעש' },
  { number: 19, numberStr: '19', consonants: 'ל + פ/ב רפה', defaultWord: 'לוף', imageHint: 'קופסת שימורי לוף שנפתחת בסכין' },

  // עשור 20-29 (ספרת עשרות 2: ב/פ דגושה)
  { number: 20, numberStr: '20', consonants: 'ב/פ + ס/ז', defaultWord: 'בז', imageHint: 'בז צייד מהיר שצולל מהשמיים' },
  { number: 21, numberStr: '21', consonants: 'ב/פ + ל', defaultWord: 'בול', imageHint: 'בול דואר זוהר עם ציור כתר' },
  { number: 22, numberStr: '22', consonants: 'ב/פ + ב/פ', defaultWord: 'בובה', imageHint: 'בובת חרסינה עתיקה עם עיניים שזזות' },
  { number: 23, numberStr: '23', consonants: 'ב/פ + כ/ק/ג', defaultWord: 'בנק', imageHint: 'כספת בנק ענקית שנפתחת ומגלה מטילי זהב' },
  { number: 24, numberStr: '24', consonants: 'ב/פ + ט/ת/ד', defaultWord: 'בד', imageHint: 'בד משי אדום מתנפנף ברוח סוערת' },
  { number: 25, numberStr: '25', consonants: 'ב/פ + ח', defaultWord: 'פח', imageHint: 'פח אשפה ממתכת שרועם בחבטה' },
  { number: 26, numberStr: '26', consonants: 'ב/פ + שׁ/צ', defaultWord: 'בוץ', imageHint: 'מגפיים ששוקעים עמוק בתוך בוץ סמיך' },
  { number: 27, numberStr: '27', consonants: 'ב/פ + ר', defaultWord: 'בור', imageHint: 'בור עמוק ואפל באדמה עם הד חוזר' },
  { number: 28, numberStr: '28', consonants: 'ב/פ + מ', defaultWord: 'במה', imageHint: 'במת תיאטרון גדולה עם אור זרקורים' },
  { number: 29, numberStr: '29', consonants: 'ב/פ + פ/ב רפה', defaultWord: 'פוף', imageHint: 'כרית פוף ענקית שצוללים לתוכה בנוחות' },

  // עשור 30-39 (ספרת עשרות 3: כ/ק/ג)
  { number: 30, numberStr: '30', consonants: 'כ/ק/ג + ס/ז', defaultWord: 'גז', imageHint: 'להבת גז כחולה שדולקת בעוצמה' },
  { number: 31, numberStr: '31', consonants: 'כ/ק/ג + ל', defaultWord: 'גל', imageHint: 'גל ים ענק שמתרומם ונשבר ברעש' },
  { number: 32, numberStr: '32', consonants: 'כ/ק/ג + ב/פ', defaultWord: 'גב', imageHint: 'גב של גורילה ענקית ושרירית' },
  { number: 33, numberStr: '33', consonants: 'כ/ק/ג + כ/ק/ג', defaultWord: 'גג', imageHint: 'גג רעפים אדום שממנו משקיפים לנוף' },
  { number: 34, numberStr: '34', consonants: 'כ/ק/ג + ט/ת/ד', defaultWord: 'כד', imageHint: 'כד חרס עתיק מלא במטבעות זהב' },
  { number: 35, numberStr: '35', consonants: 'כ/ק/ג + ח', defaultWord: 'כוח', imageHint: 'שרירן ענקי שמניף משקולת ברזל' },
  { number: 36, numberStr: '36', consonants: 'כ/ק/ג + שׁ/צ', defaultWord: 'קש', imageHint: 'ערימת קש זהובה שממנה מציץ אפרוח' },
  { number: 37, numberStr: '37', consonants: 'כ/ק/ג + ר', defaultWord: 'קיר', imageHint: 'קיר לבנים גבוה שמטפסים עליו בסולם' },
  { number: 38, numberStr: '38', consonants: 'כ/ק/ג + מ', defaultWord: 'אגם', imageHint: 'אגם מים צלול ורגוע עם ברבורים' },
  { number: 39, numberStr: '39', consonants: 'כ/ק/ג + פ/ב רפה', defaultWord: 'קוף', imageHint: 'קוף שובב שקופץ בין ענפי עצים' },

  // עשור 40-49 (ספרת עשרות 4: ט/ת/ד)
  { number: 40, numberStr: '40', consonants: 'ט/ת/ד + ס/ז', defaultWord: 'טס', imageHint: 'מטוס סילון שטס במהירות שיא בשמיים' },
  { number: 41, numberStr: '41', consonants: 'ט/ת/ד + ל', defaultWord: 'דלי', imageHint: 'דלי מים מלא שנשפך ומשפריץ' },
  { number: 42, numberStr: '42', consonants: 'ט/ת/ד + ב/פ', defaultWord: 'דוב', imageHint: 'דוב חום ענקי שצועד ביער' },
  { number: 43, numberStr: '43', consonants: 'ט/ת/ד + כ/ק/ג', defaultWord: 'דג', imageHint: 'דג זהב קופץ מתוך המים בניתור' },
  { number: 44, numberStr: '44', consonants: 'ט/ת/ד + ט/ת/ד', defaultWord: 'דוד', imageHint: 'דוד שמש מתכת שרותח ומעלה קיטור' },
  { number: 45, numberStr: '45', consonants: 'ט/ת/ד + ח', defaultWord: 'דוח', imageHint: 'דו"ח תנועה לבן שמתעופף ברוח' },
  { number: 46, numberStr: '46', consonants: 'ט/ת/ד + שׁ/צ', defaultWord: 'דשא', imageHint: 'מדשאה ירוקה שקוצצים אותה במכסחת' },
  { number: 47, numberStr: '47', consonants: 'ט/ת/ד + ר', defaultWord: 'דירה', imageHint: 'דירה מרווחת עם מרפסת שמש לנוף' },
  { number: 48, numberStr: '48', consonants: 'ט/ת/ד + מ', defaultWord: 'דם', imageHint: 'טיפת דם אדומה תחת מיקרוסקופ' },
  { number: 49, numberStr: '49', consonants: 'ט/ת/ד + פ/ב רפה', defaultWord: 'דף', imageHint: 'דף נייר לבן שמתקפל לאווירון' },

  // עשור 50-59 (ספרת עשרות 5: ח)
  { number: 50, numberStr: '50', consonants: 'ח + ס/ז', defaultWord: 'חסה', imageHint: 'ראש חסה ירוק ורענן שנשטף במים' },
  { number: 51, numberStr: '51', consonants: 'ח + ל', defaultWord: 'חול', imageHint: 'גרגרי חול זהובים שנושרים בשעון חול' },
  { number: 52, numberStr: '52', consonants: 'ח + ב/פ', defaultWord: 'חיבה', imageHint: 'שני גורי כלבים שמפגינים חיבה' },
  { number: 53, numberStr: '53', consonants: 'ח + כ/ק/ג', defaultWord: 'חג', imageHint: 'שולחן חג חגיגי עמוס מטעמים ונרות' },
  { number: 54, numberStr: '54', consonants: 'ח + ט/ת/ד', defaultWord: 'חוט', imageHint: 'סליל חוט אדום שנפרם ומתגלגל' },
  { number: 55, numberStr: '55', consonants: 'ח + ח', defaultWord: 'חוח', imageHint: 'שיח חוח וקוצים דוקרני בשדה' },
  { number: 56, numberStr: '56', consonants: 'ח + שׁ/צ', defaultWord: 'חץ', imageHint: 'חץ קשת שנורה ישר למרכז המטרה' },
  { number: 57, numberStr: '57', consonants: 'ח + ר', defaultWord: 'חור', imageHint: 'חור מנעול עתיק שמציצים דרכו' },
  { number: 58, numberStr: '58', consonants: 'ח + מ', defaultWord: 'חום', imageHint: 'מדחום כספית שמודד חום לוהט' },
  { number: 59, numberStr: '59', consonants: 'ח + פ/ב רפה', defaultWord: 'חוף', imageHint: 'חוף ים חולי עם שמשיות וצדפים' },

  // עשור 60-69 (ספרת עשרות 6: שׁ/צ)
  { number: 60, numberStr: '60', consonants: 'שׁ/צ + ס/ז', defaultWord: 'שסע', imageHint: 'שסע עמוק באדמה שנפער ברעידת אדמה' },
  { number: 61, numberStr: '61', consonants: 'שׁ/צ + ל', defaultWord: 'צל', imageHint: 'צל שחור ענקי שמטיל עץ בשמש' },
  { number: 62, numberStr: '62', consonants: 'שׁ/צ + ב/פ', defaultWord: 'צב', imageHint: 'צב משוריין עם שריון ירוק' },
  { number: 63, numberStr: '63', consonants: 'שׁ/צ + כ/ק/ג', defaultWord: 'צוק', imageHint: 'צוק סלע גבוה שמשקיף על הים' },
  { number: 64, numberStr: '64', consonants: 'שׁ/צ + ט/ת/ד', defaultWord: 'שוט', imageHint: 'שוט עור שמצליף באוויר בקול נפץ' },
  { number: 65, numberStr: '65', consonants: 'שׁ/צ + ח', defaultWord: 'שיח', imageHint: 'שיח ירוק עמוס פרחים ריחניים' },
  { number: 66, numberStr: '66', consonants: 'שׁ/צ + שׁ/צ', defaultWord: 'שושן', imageHint: 'פרח שושן צחור שמפיץ ריח מתוק' },
  { number: 67, numberStr: '67', consonants: 'שׁ/צ + ר', defaultWord: 'שור', imageHint: 'שור זועם עם קרניים חדות שרוקע ברגליו' },
  { number: 68, numberStr: '68', consonants: 'שׁ/צ + מ', defaultWord: 'שום', imageHint: 'ראש שום שלם שמתפצח לשיניים ריחניות' },
  { number: 69, numberStr: '69', consonants: 'שׁ/צ + פ/ב רפה', defaultWord: 'שף', imageHint: 'שף עם כובע טבחים גבוה שטועם ממרק' },

  // עשור 70-79 (ספרת עשרות 7: ר)
  { number: 70, numberStr: '70', consonants: 'ר + ס/ז', defaultWord: 'רז', imageHint: 'מגילת רזים עתיקה שנפתחת וזוהרת' },
  { number: 71, numberStr: '71', consonants: 'ר + ל', defaultWord: 'רעל', imageHint: 'בקבוקון רעל ירוק עם ציור גולגולת' },
  { number: 72, numberStr: '72', consonants: 'ר + ב/פ', defaultWord: 'רב', imageHint: 'רב קשיש עם זקן לבן וספר תורה' },
  { number: 73, numberStr: '73', consonants: 'ר + כ/ק/ג', defaultWord: 'רוק', imageHint: 'גיטרת רוק חשמלית שמתפוצצת בסולו' },
  { number: 74, numberStr: '74', consonants: 'ר + ט/ת/ד', defaultWord: 'רדיו', imageHint: 'מכשיר רדיו ישן שמשמיע מוזיקה חזקה' },
  { number: 75, numberStr: '75', consonants: 'ר + ח', defaultWord: 'רוח', imageHint: 'משב רוח עז שמעיף עלים ומטריות' },
  { number: 76, numberStr: '76', consonants: 'ר + שׁ/צ', defaultWord: 'ראש', imageHint: 'ראש פסל שיש ענקי עם כתר זהב' },
  { number: 77, numberStr: '77', consonants: 'ר + ר', defaultWord: 'ריר', imageHint: 'טיפת ריר של חילזון זוהרת על עלה' },
  { number: 78, numberStr: '78', consonants: 'ר + מ', defaultWord: 'רעם', imageHint: 'ברק ורעם אדיר שמרעידים את השמיים' },
  { number: 79, numberStr: '79', consonants: 'ר + פ/ב רפה', defaultWord: 'רף', imageHint: 'מדף עץ שנשבר מכובד ספרים' },

  // עשור 80-89 (ספרת עשרות 8: מ)
  { number: 80, numberStr: '80', consonants: 'מ + ס/ז', defaultWord: 'מוס', imageHint: 'גביע מוס שוקולד אוורירי עם דובדבן' },
  { number: 81, numberStr: '81', consonants: 'מ + ל', defaultWord: 'מול', imageHint: 'קניון ענק ומואר עם חנויות זוהרות' },
  { number: 82, numberStr: '82', consonants: 'מ + ב/פ', defaultWord: 'מפה', imageHint: 'מפת אוצר ישנה שנפרשת על שולחן' },
  { number: 83, numberStr: '83', consonants: 'מ + כ/ק/ג', defaultWord: 'מאג', imageHint: 'מאג קפה ענקי ומעלה אדים' },
  { number: 84, numberStr: '84', consonants: 'מ + ט/ת/ד', defaultWord: 'מד', imageHint: 'מד מהירות ברכב שמחוגו מזנק לאדום' },
  { number: 85, numberStr: '85', consonants: 'מ + ח', defaultWord: 'מוח', imageHint: 'מוח אנושי זוהר בניצוצות חשמליים' },
  { number: 86, numberStr: '86', consonants: 'מ + שׁ/צ', defaultWord: 'מיץ', imageHint: 'כוס מיץ תפוזים עסיסית עם קשית' },
  { number: 87, numberStr: '87', consonants: 'מ + ר', defaultWord: 'מור', imageHint: 'שמן מור יקר וריחני בבקבוקון זכוכית' },
  { number: 88, numberStr: '88', consonants: 'מ + מ', defaultWord: 'מים', imageHint: 'מפל מים שוצף וקריר שניתז לכל עבר' },
  { number: 89, numberStr: '89', consonants: 'מ + פ/ב רפה', defaultWord: 'מנוף', imageHint: 'מנוף בנייה צהוב ענק שמרים קורת פלדה' },

  // עשור 90-99 (ספרת עשרות 9: פ/ב רפה)
  { number: 90, numberStr: '90', consonants: 'פ/ב רפה + ס/ז', defaultWord: 'פז', imageHint: 'מטיל פז מוזהב שנוצץ בשמש' },
  { number: 91, numberStr: '91', consonants: 'פ/ב רפה + ל', defaultWord: 'פיל', imageHint: 'פיל אפריקאי ענק שמרים חדק ותוקע' },
  { number: 92, numberStr: '92', consonants: 'פ/ב רפה + ב/פ דגושה', defaultWord: 'פאב', imageHint: 'פאב הומה אדם עם כוסות בירה מוקצפות' },
  { number: 93, numberStr: '93', consonants: 'פ/ב רפה + כ/ק/ג', defaultWord: 'פך', imageHint: 'פך שמן קטן מזהב שמטפטף שמן זך' },
  { number: 94, numberStr: '94', consonants: 'פ/ב רפה + ט/ת/ד', defaultWord: 'פת', imageHint: 'פת לחם טרייה וחמה שנבצעת' },
  { number: 95, numberStr: '95', consonants: 'פ/ב רפה + ח', defaultWord: 'פיח', imageHint: 'פיח שחור סמיך שיוצא מארובת עשן' },
  { number: 96, numberStr: '96', consonants: 'פ/ב רפה + שׁ/צ', defaultWord: 'פשע', imageHint: 'זירת בילוש וסרט פשע עם זכוכית מגדלת' },
  { number: 97, numberStr: '97', consonants: 'פ/ב רפה + ר', defaultWord: 'פר', imageHint: 'פר שחור וחזק שרוקע בפרסותיו' },
  { number: 98, numberStr: '98', consonants: 'פ/ב רפה + מ', defaultWord: 'פנים', imageHint: 'פנים מאירות עם חיוך רחב ועיניים טובות' },
  { number: 99, numberStr: '99', consonants: 'פ/ב רפה + פ/ב רפה', defaultWord: 'פוף', imageHint: 'כרית פוף ענקית שצוללים לתוכה ברכות' },
];

// PAO (Person-Action-Object) System (00-99 מלא לפי ראשי תיבות של שיטת ה-Major):
export const DEFAULT_PAO_ITEMS: PAOItem[] = [
  { number: 0, numberStr: '00', person: 'סילבסטר סטאלון (ס.ס.)', action: 'מניף כפפות אגרוף וצועק מעל', object: 'כפפות אגרוף אדומות מזהב' },
  { number: 1, numberStr: '01', person: 'סטן לי (ס.ל.)', action: 'רושם חוברת קומיקס צבעונית עבור', object: 'חוברת מארוול נדירה' },
  { number: 2, numberStr: '02', person: 'סשה ברון כהן (ס.ב.)', action: 'מתחפש בחליפה ירוקה זוהרת ורוקד מול', object: 'משקפי שמש צהובים ענקיים' },
  { number: 3, numberStr: '03', person: 'סטיבן קינג (ס.ק.)', action: 'מקליד ספר אימה על', object: 'מכונת כתיבה שמעלה עשן' },
  { number: 4, numberStr: '04', person: 'סלבדור דאלי (ס.ד.)', action: 'ממיס שעון קיר רך על ענף של', object: 'שעון קיר נמס ונוזל' },
  { number: 5, numberStr: '05', person: 'סטיבן הוקינג (ס.ח.)', action: 'סורק חור שחור בחלל מתוך', object: 'כיסא גלגלים ממוחשב זוהר' },
  { number: 6, numberStr: '06', person: 'סטיבן שפילברג (ס.ש.)', action: 'מכוון מצלמת קולנוע ענקית לעבר', object: 'מצלמת קולנוע זהובה' },
  { number: 7, numberStr: '07', person: 'סטיב רוג\'רס (ס.ר.)', action: 'מטיל מגן ויברניום זוהר על', object: 'מגן כוכב בלתי שביר' },
  { number: 8, numberStr: '08', person: 'ספיידרמן (ס.מ.)', action: 'יורה קורי עכביש דביקים מעל', object: 'קורי עכביש זוהרים בניאון' },
  { number: 9, numberStr: '09', person: 'סיגמונד פרויד (ס.פ.)', action: 'מהפנט ורושם חלומות ליד', object: 'ספת עור של פסיכואנליזה' },

  { number: 10, numberStr: '10', person: 'לואי סוארס (ל.ס.)', action: 'נוגח כדורגל בסיבוב אדיר לתוך', object: 'כדורגל מעור בוער' },
  { number: 11, numberStr: '11', person: 'לואי לבואזיה (ל.ל.)', action: 'מערבב חומצה זרחתית בתוך', object: 'מבחנת זכוכית מבעבעת' },
  { number: 12, numberStr: '12', person: 'לברון ג\'יימס (ל.ב.)', action: 'מזנק ורומס בהטבעה אדירה לתוך', object: 'גופיית כדורסל צהובה' },
  { number: 13, numberStr: '13', person: 'לארי קינג (ל.ק.)', action: 'מתאים שלייקס ומדבר בלהט לתוך', object: 'מיקרופון רדיו עתיק' },
  { number: 14, numberStr: '14', person: 'ליאונרדו דיקפריו (ל.ד.)', action: 'פורש ידיים בחרטום של', object: 'חרטום ספינת טיטאניק מוזהב' },
  { number: 15, numberStr: '15', person: 'לואיס המילטון (ל.ח.)', action: 'דוהר ברכב מרוץ ומתיז גיצים על', object: 'קסדת פורמולה 1 נוצצת' },
  { number: 16, numberStr: '16', person: 'לוסי שרף (ל.ש.)', action: 'מנגנת סולו מהיר על', object: 'כינור עץ עתיק שפולט לייזרים' },
  { number: 17, numberStr: '17', person: 'ליונל ריצ\'י (ל.ר.)', action: 'שר ומנגן סרנדה מעל', object: 'פסנתר כנף לבן שמרחף' },
  { number: 18, numberStr: '18', person: 'ליונל מסי (ל.מ.)', action: 'מכדרר ומקפיץ באמנות מעל', object: 'גביע עולם מזהב טהור' },
  { number: 19, numberStr: '19', person: 'לואי פסטר (ל.פ.)', action: 'בוחן חיסון זוהר תחת', object: 'מיקרוסקופ נחושת עתיק' },

  { number: 20, numberStr: '20', person: 'ברוס ספרינגסטין (ב.ס.)', action: 'פורט על מיתרים ונשכב על הבמה עם', object: 'גיטרה חשמלית מתפוצצת' },
  { number: 21, numberStr: '21', person: 'ברוס לי (ב.ל.)', action: 'מנחית בעיטת קראטה מהירה באוויר עם', object: 'נונצ\'קו עץ קטלני' },
  { number: 22, numberStr: '22', person: 'בוב הבנאי (ב.ב.)', action: 'דופק בפטיש פלדה על קורת', object: 'קסדת בניין צהובה' },
  { number: 23, numberStr: '23', person: 'ביל גייטס (ב.ג.)', action: 'מקליד בטירוף קוד שפולט ניצוצות על', object: 'מחשב נייד שפולט לייזר' },
  { number: 24, numberStr: '24', person: 'בוב דילן (ב.ד.)', action: 'נושף במפוחית פיות ומנגן על', object: 'מפוחית פיות כסופה' },
  { number: 25, numberStr: '25', person: 'ברק חוסיין אובמה (ב.ח.)', action: 'נואם נאום סוחף מעל', object: 'פודיום עץ עם חותם הנשיא' },
  { number: 26, numberStr: '26', person: 'ברנרד שו (ב.ש.)', action: 'כותב מחזה נוקב בנוצת אווז שחורה על', object: 'נוצת כתיבה שחורה' },
  { number: 27, numberStr: '27', person: 'בייב רות\' (ב.ר.)', action: 'מניף וחובט הום-ראן אדיר באמצעות', object: 'אלת בייסבול מעץ אלון' },
  { number: 28, numberStr: '28', person: 'בוב מארלי (ב.מ.)', action: 'רוקד ומנענע ראסטות ארוכות מעל', object: 'תוף דרבוקה צבעוני' },
  { number: 29, numberStr: '29', person: 'בראד פיט (ב.פ.)', action: 'נלחם באגרופים חשופים בתוך', object: 'כפפות עור קרועות' },

  { number: 30, numberStr: '30', person: 'קווין ספייסי (כ.ס.)', action: 'דופק בטבעת זהב על שולחן של', object: 'שולחן עץ מהגוני כבד' },
  { number: 31, numberStr: '31', person: 'קלייב לואיס (כ.ל.)', action: 'פותח ארון בגדים קסום שמוביל לתוך', object: 'ארון בגדים עתיק מעץ' },
  { number: 32, numberStr: '32', person: 'כריסטיאן בייל (כ.ב.)', action: 'עוטה מסכת עטלף וצונח מראש מגדל על', object: 'חליפת שריון שחורה' },
  { number: 33, numberStr: '33', person: 'קוקו שאנל (כ.כ.)', action: 'גוזרת שמלת מעצבים שחורה במספרי', object: 'בקבוק בושם שאנל ענקי' },
  { number: 34, numberStr: '34', person: 'צ\'רלס דרווין (כ.ד.)', action: 'בוחן מאובן נדיר בזכוכית מגדלת על', object: 'קונכיית צב ענקית' },
  { number: 35, numberStr: '35', person: 'כריס המסוורת\' (כ.ח.)', action: 'מניף ומזמן ברקים אדירים בעזרת', object: 'פטיש מיולניר זוהר בחשמל' },
  { number: 36, numberStr: '36', person: 'צ\'רלי צ\'פלין (כ.ש.)', action: 'מסובב מקל הליכה מעוקל ומועף מעל', object: 'מקל הליכה ומגבעת שחורה' },
  { number: 37, numberStr: '37', person: 'כריסטיאנו רונאלדו (כ.ר.)', action: 'מזנק באוויר וצועק סיייוו מעל', object: 'כדורגל זהב נוצץ' },
  { number: 38, numberStr: '38', person: 'קרל מרקס (כ.מ.)', action: 'מניף פטיש ומגל מעל דפי', object: 'מניפסט עב-כרס בכריכת עור' },
  { number: 39, numberStr: '39', person: 'קייטי פרי (כ.פ.)', action: 'רוכבת על נמר זהב ויורה זיקוקים מתוך', object: 'מיקרופון יהלומים נוצץ' },

  { number: 40, numberStr: '40', person: 'דוקטור סוס (ד.ס.)', action: 'חובש כובע פסים ומספר חרוזים לתוך', object: 'כובע פסים אדום-לבן ענקי' },
  { number: 41, numberStr: '41', person: 'דלאי לאמה (ד.ל.)', action: 'יושב בשיכול רגליים ומדיטט בריחוף מעל', object: 'גלימת נזיר כתומה' },
  { number: 42, numberStr: '42', person: 'דייוויד בקהאם (ד.ב.)', action: 'בועט כדור חופשי מסובב לחיבורי', object: 'נעלי פקקים מוזהבות' },
  { number: 43, numberStr: '43', person: 'דיוויד קופרפילד (ד.ק.)', action: 'מעלים את פסל החירות בהנפת', object: 'מטפחת קסמים שחורה' },
  { number: 44, numberStr: '44', person: 'דונלד דאק (ד.ד.)', action: 'מגעגע בזעם ומשליך עוגת קצפת על', object: 'עוגת קצפת מתעופפת' },
  { number: 45, numberStr: '45', person: 'דסטין הופמן (ד.ח.)', action: 'רץ בטיילת בחליפת טוקסידו רטובה עם', object: 'מזוודת עור עתיקה' },
  { number: 46, numberStr: '46', person: 'דוד שמשון (ד.ש.)', action: 'עוקר בידיים חשופות את', object: 'דלתות שער העיר מברזל' },
  { number: 47, numberStr: '47', person: 'דניאל רדקליף (ד.ר.)', action: 'מנופף ויורה ניצוצות קסם מתוך', object: 'שרביט עץ קסום של הארי פוטר' },
  { number: 48, numberStr: '48', person: 'דייגו מראדונה (ד.מ.)', action: 'מנתר ונוגע ב"יד האלוהים" מעל', object: 'חולצת פסים כחול-לבן' },
  { number: 49, numberStr: '49', person: 'דולי פרטון (ד.פ.)', action: 'מנגנת בבנג\'ו ושרה בקול פעמונים מעל', object: 'כובע בוקרים עטור נצנצים' },

  { number: 50, numberStr: '50', person: 'חורחה סמפאולי (ח.ס.)', action: 'מתרוצץ בעצבנות על הקווים ושורק בתוך', object: 'משרוקית שופט כסופה' },
  { number: 51, numberStr: '51', person: 'חואקין לארא (ח.ל.)', action: 'רוכב על סוס פראי ומצליף בחוזקה בתוך', object: 'שוט עור מתפצפץ' },
  { number: 52, numberStr: '52', person: 'חאבייר בארדם (ח.ב.)', action: 'צועד בפנים קפואות ומפעיל', object: 'מכל לחץ אוויר קטלני' },
  { number: 53, numberStr: '53', person: 'חיים קניבסקי (ח.ק.)', action: 'מעיין ומדפדף במהירות בתוך', object: 'כרך גמרא ענקי פתוח' },
  { number: 54, numberStr: '54', person: 'חוליו דלגדו (ח.ד.)', action: 'שולף ומסמן אותיות באוויר באמצעות', object: 'חרב סיף גמישה ודקה' },
  { number: 55, numberStr: '55', person: 'חואקין פיניקס (ח.ח.)', action: 'רוקד על מדרגות אבן בחליפה אדומה מול', object: 'איפור ליצן מרוח של הג\'וקר' },
  { number: 56, numberStr: '56', person: 'חיים שפיר (ח.ש.)', action: 'פורס במניפה וממציא קלפי', object: 'חפיסת קלפי טאקי זוהרת' },
  { number: 57, numberStr: '57', person: 'חאבייר רודריגז (ח.ר.)', action: 'רוקד טנגו סוער ומחזיק בשיניו', object: 'ורד אדום בוער' },
  { number: 58, numberStr: '58', person: 'חוסני מובארכ (ח.מ.)', action: 'מביט במשקפת מראש של', object: 'פסל ספינקס מאבן חול' },
  { number: 59, numberStr: '59', person: 'חואן פאבלו (ח.פ.)', action: 'מחליק בסיבוב חד ומסובב את', object: 'גלגל הגה מרוצים' },

  { number: 60, numberStr: '60', person: 'שמעון סולומון (ש.ס.)', action: 'מכריז "אקשן!" ונוקש בחוזקה בתוך', object: 'קלאפר במאים מעץ' },
  { number: 61, numberStr: '61', person: 'שיה לבוף (ש.ל.)', action: 'צועק "Just Do It!" ומצמיד אגרופים מעל', object: 'סרט ראש אדום' },
  { number: 62, numberStr: '62', person: 'שון בין (ש.ב.)', action: 'שולף חרב אבירים כבדה ומוכתר על', object: 'כס ברזל ענקי' },
  { number: 63, numberStr: '63', person: 'שון קונרי (ש.ק.)', action: 'מערבב מרטיני בשייקר כסוף בתוך', object: 'כוס מרטיני עם זית של 007' },
  { number: 64, numberStr: '64', person: 'שרלוק דואיל (ש.ד.)', action: 'בוחן טביעות אצבע ומעשן מתוך', object: 'זכוכית מגדלת ענקית' },
  { number: 65, numberStr: '65', person: 'שלמה חנוך (ש.ח.)', action: 'מדליק מנורת שמן זך בתוך', object: 'קנקן שמן עתיק' },
  { number: 66, numberStr: '66', person: 'שייקה שרון (ש.ש.)', action: 'מספר בדיחה קורעת ומצחיק לתוך', object: 'מיקרופון סטנדאפ ישן' },
  { number: 67, numberStr: '67', person: 'שמעון ריבלין (ש.ר.)', action: 'תוקע תקיעה גדולה בתוך', object: 'שופר איל מפותל' },
  { number: 68, numberStr: '68', person: 'שון מנדס (ש.מ.)', action: 'שר ומלווה את עצמו בתוך', object: 'גיטרה אקוסטית עם מיתרי ניילון' },
  { number: 69, numberStr: '69', person: 'שמעון פרס (ש.פ.)', action: 'נואם באו"ם ומשחרר לחופשי', object: 'יונת שלום לבנה עם ענף זית' },

  { number: 70, numberStr: '70', person: 'רינגו סטאר (ר.ס.)', action: 'מתופף בסולו מסחרר על', object: 'מצילת נחושת מנצנצת' },
  { number: 71, numberStr: '71', person: 'רמי לוי (ר.ל.)', action: 'מעמיס עשרות ארגזים ומבצעים על', object: 'עגלת קניות מתכתית' },
  { number: 72, numberStr: '72', person: 'רוברט ברת\'יאון (ר.ב.)', action: 'מניף פטיש קרב ענקי וחובש', object: 'כתר קרניים מוזהב' },
  { number: 73, numberStr: '73', person: 'רונלד קולמן (ר.ק.)', action: 'מרים משקולת ענקית של 400 ק"ג מול', object: 'מוט משקולות פלדה כבד' },
  { number: 74, numberStr: '74', person: 'רוברט דה נירו (ר.ד.)', action: 'שואל "You talkin to me?" ועוטה', object: 'מעיל עור חום של נהג מונית' },
  { number: 75, numberStr: '75', person: 'רוברט הוק (ר.ח.)', action: 'מצייר תאי שעם מבעד לעדשת', object: 'טלסקופ פליז ארוך' },
  { number: 76, numberStr: '76', person: 'רובין שארמה (ר.ש.)', action: 'מלמד נזיר שמכר את מכונית ה-', object: 'מפתח פרארי אדום' },
  { number: 77, numberStr: '77', person: 'רונאלד רייגן (ר.ר.)', action: 'קורא להפיל את החומה ומחזיק', object: 'פיסת בטון מחומת ברלין' },
  { number: 78, numberStr: '78', person: 'ריקי מרטין (ר.מ.)', action: 'רוקד סלסה סוערת ומנענע', object: 'שרשרת חרוזים זוהרת' },
  { number: 79, numberStr: '79', person: 'רוג\'ר פדרר (ר.פ.)', action: 'מגיש אייס מושלם בחבטת גב-יד עם', object: 'מחבט טניס מוזהב' },

  { number: 80, numberStr: '80', person: 'מרטין סקורסזה (מ.ס.)', action: 'צועק הוראות בימוי בחדר עריכה ליד', object: 'גליל פילם 35 מ"מ' },
  { number: 81, numberStr: '81', person: 'מרטין לותר קינג (מ.ל.)', action: 'נואם "יש לי חלום" ומנופף בתוך', object: 'מגילת זכויות אדם עתיקה' },
  { number: 82, numberStr: '82', person: 'מוחמד עלי (מ.ב.)', action: 'רוקד כמו פרפר ועוקץ כמו דבורה בתוך', object: 'חלוק אגרוף לבן ומבריק' },
  { number: 83, numberStr: '83', person: 'מייקל ג\'ורדן (מ.ג.)', action: 'מרחף מקו העונשין ומטביע לתוך', object: 'נעלי אייר ג\'ורדן אדומות' },
  { number: 84, numberStr: '84', person: 'מאט דיימון (מ.ד.)', action: 'מגדל תפוחי אדמה במאדים וחובש', object: 'קסדת אסטרונאוט זוהרת' },
  { number: 85, numberStr: '85', person: 'מהטמה גנדי (מ.ח.)', action: 'צועד במסע המלח ומסובב כישור על', object: 'גלימת כותנה לבנה' },
  { number: 86, numberStr: '86', person: 'מייקל שומאכר (מ.ש.)', action: 'מזנק מהפודיום ומתיז', object: 'בקבוק שמפניה מבעבע' },
  { number: 87, numberStr: '87', person: 'מארק רופלו (מ.ר.)', action: 'שואג מזעם והופך לענק ירוק שקורע', object: 'כפפות אגרוף ירוקות ענקיות' },
  { number: 88, numberStr: '88', person: 'מרילין מונרו (מ.מ.)', action: 'שרה בקול ענוג מעל פתח אוורור בתוך', object: 'שמלת סאטן לבנה מתנפנפת' },
  { number: 89, numberStr: '89', person: 'מייקל פלפס (מ.פ.)', action: 'שוחה פרפר מהיר ומניף על צווארו', object: 'מדליית זהב אולימפית ענקית' },

  { number: 90, numberStr: '90', person: 'פול סיימון (פ.ס.)', action: 'שר את צליל הדממה על גבי', object: 'גיטרה אקוסטית קטנה' },
  { number: 91, numberStr: '91', person: 'פיליפ לאהם (פ.ל.)', action: 'מרים ומניף כקפטן עולמי את', object: 'גביע מונדיאל מנצנץ' },
  { number: 92, numberStr: '92', person: 'פירס ברוסנן (פ.ב.)', action: 'קופץ מקומה עשירית על חבל ויורה מתוך', object: 'שעון לייזר חשאי' },
  { number: 93, numberStr: '93', person: 'פרנץ קפקא (פ.ק.)', action: 'מתעורר בבוקר וכותב יומן עם', object: 'נוצת דיו ומכתב אישי' },
  { number: 94, numberStr: '94', person: 'פיליפ דיק (פ.ד.)', action: 'מדמיין אנדרואידים שחולמים דרך', object: 'משקפי מציאות מדומה' },
  { number: 95, numberStr: '95', person: 'פרידה קאלו (פ.ח.)', action: 'מציירת דיוקן עצמי בצבעי שמן פראיים על', object: 'כן ציור מעץ עמוס צבעים' },
  { number: 96, numberStr: '96', person: 'פליקס שוואב (פ.ש.)', action: 'צונח מקפסולת חלל ופותח', object: 'מצנח צבעוני ענקי' },
  { number: 97, numberStr: '97', person: 'פרדי מרקורי (פ.ר.)', action: 'שר We Are The Champions ומניף מעמד', object: 'כתר מלכותי וגלימת קטיפה' },
  { number: 98, numberStr: '98', person: 'פול מקרטני (פ.מ.)', action: 'פורט על גיטרת בס שמאלית בתוך', object: 'גיטרת בס ויולה של הביטלס' },
  { number: 99, numberStr: '99', person: 'פבלו פיקאסו (פ.פ.)', action: 'מורח משיכות מכחול קוביסטיות על', object: 'לוח צבעים ומכחול רחב' },
];

// Number-Shape Pegs (צורת הספרה):
export const DEFAULT_NUMBER_SHAPE_PEGS: PegShapeItem[] = [
  { number: 0, shapeName: 'עיגול', visualMetaphor: 'גלגל / ביצה / כדור שלג', defaultObject: 'גלגל עגלת ברזל', kineticTip: 'דמיין גלגל ברזל דוהר ודורס את הפריט ברעש' },
  { number: 1, shapeName: 'קו אנכי', visualMetaphor: 'חנית / נר / עמוד תאורה', defaultObject: 'חנית אבירים חדה', kineticTip: 'החנית משפדת את החפץ ומפצחת אותו' },
  { number: 2, shapeName: 'צוואר מקושת', visualMetaphor: 'ברבור במים / קוברה מתרוממת', defaultObject: 'ברבור לבן מלכותי', kineticTip: 'הברבור מנקר בחוזקה בפריט' },
  { number: 3, shapeName: 'קשת כפולה', visualMetaphor: 'אזיקים פתוחים / קלשון / כנפי שחף', defaultObject: 'אזיקי פלדה כבדים', kineticTip: 'האזיקים נטרקים וננעלים על הפריט' },
  { number: 4, shapeName: 'מפרש וזווית', visualMetaphor: 'סירת מפרש / כיסא הפוך', defaultObject: 'מפרשית מהירה', kineticTip: 'המפרש נקרע בסערה ועוטף את הפריט' },
  { number: 5, shapeName: 'וו וקרס', visualMetaphor: 'קרס דיג / עוגן ספינה', defaultObject: 'עוגן פלדה כבד', kineticTip: 'העוגן נופל מראש מנוף ומרסק את הפריט' },
  { number: 6, shapeName: 'לולאה תחתונה', visualMetaphor: 'מנעול תלייה / מקטרת מעשנת', defaultObject: 'מנעול ברזל חלוד', kineticTip: 'המנעול מתפצח ומשפריץ שמן שחור' },
  { number: 7, shapeName: 'להב וזווית', visualMetaphor: 'גרזן / צוק תלול / בומרנג', defaultObject: 'גרזן קרב אינדיאני', kineticTip: 'הגרזן מבקע את הפריט לשניים בהבזק' },
  { number: 8, shapeName: 'שני מעגלים מחוברים', visualMetaphor: 'שעון חול / איש שלג / משקפת', defaultObject: 'שעון חול עתיק', kineticTip: 'שעון החול מתנפץ וחול רותח קובר את הפריט' },
  { number: 9, shapeName: 'לולאה עליונה וחוט', visualMetaphor: 'בלון הליום על חוט / זכוכית מגדלת', defaultObject: 'בלון הליום ענק', kineticTip: 'הבלון מתפוצץ ברעש מחריש אוזניים' },
];

// Body Pegs (מתלי הגוף - 10 תחנות קבועות מכפות הרגליים ועד קודקוד הראש):
export const DEFAULT_BODY_PEGS: BodyPegItem[] = [
  { index: 1, bodyPartHebrew: '1. כפות רגליים', defaultObject: 'נעלי ברזל קוצניות', kineticTip: 'דרוך בכל הכוח על הפריט שאתה רוצה לזכור' },
  { index: 2, bodyPartHebrew: '2. ברכיים', defaultObject: 'מפתח שוודי ענק תקוע בברך', kineticTip: 'תן מכת ברך אדירה שמנפצת את הפריט' },
  { index: 3, bodyPartHebrew: '3. ירכיים', defaultObject: 'רובה ציד קשור ברצועת עור', kineticTip: 'הירכיים לוחצות ומועכות את הפריט כמו מלחציים' },
  { index: 4, bodyPartHebrew: '4. כיסי מכנסיים', defaultObject: 'זיקוקי דינור שמתפוצצים בכיס', kineticTip: 'שלוף את הפריט מהכיס כשהוא בוער ומעלה עשן' },
  { index: 5, bodyPartHebrew: '5. חגורה / מותניים', defaultObject: 'אבזם חגורת אליפות זהב כבדה', kineticTip: 'החגורה מתהדקת ולוחצת על הפריט עד לפיצוץ' },
  { index: 6, bodyPartHebrew: '6. חזה / לב', defaultObject: 'סמל סופרמן זוהר ופולט אש', kineticTip: 'הפריט מוטבע כמו חותמת חמה לתוך מרכז החזה' },
  { index: 7, bodyPartHebrew: '7. כתפיים', defaultObject: 'תותח לייזר כבד על הכתף', kineticTip: 'נשא את הפריט המוגזם על שתי הכתפיים שקורסות מכובדו' },
  { index: 8, bodyPartHebrew: '8. צוואר / גרון', defaultObject: 'שרשרת עוגני פלדה חונקת', kineticTip: 'הפריט נכרך סביב הצוואר ומתיז מים צוננים' },
  { index: 9, bodyPartHebrew: '9. פנים / פה', defaultObject: 'שפם ענקי מנופח ושיני זהב', kineticTip: 'דחוף את הפריט לפה ותטעם את הטעם המוזר שלו' },
  { index: 10, bodyPartHebrew: '10. קודקוד הראש', defaultObject: 'כתר יהלומים בוער בלהבות', kineticTip: 'הפריט מתאזן על קודקוד הראש ופולט זיקוקים לשמיים' },
];

// Pre-configured Memory Palaces:
export const DEFAULT_PALACES: MemoryPalace[] = [
  {
    id: 'palace-home-1',
    name: 'הדירה הביתית (5 חדרים)',
    description: 'מסלול מסורתי ליניארי בכיוון השעון עם 25 מיקרו-תחנות לשימור מידע מדויק ללא רוויה.',
    icon: 'Home',
    category: 'home',
    isPermanent: true,
    loci: [
      { id: 'h1', stepNumber: 1, roomName: 'מבואה וכניסה', title: 'דלת הכניסה הראשית', positionDescription: 'ידית הפליז של דלת הפלדלת', storedContent: 'נאום פתיחה - מושג יסוד ראשון' },
      { id: 'h2', stepNumber: 2, roomName: 'מבואה וכניסה', title: 'מתלה המעילים', positionDescription: 'וו העץ השמאלי במתלה', storedContent: 'חוק שימור האנרגיה' },
      { id: 'h3', stepNumber: 3, roomName: 'מבואה וכניסה', title: 'מראת הקיר', positionDescription: 'פינת הזכוכית הימנית העליונה' },
      { id: 'h4', stepNumber: 4, roomName: 'מבואה וכניסה', title: 'ארון הנעליים', positionDescription: 'המגירה העליונה הנפתחת בחריקה' },
      { id: 'h5', stepNumber: 5, roomName: 'מבואה וכניסה', title: 'שטיח הכניסה', positionDescription: 'מרכז שטיח הגומי המחוספס' },

      { id: 'h6', stepNumber: 6, roomName: 'סלון מרכזי', title: 'ספת העור המרכזית', positionDescription: 'כרית המשענת הימנית של הספה' },
      { id: 'h7', stepNumber: 7, roomName: 'סלון מרכזי', title: 'שולחן הקפה מזכוכית', positionDescription: 'פינת הזכוכית המלוטשת' },
      { id: 'h8', stepNumber: 8, roomName: 'סלון מרכזי', title: 'מסך הטלוויזיה הענק', positionDescription: 'מרכז המסך השחור' },
      { id: 'h9', stepNumber: 9, roomName: 'סלון מרכזי', title: 'החלון הגדול למרפסת', positionDescription: 'מסילת האלומיניום של התריס' },
      { id: 'h10', stepNumber: 10, roomName: 'סלון מרכזי', title: 'מנורת העמידה הפינתית', positionDescription: 'אהיל הבד הצהוב' },

      { id: 'h11', stepNumber: 11, roomName: 'מטבח', title: 'המקרר', positionDescription: 'ידית המקפיא העליונה' },
      { id: 'h12', stepNumber: 12, roomName: 'מטבח', title: 'כיריים גז', positionDescription: 'המבער הראשי הגדול' },
      { id: 'h13', stepNumber: 13, roomName: 'מטבח', title: 'כיור הנירוסטה', positionDescription: 'פיית הברז המתכתית המעוקלת' },
      { id: 'h14', stepNumber: 14, roomName: 'מטבח', title: 'מכשיר המיקרוגל', positionDescription: 'לוח המקשים הדיגיטלי' },
      { id: 'h15', stepNumber: 15, roomName: 'מטבח', title: 'אי המטבח מעץ', positionDescription: 'משטח הבוצ\'ר במרכז' },

      { id: 'h16', stepNumber: 16, roomName: 'חדר עבודה', title: 'שולחן המחשב', positionDescription: 'המקלדת המכנית המוארת' },
      { id: 'h17', stepNumber: 17, roomName: 'חדר עבודה', title: 'כיסא המנהלים הארגונומי', positionDescription: 'משענת הראש השחורה' },
      { id: 'h18', stepNumber: 18, roomName: 'חדר עבודה', title: 'ספריית ספרי העיון', positionDescription: 'המדף השלישי מימין' },
      { id: 'h19', stepNumber: 19, roomName: 'חדר עבודה', title: 'לוח השעם המגנטי', positionDescription: 'הנעץ האדום במרכז הלוח' },
      { id: 'h20', stepNumber: 20, roomName: 'חדר עבודה', title: 'מגרסת הניירות', positionDescription: 'פתח הסכינים העליון' },

      { id: 'h21', stepNumber: 21, roomName: 'חדר שינה ראשי', title: 'המיטה הזוגית', positionDescription: 'הכרית השמאלית הרכה' },
      { id: 'h22', stepNumber: 22, roomName: 'חדר שינה ראשי', title: 'שידת הלילה', positionDescription: 'שעון המעורר המהבהב' },
      { id: 'h23', stepNumber: 23, roomName: 'חדר שינה ראשי', title: 'ארון הבגדים המובנה', positionDescription: 'דלת המראה הזזת' },
      { id: 'h24', stepNumber: 24, roomName: 'חדר שינה ראשי', title: 'מתלה הצעיפים', positionDescription: 'טבעת הניקל המרכזית' },
      { id: 'h25', stepNumber: 25, roomName: 'חדר שינה ראשי', title: 'שטיח שאגי למרגלות המיטה', positionDescription: 'הסיבים הרכים במרכז השטיח' },
    ],
  },
  {
    id: 'palace-museum-2',
    name: 'המוזיאון הלאומי (ארמון תחרותי)',
    description: 'מרחב ציבורי רחב ידיים עם ארכיטקטורה מובחנת למניעת התאבכות פרואקטיבית (Ghosting).',
    icon: 'Building2',
    category: 'custom',
    isPermanent: false,
    loci: [
      { id: 'm1', stepNumber: 1, roomName: 'לובי השיש הראשי', title: 'עמוד השיש הדורי', positionDescription: 'הבסיס המסותת של העמוד' },
      { id: 'm2', stepNumber: 2, roomName: 'לובי השיש הראשי', title: 'דלפק הכרטיסים', positionDescription: 'משטח הזכוכית המשוריינת' },
      { id: 'm3', stepNumber: 3, roomName: 'לובי השיש הראשי', title: 'גרם המדרגות המונומנטלי', positionDescription: 'מעקה הברונזה המוזהב' },
      { id: 'm4', stepNumber: 4, roomName: 'לובי השיש הראשי', title: 'שעון המטוטלת העתיק', positionDescription: 'משקולת הפליז המתנדנדת' },
      { id: 'm5', stepNumber: 5, roomName: 'לובי השיש הראשי', title: 'פסל הברונזה של האריה', positionDescription: 'שיני האריה הפעורות' },

      { id: 'm6', stepNumber: 6, roomName: 'אולם העת העתיקה', title: 'ארון מומיות מצרי', positionDescription: 'מסכת הזהב של הסרקופג' },
      { id: 'm7', stepNumber: 7, roomName: 'אולם העת העתיקה', title: 'כד חרס יווני שחור', positionDescription: 'הידית המעוטרת בדמויות' },
      { id: 'm8', stepNumber: 8, roomName: 'אולם העת העתיקה', title: 'פסיפס רומי על הרצפה', positionDescription: 'מרכז הפסיפס בדמות דולפין' },
      { id: 'm9', stepNumber: 9, roomName: 'אולם העת העתיקה', title: 'חרב גלדיאטורים', positionDescription: 'להב הברזל המחורץ' },
      { id: 'm10', stepNumber: 10, roomName: 'אולם העת העתיקה', title: 'שריון קשקשים עתיק', positionDescription: 'לוחית החזה המחוררת' },
    ],
  },
];

// Names and Faces Practice Bank (3-Step Method: Morphological Anchor -> Substitute Word -> Kinetic Fusion):
export const DEFAULT_PEOPLE_CARDS: PersonFaceCard[] = [
  {
    id: 'p1',
    name: 'רונית כהן',
    roleOrJob: 'מנהלת פרויקטים בכירה',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    avatarSeed: 'ronit',
    morphologicalAnchor: 'אף נשרי חד ומחודד',
    substituteWord: 'רונית = מונית צהובה',
    mnemonicScene: 'מונית שירות צהובה דוהרת במהירות 120 קמ"ש ומתנגשת חזיתית ישירות באף הנשרי שלה, צופרת ללא הרף ומפזרת חלקי פגוש.',
  },
  {
    id: 'p2',
    name: 'חיים לוי',
    roleOrJob: 'מהנדס תוכנה ראשי',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    avatarSeed: 'chaim',
    morphologicalAnchor: 'גבות עבות ומחוברות מאוד',
    substituteWord: 'חיים = לחם חי ענקי (או ח"י = 18 שקלים)',
    mnemonicScene: 'כיכר ענקית של "לחם חי" לוהט שיוצא מהתנור מונח ומאזן את עצמו ישירות על הגבות העבות המחוברות שלו ומפזר פירורים חמים.',
  },
  {
    id: 'p3',
    name: 'אור שמש',
    roleOrJob: 'רופאת ילדים מחוזית',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    avatarSeed: 'or',
    morphologicalAnchor: 'חיוך רחב עם גומת חן עמוקה בלחי שמאל',
    substituteWord: 'אור = פנס זרקור מסנוור של אצטדיון',
    mnemonicScene: 'זרקור אצטדיון עצום של מיליון לומן נדלק פתאום מתוך גומת החן שבלחי שלה ומסנוור את כל החדר באור בוהק.',
  },
  {
    id: 'p4',
    name: 'אלון ברק',
    roleOrJob: 'עורך דין פלילי',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    avatarSeed: 'alon',
    morphologicalAnchor: 'סנטר מרובע ושסוע (גומחה בסנטר)',
    substituteWord: 'אלון = עץ אלון ענקי עם בלוטים',
    mnemonicScene: 'עץ אלון עתיק ועצום צומח במהירות הבזק מתוך השסע שבסנטר שלו, וענפיו המלאים בלוטים נשברים ברעש פיצוח עז.',
  },
  {
    id: 'p5',
    name: 'מרים שוורץ',
    roleOrJob: 'פרופסור לנוירולוגיה',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    avatarSeed: 'miriam',
    morphologicalAnchor: 'משקפי מסגרת אדומה עגולים וגדולים',
    substituteWord: 'מרים = מי-ים מלוחים שמשפריצים',
    mnemonicScene: 'גלי מים מלוחים ושורפים של ים המלח מתפרצים כמו גייזר מתוך המסגרת האדומה של המשקפיים שלה.',
  },
  {
    id: 'p6',
    name: 'גורבצ\'וב (שם בינלאומי לדוגמה)',
    roleOrJob: 'מנהיג היסטורי',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    avatarSeed: 'gorbi',
    morphologicalAnchor: 'כתם לידה סגול בולט על המצח',
    substituteWord: 'גור-בצ\'וב = גור כלבים + בצל חריף',
    mnemonicScene: 'גור כלבים שובב יושב על ראשו ולועס בצל סגול חריף שמשפריץ מיץ חריף ישירות על כתם הלידה במצח.',
  },
];

// Abstract Shapes for Memory Championships (Pareidolia + Texture Mapping 1-5):
export const DEFAULT_ABSTRACT_SHAPES: AbstractShapeCard[] = [
  {
    id: 'sh1',
    title: 'צורה אבסטרקטית 01',
    svgShapeType: 'spiral',
    textureType: 'striped',
    textureDigit: 2, // מפוספס = 2 (נ')
    pareidoliaHint: 'קונכיית חילזון ענקית או מגלשה לוליינית',
    mnemonicCode: 'נחש על מגלשה (2 -> נ)',
  },
  {
    id: 'sh2',
    title: 'צורה אבסטרקטית 02',
    svgShapeType: 'blob',
    textureType: 'dotted',
    textureDigit: 3, // מנוקד = 3 (מ')
    pareidoliaHint: 'אוזן שפן הפוכה או כתם דיו מתפשט',
    mnemonicCode: 'שפן מנוקד ששותה מרק (3 -> מ)',
  },
  {
    id: 'sh3',
    title: 'צורה אבסטרקטית 03',
    svgShapeType: 'zigzag',
    textureType: 'smooth',
    textureDigit: 1, // חלק = 1 (ט'/ד'/ת')
    pareidoliaHint: 'שיני כריש חדות או ברק מתפצל',
    mnemonicCode: 'חרב פלדה חלקה וחדה (1 -> ט)',
  },
  {
    id: 'sh4',
    title: 'צורה אבסטרקטית 04',
    svgShapeType: 'wavy' as any,
    textureType: 'wavy',
    textureDigit: 4, // גלי = 4 (ר')
    pareidoliaHint: 'גל צונאמי או רעמת אריה ברוח',
    mnemonicCode: 'רכבת הרים גלית (4 -> ר)',
  },
  {
    id: 'sh5',
    title: 'צורה אבסטרקטית 05',
    svgShapeType: 'shield',
    textureType: 'checkered',
    textureDigit: 5, // משובץ = 5 (ל')
    pareidoliaHint: 'מגן גלדיאטורים או לוח שחמט מקומר',
    mnemonicCode: 'לוח שחמט משובץ של ליצן (5 -> ל)',
  },
];

// Sample Academic Key Points (Key-Word Method):
export const DEFAULT_ACADEMIC_POINTS: AcademicKeyPoint[] = [
  {
    id: 'ac1',
    conceptTitle: 'חוק הקידוד הכפול (Dual-Coding Theory - Paivio)',
    discipline: 'מדעי המוח והקוגניציה',
    sourceSummary: 'המוח מעבד מידע מילולי וחזותי בערוצים מקבילים נפרדים. שילוב בין דימוי חזותי עשיר למלל מופשט יוצר זיכרון מוצק כפליים.',
    keyWord: 'קוד כפול (Dual)',
    visualAnchor: 'שני שקעי חשמל ענקיים זוהרים שמחברים כבל וידאו צבעוני ורמקול צורח',
    palaceLocusInfo: 'תחנה 2 בארמון: מתלה המעילים',
    mnemonicScene: 'מתלה המעילים מתפצל לשני חצאים מוארים - חצי אחד מסך קולנוע מרצד והחצי השני ספר עברי עתיק שצועק בקול.',
  },
  {
    id: 'ac2',
    conceptTitle: 'המצאת הדפוס (שנת 1455 - יוהאן גוטנברג)',
    discipline: 'היסטוריה ותרבות',
    sourceSummary: 'גוטנברג פיתח את הדפוס בעל האותיות המיטלטלות בשנת 1455. לפי ה-Major: 1 (מילניום) מושמט; 4=ר\', 5=ל\', 5=ל\' -> "רעלה" כפולה או "רולל".',
    keyWord: 'גוטנברג 1455 (רעלה / לולב)',
    visualAnchor: 'מכבש דפוס כבד מעץ שחור',
    palaceLocusInfo: 'תחנה 7 בארמון: שולחן הקפה מזכוכית',
    mnemonicScene: 'יוהאן גוטנברג מפעיל בטירוף מכבש דפוס על שולחן הזכוכית, ודפי תנ"ך כרוכים בתוך רעלה ארוכה מתנופפת ונחבטים בלולבים ענקיים.',
  },
  {
    id: 'ac3',
    conceptTitle: 'הפעלת תאי מקום (Place Cells) ותאי סריג (Grid Cells)',
    discipline: 'נוירוביולוגיה',
    sourceSummary: 'אוקיף והזוג מוזר גילו את תאי המקום בהיפוקמפוס ואת תאי הסריג בקורטקס האנטורינלי, המהווים את ה-GPS הפנימי של המוח.',
    keyWord: 'סריג ומקום (Grid & Place)',
    visualAnchor: 'רשת לייזר ירוקה משובצת על הרצפה',
    palaceLocusInfo: 'תחנה 11 בארמון: דלת המקרר',
    mnemonicScene: 'דלת המקרר נפתחת ומתוכה פורצת רשת לייזר משובצת של סריג GPS שכולאת עכבר מעבדה שלובש כתר של מלך.',
  },
];

// Sample Personal Contacts and Associations (e.g. Phone numbers, credit cards, door codes):
export const DEFAULT_PERSONAL_ASSOCIATIONS: PersonalContactAssociation[] = [
  {
    id: 'pca-1',
    targetSubject: 'מספר הטלפון של דנה (עבודה)',
    storedNumberOrFact: '054-951483',
    encodedMnemonic: 'במערכת ה-Major: 95 (פיל) + 14 (טירה) + 83 (פטיש). דנה רוכבת על פיל ענק שממוטט טירה בעזרת פטיש קרב רועם.',
    methodUsed: 'major',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    successCount: 4,
    failCount: 0,
  },
  {
    id: 'pca-2',
    targetSubject: 'קוד הכספת המשרדית',
    storedNumberOrFact: '1523',
    encodedMnemonic: 'שיטת PAO: 15 (אלברט איינשטיין) + 23 (מטביע כדורסל). איינשטיין עם שפם לבן מקפץ ומטביע כדורסל בוער לתוך מנעול הכספת.',
    methodUsed: 'pao',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    successCount: 6,
    failCount: 0,
  },
  {
    id: 'pca-3',
    targetSubject: 'תאריך יום נישואין',
    storedNumberOrFact: '18 ביוני (18.06)',
    encodedMnemonic: '18 (תוף רועם) + 06 (סשימי דג נא). מתופף מכה בתוף ענק ומתוכו עפים נתחי סשימי שטובעים ברוטב סויה.',
    methodUsed: 'major',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    successCount: 5,
    failCount: 1,
  },
  {
    id: 'pca-4',
    targetSubject: 'רשימת יציאה מהבית (ראשי תיבות אמ"ן)',
    storedNumberOrFact: 'ארנק, מטען, נעילה',
    encodedMnemonic: 'מתלי גוף: ארנק עור תקוע בברך (2), מטען סמארטפון מסביב לצוואר (8), ומפתח נעילת דלת תקוע על קודקוד הראש (10).',
    methodUsed: 'pegs',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    successCount: 8,
    failCount: 0,
  },
];

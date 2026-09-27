import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Dumbbell,
  Compass,
  Smile,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Flame,
} from 'lucide-react';
import {
  MajorItem,
  PAOItem,
  PersonFaceCard,
  MemoryPalace,
  PalaceLocus,
  PegShapeItem,
  BodyPegItem,
  AcademicKeyPoint,
} from '../types/memory';
import { TECHNIQUE_SUMMARIES } from '../data/techniqueSummaries';
import { TabType } from './Navbar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  majorItems: MajorItem[];
  paoItems: PAOItem[];
  peopleCards: PersonFaceCard[];
  palaces: MemoryPalace[];
  shapePegs: PegShapeItem[];
  bodyPegs: BodyPegItem[];
  academicPoints?: AcademicKeyPoint[];
  onNavigate: (tab: TabType, subModule?: string, itemId?: string | number) => void;
  onOpenSummary: (techniqueId: string) => void;
}

interface SearchResultItem {
  id: string;
  category: 'major' | 'pao' | 'palace' | 'names' | 'theory' | 'pegs' | 'academic';
  categoryLabel: string;
  categoryColor: string;
  categoryIcon: React.ReactNode;
  title: string;
  subtitle: string;
  tag?: string;
  action: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  majorItems,
  paoItems,
  peopleCards,
  palaces,
  shapePegs,
  bodyPegs,
  academicPoints = [],
  onNavigate,
  onOpenSummary,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const results: SearchResultItem[] = [];

  if (q.length > 0) {
    // 1. Major System
    majorItems.forEach((item) => {
      const numStr = item.numberStr;
      const num = item.number.toString();
      const word = (item.userWord || item.defaultWord).toLowerCase();
      const consonants = (item.userConsonants || item.consonants).toLowerCase();
      const hint = (item.userImageHint || item.imageHint || '').toLowerCase();

      if (num.includes(q) || numStr.includes(q) || word.includes(q) || consonants.includes(q) || hint.includes(q)) {
        results.push({
          id: `major-${item.number}`,
          category: 'major',
          categoryLabel: 'Major System',
          categoryColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          categoryIcon: <Dumbbell className="w-3.5 h-3.5 text-amber-400" />,
          title: `#${item.numberStr} - ${item.userWord || item.defaultWord}`,
          subtitle: `עיצורים: ${item.userConsonants || item.consonants} ${hint ? `| ⚡ ${hint.slice(0, 40)}...` : ''}`,
          tag: 'מספרים 1-100',
          action: () => {
            onNavigate('workouts', 'major', item.number);
            onClose();
          },
        });
      }
    });

    // 2. PAO
    paoItems.forEach((item) => {
      const numStr = item.numberStr;
      const num = item.number.toString();
      const person = (item.userPerson || item.person).toLowerCase();
      const action = (item.userAction || item.action).toLowerCase();
      const object = (item.userObject || item.object).toLowerCase();

      if (
        num.includes(q) ||
        numStr.includes(q) ||
        person.includes(q) ||
        action.includes(q) ||
        object.includes(q)
      ) {
        results.push({
          id: `pao-${item.number}`,
          category: 'pao',
          categoryLabel: 'PAO (אדם-פעולה-חפץ)',
          categoryColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
          categoryIcon: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
          title: `#${item.numberStr}: ${item.userPerson || item.person}`,
          subtitle: `⚡ ${item.userAction || item.action} | 📦 ${item.userObject || item.object}`,
          tag: 'שלשות PAO',
          action: () => {
            onNavigate('workouts', 'pao', item.number);
            onClose();
          },
        });
      }
    });

    // 3. Palaces
    palaces.forEach((palace) => {
      const pName = palace.name.toLowerCase();
      const pDesc = (palace.description || '').toLowerCase();
      let matchedInPalace = pName.includes(q) || pDesc.includes(q);

      if (matchedInPalace) {
        results.push({
          id: `palace-${palace.id}`,
          category: 'palace',
          categoryLabel: 'ארמון זיכרון',
          categoryColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
          categoryIcon: <Compass className="w-3.5 h-3.5 text-cyan-400" />,
          title: `🏛️ ${palace.name}`,
          subtitle: `${palace.loci.length} תחנות | ${palace.description || 'ארמון זיכרון פעיל'}`,
          tag: 'Method of Loci',
          action: () => {
            onNavigate('palaces', undefined, palace.id);
            onClose();
          },
        });
      }

      // Check loci inside palace
      palace.loci.forEach((locus: PalaceLocus) => {
        const lTitle = locus.title.toLowerCase();
        const lRoom = (locus.roomName || '').toLowerCase();
        const lScene = (locus.mnemonicScene || '').toLowerCase();
        if (lTitle.includes(q) || lRoom.includes(q) || lScene.includes(q)) {
          results.push({
            id: `locus-${locus.id}`,
            category: 'palace',
            categoryLabel: `תחנת ארמון (${palace.name})`,
            categoryColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
            categoryIcon: <Compass className="w-3.5 h-3.5 text-cyan-400" />,
            title: `📍 ${locus.title} [${locus.roomName || 'חדר'}]`,
            subtitle: locus.mnemonicScene || 'ללא סצנה מוגדרת',
            tag: palace.name,
            action: () => {
              onNavigate('palaces', undefined, palace.id);
              onClose();
            },
          });
        }
      });
    });

    // 4. Names & Faces
    peopleCards.forEach((person) => {
      const name = person.name.toLowerCase();
      const role = person.roleOrJob.toLowerCase();
      const anchor = person.morphologicalAnchor.toLowerCase();
      const sub = person.substituteWord.toLowerCase();
      const scene = person.mnemonicScene.toLowerCase();

      if (
        name.includes(q) ||
        role.includes(q) ||
        anchor.includes(q) ||
        sub.includes(q) ||
        scene.includes(q)
      ) {
        results.push({
          id: `person-${person.id}`,
          category: 'names',
          categoryLabel: 'שמות ופנים',
          categoryColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          categoryIcon: <Smile className="w-3.5 h-3.5 text-emerald-400" />,
          title: `👤 ${person.name} (${person.roleOrJob})`,
          subtitle: `עוגן: ${person.morphologicalAnchor} | סצנה: ${person.mnemonicScene.slice(0, 45)}...`,
          tag: 'פנים ועוגנים',
          action: () => {
            onNavigate('workouts', 'names', person.id);
            onClose();
          },
        });
      }
    });

    // 5. Theory & Summaries
    Object.values(TECHNIQUE_SUMMARIES).forEach((tech) => {
      const tTitle = tech.title.toLowerCase();
      const tSubtitle = tech.subtitle.toLowerCase();
      const tDesc = (tech.scientificBasis || '').toLowerCase();
      const tRules = (tech.coreRules || []).join(' ').toLowerCase();

      if (tTitle.includes(q) || tSubtitle.includes(q) || tDesc.includes(q) || tRules.includes(q)) {
        results.push({
          id: `theory-${tech.id}`,
          category: 'theory',
          categoryLabel: 'סיכום ומדע',
          categoryColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
          categoryIcon: <GraduationCap className="w-3.5 h-3.5 text-purple-400" />,
          title: `📖 ${tech.title}`,
          subtitle: tech.subtitle,
          tag: 'מאמר אקדמאי',
          action: () => {
            onOpenSummary(tech.id);
            onClose();
          },
        });
      }
    });

    // 6. Pegs
    shapePegs.forEach((peg) => {
      const sName = (peg.userShapeName || peg.shapeName).toLowerCase();
      const sObj = (peg.userObject || peg.defaultObject).toLowerCase();
      const sMetaphor = (peg.visualMetaphor || '').toLowerCase();

      if (
        peg.number.toString().includes(q) ||
        sName.includes(q) ||
        sObj.includes(q) ||
        sMetaphor.includes(q)
      ) {
        results.push({
          id: `shape-peg-${peg.number}`,
          category: 'pegs',
          categoryLabel: 'יתדות צורה',
          categoryColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          categoryIcon: <Dumbbell className="w-3.5 h-3.5 text-amber-400" />,
          title: `🔢 יתד #${peg.number} - ${peg.userShapeName || peg.shapeName}`,
          subtitle: `${peg.userObject || peg.defaultObject} | ${peg.visualMetaphor}`,
          tag: 'יתדות',
          action: () => {
            onNavigate('workouts', 'pegs', peg.number);
            onClose();
          },
        });
      }
    });

    bodyPegs.forEach((peg) => {
      const bPart = (peg.userBodyPart || peg.bodyPartHebrew).toLowerCase();
      const bObj = (peg.userObject || peg.defaultObject).toLowerCase();
      const bTip = (peg.userKineticTip || peg.kineticTip).toLowerCase();

      if (
        peg.index.toString().includes(q) ||
        bPart.includes(q) ||
        bObj.includes(q) ||
        bTip.includes(q)
      ) {
        results.push({
          id: `body-peg-${peg.index}`,
          category: 'pegs',
          categoryLabel: 'יתדות גוף',
          categoryColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          categoryIcon: <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />,
          title: `🦶 יתד גוף #${peg.index} - ${peg.userBodyPart || peg.bodyPartHebrew}`,
          subtitle: `${peg.userObject || peg.defaultObject} | ${peg.userKineticTip || peg.kineticTip}`,
          tag: 'יתדות',
          action: () => {
            onNavigate('workouts', 'pegs', peg.index);
            onClose();
          },
        });
      }
    });

    // 7. Academic
    academicPoints.forEach((point) => {
      if (
        point.conceptTitle.toLowerCase().includes(q) ||
        point.discipline.toLowerCase().includes(q) ||
        point.sourceSummary.toLowerCase().includes(q) ||
        point.mnemonicScene.toLowerCase().includes(q)
      ) {
        results.push({
          id: `academic-${point.id}`,
          category: 'academic',
          categoryLabel: 'ידע אקדמי',
          categoryColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          categoryIcon: <BookOpen className="w-3.5 h-3.5 text-rose-400" />,
          title: `🎓 ${point.conceptTitle} (${point.discipline})`,
          subtitle: point.mnemonicScene || point.sourceSummary,
          tag: 'אקדמיה',
          action: () => {
            onNavigate('workouts', 'academic', point.id);
            onClose();
          },
        });
      }
    });
  }

  const filteredResults =
    selectedCategory === 'all'
      ? results
      : results.filter((r) => r.category === selectedCategory);

  const categoriesCount = {
    all: results.length,
    major: results.filter((r) => r.category === 'major').length,
    pao: results.filter((r) => r.category === 'pao').length,
    palace: results.filter((r) => r.category === 'palace').length,
    names: results.filter((r) => r.category === 'names').length,
    theory: results.filter((r) => r.category === 'theory').length,
    pegs: results.filter((r) => r.category === 'pegs').length,
    academic: results.filter((r) => r.category === 'academic').length,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col mt-8 sm:mt-16 max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש כללי בכל האפליקציה: מספר, דמות, חפץ, ארמון, שם אדם, מונח מדעי..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-xl bg-slate-200 border border-slate-300 font-mono shadow-xs"
          >
            ESC
          </button>
        </div>

        {/* Category Filters */}
        {results.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-slate-500 font-bold shrink-0">סנן לפי מודול:</span>
            {[
              { id: 'all', label: `הכל (${categoriesCount.all})` },
              { id: 'major', label: `Major (${categoriesCount.major})` },
              { id: 'pao', label: `PAO (${categoriesCount.pao})` },
              { id: 'palace', label: `ארמונות (${categoriesCount.palace})` },
              { id: 'names', label: `שמות (${categoriesCount.names})` },
              { id: 'theory', label: `סיכומים (${categoriesCount.theory})` },
              { id: 'pegs', label: `יתדות (${categoriesCount.pegs})` },
              { id: 'academic', label: `אקדמי (${categoriesCount.academic})` },
            ]
              .filter((c) => c.id === 'all' || (categoriesCount as any)[c.id] > 0)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-[#58CC02] text-white font-black shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[500px]">
          {query.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">חיפוש אוניברסלי בממנטו</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                הקלד כל מספר (למשל "42", "99"), שם אדם, מילה מנמונית, ארמון זיכרון או מושג מדעי כדי להגיע אליו מיד.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['14', '99', 'אלברט איינשטיין', 'ארמון הבית', 'שיטת Loci', 'ספרדית'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="text-xs bg-slate-100 hover:bg-amber-100 text-amber-800 px-3 py-1 rounded-xl border border-slate-200 transition-colors cursor-pointer font-medium"
                  >
                    "{tag}"
                  </button>
                ))}
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-3xl">🔍</div>
              <p className="text-sm font-bold text-slate-700">לא נמצאו תוצאות עבור "{query}"</p>
              <p className="text-xs text-slate-500">נסה לחפש מספר, מילה מנמונית, אות או שם אחר</p>
            </div>
          ) : (
            filteredResults.map((item) => (
              <div
                key={item.id}
                onClick={item.action}
                className="group p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between gap-3 text-right shadow-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${item.categoryColor}`}
                    >
                      {item.categoryIcon}
                      <span>{item.categoryLabel}</span>
                    </span>
                    {item.tag && (
                      <span className="text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-1">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 text-slate-400 group-hover:text-amber-600 shrink-0">
                  <span className="text-xs font-bold hidden sm:inline">קפוץ לשם</span>
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
          <span>
            {results.length > 0 ? `נמצאו ${results.length} תוצאות` : 'חיפוש פעיל בכל מודולי הזיכרון'}
          </span>
          <span className="font-mono">Ctrl + K לפתיחה מהירה בכל רגע</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Hash,
  User,
  Smile,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  MajorItem,
  PAOItem,
  PegShapeItem,
  BodyPegItem,
  PersonFaceCard,
  AbstractShapeCard,
  AcademicKeyPoint,
} from '../types/memory';
import { MajorModule } from './workouts/MajorModule';
import { PAOModule } from './workouts/PAOModule';
import { NamesFacesModule } from './workouts/NamesFacesModule';
import { PegsModule } from './workouts/PegsModule';
import { ShapesModule } from './workouts/ShapesModule';
import { AcademicModule } from './workouts/AcademicModule';

export interface WorkoutsHubProps {
  majorDigits: MajorItem[];
  majorItems: MajorItem[];
  paoItems: PAOItem[];
  shapePegs: PegShapeItem[];
  bodyPegs: BodyPegItem[];
  peopleCards: PersonFaceCard[];
  abstractShapes: AbstractShapeCard[];
  academicPoints: AcademicKeyPoint[];
  onEarnPoints: (amount: number, reason?: string) => void;
  onUnlockBadge: (badge: string) => void;
  onUpdateMajorDigit: (digit: number, consonants: string, word: string, hint: string) => void;
  onResetMajorDigit: (digit: number) => void;
  onRecalculateMajor00_99FromDigits: (customDigits?: MajorItem[]) => void;
  onAddMajorItem?: (item: MajorItem) => void;
  onUpdateMajorItem: (
    number: number,
    updates: {
      userWord?: string;
      userConsonants?: string;
      userImageHint?: string;
      customNotes?: string;
    }
  ) => void;
  onDeleteMajorItem?: (number: number) => void;
  onResetMajorItem: (number: number) => void;
  onAddPAOItem?: (item: PAOItem) => void;
  onUpdatePAOItem: (
    number: number,
    updates: { userPerson?: string; userAction?: string; userObject?: string }
  ) => void;
  onDeletePAOItem?: (number: number) => void;
  onResetPAOItem: (number: number) => void;
  onAddShapePeg?: (item: PegShapeItem) => void;
  onUpdateShapePeg: (
    number: number,
    updates: { userObject?: string; userShapeName?: string; userKineticTip?: string }
  ) => void;
  onDeleteShapePeg?: (number: number) => void;
  onResetShapePeg: (number: number) => void;
  onAddBodyPeg?: (item: BodyPegItem) => void;
  onUpdateBodyPeg: (
    index: number,
    updates: { userObject?: string; userBodyPart?: string; userKineticTip?: string }
  ) => void;
  onDeleteBodyPeg?: (index: number) => void;
  onResetBodyPeg: (index: number) => void;
  onAddPersonFaceCard?: (person: Omit<PersonFaceCard, 'id'>) => void;
  onUpdatePersonFaceCard?: (id: string, updates: Partial<PersonFaceCard>) => void;
  onDeletePersonFaceCard?: (id: string) => void;
  onResetPersonFaceCards?: () => void;
  onAddAbstractShape?: (shape: Omit<AbstractShapeCard, 'id'>) => void;
  onUpdateAbstractShape?: (id: string, updates: Partial<AbstractShapeCard>) => void;
  onDeleteAbstractShape?: (id: string) => void;
  onResetAbstractShapes?: () => void;
  onAddAcademicPoint?: (point: Omit<AcademicKeyPoint, 'id'>) => void;
  onUpdateAcademicPoint?: (id: string, updates: Partial<AcademicKeyPoint>) => void;
  onDeleteAcademicPoint?: (id: string) => void;
  onResetAcademicPoints?: () => void;
  onOpenSummary?: (techniqueId: string) => void;
}

type WorkoutCategory = 'major' | 'pao' | 'names' | 'pegs' | 'shapes' | 'academic';

export const WorkoutsHub: React.FC<WorkoutsHubProps> = ({
  majorDigits,
  majorItems,
  paoItems,
  shapePegs,
  bodyPegs,
  peopleCards,
  abstractShapes,
  academicPoints,
  onEarnPoints,
  onUnlockBadge,
  onUpdateMajorDigit,
  onResetMajorDigit,
  onRecalculateMajor00_99FromDigits,
  onAddMajorItem,
  onUpdateMajorItem,
  onDeleteMajorItem,
  onResetMajorItem,
  onAddPAOItem,
  onUpdatePAOItem,
  onDeletePAOItem,
  onResetPAOItem,
  onAddShapePeg,
  onUpdateShapePeg,
  onDeleteShapePeg,
  onResetShapePeg,
  onAddBodyPeg,
  onUpdateBodyPeg,
  onDeleteBodyPeg,
  onResetBodyPeg,
  onAddPersonFaceCard,
  onUpdatePersonFaceCard,
  onDeletePersonFaceCard,
  onResetPersonFaceCards,
  onAddAbstractShape,
  onUpdateAbstractShape,
  onDeleteAbstractShape,
  onResetAbstractShapes,
  onAddAcademicPoint,
  onUpdateAcademicPoint,
  onDeleteAcademicPoint,
  onResetAcademicPoints,
  onOpenSummary,
}) => {
  const [activeModule, setActiveModule] = useState<WorkoutCategory>('major');

  const modulesList = [
    {
      id: 'major' as const,
      title: '1. שיטת Major',
      subtitle: 'מספרים ועיצורים',
      icon: Hash,
      color: 'amber',
      count: majorItems.length,
    },
    {
      id: 'pao' as const,
      title: '2. שלשות PAO',
      subtitle: 'אדם - פעולה - חפץ',
      icon: User,
      color: 'indigo',
      count: paoItems.length,
    },
    {
      id: 'names' as const,
      title: '3. שמות ופנים',
      subtitle: 'עוגנים מורפולוגיים',
      icon: Smile,
      color: 'emerald',
      count: peopleCards.length,
    },
    {
      id: 'pegs' as const,
      title: '4. מתלי צורה וגוף',
      subtitle: 'Peg Systems',
      icon: Layers,
      color: 'yellow',
      count: shapePegs.length + bodyPegs.length,
    },
    {
      id: 'shapes' as const,
      title: '5. צורות ומרקמים',
      subtitle: 'פריידוליה מופשטת',
      icon: Sparkles,
      color: 'teal',
      count: abstractShapes.length,
    },
    {
      id: 'academic' as const,
      title: '6. חומרים אקדמיים',
      subtitle: 'מושגים ומאמרים',
      icon: BookOpen,
      color: 'indigo',
      count: academicPoints.length,
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Category Tabs Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {modulesList.map((m) => {
          const Icon = m.icon;
          const isActive = activeModule === m.id;

          return (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                isActive
                  ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                  {m.count}
                </span>
              </div>
              <div>
                <h3
                  className={`text-xs font-bold transition-colors ${
                    isActive ? 'text-amber-400' : 'text-white'
                  }`}
                >
                  {m.title}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{m.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* RENDER THE ACTIVE MODULE */}
      {activeModule === 'major' && (
        <MajorModule
          majorDigits={majorDigits}
          majorItems={majorItems}
          onEarnPoints={onEarnPoints}
          onUnlockBadge={onUnlockBadge}
          onUpdateMajorDigit={onUpdateMajorDigit}
          onResetMajorDigit={onResetMajorDigit}
          onRecalculateMajor00_99FromDigits={onRecalculateMajor00_99FromDigits}
          onAddMajorItem={onAddMajorItem}
          onUpdateMajorItem={onUpdateMajorItem}
          onDeleteMajorItem={onDeleteMajorItem}
          onResetMajorItem={onResetMajorItem}
          onOpenSummary={onOpenSummary}
        />
      )}

      {activeModule === 'pao' && (
        <PAOModule
          paoItems={paoItems}
          onEarnPoints={onEarnPoints}
          onUnlockBadge={onUnlockBadge}
          onAddPAOItem={onAddPAOItem}
          onUpdatePAOItem={onUpdatePAOItem}
          onDeletePAOItem={onDeletePAOItem}
          onResetPAOItem={onResetPAOItem}
          onOpenSummary={onOpenSummary}
        />
      )}

      {activeModule === 'names' && (
        <NamesFacesModule
          peopleCards={peopleCards}
          onEarnPoints={onEarnPoints}
          onUnlockBadge={onUnlockBadge}
          onAddPersonFaceCard={onAddPersonFaceCard}
          onUpdatePersonFaceCard={onUpdatePersonFaceCard}
          onDeletePersonFaceCard={onDeletePersonFaceCard}
          onResetPersonFaceCards={onResetPersonFaceCards}
          onOpenSummary={onOpenSummary}
        />
      )}

      {activeModule === 'pegs' && (
        <PegsModule
          shapePegs={shapePegs}
          bodyPegs={bodyPegs}
          onEarnPoints={onEarnPoints}
          onUnlockBadge={onUnlockBadge}
          onAddShapePeg={onAddShapePeg}
          onUpdateShapePeg={onUpdateShapePeg}
          onDeleteShapePeg={onDeleteShapePeg}
          onResetShapePeg={onResetShapePeg}
          onAddBodyPeg={onAddBodyPeg}
          onUpdateBodyPeg={onUpdateBodyPeg}
          onDeleteBodyPeg={onDeleteBodyPeg}
          onResetBodyPeg={onResetBodyPeg}
          onOpenSummary={onOpenSummary}
        />
      )}

      {activeModule === 'shapes' && (
        <ShapesModule
          abstractShapes={abstractShapes}
          onEarnPoints={onEarnPoints}
          onUnlockBadge={onUnlockBadge}
          onAddAbstractShape={onAddAbstractShape}
          onUpdateAbstractShape={onUpdateAbstractShape}
          onDeleteAbstractShape={onDeleteAbstractShape}
          onResetAbstractShapes={onResetAbstractShapes}
          onOpenSummary={onOpenSummary}
        />
      )}

      {activeModule === 'academic' && (
        <AcademicModule
          academicPoints={academicPoints}
          onEarnPoints={onEarnPoints}
          onUnlockBadge={onUnlockBadge}
          onAddAcademicPoint={onAddAcademicPoint}
          onUpdateAcademicPoint={onUpdateAcademicPoint}
          onDeleteAcademicPoint={onDeleteAcademicPoint}
          onResetAcademicPoints={onResetAcademicPoints}
          onOpenSummary={onOpenSummary}
        />
      )}
    </div>
  );
};

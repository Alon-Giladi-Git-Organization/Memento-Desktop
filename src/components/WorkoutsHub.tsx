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
  selectedSubModule?: WorkoutCategory;
  onSubModuleChange?: (module: WorkoutCategory) => void;
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

type WorkoutCategory = 'major' | 'pao' | 'names' | 'pegs' | 'academic';

export const WorkoutsHub: React.FC<WorkoutsHubProps> = ({
  selectedSubModule,
  onSubModuleChange,
  majorDigits,
  majorItems,
  paoItems,
  shapePegs,
  bodyPegs,
  peopleCards,
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
  onAddAcademicPoint,
  onUpdateAcademicPoint,
  onDeleteAcademicPoint,
  onResetAcademicPoints,
  onOpenSummary,
}) => {
  const [activeModule, setActiveModule] = useState<WorkoutCategory>(selectedSubModule || 'major');

  React.useEffect(() => {
    if (selectedSubModule && selectedSubModule !== activeModule) {
      setActiveModule(selectedSubModule);
    }
  }, [selectedSubModule]);

  const handleSelectModule = (mod: WorkoutCategory) => {
    setActiveModule(mod);
    onSubModuleChange?.(mod);
  };

  const modulesList = [
    {
      id: 'major' as const,
      title: '1. שיטת Major',
      subtitle: 'מספרים ועיצורים',
      icon: Hash,
      color: '#58CC02',
      bgActive: 'bg-[#58CC02]/10 border-[#58CC02] border-b-4 border-b-[#46a302] text-slate-900 shadow-sm',
      badgeBg: 'bg-[#58CC02]/20 text-[#2e6e01]',
      count: majorItems.length,
    },
    {
      id: 'pao' as const,
      title: '2. שיטת PAO',
      subtitle: 'אדם - פעולה - חפץ',
      icon: User,
      color: '#1CB0F6',
      bgActive: 'bg-[#1CB0F6]/10 border-[#1CB0F6] border-b-4 border-b-[#1899d6] text-slate-900 shadow-sm',
      badgeBg: 'bg-[#1CB0F6]/20 text-[#0d7bb0]',
      count: paoItems.length,
    },
    {
      id: 'names' as const,
      title: '3. שמות ופנים',
      subtitle: 'עוגנים מורפולוגיים',
      icon: Smile,
      color: '#FF9600',
      bgActive: 'bg-[#FF9600]/10 border-[#FF9600] border-b-4 border-b-[#e07e00] text-slate-900 shadow-sm',
      badgeBg: 'bg-[#FF9600]/20 text-[#b35900]',
      count: peopleCards.length,
    },
    {
      id: 'pegs' as const,
      title: '4. מתלי צורה וגוף',
      subtitle: 'Peg Systems',
      icon: Layers,
      color: '#FFC800',
      bgActive: 'bg-[#FFC800]/15 border-[#FFC800] border-b-4 border-b-[#d9a700] text-slate-900 shadow-sm',
      badgeBg: 'bg-[#FFC800]/30 text-[#8c6500]',
      count: shapePegs.length + bodyPegs.length,
    },
    {
      id: 'academic' as const,
      title: '5. חומרים אקדמיים',
      subtitle: 'מושגים ומאמרים',
      icon: BookOpen,
      color: '#FF4B4B',
      bgActive: 'bg-[#FF4B4B]/10 border-[#FF4B4B] border-b-4 border-b-[#ea2b2b] text-slate-900 shadow-sm',
      badgeBg: 'bg-[#FF4B4B]/20 text-[#b52424]',
      count: academicPoints.length,
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Category Tabs Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {modulesList.map((m) => {
          const Icon = m.icon;
          const isActive = activeModule === m.id;

          return (
            <button
              key={m.id}
              onClick={() => handleSelectModule(m.id)}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between cursor-pointer active:translate-y-0.5 ${
                isActive
                  ? m.bgActive
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 border-b-4 border-b-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform shadow-xs"
                  style={{
                    backgroundColor: isActive ? m.color : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#64748b',
                  }}
                >
                  <Icon className="w-5 h-5 font-black" />
                </div>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-black ${
                    isActive ? m.badgeBg : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {m.count}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {m.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                  {m.subtitle}
                </p>
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

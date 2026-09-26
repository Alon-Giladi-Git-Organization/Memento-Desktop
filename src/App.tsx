import React, { useState, useEffect } from 'react';
import { useMemoryStore } from './hooks/useMemoryStore';
import { Navbar, TabType } from './components/Navbar';
import { WorkoutsHub } from './components/WorkoutsHub';
import { PalacesManager } from './components/PalacesManager';
import { SmartAITester } from './components/SmartAITester';
import { AIFeedbackDashboard } from './components/AIFeedbackDashboard';
import { GamificationHub } from './components/GamificationHub';
import { AssociationRegistry } from './components/AssociationRegistry';
import { AIMentorChat } from './components/AIMentorChat';
import { TheorySection } from './components/TheorySection';
import { TechniqueSummaryModal } from './components/TechniqueSummaryModal';
import { GlobalAIMentorWidget } from './components/GlobalAIMentorWidget';
import { GlobalSearchModal } from './components/GlobalSearchModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('workouts');
  const [selectedWorkoutSubModule, setSelectedWorkoutSubModule] = useState<
    'major' | 'pao' | 'names' | 'pegs' | 'academic' | undefined
  >('major');
  const [activeSummaryTechnique, setActiveSummaryTechnique] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchNavigate = (tab: TabType, subModule?: string, itemId?: string | number) => {
    setCurrentTab(tab);
    if (tab === 'workouts' && subModule) {
      setSelectedWorkoutSubModule(subModule as any);
    }
    if (itemId !== undefined) {
      setTimeout(() => {
        const el =
          document.getElementById(`major-item-${itemId}`) ||
          document.getElementById(`pao-item-${itemId}`) ||
          document.getElementById(`locus-${itemId}`) ||
          document.getElementById(`palace-card-${itemId}`) ||
          document.getElementById(`person-card-${itemId}`) ||
          document.getElementById(`shape-peg-${itemId}`) ||
          document.getElementById(`body-peg-${itemId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
    }
  };

  const {
    currentUser,
    profile,
    leaderboard,
    dailyChallenge,
    feedbackReports,
    isAnalyzingFeedback,
    loginWithGoogle,
    logout,
    earnPoints,
    unlockBadge,
    completeDailyChallenge,
    generateFeedbackAnalysis,

    majorDigits,
    majorItems,
    paoItems,
    shapePegs,
    bodyPegs,
    palaces,
    peopleCards,
    abstractShapes,
    academicPoints,
    personalAssociations,
    testResults,
    chatMessages,

    updateMajorDigit,
    resetMajorDigit,
    recalculateMajor00_99FromDigits,
    addMajorItem,
    updateMajorItem,
    deleteMajorItem,
    resetMajorItem,
    addPAOItem,
    updatePAOItem,
    deletePAOItem,
    resetPAOItem,
    addShapePeg,
    updateShapePeg,
    deleteShapePeg,
    resetShapePeg,
    addBodyPeg,
    updateBodyPeg,
    deleteBodyPeg,
    resetBodyPeg,
    addPersonFaceCard,
    updatePersonFaceCard,
    deletePersonFaceCard,
    resetPersonFaceCards,
    addAbstractShape,
    updateAbstractShape,
    deleteAbstractShape,
    resetAbstractShapes,
    addAcademicPoint,
    updateAcademicPoint,
    deleteAcademicPoint,
    resetAcademicPoints,
    addPersonalAssociation,
    updatePersonalAssociation,
    deletePersonalAssociation,
    addMemoryPalace,
    deletePalace,
    addPalaceLocus,
    updatePalaceLocus,
    deletePalaceLocus,
    addTestResult,
    addChatMessage,
    resetToDefaults,
  } = useMemoryStore();

  const averageScore =
    testResults.length > 0
      ? Math.round(testResults.reduce((acc, t) => acc + t.score, 0) / testResults.length)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-900">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        savedAssociationsCount={personalAssociations.length}
        testCount={testResults.length}
        averageScore={averageScore}
        profile={profile}
        currentUser={currentUser}
        onLogin={loginWithGoogle}
        onLogout={logout}
        onResetDefaults={resetToDefaults}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {currentTab === 'workouts' && (
          <WorkoutsHub
            selectedSubModule={selectedWorkoutSubModule}
            onSubModuleChange={setSelectedWorkoutSubModule}
            majorDigits={majorDigits}
            majorItems={majorItems}
            paoItems={paoItems}
            shapePegs={shapePegs}
            bodyPegs={bodyPegs}
            peopleCards={peopleCards}
            abstractShapes={abstractShapes}
            academicPoints={academicPoints}
            onEarnPoints={earnPoints}
            onUnlockBadge={unlockBadge}
            onUpdateMajorDigit={updateMajorDigit}
            onResetMajorDigit={resetMajorDigit}
            onRecalculateMajor00_99FromDigits={recalculateMajor00_99FromDigits}
            onAddMajorItem={addMajorItem}
            onUpdateMajorItem={updateMajorItem}
            onDeleteMajorItem={deleteMajorItem}
            onResetMajorItem={resetMajorItem}
            onAddPAOItem={addPAOItem}
            onUpdatePAOItem={updatePAOItem}
            onDeletePAOItem={deletePAOItem}
            onResetPAOItem={resetPAOItem}
            onAddShapePeg={addShapePeg}
            onUpdateShapePeg={updateShapePeg}
            onDeleteShapePeg={deleteShapePeg}
            onResetShapePeg={resetShapePeg}
            onAddBodyPeg={addBodyPeg}
            onUpdateBodyPeg={updateBodyPeg}
            onDeleteBodyPeg={deleteBodyPeg}
            onResetBodyPeg={resetBodyPeg}
            onAddPersonFaceCard={addPersonFaceCard}
            onUpdatePersonFaceCard={updatePersonFaceCard}
            onDeletePersonFaceCard={deletePersonFaceCard}
            onResetPersonFaceCards={resetPersonFaceCards}
            onAddAbstractShape={addAbstractShape}
            onUpdateAbstractShape={updateAbstractShape}
            onDeleteAbstractShape={deleteAbstractShape}
            onResetAbstractShapes={resetAbstractShapes}
            onAddAcademicPoint={addAcademicPoint}
            onUpdateAcademicPoint={updateAcademicPoint}
            onDeleteAcademicPoint={deleteAcademicPoint}
            onResetAcademicPoints={resetAcademicPoints}
            onOpenSummary={(techId) => setActiveSummaryTechnique(techId)}
          />
        )}

        {currentTab === 'palaces' && (
          <PalacesManager
            palaces={palaces}
            onAddPalace={addMemoryPalace}
            onDeletePalace={deletePalace}
            onAddLocus={addPalaceLocus}
            onUpdateLocus={updatePalaceLocus}
            onDeleteLocus={deletePalaceLocus}
            onEarnPoints={earnPoints}
            onUnlockBadge={unlockBadge}
            isAuthenticated={!!currentUser}
            onOpenSummary={(techId) => setActiveSummaryTechnique(techId)}
          />
        )}

        {currentTab === 'tester' && (
          <SmartAITester
            majorItems={majorItems}
            paoItems={paoItems}
            peopleCards={peopleCards}
            personalAssociations={personalAssociations}
            palaces={palaces}
            testResults={testResults}
            onSaveTestResult={addTestResult}
          />
        )}

        {currentTab === 'feedback' && (
          <AIFeedbackDashboard
            feedbackReports={feedbackReports}
            isAnalyzing={isAnalyzingFeedback}
            onGenerateAnalysis={generateFeedbackAnalysis}
            testResults={testResults}
            profile={profile}
            onEarnPoints={earnPoints}
          />
        )}

        {currentTab === 'gamification' && (
          <GamificationHub
            currentUser={currentUser}
            profile={profile}
            leaderboard={leaderboard}
            dailyChallenge={dailyChallenge}
            onLogin={loginWithGoogle}
            onLogout={logout}
            onCompleteDailyChallenge={completeDailyChallenge}
            onEarnPoints={earnPoints}
            onUnlockBadge={unlockBadge}
          />
        )}

        {currentTab === 'registry' && (
          <AssociationRegistry
            associations={personalAssociations}
            onAddAssociation={addPersonalAssociation}
            onUpdateAssociation={updatePersonalAssociation}
            onDeleteAssociation={deletePersonalAssociation}
            onEarnPoints={earnPoints}
            isAuthenticated={!!currentUser}
          />
        )}

        {currentTab === 'mentor' && (
          <AIMentorChat
            messages={chatMessages}
            onSendMessage={addChatMessage}
            onEarnPoints={earnPoints}
          />
        )}

        {currentTab === 'theory' && <TheorySection />}
      </main>

      {/* Global AI Mentor Floating Widget */}
      <GlobalAIMentorWidget
        appContext={{
          majorDigitsCount: majorDigits.length,
          majorItemsCount: majorItems.length,
          paoItemsCount: paoItems.length,
          palacesCount: palaces.length,
          academicCount: academicPoints.length,
          contactsCount: peopleCards.length,
          recentPalaces: palaces.map((p) => ({ id: p.id, name: p.name, lociCount: p.loci.length })),
        }}
        onUpdateMajorItem={(num, updates) => updateMajorItem(num, updates)}
        onUpdatePAOItem={(num, updates) => updatePAOItem(num, updates)}
        onAddPalace={(name, desc) => addMemoryPalace(name, desc, 'custom')}
        onAddLocus={(palaceId, loc) =>
          addPalaceLocus(
            palaceId,
            loc.title,
            loc.roomName,
            loc.positionDescription || '',
            loc.mnemonicScene || '',
            loc.mnemonicScene || ''
          )
        }
        onAddAcademicPoint={(pt) => addAcademicPoint && addAcademicPoint(pt)}
        onAddAssociation={(asc) =>
          addPersonalAssociation(
            asc.targetSubject || asc.sourceKey || 'נושא חדש',
            asc.storedNumberOrFact || asc.targetValue || '',
            asc.encodedMnemonic || asc.mnemonicScene || '',
            asc.methodUsed || 'major'
          )
        }
        onEarnPoints={earnPoints}
      />

      {/* Technique Summary & Practical Examples Modal */}
      <TechniqueSummaryModal
        techniqueId={activeSummaryTechnique}
        isOpen={!!activeSummaryTechnique}
        onClose={() => setActiveSummaryTechnique(null)}
        onNavigateToTheory={() => {
          setActiveSummaryTechnique(null);
          setCurrentTab('theory');
        }}
      />

      {/* Global Universal Search Modal (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        majorItems={majorItems}
        paoItems={paoItems}
        peopleCards={peopleCards}
        palaces={palaces}
        shapePegs={shapePegs}
        bodyPegs={bodyPegs}
        academicPoints={academicPoints}
        onNavigate={handleSearchNavigate}
        onOpenSummary={(techId) => {
          setActiveSummaryTechnique(techId);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/90 py-6 text-center text-xs text-slate-500 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-slate-600">
            ממנטו (Memento) • מבוסס על מחקרי נובל 2014, פרופ' אלינור מגווייר (UCL) ותקן אלופי העולם בזיכרון (WMC)
          </p>
          <p className="text-slate-400">
            סנכרון ענן Firebase Firestore • אימות מאובטח ב-Google Auth • מנוע Gemini 3.8 Flash
          </p>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  Phone,
  Key,
  Calendar,
  Search,
  CheckCircle,
  Loader2,
  Cloud,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { PersonalContactAssociation } from '../types/memory';
import { AIFieldGeneratorButton } from './AIFieldGeneratorButton';

interface AssociationRegistryProps {
  associations: PersonalContactAssociation[];
  onAddAssociation: (
    subject: string,
    factOrNumber: string,
    mnemonic: string,
    method: 'major' | 'pao' | 'palace' | 'pegs' | 'link'
  ) => Promise<any>;
  onUpdateAssociation?: (id: string, updates: Partial<PersonalContactAssociation>) => void;
  onDeleteAssociation: (id: string) => Promise<void>;
  onEarnPoints: (amount: number, reason?: string) => void;
  isAuthenticated: boolean;
}

export const AssociationRegistry: React.FC<AssociationRegistryProps> = ({
  associations,
  onAddAssociation,
  onUpdateAssociation,
  onDeleteAssociation,
  onEarnPoints,
  isAuthenticated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editFactOrNumber, setEditFactOrNumber] = useState('');
  const [editMnemonic, setEditMnemonic] = useState('');
  const [editMethod, setEditMethod] = useState<'major' | 'pao' | 'palace' | 'pegs' | 'link'>('major');

  const [subject, setSubject] = useState('');
  const [factOrNumber, setFactOrNumber] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [method, setMethod] = useState<'major' | 'pao' | 'palace' | 'pegs' | 'link'>('major');

  const [isGeneratingMnemonic, setIsGeneratingMnemonic] = useState(false);

  const filtered = associations.filter(
    (item) =>
      item.targetSubject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storedNumberOrFact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.encodedMnemonic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAIMnemonicGenerate = async () => {
    if (!factOrNumber.trim()) return;
    setIsGeneratingMnemonic(true);
    try {
      const res = await fetch('/api/gemini/generate-mnemonic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: method === 'pao' ? 'number_pao' : 'number_major',
          input: factOrNumber,
          extra: `עבור: ${subject}`,
        }),
      });
      const data = await res.json();
      if (data.visualScene) {
        setMnemonic(data.visualScene);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingMnemonic(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !factOrNumber.trim() || !mnemonic.trim()) return;

    await onAddAssociation(subject.trim(), factOrNumber.trim(), mnemonic.trim(), method);
    setSubject('');
    setFactOrNumber('');
    setMnemonic('');
    setShowAddForm(false);
    onEarnPoints(25, 'הוספת אסוציאציה אישית');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 text-slate-900">
      {/* Header */}
      <div className="bg-white border-2 border-slate-200 border-b-6 border-b-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 text-cyan-800 px-3.5 py-1 rounded-full text-xs font-bold mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>פנקס האסוציאציות האישי • {associations.length} מקודדות</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              ארכיון האסוציאציות והקודים האישיים
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl font-medium">
              שמור מספרי טלפון חשובים, קודי אבטחה, מספרי תעודת זהות, כרטיסי אשראי ותאריכים עם
              הסצנה המנטלית המקודדת שלהם.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-black px-5 py-2.5 rounded-2xl shadow-sm text-xs transition-all cursor-pointer shadow-cyan-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>הוסף אסוציאציה חדשה</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש לפי שם, מספר או מילת מפתח בסצנה..."
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <div className="bg-white border-2 border-cyan-400 rounded-3xl p-6 sm:p-7 shadow-xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">קידוד אסוציאציה חדשה</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ביטול
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                נושא היעד (עבור מי/מה?):
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="למשל: הטלפון של דני, קוד דלת כניסה, יום נישואין"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                המספר או העובדה המקורית:
              </label>
              <input
                type="text"
                required
                value={factOrNumber}
                onChange={(e) => setFactOrNumber(e.target.value)}
                placeholder="למשל: 054-213988, 4821, 1492"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">שיטת קידוד:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'major', label: 'מערכת ה-Major בעברית' },
                  { id: 'pao', label: 'שלשת PAO (אדם-פעולה-חפץ)' },
                  { id: 'palace', label: 'תחנה בארמון זיכרון' },
                  { id: 'pegs', label: 'מתלי צורה / גוף' },
                  { id: 'link', label: 'שיטת הקישור הקינטי (Link)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 cursor-pointer transition-all ${
                      method === m.id
                        ? 'bg-cyan-50 text-cyan-800 border-cyan-400 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  הסצנה המנטלית המקודדת (תמונה ביזארית, קינטית, בלתי נשכחת):
                </label>
                <AIFieldGeneratorButton
                  promptType="custom_association"
                  inputContext={factOrNumber || subject}
                  extraContext={`שיטה: ${method}, עבור: ${subject}`}
                  onGenerated={(val) => setMnemonic(val)}
                  label="סצנה עם AI"
                  compact
                />
              </div>
              <textarea
                rows={2}
                required
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="למשל: סוס לבן דוהר ומתנגש בטירת ברקים אפלה, ומפיל סיר מרק רותח על..."
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs cursor-pointer active:scale-95"
              >
                שמור בפנקס
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Associations List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const isEditing = editingId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 rounded-2xl p-5 space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs text-slate-900"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-200">
                    {item.methodUsed.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (isEditing) {
                          setEditingId(null);
                        } else {
                          setEditingId(item.id);
                          setEditSubject(item.targetSubject);
                          setEditFactOrNumber(item.storedNumberOrFact);
                          setEditMnemonic(item.encodedMnemonic);
                          setEditMethod(item.methodUsed);
                        }
                      }}
                      className="text-slate-400 hover:text-cyan-600 p-1 transition-colors cursor-pointer"
                      title="ערוך אסוציאציה"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteAssociation(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                      title="מחק אסוציאציה"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-2 border-t border-slate-200 text-right">
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold mb-0.5">
                        נושא / יעד:
                      </label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (onUpdateAssociation) {
                              onUpdateAssociation(item.id, {
                                targetSubject: editSubject.trim(),
                                storedNumberOrFact: editFactOrNumber.trim(),
                                encodedMnemonic: editMnemonic.trim(),
                                methodUsed: editMethod,
                              });
                            }
                            setEditingId(null);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block font-semibold mb-0.5">
                        המספר או העובדה לזכירה:
                      </label>
                      <input
                        type="text"
                        value={editFactOrNumber}
                        onChange={(e) => setEditFactOrNumber(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (onUpdateAssociation) {
                              onUpdateAssociation(item.id, {
                                targetSubject: editSubject.trim(),
                                storedNumberOrFact: editFactOrNumber.trim(),
                                encodedMnemonic: editMnemonic.trim(),
                                methodUsed: editMethod,
                              });
                            }
                            setEditingId(null);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-amber-800 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] text-slate-500 font-semibold">
                          הסצנה המנמונית המקודדת:
                        </label>
                        <AIFieldGeneratorButton
                          promptType="custom_association"
                          inputContext={editFactOrNumber || editSubject}
                          extraContext={`שיטה: ${editMethod}, עבור: ${editSubject}`}
                          onGenerated={(val) => setEditMnemonic(val)}
                          label="סצנה עם AI"
                          compact
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={editMnemonic}
                        onChange={(e) => setEditMnemonic(e.target.value)}
                        placeholder="סצנה קינטית..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <span className="text-[9px] text-slate-400 font-mono">↵ Enter לשמירה</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-[11px] text-slate-500 px-2 py-1 cursor-pointer"
                        >
                          ביטול
                        </button>
                        <button
                          onClick={() => {
                            if (onUpdateAssociation) {
                              onUpdateAssociation(item.id, {
                                targetSubject: editSubject.trim(),
                                storedNumberOrFact: editFactOrNumber.trim(),
                                encodedMnemonic: editMnemonic.trim(),
                                methodUsed: editMethod,
                              });
                            }
                            setEditingId(null);
                          }}
                          className="flex items-center gap-1 text-[11px] bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-3 py-1 rounded-lg cursor-pointer"
                        >
                          <Save className="w-3 h-3" />
                          <span>שמור שינויים</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="text-base font-bold text-slate-900">{item.targetSubject}</h4>
                    <div className="font-mono text-sm font-black text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 inline-block">
                      {item.storedNumberOrFact}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium">
                      <span className="text-cyan-800 font-bold block mb-1">⚡ הסצנה המנמונית:</span>
                      "{item.encodedMnemonic}"
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

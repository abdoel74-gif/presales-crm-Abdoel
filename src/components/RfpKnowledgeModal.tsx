import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Search,
  Plus,
  Copy,
  Check,
  Tag,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { RfpKnowledgeItem, UserProfile } from '../types.ts';
import { AssetsTicketsService } from '../lib/assets-tickets-service.ts';

interface RfpKnowledgeModalProps {
  currentProfile?: UserProfile;
  onClose: () => void;
}

export const RfpKnowledgeModal: React.FC<RfpKnowledgeModalProps> = ({
  currentProfile,
  onClose,
}) => {
  const [items, setItems] = useState<RfpKnowledgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Q&A state
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('Compliance & Security');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newTags, setNewTags] = useState('Compliance, Presales');

  const loadData = async () => {
    const data = await AssetsTicketsService.getRfpKnowledgeItems(searchQuery, categoryFilter);
    setItems(data);
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, categoryFilter]);

  const handleCopy = (item: RfpKnowledgeItem) => {
    navigator.clipboard.writeText(item.answer);
    setCopiedId(item.id);
    AssetsTicketsService.incrementRfpUsage(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    await AssetsTicketsService.createRfpKnowledgeItem(
      {
        category: newCategory,
        question: newQuestion,
        answer: newAnswer,
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      },
      currentProfile
    );

    setIsAdding(false);
    setNewQuestion('');
    setNewAnswer('');
    loadData();
  };

  const categories = ['ALL', 'Compliance & Security', 'SLA & Support Model', 'Disaster Recovery & BCP', 'Network & Security', 'Cloud & Virtualization'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                RFP & Proposal Q&A Knowledge Base
              </h2>
              <p className="text-xs text-slate-400">
                Vetted architectural answers, regulatory compliance clauses, and standard SLA definitions for tender responses.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Action bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, ISO, UU PDP, SLA..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAdding ? 'Cancel' : 'Add New Q&A'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs">
          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
              <div className="font-bold text-indigo-900">Add Vetted Technical RFP Response</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    <option value="Compliance & Security">Compliance & Security</option>
                    <option value="SLA & Support Model">SLA & Support Model</option>
                    <option value="Disaster Recovery & BCP">Disaster Recovery & BCP</option>
                    <option value="Network & Security">Network & Security</option>
                    <option value="Cloud & Virtualization">Cloud & Virtualization</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g. ISO27001, Encryption"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">RFP Tender Question</label>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. Does the proposed architecture comply with OJK POJK No. 11/2022?"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Vetted Technical Answer</label>
                <textarea
                  rows={3}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Write clear, legally vetted technical response..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  Save to Knowledge Base
                </button>
              </div>
            </form>
          )}

          {/* List of items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-2.5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.code}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Confidence: {item.confidenceScore}%
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{item.question}</h3>
                  </div>

                  <button
                    onClick={() => handleCopy(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      copiedId === item.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Response
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 text-xs leading-relaxed font-normal">
                  {item.answer}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-2">
                    <span>Verified: {item.lastVerifiedBy}</span>
                    <span>•</span>
                    <span>Date: {item.lastVerifiedDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-indigo-600">Used in {item.usageCount || 1} tenders</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Total Verified Answers: {items.length}</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

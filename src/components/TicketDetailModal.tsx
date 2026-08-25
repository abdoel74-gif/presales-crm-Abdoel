import React, { useState } from 'react';
import {
  X,
  LifeBuoy,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Server,
  User,
  Send,
  MessageSquare,
  ShieldCheck,
  Tag,
  BookOpen,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { TechTicket, TicketStatus, TicketPriority, UserRole, UserProfile, RfpKnowledgeItem } from '../types.ts';
import { AssetsTicketsService } from '../lib/assets-tickets-service.ts';
import { INITIAL_RFP_KNOWLEDGE } from '../data/initialAssetsTicketsData.ts';

interface TicketDetailModalProps {
  ticket: TechTicket;
  currentRole: UserRole;
  currentProfile?: UserProfile;
  onClose: () => void;
  onRefresh: () => void;
  onSendWhatsAppAlert?: (phone: string, text: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  currentRole,
  currentProfile,
  onClose,
  onRefresh,
  onSendWhatsAppAlert,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Status Resolution State
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');

  // Knowledge Base Drawer
  const [isKbOpen, setIsKbOpen] = useState(false);
  const [kbSearch, setKbSearch] = useState('');
  const [kbItems, setKbItems] = useState<RfpKnowledgeItem[]>(INITIAL_RFP_KNOWLEDGE);

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'URGENT_24H':
        return 'bg-rose-500/15 text-rose-800 border-rose-400 font-bold animate-pulse';
      case 'HIGH_48H':
        return 'bg-amber-500/15 text-amber-800 border-amber-400 font-semibold';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'OPEN':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
      case 'PENDING_CUSTOMER':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    await AssetsTicketsService.addTicketComment(ticket.id, commentText, isInternalNote, currentProfile);
    setCommentText('');
    setIsSubmittingComment(false);
    onRefresh();

    // Trigger WhatsApp notification for urgent responses
    if (onSendWhatsAppAlert && !isInternalNote && ticket.reporterPhone) {
      onSendWhatsAppAlert(
        ticket.reporterPhone,
        `💬 [TICKET UPDATE] ${ticket.ticketNumber}: Engineer ${currentProfile?.name || 'Abdoel'} posted a reply on "${ticket.title}".`
      );
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (newStatus === 'RESOLVED') {
      setIsResolving(true);
      return;
    }

    await AssetsTicketsService.updateTicketStatus(ticket.id, newStatus, undefined, currentProfile);
    onRefresh();
  };

  const handleConfirmResolution = async () => {
    if (!resolutionSummary.trim()) return;
    await AssetsTicketsService.updateTicketStatus(ticket.id, 'RESOLVED', resolutionSummary, currentProfile);
    setIsResolving(false);
    setResolutionSummary('');
    onRefresh();
    if (onSendWhatsAppAlert && ticket.reporterPhone) {
      onSendWhatsAppAlert(
        ticket.reporterPhone,
        `✅ [TICKET RESOLVED] ${ticket.ticketNumber} (${ticket.title}) has been marked RESOLVED. Summary: ${resolutionSummary}`
      );
    }
  };

  const handleInsertKb = (kb: RfpKnowledgeItem) => {
    setCommentText((prev) => (prev ? `${prev}\n\n${kb.answer}` : kb.answer));
    AssetsTicketsService.incrementRfpUsage(kb.id);
    setIsKbOpen(false);
  };

  const filteredKb = kbItems.filter(
    (k) =>
      k.question.toLowerCase().includes(kbSearch.toLowerCase()) ||
      k.answer.toLowerCase().includes(kbSearch.toLowerCase()) ||
      k.category.toLowerCase().includes(kbSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {ticket.ticketNumber}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${getStatusBadge(ticket.status)}`}>
                  {ticket.status}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${getPriorityBadge(ticket.priority)}`}>
                  {ticket.priority.replace('_', ' ')}
                </span>
                {ticket.isSlaBreached && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold animate-pulse">
                    SLA BREACHED
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                {ticket.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Workflow Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Workflow State:</span>
            {ticket.status !== 'IN_PROGRESS' && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
              <button
                onClick={() => handleStatusChange('IN_PROGRESS')}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
              >
                Mark In Progress
              </button>
            )}

            {ticket.status !== 'PENDING_CUSTOMER' && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
              <button
                onClick={() => handleStatusChange('PENDING_CUSTOMER')}
                className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 font-medium hover:bg-amber-100"
              >
                Wait Customer Info
              </button>
            )}

            {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
              <button
                onClick={() => handleStatusChange('RESOLVED')}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
              >
                Resolve Ticket
              </button>
            )}

            {ticket.status === 'RESOLVED' && (
              <button
                onClick={() => handleStatusChange('CLOSED')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900"
              >
                Close Ticket
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsKbOpen(!isKbOpen)}
              className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              {isKbOpen ? 'Close RFP KB' : 'Insert from RFP Q&A Knowledge'}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Customer & Reporter</span>
              <div className="font-bold text-slate-900 text-sm truncate">{ticket.accountName}</div>
              <div className="text-xs text-slate-600 truncate">{ticket.reporterName}</div>
              <div className="text-[11px] text-indigo-600 truncate">{ticket.reporterEmail}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Assigned Engineer</span>
              <div className="font-bold text-slate-900 text-sm truncate">{ticket.assigneeName || 'Abdoel'}</div>
              <div className="text-xs text-indigo-600 font-medium">{ticket.assigneeRole || 'Solutions Architect'}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Linked Asset</span>
              <div className="font-bold text-slate-900 text-sm truncate">
                {ticket.assetName || 'General Infrastructure Inquiry'}
              </div>
              {ticket.assetTag && (
                <div className="font-mono text-xs text-indigo-700 font-bold">{ticket.assetTag}</div>
              )}
              {ticket.assetSerialNumber && (
                <div className="font-mono text-[11px] text-slate-500 truncate">S/N: {ticket.assetSerialNumber}</div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">SLA Target & Response</span>
              <div className="font-bold text-slate-900 text-sm">{ticket.slaHours} Hours SLA</div>
              <div className="text-xs text-slate-500">Target: {new Date(ticket.slaDueDate).toLocaleString()}</div>
              {ticket.responseSlaMinutes && (
                <div className="text-[11px] text-emerald-600 font-semibold">1st Response: {ticket.responseSlaMinutes} min</div>
              )}
            </div>
          </div>

          {/* Ticket Description */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Incident / Request Scope
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60 whitespace-pre-wrap">
              {ticket.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {ticket.tags.map((tag, idx) => (
                <span key={idx} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Resolution Box if resolved */}
          {ticket.resolutionSummary && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Official Resolution Summary</h4>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed font-medium bg-white p-3 rounded-lg border border-emerald-100">
                {ticket.resolutionSummary}
              </p>
              {ticket.resolvedAt && (
                <div className="text-[11px] text-emerald-700">Resolved on: {new Date(ticket.resolvedAt).toLocaleString()}</div>
              )}
            </div>
          )}

          {/* Resolve Ticket Modal Form */}
          {isResolving && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900">Document Resolution Notes</span>
                <button onClick={() => setIsResolving(false)} className="text-slate-400 hover:text-slate-600 text-xs">
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Root Cause Analysis & Corrective Steps Performed <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="e.g. Replaced faulty PSU module, verified optical transceiver light levels (-3.2 dBm), and confirmed zero packet drops over 1-hour stress test."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleConfirmResolution}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  Submit & Resolve Ticket
                </button>
              </div>
            </div>
          )}

          {/* RFP Knowledge Base Quick Drawer */}
          {isKbOpen && (
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-indigo-900 uppercase tracking-wider">
                    RFP Q&A Knowledge Base (Standard Responses)
                  </span>
                </div>
                <input
                  type="text"
                  value={kbSearch}
                  onChange={(e) => setKbSearch(e.target.value)}
                  placeholder="Search compliance, SLAs, DR, networking..."
                  className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-white text-xs w-64"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredKb.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-white border border-indigo-100 space-y-1 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{item.question}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-semibold">{item.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{item.answer}</p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleInsertKb(item)}
                        className="px-2.5 py-1 rounded bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Insert Answer into Response
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments & Activity Timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Discussion Thread & Activity Logs ({ticket.comments.length})
            </h3>

            <div className="space-y-3">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    comment.isInternalNote
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{comment.authorName}</span>
                      <span className="text-[11px] text-slate-500">({comment.authorRole})</span>
                      {comment.isInternalNote && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-200 text-amber-900 font-bold uppercase">
                          Internal Engineering Note
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {comment.message}
                  </p>
                </div>
              ))}
            </div>

            {/* Comment Input Box */}
            <form onSubmit={handleAddComment} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Post Response or Engineering Note</span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-medium text-amber-800">Internal Engineering Note (Hidden from Customer)</span>
                </label>
              </div>

              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={isInternalNote ? "Write private diagnostics or vendor TAC case updates..." : "Write official response to customer SPOC..."}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingComment ? 'Posting...' : isInternalNote ? 'Post Internal Note' : 'Post Reply to Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Opened: {new Date(ticket.createdAt).toLocaleString()}</div>
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

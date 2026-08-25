import React, { useState } from 'react';
import { X, Send, Radio, CheckCheck, RefreshCw, ShieldCheck, PhoneCall } from 'lucide-react';
import { WhatsAppNotification } from '../types.ts';

interface WhatsAppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: WhatsAppNotification[];
  onSendTestNotification: (phone: string, text: string) => void;
}

export const WhatsAppDrawer: React.FC<WhatsAppDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onSendTestNotification,
}) => {
  const [testPhone, setTestPhone] = useState('+62 812-9900-1122');
  const [testMessage, setTestMessage] = useState('🔔 [PRESALES ALERT] Sizing for Bank Mandiri has been completed. BOQ Ready.');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;
    onSendTestNotification(testPhone, testMessage);
    setTestMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-tight">WhatsApp Business Gateway</div>
              <div className="text-[10px] text-emerald-300">Webhook Status: 200 OK (HMAC Verified)</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gateway Info Bar */}
        <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Webhook API v20.0</span>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-800 font-semibold">
            Port 3000 Ingress
          </span>
        </div>

        {/* Live Stream Logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Trigger Dispatches
          </div>

          <div className="space-y-2.5">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-slate-800 font-semibold">
                  <span>{notif.recipientName}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{notif.timestamp}</span>
                </div>
                <div className="text-slate-600 leading-relaxed text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                  {notif.messagePreview}
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                  <span>{notif.recipientPhone}</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{notif.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Test Dispatcher */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs font-bold text-slate-800 mb-2">Send WhatsApp Simulator Alert</div>
          <form onSubmit={handleSend} className="space-y-2.5">
            <input
              type="text"
              placeholder="Recipient Phone (+62...)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
            />
            <textarea
              rows={2}
              placeholder="Notification payload..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simulate Webhook Trigger</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

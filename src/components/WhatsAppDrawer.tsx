import React, { useState } from 'react';
import { X, Send, Radio, CheckCheck, RefreshCw, ShieldCheck, ExternalLink } from 'lucide-react';
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
  const [phone, setPhone] = useState('6281234567890');
  const [message, setMessage] = useState('🔔 [PRESALES ALERT] Sizing for Bank Mandiri has been completed. BOQ Ready.');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !message.trim()) {
      setStatus('⚠️ Nomor dan pesan tidak boleh kosong.');
      return;
    }

    setLoading(true);
    setStatus(null);

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    else if (cleanPhone.startsWith('8')) cleanPhone = '62' + cleanPhone;

    setTimeout(() => {
      onSendTestNotification(`+${cleanPhone}`, message);
      setLoading(false);
      setStatus(`✅ Pesan terkirim ke +${cleanPhone}`);
      setMessage('');
    }, 500);
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

        {/* Interactive Test Dispatcher Form */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor WhatsApp Tujuan (Format: 628xxx)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 6281234567890"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pesan / Notifikasi</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis pesan Anda di sini..."
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 text-xs flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <span>Kirim Pesan WhatsApp Sekarang</span>
              )}
            </button>
          </form>

          {status && (
            <div className="mt-3 p-2.5 bg-gray-100 rounded-lg text-xs text-gray-700 border border-gray-200">
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

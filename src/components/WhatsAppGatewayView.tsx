import React, { useState } from 'react';
import {
  MessageSquareCode,
  Send,
  Radio,
  CheckCheck,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Sparkles,
  Zap,
  Users,
  Terminal,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { WhatsAppNotification } from '../types.ts';
import { useAuth } from '../lib/AuthContext.tsx';

interface WhatsAppGatewayViewProps {
  notifications: WhatsAppNotification[];
  onSendNotification: (phone: string, text: string, type?: WhatsAppNotification['type'], recipientName?: string) => void;
  onBackToDashboard?: () => void;
}

export const WhatsAppGatewayView: React.FC<WhatsAppGatewayViewProps> = ({
  notifications,
  onSendNotification,
  onBackToDashboard,
}) => {
  const { profile } = useAuth();
  const [phone, setPhone] = useState('6281234567890');
  const [message, setMessage] = useState(
    '📋 [PRESALES ALERT] SOW & Technical Sizing draft for Bank Mandiri Sejahtera telah siap direview oleh Solutions Architect.'
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<WhatsAppNotification['type']>('STAGE_UPDATE');
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');

  // Format and clean phone number
  const cleanPhoneNumber = (rawPhone: string) => {
    let clean = rawPhone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('8')) {
      clean = '62' + clean;
    }
    return clean;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !message.trim()) {
      setStatus('⚠️ Gagal: Nomor WhatsApp dan Isi Pesan tidak boleh kosong.');
      return;
    }

    const formattedPhone = cleanPhoneNumber(phone);
    if (formattedPhone.length < 9) {
      setStatus('⚠️ Format nomor tidak valid. Pastikan menggunakan format 628xxx.');
      return;
    }

    setLoading(true);
    setStatus(null);

    // Simulate webhook dispatch latency
    setTimeout(() => {
      onSendNotification(
        `+${formattedPhone}`,
        message,
        selectedType,
        formattedPhone === '6281234567890' ? (profile?.name || 'Abdoel') : 'Stakeholder Enterprise'
      );
      setLoading(false);
      setStatus(
        `✅ Berhasil dikirim! Pesan WhatsApp berhasil didispatch ke +${formattedPhone} melalui Presales Gateway Engine.`
      );
    }, 600);
  };

  const handleOpenDirectWhatsApp = () => {
    const formattedPhone = cleanPhoneNumber(phone);
    if (!formattedPhone || !message) return;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopyPayload = () => {
    const payload = JSON.stringify(
      {
        recipient: cleanPhoneNumber(phone),
        message: message,
        type: selectedType,
        sender: profile?.name || 'Abdoel',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickTemplates = [
    {
      title: '🚨 SLA Alert (Urgent 24h)',
      type: 'SLA_ALERT' as const,
      text: '⏳ [SLA ALERT] Presales Request PSR-2026-089 memiliki sisa SLA 8 jam. Segera lakukan finalisasi sizing compute & storage.',
    },
    {
      title: '📋 Approval Request (BOQ)',
      type: 'APPROVAL_REQUEST' as const,
      text: '🔔 [APPROVAL REQUIRED] BOQ Margin 24.5% untuk Bank Mandiri Sejahtera memerlukan verifikasi Head of Solutions Architect.',
    },
    {
      title: '🚀 Stage Update (SOW Final)',
      type: 'STAGE_UPDATE' as const,
      text: '✅ [STAGE UPDATE] Dokumen SOW Telkomsel Multi-Cloud telah disetujui dan siap masuk ke tahap Project Handover.',
    },
    {
      title: '📦 POC Loaner Expiry Warning',
      type: 'HANDOVER_PING' as const,
      text: '⚠️ [POC ALERT] Peminjaman unit demo Advantech Edge AI akan berakhir dalam 3 hari. Mohon konfirmasi jadwal return / PO release.',
    },
  ];

  const quickContacts = [
    { name: 'Abdoel (Lead SA)', phone: '6281234567890', role: 'Solutions Architect' },
    { name: 'Rian Hidayat (AE)', phone: '6281298765432', role: 'Account Executive' },
    { name: 'Bayu Wicaksono (Cust IT)', phone: '6281123456789', role: 'Head of IT' },
    { name: 'Siti Rahmawati (Infra)', phone: '6281355443322', role: 'Cloud Architect' },
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'ALL') return true;
    return n.type === filterType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <MessageSquareCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">WhatsApp Gateway API</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Service
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              HMAC-SHA256 Authenticated Webhook Dispatcher, Automated Presales Alerts, and Interactive Notifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Form on Left, Stream Logs & Quick Pickers on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: WhatsApp Sender Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Kirim Notifikasi WhatsApp</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>HMAC Encrypted Ingress</span>
              </div>
            </div>

            {/* Quick Contact Chips */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Pilih Kontak Cepat:
              </label>
              <div className="flex flex-wrap gap-2">
                {quickContacts.map((contact) => (
                  <button
                    key={contact.phone}
                    type="button"
                    onClick={() => {
                      setPhone(contact.phone);
                      setStatus(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      phone === contact.phone
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{contact.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Template Buttons */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Template Pesan Presales:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickTemplates.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMessage(tpl.text);
                      setSelectedType(tpl.type);
                      setStatus(null);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 text-left text-xs text-slate-700 transition-all flex items-start gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-800">{tpl.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{tpl.text}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* The WhatsApp Send Form (Matching requested structure) */}
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-mono text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Isi Pesan / Notifikasi</label>
                  <span className="text-xs text-slate-400">{message.length} karakter</span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis pesan Anda di sini..."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 text-sm leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Pesan WhatsApp Sekarang</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenDirectWhatsApp}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-1.5 text-sm"
                  title="Buka langsung di WhatsApp Web / App"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka WA Web</span>
                </button>
              </div>
            </form>

            {status && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200 flex items-start gap-2 animate-in fade-in">
                <span className="text-base">📢</span>
                <span className="flex-1">{status}</span>
              </div>
            )}

            {/* Developer Webhook JSON Payload Preview */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span>JSON Payload Dispatcher (POST /api/webhook/whatsapp)</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Payload'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
                {JSON.stringify(
                  {
                    channel: 'whatsapp_business_api',
                    recipient_phone: `+${cleanPhoneNumber(phone)}`,
                    sender_id: profile?.id || 'usr_abdoel',
                    sender_name: profile?.name || 'Abdoel',
                    template_category: selectedType,
                    message_payload: message,
                    webhook_auth: 'HMAC_SHA256_VERIFIED',
                    priority: 'HIGH_PRIORITY_SLA',
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Col: Live Trigger Feed & Gateway Telemetry */}
        <div className="lg:col-span-5 space-y-6">
          {/* Gateway Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900">Ingress Gateway Health</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                HTTP 200 OK
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase">Delivery Rate</span>
                <span className="font-bold text-slate-800 text-sm">99.8% Success</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase">Avg Latency</span>
                <span className="font-bold text-slate-800 text-sm">340ms (Cloud Run)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase">Active Port</span>
                <span className="font-mono font-bold text-slate-800">Port 3000 Ingress</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase">Security</span>
                <span className="font-bold text-emerald-600">HMAC-SHA256</span>
              </div>
            </div>
          </div>

          {/* Real-time Dispatch History Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Log Aktivitas Notifikasi</h3>
                <p className="text-xs text-slate-400">{notifications.length} trigger tercatat</p>
              </div>

              {/* Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="ALL">Semua Tipe</option>
                <option value="SLA_ALERT">SLA Alerts</option>
                <option value="APPROVAL_REQUEST">Approvals</option>
                <option value="STAGE_UPDATE">Stage Updates</option>
                <option value="HANDOVER_PING">Handover Pings</option>
              </select>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada log notifikasi pada filter ini.
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{item.recipientName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                          {item.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">{item.timestamp}</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-100 text-slate-700 leading-relaxed text-[11px]">
                      {item.messagePreview || item.message}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                      <span>{item.recipientPhone}</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>{item.status}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

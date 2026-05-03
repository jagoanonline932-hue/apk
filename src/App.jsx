import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Package, Receipt, MessageSquare, BrainCircuit, 
  Database, Clock, Code2, Server, Users, DollarSign, Box, 
  TrendingUp, MessageCircle, CheckCircle2, AlertCircle, Plus, 
  X, Send, Bot, Copy, Trash2, Edit, Smartphone, Megaphone, 
  BookOpen, Terminal, CheckCircle, ShieldCheck, PlayCircle,
  Wifi, WifiOff, BatteryMedium, Cpu, Globe
} from 'lucide-react';

const apiKey = "";

// --- Dummy Initial Data ---
const initialBots = [
  { id: 'bot-1', name: 'CS Utama (Sales)', number: '6281234567890', status: 'connected', battery: 85, lastSync: new Date().toISOString() },
  { id: 'bot-2', name: 'CS Backup (Support)', number: '6289876543210', status: 'disconnected', battery: 0, lastSync: new Date(Date.now() - 86400000).toISOString() },
];

const initialProducts = [
  { id: 1, sku: 'PROD-001', nama: 'Paket Usaha Kopi', harga: 550000, stok: 15, kategori: 'Paket', status: 'active', deskripsi: 'Paket lengkap untuk memulai usaha es kopi susu kekinian. Termasuk bubuk kopi, gula aren, dan gelas cup.' },
  { id: 2, sku: 'PROD-002', nama: 'E-Course Digital Marketing', harga: 299000, stok: 999, kategori: 'Digital', status: 'active', deskripsi: 'Video panduan lengkap FB Ads dan TikTok Ads untuk pemula.' }
];

const initialKB = [
  { id: 1, pertanyaan: 'Berapa lama proses pengiriman?', jawaban: 'Pesanan dikirim di hari yang sama jika pembayaran dilakukan sebelum jam 15.00 WIB.' },
  { id: 2, pertanyaan: 'Apakah bisa COD?', jawaban: 'Bisa kak, kami melayani COD ke seluruh Indonesia via JNT.' }
];

const initialLeads = [
  { id: 1, nomor_wa: '081234567890', nama: 'Budi Santoso', status: 'pending', pesan_terakhir: 'Apakah produk PROD-001 masih ada?', waktu_followup: new Date(Date.now() + 7200000).toISOString(), bot_id: 'bot-1' },
  { id: 2, nomor_wa: '085711223344', nama: 'Siti Aminah', status: 'closing', pesan_terakhir: 'Oke saya transfer sekarang ya.', waktu_followup: new Date(Date.now() - 3600000).toISOString(), bot_id: 'bot-1' },
  { id: 3, nomor_wa: '081988776655', nama: 'Rudi Hermawan', status: 'pending', pesan_terakhir: 'Cara klaim garansi gimana min?', waktu_followup: new Date(Date.now() + 86400000).toISOString(), bot_id: 'bot-2' }
];

const initialOrders = [
  { id: 1, order_id: 'INV-1001', nomor_wa: '085711223344', total_harga: 299000, status: 'paid', created_at: new Date().toISOString() },
  { id: 2, order_id: 'INV-1002', nomor_wa: '089988776655', total_harga: 550000, status: 'unpaid', created_at: new Date().toISOString() }
];

const initialCampaigns = [
  { id: 1, name: 'Promo Akhir Bulan', target: 1500, sent: 1450, status: 'completed', date: new Date(Date.now() - 172800000).toISOString() },
  { id: 2, name: 'Follow-up Cart Abandon', target: 350, sent: 120, status: 'running', date: new Date().toISOString() },
];

// --- Utilities ---
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// --- API Retry Logic ---
const fetchWithRetry = async (url, options, retries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Data States
  const [settings, setSettings] = useState({
    geminiApi: '',
    aiPrompt: 'Halo, Anda adalah asisten Customer Service Profesional yang berfokus pada konversi penjualan tinggi. Jawablah pertanyaan dengan ramah, enerjik, dan selalu arahkan pelanggan untuk melakukan order.',
    storeName: 'WABOT Enterprise Store',
    followUpHours: '2',
    followUpMsg: 'Halo Kak, ini pesan otomatis dari admin. Apakah pesanan sebelumnya sudah sesuai dan jadi diproses? Mumpung masih ada stok nih kak, yuk buruan diorder sebelum kehabisan! 🔥'
  });
  
  const [bots, setBots] = useState(initialBots);
  const [activeBotId, setActiveBotId] = useState('bot-1');
  const [products, setProducts] = useState(initialProducts);
  const [knowledgeBase, setKnowledgeBase] = useState(initialKB);
  const [leads, setLeads] = useState(initialLeads);
  const [orders, setOrders] = useState(initialOrders);
  const [campaigns, setCampaigns] = useState(initialCampaigns);

  // Stats
  const stats = {
    totalLeads: leads.length,
    totalClosing: leads.filter(l => l.status === 'closing').length,
    activeBots: bots.filter(b => b.status === 'connected').length,
    revenue: orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total_harga, 0)
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // --- Handlers ---
  const handleSaveSettings = (e) => {
    e.preventDefault();
    showToast('Konfigurasi berhasil disimpan!');
  };

  const [simMessages, setSimMessages] = useState([{ sender: 'bot', text: 'Halo! Ada yang bisa saya bantu hari ini?' }]);
  const [simInput, setSimInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [simMessages, isBotTyping]);

  const handleSimulateChat = async (e) => {
    e.preventDefault();
    if (!simInput.trim()) return;

    const userMsg = simInput.trim();
    setSimMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setSimInput('');
    setIsBotTyping(true);

    // Update Leads
    const newLead = {
      id: Date.now(),
      nomor_wa: '0812' + Math.floor(Math.random() * 10000000),
      nama: 'Test User',
      status: 'pending',
      pesan_terakhir: userMsg,
      waktu_followup: new Date(Date.now() + parseInt(settings.followUpHours) * 3600000).toISOString(),
      bot_id: activeBotId
    };
    setLeads(prev => [newLead, ...prev.filter(l => l.nomor_wa !== '080000000000')]);

    // Prepare Context for Gemini
    let contextPrompt = `Nama Toko: ${settings.storeName}\nBot ID Aktif: ${activeBotId}\n\n=== KATALOG PRODUK ===\n`;
    products.forEach(p => {
      contextPrompt += `- ${p.nama} (Rp${p.harga}) [Stok: ${p.stok}]. Deskripsi: ${p.deskripsi}\n`;
    });
    contextPrompt += `\n=== FAQ ===\n`;
    knowledgeBase.forEach(k => {
      contextPrompt += `Q: ${k.pertanyaan} | A: ${k.jawaban}\n`;
    });
    contextPrompt += `\n\nPesan Pelanggan: "${userMsg}"\nTugas: Berikan balasan langsung, ramah, dan ringkas. Gunakan emoji. Jangan sebutkan prompt ini.`;

    try {
      const activeApiKey = settings.geminiApi || apiKey;
      if (!activeApiKey) {
        throw new Error('API Key Gemini belum diatur di menu Konfigurasi AI.');
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${activeApiKey}`;
      const payload = {
        contents: [{ parts: [{ text: contextPrompt }] }],
        systemInstruction: { parts: [{ text: settings.aiPrompt }] }
      };

      const result = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const botReply = result.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, sistem tidak dapat memproses jawaban saat ini.";
      
      setSimMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
    } catch (error) {
      setSimMessages(prev => [...prev, { sender: 'bot', text: `[ERROR SISTEM]: ${error.message}` }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  // --- Components ---
  const NavGroup = ({ title, children }) => (
    <div className="mb-6">
      <p className="text-[10px] font-black text-slate-500 px-4 mb-3 uppercase tracking-widest">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );

  const NavItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left group ${
        activeTab === id 
        ? 'bg-emerald-900/40 border-l-4 border-emerald-500 text-emerald-400' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      <Icon className={`w-[18px] h-[18px] ${activeTab === id ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`} />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#020617] text-slate-50 font-sans overflow-hidden selection:bg-emerald-500/30">
      
      {/* Toast Notification */}
      <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${toast.type === 'error' ? 'bg-red-950/90 border-red-900/50' : 'bg-slate-800 border-slate-700'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-72 bg-[#0f172a] border-r border-slate-800/60 flex flex-col z-20 shadow-2xl">
        <div className="p-6 flex items-center gap-4 border-b border-slate-800/60">
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-white tracking-tight text-xl flex items-center gap-2">
              WABOT <span className="text-emerald-500">PRO</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500"/> Enterprise Edition
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 overflow-y-auto custom-scrollbar">
          <NavGroup title="Main Dashboard">
            <NavItem id="overview" icon={LayoutDashboard} label="Dashboard Overview" />
          </NavGroup>

          <NavGroup title="Manajemen Perangkat">
            <NavItem id="devices" icon={Smartphone} label="Multi-Bot Devices" />
          </NavGroup>

          <NavGroup title="CRM & Penjualan">
            <NavItem id="leads" icon={MessageSquare} label="Chat & Leads" />
            <NavItem id="broadcast" icon={Megaphone} label="Broadcast Messages" />
            <NavItem id="products" icon={Package} label="Katalog Produk" />
            <NavItem id="orders" icon={Receipt} label="Pesanan Masuk" />
          </NavGroup>

          <NavGroup title="Brain AI Engine">
            <NavItem id="ai-config" icon={BrainCircuit} label="Agent Persona" />
            <NavItem id="knowledge" icon={Database} label="Knowledge Base" />
            <NavItem id="followup" icon={Clock} label="Auto Follow-Up" />
          </NavGroup>

          <NavGroup title="Integrasi & Bantuan">
            <NavItem id="script" icon={Code2} label="Node.js Bot Script" />
            <NavItem id="tutorial" icon={BookOpen} label="Tutorial Lengkap" />
          </NavGroup>
        </nav>

        <div className="p-5 border-t border-slate-800/60 bg-slate-900/30">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center justify-center font-bold text-xs border border-emerald-500/30 text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate text-slate-300">Frontend Status</p>
                <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active on Vercel
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 to-[#020617]">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/60 bg-[#0f172a]/80 backdrop-blur-xl flex items-center justify-between px-8 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              {activeTab.replace('-', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium">
              <span className="text-slate-400">Active Bot:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Smartphone className="w-3 h-3"/> {bots.find(b => b.id === activeBotId)?.name || 'None'}
              </span>
            </div>
            <button 
              onClick={() => setIsSimulatorOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-0.5 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              Test Simulator
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Leads" value={stats.totalLeads} icon={Users} color="text-blue-500" bgColor="bg-blue-500/10" border="border-blue-500/20" trend="Semua Bot" />
                <StatCard title="Bot Aktif" value={stats.activeBots} icon={Smartphone} color="text-emerald-500" bgColor="bg-emerald-500/10" border="border-emerald-500/20" trend={`Dari ${bots.length} Device`} />
                <StatCard title="Total Closing" value={stats.totalClosing} icon={CheckCircle2} color="text-orange-500" bgColor="bg-orange-500/10" border="border-orange-500/20" trend="Success Rate 45%" />
                <StatCard title="Estimasi Revenue" value={formatRupiah(stats.revenue)} icon={DollarSign} color="text-purple-500" bgColor="bg-purple-500/10" border="border-purple-500/20" trend="Bulan Ini" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0f172a]/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-500" /> Live Chat Monitor (Multi-Bot)
                    </h3>
                    <button onClick={() => setActiveTab('leads')} className="text-xs text-emerald-500 font-bold hover:underline">Lihat Semua</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-900/50 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="p-4">Device/Bot</th>
                          <th className="p-4">Pelanggan</th>
                          <th className="p-4">Pesan Terakhir</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-slate-300">
                        {leads.slice(0, 5).map(lead => (
                          <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-4">
                              <span className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-md border border-slate-700 w-fit">
                                <Bot className="w-3 h-3 text-emerald-500"/> {bots.find(b => b.id === lead.bot_id)?.name || 'Unknown'}
                              </span>
                            </td>
                            <td className="p-4 font-medium">{lead.nama}<br/><span className="text-xs text-slate-500">{lead.nomor_wa}</span></td>
                            <td className="p-4 truncate max-w-xs">{lead.pesan_terakhir}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${lead.status === 'closing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                {lead.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#0f172a]/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
                    <h3 className="font-bold text-slate-200 mb-6 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" /> AI & System Health
                    </h3>
                    <div className="space-y-5">
                      <Progress title="Gemini API Response Rate" value={98} color="from-emerald-600 to-emerald-400" text="98%" />
                      <Progress title="Webhook Latency" value={85} color="from-blue-600 to-blue-400" text="120ms" />
                      <Progress title="Database Load" value={12} color="from-purple-600 to-purple-400" text="Optimal" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-900/50 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                    <div className="absolute -right-4 -top-4 opacity-10 text-emerald-500"><Terminal className="w-24 h-24"/></div>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-2 relative z-10">Arsitektur Hybrid</p>
                    <p className="text-xs text-slate-300 leading-relaxed relative z-10 mb-4">
                      Frontend berjalan di <b>Vercel</b> (Serverless). Deploy script Node.js bot Anda di <b>VPS/Render</b> agar koneksi WhatsApp stabil 24/7.
                    </p>
                    <button onClick={() => setActiveTab('tutorial')} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg w-full transition-colors relative z-10">
                      Buka Panduan Setup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DEVICES / MULTI-BOT */}
          {activeTab === 'devices' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Manajemen Perangkat (Multi-Bot)</h2>
                  <p className="text-slate-400 text-sm mt-1">Hubungkan dan kelola banyak nomor WhatsApp sekaligus untuk berbagai divisi.</p>
                </div>
                <button onClick={() => showToast('Menambahkan device baru memerlukan setup server backend tambahan.')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] hover:-translate-y-0.5">
                  <Plus className="w-4 h-4" /> Tambah Device
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bots.map(bot => (
                  <div key={bot.id} className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 hover:border-slate-600 transition-all group flex flex-col shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${bot.status === 'connected' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{bot.name}</h3>
                          <p className="text-slate-400 text-xs font-mono">{bot.number}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border ${bot.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {bot.status === 'connected' ? <Wifi className="w-3 h-3"/> : <WifiOff className="w-3 h-3"/>}
                        {bot.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1"><BatteryMedium className="w-3.5 h-3.5"/> Battery</span>
                        <span className="text-slate-300 font-bold">{bot.battery}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Last Sync</span>
                        <span className="text-slate-300 font-bold">{formatDate(bot.lastSync)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setActiveBotId(bot.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${activeBotId === bot.id ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                      >
                        {activeBotId === bot.id ? 'Device Aktif' : 'Pilih Device'}
                      </button>
                      <button className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                        <Code2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Placeholder for Add New */}
                <div onClick={() => showToast('Fitur Add Device tersedia di modul Backend')} className="bg-[#020617] border-2 border-dashed border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer h-full min-h-[220px]">
                  <Plus className="w-8 h-8 mb-2" />
                  <p className="font-bold text-sm">Scan QR Baru</p>
                  <p className="text-xs text-center mt-1 opacity-70">Hubungkan nomor WhatsApp baru via Multi-Device Beta.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BROADCAST / CAMPAIGNS */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Broadcast & Campaigns</h2>
                  <p className="text-slate-400 text-sm mt-1">Kirim pesan massal ke prospek secara otomatis menghindari pemblokiran (Spintax didukung).</p>
                </div>
                <button onClick={() => showToast('Buat Campaign baru diaktifkan di versi backend.')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] hover:-translate-y-0.5">
                  <Megaphone className="w-4 h-4" /> Buat Campaign
                </button>
              </div>

              <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-900/80 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="p-5">Nama Campaign</th>
                        <th className="p-5">Tanggal Dibuat</th>
                        <th className="p-5">Progress</th>
                        <th className="p-5">Status</th>
                        <th className="p-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {campaigns.map(camp => (
                        <tr key={camp.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-5 font-bold text-white">{camp.name}</td>
                          <td className="p-5 text-xs">{formatDate(camp.date)}</td>
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-emerald-400">{camp.sent} / {camp.target}</span>
                              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(camp.sent/camp.target)*100}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${camp.status === 'running' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                              {camp.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-5 text-right flex justify-end gap-2">
                            <button className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 rounded-md"><PlayCircle className="w-4 h-4" /></button>
                            <button className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 rounded-md"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white">Katalog Produk</h2>
                  <p className="text-slate-400 text-sm mt-1">Data produk yang akan ditawarkan oleh AI kepada pelanggan.</p>
                </div>
                <button onClick={() => showToast('Fitur tambah produk tersedia di versi full backend.')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] hover:-translate-y-0.5">
                  <Plus className="w-4 h-4" /> Tambah Produk
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(p => (
                  <div key={p.id} className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 hover:border-emerald-500/30 transition-all group shadow-xl flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-slate-500 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700">{p.sku}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">{p.status.toUpperCase()}</span>
                    </div>
                    <h3 className="font-bold text-slate-200 text-lg mb-1">{p.nama}</h3>
                    <p className="text-emerald-400 font-black text-xl mb-3">{formatRupiah(p.harga)}</p>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-4 flex-1">{p.deskripsi}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800/50 mt-auto">
                      <span className="text-xs font-medium text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">Stok: <b className="text-white">{p.stok}</b></span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-blue-400 bg-slate-800 rounded-md"><Edit className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: AI CONFIG */}
          {activeTab === 'ai-config' && (
            <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
              <div>
                <h2 className="text-2xl font-black text-white">Konfigurasi Brain AI</h2>
                <p className="text-slate-400 text-sm mt-1">Atur persona dan integrasi Google Gemini AI untuk asisten virtual Anda.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-500"/> Google Gemini API Key
                  </label>
                  <input 
                    type="password" 
                    value={settings.geminiApi}
                    onChange={(e) => setSettings({...settings, geminiApi: e.target.value})}
                    placeholder="Masukkan API Key dari Google AI Studio"
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-2">Dapatkan API key gratis di <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline font-bold">Google AI Studio</a>.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nama Toko / Brand</label>
                    <input 
                      type="text" 
                      value={settings.storeName}
                      onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                      className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jeda Auto Follow-Up (Jam)</label>
                    <input 
                      type="number" 
                      value={settings.followUpHours}
                      onChange={(e) => setSettings({...settings, followUpHours: e.target.value})}
                      className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                    <span>System Prompt (Karakter AI)</span>
                    <button type="button" onClick={() => setSettings({...settings, aiPrompt: 'Anda adalah CS yang tegas namun solutif. Jawab singkat padat jelas.'})} className="text-emerald-500 hover:underline capitalize normal-case text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">Gunakan Prompt Alternatif</button>
                  </label>
                  <textarea 
                    rows="5"
                    value={settings.aiPrompt}
                    onChange={(e) => setSettings({...settings, aiPrompt: e.target.value})}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all leading-relaxed"
                  ></textarea>
                  <p className="text-[11px] text-slate-500 mt-2">Instruksikan bagaimana bot harus membalas, gaya bahasa, dan tujuan utamanya (misal: closing sales).</p>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5">
                    Simpan Konfigurasi AI
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: TUTORIAL */}
          {activeTab === 'tutorial' && (
            <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
              <div>
                <h2 className="text-2xl font-black text-white">Panduan Setup Enterprise</h2>
                <p className="text-slate-400 text-sm mt-1">Langkah-langkah lengkap menghubungkan Frontend Vercel ini dengan Bot Node.js di server Anda.</p>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2"><span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> Persiapan VPS / Hosting Node.js</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">Karena Vercel adalah platform Serverless (fungsi akan mati otomatis setelah beberapa detik), Bot WhatsApp (whatsapp-web.js / Baileys) <b>tidak bisa</b> dijalankan di Vercel secara langsung. Anda membutuhkan server VPS (DigitalOcean, Hostinger) atau PaaS seperti Render.com / Railway.app.</p>
                </div>

                {/* Step 2 */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2"><span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> Deploy Script Node.js</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">Salin kode bot dari menu <b>Node.js Bot Script</b>. Buat file <code>bot.js</code> di server Anda, lalu jalankan perintah berikut:</p>
                  <div className="bg-[#020617] border border-slate-700 rounded-xl p-4 font-mono text-sm text-emerald-400">
                    npm init -y<br/>
                    npm install whatsapp-web.js qrcode-terminal axios express<br/>
                    node bot.js
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2"><span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span> Setup Webhook Endpoint</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Agar Bot Node.js bisa menggunakan AI Gemini dan menyimpan data ke Dashboard ini, Anda harus membuat API Endpoint (Webhook) di project Vercel Anda menggunakan fitur <b>Vercel Serverless Functions</b> (buat folder <code>/api/webhook.js</code> di project Anda). Bot Node.js akan melakukan HTTP POST ke URL Webhook tersebut setiap ada pesan masuk.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: NODE JS SCRIPT */}
          {activeTab === 'script' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div>
                <h2 className="text-2xl font-black text-white">Node.js Bot Script (whatsapp-web.js)</h2>
                <p className="text-slate-400 text-sm mt-1">Gunakan script ini di server Node.js Anda (VPS/Render/Railway) untuk menghubungkan nomor WhatsApp ke sistem ini.</p>
              </div>

              <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-xl">
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></div>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(nodeJsCode);
                      showToast('Kode berhasil disalin ke clipboard!');
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Script
                  </button>
                </div>
                <div className="p-6 overflow-x-auto text-sm font-mono text-emerald-400/90 leading-relaxed max-h-[60vh] custom-scrollbar">
                  <pre><code>{nodeJsCode}</code></pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PLACEHOLDERS FOR OTHERS */}
          {['orders', 'leads', 'knowledge', 'followup'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-in fade-in duration-500 pt-20">
              <Database className="w-20 h-20 mb-6 opacity-20 text-emerald-500" />
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">{activeTab.replace('-', ' ')}</h2>
              <p className="text-sm max-w-md text-center text-slate-400 border border-slate-800 bg-slate-900/50 p-4 rounded-xl">
                Tampilan manajemen data (CRUD) untuk modul ini dirancang serupa dengan tab <b>Katalog Produk</b>. Sambungkan ke Database external (Supabase/Firebase) pada versi Production.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* CHAT SIMULATOR MODAL */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSimulatorOpen(false)}></div>
          
          <div className="relative bg-[#0f172a] border border-slate-700 rounded-3xl w-full max-w-md h-[600px] flex flex-col shadow-2xl overflow-hidden ring-1 ring-emerald-500/20">
            {/* Header Simulator */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">WABOT AI Simulator</h3>
                  <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> 
                    Menggunakan: {bots.find(b => b.id === activeBotId)?.name || 'Default Bot'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsSimulatorOpen(false)} className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#020617]/50 custom-scrollbar" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              <div className="flex justify-center mb-4">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">Percakapan Simulasi Dimulai</span>
              </div>
              {simMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-md leading-relaxed ${
                    msg.sender === 'user' 
                    ? 'bg-emerald-600 text-white rounded-br-sm' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isBotTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center shadow-md">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSimulateChat} className="bg-slate-900 border-t border-slate-800 p-4 flex gap-2">
              <input 
                type="text" 
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                placeholder="Ketik pesan pelanggan..."
                className="flex-1 bg-[#020617] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              />
              <button 
                type="submit" 
                disabled={!simInput.trim() || isBotTyping}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center disabled:opacity-50 hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg active:scale-95"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Sub Components ---
function StatCard({ title, value, icon: Icon, color, bgColor, border, trend }) {
  return (
    <div className={`bg-[#0f172a] border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl`}>
      <div className={`absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 ${color}`}>
        <Icon className="w-28 h-28" />
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <h3 className="text-3xl font-black text-white">{value}</h3>
      <p className={`text-[10px] font-bold mt-3 flex items-center gap-1.5 ${color}`}>
        <span className={`px-2 py-0.5 rounded-full ${bgColor} border ${border}`}>{trend}</span>
      </p>
    </div>
  );
}

function Progress({ title, value, color, text }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-slate-400 font-medium">{title}</span>
        <span className="text-slate-300 font-bold">{text}</span>
      </div>
      <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full relative`} style={{ width: `${value}%` }}>
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

const nodeJsCode = `/**
 * WABOT ENTERPRISE - NODE.JS CONNECTION SCRIPT (MULTI-DEVICE READY)
 * Deployment target: VPS, Render, Railway (Not Vercel Serverless)
 * 1. Install dependencies: npm install whatsapp-web.js qrcode-terminal axios express
 * 2. Run script: node bot.js
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

// Ganti dengan URL Endpoint Vercel Anda
const DASHBOARD_WEBHOOK_URL = 'https://your-vercel-domain.com/api/webhook'; 
const BOT_ID = 'bot-1'; // Sesuaikan dengan ID Device di Dashboard

// Setup Express untuk menerima request broadcast dari Dashboard
const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth({ clientId: BOT_ID }), // Memungkinkan Multi-Device
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', (qr) => {
    console.log(\`[$\{BOT_ID}\] Scan QR Code di bawah ini:\`);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log(\`✅ WABOT Enterprise [\${BOT_ID}] - Bot is Ready!\`);
});

client.on('message', async msg => {
    // Abaikan grup/status
    if (msg.from === 'status@broadcast' || msg.from.includes('@g.us')) return;

    console.log(\`[\${BOT_ID}] Pesan masuk dari \${msg.from}: \${msg.body}\`);

    try {
        /* [VERSI PRODUCTION] Forward ke Webhook Vercel:
        const response = await axios.post(DASHBOARD_WEBHOOK_URL, {
            bot_id: BOT_ID,
            sender: msg.from,
            message: msg.body
        });

        if (response.data && response.data.reply) {
            client.sendMessage(msg.from, response.data.reply);
        }
        */

        // [VERSI DEV] Simulasi Balasan
        client.sendMessage(msg.from, "Pesan Anda diterima. Sistem AI sedang disiapkan di Dashboard.");

    } catch (error) {
        console.error('Error Webhook:', error.message);
    }
});

// Endpoint untuk Trigger Broadcast/Balasan dari Dashboard
app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;
    try {
        const formattedNumber = number.includes('@c.us') ? number : \`\${number}@c.us\`;
        await client.sendMessage(formattedNumber, message);
        res.json({ success: true, msg: 'Pesan terkirim' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

client.initialize();
app.listen(3000, () => console.log('Bot Internal API berjalan di port 3000'));
`;
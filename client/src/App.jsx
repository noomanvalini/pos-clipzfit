import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import POS from './pages/POS'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import EstoqueLojista from './pages/EstoqueLojista'
import EstoqueAdmin from './pages/EstoqueAdmin'
import Login from './pages/Login'
import logoImg from './assets/logo.png'

const API_BASE = '/api';

function AppContent() {
  const location = useLocation();
  const [affiliates, setAffiliates] = useState([]);
  const [activeAffiliateId, setActiveAffiliateId] = useState('AFF-1001');
  const [activeAffiliate, setActiveAffiliate] = useState(null);
  
  // Auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clipzfit_user');
    return saved ? JSON.parse(saved) : null;
  });

  const userRole = user ? user.role : null;

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Fetch affiliates list
  const fetchAffiliates = async () => {
    try {
      const res = await fetch(`${API_BASE}/affiliates`);
      const data = await res.json();
      setAffiliates(data);
      
      const active = data.find(a => a.id === activeAffiliateId);
      if (active) {
        setActiveAffiliate(active);
      } else if (data.length > 0) {
        setActiveAffiliateId(data[0].id);
        setActiveAffiliate(data[0]);
      }
    } catch (err) {
      console.error("Error fetching affiliates:", err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const triggerGlobalRefresh = () => {
    fetchAffiliates();
    fetchNotifications();
  };

  // Effect to lock affiliate if lojista
  useEffect(() => {
    if (user && user.role === 'lojista' && user.affiliateId) {
      setActiveAffiliateId(user.affiliateId);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchAffiliates();
    fetchNotifications();

    let intervalId = null;

    const startPolling = () => {
      if (!intervalId) {
        // Polling de 30 segundos é muito mais eficiente e suficiente para notificações
        intervalId = setInterval(fetchNotifications, 30000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchNotifications();
        startPolling();
      }
    };

    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeAffiliateId, user]);

  const handleLogout = () => {
    localStorage.removeItem('clipzfit_user');
    setUser(null);
  };

  const handleVoidTransaction = () => {
    if (window.confirm("Deseja realmente cancelar a venda atual? Todo o carrinho será limpo.")) {
      const event = new CustomEvent('clear-cart');
      window.dispatchEvent(event);
    }
  };

  const handleReadAllNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("Error reading all notifications:", err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/clear`, { method: 'POST' });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d1117] text-[#c9d1d9] font-sans select-none relative">
      
      {/* Sidebar Navigation */}
      <nav className="bg-[#161b22] border-r border-[#30363d] h-screen w-64 fixed left-0 top-0 flex flex-col p-6 z-40">
        <div className="mb-8 flex flex-col items-center">
          <img 
            alt="ClipzFIT Logo" 
            className="h-10 object-contain w-auto mb-2 filter brightness-110" 
            src={logoImg} 
          />
          <span className="text-[10px] text-primary tracking-[0.2em] font-mono uppercase font-bold mt-1">PDV VIRTUAL</span>
        </div>

        <div className="flex-1 space-y-2">
          <div className="px-4 pb-2 text-[11px] font-mono uppercase tracking-wider text-[#8b949e]">Menu</div>
          
          <Link 
            to="/dashboard" 
            className={`flex items-center gap-3 px-4 py-3 transition-all duration-300 active:scale-95 rounded-lg font-sans text-sm ${
              location.pathname === '/dashboard' 
                ? 'bg-primary text-[#0d1117] font-bold shadow-md shadow-primary/10' 
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: location.pathname === '/dashboard' ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
            Painel de Vendas
          </Link>
          
          {userRole === 'admin' && (
            <Link 
              to="/admin" 
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-300 active:scale-95 rounded-lg font-sans text-sm ${
                location.pathname === '/admin' 
                  ? 'bg-primary text-[#0d1117] font-bold shadow-md shadow-primary/10' 
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: location.pathname === '/admin' ? "'FILL' 1" : "'FILL' 0" }}>group</span>
              Gerir Parceiros
            </Link>
          )}
          
          <Link 
            to="/pos" 
            className={`flex items-center gap-3 px-4 py-3 transition-all duration-300 active:scale-95 rounded-lg font-sans text-sm ${
              location.pathname === '/pos' 
                ? 'bg-primary text-[#0d1117] font-bold shadow-md shadow-primary/10' 
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: location.pathname === '/pos' ? "'FILL' 1" : "'FILL' 0" }}>point_of_sale</span>
            Realizar Venda
          </Link>

          {/* Stock Page Sidebar Navigation */}
          {userRole === 'admin' ? (
            <Link 
              to="/estoque-geral" 
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-300 active:scale-95 rounded-lg font-sans text-sm ${
                location.pathname === '/estoque-geral' 
                  ? 'bg-primary text-[#0d1117] font-bold shadow-md shadow-primary/10' 
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: location.pathname === '/estoque-geral' ? "'FILL' 1" : "'FILL' 0" }}>inventory_2</span>
              Estoque Geral
            </Link>
          ) : (
            <Link 
              to="/estoque" 
              className={`flex items-center gap-3 px-4 py-3 transition-all duration-300 active:scale-95 rounded-lg font-sans text-sm ${
                location.pathname === '/estoque' 
                  ? 'bg-primary text-[#0d1117] font-bold shadow-md shadow-primary/10' 
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: location.pathname === '/estoque' ? "'FILL' 1" : "'FILL' 0" }}>inventory_2</span>
              Estoque
            </Link>
          )}
        </div>
        
        {/* Active POS Location card */}
        <div className="p-4 rounded-lg bg-[#21262d] border border-[#30363d] mb-6 space-y-2">
          <div className="font-mono text-[10px] text-[#8b949e] uppercase tracking-wider">Local de Venda Ativo</div>
          <div className="text-sm text-[#f0f6fc] font-bold truncate">
            {activeAffiliate ? activeAffiliate.name : 'Carregando...'}
          </div>
          <div className="text-[11px] text-[#8b949e] font-mono flex justify-between">
            <span>Comissão: {activeAffiliate ? `${activeAffiliate.commissionRate}%` : '...'}</span>
            <span className="font-semibold">{activeAffiliateId}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <button 
            onClick={handleVoidTransaction}
            className="w-full bg-[#FF6E61]/10 hover:bg-[#FF6E61] text-[#FF6E61] hover:text-[#FAFAF9] border border-[#FF6E61]/30 hover:border-[#FF6E61] font-mono text-xs py-2.5 px-4 rounded-lg transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
            Cancelar Venda
          </button>

          <button 
            onClick={handleLogout}
            className="w-full bg-transparent hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] font-mono text-xs py-2.5 px-4 rounded-lg transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sair da Conta
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0 h-full relative">
        {/* TopNavBar */}
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-30 bg-[#0d1117] border-b border-[#30363d] flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <nav className="flex gap-6 font-mono text-[12px] uppercase tracking-wider">
              <Link 
                to="/dashboard" 
                className={`transition-all duration-300 hover:text-primary ${location.pathname === '/dashboard' ? 'text-primary font-bold border-b border-primary pb-5' : 'text-[#8b949e]'}`}
              >
                Painel
              </Link>
              {userRole === 'admin' && (
                <Link 
                  to="/admin" 
                  className={`transition-all duration-300 hover:text-primary ${location.pathname === '/admin' ? 'text-primary font-bold border-b border-primary pb-5' : 'text-[#8b949e]'}`}
                >
                  Parceiros
                </Link>
              )}
              <Link 
                to="/pos" 
                className={`transition-all duration-300 hover:text-primary ${location.pathname === '/pos' ? 'text-primary font-bold border-b border-primary pb-5' : 'text-[#8b949e]'}`}
              >
                Caixa
              </Link>
              {userRole === 'admin' ? (
                <Link 
                  to="/estoque-geral" 
                  className={`transition-all duration-300 hover:text-primary ${location.pathname === '/estoque-geral' ? 'text-primary font-bold border-b border-primary pb-5' : 'text-[#8b949e]'}`}
                >
                  Estoque Geral
                </Link>
              ) : (
                <Link 
                  to="/estoque" 
                  className={`transition-all duration-300 hover:text-primary ${location.pathname === '/estoque' ? 'text-primary font-bold border-b border-primary pb-5' : 'text-[#8b949e]'}`}
                >
                  Estoque
                </Link>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-4 relative">
            {/* Affiliate Switcher (Admin Only) */}
            {userRole === 'admin' && (
              <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">storefront</span>
                <select
                  value={activeAffiliateId}
                  onChange={(e) => setActiveAffiliateId(e.target.value)}
                  className="bg-transparent text-[#f0f6fc] rounded text-xs font-mono focus:outline-none cursor-pointer pr-4"
                >
                  {affiliates.map(aff => (
                    <option key={aff.id} value={aff.id} className="bg-[#161b22] text-[#f0f6fc]">{aff.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Notifications Button with Drawer Trigger */}
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="text-[#8b949e] hover:text-primary transition-all active:opacity-80 relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#21262d] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadNotifCount > 0 && (
                <span className="absolute top-0 right-0 bg-[#ff6e61] text-[#fafafa] font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute top-12 right-0 w-80 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-50 p-4 space-y-3 animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-[#21262d]">
                  <span className="font-sans font-bold text-xs text-[#f0f6fc] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">notifications</span>
                    Notificações
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleReadAllNotifications} 
                      className="text-[10px] font-mono text-primary hover:underline cursor-pointer"
                    >
                      Lidas
                    </button>
                    <span className="text-[#30363d] text-[10px] font-mono">|</span>
                    <button 
                      onClick={handleClearNotifications} 
                      className="text-[10px] font-mono text-[#ff6e61] hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-[11px] font-mono text-[#8b949e]">
                      NENHUMA NOTIFICAÇÃO
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-3 rounded-lg border text-xs leading-relaxed transition-all relative ${
                          n.read 
                            ? 'bg-[#0d1117]/30 border-[#21262d] text-[#8b949e]' 
                            : 'bg-[#0d1117]/70 border-[#30363d] text-[#f0f6fc]'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1 font-semibold mb-1">
                          <span className={n.read ? 'text-[#8b949e]' : 'text-primary'}>{n.title}</span>
                          <span className="text-[9px] font-mono text-[#8b949e] whitespace-nowrap mt-0.5">{formatDate(n.date)}</span>
                        </div>
                        <p className="font-sans text-[11px]">{n.message}</p>
                        {!n.read && (
                          <span className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-primary rounded-full"></span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <button className="text-[#8b949e] hover:text-primary transition-all active:opacity-80 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#21262d] cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 mt-16 overflow-y-auto bg-[#0d1117]">
          <Routes>
            <Route path="/dashboard" element={<SellerDashboard activeAffiliateId={activeAffiliateId} refreshTrigger={triggerGlobalRefresh} />} />
            <Route 
              path="/admin" 
              element={
                userRole === 'admin' ? (
                  <AdminDashboard activeAffiliateId={activeAffiliateId} refreshTrigger={triggerGlobalRefresh} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            <Route path="/pos" element={<POS activeAffiliateId={activeAffiliateId} refreshTrigger={triggerGlobalRefresh} />} />
            <Route path="/estoque" element={<EstoqueLojista activeAffiliateId={activeAffiliateId} />} />
            <Route 
              path="/estoque-geral" 
              element={
                userRole === 'admin' ? (
                  <EstoqueAdmin refreshTrigger={triggerGlobalRefresh} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            <Route path="*" element={<Navigate to="/pos" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

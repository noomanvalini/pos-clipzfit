import { useState, useEffect } from 'react'

const API_BASE = '/api';

export default function ManagerDashboard() {
  const [manager, setManager] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeCommissionRate, setStoreCommissionRate] = useState(15);
  const [submitting, setSubmitting] = useState(false);

  // Retrieve user credentials
  const getLoggedInUser = () => {
    const saved = localStorage.getItem('clipzfit_user');
    return saved ? JSON.parse(saved) : null;
  };

  const user = getLoggedInUser();

  const loadDashboardData = async () => {
    if (!user || !user.managerId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch manager info and affiliates list
      const [mgrRes, affRes] = await Promise.all([
        fetch(`${API_BASE}/managers`),
        fetch(`${API_BASE}/affiliates`)
      ]);

      if (mgrRes.ok && affRes.ok) {
        const managersList = await mgrRes.json();
        const foundManager = managersList.find(m => m.id === user.managerId);
        if (foundManager) {
          setManager(foundManager);
        }

        const affiliatesList = await affRes.json();
        const associatedStores = affiliatesList.filter(aff => aff.managerId === user.managerId);
        setStores(associatedStores);
      }
    } catch (err) {
      console.error("Error loading manager dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleOpenEditModal = (store) => {
    setSelectedStore(store);
    setStoreCommissionRate(store.commissionRate);
    setIsModalOpen(true);
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    if (!selectedStore || !manager) return;

    const rate = Number(storeCommissionRate);
    if (rate >= manager.totalCommissionPercentage) {
      alert(`Erro: A comissão da loja (${rate}%) não pode ser maior ou igual à comissão total do gerente (${manager.totalCommissionPercentage}%).`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/managers/stores/${selectedStore.id}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commissionRate: rate,
          managerId: manager.id
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSelectedStore(null);
        await loadDashboardData();
      } else {
        const errData = await res.json();
        alert(`Erro ao atualizar comissão: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error updating commission:", err);
      alert("Erro na conexão com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const exportStoresToCSV = () => {
    if (!stores.length) return;
    
    const headers = [
      "Codigo ID", 
      "Nome da Loja", 
      "Localidade", 
      "Comissao da Loja (%)", 
      "Faturamento Acumulado (R$)", 
      "Status"
    ];
    
    const rows = stores.map(store => [
      store.id,
      store.name,
      store.location,
      store.commissionRate,
      (store.totalSales || 0).toFixed(2),
      store.status
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lojas_gerenciadas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117] text-[#8b949e] font-mono">
        <div className="flex flex-col items-center space-y-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          <span>Carregando painel do gerente...</span>
        </div>
      </div>
    );
  }

  if (!user || !user.managerId || !manager) {
    return (
      <div className="p-8 bg-[#0d1117] min-h-full flex items-center justify-center text-[#8b949e] font-mono">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-red-500">warning</span>
          <p>Erro: Conta de Gerente Regional não vinculada ou dados inválidos.</p>
        </div>
      </div>
    );
  }

  // Calculate consolidated metrics
  const totalStoresSales = stores.reduce((sum, store) => sum + (store.totalSales || 0), 0);

  return (
    <div className="p-4 md:p-8 bg-[#0d1117] min-h-full animate-fade-in">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-sans text-xl md:text-2xl font-bold text-[#f0f6fc] mb-1">
              Painel do Gerente Regional
            </h2>
            <p className="font-sans text-xs text-[#8b949e]">
              Acompanhamento de metas e ajustes de comissões para lojas vinculadas a: <span className="text-primary font-semibold">{manager.name}</span>
            </p>
          </div>
          {stores.length > 0 && (
            <button
              onClick={exportStoresToCSV}
              className="bg-transparent hover:bg-primary/10 text-primary border border-primary/30 hover:border-primary px-5 py-2.5 rounded-lg font-mono text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 justify-center w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Exportar CSV Lojas
            </button>
          )}
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Card 1: Manager Commission Balance */}
          <div className="premium-card p-5 md:p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs text-[#8b949e] uppercase tracking-wider font-medium">Saldo de Comissão (Seu Ganho)</span>
              <div className="bg-primary/10 rounded-full p-2 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
            </div>
            <div>
              <h3 className="font-mono text-xl md:text-2xl font-bold text-[#f0f6fc] mb-2 leading-none">
                R$ {(manager.commissionBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-[#8b949e] font-sans leading-normal">
                Comissão gerada a partir do split de vendas (Sua comissão - Comissão da Loja)
              </p>
            </div>
          </div>

          {/* Card 2: Consolidated Stores Sales */}
          <div className="premium-card p-5 md:p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs text-[#8b949e] uppercase tracking-wider font-medium">Faturamento Consol. Lojas</span>
              <div className="bg-green-500/10 rounded-full p-2 text-green-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </div>
            </div>
            <div>
              <h3 className="font-mono text-xl md:text-2xl font-bold text-green-500 mb-2 leading-none">
                R$ {totalStoresSales.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-[#8b949e] font-sans leading-normal">
                Soma total de faturamento de todas as {stores.length} lojas sob sua gestão
              </p>
            </div>
          </div>

          {/* Card 3: Manager Total Rate (Meta) */}
          <div className="premium-card p-5 md:p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs text-[#8b949e] uppercase tracking-wider font-medium">Comissão Máxima Regional</span>
              <div className="bg-blue-500/10 rounded-full p-2 text-blue-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">percent</span>
              </div>
            </div>
            <div>
              <h3 className="font-mono text-xl md:text-2xl font-bold text-[#f0f6fc] mb-2 leading-none">
                {manager.totalCommissionPercentage}%
              </h3>
              <p className="text-[10px] text-[#8b949e] font-sans leading-normal">
                Limite de comissão definido pela administração. A comissão das lojas subtrai deste total.
              </p>
            </div>
          </div>
        </div>

        {/* Managed Stores Table Card */}
        <div className="premium-card p-4 md:p-6 overflow-x-auto">
          <div className="mb-4">
            <h4 className="font-sans text-sm font-bold text-[#f0f6fc] uppercase tracking-wider font-semibold">Lojas sob sua Coordenação</h4>
          </div>
          
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#21262d]">
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Código ID</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Nome da Filial</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Localidade</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Comissão Loja</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Faturamento</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Seu Ganho (Split)</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-center font-bold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-sm font-mono text-[#8b949e]">
                    Nenhuma loja cadastrada sob sua supervisão.
                  </td>
                </tr>
              ) : (
                stores.map((store) => {
                  const managerRate = manager.totalCommissionPercentage || 0;
                  const storeRate = store.commissionRate || 0;
                  const splitRate = Math.max(0, managerRate - storeRate);
                  const storeSales = store.totalSales || 0;
                  const splitGain = storeSales * (splitRate / 100);

                  return (
                    <tr 
                      key={store.id} 
                      className="border-b border-[#21262d] hover:bg-[#161b22] transition-all"
                    >
                      <td className="py-4 px-4 font-mono text-xs text-[#f0f6fc] font-semibold">{store.id}</td>
                      <td className="py-4 px-4 font-sans text-sm text-[#f0f6fc] font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold">{store.name}</span>
                          <span className="text-[11px] text-[#8b949e] font-mono mt-0.5">{store.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-sans text-sm text-[#8b949e]">{store.location}</td>
                      <td className="py-4 px-4 font-mono text-sm text-[#f0f6fc] font-bold text-right">
                        {store.commissionRate}%
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-primary font-bold text-right">
                        R$ {storeSales.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-green-500 font-bold text-right" title={`Split de comissão de ${splitRate}%`}>
                        R$ {splitGain.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleOpenEditModal(store)}
                          className="bg-transparent hover:bg-primary/10 text-primary border border-primary/30 hover:border-primary px-3 py-1.5 rounded font-mono text-[11px] font-bold cursor-pointer transition-all active:scale-95 inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission Edit Modal */}
      {isModalOpen && selectedStore && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-5 md:p-6 max-w-sm w-full border border-[#30363d] relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-sans text-base font-bold text-[#f0f6fc] mb-2">
              Ajustar Comissão da Loja
            </h3>
            <p className="font-sans text-xs text-[#8b949e] mb-4">
              Loja: <span className="text-[#f0f6fc] font-semibold">{selectedStore.name}</span>
            </p>
            
            <form onSubmit={handleUpdateCommission} className="space-y-4 font-mono text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">
                  Nova Taxa da Loja (%)
                </label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  step="0.1"
                  value={storeCommissionRate}
                  onChange={(e) => setStoreCommissionRate(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-mono text-sm" 
                  required
                />
              </div>

              <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-lg space-y-1 text-[11px] text-[#8b949e] font-sans">
                <div className="flex justify-between">
                  <span>Comissão Máxima (Sua Meta):</span>
                  <span className="font-mono text-[#f0f6fc] font-semibold">{manager.totalCommissionPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Nova Comissão da Loja:</span>
                  <span className="font-mono text-[#f0f6fc] font-semibold">{storeCommissionRate}%</span>
                </div>
                <div className="border-t border-[#30363d] my-1 pt-1 flex justify-between font-semibold">
                  <span className="text-primary">Sua Comissão Restante (Split):</span>
                  <span className="font-mono text-primary font-bold">
                    {Math.max(0, manager.totalCommissionPercentage - Number(storeCommissionRate || 0))}%
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2.5 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent border border-outline text-[#f0f6fc] font-mono py-2 px-4 rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-primary text-[#0d1117] font-mono font-bold py-2 px-5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

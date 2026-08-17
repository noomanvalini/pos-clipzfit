import { useState, useEffect } from 'react'

const API_BASE = '/api';

export default function AdminDashboard({ activeAffiliateId, refreshTrigger }) {
  const [affiliates, setAffiliates] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('vendors'); // 'vendors' | 'managers' | 'sellers'

  // Salesperson stats states
  const [sellersStats, setSellersStats] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);

  const fetchSellersStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/sellers/stats`);
      if (res.ok) {
        const data = await res.json();
        setSellersStats(data);
      }
    } catch (err) {
      console.error("Error fetching sellers stats:", err);
    }
  };

  // Vendor Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [commissionRate, setCommissionRate] = useState(15);
  const [status, setStatus] = useState('Active');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [managerId, setManagerId] = useState('');

  // Manager Form states
  const [isMgrModalOpen, setIsMgrModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [mgrName, setMgrName] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');
  const [mgrPassword, setMgrPassword] = useState('');
  const [mgrTotalCommissionPercentage, setMgrTotalCommissionPercentage] = useState(20);

  const fetchAffiliates = async () => {
    try {
      const res = await fetch(`${API_BASE}/affiliates`);
      const data = await res.json();
      setAffiliates(data);
    } catch (err) {
      console.error("Error fetching affiliates:", err);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await fetch(`${API_BASE}/managers`);
      if (res.ok) {
        const data = await res.json();
        setManagers(data);
      }
    } catch (err) {
      console.error("Error fetching managers:", err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchAffiliates(), fetchManagers(), fetchSellersStats()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const exportPartnersToCSV = () => {
    if (!affiliates.length) return;
    
    const headers = [
      "Codigo ID", 
      "Nome da Filial", 
      "Localidade", 
      "E-mail", 
      "Comissao (%)", 
      "Gerente ID",
      "Gerente Nome",
      "Vendas Totais (R$)", 
      "Saldo Pendente (R$)",
      "Status"
    ];
    
    const rows = affiliates.map(aff => {
      const mgr = managers.find(m => m.id === aff.managerId);
      return [
        aff.id,
        aff.name,
        aff.location,
        aff.email || "",
        aff.commissionRate,
        aff.managerId || "Nenhum",
        mgr ? mgr.name : "Nenhum",
        (aff.totalSales || 0).toFixed(2),
        (aff.commissionBalance || 0).toFixed(2),
        aff.status
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_parceiros_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportManagersToCSV = () => {
    if (!managers.length) return;
    
    const headers = [
      "Codigo ID", 
      "Nome", 
      "E-mail", 
      "Comissao Total (%)", 
      "Vendas Consolidadas (R$)", 
      "Saldo de Comissao (R$)"
    ];
    
    const rows = managers.map(mgr => [
      mgr.id,
      mgr.name,
      mgr.email || "",
      mgr.totalCommissionPercentage,
      (mgr.totalSales || 0).toFixed(2),
      (mgr.commissionBalance || 0).toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_gerentes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Vendor Modal handlers
  const handleOpenCreateModal = () => {
    setSelectedAffiliate(null);
    setName('');
    setLocation('');
    setCommissionRate(15);
    setStatus('Active');
    setEmail('');
    setPassword('');
    setManagerId('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (aff) => {
    setSelectedAffiliate(aff);
    setName(aff.name);
    setLocation(aff.location);
    setCommissionRate(aff.commissionRate);
    setStatus(aff.status);
    setEmail(aff.email || '');
    setPassword(aff.password || '');
    setManagerId(aff.managerId || '');
    setIsModalOpen(true);
  };

  const handleDeleteAffiliate = async () => {
    if (!selectedAffiliate) return;

    if (!window.confirm(`Tem certeza que deseja excluir o parceiro ${selectedAffiliate.name}? Esta ação é irreversível e excluirá todas as vendas, estoques locais e solicitações de reposição associadas a este parceiro.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/affiliates/${selectedAffiliate.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert("Parceiro e todos os seus dados associados foram excluídos com sucesso!");
        setIsModalOpen(false);
        loadAllData();
        refreshTrigger();
      } else {
        const errData = await res.json();
        alert(`Erro ao excluir parceiro: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error deleting affiliate:", err);
      alert("Falha na conexão com o servidor.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !location || commissionRate === undefined || !email || !password) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Validation: Store commission rate must not exceed responsibe manager rate
    if (managerId) {
      const mgr = managers.find(m => m.id === managerId);
      if (mgr && Number(commissionRate) >= mgr.totalCommissionPercentage) {
        alert(`Erro: A comissão da loja (${commissionRate}%) não pode ser maior ou igual à comissão total do gerente selecionado (${mgr.totalCommissionPercentage}%).`);
        return;
      }
    }

    try {
      const url = selectedAffiliate 
        ? `${API_BASE}/affiliates/${selectedAffiliate.id}`
        : `${API_BASE}/affiliates`;
      const method = selectedAffiliate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          location,
          commissionRate: Number(commissionRate),
          status,
          email,
          password,
          managerId: managerId || null
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setLocation('');
        setCommissionRate(15);
        setStatus('Active');
        setEmail('');
        setPassword('');
        setManagerId('');
        setSelectedAffiliate(null);
        loadAllData();
        refreshTrigger();
      } else {
        const errData = await res.json();
        alert(`Erro ao salvar parceiro: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error saving affiliate:", err);
      alert("Falha na conexão com o servidor.");
    }
  };

  // Manager Modal handlers
  const handleOpenMgrCreateModal = () => {
    setSelectedManager(null);
    setMgrName('');
    setMgrEmail('');
    setMgrPassword('');
    setMgrTotalCommissionPercentage(20);
    setIsMgrModalOpen(true);
  };

  const handleOpenMgrEditModal = (mgr) => {
    setSelectedManager(mgr);
    setMgrName(mgr.name);
    setMgrEmail(mgr.email);
    setMgrPassword(mgr.password || '');
    setMgrTotalCommissionPercentage(mgr.totalCommissionPercentage);
    setIsMgrModalOpen(true);
  };

  const handleMgrSubmit = async (e) => {
    e.preventDefault();

    if (!mgrName || !mgrEmail || !mgrPassword || mgrTotalCommissionPercentage === undefined) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const url = selectedManager 
        ? `${API_BASE}/managers/${selectedManager.id}`
        : `${API_BASE}/managers`;
      const method = selectedManager ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: mgrName,
          email: mgrEmail,
          password: mgrPassword,
          totalCommissionPercentage: Number(mgrTotalCommissionPercentage)
        })
      });

      if (res.ok) {
        setIsMgrModalOpen(false);
        setMgrName('');
        setMgrEmail('');
        setMgrPassword('');
        setMgrTotalCommissionPercentage(20);
        setSelectedManager(null);
        loadAllData();
        refreshTrigger();
      } else {
        const errData = await res.json();
        alert(`Erro ao salvar gerente: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error saving manager:", err);
      alert("Falha na conexão com o servidor.");
    }
  };

  const handleDeleteManager = async () => {
    if (!selectedManager) return;

    if (!window.confirm(`Tem certeza que deseja excluir o gerente ${selectedManager.name}? Todos os parceiros associados serão desconectados do gerente (mas não serão excluídos).`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/managers/${selectedManager.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert("Gerente excluído com sucesso!");
        setIsMgrModalOpen(false);
        loadAllData();
        refreshTrigger();
      } else {
        const errData = await res.json();
        alert(`Erro ao excluir gerente: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error deleting manager:", err);
      alert("Falha na conexão com o servidor.");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117] text-[#8b949e] font-mono">
        <div className="flex flex-col items-center space-y-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          <span>Carregando dados da gestão...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#0d1117] min-h-full animate-fade-in">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-sans text-2xl font-bold text-[#f0f6fc]">Gestão Operacional</h1>
            <p className="font-sans text-xs text-[#8b949e] mt-1">
              Configure pontos de venda (Lojistas) e gerentes regionais, com regras de comissão e metas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {activeSubTab === 'vendors' ? (
              <>
                {affiliates.length > 0 && (
                  <button
                    onClick={exportPartnersToCSV}
                    className="bg-transparent hover:bg-primary/10 text-primary border border-primary/30 hover:border-primary px-5 py-2.5 rounded-lg font-mono text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 flex-1 sm:flex-initial justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Exportar CSV
                  </button>
                )}
                <button 
                  onClick={handleOpenCreateModal}
                  className="bg-primary text-[#0d1117] px-5 py-2.5 rounded-lg font-mono text-xs font-bold hover:opacity-95 transition-opacity flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 shadow-md shadow-primary/10 flex-1 sm:flex-initial justify-center"
                >
                  <span className="material-symbols-outlined text-[18px] font-bold">add</span>
                  Novo Parceiro
                </button>
              </>
            ) : (
              <>
                {managers.length > 0 && (
                  <button
                    onClick={exportManagersToCSV}
                    className="bg-transparent hover:bg-primary/10 text-primary border border-primary/30 hover:border-primary px-5 py-2.5 rounded-lg font-mono text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 flex-1 sm:flex-initial justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Exportar CSV
                  </button>
                )}
                <button 
                  onClick={handleOpenMgrCreateModal}
                  className="bg-primary text-[#0d1117] px-5 py-2.5 rounded-lg font-mono text-xs font-bold hover:opacity-95 transition-opacity flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 shadow-md shadow-primary/10 flex-1 sm:flex-initial justify-center"
                >
                  <span className="material-symbols-outlined text-[18px] font-bold">add</span>
                  Novo Gerente
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sub-tab Selection */}
        <div className="flex border-b border-[#21262d] mb-6 font-mono text-xs">
          <button 
            onClick={() => setActiveSubTab('vendors')}
            className={`px-5 py-3 font-bold tracking-wider transition-all border-b-2 hover:text-[#f0f6fc] cursor-pointer ${
              activeSubTab === 'vendors' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-[#8b949e]'
            }`}
          >
            PONTOS DE VENDA (LOJISTAS)
          </button>
          <button 
            onClick={() => setActiveSubTab('managers')}
            className={`px-5 py-3 font-bold tracking-wider transition-all border-b-2 hover:text-[#f0f6fc] cursor-pointer ${
              activeSubTab === 'managers' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-[#8b949e]'
            }`}
          >
            GERENTES REGIONAIS
          </button>
          <button 
            onClick={() => setActiveSubTab('sellers')}
            className={`px-5 py-3 font-bold tracking-wider transition-all border-b-2 hover:text-[#f0f6fc] cursor-pointer ${
              activeSubTab === 'sellers' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-[#8b949e]'
            }`}
          >
            VENDEDORES
          </button>
        </div>

        {activeSubTab === 'vendors' && (
          /* Vendors/Lojistas Table */
          <div className="premium-card p-4 md:p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#21262d]">
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Código ID</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Nome da Filial</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Localidade</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Comissão Loja</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Vendas Totais</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Saldo Loja</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((aff) => {
                  const linkedMgr = managers.find(m => m.id === aff.managerId);
                  return (
                    <tr 
                      key={aff.id} 
                      onClick={() => handleOpenEditModal(aff)}
                      className={`border-b border-[#21262d] hover:bg-[#161b22] transition-all cursor-pointer ${
                        aff.id === activeAffiliateId ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                      title="Clique para editar este parceiro"
                    >
                      <td className="py-4 px-4 font-mono text-xs text-[#f0f6fc] font-semibold">{aff.id}</td>
                      <td className="py-4 px-4 font-sans text-sm text-[#f0f6fc] font-medium">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{aff.name}</span>
                            {aff.id === activeAffiliateId && (
                              <span className="bg-primary/20 text-primary text-[9px] px-2 py-[2px] rounded font-mono font-bold uppercase tracking-wider border border-primary/20 animate-pulse shrink-0">
                                PDV ATIVO
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {aff.email && (
                              <span className="text-[11px] text-[#8b949e] font-mono">{aff.email}</span>
                            )}
                            {aff.managerId && (
                              <>
                                <span className="text-[#30363d] font-mono">•</span>
                                <span className="text-[10px] text-primary/80 font-mono bg-primary/5 border border-primary/10 px-1.5 py-[1px] rounded flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">badge</span>
                                  {linkedMgr ? linkedMgr.name : aff.managerId}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-sans text-sm text-[#8b949e]">{aff.location}</td>
                      <td className="py-4 px-4 font-mono text-sm text-[#f0f6fc] font-bold text-right">{aff.commissionRate}%</td>
                      <td className="py-4 px-4 font-mono text-sm text-primary font-bold text-right">
                        R$ {(aff.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-[#f0f6fc] font-bold text-right">
                        R$ {(aff.commissionBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span 
                          className={`font-mono text-[10px] px-2 py-[2px] rounded border font-semibold ${
                            aff.status === 'Active' ? 'badge-active' : 'badge-inactive'
                          }`}
                        >
                          {aff.status === 'Active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'managers' && (
          /* Managers Table */
          <div className="premium-card p-4 md:p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#21262d]">
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Código ID</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Gerente</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Comissão Total</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Lojas Vinculadas</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Vendas Consolidadas</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Saldo Comissão</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {managers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-sm font-mono text-[#8b949e]">
                      Nenhum gerente regional cadastrado.
                    </td>
                  </tr>
                ) : (
                  managers.map((mgr) => {
                    const linkedAffs = affiliates.filter(a => a.managerId === mgr.id);
                    return (
                      <tr 
                        key={mgr.id} 
                        onClick={() => handleOpenMgrEditModal(mgr)}
                        className="border-b border-[#21262d] hover:bg-[#161b22] transition-all cursor-pointer"
                        title="Clique para editar este gerente"
                      >
                        <td className="py-4 px-4 font-mono text-xs text-[#f0f6fc] font-semibold">{mgr.id}</td>
                        <td className="py-4 px-4 font-sans text-sm text-[#f0f6fc] font-medium">
                          <div className="flex flex-col">
                            <span className="font-semibold">{mgr.name}</span>
                            <span className="text-[11px] text-[#8b949e] font-mono mt-0.5">{mgr.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-sm text-[#f0f6fc] font-bold text-right">
                          {mgr.totalCommissionPercentage}%
                        </td>
                        <td className="py-4 px-4 font-sans text-sm text-[#8b949e] text-right">
                          <span className="bg-[#21262d] border border-[#30363d] px-2 py-0.5 rounded font-mono text-xs text-[#f0f6fc]">
                            {linkedAffs.length}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-sm text-primary font-bold text-right">
                          R$ {(mgr.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 font-mono text-sm text-[#f0f6fc] font-bold text-right">
                          R$ {(mgr.commissionBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="material-symbols-outlined text-[#8b949e] hover:text-primary transition-colors text-[18px]">
                            edit
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'sellers' && (
          <div className="premium-card p-4 md:p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#21262d]">
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Vendedor</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Loja / Ponto de Venda</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Qtd Vendas</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Total Faturado</th>
                  <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sellersStats.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-sm font-mono text-[#8b949e]">
                      Nenhum vendedor cadastrado ou com vendas registradas.
                    </td>
                  </tr>
                ) : (
                  sellersStats.map((seller) => (
                    <tr 
                      key={seller.id} 
                      onClick={() => {
                        setSelectedSeller(seller);
                        setIsSellerModalOpen(true);
                      }}
                      className="border-b border-[#21262d] hover:bg-[#161b22] transition-all cursor-pointer"
                      title="Clique para ver vendas detalhadas"
                    >
                      <td className="py-4 px-4 font-sans text-sm text-[#f0f6fc] font-semibold">{seller.name}</td>
                      <td className="py-4 px-4 font-sans text-sm text-[#8b949e]">{seller.affiliateName}</td>
                      <td className="py-4 px-4 font-sans text-sm text-[#8b949e] text-right">
                        <span className="bg-[#21262d] border border-[#30363d] px-2 py-0.5 rounded font-mono text-xs text-[#f0f6fc]">
                          {seller.totalSalesCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-primary font-bold text-right">
                        R$ {(seller.totalSalesAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="material-symbols-outlined text-[#8b949e] hover:text-primary transition-colors text-[18px]">
                          visibility
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Affiliate Form */}
      {isModalOpen && (
        <div id="new-seller-modal" className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-5 md:p-6 max-w-md w-full border border-[#30363d] relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-sans text-lg font-bold text-[#f0f6fc] mb-4">
              {selectedAffiliate ? `Editar Parceiro: ${selectedAffiliate.name}` : 'Cadastrar Novo Parceiro'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Nome da Filial / Vendedor</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-sm" 
                  placeholder="Ex: ClipzFIT Paulista" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Localização / Endereço</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-sm" 
                  placeholder="Ex: São Paulo - SP" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">E-mail de Acesso (Login)</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-sm" 
                  placeholder="Ex: paulista@clipzfit.com" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Senha de Acesso</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-sm" 
                  placeholder="Defina uma senha" 
                  required
                />
              </div>

              {/* Manager Selection dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Gerente Regional Responsável</label>
                <select 
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-xs cursor-pointer"
                >
                  <option value="">Nenhum (Comissão Direta)</option>
                  {managers.map(mgr => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.name} (Meta: {mgr.totalCommissionPercentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Taxa de Comissão (%)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-mono text-sm" 
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Situação Cadastral</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-xs cursor-pointer"
                  >
                    <option value="Active">Ativo</option>
                    <option value="Inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between gap-2.5 items-center">
                {selectedAffiliate && (
                  <button 
                    type="button" 
                    onClick={handleDeleteAffiliate}
                    className="bg-red-500/10 border border-red-500/30 text-red-500 font-mono py-2.5 px-4 rounded-lg hover:bg-red-500 hover:text-[#0d1117] transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Excluir
                  </button>
                )}
                <div className="flex gap-2.5 ml-auto">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-transparent border border-outline text-[#f0f6fc] font-mono py-2.5 px-4 rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="bg-primary text-[#0d1117] font-mono font-bold py-2.5 px-6 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer active:scale-95 shadow-md shadow-primary/5"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Manager Form */}
      {isMgrModalOpen && (
        <div id="new-manager-modal" className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-5 md:p-6 max-w-md w-full border border-[#30363d] relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsMgrModalOpen(false)}
              className="absolute top-3 right-3 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-sans text-lg font-bold text-[#f0f6fc] mb-4">
              {selectedManager ? `Editar Gerente: ${selectedManager.name}` : 'Cadastrar Novo Gerente Regional'}
            </h3>
            
            <form onSubmit={handleMgrSubmit} className="space-y-4 font-mono text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Nome Completo</label>
                <input 
                  type="text" 
                  value={mgrName}
                  onChange={(e) => setMgrName(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-sm" 
                  placeholder="Ex: Gerente Região Sul" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">E-mail de Acesso (Login)</label>
                <input 
                  type="email" 
                  value={mgrEmail}
                  onChange={(e) => setMgrEmail(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-sm" 
                  placeholder="Ex: gerente.sul@clipzfit.com" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Senha de Acesso</label>
                <input 
                  type="password" 
                  value={mgrPassword}
                  onChange={(e) => setMgrPassword(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-sm" 
                  placeholder="Defina uma senha" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Taxa de Comissão Total (Meta %)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100"
                  value={mgrTotalCommissionPercentage}
                  onChange={(e) => setMgrTotalCommissionPercentage(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-mono text-sm" 
                  required
                />
                <span className="text-[10px] text-[#8b949e] font-sans mt-0.5 leading-normal">
                  Esta é a comissão máxima dividida entre o gerente regional e seus pontos de venda associados.
                </span>
              </div>

              <div className="pt-4 flex justify-between gap-2.5 items-center">
                {selectedManager && (
                  <button 
                    type="button" 
                    onClick={handleDeleteManager}
                    className="bg-red-500/10 border border-red-500/30 text-red-500 font-mono py-2.5 px-4 rounded-lg hover:bg-red-500 hover:text-[#0d1117] transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Excluir
                  </button>
                )}
                <div className="flex gap-2.5 ml-auto">
                  <button 
                    type="button" 
                    onClick={() => setIsMgrModalOpen(false)}
                    className="bg-transparent border border-outline text-[#f0f6fc] font-mono py-2.5 px-4 rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="bg-primary text-[#0d1117] font-mono font-bold py-2.5 px-6 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer active:scale-95 shadow-md shadow-primary/5"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Seller Transactions Modal */}
      {isSellerModalOpen && selectedSeller && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-6 max-w-3xl w-full border border-[#30363d] relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => {
                setIsSellerModalOpen(false);
                setSelectedSeller(null);
              }}
              className="absolute top-3 right-3 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-sans text-lg font-bold text-[#f0f6fc] mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">badge</span>
              Vendas de: {selectedSeller.name}
            </h3>
            <p className="font-sans text-xs text-[#8b949e] mb-4">
              Loja: {selectedSeller.affiliateName} | Total Faturado: <span className="text-primary font-mono font-bold">R$ {selectedSeller.totalSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </p>

            <div className="overflow-y-auto flex-1 border border-[#21262d] rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#21262d] bg-[#161b22]/50 font-mono text-[11px] text-[#8b949e]">
                    <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Transação</th>
                    <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Data</th>
                    <th className="py-2.5 px-3 uppercase tracking-wider font-semibold">Pagamento</th>
                    <th className="py-2.5 px-3 uppercase tracking-wider font-semibold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d]">
                  {selectedSeller.transactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-xs font-mono text-[#8b949e]">
                        Nenhuma transação aprovada para este vendedor.
                      </td>
                    </tr>
                  ) : (
                    selectedSeller.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#161b22]/20 font-mono text-xs text-[#f0f6fc]">
                        <td className="py-2.5 px-3 font-semibold">{tx.id}</td>
                        <td className="py-2.5 px-3 text-[#8b949e]">
                          {new Date(tx.date).toLocaleDateString('pt-BR')} {new Date(tx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-[#21262d] text-[#8b949e] text-[10px] px-1.5 py-[1px] rounded uppercase">
                            {tx.paymentMethod === 'Cash' ? 'Dinheiro' : tx.paymentMethod === 'Card' ? 'Cartão' : (tx.paymentMethod || 'Dividido')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-primary font-bold">
                          R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="button" 
                onClick={() => {
                  setIsSellerModalOpen(false);
                  setSelectedSeller(null);
                }}
                className="bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] font-mono text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer active:scale-95 text-center"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

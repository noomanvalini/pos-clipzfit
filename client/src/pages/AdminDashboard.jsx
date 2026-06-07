import { useState, useEffect } from 'react'

const API_BASE = '/api';

export default function AdminDashboard({ activeAffiliateId, refreshTrigger }) {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [commissionRate, setCommissionRate] = useState(15);
  const [status, setStatus] = useState('Active');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const exportPartnersToCSV = () => {
    if (!affiliates.length) return;
    
    const headers = [
      "Codigo ID", 
      "Nome da Filial", 
      "Localidade", 
      "E-mail", 
      "Comissao (%)", 
      "Vendas Totais (R$)", 
      "Saldo Pendente (R$)",
      "Status"
    ];
    
    const rows = affiliates.map(aff => [
      aff.id,
      aff.name,
      aff.location,
      aff.email || "",
      aff.commissionRate,
      aff.totalSales.toFixed(2),
      aff.commissionBalance.toFixed(2),
      aff.status
    ]);
    
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

  const handleOpenCreateModal = () => {
    setSelectedAffiliate(null);
    setName('');
    setLocation('');
    setCommissionRate(15);
    setStatus('Active');
    setEmail('');
    setPassword('');
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
    setIsModalOpen(true);
  };

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/affiliates`);
      const data = await res.json();
      setAffiliates(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching affiliates:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

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
        fetchAffiliates();
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

    if (!name || !location || !commissionRate || !email || !password) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
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
          password
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        // Clear form
        setName('');
        setLocation('');
        setCommissionRate(15);
        setStatus('Active');
        setEmail('');
        setPassword('');
        setSelectedAffiliate(null);
        // Refresh lists
        fetchAffiliates();
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117] text-[#8b949e] font-mono">
        <div className="flex flex-col items-center space-y-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          <span>Carregando dados dos parceiros...</span>
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
            <h1 className="font-sans text-2xl font-bold text-[#f0f6fc]">Gestão de Parceiros</h1>
            <p className="font-sans text-xs text-[#8b949e] mt-1">Gerencie pontos de venda ativos e taxas contratuais de comissão.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
          </div>
        </div>

        {/* Tabular Layout of Locations */}
        <div className="premium-card p-4 md:p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[#21262d]">
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Código ID</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Nome da Filial</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Localidade</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Comissão</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Vendas Totais</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Saldo Pendente</th>
                <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((aff) => (
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
                      {aff.email && (
                        <span className="text-[11px] text-[#8b949e] font-mono mt-0.5">{aff.email}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-sans text-sm text-[#8b949e]">{aff.location}</td>
                  <td className="py-4 px-4 font-mono text-sm text-[#f0f6fc] font-bold text-right">{aff.commissionRate}%</td>
                  <td className="py-4 px-4 font-mono text-sm text-primary font-bold text-right">
                    R$ {aff.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-4 font-mono text-sm text-[#f0f6fc] font-bold text-right">
                    R$ {aff.commissionBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - New Seller Form */}
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
    </div>
  );
}

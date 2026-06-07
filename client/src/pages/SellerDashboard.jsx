import { useState, useEffect } from 'react'

const API_BASE = '/api';

export default function SellerDashboard({ activeAffiliateId, refreshTrigger }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [lastWithdrawAmount, setLastWithdrawAmount] = useState(0);
  const [expandedTxIds, setExpandedTxIds] = useState({});

  const toggleExpandTx = (txId) => {
    setExpandedTxIds(prev => ({
      ...prev,
      [txId]: !prev[txId]
    }));
  };

  const exportTransactionsToCSV = () => {
    if (!metrics || !metrics.transactions || !metrics.transactions.length) return;
    
    const headers = [
      "ID Transacao", 
      "Data", 
      "Metodo Pagamento", 
      "CPF Cliente", 
      "Email Cliente", 
      "Faturamento (R$)", 
      "Comissao (R$)",
      "Itens Vendidos"
    ];
    
    const rows = metrics.transactions.map(tx => {
      const itemsString = tx.items 
        ? tx.items.map(item => `${item.name} (x${item.quantity})`).join(" | ")
        : "";
      return [
        tx.id,
        new Date(tx.date).toLocaleString('pt-BR'),
        tx.paymentMethod === 'Cash' ? 'Dinheiro' : tx.paymentMethod === 'Card' ? 'Cartao' : 'Dividido',
        tx.customerCpf || "",
        tx.customerEmail || "",
        tx.amount.toFixed(2),
        tx.commission.toFixed(2),
        `"${itemsString.replace(/"/g, '""')}"`
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
    link.setAttribute("download", `relatorio_vendas_${metrics.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/seller/metrics?affiliateId=${activeAffiliateId}`);
      const data = await res.json();
      setMetrics(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [activeAffiliateId]);

  const handleWithdrawFunds = async () => {
    if (!metrics || metrics.commissionBalance <= 0) {
      alert("Não há saldo de comissão disponível para saque!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/affiliates/${activeAffiliateId}/withdraw`, {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        setLastWithdrawAmount(data.withdrawal.amount);
        setWithdrawSuccess(true);
        fetchMetrics();
        refreshTrigger();
      } else {
        const errData = await res.json();
        alert(`Erro ao sacar: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error during withdrawal:", err);
      alert("Falha na conexão com o servidor.");
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm(`Tem certeza que deseja excluir a venda ${saleId}? Esta ação irá reverter o estoque dos produtos e subtrair o faturamento/comissão do lojista.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/sales/${saleId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert("Venda excluída com sucesso!");
        fetchMetrics();
        if (refreshTrigger) {
          refreshTrigger();
        }
      } else {
        const errData = await res.json();
        alert(`Erro ao excluir venda: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error deleting sale:", err);
      alert("Falha na conexão com o servidor.");
    }
  };

  if (loading || !metrics) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117] text-[#8b949e] font-mono">
        <div className="flex flex-col items-center space-y-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          <span>Carregando métricas do painel...</span>
        </div>
      </div>
    );
  }

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  const salesGoal = 20000;
  const progressPercent = Math.min(Math.round((metrics.totalSales / salesGoal) * 100), 100);

  return (
    <div className="p-4 md:p-8 bg-[#0d1117] min-h-full animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h2 className="font-sans text-xl md:text-2xl font-bold text-[#f0f6fc] mb-1">Painel do Vendedor</h2>
          <p className="font-sans text-xs text-[#8b949e]">Métricas consolidadas e comissões da filial: <span className="text-primary font-semibold">{metrics.name}</span></p>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Card 1: Total Sales */}
          <div className="premium-card p-5 md:p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-xs text-[#8b949e] uppercase tracking-wider font-medium">Faturamento Acumulado</span>
                <div className="bg-primary/10 rounded-full p-2 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                </div>
              </div>
              <div className="font-mono text-xl md:text-2xl text-[#f0f6fc] mb-2 font-bold">
                R$ {metrics.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-primary/10 text-primary font-mono text-[10px] px-2 py-[2px] rounded border border-primary/20 font-bold">+14.2%</span>
                <span className="font-sans text-xs text-[#8b949e]">vs último mês</span>
              </div>
            </div>
            
            {/* Sales Goal Progress Bar (Hidden temporarily, structure preserved) */}
            {/* 
            <div className="space-y-2 pt-4 border-t border-[#21262d]">
              <div className="flex justify-between text-[11px] font-mono text-[#8b949e]">
                <span>META MENSAL (R$ 20.000,00)</span>
                <span className="text-primary font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#0d1117] h-2 rounded-full overflow-hidden border border-[#30363d]">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-1000 ease-out shadow-sm shadow-primary/25"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
            */}
          </div>

          {/* Card 2: Accumulated Commission Balance */}
          <div className="premium-card p-5 md:p-6 flex flex-col justify-between glow-effect relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0 pointer-events-none"></div>
            
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-xs text-primary uppercase tracking-wider font-bold">Saldo de Comissão</span>
                <div className="bg-primary/10 rounded-full p-2 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                </div>
              </div>
              <div>
                <div className="font-mono text-xl md:text-2xl text-primary mb-2 font-bold">
                  R$ {metrics.commissionBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-[#f0f6fc]">Taxa: {metrics.commissionRate}% por Venda</span>
                  {metrics.commissionBalance > 0 && (
                    <span className="bg-primary/10 text-primary font-mono text-[10px] px-2 py-[2px] rounded border border-primary/20 flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[12px]">pending</span> Disponível
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="mt-6 premium-card p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="font-mono text-xs text-[#8b949e] uppercase font-bold tracking-wider">Histórico de Transações Recentes</h3>
            {metrics.transactions.length > 0 && (
              <button
                onClick={exportTransactionsToCSV}
                className="bg-transparent hover:bg-primary/10 text-primary border border-primary/30 hover:border-primary font-mono text-[11px] font-bold py-1.5 px-3 rounded transition-all duration-300 active:scale-95 flex items-center gap-1 cursor-pointer w-full sm:w-auto justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Exportar CSV
              </button>
            )}
          </div>
          
          {metrics.transactions.length === 0 ? (
            <div className="text-center py-12 text-[#8b949e] font-mono text-xs uppercase tracking-wider">
              Nenhuma transação efetuada por esta filial.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {metrics.transactions.map((tx) => (
                <div 
                   key={tx.id}
                   className="flex flex-col border-b border-[#21262d] hover:bg-[#161b22]/40 transition-colors px-3 py-3 md:px-4 rounded-lg gap-2"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-[#f0f6fc] font-bold tracking-wider">{tx.id}</span>
                        <span className="bg-[#21262d] text-[#8b949e] text-[10px] font-mono px-2 py-[1.5px] rounded uppercase tracking-wider">
                          {tx.paymentMethod === 'Cash' ? 'Dinheiro' : tx.paymentMethod === 'Card' ? 'Cartão' : 'Dividido'}
                        </span>
                        {/* Mobile date shown directly next to status */}
                        <span className="md:hidden font-mono text-[10px] text-[#8b949e] ml-auto">{formatDate(tx.date)}</span>
                      </div>
                      {tx.customerCpf && (
                        <div className="text-[11px] font-mono text-[#8b949e] flex flex-wrap gap-x-2 gap-y-0.5">
                          <span>CPF: {tx.customerCpf}</span>
                          {tx.customerEmail && <span className="text-[#30363d] hidden sm:inline">|</span>}
                          {tx.customerEmail && <span className="truncate max-w-[200px] sm:max-w-none">Email: {tx.customerEmail}</span>}
                        </div>
                      )}
                      <button 
                        onClick={() => toggleExpandTx(tx.id)}
                        className="text-primary hover:underline text-[11px] font-mono font-bold flex items-center gap-0.5 cursor-pointer mt-1 self-start"
                      >
                        {expandedTxIds[tx.id] ? '- detalhes' : '+ detalhes'}
                      </button>
                    </div>
                    
                    {/* Desktop date */}
                    <span className="hidden md:inline font-mono text-xs text-[#8b949e] whitespace-nowrap px-4">{formatDate(tx.date)}</span>
                    
                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t border-[#21262d] pt-2 md:pt-0 md:border-t-0">
                      <div className="flex flex-col items-start md:items-end">
                        <span className="font-mono text-sm text-primary font-bold">
                          +R$ {tx.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#8b949e] font-mono">
                          Comissão: +R$ {tx.commission.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSale(tx.id)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded transition-colors flex items-center justify-center cursor-pointer"
                        title="Excluir Venda"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Items details */}
                  {expandedTxIds[tx.id] && tx.items && tx.items.length > 0 && (
                    <div className="mt-3 bg-[#0d1117]/80 border border-[#30363d] rounded-lg p-4 space-y-2 animate-fade-in w-full">
                      <div className="text-[10px] font-mono text-[#8b949e] uppercase tracking-wider font-bold mb-1">Itens do Pedido</div>
                      <div className="divide-y divide-[#21262d] text-xs font-mono">
                        {tx.items.map((item, idx) => (
                          <div key={idx} className="py-2 flex justify-between text-[#c9d1d9]">
                            <span className="font-sans text-[#f0f6fc]">
                              {item.name} <span className="text-primary font-mono font-bold text-[10px]">x{item.quantity}</span>
                            </span>
                            <span className="font-mono text-[#8b949e]">
                              R$ {item.price ? `${item.price.toFixed(2)} / un = R$ ${(item.price * item.quantity).toFixed(2)}` : `${(tx.amount/item.quantity).toFixed(2)} / un = R$ ${tx.amount.toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Success Modal */}
      {withdrawSuccess && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-6 max-w-sm w-full flex flex-col items-center text-center space-y-4 border border-[#30363d] max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-3xl font-bold">account_balance_wallet</span>
            </div>
            <div>
              <h3 className="font-sans text-lg font-bold text-[#f0f6fc]">Saque Concluído!</h3>
              <p className="font-sans text-xs text-[#8b949e] mt-1.5 leading-relaxed">
                O valor de de <span className="font-mono text-primary font-bold">R$ {lastWithdrawAmount.toFixed(2)}</span> foi liquidado e está a caminho da sua conta de recebimento.
              </p>
            </div>
            <button 
              onClick={() => setWithdrawSuccess(false)}
              className="w-full bg-primary text-[#0d1117] font-bold font-mono text-xs py-2.5 rounded-lg hover:bg-primary/95 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

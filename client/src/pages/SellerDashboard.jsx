import { useState, useEffect } from 'react'

const API_BASE = '/api';

export default function SellerDashboard({ activeAffiliateId, refreshTrigger }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [lastWithdrawAmount, setLastWithdrawAmount] = useState(0);

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
    <div className="p-8 bg-[#0d1117] min-h-full animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h2 className="font-sans text-2xl font-bold text-[#f0f6fc] mb-1">Painel do Vendedor</h2>
          <p className="font-sans text-xs text-[#8b949e]">Métricas consolidadas e comissões da filial: <span className="text-primary font-semibold">{metrics.name}</span></p>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Total Sales */}
          <div className="premium-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-xs text-[#8b949e] uppercase tracking-wider font-medium">Faturamento Acumulado</span>
                <div className="bg-primary/10 rounded-full p-2 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                </div>
              </div>
              <div className="font-mono text-2xl text-[#f0f6fc] mb-2 font-bold">
                R$ {metrics.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-primary/10 text-primary font-mono text-[10px] px-2 py-[2px] rounded border border-primary/20 font-bold">+14.2%</span>
                <span className="font-sans text-xs text-[#8b949e]">vs último mês</span>
              </div>
            </div>
            
            {/* Sales Goal Progress Bar */}
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
          </div>

          {/* Card 2: Accumulated Commission Balance */}
          <div className="premium-card p-6 flex flex-col justify-between glow-effect relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0 pointer-events-none"></div>
            
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-xs text-primary uppercase tracking-wider font-bold">Saldo de Comissão</span>
                <div className="bg-primary/10 rounded-full p-2 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                </div>
              </div>
              <div>
                <div className="font-mono text-2xl text-primary mb-2 font-bold">
                  R$ {metrics.commissionBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#f0f6fc]">Taxa: {metrics.commissionRate}% por Venda</span>
                  {metrics.commissionBalance > 0 && (
                    <span className="bg-primary/10 text-primary font-mono text-[10px] px-2 py-[2px] rounded border border-primary/20 flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[12px]">pending</span> Disponível para Saque
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-[#21262d] flex justify-end">
              <button 
                onClick={handleWithdrawFunds}
                className="bg-primary text-[#0d1117] font-mono text-xs font-bold py-2.5 px-4 rounded-lg hover:bg-primary/95 transition-all duration-300 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
              >
                Sacar Comissão
                <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="mt-6 premium-card p-6">
          <h3 className="font-mono text-xs text-[#8b949e] uppercase mb-4 font-bold tracking-wider">Histórico de Transações Recentes</h3>
          
          {metrics.transactions.length === 0 ? (
            <div className="text-center py-12 text-[#8b949e] font-mono text-xs uppercase tracking-wider">
              Nenhuma transação efetuada por esta filial.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {metrics.transactions.map((tx) => (
                <div 
                   key={tx.id}
                   className="flex justify-between items-center py-3 border-b border-[#21262d] hover:bg-[#161b22] transition-colors px-4 rounded-lg"
                >
                  <div className="flex flex-col gap-1.5 min-w-0 pr-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-[#f0f6fc] font-bold tracking-wider">{tx.id}</span>
                      <span className="bg-[#21262d] text-[#8b949e] text-[10px] font-mono px-2 py-[1.5px] rounded uppercase tracking-wider">
                        {tx.paymentMethod === 'Cash' ? 'Dinheiro' : tx.paymentMethod === 'Card' ? 'Cartão' : 'Dividido'}
                      </span>
                    </div>
                    {tx.customerCpf && (
                      <div className="text-[11px] font-mono text-[#8b949e] flex flex-wrap gap-2">
                        <span>CPF: {tx.customerCpf}</span>
                        {tx.customerEmail && <span className="text-[#30363d]">|</span>}
                        {tx.customerEmail && <span className="truncate">Email: {tx.customerEmail}</span>}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-xs text-[#8b949e] whitespace-nowrap px-4">{formatDate(tx.date)}</span>
                  <div className="flex items-center gap-4 shrink-0 pl-2">
                    <div className="flex flex-col items-end">
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Success Modal */}
      {withdrawSuccess && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-6 max-w-sm w-full flex flex-col items-center text-center space-y-4 border border-[#30363d]">
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

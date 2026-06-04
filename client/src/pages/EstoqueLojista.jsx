import { useState, useEffect } from 'react'

const API_BASE = '/api';

export default function EstoqueLojista({ activeAffiliateId }) {
  const [stocks, setStocks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Replenish request states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [requestQty, setRequestQty] = useState(10);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const fetchStocksAndRequests = async () => {
    try {
      setLoading(true);
      // Fetch local stocks
      const stockRes = await fetch(`${API_BASE}/stocks/${activeAffiliateId}`);
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        setStocks(stockData);
      }

      // Fetch recent requests
      const requestRes = await fetch(`${API_BASE}/stocks/requests?affiliateId=${activeAffiliateId}`);
      if (requestRes.ok) {
        const requestData = await requestRes.json();
        setRequests(requestData);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching lojista stock data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocksAndRequests();
  }, [activeAffiliateId]);

  const handleOpenRequestModal = (product) => {
    setSelectedProduct(product);
    setRequestQty(10);
    setIsRequestModalOpen(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || requestQty <= 0) return;

    try {
      const res = await fetch(`${API_BASE}/stocks/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          affiliateId: activeAffiliateId,
          productId: selectedProduct.productId,
          quantity: Number(requestQty)
        })
      });

      if (res.ok) {
        setIsRequestModalOpen(false);
        setRequestSuccess(true);
        fetchStocksAndRequests(); // Refresh data
      } else {
        alert("Erro ao enviar solicitação.");
      }
    } catch (err) {
      console.error("Error submitting replenishment request:", err);
      alert("Falha na conexão com o servidor.");
    }
  };

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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117] text-[#8b949e] font-mono">
        <div className="flex flex-col items-center space-y-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          <span>Carregando dados de estoque...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#0d1117] min-h-full animate-fade-in space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h2 className="font-sans text-2xl font-bold text-[#f0f6fc] mb-1">Meu Estoque</h2>
          <p className="font-sans text-xs text-[#8b949e]">Consulte os níveis de estoque locais e solicite o reabastecimento de produtos.</p>
        </header>

        {/* Inventory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stocks.map((item) => {
            const isOutOfStock = item.quantity === 0;
            const isCritical = item.quantity > 0 && item.quantity < 5;

            return (
              <div 
                key={item.productId}
                className="premium-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-sans text-[10px] text-primary font-mono uppercase tracking-wider block mb-1">
                        {item.category || 'Suplementos'}
                      </span>
                      <h3 className="font-sans text-sm text-[#f0f6fc] font-bold line-clamp-1">
                        {item.productName}
                      </h3>
                    </div>
                    
                    <span 
                      className={`font-mono text-[9px] px-2 py-[2px] rounded border font-bold uppercase tracking-wider ${
                        isOutOfStock 
                          ? 'bg-[#ff6e61]/10 text-[#ff6e61] border-[#ff6e61]/20' 
                          : isCritical 
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                            : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      {isOutOfStock ? 'Sem Estoque' : isCritical ? 'Estoque Crítico' : 'Normal'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span className={`font-mono text-3xl font-bold ${
                      isOutOfStock ? 'text-[#ff6e61]' : isCritical ? 'text-yellow-500' : 'text-primary'
                    }`}>
                      {item.quantity}
                    </span>
                    <span className="font-sans text-xs text-[#8b949e]">unidades em estoque</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenRequestModal(item)}
                  className={`w-full py-2 px-4 rounded-lg font-mono text-xs font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer border ${
                    isOutOfStock 
                      ? 'bg-[#ff6e61] border-[#ff6e61] text-[#fafafa] hover:bg-[#ff6e61]/90 shadow-md shadow-[#ff6e61]/10' 
                      : 'bg-transparent border-[#30363d] text-[#f0f6fc] hover:bg-[#21262d] hover:border-[#8b949e]'
                  }`}
                >
                  Solicitar Reposição
                </button>
              </div>
            );
          })}
        </div>

        {/* Recent Replenishment Requests Table */}
        <div className="premium-card p-6 mt-6">
          <h3 className="font-mono text-xs text-[#8b949e] uppercase mb-4 font-bold tracking-wider">Solicitações de Abastecimento Recentes</h3>
          
          {requests.length === 0 ? (
            <div className="text-center py-8 text-[#8b949e] font-mono text-xs uppercase tracking-wider">
              Nenhuma solicitação de reposição enviada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">ID</th>
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Produto</th>
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Qtd Solicitada</th>
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Data</th>
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b border-[#21262d] hover:bg-[#161b22] transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-[#f0f6fc] font-bold">{req.id}</td>
                      <td className="py-3 px-4 font-sans text-sm text-[#f0f6fc]">{req.productName}</td>
                      <td className="py-3 px-4 font-mono text-sm text-right font-bold pr-12 text-[#f0f6fc]">{req.quantity} un</td>
                      <td className="py-3 px-4 font-mono text-xs text-[#8b949e]">{formatDate(req.date)}</td>
                      <td className="py-3 px-4 text-center">
                        <span 
                          className={`font-mono text-[9px] px-2 py-[2px] rounded border font-bold uppercase tracking-wider ${
                            req.status === 'Pendente'
                              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/25'
                              : 'bg-primary/10 text-primary border-primary/25'
                          }`}
                        >
                          {req.status === 'Pendente' ? 'Pendente' : 'Atendido'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Replenish Request Quantity Selection Modal */}
      {isRequestModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-6 max-w-sm w-full border border-[#30363d] relative">
            <button 
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-3 right-3 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-sans text-lg font-bold text-[#f0f6fc] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              Solicitar Abastecimento
            </h3>
            
            <form onSubmit={handleRequestSubmit} className="space-y-4 font-mono text-xs pt-2">
              <div className="space-y-1 pb-2">
                <span className="text-[#8b949e] text-[10px] uppercase font-bold tracking-wider">Produto</span>
                <p className="text-sm font-sans font-semibold text-[#f0f6fc]">{selectedProduct.productName}</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">
                  Quantidade Necessária
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  value={requestQty}
                  onChange={(e) => setRequestQty(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-mono text-sm" 
                  required
                />
              </div>

              <div className="pt-4 flex gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="flex-1 bg-transparent border border-outline text-[#f0f6fc] font-mono py-2.5 rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer active:scale-95 text-center"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary text-[#0d1117] font-mono font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer active:scale-95 shadow-md shadow-primary/5 text-center uppercase tracking-wider"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replenish Alert Confirmation Modal */}
      {requestSuccess && selectedProduct && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-6 max-w-sm w-full flex flex-col items-center text-center space-y-4 border border-[#30363d]">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-3xl font-bold">local_shipping</span>
            </div>
            <div>
              <h3 className="font-sans text-lg font-bold text-[#f0f6fc]">Solicitação Registrada!</h3>
              <p className="font-sans text-xs text-[#8b949e] mt-1.5 leading-relaxed">
                Sua solicitação de reabastecimento foi salva e enviada para aprovação do Administrador.
              </p>
            </div>
            <button 
              onClick={() => {
                setRequestSuccess(false);
                fetchStocksAndRequests();
              }}
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

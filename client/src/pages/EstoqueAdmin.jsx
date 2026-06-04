import { useState, useEffect } from 'react'

const API_BASE = '/api';

export default function EstoqueAdmin({ refreshTrigger }) {
  const [stocks, setStocks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Replenishment modals
  const [selectedStock, setSelectedStock] = useState(null);
  const [isReplenishOpen, setIsReplenishOpen] = useState(false);
  const [replenishQty, setReplenishQty] = useState(10);

  // Product modals states
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Proteínas');
  const [prodSku, setProdSku] = useState('');
  const [prodGeneralStock, setProdGeneralStock] = useState(100);
  const [prodPrice, setProdPrice] = useState(0);
  const [prodPromoPrice, setProdPromoPrice] = useState('');
  const [prodImage, setProdImage] = useState('');

  const fetchAllData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      
      // Fetch affiliates
      const affRes = await fetch(`${API_BASE}/affiliates`);
      let currentAffiliates = [];
      if (affRes.ok) {
        currentAffiliates = await affRes.json();
        setAffiliates(currentAffiliates);
      }

      // Fetch products catalog
      const prodRes = await fetch(`${API_BASE}/products`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }

      // Fetch general stocks
      const stockRes = await fetch(`${API_BASE}/stocks`);
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        setStocks(stockData);
      }

      // Fetch replenishment requests
      const requestRes = await fetch(`${API_BASE}/stocks/requests`);
      if (requestRes.ok) {
        const requestData = await requestRes.json();
        setRequests(requestData);
      }

      // Auto-select first affiliate if none selected
      if (currentAffiliates.length > 0) {
        setSelectedAffiliateId(prev => prev || currentAffiliates[0].id);
      }
      
      if (!isSilent) setLoading(false);
    } catch (err) {
      console.error("Error fetching admin stocks data:", err);
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Polling in the background every 4 seconds (silent) to keep it in sync in real-time
    const interval = setInterval(() => fetchAllData(true), 4000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenReplenish = (stockItem) => {
    setSelectedStock(stockItem);
    setReplenishQty(10);
    setIsReplenishOpen(true);
  };

  const handleReplenishSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStock || replenishQty <= 0) return;

    try {
      const res = await fetch(`${API_BASE}/stocks/replenish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          affiliateId: selectedStock.affiliateId,
          productId: selectedStock.productId,
          quantity: Number(replenishQty)
        })
      });

      if (res.ok) {
        setIsReplenishOpen(false);
        fetchAllData();
        refreshTrigger();
      } else {
        const errData = await res.json();
        alert(`Erro ao reabastecer estoque: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error replenishing stock:", err);
      alert("Falha na conexão com o servidor.");
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const res = await fetch(`${API_BASE}/stocks/requests/${requestId}/approve`, {
        method: 'POST'
      });

      if (res.ok) {
        fetchAllData();
        refreshTrigger();
      } else {
        const errData = await res.json();
        alert(`Erro ao aprovar solicitação: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error approving replenishment request:", err);
      alert("Falha na conexão com o servidor.");
    }
  };

  // Product CRUD Action Handlers
  const handleOpenCreateProduct = () => {
    setSelectedProduct(null);
    setProdName('');
    setProdCategory('Proteínas');
    setProdSku('');
    setProdGeneralStock(100);
    setProdPrice(0);
    setProdPromoPrice('');
    setProdImage('');
    setIsProdModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setSelectedProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.category || 'Proteínas');
    setProdSku(prod.sku || '');
    setProdGeneralStock(prod.generalStock !== undefined ? prod.generalStock : 0);
    setProdPrice(prod.price);
    setProdPromoPrice(prod.promoPrice !== null && prod.promoPrice !== undefined ? prod.promoPrice : '');
    setProdImage(prod.type === 'image' ? prod.image : '');
    setIsProdModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    if (!prodName || !prodCategory || !prodSku || prodPrice === undefined || prodGeneralStock === undefined) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const url = selectedProduct 
        ? `${API_BASE}/products/${selectedProduct.id}`
        : `${API_BASE}/products`;
      const method = selectedProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: prodName,
          category: prodCategory,
          sku: prodSku,
          price: Number(prodPrice),
          promoPrice: prodPromoPrice !== '' ? Number(prodPromoPrice) : null,
          generalStock: Number(prodGeneralStock),
          image: prodImage
        })
      });

      if (res.ok) {
        setIsProdModalOpen(false);
        fetchAllData();
        refreshTrigger();
      } else {
        const errData = await res.json();
        alert(`Erro ao salvar produto: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Falha na conexão com o servidor.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Deseja realmente excluir este produto? Isso removerá o estoque associado a ele em todos os lojistas.")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchAllData();
        refreshTrigger();
      } else {
        const errData = await res.json();
        alert(`Erro ao excluir produto: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error deleting product:", err);
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

  const filteredStocks = stocks.filter(item => 
    item.affiliateId === selectedAffiliateId
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117] text-[#8b949e] font-mono">
        <div className="flex flex-col items-center space-y-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          <span>Carregando dados de estoque geral...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#0d1117] min-h-full animate-fade-in space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div>
          <h1 className="font-sans text-2xl font-bold text-[#f0f6fc]">Estoque Geral</h1>
          <p className="font-sans text-xs text-[#8b949e] mt-1">
            Monitore o estoque das lojas parceiras e aprove solicitações de reabastecimento.
          </p>
        </div>

        {/* CD Catalog & Products Section */}
        <div className="premium-card p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="font-sans font-bold text-base text-[#f0f6fc] flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">warehouse</span>
                Estoque Central & Catálogo de Produtos (CD)
              </h3>
              <p className="font-sans text-xs text-[#8b949e] mt-1">Cadastre, edite e acompanhe o estoque geral do centro de distribuição.</p>
            </div>
            <button
              onClick={handleOpenCreateProduct}
              className="bg-primary text-[#0d1117] px-4 py-2.5 rounded-lg font-mono text-xs font-bold hover:opacity-95 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10 select-none active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] font-bold">add</span>
              Novo Produto
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-8 text-[#8b949e] font-mono text-xs uppercase tracking-wider border border-dashed border-[#30363d] rounded-xl">
              Nenhum produto cadastrado no catálogo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">SKU</th>
                    <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Produto</th>
                    <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Categoria</th>
                    <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Estoque Geral (CD)</th>
                    <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Preço Normal</th>
                    <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Preço Promocional</th>
                    <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod.id} className="border-b border-[#21262d] hover:bg-[#161b22] transition-colors">
                      <td className="py-4 px-4 font-mono text-xs text-[#8b949e]">{prod.sku}</td>
                      <td className="py-4 px-4 font-sans text-sm text-[#f0f6fc] font-semibold">{prod.name}</td>
                      <td className="py-4 px-4 font-sans text-xs text-[#8b949e]">{prod.category}</td>
                      <td className="py-4 px-4 font-mono text-sm text-right font-bold pr-8">
                        <span className={prod.generalStock === 0 ? 'text-[#ff6e61]' : prod.generalStock < 10 ? 'text-yellow-500' : 'text-primary'}>
                          {prod.generalStock} un
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-right text-[#f0f6fc] font-semibold">
                        R$ {Number(prod.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-right text-primary font-bold">
                        {prod.promoPrice !== null && prod.promoPrice !== undefined ? (
                          `R$ ${Number(prod.promoPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-[#8b949e]/30 font-normal font-sans">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="text-[#8b949e] hover:text-primary transition-colors cursor-pointer active:scale-90"
                            title="Editar produto"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="text-[#8b949e] hover:text-[#ff6e61] transition-colors cursor-pointer active:scale-90"
                            title="Excluir produto"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Lojistas List (Master) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-mono text-xs text-[#8b949e] uppercase font-bold tracking-wider px-1">Lojistas Parceiros</h3>
            
            <div className="space-y-3">
              {affiliates.map((aff) => {
                const isSelected = aff.id === selectedAffiliateId;
                
                // Calculate stock status alerts for this affiliate
                const affStocks = stocks.filter(s => s.affiliateId === aff.id);
                const outOfStockCount = affStocks.filter(s => s.quantity === 0).length;
                const criticalStockCount = affStocks.filter(s => s.quantity > 0 && s.quantity < 5).length;
                const totalItems = affStocks.length;

                return (
                  <div
                    key={aff.id}
                    onClick={() => setSelectedAffiliateId(aff.id)}
                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#1f2937]/40 border-primary shadow-lg shadow-primary/5'
                        : 'bg-[#161b22] border-[#30363d] hover:border-[#8b949e]/45 hover:bg-[#161b22]/80'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className={`font-sans text-sm font-bold transition-colors ${isSelected ? 'text-primary' : 'text-[#f0f6fc]'}`}>
                          {aff.name}
                        </h4>
                        <span className="font-sans text-[11px] text-[#8b949e] block mt-0.5">{aff.location}</span>
                      </div>
                      
                      <span className="font-mono text-[9px] font-semibold text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d] tracking-wider">
                        {aff.id}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                      <span className="font-sans text-[10px] text-[#8b949e] mr-auto font-medium">
                        {totalItems} produto(s)
                      </span>

                      {outOfStockCount > 0 && (
                        <span className="font-mono text-[9px] font-bold px-2 py-[1px] bg-[#ff6e61]/10 text-[#ff6e61] border border-[#ff6e61]/25 rounded">
                          {outOfStockCount} Esgotado
                        </span>
                      )}

                      {criticalStockCount > 0 && (
                        <span className="font-mono text-[9px] font-bold px-2 py-[1px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/25 rounded">
                          {criticalStockCount} Crítico
                        </span>
                      )}

                      {outOfStockCount === 0 && criticalStockCount === 0 && totalItems > 0 && (
                        <span className="font-mono text-[9px] font-bold px-2 py-[1px] bg-primary/10 text-primary border border-primary/25 rounded">
                          Normal
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {affiliates.length === 0 && (
                <div className="text-center py-6 text-[#8b949e] font-mono text-xs border border-dashed border-[#30363d] rounded-xl">
                  Nenhum lojista cadastrado.
                </div>
              )}
            </div>
          </div>

          {/* Right: Selected Lojista Stock (Detail) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedAffiliateId ? (
              (() => {
                const selectedAff = affiliates.find(a => a.id === selectedAffiliateId);
                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end px-1">
                      <div>
                        <h3 className="font-mono text-xs text-[#8b949e] uppercase font-bold tracking-wider">Estoque Atual</h3>
                        <h2 className="font-sans text-lg font-bold text-[#f0f6fc] mt-1">
                          {selectedAff ? selectedAff.name : 'Carregando...'}
                        </h2>
                      </div>
                      <span className="font-sans text-xs text-[#8b949e]">
                        {selectedAff ? selectedAff.location : ''}
                      </span>
                    </div>

                    <div className="premium-card p-6 overflow-x-auto">
                      {filteredStocks.length === 0 ? (
                        <div className="text-center py-12 text-[#8b949e] font-mono text-xs uppercase tracking-wider space-y-2">
                          <div>Nenhum produto em estoque nesta filial.</div>
                          <div className="text-[10px] text-[#8b949e]/60 font-sans normal-case">
                            Os produtos aparecerão assim que forem abastecidos pela primeira vez.
                          </div>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <thead>
                            <tr className="border-b border-[#21262d]">
                              <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Produto</th>
                              <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Qtd em Estoque</th>
                              <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-center">Status</th>
                              <th className="pb-4 pt-2 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStocks.map((item, index) => {
                              const isOutOfStock = item.quantity === 0;
                              const isCritical = item.quantity > 0 && item.quantity < 5;

                              return (
                                <tr 
                                  key={`${item.affiliateId}-${item.productId}-${index}`}
                                  className="border-b border-[#21262d] hover:bg-[#161b22] transition-colors"
                                >
                                  <td className="py-4 px-4 font-sans text-sm text-[#f0f6fc]">{item.productName}</td>
                                  <td className="py-4 px-4 font-mono text-sm text-right font-bold pr-12">
                                    <span className={isOutOfStock ? 'text-[#ff6e61]' : isCritical ? 'text-yellow-500' : 'text-primary'}>
                                      {item.quantity} un
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                    <span 
                                      className={`font-mono text-[9px] px-2.5 py-[2px] rounded border font-bold uppercase tracking-wider ${
                                        isOutOfStock 
                                          ? 'bg-[#ff6e61]/10 text-[#ff6e61] border-[#ff6e61]/25' 
                                          : isCritical 
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/25' 
                                            : 'bg-primary/10 text-primary border-primary/25'
                                      }`}
                                    >
                                      {isOutOfStock ? 'Esgotado' : isCritical ? 'Crítico' : 'Normal'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                    <button
                                      onClick={() => handleOpenReplenish(item)}
                                      className="bg-primary text-[#0d1117] font-mono text-[11px] font-bold px-4 py-1.5 rounded-lg hover:opacity-90 transition-all duration-300 cursor-pointer active:scale-95 shadow-md shadow-primary/5"
                                    >
                                      Abastecer
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="premium-card p-12 text-center text-[#8b949e] font-mono text-xs uppercase tracking-wider">
                Selecione um lojista parceiro na lista lateral para ver os detalhes do estoque.
              </div>
            )}
          </div>
        </div>

        {/* Replenishment Requests Table */}
        <div className="premium-card p-6">
          <h3 className="font-mono text-xs text-[#8b949e] uppercase mb-4 font-bold tracking-wider">Solicitações de Abastecimento Recebidas</h3>
          
          {requests.length === 0 ? (
            <div className="text-center py-8 text-[#8b949e] font-mono text-xs uppercase tracking-wider">
              Nenhuma solicitação de reposição pendente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">ID</th>
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Parceiro</th>
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Produto</th>
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-right">Qtd Requerida</th>
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold">Data</th>
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-center">Status</th>
                    <th className="pb-3 pt-1 px-4 uppercase font-mono text-xs text-[#8b949e] tracking-wider font-semibold text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b border-[#21262d] hover:bg-[#161b22] transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-[#f0f6fc] font-bold">{req.id}</td>
                      <td className="py-3 px-4 font-sans text-sm text-[#f0f6fc] font-semibold">{req.affiliateName}</td>
                      <td className="py-3 px-4 font-sans text-sm text-[#f0f6fc]">{req.productName}</td>
                      <td className="py-3 px-4 font-mono text-sm text-right font-bold pr-12 text-[#f0f6fc]">{req.quantity} un</td>
                      <td className="py-3 px-4 font-mono text-xs text-[#8b949e]">{formatDate(req.date)}</td>
                      <td className="py-3 px-4 text-center">
                        <span 
                          className={`font-mono text-[9px] px-2.5 py-[2px] rounded border font-bold uppercase tracking-wider ${
                            req.status === 'Pendente'
                              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/25'
                              : 'bg-primary/10 text-primary border-primary/25'
                          }`}
                        >
                          {req.status === 'Pendente' ? 'Pendente' : 'Atendido'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {req.status === 'Pendente' ? (
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            className="bg-primary text-[#0d1117] font-mono text-[11px] font-bold px-4 py-1.5 rounded-lg hover:opacity-90 transition-all duration-300 cursor-pointer active:scale-95"
                          >
                            Aprovar
                          </button>
                        ) : (
                          <span className="text-[#8b949e] font-mono text-xs">Concluído</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Replenish Modal Form */}
      {isReplenishOpen && selectedStock && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-6 max-w-sm w-full border border-[#30363d] relative">
            <button 
              onClick={() => setIsReplenishOpen(false)}
              className="absolute top-3 right-3 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-sans text-lg font-bold text-[#f0f6fc] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
              Abastecer Estoque
            </h3>
            
            <form onSubmit={handleReplenishSubmit} className="space-y-4 font-mono text-xs pt-2">
              <div className="space-y-1">
                <span className="text-[#8b949e] text-[10px] uppercase font-bold tracking-wider">Parceiro</span>
                <p className="text-sm font-sans font-semibold text-[#f0f6fc]">{selectedStock.affiliateName}</p>
              </div>

              <div className="space-y-1 pb-2">
                <span className="text-[#8b949e] text-[10px] uppercase font-bold tracking-wider">Produto</span>
                <p className="text-sm font-sans font-semibold text-[#f0f6fc]">{selectedStock.productName}</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">
                  Quantidade a Adicionar
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  value={replenishQty}
                  onChange={(e) => setReplenishQty(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-mono text-sm" 
                  required
                />
              </div>

              <div className="pt-4 flex gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setIsReplenishOpen(false)}
                  className="flex-1 bg-transparent border border-outline text-[#f0f6fc] font-mono py-2.5 rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer active:scale-95 text-center"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary text-[#0d1117] font-mono font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer active:scale-95 shadow-md shadow-primary/5 text-center uppercase tracking-wider"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Create/Edit Modal */}
      {isProdModalOpen && (
        <div id="product-crud-modal" className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-6 max-w-md w-full border border-[#30363d] relative">
            <button 
              onClick={() => setIsProdModalOpen(false)}
              className="absolute top-3 right-3 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-sans text-lg font-bold text-[#f0f6fc] mb-4">
              {selectedProduct ? `Editar Produto: ${selectedProduct.name}` : 'Cadastrar Novo Produto'}
            </h3>
            
            <form onSubmit={handleProductSubmit} className="space-y-4 font-mono text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Nome do Produto</label>
                <input 
                  type="text" 
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-sm" 
                  placeholder="Ex: Whey Pro Isolate" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">SKU</label>
                  <input 
                    type="text" 
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-mono text-xs uppercase" 
                    placeholder="Ex: WHEY-ISO-1" 
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Categoria</label>
                  <select 
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-xs cursor-pointer"
                  >
                    <option value="Proteínas">Proteínas</option>
                    <option value="Recuperação">Recuperação</option>
                    <option value="Pré-treinos">Pré-treinos</option>
                    <option value="Vitaminas">Vitaminas</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">URL da Imagem / Thumbnail (Opcional)</label>
                <input 
                  type="text" 
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-sm animate-fade-in" 
                  placeholder="Ex: https://site.com/imagem.png" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Quantidade no CD (Estoque Geral)</label>
                <input 
                  type="number" 
                  min="0"
                  value={prodGeneralStock}
                  onChange={(e) => setProdGeneralStock(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-mono text-sm" 
                  placeholder="100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Preço Normal (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-mono text-sm" 
                    placeholder="45.00" 
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Preço Promocional (R$ - Opcional)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={prodPromoPrice}
                    onChange={(e) => setProdPromoPrice(e.target.value)}
                    className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-mono text-sm" 
                    placeholder="Deixe vazio se não houver" 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setIsProdModalOpen(false)}
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react'

const API_BASE = '/api';

export default function POS({ activeAffiliateId, refreshTrigger }) {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState([]);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastTxId, setLastTxId] = useState('');
  const [lastTxTotal, setLastTxTotal] = useState(0);

  // NF-e customer info states
  const [isNfModalOpen, setIsNfModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [activeMobileTab, setActiveMobileTab] = useState('catalog');

  // Fetch store-specific products and stock levels
  const fetchProductsAndStocks = async () => {
    try {
      const res = await fetch(`${API_BASE}/stocks/${activeAffiliateId}`);
      if (!res.ok) {
        setProducts([]);
        return;
      }
      const data = await res.json();
      
      const normalized = data.map(item => {
        const prodName = item.productName || 'Produto Sem Nome';
        const price = Number(item.price) || 0;
        const qty = item.quantity !== undefined ? Number(item.quantity) : 0;

        // Use category from db if present, otherwise fall back to string decoding
        let category = item.category || 'Suplementos';
        if (!item.category) {
          const lowerName = prodName.toLowerCase();
          if (lowerName.includes('whey') || lowerName.includes('isolate')) {
            category = 'Proteínas';
          } else if (lowerName.includes('pre-workout') || lowerName.includes('xtreme')) {
            category = 'Pré-treinos';
          } else if (lowerName.includes('bcaa') || lowerName.includes('recovery')) {
            category = 'Recuperação';
          }
        }
        
        // If there's an active promoPrice, we use it for checkout, but we store both prices
        const hasPromo = item.promoPrice !== null && item.promoPrice !== undefined && Number(item.promoPrice) > 0 && Number(item.promoPrice) < price;
        const activePrice = hasPromo ? Number(item.promoPrice) : price;

        return {
          id: item.productId,
          name: prodName,
          originalPrice: price,
          price: activePrice,
          promoPrice: item.promoPrice !== null && item.promoPrice !== undefined ? Number(item.promoPrice) : null,
          hasPromo,
          image: item.image || 'inventory',
          type: item.type || 'icon',
          category,
          stock: qty
        };
      });
      
      setProducts(normalized);
    } catch (err) {
      console.error("Error fetching stocks & products:", err);
    }
  };

  useEffect(() => {
    fetchProductsAndStocks();

    const handleClearCart = () => {
      setCart([]);
    };
    window.addEventListener('clear-cart', handleClearCart);
    return () => {
      window.removeEventListener('clear-cart', handleClearCart);
    };
  }, [activeAffiliateId]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product) => {
    const qtyInCart = getProductQuantityInCart(product.id);
    if (qtyInCart >= product.stock) {
      alert(`Quantidade limite em estoque atingida para ${product.name}! Disponível: ${product.stock} un.`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      if (existingItem) {
        if (existingItem.quantity === 1) {
          return prevCart.filter(item => item.id !== productId);
        }
        return prevCart.map(item =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prevCart;
    });
  };

  const getProductQuantityInCart = (productId) => {
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  // Mask CPF input helper
  const handleCpfChange = (e) => {
    let value = e.target.value;
    value = value
      .replace(/\D/g, '') // remove non-digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2'); // apply CPF formatting
    setCustomerCpf(value.substring(0, 14)); // limit length
  };

  // Open intermediate checkout modal
  const handleOpenNfModal = (paymentMethod) => {
    if (!cart.length) {
      alert("Seu carrinho de compras está vazio!");
      return;
    }
    setSelectedPaymentMethod(paymentMethod);
    setIsNfModalOpen(true);
  };

  // Submit order to API
  const submitCheckout = async (e) => {
    e.preventDefault();
    
    // Validate CPF length
    if (customerCpf.replace(/\D/g, '').length !== 11) {
      alert("Por favor, informe um CPF válido com 11 dígitos.");
      return;
    }

    try {
      const itemsPayload = cart.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      // Se o método de pagamento for cartão (Mercado Pago Checkout Pro)
      if (selectedPaymentMethod === 'Card') {
        const res = await fetch(`${API_BASE}/checkout/preference`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            affiliateId: activeAffiliateId,
            items: itemsPayload,
            customerCpf,
            customerEmail: customerEmail.trim() || null
          })
        });

        if (res.ok) {
          const data = await res.json();
          // Limpar carrinho e fechar modal
          setCart([]);
          setIsNfModalOpen(false);
          setCustomerCpf('');
          setCustomerEmail('');
          fetchProductsAndStocks();
          refreshTrigger();
          
          // Redirecionar para o Mercado Pago
          if (data.init_point) {
            window.location.href = data.init_point;
          } else {
            alert("Erro: URL de checkout do Mercado Pago não encontrada.");
          }
        } else {
          const errData = await res.json();
          alert(`Erro ao gerar checkout do Mercado Pago: ${errData.error}`);
        }
        return;
      }

      // Outros métodos de pagamento (Cash / Split) - Fluxo padrão direto
      const res = await fetch(`${API_BASE}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          affiliateId: activeAffiliateId,
          items: itemsPayload,
          paymentMethod: selectedPaymentMethod,
          customerCpf,
          customerEmail: customerEmail.trim() || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastTxId(data.transaction.id);
        setLastTxTotal(data.transaction.total);
        setCheckoutSuccess(true);
        setCart([]);
        setIsNfModalOpen(false);
        setCustomerCpf('');
        setCustomerEmail('');
        fetchProductsAndStocks(); // Reload updated stocks
        refreshTrigger();
      } else {
        const errData = await res.json();
        alert(`Erro no faturamento: ${errData.error}`);
      }
    } catch (err) {
      console.error("Error during checkout:", err);
      alert("Falha na conexão com o servidor.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0d1117] animate-fade-in relative">
      
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden border-b border-[#30363d] bg-[#161b22] shrink-0 font-mono text-xs z-20">
        <button 
          type="button"
          onClick={() => setActiveMobileTab('catalog')}
          className={`flex-1 py-4 text-center border-b-2 font-bold transition-all ${activeMobileTab === 'catalog' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-[#8b949e]'}`}
        >
          Catálogo
        </button>
        <button 
          type="button"
          onClick={() => setActiveMobileTab('cart')}
          className={`flex-1 py-4 text-center border-b-2 font-bold flex justify-center items-center gap-1.5 transition-all ${activeMobileTab === 'cart' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-[#8b949e]'}`}
        >
          Carrinho
          {cart.length > 0 && (
            <span className="bg-primary text-[#0d1117] text-[10px] font-bold px-2 py-[1.5px] rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Product Catalog Area */}
      <section className={`flex-1 p-4 md:p-8 overflow-y-auto flex flex-col ${activeMobileTab === 'catalog' ? 'flex' : 'hidden md:flex'}`}>
        {/* Header Title & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="font-sans text-2xl font-bold text-[#f0f6fc]">Ponto de Venda (PDV)</h1>
            <p className="font-sans text-xs text-[#8b949e] mt-1">Selecione produtos e registre vendas rapidamente.</p>
          </div>
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] text-[20px]">search</span>
            <input 
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg py-2.5 pl-10 pr-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-sm transition-all placeholder:text-[#8b949e]" 
              placeholder="Buscar produtos..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex flex-wrap gap-2.5 border-b border-[#30363d] pb-3 mb-6">
          {['Todos', 'Proteínas', 'Pré-treinos', 'Recuperação', 'Vitaminas'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-mono text-[12px] uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-[#0d1117] font-bold shadow-md shadow-primary/5'
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8b949e] py-12 space-y-4">
            <span className="material-symbols-outlined text-5xl">inventory</span>
            <p className="font-mono text-xs uppercase tracking-wider">Nenhum produto em estoque</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const qty = getProductQuantityInCart(product.id);
              const isOutOfStock = product.stock === 0;
              const isLimitReached = qty >= product.stock;

              return (
                <div 
                  key={product.id}
                  className={`premium-card flex flex-col justify-between overflow-hidden relative ${
                    isOutOfStock ? 'opacity-55' : ''
                  }`}
                >
                  {/* Visual Container */}
                  <div className="aspect-square bg-[#0d1117] overflow-hidden relative border-b border-[#21262d] flex items-center justify-center group w-full">
                    {product.type === 'image' ? (
                      <img 
                        className={`w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300 ${
                          isOutOfStock ? 'grayscale filter' : ''
                        }`} 
                        alt={product.name}
                        src={product.image} 
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-4xl">{product.image}</span>
                      </div>
                    )}

                    {/* Stock level indicators */}
                    {isOutOfStock ? (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-[#ff6e61] text-[#fafafa] font-mono text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                          Sem Estoque
                        </span>
                      </div>
                    ) : product.stock < 5 ? (
                      <span className="absolute top-2.5 left-2.5 bg-[#ff6e61] text-[#fafafa] font-mono text-[9px] px-1.5 py-[2px] rounded font-bold uppercase tracking-wider border border-[#ff6e61]/35">
                        Crítico: {product.stock}
                      </span>
                    ) : null}

                    {qty > 0 && (
                      <span className="absolute top-2.5 right-2.5 bg-primary text-[#0d1117] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-fade-in font-mono">
                        {qty}
                      </span>
                    )}
                  </div>

                  {/* Text & Action Area */}
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <div className="font-mono text-[10px] text-primary uppercase tracking-wider mb-1">{product.category}</div>
                      <h3 className="font-sans text-sm text-[#f0f6fc] font-semibold line-clamp-1 mb-1">{product.name}</h3>
                      <div className="font-mono text-[11px] text-[#8b949e] mb-3">
                        Estoque: <span className={product.stock < 5 ? 'text-[#ff6e61] font-bold' : 'text-primary'}>{product.stock} un</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="font-mono text-base mb-3 flex flex-wrap items-baseline gap-2">
                        {product.hasPromo ? (
                          <>
                            <span className="text-primary font-bold">
                              R$ {product.price.toFixed(2)}
                            </span>
                            <span className="text-[#8b949e] line-through text-xs font-normal">
                              R$ {product.originalPrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#f0f6fc] font-bold">
                            R$ {product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between bg-[#0d1117] rounded-lg p-1 border border-[#30363d]">
                        <button 
                          onClick={() => handleRemoveFromCart(product.id)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90 ${
                            qty > 0 
                              ? 'text-[#f0f6fc] hover:text-[#ff6e61] hover:bg-[#ff6e61]/10 cursor-pointer' 
                              : 'text-[#8b949e] cursor-not-allowed opacity-40'
                          }`}
                          disabled={qty === 0}
                        >
                          <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <span className="font-mono text-[#f0f6fc] font-semibold">{qty}</span>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock || isLimitReached}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90 ${
                            isOutOfStock || isLimitReached
                              ? 'text-[#8b949e] cursor-not-allowed opacity-30'
                              : 'text-[#f0f6fc] hover:text-primary hover:bg-primary/10 cursor-pointer'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Shopping Cart Sidebar */}
      <aside className={`w-full md:w-80 bg-[#161b22] border-l border-[#30363d] h-full flex-col z-30 shadow-2xl relative ${activeMobileTab === 'cart' ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-5 border-b border-[#30363d] flex justify-between items-center bg-[#161b22]/50">
          <div>
            <h2 className="font-sans text-lg font-bold text-[#f0f6fc]">Carrinho</h2>
            <div className="font-sans text-xs text-[#8b949e] mt-1">Faturamento</div>
          </div>
          <span className="material-symbols-outlined text-primary">shopping_basket</span>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#8b949e] py-8 space-y-3">
              <span className="material-symbols-outlined text-5xl">shopping_cart_checkout</span>
              <p className="text-xs font-mono uppercase tracking-wider text-center">Carrinho Vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.id}
                className="flex justify-between items-center pb-3 border-b border-[#21262d] animate-fade-in"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <h4 className="font-sans text-sm text-[#f0f6fc] font-semibold truncate uppercase">{item.name}</h4>
                  <div className="font-mono text-[11px] text-[#8b949e] mt-1">
                    {item.quantity} x R$ {item.price.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-[#f0f6fc] font-bold text-right text-sm">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    onClick={() => {
                      setCart(prev => prev.filter(i => i.id !== item.id));
                    }}
                    className="text-[#8b949e] hover:text-[#ff6e61] cursor-pointer active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart totals & payment triggers */}
        <div className="p-5 bg-[#161b22] border-t border-[#30363d] space-y-4">
          <div className="space-y-2 mb-4 text-xs font-sans">
            <div className="flex justify-between text-base text-[#f0f6fc] pt-2 border-t border-[#21262d] mt-2">
              <span className="font-semibold">Total Geral</span>
              <span className="text-primary font-bold font-mono text-lg">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2 pb-2">
            <button 
              onClick={() => handleOpenNfModal('Cash')}
              disabled={!cart.length}
              className="w-full bg-primary text-[#0d1117] font-bold py-3 px-4 rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/10"
            >
              <span className="material-symbols-outlined text-[20px] font-bold">payments</span>
              <span className="text-xs uppercase tracking-wider font-mono font-bold">Pagar em Dinheiro</span>
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleOpenNfModal('Card')}
                disabled={!cart.length}
                className="flex-1 bg-[#21262d] border border-[#30363d] text-[#f0f6fc] font-mono text-[11px] uppercase py-2.5 rounded-lg hover:bg-[#30363d] hover:border-[#8b949e] transition-colors cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cartão
              </button>
              <button 
                onClick={() => handleOpenNfModal('Split')}
                disabled={!cart.length}
                className="flex-1 bg-[#21262d] border border-[#30363d] text-[#f0f6fc] font-mono text-[11px] uppercase py-2.5 rounded-lg hover:bg-[#30363d] hover:border-[#8b949e] transition-colors cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Dividir
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Intermediate NF-e Fiscal Data Modal */}
      {isNfModalOpen && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-6 max-w-md w-full border border-[#30363d] relative max-h-[95vh] overflow-y-auto">
            <button 
              onClick={() => setIsNfModalOpen(false)}
              className="absolute top-3 right-3 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="font-sans text-lg font-bold text-[#f0f6fc] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              Emissão de Nota Fiscal
            </h3>
            <p className="font-sans text-xs text-[#8b949e] mb-4">
              Informe os dados do consumidor para emitir a NFC-e correspondente.
            </p>
            
            <form onSubmit={submitCheckout} className="space-y-4 font-mono text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">
                  CPF do Cliente (Obrigatório)
                </label>
                <input 
                  type="text" 
                  value={customerCpf}
                  onChange={handleCpfChange}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-mono text-sm tracking-wider" 
                  placeholder="000.000.000-00" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">
                  E-mail do Cliente (Opcional - Envio da Nota)
                </label>
                <input 
                  type="email" 
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-[#f0f6fc] focus:border-primary focus:outline-none font-sans text-sm" 
                  placeholder="exemplo@email.com" 
                />
              </div>

              <div className="pt-4 flex gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setIsNfModalOpen(false)}
                  className="flex-1 bg-transparent border border-outline text-[#f0f6fc] font-mono py-2.5 rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer active:scale-95 text-center"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary text-[#0d1117] font-mono font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer active:scale-95 shadow-md shadow-primary/5 text-center uppercase tracking-wider"
                >
                  Confirmar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Success Modal */}
      {checkoutSuccess && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal rounded-xl p-6 max-w-sm w-full flex flex-col items-center text-center space-y-4 border border-[#30363d]">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-3xl font-bold">done</span>
            </div>
            <div>
              <h3 className="font-sans text-lg font-bold text-[#f0f6fc]">Venda Concluída!</h3>
              <p className="font-sans text-xs text-[#8b949e] mt-1.5 leading-relaxed">
                Transação <span className="font-mono text-primary font-bold">{lastTxId}</span> processada com sucesso no valor de <span className="text-[#f0f6fc] font-semibold font-mono">R$ {lastTxTotal.toFixed(2)}</span> e NFC-e emitida.
              </p>
            </div>
            <button 
              onClick={() => setCheckoutSuccess(false)}
              className="w-full bg-primary text-[#0d1117] font-bold font-mono text-xs py-2.5 rounded-lg hover:bg-primary/95 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

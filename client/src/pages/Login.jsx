import { useState } from 'react'
import logoImg from '../assets/logo.png'

const API_BASE = '/api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('clipzfit_user', JSON.stringify(data));
        onLoginSuccess(data);
      } else {
        setError(data.error || 'Erro ao realizar login.');
      }
    } catch (err) {
      console.error('Error logging in:', err);
      setError('Falha na conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1117] p-4">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="glass-modal max-w-sm w-full p-8 rounded-2xl border border-[#30363d] relative z-10 shadow-2xl space-y-6 flex flex-col items-center">
        <div className="flex flex-col items-center text-center">
          <img 
            alt="ClipzFIT Logo" 
            className="h-12 object-contain w-auto mb-3 filter brightness-110" 
            src={logoImg} 
          />
          <h1 className="font-sans text-xl font-bold text-[#f0f6fc] tracking-tight">Acessar POS Virtual</h1>
          <p className="font-sans text-[11px] text-[#8b949e] mt-1 uppercase tracking-wider font-mono">Controle de Vendas & Estoque</p>
        </div>

        {error && (
          <div className="w-full bg-[#ff6e61]/10 border border-[#ff6e61]/25 text-[#ff6e61] text-xs px-4 py-3 rounded-lg font-sans flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4 font-mono text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">E-mail de Acesso</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-sm text-[#f0f6fc] focus:border-primary focus:outline-none font-sans" 
              placeholder="Ex: centro@clipzfit.com" 
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#8b949e] font-bold uppercase tracking-wider text-[10px]">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-sm text-[#f0f6fc] focus:border-primary focus:outline-none font-sans" 
              placeholder="Digite sua senha" 
              required
              disabled={loading}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-[#0d1117] font-sans font-bold py-3 rounded-lg hover:bg-primary/95 transition-all duration-300 active:scale-95 shadow-lg shadow-primary/10 cursor-pointer flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Autenticando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

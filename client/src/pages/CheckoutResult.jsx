import { Link, useSearchParams } from 'react-router-dom';

export default function CheckoutResult({ status }) {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id') || searchParams.get('preference_id') || '';

  const getStatusDetails = () => {
    switch (status) {
      case 'success':
        return {
          icon: 'check_circle',
          iconColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
          title: 'Pagamento Confirmado!',
          subtitle: 'A venda foi processada com sucesso no Mercado Pago e o estoque já foi atualizado.',
          glow: 'bg-emerald-500/10'
        };
      case 'failure':
        return {
          icon: 'cancel',
          iconColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
          title: 'Pagamento Recusado',
          subtitle: 'A transação não pôde ser concluída pelo Mercado Pago. Por favor, tente novamente.',
          glow: 'bg-rose-500/10'
        };
      case 'pending':
      default:
        return {
          icon: 'pending',
          iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
          title: 'Pagamento Pendente',
          subtitle: 'A transação está sendo processada ou aguardando pagamento (ex: Pix/Boleto).',
          glow: 'bg-amber-500/10'
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1117] p-4">
      {/* Background glows */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 ${details.glow} rounded-full blur-[140px] pointer-events-none`}></div>
      <div className="absolute top-10 right-10 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass-modal max-w-md w-full p-8 rounded-2xl border border-[#30363d] relative z-10 shadow-2xl space-y-6 flex flex-col items-center text-center">
        {/* Status Icon */}
        <div className={`w-20 h-20 rounded-full border flex items-center justify-center ${details.iconColor} shadow-inner animate-pulse`}>
          <span className="material-symbols-outlined text-[48px] font-light">{details.icon}</span>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="font-sans text-2xl font-bold text-[#f0f6fc] tracking-tight">{details.title}</h1>
          <p className="font-sans text-sm text-[#8b949e] leading-relaxed max-w-xs mx-auto">{details.subtitle}</p>
        </div>

        {/* Payment ID (if available) */}
        {paymentId && (
          <div className="w-full bg-[#161b22]/80 border border-[#30363d]/50 p-4 rounded-xl font-mono text-[11px] text-left space-y-1">
            <span className="text-[#8b949e] uppercase tracking-wider block text-[9px] font-bold">Código do Pagamento</span>
            <span className="text-[#f0f6fc] font-semibold break-all">{paymentId}</span>
          </div>
        )}

        {/* Back to POS Button */}
        <div className="pt-4 w-full">
          <Link
            to="/pos"
            className="w-full bg-primary hover:bg-primary/95 text-[#0d1117] font-sans font-bold py-3 px-6 rounded-lg transition-all duration-300 active:scale-95 shadow-lg shadow-primary/10 flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Voltar para o PDV
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PlateCard({ lastPlate, status }) {
  return (
    <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 p-5 rounded-3xl border border-slate-800/80 text-center shadow-xl relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl"></div>
      <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">Última Placa Detectada</p>
      <div className="inline-block bg-slate-950 border border-slate-800 px-6 py-2 rounded-2xl my-1 shadow-inner">
        <p className="text-4xl font-mono text-yellow-400 tracking-[0.2em] font-extrabold">{lastPlate}</p>
      </div>
      <p className="text-xs text-slate-500 mt-2 font-mono">{status}</p>
    </div>
  );
}
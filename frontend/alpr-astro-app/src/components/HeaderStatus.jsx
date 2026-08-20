export default function HeaderStatus({ isOnline }) {
  return (
    <div className="flex justify-between items-center w-full bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800/80 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="font-semibold text-slate-200 tracking-wide text-sm">ALPR VISION</span>
      </div>
      <span className={`px-3 py-1 text-xs font-semibold rounded-full tracking-wider transition-all ${
        isOnline 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      }`}>
        {isOnline ? 'CLOUD SYNC' : 'OFFLINE STORE'}
      </span>
    </div>
  );
}
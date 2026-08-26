export default function PlateCard({ lastPlate, status }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950 p-3 text-center shadow-xl">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Última placa detectada</p>
      <div className="inline-block rounded-xl border border-slate-700 bg-black px-4 py-1 shadow-inner">
        <p className="font-mono text-2xl font-extrabold tracking-[0.16em] text-white">{lastPlate}</p>
      </div>
      <p className="mt-1 text-[11px] font-mono text-slate-400">{status}</p>
    </div>
  );
}
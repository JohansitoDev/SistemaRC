export default function CameraHUD({ videoRef, canvasRef, isScanning, lastPlate }) {
  return (
    <div className="relative w-full aspect-[2/2] bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        <div className="relative w-2 h-2 border-2 border-emerald-400/90 rounded-xl bg-slate-950/20 backdrop-blur-[1px] shadow-[0_0_15px_rgba(52,211,153,0.3)] flex items-center justify-center">
          <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-400"></div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-400"></div>
          <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400"></div>
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400"></div>

          <span className="absolute -top-5 text-[9px] font-mono tracking-widest text-emerald-400 bg-slate-950/90 px-2 py-0.5 rounded border border-emerald-500/30">
            ENFOQUE LA PLACA AQUÍ
          </span>

          {isScanning && (
            <div className="absolute inset-x-0 h-0.5 bg-emerald-400/80 shadow-[0_0_10px_#34d399] animate-[bounce_2s_infinite] "></div>
          )}

          {lastPlate !== '---' && (
            <span className="font-mono text-xl font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-widest">
              {lastPlate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
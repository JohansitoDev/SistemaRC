// ScannerView.jsx
export function ScannerView({ onUpload, onTakePhoto }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8">
      <h2 className="text-3xl font-semibold text-gray-800 mb-12">
        Escaneo de Placas
      </h2>
      
      <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm flex gap-4">
        <button
          onClick={onUpload}
          className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Subir foto
        </button>
        <button
          onClick={onTakePhoto}
          className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Tomar foto
        </button>
      </div>
    </main>
  );
}
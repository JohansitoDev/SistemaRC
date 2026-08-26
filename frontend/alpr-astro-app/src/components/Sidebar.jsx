// Sidebar.jsx
export function Sidebar({ currentTab, onSelectTab }) {
  const menuItems = [
    { id: 'escaneo', label: 'Escaneo' },
    { id: 'historial', label: 'Historial' },
    { id: 'configuracion', label: 'Configuracion' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen p-6 flex flex-col">
      <h1 className="text-xl font-bold mb-8 text-gray-800">Escaner</h1>
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === item.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
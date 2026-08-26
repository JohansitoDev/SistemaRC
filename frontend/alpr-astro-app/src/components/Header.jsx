// Header.jsx
export function Header({ user, onAvatarClick }) {
  return (
    <header className="w-full flex justify-end p-6 relative">
      <button 
        onClick={onAvatarClick} 
        className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 hover:opacity-80 transition-opacity"
      >
        <span className="sr-only">Perfil</span>
      </button>

      {/* Popover/Tarjeta de usuario opcional (Frame 2) */}
      {user && (
        <div className="absolute top-16 right-6 bg-gray-100 p-4 rounded-xl shadow-lg w-56 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300" />
            <span className="font-medium text-sm text-gray-800">{user.name}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full w-full" />
          <div className="flex gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-300" />
            <div className="w-4 h-4 rounded-full bg-gray-300" />
          </div>
        </div>
      )}
    </header>
  );
}
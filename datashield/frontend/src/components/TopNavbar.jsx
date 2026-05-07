import { useAuth } from "../context/AuthContext";

const TopNavbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/20 bg-cyber-900/70 p-4">
      <div>
        <p className="text-sm text-slate-400">Secure Console</p>
        <h2 className="text-lg font-semibold text-cyan-200">Welcome, {user?.name}</h2>
      </div>

      <button
        onClick={logout}
        className="rounded-md border border-cyan-400/40 px-4 py-2 text-sm text-cyan-300 hover:bg-cyber-800"
      >
        Logout
      </button>
    </header>
  );
};

export default TopNavbar;

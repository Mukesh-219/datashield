import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="w-full border-b border-cyan-500/20 bg-cyber-900/80 p-4 lg:w-64 lg:border-b-0 lg:border-r">
      <h1 className="text-xl font-bold text-cyan-300">DataShield AI</h1>
      <nav className="mt-4 flex gap-2 lg:flex-col">
        <NavLink className="rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-cyber-800" to="/dashboard">
          Dashboard
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;

const AuthForm = ({ title, subtitle, fields, onSubmit, loading, error, footer }) => {
  return (
    <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-cyber-900/70 p-8 shadow-glow backdrop-blur cyber-grid">
      <h1 className="text-2xl font-bold text-cyan-300">{title}</h1>
      <p className="mt-2 text-sm text-slate-300">{subtitle}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {fields}

        {error ? (
          <p className="rounded-md border border-red-500/40 bg-red-950/40 p-2 text-sm text-red-300">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-cyan-500 px-4 py-2 font-semibold text-cyber-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Please wait..." : title}
        </button>
      </form>

      <div className="mt-6 text-sm text-slate-300">{footer}</div>
    </div>
  );
};

export default AuthForm;

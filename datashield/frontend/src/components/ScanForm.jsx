import { useState } from "react";
import { createScan } from "../services/scanService";

const initialState = {
  targetUrl: "",
  payload: "",
  endpoint: "",
};

const ScanForm = ({ onScanCreated }) => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await createScan(formData);
      setMessage("Scan started successfully.");
      setFormData(initialState);

      // Trigger live dashboard refresh after successful submission.
      if (onScanCreated) {
        onScanCreated(data.scan);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start scan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyber-900/70 p-4">
      <h3 className="mb-4 text-lg font-semibold text-cyan-200">Start New Scan</h3>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <input
          type="url"
          name="targetUrl"
          value={formData.targetUrl}
          onChange={handleChange}
          placeholder="https://target-site.com"
          className="rounded-md border border-cyan-500/30 bg-cyber-950 px-3 py-2 outline-none focus:border-cyan-300"
          required
        />

        <textarea
          name="payload"
          value={formData.payload}
          onChange={handleChange}
          placeholder="Optional payload for ML detection (SQLi/XSS/Suspicious)"
          rows={3}
          className="rounded-md border border-cyan-500/30 bg-cyber-950 px-3 py-2 outline-none focus:border-cyan-300"
        />

        <input
          type="text"
          name="endpoint"
          value={formData.endpoint}
          onChange={handleChange}
          placeholder="Optional endpoint, e.g. /login"
          className="rounded-md border border-cyan-500/30 bg-cyber-950 px-3 py-2 outline-none focus:border-cyan-300"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-cyan-500 px-4 py-2 font-semibold text-cyber-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Start Scan"}
        </button>
      </form>

      {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </div>
  );
};

export default ScanForm;

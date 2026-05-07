import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "developer",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-grid flex min-h-screen items-center justify-center p-4">
      <AuthForm
        title="Register"
        subtitle="Create your DataShield user account"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        fields={
          <>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
              className="w-full rounded-md border border-cyan-500/30 bg-cyber-950 px-3 py-2 outline-none focus:border-cyan-300"
              required
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full rounded-md border border-cyan-500/30 bg-cyber-950 px-3 py-2 outline-none focus:border-cyan-300"
              required
            />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full rounded-md border border-cyan-500/30 bg-cyber-950 px-3 py-2 outline-none focus:border-cyan-300"
              required
              minLength={6}
            />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-md border border-cyan-500/30 bg-cyber-950 px-3 py-2 outline-none focus:border-cyan-300"
            >
              <option value="developer">Developer</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </>
        }
        footer={
          <p>
            Already have an account? <Link className="text-cyan-300 hover:text-cyan-200" to="/login">Login</Link>
          </p>
        }
      />
    </div>
  );
};

export default RegisterPage;

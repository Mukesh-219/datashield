import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("mukesh@datashield.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-grid flex min-h-screen items-center justify-center p-4">
      <AuthForm
        title="Login"
        subtitle="Access your DataShield command center"
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        fields={
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-md border border-cyan-500/30 bg-cyber-950 px-3 py-2 outline-none focus:border-cyan-300"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-md border border-cyan-500/30 bg-cyber-950 px-3 py-2 outline-none focus:border-cyan-300"
              required
            />
          </>
        }
        footer={
          <p>
            New here? <Link className="text-cyan-300 hover:text-cyan-200" to="/register">Create an account</Link>
          </p>
        }
      />
    </div>
  );
};

export default LoginPage;

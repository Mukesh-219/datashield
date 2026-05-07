import { Link } from "react-router-dom";

const AuthLayout = ({ title, children, altPath, altText }) => {
  return (
    <div className="cyber-grid flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
        <p className="mt-6 text-center text-sm text-slate-400">
          {altText} <Link className="text-cyan-300 hover:text-cyan-200" to={altPath}>{title}</Link>
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;

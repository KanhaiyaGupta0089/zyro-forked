import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "react-hot-toast";

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
}

const AcceptInvitation: React.FC = () => {
  const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
  const { raw_token } = useParams<{ raw_token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      console.debug("AcceptInvitation: verifying token", raw_token);
      if (!raw_token) {
        setTokenValid(false);
        setVerifying(false);
        return;
      }

      try {
        setVerifying(true);
        const res = await fetch(`${API_BASE}/user/verify-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw_token }),
        });

        if (!res.ok) {
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch (err) {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [raw_token]);

  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[A-Z])/.test(password)) {
      errors.password = "Must contain at least one uppercase letter";
    } else if (!/(?=.*\d)/.test(password)) {
      errors.password = "Must contain at least one number";
    } else if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.password = "Must contain one special character (@$!%*?&)";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.debug("AcceptInvitation: submit", { raw_token, password, confirmPassword, new_password: password });

    const formErrors = validateForm();
    console.debug("AcceptInvitation: formErrors", formErrors);
    if (Object.keys(formErrors).length > 0) {
      Object.values(formErrors).forEach((err) => err && toast.error(err));
      return;
    }

    if (!raw_token) {
      toast.error("Missing token. Please use the link from your email.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/user/update-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_token, new_password: password }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const message = payload?.message || "Failed to update password";
        toast.error(message);
        return;
      }

      toast.success("Password updated successfully 🎉");
      navigate("/login");
    } catch (err) {
      toast.error("Failed to update password. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">Verifying token...</div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-md p-8 bg-white rounded shadow text-center">
          <h3 className="text-xl font-semibold mb-4">Invalid or expired link</h3>
          <p className="mb-6">The invitation link is invalid or has expired.</p>
          <Link to="/signup" className="text-blue-500 hover:underline">
            Request a new invite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center md:flex-row h-screen">
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <h3 className="font-medium text-4xl bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
              Set Your Password
            </h3>
          </div>

          <p className="text-gray-800 text-center mb-8">
            Complete your account setup by choosing a secure password.
          </p>

          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="space-y-2 relative">
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-5 w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium py-3 rounded-lg transition hover:scale-[1.02] disabled:opacity-50"
            >
              {isLoading ? "Updating Password..." : "Set Password"}
            </button>

            <div className="block md:hidden text-center mt-4">
              <p className="text-gray-600 text-sm">
                Already have an account? {" "}
                <Link to="/login" className="text-blue-500 hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden w-full md:w-1/2 bg-gradient-to-r from-blue-900/90 to-green-900/90 text-white md:flex flex-col items-center justify-center p-8 rounded-tl-[80px] rounded-bl-[80px]">
        <div className="flex items-center justify-center p-4 flex-grow w-full">
          <div className="w-full max-w-lg h-96 lg:h-[450px] xl:h-[500px] flex flex-col items-center justify-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 border border-white/20 mb-6">
              <Lock className="h-12 w-12 text-white" />
            </div>

            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4">Set a Secure Password</h2>

            <p className="text-sm md:text-base lg:text-lg opacity-90 text-center max-w-md">
              Choose a strong password to protect your Zyro account and get started.
            </p>
          </div>
        </div>

        <div className="w-full text-center mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3">Welcome Aboard</h2>
          <p className="text-sm md:text-base lg:text-lg opacity-90">Complete your setup and access your workspace.</p>
        </div>

        <div className="w-full text-center pb-4">
          <p className="text-white/80 mb-4">Need help?</p>
          <Link to="/login" className="px-8 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20">SIGN IN</Link>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;

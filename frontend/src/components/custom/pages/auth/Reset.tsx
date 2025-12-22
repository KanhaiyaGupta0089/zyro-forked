import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "react-hot-toast";

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
}

/* ---------------------------------- */
/* Component */
/* ---------------------------------- */
const Reset: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  /* ---------------------------------- */
  /* Validation */
  /* ---------------------------------- */
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

  /* ---------------------------------- */
  /* Submit */
  /* ---------------------------------- */
  const handleResetPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      Object.values(formErrors).forEach((error) => {
        if (error) toast.error(error);
      });
      return;
    }

    try {
      setIsLoading(true);

      // 🔐 API CALL (Later)
      // await api.post("/auth/reset-password", { password });

      // Simulate API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Password reset successfully 🎉");
      toast.success("You can now sign in with your new password");

      navigate("/login");
    } catch (error) {
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------------- */
  /* JSX */
  /* ---------------------------------- */
  return (
    <div className="flex flex-col justify-center md:flex-row h-screen">
      {/* Left Side - Reset Form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <h3 className="font-medium text-4xl bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
              Reset Password
            </h3>
          </div>

          <p className="text-gray-800 text-center mb-8">
            Create a new password to regain secure access to your workspace.
          </p>

          <form onSubmit={handleResetPassword} className="space-y-5">
            {/* New Password */}
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

            {/* Confirm Password */}
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
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
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
              {isLoading ? "Updating Password..." : "Reset Password"}
            </button>

            {/* Mobile Sign In Link */}
            <div className="block md:hidden text-center mt-4">
              <p className="text-gray-600 text-sm">
                Remember your password?{" "}
                <Link to="/login" className="text-blue-500 hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Info Panel */}
      <div className="hidden w-full md:w-1/2 bg-gradient-to-r from-blue-900/90 to-green-900/90 text-white md:flex flex-col items-center justify-center p-8 rounded-tl-[80px] rounded-bl-[80px]">
        {/* Icon - Centered */}
        <div className="flex items-center justify-center p-4 flex-grow w-full">
          <div className="w-full max-w-lg h-96 lg:h-[450px] xl:h-[500px] flex flex-col items-center justify-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 border border-white/20 mb-6">
              <Lock className="h-12 w-12 text-white" />
            </div>
            
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4">
              Create a New Password
            </h2>
            
            <p className="text-sm md:text-base lg:text-lg opacity-90 text-center max-w-md">
              Your new password should be strong and unique to keep your Zyro workspace secure.
            </p>
          </div>
        </div>

        {/* Text Overlay */}
        <div className="w-full text-center mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3">
            Secure Your Account
          </h2>
          <p className="text-sm md:text-base lg:text-lg opacity-90">
            Regain access to your projects quickly and securely.
          </p>
        </div>

        {/* Sign In Link */}
        <div className="w-full text-center pb-4">
          <p className="text-white/80 mb-4">Remember your password?</p>
          <Link
            to="/login"
            className="px-8 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20"
          >
            SIGN IN
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Reset;

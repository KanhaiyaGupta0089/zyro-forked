import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../../../redux/auth/authThunks";
import { clearAuthError } from "../../../../redux/auth/authSlice";
import { RootState, AppDispatch } from "../../../../redux/store";

import img1 from "../../../../assets/img1.png";
import img2 from "../../../../assets/img2.png";
import img3 from "../../../../assets/img3.png";
import img4 from "../../../../assets/img4.png";
import Slideshow from "./Slideshow";

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/* ---------------------------------- */
/* Component */
/* ---------------------------------- */
const Signup: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading } = useSelector((state: RootState) => state.auth);
  
  const slideshowImages = [
    { src: img1, alt: "Streamline your project" },
    { src: img2, alt: "Track tasks and issues easily" },
    { src: img3, alt: "Agile project management tools" },
    { src: img4, alt: "Insights and productivity" },
  ];

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  // Clear auth error when component mounts
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  /* ---------------------------------- */
  /* Validation */
  /* ---------------------------------- */
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (password.length > 16) {
      newErrors.password = "Password must be at most 16 characters";
    } else if (!/(?=.*[A-Z])/.test(password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/(?=.*[@$!%*?&])/.test(password)) {
      newErrors.password =
        "Password must contain at least one special character (@$!%*?&)";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  /* ---------------------------------- */
  /* Submit */
  /* ---------------------------------- */
  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      // Show only the first validation error
      const firstError = Object.values(formErrors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    try {
      // Dispatch register action
      const result = await dispatch(registerUser({ name, email, password }));
      
      if (registerUser.fulfilled.match(result)) {
        // Show single success message
        toast.success("Account created! Please check your email for verification 📧");

        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        // Handle error
        const errorMessage = result.payload || "Signup failed. Please try again.";
        toast.error(String(errorMessage));
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Signup failed. Please try again.";
      toast.error(message);
    }
  };

  /* ---------------------------------- */
  /* JSX */
  /* ---------------------------------- */
  return (
    <div className="flex flex-col justify-center md:flex-row h-screen">
      {/* Left Side */}
      <div className="hidden w-full md:w-1/2 bg-gradient-to-r from-blue-900/90 to-green-900/90 text-white md:flex flex-col items-center justify-center p-8 rounded-tr-[80px] rounded-br-[80px]">
        <div className="flex items-center justify-center p-4 flex-grow w-full">
          <div className="w-full max-w-lg h-96 lg:h-[450px] xl:h-[500px]">
            <Slideshow
              images={slideshowImages}
              interval={7000}
              className="w-full h-full"
              imageClassName="object-contain"
            />
          </div>
        </div>

        <div className="w-full text-center mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3">
            Welcome to Zyro
          </h2>
          <p className="text-sm md:text-base lg:text-lg opacity-90">
            Visualize your roadmap. Accelerate your release.
          </p>
        </div>

        <div className="w-full text-center pb-4">
          <p className="text-white/80 mb-4">Already have an account?</p>
          <Link
            to="/login"
            className="px-8 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20"
          >
            SIGN IN
          </Link>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8 ">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <h3 className="font-medium text-3xl lg:text-4xl text-center bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
              Create your account
            </h3>
          </div>

          <p className="text-gray-800 text-center mb-8">
            Please provide your information to sign up.
          </p>

          <form onSubmit={handleRegister} className="space-y-5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-md pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-md pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute inset-y-0 right-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium py-3 rounded-lg transition hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            <div className="block md:hidden text-center mt-4">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-500 hover:underline font-medium"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;

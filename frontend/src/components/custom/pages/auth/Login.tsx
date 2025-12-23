import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../../../redux/auth/authThunks";
import { clearAuthError } from "../../../../redux/auth/authSlice";
import { RootState, AppDispatch } from "../../../../redux/store";
import img1 from "../../../../assets/img1.png";
import img2 from "../../../../assets/img2.png";
import img3 from "../../../../assets/img3.png";
import img4 from "../../../../assets/img4.png";
import Slideshow from "./Slideshow";

interface ValidationErrors {
    email?: string;
    password?: string;
}

/* ---------------------------------- */
/* Component */
/* ---------------------------------- */
const Login: React.FC = () => {

    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    
    const { loading } = useSelector((state: RootState) => state.auth);
    
    const slideshowImages = [
        { src: img1, alt: "Streamline your project" },
        { src: img2, alt: "Track tasks and issues easily" },
        { src: img3, alt: "Agile project management tools" },
        { src: img4, alt: "Insights and productivity" },
    ];

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [rateLimitError, setRateLimitError] = useState<boolean>(false);
    const [submitCooldown, setSubmitCooldown] = useState<boolean>(false);
    
    // Clear auth error when component mounts
    useEffect(() => {
        dispatch(clearAuthError());
    }, [dispatch]);

    /* ---------------------------------- */
    /* Validation */
    /* ---------------------------------- */
    const validateForm = (): ValidationErrors => {
        const newErrors: ValidationErrors = {};

        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is invalid";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        return newErrors;
    };

    /* ---------------------------------- */
    /* Submit */
    /* ---------------------------------- */
    const handleLogin = async (
        e: React.FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();

        // Reset rate limit error on new submission
        setRateLimitError(false);

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
            // Dispatch login action
            const result = await dispatch(loginUser({ email, password }));
            
            if (loginUser.fulfilled.match(result)) {
                toast.success("Login successful!");
                navigate("/dashboard");
            } else {
                // Handle error
                const errorMessage = result.payload || "Login failed. Please try again.";
                toast.error(String(errorMessage));
            }
        }
        catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Login failed. Please try again.";
            toast.error(message);
        } finally {
            // Set cooldown to prevent rapid submissions
            setSubmitCooldown(true);
            setTimeout(() => {
                setSubmitCooldown(false);
            }, 5000); // 5 second cooldown
        }
    };

    /* ---------------------------------- */
    /* JSX */
    /* ---------------------------------- */
    return (
        <>
            {/* Loading Overlay */}
            <div className="flex flex-col justify-center md:flex-row h-screen">
                {/* Left Side - Form */}
                <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">                    <div className="w-full max-w-sm">
                    <div className="flex justify-center mb-8">
                        <h3 className="font-medium text-4xl overflow-hidden bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                            Welcome back
                        </h3>
                    </div>

                    <p className="text-gray-800 text-center mb-8">
                        Sign in to manage your work and move projects forward.
                    </p>

                    {/* Rate limit warning */}
                    {rateLimitError && (
                        <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2" />
                                <p className="font-medium">Rate Limit Exceeded</p>
                            </div>
                            <p className="text-sm mt-1">Please wait 5 seconds before trying again.</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                }}
                                placeholder="Enter your email"
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                    }}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <Link to="/forgot-password" className="text-blue-500 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || submitCooldown}
                            className="mt-5 w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Signing In...
                                </>
                            ) : submitCooldown ? (
                                "Please wait..."
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        <div className="block md:hidden text-center mt-4">
                            <p className="text-gray-600 text-sm">
                                Don't have an account?{" "}
                                <Link to="/signup" className="text-blue-500 hover:underline font-medium">
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
                </div>

                {/* Right Side - Slideshow */}
                <div className="hidden w-full md:w-1/2 bg-gradient-to-r from-blue-900/90 to-green-900/90 text-white md:flex flex-col items-center justify-center p-8 rounded-tl-[80px] rounded-bl-[80px]">                    {/* Image Slideshow - Centered */}
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

                    {/* Text Overlay - Positioned below the image */}
                    <div className="w-full text-center mb-6">
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3">
                            Welcome to Zyro
                        </h2>
                        <p className="text-sm md:text-base lg:text-lg opacity-90">
                            Visualize your roadmap. Accelerate your release.
                        </p>
                    </div>                    {/* Sign Up Link */}
                    <div className="w-full text-center pb-4">
                        <p className="text-white/80 mb-4">
                            Don't have an account?
                        </p>
                        <Link
                            to="/signup"
                            className="px-8 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20"
                        >
                            SIGN UP
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
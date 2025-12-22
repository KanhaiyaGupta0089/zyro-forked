import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Shield, Lock, Key } from "lucide-react";
import { toast } from "react-hot-toast";

const Forgot: React.FC = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigate = useNavigate();

    /* ---------------------------------- */
    /* Submit Handler */
    /* ---------------------------------- */
    const handleForgotPassword = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Email is required");
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        try {
            setIsLoading(true);

            // 🔐 API CALL (Later)
            // await api.post("/auth/forgot-password", { email });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            setIsSubmitted(true);
            toast.success("Reset link sent. Check your email 📩");

        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };



    /* ---------------------------------- */
    /* JSX */
    /* ---------------------------------- */
    return (
        <div className="flex flex-col justify-center md:flex-row h-screen">
            {/* Left Side - Info Panel */}
            <div className="hidden w-full md:w-1/2 bg-gradient-to-r from-blue-900/90 to-green-900/90 text-white md:flex flex-col items-center justify-center p-8 rounded-tr-[80px] rounded-br-[80px]">
                {/* Center Content (Replaces Slideshow) */}
                <div className="flex items-center justify-center p-4 flex-grow w-full">
                    <div className="w-full max-w-lg h-96 lg:h-[450px] xl:h-[500px] flex flex-col items-center justify-center text-center space-y-6">

                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                            <Mail className="h-12 w-12 text-white" />
                        </div>

                        {/* Main Message */}
                        <div>
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3 animate-fadeIn">
                                Forgot your password?
                            </h2>
                            <p className="text-sm md:text-base lg:text-lg opacity-90 animate-fadeIn delay-150">
                                No worries. We’ll help you get back into your Zyro workspace.
                            </p>
                        </div>

                        {/* Support Text */}
                        <div className="text-sm opacity-80 max-w-md">
                            <p>Enter your registered email to receive a secure password reset link.</p>
                            <p className="mt-2">The link expires automatically for your safety.</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Text */}
                <div className="w-full text-center mb-6">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3">
                      Recover your access
                  </h2>
                  <p className="text-sm md:text-base lg:text-lg opacity-90">
                      Get back to your projects quickly and securely.
                  </p>
                </div>


                {/* Sign In Button */}
                <div className="w-full text-center pb-4">
                    <p className="text-white/80 mb-4">Remembered your password?</p>
                    <Link
                        to="/login"
                        className="px-8 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300 backdrop-blur-sm border border-white/20"
                    >
                        SIGN IN
                    </Link>
                </div>
            </div>


            {/* Right Side - Form */}
            <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">
                <div className="w-full max-w-sm">
                    <div className="flex justify-center mb-8">
                        <h3 className="font-medium text-3xl lg:text-4xl text-center bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                            Forgot Password?
                        </h3>
                    </div>

                    <p className="text-gray-800 text-center mb-8">
                        {isSubmitted
                            ? "We've sent a reset link to your email"
                            : "Enter your email and we'll send you a reset link"}
                    </p>

                    {/* Success Message */}
                    {isSubmitted ? (
                        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 text-center animate-fadeIn">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 className="font-medium text-green-800 mb-1">Email Sent Successfully!</h3>
                            <p className="text-sm text-green-700">Please check your inbox for the password reset link.</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-4 w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium py-3 rounded-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Form */}
                            <form onSubmit={handleForgotPassword} className="space-y-5">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="your.email@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="mt-5 w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-medium py-3 rounded-lg transition hover:scale-[1.02] disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="ml-2">Sending Reset Link...</span>
                                        </div>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Forgot;

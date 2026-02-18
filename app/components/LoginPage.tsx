"use client";

import Image from "next/image";
import { useAuth } from "./AuthProvider";

export default function LoginPage() {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-rose-50 dark:from-[#0b0b0d] dark:via-[#111317] dark:to-[#0b0b0d] p-6">
            <div className="w-full max-w-sm">
                {/* Logo & Title */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-5">
                        <Image
                            src="/logo1.png"
                            alt="FoGether logo"
                            width={100}
                            height={100}
                            className="rounded-3xl shadow-lg shadow-orange-200 dark:shadow-orange-900/30"
                            priority
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                        FoGether
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Hôm nay ăn gì ta...
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 dark:bg-[#161820]/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 dark:border-[#1f2127]">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-2">
                        Chào mừng bạn! 👋
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
                        Đăng nhập để bắt đầu chia sẻ những món ngon
                    </p>

                    {/* Google Sign In Button */}
                    <button
                        onClick={signInWithGoogle}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#1f2127] hover:bg-slate-50 dark:hover:bg-[#252830] border border-slate-200 dark:border-[#2a2d35] rounded-2xl px-6 py-4 transition-all duration-200 hover:shadow-md active:scale-[0.98] group"
                    >
                        {/* Google Icon */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span className="text-sm font-semibold text-slate-700 dark:text-white">
                            Đăng nhập bằng Google
                        </span>
                    </button>
                </div>

                {/* Footer text */}
                <p className="text-center text-xs text-slate-400 mt-8">
                    Bằng cách đăng nhập, bạn đồng ý với
                    <br />
                    <span className="text-blue-500">Điều khoản sử dụng</span> của chúng tôi
                </p>
            </div>
        </div>
    );
}

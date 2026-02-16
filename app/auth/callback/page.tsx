"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        // Supabase will handle the OAuth callback automatically
        // Just check if we have a session and redirect
        const handleCallback = async () => {
            const { error } = await supabase.auth.getSession();
            if (error) {
                console.error("Auth callback error:", error);
            }
            // Redirect to home regardless
            router.replace("/");
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-rose-50 dark:from-[#0b0b0d] dark:via-[#111317] dark:to-[#0b0b0d]">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 mb-4 animate-pulse">
                    <span className="text-3xl">🍜</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Đang đăng nhập...</p>
            </div>
        </div>
    );
}

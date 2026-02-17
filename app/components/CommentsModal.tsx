"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export type Comment = {
    id: string;
    text: string;
    author_name: string;
    author_avatar?: string;
    created_at: string;
    likes: number;
    liked?: boolean; // local state
};

type CommentsModalProps = {
    postId: string;
    postTitle: string;
    comments: Comment[];
    userName: string;
    userAvatar?: string;
    onClose: () => void;
    onCommentsUpdate: (postId: string, comments: Comment[]) => void;
};

export default function CommentsModal({
    postId,
    postTitle,
    comments,
    userName,
    userAvatar,
    onClose,
    onCommentsUpdate,
}: CommentsModalProps) {
    const [localComments, setLocalComments] = useState<Comment[]>(comments);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Like a comment
    const handleLikeComment = async (commentId: string) => {
        setLocalComments((prev) =>
            prev.map((c) => {
                if (c.id === commentId) {
                    const newLiked = !c.liked;
                    const newLikes = newLiked ? c.likes + 1 : c.likes - 1;

                    // Update DB in background
                    supabase
                        .from("comments")
                        .update({ likes: newLikes })
                        .eq("id", commentId)
                        .then(({ error }) => {
                            if (error) console.error("Error updating comment likes:", error);
                        });

                    return { ...c, liked: newLiked, likes: newLikes };
                }
                return c;
            })
        );
    };

    // Add new comment
    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setSubmitting(true);

        try {
            const { data, error } = await supabase
                .from("comments")
                .insert({
                    post_id: postId,
                    text: newComment.trim(),
                    author_name: userName,
                    author_avatar: userAvatar || null,
                    likes: 0,
                })
                .select()
                .single();

            if (error) {
                console.error("Error adding comment:", error);
                return;
            }

            if (data) {
                const added: Comment = {
                    id: data.id,
                    text: data.text,
                    author_name: data.author_name || "Ẩn danh",
                    author_avatar: data.author_avatar || userAvatar,
                    created_at: data.created_at,
                    likes: 0,
                    liked: false,
                };
                setLocalComments((prev) => [...prev, added]);
                setNewComment("");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Sync comments back to parent when closing
    const handleClose = () => {
        onCommentsUpdate(postId, localComments);
        onClose();
    };

    // Sort: most liked first
    const sortedComments = [...localComments].sort((a, b) => b.likes - a.likes);

    // Format time
    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "vừa xong";
        if (mins < 60) return `${mins} phút`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} giờ`;
        const days = Math.floor(hours / 24);
        return `${days} ngày`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal — slides up from bottom */}
            <div className="relative mt-auto w-full max-w-sm mx-auto bg-white dark:bg-[#111317] rounded-t-[32px] max-h-[85vh] flex flex-col z-10 animate-slide-up border-t border-x border-white/10">
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-[#1f2127]">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                        Bình luận
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                        {localComments.length} bình luận
                    </span>
                </div>

                {/* Comments list */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">
                    {sortedComments.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-icons-round text-4xl text-slate-200 dark:text-slate-600 mb-3 block">
                                chat_bubble_outline
                            </span>
                            <p className="text-sm text-slate-400">
                                Chưa có bình luận nào.
                            </p>
                            <p className="text-xs text-slate-300 dark:text-slate-500 mt-1">
                                Hãy là người đầu tiên bình luận!
                            </p>
                        </div>
                    ) : (
                        sortedComments.map((comment, i) => (
                            <div key={comment.id} className="flex gap-3">
                                {/* Avatar */}
                                {comment.author_avatar ? (
                                    <Image
                                        src={comment.author_avatar}
                                        alt={comment.author_name}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <span className="text-white text-[10px] font-bold">
                                            {comment.author_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[13px] font-bold text-slate-800 dark:text-white">
                                            {comment.author_name}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {timeAgo(comment.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                                        {comment.text}
                                    </p>

                                    {/* Like row */}
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <button
                                            onClick={() => handleLikeComment(comment.id)}
                                            className="flex items-center gap-1 group"
                                        >
                                            <span
                                                className={`material-icons-round text-sm transition-all ${comment.liked
                                                    ? "text-red-500"
                                                    : "text-slate-300 dark:text-slate-500 group-hover:text-red-400"
                                                    }`}
                                                style={
                                                    comment.liked
                                                        ? { animation: "heartBeat 0.4s ease-in-out" }
                                                        : {}
                                                }
                                            >
                                                {comment.liked ? "favorite" : "favorite_border"}
                                            </span>
                                            {comment.likes > 0 && (
                                                <span className="text-[11px] font-semibold text-slate-400">
                                                    {comment.likes}
                                                </span>
                                            )}
                                        </button>
                                        <button className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                            Trả lời
                                        </button>
                                    </div>

                                    {/* Top comment badge */}
                                    {i === 0 && comment.likes > 0 && (
                                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30">
                                            <span className="material-icons-round text-[10px] text-amber-500">
                                                emoji_events
                                            </span>
                                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                Bình luận nổi bật
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-slate-100 dark:border-[#1f2127] px-5 py-3 flex items-center gap-3 bg-white dark:bg-[#111317]">
                    {userAvatar ? (
                        <Image
                            src={userAvatar}
                            alt={userName}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shrink-0">
                            <span className="text-white text-[9px] font-bold">
                                {userName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        placeholder="Viết bình luận..."
                        className="flex-1 text-sm py-2 px-4 bg-slate-50 dark:bg-[#1a1c22] rounded-full text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-100 dark:border-[#2a2d35] transition-all"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !newComment.trim()}
                        className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 shrink-0"
                    >
                        <span className="material-icons-round text-white text-lg" style={{ transform: "rotate(-25deg)" }}>
                            send
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

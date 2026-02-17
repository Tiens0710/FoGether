"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Header from "./components/Header";
import type { FeedFilter } from "./components/Header";
import Footer from "./components/Footer";
import CameraView from "./components/CameraView";
import LoginPage from "./components/LoginPage";
import { useAuth } from "./components/AuthProvider";

type Comment = {
  id: string;
  text: string;
  author_name: string;
  created_at: string;
};

type Post = {
  id: string;
  user_id?: string;
  poster_name?: string;
  poster_avatar?: string;
  title: string;
  date: string;
  image: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  likes: number;
  liked: boolean; // local state only
  badge: {
    icon: string;
    label: string;
    variant: "rating" | "favorite";
  };
  comments: Comment[];
};

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [showCamera, setShowCamera] = useState(false);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all");
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Ẩn danh";

  // Fetch posts + comments on mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
          return;
        }

        if (data) {
          // Fetch comments for all posts
          const postIds = data.map((item: any) => item.id);
          const { data: commentsData } = await supabase
            .from('comments')
            .select('*')
            .in('post_id', postIds)
            .order('created_at', { ascending: true });

          const commentsByPost: Record<string, Comment[]> = {};
          (commentsData || []).forEach((c: any) => {
            if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
            commentsByPost[c.post_id].push({
              id: c.id,
              text: c.text,
              author_name: c.author_name || "Ẩn danh",
              created_at: c.created_at,
            });
          });

          const formattedPosts: Post[] = data.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            poster_name: item.poster_name,
            poster_avatar: item.poster_avatar,
            title: item.title || item.location || "Món ngon",
            date: new Date(item.created_at).toLocaleDateString("vi-VN"),
            image: item.image_url,
            location: item.location,
            latitude: item.latitude,
            longitude: item.longitude,
            likes: item.likes || 0,
            liked: false,
            badge: {
              icon: "star",
              label: item.rating ? item.rating.toFixed(1) : "5.0",
              variant: "rating"
            },
            comments: commentsByPost[item.id] || [],
          }));
          setFeedPosts(formattedPosts);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Toggle like
  const handleLike = async (postId: string) => {
    setFeedPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newLiked = !p.liked;
        const newLikes = newLiked ? p.likes + 1 : p.likes - 1;

        // Update DB in background
        supabase
          .from('posts')
          .update({ likes: newLikes })
          .eq('id', postId)
          .then(({ error }) => {
            if (error) console.error("Error updating likes:", error);
          });

        return { ...p, liked: newLiked, likes: newLikes };
      }
      return p;
    }));
  };

  // Add comment
  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setSubmittingComment(postId);

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, text, author_name: userName })
        .select()
        .single();

      if (error) {
        console.error("Error adding comment:", error);
        alert("Lỗi khi gửi bình luận.");
        return;
      }

      if (data) {
        const newComment: Comment = {
          id: data.id,
          text: data.text,
          author_name: data.author_name || "Ẩn danh",
          created_at: data.created_at,
        };

        setFeedPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, comments: [...p.comments, newComment] }
            : p
        ));
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleUploadSuccess = async (data: {
    url: string;
    dishName: string;
    location: string;
    rating: number;
    note: string;
    latitude?: number;
    longitude?: number;
  }) => {
    // 1. Optimistic Update
    const newPostTemp: Post = {
      id: `temp-${Date.now()}`,
      user_id: user?.id,
      poster_name: userName,
      poster_avatar: user?.user_metadata?.avatar_url,
      title: data.dishName || data.location || "Món ngon",
      date: "Vừa xong",
      image: data.url,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      likes: 0,
      liked: false,
      badge: { icon: "star", label: data.rating.toFixed(1), variant: "rating" },
      comments: data.note ? [{
        id: `comment-temp-${Date.now()}`,
        text: data.note,
        author_name: userName,
        created_at: new Date().toISOString(),
      }] : [],
    };

    setFeedPosts([newPostTemp, ...feedPosts]);
    setShowCamera(false);

    // 2. Persist to Supabase
    try {
      const { data: insertedPost, error } = await supabase
        .from('posts')
        .insert({
          title: data.dishName,
          location: data.location,
          rating: data.rating,
          image_url: data.url,
          note: data.note,
          latitude: data.latitude,
          longitude: data.longitude,
          user_id: user?.id,
          poster_name: userName,
          poster_avatar: user?.user_metadata?.avatar_url || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving post to DB:", error);
        alert("Đã lưu ảnh nhưng lỗi khi lưu thông tin vào CSDL.");
      }

      // If there's a note, also save it as a comment
      if (insertedPost && data.note) {
        await supabase.from('comments').insert({
          post_id: insertedPost.id,
          text: data.note,
          author_name: userName,
        });
      }
    } catch (err) {
      console.error("Unexpected error saving post:", err);
    }
  };


  // Filter posts based on selected filter (must be before early returns)
  const filteredPosts = useMemo(() => {
    if (feedFilter === "mine") {
      return feedPosts.filter(p => p.user_id === user?.id);
    }
    // "friends" and "all" show everything for now
    return feedPosts;
  }, [feedPosts, feedFilter, user?.id]);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-rose-50 dark:from-[#0b0b0d] dark:via-[#111317] dark:to-[#0b0b0d]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 mb-4 animate-pulse">
            <span className="text-3xl">🍜</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <LoginPage />;
  }


  return (
    <div suppressHydrationWarning className="bg-background-light dark:bg-[#0b0b0d] text-slate-800 dark:text-slate-100 h-screen w-full relative overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
      {showCamera && (
        <CameraView
          onClose={() => setShowCamera(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {!showCamera && (
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <Header feedFilter={feedFilter} onFilterChange={setFeedFilter} />
          </div>
        </div>
      )}

      {/* Main Feed */}
      <main className="contents">
        {filteredPosts.map((post, index) => (
          <div key={post.id} className="w-full h-screen snap-start shrink-0 flex items-center justify-center p-4 pb-24">
            <article
              className="ambient-container bg-white dark:bg-[#111317] rounded-3xl shadow-xl border border-white/20 dark:border-[#1b1b1f] overflow-hidden w-full max-w-sm h-[70vh] flex flex-col relative"
            >
              {/* Main Image Section */}
              <div
                className={`relative flex-1 w-full bg-slate-100 dark:bg-[#0f1012] overflow-hidden group ${post.latitude && post.longitude ? "cursor-pointer" : ""}`}
                onClick={() => {
                  if (post.latitude && post.longitude) {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${post.latitude},${post.longitude}`,
                      '_blank'
                    );
                  }
                }}
              >
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority={index === 0}
                />
                <div className="absolute bottom-2 left-2 z-10 bg-white/95 dark:bg-[#0f1012]/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100 dark:border-[#1b1b1f]">
                  <span className="material-icons-round text-sm text-primary dark:text-white">
                    {post.badge.icon}
                  </span>
                  <span className="text-xs font-bold text-primary-dark dark:text-white">
                    {post.badge.label}
                  </span>
                </div>

                {/* Location Overlay on Image */}
                {post.location && (
                  <div className="absolute bottom-2 right-2 z-10 max-w-[60%]">
                    <div className="bg-black/40 backdrop-blur-md text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-white/20">
                      <span className="material-icons-round text-[10px]">place</span>
                      <span className="text-[10px] font-medium truncate">{post.location}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Section — Instagram Style */}
              <div className="px-4 pt-3 pb-2 shrink-0 bg-white dark:bg-[#111317] relative z-10">
                {/* Action buttons row: ❤️ 99K  💬 338  ↗️ 44  ... 🔖 */}
                <div className="flex items-center mb-2">
                  <div className="flex items-center gap-4">
                    {/* Heart + count */}
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1"
                    >
                      <span
                        className={`material-icons-round text-[26px] transition-all duration-300 ${post.liked
                          ? "text-red-500"
                          : "text-slate-800 dark:text-white hover:text-slate-500 dark:hover:text-slate-300"
                          }`}
                        style={post.liked ? { animation: "heartBeat 0.4s ease-in-out" } : {}}
                      >
                        {post.liked ? "favorite" : "favorite_border"}
                      </span>
                      {post.likes > 0 && (
                        <span className="text-[11px] font-semibold text-slate-800 dark:text-white">
                          {post.likes.toLocaleString('vi-VN')}
                        </span>
                      )}
                    </button>
                    {/* Comment + count */}
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(`comment-input-${post.id}`);
                        input?.focus();
                      }}
                      className="flex items-center gap-1"
                    >
                      <span className="material-icons-round text-[26px] text-slate-800 dark:text-white hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
                        chat_bubble_outline
                      </span>
                      {post.comments.length > 0 && (
                        <span className="text-[11px] font-semibold text-slate-800 dark:text-white">
                          {post.comments.length}
                        </span>
                      )}
                    </button>
                    {/* Share */}
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: post.title,
                            text: `Xem ${post.title} trên FoGether!`,
                            url: window.location.href,
                          });
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <span className="material-icons-round text-[26px] text-slate-800 dark:text-white hover:text-slate-500 dark:hover:text-slate-300 transition-colors" style={{ transform: "scaleX(-1) rotate(-25deg)" }}>
                        send
                      </span>
                    </button>
                  </div>
                  {/* Bookmark — pushed to right */}
                  <div className="ml-auto">
                    <button type="button">
                      <span className="material-icons-round text-[26px] text-slate-800 dark:text-white hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
                        bookmark_border
                      </span>
                    </button>
                  </div>
                </div>

                {/* Avatar + Title + Date */}
                <div className="flex items-center gap-2.5 mb-1">
                  {post.poster_avatar ? (
                    <Image
                      src={post.poster_avatar}
                      alt="avatar"
                      width={30}
                      height={30}
                      className="w-[30px] h-[30px] rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-[10px] font-bold">
                        {(post.poster_name || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {post.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {post.poster_name || "Ẩn danh"} · {post.date}
                    </span>
                  </div>
                </div>

                {/* View comments link */}
                {post.comments.length > 0 && (
                  <div className="mb-1">
                    <div className="space-y-0.5 max-h-16 overflow-y-auto no-scrollbar">
                      {post.comments.slice(-2).map((comment) => (
                        <div key={comment.id} className="text-sm">
                          <span className="font-bold text-slate-800 dark:text-white mr-1">
                            {comment.author_name}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {comment.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    {post.comments.length > 2 && (
                      <div className="text-xs text-slate-400 mt-0.5">
                        Xem tất cả {post.comments.length} bình luận
                      </div>
                    )}
                  </div>
                )}

                {/* Comment input */}
                <div className="flex items-center gap-2 border-t border-slate-100 dark:border-[#1f2127] pt-2">
                  <input
                    id={`comment-input-${post.id}`}
                    type="text"
                    placeholder="Thêm bình luận..."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment(post.id);
                      }
                    }}
                    className="flex-1 text-sm py-1 bg-transparent text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                  {commentInputs[post.id]?.trim() && (
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={submittingComment === post.id}
                      className="text-blue-500 hover:text-blue-700 font-bold text-sm disabled:opacity-50 transition-colors"
                    >
                      {submittingComment === post.id ? "..." : "Đăng"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          </div>
        ))}
      </main>

      {/* Floating Footer */}
      {!showCamera && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <Footer onCameraClick={() => setShowCamera(true)} />
          </div>
        </div>
      )}

      {/* Heart animation keyframes */}
      <style jsx>{`
        @keyframes heartBeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(0.95); }
          75% { transform: scale(1.15); }
          100% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

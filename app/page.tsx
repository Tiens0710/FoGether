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
import CommentsModal from "./components/CommentsModal";
import type { Comment } from "./components/CommentsModal";

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
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editForm, setEditForm] = useState({ title: "", location: "", rating: "5.0" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [viewingCommentsPostId, setViewingCommentsPostId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Ẩn danh";
  const userAvatar = user?.user_metadata?.avatar_url || "";

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
              author_avatar: c.author_avatar || undefined,
              created_at: c.created_at,
              likes: c.likes || 0,
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
        .insert({ post_id: postId, text, author_name: userName, author_avatar: userAvatar || null })
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
          author_avatar: data.author_avatar || userAvatar,
          created_at: data.created_at,
          likes: 0,
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

  // Start editing a post
  const startEditing = (post: Post) => {
    setEditForm({
      title: post.title,
      location: post.location || "",
      rating: post.badge.label,
    });
    setEditingPost(post);
  };

  // Save edited post
  const handleEditPost = async () => {
    if (!editingPost) return;
    setSavingEdit(true);

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: editForm.title,
          location: editForm.location || null,
          rating: parseFloat(editForm.rating) || 5.0,
        })
        .eq('id', editingPost.id);

      if (error) {
        console.error("Error updating post:", error);
        alert("Lỗi khi cập nhật bài viết.");
        return;
      }

      // Update local state
      setFeedPosts(prev => prev.map(p =>
        p.id === editingPost.id
          ? {
            ...p,
            title: editForm.title,
            location: editForm.location || undefined,
            badge: { ...p.badge, label: parseFloat(editForm.rating).toFixed(1) || "5.0" },
          }
          : p
      ));
      setEditingPost(null);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error("Error deleting post:", error);
        alert("Lỗi khi xóa bài viết.");
        return;
      }

      setFeedPosts(prev => prev.filter(p => p.id !== postId));
      setEditingPost(null);
    } catch (err) {
      console.error("Unexpected error:", err);
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
        author_avatar: userAvatar || undefined,
        created_at: new Date().toISOString(),
        likes: 0,
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


  // Toggle save/bookmark
  const handleToggleSave = (postId: string) => {
    setSavedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  // Filter posts based on selected filter + search query
  const filteredPosts = useMemo(() => {
    let posts = feedPosts;
    if (feedFilter === "mine") {
      posts = posts.filter(p => p.user_id === user?.id);
    } else if (feedFilter === "saved") {
      posts = posts.filter(p => savedPostIds.has(p.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q)
      );
    }
    return posts;
  }, [feedPosts, feedFilter, user?.id, searchQuery, savedPostIds]);

  // Auth loading state
  if (authLoading) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-rose-50 dark:from-[#0b0b0d] dark:via-[#111317] dark:to-[#0b0b0d]">
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
          <div key={post.id} className="w-full h-screen snap-start shrink-0 flex items-center justify-center p-4 pt-20 pb-24">
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
                      onClick={() => setViewingCommentsPostId(post.id)}
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
                    <button
                      type="button"
                      onClick={() => handleToggleSave(post.id)}
                      style={savedPostIds.has(post.id) ? { animation: "heartBeat 0.35s ease-in-out" } : {}}
                    >
                      <span
                        className={`material-icons-round text-[26px] transition-colors ${savedPostIds.has(post.id)
                            ? "text-orange-400"
                            : "text-slate-800 dark:text-white hover:text-slate-500 dark:hover:text-slate-300"
                          }`}
                      >
                        {savedPostIds.has(post.id) ? "bookmark" : "bookmark_border"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Avatar + Title + Date */}
                <div className="flex items-center gap-2.5 mb-3">
                  {post.poster_avatar ? (
                    <Image
                      src={post.poster_avatar}
                      alt="avatar"
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">
                        {(post.poster_name || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-base font-bold text-slate-800 dark:text-white truncate">
                      {post.title}
                    </span>
                    <span className="text-xs text-slate-400">
                      {post.poster_name || "Ẩn danh"} · {post.date}
                    </span>
                  </div>
                  {/* Edit button — only for own posts */}
                  {post.user_id === user?.id && (
                    <button
                      type="button"
                      onClick={() => startEditing(post)}
                      className="shrink-0 text-slate-400 hover:text-blue-500 transition-colors"
                      title="Sửa bài viết"
                    >
                      <span className="material-icons-round text-lg">more_horiz</span>
                    </button>
                  )}
                </div>

                {/* Top comment (most liked) */}
                {(() => {
                  const topComment = [...post.comments].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
                  return topComment ? (
                    <div className="mb-1">
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 dark:text-white mr-1">
                          {topComment.author_name}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {topComment.text}
                        </span>
                        {topComment.likes > 0 && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-red-400">
                            <span className="material-icons-round" style={{ fontSize: '11px' }}>favorite</span>
                            {topComment.likes}
                          </span>
                        )}
                      </div>
                      {post.comments.length > 1 && (
                        <button
                          onClick={() => setViewingCommentsPostId(post.id)}
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-0.5 transition-colors"
                        >
                          Xem tất cả {post.comments.length} bình luận
                        </button>
                      )}
                    </div>
                  ) : null;
                })()}

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

      {/* Comments Modal */}
      {viewingCommentsPostId && (() => {
        const post = feedPosts.find(p => p.id === viewingCommentsPostId);
        return post ? (
          <CommentsModal
            postId={post.id}
            postTitle={post.title}
            comments={post.comments}
            userName={userName}
            userAvatar={userAvatar}
            onClose={() => setViewingCommentsPostId(null)}
            onCommentsUpdate={(postId, updatedComments) => {
              setFeedPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments: updatedComments } : p
              ));
            }}
          />
        ) : null;
      })()}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingPost(null)}
          />
          {/* Modal */}
          <div className="relative bg-white dark:bg-[#161820] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-white/20 dark:border-[#1f2127] z-10">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-5 text-center">
              Chỉnh sửa bài viết
            </h3>

            {/* Title */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                Tên món
              </label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1f2127] border border-slate-200 dark:border-[#2a2d35] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-all"
                placeholder="Ví dụ: Phở bò Hà Nội"
              />
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                Địa điểm
              </label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1f2127] border border-slate-200 dark:border-[#2a2d35] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-all"
                placeholder="Ví dụ: 123 Nguyễn Huệ, Q.1"
              />
            </div>

            {/* Rating */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                Đánh giá (1–5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={editForm.rating}
                onChange={(e) => setEditForm(f => ({ ...f, rating: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#1f2127] border border-slate-200 dark:border-[#2a2d35] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setEditingPost(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-[#1f2127] text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-[#252830] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleEditPost}
                disabled={savingEdit || !editForm.title.trim()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-rose-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {savingEdit ? "Đang lưu..." : "Lưu"}
              </button>
            </div>

            {/* Delete button */}
            <button
              onClick={() => handleDeletePost(editingPost.id)}
              className="w-full mt-3 py-2.5 text-red-500 hover:text-red-400 text-sm font-semibold transition-colors"
            >
              Xóa bài viết
            </button>
          </div>
        </div>
      )}

      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "rgba(10,10,12,0.85)", backdropFilter: "blur(20px)" }}>
          {/* Search bar */}
          <div className="flex items-center gap-3 px-5 pt-14 pb-4">
            <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
              <span className="material-icons-round text-white/60" style={{ fontSize: 20 }}>search</span>
              <input
                autoFocus
                type="text"
                placeholder="Tìm tên món, địa điểm..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder:text-white/40 text-sm focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-white/50 hover:text-white transition-colors">
                  <span className="material-icons-round" style={{ fontSize: 18 }}>close</span>
                </button>
              )}
            </div>
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(""); }}
              className="text-white/70 hover:text-white font-semibold text-sm transition-colors"
            >
              Hủy
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-5 pb-8">
            {searchQuery.trim() === "" ? (
              <p className="text-center text-white/30 text-sm mt-12">Nhập tên món để tìm kiếm</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-center text-white/30 text-sm mt-12">Không tìm thấy món nào 😔</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredPosts.map(post => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                    className="flex items-center gap-3 bg-white/8 hover:bg-white/12 border border-white/10 rounded-2xl p-3 text-left transition-colors w-full"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/10 relative">
                      {post.image && (
                        <Image src={post.image} alt={post.title} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{post.title}</p>
                      {post.location && (
                        <p className="text-white/40 text-xs truncate mt-0.5">
                          <span className="material-icons-round" style={{ fontSize: 11, verticalAlign: "middle" }}>place</span>
                          {" "}{post.location}
                        </p>
                      )}
                      <p className="text-white/30 text-xs mt-0.5">{post.poster_name} · {post.date}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="material-icons-round text-yellow-400" style={{ fontSize: 14 }}>star</span>
                      <span className="text-white/70 text-xs font-bold">{post.badge.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Footer */}
      {!showCamera && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <Footer onCameraClick={() => setShowCamera(true)} onSearchClick={() => setShowSearch(true)} />
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

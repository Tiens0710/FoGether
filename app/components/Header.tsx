"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "./AuthProvider";
import "./Header.css";

export type FeedFilter = "all" | "friends" | "mine" | "saved";

type HeaderProps = {
  feedFilter?: FeedFilter;
  onFilterChange?: (filter: FeedFilter) => void;
};

const filterOptions: { value: FeedFilter; label: string; icon: string }[] = [
  { value: "all", label: "Mọi người", icon: "public" },
  { value: "friends", label: "Bạn bè", icon: "group" },
  { value: "mine", label: "Của tôi", icon: "person" },
  { value: "saved", label: "Đã lưu", icon: "bookmark" },
];

export default function Header({ feedFilter = "all", onFilterChange }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const currentFilter = filterOptions.find(f => f.value === feedFilter) || filterOptions[0];

  return (
    <header className="header">
      <button type="button" className="header__circle header__circle--icon">
        <span className="material-icons-round">campaign</span>
      </button>

      {/* Filter Pill with Dropdown */}
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          type="button"
          className="header__pill"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span className="header__pill-text">{currentFilter.label}</span>
          <span
            className="material-icons-round header__pill-caret"
            style={{
              transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            expand_more
          </span>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              minWidth: 160,
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(30, 32, 36, 0.85)",
              backdropFilter: "blur(24px) saturate(170%)",
              boxShadow: "0 20px 50px -16px rgba(0,0,0,0.7)",
              zIndex: 100,
              animation: "fadeSlideDown 0.2s ease",
            }}
          >
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onFilterChange?.(option.value);
                  setShowDropdown(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: feedFilter === option.value ? "rgba(255,255,255,0.1)" : "transparent",
                  color: feedFilter === option.value ? "#ffffff" : "#a0a4b0",
                  fontSize: 14,
                  fontWeight: feedFilter === option.value ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background =
                    feedFilter === option.value ? "rgba(255,255,255,0.1)" : "transparent";
                }}
              >
                <span className="material-icons-round" style={{ fontSize: 20 }}>
                  {option.icon}
                </span>
                <span>{option.label}</span>
                {feedFilter === option.value && (
                  <span className="material-icons-round" style={{ fontSize: 18, marginLeft: "auto" }}>
                    check
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {user ? (
        <button
          type="button"
          className="header__circle"
          onClick={signOut}
          title="Đăng xuất"
          style={{ padding: 0, overflow: "hidden", width: 42, height: 42 }}
        >
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt="avatar"
              width={42}
              height={42}
              className="header__img"
            />
          ) : (
            <span className="header__circle--initials">
              {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
            </span>
          )}
        </button>
      ) : (
        <button type="button" className="header__circle header__circle--initials">
          <span>TN</span>
        </button>
      )}
    </header>
  );
}

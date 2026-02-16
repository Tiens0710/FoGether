"use client";

import Image from "next/image";
import { useAuth } from "./AuthProvider";
import "./Header.css";

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="header">
      <button type="button" className="header__circle header__circle--icon">
        <span className="material-icons-round">campaign</span>
      </button>

      <button type="button" className="header__pill">
        <span className="header__pill-text">Mọi người</span>
        <span className="material-icons-round header__pill-caret">expand_more</span>
      </button>

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

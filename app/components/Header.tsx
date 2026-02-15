import "./Header.css";

type HeaderProps = {
  className?: string;
};

export default function Header({ className }: HeaderProps) {
  return (
    <header className={className ? `header ${className}` : "header"}>
      <button type="button" className="header__circle header__circle--icon">
        <span className="material-icons-round">campaign</span>
      </button>

      <button type="button" className="header__pill">
        <span className="header__pill-text">Mọi người</span>
        <span className="material-icons-round header__pill-caret">expand_more</span>
      </button>

      <button type="button" className="header__circle header__circle--initials">
        <span className="header__initials">TN</span>
      </button>
    </header>
  );
}

import "./Footer.css";

type FooterProps = {
  className?: string;
  onCameraClick?: () => void;
  onSearchClick?: () => void;
};

export default function Footer({ className, onCameraClick, onSearchClick }: FooterProps) {
  const rootClass = className ? `footer ${className}` : "footer";

  return (
    <nav className={rootClass}>
      <div className="footer__inner">
        <div className="footer__group footer__group--center footer__group--pill">
          <button type="button" className="footer__button footer__button--ghost" onClick={onSearchClick}>
            <span className="material-icons-round footer__icon">search</span>
            <span className="footer__label">Tìm kiếm</span>
          </button>
          <button
            type="button"
            className="footer__button footer__button--primary"
            onClick={onCameraClick}
          >
            <span className="footer__primary-dot" />
          </button>
          <button type="button" className="footer__button footer__button--ghost">
            <span className="material-icons-round footer__icon">chat_bubble</span>
            <span className="footer__label">Chat</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

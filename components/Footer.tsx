const columns = [
  {
    title: "Отбор",
    links: ["За нас", "Играчи", "Треньор", "Галерия"],
  },
  {
    title: "Мачове",
    links: ["Програма", "Резултати", "Класиране", "Зали"],
  },
  {
    title: "Помощ",
    links: ["Въпроси и отговори", "Контакти", "Присъедини се", "Спонсори"],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.svg" alt="Яките пичове" className="footer-logo" />
          <p>Волейболен отбор от София. Заедно на терена, заедно извън него.</p>
          <a
            href="https://www.instagram.com/yakite.pichove/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-insta"
          >
            @yakite.pichove
          </a>
        </div>

        {columns.map((col) => (
          <nav key={col.title} className="footer-col" aria-label={col.title}>
            <h4>{col.title}</h4>
            <ul>
              {col.links.map((label) => (
                <li key={label}>
                  <a href="#">{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Яките пичове. Всички права запазени.</span>
        <span className="footer-legal">
          <a href="#">Поверителност</a>
          <a href="#">Условия</a>
        </span>
      </div>
    </footer>
  );
}
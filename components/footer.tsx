import { GitHubIcon } from './icons';

const REIN_GITHUB = 'https://github.com/qxrein';
const SHREY_X = 'https://x.com/atshrey';
const RECALL_REPO = 'https://github.com/qxrein/nptel-recall';

export default function Footer() {
  return <footer className="footer">
    <span className="footer-credit">
      Made with <svg className="heart" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="love"><path d="M12 21s-7.5-4.6-10-9.3C.3 8.4 2.1 4 6.3 4c2.4 0 4 1.4 5.7 3.4C13.7 5.4 15.3 4 17.7 4 21.9 4 23.7 8.4 22 11.7 19.5 16.4 12 21 12 21z" /></svg> by <a href={REIN_GITHUB} target="_blank" rel="noopener noreferrer" title="github.com/qxrein">Rein</a> and <a href={SHREY_X} target="_blank" rel="noopener noreferrer">Shrey</a>
    </span>
    <a className="footer-contribute" href={RECALL_REPO} target="_blank" rel="noopener noreferrer" aria-label="Contribute to Recall on GitHub">
      <GitHubIcon size={14} />
      Contribute
    </a>
  </footer>;
}

import type { Metadata } from 'next';
import Link from 'next/link';
import SettingsPanel from '@/components/settings-panel';
import ThemeToggle from '@/components/theme-toggle';
import { ArrowLeftIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Settings',
  description:
    'Add Gemini API keys so Recall can generate deep theory summaries for each week.',
};

export default function SettingsPage() {
  return <div className="settings-shell">
    <header className="settings-top">
      <Link href="/" className="wordmark" aria-label="Recall home">
        <span className="mark" aria-hidden="true">r.</span>
        recall
      </Link>
      <div className="settings-top-actions">
        <Link href="/" className="settings-back">
          <ArrowLeftIcon size={13} />
          Back to study desk
        </Link>
        <ThemeToggle />
      </div>
    </header>

    <main className="settings-main">
      <p className="settings-kicker">Settings</p>
      <h1>Your AI keys<span className="period">.</span></h1>
      <p className="settings-lede">
        Recall can turn each week into a deep theory guide using Gemini. Add a
        free API key below; for now Gemini is the only provider supported. Keys
        stay in this browser and are sent only to Google.
      </p>
      <SettingsPanel />
    </main>

    <footer className="settings-foot">
      <span>Keys never touch Recall&rsquo;s server.</span>
      <span className="settings-foot-dot" aria-hidden="true">·</span>
      <span>Summaries explain theory, not answers.</span>
    </footer>
  </div>;
}

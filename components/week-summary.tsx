'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import type { Course, Week } from '@/lib/study';
import {
  activeGeminiKey,
  buildSummaryPrompt,
  DEFAULT_GEMINI_MODEL,
  GEMINI_KEYS_STORAGE_KEY,
  GeminiError,
  generateWeekSummary,
  isAbortError,
  loadCachedSummary,
  loadGeminiConfig,
  modelLabel,
  saveCachedSummary,
  summaryStorageKey,
} from '@/lib/gemini';
import type { CachedSummary, GeminiConfig } from '@/lib/gemini';
import {
  ChevronDownIcon,
  CloseIcon,
  ExternalLinkIcon,
  MaximizeIcon,
  RefreshIcon,
  SparklesIcon,
  StopIcon,
} from './icons';
import Markdown from './markdown';

type Props = { course: Course; week: Week };

const API_KEY_CONSOLE = 'https://aistudio.google.com/apikey';

function formatGeneratedAt(value: string): string {
  if (!value) return 'Saved on this device';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Saved on this device';
  return `Generated ${date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

function ThinkingLoader({ elapsed }: { elapsed: number }) {
  const stage =
    elapsed < 6
      ? 'Reading the week’s questions…'
      : elapsed < 20
        ? 'Thinking through the theory…'
        : 'Writing the deep summary…';
  return (
    <div className="summary-loading">
      <span className="summary-spinner" aria-hidden="true" />
      <div>
        <p className="summary-thinking">
          <strong>Thinking deeply…</strong> {stage}
        </p>
        <p className="summary-note">
          {elapsed}s elapsed · high thinking can take a minute or two.
        </p>
      </div>
    </div>
  );
}

export default function WeekSummary({ course, week }: Props) {
  const [config, setConfig] = useState<GeminiConfig | null>(null);
  const [summary, setSummary] = useState<CachedSummary | null>(null);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle');
  const [streamed, setStreamed] = useState('');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [overflowing, setOverflowing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const dialogTitleId = useId();
  const bodyId = useId();

  const activeKey = activeGeminiKey(config);
  const streaming = status === 'streaming';
  const hasSummary = !!summary?.text.trim();
  const displayText = streaming ? streamed : (summary?.text ?? '');
  const readingModel = streaming
    ? (activeKey?.model ?? DEFAULT_GEMINI_MODEL)
    : (summary?.model || activeKey?.model || DEFAULT_GEMINI_MODEL);

  // Load saved keys and the cached summary for this week, and follow changes
  // made in another tab (the settings page is usually same-tab navigation).
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setConfig(loadGeminiConfig());
    setSummary(loadCachedSummary(course.courseId, week.week));
    setStatus('idle');
    setStreamed('');
    setError('');
    setExpanded(false);
    setMaximized(false);
  }, [course.courseId, week.week]);

  useEffect(() => {
    function refresh(event: StorageEvent) {
      if (event.key === GEMINI_KEYS_STORAGE_KEY) setConfig(loadGeminiConfig());
      if (event.key === summaryStorageKey(course.courseId, week.week)) {
        setSummary(loadCachedSummary(course.courseId, week.week));
      }
    }
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [course.courseId, week.week]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (status !== 'streaming') {
      setElapsed(0);
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (maximized && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
    if (!maximized && dialog.open) dialog.close();
  }, [maximized]);

  useEffect(() => {
    if (!maximized) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [maximized]);

  // Only fade a collapsed summary that actually has more to read.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || expanded || streaming) {
      setOverflowing(false);
      return;
    }
    const measure = () =>
      setOverflowing(body.scrollHeight > body.clientHeight + 2);
    const frame = window.requestAnimationFrame(measure);
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(body);
    }
    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [displayText, expanded, streaming]);

  async function generate() {
    if (!activeKey || streaming) return;
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setStatus('streaming');
    setStreamed('');
    setError('');
    setExpanded(true);

    try {
      const result = await generateWeekSummary({
        apiKey: activeKey.key,
        model: activeKey.model,
        prompt: buildSummaryPrompt(course, week),
        signal: controller.signal,
        onText: (delta) => setStreamed((current) => current + delta),
      });
      const text = result.text.trim();
      if (!text) {
        throw new GeminiError('Gemini returned an empty summary. Try again.');
      }
      const cached: CachedSummary = {
        text,
        model: activeKey.model,
        generatedAt: new Date().toISOString(),
      };
      setSummary(cached);
      saveCachedSummary(course.courseId, week.week, cached);
      setStatus('idle');
    } catch (caught) {
      if (isAbortError(caught)) {
        setStatus('idle');
        setStreamed('');
        return;
      }
      setError(
        caught instanceof GeminiError
          ? caught.message
          : 'Something went wrong while generating the summary. Try again.',
      );
      setStatus('error');
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
  }

  function openMaximized() {
    if (!hasSummary || streaming) return;
    setMaximized(true);
  }

  const meta = summary
    ? `${formatGeneratedAt(summary.generatedAt)} · ${modelLabel(summary.model || readingModel)}`
    : '';

  const loader = <ThinkingLoader elapsed={elapsed} />;

  return (
    <section className="week-summary" aria-labelledby={titleId}>
      <p className="visually-hidden" role="status" aria-live="polite">
        {streaming
          ? 'Generating a theory summary.'
          : status === 'error'
            ? 'Summary generation failed.'
            : hasSummary
              ? 'Theory summary ready.'
              : ''}
      </p>
      <div className={`summary-card${streaming ? ' is-streaming' : ''}`}>
        <div className="summary-inner">
          <header className="summary-head">
            <div>
              <p className="summary-kicker">
                <SparklesIcon size={13} />
                AI theory summary
              </p>
              <h2 id={titleId}>
                Week summary<span className="period">.</span>
              </h2>
              <p className="summary-sub">
                A deep explanation of the theory behind this week’s questions.
                It teaches the concepts without revealing the answers.
              </p>
            </div>
            {hasSummary && !streaming && (
              <div className="summary-head-actions">
                <button
                  className="summary-icon-button"
                  aria-label={expanded ? 'Collapse summary' : 'Expand summary'}
                  title={expanded ? 'Collapse summary' : 'Expand summary'}
                  aria-expanded={expanded}
                  aria-controls={bodyId}
                  onClick={() => setExpanded((value) => !value)}
                >
                  <ChevronDownIcon
                    size={15}
                    className={expanded ? 'summary-chevron up' : 'summary-chevron'}
                  />
                </button>
                <button
                  className="summary-icon-button"
                  aria-label="Maximize summary"
                  title="Maximize summary"
                  onClick={openMaximized}
                >
                  <MaximizeIcon size={15} />
                </button>
              </div>
            )}
          </header>

          {config === null && (
            <p className="summary-note summary-checking">
              Checking your Gemini settings…
            </p>
          )}

          {config !== null && !activeKey && !hasSummary && (
            <div className="summary-empty">
              <div>
                <p>
                  <strong>Bring your own Gemini key.</strong> Add a free API
                  key once, then generate a detailed theory summary for any
                  week.
                </p>
                <p className="summary-note">
                  Keys stay in this browser and go straight to Google.
                </p>
              </div>
              <div className="summary-empty-actions">
                <Link href="/settings" className="primary-button">
                  Add a Gemini key
                </Link>
                <a
                  className="summary-external"
                  href={API_KEY_CONSOLE}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Get a free key
                  <ExternalLinkIcon size={12} />
                </a>
              </div>
            </div>
          )}

          {config !== null && activeKey && !hasSummary && status === 'idle' && (
            <div className="summary-empty">
              <div>
                <p>
                  <strong>Ready when you are.</strong> Gemini will read this
                  week’s questions and write a detailed theory guide without
                  answering them.
                </p>
                <p className="summary-note">
                  High thinking · {modelLabel(activeKey.model)} · key stays on
                  this device
                </p>
              </div>
              <div className="summary-empty-actions">
                <button className="primary-button" onClick={generate}>
                  <SparklesIcon size={14} />
                  Generate summary
                </button>
              </div>
            </div>
          )}

          {config !== null && !activeKey && hasSummary && (
            <p className="summary-note summary-regenerate-note">
              Add or select a Gemini key in{' '}
              <Link href="/settings">Settings</Link> to regenerate this
              summary.
            </p>
          )}

          {status === 'error' && (
            <div className="summary-error" role="alert">
              <p>{error}</p>
              <div className="summary-error-actions">
                {activeKey && (
                  <button className="secondary-button" onClick={generate}>
                    Try again
                  </button>
                )}
                <Link href="/settings" className="text-button">
                  Open settings
                </Link>
              </div>
            </div>
          )}

          {(streaming || hasSummary) && (
            <>
              <div
                ref={bodyRef}
                id={bodyId}
                className={`summary-body${expanded || streaming ? ' expanded' : ' collapsed'}${overflowing ? ' has-overflow' : ''}`}
              >
                {streaming && !streamed.trim()
                  ? loader
                  : displayText.trim()
                    ? <Markdown text={displayText} />
                    : null}
              </div>

              {streaming && streamed.trim() && (
                <div className="summary-stream-status">
                  <span className="summary-spinner" aria-hidden="true" />
                  Still writing · {elapsed}s
                  <button
                    className="summary-action summary-stop"
                    onClick={stopGeneration}
                  >
                    <StopIcon size={12} />
                    Stop
                  </button>
                </div>
              )}

              {streaming && !streamed.trim() && (
                <div className="summary-stream-actions">
                  <button className="summary-action" onClick={stopGeneration}>
                    <StopIcon size={12} />
                    Stop
                  </button>
                </div>
              )}

              {!streaming && hasSummary && (
                <div className="summary-toolbar">
                  <span className="summary-meta">{meta}</span>
                  <div className="summary-actions">
                    <button
                      className="summary-action"
                      aria-expanded={expanded}
                      aria-controls={bodyId}
                      onClick={() => setExpanded((value) => !value)}
                    >
                      <ChevronDownIcon
                        size={13}
                        className={expanded ? 'summary-chevron up' : 'summary-chevron'}
                      />
                      {expanded ? 'Collapse' : 'Expand'}
                    </button>
                    {activeKey && (
                      <button className="summary-action" onClick={generate}>
                        <RefreshIcon size={13} />
                        Regenerate
                      </button>
                    )}
                    <button className="summary-action" onClick={openMaximized}>
                      <MaximizeIcon size={13} />
                      Maximize
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="summary-dialog"
        aria-labelledby={dialogTitleId}
        onClose={() => setMaximized(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setMaximized(false);
        }}
      >
        <div className="summary-dialog-head">
          <div>
            <p className="summary-kicker">
              <SparklesIcon size={13} />
              AI theory summary
            </p>
            <h2 id={dialogTitleId}>
              Week {week.week}: {week.topic}
              <span className="period">.</span>
            </h2>
            <p className="summary-dialog-sub">
              High thinking · {modelLabel(readingModel)} · theory only, no answer
              key
            </p>
          </div>
          <button
            ref={closeButtonRef}
            className="summary-close"
            onClick={() => setMaximized(false)}
            aria-label="Close summary"
            title="Close summary"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="summary-dialog-body">
          {streaming && !streamed.trim()
            ? loader
            : displayText.trim()
              ? <Markdown text={displayText} />
              : null}
          {streaming && streamed.trim() && (
            <div className="summary-stream-status">
              <span className="summary-spinner" aria-hidden="true" />
              Still writing · {elapsed}s
            </div>
          )}
          {status === 'error' && (
            <div className="summary-error" role="alert">
              <p>{error}</p>
              <div className="summary-error-actions">
                {activeKey && (
                  <button className="secondary-button" onClick={generate}>
                    Try again
                  </button>
                )}
                <Link
                  href="/settings"
                  className="text-button"
                  onClick={() => setMaximized(false)}
                >
                  Open settings
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className="summary-dialog-foot">
          <span>{streaming ? 'Generating…' : meta || 'Explains theory, not answers'}</span>
          <div className="summary-dialog-actions">
            {activeKey && !streaming && (
              <button className="secondary-button" onClick={generate}>
                Regenerate
              </button>
            )}
            <button
              className="secondary-button"
              onClick={() => setMaximized(false)}
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
}

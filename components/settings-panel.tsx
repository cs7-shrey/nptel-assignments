'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  activeGeminiKey,
  clearCachedSummaries,
  countCachedSummaries,
  createGeminiKey,
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODELS,
  GeminiError,
  isAbortError,
  loadGeminiConfig,
  maskApiKey,
  modelLabel,
  saveGeminiConfig,
  testGeminiKey,
} from '@/lib/gemini';
import type { GeminiConfig, GeminiKey } from '@/lib/gemini';
import {
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  SparklesIcon,
  TrashIcon,
} from './icons';

const API_KEY_CONSOLE = 'https://aistudio.google.com/apikey';
const CUSTOM_MODEL = '__custom';

type TestState =
  | { state: 'testing' }
  | { state: 'ok'; message: string }
  | { state: 'error'; message: string };

export default function SettingsPanel() {
  const [config, setConfig] = useState<GeminiConfig | null>(null);
  const [summaryCount, setSummaryCount] = useState(0);
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelChoice, setModelChoice] = useState(DEFAULT_GEMINI_MODEL);
  const [customModel, setCustomModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [storageWarning, setStorageWarning] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, TestState>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const labelId = useId();
  const keyId = useId();
  const modelId = useId();
  const customId = useId();
  const keyHintId = useId();
  const formTitleId = useId();

  useEffect(() => {
    setConfig(loadGeminiConfig());
    setSummaryCount(countCachedSummaries());
  }, []);

  const keys = config?.keys ?? [];
  const active = activeGeminiKey(config);
  const editing = editingId ? keys.find((item) => item.id === editingId) : null;

  function commit(next: GeminiConfig) {
    setConfig(next);
    if (!saveGeminiConfig(next)) setStorageWarning(true);
    else setStorageWarning(false);
  }

  function clearTest(id: string) {
    setTests((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function resetForm() {
    setLabel('');
    setApiKey('');
    setModelChoice(DEFAULT_GEMINI_MODEL);
    setCustomModel('');
    setShowKey(false);
    setEditingId(null);
    setFormError('');
    setPendingDelete(null);
  }

  function startEdit(item: GeminiKey) {
    setEditingId(item.id);
    setLabel(item.label);
    setApiKey(item.key);
    setShowKey(false);
    const known = GEMINI_MODELS.some((option) => option.id === item.model);
    setModelChoice(known ? item.model : CUSTOM_MODEL);
    setCustomModel(known ? '' : item.model);
    setFormError('');
    setNotice('');
    clearTest(item.id);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config) return;
    const cleanedKey = apiKey.replace(/\s+/g, '');
    const chosenModel =
      modelChoice === CUSTOM_MODEL ? customModel.trim() : modelChoice;
    if (!cleanedKey) {
      setFormError('Paste a Gemini API key first.');
      return;
    }
    if (cleanedKey.length < 20) {
      setFormError(
        'That key looks too short. Paste the full key from Google AI Studio.',
      );
      return;
    }
    if (!chosenModel) {
      setFormError('Enter the model id you want to use.');
      return;
    }
    const duplicate = config.keys.find(
      (item) => item.id !== editingId && item.key === cleanedKey,
    );
    if (duplicate) {
      setFormError(
        `That key is already saved as “${duplicate.label}”. Edit that entry instead.`,
      );
      return;
    }

    const next: GeminiConfig = { ...config };
    if (editingId) {
      next.keys = config.keys.map((item) =>
        item.id === editingId
          ? {
              ...item,
              label: label.trim() || item.label,
              key: cleanedKey,
              model: chosenModel,
            }
          : item,
      );
      clearTest(editingId);
      setNotice('Key updated.');
    } else {
      const created = createGeminiKey(
        label.trim() || `Gemini key ${config.keys.length + 1}`,
        cleanedKey,
        chosenModel,
      );
      next.keys = [...config.keys, created];
      next.activeId = created.id;
      setNotice('Key saved. It is now used for summaries.');
    }
    commit(next);
    resetForm();
  }

  function activate(item: GeminiKey) {
    if (!config) return;
    commit({ ...config, activeId: item.id });
    setNotice(`“${item.label}” will be used for summaries.`);
  }

  function remove(item: GeminiKey) {
    if (!config) return;
    const remaining = config.keys.filter((entry) => entry.id !== item.id);
    const activeId =
      config.activeId === item.id
        ? (remaining[0]?.id ?? null)
        : config.activeId;
    commit({ keys: remaining, activeId });
    if (editingId === item.id) resetForm();
    setPendingDelete(null);
    setTests((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setNotice('Key removed.');
  }

  async function testKey(item: GeminiKey) {
    setTests((current) => ({ ...current, [item.id]: { state: 'testing' } }));
    try {
      await testGeminiKey(item.key, item.model);
      setTests((current) => ({
        ...current,
        [item.id]: {
          state: 'ok',
          message: `Key works with ${modelLabel(item.model)}.`,
        },
      }));
    } catch (caught) {
      const message = isAbortError(caught)
        ? 'The test timed out. Check your connection and try again.'
        : caught instanceof GeminiError
          ? caught.message
          : 'Could not test this key.';
      setTests((current) => ({
        ...current,
        [item.id]: { state: 'error', message },
      }));
    }
  }

  function clearSummaries() {
    const cleared = clearCachedSummaries();
    setSummaryCount(countCachedSummaries());
    setNotice(
      cleared
        ? `Cleared ${cleared} saved ${cleared === 1 ? 'summary' : 'summaries'}.`
        : 'There were no saved summaries to clear.',
    );
  }

  return (
    <>
      <section className="settings-card" aria-labelledby={formTitleId}>
        <div className="settings-card-head">
          <div>
            <p className="settings-kicker-small">Gemini</p>
            <h2 id={formTitleId}>API keys</h2>
            <p>
              Add one or more free Gemini keys and pick the model each one
              uses. The active key powers the weekly theory summaries.
            </p>
          </div>
          {config !== null && (
            <span className="settings-key-count">
              {keys.length} {keys.length === 1 ? 'key' : 'keys'}
            </span>
          )}
        </div>

        {storageWarning && (
          <p className="settings-warning" role="alert">
            This browser blocked local storage, so the change may not survive a
            reload. Try allowing site data for Recall.
          </p>
        )}

        {config === null ? (
          <p className="settings-loading">Loading saved keys…</p>
        ) : (
          <>
            {keys.length === 0 ? (
              <p className="settings-empty">
                No keys saved yet. Add your first free Gemini key below.
              </p>
            ) : (
              <ul className="settings-key-list">
                {keys.map((item) => {
                  const test = tests[item.id];
                  const isActive = config.activeId === item.id;
                  return (
                    <li
                      className={`settings-key${isActive ? ' is-active' : ''}`}
                      key={item.id}
                    >
                      <div className="settings-key-main">
                        <div className="settings-key-name">
                          <KeyIcon size={13} />
                          {item.label}
                          {isActive && (
                            <span className="settings-active-chip">Active</span>
                          )}
                        </div>
                        <div className="settings-key-meta">
                          <span className="settings-key-secret">
                            {maskApiKey(item.key)}
                          </span>
                          <span className="settings-model-chip">
                            {modelLabel(item.model)}
                          </span>
                        </div>
                        {test && (
                          <p
                            className={`settings-test ${test.state}`}
                            role={test.state === 'error' ? 'alert' : 'status'}
                          >
                            {test.state === 'testing' && 'Testing key…'}
                            {test.state === 'ok' && (
                              <>
                                <CheckIcon size={12} /> {test.message}
                              </>
                            )}
                            {test.state === 'error' && test.message}
                          </p>
                        )}
                      </div>
                      <div className="settings-key-actions">
                        {!isActive && (
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => activate(item)}
                          >
                            Use for summaries
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => testKey(item)}
                          disabled={test?.state === 'testing'}
                        >
                          {test?.state === 'testing' ? 'Testing…' : 'Test'}
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>
                        {pendingDelete === item.id ? (
                          <>
                            <button
                              type="button"
                              className="text-button danger"
                              onClick={() => remove(item)}
                            >
                              Confirm delete
                            </button>
                            <button
                              type="button"
                              className="text-button"
                              onClick={() => setPendingDelete(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => setPendingDelete(item.id)}
                          >
                            <TrashIcon size={12} />
                            Delete
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <form
              className="settings-form"
              ref={formRef}
              onSubmit={submit}
            >
              <div className="settings-field full">
                <p className="settings-form-title">
                  {editing ? (
                    <>Editing “{editing.label}”</>
                  ) : (
                    <>Add a key</>
                  )}
                </p>
              </div>

              <div className="settings-field">
                <label htmlFor={labelId}>Name</label>
                <input
                  id={labelId}
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="My free Gemini key"
                  maxLength={40}
                  autoComplete="off"
                />
                <p className="settings-field-hint">
                  Only shown here, so you can tell keys apart.
                </p>
              </div>

              <div className="settings-field">
                <label htmlFor={modelId}>Model</label>
                <select
                  id={modelId}
                  value={modelChoice}
                  onChange={(event) => {
                    setModelChoice(event.target.value);
                    setFormError('');
                  }}
                >
                  {GEMINI_MODELS.map((option) => (
                    <option value={option.id} key={option.id}>
                      {option.label}
                    </option>
                  ))}
                  <option value={CUSTOM_MODEL}>Custom model id…</option>
                </select>
                {modelChoice === CUSTOM_MODEL ? (
                  <input
                    id={customId}
                    value={customModel}
                    onChange={(event) => setCustomModel(event.target.value)}
                    placeholder="gemini-3.8-flash"
                    aria-label="Custom Gemini model id"
                    autoComplete="off"
                    spellCheck={false}
                    className="settings-custom-model"
                  />
                ) : (
                  <p className="settings-field-hint">
                    {
                      GEMINI_MODELS.find((option) => option.id === modelChoice)
                        ?.note
                    }
                  </p>
                )}
              </div>

              <div className="settings-field full">
                <label htmlFor={keyId}>API key</label>
                <div className="settings-key-input-wrap">
                  <input
                    id={keyId}
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(event) => {
                      setApiKey(event.target.value);
                      setFormError('');
                    }}
                    placeholder="AIza…"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-describedby={keyHintId}
                  />
                  <button
                    type="button"
                    className="settings-reveal"
                    onClick={() => setShowKey((value) => !value)}
                    aria-label={showKey ? 'Hide API key' : 'Show API key'}
                    title={showKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showKey ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                  </button>
                </div>
                <p className="settings-field-hint" id={keyHintId}>
                  Paste the key from{' '}
                  <a
                    href={API_KEY_CONSOLE}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Google AI Studio
                  </a>
                  . It usually starts with <code>AIza</code>. Use a free key
                  rather than a billable production key.
                </p>
              </div>

              {formError && (
                <p className="settings-form-error full" role="alert">
                  {formError}
                </p>
              )}
              {notice && !formError && (
                <p className="settings-notice full" role="status">
                  {notice}
                </p>
              )}

              <div className="settings-form-actions">
                <button type="submit" className="primary-button">
                  {editing ? 'Save changes' : 'Save key'}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
                <span className="settings-form-aside">
                  Summaries always use high thinking.
                </span>
              </div>
            </form>

            <div className="settings-tools">
              <span>
                {summaryCount
                  ? `${summaryCount} saved ${summaryCount === 1 ? 'summary' : 'summaries'} on this device`
                  : 'No saved summaries on this device'}
              </span>
              <button
                type="button"
                className="text-button"
                onClick={clearSummaries}
                disabled={summaryCount === 0}
              >
                Clear summaries
              </button>
            </div>
          </>
        )}
      </section>

      <div className="settings-grid">
        <section className="settings-info">
          <p className="settings-kicker-small">Free API key</p>
          <h2>Get a Gemini key</h2>
          <ol>
            <li>
              Open the{' '}
              <a
                href={API_KEY_CONSOLE}
                target="_blank"
                rel="noreferrer noopener"
              >
                Google AI Studio API keys console
              </a>
              .
            </li>
            <li>Sign in with a Google account and create an API key.</li>
            <li>
              Copy the key (it usually starts with <code>AIza</code>) and paste
              it into the form above.
            </li>
            <li>
              Use a free-tier model such as Gemini 3.8 Flash. Free-tier limits
              apply.
            </li>
          </ol>
          <a
            className="settings-console-link"
            href={API_KEY_CONSOLE}
            target="_blank"
            rel="noreferrer noopener"
          >
            <KeyIcon size={14} />
            Open the Gemini console
            <ExternalLinkIcon size={12} />
          </a>
          <p className="settings-fineprint">
            Free-tier availability and rate limits are set by Google. See the{' '}
            <a
              href="https://ai.google.dev/gemini-api/docs/rate-limits"
              target="_blank"
              rel="noreferrer noopener"
            >
              Gemini API rate limits
            </a>
            .
          </p>
        </section>

        <section className="settings-info">
          <p className="settings-kicker-small">Privacy</p>
          <h2>Where your data goes</h2>
          <p>
            Keys are stored only in this browser’s local storage. Requests go
            directly from your browser to Google’s Gemini API; they never pass
            through Recall’s server.
          </p>
          <p>
            Anyone with access to this browser profile can read a saved key.
            Remove keys you no longer use, and never paste a shared or
            production credential here.
          </p>
          <p>
            Free-tier requests may be used by Google to improve its products,
            and weekly question text and options are included in each summary
            request. Answer-key fields are never sent. Review{' '}
            <a
              href="https://ai.google.dev/gemini-api/terms"
              target="_blank"
              rel="noreferrer noopener"
            >
              Google’s terms
            </a>{' '}
            before using the feature.
          </p>
          <p className="settings-fineprint">
            <SparklesIcon size={12} /> Summaries explain theory only. They are
            generated study notes, not the official answer key.
          </p>
        </section>
      </div>
    </>
  );
}

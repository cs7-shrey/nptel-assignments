'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { courses, lastWeekKey, subjectGroups, weekPath } from '@/lib/courses';
import type { Subject, SubjectGroup } from '@/lib/courses';

// A course that runs in more than one year expands to a year picker before it opens.
const latest = (group: SubjectGroup) => group.members[group.members.length - 1];
const LAST_YEARS_KEY = 'recall:last-years';

// Switching subjects remounts the course layout, which also closes the menu.
export default function SubjectSwitcher({ course }: { course: Subject }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [lastYears, setLastYears] = useState<Record<string, string>>({});
  const [lastWeeks, setLastWeeks] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);

  // Each subject reopens on the week it was last left on, and multi-year courses pre-select the year last opened.
  const openPath = (s: Subject) => weekPath(s, lastWeeks[s.courseId] ?? s.weeks[0].week);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return subjectGroups;
    return subjectGroups.filter(g => g.label.toLowerCase().includes(term) ||
      g.members.some(m => m.courseId.toLowerCase().includes(term) || m.course.toLowerCase().includes(term) || m.year === term));
  }, [query]);

  function close() { setOpen(false); setQuery(''); }

  // Each multi-year course remembers the year that was last opened and pre-selects it.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_YEARS_KEY) ?? '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) setLastYears(saved);
    } catch { /* Storage is optional. */ }
  }, []);
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const c of courses) {
      try {
        const week = Number(localStorage.getItem(lastWeekKey(c.courseId)));
        if (Number.isInteger(week) && c.weeks.some(w => w.week === week)) next[c.courseId] = week;
      } catch { /* Storage is optional. */ }
    }
    setLastWeeks(next);
  }, []);
  useEffect(() => {
    const family = course.family;
    if (!family) return;
    setLastYears(prev => {
      if (prev[family] === course.slug) return prev;
      const next = { ...prev, [family]: course.slug };
      try { localStorage.setItem(LAST_YEARS_KEY, JSON.stringify(next)); } catch { /* Storage is optional. */ }
      return next;
    });
  }, [course.family, course.slug]);

  useEffect(() => {
    if (!open) { setExpanded(null); return; }
    // The subject that is currently open starts expanded, so its chosen year is visible.
    const current = subjectGroups.find(g => g.members.some(m => m.slug === course.slug));
    setExpanded(current && current.members.length > 1 ? current.label : null);
    search.current?.focus();
    // Arrow keys step through subjects; the year picker is reached with Tab or a click.
    const subjects = () => [...root.current!.querySelectorAll<HTMLElement>('.subject-link')];
    function onPointerDown(e: PointerEvent) { if (!root.current?.contains(e.target as Node)) close(); }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { close(); button.current?.focus(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const list = subjects();
      if (!list.length) return;
      const fromSearch = document.activeElement === search.current;
      const i = fromSearch ? (e.key === 'ArrowDown' ? -1 : list.length) : list.indexOf(document.activeElement as HTMLElement);
      list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length]?.focus();
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown); };
  }, [open]);

  return <div className="subject-switcher" ref={root} onBlur={e => { if (!root.current?.contains(e.relatedTarget)) close(); }}>
    <button ref={button} className="course" aria-expanded={open} aria-controls="subject-menu" onClick={() => open ? close() : setOpen(true)}>
      <span className="visually-hidden">Subject: </span>{course.course}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5M7 9l5-5 5 5" /></svg>
    </button>
    {open && <div id="subject-menu" className="subject-menu" role="group" aria-label="Choose subject">
      <div className="subject-search">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
        <input ref={search} type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search subjects" aria-label="Search subjects" autoComplete="off" spellCheck={false}
          onKeyDown={e => {
            if (e.key === 'Enter' && matches.length) {
              e.preventDefault();
              (root.current!.querySelector('.subject-link') as HTMLElement | null)?.click();
            }
          }} />
      </div>
      {matches.length ? <ul className="subject-list">{matches.map(group => {
        const active = group.members.find(m => m.slug === course.slug);
        const multiYear = group.members.length > 1;
        const isExpanded = multiYear && expanded === group.label;
        const remembered = group.members.find(m => m.slug === lastYears[group.label]);
        const defaultSlug = (remembered ?? latest(group)).slug;
        const first = group.members[0];
        const check = <svg className="subject-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
        return <li className={`subject-group ${isExpanded ? 'open' : ''}`} key={group.label}>
          {multiYear
            ? <button type="button" className="subject-link subject-toggle" aria-expanded={isExpanded} aria-controls={`years-${first.slug}`} onClick={() => setExpanded(label => label === group.label ? null : group.label)}>
              <span>{group.label}</span>
              <span className="subject-row-icons">
                {active && check}
                <svg className={`subject-chevron ${isExpanded ? 'open' : ''}`} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </span>
            </button>
            : <Link className="subject-link" href={openPath(first)} aria-current={active ? 'true' : undefined} onClick={e => { if (active) { e.preventDefault(); close(); } }}>
              <span>{group.label}</span>
              {active && check}
            </Link>}
          {isExpanded && <div className="subject-years" id={`years-${first.slug}`} role="group" aria-label={`Year for ${group.label}`}>{group.members.map(m => {
            const current = m.slug === course.slug;
            const isDefault = m.slug === defaultSlug;
            return <Link key={m.slug} className={`subject-year ${isDefault ? 'is-default' : ''}`} href={openPath(m)} aria-current={current ? 'true' : undefined}
              aria-label={`${group.label}, ${m.year}${isDefault ? ' (last opened)' : ''}`} title={isDefault ? 'Last opened' : undefined}
              onClick={e => { if (current) { e.preventDefault(); close(); } }}>{m.year}</Link>;
          })}</div>}
        </li>;
      })}</ul> : <p className="subject-empty" role="status">No subjects found.</p>}
    </div>}
  </div>;
}

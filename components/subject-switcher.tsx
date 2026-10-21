'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { courses, weekPath } from '@/lib/courses';
import type { Subject } from '@/lib/courses';

// The menu lists subjects alphabetically; its search box only exists while the menu is open.
const alphabetical = [...courses].sort((a, b) => a.course.localeCompare(b.course));

// Switching subjects remounts the course layout, which also closes the menu.
export default function SubjectSwitcher({ course }: { course: Subject }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return alphabetical;
    return alphabetical.filter(c => c.course.toLowerCase().includes(term) || c.courseId.toLowerCase().includes(term));
  }, [query]);

  function close() { setOpen(false); setQuery(''); }

  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const items = () => [...root.current!.querySelectorAll<HTMLElement>('.subject-menu a')];
    function onPointerDown(e: PointerEvent) { if (!root.current?.contains(e.target as Node)) close(); }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { close(); button.current?.focus(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const list = items();
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
              (root.current!.querySelector('.subject-menu a') as HTMLAnchorElement | null)?.click();
            }
          }} />
      </div>
      {matches.length ? <ul className="subject-list">{matches.map(c => {
        const current = c.slug === course.slug;
        return <li key={c.slug}>
          <Link href={weekPath(c, c.weeks[0].week)} aria-current={current ? 'true' : undefined} onClick={e => { if (current) { e.preventDefault(); close(); } }}>
            <span>{c.course}</span>
            {current && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
          </Link>
        </li>;
      })}</ul> : <p className="subject-empty" role="status">No subjects found.</p>}
    </div>}
  </div>;
}

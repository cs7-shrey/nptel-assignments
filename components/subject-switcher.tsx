'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { courses, weekPath } from '@/lib/courses';
import type { Subject } from '@/lib/courses';

// Switching subjects remounts the course layout, which also closes the menu.
export default function SubjectSwitcher({ course }: { course: Subject }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const items = () => [...root.current!.querySelectorAll<HTMLElement>('.subject-menu a')];
    items().find(a => a.getAttribute('aria-current'))?.focus();
    function onPointerDown(e: PointerEvent) { if (!root.current?.contains(e.target as Node)) setOpen(false); }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); button.current?.focus(); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const list = items(), i = list.indexOf(document.activeElement as HTMLElement);
        list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length]?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown); };
  }, [open]);

  return <div className="subject-switcher" ref={root} onBlur={e => { if (!root.current?.contains(e.relatedTarget)) setOpen(false); }}>
    <button ref={button} className="course" aria-expanded={open} aria-controls="subject-menu" onClick={() => setOpen(o => !o)}>
      <span className="visually-hidden">Subject: </span>{course.course}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5M7 9l5-5 5 5" /></svg>
    </button>
    {open && <ul id="subject-menu" className="subject-menu">{courses.map(c => {
      const current = c.slug === course.slug;
      return <li key={c.slug}>
        <Link href={weekPath(c, c.weeks[0].week)} aria-current={current ? 'true' : undefined} onClick={e => { if (current) { e.preventDefault(); setOpen(false); } }}>
          <span>{c.course}</span>
          {current && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
        </Link>
      </li>;
    })}</ul>}
  </div>;
}

'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// mathjs (and the panel) load only when the calculator is opened.
const Calculator = dynamic(() => import('./calculator'), { ssr: false });

export default function CalculatorLauncher() {
  const [open, setOpen] = useState(false);
  return <>
    <div className="calc-launcher">
      <button type="button" className="calc-toggle" aria-expanded={open} aria-controls="calculator" aria-label="Scientific calculator" title="Scientific calculator" onClick={() => setOpen(o => !o)}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="2.5" width="16" height="19" rx="2.5" /><path d="M8 6.5h8" />
          <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
        </svg>
      </button>
    </div>
    {open && <Calculator onClose={() => setOpen(false)} />}
  </>;
}

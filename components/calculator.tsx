'use client';
import { useEffect, useRef, useState } from 'react';
import { evaluate, format } from 'mathjs';

type Key = {
  label: string;
  token?: string;
  action?: 'clear' | 'back' | 'equals' | 'deg' | 'ans' | 'negate' | 'square' | 'inv';
  kind?: 'fn' | 'op' | 'eq' | 'clear' | 'mode';
};

const KEYS: Key[] = [
  { label: 'DEG', action: 'deg', kind: 'mode' },
  { label: 'sin', token: 'sin(', kind: 'fn' },
  { label: 'cos', token: 'cos(', kind: 'fn' },
  { label: 'tan', token: 'tan(', kind: 'fn' },
  { label: 'π', token: 'pi', kind: 'fn' },
  { label: 'asin', token: 'asin(', kind: 'fn' },
  { label: 'acos', token: 'acos(', kind: 'fn' },
  { label: 'atan', token: 'atan(', kind: 'fn' },
  { label: 'ln', token: 'log(', kind: 'fn' },
  { label: 'e', token: 'e', kind: 'fn' },
  { label: 'log', token: 'log10(', kind: 'fn' },
  { label: '√', token: 'sqrt(', kind: 'fn' },
  { label: 'x²', action: 'square', kind: 'fn' },
  { label: '^', token: '^', kind: 'op' },
  { label: '!', token: '!', kind: 'fn' },
  { label: '(', token: '(', kind: 'fn' },
  { label: ')', token: ')', kind: 'fn' },
  { label: '1/x', action: 'inv', kind: 'fn' },
  { label: '%', token: '/100', kind: 'fn' },
  { label: '÷', token: '/', kind: 'op' },
  { label: '7', token: '7' },
  { label: '8', token: '8' },
  { label: '9', token: '9' },
  { label: '×', token: '*', kind: 'op' },
  { label: '⌫', action: 'back', kind: 'clear' },
  { label: '4', token: '4' },
  { label: '5', token: '5' },
  { label: '6', token: '6' },
  { label: '−', token: '-', kind: 'op' },
  { label: 'C', action: 'clear', kind: 'clear' },
  { label: '1', token: '1' },
  { label: '2', token: '2' },
  { label: '3', token: '3' },
  { label: '+', token: '+', kind: 'op' },
  { label: '=', action: 'equals', kind: 'eq' },
  { label: '±', action: 'negate', kind: 'fn' },
  { label: '0', token: '0' },
  { label: '.', token: '.', kind: 'fn' },
  { label: 'Ans', action: 'ans', kind: 'fn' },
];

const pretty = (s: string) =>
  s.replace(/\*/g, '×').replace(/\//g, '÷').replace(/sqrt\(/g, '√(').replace(/log10\(/g, 'log(').replace(/pi/g, 'π');

export default function Calculator({ onClose }: { onClose: () => void }) {
  const [expr, setExpr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deg, setDeg] = useState(true);
  const [lastAns, setLastAns] = useState('');
  const [pos, setPos] = useState(() => ({
    x: Math.max(8, window.innerWidth - 338),
    y: window.matchMedia('(max-width: 760px)').matches ? 120 : 64,
  }));
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const scope = {
    sin: (x: number) => Math.sin(deg ? (x * Math.PI) / 180 : x),
    cos: (x: number) => Math.cos(deg ? (x * Math.PI) / 180 : x),
    tan: (x: number) => Math.tan(deg ? (x * Math.PI) / 180 : x),
    asin: (x: number) => (deg ? (Math.asin(x) * 180) / Math.PI : Math.asin(x)),
    acos: (x: number) => (deg ? (Math.acos(x) * 180) / Math.PI : Math.acos(x)),
    atan: (x: number) => (deg ? (Math.atan(x) * 180) / Math.PI : Math.atan(x)),
  };

  function insert(token: string) {
    setError(null);
    setExpr(prev => {
      // Insert an implicit × between a value and a following function/constant/parenthesis.
      const needsTimes = /[0-9)]$/.test(prev) && /^[a-z(]/i.test(token);
      return prev + (needsTimes ? '*' : '') + token;
    });
  }

  function calculate() {
    if (!expr.trim()) return;
    // Close any parentheses left open, so sin(30 evaluates without typing the final ).
    const depth = [...expr].reduce((d, ch) => d + (ch === '(' ? 1 : ch === ')' ? -1 : 0), 0);
    const closed = depth > 0 ? expr + ')'.repeat(depth) : expr;
    try {
      const value = evaluate(closed, scope);
      const text = typeof value === 'number'
        ? (Number.isFinite(value) ? format(value, { precision: 12 }) : 'Infinity')
        : format(value);
      setExpr(text);
      setLastAns(text);
      setError(null);
    } catch {
      setError('Invalid expression');
    }
  }

  function press(key: Key) {
    if (key.action) {
      switch (key.action) {
        case 'clear': setExpr(''); setError(null); return;
        case 'back': setExpr(e => e.slice(0, -1)); setError(null); return;
        case 'equals': calculate(); return;
        case 'deg': setDeg(d => !d); return;
        case 'ans': if (lastAns) insert(lastAns); return;
        case 'negate': setExpr(e => e.startsWith('-') ? e.slice(1) : '-' + e); setError(null); return;
        case 'square': insert('^2'); return;
        case 'inv': insert('^(-1)'); return;
      }
    }
    if (key.token) insert(key.token);
  }

  function clamp(x: number, y: number, rect: DOMRect) {
    return {
      x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - rect.width - 8)),
      y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - rect.height - 8)),
    };
  }

  function startDrag(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moveDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || !panel.current) return;
    setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy, panel.current.getBoundingClientRect()));
  }
  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  useEffect(() => {
    panel.current?.focus();
    function onResize() {
      if (panel.current) setPos(p => clamp(p.x, p.y, panel.current!.getBoundingClientRect()));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.target !== e.currentTarget) return;
    if (/^[0-9.]$/.test(e.key)) { insert(e.key); e.preventDefault(); return; }
    if (e.key.length === 1 && '+-*/^()!'.includes(e.key)) { insert(e.key); e.preventDefault(); return; }
    if (e.key === 'Enter' || e.key === '=') { calculate(); e.preventDefault(); }
    else if (e.key === 'Backspace') { setExpr(x => x.slice(0, -1)); setError(null); e.preventDefault(); }
  }

  return <div ref={panel} className="calculator" role="dialog" aria-label="Scientific calculator" tabIndex={-1}
    style={{ left: pos.x, top: pos.y }} onKeyDown={onKeyDown}>
    <div className="calc-head" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <svg className="calc-grip" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="9" cy="6" r="1.35" /><circle cx="15" cy="6" r="1.35" /><circle cx="9" cy="12" r="1.35" /><circle cx="15" cy="12" r="1.35" /><circle cx="9" cy="18" r="1.35" /><circle cx="15" cy="18" r="1.35" />
      </svg>
      <span className="calc-title">Scientific</span>
      <span className="calc-mode">{deg ? 'DEG' : 'RAD'}</span>
      <button type="button" className="calc-close" onClick={onClose} aria-label="Close calculator">×</button>
    </div>
    <div className="calc-display">
      <div className="calc-expr">{expr ? pretty(expr) : '0'}</div>
      {error && <p className="calc-error" role="status">{error}</p>}
    </div>
    <div className="calc-keys">{KEYS.map(key => {
      const label = key.action === 'deg' ? (deg ? 'DEG' : 'RAD') : key.label;
      return <button key={key.label} type="button" className={`calc-key ${key.kind ?? ''}`} onClick={() => press(key)}
        aria-pressed={key.action === 'deg' ? deg : undefined} aria-label={key.action === 'deg' ? `Switch to ${deg ? 'radians' : 'degrees'}` : key.label}>{label}</button>;
    })}</div>
  </div>;
}

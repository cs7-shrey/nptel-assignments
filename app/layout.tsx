import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import './globals.css';
export const metadata: Metadata = { title: { default: 'Recall', template: '%s · Recall' }, description: 'Practice course assignments and check your answers.' };
// Set the theme before first paint: saved choice, else the system setting.
const themeScript=`(function(){try{var t=localStorage.getItem("recall-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" data-theme="light" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}<Analytics /></body></html>; }

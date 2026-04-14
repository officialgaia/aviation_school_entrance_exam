import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store';
import CalendarPage from './pages/CalendarPage';
import PastExamPage from './pages/PastExamPage';
import TextbookPage from './pages/TextbookPage';
import ExpensePage from './pages/ExpensePage';
import type { Page } from './types';

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'white',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <img
        src="/logo.png"
        alt="航空大学校"
        style={{
          width: 190, height: 190,
          objectFit: 'contain',
          marginBottom: 24,
          filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.2))',
        }}
        onError={e => {
          const img = e.target as HTMLImageElement;
          img.src = '/logo.svg';
          img.onerror = () => { img.style.display = 'none'; };
        }}
      />
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1E40AF' }}>航空大学校</div>
      <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>入試管理アプリ 2026</div>
    </div>
  );
}

// Navigation icons as SVG
const CalendarIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="3" stroke={active ? '#1E40AF' : '#9CA3AF'} strokeWidth="2"/>
    <path d="M3 9h18" stroke={active ? '#1E40AF' : '#9CA3AF'} strokeWidth="2"/>
    <path d="M8 2v4M16 2v4" stroke={active ? '#1E40AF' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
    <rect x="7" y="13" width="3" height="3" rx="0.5" fill={active ? '#1E40AF' : '#9CA3AF'}/>
    <rect x="11" y="13" width="3" height="3" rx="0.5" fill={active ? '#1E40AF' : '#9CA3AF'}/>
  </svg>
);

const ExamIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={active ? '#1E40AF' : '#9CA3AF'} strokeWidth="2"/>
    <path d="M14 2v6h6" stroke={active ? '#1E40AF' : '#9CA3AF'} strokeWidth="2"/>
    <path d="M8 13h8M8 17h5" stroke={active ? '#1E40AF' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BookIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={active ? '#1E40AF' : '#9CA3AF'} strokeWidth="2"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={active ? '#1E40AF' : '#9CA3AF'} strokeWidth="2"/>
    <path d="M9 7h7M9 11h5" stroke={active ? '#1E40AF' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MoneyIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={active ? '#1E40AF' : '#9CA3AF'} strokeWidth="2"/>
    <path d="M12 6v12M9 8.5c0-1.1.9-2 2-2h2a2 2 0 010 4h-2a2 2 0 000 4h2a2 2 0 002-2" stroke={active ? '#1E40AF' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function BottomNav({ active, onChange }: { active: Page; onChange: (p: Page) => void }) {
  const tabs: { id: Page; label: string; icon: (a: boolean) => JSX.Element }[] = [
    { id: 'calendar', label: 'カレンダー', icon: (a) => <CalendarIcon active={a} /> },
    { id: 'pastExam', label: '過去問', icon: (a) => <ExamIcon active={a} /> },
    { id: 'textbook', label: '参考書', icon: (a) => <BookIcon active={a} /> },
    { id: 'expense', label: '費用', icon: (a) => <MoneyIcon active={a} /> },
  ];
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, background: 'white',
      borderTop: '1px solid #E5E7EB', display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 50,
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '10px 0', gap: 3,
            color: active === tab.id ? '#1E40AF' : '#9CA3AF',
            fontSize: 10, fontWeight: active === tab.id ? 700 : 400,
          }}
        >
          {tab.icon(active === tab.id)}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function MainApp() {
  const { activePage, setActivePage } = useApp();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activePage === 'calendar' && <CalendarPage />}
        {activePage === 'pastExam' && <PastExamPage />}
        {activePage === 'textbook' && <TextbookPage />}
        {activePage === 'expense' && <ExpensePage />}
      </div>
      <BottomNav active={activePage} onChange={(p) => setActivePage(p)} />
    </div>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <AppProvider>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <MainApp />
    </AppProvider>
  );
}

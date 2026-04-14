import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const YEARS = Array.from({ length: 20 }, (_, i) => 2006 + i);

export default function PastExamPage() {
  const { data, updatePastExam, navTarget, clearNavTarget } = useApp();
  const [editYear, setEditYear] = useState<number | null>(null);
  const [score2Input, setScore2Input] = useState('');
  const [englishInput, setEnglishInput] = useState('');
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (navTarget?.page === 'pastExam' && navTarget.year) {
      const el = rowRefs.current[navTarget.year];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.outline = '2px solid #5B21B6';
        setTimeout(() => { if (el) el.style.outline = ''; }, 1500);
      }
      clearNavTarget();
    }
  }, [navTarget]);

  const openEdit = (year: number) => {
    const exam = data.pastExams[year];
    setEditYear(year);
    setScore2Input(exam?.score2 != null ? String(exam.score2) : '');
    setEnglishInput(exam?.english != null ? String(exam.english) : '');
  };

  const saveEdit = () => {
    if (editYear == null) return;
    const score2 = score2Input !== '' ? parseFloat(score2Input) : null;
    const english = englishInput !== '' ? parseFloat(englishInput) : null;
    updatePastExam(editYear, score2, english);
    setEditYear(null);
  };

  const doneYears = YEARS.filter(y => data.pastExams[y]?.score2 != null && data.pastExams[y]?.english != null);
  const notDoneYears = YEARS.filter(y => !(data.pastExams[y]?.score2 != null && data.pastExams[y]?.english != null));

  const pieData = [
    { name: '両方記載済み', value: doneYears.length, color: '#6EE7B7' },
    { name: '未記載', value: notDoneYears.length, color: '#FCA5A5' },
  ].filter(d => d.value > 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ padding: '20px 16px 12px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#1a1a2e' }}>過去問</h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>2006〜2025年度</p>
      </div>

      {/* Pie chart */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 8, alignSelf: 'flex-start' }}>
          進捗状況
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PieChart width={140} height={140}>
            <Pie data={pieData.length > 0 ? pieData : [{ name: '−', value: 1, color: '#E5E7EB' }]}
              cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" startAngle={90} endAngle={-270}>
              {(pieData.length > 0 ? pieData : [{ color: '#E5E7EB' }]).map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(v) => `${v}年`} />
          </PieChart>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{doneYears.length}<span style={{ fontSize: 14 }}>年</span></div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>完了 / {YEARS.length}年</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#059669' }}>
              ■ 記載済: {doneYears.length}年 ({Math.round(doneYears.length / YEARS.length * 100)}%)
            </div>
            <div style={{ fontSize: 12, color: '#DC2626' }}>
              ■ 未記載: {notDoneYears.length}年 ({Math.round(notDoneYears.length / YEARS.length * 100)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 10px', fontSize: 15, fontWeight: 700, color: '#374151' }}>得点一覧</div>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 60px', background: '#F9FAFB', padding: '8px 16px', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>年度</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>総合2</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>英語</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}></span>
        </div>
        {YEARS.map(year => {
          const exam = data.pastExams[year];
          const bothFilled = exam?.score2 != null && exam?.english != null;
          return (
            <div
              key={year}
              ref={el => { rowRefs.current[year] = el; }}
              style={{
                display: 'grid', gridTemplateColumns: '60px 1fr 1fr 60px',
                padding: '10px 16px', borderBottom: '1px solid #F3F4F6',
                background: bothFilled ? '#F0FDF4' : 'white',
                transition: 'outline 0.3s',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center' }}>
                {year}
              </span>
              <span style={{ fontSize: 14, color: exam?.score2 != null ? '#374151' : '#9CA3AF', display: 'flex', alignItems: 'center', fontWeight: exam?.score2 != null ? 600 : 400 }}>
                {exam?.score2 != null ? `${exam.score2}点` : '−'}
              </span>
              <span style={{ fontSize: 14, color: exam?.english != null ? '#374151' : '#9CA3AF', display: 'flex', alignItems: 'center', fontWeight: exam?.english != null ? 600 : 400 }}>
                {exam?.english != null ? `${exam.english}点` : '−'}
              </span>
              <button
                onClick={() => openEdit(year)}
                style={{
                  fontSize: 12, background: '#EFF6FF', color: '#1D4ED8',
                  padding: '4px 8px', borderRadius: 8, fontWeight: 600,
                }}
              >編集</button>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editYear != null && (
        <div className="modal-overlay" onClick={() => setEditYear(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontSize: 20, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>{editYear}年度の得点入力</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>総合2</label>
              <input
                type="number"
                value={score2Input}
                onChange={e => setScore2Input(e.target.value)}
                placeholder="例: 285"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 16 }}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>英語</label>
              <input
                type="number"
                value={englishInput}
                onChange={e => setEnglishInput(e.target.value)}
                placeholder="例: 95"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 16 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setEditYear(null)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 15, color: '#374151' }}
              >キャンセル</button>
              <button
                onClick={saveEdit}
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#1E40AF', color: 'white', fontSize: 15, fontWeight: 700 }}
              >保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

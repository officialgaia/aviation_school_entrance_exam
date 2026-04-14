import { useState, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { Subject, Unit } from '../types';

const SUBJECT_COLORS: Record<Subject, { bg: string; text: string; border: string; headerBg: string; light: string }> = {
  math:    { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD', headerBg: '#1D4ED8', light: '#EFF6FF' },
  physics: { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74', headerBg: '#EA580C', light: '#FFF7ED' },
  english: { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047', headerBg: '#CA8A04', light: '#FEFCE8' },
  geology: { bg: '#F3E8FF', text: '#7C3AED', border: '#DDD6FE', headerBg: '#7C3AED', light: '#FAF5FF' },
};
const SUBJECT_LABEL: Record<Subject, string> = { math: '数学', physics: '物理', english: '英語', geology: '地学' };
const SUBJECT_ORDER: Subject[] = ['math', 'physics', 'english', 'geology'];

function generateId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export default function TextbookPage() {
  const { data, updateUnitStatus, addTextbook, deleteTextbook, addUnit, updateUnit, deleteUnit, navTarget, clearNavTarget } = useApp();
  const [showAddTextbook, setShowAddTextbook] = useState(false);
  const [editingUnit, setEditingUnit] = useState<{ textbookId: string; unit: Unit } | null>(null);
  const [addingUnit, setAddingUnit] = useState<string | null>(null);
  const [newUnitName, setNewUnitName] = useState('');
  const [newTextbook, setNewTextbook] = useState({ name: '', subject: 'math' as Subject });
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (navTarget?.page === 'textbook') {
      const key = navTarget.textbookId || `subject-${navTarget.subject}`;
      const el = sectionRefs.current[key];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.style.outline = '2px solid #1D4ED8';
        setTimeout(() => { if (el) el.style.outline = ''; }, 1500);
      }
      clearNavTarget();
    }
  }, [navTarget]);

  const bySubject: Record<Subject, typeof data.textbooks> = { math: [], physics: [], english: [], geology: [] };
  data.textbooks.forEach(tb => bySubject[tb.subject].push(tb));

  const allUnits = data.textbooks.flatMap(tb => tb.units);
  const doneCount = allUnits.filter(u => data.unitStatuses[u.id] === 'circle').length;
  const crossCount = allUnits.filter(u => data.unitStatuses[u.id] === 'cross').length;
  const notDoneCount = allUnits.length - doneCount - crossCount;

  const pieData = [
    { name: '達成', value: doneCount, color: '#4ADE80' },
    { name: '未達成', value: crossCount, color: '#F87171' },
    { name: '未着手', value: notDoneCount, color: '#E5E7EB' },
  ].filter(d => d.value > 0);

  const cycleStatus = (unitId: string) => {
    const cur = data.unitStatuses[unitId] || 'none';
    const next: Record<string, 'none' | 'circle' | 'cross'> = { none: 'circle', circle: 'cross', cross: 'none' };
    updateUnitStatus(unitId, next[cur]);
  };

  const handleAddUnit = (textbookId: string) => {
    if (!newUnitName.trim()) return;
    addUnit(textbookId, { id: generateId(), name: newUnitName.trim() });
    setNewUnitName('');
    setAddingUnit(null);
  };

  const handleAddTextbook = () => {
    if (!newTextbook.name.trim()) return;
    addTextbook({ id: generateId(), name: newTextbook.name.trim(), subject: newTextbook.subject, units: [] });
    setNewTextbook({ name: '', subject: 'math' });
    setShowAddTextbook(false);
  };

  const pct = allUnits.length > 0 ? Math.round(doneCount / allUnits.length * 100) : 0;

  return (
    <div className="page-container" style={{ background: '#F0F4F8' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#1a1a2e' }}>参考書</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>単元の学習状況</p>
        </div>
        <button onClick={() => setShowAddTextbook(true)}
          style={{ background: '#1E40AF', color: 'white', padding: '9px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, boxShadow: '0 2px 8px rgba(30,64,175,0.3)' }}>
          + 参考書
        </button>
      </div>

      {/* Overall progress card */}
      <div style={{ margin: '0 16px 16px', background: 'white', borderRadius: 20, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <PieChart width={110} height={110}>
          <Pie data={pieData.length > 0 ? pieData : [{ name: '−', value: 1, color: '#E5E7EB' }]}
            cx={52} cy={52} innerRadius={30} outerRadius={52} dataKey="value" startAngle={90} endAngle={-270}>
            {(pieData.length > 0 ? pieData : [{ color: '#E5E7EB' }]).map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
        </PieChart>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#059669', lineHeight: 1 }}>
            {pct}<span style={{ fontSize: 16 }}>%</span>
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>達成率 ({doneCount}/{allUnits.length}単元)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#4ADE80' }} />
              <span style={{ fontSize: 11, color: '#059669' }}>達成: {doneCount}単元</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#F87171' }} />
              <span style={{ fontSize: 11, color: '#DC2626' }}>未達成: {crossCount}単元</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#E5E7EB' }} />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>未着手: {notDoneCount}単元</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject sections */}
      {SUBJECT_ORDER.map(subject => {
        const textbooks = bySubject[subject];
        if (textbooks.length === 0) return null;
        const col = SUBJECT_COLORS[subject];
        const subjectUnits = textbooks.flatMap(tb => tb.units);
        const subjectDone = subjectUnits.filter(u => data.unitStatuses[u.id] === 'circle').length;
        const subjectCross = subjectUnits.filter(u => data.unitStatuses[u.id] === 'cross').length;
        const subjectPct = subjectUnits.length > 0 ? Math.round(subjectDone / subjectUnits.length * 100) : 0;

        return (
          <div key={subject} ref={el => { sectionRefs.current[`subject-${subject}`] = el; }} style={{ marginBottom: 8 }}>
            {/* Subject banner */}
            <div style={{
              margin: '0 16px',
              background: col.headerBg,
              borderRadius: '16px 16px 0 0',
              padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>{SUBJECT_LABEL[subject]}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginLeft: 10 }}>{subjectDone}/{subjectUnits.length} 単元達成</span>
              </div>
              {/* Mini progress bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${subjectPct}%`, height: '100%', background: 'white', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>{subjectPct}%</span>
              </div>
            </div>

            {/* Textbooks in this subject */}
            {textbooks.map((tb, tbIdx) => {
              const tbDone = tb.units.filter(u => data.unitStatuses[u.id] === 'circle').length;
              const isLast = tbIdx === textbooks.length - 1;
              return (
                <div
                  key={tb.id}
                  ref={el => { sectionRefs.current[tb.id] = el; }}
                  style={{
                    margin: '0 16px',
                    background: col.light,
                    borderRadius: isLast ? '0 0 16px 16px' : '0',
                    borderLeft: `3px solid ${col.border}`,
                    borderRight: `1px solid ${col.border}`,
                    borderBottom: `1px solid ${col.border}`,
                    overflow: 'hidden',
                    marginBottom: isLast ? 16 : 0,
                  }}
                >
                  {/* Textbook header row */}
                  <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: col.bg, borderBottom: `1px solid ${col.border}` }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: col.text }}>{tb.name}</span>
                      <span style={{ fontSize: 11, color: col.text, opacity: 0.7, marginLeft: 8 }}>{tbDone}/{tb.units.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => { setAddingUnit(tb.id); setNewUnitName(''); }}
                        style={{ fontSize: 11, background: 'white', color: col.text, padding: '4px 10px', borderRadius: 8, fontWeight: 700, border: `1px solid ${col.border}` }}>
                        + 単元
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`「${tb.name}」を削除しますか?`)) deleteTextbook(tb.id); }}
                        style={{ fontSize: 14, color: col.text, opacity: 0.5, padding: '4px 6px' }}>🗑</button>
                    </div>
                  </div>

                  {/* Add unit input */}
                  {addingUnit === tb.id && (
                    <div style={{ padding: '8px 14px', display: 'flex', gap: 8, borderBottom: `1px solid ${col.border}` }}>
                      <input type="text" value={newUnitName}
                        onChange={e => setNewUnitName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddUnit(tb.id)}
                        placeholder="単元名を入力"
                        autoFocus
                        style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: `1px solid ${col.border}`, fontSize: 14, background: 'white' }}
                      />
                      <button onClick={() => handleAddUnit(tb.id)}
                        style={{ background: col.headerBg, color: 'white', padding: '7px 12px', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>追加</button>
                      <button onClick={() => setAddingUnit(null)} style={{ color: '#9CA3AF', fontSize: 20 }}>✕</button>
                    </div>
                  )}

                  {/* Units table */}
                  {tb.units.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '16px 0' }}>単元がありません</p>
                  ) : tb.units.map((unit, idx) => {
                    const status = data.unitStatuses[unit.id] || 'none';
                    const isEditing = editingUnit?.unit.id === unit.id;
                    const rowBg = status === 'circle' ? '#F0FDF4' : status === 'cross' ? '#FFF5F5' : idx % 2 === 0 ? 'white' : col.light;
                    return (
                      <div key={unit.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 14px',
                        background: rowBg,
                        borderBottom: idx < tb.units.length - 1 ? `1px solid ${col.border}` : 'none',
                      }}>
                        <span style={{ fontSize: 11, color: col.text, opacity: 0.5, minWidth: 18, fontWeight: 600 }}>{idx + 1}</span>
                        {isEditing ? (
                          <input type="text" defaultValue={unit.name} autoFocus
                            onBlur={e => { updateUnit(tb.id, { ...unit, name: e.target.value.trim() || unit.name }); setEditingUnit(null); }}
                            onKeyDown={e => { if (e.key === 'Enter') { updateUnit(tb.id, { ...unit, name: e.currentTarget.value.trim() || unit.name }); setEditingUnit(null); } if (e.key === 'Escape') setEditingUnit(null); }}
                            style={{ flex: 1, fontSize: 14, padding: '4px 8px', borderRadius: 6, border: `1px solid ${col.border}` }}
                          />
                        ) : (
                          <span onDoubleClick={() => setEditingUnit({ textbookId: tb.id, unit })}
                            style={{ flex: 1, fontSize: 14, color: '#1a1a2e', lineHeight: 1.3 }}>
                            {unit.name}
                          </span>
                        )}
                        <button onClick={() => cycleStatus(unit.id)} style={{
                          fontSize: 18, fontWeight: 800, minWidth: 28, textAlign: 'center',
                          color: status === 'circle' ? '#059669' : status === 'cross' ? '#DC2626' : '#D1D5DB',
                        }}>
                          {status === 'circle' ? '○' : status === 'cross' ? '×' : '−'}
                        </button>
                        <button onClick={() => deleteUnit(tb.id, unit.id)} style={{ fontSize: 14, color: '#D1D5DB', padding: '2px 4px' }}>🗑</button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Add textbook modal */}
      {showAddTextbook && (
        <div className="modal-overlay" onClick={() => setShowAddTextbook(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontSize: 20, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>参考書を追加</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>参考書名</label>
              <input type="text" value={newTextbook.name}
                onChange={e => setNewTextbook(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例: チャート式数学"
                autoFocus
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 16 }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>教科</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {SUBJECT_ORDER.map(s => {
                  const col = SUBJECT_COLORS[s];
                  const selected = newTextbook.subject === s;
                  return (
                    <button key={s} onClick={() => setNewTextbook(prev => ({ ...prev, subject: s }))} style={{
                      flex: 1, padding: '12px', borderRadius: 12, fontWeight: 700, fontSize: 14,
                      background: selected ? col.headerBg : '#F9FAFB',
                      color: selected ? 'white' : '#9CA3AF',
                      border: `2px solid ${selected ? col.headerBg : '#E5E7EB'}`,
                    }}>{SUBJECT_LABEL[s]}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowAddTextbook(false)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 15, color: '#374151' }}>キャンセル</button>
              <button onClick={handleAddTextbook}
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#1E40AF', color: 'white', fontSize: 15, fontWeight: 700 }}>追加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

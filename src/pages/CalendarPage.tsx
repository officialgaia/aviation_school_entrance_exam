import { useState, useEffect } from 'react';
import { useApp } from '../store';
import type { Subject, UnitStatus, StudyPeriod } from '../types';

const SUBJECT_COLORS: Record<Subject, { bg: string; text: string; border: string }> = {
  math:    { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
  physics: { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74' },
  english: { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' },
};
const SUBJECT_LABEL: Record<Subject, string> = { math: '数', physics: '物', english: '英' };
const SUBJECT_FULL: Record<Subject, string> = { math: '数学', physics: '物理', english: '英語' };
const MONTHS = ['4月', '5月', '6月', '7月'];
const MONTH_INDICES = [3, 4, 5, 6];

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfWeek(year: number, month: number) { return new Date(year, month, 1).getDay(); }
function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function isInRange(year: number, month: number, day: number) {
  const d = new Date(year, month, day);
  return d >= new Date(2026, 3, 12) && d <= new Date(2026, 6, 12);
}
function todayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}
function isPastOrToday(date: string) { return date <= todayStr(); }

function calcDuration(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

function formatPeriod(p: StudyPeriod) { return `${p.start}〜${p.end}`; }

// ── Unit detail popup ────────────────────────────────────────────────────────
function UnitChipPopup({
  unitId, textbookId, subject, unitName, date, onClose,
}: { unitId: string; textbookId: string; subject: Subject; unitName: string; date: string; onClose: () => void }) {
  const { data, updateUnitStatus, updateStudyPeriod, removeUnitFromDay, navigateTo, getDaySchedule } = useApp();
  const status = data.unitStatuses[unitId] || 'none';
  const col = SUBJECT_COLORS[subject];
  const sched = getDaySchedule(date);
  const period = sched.studyPeriods?.[subject] ?? null;
  const [startTime, setStartTime] = useState(period?.start ?? '');
  const [endTime, setEndTime] = useState(period?.end ?? '');

  const handleTimeBlur = () => {
    if (startTime && endTime) {
      updateStudyPeriod(date, subject, { start: startTime, end: endTime });
    } else if (!startTime && !endTime) {
      updateStudyPeriod(date, subject, null);
    }
  };

  const duration = startTime && endTime ? calcDuration(startTime, endTime) : null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 20, padding: 20,
        width: 'calc(100% - 48px)', maxWidth: 340,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ background: col.bg, color: col.text, padding: '3px 10px', borderRadius: 8, fontWeight: 700, fontSize: 13, border: `1px solid ${col.border}` }}>
            {SUBJECT_FULL[subject]}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', flex: 1 }}>{unitName}</span>
          <button onClick={onClose} style={{ color: '#9CA3AF', fontSize: 18 }}>✕</button>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>達成状況</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['none', 'circle', 'cross'] as UnitStatus[]).map(s => (
              <button key={s} onClick={() => updateUnitStatus(unitId, s)} style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 20, fontWeight: 800,
                background: status === s ? (s === 'circle' ? '#D1FAE5' : s === 'cross' ? '#FEE2E2' : '#F3F4F6') : '#F9FAFB',
                color: s === 'circle' ? '#059669' : s === 'cross' ? '#DC2626' : '#9CA3AF',
                border: status === s ? `2px solid ${s === 'circle' ? '#6EE7B7' : s === 'cross' ? '#FCA5A5' : '#D1D5DB'}` : '2px solid transparent',
              }}>
                {s === 'circle' ? '○' : s === 'cross' ? '×' : '−'}
              </button>
            ))}
          </div>
        </div>

        {/* Study time HH:MM - HH:MM */}
        <div style={{ marginBottom: 16, background: '#F9FAFB', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
            ⏱ {SUBJECT_FULL[subject]}の勉強時間
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="time" value={startTime}
              onChange={e => setStartTime(e.target.value)}
              onBlur={handleTimeBlur}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${col.border}`, fontSize: 14, background: 'white' }}
            />
            <span style={{ color: '#6B7280', fontWeight: 600 }}>〜</span>
            <input type="time" value={endTime}
              onChange={e => setEndTime(e.target.value)}
              onBlur={handleTimeBlur}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${col.border}`, fontSize: 14, background: 'white' }}
            />
          </div>
          {duration !== null && duration > 0 && (
            <div style={{ fontSize: 12, color: col.text, marginTop: 6, textAlign: 'right', fontWeight: 600 }}>
              {Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)}時間` : ''}{duration % 60}分
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { removeUnitFromDay(date, unitId); onClose(); }}
            style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#FEE2E2', color: '#DC2626', fontWeight: 600, fontSize: 13 }}
          >この日から削除</button>
          <button
            onClick={() => { navigateTo({ page: 'textbook', subject, textbookId }); onClose(); }}
            style={{ flex: 1, padding: '10px', borderRadius: 12, background: col.bg, color: col.text, fontWeight: 700, fontSize: 13, border: `1px solid ${col.border}` }}
          >参考書ページへ →</button>
        </div>
      </div>
    </div>
  );
}

// ── Exam chip popup ───────────────────────────────────────────────────────────
function ExamChipPopup({ year, date, onClose }: { year: number; date: string; onClose: () => void }) {
  const { data, removeExamFromDay, navigateTo } = useApp();
  const exam = data.pastExams[year];
  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 20, padding: 20,
        width: 'calc(100% - 48px)', maxWidth: 300,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#5B21B6' }}>{year}年度</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>過去問</div>
          </div>
          <button onClick={onClose} style={{ color: '#9CA3AF', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ background: '#F5F3FF', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#7C3AED', marginBottom: 2 }}>得点</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: exam?.score != null ? '#5B21B6' : '#9CA3AF' }}>
            {exam?.score != null ? `${exam.score}点` : '未記録'}
          </div>
          {exam?.predictedPassingScore != null && (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>予想合格点: {exam.predictedPassingScore}点</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { removeExamFromDay(date, year); onClose(); }}
            style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#FEE2E2', color: '#DC2626', fontWeight: 600, fontSize: 13 }}
          >この日から削除</button>
          <button
            onClick={() => { navigateTo({ page: 'pastExam', year }); onClose(); }}
            style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#EDE9FE', color: '#5B21B6', fontWeight: 700, fontSize: 13, border: '1px solid #C4B5FD' }}
          >過去問ページへ →</button>
        </div>
      </div>
    </div>
  );
}

// ── Day detail popup (all subjects) ─────────────────────────────────────────
function DayPopup({ date, onClose }: { date: string; onClose: () => void }) {
  const { data, getDaySchedule, addUnitToDay, removeUnitFromDay, addExamToDay, removeExamFromDay, updateStudyPeriod, updateUnitStatus, navigateTo } = useApp();
  const sched = getDaySchedule(date);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [examInput, setExamInput] = useState('');
  const [timeInputs, setTimeInputs] = useState<Partial<Record<Subject, { start: string; end: string }>>>({});

  const parts = date.split('-');
  const d = parseInt(parts[2]), m = parseInt(parts[1]) - 1, y = parseInt(parts[0]);
  const dow = ['日', '月', '火', '水', '木', '金', '土'];
  const dayOfWeek = new Date(y, m, d).getDay();

  useEffect(() => {
    const inputs: Partial<Record<Subject, { start: string; end: string }>> = {};
    (['math', 'physics', 'english'] as Subject[]).forEach(s => {
      const p = sched.studyPeriods?.[s];
      inputs[s] = { start: p?.start ?? '', end: p?.end ?? '' };
    });
    setTimeInputs(inputs);
  }, [date]);

  const handleTimeBlur = (subject: Subject) => {
    const t = timeInputs[subject];
    if (t?.start && t?.end) updateStudyPeriod(date, subject, { start: t.start, end: t.end });
    else if (!t?.start && !t?.end) updateStudyPeriod(date, subject, null);
  };

  const cycleStatus = (unitId: string) => {
    const cur = data.unitStatuses[unitId] || 'none';
    const next: Record<UnitStatus, UnitStatus> = { none: 'circle', circle: 'cross', cross: 'none' };
    updateUnitStatus(unitId, next[cur]);
  };

  const statusIcon = (uid: string) => { const s = data.unitStatuses[uid] || 'none'; return s === 'circle' ? '○' : s === 'cross' ? '×' : '−'; };
  const statusColor = (uid: string) => { const s = data.unitStatuses[uid] || 'none'; return s === 'circle' ? '#059669' : s === 'cross' ? '#DC2626' : '#9CA3AF'; };
  const statusBg = (uid: string) => { const s = data.unitStatuses[uid] || 'none'; return s === 'circle' ? '#D1FAE5' : s === 'cross' ? '#FEE2E2' : '#F9FAFB'; };

  const allUnits = data.textbooks.flatMap(tb => tb.units.map(u => ({ ...u, textbookId: tb.id, textbookName: tb.name, subject: tb.subject })));
  const scheduledUnits = sched.unitIds.map(id => allUnits.find(u => u.id === id)).filter(Boolean) as typeof allUnits;
  const availableUnits = allUnits.filter(u => !sched.unitIds.includes(u.id));

  // Group scheduled units by subject
  const subjectsWithUnits = (['math', 'physics', 'english'] as Subject[]).filter(
    s => scheduledUnits.some(u => u.subject === s)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800 }}>{d}</span>
            <span style={{ fontSize: 16, color: '#6B7280', marginLeft: 6 }}>({dow[dayOfWeek]}) {MONTHS[m - 3]}</span>
          </div>
          <button onClick={onClose} style={{ fontSize: 22, color: '#9CA3AF', padding: 4 }}>✕</button>
        </div>

        {/* Units grouped by subject */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>📚 参考書・単元</span>
            <button onClick={() => setShowAddUnit(!showAddUnit)}
              style={{ fontSize: 12, background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: 12, fontWeight: 600 }}>
              + 追加
            </button>
          </div>

          {showAddUnit && (
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 10, marginBottom: 8 }}>
              {availableUnits.length === 0
                ? <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>追加できる単元がありません</p>
                : availableUnits.map(u => {
                  const col = SUBJECT_COLORS[u.subject];
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <span style={{ fontSize: 11, background: col.bg, color: col.text, padding: '2px 6px', borderRadius: 6, fontWeight: 700, border: `1px solid ${col.border}` }}>
                        {SUBJECT_LABEL[u.subject]}
                      </span>
                      <span style={{ fontSize: 13, flex: 1 }}>{u.name}</span>
                      <button onClick={() => addUnitToDay(date, u.id)} style={{ fontSize: 14, color: '#1D4ED8', fontWeight: 700 }}>+</button>
                    </div>
                  );
                })
              }
            </div>
          )}

          {subjectsWithUnits.map(subject => {
            const col = SUBJECT_COLORS[subject];
            const units = scheduledUnits.filter(u => u.subject === subject);
            const timePeriod = sched.studyPeriods?.[subject];
            const t = timeInputs[subject];
            const dur = t?.start && t?.end ? calcDuration(t.start, t.end) : null;
            return (
              <div key={subject} style={{ marginBottom: 10, border: `1px solid ${col.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {/* Subject header */}
                <div style={{ background: col.bg, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: col.text, fontSize: 13 }}>{SUBJECT_FULL[subject]}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                    <input type="time" value={t?.start ?? ''}
                      onChange={e => setTimeInputs(prev => ({ ...prev, [subject]: { ...prev[subject], start: e.target.value } as any }))}
                      onBlur={() => handleTimeBlur(subject)}
                      style={{ fontSize: 12, padding: '3px 6px', borderRadius: 6, border: `1px solid ${col.border}`, background: 'white', width: 80 }}
                    />
                    <span style={{ fontSize: 11, color: col.text }}>〜</span>
                    <input type="time" value={t?.end ?? ''}
                      onChange={e => setTimeInputs(prev => ({ ...prev, [subject]: { ...prev[subject], end: e.target.value } as any }))}
                      onBlur={() => handleTimeBlur(subject)}
                      style={{ fontSize: 12, padding: '3px 6px', borderRadius: 6, border: `1px solid ${col.border}`, background: 'white', width: 80 }}
                    />
                    {dur !== null && dur > 0 && (
                      <span style={{ fontSize: 11, color: col.text, fontWeight: 600 }}>
                        {Math.floor(dur/60) > 0 ? `${Math.floor(dur/60)}h` : ''}{dur % 60}m
                      </span>
                    )}
                  </div>
                </div>
                {/* Units */}
                {units.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    background: statusBg(u.id), borderTop: `1px solid ${col.border}`,
                  }}>
                    <button onClick={() => navigateTo({ page: 'textbook', subject, textbookId: u.textbookId })}
                      style={{ fontSize: 13, flex: 1, textAlign: 'left', color: '#1a1a2e' }}>
                      {u.name}
                    </button>
                    <button onClick={() => cycleStatus(u.id)}
                      style={{ fontSize: 18, fontWeight: 700, color: statusColor(u.id), minWidth: 28, textAlign: 'center' }}>
                      {statusIcon(u.id)}
                    </button>
                    <button onClick={() => removeUnitFromDay(date, u.id)} style={{ fontSize: 14, color: '#D1D5DB' }}>✕</button>
                  </div>
                ))}
              </div>
            );
          })}

          {scheduledUnits.length === 0 && !showAddUnit && (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '8px 0' }}>参考書が登録されていません</p>
          )}
        </div>

        {/* Past exams */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>📝 過去問</span>
            <button onClick={() => setShowAddExam(!showAddExam)}
              style={{ fontSize: 12, background: '#F5F3FF', color: '#5B21B6', padding: '4px 10px', borderRadius: 12, fontWeight: 600 }}>+ 追加</button>
          </div>
          {showAddExam && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="number" min="2006" max="2025" value={examInput}
                onChange={e => setExamInput(e.target.value)}
                placeholder="年度 (2006〜2025)"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13 }}
              />
              <button onClick={() => { const yr = parseInt(examInput); if (yr >= 2006 && yr <= 2025) { addExamToDay(date, yr); setExamInput(''); } }}
                style={{ background: '#5B21B6', color: 'white', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>追加</button>
            </div>
          )}
          {sched.examYears.map(year => (
            <div key={year} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, marginBottom: 6, background: '#F5F3FF', border: '1px solid #C4B5FD' }}>
              <button onClick={() => navigateTo({ page: 'pastExam', year })}
                style={{ flex: 1, textAlign: 'left', fontSize: 14, color: '#5B21B6', fontWeight: 600 }}>
                {year}年度
              </button>
              <button onClick={() => removeExamFromDay(date, year)} style={{ fontSize: 14, color: '#D1D5DB' }}>✕</button>
            </div>
          ))}
          {sched.examYears.length === 0 && !showAddExam && (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '8px 0' }}>過去問が登録されていません</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Calendar Page ───────────────────────────────────────────────────────
export default function CalendarPage() {
  const { data, getDaySchedule } = useApp();
  const [monthIdx, setMonthIdx] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  type UnitPopupState = { type: 'unit'; unitId: string; textbookId: string; subject: Subject; unitName: string; date: string };
  type ExamPopupState = { type: 'exam'; year: number; date: string };
  const [chipPopup, setChipPopup] = useState<UnitPopupState | ExamPopupState | null>(null);

  const YEAR = 2026;
  const month = MONTH_INDICES[monthIdx];
  const daysInMonth = getDaysInMonth(YEAR, month);
  const firstDow = getFirstDayOfWeek(YEAR, month);
  const today = todayStr();

  const allUnits = data.textbooks.flatMap(tb => tb.units.map(u => ({ ...u, textbookId: tb.id, subject: tb.subject })));

  const getDayBg = (date: string): string => {
    const s = getDaySchedule(date);
    if (s.unitIds.length === 0) return 'white';
    const statuses = s.unitIds.map(id => data.unitStatuses[id] || 'none');
    if (statuses.every(st => st === 'circle')) return '#DCFCE7';
    if (statuses.some(st => st === 'cross') && isPastOrToday(date)) return '#FEE2E2';
    return 'white';
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="page-container" style={{ padding: 0, background: '#F5F7FB' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1E40AF, #3B82F6)', padding: '14px 16px 18px', color: 'white' }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>航空大学校 入試管理 2026</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setMonthIdx(i => Math.max(0, i - 1))}
            style={{ color: 'white', fontSize: 28, padding: '0 8px', opacity: monthIdx === 0 ? 0.3 : 1 }}>‹</button>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{MONTHS[monthIdx]}</div>
          <button onClick={() => setMonthIdx(i => Math.min(3, i + 1))}
            style={{ color: 'white', fontSize: 28, padding: '0 8px', opacity: monthIdx === 3 ? 0.3 : 1 }}>›</button>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ background: 'white', marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #E5E7EB' }}>
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, fontWeight: 600, color: i === 0 ? '#EF4444' : i === 6 ? '#3B82F6' : '#6B7280' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} style={{ minHeight: 80, borderRight: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6' }} />;

            const date = dateStr(YEAR, month, day);
            const inRange = isInRange(YEAR, month, day);
            const isToday = date === today;
            const sched = getDaySchedule(date);
            const scheduledUnits = sched.unitIds.map(id => allUnits.find(u => u.id === id)).filter(Boolean) as typeof allUnits;
            const colIdx = idx % 7;
            const dayBg = inRange ? getDayBg(date) : '#FAFAFA';

            // Study time chips: only show for subjects that have at least one unit scheduled
            const studyChips = inRange
              ? (['math', 'physics', 'english'] as Subject[]).filter(s =>
                  sched.studyPeriods?.[s] && scheduledUnits.some(u => u.subject === s)
                )
              : [];

            return (
              <div
                key={date}
                onClick={() => inRange && setSelectedDate(date)}
                style={{
                  minHeight: 80, borderRight: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6',
                  padding: '3px 2px', cursor: inRange ? 'pointer' : 'default',
                  background: dayBg, position: 'relative',
                  outline: isToday ? '2px solid #1E40AF' : 'none', outlineOffset: '-2px',
                }}
              >
                <div style={{
                  fontSize: 12, fontWeight: isToday ? 800 : 600, marginBottom: 2, textAlign: 'center',
                  color: !inRange ? '#D1D5DB' : colIdx === 0 ? '#EF4444' : colIdx === 6 ? '#3B82F6' : '#374151',
                }}>
                  {isToday
                    ? <span style={{ background: '#1E40AF', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{day}</span>
                    : day}
                </div>

                {/* Study time chips */}
                {studyChips.map(s => {
                  const col = SUBJECT_COLORS[s];
                  const p = sched.studyPeriods![s]!;
                  const dur = calcDuration(p.start, p.end);
                  return (
                    <div key={s} onClick={e => {
                      e.stopPropagation();
                      // Find a unit of this subject to open popup, or open day popup
                      const unitOfSubject = scheduledUnits.find(u => u.subject === s);
                      if (unitOfSubject) {
                        setChipPopup({ type: 'unit', unitId: unitOfSubject.id, textbookId: unitOfSubject.textbookId, subject: s, unitName: unitOfSubject.name, date });
                      } else {
                        setSelectedDate(date);
                      }
                    }} style={{
                      fontSize: 8, padding: '1px 2px', borderRadius: 3, marginBottom: 1,
                      background: col.bg, color: col.text, border: '1px solid #000',
                      display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                    }}>
                      <span style={{ fontWeight: 800 }}>{SUBJECT_LABEL[s]}</span>
                      <span>{dur}分</span>
                    </div>
                  );
                })}

                {/* Unit chips */}
                {inRange && scheduledUnits.slice(0, 3).map(u => {
                  const col = SUBJECT_COLORS[u.subject];
                  const status = data.unitStatuses[u.id] || 'none';
                  return (
                    <div key={u.id}
                      onClick={e => {
                        e.stopPropagation();
                        setChipPopup({ type: 'unit', unitId: u.id, textbookId: u.textbookId, subject: u.subject, unitName: u.name, date });
                      }}
                      style={{
                        fontSize: 8, padding: '1px 2px', borderRadius: 3, marginBottom: 1,
                        background: status === 'circle' ? '#D1FAE5' : status === 'cross' ? '#FEE2E2' : col.bg,
                        color: status === 'circle' ? '#059669' : status === 'cross' ? '#DC2626' : col.text,
                        border: '1px solid #000',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                      }}>
                      <span style={{ fontWeight: 800 }}>{SUBJECT_LABEL[u.subject]}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 26 }}>{u.name}</span>
                      {status === 'circle' && <span style={{ flexShrink: 0 }}>○</span>}
                      {status === 'cross' && <span style={{ flexShrink: 0 }}>×</span>}
                    </div>
                  );
                })}

                {/* Exam chips */}
                {inRange && sched.examYears.slice(0, 1).map(year => (
                  <div key={year}
                    onClick={e => { e.stopPropagation(); setChipPopup({ type: 'exam', year, date }); }}
                    style={{
                      fontSize: 8, padding: '1px 2px', borderRadius: 3, marginBottom: 1,
                      background: '#EDE9FE', color: '#5B21B6', border: '1px solid #000',
                      cursor: 'pointer', fontWeight: 700,
                    }}>{year}年</div>
                ))}

                {inRange && (scheduledUnits.length > 3 || sched.examYears.length > 1) && (
                  <div style={{ fontSize: 8, color: '#9CA3AF', textAlign: 'center' }}>…</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ margin: '0 16px 12px', background: 'white', borderRadius: 12, padding: '10px 14px' }}>
        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 6 }}>凡例</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(['math', 'physics', 'english'] as Subject[]).map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: SUBJECT_COLORS[s].bg, border: '1px solid #000' }} />
              <span style={{ fontSize: 11, color: '#374151' }}>{SUBJECT_FULL[s]}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: '#DCFCE7' }} />
            <span style={{ fontSize: 11, color: '#374151' }}>全達成</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: '#FEE2E2' }} />
            <span style={{ fontSize: 11, color: '#374151' }}>未達成あり</span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
          チップタップ→詳細 / 日付タップ→全体管理
        </div>
      </div>

      {selectedDate && <DayPopup date={selectedDate} onClose={() => setSelectedDate(null)} />}
      {chipPopup?.type === 'unit' && (
        <UnitChipPopup
          unitId={chipPopup.unitId} textbookId={chipPopup.textbookId}
          subject={chipPopup.subject} unitName={chipPopup.unitName} date={chipPopup.date}
          onClose={() => setChipPopup(null)}
        />
      )}
      {chipPopup?.type === 'exam' && (
        <ExamChipPopup year={chipPopup.year} date={chipPopup.date} onClose={() => setChipPopup(null)} />
      )}
    </div>
  );
}

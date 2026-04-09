import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AppData, UnitStatus, DaySchedule, Textbook, Unit, Subject, Expense, Page, NavTarget, StudyPeriod } from './types';

const STORAGE_KEY = 'aviation_exam_2026';

function buildDefaultExams() {
  const exams: AppData['pastExams'] = {};
  for (let y = 2006; y <= 2025; y++) {
    exams[y] = { year: y, score: null, predictedPassingScore: null };
  }
  return exams;
}

const DEFAULT_DATA: AppData = {
  textbooks: [
    {
      id: 'math1', name: '数学参考書', subject: 'math',
      units: [
        { id: 'm-u1', name: '数列・級数' },
        { id: 'm-u2', name: '微分法' },
        { id: 'm-u3', name: '積分法' },
        { id: 'm-u4', name: 'ベクトル' },
        { id: 'm-u5', name: '確率・統計' },
        { id: 'm-u6', name: '三角関数' },
        { id: 'm-u7', name: '複素数平面' },
        { id: 'm-u8', name: '行列・線形代数' },
      ],
    },
    {
      id: 'phys1', name: '物理参考書', subject: 'physics',
      units: [
        { id: 'p-u1', name: '力学（運動方程式）' },
        { id: 'p-u2', name: '力学（エネルギー）' },
        { id: 'p-u3', name: '電磁気学' },
        { id: 'p-u4', name: '波動・光学' },
        { id: 'p-u5', name: '熱力学' },
        { id: 'p-u6', name: '原子物理' },
      ],
    },
    {
      id: 'eng1', name: '英語参考書', subject: 'english',
      units: [
        { id: 'e-u1', name: '長文読解' },
        { id: 'e-u2', name: '文法・語法' },
        { id: 'e-u3', name: '語彙・イディオム' },
        { id: 'e-u4', name: '英作文' },
        { id: 'e-u5', name: 'リスニング' },
      ],
    },
  ],
  unitStatuses: {},
  daySchedules: {},
  pastExams: buildDefaultExams(),
  expenses: [],
};

interface AppContextValue {
  data: AppData;
  activePage: Page;
  navTarget: NavTarget | null;
  setActivePage: (page: Page, target?: NavTarget) => void;
  navigateTo: (target: NavTarget) => void;
  clearNavTarget: () => void;
  updateUnitStatus: (unitId: string, status: UnitStatus) => void;
  getDaySchedule: (date: string) => DaySchedule;
  addUnitToDay: (date: string, unitId: string) => void;
  removeUnitFromDay: (date: string, unitId: string) => void;
  addExamToDay: (date: string, year: number) => void;
  removeExamFromDay: (date: string, year: number) => void;
  updateStudyPeriod: (date: string, subject: Subject, period: StudyPeriod | null) => void;
  updatePastExam: (year: number, score: number | null, predicted: number | null) => void;
  addTextbook: (textbook: Textbook) => void;
  updateTextbook: (textbook: Textbook) => void;
  deleteTextbook: (id: string) => void;
  addUnit: (textbookId: string, unit: Unit) => void;
  updateUnit: (textbookId: string, unit: Unit) => void;
  deleteUnit: (textbookId: string, unitId: string) => void;
  addExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_DATA,
          ...parsed,
          pastExams: { ...buildDefaultExams(), ...parsed.pastExams },
        };
      }
    } catch {}
    return DEFAULT_DATA;
  });

  const [activePage, setActivePageState] = useState<Page>('calendar');
  const [navTarget, setNavTarget] = useState<NavTarget | null>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }, [data]);

  const setActivePage = (page: Page, target?: NavTarget) => {
    setActivePageState(page);
    setNavTarget(target || null);
  };

  const navigateTo = (target: NavTarget) => {
    setActivePageState(target.page);
    setNavTarget(target);
  };

  const clearNavTarget = () => setNavTarget(null);

  const updateUnitStatus = (unitId: string, status: UnitStatus) =>
    setData(prev => ({ ...prev, unitStatuses: { ...prev.unitStatuses, [unitId]: status } }));

  const getDaySchedule = (date: string): DaySchedule =>
    data.daySchedules[date] || { unitIds: [], examYears: [], studyPeriods: {} };

  const updateDay = (date: string, updater: (s: DaySchedule) => DaySchedule) =>
    setData(prev => {
      const existing = prev.daySchedules[date] || { unitIds: [], examYears: [], studyPeriods: {} };
      return { ...prev, daySchedules: { ...prev.daySchedules, [date]: updater(existing) } };
    });

  const addUnitToDay = (date: string, unitId: string) =>
    updateDay(date, s => s.unitIds.includes(unitId) ? s : { ...s, unitIds: [...s.unitIds, unitId] });

  const removeUnitFromDay = (date: string, unitId: string) =>
    updateDay(date, s => {
      const newUnitIds = s.unitIds.filter(id => id !== unitId);
      // Find which subject this unit belongs to
      let subjectOfUnit: Subject | null = null;
      for (const tb of data.textbooks) {
        if (tb.units.some(u => u.id === unitId)) { subjectOfUnit = tb.subject; break; }
      }
      // If no more units of this subject remain on this day, clear its study period
      let studyPeriods = s.studyPeriods ?? {};
      if (subjectOfUnit) {
        const allUnitsMap = data.textbooks.flatMap(tb => tb.units.map(u => ({ id: u.id, subject: tb.subject })));
        const remainingOfSubject = newUnitIds.filter(id => allUnitsMap.find(u => u.id === id)?.subject === subjectOfUnit);
        if (remainingOfSubject.length === 0) {
          studyPeriods = { ...studyPeriods };
          delete studyPeriods[subjectOfUnit];
        }
      }
      return { ...s, unitIds: newUnitIds, studyPeriods };
    });

  const addExamToDay = (date: string, year: number) =>
    updateDay(date, s => s.examYears.includes(year) ? s : { ...s, examYears: [...s.examYears, year] });

  const removeExamFromDay = (date: string, year: number) =>
    updateDay(date, s => ({ ...s, examYears: s.examYears.filter(y => y !== year) }));

  const updateStudyPeriod = (date: string, subject: Subject, period: StudyPeriod | null) =>
    updateDay(date, s => {
      const periods = { ...s.studyPeriods };
      if (period === null) { delete periods[subject]; } else { periods[subject] = period; }
      return { ...s, studyPeriods: periods };
    });

  const updatePastExam = (year: number, score: number | null, predicted: number | null) =>
    setData(prev => ({
      ...prev,
      pastExams: { ...prev.pastExams, [year]: { year, score, predictedPassingScore: predicted } },
    }));

  const addTextbook = (textbook: Textbook) =>
    setData(prev => ({ ...prev, textbooks: [...prev.textbooks, textbook] }));

  const updateTextbook = (textbook: Textbook) =>
    setData(prev => ({ ...prev, textbooks: prev.textbooks.map(t => t.id === textbook.id ? textbook : t) }));

  const deleteTextbook = (id: string) =>
    setData(prev => {
      const tb = prev.textbooks.find(t => t.id === id);
      const unitIds = tb ? tb.units.map(u => u.id) : [];
      const daySchedules = Object.fromEntries(
        Object.entries(prev.daySchedules).map(([date, sched]) => [
          date,
          { ...sched, unitIds: sched.unitIds.filter(uid => !unitIds.includes(uid)) },
        ])
      );
      return { ...prev, textbooks: prev.textbooks.filter(t => t.id !== id), daySchedules };
    });

  const addUnit = (textbookId: string, unit: Unit) =>
    setData(prev => ({
      ...prev,
      textbooks: prev.textbooks.map(t => t.id === textbookId ? { ...t, units: [...t.units, unit] } : t),
    }));

  const updateUnit = (textbookId: string, unit: Unit) =>
    setData(prev => ({
      ...prev,
      textbooks: prev.textbooks.map(t =>
        t.id === textbookId ? { ...t, units: t.units.map(u => u.id === unit.id ? unit : u) } : t
      ),
    }));

  const deleteUnit = (textbookId: string, unitId: string) =>
    setData(prev => {
      const daySchedules = Object.fromEntries(
        Object.entries(prev.daySchedules).map(([date, sched]) => [
          date,
          { ...sched, unitIds: sched.unitIds.filter(uid => uid !== unitId) },
        ])
      );
      return {
        ...prev,
        textbooks: prev.textbooks.map(t =>
          t.id === textbookId ? { ...t, units: t.units.filter(u => u.id !== unitId) } : t
        ),
        daySchedules,
      };
    });

  const addExpense = (expense: Expense) =>
    setData(prev => ({ ...prev, expenses: [...prev.expenses, expense] }));

  const removeExpense = (id: string) =>
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));

  return (
    <AppContext.Provider value={{
      data, activePage, navTarget,
      setActivePage, navigateTo, clearNavTarget,
      updateUnitStatus, getDaySchedule,
      addUnitToDay, removeUnitFromDay, addExamToDay, removeExamFromDay, updateStudyPeriod,
      updatePastExam, addTextbook, updateTextbook, deleteTextbook,
      addUnit, updateUnit, deleteUnit, addExpense, removeExpense,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

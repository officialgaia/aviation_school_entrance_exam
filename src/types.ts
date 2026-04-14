export type Subject = 'math' | 'physics' | 'english' | 'geology';
export type UnitStatus = 'none' | 'circle' | 'cross';
export type Page = 'calendar' | 'pastExam' | 'textbook' | 'expense';
export type ExamType = 'score2' | 'english';

export interface Unit {
  id: string;
  name: string;
}

export interface Textbook {
  id: string;
  name: string;
  subject: Subject;
  units: Unit[];
}

export interface StudyPeriod {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export interface ExamEntry {
  year: number;
  examType: ExamType;
}

export interface DaySchedule {
  unitIds: string[];
  examEntries: ExamEntry[];
  studyPeriods: Partial<Record<Subject, StudyPeriod>>;
}

export interface PastExam {
  year: number;
  score2: number | null;    // 総合2
  english: number | null;   // 英語
}

export interface Expense {
  id: string;
  date: string;
  category: 'textbook' | 'application' | 'other';
  description: string;
  amount: number;
}

export interface AppData {
  textbooks: Textbook[];
  unitStatuses: Record<string, UnitStatus>;
  daySchedules: Record<string, DaySchedule>;
  pastExams: Record<number, PastExam>;
  expenses: Expense[];
}

export interface NavTarget {
  page: Page;
  subject?: Subject;
  textbookId?: string;
  year?: number;
}

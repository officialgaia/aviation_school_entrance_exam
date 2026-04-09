export type Subject = 'math' | 'physics' | 'english';
export type UnitStatus = 'none' | 'circle' | 'cross';
export type Page = 'calendar' | 'pastExam' | 'textbook' | 'expense';

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

export interface DaySchedule {
  unitIds: string[];
  examYears: number[];
  studyPeriods: Partial<Record<Subject, StudyPeriod>>;
  /** @deprecated use studyPeriods */
  studyTimes?: Partial<Record<Subject, number>>;
}

export interface PastExam {
  year: number;
  score: number | null;
  predictedPassingScore: number | null;
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

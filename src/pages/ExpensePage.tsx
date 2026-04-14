import { useState } from 'react';
import { useApp } from '../store';
import type { Expense } from '../types';

const CATEGORY_LABEL: Record<Expense['category'], string> = {
  textbook: '📚 参考書購入',
  application: '📋 出願費用',
  other: '💡 その他',
};

const CATEGORY_COLORS: Record<Expense['category'], { bg: string; text: string }> = {
  textbook: { bg: '#DBEAFE', text: '#1D4ED8' },
  application: { bg: '#D1FAE5', text: '#065F46' },
  other: { bg: '#F3F4F6', text: '#374151' },
};

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ExpensePage() {
  const { data, addExpense, removeExpense } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'textbook' as Expense['category'],
    description: '',
    amount: '',
  });

  const total = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory: Record<Expense['category'], number> = { textbook: 0, application: 0, other: 0 };
  data.expenses.forEach(e => { byCategory[e.category] += e.amount; });

  const handleSubmit = () => {
    if (!form.description.trim() || !form.amount) return;
    addExpense({
      id: generateId(),
      date: form.date,
      category: form.category,
      description: form.description.trim(),
      amount: parseInt(form.amount) || 0,
    });
    setForm({ date: new Date().toISOString().slice(0, 10), category: 'textbook', description: '', amount: '' });
    setShowForm(false);
  };

  const sortedExpenses = [...data.expenses].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#1a1a2e' }}>費用</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>入試関連の費用を管理</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: '#1E40AF', color: 'white', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}
        >+ 追加</button>
      </div>

      {/* Total summary */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>合計費用</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e', marginBottom: 14 }}>
          ¥{total.toLocaleString()}
        </div>
        {(['textbook', 'application', 'other'] as Expense['category'][]).map(cat => (
          byCategory[cat] > 0 && (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{
                fontSize: 12, background: CATEGORY_COLORS[cat].bg, color: CATEGORY_COLORS[cat].text,
                padding: '2px 8px', borderRadius: 6, fontWeight: 600,
              }}>{CATEGORY_LABEL[cat]}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>¥{byCategory[cat].toLocaleString()}</span>
            </div>
          )
        ))}
      </div>

      {/* Expense list */}
      <div className="card">
        <div style={{ padding: '14px 16px 10px', fontSize: 15, fontWeight: 700, color: '#374151' }}>明細</div>
        {sortedExpenses.length === 0 ? (
          <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>費用が登録されていません</p>
        ) : sortedExpenses.map((expense, idx) => (
          <div
            key={expense.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
              borderBottom: idx < sortedExpenses.length - 1 ? '1px solid #F3F4F6' : 'none',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontSize: 11, background: CATEGORY_COLORS[expense.category].bg, color: CATEGORY_COLORS[expense.category].text,
                  padding: '1px 6px', borderRadius: 5, fontWeight: 600,
                }}>{CATEGORY_LABEL[expense.category]}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{expense.date}</span>
              </div>
              <div style={{ fontSize: 14, color: '#1a1a2e' }}>{expense.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>¥{expense.amount.toLocaleString()}</span>
              <button
                onClick={() => { if (window.confirm('削除しますか?')) removeExpense(expense.id); }}
                style={{ fontSize: 16, color: '#D1D5DB' }}
              >🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add expense modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h3 style={{ fontSize: 20, fontWeight: 800, marginTop: 0, marginBottom: 20 }}>費用を追加</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>日付</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 16 }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>カテゴリ</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['textbook', 'application', 'other'] as Expense['category'][]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm(prev => ({ ...prev, category: cat }))}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: form.category === cat ? CATEGORY_COLORS[cat].bg : '#F9FAFB',
                      color: form.category === cat ? CATEGORY_COLORS[cat].text : '#9CA3AF',
                      border: `2px solid ${form.category === cat ? 'currentColor' : '#E5E7EB'}`,
                    }}
                  >{CATEGORY_LABEL[cat]}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>内容</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="例: チャート式 数学II+B"
                autoFocus
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 16 }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>金額（円）</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="例: 2200"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #D1D5DB', fontSize: 16 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 15, color: '#374151' }}>
                キャンセル
              </button>
              <button onClick={handleSubmit}
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: '#1E40AF', color: 'white', fontSize: 15, fontWeight: 700 }}>
                追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

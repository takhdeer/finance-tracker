import { useState } from 'react';
import axios from 'axios';

function ExpenseForm({ onExpenseAdded }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    merchant: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('http://localhost:3001/api/expenses', formData);
      
      setFormData({
        amount: '',
        category: 'Food',
        merchant: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      if (onExpenseAdded) onExpenseAdded();
      alert('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Add Expense</h2>
      
      <div style={styles.formGroup}>
        <label>Amount ($)</label>
        <input
          type="number"
          name="amount"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
          required
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label>Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          style={styles.input}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div style={styles.formGroup}>
        <label>Merchant</label>
        <input
          type="text"
          name="merchant"
          value={formData.merchant}
          onChange={handleChange}
          placeholder="e.g., Starbucks"
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label>Notes (optional)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional details..."
          style={styles.textarea}
        />
      </div>

      <button type="submit" style={styles.button}>Add Expense</button>
    </form>
  );
}

const styles = {
  form: {
    maxWidth: '500px',
    margin: '20px auto',
    padding: '25px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  formGroup: {
    marginBottom: '18px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '15px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '15px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    minHeight: '80px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

export default ExpenseForm;
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
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9'
  },
  formGroup: {
    marginBottom: '15px'
  },
  input: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    minHeight: '60px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer'
  }
};

export default ExpenseForm;
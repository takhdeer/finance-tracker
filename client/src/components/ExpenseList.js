import { useState, useEffect } from 'react';
import axios from 'axios'

function ExpenseList({ refreshTrigger }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ 
    amount: '',
    category: '',
    merchant: '',
    date: '',
    notes: ''
  });


  const fetchExpenses = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/expenses');
      setExpenses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    }
  };
  
    useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger]);

  const handleDelete = async (id) => { 
    // Confirming deletion
    if (!window.confirm('Are you sure you want to delete this expense?')) {
        return; 
    }

    try {
        await axios.delete(`http://localhost:3001/api/expenses/${id}`)
        //Removing expense from UI immediately
        setExpenses(expenses.filter(expense => expense.id !== id));
        alert('Expense deleted sucessfully!');
    }   catch(error) { 
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense');
    }
  };

  const handleEditClick = (expense) => { 
    setEditingId(expense.id);
    setEditForm({
      amount: expense.amount,
      category: expense.category,
      merchant: expense.merchant,
      date: typeof expense.date === 'string' ? expense.date.split('T')[0] : expense.date,
      notes: expense.notes || ''
    });
  };

  const handleCancelEdit = () => { 
    setEditingId(null);
    setEditForm({
      amount: '',
      category: '',
      merchant: '',
      date: '',
      notes: '',
    });
  };

  const handleSaveEdit = async (id) => { 
    try { 
      const response = await axios.put(`http://localhost:3001/api/expenses/${id}`, editForm);
    setExpenses(expenses.map(expense => 
      expense.id === id ? response.data : expense
    ));
    setEditingId(null);
    alert('Expense updated successfully!');
  } catch (error) {
    console.error('Error updating expense:', error);
    alert('Failed to update expense');
    }
  };
  
  const handleEditFormChange = (e) => { 
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };


  if (loading) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <h2>Your Expenses</h2>
      {expenses.length === 0 ? (
        <p>No expenses yet. Add one above!</p>
      ) : (
        <div>
          {expenses.map(expense => (
            <div key={expense.id} style={styles.expenseCard}>
              {editingId === expense.id ? (
                // editing mode (editable form) 
                <div>
                  <h3 style={{ marginTop: 0 }}>Editing Expense</h3>
                  <div style={styles.formGroup}>
                    <label>Amount ($)</label> 
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      value={editForm.amount}
                      onChange={handleEditFormChange}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.buttonGroup}>
                    <button
                      onClick={() => handleSaveEdit(expense.id)}
                      style={styles.saveButton}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}  // FIXED: Removed (expense.id)
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Normal Mode
                <div>
                  <div style={styles.expenseHeader}>
                    <span style={styles.amount}>${parseFloat(expense.amount).toFixed(2)}</span>
                    <span style={styles.category}>{expense.category}</span>
                  </div>
                  <div style={styles.expenseDetails}>
                    {expense.merchant && <div><strong>Merchant:</strong> {expense.merchant}</div>}
                    <div><strong>Date:</strong> {new Date(expense.date).toLocaleDateString()}</div>
                    {expense.notes && <div><strong>Notes:</strong> {expense.notes}</div>}
                  </div>
                  <div style={styles.buttonGroup}>
                    <button
                      onClick={() => handleEditClick(expense)}
                      style={styles.editButton}
                    >
                      Edit Amount
                    </button>
                    <button 
                      onClick={() => handleDelete(expense.id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}     


const styles = {
  container: {
    maxWidth: '600px',
    margin: '20px auto',
    padding: '20px'
  },
  expenseCard: {
    padding: '15px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white'
  },
  expenseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px'
  },
  amount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333'
  },
  category: {
    padding: '4px 12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#1976d2'
  },
  expenseDetails: {
    fontSize: '14px',
    color: '#666'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',  // Blue
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    flex: 1
  },
  deleteButton: {
    padding: '8px 16px', 
    backgroundColor: '#f44336', // Red
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer', 
    fontSize: '14px',
    fontWeight: 'bold',
  },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',  // Green
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    flex: 1
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#757575',  // Gray
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    flex: 1
  },
  formGroup: {
    marginBottom: '12px'
  },
  input: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box'
  }
};

export default ExpenseList;
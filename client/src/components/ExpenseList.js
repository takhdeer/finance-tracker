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
      merchant: expense.merchant || '',
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
      const originalExpense = expenses.find(e => e.id === id);
      console.log('Original Expenses:', originalExpense)
      console.log('Edit form:', editForm)

      const updateData = {
        amount: editForm.amount,
        category: originalExpense.category,
        merchant: originalExpense.merchant || '',
        date: originalExpense.date,
        notes: originalExpense.notes || ''

      };

      console.log('Sending this data:', updateData);

      const response = await axios.put(`http://localhost:3001/api/expenses/${id}`, updateData);
      console.log('Recieved from server', response.data)
    setExpenses(expenses.map(expense => 
      expense.id === id ? response.data.expense : expense
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
      {expenses.length > 0 && (
        <div style ={styles.totalBox}>
          <span style = {styles.totalLabel}> Total Spent:</span>
          <span style = {styles.totalAmount}>
            ${expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0).toFixed(2)}
          </span>
        </div>
      )}
      {expenses.length === 0 ? (
        <p>No expenses yet. Add one above!</p>
      ) : (
        <div>
          {expenses.map(expense => (
            <div key={expense.id} style={styles.expenseCard}>
              {editingId === expense.id ? (
                // editing mode (editable form) 
                <div style = {styles.formGroup}>
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
                  
                  <div style = {styles.formGroup}>
                    <label style = {styles.label}>Category</label>
                    <select 
                      name ="category"
                      value = {editForm.category}
                      onChange= {handleEditFormChange}
                      style = {styles.input}
                    >
                      <option value="Food">Food</option>
                      <option value="Transport">Transport</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Bills">Bills</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style = {styles.formGroup}>
                    <label style = {styles.label}>Merchant</label>
                    <input
                      type = "text" 
                      name = "merchant"
                      value = {editForm.merchant}
                      onChange = {handleEditFormChange}
                      style = {styles.input}
                    />
                  </div>

                  <div style = {styles.formGroup}>
                    <label style = {styles.label}>Date</label>
                    <input
                      type = "date"
                      name = "date"
                      value = {editForm.date}
                      onChange = {handleEditFormChange}
                      style = {styles.input}
                    />
                  </div>

                  <div style = {styles.formGroup}>
                    <label style = {styles.label}>Notes</label>
                    <input
                      name = "notes"
                      value = {editForm.notes}
                      onChange = {handleEditFormChange}
                      placeholder = "Additional details..."
                      style = {styles.input}
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
                      Edit Details
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
    padding: '20px',

  },
  expenseCard: {
    padding: '20px',
    marginBottom: '15px',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    backgroundColor: 'white',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08',
    transition: 'box-shadow 0.2s'
  },
  expenseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '12px'
  },
  amount: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  category: {
    padding: '6px 14px',
    backgroundColor: '#e3f2fd',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#1976d2',
    fontWeight: '600'
  },
  expenseDetails: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    lineHeight: '1.6'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px'
  },
  editButton: {
    padding: '10px 18px',
    backgroundColor: '#2196F3',  // Blue
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    flex: 1,
    transition: 'background-color 0.2s'
  },
  deleteButton: {
    padding: '10px 18px', 
    backgroundColor: '#f44336', // Red
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer', 
    fontSize: '14px',
    fontWeight: 'bold',
    flex: 1,
    transition: 'background-color 0.2s'
  },
  saveButton: {
    padding: '10px 18px',
    backgroundColor: '#4CAF50',  // Green
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    flex: 1,
    transition: 'background-color 0.2s'
  },
  cancelButton: {
    padding: '10px 18px',
    backgroundColor: '#757575',  // Gray
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    flex: 1,
    transition: 'background-color 0.2s'
  },
  formGroup: {
    marginBottom: '15px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    boxSizing: 'border-box'
  },
  totalBox: {
    backgroundColor: '#e8f5e9',
    padding: '20px',
    borderRadius: '12px',
    marginTop: '20px',
    display: "felx",
    justifyContent: 'space-between',
    alignItems: "centre",
    border: '2px solid #4CAF50'
  },
  totalLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2e7d32',
  },
  totalAmount: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1b5e20'
  }
}

export default ExpenseList;
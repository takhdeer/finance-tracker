import { useState } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="App">
      <header style={styles.header}>
        <h1>💰 Finance Tracker</h1>
      </header>
      <ExpenseForm onExpenseAdded={handleExpenseAdded} />
      <ExpenseList refreshTrigger={refreshTrigger} />
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '20px',
    textAlign: 'center'
  }
};

export default App;
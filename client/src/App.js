import { useState } from 'react';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import ReceiptScanner from './components/ReceiptScanner';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [scannedData, setScannedData] = useState(null);

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setScannedData(null);
  };

  const handleReceiptScanned = (data) => {
    setScannedData(data);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth'});
  };

  return (
    <div className="App">
      <header style={styles.header}>
        <h1>💰 Finance Tracker</h1>
      </header>

      <ReceiptScanner onReceiptScanned={handleReceiptScanned} />
      <ExpenseForm 
        onExpenseAdded={handleExpenseAdded} 
        initialData = {scannedData}
      />
      <ExpenseList refreshTrigger={refreshTrigger} />
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: ' 30px 20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }
};

export default App;
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows[0]);
  }
});

// Routes
// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// GET all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM expenses ORDER BY date DESC, created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST new expense
app.post('/api/expenses', async (req, res) => {
  const { amount, category, merchant, date, notes } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO expenses (amount, category, merchant, date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [amount, category, merchant, date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE expense
app.delete('/api/expenses/:id', async (req, res) => {
  const {id} = req.params;

  try { 
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted', expense: result.rows[0] });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Server error'});
  }
  
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
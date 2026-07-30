import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Helper to wrap db operations in promises
const runDb = (query, params) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getDb = (query, params) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// --- AUTHENTICATION ENDPOINTS ---

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const existing = await getDb('SELECT * FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarSeed = Math.floor(Math.random() * 1000);

    const result = await runDb(
      'INSERT INTO users (username, password, avatarSeed) VALUES (?, ?, ?)',
      [username, hashedPassword, avatarSeed]
    );

    const userId = result.lastID;
    res.json({ id: userId, username, avatarSeed });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await getDb('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ id: user.id, username: user.username, avatarSeed: user.avatarSeed });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PROGRESS ENDPOINTS ---

app.get('/api/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const progressRow = await getDb('SELECT data FROM progress WHERE userId = ?', [userId]);
    
    if (progressRow) {
      res.json(JSON.parse(progressRow.data));
    } else {
      res.status(404).json({ error: 'No progress found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/progress', async (req, res) => {
  try {
    const { userId, data } = req.body;
    if (!userId || !data) {
      return res.status(400).json({ error: 'userId and data required' });
    }

    // Upsert
    const existing = await getDb('SELECT * FROM progress WHERE userId = ?', [userId]);
    if (existing) {
      await runDb('UPDATE progress SET data = ? WHERE userId = ?', [JSON.stringify(data), userId]);
    } else {
      await runDb('INSERT INTO progress (userId, data) VALUES (?, ?)', [userId, JSON.stringify(data)]);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

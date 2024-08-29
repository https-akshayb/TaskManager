const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const db = new sqlite3.Database('tasks.db');

// Initialize database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        due_date TEXT,
        description TEXT,
        completed BOOLEAN
    )`);
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Register user
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hash], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
    });
});

// Login user
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result) {
                const token = jwt.sign({ id: user.id }, 'your_secret_key');
                res.json({ token });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
    });
});

// Get all tasks
app.get('/tasks', authenticateToken, (req, res) => {
    const showAllTasks = req.query.completed === 'true';
    db.all(`SELECT * FROM tasks WHERE completed = ? OR ?`, [showAllTasks, !showAllTasks], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add a task
app.post('/tasks', authenticateToken, (req, res) => {
    const { title, due_date, description, completed } = req.body;
    db.run(`INSERT INTO tasks (title, due_date, description, completed) VALUES (?, ?, ?, ?)`,
        [title, due_date, description, completed], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID });
        });
});

// Update a task
app.put('/tasks/:id', authenticateToken, (req, res) => {
    const { title, due_date, description, completed } = req.body;
    db.run(`UPDATE tasks SET title = ?, due_date = ?, description = ?, completed = ? WHERE id = ?`,
        [title, due_date, description, completed, req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ changes: this.changes });
        });
});

// Delete a task
app.delete('/tasks/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM tasks WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ changes: this.changes });
    });
});

// Mark task as completed
app.patch('/tasks/:id/completed', authenticateToken, (req, res) => {
    db.run(`UPDATE tasks SET completed = ? WHERE id = ?`, [true, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ changes: this.changes });
    });
});
// Get a specific task by ID
app.get('/tasks/:id', authenticateToken, (req, res) => {
    db.get(`SELECT * FROM tasks WHERE id = ?`, [req.params.id], (err, task) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    });
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

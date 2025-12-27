const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

const SECRET_KEY = process.env.JWT_SECRET || 'secret';

// Register
router.post('/register', (req, res) => {
    const { full_name, email, phone, role, password } = req.body;

    // Basic validation
    if (!full_name || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // Prevent creating 'Admin' or 'Staff' via public registration
    if (role === 'Admin' || role === 'Staff') {
        return res.status(403).json({ error: 'Bu rol için kayıt oluşturulamaz.' });
    }

    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Error hashing password' });

        const stmt = db.prepare("INSERT INTO users (full_name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?)");
        stmt.run(full_name, email, phone, role, hash, function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, message: 'User registered successfully' });
        });
        stmt.finalize();
    });
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const query = `
        SELECT u.*, r.name as restaurant_name 
        FROM users u 
        LEFT JOIN restaurants r ON u.restaurant_id = r.id 
        WHERE u.email = ?
    `;

    db.get(query, [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        bcrypt.compare(password, user.password_hash, (err, result) => {
            if (err || !result) return res.status(401).json({ error: 'Invalid credentials' });

            // Generate JWT
            const token = jwt.sign({
                id: user.id,
                role: user.role,
                restaurant_id: user.restaurant_id
            }, process.env.JWT_SECRET, { expiresIn: '24h' });

            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.full_name,
                    email: user.email,
                    role: user.role,
                    restaurant_id: user.restaurant_id,
                    restaurant_name: user.restaurant_name // Include name
                }
            });
        });
    });
});


module.exports = router;

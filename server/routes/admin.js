const express = require('express');
const db = require('../database');
const router = express.Router();

// Get System Options/Stats
router.get('/stats', async (req, res) => {
    const getQuery = (sql) => new Promise((resolve, reject) => {
        db.get(sql, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    try {
        const [users, restaurants, active, redeemed] = await Promise.all([
            getQuery("SELECT COUNT(*) as count FROM users"),
            getQuery("SELECT COUNT(*) as count FROM restaurants"),
            getQuery("SELECT SUM(quantity) as total FROM suspended_meals WHERE status = 'Active'"),
            getQuery("SELECT SUM(quantity) as total FROM suspended_meals WHERE status = 'Used'")
        ]);

        res.json({
            total_users: users.count,
            total_restaurants: restaurants.count,
            active_meals: active.total || 0,
            redeemed_meals: redeemed.total || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Heatmap Data
router.get('/heatmap', (req, res) => {
    const query = `
        SELECT r.district, COUNT(sm.id) as meal_count 
        FROM suspended_meals sm
        JOIN restaurants r ON sm.restaurant_id = r.id
        WHERE sm.status = 'Active'
        GROUP BY r.district
    `;
    db.all(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows); // Returns [{district: 'Kadikoy', meal_count: 5}, ...]
    });
});

// --- MANAGEMENT ENDPOINTS ---

// Get All Users
router.get('/users', (req, res) => {
    db.all("SELECT id, full_name, email, role, created_at FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Delete User
router.delete('/users/:id', (req, res) => {
    const id = req.params.id;
    // Prevent deleting the main admin
    db.get("SELECT email FROM users WHERE id = ?", [id], (err, row) => {
        if (row && row.email === 'admin@askida.com') {
            return res.status(403).json({ error: 'Ana yönetici silinemez.' });
        }

        db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Kullanıcı silindi.' });
        });
    });
});

// Delete Restaurant
router.delete('/restaurants/:id', (req, res) => {
    db.run("DELETE FROM restaurants WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Restoran silindi.' });
    });
});

module.exports = router;

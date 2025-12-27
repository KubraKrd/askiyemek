const express = require('express');
const db = require('../database');
const bcrypt = require('bcrypt');
const router = express.Router();

// Get all restaurants
router.get('/restaurants', (req, res) => {
    db.all("SELECT * FROM restaurants WHERE is_active = 1", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get Menu for a Specific Restaurant
router.get('/menu/:restaurantId', (req, res) => {
    db.all("SELECT * FROM meal_types WHERE restaurant_id = ? AND is_available = 1", [req.params.restaurantId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create Restaurant (For Restaurant Owner)
router.post('/restaurants', (req, res) => {
    const { owner_id, name, city, district, image_url } = req.body;

    // Create restaurant
    const restStmt = db.prepare("INSERT INTO restaurants (owner_id, city, district, name, image_url) VALUES (?, ?, ?, ?, ?)");
    restStmt.run(owner_id, city, district, name, image_url, function (err) {
        if (err) return res.status(500).json({ error: err.message });

        // Also update the owner's user record to have this restaurant_id (optional but good for consistency)
        const restId = this.lastID;
        db.run("UPDATE users SET restaurant_id = ? WHERE id = ?", [restId, owner_id]);

        res.status(201).json({ id: restId, message: 'Restaurant created successfully' });
    });
    restStmt.finalize();
});

// Check if User Has Restaurant
router.get('/my-restaurant/:ownerId', (req, res) => {
    db.get("SELECT * FROM restaurants WHERE owner_id = ?", [req.params.ownerId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || null);
    });
});

// Add Menu Item
router.post('/menu', (req, res) => {
    const { restaurant_id, name, price, image_url } = req.body;
    const stmt = db.prepare("INSERT INTO meal_types (restaurant_id, name, price, image_url) VALUES (?, ?, ?, ?)");
    stmt.run(restaurant_id, name, price, image_url, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, message: 'Menu item added' });
    });
    stmt.finalize();
});

// STAFF MANAGEMENT ENDPOINTS

// Create Staff Account (Called by Restaurant Owner)
router.post('/staff', async (req, res) => {
    const { restaurant_id, full_name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const stmt = db.prepare("INSERT INTO users (restaurant_id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, 'Staff')");
        stmt.run(restaurant_id, full_name, email, hashedPassword, function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists.' });
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'Staff created successfully' });
        });
        stmt.finalize();
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Staff List for a Restaurant
router.get('/staff/:restaurantId', (req, res) => {
    db.all("SELECT id, full_name, email FROM users WHERE restaurant_id = ? AND role = 'Staff'", [req.params.restaurantId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// Donate a meal
router.post('/donate', async (req, res) => {
    const { restaurant_id, donor_id, meal_type_id, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    try {
        const stmt = db.prepare("INSERT INTO suspended_meals (restaurant_id, donor_id, meal_type_id, quantity, status) VALUES (?, ?, ?, 1, 'Active')");
        const logStmt = db.prepare("INSERT INTO meal_transactions (suspended_meal_id, action_type) VALUES (?, 'Created')");

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            for (let i = 0; i < qty; i++) {
                stmt.run(restaurant_id, donor_id, meal_type_id, function (err) {
                    if (err) {
                        console.error('Error inserting meal:', err);
                        // In a real app we might rollback here, but for now log and continue
                        return;
                    }
                    // this.lastID is valid here
                    const mealId = this.lastID;
                    logStmt.run(mealId);
                });
            }

            db.run("COMMIT", (err) => {
                // Finalize statements after Commit to ensure they are done
                stmt.finalize();
                logStmt.finalize();

                if (err) {
                    console.error('Commit failed:', err);
                    return res.status(500).json({ error: 'İşlem tamamlanamadı.' });
                }
                res.status(201).json({ message: `${qty} adet yemek askıya bırakıldı.` });
            });
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Suspended Meals for a specific restaurant (with Menu details)
router.get('/suspended/:restaurantId', (req, res) => {
    const restaurantId = req.params.restaurantId;
    const query = `
        SELECT sm.id, sm.status, sm.meal_type_id, mt.name as meal_name, mt.price, mt.image_url 
        FROM suspended_meals sm
        JOIN meal_types mt ON sm.meal_type_id = mt.id
        WHERE sm.restaurant_id = ? AND sm.status = 'Active'
    `;
    db.all(query, [restaurantId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Delete Menu Item
router.delete('/menu/:id', (req, res) => {
    db.run("DELETE FROM meal_types WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Menü ürünü silindi.' });
    });
});

// Delete Staff
router.delete('/staff/:id', (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Personel silindi.' });
    });
});

module.exports = router;

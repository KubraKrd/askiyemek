const express = require('express');
const db = require('../database');
const crypto = require('crypto');
const router = express.Router();

// Helper to check daily limit
const checkDailyLimit = (userId) => {
    return new Promise((resolve, reject) => {
        const startOfDay = new Date().toISOString().split('T')[0] + ' 00:00:00';
        db.get(
            "SELECT count(*) as count FROM meal_transactions WHERE recipient_id = ? AND action_type = 'Used' AND created_at >= ?",
            [userId, startOfDay],
            (err, row) => {
                if (err) reject(err);
                resolve(row.count);
            }
        );
    });
};

// Request a Code (Recipient)
router.post('/request-code', async (req, res) => {
    const { recipient_id, restaurant_id, meal_type_id } = req.body; 

    try {
        const usageCount = await checkDailyLimit(recipient_id);
        if (usageCount >= 2) {
            return res.status(403).json({ error: 'Günlük 2 yemek alma limitiniz doldu.' });
        }

        // Find an active suspended meal (FIFO)
        db.get(
            "SELECT id FROM suspended_meals WHERE restaurant_id = ? AND meal_type_id = ? AND status = 'Active' ORDER BY created_at ASC LIMIT 1",
            [restaurant_id, meal_type_id],
            (err, meal) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!meal) return res.status(404).json({ error: 'Bu menüden askıda aktif yemek kalmadı.' });

                const code = crypto.randomInt(100000, 999999).toString();

                const stmt = db.prepare("INSERT INTO meal_transactions (suspended_meal_id, recipient_id, action_type, one_time_code) VALUES (?, ?, 'Created', ?)");
                stmt.run(meal.id, recipient_id, code, function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ code, transaction_id: this.lastID });
                });
                stmt.finalize();
            }
        );

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Redeem Code (Staff)
router.post('/redeem', (req, res) => {
    const { code, staff_id, restaurant_id } = req.body;
    const cleanCode = code ? code.toString().trim() : '';

    if (!cleanCode) return res.status(400).json({ error: 'Lütfen bir kod giriniz.' });

    // First, find if code exists at all
    // We join meal_transactions with suspended_meals to get the restaurant_id
    db.get(
        `SELECT mt.id as transaction_id, mt.suspended_meal_id, mt.action_type, mt.one_time_code,
                sm.restaurant_id, sm.status as meal_status, sm.meal_type_id
         FROM meal_transactions mt
         JOIN suspended_meals sm ON mt.suspended_meal_id = sm.id
         WHERE mt.one_time_code = ?`,
        [cleanCode],
        (err, transaction) => {
            if (err) return res.status(500).json({ error: "Veritabanı hatası: " + err.message });

            if (!transaction) {
                return res.status(404).json({ error: 'Geçersiz kod. Böyle bir kod bulunamadı.' });
            }

            // Check if already used
            if (transaction.action_type === 'Used' || transaction.meal_status === 'Used') {
                return res.status(400).json({ error: 'Bu kod daha önce kullanılmış.' });
            }

            // Check restaurant match - Ensure type safety
            if (String(transaction.restaurant_id) !== String(restaurant_id)) {
                console.log(`Mismatch: DB=${transaction.restaurant_id} vs Req=${restaurant_id}`);
                return res.status(403).json({ error: 'Bu kod bu restoran için geçerli değil.' });
            }

            // Confirm it is 'Created' (Pending)
            if (transaction.action_type !== 'Created') {
                return res.status(400).json({ error: 'Kod durumu geçersiz: ' + transaction.action_type });
            }

            // Mark as used
            db.serialize(() => {
                // Update Meal Status
                db.run("UPDATE suspended_meals SET status = 'Used' WHERE id = ?", [transaction.suspended_meal_id]);

                // Update Transaction
                db.run("UPDATE meal_transactions SET action_type = 'Used', staff_id = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?", [staff_id, transaction.transaction_id], (err) => {
                    if (err) return res.status(500).json({ error: err.message });

                    // Fetch meal details for success message
                    db.get("SELECT mt.name FROM meal_types mt JOIN suspended_meals sm ON sm.meal_type_id = mt.id WHERE sm.id = ?", [transaction.suspended_meal_id], (err, mealInfo) => {
                        res.json({ message: 'Onaylandı! Afiyet olsun.', meal: mealInfo || { name: 'Yemek' } });
                    });
                });
            });
        }
    );
});

module.exports = router;

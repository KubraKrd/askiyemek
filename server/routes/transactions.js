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
    const { recipient_id, restaurant_id, meal_type_id } = req.body; // In real app, recipient_id from token

    try {
        const usageCount = await checkDailyLimit(recipient_id);
        if (usageCount >= 2) {
            return res.status(403).json({ error: 'Daily limit of 2 meals reached.' });
        }

        // Find an active suspended meal (FIFO)
        db.get(
            "SELECT id FROM suspended_meals WHERE restaurant_id = ? AND meal_type_id = ? AND status = 'Active' ORDER BY created_at ASC LIMIT 1",
            [restaurant_id, meal_type_id],
            (err, meal) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!meal) return res.status(404).json({ error: 'No active suspended meals found for this type.' });

                // Update meal to 'Reserved' (or just keep Active but mark in transaction? Prompt says "Active" -> "Used". 
                // To prevent race conditions, let's keep it simple: We won't strictly "reserve" in DB state 'Reserved' unless we added that enum. 
                // But to be safe, we can leave it Active. However, if two people get codes for same meal?
                // Better: Just generate code. When 'redeeming', we match code to ANY active meal of that type? 
                // Or link specific meal to code? Linking is safer. 
                // Let's add 'Reserved' to Enum or just use 'Active' and handle concurrency? 
                // Prompt: "Askı Durumları: Aktif, Kullanıldı, Süresi Doldu, İptal Edildi". No "Reserved".
                // I will link it in transaction but kept as Active. When redeeming, verify it's still Active. 
                // If someone else took it (race condition), fail? 
                // Actually, 'Sistem tek kullanımlık doğrulama kodu üretir'.
                // Let's generate a code and store in `meal_transactions` with status 'Pending'? 
                // `action_type`: 'Created', 'Used'. I'll use 'Created' as 'Pending Redemption'.

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
// Redeem Code (Staff)
router.post('/redeem', (req, res) => {
    const { code, staff_id, restaurant_id } = req.body;

    const cleanCode = code ? code.toString().trim() : '';

    if (!cleanCode) return res.status(400).json({ error: 'Lütfen bir kod giriniz.' });

    // First, find if code exists at all
    db.get(
        `SELECT mt.id as transaction_id, mt.suspended_meal_id, mt.action_type, sm.restaurant_id, sm.status as meal_status, mt.one_time_code
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

            // Check restaurant match
            if (String(transaction.restaurant_id) !== String(restaurant_id)) {
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

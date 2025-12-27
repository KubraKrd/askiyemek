const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'suspended_meals.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    // Restaurants (Added owner_id)
    db.run(`CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,
        district_id INTEGER,
        name TEXT NOT NULL,
        image_url TEXT,
        city TEXT, 
        district TEXT,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (owner_id) REFERENCES users(id)
    )`);

    // Users (Added 'Restaurant' role and 'restaurant_id' for Staff)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        role TEXT CHECK(role IN ('Admin', 'Donor', 'Recipient', 'Staff', 'Restaurant')) NOT NULL,
        password_hash TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    )`);

    // Meal Types
    db.run(`CREATE TABLE IF NOT EXISTS meal_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        image_url TEXT,
        is_available INTEGER DEFAULT 1,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    )`);

    // Suspended Meals
    db.run(`CREATE TABLE IF NOT EXISTS suspended_meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER NOT NULL,
        donor_id INTEGER,
        meal_type_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        status TEXT CHECK(status IN ('Active', 'Used', 'Expired', 'Cancelled')) DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
        FOREIGN KEY (donor_id) REFERENCES users(id),
        FOREIGN KEY (meal_type_id) REFERENCES meal_types(id)
    )`);

    // Meal Transactions
    db.run(`CREATE TABLE IF NOT EXISTS meal_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        suspended_meal_id INTEGER NOT NULL,
        staff_id INTEGER,
        recipient_id INTEGER,
        action_type TEXT CHECK(action_type IN ('Created', 'Used', 'Expired', 'Cancelled')) NOT NULL,
        one_time_code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (suspended_meal_id) REFERENCES suspended_meals(id),
        FOREIGN KEY (staff_id) REFERENCES users(id),
        FOREIGN KEY (recipient_id) REFERENCES users(id)
    )`);

    // Admin Account Seed (Optional)
    const bcrypt = require('bcrypt');
    const hash = bcrypt.hashSync('admin123', 10);
    db.get("SELECT * FROM users WHERE email = 'admin@askida.com'", (err, row) => {
        if (!row) {
            const stmt = db.prepare("INSERT INTO users (full_name, email, role, password_hash) VALUES (?, ?, ?, ?)");
            stmt.run('System Admin', 'admin@askida.com', 'Admin', hash);
            stmt.finalize();
        }
    });
});

module.exports = db;

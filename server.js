const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { sql } = require('@vercel/postgres');
const { put } = require('@vercel/blob');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nakhonfit_super_secret_key_123';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the root directory
app.use(express.static(__dirname));

// Route for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Multer Setup for Image Uploads (Using Memory for Blob)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Database Initialization (Create tables if not exist)
async function initDb() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id BIGSERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user'
            );
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS gyms (
                id SERIAL PRIMARY KEY,
                name JSONB NOT NULL,
                lat DOUBLE PRECISION,
                lng DOUBLE PRECISION,
                price JSONB,
                website TEXT,
                updated_date TEXT,
                image_url TEXT,
                tags JSONB,
                contact TEXT,
                description JSONB,
                rating DOUBLE PRECISION DEFAULT 5.0,
                reviews_count INTEGER DEFAULT 0,
                verified BOOLEAN DEFAULT FALSE,
                plans JSONB,
                amenities JSONB,
                reviews JSONB,
                address JSONB,
                opening_hours JSONB,
                location TEXT
            );
        `;
        console.log('Database initialized');
    } catch (e) {
        console.error('Db Init Error:', e);
    }
}
initDb();

// --- API ENDPOINTS ---

// Register
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await sql`INSERT INTO users (username, password, role) VALUES (${username}, ${hashedPassword}, 'user')`;
        res.json({ message: 'User registered successfully' });
    } catch (e) {
        if (e.code === '23505') return res.status(400).json({ error: 'Username already exists' });
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`;
        const user = rows[0];

        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 24 * 60 * 60 * 1000 });
        res.json({ message: 'Login successful', role: user.role });
    } catch (e) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Admin Middleware
const requireAdmin = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Check Auth Status
app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ user: null });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ user: decoded });
    } catch (e) {
        res.json({ user: null });
    }
});

// List all gyms
app.get('/api/admin/gyms', async (req, res) => {
    try {
        const { rows } = await sql`SELECT * FROM gyms ORDER BY id DESC`;
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch gyms' });
    }
});

// Public: Get Map Data (data.json replacement)
app.get('/data/data.json', async (req, res) => {
    try {
        const { rows } = await sql`SELECT id, name, lat, lng, price, website, updated_date, image_url, tags, contact FROM gyms`;
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: 'Error' });
    }
});

// Public: Get Homepage Data (datahomepage.json replacement)
app.get('/data/datahomepage.json', async (req, res) => {
    try {
        const { rows } = await sql`SELECT id, name, price, location, rating, image_url, lat, lng FROM gyms LIMIT 6`;
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: 'Error' });
    }
});

// Public: Get Specific Gym Detail (gym-details.json replacement)
app.get('/data/gym-details.json', async (req, res) => {
    try {
        const { rows } = await sql`SELECT * FROM gyms`;
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: 'Error' });
    }
});

// Delete a gym
app.delete('/api/admin/gyms/:id', requireAdmin, async (req, res) => {
    try {
        await sql`DELETE FROM gyms WHERE id = ${req.params.id}`;
        res.json({ message: 'Gym deleted successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Add New Gym
app.post('/api/admin/gyms', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { 
            nameEn, nameTh, nameCn, 
            descEn, descTh, descCn, 
            addressEn, addressTh, addressCn,
            priceEn, priceTh, priceCn,
            lat, lng, website, contact, location
        } = req.body;

        // Default image if upload fails or is missing
        let imageUrl = 'https://placehold.co/600x400?text=Gym';
        
        if (req.file) {
            try {
                const blob = await put(`gyms/${Date.now()}-${req.file.originalname}`, req.file.buffer, {
                    access: 'public',
                });
                imageUrl = blob.url;
            } catch (blobError) {
                console.error('Blob Upload Error:', blobError);
                // Continue with default image if blob fails, or handle as error
            }
        }

        const name = { en: nameEn || '', th: nameTh || '', cn: nameCn || '' };
        const price = { en: priceEn || '฿0', th: priceTh || '฿0', cn: priceCn || '0泰铢' };
        const description = { en: descEn || '', th: descTh || '', cn: descCn || '' };
        const address = { en: addressEn || '', th: addressTh || '', cn: addressCn || '' };
        const opening_hours = {
            status: { en: "Open", th: "เปิด", cn: "营业中" },
            days: [{ day: { en: "Mon - Sun", th: "จันทร์ - อาทิตย์", cn: "周一至周日" }, time: "08:00 - 22:00" }]
        };

        // Ensure lat/lng are valid numbers
        const latitude = parseFloat(lat) || 13.8;
        const longitude = parseFloat(lng) || 100.0;

        await sql`
            INSERT INTO gyms (
                name, lat, lng, price, website, updated_date, image_url, 
                tags, contact, description, address, opening_hours, location,
                rating, reviews_count, verified
            ) VALUES (
                ${name}, ${latitude}, ${longitude}, ${price}, 
                ${website || ''}, ${new Date().toISOString().split('T')[0]}, ${imageUrl}, 
                ${["cardio", "weight"]}, ${contact || ''}, ${description},
                ${address}, ${opening_hours}, ${location || ''},
                5.0, 0, true
            )
        `;

        res.json({ message: 'Gym added successfully!' });
    } catch (error) {
        console.error('Database/Server Error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Migration Tool (Run once to import JSON data to DB)
app.get('/api/migrate', async (req, res) => {
    try {
        // 1. Migrate Gyms
        const gymsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'gym-details.json'), 'utf8'));
        const homepageData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'data.json'), 'utf8'));

        for (const g of gymsData) {
            const extra = homepageData.find(h => h.id === g.id) || {};
            await sql`
                INSERT INTO gyms (
                    id, name, lat, lng, price, website, updated_date, image_url, 
                    tags, contact, description, rating, reviews_count, verified,
                    plans, amenities, reviews, address, opening_hours, location
                ) VALUES (
                    ${g.id}, ${JSON.stringify(extra.name || {})}, ${extra.lat || 0}, ${extra.lng || 0}, 
                    ${JSON.stringify(extra.price || {})}, ${extra.website || ''}, ${extra.updated_date || ''}, 
                    ${g.image_url}, ${JSON.stringify(extra.tags || [])}, ${extra.contact || ''},
                    ${JSON.stringify(g.description)}, ${g.rating}, ${g.reviews_count}, ${g.verified},
                    ${JSON.stringify(g.plans)}, ${JSON.stringify(g.amenities)}, ${JSON.stringify(g.reviews)},
                    ${JSON.stringify(g.address)}, ${JSON.stringify(g.opening_hours)}, ${extra.location || ''}
                ) ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    lat = EXCLUDED.lat,
                    lng = EXCLUDED.lng,
                    price = EXCLUDED.price,
                    image_url = EXCLUDED.image_url,
                    description = EXCLUDED.description,
                    plans = EXCLUDED.plans,
                    amenities = EXCLUDED.amenities;
            `;
        }

        // 2. Migrate Users
        const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
        for (const u of usersData) {
            await sql`
                INSERT INTO users (username, password, role) 
                VALUES (${u.username}, ${u.password}, ${u.role})
                ON CONFLICT (username) DO NOTHING
            `;
        }

        res.json({ message: 'Migration complete! Gyms and Users imported.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Only listen locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

module.exports = app;

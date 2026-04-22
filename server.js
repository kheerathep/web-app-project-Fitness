const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'nakhonfit_super_secret_key_123'; // In a real app, use .env

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

// Helper to read JSON files
const readJson = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

// Helper to write JSON files
const writeJson = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const usersFile = path.join(__dirname, 'data', 'users.json');
const dataFile = path.join(__dirname, 'data', 'data.json');
const homepageFile = path.join(__dirname, 'data', 'datahomepage.json');
const gymsFile = path.join(__dirname, 'data', 'gym-details.json');

// Ensure files exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

[usersFile, gymsFile, dataFile, homepageFile].forEach(file => {
    if (!fs.existsSync(file)) {
        writeJson(file, []);
    }
});

// Multer Setup for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'imagegymdetail');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, 'imagegymdetail/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// --- API ENDPOINTS ---

// Register (Default to 'user' role)
app.post('/api/auth/register', async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    let users = readJson(usersFile);
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Registration always defaults to 'user'. Admin must be set manually in users.json.
    const userRole = 'user';
    
    users.push({ id: Date.now(), username, password: hashedPassword, role: userRole });
    writeJson(usersFile, users);

    res.json({ message: 'User registered successfully' });
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readJson(usersFile);
    const user = users.find(u => u.username === username);

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.json({ message: 'Login successful', role: user.role });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Auth Middleware Check
const requireAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

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

// List all gyms (Admin only)
app.get('/api/admin/gyms', requireAdmin, (req, res) => {
    const gyms = readJson(dataFile);
    res.json(gyms);
});

// Delete a gym (Admin only)
app.delete('/api/admin/gyms/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    
    // Remove from data.json
    let data = readJson(dataFile);
    data = data.filter(g => g.id !== id);
    writeJson(dataFile, data);

    // Remove from gym-details.json
    let details = readJson(gymsFile);
    details = details.filter(g => g.id !== id);
    writeJson(gymsFile, details);

    // Remove from datahomepage.json
    let homepage = readJson(homepageFile);
    homepage = homepage.filter(g => g.id !== id);
    writeJson(homepageFile, homepage);

    res.json({ message: 'Gym deleted successfully' });
});

// Add New Gym Information (Requires Admin)
app.post('/api/admin/gyms', requireAdmin, upload.single('image'), (req, res) => {
    try {
        const { 
            nameEn, nameTh, nameCn, 
            descEn, descTh, descCn, 
            addressEn, addressTh, addressCn,
            priceEn, priceTh, priceCn,
            lat, lng, website, contact,
            location // for homepage
        } = req.body;

        const gymsDetails = readJson(gymsFile);
        const gymsData = readJson(dataFile);
        const gymsHomepage = readJson(homepageFile);

        const newId = gymsDetails.length > 0 ? Math.max(...gymsDetails.map(g => g.id || 0)) + 1 : 1;
        const imageUrl = req.file ? 'imagegymdetail/' + req.file.filename : 'imagegymdetail/placeholder.jpg';

        // 1. Update gym-details.json
        const newGymDetail = {
            id: newId,
            description: { en: descEn || '', th: descTh || '', cn: descCn || '' },
            rating: 5.0,
            reviews_count: 0,
            verified: true,
            plans: [
                {
                    name: { en: "Monthly", th: "รายเดือน", cn: "月度会员" },
                    price: { en: priceEn || '฿0', th: priceTh || '฿0', cn: priceCn || '0泰铢' },
                    perks: [{ en: "Full gym access", th: "เข้าใช้ยิมได้เต็มรูปแบบ", cn: "完全健身房通行证" }]
                }
            ],
            amenities: [{ icon: "fitness_center", name: { en: "Standard Equipment", th: "อุปกรณ์มาตรฐาน", cn: "标准设备" } }],
            reviews: { breakdown: { "5_star": 0, "4_star": 0, "3_star": 0, "2_star": 0, "1_star": 0 } },
            address: { en: addressEn || '', th: addressTh || '', cn: addressCn || '' },
            opening_hours: {
                status: { en: "Open", th: "เปิด", cn: "营业中" },
                days: [{ day: { en: "Mon - Sun", th: "จันทร์ - อาทิตย์", cn: "周一至周日" }, time: "08:00 - 22:00" }]
            },
            image_url: imageUrl
        };

        // 2. Update data.json
        const newGymData = {
            id: newId,
            name: { en: nameEn, th: nameTh, cn: nameCn },
            lat: parseFloat(lat) || 13.8,
            lng: parseFloat(lng) || 100.0,
            price: { th: priceTh, en: priceEn, cn: priceCn },
            website: website || '',
            updated_date: new Date().toISOString().split('T')[0],
            image_url: imageUrl,
            tags: ["cardio", "weight", "aircon"],
            contact: contact || '-'
        };

        // 3. Update datahomepage.json (Optional: as it usually only has 3 items)
        const newGymHomepage = {
            id: newId,
            name: { th: nameTh, en: nameEn, cn: nameCn },
            price: { th: priceTh, en: priceEn, cn: priceCn },
            location: location || "Muang, Nakhon Pathom",
            rating: "5.0",
            image_url: imageUrl,
            lat: parseFloat(lat) || 13.8,
            lng: parseFloat(lng) || 100.0
        };

        gymsDetails.push(newGymDetail);
        gymsData.push(newGymData);
        // Only keep top 3 on homepage if you want, but I'll add it normally here
        gymsHomepage.push(newGymHomepage);

        writeJson(gymsFile, gymsDetails);
        writeJson(dataFile, gymsData);
        writeJson(homepageFile, gymsHomepage);

        res.json({ message: 'Gym added successfully!', gym: newGymData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error adding gym' });
    }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

module.exports = app;

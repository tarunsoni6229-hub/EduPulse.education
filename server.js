const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'edupulse_secret_key_2024';
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from root

// Initialize Database if not exists
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        admins: [],
        students: [],
        settings: { school_name: "EduPulse International" }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// Helper: Read DB
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
// Helper: Write DB
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// --- API Endpoints ---

// 1. Generate Admin Credentials (for initial setup or by superadmin)
app.post('/api/admin/generate', async (req, res) => {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const db = readDB();
    const existingAdmin = db.admins.find(a => a.email === email);
    
    if (existingAdmin) {
        return res.status(400).json({ message: "Admin with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = {
        id: Date.now(),
        name: name || "Admin",
        email: email,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString()
    };

    db.admins.push(newAdmin);
    writeDB(db);

    res.status(201).json({ 
        message: "Admin credentials generated successfully",
        admin: { email: newAdmin.email, name: newAdmin.name }
    });
});

// 2. Admin Login
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    const db = readDB();
    
    const admin = db.admins.find(a => a.email === email);
    if (!admin) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: admin.id, role: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
    
    res.json({
        message: "Login successful",
        token: token,
        admin: { name: admin.name, email: admin.email }
    });
});

// 3. Get Dashboard Stats (Protected)
app.get('/api/admin/stats', (req, res) => {
    const db = readDB();
    res.json({
        totalStudents: db.students.length,
        totalAdmins: db.admins.length,
        recentActivity: [
            { id: 1, action: "Admin logged in", time: "Just now" },
            { id: 2, action: "Database backup completed", time: "2 hours ago" }
        ]
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin Login available at http://localhost:${PORT}/admin-login.html`);
});

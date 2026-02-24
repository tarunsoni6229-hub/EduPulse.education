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

// 3. Student Registration (Create Account)
app.post('/api/student/register', async (req, res) => {
    const { name, email, password, phone, studentId } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Required fields missing" });
    }

    const db = readDB();
    const existingStudent = db.students.find(s => s.email === email);
    if (existingStudent) {
        return res.status(400).json({ message: "Account already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = {
        id: Date.now(),
        name,
        email,
        phone,
        studentId,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };

    db.students.push(newStudent);
    writeDB(db);

    const token = jwt.sign({ id: newStudent.id, role: 'student' }, SECRET_KEY, { expiresIn: '2h' });

    res.status(201).json({ 
        message: "Account created successfully",
        token: token,
        student: { name: newStudent.name, email: newStudent.email, studentId: newStudent.studentId }
    });
});

// 4. Student Login
app.post('/api/student/login', async (req, res) => {
    const { email, password } = req.body;
    const db = readDB();

    const student = db.students.find(s => s.email === email);
    if (!student) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: student.id, role: 'student' }, SECRET_KEY, { expiresIn: '2h' });

    res.json({
        message: "Login successful",
        token: token,
        student: { name: student.name, email: student.email, studentId: student.studentId }
    });
});

// 5. Google Login (Simulated)
app.post('/api/student/google-login', async (req, res) => {
    const { email, name, googleId, picture } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const db = readDB();
    let student = db.students.find(s => s.email === email);

    if (!student) {
        // Create new student if they don't exist (Google Signup)
        student = {
            id: Date.now(),
            name: name || "Google User",
            email: email,
            googleId: googleId,
            picture: picture,
            studentId: 'G' + Math.floor(100000 + Math.random() * 900000), // Generate a student ID
            createdAt: new Date().toISOString()
        };
        db.students.push(student);
        writeDB(db);
    }

    const token = jwt.sign({ id: student.id, role: 'student' }, SECRET_KEY, { expiresIn: '2h' });

    res.json({
        message: "Google Login successful",
        token: token,
        student: { name: student.name, email: student.email, studentId: student.studentId }
    });
});

// 6. Get Dashboard Stats (Protected)
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

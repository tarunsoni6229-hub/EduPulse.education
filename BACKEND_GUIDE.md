# EduPulse SMS - Backend Setup

This project includes a Node.js/Express backend to handle Admin authentication and credential generation.

## Prerequisites
- Node.js installed on your system.
- `npm` (Package Manager).

## How to Start the Backend
1. Open terminal in the project directory.
2. Install dependencies (if you have npm):
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. Access the Administration portal at:
   `http://localhost:5000/admin-login.html`

## Features Included
- **Admin Credential Generation**: You can create new admin accounts via the "Generate Master Credentials" link on the login page.
- **Secure Authentication**: Passwords are hashed using `bcrypt` and sessions are managed via `JWT (JSON Web Tokens)`.
- **Database**: Uses `database.json` to persist data without needing a separate SQL setup.

## Admin Dashboard
The admin dashboard is specifically themed in **Orange/Red** to differentiate it from the student portal and provides high-level system metrics.

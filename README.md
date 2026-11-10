# Rosterly – Smart Roster Management System

> **Smarter Scheduling. Better Workforce.**

Rosterly is a full-stack workforce scheduling and management application built as part of the **Datastraw Technologies AI + Tech Internship Assignment**.

The application helps operations teams manage employees, brands, processes, pods, shifts, leave requests, working rules, and scheduling conflicts from a single dashboard.

## 🚀 Live Demo

🌐 **Live Application:** https://rosterly-ctkl.vercel.app/

The live application includes authentication. New users can create an account using **Sign Up**, while existing users can use **Sign In** to access the workspace.

---

## ✨ Key Features

### 📊 Dashboard
- Workforce overview and employee statistics
- Staffing and coverage information
- Today's roster and leave overview
- Recent activity and operational insights

### 📅 Smart Scheduling
- Employee-wise roster management
- Create and manage shifts
- Generate rosters based on workforce requirements
- Identify coverage gaps and scheduling conflicts

### 👥 Workforce Management
- Manage employees and their assignments
- Organize employees by **Brands, Processes and Pods**
- Track active and inactive employees

### 📝 Leave Management
- Create and manage leave requests
- Support for different leave types
- Prevent scheduling conflicts with approved leave

### ⚙️ Working Rules
- Configure working days
- Weekly working-hour limits
- Maximum shift duration
- Minimum rest periods
- Break requirements and overtime settings

### ⚠️ Conflict Detection
- Detect scheduling overlaps
- Identify leave clashes
- Monitor working-hour limits
- Highlight staffing and coverage issues

### 📈 Reports & Settings
- Workforce and roster reporting
- Organization and roster configuration
- Application settings management

### 🔐 Authentication
- User Sign Up
- Secure Sign In
- Password hashing using bcrypt
- JWT-based authentication

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT + bcrypt |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Cloud Database | Neon PostgreSQL |

---

## 🏗️ Application Architecture

```text
                    ┌──────────────────┐
                    │      User        │
                    └────────┬─────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │   React Frontend         │
              │       (Vercel)           │
              └────────────┬─────────────┘
                           │ API Requests
                           ▼
              ┌──────────────────────────┐
              │  Node.js + Express API   │
              │        (Render)          │
              └────────────┬─────────────┘
                           │ Prisma ORM
                           ▼
              ┌──────────────────────────┐
              │   PostgreSQL Database    │
              │         (Neon)           │
              └──────────────────────────┘
```

---

## 📂 Project Structure

```text
rosterly/
│
├── src/                     # React frontend source code
│   ├── components/
│   ├── context/
│   ├── pages/
│   └── utils/
│
├── public/
│
├── server/                  # Backend application
│   ├── prisma/              # Prisma schema and migrations
│   ├── src/                 # Express API and server logic
│   └── package.json
│
├── package.json
└── README.md
```

---

## ⚙️ Local Installation

### Prerequisites

Make sure you have the following installed:

- Node.js 18 or later
- PostgreSQL database

### 1. Clone the Repository

```bash
git clone https://github.com/shiwangi0322/Rosterly.git
cd Rosterly
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `server` folder and add the required environment variables:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=12h
PORT=4000
```

### 5. Set Up the Database

From the `server` folder:

```bash
npx prisma generate
npx prisma migrate deploy
```

### 6. Start the Backend

```bash
npm run dev
```

### 7. Start the Frontend

Open another terminal from the project root:

```bash
npm run dev
```

---

## 🌐 Deployment

The application is deployed as a full-stack application:

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend API | Render |
| Database | Neon PostgreSQL |

### Live Application

🚀 **https://rosterly-ctkl.vercel.app/**

---

## 🔒 Security

- Passwords are securely hashed using **bcrypt**
- Authentication uses **JWT tokens**
- Sensitive environment variables are stored outside the repository
- Database credentials are not committed to GitHub

---

## 👩‍💻 Author

**Shiwangi Pandey**

Built as part of the **Datastraw Technologies AI + Tech Internship Assignment**.

---

⭐ If you found this project interesting, feel free to explore the live application and repository.
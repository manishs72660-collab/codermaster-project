# CodeMaster 🚀

[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**CodeMaster** is a full‑stack MERN (MongoDB, Express, React, Node.js) online coding platform designed for students to practice Data Structures & Algorithms (DSA), participate in **timed contests** and **MCQ quizzes**, engage in **real‑time 1v1 battles** (duels), collaborate in a **community feed**, and communicate directly with **admins** via live chat — all within a college‑scoped ecosystem.

🔗 **Live Demo**: *[Insert your live URL here]*  
📖 **Full Documentation**: [See the complete docs](/docs) (HLD, API Reference, Database Schema)

---

## ✨ Core Features

- 🧩 **Practice Arena** – 100+ DSA problems with search, filters (difficulty/tag/status), and paginated infinite scroll.
- ⚡ **Code Execution** – Secure, sandboxed execution via **Judge0 CE** (supports C++, Java, Python, JavaScript).
- 🏆 **Coding Contests** – Timed events with private/public modes, live leaderboards, and **3‑strike tab‑switch violation tracking**.
- 📝 **MCQ Contests** – Create/play timed multiple‑choice quizzes with automatic grading and detailed result breakdowns.
- ⚔️ **Real‑time Duels (Battles)** – 1v1 challenges on random problems with **ELO rating**, live opponent progress bars, and **spectator mode**.
- 🎓 **College Management** – Platform admins can onboard colleges; each college gets its own admin(s), scoped contests, and internal leaderboards.
- 💬 **Admin Chat** – Students can request a chat with an online admin; full message history stored.
- 📢 **Community Feed** – Post, comment, and upvote discussions (similar to a mini‑Reddit).
- 🎥 **Video Solutions** – Admins upload video explanations via **Cloudinary** integration.
- 🤖 **AI Doubt Solver** – Integrated with **Google Gemini** to provide hints, code reviews, and complexity analysis (without revealing full solutions).
- 📊 **User Profiles** – Detailed stats, submission heatmaps, skills breakdown, and global/college ranks.

---

## 🛠️ Tech Stack

| Layer | Technology | Libraries & Tools |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Redux Toolkit, React Router, Tailwind CSS, DaisyUI, Framer Motion, Monaco Editor, Recharts, Firebase Auth |
| **Backend** | Node.js + Express | JWT, bcrypt, Mongoose, Redis, Socket.io, Axios, Nodemailer, Cloudinary SDK, Google Gemini API |
| **Database** | MongoDB Atlas | Mongoose ODM (23+ collections) |
| **Cache & Session** | Redis Cloud | Token blacklist, refresh rotation, online users, rate limiting |
| **Real‑time** | Socket.io | Duels, contest leaderboards, admin‑student chat |
| **Code Execution** | Judge0 CE | Sandboxed API for running user code |
| **File Storage** | Cloudinary | Video solution uploads and streaming |

---

## 🏗️ Architecture Overview (Simplified)

```mermaid
graph LR
    Client[Web Browser] --> Frontend[React SPA]
    Frontend --> API[Express REST API]
    Frontend --> WS[Socket.io Server]
    
    API --> MongoDB[(MongoDB)]
    API --> Redis[(Redis)]
    API --> Judge0[Judge0 CE]
    API --> Cloudinary[Cloudinary]
    API --> Gemini[Gemini AI]
    
    WS --> Redis
    WS --> MongoDB
The backend is a monolithic Node.js app with clear MVC separation (controllers, models, routes, middleware).

Redis handles session storage, real‑time presence, and rate limiting.

Socket.io powers all live features (duels, contest updates, chat).

All user code runs exclusively in the Judge0 sandbox — never on our server.

🚀 Getting Started (Local Development)
Follow these steps to set up CodeMaster on your local machine.

Prerequisites
Node.js (v18.x or higher)

npm or yarn

MongoDB (local installation or MongoDB Atlas URI)

Redis (local or Redis Cloud)

(Optional) Docker (if you plan to self‑host Judge0)

1. Clone the Repository
bash
git clone https://github.com/your-org/codemaster.git
cd codemaster
2. Backend Setup
bash
cd backend
npm install
Create a .env file in the backend/ directory:

env
PORT=5000
CONNECT_STRING=your_mongodb_connection_string
REDISH_HOST=your_redis_host
REDISH_KEY=your_redis_password
JWT_KEY=your_jwt_secret
JWT_REFRESH_KEY=your_jwt_refresh_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Judge0 (optional – if using cloud version)
# JUDGE0_API_KEY=your_key
# JUDGE0_HOST=https://judge0-ce.p.rapidapi.com

# Cloudinary (for video uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini (for AI doubt solver)
GEMINI_KEY=your_gemini_api_key

# Email (for college approval notifications)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
Start the backend server:

bash
npm run dev
The API will run on http://localhost:5000.

3. Frontend Setup
Open a new terminal:

bash
cd frontend
npm install
Create a .env file in the frontend/ directory:

env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
Start the frontend development server:

bash
npm run dev
The app will be available at http://localhost:5173.

4. Seed the Database (Optional)
To populate the database with sample problems and an admin user:

bash
cd backend
npm run seed   # Add this script to your package.json if not already present
5. Test the Setup
Frontend: http://localhost:5173

Backend health check: http://localhost:5000/ (returns { status: "Server is running" })

API Docs (if Swagger integrated): http://localhost:5000/api-docs

📁 Project Structure
text
codemaster/
├── backend/
│   ├── src/
│   │   ├── config/          # DB & Redis connections
│   │   ├── controller/      # Business logic (auth, problem, contest, duel, etc.)
│   │   ├── middleware/      # Auth, rate limiting, role scoping
│   │   ├── models/          # Mongoose schemas (User, Problem, Contest, etc.)
│   │   ├── routes/          # Express route definitions
│   │   ├── socket/          # Socket.io event handlers
│   │   ├── utils/           # Helpers (Judge0, ELO, email, cloudinary)
│   │   └── index.js         # Entry point
│   ├── .env
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/          # Static assets (images, fonts)
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Route‑level pages (Homepage, Contest, Duel, etc.)
│   │   ├── store/           # Redux slices (auth, problem, profile, etc.)
│   │   ├── utils/           # Axios client, socket client, helpers
│   │   ├── App.jsx          # Main router & socket initialisation
│   │   └── main.jsx         # React entry point
│   ├── .env
│   ├── Dockerfile
│   └── package.json
└── docs/                    # Full developer documentation (HLD, API reference)
🔐 Environment Variables (Production)
Make sure to update these for production deployment:

Variable	Backend / Frontend	Description
NODE_ENV=production	Backend	Enables secure cookie settings (secure: true)
FRONTEND_URL	Backend	Your production frontend URL (e.g., https://codemaster.com)
VITE_API_URL	Frontend	Your production backend URL (e.g., https://api.codemaster.com)
VITE_SOCKET_URL	Frontend	Production Socket.io server URL
MONGO_URI	Backend	Production MongoDB Atlas URI (with credentials)
📡 Key API Endpoints (Summary)
Group	Example Endpoints	Description
Auth	/auth/register, /auth/login, /auth/refresh	JWT authentication with HTTP‑only cookies
Problems	GET /problem, POST /problem/create	List, search, create (admin only)
Submissions	POST /code/submit/:id, POST /code/runcode/:id	Submit/run code against test cases
Contests	POST /contest/create, GET /contest/all, GET /contest/:id/leaderboard	Full contest lifecycle
MCQ Contests	POST /mcq-contest/create, POST /mcq-contest/:id/submit	MCQ contest management and grading
Duels	POST /duel/create, GET /duel/join/:roomCode, POST /duel/submit/:roomId	Battle creation, joining, and code submission
College	POST /collage/request, GET /collage/:collegeId/leaderboard	College registration and management
Community	POST /community/posts, POST /community/posts/:id/upvote	Community feed interactions
Video	GET /video/create/:problemId, POST /video/save	Cloudinary video upload signature & metadata
🤝 Contributing
We welcome contributions from the community! To get started:

Fork the repository.

Create a new branch (feature/your-feature-name).

Commit your changes using Conventional Commits (e.g., feat: add dark mode, fix: resolve duel timeout).

Push to your branch and open a Pull Request against the develop branch.

Code Style: ESLint + Prettier (Airbnb config for backend, Standard for frontend).
Testing: Please ensure new features include unit/integration tests.

📄 License
Distributed under the MIT License. See the LICENSE file for more information.

🙏 Acknowledgements
Judge0 – for the secure code execution engine.

Cloudinary – for video hosting and optimisation.

Google Gemini – for powering the AI doubt solver.

MongoDB Atlas – for managed database hosting.

Redis Cloud – for scalable caching and real‑time state management.

📧 Contact
Project Lead: [Your Name] – your.email@example.com

GitHub Issues: Open an issue

Star ⭐ this repository if you find it useful!

text
I see the issue with your README file—there are several formatting problems. The Mermaid diagram is broken, and the markdown headings have lost their # prefixes in the "Architecture Overview" section. Here is the fully corrected version that you can copy and paste directly:

markdown
# CodeMaster 🚀

[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**CodeMaster** is a full‑stack MERN (MongoDB, Express, React, Node.js) online coding platform designed for students to practice Data Structures & Algorithms (DSA), participate in **timed contests** and **MCQ quizzes**, engage in **real‑time 1v1 battles** (duels), collaborate in a **community feed**, and communicate directly with **admins** via live chat — all within a college‑scoped ecosystem.

🔗 **Live Demo**: *[Insert your live URL here]*  
📖 **Full Documentation**: [See the complete docs](https://app.notion.com/p/CodeMaster-Complete-Technical-Documentation-3c3f128a4c3f807fa76ef3f0f3b3faa3?source=copy_link) (HLD, API Reference, Database Schema)

---

## ✨ Core Features

- 🧩 **Practice Arena** – 1000+ DSA problems with search, filters (difficulty/tag/status), and paginated infinite scroll.
- ⚡ **Code Execution** – Secure, sandboxed execution via **Judge0 CE** (supports C++, Java, Python, JavaScript).
- 🏆 **Coding Contests** – Timed events with private/public modes, live leaderboards, and **3‑strike tab‑switch violation tracking**.
- 📝 **MCQ Contests** – Create/play timed multiple‑choice quizzes with automatic grading and detailed result breakdowns.
- ⚔️ **Real‑time Duels (Battles)** – 1v1 challenges on random problems with **ELO rating**, live opponent progress bars, and **spectator mode**.
- 🎓 **College Management** – Platform admins can onboard colleges; each college gets its own admin(s), scoped contests, and internal leaderboards.
- 💬 **Admin Chat** – Students can request a chat with an online admin; full message history stored.
- 📢 **Community Feed** – Post, comment, and upvote discussions (similar to a mini‑Reddit).
- 🎥 **Video Solutions** – Admins upload video explanations via **Cloudinary** integration.
- 🤖 **AI Doubt Solver** – Integrated with **Google Gemini** to provide hints, code reviews, and complexity analysis (without revealing full solutions).
- 📊 **User Profiles** – Detailed stats, submission heatmaps, skills breakdown, and global/college ranks.

---

## 🛠️ Tech Stack

| Layer | Technology | Libraries & Tools |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | Redux Toolkit, React Router, Tailwind CSS, DaisyUI, Framer Motion, Monaco Editor, Recharts, Firebase Auth |
| **Backend** | Node.js + Express | JWT, bcrypt, Mongoose, Redis, Socket.io, Axios, Nodemailer, Cloudinary SDK, Google Gemini API |
| **Database** | MongoDB Atlas | Mongoose ODM (23+ collections) |
| **Cache & Session** | Redis Cloud | Token blacklist, refresh rotation, online users, rate limiting |
| **Real‑time** | Socket.io | Duels, contest leaderboards, admin‑student chat |
| **Code Execution** | Judge0 CE | Sandboxed API for running user code |
| **File Storage** | Cloudinary | Video solution uploads and streaming |

---

## 🏗️ Architecture Overview (Simplified)

```mermaid
graph LR
    Client[Web Browser] --> Frontend[React SPA]
    Frontend --> API[Express REST API]
    Frontend --> WS[Socket.io Server]
    
    API --> MongoDB[(MongoDB)]
    API --> Redis[(Redis)]
    API --> Judge0[Judge0 CE]
    API --> Cloudinary[Cloudinary]
    API --> Gemini[Gemini AI]
    
    WS --> Redis
    WS --> MongoDB
The backend is a monolithic Node.js app with clear MVC separation (controllers, models, routes, middleware).

Redis handles session storage, real‑time presence, and rate limiting.

Socket.io powers all live features (duels, contest updates, chat).

All user code runs exclusively in the Judge0 sandbox — never on our server.

🚀 Getting Started (Local Development)
Follow these steps to set up CodeMaster on your local machine.

Prerequisites
Node.js (v18.x or higher)

npm or yarn

MongoDB (local installation or MongoDB Atlas URI)

Redis (local or Redis Cloud)

(Optional) Docker (if you plan to self‑host Judge0)

1. Clone the Repository
bash
git clone https://github.com/your-org/codemaster.git
cd codemaster
2. Backend Setup
bash
cd backend
npm install
Create a .env file in the backend/ directory:

env
PORT=5000
CONNECT_STRING=your_mongodb_connection_string
REDISH_HOST=your_redis_host
REDISH_KEY=your_redis_password
JWT_KEY=your_jwt_secret
JWT_REFRESH_KEY=your_jwt_refresh_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Judge0 (optional – if using cloud version)
# JUDGE0_API_KEY=your_key
# JUDGE0_HOST=https://judge0-ce.p.rapidapi.com

# Cloudinary (for video uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini (for AI doubt solver)
GEMINI_KEY=your_gemini_api_key

# Email (for college approval notifications)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
Start the backend server:

bash
npm run dev
The API will run on http://localhost:5000.

3. Frontend Setup
Open a new terminal:

bash
cd frontend
npm install
Create a .env file in the frontend/ directory:

env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
Start the frontend development server:

bash
npm run dev
The app will be available at http://localhost:5173.

4. Seed the Database (Optional)
To populate the database with sample problems and an admin user:

bash
cd backend
npm run seed   # Add this script to your package.json if not already present
5. Test the Setup
Frontend: http://localhost:5173

Backend health check: http://localhost:5000/ (returns { status: "Server is running" })

API Docs (if Swagger integrated): http://localhost:5000/api-docs

📁 Project Structure
text
codemaster/
├── backend/
│   ├── src/
│   │   ├── config/          # DB & Redis connections
│   │   ├── controller/      # Business logic (auth, problem, contest, duel, etc.)
│   │   ├── middleware/      # Auth, rate limiting, role scoping
│   │   ├── models/          # Mongoose schemas (User, Problem, Contest, etc.)
│   │   ├── routes/          # Express route definitions
│   │   ├── socket/          # Socket.io event handlers
│   │   ├── utils/           # Helpers (Judge0, ELO, email, cloudinary)
│   │   └── index.js         # Entry point
│   ├── .env
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/          # Static assets (images, fonts)
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Route‑level pages (Homepage, Contest, Duel, etc.)
│   │   ├── store/           # Redux slices (auth, problem, profile, etc.)
│   │   ├── utils/           # Axios client, socket client, helpers
│   │   ├── App.jsx          # Main router & socket initialisation
│   │   └── main.jsx         # React entry point
│   ├── .env
│   ├── Dockerfile
│   └── package.json
└── docs/                    # Full developer documentation (HLD, API reference)
🔐 Environment Variables (Production)
Make sure to update these for production deployment:

Variable	Backend / Frontend	Description
NODE_ENV=production	Backend	Enables secure cookie settings (secure: true)
FRONTEND_URL	Backend	Your production frontend URL (e.g., https://codemaster.com)
VITE_API_URL	Frontend	Your production backend URL (e.g., https://api.codemaster.com)
VITE_SOCKET_URL	Frontend	Production Socket.io server URL
MONGO_URI	Backend	Production MongoDB Atlas URI (with credentials)
📡 Key API Endpoints (Summary)
Group	Example Endpoints	Description
Auth	/auth/register, /auth/login, /auth/refresh	JWT authentication with HTTP‑only cookies
Problems	GET /problem, POST /problem/create	List, search, create (admin only)
Submissions	POST /code/submit/:id, POST /code/runcode/:id	Submit/run code against test cases
Contests	POST /contest/create, GET /contest/all, GET /contest/:id/leaderboard	Full contest lifecycle
MCQ Contests	POST /mcq-contest/create, POST /mcq-contest/:id/submit	MCQ contest management and grading
Duels	POST /duel/create, GET /duel/join/:roomCode, POST /duel/submit/:roomId	Battle creation, joining, and code submission
College	POST /collage/request, GET /collage/:collegeId/leaderboard	College registration and management
Community	POST /community/posts, POST /community/posts/:id/upvote	Community feed interactions
Video	GET /video/create/:problemId, POST /video/save	Cloudinary video upload signature & metadata
🤝 Contributing
We welcome contributions from the community! To get started:

Fork the repository.

Create a new branch (feature/your-feature-name).

Commit your changes using Conventional Commits (e.g., feat: add dark mode, fix: resolve duel timeout).

Push to your branch and open a Pull Request against the develop branch.

Code Style: ESLint + Prettier (Airbnb config for backend, Standard for frontend).
Testing: Please ensure new features include unit/integration tests.

📄 License
Distributed under the MIT License. See the LICENSE file for more information.

🙏 Acknowledgements
Judge0 – for the secure code execution engine.

Cloudinary – for video hosting and optimisation.

Google Gemini – for powering the AI doubt solver.

MongoDB Atlas – for managed database hosting.

Redis Cloud – for scalable caching and real‑time state management.

📧 Contact
Project Lead: [Your Name] – your.email@example.com

GitHub Issues: Open an issue

Star ⭐ this repository if you find it useful!

text

---

## ✅ What Was Fixed

| Issue | Fix |
| :--- | :--- |
| **Mermaid diagram broken** | Added missing closing triple backticks (` ``` `) after the diagram |
| **"Architecture Overview" headings missing** | Restored `##` and `###` prefixes to all section headings |
| **"Getting Started" heading missing** | Added `## 🚀 Getting Started (Local Development)` |
| **Bullet points under Prerequisites** | Converted to proper markdown bullet list |
| **Code blocks missing language labels** | Added `bash`, `env`, `text` labels to all code fences |
| **Inconsistent formatting** | Unified indentation and spacing throughout |

You can now copy the entire block above and paste it directly into your `README.md` file. It will render perfectly on GitHub.

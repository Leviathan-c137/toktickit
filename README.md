# TokTickIT - IT Service Desk Application

TokTickIT is an IT service desk application for managing Account & Access, Hardware, Software, and Network requests.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Bootstrap 5
- **Backend**: Node.js + Express + TypeScript
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Testing**: Vitest & Supertest

## Prerequisites

- **Node.js**: v18 or later
- **PostgreSQL**: v14 or later running on `localhost:5432`

## Getting Started

### 1. Database Setup

Ensure PostgreSQL is running and create the user and database:
```sql
CREATE USER toktickit WITH LOGIN PASSWORD 'toktickit' SUPERUSER;
CREATE DATABASE toktickit OWNER toktickit;
```

### 2. Environment Configuration

Copy the example environment files for both client and server:

```bash
# Server environment file
cp server/.env.example server/.env

# Client environment file
cp client/.env.example client/.env
```

Default configuration in `server/.env`:
```env
DATABASE_URL="postgresql://toktickit:toktickit@127.0.0.1:5432/toktickit?schema=public"
PORT=3000
```

Default configuration in `client/.env`:
```env
VITE_API_URL="http://localhost:3000"
```

### 3. Installation & Database Preparation

Install dependencies for both client and server:

```bash
# Install frontend dependencies
cd client && npm install

# Install backend dependencies
cd ../server && npm install

# Generate Prisma Client
npx prisma generate
```

### 4. Running the Development Servers

Start backend server:
```bash
cd server
npm run dev
```

Start frontend client:
```bash
cd client
npm run dev
```

### 5. Running Tests

Run frontend unit tests:
```bash
cd client
npm test
```

Run backend integration tests:
```bash
cd server
npm test
```

## Branch Strategy & Git Flow

- `main`: Production-stable release branch.
- `lab1-staging`: Integration branch for Lab 1.
- `feature/*`: Short-lived feature branches targeting `lab1-staging` via Pull Requests.
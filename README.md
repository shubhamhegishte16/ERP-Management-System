# WorkPulse

WorkPulse is an employee management, productivity tracking, and project assignment system built with React, Node.js, MongoDB, and Electron.

It includes:
- a `frontend` web application for admin, manager, and employee panels
- a `backend` API with MongoDB
- an optional `desktop` Electron tracker for activity capture

## Project Structure

```text
ERP-System-Tracker-main/
|-- backend/    Express API, auth, MongoDB models, controllers, routes
|-- frontend/   React web application
|-- desktop/    Electron desktop activity tracker
|-- README.md
`-- .gitignore
```

## Tech Stack

- Frontend: React, React Router, Axios, Chart.js, Recharts
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Authentication: JWT, bcryptjs
- Desktop App: Electron
- Realtime/Tracking: Socket.IO

## Main Roles

### Admin

- logs in using the permanent admin account
- views the admin panel
- sees managers and registered employees in the `Employee` section
- can assign projects and tasks
- can delete users from the employee list

### Manager

- logs in using a permanent manager account
- views the manager panel
- sees registered employees in the `Employee` section
- can assign projects and tasks to employees

### Employee

- registers using the registration form
- logs in with the registered email and password
- sees assigned projects, assigned tasks, attendance, and personal dashboard data

## Current Workflow

### 1. Employee Registration

Employees register through the web app with these fields:

- Name
- Email
- Password
- Manager
- Department
- Registration Date

Admin and manager accounts are permanent and are not created from the registration page.

### 2. Login

The login page includes a role dropdown:

- Admin
- Manager
- Employee

The selected role must match the role stored for that account in MongoDB.

### 3. User Visibility

- Admin `Employee` section shows:
  - all managers
  - all registered employees
- Manager `Employee` section shows:
  - only registered employees

### 4. Project Assignment

- Admin can assign projects to managers and employees
- Manager can assign projects to employees
- Assigned projects appear in the employee panel

### 5. Task Assignment

- Admin can assign tasks to managers and employees
- Manager can assign tasks to employees
- Assigned tasks appear in the employee task panel

### 6. Desktop Tracker

The desktop app is optional. It can be used for local activity tracking and sending activity records to the backend.

## Default Accounts

### Admin

- Email: `admin@workpulse.com`
- Password: `admin123`

### Managers

- `shubham@gmail.com`
- `vinaya@gmail.com`
- `rushan@gmail.com`

Manager password for all three accounts:

- `manager123`

## Prerequisites

Before running the project, install:

- Node.js
- MongoDB Community Server
- MongoDB Compass (optional)

This project currently expects local MongoDB by default:

```env
MONGO_URI=mongodb://localhost:27017/workpulse
```

Important:
- MongoDB Compass is only a client UI
- Compass alone is not enough
- MongoDB Server must be installed and running

## Environment Setup

The backend reads configuration from [backend/.env](C:/Users/SHUBHAM/Downloads/ERP-System-Tracker-main/ERP-System-Tracker-main/backend/.env).

Current local setup:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/workpulse
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

## How To Start MongoDB On Windows

Open PowerShell and run:

```powershell
Start-Service MongoDB
```

Check status:

```powershell
Get-Service MongoDB
```

Restart if needed:

```powershell
Restart-Service MongoDB
```

## How To Run The Project

Use 2 or 3 terminals.

### Step 1. Start MongoDB

```powershell
Start-Service MongoDB
```

### Step 2. Start Backend

```powershell
cd C:\Users\SHUBHAM\Downloads\ERP-System-Tracker-main\ERP-System-Tracker-main\backend
npm.cmd install
npm.cmd start
```

Expected result:
- backend runs on `http://localhost:5000`
- MongoDB connects successfully

### Step 3. Start Frontend

```powershell
cd C:\Users\SHUBHAM\Downloads\ERP-System-Tracker-main\ERP-System-Tracker-main\frontend
npm.cmd install
npm.cmd start
```

Expected result:
- frontend runs on `http://localhost:3000`

### Step 4. Start Desktop App (Optional)

```powershell
cd C:\Users\SHUBHAM\Downloads\ERP-System-Tracker-main\ERP-System-Tracker-main\desktop
npm.cmd install
npm.cmd start
```

Expected result:
- Electron app opens

## Recommended Start Order

1. Start MongoDB
2. Start backend
3. Start frontend
4. Open the web app in the browser
5. Start desktop only if activity tracking is needed

## Important Windows Note

On Windows PowerShell, `npm` may be blocked by execution policy. If that happens, use:

```powershell
npm.cmd install
npm.cmd start
```

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/managers`
- `GET /api/auth/me`
- `PUT /api/auth/password`

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

### Activity

- `POST /api/activity`
- `GET /api/activity/me`
- `GET /api/activity/hourly/:id`
- `GET /api/activity/team`

### Analytics

- `GET /api/analytics/me`
- `GET /api/analytics/team`
- `GET /api/analytics/summary`
- `GET /api/analytics/heatmap/:id`

### Admin

- `GET /api/admin/stats`
- `DELETE /api/admin/users/:id`

## Common Problems And Fixes

### Backend Port Already In Use

Error:

```text
EADDRINUSE: address already in use :::5000
```

Meaning:
- another backend process is already running on port `5000`

Fix:
- stop the old backend terminal
- then start backend again

### Frontend Port Already In Use

If frontend says port `3000` is already in use:

- another React app or old frontend instance is already running
- close the old process or terminal first

### Invalid Email Or Password

Check:
- backend is running
- MongoDB is running
- the selected role matches the account role
- you are using the correct default credentials

### MongoDB Connection Error

Check:
- MongoDB service is running
- `MONGO_URI` is correct in `backend/.env`
- local MongoDB is listening on port `27017`

### Frontend Loads But API Fails

Check:
- backend is running on port `5000`
- frontend is running on port `3000`
- frontend proxy points to `http://localhost:5000`
- `CLIENT_URL=http://localhost:3000` is set in backend `.env`

## Notes About The Current Project

- employee registration is enabled
- admin and manager accounts are permanent
- tasks are stored inside projects
- deleting a project also removes its tasks
- attendance pages do not use the clock widget now
- the desktop app is optional and not required for the main web app to work

## Suggested Git Commit Message

If you want a clean commit message for the current update, use:

```text
Update README with setup, run steps, roles, and project workflow
```

# Product Requirements Document

## Product Name
WorkPulse

## Version
Current-state PRD based on the implementation in this repository as of April 13, 2026.

## 1. Product Overview
WorkPulse is an employee productivity and project tracking platform for small to mid-sized teams. It combines:

- a web application for admins, managers, and employees
- a backend API for authentication, projects, activity, and analytics
- an optional Electron desktop tracker that captures active application usage and sends activity logs to the backend

The product is designed to help organizations assign work, monitor team activity, measure productivity trends, and give employees visibility into their own performance data.

## 2. Problem Statement
Teams often manage projects, tasks, employee assignments, and productivity data across disconnected tools. Managers lack a single place to:

- assign projects and tasks
- see who is active today
- identify burnout or inactivity signals
- review employee productivity patterns

Employees also need a simple way to:

- view assigned work
- track task progress
- review their personal activity and productivity summaries

## 3. Goals

### Business Goals
- Provide a single internal system for workforce tracking and work assignment.
- Improve visibility into employee productivity and task execution.
- Help managers detect burnout risk and unusual inactivity early.
- Reduce manual reporting through automated desktop activity logging.

### User Goals
- Admins want visibility across all users and projects.
- Managers want to assign work and monitor team performance.
- Employees want to understand their assignments, activity, and productivity score.

## 4. Target Users

### Admin
- Has full platform visibility.
- Can view all managers and employees.
- Can create projects and assign them to managers/employees.
- Can assign tasks.
- Can delete users.

### Manager
- Oversees employees.
- Can create projects for employees.
- Can assign tasks and track project progress.
- Can monitor team productivity, anomalies, and burnout alerts.

### Employee
- Registers through the app.
- Logs in to access assigned projects, tasks, attendance, and personal analytics.
- Optionally runs the desktop tracker to capture activity automatically.

## 5. Product Scope

### In Scope
- Role-based login for admin, manager, and employee.
- Employee self-registration.
- Project creation and team assignment.
- Task creation and Kanban-style status movement.
- Employee activity logging from a desktop tracker.
- Daily productivity calculation and reporting.
- Team-level analytics for managers/admins.
- Basic attendance view in the frontend.

### Out of Scope
- Payroll, billing, and compensation workflows.
- Leave management and approvals.
- Advanced HRIS integrations.
- Mobile apps.
- Formal time-sheet approvals.
- Deep permission customization beyond role-based access.

## 6. Core User Flows

### Employee Registration
1. Employee opens the registration form.
2. Employee enters name, email, password, manager, department, and registration date.
3. System creates an employee account.
4. Employee can immediately authenticate using the web app.

### Login
1. User selects a role on the login screen.
2. User enters email and password.
3. System validates credentials and role match.
4. User is routed to the role-specific dashboard.

### Project Assignment
1. Admin or manager opens the Projects page.
2. User creates a project with name, description, end date, manager, and team members.
3. System saves the project and makes it visible to assigned users.

### Task Management
1. Admin or manager opens the Kanban board.
2. User creates a task and assigns it to an employee.
3. Tasks appear inside the associated project.
4. Managers/admins can drag tasks across workflow stages.
5. Employees can view only tasks assigned to them.

### Activity Tracking
1. Employee signs into the desktop tracker using the same WorkPulse account.
2. Tracker monitors the active application/window on the device.
3. Tracker categorizes activity such as coding, browsing, docs, communication, meeting, design, idle, or other.
4. Tracker periodically sends activity sessions to the backend.
5. Backend recalculates daily productivity metrics.

### Analytics Review
1. Employee opens the personal dashboard to review score, active hours, top apps, and recent activity.
2. Manager/admin opens team dashboards to review productivity scores, active users, anomalies, and burnout alerts.

## 7. Functional Requirements

### Authentication and Access Control
- The system must support login with JWT-based authentication.
- The system must support three roles: `admin`, `manager`, and `employee`.
- The selected login role must match the stored role for that account.
- The system must expose a `me` endpoint for restoring authenticated sessions.

### User Management
- The system must allow employee self-registration.
- The system must provide a list of managers for employee registration.
- The system must store department, manager, registration date, and active status for users.
- Admin must be able to delete users from the platform.
- Default admin and manager accounts must exist through backend seeding.

### Projects
- Admin and manager users must be able to create projects.
- Admin must be able to assign a project to a selected manager.
- Managers must be able to assign projects to employees.
- Employees must only see projects where they are part of the team.
- Projects must support status values `active`, `completed`, and `onhold`.

### Tasks
- Tasks must be stored within projects.
- Tasks must support assignee, estimated hours, logged hours, and status.
- Supported persisted task statuses are `todo`, `inprogress`, and `done`.
- Managers/admins must be able to add and delete tasks.
- Managers/admins must be able to update task status by moving tasks on the Kanban board.
- Employees must only see tasks assigned to them.

### Activity Tracking
- The desktop app must allow login against the backend API.
- The desktop tracker must capture active window/app usage at a regular polling interval.
- The tracker must detect idle state and log idle sessions.
- The tracker must support pause/resume controls.
- The tracker must support privacy mode, masking app/window details before upload.
- The tracker must upload session metadata including app name, category, duration, device, platform, and tracker version.

### Productivity Analytics
- The backend must aggregate daily activity into a productivity record per user per day.
- Productivity score must be capped at 100.
- The system must calculate total active time, idle time, focus score, burnout risk, anomaly flag, and top apps.
- The employee dashboard must show 7-day productivity trend and current-day activity summary.
- The manager/admin dashboard must show team productivity overview and burnout/anomaly insights.

### Attendance
- The frontend must provide an attendance page and attendance summary widgets.
- Current implementation may rely on demo/local storage data instead of backend-backed attendance records.

## 8. Non-Functional Requirements
- The web app should be responsive and usable on standard desktop screen sizes.
- API responses should be JSON-based and role-aware.
- The backend should apply rate limiting to `/api` routes.
- Activity logging should tolerate intermittent sync failures and preserve tracker state locally.
- Sensitive auth state in the desktop app should persist locally for returning users.
- The platform should support local development with MongoDB running on `mongodb://localhost:27017/workpulse`.

## 9. Success Metrics
- Number of active users logging in weekly.
- Percentage of employees with at least one tracked activity session per day.
- Number of projects and tasks created per team.
- Reduction in untracked employee work time.
- Manager adoption of analytics dashboard views.
- Number of burnout/anomaly alerts reviewed by managers.

## 10. Current UX Surfaces

### Web App
- Login and registration
- Admin dashboard
- Manager dashboard
- Employee dashboard
- Projects
- Tasks/Kanban
- Attendance
- Activity
- Profile and privacy pages

### Desktop App
- Sign-in and API configuration
- Pause/resume tracking
- Privacy mode toggle
- Live status for current session and last sync
- System tray controls

## 11. Key Constraints and Observations
- Attendance appears to be mocked in the frontend and is not yet a true backend attendance module.
- Task workflow UI shows a `review` column, but persisted backend task statuses currently support only `todo`, `inprogress`, and `done`.
- Some analytics endpoints summarize all active users, so manager-level visibility may currently be broader than strict team-only scoping.
- The desktop tracker is optional, but many analytics features are most valuable only when it is running.
- The product currently assumes seeded default admin/manager accounts plus employee self-registration.

## 12. Risks
- Privacy concerns around desktop activity tracking if expectations and controls are unclear.
- Trust issues if productivity scoring is used without transparent definitions.
- Incomplete attendance implementation may create confusion if presented as production-ready.
- Role scoping gaps could expose more team data than intended.
- Desktop tracking dependency may reduce analytics quality if employees do not keep the tracker running.

## 13. Recommended Next Product Iterations
- Replace demo attendance with backend-backed attendance records and APIs.
- Add stricter team-level authorization for manager views.
- Standardize task workflow states between UI and backend.
- Add notifications for new assignments, overdue tasks, and anomaly alerts.
- Add filters by date range, employee, and department across analytics.
- Add audit logs for admin actions such as deletion and reassignment.
- Add reporting exports for managers/admins.

## 14. MVP Definition
The current repository already represents an MVP with these core outcomes:

- employees can register and log in
- admins/managers can create projects and assign tasks
- employees can view their work
- the desktop tracker can send activity logs
- the platform can compute and display productivity analytics

The next milestone should focus on turning partial/demo modules into production-ready features, especially attendance, permissions, and reporting consistency.

# 🎫 SupportSphere — Ticketing / Helpdesk System (Fully Working SaaS Demo)

SupportSphere is a **premium SaaS-style Helpdesk / Ticketing Platform** built as a **fully working end-to-end system** (no placeholders).  
It includes real authentication, role-based access control, full ticket workflow, SLA timers, automation rules, notifications, knowledge base, admin analytics, audit logs, exports, and much more.

>🔑 Demo Accounts (Seeded)

Use any of the seeded demo accounts:

Admin

Email: admin@gmail.com

Password: 123456

Agent

Email: agent@gmail.com

Password: 123456

User

Email: user@gmail.com

Password: 123456

(You can also create new accounts using Register.)

## ✅ Key Highlights (No Placeholders)

✅ Every button works  
✅ Every route exists  
✅ Full CRUD for all admin modules  
✅ Full ticket lifecycle + audit trail + notifications  
✅ Persistent demo database (LocalStorage / mock backend)  
✅ Fully responsive UI  
✅ English / Japanese UI toggle  
✅ Dark mode toggle  
✅ Export + reports work

---

## 🧑‍💼 Roles & Access Control (RBAC)

SupportSphere includes **real Role-Based Access Control** with protected routes.

### Roles
- **Requester / User**
- **Support Agent**
- **Admin**

### Access Rules
| Role | Can Access |
|------|------------|
| User | User dashboard + tickets + KB |
| Agent | Agent dashboard + ticket queue + ticket tools |
| Admin | Everything (full system control) |

Unauthorized access redirects to:
- Login page (if not logged in)
- Access Denied page (if logged in but no permission)

---

## 🔐 Authentication (Fully Working)

Includes real auth flows:
- ✅ Register (with role selection for demo)
- ✅ Login
- ✅ Logout
- ✅ Forgot Password (demo token generator)
- ✅ Reset Password (token verification)
- ✅ Session persistence (stay logged in after refresh)

All users are stored in the demo persistent data store.

---

## 🎟 Ticket Lifecycle Workflow (Complete)

### Supported Statuses
- Open
- Assigned
- In Progress
- Waiting on User
- On Hold
- Escalated
- Resolved
- Closed
- Reopened
- Cancelled
- Duplicate (Merged)

### Status Transition Logic (Real)
Every ticket change:
✅ updates ticket record  
✅ updates dashboards instantly  
✅ writes an **audit log entry**  
✅ triggers **notifications** to relevant roles

Example workflow:
1. User creates ticket → **Open**
2. Agent assigns → **Assigned**
3. Agent works → **In Progress**
4. Need user info → **Waiting on User**
5. Escalate if required → **Escalated**
6. Agent resolves → **Resolved**
7. User closes → **Closed**
8. User may reopen → **Reopened**
9. Agent can mark duplicate + merge → **Duplicate**

---

## 🧭 Pages & Features (All Implemented)

### 🌍 Public Pages
- ✅ Landing Page with CTA → Login/Register
- ✅ Login/Register/Forgot/Reset Password

---

### 👤 User Features
✅ **User Dashboard**
- stats cards (computed from ticket dataset)
- create ticket CTA

✅ **My Tickets**
- full table with:
  - search
  - filter
  - sort
  - pagination

✅ **Create Ticket**
- form fields:
  - title
  - category
  - description (rich-text style input)
  - priority
  - tags
  - preferred contact time
  - attachment upload (preview + download)
- creates ticket + toast success

✅ **Ticket Detail (User)**
- ticket summary
- SLA countdown timers
- conversation thread (reply works)
- upload attachments to messages
- close/reopen ticket
- rating + feedback after resolution

---

### 🧑‍💻 Agent Features
✅ **Agent Dashboard**
- ticket queue tabs:
  - Unassigned
  - Assigned to me
  - High priority
  - Waiting on user
  - Resolved
- filters/search/sort/pagination
- assignment actions work

✅ **Ticket Detail (Agent)**
- reply works (user gets notified)
- internal notes (private)
- change status
- change priority
- assign agent/team
- mark duplicate + merge
- escalation flow
- SLA breach warnings display

✅ Bulk actions (agent/admin lists)
- bulk assign
- bulk close
- bulk change status
- bulk tag
- bulk priority update

---

### 🛡 Admin Features
✅ **Admin Dashboard**
- analytics widgets computed from real ticket dataset
- charts from actual ticket data
- leaderboard based on agent performance metrics

✅ **Admin Management (CRUD)**
- Users CRUD (block/unblock)
- Agents CRUD
- Teams CRUD
- Categories CRUD
- Tags CRUD
- Business hours settings (works)

✅ **Knowledge Base**
- browse + search articles (users/agents)
- admin can create/edit/delete articles

✅ **Automation Rules Engine (Real)**
Admin can create automation rules that run on ticket events:
- on create
- on status change
- on priority change

Examples included:
- If priority = Urgent → auto assign Senior team
- If category = Payment → auto tag “billing”
- If no agent reply in X mins → notify + escalate
- If resolved & no user response in X days → auto close

✅ **Reports + Export**
- export tickets CSV (filters affect export)
- monthly report screen
- downloadable report mock (JSON/pdf-like output)

✅ **Audit Logs**
- every action writes a log entry
- searchable logs table
- filter by action/user/ticket

---

## 🔔 Notifications System (Working)

Includes:
- ✅ notification bell dropdown
- ✅ unread badge counter
- ✅ mark read
- ✅ notifications list page
- ✅ toasts for key actions

Notification events supported:
- ticket created
- assigned
- reply received
- status updated
- SLA reminder
- SLA breach warning
- escalated
- resolved
- closed

---

## ⏱ SLA Timer + Breach Logic (Working)

SLA policies:

| Priority | Respond Due | Resolve Due |
|---------|-------------|-------------|
| Urgent  | 15 mins     | 2 hrs       |
| High    | 1 hr        | 8 hrs       |
| Medium  | 8 hrs       | 24 hrs      |
| Low     | 24 hrs      | 72 hrs      |

Each ticket tracks:
- SLA response due
- SLA resolve due

Countdown timers display in Ticket Detail.  
On breach:
✅ ticket gets SLA breach flag  
✅ admin notified  
✅ escalation automation rule can auto-trigger

---

## 🔎 Global Search (Working)

Global search supports:
- ticket ID (ex: `SS-1001`)
- ticket title
- user name
- tags
- KB articles

---

## 📎 File Attachments (Working)

- upload attachments to tickets + messages
- image preview supported
- store metadata persistently in demo storage
- download/open supported

---

## 💾 Data Layer + Persistence

SupportSphere uses a persistent demo data layer:
- LocalStorage based store OR mock backend service
- data persists after refresh
- includes seeded demo dataset:
  - multiple users
  - multiple agents
  - categories/tags/teams
  - tickets in all statuses

---

## 🎨 UI / UX Features

- ✅ SaaS-grade bento dashboards
- ✅ animated status pills
- ✅ ticket timeline component
- ✅ elegant empty states with working actions
- ✅ skeleton loaders
- ✅ **dark mode toggle (working)**
- ✅ **multi-language toggle English/Japanese (working)**

---

## ✅ End-to-End Validation Flow

Test flow you can run:
1. Register as User → create ticket
2. Login as Agent → assign ticket → reply → resolve
3. Login as User → close ticket → submit feedback
4. Login as Admin → view analytics, logs, exports

Everything updates instantly in UI and persists after refresh.

---

## 🛠 Tech Stack

- React + TypeScript
- TailwindCSS (UI, dark mode)
- LocalStorage / mock backend service (persistence)
- Component-based dashboard layout
- Role-based protected routing

---

## 🚀 Getting Started

### 1) Install dependencies

npm install

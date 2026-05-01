# Gig Platform (Backend + Frontend)

A concise guide to this repository: a Django backend and a Vite + React frontend.

## Project overview

- `gig_platform_backend/`: Django backend (APIs, models, serializersm, migrations, admin).
- `gig_platfrom_frontend/`: Vite + React frontend (UI, components, API client).

## Repo structure (top-level)

- `gig_platform_backend/`
  - `manage.py` — Django management entrypoint
  - `requirements.txt` — Python dependencies
  - `config/` — Django project settings, ASGI/WSGI, urls
  - `accounts/`, `services/`, `ratings/` — app modules with models, views, serializers
- `gig_platfrom_frontend/`
  - `package.json` — frontend dependencies & scripts
  - `src/` — React app source (components, pages, API helpers)

## Prerequisites

- Python 3.11 and pip
- Node 22LTS and npm (or yarn/pnpm)
- (Optional) PostgreSQL or other DB if you configure production settings

## Quickstart — Backend (local development)

1. Open a terminal and navigate to `gig_platform_backend`:

cd gig_platform_backend

2. Create and activate a virtual environment:

Windows:
python -m venv .venv
.venv\Scripts\activate  # cmd.exe

Mac:
python3 -m venv .venv
source .venv/bin/activate

3. Install Python dependencies:

python -m pip install -r requirements.txt


4. Configure environment variables (example using `.env` or your shell):

- `DJANGO_SETTINGS_MODULE=config.settings` (the default manage.py should already point to the right settings)
- `SECRET_KEY`, `DATABASE_URL` see .env.example in backend

5. Apply database migrations and create a superuser:

python manage.py migrate
python manage.py createsuperuser

6. Run the development server:

python manage.py runserver

By default Django will serve on `http://127.0.0.1:8000/`.

## Quickstart — Frontend (local development)

1. Open a terminal and navigate to `gig_platfrom_frontend`:

cd gig_platfrom_frontend

2. Install node dependencies:

npm install

3. Start the dev server (Vite):

npm run dev

The frontend dev server typically runs at `http://localhost:5173/` — it will proxy or call the backend API at the configured API base URL in `src/api`.
see src/api/axios.js :to use the actual backend url 

# Gig Worker Platform Frontend

A React-based frontend for the gig worker platform, built with Vite, Tailwind CSS, and React Router.

## Table of Contents

- [Setup](#setup)
- [Project Structure](#project-structure)
- [Features](#features)
- [API Integration](#api-integration)
- [Testing Checklist](#testing-checklist)

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running at `http://127.0.0.1:8000`

### Installation

```bash
# Navigate to project directory
cd gig_worker_frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Variables

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Project Structure

```
gig_worker_frontend/
├── public/
├── src/
│   ├── api/                    # API layer
│   │   ├── axios.js            # Axios instance with interceptors
│   │   ├── authService.js      # Authentication API
│   │   ├── accountsService.js  # Accounts API
│   │   ├── servicesService.js  # Services API
│   │   ├── ratingsService.js   # Ratings API
│   │   └── index.js
│   ├── components/
│   │   ├── common/             # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorAlert.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── StarRating.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── SuccessAlert.jsx
│   │   │   ├── TextArea.jsx
│   │   │   └── index.js
│   │   └── layout/             # Layout components
│   │       ├── Layout.jsx
│   │       ├── Navbar.jsx
│   │       ├── ProtectedRoute.jsx
│   │       └── index.js
│   ├── context/
│   │   ├── AuthContext.jsx     # Authentication context
│   │   └── index.js
│   ├── hooks/
│   │   ├── useApi.js           # Custom hooks
│   │   └── index.js
│   ├── pages/
│   │   ├── public/             # Public pages
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── index.js
│   │   ├── customer/           # Customer pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SearchWorkers.jsx
│   │   │   ├── CreateRequest.jsx
│   │   │   ├── MyRequests.jsx
│   │   │   ├── SubmitReview.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── WorkerReviews.jsx
│   │   │   └── index.js
│   │   ├── worker/             # Worker pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── BecomeWorker.jsx
│   │   │   ├── UploadDocument.jsx
│   │   │   ├── Availability.jsx
│   │   │   ├── Inbox.jsx
│   │   │   ├── AssignedJobs.jsx
│   │   │   └── index.js
│   │   └── admin/              # Admin pages
│   │       ├── Dashboard.jsx
│   │       ├── PendingWorkers.jsx
│   │       ├── VerifyDocuments.jsx
│   │       └── index.js
│   ├── utils/
│   │   ├── helpers.js          # Utility functions
│   │   └── index.js
│   ├── App.jsx                 # Main app with routing
│   ├── main.jsx                # Entry point
│   └── index.css               # Tailwind CSS
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Features

### Authentication

- JWT-based authentication with access/refresh tokens
- Automatic token refresh on 401 errors
- Protected routes based on role

### Customer Features

- View dashboard with recent requests
- Search for workers by category and radius
- Create service requests
- View all service requests with status
- Submit reviews for completed services
- View worker leaderboard and reviews

### Worker Features

- Register as a worker (become-worker)
- Upload verification documents
- Set availability status (Active/Inactive/Busy)
- View job inbox (broadcast requests)
- Accept/reject job requests
- Update job status (ARRIVING, IN_PROGRESS, COMPLETED, CANCELLED)

### Admin Features

- View admin dashboard with stats
- List and verify pending workers
- Verify worker documents

## API Integration

### Base URL

```
http://127.0.0.1:8000
```

### Endpoints Used

#### Auth

- `POST /api/token/` - Login
- `POST /api/token/refresh/` - Refresh token

#### Accounts

- `POST /accounts/register/` - Register
- `GET /accounts/me/` - Get current user
- `GET, PATCH /accounts/profile/` - Profile management
- `POST /accounts/become-worker/` - Register as worker
- `GET, PATCH /accounts/worker/profile/` - Worker profile
- `GET /accounts/worker/documents/` - List documents
- `POST /accounts/worker/documents/upload/` - Upload document
- `PATCH /accounts/worker/availability/` - Update availability
- `GET /accounts/admin/workers/pending/` - List pending workers
- `POST /accounts/admin/workers/{id}/verify/` - Verify worker
- `POST /accounts/admin/documents/{id}/verify/` - Verify document

#### Services

- `GET /services/categories/` - List categories
- `GET /services/recommended-workers/` - Search workers
- `GET, POST /services/requests/` - Service requests
- `GET /services/worker/inbox/` - Worker inbox
- `POST /services/worker/inbox/{id}/action/` - Accept/reject
- `POST /services/requests/{id}/worker-status/` - Update status

#### Ratings

- `GET, POST /ratings/reviews/` - Reviews
- `GET /ratings/sentiments/` - Sentiments
- `GET /ratings/leaderboard/` - Leaderboard

## Testing Checklist

### Customer Flow

1. **Registration & Login**
   - [ ] Open http://localhost:5173/register
   - [ ] Fill in registration form and submit
   - [ ] Verify success message and redirect to login
   - [ ] Login with created credentials
   - [ ] Verify redirect to customer dashboard

2. **Update Profile**
   - [ ] Go to Profile page via navbar
   - [ ] Update profile fields (first name, address, coordinates)
   - [ ] Verify success message

3. **Search Workers**
   - [ ] Navigate to "Find Workers"
   - [ ] Select a service category
   - [ ] Set search radius
   - [ ] Click "Search Workers"
   - [ ] Verify workers are displayed with ratings

4. **Create Service Request**
   - [ ] Navigate to "New Request"
   - [ ] Fill in service category, description, address
   - [ ] Submit request
   - [ ] Verify success and redirect to My Requests

5. **View Requests**
   - [ ] Navigate to "My Requests"
   - [ ] Verify created request appears with PENDING status
   - [ ] Check status updates as worker accepts

6. **Submit Review (after completion)**
   - [ ] Navigate to completed request
   - [ ] Click "Leave Review"
   - [ ] Select star rating and add comment
   - [ ] Submit review

7. **View Leaderboard**
   - [ ] Navigate to "Leaderboard"
   - [ ] Verify workers are listed with rankings
   - [ ] Click "View Reviews" to see worker reviews

### Worker Flow

1. **Become Worker**
   - [ ] Register as new user
   - [ ] Navigate to /worker/become-worker
   - [ ] Fill in service category and bio
   - [ ] Submit form
   - [ ] Verify redirect to document upload

2. **Upload Document**
   - [ ] On document upload page
   - [ ] Select document type
   - [ ] Choose file to upload
   - [ ] Submit
   - [ ] Verify document appears in list with PENDING status

3. **Wait for Verification**
   - [ ] Dashboard shows "Verification Pending" alert
   - [ ] Cannot set status to ACTIVE until verified

4. **Set Availability (after admin approval)**
   - [ ] Navigate to "Availability"
   - [ ] Click on ACTIVE status
   - [ ] Verify status changes

5. **View Inbox**
   - [ ] Navigate to "Inbox"
   - [ ] When customer creates request, broadcast appears
   - [ ] Accept or decline request

6. **Update Job Status**
   - [ ] After accepting, go to "My Jobs"
   - [ ] Click status buttons in order: ARRIVING → IN_PROGRESS → COMPLETED
   - [ ] Verify status updates

### Admin Flow

1. **Login as Admin**
   - [ ] Login with admin credentials (staff/superuser account)
   - [ ] Verify redirect to admin dashboard

2. **Review Pending Workers**
   - [ ] Navigate to "Pending Workers"
   - [ ] View worker details
   - [ ] Click "Approve" or "Reject"
   - [ ] Verify worker is removed from pending list

3. **Verify Documents**
   - [ ] Navigate to "Documents"
   - [ ] View document details
   - [ ] Click "Approve" or "Reject"
   - [ ] Verify document status updates

### Edge Cases

- [ ] Verify 404 page for unknown routes
- [ ] Verify logout clears tokens and redirects
- [ ] Verify protected routes redirect to login when not authenticated
- [ ] Verify role-based routing (customer can't access worker pages)
- [ ] Verify error messages display for failed API calls
- [ ] Test on mobile viewport for responsive design

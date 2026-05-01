# Gig Platform Backend
A Django-based backend for the gig worker platform, providing authentication, accounts, services, and ratings APIs.

## Table of Contents

- [Setup](#setup)
- [Project Structure](#project-structure)
- [Features](#features)

## Table of Contents Frontend

- [Setup](#setupfr)
- [Project Structure](#project-structurefr)
- [Features](#featuresfr)

## Setup

### Prerequisites

- Python 3.10+ and pip
- A virtual environment tool such as `venv`
- Node.js 18+ only if you also want to run the frontend locally

### Installation

```powershell
# Navigate to the backend project directory
cd gig_platform_backend

#Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate

#mac
python3 -m venv .venv
.venv/bin/activate

# Install backend dependencies
python -m pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create an admin user
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

The backend will be available at `http://127.0.0.1:8000`.

### Environment Variables

Use your `.env` file for any required settings check `.env.example`
## Project Structure

```
gig_platform_backend/
├── manage.py                  # Django management entrypoint
├── requirements.txt           # Python dependencies
├── api.http                   # Example API requests
├── config/                    # Project settings, URLs, ASGI/WSGI
├── accounts/                  # Authentication and profile management
├── services/                  # Service categories, requests, routing
├── ratings/                   # Reviews, sentiment, rankings
├── templates/                 # Django templates
└── static/                    # Static assets
```

### Core Apps

- `accounts/`: user accounts, profiles, worker verification, permissions
- `services/`: service requests, categories, worker dispatch flows
- `ratings/`: reviews, sentiment analysis, and recommendation scores

### Base URL

```text
http://127.0.0.1:8000
```

#### Accounts

- `POST /accounts/register/` - Register a new user
- `GET /accounts/me/` - Get the current user
- `GET, PATCH /accounts/profile/` - Manage customer profile
- `POST /accounts/become-worker/` - Register as a worker
- `GET, PATCH /accounts/worker/profile/` - Manage worker profile

#### Services

- `GET /services/categories/` - List service categories
- `GET /services/recommended-workers/` - Search recommended workers
- `GET, POST /services/requests/` - Manage service requests
- `GET /services/worker/inbox/` - Worker inbox

#### Ratings

- `GET, POST /ratings/reviews/` - List or create reviews
- `GET /ratings/sentiments/` - Review sentiment data
- `GET /ratings/leaderboard/` - Worker leaderboard

# Gig Worker Platform Frontend
A React-based frontend for the gig worker platform, built with Vite, Tailwind CSS, and React Router.

## Setupfr
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

## Project Structurefr

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

## Featuresfr

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

### Base URL

```
http://127.0.0.1:8000
```

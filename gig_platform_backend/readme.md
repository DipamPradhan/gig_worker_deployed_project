# Gig Worker Platform (Backend)

A Django REST Framework backend for a gig worker platform where users can register, become workers, upload verification documents, and manage profiles using JWT authentication (For now).

---

## Features

### Authentication
- User registration
- JWT login and refresh tokens (SimpleJWT)

### User Module
- View logged-in user profile
- Delete own account
- User profile created automatically after registration

### Worker Module
- Become a worker (creates WorkerProfile + updates user_type)
- Upload worker documents (Citizenship, Driver License, etc.)
- Worker verification and approval can be managed using Django Admin

---

## Tech Stack
- Python 3.12
- Django 5
- Django REST Framework
- PostgreSQL (or SQLite for development)
- SimpleJWT (JWT Authentication)
- Pillow (for images)


# Technical Documentation

## Technology Stack

### Backend
- **Framework:** Ruby on Rails 7 (API Mode)
- **Language:** Ruby 3.x
- **Database:** PostgreSQL
- **Authentication:** Devise with JWT (`devise-jwt`)
- **Testing:** RSpec, FactoryBot, Faker
- **Key Gems:**
  - `rack-cors`: Cross-Origin Resource Sharing
  - `nokogiri`: HTML parsing for recipe imports
  - `httparty`: HTTP requests
  - `pundit`: Policy-based authorization

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **State Management:** React Context API (`AuthContext`)
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Testing:** Vitest, React Testing Library, jsdom
- **Icons:** Lucide React

## Deployment

### Docker Deployment
The application is fully containerized with Docker.

#### Prerequisites
- Docker & Docker Compose installed on the target machine.
- `master.key` file present in `recipe_box_api/config/` (or supplied via env var).

#### Instructions
1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/recipe-box.git
   cd recipe-box
   ```

2. **Start Services**:
   ```bash
   docker compose up -d --build
   ```
   This will start:
   - Postgres Database
   - Rails API (Port 3000)
   - React Frontend (Port 80)

3. **Initialize Database**:
   ```bash
   docker compose run api rails db:prepare
   ```

4. **Access the App**:
   Visit `http://localhost` (or your server IP).

## API Endpoints
[... truncated API table ...]

## Key Services
[... truncated services ...]

## Database Schema Highlights
[... truncated schema ...]

## Development Setup
[... truncated setup ...]

## Testing
[... truncated testing ...]

## Directory Structure
[... truncated structure ...]

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `RAILS_MASTER_KEY` | Decrypt credentials |
| `DATABASE_URL` | PostgreSQL connection (production) |
| `DEVISE_JWT_SECRET_KEY` | JWT signing key |

## Household Role System

### Overview
Recipe Box uses a **household-based role system** with thematic kitchen titles, powered by **Pundit** for authorization.

### Roles
| Role | Permission Level | Description |
|------|------------------|-------------|
| **Head Chef** | Admin/Owner | Full control. Manages members, deletes household. |
| **Sous Chef** | Editor/Member | Can add/edit recipes, plan meals. Default for new members. |
| **Line Cook** | Helper/Viewer | Read-only. Can use Cook Mode and check off items. |

### Implementation
- **Gem:** [Pundit](https://github.com/varvet/pundit) for policy-based authorization
- Roles stored in `household_members.role` as integer enum
- Each resource has a Policy class (e.g., `RecipePolicy`, `PantryItemPolicy`)
- Policies use `HouseholdMember` permission helpers:
  - `can_manage_members?` - Head Chef only
  - `can_edit_recipes?` - Head Chef + Sous Chef
  - `can_edit_pantry?` - Head Chef + Sous Chef

### Signup Flow
| Signup Type | Role Assigned | Household Action |
|-------------|---------------|------------------|
| **Create Kitchen** | Head Chef | Creates new household (automatic) |
| **Join Kitchen** | Sous Chef/Line Cook | Joins via invite code |

> **Note:** Head Chef cannot be self-assigned. Users become Head Chef only by creating a new household or being promoted by an existing Head Chef.

### Admin Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/stats` | GET | Household statistics |
| `/api/v1/admin/users` | GET | List household members |
| `/api/v1/admin/users/:id` | PUT | Change member role |
| `/api/v1/admin/users/:id` | DELETE | Remove member |

## Password Reset

### Flow
1. User requests reset via `POST /api/password` with email
2. Devise sends email with token
3. User clicks link → `/password/edit?reset_password_token=...`
4. User submits new password via `PUT /api/password`

### Environment Variables for Email
| Variable | Description |
|----------|-------------|
| `SMTP_ADDRESS` | SMTP server (default: smtp.gmail.com) |
| `SMTP_USERNAME` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `FRONTEND_URL` | Base URL for email links |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

## Console Administration

Common tasks to perform in the Rails console (`rails c`).

### Change User Role
```ruby
# Find user by email
user = User.find_by(email: 'john@example.com')

# Get their household membership
member = user.household_members.first

# Update role (options: :head_chef, :sous_chef, :line_cook)
member.update(role: :head_chef)
```

### Reset Invite Code manually
```ruby
household = Household.find_by(name: "John's Kitchen")
household.regenerate_invite_code!
puts household.invite_code
```

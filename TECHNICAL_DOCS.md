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

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

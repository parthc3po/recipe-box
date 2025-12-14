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

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Authenticate user, returns JWT |
| DELETE | `/logout` | Invalidate JWT |

### Recipes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/recipes` | List all recipes (supports `?pantry_available=true` filter) |
| GET | `/api/v1/recipes/:id` | Get single recipe with ingredients |
| POST | `/api/v1/recipes` | Create recipe |
| PATCH | `/api/v1/recipes/:id` | Update recipe |
| DELETE | `/api/v1/recipes/:id` | Delete recipe |
| POST | `/api/v1/recipes/:id/cook` | Log a cooking session |

### Recipe Imports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/recipe_imports` | Import recipe from URL |
| POST | `/api/v1/recipe_imports/parse_text` | Parse ingredient text into structured data |

### Meal Planning
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/meal_plans` | Get meal plans for date range |
| POST | `/api/v1/meal_plans` | Create meal plan |
| POST | `/api/v1/meal_plans/:id/items` | Add item to meal plan |
| PATCH | `/api/v1/meal_plans/:id/items/:item_id` | Update meal plan item |
| DELETE | `/api/v1/meal_plans/:id/items/:item_id` | Remove item from plan |
| POST | `/api/v1/meal_plans/generate` | AI-generate meal plan |

### Shopping & Pantry
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/shopping_lists` | Get shopping list items |
| POST | `/api/v1/shopping_lists/generate` | Generate from meal plan |
| PATCH | `/api/v1/shopping_lists/:id` | Update item (mark bought) |
| DELETE | `/api/v1/shopping_lists/:id` | Remove item |
| GET | `/api/v1/pantry_items` | List pantry items |
| POST | `/api/v1/pantry_items` | Add pantry item |
| PATCH | `/api/v1/pantry_items/:id` | Update pantry item |
| DELETE | `/api/v1/pantry_items/:id` | Remove pantry item |

### Household & Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/households/current` | Get current household settings |
| PATCH | `/api/v1/households/:id` | Update household settings |

### Stats & Substitutions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stats` | Get cooking analytics |
| GET | `/api/v1/substitutions?ingredient_id=X` | Get substitutions for ingredient |

## Key Services

### RecipeImportService
Parses recipe data from external URLs:
- Extracts JSON-LD structured data (preferred)
- Falls back to meta tags and CSS selectors
- Parses ingredient strings into quantity, unit, and name
- Supports Unicode fractions (½, ⅓, etc.)

### MealPlanGeneratorService
AI-powered meal plan generation:
- Filters recipes by dietary preferences
- Respects cooking time limits
- Avoids repeating recipes within the week
- Generates breakfast/lunch/dinner for 7 days

## Database Schema Highlights

### Key Tables
- `users` - Authentication with JWT (`jti` for token invalidation)
- `households` - Shared kitchen spaces with `dietary_preferences` array
- `recipes` - Core recipe data with `tags` array and `nutritional_info` JSON
- `ingredients` - Normalized ingredients with `category` for aisle sorting
- `pantry_items` - Inventory tracking with `expires_at` for expiration warnings
- `meal_plan_items` - Includes `is_leftover` flag and `original_meal_plan_item_id`
- `ingredient_substitutions` - Substitution relationships with ratio and notes

### PostgreSQL Features Used
- JSONB columns for flexible data (`nutritional_info`)
- Array columns with GIN indexes (`tags`, `dietary_preferences`)
- Full-text search ready

## Development Setup

### Prerequisites
- Ruby 3.2+
- Node.js 18+
- PostgreSQL

### Backend Setup
```bash
cd recipe_box_api
bundle install
rails db:setup
rails s
```
Server runs on `http://localhost:3000`.

### Frontend Setup
```bash
cd recipe_box_client
npm install
npm run dev
```
Application runs on `http://localhost:5173`.

## Testing

### Backend Tests (RSpec)
```bash
cd recipe_box_api
bundle exec rspec
```

Test coverage includes:
- **Services:** `RecipeImportService`, `MealPlanGeneratorService`
- **Requests:** All API endpoints
- **Models:** Validations, associations, callbacks

### Frontend Tests (Vitest)
```bash
cd recipe_box_client
npm test
```

Test coverage includes:
- **Components:** UI rendering and interactions
- **Integration:** API service mocking

## Directory Structure

### Backend (`recipe_box_api/`)
```
app/
├── controllers/api/v1/   # API controllers
├── models/               # ActiveRecord models
├── services/             # Business logic
lib/
└── tasks/                # Rake tasks (update_tags, seed_substitutions)
spec/
├── requests/             # API integration tests
├── services/             # Service unit tests
└── support/              # Test helpers
```

### Frontend (`recipe_box_client/`)
```
src/
├── components/           # Reusable UI (Layout, RecipeCard, etc.)
├── pages/                # Page views
│   ├── RecipeEditor.tsx  # Recipe create/edit with bulk import
│   ├── RecipeDetail.tsx  # Recipe view with cook mode
│   ├── MealPlanner.tsx   # Weekly planning with AI generation
│   ├── ShoppingListPage.tsx  # Aisle-sorted list with Amazon links
│   ├── PantryPage.tsx    # Inventory with expiration tracking
│   ├── StatsPage.tsx     # Cooking analytics dashboard
│   └── SettingsPage.tsx  # Dietary preferences
├── context/              # React Context (Auth)
└── services/             # API configuration
```

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

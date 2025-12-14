Rails.application.routes.draw do
  devise_for :users,
             path: 'api',
             path_names: {
               sign_in: 'login',
               sign_out: 'logout',
               registration: 'signup'
             },
             controllers: {
               sessions: 'users/sessions',
               registrations: 'users/registrations'
             }

  namespace :api do
    namespace :v1 do
      resources :recipes do
        collection do
          get :cookable
        end
      end
      resources :ingredients, only: %i[index create]
      resources :recipe_imports, only: %i[create] do
        collection do
          post :parse_text
        end
      end
      resources :pantry_items, only: %i[index create update destroy]
      resources :substitutions, only: %i[index]
      resources :stats, only: %i[index]

      # Meal Planning
      resources :meal_plans, only: %i[index] do
        collection do
          post :add_item
          post :generate
          delete 'items/:id', action: :remove_item, as: :remove_item
        end
      end

      # Shopping List
      resources :shopping_lists, only: %i[index update destroy] do
        collection do
          post :generate
        end
      end
      resources :households, only: %i[show update]
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end

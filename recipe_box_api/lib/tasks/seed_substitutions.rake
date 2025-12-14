# frozen_string_literal: true

# Seed common ingredient substitutions
SUBSTITUTIONS = [
  { ingredient: 'buttermilk', substitute: 'milk', notes: 'Add 1 tbsp lemon juice or vinegar per cup of milk', ratio: 1.0 },
  { ingredient: 'butter', substitute: 'coconut oil', notes: 'Use equal amount', ratio: 1.0 },
  { ingredient: 'butter', substitute: 'olive oil', notes: 'Use 3/4 the amount', ratio: 0.75 },
  { ingredient: 'egg', substitute: 'banana', notes: '1/4 mashed banana per egg (for baking)', ratio: 0.25 },
  { ingredient: 'egg', substitute: 'applesauce', notes: '1/4 cup per egg (for baking)', ratio: 0.25 },
  { ingredient: 'heavy cream', substitute: 'coconut cream', notes: 'Use equal amount', ratio: 1.0 },
  { ingredient: 'sour cream', substitute: 'greek yogurt', notes: 'Use equal amount', ratio: 1.0 },
  { ingredient: 'all-purpose flour', substitute: 'almond flour', notes: 'Use 1:1 ratio but add more binding agent', ratio: 1.0 },
  { ingredient: 'sugar', substitute: 'honey', notes: 'Use 3/4 the amount and reduce liquids', ratio: 0.75 },
  { ingredient: 'sugar', substitute: 'maple syrup', notes: 'Use 3/4 the amount and reduce liquids', ratio: 0.75 },
  { ingredient: 'milk', substitute: 'almond milk', notes: 'Use equal amount', ratio: 1.0 },
  { ingredient: 'milk', substitute: 'oat milk', notes: 'Use equal amount', ratio: 1.0 },
  { ingredient: 'vegetable oil', substitute: 'applesauce', notes: 'Use 1/2 the amount (for baking)', ratio: 0.5 },
  { ingredient: 'breadcrumbs', substitute: 'crushed crackers', notes: 'Use equal amount', ratio: 1.0 },
  { ingredient: 'breadcrumbs', substitute: 'rolled oats', notes: 'Pulse in food processor', ratio: 1.0 },
  { ingredient: 'cream cheese', substitute: 'greek yogurt', notes: 'Use equal amount, will be tangier', ratio: 1.0 },
  { ingredient: 'lemon juice', substitute: 'lime juice', notes: 'Use equal amount', ratio: 1.0 },
  { ingredient: 'lemon juice', substitute: 'vinegar', notes: 'Use 1/2 the amount', ratio: 0.5 },
  { ingredient: 'wine', substitute: 'grape juice', notes: 'Add splash of vinegar', ratio: 1.0 },
  { ingredient: 'beef broth', substitute: 'vegetable broth', notes: 'Use equal amount', ratio: 1.0 },
  { ingredient: 'chicken broth', substitute: 'vegetable broth', notes: 'Use equal amount', ratio: 1.0 }
].freeze

namespace :db do
  namespace :seed do
    desc 'Seed ingredient substitutions'
    task substitutions: :environment do
      puts 'Seeding ingredient substitutions...'
      
      SUBSTITUTIONS.each do |sub|
        ingredient = Ingredient.find_or_create_by!(name: sub[:ingredient])
        substitute = Ingredient.find_or_create_by!(name: sub[:substitute])
        
        IngredientSubstitution.find_or_create_by!(
          ingredient: ingredient,
          substitute_ingredient: substitute
        ) do |record|
          record.ratio = sub[:ratio]
          record.notes = sub[:notes]
        end
        
        puts "  #{sub[:ingredient]} -> #{sub[:substitute]}"
      end
      
      puts "Done! Created #{IngredientSubstitution.count} substitutions."
    end
  end
end

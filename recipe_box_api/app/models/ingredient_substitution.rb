class IngredientSubstitution < ApplicationRecord
  belongs_to :ingredient
  belongs_to :substitute_ingredient, class_name: 'Ingredient'

  validates :ingredient_id, uniqueness: { scope: :substitute_ingredient_id }
end

class RecipeIngredient < ApplicationRecord
  belongs_to :recipe, touch: true
  belongs_to :ingredient

  validates :quantity, numericality: { greater_than: 0 }, allow_nil: true
  validates :ingredient_id, uniqueness: { scope: :recipe_id }

  UNITS = %w[
    g kg mg ml l oz lb lbs tsp tbsp
    teaspoon teaspoons tablespoon tablespoons
    cup cups pint pints quart quarts gallon gallons
    piece pieces slice slices bunch bunches
    clove cloves sprig sprigs pinch pinches
    can cans jar jars packet packets bag bags handful handfuls
    cm mm inch inches fl\ oz fluid\ ounce
  ].freeze
  validates :unit, inclusion: { in: UNITS }, allow_blank: true
end

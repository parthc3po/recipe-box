class Ingredient < ApplicationRecord
  has_many :recipe_ingredients, dependent: :destroy
  has_many :recipes, through: :recipe_ingredients
  has_many :substitutions, class_name: 'IngredientSubstitution', dependent: :destroy
  has_many :substitute_ingredients, through: :substitutions

  CATEGORIES = %w[Produce Dairy Meat Pantry Spices Frozen Bakery Beverages Household Other].freeze

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validates :category, inclusion: { in: CATEGORIES }, allow_nil: true
  
  before_save :normalize_name
  before_save :assign_category, if: -> { category.blank? }

  private

  def normalize_name
    self.name = name.downcase.strip if name.present?
  end

  def assign_category
    lower_name = name.downcase
    self.category = case lower_name
    when /milk|cheese|yogurt|cream|butter|egg/ then 'Dairy'
    when /beef|chicken|pork|lamb|fish|salmon|shrimp|steak|sausage|bacon/ then 'Meat'
    when /apple|banana|carrot|onion|garlic|potato|tomato|leaf|lettuce|spinach|fruit|vegetable|herb/ then 'Produce'
    when /bread|bun|bagel|toast|bakery/ then 'Bakery'
    when /frozen|ice cream/ then 'Frozen'
    when /salt|pepper|spice|seasoning|herb|cinnamon|cumin|paprika/ then 'Spices'
    when /flour|sugar|oil|vinegar|rice|pasta|canned|sauce|bean|nut|seed/ then 'Pantry'
    when /juice|coffee|tea|soda|water|wine|beer/ then 'Beverages'
    else 'Other'
    end
  end
end

class Recipe < ApplicationRecord
  belongs_to :user

  has_many :recipe_ingredients, dependent: :destroy
  has_many :ingredients, through: :recipe_ingredients
  has_many :meal_plan_items, dependent: :destroy

  accepts_nested_attributes_for :recipe_ingredients, allow_destroy: true

  validates :title, presence: true
  validates :servings, numericality: { greater_than: 0 }, allow_nil: true
  validates :prep_time_minutes, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :cook_time_minutes, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :search, ->(query) { where('title ILIKE ?', "%#{query}%") if query.present? }

  # Finds recipes where all ingredients are present in the provided ingredient_ids list
  scope :cookable_with, ->(ingredient_ids) {
    # If no ingredients provided, return no recipes
    return none if ingredient_ids.blank?
    
    # Find recipes that have at least one ingredient NOT in the allowed list
    forbidden_recipe_ids = RecipeIngredient
                             .where.not(ingredient_id: ingredient_ids)
                             .select(:recipe_id)
                             .distinct
    
    # Return recipes that are NOT in the forbidden list
    # AND ensure the recipe actually has ingredients (optional, but good to avoid empty recipes appearing)
    where.not(id: forbidden_recipe_ids).joins(:recipe_ingredients).distinct
  }

  before_save :update_tags

  def total_time_minutes
    (prep_time_minutes || 0) + (cook_time_minutes || 0)
  end

  private

  def update_tags
    # Ensure we look at current ingredients associated
    current_categories = ingredients.loaded? ? ingredients.map(&:category) : ingredients.pluck(:category)
    current_categories = current_categories.compact.map(&:to_s)
    
    new_tags = []

    # Vegetarian: No Meat
    unless current_categories.include?('Meat')
      new_tags << 'Vegetarian'
      
      # Vegan: No Meat and No Dairy
      # (Note: This is a simplification. Honey/Eggs are handled via categories mostly)
      unless current_categories.include?('Dairy')
        new_tags << 'Vegan'
      end
    end

    # Dairy-Free
    unless current_categories.include?('Dairy')
      new_tags << 'Dairy-Free'
    end

    self.tags = new_tags.uniq
  end
end

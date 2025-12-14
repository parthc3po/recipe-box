# frozen_string_literal: true

class MealPlanGeneratorService
  def initialize(user, params)
    @user = user
    @start_date = Date.parse(params[:start_date])
    @days = params[:days].to_i
    @preferences = params[:preferences] || {}
  end

  def call
    # 1. Select recipes based on preferences
    recipes = select_recipes

    if recipes.empty?
      return { success: false, message: 'No matching recipes found for your preferences.' }
    end

    # 2. Create Meal Plan
    meal_plan = create_meal_plan

    # 3. Distribute recipes across days
    distribute_recipes(meal_plan, recipes)

    { success: true, meal_plan: meal_plan }
  end

  private

  def select_recipes
    scope = @user.recipes

    # Filter by time preference
    if @preferences[:max_time].present?
      scope = scope.where('(prep_time_minutes + cook_time_minutes) <= ?', @preferences[:max_time].to_i)
    end

    # Filter by diet (rudimentary tag based or title search for now)
    if @preferences[:diet].present?
      # In a real app, this would use tags. For now, we search title/description
      term = @preferences[:diet].downcase
      scope = scope.where('lower(title) LIKE ? OR lower(description) LIKE ?', "%#{term}%", "%#{term}%")
    end

    # Randomize and limit
    scope.order('RANDOM()').limit(@days * 2) # Fetch enough for lunch/dinner
  end

  def create_meal_plan
    # Check if plan exists for this week, else create
    end_date = @start_date + (@days - 1).days
    
    # Simple logic: assume one household for now
    household = @user.households.first
    
    MealPlan.create!(
      household: household,
      start_date: @start_date,
      end_date: end_date
    )
  end

  def distribute_recipes(meal_plan, recipes)
    recipes.each_with_index do |recipe, index|
      day_offset = index % @days
      meal_type = index < @days ? 'dinner' : 'lunch' # Fill dinners first, then lunches
      
      date = @start_date + day_offset.days
      
      MealPlanItem.create!(
        meal_plan: meal_plan,
        recipe: recipe,
        date: date,
        meal_type: meal_type,
        servings: 2 # Default servings
      )
    end
  end
end

# frozen_string_literal: true

class Api::V1::StatsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_household

  # GET /api/v1/stats
  def index
    # Get date range (default: last 30 days)
    end_date = Date.current
    start_date = (params[:start_date]&.to_date || (end_date - 30.days))

    # Fetch meal plan items for this household within the date range
    items = MealPlanItem.joins(:meal_plan)
                        .where(meal_plans: { household_id: @household.id })
                        .where(date: start_date..end_date)
                        .includes(:recipe)

    # Calculate statistics
    total_meals = items.count
    unique_recipes = items.map(&:recipe_id).uniq.count
    
    # Most cooked recipes (top 5)
    recipe_counts = items.group_by(&:recipe_id)
                         .transform_values(&:count)
                         .sort_by { |_, count| -count }
                         .first(5)
    
    top_recipes = recipe_counts.map do |recipe_id, count|
      recipe = Recipe.find_by(id: recipe_id)
      next unless recipe
      {
        id: recipe.id,
        title: recipe.title,
        image_url: recipe.image_url,
        count: count
      }
    end.compact

    # Meals by type
    meals_by_type = items.group_by(&:meal_type)
                         .transform_values(&:count)

    # Meals by weekday
    meals_by_weekday = items.group_by { |i| Date.parse(i.date.to_s).strftime('%A') }
                            .transform_values(&:count)

    # Total cooking time (estimated from recipes)
    total_time_minutes = items.map { |i| i.recipe.total_time_minutes || 0 }.sum

    # Leftovers count
    leftovers_count = items.where(meal_type: 'leftover').count

    render json: {
      status: { code: 200 },
      data: {
        period: {
          start_date: start_date,
          end_date: end_date
        },
        summary: {
          total_meals: total_meals,
          unique_recipes: unique_recipes,
          total_cooking_time_minutes: total_time_minutes,
          leftovers_count: leftovers_count
        },
        top_recipes: top_recipes,
        meals_by_type: meals_by_type,
        meals_by_weekday: meals_by_weekday
      }
    }
  end

  private

  def set_household
    @household = current_user.households.first
    unless @household
      @household = Household.create!(name: "#{current_user.username || 'My'}'s Kitchen")
      current_user.household_members.create!(household: @household, role: 'admin')
    end
  end
end

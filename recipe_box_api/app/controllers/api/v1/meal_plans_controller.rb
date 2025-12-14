# frozen_string_literal: true

class Api::V1::MealPlansController < ApplicationController
  before_action :authenticate_user!
  before_action :set_household

  # GET /api/v1/meal_plans
  # Params: start_date, end_date
  def index
    start_date = params[:start_date]&.to_date || Date.current.beginning_of_week
    end_date = params[:end_date]&.to_date || start_date + 6.days

    @meal_plan = find_or_create_meal_plan(start_date, end_date)
    @items = @meal_plan.meal_plan_items.includes(recipe: { recipe_ingredients: :ingredient })

    render json: {
      status: { code: 200 },
      data: {
        id: @meal_plan.id,
        start_date: @meal_plan.start_date,
        end_date: @meal_plan.end_date,
        items: @items.map { |item| meal_plan_item_json(item) }
      }
    }
  end

  # POST /api/v1/meal_plans/generate
  def generate
    service = MealPlanGeneratorService.new(current_user, params)
    result = service.call

    if result[:success]
      # Return the generated plan using the same structure as index
      @meal_plan = result[:meal_plan]
      @items = @meal_plan.meal_plan_items.includes(recipe: { recipe_ingredients: :ingredient })

      render json: {
        status: { code: 200, message: 'Meal plan generated successfully.' },
        data: {
          id: @meal_plan.id,
          start_date: @meal_plan.start_date,
          end_date: @meal_plan.end_date,
          items: @items.map { |item| meal_plan_item_json(item) }
        }
      }
    else
      render json: {
        status: { code: 422, message: result[:message] }
      }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/meal_plans/items
  def add_item
    start_date = params[:start_date]&.to_date || Date.current.beginning_of_week
    end_date = params[:end_date]&.to_date || start_date + 6.days

    @meal_plan = find_or_create_meal_plan(start_date, end_date)
    @item = @meal_plan.meal_plan_items.build(meal_plan_item_params)

    if @item.save
      render json: {
        status: { code: 201, message: 'Meal added to plan.' },
        data: meal_plan_item_json(@item)
      }, status: :created
    else
      render json: {
        status: { code: 422, message: @item.errors.full_messages.to_sentence }
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/meal_plans/items/:id
  def remove_item
    @item = MealPlanItem.joins(:meal_plan)
                        .where(meal_plans: { household_id: @household.id })
                        .find(params[:id])
    @item.destroy
    render json: { status: { code: 200, message: 'Meal removed from plan.' } }
  rescue ActiveRecord::RecordNotFound
    render json: { status: { code: 404, message: 'Item not found.' } }, status: :not_found
  end

  private

  def set_household
    @household = current_user.households.first
    unless @household
      @household = Household.create!(name: "#{current_user.username || 'My'}'s Kitchen")
      current_user.household_members.create!(household: @household, role: 'admin')
    end
  end

  def find_or_create_meal_plan(start_date, end_date)
    @household.meal_plans.find_or_create_by!(start_date: start_date, end_date: end_date)
  end

  def meal_plan_item_params
    params.permit(:recipe_id, :date, :meal_type, :servings, :source_meal_plan_item_id)
  end

  def meal_plan_item_json(item)
    {
      id: item.id,
      recipe_id: item.recipe_id,
      recipe_title: item.recipe.title,
      recipe_image_url: item.recipe.image_url,
      date: item.date,
      meal_type: item.meal_type,
      servings: item.servings,
      source_meal_plan_item_id: item.source_meal_plan_item_id
    }
  end
end

# frozen_string_literal: true

class Api::V1::ShoppingListsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_household

  # GET /api/v1/shopping_lists
  def index
    @items = @household.shopping_list_items.includes(:ingredient).order(:bought, 'ingredients.name')

    render json: {
      status: { code: 200 },
      data: @items.map { |item| shopping_item_json(item) }
    }
  end

  # POST /api/v1/shopping_lists/generate
  # Generates a shopping list based on the current meal plan
  def generate
    start_date = params[:start_date]&.to_date || Date.current.beginning_of_week
    end_date = params[:end_date]&.to_date || start_date + 6.days

    meal_plan = @household.meal_plans.find_by(start_date: start_date, end_date: end_date)
    unless meal_plan
      return render json: { status: { code: 404, message: 'No meal plan found for this week.' } }, status: :not_found
    end

    # Calculate required ingredients from meal plan
    required = {}
    meal_plan.meal_plan_items.includes(recipe: { recipe_ingredients: :ingredient }).each do |item|
      multiplier = (item.servings || item.recipe.servings || 1).to_f / (item.recipe.servings || 1).to_f
      item.recipe.recipe_ingredients.each do |ri|
        key = ri.ingredient_id
        qty = (ri.quantity || 0) * multiplier
        required[key] ||= { ingredient: ri.ingredient, quantity: 0, unit: ri.unit }
        required[key][:quantity] += qty
      end
    end

    # Subtract pantry inventory
    pantry = @household.pantry_items.index_by(&:ingredient_id)
    shopping_needed = {}
    required.each do |ing_id, data|
      pantry_qty = pantry[ing_id]&.quantity || 0
      needed = data[:quantity] - pantry_qty
      if needed > 0
        shopping_needed[ing_id] = { ingredient: data[:ingredient], quantity: needed, unit: data[:unit] }
      end
    end

    # Clear old list and create new
    @household.shopping_list_items.destroy_all
    shopping_needed.each do |ing_id, data|
      @household.shopping_list_items.create!(
        ingredient_id: ing_id,
        quantity: data[:quantity],
        unit: data[:unit],
        bought: false
      )
    end

    render json: {
      status: { code: 201, message: "Generated #{shopping_needed.size} items." },
      data: @household.shopping_list_items.includes(:ingredient).map { |i| shopping_item_json(i) }
    }, status: :created
  end

  # PATCH /api/v1/shopping_lists/:id
  def update
    @item = @household.shopping_list_items.find(params[:id])
    if @item.update(shopping_item_params)
      render json: {
        status: { code: 200, message: 'Item updated.' },
        data: shopping_item_json(@item)
      }
    else
      render json: {
        status: { code: 422, message: @item.errors.full_messages.to_sentence }
      }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { status: { code: 404, message: 'Item not found.' } }, status: :not_found
  end

  # DELETE /api/v1/shopping_lists/:id
  def destroy
    @item = @household.shopping_list_items.find(params[:id])
    @item.destroy
    render json: { status: { code: 200, message: 'Item removed.' } }
  rescue ActiveRecord::RecordNotFound
    render json: { status: { code: 404, message: 'Item not found.' } }, status: :not_found
  end

  private

  def set_household
    @household = current_user.households.first
    unless @household
      @household = Household.create!(name: "#{current_user.username || 'My'}'s Kitchen")
      current_user.household_members.create!(household: @household, role: :head_chef)
    end
  end

  def shopping_item_params
    params.permit(:bought, :quantity, :unit)
  end

  def shopping_item_json(item)
    {
      id: item.id,
      ingredient_id: item.ingredient_id,
      ingredient_name: item.ingredient.name,
      ingredient_category: item.ingredient.category,
      quantity: item.quantity,
      unit: item.unit,
      bought: item.bought
    }
  end
end

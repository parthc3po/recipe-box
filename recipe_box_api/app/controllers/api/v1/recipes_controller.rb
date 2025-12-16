# frozen_string_literal: true

class Api::V1::RecipesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_recipe, only: %i[show update destroy]

  # GET /api/v1/recipes
  def index
    # Use policy_scope to get all household recipes, not just current user's
    @recipes = policy_scope(Recipe)
    @recipes = @recipes.search(params[:query]) if params[:query].present?

    if params[:filter] == 'cookable'
      household = current_user.households.first
      if household
        pantry_ids = household.pantry_items.pluck(:ingredient_id)
        @recipes = @recipes.cookable_with(pantry_ids)
      else
        @recipes = Recipe.none
      end
    end

    render json: {
      status: { code: 200 },
      data: @recipes.as_json(include: { recipe_ingredients: { include: :ingredient } })
    }
  end

  # GET /api/v1/recipes/cookable
  # Returns recipes ranked by how many ingredients are available in pantry
  def cookable
    household = current_user.households.first
    unless household
      return render json: { status: { code: 200 }, data: [] }
    end

    pantry_ingredient_ids = household.pantry_items.pluck(:ingredient_id)

    # Get all household recipes with missing ingredient count
    @recipes = policy_scope(Recipe)
      .left_joins(:recipe_ingredients)
      .select(
        'recipes.*',
        "COUNT(CASE WHEN recipe_ingredients.ingredient_id NOT IN (#{pantry_ingredient_ids.join(',').presence || '0'}) THEN 1 END) AS missing_count",
        "COUNT(recipe_ingredients.id) AS total_ingredients"
      )
      .group('recipes.id')
      .order('missing_count ASC')

    render json: {
      status: { code: 200 },
      data: @recipes.map do |recipe|
        recipe.as_json.merge(
          missing_count: recipe.missing_count.to_i,
          total_ingredients: recipe.total_ingredients.to_i,
          cookable: recipe.missing_count.to_i == 0
        )
      end
    }
  end

  # GET /api/v1/recipes/:id
  def show
    render json: {
      status: { code: 200 },
      data: @recipe.as_json(include: { recipe_ingredients: { include: :ingredient } })
    }
  end

  # POST /api/v1/recipes
  def create
    @recipe = current_user.recipes.build(recipe_params)
    authorize @recipe

    if @recipe.save
      render json: {
        status: { code: 201, message: 'Recipe created successfully.' },
        data: @recipe.as_json(include: { recipe_ingredients: { include: :ingredient } })
      }, status: :created
    else
      render json: {
        status: { code: 422, message: @recipe.errors.full_messages.to_sentence }
      }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/recipes/:id
  def update
    authorize @recipe
    if @recipe.update(recipe_params)
      render json: {
        status: { code: 200, message: 'Recipe updated successfully.' },
        data: @recipe.as_json(include: { recipe_ingredients: { include: :ingredient } })
      }
    else
      render json: {
        status: { code: 422, message: @recipe.errors.full_messages.to_sentence }
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/recipes/:id
  def destroy
    authorize @recipe
    @recipe.destroy
    render json: {
      status: { code: 200, message: 'Recipe deleted successfully.' }
    }
  end

  private

  def set_recipe
    # Allow viewing any household recipe, not just current user's
    @recipe = policy_scope(Recipe).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { status: { code: 404, message: 'Recipe not found.' } }, status: :not_found
  end

  def recipe_params
    params.require(:recipe).permit(
      :title, :description, :instructions,
      :prep_time_minutes, :cook_time_minutes, :servings,
      :image_url, :source_url, :nutritional_info,
      recipe_ingredients_attributes: %i[id ingredient_id quantity unit notes _destroy]
    )
  end
end

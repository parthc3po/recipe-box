# frozen_string_literal: true

class Api::V1::RecipeImportsController < ApplicationController
  before_action :authenticate_user!

  # POST /api/v1/recipe_imports
  def create
    url = params[:url]
    
    if url.blank?
      return render json: {
        status: { code: 422, message: 'URL is required.' }
      }, status: :unprocessable_entity
    end

    begin
      service = RecipeImportService.new(url)
      recipe_data = service.import

      @recipe = current_user.recipes.build(
        title: recipe_data[:title],
        description: recipe_data[:description],
        instructions: recipe_data[:instructions],
        prep_time_minutes: recipe_data[:prep_time_minutes],
        cook_time_minutes: recipe_data[:cook_time_minutes],
        servings: recipe_data[:servings],
        image_url: recipe_data[:image_url],
        source_url: recipe_data[:source_url],
        nutritional_info: recipe_data[:nutritional_info]
      )

      # Create ingredients and link them
      if recipe_data[:ingredients].present?
        recipe_data[:ingredients].each do |ingredient_text|
          parsed = RecipeImportService.parse_ingredient(ingredient_text)
          ingredient = Ingredient.find_or_create_by!(name: (parsed[:name] || ingredient_text).downcase.strip.truncate(255))
          @recipe.recipe_ingredients.build(
            ingredient: ingredient,
            quantity: parsed[:quantity],
            unit: parsed[:unit],
            notes: ingredient_text  # Keep original text as notes for reference
          )
        end
      end

      if @recipe.save
        render json: {
          status: { code: 201, message: 'Recipe imported successfully.' },
          data: @recipe.as_json(include: { recipe_ingredients: { include: :ingredient } })
        }, status: :created
      else
        render json: {
          status: { code: 422, message: @recipe.errors.full_messages.to_sentence }
        }, status: :unprocessable_entity
      end
    rescue RecipeImportService::ImportError => e
      render json: {
        status: { code: 422, message: e.message }
      }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/recipe_imports/parse_text
  def parse_text
    text = params[:text]
    
    if text.blank?
      return render json: {
        status: { code: 422, message: 'Text is required.' }
      }, status: :unprocessable_entity
    end

    ingredients = []
    text.split("\n").each do |line|
      clean_line = line.strip
      next if clean_line.blank?
      
      parsed = RecipeImportService.parse_ingredient(clean_line)
      ingredients << {
        original_text: clean_line,
        name: parsed[:name],
        quantity: parsed[:quantity],
        unit: parsed[:unit]
      }
    end

    render json: {
      status: { code: 200 },
      data: ingredients
    }
  end
end

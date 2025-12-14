# frozen_string_literal: true

class Api::V1::SubstitutionsController < ApplicationController
  before_action :authenticate_user!

  # GET /api/v1/substitutions?ingredient_ids[]=1&ingredient_ids[]=2
  # Returns substitutions for the given ingredient IDs
  def index
    ingredient_ids = Array(params[:ingredient_ids]).map(&:to_i)
    
    if ingredient_ids.empty?
      return render json: { status: { code: 200 }, data: [] }
    end

    substitutions = IngredientSubstitution
      .where(ingredient_id: ingredient_ids)
      .includes(:ingredient, :substitute_ingredient)
      .order(:ingredient_id)

    render json: {
      status: { code: 200 },
      data: substitutions.map do |sub|
        {
          id: sub.id,
          ingredient: { id: sub.ingredient.id, name: sub.ingredient.name },
          substitute: { id: sub.substitute_ingredient.id, name: sub.substitute_ingredient.name },
          ratio: sub.ratio,
          notes: sub.notes
        }
      end
    }
  end
end

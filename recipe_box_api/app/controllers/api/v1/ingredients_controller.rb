# frozen_string_literal: true

class Api::V1::IngredientsController < ApplicationController
  before_action :authenticate_user!

  # GET /api/v1/ingredients
  def index
    @ingredients = Ingredient.all
    @ingredients = @ingredients.where('name ILIKE ?', "%#{params[:query]}%") if params[:query].present?
    
    render json: {
      status: { code: 200 },
      data: @ingredients
    }
  end

  # POST /api/v1/ingredients
  def create
    @ingredient = Ingredient.find_or_initialize_by(name: params[:ingredient][:name].downcase.strip)

    if @ingredient.new_record?
      @ingredient.category = params[:ingredient][:category]
      if @ingredient.save
        render json: {
          status: { code: 201, message: 'Ingredient created successfully.' },
          data: @ingredient
        }, status: :created
      else
        render json: {
          status: { code: 422, message: @ingredient.errors.full_messages.to_sentence }
        }, status: :unprocessable_entity
      end
    else
      render json: {
        status: { code: 200, message: 'Ingredient already exists.' },
        data: @ingredient
      }
    end
  end
end

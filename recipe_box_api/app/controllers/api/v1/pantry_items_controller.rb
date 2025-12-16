# frozen_string_literal: true

class Api::V1::PantryItemsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_household
  before_action :set_pantry_item, only: %i[update destroy]

  # GET /api/v1/pantry_items
  def index
    @pantry_items = @household.pantry_items.includes(:ingredient)
    
    render json: {
      status: { code: 200 },
      data: @pantry_items.map { |item| pantry_item_json(item) }
    }
  end

  # POST /api/v1/pantry_items
  def create
    ingredient = find_or_create_ingredient(params[:ingredient_name])
    @pantry_item = @household.pantry_items.find_or_initialize_by(ingredient: ingredient)
    @pantry_item.assign_attributes(pantry_item_params)

    if @pantry_item.save
      render json: {
        status: { code: 201, message: 'Item added to pantry.' },
        data: pantry_item_json(@pantry_item)
      }, status: :created
    else
      render json: {
        status: { code: 422, message: @pantry_item.errors.full_messages.to_sentence }
      }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/pantry_items/:id
  def update
    if @pantry_item.update(pantry_item_params)
      render json: {
        status: { code: 200, message: 'Pantry item updated.' },
        data: pantry_item_json(@pantry_item)
      }
    else
      render json: {
        status: { code: 422, message: @pantry_item.errors.full_messages.to_sentence }
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/pantry_items/:id
  def destroy
    @pantry_item.destroy
    render json: { status: { code: 200, message: 'Item removed from pantry.' } }
  end

  private

  def set_household
    # For now, use first household or create one
    @household = current_user.households.first
    unless @household
      @household = Household.create!(name: "#{current_user.username || 'My'}'s Kitchen")
      current_user.household_members.create!(household: @household, role: :head_chef)
    end
  end

  def set_pantry_item
    @pantry_item = @household.pantry_items.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { status: { code: 404, message: 'Pantry item not found.' } }, status: :not_found
  end

  def find_or_create_ingredient(name)
    return nil unless name.present?
    Ingredient.find_or_create_by!(name: name.downcase.strip)
  end

  def pantry_item_params
    params.permit(:quantity, :unit, :expiration_date)
  end

  def pantry_item_json(item)
    {
      id: item.id,
      ingredient_id: item.ingredient_id,
      ingredient_name: item.ingredient.name,
      quantity: item.quantity,
      unit: item.unit,
      expiration_date: item.expiration_date
    }
  end
end

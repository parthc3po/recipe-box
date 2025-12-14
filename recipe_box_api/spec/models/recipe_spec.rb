# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Recipe, type: :model do
  let(:user) { create(:user) }

  describe '.cookable_with scope' do
    let!(:flour) { Ingredient.create!(name: 'flour') }
    let!(:sugar) { Ingredient.create!(name: 'sugar') }
    let!(:butter) { Ingredient.create!(name: 'butter') }
    let!(:eggs) { Ingredient.create!(name: 'eggs') }

    let!(:simple_recipe) do
      recipe = Recipe.create!(title: 'Simple Cookies', user: user)
      recipe.recipe_ingredients.create!(ingredient: flour, quantity: 2, unit: 'cup')
      recipe.recipe_ingredients.create!(ingredient: sugar, quantity: 1, unit: 'cup')
      recipe
    end

    let!(:complex_recipe) do
      recipe = Recipe.create!(title: 'Complex Cake', user: user)
      recipe.recipe_ingredients.create!(ingredient: flour, quantity: 3, unit: 'cup')
      recipe.recipe_ingredients.create!(ingredient: sugar, quantity: 2, unit: 'cup')
      recipe.recipe_ingredients.create!(ingredient: butter, quantity: 1, unit: 'cup')
      recipe.recipe_ingredients.create!(ingredient: eggs, quantity: 4, unit: 'piece')
      recipe
    end

    context 'when all ingredients are available' do
      it 'returns recipes that can be made' do
        available_ids = [flour.id, sugar.id]
        result = Recipe.cookable_with(available_ids)

        expect(result).to include(simple_recipe)
        expect(result).not_to include(complex_recipe)
      end
    end

    context 'when all ingredients for complex recipe are available' do
      it 'returns both recipes' do
        available_ids = [flour.id, sugar.id, butter.id, eggs.id]
        result = Recipe.cookable_with(available_ids)

        expect(result).to include(simple_recipe)
        expect(result).to include(complex_recipe)
      end
    end

    context 'when no ingredients are available' do
      it 'returns no recipes' do
        result = Recipe.cookable_with([])

        expect(result).to be_empty
      end
    end

    context 'when some but not all ingredients are available' do
      it 'excludes recipes with missing ingredients' do
        available_ids = [flour.id, sugar.id, butter.id] # missing eggs
        result = Recipe.cookable_with(available_ids)

        expect(result).to include(simple_recipe)
        expect(result).not_to include(complex_recipe)
      end
    end
  end
end

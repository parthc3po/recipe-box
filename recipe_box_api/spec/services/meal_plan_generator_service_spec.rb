# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MealPlanGeneratorService do
  let(:user) { create(:user) }
  let!(:household) do
    h = Household.create!(name: "Test Household")
    user.household_members.create!(household: h, role: 'admin')
    h
  end

  let!(:quick_recipe) do
    Recipe.create!(
      title: 'Quick Salad',
      user: user,
      prep_time_minutes: 10,
      cook_time_minutes: 5
    )
  end

  let!(:slow_recipe) do
    Recipe.create!(
      title: 'Slow Roast',
      user: user,
      prep_time_minutes: 30,
      cook_time_minutes: 120
    )
  end

  let!(:vegetarian_recipe) do
    Recipe.create!(
      title: 'Vegetarian Pasta',
      description: 'A delicious vegetarian pasta dish',
      user: user,
      prep_time_minutes: 15,
      cook_time_minutes: 20
    )
  end

  describe '#call' do
    context 'with no preferences' do
      it 'creates a meal plan with random recipes' do
        service = described_class.new(user, { start_date: Date.today.to_s, days: 3 })
        result = service.call

        expect(result[:success]).to be true
        expect(result[:meal_plan]).to be_a(MealPlan)
        expect(result[:meal_plan].meal_plan_items.count).to be > 0
      end
    end

    context 'with max_time preference' do
      it 'only includes quick recipes' do
        service = described_class.new(user, {
          start_date: Date.today.to_s,
          days: 3,
          preferences: { max_time: 30 }
        })
        result = service.call

        expect(result[:success]).to be true
        # Should only include quick_salad (15 mins total)
        recipe_ids = result[:meal_plan].meal_plan_items.map(&:recipe_id)
        expect(recipe_ids).not_to include(slow_recipe.id)
      end
    end

    context 'with diet preference' do
      it 'filters by diet keyword' do
        service = described_class.new(user, {
          start_date: Date.today.to_s,
          days: 3,
          preferences: { diet: 'vegetarian' }
        })
        result = service.call

        expect(result[:success]).to be true
        recipe_ids = result[:meal_plan].meal_plan_items.map(&:recipe_id)
        expect(recipe_ids).to include(vegetarian_recipe.id)
      end
    end

    context 'when no matching recipes exist' do
      it 'returns an error message' do
        service = described_class.new(user, {
          start_date: Date.today.to_s,
          days: 3,
          preferences: { diet: 'nonexistent_diet_xyz' }
        })
        result = service.call

        expect(result[:success]).to be false
        expect(result[:message]).to include('No matching recipes')
      end
    end
  end
end

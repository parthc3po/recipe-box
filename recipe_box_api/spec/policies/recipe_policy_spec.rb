# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RecipePolicy, type: :policy do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:recipe) { create(:recipe, user: user) }
  let(:other_recipe) { create(:recipe, user: other_user) }

  describe 'show?' do
    it 'grants access to any user' do
      expect(RecipePolicy.new(user, recipe).show?).to be true
      expect(RecipePolicy.new(other_user, recipe).show?).to be true
    end
  end

  describe 'create?' do
    it 'grants access to authenticated users' do
      expect(RecipePolicy.new(user, Recipe.new).create?).to be true
    end

    it 'denies access to guests' do
      expect(RecipePolicy.new(nil, Recipe.new).create?).to be false
    end
  end

  describe 'update?' do
    it 'grants access to the recipe owner' do
      expect(RecipePolicy.new(user, recipe).update?).to be true
    end

    it 'denies access to non-owners' do
      expect(RecipePolicy.new(other_user, recipe).update?).to be false
    end

    it 'denies access to guests' do
      expect(RecipePolicy.new(nil, recipe).update?).to be false
    end
  end

  describe 'destroy?' do
    it 'grants access to the recipe owner' do
      expect(RecipePolicy.new(user, recipe).destroy?).to be true
    end

    it 'denies access to non-owners' do
      expect(RecipePolicy.new(other_user, recipe).destroy?).to be false
    end
  end

  describe 'Scope' do
    it "returns only the user's recipes" do
      recipe # create it
      other_recipe # create it

      scope = RecipePolicy::Scope.new(user, Recipe).resolve
      expect(scope).to include(recipe)
      expect(scope).not_to include(other_recipe)
    end
  end
end

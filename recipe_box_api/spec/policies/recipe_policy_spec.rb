# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RecipePolicy, type: :policy do
  let(:household) { create(:household) }
  let(:head_chef) { create(:user) }
  let(:sous_chef) { create(:user) }
  let(:line_cook) { create(:user) }

  before do
    create(:household_member, user: head_chef, household: household, role: :head_chef)
    create(:household_member, user: sous_chef, household: household, role: :sous_chef)
    create(:household_member, user: line_cook, household: household, role: :line_cook)
  end

  let(:recipe) { create(:recipe, user: head_chef) }

  describe 'show?' do
    it 'grants access to any user' do
      expect(RecipePolicy.new(head_chef, recipe).show?).to be true
      expect(RecipePolicy.new(sous_chef, recipe).show?).to be true
      expect(RecipePolicy.new(line_cook, recipe).show?).to be true
    end
  end

  describe 'create?' do
    it 'grants access to Head Chef' do
      expect(RecipePolicy.new(head_chef, Recipe.new).create?).to be true
    end

    it 'grants access to Sous Chef' do
      expect(RecipePolicy.new(sous_chef, Recipe.new).create?).to be true
    end

    it 'denies access to Line Cook' do
      expect(RecipePolicy.new(line_cook, Recipe.new).create?).to be false
    end

    it 'denies access to guests' do
      expect(RecipePolicy.new(nil, Recipe.new).create?).to be false
    end
  end

  describe 'update?' do
    it 'grants access to the recipe owner' do
      expect(RecipePolicy.new(head_chef, recipe).update?).to be true
    end

    it 'denies access to non-owners (even Sous Chef)' do
      expect(RecipePolicy.new(sous_chef, recipe).update?).to be false
    end

    it 'denies access to guests' do
      expect(RecipePolicy.new(nil, recipe).update?).to be false
    end
  end

  describe 'destroy?' do
    it 'grants access to the recipe owner' do
      expect(RecipePolicy.new(head_chef, recipe).destroy?).to be true
    end

    it 'denies access to non-owners' do
      expect(RecipePolicy.new(sous_chef, recipe).destroy?).to be false
    end
  end

  describe 'Scope' do
    it 'returns all recipes from household members' do
      recipe # head_chef's recipe
      sous_chef_recipe = create(:recipe, user: sous_chef)
      
      # Recipe from a different household user
      outsider = create(:user)
      outsider_recipe = create(:recipe, user: outsider)

      # Head Chef should see their own and Sous Chef's recipes
      scope = RecipePolicy::Scope.new(head_chef, Recipe).resolve
      expect(scope).to include(recipe)
      expect(scope).to include(sous_chef_recipe)
      expect(scope).not_to include(outsider_recipe)

      # Sous Chef should also see both household recipes
      sous_scope = RecipePolicy::Scope.new(sous_chef, Recipe).resolve
      expect(sous_scope).to include(recipe)
      expect(sous_scope).to include(sous_chef_recipe)

      # Line Cook should see all household recipes too
      line_scope = RecipePolicy::Scope.new(line_cook, Recipe).resolve
      expect(line_scope).to include(recipe)
      expect(line_scope).to include(sous_chef_recipe)
    end
  end
end

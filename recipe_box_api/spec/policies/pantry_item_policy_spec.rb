# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PantryItemPolicy, type: :policy do
  let(:household) { create(:household) }
  let(:ingredient) { create(:ingredient) }
  let(:head_chef_user) { create(:user) }
  let(:sous_chef_user) { create(:user) }
  let(:line_cook_user) { create(:user) }
  let(:outsider) { create(:user) }

  let!(:head_chef_member) { create(:household_member, user: head_chef_user, household: household, role: :head_chef) }
  let!(:sous_chef_member) { create(:household_member, user: sous_chef_user, household: household, role: :sous_chef) }
  let!(:line_cook_member) { create(:household_member, user: line_cook_user, household: household, role: :line_cook) }
  let(:pantry_item) { create(:pantry_item, household: household, ingredient: ingredient) }

  describe 'index? and show?' do
    it 'grants access to household members' do
      expect(PantryItemPolicy.new(head_chef_user, pantry_item).index?).to be true
      expect(PantryItemPolicy.new(sous_chef_user, pantry_item).show?).to be true
      expect(PantryItemPolicy.new(line_cook_user, pantry_item).show?).to be true
    end

    it 'denies access to outsiders' do
      expect(PantryItemPolicy.new(outsider, pantry_item).index?).to be false
    end
  end

  describe 'create?, update?, destroy?' do
    it 'grants access to head_chef and sous_chef' do
      expect(PantryItemPolicy.new(head_chef_user, pantry_item).create?).to be true
      expect(PantryItemPolicy.new(sous_chef_user, pantry_item).update?).to be true
    end

    it 'denies access to line_cook' do
      expect(PantryItemPolicy.new(line_cook_user, pantry_item).create?).to be false
      expect(PantryItemPolicy.new(line_cook_user, pantry_item).destroy?).to be false
    end

    it 'denies access to outsiders' do
      expect(PantryItemPolicy.new(outsider, pantry_item).create?).to be false
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Household, type: :model do
  describe 'associations' do
    it 'has many household_members' do
      association = described_class.reflect_on_association(:household_members)
      expect(association.macro).to eq :has_many
      expect(association.options[:dependent]).to eq :destroy
    end

    it 'has many users through household_members' do
      association = described_class.reflect_on_association(:users)
      expect(association.macro).to eq :has_many
      expect(association.options[:through]).to eq :household_members
    end

    it 'has many pantry_items' do
      association = described_class.reflect_on_association(:pantry_items)
      expect(association.macro).to eq :has_many
      expect(association.options[:dependent]).to eq :destroy
    end

    it 'has many meal_plans' do
      association = described_class.reflect_on_association(:meal_plans)
      expect(association.macro).to eq :has_many
      expect(association.options[:dependent]).to eq :destroy
    end

    it 'has many shopping_list_items' do
      association = described_class.reflect_on_association(:shopping_list_items)
      expect(association.macro).to eq :has_many
      expect(association.options[:dependent]).to eq :destroy
    end
  end

  describe 'validations' do
    it 'validates presence of name' do
      household = Household.new(name: nil)
      expect(household).not_to be_valid
      expect(household.errors[:name]).to include("can't be blank")
    end
  end

  describe 'invite code generation' do
    it 'generates an invite code on create' do
      household = Household.create!(name: 'Test Kitchen')
      expect(household.invite_code).to be_present
      expect(household.invite_code.length).to eq(8)
    end

    it 'generates unique invite codes' do
      h1 = Household.create!(name: 'Kitchen 1')
      h2 = Household.create!(name: 'Kitchen 2')
      expect(h1.invite_code).not_to eq(h2.invite_code)
    end
  end

  describe '#regenerate_invite_code!' do
    it 'changes the invite code' do
      household = Household.create!(name: 'Test Kitchen')
      old_code = household.invite_code
      household.regenerate_invite_code!
      expect(household.invite_code).not_to eq(old_code)
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe HouseholdMemberPolicy, type: :policy do
  let(:household) { create(:household) }
  let(:head_chef_user) { create(:user) }
  let(:sous_chef_user) { create(:user) }
  let(:line_cook_user) { create(:user) }

  let!(:head_chef_member) { create(:household_member, user: head_chef_user, household: household, role: :head_chef) }
  let!(:sous_chef_member) { create(:household_member, user: sous_chef_user, household: household, role: :sous_chef) }
  let!(:line_cook_member) { create(:household_member, user: line_cook_user, household: household, role: :line_cook) }

  describe 'index? and show?' do
    it 'grants access to all household members' do
      expect(HouseholdMemberPolicy.new(head_chef_user, head_chef_member).index?).to be true
      expect(HouseholdMemberPolicy.new(sous_chef_user, sous_chef_member).show?).to be true
      expect(HouseholdMemberPolicy.new(line_cook_user, line_cook_member).show?).to be true
    end
  end

  describe 'create? and update?' do
    it 'grants access only to head_chef' do
      new_member = HouseholdMember.new(household: household)
      expect(HouseholdMemberPolicy.new(head_chef_user, new_member).create?).to be true
    end

    it 'denies access to sous_chef' do
      new_member = HouseholdMember.new(household: household)
      expect(HouseholdMemberPolicy.new(sous_chef_user, new_member).create?).to be false
    end

    it 'denies access to line_cook' do
      new_member = HouseholdMember.new(household: household)
      expect(HouseholdMemberPolicy.new(line_cook_user, new_member).create?).to be false
    end
  end

  describe 'destroy?' do
    context 'when head_chef tries to remove a member' do
      it 'allows removing sous_chef' do
        expect(HouseholdMemberPolicy.new(head_chef_user, sous_chef_member).destroy?).to be true
      end

      it 'allows removing line_cook' do
        expect(HouseholdMemberPolicy.new(head_chef_user, line_cook_member).destroy?).to be true
      end

      it 'denies removing the only head_chef' do
        expect(HouseholdMemberPolicy.new(head_chef_user, head_chef_member).destroy?).to be false
      end
    end

    context 'when non-head_chef tries to remove' do
      it 'denies access' do
        expect(HouseholdMemberPolicy.new(sous_chef_user, line_cook_member).destroy?).to be false
      end
    end
  end
end

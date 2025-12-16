# frozen_string_literal: true

class RecipePolicy < ApplicationPolicy
  def record_household
    # Recipes belong to users, not directly to households
    nil
  end

  def show?
    true # Recipes are viewable by anyone
  end

  def create?
    return false unless user
    # User must have can_edit_recipes? permission in at least one household
    user.household_members.any?(&:can_edit_recipes?)
  end

  def update?
    return false unless user
    # Only the recipe owner can update
    record.user_id == user.id
  end

  def destroy?
    return false unless user
    # Only the recipe owner can delete
    record.user_id == user.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      # Return recipes from all users in the same household(s) as the current user
      household_ids = user.households.pluck(:id)
      household_user_ids = HouseholdMember.where(household_id: household_ids).pluck(:user_id)
      scope.where(user_id: household_user_ids)
    end
  end
end

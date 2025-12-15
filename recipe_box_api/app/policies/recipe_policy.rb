# frozen_string_literal: true

class RecipePolicy < ApplicationPolicy
  def record_household
    # Recipes belong to users, but we authorize based on household context
    # For now, recipes are user-scoped, so we check if user owns it
    nil
  end

  def show?
    true # Recipes are viewable by anyone (can be restricted later)
  end

  def create?
    user.present?
  end

  def update?
    return false unless user
    record.user_id == user.id
  end

  def destroy?
    return false unless user
    record.user_id == user.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(user: user)
    end
  end
end

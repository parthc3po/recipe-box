# frozen_string_literal: true

class MealPlanPolicy < ApplicationPolicy
  def index?
    membership.present?
  end

  def show?
    membership.present?
  end

  def create?
    membership&.can_edit_meal_plans?
  end

  def add_item?
    membership&.can_edit_meal_plans?
  end

  def remove_item?
    membership&.can_edit_meal_plans?
  end

  def update?
    membership&.can_edit_meal_plans?
  end

  def destroy?
    membership&.can_edit_meal_plans?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      household_ids = user.households.pluck(:id)
      scope.where(household_id: household_ids)
    end
  end
end

# frozen_string_literal: true

class PantryItemPolicy < ApplicationPolicy
  def index?
    membership.present?
  end

  def show?
    membership.present?
  end

  def create?
    membership&.can_edit_pantry? || false
  end

  def update?
    membership&.can_edit_pantry? || false
  end

  def destroy?
    membership&.can_edit_pantry? || false
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      household_ids = user.households.pluck(:id)
      scope.where(household_id: household_ids)
    end
  end
end

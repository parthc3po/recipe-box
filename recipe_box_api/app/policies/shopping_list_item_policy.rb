# frozen_string_literal: true

class ShoppingListItemPolicy < ApplicationPolicy
  def index?
    membership.present?
  end

  def show?
    membership.present?
  end

  def create?
    # All household members can add to shopping list
    membership&.can_add_to_shopping_list?
  end

  def generate?
    membership&.can_edit_shopping_list?
  end

  def update?
    # Marking as bought is allowed for all
    membership.present?
  end

  def destroy?
    membership&.can_edit_shopping_list?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      household_ids = user.households.pluck(:id)
      scope.where(household_id: household_ids)
    end
  end
end

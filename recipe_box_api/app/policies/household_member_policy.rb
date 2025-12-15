# frozen_string_literal: true

class HouseholdMemberPolicy < ApplicationPolicy
  def record_household
    record.household
  end

  def index?
    membership.present?
  end

  def show?
    membership.present?
  end

  def create?
    # Only head_chef can invite new members
    membership&.can_manage_members?
  end

  def update?
    # Only head_chef can change roles
    membership&.can_manage_members?
  end

  def destroy?
    return false unless membership&.can_manage_members?
    # Cannot remove yourself if you're the only head_chef
    return false if record.head_chef? && only_head_chef?
    true
  end

  private

  def only_head_chef?
    record.household.household_members.head_chef.count == 1
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      household_ids = user.households.pluck(:id)
      scope.where(household_id: household_ids)
    end
  end
end

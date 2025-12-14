class HouseholdMember < ApplicationRecord
  belongs_to :user
  belongs_to :household

  ROLES = %w[admin member].freeze

  validates :role, inclusion: { in: ROLES }
  validates :user_id, uniqueness: { scope: :household_id }

  before_validation :set_default_role

  private

  def set_default_role
    self.role ||= 'member'
  end
end

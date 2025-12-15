class Household < ApplicationRecord
  has_many :household_members, dependent: :destroy
  has_many :users, through: :household_members
  has_many :pantry_items, dependent: :destroy
  has_many :meal_plans, dependent: :destroy
  has_many :shopping_list_items, dependent: :destroy

  before_create :set_invite_code

  validates :name, presence: true
  validates :invite_code, uniqueness: true, allow_nil: true

  def regenerate_invite_code!
    update!(invite_code: SecureRandom.hex(4).upcase)
  end

  private

  def set_invite_code
    self.invite_code ||= SecureRandom.hex(4).upcase
  end
end

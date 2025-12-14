class PantryItem < ApplicationRecord
  belongs_to :household
  belongs_to :ingredient

  validates :ingredient_id, uniqueness: { scope: :household_id, message: 'already in pantry' }
  validates :quantity, numericality: { greater_than: 0 }, allow_nil: true

  # Scopes for expiration tracking
  scope :expired, -> { where('expiration_date < ?', Date.current) }
  scope :expiring_soon, ->(days = 3) { where('expiration_date >= ? AND expiration_date <= ?', Date.current, Date.current + days.days) }
  scope :with_expiration, -> { where.not(expiration_date: nil) }
end

class ShoppingListItem < ApplicationRecord
  belongs_to :household
  belongs_to :ingredient

  validates :ingredient_id, uniqueness: { scope: :household_id, message: 'already on shopping list' }
  validates :quantity, numericality: { greater_than: 0 }, allow_nil: true
end

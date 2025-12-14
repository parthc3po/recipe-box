class MealPlanItem < ApplicationRecord
  MEAL_TYPES = %w[breakfast lunch dinner snack leftover].freeze

  belongs_to :meal_plan
  belongs_to :recipe
  belongs_to :source_meal_plan_item, class_name: 'MealPlanItem', optional: true
  has_many :leftover_items, class_name: 'MealPlanItem', foreign_key: :source_meal_plan_item_id, dependent: :nullify

  validates :date, presence: true
  validates :meal_type, inclusion: { in: MEAL_TYPES }
  validates :servings, numericality: { greater_than: 0 }, allow_nil: true

  # Scopes
  scope :leftovers, -> { where(meal_type: 'leftover') }
  scope :original_meals, -> { where.not(meal_type: 'leftover') }

  def leftover?
    meal_type == 'leftover'
  end
end

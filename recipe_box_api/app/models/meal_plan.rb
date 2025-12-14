class MealPlan < ApplicationRecord
  belongs_to :household
  has_many :meal_plan_items, dependent: :destroy
  has_many :recipes, through: :meal_plan_items

  validates :start_date, presence: true
  validates :end_date, presence: true
end

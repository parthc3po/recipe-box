class AddSourceMealPlanItemToMealPlanItems < ActiveRecord::Migration[8.1]
  def change
    add_reference :meal_plan_items, :source_meal_plan_item, null: true, foreign_key: { to_table: :meal_plan_items }
  end
end

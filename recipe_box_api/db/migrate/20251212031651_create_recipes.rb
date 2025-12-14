class CreateRecipes < ActiveRecord::Migration[8.1]
  def change
    create_table :recipes do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title
      t.text :description
      t.text :instructions
      t.integer :prep_time_minutes
      t.integer :cook_time_minutes
      t.integer :servings
      t.string :image_url
      t.string :source_url
      t.jsonb :nutritional_info

      t.timestamps
    end
  end
end

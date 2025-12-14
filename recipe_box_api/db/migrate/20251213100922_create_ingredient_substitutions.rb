class CreateIngredientSubstitutions < ActiveRecord::Migration[8.1]
  def change
    create_table :ingredient_substitutions do |t|
      t.references :ingredient, null: false, foreign_key: true
      t.references :substitute_ingredient, null: false, foreign_key: { to_table: :ingredients }
      t.decimal :ratio
      t.string :notes

      t.timestamps
    end
  end
end

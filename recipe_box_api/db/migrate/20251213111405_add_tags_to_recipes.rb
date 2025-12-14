class AddTagsToRecipes < ActiveRecord::Migration[8.1]
  def change
    add_column :recipes, :tags, :string, array: true, default: []
    add_index :recipes, :tags, using: :gin
  end
end

class AddPreferencesToHouseholds < ActiveRecord::Migration[8.1]
  def change
    add_column :households, :dietary_preferences, :string, array: true, default: []
    add_index :households, :dietary_preferences, using: :gin
  end
end

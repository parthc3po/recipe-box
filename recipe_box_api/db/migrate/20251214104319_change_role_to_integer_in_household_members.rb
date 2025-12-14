class ChangeRoleToIntegerInHouseholdMembers < ActiveRecord::Migration[8.1]
  def up
    # First, add new integer column
    add_column :household_members, :role_int, :integer, default: 1, null: false

    # Convert existing string roles to integers
    # admin -> head_chef (2), member -> sous_chef (1)
    execute <<-SQL
      UPDATE household_members SET role_int = 
        CASE role
          WHEN 'admin' THEN 2
          WHEN 'member' THEN 1
          ELSE 1
        END
    SQL

    # Remove old string column and rename new one
    remove_column :household_members, :role
    rename_column :household_members, :role_int, :role
  end

  def down
    add_column :household_members, :role_str, :string, default: 'member'

    execute <<-SQL
      UPDATE household_members SET role_str = 
        CASE role
          WHEN 2 THEN 'admin'
          WHEN 1 THEN 'member'
          ELSE 'member'
        END
    SQL

    remove_column :household_members, :role
    rename_column :household_members, :role_str, :role
  end
end

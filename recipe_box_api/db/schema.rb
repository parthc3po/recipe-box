# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_12_14_104319) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "household_members", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "household_id", null: false
    t.integer "role", default: 1, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["household_id"], name: "index_household_members_on_household_id"
    t.index ["user_id"], name: "index_household_members_on_user_id"
  end

  create_table "households", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "dietary_preferences", default: [], array: true
    t.string "invite_code"
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["dietary_preferences"], name: "index_households_on_dietary_preferences", using: :gin
    t.index ["invite_code"], name: "index_households_on_invite_code", unique: true
  end

  create_table "ingredient_substitutions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "ingredient_id", null: false
    t.string "notes"
    t.decimal "ratio"
    t.bigint "substitute_ingredient_id", null: false
    t.datetime "updated_at", null: false
    t.index ["ingredient_id"], name: "index_ingredient_substitutions_on_ingredient_id"
    t.index ["substitute_ingredient_id"], name: "index_ingredient_substitutions_on_substitute_ingredient_id"
  end

  create_table "ingredients", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_ingredients_on_name", unique: true
  end

  create_table "meal_plan_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date"
    t.bigint "meal_plan_id", null: false
    t.string "meal_type"
    t.bigint "recipe_id", null: false
    t.integer "servings"
    t.bigint "source_meal_plan_item_id"
    t.datetime "updated_at", null: false
    t.index ["meal_plan_id"], name: "index_meal_plan_items_on_meal_plan_id"
    t.index ["recipe_id"], name: "index_meal_plan_items_on_recipe_id"
    t.index ["source_meal_plan_item_id"], name: "index_meal_plan_items_on_source_meal_plan_item_id"
  end

  create_table "meal_plans", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "end_date"
    t.bigint "household_id", null: false
    t.date "start_date"
    t.datetime "updated_at", null: false
    t.index ["household_id"], name: "index_meal_plans_on_household_id"
  end

  create_table "pantry_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "expiration_date"
    t.bigint "household_id", null: false
    t.bigint "ingredient_id", null: false
    t.decimal "quantity"
    t.string "unit"
    t.datetime "updated_at", null: false
    t.index ["household_id"], name: "index_pantry_items_on_household_id"
    t.index ["ingredient_id"], name: "index_pantry_items_on_ingredient_id"
  end

  create_table "recipe_ingredients", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "ingredient_id", null: false
    t.string "notes"
    t.decimal "quantity"
    t.bigint "recipe_id", null: false
    t.string "unit"
    t.datetime "updated_at", null: false
    t.index ["ingredient_id"], name: "index_recipe_ingredients_on_ingredient_id"
    t.index ["recipe_id"], name: "index_recipe_ingredients_on_recipe_id"
  end

  create_table "recipes", force: :cascade do |t|
    t.integer "cook_time_minutes"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "image_url"
    t.text "instructions"
    t.jsonb "nutritional_info"
    t.integer "prep_time_minutes"
    t.integer "servings"
    t.string "source_url"
    t.string "tags", default: [], array: true
    t.string "title"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["tags"], name: "index_recipes_on_tags", using: :gin
    t.index ["user_id"], name: "index_recipes_on_user_id"
  end

  create_table "shopping_list_items", force: :cascade do |t|
    t.boolean "bought"
    t.datetime "created_at", null: false
    t.bigint "household_id", null: false
    t.bigint "ingredient_id", null: false
    t.decimal "quantity"
    t.string "unit"
    t.datetime "updated_at", null: false
    t.index ["household_id"], name: "index_shopping_list_items_on_household_id"
    t.index ["ingredient_id"], name: "index_shopping_list_items_on_ingredient_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "jti", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.datetime "updated_at", null: false
    t.string "username"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "household_members", "households"
  add_foreign_key "household_members", "users"
  add_foreign_key "ingredient_substitutions", "ingredients"
  add_foreign_key "ingredient_substitutions", "ingredients", column: "substitute_ingredient_id"
  add_foreign_key "meal_plan_items", "meal_plan_items", column: "source_meal_plan_item_id"
  add_foreign_key "meal_plan_items", "meal_plans"
  add_foreign_key "meal_plan_items", "recipes"
  add_foreign_key "meal_plans", "households"
  add_foreign_key "pantry_items", "households"
  add_foreign_key "pantry_items", "ingredients"
  add_foreign_key "recipe_ingredients", "ingredients"
  add_foreign_key "recipe_ingredients", "recipes"
  add_foreign_key "recipes", "users"
  add_foreign_key "shopping_list_items", "households"
  add_foreign_key "shopping_list_items", "ingredients"
end

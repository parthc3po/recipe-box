FactoryBot.define do
  factory :ingredient do
    name { Faker::Food.ingredient }
    category { %w[Produce Dairy Meat Pantry Spices Frozen Bakery Beverages Other].sample }
  end
end

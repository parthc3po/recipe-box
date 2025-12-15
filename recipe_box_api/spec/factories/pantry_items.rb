FactoryBot.define do
  factory :pantry_item do
    association :household
    association :ingredient
    quantity { rand(1..10).to_f }
    unit { %w[cups grams oz lbs pieces].sample }
  end
end

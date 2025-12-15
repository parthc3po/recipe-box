FactoryBot.define do
  factory :recipe do
    association :user
    title { Faker::Food.dish }
    description { Faker::Food.description }
    instructions { "Step 1: #{Faker::Lorem.sentence}\nStep 2: #{Faker::Lorem.sentence}" }
    prep_time_minutes { rand(5..30) }
    cook_time_minutes { rand(10..60) }
    servings { rand(2..8) }
  end
end

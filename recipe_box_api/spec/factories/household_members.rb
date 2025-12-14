FactoryBot.define do
  factory :household_member do
    association :user
    association :household
    role { :line_cook }

    trait :head_chef do
      role { :head_chef }
    end

    trait :sous_chef do
      role { :sous_chef }
    end

    trait :line_cook do
      role { :line_cook }
    end
  end
end

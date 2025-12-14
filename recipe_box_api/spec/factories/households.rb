FactoryBot.define do
  factory :household do
    name { Faker::App.name + " Household" }
    
    trait :with_members do
      transient do
        members_count { 3 }
      end

      after(:create) do |household, evaluator|
        create_list(:household_member, evaluator.members_count, household: household)
      end
    end
  end
end

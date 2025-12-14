FactoryBot.define do
  factory :ingredient_substitution do
    ingredient { nil }
    substitute_ingredient { nil }
    ratio { "9.99" }
    notes { "MyString" }
  end
end

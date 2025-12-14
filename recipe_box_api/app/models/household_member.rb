class HouseholdMember < ApplicationRecord
  belongs_to :user
  belongs_to :household

  # Thematic role titles for Recipe Box
  # head_chef: Full control (owner/admin)
  # sous_chef: Can edit most things (editor/member)
  # line_cook: Mostly read-only (helper/viewer)
  enum :role, { line_cook: 0, sous_chef: 1, head_chef: 2 }

  validates :user_id, uniqueness: { scope: :household_id }

  before_validation :set_default_role

  # Permission helpers
  def can_manage_members?
    head_chef?
  end

  def can_edit_recipes?
    head_chef? || sous_chef?
  end

  def can_edit_meal_plans?
    head_chef? || sous_chef?
  end

  def can_edit_pantry?
    head_chef? || sous_chef?
  end

  def can_edit_shopping_list?
    head_chef? || sous_chef?
  end

  def can_add_to_shopping_list?
    true # All roles can add items
  end

  def can_delete_household?
    head_chef?
  end

  def can_set_dietary_rules?
    head_chef? || sous_chef?
  end

  def can_view_analytics?
    head_chef? || sous_chef?
  end

  private

  def set_default_role
    self.role ||= :sous_chef
  end
end

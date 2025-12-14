module RoleAuthorization
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
  end

  private

  def current_household
    @current_household ||= current_user&.households&.first
  end

  def current_membership
    @current_membership ||= current_user&.household_members&.find_by(household: current_household)
  end

  def require_head_chef!
    unless current_membership&.head_chef?
      render json: { error: "Head Chef access required" }, status: :forbidden
    end
  end

  def require_sous_chef_or_above!
    unless current_membership&.can_edit_recipes?
      render json: { error: "Sous Chef or Head Chef access required" }, status: :forbidden
    end
  end

  def require_can_manage_members!
    unless current_membership&.can_manage_members?
      render json: { error: "Only the Head Chef can manage members" }, status: :forbidden
    end
  end
end

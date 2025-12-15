# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      setup_household(resource)
      render json: {
        status: { code: 200, message: 'Signed up successfully.' },
        data: user_data(resource)
      }, status: :ok
    else
      render json: {
        status: { message: "User couldn't be created successfully. #{resource.errors.full_messages.to_sentence}" }
      }, status: :unprocessable_entity
    end
  end

  def setup_household(user)
    signup_type = params[:user][:signup_type] || 'create_kitchen'
    invite_code = params[:user][:invite_code]

    if signup_type == 'join_kitchen' && invite_code.present?
      join_existing_kitchen(user, invite_code)
    else
      create_new_kitchen(user)
    end
  end

  def join_existing_kitchen(user, invite_code)
    household = Household.find_by(invite_code: invite_code.upcase)
    if household
      # Default to sous_chef when joining, cannot self-assign head_chef
      role = params[:user][:role]
      safe_role = %w[sous_chef line_cook].include?(role) ? role : 'sous_chef'
      user.household_members.create!(household: household, role: safe_role)
    else
      # Invalid invite code - create their own kitchen instead
      create_new_kitchen(user)
    end
  end

  def create_new_kitchen(user)
    household = Household.create!(name: "#{user.username || 'My'}'s Kitchen")
    user.household_members.create!(household: household, role: :head_chef)
  end

  def user_data(resource)
    membership = resource.household_members.first
    {
      id: resource.id,
      email: resource.email,
      username: resource.username,
      created_at: resource.created_at,
      household: membership&.household ? {
        id: membership.household.id,
        name: membership.household.name,
        invite_code: membership.household.invite_code,
        role: membership.role
      } : nil
    }
  end
end

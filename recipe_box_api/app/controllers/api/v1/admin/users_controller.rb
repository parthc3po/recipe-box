module Api
  module V1
    module Admin
      class UsersController < ApplicationController
        include RoleAuthorization
        before_action :require_head_chef!
        before_action :set_member, only: [:update, :destroy]

        def index
          @members = current_household.household_members.includes(:user).order(created_at: :desc)
          render json: {
            data: @members.map { |m| member_json(m) }
          }
        end

        def update
          if @member.update(member_params)
            render json: { data: member_json(@member) }
          else
            render json: { errors: @member.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          if @member.user_id == current_user.id
            render json: { error: "Cannot remove yourself" }, status: :forbidden
            return
          end
          
          @member.destroy
          head :no_content
        end

        private

        def set_member
          @member = current_household.household_members.find_by!(user_id: params[:id])
        end

        def member_params
          params.require(:household_member).permit(:role)
        end

        def member_json(member)
          {
            id: member.user_id,
            email: member.user.email,
            username: member.user.username,
            role: member.role,
            joined_at: member.created_at
          }
        end
      end
    end
  end
end

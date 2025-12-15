module Api
  module V1
    class HouseholdsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_household, only: %i[show update regenerate_invite_code]

      def show
        render json: {
          status: { code: 200 },
          data: @household.as_json(only: %i[id name invite_code dietary_preferences])
        }
      end

      def update
        if @household.update(household_params)
          render json: {
            status: { code: 200, message: 'Settings updated.' },
            data: @household.as_json(only: %i[id name invite_code dietary_preferences])
          }
        else
          render json: {
            status: { code: 422, message: @household.errors.full_messages.to_sentence }
          }, status: :unprocessable_entity
        end
      end

      def regenerate_invite_code
        membership = current_user.household_members.find_by(household: @household)
        unless membership&.can_manage_members?
          return render json: {
            status: { code: 403, message: 'Only Head Chefs can regenerate invite codes.' }
          }, status: :forbidden
        end

        @household.regenerate_invite_code!
        render json: {
          status: { code: 200, message: 'Invite code regenerated.' },
          invite_code: @household.invite_code
        }
      end

      private

      def set_household
        if params[:id] == 'current'
          @household = current_user.households.first
        else
          @household = current_user.households.find_by(id: params[:id])
        end

        unless @household
          @household = Household.create!(name: "#{current_user.username || 'My'}'s Kitchen")
          current_user.household_members.create!(household: @household, role: :head_chef)
        end
      end

      def household_params
        params.require(:household).permit(:name, dietary_preferences: [])
      end
    end
  end
end

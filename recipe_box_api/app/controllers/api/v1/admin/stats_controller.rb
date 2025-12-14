module Api
  module V1
    module Admin
      class StatsController < ApplicationController
        include RoleAuthorization
        before_action :require_head_chef!

        def index
          household = current_household
          render json: {
            data: {
              total_users: household.users.count,
              users_by_role: {
                head_chef: household.household_members.head_chef.count,
                sous_chef: household.household_members.sous_chef.count,
                line_cook: household.household_members.line_cook.count
              },
              total_recipes: Recipe.where(user: household.users).count,
              recent_users: household.household_members.includes(:user).order(created_at: :desc).limit(5).map do |hm|
                {
                  id: hm.user.id,
                  email: hm.user.email,
                  username: hm.user.username,
                  role: hm.role,
                  joined_at: hm.created_at
                }
              end
            }
          }
        end
      end
    end
  end
end

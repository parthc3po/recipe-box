require 'rails_helper'
require 'devise/jwt/test_helpers'

RSpec.describe 'Api::V1::Admin::Stats', type: :request do
  let(:household) { create(:household) }
  let(:head_chef_user) { create(:user) }
  let(:sous_chef_user) { create(:user) }
  let(:line_cook_user) { create(:user) }
  let(:other_user) { create(:user) }

  before do
    create(:household_member, :head_chef, user: head_chef_user, household: household)
    create(:household_member, :sous_chef, user: sous_chef_user, household: household)
    create(:household_member, :line_cook, user: line_cook_user, household: household)
  end

  describe 'GET /api/v1/admin/stats' do
    context 'when authenticated as Head Chef' do
      before do
        get '/api/v1/admin/stats', headers: auth_headers(head_chef_user)
      end

      it 'returns success status' do
        expect(response).to have_http_status(:ok)
      end

      it 'returns stats data' do
        json = JSON.parse(response.body)
        expect(json['data']).to include(
          'total_users', 
          'users_by_role',
          'total_recipes',
          'recent_users'
        )
      end
    end

    context 'when authenticated as Sous Chef' do
      before do
        get '/api/v1/admin/stats', headers: auth_headers(sous_chef_user)
      end

      it 'returns forbidden status' do
        expect(response).to have_http_status(:forbidden)
      end

      it 'returns error message' do
        json = JSON.parse(response.body)
        expect(json['error']).to eq('Head Chef access required')
      end
    end

    context 'when authenticated as Line Cook' do
      before do
        get '/api/v1/admin/stats', headers: auth_headers(line_cook_user)
      end

      it 'returns forbidden status' do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'when authenticated as user from another household' do
      before do
        get '/api/v1/admin/stats', headers: auth_headers(other_user)
      end
      
      it 'returns forbidden status' do
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'when unauthenticated' do
      before do
        get '/api/v1/admin/stats'
      end

      it 'returns unauthorized status' do
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  def auth_headers(user)
    headers = { 'Accept' => 'application/json', 'Content-Type' => 'application/json' }
    Devise::JWT::TestHelpers.auth_headers(headers, user)
  end
end

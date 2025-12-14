require 'rails_helper'
require 'devise/jwt/test_helpers'

RSpec.describe 'Api::V1::Admin::Users', type: :request do
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

  describe 'GET /api/v1/admin/users' do
    context 'when authenticated as Head Chef' do
      before do
        get '/api/v1/admin/users', headers: auth_headers(head_chef_user)
      end

      it 'returns success status' do
        expect(response).to have_http_status(:ok)
      end

      it 'returns list of members' do
        json = JSON.parse(response.body)
        expect(json['data']).to be_an(Array)
        expect(json['data'].length).to eq(3)
      end
    end

    context 'when authenticated as Sous Chef' do
      before do
        get '/api/v1/admin/users', headers: auth_headers(sous_chef_user)
      end

      it 'returns forbidden status' do
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'PUT /api/v1/admin/users/:id' do
    let(:member_to_update) { household.household_members.find_by(user: line_cook_user) }
    let(:valid_params) { { household_member: { role: 'sous_chef' } } }

    context 'when authenticated as Head Chef' do
      before do
        put "/api/v1/admin/users/#{member_to_update.user_id}", 
            params: valid_params.to_json, 
            headers: auth_headers(head_chef_user)
      end

      it 'returns success status' do
        expect(response).to have_http_status(:ok)
      end

      it 'updates the role' do
        expect(member_to_update.reload.role).to eq('sous_chef')
      end
    end

    context 'when authenticated as Sous Chef' do
      before do
        put "/api/v1/admin/users/#{member_to_update.user_id}", 
            params: valid_params.to_json, 
            headers: auth_headers(sous_chef_user)
      end

      it 'returns forbidden status' do
        expect(response).to have_http_status(:forbidden)
      end

      it 'does not update the role' do
        expect(member_to_update.reload.role).to eq('line_cook')
      end
    end
  end

  describe 'DELETE /api/v1/admin/users/:id' do
    let!(:member_to_remove) { create(:household_member, :line_cook, household: household) }

    context 'when authenticated as Head Chef' do
      it 'removes the member' do
        expect {
          delete "/api/v1/admin/users/#{member_to_remove.user_id}", 
                 headers: auth_headers(head_chef_user)
        }.to change(HouseholdMember, :count).by(-1)
      end
    end

    context 'when authenticated as Sous Chef' do
      it 'returns forbidden status' do
        delete "/api/v1/admin/users/#{member_to_remove.user_id}", 
                headers: auth_headers(sous_chef_user)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  def auth_headers(user)
    headers = { 'Accept' => 'application/json', 'Content-Type' => 'application/json' }
    Devise::JWT::TestHelpers.auth_headers(headers, user)
  end
end

require 'rails_helper'

RSpec.describe 'Api::V1::RecipeImports', type: :request do
  let(:user) { create(:user, password: 'password123') }
  let(:headers) { auth_headers(user) }

  describe 'POST /api/v1/recipe_imports/parse_text' do
    context 'with valid text' do
      let(:text) { "1 cup flour\n2 eggs\n1/2 tsp salt" }

      it 'returns parsed ingredients' do
        post '/api/v1/recipe_imports/parse_text', params: { text: text }, headers: headers
        
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['data']).to be_an(Array)
        expect(json['data'].length).to eq(3)
        
        # Check first ingredient: 1 cup flour
        first = json['data'].find { |i| i['name'] == 'flour' }
        expect(first['quantity']).to eq(1.0)
        expect(first['unit']).to eq('cup')
        
        # Check fraction: 1/2 tsp salt
        salt = json['data'].find { |i| i['name'] == 'salt' }
        expect(salt['quantity']).to eq(0.5)
        expect(salt['unit']).to eq('tsp')
      end
    end

    context 'with empty text' do
      it 'returns error' do
        post '/api/v1/recipe_imports/parse_text', params: { text: '' }, headers: headers
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context 'when unauthenticated' do
      it 'returns unauthorized' do
        post '/api/v1/recipe_imports/parse_text', params: { text: 'foo' }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

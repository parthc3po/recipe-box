# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Substitutions', type: :request do
  let(:user) { create(:user) }
  let(:jwt_headers) { auth_headers(user) }

  describe 'GET /api/v1/substitutions' do
    let!(:butter) { Ingredient.create!(name: 'butter') }
    let!(:coconut_oil) { Ingredient.create!(name: 'coconut oil') }
    let!(:olive_oil) { Ingredient.create!(name: 'olive oil') }
    let!(:flour) { Ingredient.create!(name: 'flour') }

    let!(:sub1) do
      IngredientSubstitution.create!(
        ingredient: butter,
        substitute_ingredient: coconut_oil,
        ratio: 1.0,
        notes: 'Use equal amount'
      )
    end

    let!(:sub2) do
      IngredientSubstitution.create!(
        ingredient: butter,
        substitute_ingredient: olive_oil,
        ratio: 0.75,
        notes: 'Use 3/4 the amount'
      )
    end

    context 'when authenticated' do
      it 'returns substitutions for given ingredient_ids' do
        get '/api/v1/substitutions', params: { ingredient_ids: [butter.id] }, headers: jwt_headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['data'].length).to eq(2)
        expect(json['data'].map { |s| s['substitute']['name'] }).to contain_exactly('coconut oil', 'olive oil')
      end

      it 'returns empty array when no substitutions exist' do
        get '/api/v1/substitutions', params: { ingredient_ids: [flour.id] }, headers: jwt_headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['data']).to be_empty
      end

      it 'returns substitutions for multiple ingredients' do
        milk = Ingredient.create!(name: 'milk')
        almond_milk = Ingredient.create!(name: 'almond milk')
        IngredientSubstitution.create!(
          ingredient: milk,
          substitute_ingredient: almond_milk,
          ratio: 1.0,
          notes: 'Use equal amount'
        )

        get '/api/v1/substitutions', params: { ingredient_ids: [butter.id, milk.id] }, headers: jwt_headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['data'].length).to eq(3)
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        get '/api/v1/substitutions', params: { ingredient_ids: [butter.id] }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

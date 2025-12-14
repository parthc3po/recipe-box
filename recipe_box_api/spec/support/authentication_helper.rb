# frozen_string_literal: true

# Devise JWT authentication helper for request specs
module AuthenticationHelper
  def sign_in_user(user)
    post '/login', params: { user: { email: user.email, password: 'password123' } }, as: :json
    response.headers['Authorization']
  end

  def auth_headers(user)
    token = sign_in_user(user)
    { 'Authorization' => token }
  end
end

RSpec.configure do |config|
  config.include AuthenticationHelper, type: :request
end

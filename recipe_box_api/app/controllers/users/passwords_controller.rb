class Users::PasswordsController < Devise::PasswordsController
  respond_to :json

  # POST /resource/password
  def create
    self.resource = resource_class.send_reset_password_instructions(resource_params)
    yield resource if block_given?

    if successfully_sent?(resource)
      render json: { 
        status: { 
          code: 200, 
          message: "Reset password instructions sent successfully." 
        } 
      }, status: :ok
    else
      render json: { 
        status: { 
          code: 422, 
          message: resource.errors.full_messages.join(', ') || "Failed to send reset instructions" 
        } 
      }, status: :unprocessable_entity
    end
  end

  # PUT /resource/password
  def update
    self.resource = resource_class.reset_password_by_token(resource_params)
    yield resource if block_given?

    if resource.errors.empty?
      resource.unlock_access! if unlockable?(resource)
      
      if Devise.sign_in_after_reset_password
        resource.after_database_authentication
        sign_in(resource_name, resource)
      end
      
      render json: { 
        status: { 
          code: 200, 
          message: "Password reset successfully." 
        } 
      }, status: :ok
    else
      set_minimum_password_length
      render json: { 
        status: { 
          code: 422, 
          message: resource.errors.full_messages.join(', ')
        } 
      }, status: :unprocessable_entity
    end
  end

  protected

  def after_resetting_password_path_for(resource)
    # Devise redirect path - not used API-side but good to have
    super(resource)
  end

  def after_sending_reset_password_instructions_path_for(resource_name)
    # Devise redirect path - not used API-side but good to have
    super(resource_name)
  end
end

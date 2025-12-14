class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self


  has_many :household_members, dependent: :destroy
  has_many :households, through: :household_members
  has_many :recipes, dependent: :destroy

  def jwt_payload
    super
  end
end

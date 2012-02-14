class User < ActiveRecord::Base
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :confirmable

  attr_accessible :email, :username, :password, :password_confirmation, :remember_me
  
  def self.create_anonymous_user!
    user = User.new do |u|
      u.anonymous = true
      u.skip_confirmation!
    end
    user.save!(validate: false)
    user
  end
  
  def as_json(options = {})
    if anonymous?
      { id: id }
    else
      { id: id, username: username }
    end
  end
end

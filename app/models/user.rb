class User < ActiveRecord::Base
  has_many :patterns, :foreign_key => "creator_id", :dependent => :destroy
  has_one :canvas, :dependent => :destroy
  
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :confirmable

  attr_accessible :email, :username, :password, :password_confirmation, :remember_me
  
  def readable_name
    username.blank? ? "Anonymous" : username
  end
  
  def self.create_anonymous_user!
    user = User.new do |u|
      u.anonymous = true
      u.skip_confirmation!
    end
    user.save!(validate: false)
    user
  end
  
  def as_json(options = {})
    if username.blank?
      { id: id, readable_name: readable_name }
    else
      { id: id, readable_name: readable_name, username: username, ditty: ditty? }
    end
  end
end

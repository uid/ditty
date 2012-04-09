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
  
  def self.ditty
    User.find_by_ditty(true)
  end
  
  def self.create_ditty!
    raise "ditty user already exists" if User.find_by_ditty(true)
    user = User.new do |u|
      u.skip_confirmation!
      u.email = "tom@alltom.com"
      u.ditty = true
      u.username = "Ditty"
    end
    user.save!(validate: false)
    user
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

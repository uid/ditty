class Canvas < ActiveRecord::Base
  belongs_to :user
  
  validates :user_id, :presence => true
  validates :views, :presence => true
  
  attr_accessible :views
  
  def as_json(options={})
    { views: ActiveSupport::JSON.decode(views) }
  rescue MultiJson::DecodeError
    {}
  end
end

class ChatMessage < ActiveRecord::Base
  belongs_to :user
  
  def self.recently_created
    order("created_at DESC")
  end
  
  def as_json options={}
    {
      user: user.as_json(options),
      invocation: ActiveSupport::JSON.decode(message)
    }
  end
end

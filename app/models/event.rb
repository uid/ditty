class Event
  include Curator::Model
  
  attr_accessor :type # :pattern_created, :pattern_updated, :chat
  attr_accessor :time
  attr_accessor :user
  
  attr_accessor :chat # if type = :chat
  attr_accessor :pattern # if type = :pattern_created or :pattern_updated
  
  def self.pattern_created pattern
    Event.new type: :pattern_created, time: pattern.created_at, user: pattern.creator, pattern: pattern
  end
  
  def self.pattern_updated pattern
    Event.new type: :pattern_updated, time: pattern.created_at, user: pattern.creator, pattern: pattern
  end
  
  def self.chat chat_message
    Event.new type: :chat, time: chat_message.created_at, user: chat_message.user, chat: chat_message
  end
end

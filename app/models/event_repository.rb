class EventRepository
  # include Curator::Repository # -- not backed by a database table
  
  def self.recent limit=20
    events = recent_patterns(limit) + recent_chat(limit)
    merged_events events, limit
  end
  
  def self.recent_patterns limit=10
    events = []
    events += Pattern.recently_created.limit(limit).map { |pat| Event.new type: :pattern_created, time: pat.created_at, user: pat.creator, pattern: pat }
    events += Pattern.recently_updated.limit(limit).map { |pat| Event.new type: :pattern_updated, time: pat.updated_at, user: pat.creator, pattern: pat }
    merged_events events, limit
  end
  
  def self.recent_chat limit=10
    ChatMessage.recently_created.limit(limit).map { |chat| Event.new type: :chat, time: chat.created_at, user: chat.user, chat: chat }
  end
  
  # sorts by time then takes the @limit most recent
  def self.merged_events events, limit=10
    events.sort_by { |e| e.time }.reverse.first(limit)
  end
end

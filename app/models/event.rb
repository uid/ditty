class Event
  include Curator::Model
  
  attr_accessor :type # :created or :updated
  attr_accessor :time
  attr_accessor :pattern
end

class EventRepository
  # include Curator::Repository # -- not backed by a database table
  
  def self.recent limit=10
    merged_events recent_patterns(limit), limit
  end
  
  def self.recent_patterns limit=10
    events = []
    events += Pattern.recently_created.limit(limit).map { |pat| Event.new type: :created, time: pat.created_at, pattern: pat }
    events += (Pattern.recently_updated.limit(limit) - events.map(&:pattern)).map { |pat| Event.new type: :updated, time: pat.updated_at, pattern: pat }
    merged_events events, limit
  end
  
  def self.merged_events events, limit=10
    events.sort_by { |e| e.time }.reverse.first(limit)
  end
end

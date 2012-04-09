class PatternReference < ActiveRecord::Base
  belongs_to :source, class_name: "Pattern"
  belongs_to :sink, class_name: "Pattern"
  
  attr_accessible :source, :sink
  attr_accessible :source_id, :sink_id
end

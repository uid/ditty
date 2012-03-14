class Pattern < ActiveRecord::Base
  belongs_to :creator, :class_name => "User"
  
  validate :must_have_representations
  validate :must_have_arguments
  validate :must_have_meaning
  validates :creator, :presence => true, :unless => :no_creator_is_fine
  
  after_initialize :set_default_values
  
  attr_accessible :representations, :arguments, :meaning, :show, :key
  
  attr_accessor :no_creator_is_fine
  
  def self.recently_created
    order("created_at DESC")
  end
  
  def self.recently_updated
    order("updated_at DESC").where("created_at != updated_at")
  end
  
  def as_json options={}
    json = {
      id: id,
      representations: representations_object,
      arguments: arguments_object,
      meaning: meaning_object
    }
    json[:creator] = creator.as_json(options) unless creator.blank?
    json[:key] = key unless key.blank?
    json[:show] = false if false === show
    json
  end
  
  def representations_object
    ActiveSupport::JSON.decode(representations)
  rescue MultiJson::DecodeError
    nil
  end
  
  def arguments_object
    ActiveSupport::JSON.decode(arguments)
  rescue MultiJson::DecodeError
    nil
  end
  
  def meaning_object
    ActiveSupport::JSON.decode(meaning)
  rescue MultiJson::DecodeError
    nil
  end
  
  protected
    
    def set_default_values
      self.representations ||= "[\n\n]"
      self.arguments ||= "[\n\n]"
      self.meaning ||= "{\n  \"native_meaning\" : [\n    \n  ]\n}"
    end
    
    def must_have_representations
      unless obj = valid_json?(representations)
        errors.add(:representations, "must be valid JSON")
        return
      end
      
      errors.add(:representations, "must be an array") unless Array === obj
      unless obj.all? { |o| Hash === o }
        errors.add(:representations, "must contain only representation objects")
        return
      end
      
      errors.add(:representations, "must contain only 'template' and 'style' fields") unless obj.all? { |o| o.keys - %w{ template style } == [] }
      errors.add(:representations, "must only have string templates") unless obj.all? { |o| String === o["template"] }
      errors.add(:representations, "must contain 'block' style or none") unless obj.all? { |o| [nil, "block"].include? o["style"] }
    end
    
    def must_have_arguments
      unless obj = valid_json?(arguments)
        errors.add(:arguments, "must be valid JSON")
        return
      end
      
      errors.add(:arguments, "must be an array") unless Array === obj
      unless obj.all? { |o| Hash === o }
        errors.add(:arguments, "must contain only argument objects")
        return
      end
      
      errors.add(:arguments, "must contain only 'name' and 'type' fields") unless obj.all? { |o| o.keys - %w{ name type } == [] }
      errors.add(:arguments, "must have names") unless obj.all? { |o| String === o["name"] && !o["name"].blank? }
      errors.add(:arguments, "must contain 'instructions' type or none") unless obj.all? { |o| [nil, "instructions"].include? o["type"] }
    end
    
    def must_have_meaning
      unless obj = valid_json?(meaning)
        errors.add(:meaning, "must be valid JSON")
        return
      end
      
      unless Hash === obj
        errors.add(:meaning, "must be an object")
        return
      end
      if obj.include? "native_meaning"
        errors.add(:meaning, "must have an array as a native_meaning") unless Array === obj["native_meaning"]
      elsif obj.include? "javascript_meaning"
        errors.add(:meaning, "must have a string as a javascript_meaning") unless String === obj["javascript_meaning"]
      else
        errors.add(:meaning, "must contain either 'native_meaning' or 'javascript_meaning' key")
      end
    end
    
    # if data is a string, check that it can be parsed as JSON
    # if data is an object, check that it can be encoded as JSON
    # returns parsed object in either case
    def valid_json? data
      case data
      when String
        ActiveSupport::JSON.decode(data)
      else
        ActiveSupport::JSON.encode(data)
        data
      end
    rescue MultiJson::DecodeError
      nil
    end
end

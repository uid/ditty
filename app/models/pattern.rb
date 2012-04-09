class Pattern < ActiveRecord::Base
  belongs_to :creator, :class_name => "User"
  
  validate :must_have_representations
  validate :must_have_arguments
  validate :must_have_meaning
  validates :creator, :presence => true, :unless => :no_creator_is_fine
  
  serialize :representations, JSON
  serialize :arguments, JSON
  serialize :native_meaning, JSON
  
  after_initialize :set_default_values
  
  attr_accessible :representations, :arguments, :native_meaning, :javascript_meaning, :show, :category, :featured, :is_solution
  
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
      representations: representations,
      arguments: arguments,
      featured: featured?,
      is_solution: is_solution?
    }
    json[:native_meaning] = native_meaning unless native_meaning.blank?
    json[:javascript_meaning] = javascript_meaning unless javascript_meaning.blank?
    json[:creator] = creator.as_json(options) unless creator.blank?
    json[:category] = category unless category.blank?
    json[:show] = false if false === show
    json
  end
  
  protected
    
    def set_default_values
      self.representations ||= []
      self.arguments ||= []
    end
    
    def must_have_representations
      errors.add(:representations, "must be an array") unless Array === representations
      unless representations.all? { |o| Hash === o }
        errors.add(:representations, "must contain only representation objects")
        return
      end
      
      errors.add(:representations, "must contain only 'template' and 'style' fields") unless representations.all? { |o| o.keys - %w{ template style } == [] }
      errors.add(:representations, "must only have string templates") unless representations.all? { |o| String === o["template"] }
      errors.add(:representations, "must contain 'block' style or none") unless representations.all? { |o| [nil, "block"].include? o["style"] }
    end
    
    def must_have_arguments
      errors.add(:arguments, "must be an array") unless Array === arguments
      unless arguments.all? { |o| Hash === o }
        errors.add(:arguments, "must contain only argument objects")
        return
      end
      
      errors.add(:arguments, "must contain only 'name' and 'type' fields") unless arguments.all? { |o| o.keys - %w{ name type } == [] }
      errors.add(:arguments, "must have names") unless arguments.all? { |o| String === o["name"] && !o["name"].blank? }
      errors.add(:arguments, "must contain 'instructions' type or none") unless arguments.all? { |o| [nil, "instructions"].include? o["type"] }
    end
    
    def must_have_meaning
      if !javascript_meaning.blank? && !native_meaning.nil?
        errors.add(:meaning, "can be native or Javascript, but not both")
        return
      end
      
      if javascript_meaning.blank? && native_meaning.nil?
        errors.add(:meaning, "cannot be blank")
        return
      end
      
      if !native_meaning.nil?
        unless Array === native_meaning
          errors.add(:native_meaning, "must be an array")
          return
        end
        
        unless native_meaning.all? { |o| Hash === o }
          errors.add(:native_meaning, "must be an array of objects")
        end
      end
    end
end

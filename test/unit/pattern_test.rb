require 'test_helper'

class PatternTest < ActiveSupport::TestCase
  def assert_has_exactly_errors record, attribute, errors, all_errors
    assert(record.valid? == errors.blank?, "#{record.inspect} should be #{errors.blank? ? "valid" : "invalid"}")
    errors.each do |e|
      assert record.errors[attribute].include?(all_errors[e]), "#{record.inspect} attribute #{attribute.inspect} should have error #{e.inspect}"
    end
    (all_errors.keys - errors).each do |e|
      assert !record.errors[attribute].include?(all_errors[e]), "#{record.inspect} attribute #{attribute.inspect} should NOT have error #{e.inspect}"
    end
  end
  
  test "requires valid representations" do
    @pattern = Pattern.new
    
    all_errors = {
      :valid_json => "must be valid JSON",
      :array => "must be an array",
      :objects => "must contain only representation objects",
      :fields => "must contain only 'template' and 'style' fields",
      :template => "must contain 'template' field",
      :valid_template => "must only have string templates",
      :valid_style => "must contain 'block' style or none"
    }
    
    @pattern.representations = ""
    assert_has_exactly_errors @pattern, :representations, [:valid_json], all_errors
    
    @pattern.representations = "{"
    assert_has_exactly_errors @pattern, :representations, [:valid_json], all_errors
    
    @pattern.representations = "{}"
    assert_has_exactly_errors @pattern, :representations, [:array], all_errors
    
    @pattern.representations = {}
    assert_has_exactly_errors @pattern, :representations, [:array], all_errors
    
    @pattern.representations = [42]
    assert_has_exactly_errors @pattern, :representations, [:objects], all_errors
    
    @pattern.representations = [{ "unrecognized" => 42 }]
    assert_has_exactly_errors @pattern, :representations, [:valid_template, :fields], all_errors
    
    @pattern.representations = [{ "style" => "block" }]
    assert_has_exactly_errors @pattern, :representations, [:valid_template], all_errors
    
    @pattern.representations = [{ "template" => 42 }]
    assert_has_exactly_errors @pattern, :representations, [:valid_template], all_errors
    
    @pattern.representations = [{ "template" => "", "style" => "blocky" }]
    assert_has_exactly_errors @pattern, :representations, [:valid_style], all_errors
    
    @pattern.representations = [{ "template" => "", "style" => 42 }]
    assert_has_exactly_errors @pattern, :representations, [:valid_style], all_errors
    
    # no problems
    
    @pattern.representations = []
    @pattern.valid?
    assert @pattern.errors[:representations].blank?
    
    @pattern.representations = [{ "template" => "after([seconds]) {<br />[action]<br />}" }]
    @pattern.valid?
    assert @pattern.errors[:representations].blank?
    
    @pattern.representations = [{ "template" => "after([seconds]) {<br />[action]<br />}", "style" => "block" }]
    @pattern.valid?
    assert @pattern.errors[:representations].blank?
  end
  
  test "requires valid arguments" do
    @pattern = Pattern.new
    
    all_errors = {
      :valid_json => "must be valid JSON",
      :array => "must be an array",
      :objects => "must contain only argument objects",
      :fields => "must contain only 'name' and 'type' fields",
      :name => "must contain 'name' field",
      :valid_name => "must have names",
      :valid_type => "must contain 'instructions' type or none"
    }
    
    @pattern.arguments = ""
    assert_has_exactly_errors @pattern, :arguments, [:valid_json], all_errors
    
    @pattern.arguments = "{"
    assert_has_exactly_errors @pattern, :arguments, [:valid_json], all_errors
    
    @pattern.arguments = "{}"
    assert_has_exactly_errors @pattern, :arguments, [:array], all_errors
    
    @pattern.arguments = {}
    assert_has_exactly_errors @pattern, :arguments, [:array], all_errors
    
    @pattern.arguments = [42]
    assert_has_exactly_errors @pattern, :arguments, [:objects], all_errors
    
    @pattern.arguments = [{ "unrecognized" => 42 }]
    assert_has_exactly_errors @pattern, :arguments, [:valid_name, :fields], all_errors
    
    @pattern.arguments = [{ "type" => "instructions" }]
    assert_has_exactly_errors @pattern, :arguments, [:valid_name], all_errors
    
    @pattern.arguments = [{ "name" => 42 }]
    assert_has_exactly_errors @pattern, :arguments, [:valid_name], all_errors
    
    @pattern.arguments = [{ "name" => "" }]
    assert_has_exactly_errors @pattern, :arguments, [:valid_name], all_errors
    
    @pattern.arguments = [{ "name" => "jordan", "type" => 42 }]
    assert_has_exactly_errors @pattern, :arguments, [:valid_type], all_errors
    
    # no problems
    
    @pattern.arguments = []
    @pattern.valid?
    assert @pattern.errors[:arguments].blank?
    
    @pattern.arguments = [{ "name" => "jordan" }]
    @pattern.valid?
    assert @pattern.errors[:arguments].blank?
    
    @pattern.arguments = [{ "name" => "jordan", "type" => "instructions" }]
    @pattern.valid?
    assert @pattern.errors[:arguments].blank?
  end

  test "requires valid meaning" do
    @pattern = Pattern.new
    
    all_errors = {
      :valid_json => "must be valid JSON",
      :array => "must be an array",
      :objects => "must contain only objects"
    }
    
    @pattern.meaning = ""
    assert_has_exactly_errors @pattern, :meaning, [:valid_json], all_errors
    
    @pattern.meaning = "{"
    assert_has_exactly_errors @pattern, :meaning, [:valid_json], all_errors
    
    @pattern.meaning = "{}"
    assert_has_exactly_errors @pattern, :meaning, [:array], all_errors
    
    @pattern.meaning = {}
    assert_has_exactly_errors @pattern, :meaning, [:array], all_errors
    
    @pattern.meaning = [42]
    assert_has_exactly_errors @pattern, :meaning, [:objects], all_errors
    
    # no problems
    
    @pattern.meaning = []
    @pattern.valid?
    assert @pattern.errors[:meaning].blank?
    
    @pattern.meaning = [{ "boop" => "beep" }]
    @pattern.valid?
    assert @pattern.errors[:meaning].blank?
  end
end

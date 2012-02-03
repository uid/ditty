require File.join(".", File.dirname(__FILE__), "..", "config", "environment.rb")

json_patterns = ActiveSupport::JSON.decode($stdin.read)

Pattern.transaction do
  json_patterns.values.each do |json_pattern|
    Pattern.create! do |pattern|
      pattern.key = json_pattern["id"]
      pattern.show = json_pattern["show"].nil? ? true : json_pattern["show"]
      pattern.representations = JSON.pretty_generate(json_pattern["representations"])
      pattern.arguments = JSON.pretty_generate(json_pattern["arguments"] || [])
      if Hash === json_pattern["meaning"]
        pattern.meaning = JSON.pretty_generate([json_pattern["meaning"]])
      else
        pattern.meaning = JSON.pretty_generate(json_pattern["meaning"])
      end
    end
  end
end

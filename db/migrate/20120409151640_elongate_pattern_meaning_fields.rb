class ElongatePatternMeaningFields < ActiveRecord::Migration
  def up
    change_column :patterns, :native_meaning, :text
    change_column :patterns, :javascript_meaning, :text
  end

  def down
    change_column :patterns, :native_meaning, :string
    change_column :patterns, :javascript_meaning, :string
  end
end

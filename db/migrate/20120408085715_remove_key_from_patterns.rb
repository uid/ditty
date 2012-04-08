class RemoveKeyFromPatterns < ActiveRecord::Migration
  def change
    remove_column :patterns, :key
  end
end

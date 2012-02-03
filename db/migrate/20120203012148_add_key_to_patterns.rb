class AddKeyToPatterns < ActiveRecord::Migration
  def change
    add_column :patterns, :key, :string
  end
end

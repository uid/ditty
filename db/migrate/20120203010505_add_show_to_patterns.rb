class AddShowToPatterns < ActiveRecord::Migration
  def change
    add_column :patterns, :show, :boolean, :default => true
  end
end

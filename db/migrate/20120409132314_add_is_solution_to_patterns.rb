class AddIsSolutionToPatterns < ActiveRecord::Migration
  def change
    add_column :patterns, :is_solution, :boolean, null: false, default: false
  end
end

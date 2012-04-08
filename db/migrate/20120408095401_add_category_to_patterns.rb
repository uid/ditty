class AddCategoryToPatterns < ActiveRecord::Migration
  def change
    add_column :patterns, :category, :string
    add_column :patterns, :featured, :boolean, null: false, default: false
  end
end

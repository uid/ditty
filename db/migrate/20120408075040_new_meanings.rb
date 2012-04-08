class NewMeanings < ActiveRecord::Migration
  def change
    add_column :patterns, :native_meaning, :string
    add_column :patterns, :javascript_meaning, :string
    remove_column :patterns, :meaning
  end
end

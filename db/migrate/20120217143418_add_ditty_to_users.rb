class AddDittyToUsers < ActiveRecord::Migration
  def change
    add_column :users, :ditty, :boolean, :null => false, :default => false
  end
end

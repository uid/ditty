class ModifyUsersIndices < ActiveRecord::Migration
  def up
    remove_index :users, :email
    remove_index :users, :reset_password_token
    remove_index :users, :confirmation_token
    
    add_index :users, :email
    add_index :users, :reset_password_token
    add_index :users, :confirmation_token
  end

  def down
    add_index :users, :email,                :unique => true
    add_index :users, :reset_password_token, :unique => true
    add_index :users, :confirmation_token,   :unique => true
  end
end

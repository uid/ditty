class CreateFeedbacks < ActiveRecord::Migration
  def change
    create_table :feedbacks do |t|
      t.references :user, null: false
      t.string :message, null: false

      t.timestamps
    end
    add_index :feedbacks, :user_id
  end
end

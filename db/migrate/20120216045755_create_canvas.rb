class CreateCanvas < ActiveRecord::Migration
  def change
    create_table :canvas do |t|
      t.text :views
      t.references :user

      t.timestamps
    end
  end
end

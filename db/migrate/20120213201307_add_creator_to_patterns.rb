class AddCreatorToPatterns < ActiveRecord::Migration
  def change
    change_table :patterns do |t|
      t.references :creator
      t.boolean :complete, :null => false, :default => false
    end
  end
end

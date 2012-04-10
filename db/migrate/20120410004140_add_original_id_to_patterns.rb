class AddOriginalIdToPatterns < ActiveRecord::Migration
  def change
    change_table :patterns do |t|
      t.references :original
    end
  end
end

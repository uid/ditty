class CreatePatterns < ActiveRecord::Migration
  def change
    create_table :patterns do |t|
      t.text :representations
      t.text :arguments
      t.text :meaning

      t.timestamps
    end
  end
end

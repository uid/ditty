class CreatePatternReferences < ActiveRecord::Migration
  def change
    create_table :pattern_references do |t|
      t.references :source
      t.references :sink

      t.timestamps
    end
    add_index :pattern_references, :source_id
    add_index :pattern_references, :sink_id
  end
end

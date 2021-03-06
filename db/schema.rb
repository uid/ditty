# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20120410004140) do

  create_table "canvas", :force => true do |t|
    t.text     "views"
    t.integer  "user_id"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "chat_messages", :force => true do |t|
    t.integer  "user_id"
    t.string   "message"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "chat_messages", ["user_id"], :name => "index_chat_messages_on_user_id"

  create_table "feedbacks", :force => true do |t|
    t.integer  "user_id",    :null => false
    t.string   "message",    :null => false
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "feedbacks", ["user_id"], :name => "index_feedbacks_on_user_id"

  create_table "pattern_references", :force => true do |t|
    t.integer  "source_id"
    t.integer  "sink_id"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "pattern_references", ["sink_id"], :name => "index_pattern_references_on_sink_id"
  add_index "pattern_references", ["source_id"], :name => "index_pattern_references_on_source_id"

  create_table "patterns", :force => true do |t|
    t.text     "representations"
    t.text     "arguments"
    t.datetime "created_at",                                           :null => false
    t.datetime "updated_at",                                           :null => false
    t.boolean  "show",                              :default => true
    t.integer  "creator_id"
    t.boolean  "complete",                          :default => false, :null => false
    t.text     "native_meaning",     :limit => 255
    t.text     "javascript_meaning", :limit => 255
    t.string   "category"
    t.boolean  "featured",                          :default => false, :null => false
    t.boolean  "is_solution",                       :default => false, :null => false
    t.integer  "original_id"
  end

  create_table "users", :force => true do |t|
    t.string   "email",                  :default => "",    :null => false
    t.string   "username",               :default => "",    :null => false
    t.string   "encrypted_password",     :default => "",    :null => false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.string   "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string   "unconfirmed_email"
    t.datetime "created_at",                                :null => false
    t.datetime "updated_at",                                :null => false
    t.boolean  "anonymous",              :default => false, :null => false
    t.boolean  "ditty",                  :default => false, :null => false
  end

  add_index "users", ["confirmation_token"], :name => "index_users_on_confirmation_token"
  add_index "users", ["email"], :name => "index_users_on_email"
  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token"

end

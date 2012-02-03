class Admin::AdminController < ApplicationController
  layout "admin"
  
  before_filter :verify_access
  
  def verify_access
    return if Rails.env != "production"
    
    authenticate_or_request_with_http_basic("App Realm") do |username, password|
      if ENV["ADMIN_USER"] && ENV["ADMIN_PASSWORD"]
        ENV["ADMIN_USER"] == username && ENV["ADMIN_PASSWORD"] == password
      else
        false
      end
    end
  end
end

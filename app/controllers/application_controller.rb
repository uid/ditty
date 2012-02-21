class ApplicationController < ActionController::Base
  protect_from_forgery
  
  before_filter :ensure_domain
  before_filter :verify_access
  
  def ensure_domain
    return if Rails.env != "production"
    
    canonical_domain = "playditty.com"
    if request.host != canonical_domain
      redirect_to(request.protocol + canonical_domain + request.fullpath)
    end
  end
  
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

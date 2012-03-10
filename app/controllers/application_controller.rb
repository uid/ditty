class ApplicationController < ActionController::Base
  protect_from_forgery
  
  before_filter :ensure_domain
  before_filter :verify_user_access
  
  def ensure_domain
    return if Rails.env != "production"
    
    canonical_domain = "playditty.com"
    if request.host != canonical_domain
      redirect_to(request.protocol + canonical_domain + request.fullpath)
    end
  end
  
  def verify_admin_access
    verify_access :admin_credentials?
  end
  
  def verify_user_access
    verify_access :user_credentials?
  end
  
  protected
    
    def user_credentials? username, password
      admin_credentials?(username, password) || equal_credentials?(ENV["GENERAL_USER"], ENV["GENERAL_PASSWORD"], username, password)
    end
    
    def admin_credentials? username, password
      equal_credentials? ENV["ADMIN_USER"], ENV["ADMIN_PASSWORD"], username, password
    end
    
    # checks that real_username and real_password are not blank, and equal the given credentials
    def equal_credentials? real_username, real_password, given_username, given_password
      if !real_username.blank? && !real_password.blank?
        real_username == given_username && real_password == given_password
      else
        false
      end
    end
    
    # credentials_method: a method taking a username and password, returning true or false
    def verify_access credentials_method
      return if Rails.env != "production"
      
      authenticate_or_request_with_http_basic("App Realm") do |username, password|
        send(credentials_method, username, password)
      end
    end
end

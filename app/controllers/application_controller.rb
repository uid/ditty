class ApplicationController < ActionController::Base
  protect_from_forgery
  
  before_filter :ensure_domain
  
  def ensure_domain
    return if Rails.env != "production"
    
    canonical_domain = "playditty.com"
    if request.host != canonical_domain
      redirect_to(request.protocol + canonical_domain + request.fullpath)
    end
  end
end

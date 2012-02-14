class CanvasController < ApplicationController
  before_filter :be_logged_in
  
  def index
  end
  
  protected
    
    def be_logged_in
      unless user_signed_in?
        sign_in :user, User.create_anonymous_user!
        @new_user = true
      end
    end
end

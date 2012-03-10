class CanvasController < ApplicationController
  before_filter :be_logged_in
  
  def index
  end
  
  def update
    @canvas = Canvas.find_or_initialize_by_user_id(current_user.id)
    if @canvas.update_attributes params[:canvas]
      render json: {}
    else
      render json: { error: "Could not save canvas" }
    end
  end
  
  protected
    
    def be_logged_in
      unless user_signed_in?
        user = User.create_anonymous_user!
        user.remember_me = true
        sign_in :user, user
        @new_user = true
      end
    end
end

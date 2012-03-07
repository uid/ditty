class UsersController < ApplicationController
  before_filter :authenticate_user!
  
  def update_current
    x = current_user.update_attribute("username", params[:user][:username])
    puts "new username: #{x}"
    render json: { user: current_user }
  end
end

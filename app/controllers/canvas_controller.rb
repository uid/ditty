class CanvasController < ApplicationController
  def home
  end
  
  def patterns
    @patterns = Pattern.all
    respond_to do |format|
      format.json { render json: @patterns }
    end
  end
end

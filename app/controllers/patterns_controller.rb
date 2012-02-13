class PatternsController < ApplicationController
  def index
    @patterns = Pattern.all
    respond_to do |format|
      format.json { render json: @patterns }
    end
  end
end

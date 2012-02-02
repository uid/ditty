class DefaultController < ApplicationController
  def home
  end
  
  def patterns
    respond_to do |format|
      format.json
    end
  end
end

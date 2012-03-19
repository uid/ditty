class EventsController < ApplicationController
  def index
    respond_to do |format|
      format.json { render json: EventRepository.recent }
    end
  end
end

class PatternsController < ApplicationController
  before_filter :authenticate_user!
  
  def index
    @patterns = Pattern.all include: :creator
    respond_to do |format|
      format.json { render json: @patterns }
    end
  end
  
  def create
    pattern = Pattern.new(params[:pattern])
    pattern.creator = current_user
    if pattern.save
      # Pusher["chat"].trigger("event", event: Event.pattern_created(pattern))
      render json: { pattern: pattern }
    else
      render json: { error: "Couldn't save pattern: #{pattern.errors.full_messages.join(", ")}" }, status: 400
    end
  end
  
  def update
    @pattern = Pattern.find_by_id(params[:id])
    if @pattern.nil?
      render json: { error: "Couldn't save pattern: the pattern doesn't exist" }, status: 400
    elsif @pattern.creator != current_user
      render json: { error: "Couldn't save pattern: that's someone else's pattern" }, status: 400
    elsif !@pattern.update_attributes(params[:pattern])
      render json: { error: "Couldn't save pattern: #{@pattern.errors.full_messages.join(", ")}" }, status: 400
    else
      # Pusher["chat"].trigger("event", event: Event.pattern_updated(@pattern))
      render json: { pattern: @pattern }
    end
  end
end

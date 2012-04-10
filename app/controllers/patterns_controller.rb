class PatternsController < ApplicationController
  before_filter :authenticate_user!
  
  def index
    @patterns = Pattern.all include: :creator
    respond_to do |format|
      format.json { render json: @patterns }
    end
  end
  
  def create
    pattern = Pattern.new(pattern_params)
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
    elsif !@pattern.update_attributes(pattern_params)
      render json: { error: "Couldn't save pattern: #{@pattern.errors.full_messages.join(", ")}" }, status: 400
    else
      # Pusher["chat"].trigger("event", event: Event.pattern_updated(@pattern))
      render json: { pattern: @pattern.as_json.slice(:referenced_patterns, :referencing_patterns) }
      # render json: nil
    end
  end
  
  private
    
    def pattern_params
      # if current_user.ditty?
        params[:pattern].slice(:representations, :arguments, :native_meaning, :javascript_meaning, :complete, :is_solution, :original_id, :category, :featured)
      # else
      #   params[:pattern].slice(:representations, :arguments, :native_meaning, :javascript_meaning, :complete, :is_solution, :original_id)
      # end
    end
end

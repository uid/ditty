class ChatController < ApplicationController
  def index
    render json: { events: EventRepository.recent }
  end
  
  def create
    chat = ChatMessage.create! chat_params.merge(user: current_user)
    # Pusher["chat"].trigger("event", event: Event.chat(chat))
    render json: {}
  end
  
  private
    
    def chat_params
      params[:chat].slice(:message)
    end
end

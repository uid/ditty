class FeedbackController < ApplicationController
  def create
    feedback = Feedback.create! user: current_user, message: params[:feedback][:message]
    FeedbackMailer.feedback_email(feedback).deliver
    render json: {}
  end
end

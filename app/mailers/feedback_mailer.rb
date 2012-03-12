class FeedbackMailer < ActionMailer::Base
  default to: "tom@alltom.com", from: "tom@alltom.com"
  
  def feedback_email feedback
    @user = feedback.user
    @message = feedback.message
    mail subject: "ditty feedback"
  end
end

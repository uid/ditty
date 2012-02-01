require 'test_helper'

class DefaultControllerTest < ActionController::TestCase
  test "should get home" do
    get :home
    assert_response :success
  end

end

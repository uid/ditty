require 'test_helper'

class Admin::PatternsControllerTest < ActionController::TestCase
  setup do
    @admin_pattern = admin_patterns(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:admin_patterns)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create admin_pattern" do
    assert_difference('Admin::Pattern.count') do
      post :create, admin_pattern: @admin_pattern.attributes
    end

    assert_redirected_to admin_pattern_path(assigns(:admin_pattern))
  end

  test "should show admin_pattern" do
    get :show, id: @admin_pattern
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @admin_pattern
    assert_response :success
  end

  test "should update admin_pattern" do
    put :update, id: @admin_pattern, admin_pattern: @admin_pattern.attributes
    assert_redirected_to admin_pattern_path(assigns(:admin_pattern))
  end

  test "should destroy admin_pattern" do
    assert_difference('Admin::Pattern.count', -1) do
      delete :destroy, id: @admin_pattern
    end

    assert_redirected_to admin_patterns_path
  end
end

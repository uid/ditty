class Admin::AdminController < ApplicationController
  before_filter :verify_admin_access
  
  layout "admin"
end

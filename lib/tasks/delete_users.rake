namespace :app do
  desc "Delete all non-Ditty Users"
  task :delete_users => :environment do
    User.all.each { |u| u.destroy unless u.ditty? }
  end
end

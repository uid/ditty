source "https://rubygems.org"

gem "rails", "3.2.0.rc2"
gem "twitter-bootstrap-rails", ">= 2.0rc0", :group => :assets
gem "jquery-rails"
gem "aws-ses", :require => "aws/ses"
gem "devise"

group :development do
  gem "sqlite3"
end

group :production do
  gem "pg"
end

# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem "sass-rails",   "~> 3.2.3"
  gem "coffee-rails", "~> 3.2.0"

  gem "uglifier", ">= 1.0.3"
end

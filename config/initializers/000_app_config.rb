
app_config_path = "#{Rails.root}/config/app.yml"

if File.exists? app_config_path
  APP_CONFIG = YAML.load_file(app_config_path)[Rails.env]

  (APP_CONFIG["environment_variables"] || {}).each do |key, value|
    ENV[key] = value
  end
end

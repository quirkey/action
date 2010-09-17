require 'sass/plugin'
require 'compass'
require 'compass/logger'
require 'jim'

# jim
jimfile = File.join(app_dir, 'Jimfile')
logger.debug "bundling js"
Jim.logger = Soca.logger
bundler = Jim::Bundler.new(File.read(jimfile), Jim::Index.new(app_dir))
bundler.bundle!

# compass

Soca.logger.info "compiling compass"
compass_from = File.join(app_dir, 'sass')
compass_to   = File.join(app_dir, 'css')
compass = Compass::Compiler.new(app_dir, compass_from, compass_to, Compass.sass_engine_options)
compass.run

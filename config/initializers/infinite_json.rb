module JSON
  class << self
    def parse(source, opts = {})
      opts = ({:max_nesting => false}).merge(opts)
      Parser.new(source, opts).parse
    end
  end
end

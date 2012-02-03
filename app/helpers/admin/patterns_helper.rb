module Admin::PatternsHelper
  def text_area_rows_for text, min=2
    [min, (text || "").split(/[\r\n]/).length].max
  end
end

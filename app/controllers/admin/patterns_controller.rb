class Admin::PatternsController < Admin::AdminController
  def index
    @patterns = Pattern.all
  end

  def show
    @pattern = Pattern.find(params[:id])
  end

  def new
    @pattern = Pattern.new
  end

  def edit
    @pattern = Pattern.find(params[:id])
  end

  def create
    @pattern = Pattern.new(params[:pattern])

    if @pattern.save
      redirect_to admin_pattern_url(@pattern), notice: "Pattern was successfully created."
    else
      render action: "new"
    end
  end

  def update
    @pattern = Pattern.find(params[:id])

    if @pattern.update_attributes(params[:pattern])
      redirect_to admin_pattern_url(@pattern), notice: "Pattern was successfully updated."
    else
      render action: "edit"
    end
  end

  def destroy
    @pattern = Pattern.find(params[:id])
    @pattern.destroy

    redirect_to admin_patterns_url
  end
  
  def hide_all
    Pattern.transaction do
      Pattern.all.each { |pattern| pattern.update_attributes! show: false }
    end
    redirect_to admin_patterns_url, notice: "All patterns have been hidden."
  end
end

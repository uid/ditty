(function($)
{
	// This script was written by Steve Fenton
	// http://www.stevefenton.co.uk/Content/Jquery-Content-Drag-Scroller/
	// Feel free to use this jQuery Plugin
	// Version: 0.1.0
    // Contributions by: TOM LIEBER (took out velocity, added horizontal scrolling)

	var contentdragscrollerCount = 0;

	$.fn.contentdragscroller = function (settings) {

		var config = {
			classModifier: "cds",
			cursor: "n-resize",
			width: "auto",
			height: "400px"
		};

		if (settings) {
			$.extend(config, settings);
		}

		var gesturesX = 0;
		var gesturesY = 0;
		var startPositionX = 0;
		var startPositionY = 0;
		var startScrollTop = 0;
		var startScrollLeft = 0;
		var isMouseDown = false;

		return this.each(function () {

			var id = config.classModifier + contentdragscrollerCount;

			$This = $(this);
			$This.wrap("<div id=\"" + id + "\" class=\"" + config.classModifier + "\"></div>");

			$Container = $("#" + id);
			$Container.css({
				width: config.width,
				height: config.height,
				cursor: config.cursor
			});

			// Detects mouse position and performs real-time scroll
			$(document).mousemove( function (e) {
				gesturesX = parseInt(e.pageX, 10);
				gesturesY = parseInt(e.pageY, 10);
				if (isMouseDown) {
					var scrollToPositionX = startScrollLeft + (startPositionX - gesturesX);
					var scrollToPositionY = startScrollTop + (startPositionY - gesturesY);
					$Container.scrollLeft(scrollToPositionX);
					$Container.scrollTop(scrollToPositionY);
					return false;
				}
			});

			// Prevents text being selected while scrolling
			$This.css({"MozUserSelect": "none"})
				.bind("mousedown.disableTextSelect selectstart.disableTextSelect", function() {
				return false;
			});

			// Starts a scroll
			$This.bind("mousedown", function(e) {
				if(e.target !== e.currentTarget) return false
				startPositionX = gesturesX;
				startPositionY = gesturesY;
				startScrollTop = $Container.scrollTop();
				startScrollLeft = $Container.scrollLeft();
				isMouseDown = true;
				return false;
			});

			// Cleans up after a scroll
			$(document).bind("mouseup", function() {
				if (isMouseDown) {
					isMouseDown = false;
					return false;
				}
			});
			
			contentdragscrollerCount++;
		});

		return this;
	};

})(jQuery);
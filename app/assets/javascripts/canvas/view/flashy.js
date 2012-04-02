
// sends a gradient through the background of the given HTML element
// (if color is unspecified, it will be red)
View.flash = function(elem, color) {
  color = color || "red"
  elem = $(elem)
  elem.stop(true /* clear animation queue */, true /* jump to end of animation */)
  elem.css("background", "white url(/assets/" + color + "-gradient.png) repeat-y ")
  elem.css("background-position", "-80px")
  elem.animate(
    { "background-position" : elem.width() },
    { duration: 300, complete: function() { elem.css("background", "") } }
  )
}


// clears any selected text in the window
View.clearSelection = function() {
  if(window.getSelection) {
    if(window.getSelection().empty) {  // Chrome
      window.getSelection().empty();
    } else if(window.getSelection().removeAllRanges) {  // Firefox
      window.getSelection().removeAllRanges();
    }
  } else if(document.selection) {  // IE?
    document.selection.empty();
  }
}

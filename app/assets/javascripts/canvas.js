//= require_tree ./canvas/ext
//= require_tree ./canvas

var Patterns = new PatternCollection
var Globals = {}


$(function() {
  $("#loading").hide()
  $("#container").show()
  
  $("body").addClass("no-drag-in-progress")
  $("body").bind("dragstart", function(e, ui) {
    $("body").removeClass("no-drag-in-progress");
    $("body").addClass("drag-in-progress")
  })
  $("body").bind("dragstop", function(e, ui) {
    $("body").addClass("no-drag-in-progress");
    $("body").removeClass("drag-in-progress")
  })
  
  Globals.harness = new View.TaskHarness($("#hud"), Tasks)
  
  Globals.canvas = new View.CodeCanvas($("#canvas"))
  $("#canvas").append(new View.TrashView().dom)
    
  View.patternAutocomplete($("#search"), function(view) {
    setTimeout(function() { $("#search").val("") }, 10)
    Globals.canvas.dropped(view)
    scrollIntoView(view.dom)
  }, function() {
    $("#search").val("")
  })
  View.patternAutocomplete($("#search-canvas"), function(view) {
    setTimeout(function() { $("#search-canvas").val("") }, 10)
    Globals.canvas.dropped(view)
    scrollIntoView(view.dom)
  }, function() {
    $("#search-canvas").val("")
  })
  
  Globals.clickEnv = new Env()
  
  new View.Palette($("#palette"), Patterns, {
    categories: [
      "Text Processing",
      "Debugging",
      "Strings",
      "Numbers",
      "Comparison",
      "Control Flow",
      "Logic",
      "Variables",
      "Objects",
      "Arrays"
    ],
  })
  
  var activityViewer = new View.ActivityViewer($("#activity"))
  
  $("#sidebar").tabs({
    select: function(e, ui) {
      if(ui.index == 1) {
        activityViewer.opened()
      }
    },
  })
  
  // loadDefaultPatterns()
  
  // $("body").append("<div id='debugger'></div>")
})

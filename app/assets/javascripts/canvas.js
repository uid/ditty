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
  
  Globals.harness = new View.TaskHarness($("#hud"))
  
  Globals.canvas = new View.CodeCanvas($("#canvas"))
  $("#canvas").append(new View.TrashView().dom)
    
  View.patternAutocomplete($("#search"), function(){}, function(){})
  
  addDefaultPatterns()
  
  // $("body").append("<div id='debugger'></div>")
  
  // Patterns.fetch({
  //   success: function() {
  //     Patterns.each(function(p) {
  //       p.templates.each(function(t, i) {
  //         $("#palette").append(new View.InvocationView(new Invocation({ pattern: p.id, representationIndex: i })).dom)
  //       })
  //     })
  //   }
  // })
})

//= require_tree ./canvas

var patterns = {}

var codeCanvas

var globalOS = { globals: {} }


function compilePatterns(json) {
  for(var i in json) {
    if("show" in json[i] && !json[i]["show"]) continue
    try {
      var pattern = new jsonUnserialize(json[i])
      
      // store in the global pattern index
      // XXX for now, index patterns by both ID and key
      patterns[json[i]["id"]] = pattern
      if(json[i]["key"]) {
        patterns[json[i]["key"]] = patterns[json[i]["id"]]
      }
    } catch(e) {
      $.achtung({ message: "Couldn't load pattern '" + i + "': " + e.message, timeout: 5 })
    }
  }
}
function myPatterns() {
  var mine = []
  for(var i in patterns) {
    if(patterns[i].creator.id == currentUser.id) {
      mine.push(patterns[i])
    }
  }
  return mine
}


var themes = ["colorful", "minimal"]
var themeIndex = 0
function changeTheme() {
  $("body").removeClass(themes[themeIndex])
  themeIndex = (themeIndex + 1) % themes.length
  $("body").addClass(themes[themeIndex])
}


function initAudio() {
  var audioContext = new webkitAudioContext()
  var upmixer = new UpMixer(audioContext)
  var xylos = [
    { connected: false, bar: new ModalBar(audioContext) },
    { connected: false, bar: new ModalBar(audioContext) },
    { connected: false, bar: new ModalBar(audioContext) },
    { connected: false, bar: new ModalBar(audioContext) }
  ]
  var nextXylo = 0
  
  upmixer.connect()
  
  for(var i in xylos) {
    xylos[i].bar.setPreset(1)
  }
  
  
  globalOS.globals['xylo'] = {
    strike: function() {
      if(!xylos[nextXylo].connected) {
        xylos[nextXylo].bar.connect(upmixer)
        xylos[nextXylo].connected = true
      }
      xylos[nextXylo].bar.strike.apply(xylos[nextXylo].bar, arguments)
      nextXylo = (nextXylo + 1) % xylos.length
    }
  }
}


function loadEnvironment() {
  $.ajax({
    url: "/patterns.json",
    dataType: "json",
    success: function(data) {
      compilePatterns(data)
      environmentLoaded()
    },
    error: function() {
      $("#loading").text("I'm sorry, for some reason the ditty environment could not be loaded.")
    }
  })
}


function environmentLoaded() {
  // browser check
  
  if(navigator.userAgent.indexOf("Chrome") == -1 || navigator.userAgent.indexOf("OS X") == -1) {
    $("#welcome-message").append("<p>You're not using Chrome on OS X&#8230; I only ever test this site in Chrome on OS X, so it's probably quite broken for you. Good luck!</p>")
  }
  
  // hide the loading screen
  
  $("#loading").hide()
  $("#container").show()
  
  // set up theme
  
  $("body").addClass(themes[themeIndex])
  $("#theme-switcher").click(changeTheme)
  
  // set up global dragging styles
  
  $("body").addClass("no-drag-in-progress")
  $("body").bind("dragstart", function(e, ui) {
    $("body").removeClass("no-drag-in-progress");
    $("body").addClass("drag-in-progress")
  })
  $("body").bind("dragstop", function(e, ui) {
    $("body").addClass("no-drag-in-progress");
    $("body").removeClass("drag-in-progress")
  })
  
  // set up the code canvas
  
  codeCanvas = new CodeCanvasView()
  $("#program").contentdragscroller({ width: "100%", height: "100%", cursor: null })
  
  // set up palette
  
  paletteView = new PaletteView()
  $("#palette").append(paletteView.dom)
  
  // var mine = myPatterns()
  // if(mine.length > 0) {
  //   paletteView.addSection("Mine")
  //   for(var i in mine) {
  //     paletteView.add(mine[i])
  //   }
  // }
  
  paletteView.addSection("Music")
  paletteView.add(patterns["play"])
  paletteView.add(patterns["note-do"])
  paletteView.add(patterns["note-re"])
  paletteView.add(patterns["note-mi"])
  
  paletteView.addSection("Timing")
  paletteView.add(patterns["after-seconds"])
  paletteView.add(patterns["wait-seconds"])
  
  paletteView.addSection("Program Flow")
  paletteView.add(patterns["if"])
  paletteView.add(patterns["while"])
  paletteView.add(patterns["loop"])
  paletteView.add(patterns["break"])
  
  paletteView.addSection("Logic and Numbers")
  paletteView.add(patterns["true"])
  paletteView.add(patterns["false"])
  paletteView.add(patterns[164])
  paletteView.add(patterns[165])
  paletteView.add(patterns["is-false"])
  
  paletteView.addSection("Popups")
  paletteView.add(patterns["alert"])
  paletteView.add(patterns["prompt"])
  
  paletteView.addSection("Exceptions")
  paletteView.add(patterns["throw"])
  paletteView.add(patterns["exception"])
  paletteView.add(patterns["catch"])
  paletteView.add(patterns["break"])
  paletteView.add(patterns["loop-breaker"])
  
  paletteView.addSection("Miscellaneous")
  for(var i in patterns) {
    if(!patterns[i].creator.ditty) {
      continue
    }
    
    paletteView.add(patterns[i])
  }
  
  // set up 'new bubble' button
  
  var newBubble = function(pattern) {
    var saveAfter = !pattern
    pattern = pattern || new Pattern({ creator: { id: currentUser.id }, representations: [new Template("My Code")] })
    var myCode = new PatternView(pattern)
    codeCanvas.accept(myCode, true /* propagate */)
    myCode.dom.css({ position: "absolute", left: "10px", top: "10px" })
    myCode.toggleSourceView(true /* instant */)
    if(saveAfter) myCode.save()
    return myCode
  }
  $("#bubble-adder").click(function() {
    var bubble = newBubble()
    $(this).effect("transfer", { to: bubble.dom }, 200)
  })
  $("#login-button").click(function() { window.location = "/users/sign_in" })
  
  // restore canvas
  
  codeCanvas.restore(initialCanvas)
  if(codeCanvas.isEmpty()) newBubble()
  
  // create the trash
  
  $("#program-container").append(new TrashView().dom)
  
  // set up styles/behavior for right-click menus
  
  $(".first_li , .sec_li, .inner_li span").live({
    mouseenter: function () {
      $(this).css({backgroundColor : '#E0EDFE' , cursor : 'pointer'});
      if($(this).children().size() > 0) {
        var submenu = $(this).find('.vsubmenu')
        submenu.css("margin-top", "-" + ($(this).height() + 1) + "px")
        submenu.css("left", $(this).width() + "px")
        submenu.show();
      }
      $(this).css({cursor : 'default'});
    },
    mouseleave: function () {
      $(this).css('background-color' , '#fff' );
      $(this).find('.vsubmenu').hide();
    }
  });
  
  // initialize audio
  
  initAudio()
  
  // done!
  
  $("#welcome, #welcome button").click(function(e) { $("#welcome").hide("puff"); e.stopPropagation() })
  
  flash($("body"), "blue")
}

$(loadEnvironment)

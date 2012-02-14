//= require_tree ./canvas

var patterns = {}

var globalOS = { globals: {} }


var themes = ["colorful", "minimal"]
var themeIndex = 0
function changeTheme() {
  $("body").removeClass(themes[themeIndex])
  themeIndex = (themeIndex + 1) % themes.length
  $("body").addClass(themes[themeIndex])
}


var audioContext, upmixer, clicker, bar
function initAudio() {
  audioContext = new webkitAudioContext()
  upmixer = new UpMixer(audioContext)
  clicker = new ModalStrike(audioContext)
  bar = new ModalBar(audioContext)
  
  upmixer.connect()
  
  globalOS.globals['xylo'] = bar
  bar.setPreset(4)
  bar.connect(upmixer)
  // bar.strike(440, 0.1)
  
  clicker.setGain(0.1)
  
  $(window).scroll(function() { clicker.play(upmixer) })
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
  // hide the loading screen
  
  $("#loading").hide()
  $("#container").show()
  
  // set up theme
  
  $("body").addClass(themes[themeIndex])
  $("#theme-switcher").click(changeTheme)
  
  // set up global dragging styles
  
  $("body").addClass("no-drag-in-progress")
  $("body").bind("dragstart", function() {
    $("body").removeClass("no-drag-in-progress");
    $("body").addClass("drag-in-progress")
  })
  $("body").bind("dragstop", function() {
    $("body").addClass("no-drag-in-progress");
    $("body").removeClass("drag-in-progress")
  })
  
  // set up palette
  
  paletteView = new PaletteView()
  $("#palette").append(paletteView.dom)
  
  // paletteView.addSection("Music")
  // paletteView.add(patterns["play"])
  // paletteView.add(patterns["note-do"])
  // paletteView.add(patterns["note-re"])
  // paletteView.add(patterns["note-mi"])
  
  // paletteView.addSection("Timing")
  // paletteView.add(patterns["after-beats"])
  
  // paletteView.addSection("Program Flow")
  // paletteView.add(patterns["while"])
  // paletteView.add(patterns["loop"])
  // paletteView.add(patterns["break"])
  // paletteView.add(patterns["maybe-block"])
  
  paletteView.addSection("Boop")
  paletteView.add(patterns["catch"])
  paletteView.add(patterns["break"])
  paletteView.add(patterns["loop-breaker"])
  
  paletteView.addSection("Miscellaneous")
  for(var i in patterns)
    paletteView.add(patterns[i])
  
  // set up 'new bubble' button
  
  var newBubble = function() {
    var myCode = new PatternView(new Pattern({ representations: [new Template("My Code")] }), { drag: "free" })
    myCode.dom.appendTo($("#program"))
    myCode.toggleSourceView(true /* instant */)
    myCode.save()
    return myCode
  }
  $("#bubble-adder").click(function() {
    var bubble = newBubble()
    $(this).effect("transfer", { to: bubble.dom }, 200)
  })
  
  // create a default bubble
  
  newBubble()
  
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
  
  $("#welcome").click(function() { $(this).hide("puff") })
  
  flash($("body"), "blue")
}

$(loadEnvironment)

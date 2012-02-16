
// wraps a jQuery event handler function
// only propagates the event if e.target == e.currentTarget
// (this is false when a click lands on multiple elements and one is on top)
function ifTarget(f) {
  return function(e) {
    if(e.target != e.currentTarget) return
    f.apply(null /* this */, arguments)
  }
}


// SLOT VIEW

function SlotView(parent, fillerText) {
  this.parent = parent
  this.fillerText = fillerText

  // create dom
  this.dom = $("<span class='slot unfilled'></span>")
  setObjFor(this.dom, this)

  // add filler
  this.setFiller()
  
  // patterns can be dropped onto slots
  this.dom.droppable({
    hoverClass: "hover",
    drop: function(event, ui) {
      ui.helper.dropped_on_droppable = true
      var patternView = objFor(ui.draggable)
      this.accept(patternView, true)
    }.bind(this)
  });
  
  // make clickable
  
  var dismiss = function() {
    this.setFiller()
  }.bind(this)

  this.dom.click(ifTarget(function(e) {
    input = $("<input type='text' />");
    input.keyup(function(e) { if(e.keyCode == 27) { dismiss() } })
    input.autocomplete({
      delay: 0,
      autoFocus: true,
      // appendTo: this.dom.parents(".expression-container").last(),
      source: function(request, callback) {
        var matches = []
        if(/^-?[0-9.]+$/i.exec(request.term)) {
          matches.push({ value: "number: " + request.term, result: function() { return new PatternView(new NumberPattern(parseFloat(request.term))) } })
        }
        if("true".indexOf(request.term) == 0 || "false".indexOf(request.term) == 0) {
          var value = (request.term.indexOf("t") != -1)
          matches.push({ value: "boolean: " + value, result: function() { return new PatternView(new BoolPattern(value)) } })
        }
        if(true) {
          matches.push({ value: "text: \"" + request.term + "\"", result: function() { return new PatternView(new StringPattern(request.term)) } })
        }
        var keywords = request.term.toLowerCase().split(" ")
        var keywordMatches = []
        for(var pattern in patterns) {
          if(!isNaN(parseFloat(pattern))) continue // skip non-numeric keys (they're backward-compatibility dupes)
          for(var i in patterns[pattern].representations) {
            var template = patterns[pattern].representations[i].text.toLowerCase()
            // check that all keywords are present
            var found = true
            var minIndex = 1000
            for(var j in keywords) {
              var index = template.indexOf(keywords[j])
              if(index == -1) {
                found = false
                break
              }
              if(index < minIndex) minIndex = index
            }
            if(found) {
              (function(pattern, i, minIndex) {
                keywordMatches.push({
                  minIndex: minIndex,
                  value: patterns[pattern].representations[i].text,
                  result: function() { return new PatternView(patterns[pattern], { representationIndex: i }) }
                })
              })(pattern, i, minIndex)
            }
          }
        }
        keywordMatches.sort(function(a, b) { return a.minIndex - b.minIndex })
        matches.push.apply(matches, keywordMatches)
        callback(matches);
      }.bind(this),
      select: function(event, ui) {
        this.accept(ui.item["result"](), true)
      }.bind(this),
      open: function() {
        input.data("menuOpen", true);
      },
      close: function() {
        input.data("menuOpen", false);
        if(!input.is(":focus"))
          dismiss();
      }
    }).data("autocomplete")._renderItem = function(ul, item) {
      // copied from jQuery source, but uses 'html' instead of 'text'
      return $("<li></li>").data("item.autocomplete", item).append($("<a></a>").html(item.label)).appendTo(ul)
    }

    input.blur(function() {
      if(!input.data("menuOpen"))
        dismiss();
    })
    this.dom.html("")
    this.dom.append(input);
    input.focus();
  }.bind(this)))
}
SlotView.prototype.toString = function() {
  return "SlotView()"
}
SlotView.prototype.refresh = function() {
}
SlotView.prototype.makeActive = function() {
  this.dom.droppable("enable")
}
SlotView.prototype.makeInactive = function() {
  this.dom.droppable("disable")
}
SlotView.prototype.setFiller = function() {
  this.dom.text(this.fillerText)
}
SlotView.prototype.isEmpty = function() {
  return !this.patternView
}
SlotView.prototype.childChanged = function(child) {
  if(this.parent && this.parent.childChanged) {
    this.parent.childChanged(this)
  }
}
SlotView.prototype.accept = function(patternView, propagate) {
  // change linkage
  this.patternView = patternView
  patternView.setParent(this)

  // move patternView into the slot
  this.makeInactive()
  this.dom.html("")
  this.patternView.dom.appendTo(this.dom)

  // change appearance to filled
  this.dom.removeClass("unfilled")
  this.dom.addClass("filled")
  
  if(propagate && this.parent.childChanged) {
    this.parent.childChanged(this)
  }
}
SlotView.prototype.release = function(child, propagate) {
  if(this.patternView == child) {
    delete this.patternView

    // change appearance to filled
    this.dom.removeClass("filled")
    this.dom.addClass("unfilled")

    child.dom.detach()
    this.setFiller()
    this.makeActive()
    
    if(propagate && this.parent.childChanged) {
      this.parent.childChanged(this)
    }
  }
}
SlotView.prototype.meaning = function() {
  if(this.patternView) {
    return this.patternView.meaning()
  }
}


// MULTI-SLOT VIEW

function MultiSlotView(parent, fillerText, showExtraSlot) {
  this.parent = parent
  this.fillerText = fillerText
  this.showExtraSlot = showExtraSlot
  this.slotViews = []

  // create dom
  this.dom = $("<ul class='multislot'></ul>")
  setObjFor(this.dom, this)
  
  this.refresh()
}
MultiSlotView.prototype.accept = function(views, propagate) {
  if(!(views instanceof Array)) {
    views = [views]
  }
  if(views.length > 0) {
    this.dom.text("")
    $("<li class='inbetweener'></li>").append(new SlotView(this, "").dom).appendTo(this.dom)
    for(var i in views) {
      var slotView = new SlotView(this, this.fillerText)
      slotView.accept(views[i])
      $("<li></li>").append(slotView.dom).appendTo(this.dom)
      $("<li class='inbetweener'></li>").append(new SlotView(this, "").dom).appendTo(this.dom)
    }
  }
}
MultiSlotView.prototype.refresh = function() {
  var lis = this.dom.children("li").toArray()
  if(lis.length == 0) {
    $("<li></li>").append(new SlotView(this, this.fillerText).dom).appendTo(this.dom)
    return
  }
  var prevHadChild = true
  for(var i in lis) {
    var slotView = objFor($(lis[i]).children(".slot").first())
    if(slotView.isEmpty()) {
      if(!prevHadChild) {
        $(lis[i]).remove()
      } else {
        $(lis[i]).addClass("inbetweener")
      }
    } else {
      if(prevHadChild) {
        $("<li class='inbetweener'></li>").append(new SlotView(this, "").dom).insertBefore($(lis[i]))
      }
      $(lis[i]).removeClass("inbetweener")
    }
    prevHadChild = !slotView.isEmpty()
  }
  if(prevHadChild) {
    $("<li class='inbetweener'></li>").append(new SlotView(this, "").dom).appendTo(this.dom)
  }
  lis = this.dom.children("li").toArray()
  if(lis.length == 1) {
    $(lis[lis.length - 1]).replaceWith($("<li></li>").append(new SlotView(this, this.fillerText).dom))
  } else if (this.showExtraSlot) {
    var li = $("<li></li>")
    $(lis[lis.length - 1]).replaceWith(li.append(new SlotView(this, "").dom))
    li.addClass("inbetweener")
  }
}
MultiSlotView.prototype.childChanged = function() {
  this.refresh()
  if(this.parent && this.parent.childChanged) {
    this.parent.childChanged(this)
  }
}
MultiSlotView.prototype.meaning = function() {
  var lis = this.dom.children("li").toArray()
  var meanings = []
  for(var i in lis) {
    var slotView = objFor($(lis[i]).children(".slot").first())
    if(!slotView.isEmpty()) {
      meanings.push(slotView.meaning())
    }
  }
  return new NativeMeaning(meanings)
}


// PATTERN VIEW

function PatternView(pattern, options) {
  options = options || {}
  
  this.pattern = pattern
  this.representationIndex = options.representationIndex || 0
  this.convertComponents()
  this.activeCount = 0
  if(options.parent)
    this.setParent(options.parent)

  // create dom
  this.dom = $("<div class='expression-container'></div>")
  this.expressionDom = $("<div class='expression title-expression'></div>").appendTo(this.dom)
  this.loadingDom = $("<span class='loading'>Saving&#8230;</span>").appendTo(this.expressionDom)
  this.sourceDom = $("<div class='source'></div>").appendTo(this.dom)
  setObjFor(this.dom, this)
  
  // add filler
  this.buildDom()
  
  // add source code
  this.source = new MultiSlotView(this /* parent */, "Drag or type something here.", true /* showExtraSlot */)
  this.source.dom.appendTo(this.sourceDom)

  // click to activate
  this.expressionDom.click(ifTarget(function(e) {
    if(this.noclick) return
    this.rootEval(globalOS)
  }.bind(this)))
  // this.expressionDom.click(ifTarget(this.toggleSourceView.bind(this)));

  // draggable
  this.dom.draggable({
    cursor: "move",
    distance: 5, // pixels to move before the drag starts
    helper: function() {
      var helper = $("<div class='expression-drag-helper'></div>")
      setObjFor(helper, this)
      return helper
    }.bind(this),
    appendTo: "body",
    cursorAt: { left: 8, top: 8 },
    // revert: "invalid",
    revertDuration: 300,
    stack: "#palette",
    start: function(event, ui) {
      this.dom.addClass("dragging")
      this.noclick = true
    }.bind(this),
    stop: function(event, ui) {
      this.dom.removeClass("dragging")
      setTimeout(function() { delete this.noclick }.bind(this), 100)
      if(!ui.helper.dropped_on_droppable && ui.helper.position().left > $("#palette-container").width()) {
        var pos = ui.helper.offset()
        codeCanvas.accept(this)
        this.dom.offset(pos)
      }
    }.bind(this),
  })
  
  // right-clickable
  this.dom.bind('contextmenu', function(e) {
    clearSelection() // right-clicking usually selects the word under the cursor
    
    var menu = new MenuBuilder()
    menu.add(this.isExpanded() ? "Hide Source" : "Show Source", this.toggleSourceView.bind(this))
    var viewsMenu = menu.addSubmenu("Change View &rarr;")
    for(var i in this.pattern.representations) {
      var template = this.pattern.representations[i]
      viewsMenu.add(template.text, function(i) { return function() {
        this.representationIndex = i
        this.reconvertComponents()
        this.buildDom()
        flash(this.expressionDom)
        flash(this.sourceDom)
      }.bind(this) }.bind(this)(i))
    }
    viewsMenu.addSeparator()
    viewsMenu.add("New&#8230;", function() {
      var template = this.pattern.representations[this.representationIndex]
      var text = prompt("New template?", template.text)
      if(!text) return
      var template = new Template(text)
      try {
        this.representationIndex = this.pattern.addRepresentation(template)
        this.reconvertComponents()
        this.buildDom()
        flash(this.expressionDom, "blue")
        flash(this.sourceDom, "blue")
      } catch(e) {
        alert("couldn't do it: " + e.message)
        return
      }
    }.bind(this))
    // menu.addSeparator()
    var debug = menu.addSubmenu("Debug &rarr;")
    debug.add("Display", function() { alert(this) }.bind(this))
    menu.add("Delete", function() { this.parent.release(this, true) }.bind(this))
    menu.add("Upload", this.save.bind(this))
    menu.open(e)
    
    return false
 }.bind(this));
}
PatternView.prototype.toString = function() {
  return "PatternView(" + this.pattern + ")"
}
PatternView.prototype.convertComponents = function() {
  var template = this.pattern.representations[this.representationIndex]
  this.slotViewsByParam = {}
  this.convertedComponents = [] // just like template.components
  for(var i in template.components) {
    var match = /^\[(.+)\]$/i.exec(template.components[i])
    if(match) {
      var arg = this.pattern.references[match[1]]
      var slotView = arg.type == "instructions" ? new MultiSlotView(this, match[1], template.style == "block") : new SlotView(this, match[1])
      this.convertedComponents.push(slotView)
      this.slotViewsByParam[match[1]] = slotView
    } else {
      this.convertedComponents.push(template.components[i])
    }
  }
}
// template should contain the same parameters as the current template, though the order can change
PatternView.prototype.reconvertComponents = function() {
  var template = this.pattern.representations[this.representationIndex]
  this.convertedComponents = []
  for(var i in template.components) {
    var match = /^\[(.+)\]$/i.exec(template.components[i])
    if(match) {
      var slotView = this.slotViewsByParam[match[1]]
      this.convertedComponents.push(slotView)
      slotView.showExtraSlot = (template.style == "block")
      slotView.refresh()
    } else {
      this.convertedComponents.push(template.components[i])
    }
  }
}
PatternView.prototype.buildDom = function() {
  // detach all the slots (preserves their callbacks)
  for(var i in this.convertedComponents) {
    if(typeof this.convertedComponents[i] !== "string")
      this.convertedComponents[i].dom.detach()
  }
  
  // clear what's left
  this.expressionDom.html("")
  
  // add all the components back
  for(var i in this.convertedComponents) {
    if(typeof this.convertedComponents[i] === "string")
      this.expressionDom.append(this.convertedComponents[i])
    else
      this.expressionDom.append(this.convertedComponents[i].dom)
  }
  
  // add loading indicator
  this.expressionDom.append(this.loadingDom)
}
PatternView.prototype.setParent = function(parent, propagate) {
  if(this.parent == parent)
    return
  if(this.parent)
    this.parent.release(this, propagate)
  if(parent)
    this.parent = parent
  else
    delete this.parent
  if(this.dom) {
    this.dom.css("position", "relative")
    this.dom.css("top", 0)
    this.dom.css("left", 0)
  }
}
PatternView.prototype.becameActive = function() {
  flash(this.expressionDom, "green")
  if(this.activeCount == 0) {
    this.expressionDom.addClass("active")
    this.sourceDom.addClass("active")
  }
  this.activeCount++
}
PatternView.prototype.becameInactive = function() {
  this.activeCount--
  if(this.activeCount == 0) {
    this.expressionDom.removeClass("active")
    this.sourceDom.removeClass("active")
  }
}
PatternView.prototype.childChanged = function(child) {
  if(this.source == child) {
    this.pattern.meaning = this.source.meaning()
    this.save()
  }
  if(this.parent && this.parent.childChanged) {
    this.parent.childChanged(this)
  }
}
PatternView.prototype.save = function() {
  if(this.saving) {
    this.needsAnotherSave = true
    return
  }
  
  this.saving = true
  
  this.loadingDom.show()
  
  if(!this._save) {
    this._save = _.debounce(function() {
      var json = jsonSerialize(this.pattern)
      var request = {}
      for(var i in json) {
        request["pattern[" + i + "]"] = JSON.stringify(json[i])
      }
      
      var finish = function() {
        var again = this.needsAnotherSave
        this.saving = false
        this.needsAnotherSave = false
        if(again) {
          this.save()
        }
      }.bind(this)
      
      var handleError = function(jqXHR, textStatus, errorThrown) {
        this.loadingDom.hide()
        var responseJSON = JSON.parse(jqXHR.responseText)
        if(responseJSON.error) {
          alert(responseJSON.error)
        } else {
          alert("Error saving: the server is down.")
        }
        finish()
      }.bind(this)
      
      if(this.pattern.id) {
        $.ajax({
          type: "PUT",
          url: "/patterns/" + this.pattern.id,
          data: request,
          success: function(data) {
            this.loadingDom.hide()
            finish()
          }.bind(this),
          error: handleError,
          dataType: "json"
        })
      } else {
        $.ajax({
          type: "POST",
          url: "/patterns",
          data: request,
          success: function(data) {
            this.loadingDom.hide()
            this.pattern.id = data["pattern"]["id"]
            finish()
          }.bind(this),
          error: handleError,
          dataType: "json"
        })
      }
    }, 100)
  }
  
  setTimeout(function() { this._save() }.bind(this), 300)
}
PatternView.prototype.meaning = function() {
  var args = {}
  for(var param in this.slotViewsByParam) {
    var slotMeaning = this.slotViewsByParam[param].meaning()
    if(slotMeaning) {
      args[param] = slotMeaning
    }
  }
  return new InvocationMeaning({ pattern: this.pattern, args: args, representationIndex: this.representationIndex }).notifying(this.becameActive.bind(this), this.becameInactive.bind(this))
  // return this.pattern.apply(args).notifying(this.becameActive.bind(this), this.becameInactive.bind(this))
}
PatternView.prototype.acceptArgument = function(argumentName, view) {
  this.slotViewsByParam[argumentName].accept(view)
}
PatternView.prototype.isExpanded = function() {
  return !this.sourceDom.is(":hidden")
}
PatternView.prototype.toggleSourceView = function(instant) {
  if(!this.isExpanded()) {
    if(this.pattern.meaning.components) {
      this.source.accept(_.map(this.pattern.meaning.components, createView))
    } else {
      this.sourceDom.html($("<pre style='word-break: break-all'></pre>").text(this.pattern.meaning.jsSource))
    }
  }
  this.sourceDom.animate(
    { height: 'toggle' },
    { duration: instant ? 0 : 300 }
  )
}
PatternView.prototype.rootEval = function(os) {
  // flash(this.expressionDom)
  var exHandler = function(ex) {
    if(ex instanceof InternalException) {
      if(ex.type == "loop-breaker") {
        $.achtung({ message: "Exception: tried to stop looping when not in a loop", timeout: 5 })
      } else {
        $.achtung({ message: "Uncaught exception: " + escapeHTML(ex.type), timeout: 5 })
      }
    } else {
      $.achtung({ message: "error: " + escapeHTML(ex.message), timeout: 5 })
    }
  }
  try {
    this.meaning().evaluate(function(result) {
      if(result) {
        $.achtung({ message: "Result: " + escapeHTML(result.toString()), timeout: 5 })
      } else {
        // $.achtung({ message: "No result", timeout: 5 })
      }
    },
    exHandler, os)
  } catch(ex) {
    exHandler(ex)
  }
}


// ARGUMENT REFERENCE VIEW

function ArgumentReferenceView(argumentReference, options) {
  options = options || {}
  
  this.argumentReference = argumentReference
  if(options.parent)
    this.setParent(options.parent)
  
  this.activeCount = 0

  // create dom
  this.dom = $("<div class='argument-reference'></div>")
  setObjFor(this.dom, this)
  
  // set title
  this.dom.text(this.argumentReference.name)
  
  // draggable
  this.dom.draggable({
    cursor: "move",
    helper: function() {
      return $("<div class='expression-drag-helper'></div>")
    },
    appendTo: "body",
    cursorAt: { left: 8, top: 8 },
    revert: "invalid",
    revertDuration: 300,
    stack: "#palette",
    start: function(event, ui) { 
      this.dom.addClass("dragging")
      this.noclick = true
    }.bind(this),
    stop: function(event, ui) {
      this.dom.removeClass("dragging")
      setTimeout(function() { delete this.noclick }.bind(this), 100)
    }.bind(this),
  })
  
  // right-clickable
  this.dom.bind('contextmenu', function(e) {
    clearSelection() // right-clicking usually selects the word under the cursor
    
    var menu = new MenuBuilder()
    menu.add("Delete", function() { this.parent.release(this, true) }.bind(this))
    menu.open(e)
    
    return false
 }.bind(this));
}
ArgumentReferenceView.prototype.toString = function() {
  return "ArgumentReferenceView(" + this.argumentReference + ")"
}
ArgumentReferenceView.prototype.setParent = function(parent, propagate) {
  if(this.parent == parent)
    return
  if(this.parent)
    this.parent.release(this, propagate)
  if(parent)
    this.parent = parent
  else
    delete this.parent
}
ArgumentReferenceView.prototype.becameActive = function() {
  flash(this.expressionDom, "green")
  if(this.activeCount == 0) {
    this.dom.addClass("active")
  }
  this.activeCount++
}
ArgumentReferenceView.prototype.becameInactive = function() {
  this.activeCount--
  if(this.activeCount == 0) {
    this.dom.removeClass("active")
  }
}
ArgumentReferenceView.prototype.meaning = function() {
  return this.argumentReference.notifying(this.becameActive.bind(this), this.becameInactive.bind(this))
}


// JAVASCRIPT MEANING VIEW

function JavascriptCodeView(javascriptMeaning, options) {
  options = options || {}
  
  this.javascriptMeaning = javascriptMeaning
  if(options.parent)
    this.setParent(options.parent)
  
  this.activeCount = 0

  // create dom
  this.dom = $("<div class='expression'></div>")
  setObjFor(this.dom, this)
  
  // set title
  this.dom.text("[built-in]")
  
  // right-clickable
  this.dom.bind('contextmenu', function(e) {
    clearSelection() // right-clicking usually selects the word under the cursor
    
    var menu = new MenuBuilder()
    menu.add("Delete", function() { this.parent.release(this, true) }.bind(this))
    menu.add("Show Source", function() { alert(this.javascriptMeaning.jsSource) }.bind(this))
    menu.open(e)
    
    return false
 }.bind(this));
}
JavascriptCodeView.prototype.toString = function() {
  return "JavascriptCodeView(" + this.argumentReference + ")"
}
JavascriptCodeView.prototype.setParent = function(parent, propagate) {
  if(this.parent == parent)
    return
  if(this.parent)
    this.parent.release(this, propagate)
  if(parent)
    this.parent = parent
  else
    delete this.parent
}
JavascriptCodeView.prototype.becameActive = function() {
  flash(this.expressionDom, "green")
  if(this.activeCount == 0) {
    this.dom.addClass("active")
  }
  this.activeCount++
}
JavascriptCodeView.prototype.becameInactive = function() {
  this.activeCount--
  if(this.activeCount == 0) {
    this.dom.removeClass("active")
  }
}
JavascriptCodeView.prototype.meaning = function() {
  return this.javascriptMeaning.notifying(this.becameActive.bind(this), this.becameInactive.bind(this))
}


// PALETTE

function PaletteView() {
  this.patternViews = {}
  this.patterns = {}

  // create dom
  this.dom = $("<div></div>")
  setObjFor(this.dom, this)
}
PaletteView.prototype.toString = function(pattern) {
  return "PaletteView()"
}
PaletteView.prototype.add = function(pattern) {
  if(this.patternViews[pattern.id])
    return
  
  var patternView = new PatternView(pattern, { parent: this })
  this.patterns[pattern.id] = pattern
  this.patternViews[pattern.id] = patternView
  this._append(patternView)
}
PaletteView.prototype.addSection = function(name) {
  this.dom.append("<h3>" + escapeHTML(name) + "</h3>")
}
PaletteView.prototype._append = function(patternView) {
  this.dom.append(" ") // keep white-space in-between, helps with wrapping and spacing
  this.dom.append(patternView.dom)
}
PaletteView.prototype.release = function(patternView, propagate) {
  var patternId = patternView.pattern.id
  var pattern = this.patterns[patternId]
  if(pattern) {
    var newPatternView = new PatternView(pattern, { parent: this })
    this.patternViews[patternId] = newPatternView
    newPatternView.dom.insertAfter(patternView.dom)
  }
  patternView.dom.detach()
  
  if(propagate && this.parent.childChanged) {
    this.parent.childChanged(this)
  }
}


// CANVAS VIEW

function CodeCanvasView() {
  this.patternViews = []

  // create dom
  this.dom = $("#program")
  setObjFor(this.dom, this)
}
CodeCanvasView.prototype.toString = function(pattern) {
  return "CodeCanvasView()"
}
CodeCanvasView.prototype.accept = function(patternView, propagate) {
  if(_.include(this.patternViews, patternView)) {
    return
  }
  
  // change linkage
  this.patternViews.push(patternView)
  patternView.setParent(this)

  // move patternView into our dom
  this.dom.append(patternView.dom)
  
  // TODO: position it well?
}
CodeCanvasView.prototype.release = function(child, propagate) {
  if(!_.include(this.patternViews, child)) {
    return
  }
  
  this.patternViews = arrayRemove(this.patternViews, child)

  child.dom.detach()
}


// CREATE VIEW
// takes an invocation or argument refrence or what-have-you and creates the proper view

function createView(unit) {
  if(unit instanceof InvocationMeaning) {
    var patternView = new PatternView(unit.pattern(), { representationIndex: unit.representationIndex })
    
    for(var argName in unit.args) {
      var arg = unit.args[argName]
      
      if("components" in arg) {
        var argViews = _.map(arg.components, createView)
        if(argViews.length == 1) {
          patternView.acceptArgument(argName, argViews[0])
        } else {
          patternView.acceptArgument(argName, argViews)
        }
      } else {
        patternView.acceptArgument(argName, createView(arg))
      }
    }
    return patternView
  } else if(unit instanceof ArgumentReference) {
    return new ArgumentReferenceView(unit)
  } else if(unit instanceof JavascriptMeaning) {
    return new JavascriptCodeView(unit)
  } else if(unit instanceof _BasicMeaning) {
    return new PatternView(unit.pattern())
  } else {
    throw new Error("what kind of unit is this?")
  }
}


// FLASH

// sends a gradient through the background of the given HTML element
// (if color is unspecified, it will be red)
function flash(elem, color) {
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


// RIGHT-CLICK MENU BUILDER

function MenuBuilder() {
  this.items = []
}
MenuBuilder.prototype.add = function(captionHtml, handler) {
  var item = { captionHtml: captionHtml, handler: handler }
  this.items.push(item)
}
MenuBuilder.prototype.addSubmenu = function(captionHtml) {
  var item = { captionHtml: captionHtml, submenu: new MenuBuilder() }
  this.items.push(item)
  return item.submenu
}
MenuBuilder.prototype.addSeparator = function() {
  var item = { isSeparator: true }
  this.items.push(item)
  return item
}
MenuBuilder.prototype.open = function(e) {
  var dom = this._generate()
  $("body").append(dom)
  $('<div class="overlay" style="position: fixed; left: 0; top: 0; right: 0; bottom: 0; background: #b6b; opacity: 0.2; zIndex: 100"></div>').click(function() {
    $(this).remove()
    dom.remove()
  }).bind('contextmenu', function() { return false }).appendTo($("body"))
  dom.css({ left: e.pageX, top: e.pageY, zIndex: '101' }).show();
 }
MenuBuilder.prototype._generate = function() {
  var menu = $("<div class='vmenu'></div>")
  for(var i in this.items) {
    var item = this.items[i]
    if(item.isSeparator) {
      menu.append($("<div class='sep_li'></div>"))
    } else {
      itemDom = $("<div class='first_li'><span>" + item.captionHtml + "</span></div>")
      menu.append(itemDom)
      if(item.submenu) {
        var submenuDom = $("<div class='vsubmenu'></div>")
        itemDom.append(submenuDom)
        item.submenu._appendTo(submenuDom)
      } else {
        itemDom.click(function() {
          if(this.handler) this.handler()
          $('.vmenu').hide();
          $('.overlay').hide();
        }.bind(item))
      }
    }
  }
  return menu
}
MenuBuilder.prototype._appendTo = function(parentDom) {
  for(var i in this.items) {
    var item = this.items[i]
    if(item.isSeparator) {
      parentDom.append($("<div class='sep_li'></div>"))
    } else {
      var dom = $("<div class='inner_li'><span>" + item.captionHtml + "</span></div>")
      parentDom.append(dom)
      dom.click(function() {
        if(this.handler)
          this.handler()
        $('.vmenu').hide();
        $('.overlay').hide();
      }.bind(item))
    }
  }
}

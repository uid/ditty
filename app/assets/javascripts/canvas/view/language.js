View.viewForMeaning = function(meaning) {
  if(meaning instanceof Invocation) {
    return new View.InvocationView(meaning)
  } else if(meaning instanceof ArgumentReference) {
    return new View.ArgumentReferenceView(meaning)
  } else {
    return new View.BasicMeaningView(meaning)
  }
  throw new Error("lol")
}


// you probably want to override compile()
View.Executable = my.Class({
  executeOrStop: function() {
    if(this.isExecuting()) {
      this.stopExecution()
    } else {
      this.execute()
    }
  },
  
  isExecuting: function() {
    return Globals.clickContext && Globals.clickContext.starter == this
  },
  
  execute: function() {
    var compiled = this.compile()
    
    // if something else is executing, stop it
    if(Globals.clickContext) {
      Globals.clickContext.stop()
    }
    
    // create our context
    Globals.clickContext = new Context([compiled], [Globals.clickEnv], {
      finished: function(result) {
        this.executionFinished.apply(this, arguments)
        delete Globals.clickContext
      }.bind(this),
      error: function(e) {
        this.executionError.apply(this, arguments)
        delete Globals.clickContext
      }.bind(this)
    })
    Globals.clickContext.starter = this
    
    // callback
    this.executionStarting()
    
    // begin!
    Globals.clickContext.slowRun()
  },
  
  stopExecution: function() {
    if(Globals.clickContext) {
      if(Globals.clickContext.starter == this) {
        Globals.clickContext.stop()
      }
    }
  },
  
  executionStarting: function() {
  },
  
  executionFinished: function(result) {
    if(typeof(result) !== "undefined") {
      $.achtung({ message: myToString(result), timeout: 5 })
    }
    this.executionEnded()
  },
  
  executionError: function(e) {
    $.achtung({ message: e, timeout: 5 })
    this.executionEnded()
  },
  
  executionEnded: function() {
  },
  
  compile: function() {
    return []
  },
})


View.CodeBlock = my.Class({
  containingCodeBlock: function() {
    return this.parentOfTypes([View.InvocationView])
  },
  
  directContainer: function() {
    return this.parentOfTypes([View.CodeCanvas, View.Palette, View.MultiSlotView])
  },
  
  parentOfTypes: function(types) {
    var parent = this.parent
    while(true) {
      if(!parent) {
        return undefined
      }
      
      for(var i in types) {
        if(parent instanceof types[i]) {
          return parent
        }
      }
      
      parent = parent.parent
    }
  },
  
  addCollapseButton: function() {
    this.collapseDom = $("<div class='collapse'></div>").text("COLLAPSE/RENAME").hide().appendTo(this.dom)
    this.dom.hoverIntent(function() { this.collapseDom.show() }.bind(this), function() { this.collapseDom.hide() }.bind(this))
    this.collapseDom.mousedown(_.bind(function(e) {
      e.stopPropagation()
      Globals.selectionManager.startSelecting(e, { include: this, requireParent: this.directContainer() })
    }, this))
    this.collapseDom.click(function(e) {
      if(Globals.selectionHandler.begun) return
      
      var parent = this.directContainer()
      if(parent && (parent instanceof View.MultiSlotView)) {
        var popup = parent.views.length > 1
        parent.beginFold([this])
        if(popup) alert("You can drag to collapse multiple things at once.")
      }
    }.bind(this))
  },
})


View.popupPatterns = function(patterns) {
  var dom = $("<div class='popup' />").appendTo($("body"))
  dom.draggable()
  dom.append($("<p style='margin-top: 0' />").append($("<a href='#'>Close</a>").click(function() { dom.remove(); return false })))
  _.each(patterns, function(pattern) {
    var invocation = new Invocation({ pattern: pattern.id })
    var view = new View.InvocationView(invocation)
    var generator = (function(invocation) { return function(parent) {
      return new View.InvocationView(invocation, { parent: parent })
    } })(invocation)
    dom.append(new View.BubbleBlower(generator).dom)
  })
}


View.applyCanvasDropping = function(klass) {
  klass.prototype.droppedOn = function(target) {
    this.dom.css({
      position: "relative",
      left: "",
      top: ""
    })
  }
  
  klass.prototype.droppedNowhere = function(offset, mouse) {
    if(mouse.left > $("#sidebar").outerWidth() && mouse.top > $("#hud-container").offset().top + $("#hud-container").outerHeight()) {
      if(this.parent) this.parent.dragout(this, Globals.canvas)
      this.dom.css({
        position: "absolute",
        left: (offset.left - Globals.canvas.dom.offset().left) + "px",
        top: (offset.top - Globals.canvas.dom.offset().top) + "px"
      })
      Globals.canvas.dropped(this)
    } else {
      if(this.parent) {
        this.parent.dragout(this, null /* target */)
      }
      playAudio("/assets/poof.mp3")
    }
  }
}


View.SlotView = my.Class({
  constructor: function(options) {
    options = options || {}
    
    this.parent = options.parent
    this.fillerText = options.fillerText || "Drag or type commands here."
    if("fillerHtml" in options) this.fillerHtml = options.fillerHtml
    this.dropCallback = options.drop
    this.dragoutCallback = options.dragout
    
    this.dom = $("<span class='slot unfilled'></span>")
    View.setObjFor(this.dom, this)
    
    this.resetText()
    
    this.dom.click(safeClick(this.click.bind(this)))
    
    View.droppable.droppable(this, this.dom)
  },
  
  toString: function() {
    return "SlotView()"
  },
  
  resetText: function() {
    if("fillerHtml" in this) {
      this.dom.html(this.fillerHtml)
    } else {
      this.dom.text(this.fillerText)
    }
  },
  
  click: function() {
    if(this.child) return
    
    var width = this.dom.width()
  
    this.dom.empty()
    var input = $("<input />").appendTo(this.dom)
    input.css("width", width + "px")
    input.focus()
    View.patternAutocomplete(input, this.dropped.bind(this), this.resetText.bind(this))
    input.trigger("keydown.autocomplete")
  },
  
  dropped: function(child) {
    this.accept(child)
    if(this.dropCallback) this.dropCallback(child)
  },
  
  dragout: function(child, target) {
    if(this.dragoutCallback) this.dragoutCallback(child, target)
  },
  
  accept: function(child) {
    child.setParent(this)
    this.child = child
    
    this.dom.removeClass("unfilled")
    this.dom.empty()
    this.dom.append(child.dom)
    this.dom.droppable("disable")
  },
  
  release: function(child) {
    child.dom.detach()
    delete this.child
    
    this.dom.addClass("unfilled")
    this.resetText()
    this.dom.droppable("enable")
  },
  
  eject: function() {
    if(this.child) {
      this.child.setParent(null)
      delete this.child
    }
  },
})


View.InbetweenSlotView = my.Class({
  constructor: function(options) {
    options = options || {}
    
    this.parent = options.parent
    this.dropCallback = options.drop
    
    this.dom = $("<li class='inbetweener not-editing'></li>")
    View.setObjFor(this.dom, this)
    
    this.buttonDom = $("<div class='insert'>+</div>").appendTo(this.dom)
    
    View.droppable.droppable(this, this.dom)
    
    this.dom.mouseenter(function(ev, source) {
      if(!source) this.isHovering = true
      if(dragging || this.editing) {
        return
      }
      this.hover()
    }.bind(this))
    
    this.dom.mouseleave(function(ev, source) {
      if(!source) this.isHovering = false
        
      if(!this.delayedMouseleave) {
        this.delayedMouseleave = _.debounce(function() {
          this.dom.trigger("mouseleave", "self")
        }.bind(this), 600)
      }
      
      if(source) {
        if(!this.isHovering) {
          this.unhover()
        }
      } else {
        this.delayedMouseleave()
      }
    }.bind(this))
    
    this.dom.click(safeClick(this.click.bind(this)))
    this.buttonDom.click(safeClick(this.click.bind(this)))
  },
  
  toString: function() {
    return "InbetweenSlotView()"
  },
  
  reset: function() {
    this.editing = false
    this.dom.addClass("not-editing")
    this.dom.empty()
    this.dom.css("height", "")
    this.dom.append(this.buttonDom)
  },
  
  // make it look like the mouse is hovering over
  hover: function() {
    this.dom.addClass("hover")
    this.dom.children(".insert").show()
  },
  
  // undoes everything done in hover()
  unhover: function() {
    this.dom.removeClass("hover")
    this.dom.children(".insert").hide()
  },
  
  click: function() {
    if(this.editing) return
    this.editing = true
    this.dom.removeClass("not-editing")
    this.dom.trigger("mouseleave", true /* fake */)
    
    this.unhover()
    
    var input = $("<input style='width: 100%; margin: 5px 0' />").appendTo(this.dom)
    this.dom.css("height", input.outerHeight(true /* includeMargin */) + "px")
    View.patternAutocomplete(input, this.dropped.bind(this), this.reset.bind(this))
    // input.focusout(this.reset.bind(this))
    // input.keydown(function(ev) {
    //   if(ev.keyCode == 13) {
    //     // this.dropped(new View.Dragger({ text: input.val() }))
    //     this.reset()
    //   } else if(ev.keyCode == 27) {
    //     this.reset()
    //   }
    // }.bind(this))
    input.focus()
  },
  
  dropped: function(child) {
    this.accept(child)
    if(this.dropCallback) this.dropCallback(child)
  },
  
  accept: function(child) {
    child.setParent(this)
    this.child = child
    
    this.dom.droppable("disable")
  },
  
  release: function(child) {
    child.dom.detach()
    delete this.child
    
    this.dom.droppable("enable")
  },
})


// options.collection: collection to show
// options.modelToView(model): function returning the view for the given model
// options.viewToModel(model): function returning the model for the given view
View.MultiSlotView = my.Class({
  constructor: function(options) {
    options = options || {}
    
    if(options.parent) this.parent = options.parent
    this.fillerText = options.fillerText || "Drag or type commands here."
    if(options.limit) this.limit = options.limit
    
    if("collection" in options) {
      this.collection = options.collection
      this.modelToView = options.modelToView
      this.viewToModel = options.viewToModel
      
      this.models = this.collection.map(function(o) { return o })
      this.views = this.collection.map(function(o) { return options.modelToView(o) })
      
      this.collection.on("add", function(model, collection, options) {
        if(this.models[options.index] == model) return
        
        this.models.splice(options.index, 0, model)
        this.views.splice(options.index, 0, this.modelToView(model))
        this.rebuildDom()
      }, this)
      this.collection.on("remove", function(model, collection, options) {
        if(this.models[options.index] != model) return
        
        this.models.splice(options.index, 1)
        this.views.splice(options.index, 1)
        this.rebuildDom()
      }, this)
      this.collection.on("reset", function() {
        throw new Error("I don't know what to do")
      }, this)
    } else {
      this.views = []
    }
    
    this.dom = $("<ul class='multislot'></ul>")
    View.setObjFor(this.dom, this)
    
    this.rebuildDom()
  },
  
  toString: function() {
    return "MultiSlotView()"
  },
  
  setLimit: function(limit) {
    if(limit == this.limit) {
      return
    }
    
    if(limit == 0) {
      delete this.limit
    } else {
      this.limit = limit
    }
    this.rebuildDom()
  },
  
  // removes all children, recreates the DOM, and adds them back
  rebuildDom: function() {
    // beginning of a new epoch
    delete this.indexAdjustment
    
    // release all the children and clear the DOM
    _.each(this.views, function(v) { v.setParent(null) })
    this.dom.html("")
    
    // rebiuld the DOM
    if(this.views.length == 0) {
      this.dom.css("vertical-align", "baseline")
      this.dom.append(this.makeSlot(0))
    } else if(this.limit && this.views.length >= this.limit) {
      this.dom.css("vertical-align", "middle")
      for(var i in this.views) {
        this.dom.append(this.makeSlot(i, this.views[i]))
      }
    } else {
      this.dom.css("vertical-align", "middle")
      for(var i in this.views) {
        this.dom.append(this.makeInbetweener(i))
        this.dom.append(this.makeSlot(i, this.views[i]))
      }
      this.dom.append(this.makeInbetweener(this.views.length))
    }
  },
  
  // returns the dom
  makeInbetweener: function(index) {
    var isv = new View.InbetweenSlotView({ parent: this, drop: this.makeInsertCallback(index) })
    return isv.dom
  },
  
  // if no child given, makes an empty slot
  // returns the dom
  makeSlot: function(index, child) {
    var sv = new View.SlotView({
      parent: this,
      fillerText: this.fillerText,
      drop: this.makeInsertCallback(index),
      dragout: this.makeRemoveCallback(index)
    })
    
    if(child) {
      sv.accept(child)
    }
    
    var li = $("<li class='content'></li>").append(sv.dom)
    li.mousemove(function(ev, ui) {
      if($(this).prev().length == 0 || $(this).next().length == 0) {
        return
      }
      var margin = 15
      var d1 = Math.abs($(this).prev().offset().top - ev.pageY)
      if(d1 < margin) {
        $(this).prev().trigger("mouseenter", "neighbor" /* source */)
      } else {
        $(this).prev().trigger("mouseleave", "neighbor" /* source */)
      }
      var d2 = Math.abs($(this).next().offset().top - ev.pageY)
      if(d2 < margin) {
        $(this).next().trigger("mouseenter", "neighbor" /* source */)
      } else {
        $(this).next().trigger("mouseleave", "neighbor" /* source */)
      }
    })
    li.mouseleave(function(ev, ui) {
      $(this).prev().mouseleave()
      $(this).next().mouseleave()
    })
    return li
  },
  
  makeInsertCallback: function(i) {
    return function(child) { this.insertChild(child, this._adjustIndex(i)) }.bind(this)
  },
  
  makeRemoveCallback: function(i) {
    return function(child, target) { this.removeChild(child, this._adjustIndex(i), target) }.bind(this)
  },
  
  _adjustIndex: function(i) {
    if(("indexAdjustment" in this) && i > this.indexAdjustment) {
      return i - 1
    }
    return i
  },
  
  insertChild: function(child, index) {
    this.views.splice(index, 0, child)
    
    if(this.collection) {
      this.models.splice(index, 0, this.viewToModel(child))
      this.collection.add(this.viewToModel(child), { at: index })
    }
    
    // rebiuld the DOM!
    this.rebuildDom()
  },
  
  removeChild: function(child, index, target) {
    child.dom.detach()
    
    this.views.splice(index, 1)
    
    if(this.collection) {
      this.models.splice(index, 1)
      this.collection.remove(this.collection.at(index))
    }
    
    // only rebuild the DOM if an insert isn't coming immediately afterward
    if(target && target.parent == this) {
      this.indexAdjustment = index
    } else {
      this.rebuildDom()
    }
  },
  
  removeChildren: function(children, index) {
    _.each(children, function(v) { v.dom.detach() })
    
    this.views.splice(index, children.length)
    
    if(this.collection) {
      this.models.splice(index, children.length)
      this.collection.remove(children)
    }
  },
  
  // @views is a (possibly sparse) array of views;
  // returns the range as a 2-element array represented by @views,
  // or -1 if not all views are present
  _viewsRange: function(views) {
    if(views.length == 0) return undefined
    
    var indices = _.map(views, function(v) { return _.indexOf(this.views, v) }.bind(this))
    if(_.any(indices, function(i) { return i == -1 })) {
      return undefined
    }
    
    var sorted = indices.sort()
    return [sorted[0], sorted[sorted.length - 1]]
  },
  
  // return an array of the children in @items without gaps
  // (including children between children in the set)
  continuousSelection: function(views) {
    if(views.length == 0) return []
    
    var range = this._viewsRange(views)
    
    if(!range) {
      console.log("warning: selection of views aren't all within this multislot")
      return views
    }
    
    return this.views.slice(range[0], range[1] + 1)
  },
  
  beginFold: function(views) {
    if(views.length == 0) return
    
    var range = this._viewsRange(views)
    
    if(!range) {
      alert("Sorry, something went wrong and it's Tom's fault.")
      return views
    }
    
    var name = prompt("Name?")
    if(!name) return
    
    var foldView = new View.PromisedInvocation({ name: name })
    Globals.canvas.dropped(foldView)
    scrollIntoView(foldView.dom)
    
    this.removeChildren(this.views.slice(range[0], range[1] + 1), range[0])
    
    // start creating the pattern
    var patternAttrs = {
      representations: [{ template: name }],
      native_meaning: _.map(views, function(v) { return v.model }),
      fold: true
    }
    var pattern = Patterns.create(patternAttrs, {
      wait: true,
      success: function() {
        foldView.loadSuccess()
        
        var invocation = new Invocation({ pattern: pattern.id })
        var realView = new View.InvocationView(invocation)
        this.insertChild(realView, range[0])
        // realView.toggleSource()
        // realView.editTemplate()
      }.bind(this),
      error: function() {
        console.log("pattern create failed", arguments)
        foldView.loadError()
      },
    })
  },
})


View.BasicMeaningView = my.Class(View.Executable, View.CodeBlock, {
  constructor: function(meaning, options) {
    options || (options = {})
    
    this.meaning = this.model = meaning
    if(options.parent) this.parent = options.parent
    
    this.dom = $("<div class='bubble'></div>")
    this.representationDom = $("<div class='representation'></div>").appendTo(this.dom)
    View.setObjFor(this.dom, this)
    
    this.dom.css("font-family", "monospace")
    
    this.meaning.on("change", this.render, this)
    
    View.draggable.draggable(this, this.dom, { handle: ".representation" })
    
    // this.addCollapseButton()
    
    this.render()
    
    this.representationDom.click(safeClick(this.executeOrStop.bind(this)))
  },
  
  render: function() {
    this.representationDom.empty()
    this.representationDom.html(visibleWhitespace(htmlEncode(this.meaning.getValue()), { space: false }))
  },
  
  compile: function() {
    var compiled = [this.meaning.compile()]
    var before = new VM.IJavascript(function() { View.flash(this.representationDom, "green"); this.dom.addClass("active") }.bind(this), true /* noSave */)
    var after = new VM.IJavascript(function() { this.dom.removeClass("active") }.bind(this), true /* noSave */)
    before.runOnUnwind = after.runOnUnwind = true
    return [before].concat(compiled.concat([after]))
  },
})
View.draggable.decorate(View.BasicMeaningView)
View.applyCanvasDropping(View.BasicMeaningView)


View.ArgumentReferenceView = my.Class(View.Executable, View.CodeBlock, {
  constructor: function(reference, options) {
    options || (options = {})
    
    this.reference = this.model = reference
    if(options.parent) this.parent = options.parent
    
    this.dom = $("<div class='bubble reference'></div>")
    this.representationDom = $("<div class='representation'></div>").appendTo(this.dom)
    View.setObjFor(this.dom, this)
    
    this.reference.on("change", this.render, this)
    
    View.draggable.draggable(this, this.dom, { handle: ".representation" })
    
    // this.addCollapseButton()
    
    this.render()
    
    this.representationDom.click(safeClick(this.executeOrStop.bind(this)))
  },
  
  render: function() {
    this.representationDom.empty()
    this.representationDom.text(this.reference.get("name"))
  },
  
  compile: function() {
    var compiled = [this.reference.compile()]
    var before = new VM.IJavascript(function() { View.flash(this.representationDom, "green"); this.dom.addClass("active") }.bind(this), true /* noSave */)
    var after = new VM.IJavascript(function() { this.dom.removeClass("active") }.bind(this), true /* noSave */)
    before.runOnUnwind = after.runOnUnwind = true // TODO: begin.runOnUnwind shouldn't be true, here or anywhere else
    return [before].concat(compiled.concat([after]))
  },
})
View.draggable.decorate(View.ArgumentReferenceView)


View.PromisedInvocation = my.Class({
  constructor: function(options) {
    options || (options = {})
    
    this.dom = $("<div class='bubble' />")
    View.setObjFor(this.dom, this)
    
    this.caption = options.name ? "Creating \"" + options.name + "\"" : "Creating Command"
    
    this.representationDom = $("<div class='representation'></div>").appendTo(this.dom)
    this.representationDom.append("<img src='/assets/spinner.gif' style='padding: 8px; vertical-align: middle' />")
    this.representationDom.append($("<span style='position: relative; top: 2px; padding-left: 4px; padding-right: 8px'></span>").text(this.caption).append("&#8230;"))
  },
  
  loadSuccess: function(realView) {
    if(realView) this.parent.dropped(realView)
    this.parent.release(this)
  },
  
  loadError: function() {
    this.representationDom.html($("<span style='position: relative; top: 2px; padding-left: 4px; padding-right: 8px'></span>").text("Pattern creation failed!"))
    this.representationDom.css({ background: "#d70014", color: "white" })
    setTimeout(this.destroy.bind(this), 5000)
  },
  
  destroy: function() {
    this.setParent(null)
    this.dom.remove()
  },
  
  setParent: View.draggable.setParent,
})


View.FakeInvocationView = my.Class({
  constructor: function(invocation, options) {
    options = options || {}
    
    this.invocation = invocation
    this.parent = options.parent
    
    this.dom = $("<div class='bubble'></div>")
    this.representationDom = $("<div class='representation'></div>").appendTo(this.dom)
    View.setObjFor(this.dom, this)
    
    this.renderRepresentation()
  },
  
  renderRepresentation: function() {
    var template = this.invocation.getCurrentTemplate()
    
    for(var i in template.components) {
      var c = template.components[i]
      if("text" in c) {
        this.representationDom.append(c.text)
      } else if("parameter" in c) {
        $("<span class='slot unfilled'></span>").text(c.parameter).appendTo(this.representationDom)
      }
    }
  },
})


View.InvocationView = my.Class(View.Executable, View.CodeBlock, {
  constructor: function(invocation, options) {
    options = options || {}
    
    this.invocation = this.model = invocation
    this.parent = options.parent
    this.slotViews = {}
    
    this.dom = $("<div class='bubble'></div>")
    this.representationDom = $("<div class='representation'></div>").appendTo(this.dom)
    this.savingDom = $("<span class='saving'>Saving</span>")
    this.meaningDom = $("<div class='meaning'></div>").appendTo(this.dom)
    this.stopDom = $("<div class='stop'></div>").text("STOP").hide().appendTo(this.dom)
    View.setObjFor(this.dom, this)
    
    // collapse handle
    // this.addCollapseButton()
    
    // re-render the representationDom when it changes
    this.invocation.on("change:representationIndex", this.representationsChanged, this)
    this.invocation.getPattern().on("change:representations", this.representationsChanged, this)
    
    // re-render meaning when references change (wasteful, but I'm short on time)
    this.invocation.getPattern().on("change:referencing_patterns", this.meaningChanged, this)
    
    // stop executing when the pattern or invocation change
    this.invocation.getPattern().on("change", this.stopExecution.bind(this))
    this.invocation.on("change", this.stopExecution.bind(this))
    
    // saving
    this.invocation.getPattern().on("savebegin", function() { this.savingDom.show() }, this)
    this.invocation.getPattern().on("saveend", function() { this.savingDom.hide() }, this)
    
    View.draggable.draggable(this, this.dom, { handle: ".representation" })
    
    this.renderRepresentation()
    
    this.representationDom.mouseup(safeClick(function(e) {
      if(e.button != 2) return
      this.toggleSource()
    }.bind(this)))
    
    this.representationDom.click(safeClick(this.executeOrStop.bind(this)))
    this.stopDom.click(safeClick(this.stopExecution.bind(this)))
  },
  
  representationsChanged: function() {
    this.renderRepresentation()
    this.renderMeaning() // because of the variable list
  },
  
  meaningChanged: function() {
    this.renderMeaningIfNecessary()
  },
  
  parentChanged: function() {
    this.stopExecution()
  },
  
  executionStarting: function() {
    this.stopDom.show()
  },
  
  executionEnded: function() {
    this.stopDom.hide()
  },
  
  isEditing: function() {
    return this.editing
  },
  
  toggleSource: function() {
    this.editing = !this.editing
    
    if(this.editing) {
      this.renderMeaning()
    }
    
    this.renderRepresentation()
    
    this.dom.toggleClass("editing")
    this.representationDom.toggleClass("editing")
    this.meaningDom.animate(
      {
        "height" : "toggle",
        "padding-top" : "toggle",
        "padding-bottom" : "toggle"
      },
      { duration: 300 }
    )
  },
  
  _clearRepresentationDom: function() {
    for(var i in this.slotViews) {
      this.slotViews[i].dom.detach()
    }
    this.representationDom.empty()
  },
  
  renderRepresentation: function() {
    if(this.isEditing()) {
      this.renderEditableRepresentation()
    } else {
      this.renderNonEditableRepresentation()
    }
    
    if(this.invocation.getPattern().isSomeoneElses()) {
      var pattern = this.invocation.getPattern()
      var creator = pattern.get("creator")
      var dot = $("<img src='/assets/blue-dot.png' />")
      dot.attr("title", "created by " + creator.readable_name)
      dot.css({
        position: "absolute",
        top: -2,
        right: -2
      })
      this.representationDom.append(dot)
    }
    
    this.representationDom.append(this.savingDom)
  },
  
  renderNonEditableRepresentation: function() {
    this._clearRepresentationDom()
    
    var pattern = this.invocation.getPattern()
    var repr = this.invocation.getCurrentTemplate()
    for(var i in repr.components) {
      var c = repr.components[i]
      if("text" in c) {
        this.representationDom.append(c.text)
      } else if("parameter" in c) {
        var arg = pattern.getArgument(c.parameter)
        // XXX: arg may not exist if we're re-rendering based on an argument list change event
        if(arg) {
          this.representationDom.append(this._slotView(arg).dom)
        }
      }
    }
  },
  
  renderEditableRepresentation: function() {
    this.renderNonEditableRepresentation()
    
    this.representationDom.append(" ")
    this.representationDom.append($("<button>Edit name&#8230;</button>").click(this.editTemplate.bind(this)))
    
    if(this.invocation.getPattern().native_meaning) {
      this.representationDom.append(" ")
      this.representationDom.append($("<button>Fork</button>").click(this.forkPattern.bind(this)))
    }
  },
  
  editTemplate: function() {
    new View.TemplateEditor(this.invocation.getCurrentTemplate(), this.invocation.getPattern())
  },
  
  forkPattern: function() {
    var origPattern = this.invocation.getPattern()
    var origJSON = JSON.parse(JSON.stringify(origPattern))
    
    // put the placeholder in place
    var view = new View.PromisedInvocation({ name: this.invocation.getCurrentTemplate().text })
    Globals.canvas.dropped(view)
    scrollIntoView(view.dom)
    
    // start creating the pattern
    console.log("forking pattern...")
    var pattern = Patterns.create({
      representations: origJSON.representations,
      arguments: origJSON.arguments,
      native_meaning: origJSON.native_meaning,
      original_id: origPattern.id
    }, {
      wait: true,
      success: function() {
        var invocation = new Invocation({ pattern: pattern.id })
        var realView = new View.InvocationView(invocation)
        view.loadSuccess(realView)
        realView.toggleSource()
        this.renderMeaning()
      }.bind(this),
      error: function() {
        console.log("pattern fork failed", arguments)
        view.loadError()
      },
    })
  },
  
  renderMeaningIfNecessary: function() {
    if(this.editing && !this.renderedMeaning) {
      this.renderMeaning()
      this.renderedMeaning = true
    }
  },
  
  renderMeaning: function() {
    this.meaningDom.empty()
    
    var pattern = this.invocation.getPattern()
    
    var creator = pattern.get("creator")
    if(pattern.isBuiltIn()) {
    } else if(pattern.isMine()) {
      this.meaningDom.prepend($("<p class='author'>created by <span class='me'>you</span></p>"))
    } else {
      this.meaningDom.prepend($("<p class='author'>created by " + (creator.readable_name || "anonymous") + "</p>"))
    }
    
    if("native_meaning" in pattern) {
      if(pattern.arguments.length > 0) {
        var paramsDom = $("<div>Variables: </div>").appendTo(this.meaningDom)
        for(var i in pattern.arguments.models) {
          var param = pattern.arguments.models[i]
          paramsDom.append(new View.BubbleBlower((function(param) { return function(parent) { return new View.ArgumentReferenceView(new ArgumentReference({ name: param.get("name") }), { parent: parent }) } })(param)).dom)
        }
        paramsDom.append("<hr />")
      }
      
      this.meaningMSV = new View.MultiSlotView({
        collection: pattern.native_meaning,
        modelToView: function(m) { return View.viewForMeaning(m) },
        viewToModel: function(v) { return v.model },
        parent: this
      })
      this.meaningDom.append(this.meaningMSV.dom)
    } else if("javascript_meaning" in pattern) {
      var meaning = pattern.javascript_meaning
      $("<textarea disabled></textarea>").appendTo(this.meaningDom).val(meaning).change(function(e) {
        this.invocation.getPattern().set("javascript_meaning", $(e.target).val())
      }.bind(this))
    }
    
    var pattern = this.invocation.getPattern()
    
    var getPattern = function(id) { return Patterns.get(id) }
    
    var references = _.map(pattern.get("referencing_patterns"), getPattern)
    var othersReferences = _.map(_.filter(references, function(r) { return !Patterns.get(r).isMine() }), getPattern)
    var forks = Patterns.where({ original_id: pattern.id })
    
    if(!Globals.social) {
      references = _.filter(references, function(p) { return p.isMine() || p.isBuiltIn() })
      othersReferences = []
    }
    
    var numReferences = references ? references.length : 0
    var numOthersReferences = othersReferences.length
    
    if(numReferences > 0 || forks.length > 0 || pattern.has("original_id")) {
      var stats = $("<p class='stats'></p>").appendTo(this.meaningDom)
      
      if(pattern.has("original_id")) {
        var orig = Patterns.get(pattern.get("original_id"))
        if(orig) {
          stats.append("forked from <a href='#' class='orig'>another command</a>")
          stats.find(".orig").click(function() { View.popupPatterns([orig]) })
        }
      }
        
      if(numReferences > 0) {
        if(stats.html().length > 0) {
          stats.append(". ")
        }
        stats.append(_.template("used in <a href='#'><%= count %> commands</a>", { count: numReferences }))
        stats.children("a").click(function() { View.popupPatterns(references); return false })
        this.meaningDom.append(stats)
        if(numOthersReferences > 0) {
          var moreStats = $(_.template("<a href='#'><%= count %> from other people</a>)", { count: numOthersReferences }))
          moreStats.click(function() { View.popupPatterns(othersReferences); return false })
          stats.append(" (").append(moreStats).append(")")
        }
      }
      
      if(forks.length > 0) {
        if(stats.html().length > 0) {
          stats.append(". ")
        }
        
        if(pattern.isMine()) {
          var othersForks = _.filter(forks, function(p) { return !p.isMine() })
          if(othersForks.length > 0) {
            stats.append(_.template("<a href='#' class='forks-all'><%= count %> derived commands</a> (<a href='#' class='forks-others'><%= othersCount %> from others</a>)", { count: forks.length, othersCount: othersForks.length }))
          } else {
            stats.append(_.template("<a href='#' class='forks-all'><%= count %> derived commands</a>", { count: forks.length }))
          }
          stats.find(".forks-all").click(function() { View.popupPatterns(forks); return false })
          stats.find(".forks-others").click(function() { View.popupPatterns(othersForks); return false })
        } else {
          var myForks = _.filter(forks, function(p) { return p.isMine() })
          if(myForks.length > 0) {
            stats.append(_.template("<a href='#' class='forks-all'><%= count %> derived commands</a> (<a href='#' class='forks-others'><%= othersCount %> are yours</a>)", { count: forks.length, othersCount: myForks.length }))
          } else {
            stats.append(_.template("<a href='#' class='forks-all'><%= count %> derived commands</a>", { count: forks.length }))
          }
          stats.find(".forks-all").click(function() { View.popupPatterns(forks); return false })
          stats.find(".forks-others").click(function() { View.popupPatterns(myForks); return false })
        }
      }
    }
  },
  
  _slotView: function(param) {
    var name = param.get("name")
    if(name in this.slotViews) {
      this.slotViews[name].setLimit(param.get("type") == "instructions" ? 0 : 1)
      return this.slotViews[name]
    }
    
    // TODO: make a collection of the params and use that
    var svOpts = {
      fillerText: name,
      collection: this.invocation.argumentValue(param.get("name")),
      modelToView: function(m) { return View.viewForMeaning(m) },
      viewToModel: function(v) { return v.model },
      parent: this
    }
    
    if(param.get("type") != "instructions") {
      svOpts.limit = 1
    }
    
    return this.slotViews[name] = new View.MultiSlotView(svOpts)
  },
  
  compile: function() {
    var compiled
    var pattern = this.invocation.getPattern()
    
    if(this.renderedMeaning && "native_meaning" in pattern) {
      compiled = [this.invocation.compile()]
      
      /*
      var args = _.inject(this.arguments, function(args, mc, name) {
        args[name] = mc.compile()
        return args
      }, {})
      return new VM.ICall(this.getPattern().compile(), args)
      */
    } else {
      compiled = [this.invocation.compile()]
    }
    
    var before = new VM.IJavascript(function() { View.flash(this.representationDom, "green"); this.dom.addClass("active") }.bind(this), true /* noSave */)
    var after = new VM.IJavascript(function() { this.dom.removeClass("active") }.bind(this), true /* noSave */)
    before.runOnUnwind = after.runOnUnwind = true
    
    return [before].concat(compiled.concat([after]))
  }
})
View.draggable.decorate(View.InvocationView)
View.applyCanvasDropping(View.InvocationView)


View.TrashView = my.Class({
  constructor: function(options) {
    options = options || {}
    
    this.dom = $("<div class='trash'></div>")
    View.setObjFor(this.dom, this)
    
    View.droppable.droppable(this, this.dom, { hoverClass: "hover", tolerance: "pointer" })
  },
  
  toString: function() {
    return "TrashView()"
  },
  
  dropped: function(child) {
    this.accept(child)
    playAudio("/assets/drag-to-trash.mp3")
  },
  
  accept: function(child) {
    child.setParent(null)
  },
})


View.BubbleBlower = my.Class({
  // generator: function which takes a parent and returns a view (with that parent) to replace the one that was dragged away
  constructor: function(generator, options) {
    options || (options = {})
    
    this.generator = generator
    if(options.parent) this.parent = options.parent
    
    this.dom = $("<div style='display: inline-block'></div>")
    View.setObjFor(this.dom, this)
    
    this.respawn(false)
  },
  
  respawn: function(animate) {
    var obj = this.generator(this)
    this.dom.append(obj.dom)
    if(animate) {
      obj.dom.css({ opacity: 0 })
      obj.dom.animate({ opacity: 1 }, { duration: 500 })
    }
  },
  
  dragout: function(child, target) {
  },

  release: function(child) {
    child.dom.detach()
    this.respawn(true)
  },
})


View.CodeCanvas = my.Class({
  constructor: function(dom, options) {
    options = options || {}
    
    this.dom = dom
    View.setObjFor(this.dom, this)
  },
  
  toString: function() {
    return "View.CodeCanvas()"
  },
  
  dragout: function(child, target) {
  },
  
  release: function(child) {
    child.dom.detach()
  },
  
  dropped: function(child) {
    this.accept(child)
  },
  
  accept: function(child) {
    child.setParent(this)
    this.dom.append(child.dom)
  },
})


View.HappyTextbox = my.Class({
  constructor: function(options) {
    options || (options = {})
    
    if(options.editable) this.editable = true
    
    this.dom = $("<div class='happy-text-container'></div>")
    View.setObjFor(this.dom, this)
    
    this.staticDom = $("<div class='happy-text'></div>").appendTo(this.dom)
    
    this.showCursor = true
    if("showCursor" in options) this.showCursor = options.showCursor
    
    this.setText(options.text || "")
    this.cursorPosition = 0
    
    if(this.editable) {
      this.staticDom.click(function() {
        var hide = function() {
          this.textarea.remove()
          delete this.textarea
          this.staticDom.show()
          $("body").unbind("mousedown", duder)
        }.bind(this)
        var update = function() {
          this.setText(this.textarea.val())
        }.bind(this)
        var duder = function(e) {
          if(e.target != this.textarea.get(0)) {
            update()
            hide()
          }
        }.bind(this)
        this.textarea = $("<textarea></textarea>").text(this.text)
                                                  .css({ width: this.staticDom.width(), height: this.staticDom.height() })
                                                  .keypress(update)
                                                  .focusout(function() {
                                                    update()
                                                    hide()
                                                  }.bind(this))
                                                  .prependTo(this.dom)
                                                  .focus()
        $("body").bind("mousedown", duder)
        this.staticDom.hide()
      }.bind(this))
    }
    
    this._resetText()
  },
  
  myToString: function() {
    return "text cursor"
  },
  
  setText: function(text) {
    this.text = text
    this._resetText()
  },
  
  insertText: function(text) {
    this.setText(this.text.slice(0, this.cursorPosition) + text + this.text.slice(this.cursorPosition))
    this.setCursorPosition(this.cursorPosition + text.length)
  },
  
  appendText: function(text) {
    this.setText(this.text + text)
  },
  
  setCursorPosition: function(pos) {
    this.cursorPosition = pos
    this._resetText()
  },
  
  advanceCursor: function(amount) {
    this.cursorPosition += amount
    this._resetText()
  },
  
  characterAtCursor: function() {
    return this.text[this.cursorPosition]
  },
  
  _resetText: function() {
    if(this.showCursor) {
      var cursor = $("<span class='cursor' />")
      cursor.blink({ delay: Math.random() * 20 + 500 })
      
      this.staticDom.empty()
      this.staticDom.append($("<span class='text' />").html(visibleWhitespace(htmlEncode(this.text.slice(0, this.cursorPosition)))))
      this.staticDom.append(cursor)
      this.staticDom.append($("<span class='text' />").html(visibleWhitespace(htmlEncode(this.text.slice(this.cursorPosition)) + "\n")))
      // the extra newline is necessary so that there's a blank line at the end if the actual text ends with \n
    } else {
      this.staticDom.empty()
      this.staticDom.append($("<span class='text' />").html(visibleWhitespace(htmlEncode(this.text))))
    }
  },
})

View.TemplateEditor = my.Class({
  constructor: function(template, pattern) {
    this.originalTemplate = template
    this.template = new Template(template.attributes)
    this.pattern = pattern
    
    this.newParams = new ArgumentReferenceCollection(this.pattern.get("arguments"))
    
    this.dom = $("<div class='template-editor-container'></div>").appendTo($("body"))
    View.setObjFor(this.dom, this)
    
    this.backgroundView = $("<div class='background'></div>").appendTo(this.dom)
    this.editorView = $("<div class='template-editor'></div>").appendTo(this.dom)
    
    $("<h2>Template</h2>").appendTo(this.editorView)
    $("<div style='margin: 8px 0'>Surround parameters with [square brackets].</div>").appendTo(this.editorView)
    this.textEntry = $("<textarea></textarea>").text(this.template.text).appendTo(this.editorView)
    this.textEntry.change(this._templateChanged.bind(this))
    this.textEntry.keyup(this._templateChanged.bind(this))
    
    this.errorDom = $("<div class='errors'></div>").appendTo(this.editorView)
    this.previewDom = $("<div class='preview'></div>").appendTo(this.editorView)
    this._renderPreview()
    
    $("<h3>Parameters</h3>").appendTo(this.editorView)
    this.paramsDom = $("<div class='params'></div>").appendTo(this.editorView)
    this._renderParams()
    
    var buttons = $("<div class='buttons'></div>").appendTo(this.editorView)
    this.cancelButton = $("<button>Cancel</button>").appendTo(buttons).click(function() { this.dom.remove() }.bind(this))
    this.saveButton = $("<button>Save</button>").css("font-weight", "bold").appendTo(buttons).click(function() {
      this._save()
      this.dom.remove()
    }.bind(this))
    
    this.template.on("error", function(template, error) {
      this.errorDom.text("Error: " + error)
      this.saveButton.attr("disabled", true)
    }, this)
    
    this.textEntry.focus()
  },
  
  _save: function() {
    var removed = this.pattern.arguments.filter(function(arg) { return this.template.parameters.indexOf(arg.get("name")) == -1 }.bind(this))
    this.pattern.arguments.remove(removed)
    
    for(var i in this.template.parameters) {
      var name = this.template.parameters[i]
      var novel = this.newParams.where({ name: name })[0]
      var existing = this.pattern.arguments.where({ name: name })[0]
      if(existing) {
        existing.clear({ silent: true })
        existing.set(novel.attributes)
      } else {
        this.pattern.arguments.add(novel.attributes)
      }
    }
    
    this.originalTemplate.set("template", this.template.get("template"))
  },
  
  _templateChanged: _.throttle(function() {
    if(this.template.set("template", this.textEntry.val())) {
      this.errorDom.empty()
      this.saveButton.attr("disabled", false)
    }
    this._updateParams()
    this._renderPreview()
    this._renderParams()
  }, 30),
  
  _updateParams: function() {
    for(var i in this.template.parameters) {
      var name = this.template.parameters[i]
      var param = this.newParams.where({ name: name })[0]
      
      // create the parameter if it's new
      if(!param) {
        param = new this.newParams.model({ name: name, type: "value" })
        param.added = true
        this.newParams.add(param)
      }
    }
  },
  
  _renderPreview: function() {
    this.previewDom.empty()
    
    var bubble = $("<div class='bubble'></div>").appendTo(this.previewDom)
    var repr = $("<div class='representation'></div>").appendTo(bubble)
    
    for(var i in this.template.components) {
      var c = this.template.components[i]
      if("text" in c) {
        repr.append(c.text)
      } else if("parameter" in c) {
        $("<span class='slot unfilled'></span>").text(c.parameter).appendTo(repr)
      }
    }
  },
  
  _renderParams: function() {
    this.paramsDom.empty()
    
    var table = $("<table></table>").appendTo(this.paramsDom)
    table.append($("<tr><th>Name</th><th>Type</th></tr>"))
    
    for(var i in this.template.parameters) {
      var name = this.template.parameters[i]
      this._makeParamRow(name, table)
    }
  },
  
  _makeParamRow: function(name, table) {
    var row = $("<tr></tr>").appendTo(table)
    var param = this.newParams.where({ name: name })[0]
    
    // name
    $("<td></td>").text(name).appendTo(row)
    
    // type
    var type = param.get("type")
    var select = this._typeSelect(type)
    select.change(function() {
      param.set("type", select.val() )
    }.bind(this))
    $("<td></td>").append(select).appendTo(row)
    
    // state
    $("<td></td>").text(param.added ? "new" : "").appendTo(row)
  },
  
  _typeSelect: function(type) {
    var types = ["value", "instructions"]
    var dom = $("<select></select>")
    
    for(var i in types) {
      $("<option></option>").text(types[i]).attr("selected", type == types[i]).appendTo(dom)
    }
    
    return dom
  },
})

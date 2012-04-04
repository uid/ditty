
View.patternAutocomplete = function(input, dropped, dismiss) {
  // input.focusout(dismiss)
  input.keydown(function(ev) { if(ev.keyCode == 27) { dismiss() } })
    
  input.autocomplete({
    delay: 0,
    autoFocus: true,
    minLength: 0,
    source: function(request, callback) {
      var matches = []
      
      if(/^-?[0-9.]+$/i.exec(request.term)) {
        var view = new View.BasicMeaningView(new NumberMeaning({ number: parseFloat(request.term) }))
        var item = $("<div>number: </div>").append(view.dom)
        matches.push({ value: item, result: view })
      }
      
      if(request.term.length > 0 && ("true".indexOf(request.term) == 0 || "false".indexOf(request.term) == 0)) {
        var value = (request.term.indexOf("t") != -1)
        var view = new View.BasicMeaningView(new BooleanMeaning({ boolean: value }))
        var item = $("<div>boolean: </div>").append(view.dom)
        matches.push({ value: item, result: view })
      }
      
      if(true) {
        var view = new View.BasicMeaningView(new StringMeaning({ string: request.term }))
        var item = $("<div>string: </div>").append(view.dom)
        matches.push({ value: item, result: view })
      }
      
      var keywords = request.term.toLowerCase().split(" ")
      var keywordMatches = []
      for(var pid in Patterns.models) {
        if(isNaN(parseFloat(pid))) continue // skip non-numeric keys (they're backward-compatibility dupes)
        var pattern = Patterns.models[pid]
      
        for(var i in pattern.templates.models) {
          var template = pattern.templates.models[i]
          var text = template.text.toLowerCase()
          
          // check that all keywords are present
          var found = true
          var minIndex = 1000
          for(var j in keywords) {
            var index = text.indexOf(keywords[j])
            if(index == -1) {
              found = false
              break
            }
            if(index < minIndex) minIndex = index
          }
          if(found) {
            var dom = $("<div style='position: relative'></div>")
            var view = new View.InvocationView(new Invocation({ pattern: pattern, representationIndex: i }))
            var preventClicksDom = $("<div style='position: absolute; left: 0; top: 0; width: 100%; height: 100%'></div>").appendTo(dom)
            dom.append(view.dom)
            dom.append(preventClicksDom)
            
            // // capture all mouse events before they can get to the view
            // viewContainerDom.get(0).addEventListener('mousedown', function(e) { e.stopPropagation() }, true)
            // viewContainerDom.get(0).addEventListener('mouseup', function(e) { e.stopPropagation() }, true)
            // viewContainerDom.get(0).addEventListener('click', function(e) { e.stopPropagation() }, true)
            
            if(pattern.has("creator")) {
              var creator = pattern.get("creator")
              if(creator.ditty) {
                dom.prepend($("<p class='author'>built-in</p>"))
              } else if(pattern.isMine()) {
                dom.prepend($("<p class='author'>created by <span style='color: blue; text-decoration: underline'>me</span></p>"))
              } else {
                dom.prepend($("<p class='author'>created by " + (creator.readable_name || "anonymous") + "</p>"))
              }
            }
            ;(function(pattern, i, minIndex, view) {
              keywordMatches.push({
                minIndex: minIndex,
                value: dom,
                result: view
              })
            })(pattern, i, minIndex, view)
          }
        }
      }
      keywordMatches.sort(function(a, b) { return a.minIndex - b.minIndex })
      matches.push.apply(matches, keywordMatches)
      
      matches = matches.slice(0, 10)
      
      callback(matches)
    },
    select: function(event, ui) {
      var v = ui.item["result"]
      v.dom.detach()
      dropped(v)
    },
    open: function() {
      input.data("menuOpen", true);
    },
    close: function() {
      input.data("menuOpen", false);
      if(!input.is(":focus"))
        dismiss()
    }
  }).data("autocomplete")._renderItem = function(ul, item) {
    // copied from jQuery source, but uses 'html' instead of 'text'
    return $("<li></li>").data("item.autocomplete", item).append($("<a></a>").html(item.label)).appendTo(ul)
  }

  input.blur(function() {
    if(!input.data("menuOpen"))
      dismiss()
  })
}


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


View.applyCanvasDropping = function(klass) {
  klass.prototype.droppedOn = function(target) {
    this.dom.css({
      position: "relative",
      left: "",
      top: ""
    })
  }
  
  klass.prototype.droppedNowhere = function(offset, mouse) {
    if(mouse.left > $("#palette-container").outerWidth() && mouse.top > $("#hud-container").offset().top + $("#hud-container").outerHeight()) {
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
    this.fillerText = options.fillerText || "Drag or type something here."
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
    this.fillerText = options.fillerText || "Drag or type something here."
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
})


View.BasicMeaningView = my.Class({
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
    
    this.render()
  },
  
  render: function() {
    this.representationDom.empty()
    this.representationDom.text(this.meaning.getValue())
  },
})
View.draggable.decorate(View.BasicMeaningView)
View.applyCanvasDropping(View.BasicMeaningView)


View.ArgumentReferenceView = my.Class({
  constructor: function(reference, options) {
    options || (options = {})
    
    this.reference = this.model = reference
    if(options.parent) this.parent = options.parent
    
    this.dom = $("<div class='bubble reference'></div>")
    this.representationDom = $("<div class='representation'></div>").appendTo(this.dom)
    View.setObjFor(this.dom, this)
    
    this.reference.on("change", this.render, this)
    
    View.draggable.draggable(this, this.dom, { handle: ".representation" })
    
    this.render()
  },
  
  render: function() {
    this.representationDom.empty()
    this.representationDom.text(this.reference.get("name"))
  },
})
View.draggable.decorate(View.ArgumentReferenceView)


View.InvocationView = my.Class({
  constructor: function(invocation, options) {
    options = options || {}
    
    this.invocation = this.model = invocation
    this.parent = options.parent
    this.slotViews = {}
    
    this.dom = $("<div class='bubble'></div>")
    this.representationDom = $("<div class='representation'></div>").appendTo(this.dom)
    this.meaningDom = $("<div class='meaning'></div>").appendTo(this.dom)
    View.setObjFor(this.dom, this)
    
    this.invocation.on("change:representationIndex", this.representationsChanged, this)
    this.invocation.getPattern().on("change:representations", this.representationsChanged, this)
    
    View.draggable.draggable(this, this.dom, { handle: ".representation" })
    
    this.renderRepresentation()
    
    this.representationDom.bind('contextmenu', safeClick(function(e) {
      this.toggleSource()
      return false
    }.bind(this)))
    this.representationDom.click(safeClick(function(e, ui) {
      var compiled = this.compile()
      
      var showResult = true
      var opts = {
        finished: function(result) {
          if(showResult) {
            $.achtung({ message: myToString(result) })
          }
        },
        error: function(e) {
          showResult = false
          $.achtung({ message: e })
        }
      }
      
      // new Context([compiled], [new Env()], opts).run()
      new Context([compiled], [new Env()], opts).slowRun()
      
      // debug the VM!
      // $("#debugger").html("").append(new Context([compiled], [new Env()]).debugDom())
    }.bind(this)))
  },
  
  representationsChanged: function() {
    this.renderRepresentation()
  },
  
  meaningChanged: function() {
    this.stopExecution()
    this.renderMeaning()
  },
  
  stopExecution: function() {
  },
  
  isEditing: function() {
    return !this.meaningDom.is(":hidden")
  },
  
  setInteractive: function(val) {
    this.interactive = val
    if(val) {
      this.dom.draggable("enable")
    } else {
      this.dom.draggable("disable")
    }
  },
  
  toggleSource: function() {
    if(this.isEditing()) {
      this.renderRepresentation()
    } else {
      this.renderEditableRepresentation()
    }
    this.renderMeaningIfNecessary()
    
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
    this._clearRepresentationDom()
    
    var pattern = this.invocation.getPattern()
    var repr = this.invocation.getCurrentTemplate()
    for(var i in repr.components) {
      var c = repr.components[i]
      if("text" in c) {
        this.representationDom.append(c.text)
      } else if("parameter" in c) {
        var arg = pattern.getArgument(c.parameter)
        this.representationDom.append(this._slotView(arg).dom)
      }
    }
  },
  
  renderEditableRepresentation: function() {
    this.renderRepresentation()
  },
  
  renderMeaningIfNecessary: function() {
    if(!this.renderedMeaning) {
      this.renderMeaning()
      this.renderedMeaning = true
    }
  },
  
  renderMeaning: function() {
    this.meaningDom.empty()
    
    var pattern = this.invocation.getPattern()
    
    if("native_meaning" in pattern) {
      var params = this.invocation.getCurrentTemplate().parameters
      if(params.length > 0) {
        var paramsDom = $("<div>Variables: </div>").appendTo(this.meaningDom)
        for(var i in params) {
          var param = pattern.getArgument(params[i])
          paramsDom.append(new View.ArgumentReferenceView(param).dom)
        }
        paramsDom.append("<hr />")
      }
      
      this.meaningMSV = new View.MultiSlotView({
        collection: pattern.native_meaning,
        modelToView: function(m) { return View.viewForMeaning(m) },
        viewToModel: function(v) { return v.model }
      })
      this.meaningDom.append(this.meaningMSV.dom)
    } else if("javascript_meaning" in pattern) {
      var meaning = pattern.javascript_meaning
      $("<textarea></textarea>").appendTo(this.meaningDom).val(meaning).change(function(e) {
        this.invocation.getPattern().set("javascript_meaning", $(e.target).val())
      }.bind(this))
    }
    
    var numCopies = Math.floor(Math.random() * 5) + 1 // XXX lol, obvs
    if(numCopies > 1) {
      var stats = $("<p class='stats'>editing all <span></span> copies. <a href='#'>edit only this copy</a></h3>").appendTo(this.meaningDom)
      stats.children("span").text(numCopies)
      stats.children("a").click(safeClick(function() { alert("sorry! can't do that yet."); return false }))
    }
  },
  
  _slotView: function(param) {
    var name = param.get("name")
    if(name in this.slotViews) {
      return this.slotViews[name]
    }
    // TODO: make a collection of the params and use that
    var svOpts = {
      fillerText: name,
      collection: this.invocation.argumentValue(param.get("name")),
      modelToView: function(m) { return View.viewForMeaning(m) },
      viewToModel: function(v) { return v.model }
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
    
    this.dom = $("<div style='display: inline-block'></div>")
    View.setObjFor(this.dom, this)
    
    this.respawn()
  },
  
  respawn: function() {
    this.dom.append(this.generator(this).dom)
  },
  
  dragout: function(child, target) {
  },

  release: function(child) {
    child.dom.detach()
    this.respawn()
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
    
    this.dom = $("<div class='happy-text'></div>")
    View.setObjFor(this.dom, this)
    
    this.showCursor = true
    if("showCursor" in options) this.showCursor = options.showCursor
    
    this.setText(options.text || "")
    this.cursorPosition = 0
    
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
  
  _asHTML: function(str) {
    return $("<div />").text(str).html()
  },
  
  _fakeSpaces: function(str) {
    return this._asHTML(str).replace(/ /g, "<span class='whitespace'>&#9251;</span>")
  },
  
  _resetText: function() {
    if(this.showCursor) {
      var cursor = $("<span class='cursor' />")
      cursor.blink({ delay: Math.random() * 20 + 500 })
      
      this.dom.empty()
      this.dom.append($("<span class='text' />").html(this._fakeSpaces(this.text.slice(0, this.cursorPosition))))
      this.dom.append(cursor)
      this.dom.append($("<span class='text' />").html(this._fakeSpaces(this.text.slice(this.cursorPosition)) + "\n"))
      // the extra newline is necessary so that there's a blank line at the end if the actual text ends with \n
    } else {
      this.dom.empty()
      this.dom.append($("<span class='text' />").html(this._fakeSpaces(this.text)))
    }
  },
})

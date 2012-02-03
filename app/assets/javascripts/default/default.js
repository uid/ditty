
var patterns = {}

var globalOS = { globals: {} }

// performs map (only for Arrays!) in CPS style
// calls f(c, e, arrayIndex, arrayValue) for each item
// calls c(resultingArray)
function cpsMap(f, c, e, arr) {
  var results = []
  var loop = function(i) {
    if(i >= arr.length) {
      c(results)
    } else {
      f(function(result) {
        results.push(result)
        loop(i + 1)
      }, e, i, arr[i])
    }
  }
  loop(0)
}

// helper function for evaluating several arguments in CPS style
function evalArgs(c, e, os, args, which) {
  var evaledArgs = {}
  cpsMap(function(cc, e, i, argName) {
    args[argName].evaluate(function(result) { evaledArgs[argName] = result; cc() }, e, os)
  },
  function(results) {
    c(evaledArgs)
  }, e, which)
}

function compilePatterns(json) {
  for(var i in json) {
    if("show" in json[i] && !json[i]["show"]) continue
    try {
      // XXX for now, index patterns by both ID and key
      patterns[json[i]["id"]] = patterns[json[i]["key"]] = new JsonPatternUnarchiver().unarchive(json[i])
    } catch(e) {
      $.achtung({ message: "Couldn't load pattern '" + i + "': " + e.message, timeout: 5 })
    }
  }
}

function JsonPatternUnarchiver() {
}
JsonPatternUnarchiver.prototype.unarchive = function(json) {
  this.references = {}
  this.id = json["id"]
  this.key = json["key"]
  var representations = _.map(json["representations"], this._representation.bind(this))
  var args = _.inject(_.map(json["arguments"], this._arg.bind(this)), function(obj, ref) { obj[ref.name] = ref; return obj }, {})
  var meaning = this._meaning(json["meaning"])
  return new Pattern(this.id, this.key, representations, args, meaning)
}
JsonPatternUnarchiver.prototype._representation = function(json) {
  if(json["template"]) {
    return new Template(json["template"], { style: json["style"] })
  }
  throw new Error("invalid json: template missing")
}
JsonPatternUnarchiver.prototype._arg = function(json) {
  if(!json["name"]) {
    throw new Error("invalid arg: no name")
  }
  this.references[json["name"]] = new ArgumentReference(json["name"], json["type"])
  return this.references[json["name"]]
}
JsonPatternUnarchiver.prototype._meaning = function(json) {
  if(!(json instanceof Array)) {
    json = [json]
  }
  return new Meaning(_.map(json, function(item) {
    if(item["native_invocation"]) {
      return this._nativeInvocation(item["native_invocation"])
    }
    if(item["invocation"]) {
      return this._invocation(item["invocation"])
    }
    if(item["reference"]) {
      return this._reference(item["reference"])
    }
    throw new Error("invalid meaning: unrecognized type")
  }.bind(this)))
}
JsonPatternUnarchiver.prototype._nativeInvocation = function(json) {
  var implementation = json["implementation"]
  var args = {}
  for(var argName in json["arguments"]) {
    args[argName] = this._meaning(json["arguments"][argName])
  }
  return new NativeMeaning(implementation, args)
}
JsonPatternUnarchiver.prototype._invocation = function(json) {
  var patternId = json["pattern"]
  var args = {}
  for(var argName in json["arguments"]) {
    args[argName] = this._meaning(json["arguments"][argName])
  }
  return new NamedInvocationMeaning(patternId, args)
}
JsonPatternUnarchiver.prototype._reference = function(json) {
  var name = json["name"]
  if(!(name in this.references)) {
    throw new Error("reference to non-existent argument '" + name + "' when parsing pattern '" + this.id + "'")
  }
  return this.references[name]
}


// copied from: http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm#Anchor-Creatin-49778
function extend(subClass, baseClass) {
   function inheritance() {}
   inheritance.prototype = baseClass.prototype;

   subClass.prototype = new inheritance();
   subClass.prototype.constructor = subClass;
   subClass.baseConstructor = baseClass;
   subClass.superClass = baseClass.prototype;
}

function escapeHTML(str) {
  return (str || "").replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;')
}

function objFor(html) {
  return $(html).data("obj")
}
function setObjFor(html, obj) {
  $(html).data("obj", obj)
}

function clearSelection() {
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

// returns true if all the items are == to one in b, in any order, and the reverse
function setEq(a, b) {
  if(a.length != b.length) return false
  for(var i in a) {
    var found = false
    for(var j in b) {
      if(a[i] == b[j]) {
        found = true
        break
      }
    }
    if(!found) return false
  }
  for(var i in b) {
    var found = false
    for(var j in a) {
      if(a[j] == b[i]) {
        found = true
        break
      }
    }
    if(!found) return false
  }
  return true
}


// GLOBALS
var paletteView;


function _BasicPattern() {
}
_BasicPattern.prototype._checkRepresentations = function() {
  for(var i in this.representations) {
    this._checkRepresentation(this.representations[i])
  }
}
_BasicPattern.prototype._checkRepresentation = function(repr) {
  var argNames = _.keys(this.references)
  if(!setEq(argNames, repr.args)) {
    throw new Error("representation has mismatched arguments (" + argNames + ") and (" + repr.args + ")")
  }
}
_BasicPattern.prototype.addRepresentation = function(repr) {
  this._checkRepresentation(repr)
  this.representations.push(repr)
  return this.representations.length - 1
}

function Pattern(id, key, representations, references, meaning) {
  this.id = id
  this.key = key
  this.representations = representations
  this.meaning = meaning
  this.references = references
  this._checkRepresentations()
}
extend(Pattern, _BasicPattern)
Pattern.prototype.toString = function() {
  return "Pattern(" + this.id + "/" + this.key + ")"
}
Pattern.prototype.apply = function(args) {
  // args is a map from argument name to value
  // convert to argsHash, mapping from ArgumentReference to value
  var argsHash = new Hashtable()
  for(var i in args) {
    if(!(i in this.references)) {
      throw new Error("argument '" + i + "' doesn't exist in pattern '" + this.id + "/" + this.key + "'")
    }
    argsHash.put(this.references[i], args[i])
  }
  return this.meaning.replacingReferences(argsHash)
}

function NumberPattern(value) {
  this.meaning = new NumberMeaning(value)
  this.representations = [new ExplicitTemplate(value.toString())]
  this.references = {}
}
extend(NumberPattern, _BasicPattern)
NumberPattern.prototype.toString = function() {
  return "NumberPattern(" + this.id + ")"
}
NumberPattern.prototype.apply = function(args) {
  return this.meaning
}

function BoolPattern(value) {
  this.meaning = new BoolMeaning(value)
  this.representations = [new ExplicitTemplate(value.toString())]
  this.references = {}
}
extend(BoolPattern, _BasicPattern)
BoolPattern.prototype.toString = function() {
  return "BoolPattern(" + this.id + ")"
}
BoolPattern.prototype.apply = function(args) {
  return this.meaning
}

function StringPattern(value) {
  this.value = value
  this.meaning = new StringMeaning(value)
  this.representations = [new ExplicitTemplate("\"" + value.toString() + "\""), new ExplicitTemplate(value.toString())]
  this.references = {}
}
extend(StringPattern, _BasicPattern)
StringPattern.prototype.toString = function() {
  return "StringPattern(" + this.value + ")"
}
StringPattern.prototype.apply = function(args) {
  return this.meaning
}

function argsReplacingReferences(oldArgs, argsHash) {
  var newArgs = {}
  for(var argName in oldArgs) {
    newArgs[argName] = oldArgs[argName].replacingReferences(argsHash)
  }
  return newArgs
}

function NativeMeaning(jsSource, args) {
  this.jsSource = jsSource
  this.args = args
}
NativeMeaning.prototype.replacingReferences = function(argsHash) {
  return new NativeMeaning(this.jsSource, argsReplacingReferences(this.args, argsHash))
}
NativeMeaning.prototype.evaluate = function(c, e, os) {
  if(!this.f) {
    try {
      this.f = eval("(function(c, e, os, args) {" + this.jsSource + "})")
    } catch(exc) {
      e(new Error("failed to compile native implementation: " + exc.message))
      return
    }
  }
  this.f(c, e, os, this.args)
}

function ArgumentReference(name, type) {
  this.name = name
  this.type = type
}
ArgumentReference.prototype.replacingReferences = function(argsHash) {
  return argsHash.get(this) || this
}
ArgumentReference.prototype.evaluate = function(c, e) {
  e(new Error("'" + this.name + "' is required"))
}

function Meaning(components) {
  if(components instanceof Array) {
    this.components = components
  } else {
    this.components = [components]
  }
}
Meaning.prototype.notifying = function(beginf, endf) {
  this.notifyBeginF = beginf
  this.notifyEndF = endf
  return this
}
Meaning.prototype.replacingReferences = function(argsHash) {
  return new Meaning(_.map(this.components, function(component) { return component.replacingReferences(argsHash) }))
}
Meaning.prototype.evaluate = function(c, e, os) {
  if(this.notifyBeginF) this.notifyBeginF()
  cpsMap(function(cc, ee, i, component) {
    component.evaluate(cc, function(ex) {
      if(this.notifyEndF) this.notifyEndF()
      ee(ex)
    }.bind(this), os)
  }.bind(this),
  function(results) {
    if(this.notifyEndF) this.notifyEndF()
    c(results[results.length - 1])
  }.bind(this), e, this.components)
}

function _BasicMeaning() {
}
_BasicMeaning.prototype.notifying = function(beginf, endf) {
  this.notifyBeginF = beginf
  this.notifyEndF = endf
  return this
}
_BasicMeaning.prototype.evaluate = function(c) {
  if(this.notifyBeginF) this.notifyBeginF()
  if(this.notifyEndF) this.notifyEndF()
  c(this)
}
_BasicMeaning.prototype.numberValue = function() {
  throw new Error("cannot convert to a number")
}
_BasicMeaning.prototype.boolValue = function() {
  throw new Error("cannot convert to a boolean")
}
_BasicMeaning.prototype.stringValue = function() {
  throw new Error("cannot convert to text")
}
_BasicMeaning.prototype.exceptionValue = function() {
  throw new Error("cannot convert to an exception")
}

function NamedInvocationMeaning(patternId, args) {
  this.patternId = patternId
  this.args = args
}
NamedInvocationMeaning.prototype._meaning = function() {
  if(!this.meaning) {
    var pattern = patterns[this.patternId] // XXX
    if(!pattern) {
      throw new Error("couldn't find pattern '" + this.patternId + "'")
    }
    this.meaning = pattern.apply(this.args || {})
  }
  return this.meaning
}
NamedInvocationMeaning.prototype.replacingReferences = function(argsHash) {
  return this._meaning().replacingReferences(argsHash)
}
NamedInvocationMeaning.prototype.evaluate = function(c, e, os) {
  this._meaning().evaluate(c, e, os)
}

function NumberMeaning(value) {
  this.value = value
}
extend(NumberMeaning, _BasicMeaning)
NumberMeaning.prototype.jsValue = function() {
  return this.value
}
NumberMeaning.prototype.numberValue = function() {
  return this.value
}
NumberMeaning.prototype.boolValue = function() {
  return this.value != 0
}
NumberMeaning.prototype.stringValue = function() {
  return this.value.toString()
}
NumberMeaning.prototype.toString = function() {
  return this.value.toString()
}

function BoolMeaning(value) {
  this.value = value
}
extend(BoolMeaning, _BasicMeaning)
BoolMeaning.prototype.jsValue = function() {
  return this.value
}
BoolMeaning.prototype.boolValue = function() {
  return this.value
}
BoolMeaning.prototype.stringValue = function() {
  return this.value.toString()
}
BoolMeaning.prototype.toString = function() {
  return this.value.toString()
}

function StringMeaning(value) {
  this.value = value
}
extend(StringMeaning, _BasicMeaning)
StringMeaning.prototype.numberValue = function() {
  return parseFloat(this.value)
}
StringMeaning.prototype.jsValue = function() {
  return this.value
}
StringMeaning.prototype.boolValue = function() {
  if("true".indexOf(this.value) == 0 || "yes".indexOf(this.value) == 0) {
    return true
  }
  return false
}
StringMeaning.prototype.stringValue = function() {
  return this.value
}
StringMeaning.prototype.toString = function() {
  return "\"" + this.value.toString() + "\""
}

function InternalException(type) {
  this.type = this.message = type
}
function ExceptionMeaning(value) {
  this.value = new InternalException(value)
}
extend(ExceptionMeaning, _BasicMeaning)
ExceptionMeaning.prototype.jsValue = function() {
  return this.value
}
ExceptionMeaning.prototype.exceptionValue = function() {
  return this.value
}
ExceptionMeaning.prototype.toString = function() {
  return "exception<" + this.value.type + ">"
}


///////////////////////////////////////////////
///// BEGIN VIEW //////////////////////////////
///////////////////////////////////////////////


function ifTarget(f) {
  return function(e) {
    if(e.target != e.currentTarget) return
    f.apply(null /* this */, arguments)
  }
}
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
      var patternView = objFor(ui.draggable)
      this.accept(patternView)
    }.bind(this)
  });
  
  // make clickable
  
  var dismiss = function() {
    this.setFiller()
  }.bind(this)

  this.dom.click(ifTarget(function(e) {
    input = $("<input type='text' />");
    input.autocomplete({
      delay: 0,
      // appendTo: this.dom.parents(".expression-container").last(),
      source: function(request, callback) {
        var matches = []
        if(/^[0-9.]+$/i.exec(request.term)) {
          matches.push({ value: "number: " + request.term, result: new NumberPattern(parseFloat(request.term)) })
        }
        if("true".indexOf(request.term) == 0 || "false".indexOf(request.term) == 0) {
          var value = (request.term.indexOf("t") != -1)
          matches.push({ value: "boolean: " + value, result: new BoolPattern(value) })
        }
        if(true) {
          matches.push({ value: "text: \"" + request.term + "\"", result: new StringPattern(request.term) })
        }
        var keywords = request.term.toLowerCase().split(" ")
        for(var pattern in patterns) {
          for(var i in patterns[pattern].representations) {
            var template = patterns[pattern].representations[i].text.toLowerCase()
            var found = true
            for(var j in keywords) {
              if(template.indexOf(keywords[j]) == -1) {
                found = false
                break
              }
            }
            if(found) {
              matches.push({ value: patterns[pattern].representations[i].text, result: patterns[pattern] })
            }
          }
        }
        callback(matches);
      }.bind(this),
      select: function(event, ui) {
        this.accept(new PatternView(ui.item["result"]))
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
SlotView.prototype.accept = function(patternView) {
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
  
  if(this.parent.beenDraggedUpon) {
    this.parent.beenDraggedUpon()
  }
}
SlotView.prototype.release = function(child) {
  if(this.patternView == child) {
    delete this.patternView

    // change appearance to filled
    this.dom.removeClass("filled")
    this.dom.addClass("unfilled")

    child.dom.detach()
    this.setFiller()
    this.makeActive()
    
    if(this.parent.beenDraggedOutOf)
      this.parent.beenDraggedOutOf()
  }
}
SlotView.prototype.meaning = function() {
  if(this.patternView) {
    return this.patternView.meaning()
  }
}

function CodeCanvasView() {
  this.patternViews = []
  
  // create dom
  this.dom = $("<div class='code-canvas'></div>")
  setObjFor(this.dom, this)

  // this.dom.droppable({
  //   // accept: "#palette .expression",
  //   hoverClass: 'hover',
  //   drop: function(event, ui) {
  //     var patternView = objFor(ui.draggable)
  //     this.accept(patternView)
  //   }.bind(this)
  // });
  // this.dom.droppable("disable")
}
CodeCanvasView.prototype.toString = function() {
  return "CodeCanvasView()"
}
CodeCanvasView.prototype.accept = function(patternView) {
  // change linkage
  this.patternViews.push(patternView)
  patternView.setParent(this)

  // move patternView into the canvas
  patternView.dom.appendTo(this.dom)
}
CodeCanvasView.prototype.release = function(child) {
  // if(this.patternView == child) {
  //   delete this.patternView

  //   // change appearance to filled
  //   this.dom.removeClass("filled")
  //   this.dom.addClass("unfilled")

  //   child.dom.detach()
  //   this.setFiller()
  //   this.makeActive()
    
  //   if(this.parent.beenDraggedOutOf)
  //     this.parent.beenDraggedOutOf()
  // }
}

function Template(text, options) {
  options = options || {}
  
  this.text = text
  this.style = options["style"] || "inline"
  this.components = []
  this.params = [] // TODO: rename to args
  this.args = this.params
  var result
  var i = 0
  
  var paramRegexp = /\[([^\]]+)\]/gi
  while((result = paramRegexp.exec(text)) != null) {
    var nonParamText = text.slice(i, paramRegexp.lastIndex - result[1].length - 2)
    if(nonParamText != "")
      this.components.push(nonParamText)
    this.components.push("[" + result[1] + "]")
    this.params.push(result[1])
    i = paramRegexp.lastIndex
  }
  var nonParamText = text.slice(i)
  if(nonParamText != "")
    this.components.push(nonParamText)
}
function ExplicitTemplate(text) {
  this.text = text
  this.components = [text]
  this.params = []
}

function PatternView(pattern, options) {
  options = options || {}
  
  this.pattern = pattern
  this.representationIndex = options.representationIndex || 0
  this.drag = options.drag
  this.convertComponents()
  this.activeCount = 0
  if(options.parent)
    this.setParent(options.parent)

  // create dom
  this.dom = $("<div class='expression-container'></div>")
  this.expressionDom = $("<div class='expression title-expression'></div>").appendTo(this.dom)
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
  if(this.drag == "free") {
    this.dom.draggable({
      cursor: "move",
      start: function(event, ui) { this.noclick = true }.bind(this),
      stop: function(event, ui) { this.noclick = false }.bind(this)
    })
  } else {
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
    });
  }
  
  // right-clickable
  this.dom.bind('contextmenu', function(e) {
    clearSelection() // right-clicking usually selects the word under the cursor
    
    var menu = new MenuBuilder()
    menu.add("Show Source", this.toggleSourceView.bind(this))
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
    menu.add("Delete", function() { this.parent.release(this) }.bind(this))
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
  // var template = this.pattern.representations[this.representationIndex]
  // this.expressionDom.css("display", template.style == "block" ? "inline-block" : "inline")
}
PatternView.prototype.setParent = function(parent) {
  if(this.parent == parent)
    return
  if(this.parent)
    this.parent.release(this)
  if(parent)
    this.parent = parent
  else
    delete this.parent
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
PatternView.prototype.meaning = function() {
  // XXX MAJOR HACK XXX
  if(this.drag == "free") {
    return this.source.meaning().notifying(this.becameActive.bind(this), this.becameInactive.bind(this))
  }
  
  var args = {}
  for(var param in this.slotViewsByParam) {
    var slotMeaning = this.slotViewsByParam[param].meaning()
    if(slotMeaning) {
      args[param] = slotMeaning
    }
  }
  return this.pattern.apply(args).notifying(this.becameActive.bind(this), this.becameInactive.bind(this))
}
PatternView.prototype.toggleSourceView = function(instant) {
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
      $.achtung({ message: "Runtime error: " + escapeHTML(ex.message), timeout: 5 })
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
MultiSlotView.prototype.beenDraggedUpon = function() {
  this.refresh()
}
MultiSlotView.prototype.beenDraggedOutOf = function() {
  this.refresh()
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
  return new Meaning(meanings)
}

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
// PaletteView.prototype.accept = function(patternView) {
//   // don't add twice
//   if(patternView.pattern.id in this.patternViews) {
//     patternView.setParent(null)
//     patternView.dom.detach()
//   } else {
//     // change linkage
//     this.items[patternView.pattern.id] = patternView
//     patternView.setParent(this)
//     this._append(patternView)
//   }
// }
PaletteView.prototype.release = function(patternView) {
  var patternId = patternView.pattern.id
  var pattern = this.patterns[patternId]
  if(pattern) {
    var newPatternView = new PatternView(pattern, { parent: this })
    this.patternViews[patternId] = newPatternView
    newPatternView.dom.insertAfter(patternView.dom)
  }
  patternView.dom.detach()
}

// sends a gradient through the background of the given HTML element
// (if color is unspecified, it will be red)
function flash(elem, color) {
  color = color || "red"
  elem = $(elem)
  elem.stop(true /* clear animation queue */, true /* jump to end of animation */)
  elem.css("background", "url(/assets/" + color + "-gradient.png) repeat-y")
  elem.css("background-position", "-80px")
  elem.animate(
    { "background-position" : elem.width() },
    { duration: 300, complete: function() { elem.css("background", "") } }
  )
}

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

var themes = ["colorful", "minimal"]
var themeIndex = 0
function changeTheme() {
  $("body").removeClass(themes[themeIndex])
  themeIndex = (themeIndex + 1) % themes.length
  $("body").addClass(themes[themeIndex])
}

function require(v, name, type) {
  if(typeof v === "undefined") {
    throw new Error(name + " is required")
  } else if(type && (typeof v !== type)) {
    throw new Error(name + " must be a " + type + ", but it's a " + (typeof v))
  }
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

function finishLoading() {
  $("#loading").hide()
  $("#container").show()
  
  $("body").addClass(themes[themeIndex])
  
  $("body").addClass("no-drag-in-progress")
  $("body").bind("dragstart", function() { $("body").removeClass("no-drag-in-progress"); $("body").addClass("drag-in-progress") })
  $("body").bind("dragstop", function() { $("body").addClass("no-drag-in-progress"); $("body").removeClass("drag-in-progress") })
  
  paletteView = new PaletteView()
  $("#palette").append(paletteView.dom)
  
  paletteView.addSection("Music")
  paletteView.add(patterns["play"])
  paletteView.add(patterns["note-do"])
  paletteView.add(patterns["note-re"])
  paletteView.add(patterns["note-mi"])
  
  paletteView.addSection("Timing")
  paletteView.add(patterns["wait-seconds"])
  paletteView.add(patterns["after-seconds"])
  paletteView.add(patterns["after-beats"])
  
  // paletteView.addSection("User Interaction")
  // paletteView.add(patterns["prompt"])
  // paletteView.add(patterns["alert"])
  // paletteView.add(patterns["after"])
  
  paletteView.addSection("Program Flow")
  // paletteView.add(patterns["if"])
  paletteView.add(patterns["while"])
  paletteView.add(patterns["loop"])
  paletteView.add(patterns["break"])
  paletteView.add(patterns["maybe-block"])
  
  // paletteView.addSection("Logic")
  // paletteView.add(patterns["true"])
  // paletteView.add(patterns["false"])
  // paletteView.add(patterns["logical-and"])
  // paletteView.add(patterns["logical-or"])
  // paletteView.add(patterns["is-false"])
  // paletteView.add(patterns["is-true"])
  
  // paletteView.addSection("Variables")
  // paletteView.add(patterns["save-var"])
  // paletteView.add(patterns["get-var"])
  
  // paletteView.addSection("Exceptions")
  // paletteView.add(patterns["throw"])
  // paletteView.add(patterns["catch"])
  // paletteView.add(patterns["exception"])
  
  // paletteView.addSection("Text")
  // paletteView.add(patterns["concat"])
  // paletteView.add(patterns["concat-3"])
  
  // paletteView.addSection("Debugging")
  // paletteView.add(patterns["debug"])
  
  paletteView.addSection("Miscellaneous")
  for(var i in patterns)
    paletteView.add(patterns[i])

  $("#theme-switcher").click(changeTheme)
  
  // new CodeCanvasView().dom.appendTo($("#program"))
  // new MultiSlotView(null /* parent */, "Drag or type something here.", true /* showExtraSlot */).dom.appendTo($("#program"))
  var newBubble = function() {
    var myCode = new PatternView(patterns["my-code"], { drag: "free" })
    myCode.dom.appendTo($("#program"))
    myCode.toggleSourceView(true /* instant */)
    return myCode
  }
  newBubble()
  $("#bubble-adder").click(function() {
    var bubble = newBubble()
    $(this).effect("transfer", { to: bubble.dom }, 200)
  })
  
  ///////
  // new MultiSlotView(null /* parent */, "Drag or type something here.", true /* showExtraSlot */).dom.appendTo($("#container-test .source"))
  // $("#container-test").draggable()
  // $("#container-test").click(function() {
  //   $("#container-test .source").animate(
  //     { height: 0 },
  //     { duration: 300, complete: function() { $("#container-test .source").hide() } }
  //   )
  // });
  ///////

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
  
  // $("body").droppable({
  //   drop: function(event, ui) {
  //     var patternView = objFor(ui.draggable)
  //     if(patternView.parent instanceof SlotView) {
  //       patternView.setParent(null)
  //     }
  //     $("body").css("cursor", "auto") // some kinda jQuery bug necessitates this
  //   }.bind(this)
  // })
  
  initAudio()
  
  flash($("body"), "blue")
}

$(function() {
  $.ajax({
    url: "/default/patterns.json",
    dataType: "json",
    success: function(data) {
      compilePatterns(data)
      finishLoading()
    },
    error: function() {
      $("#loading").text("I'm sorry, for some reason the ditty environment could not be loaded.")
    }
  })
})
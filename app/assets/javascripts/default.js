//= require_tree ./default

var patterns = {}

var globalOS = { globals: {} }


///////////////////////////////////////////////
///// BEGIN SERIALIZATION /////////////////////
///////////////////////////////////////////////


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
  var meaning = this._patternMeaning(json["meaning"])
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
JsonPatternUnarchiver.prototype._patternMeaning = function(json) {
  if(json["native_meaning"]) {
    return new NativeMeaning(_.map(json["native_meaning"], this._meaning.bind(this)))
  } else if(json["javascript_meaning"]) {
    return new JavascriptMeaning(json["javascript_meaning"], this.references)
  } else {
    throw new Error("invalid meaning: unrecognized type")
  }
}
JsonPatternUnarchiver.prototype._meaning = function(json) {
  if(json instanceof Array) {
    return new NativeMeaning(_.map(json, this._meaning.bind(this)))
  }
  if("invocation" in json) {
    return this._invocation(json["invocation"])
  }
  if("reference" in json) {
    return this._reference(json["reference"])
  }
  if("number" in json) {
    return new NumberMeaning(json["number"])
  }
  if("boolean" in json) {
    return new BoolMeaning(json["boolean"])
  }
  if("string" in json) {
    return new StringMeaning(json["string"])
  }
  throw new Error("invalid meaning: unrecognized type")
}
JsonPatternUnarchiver.prototype._invocation = function(json) {
  var patternId = json["pattern"]
  var args = {}
  for(var argName in json["arguments"]) {
    args[argName] = this._meaning(json["arguments"][argName])
  }
  return new InvocationMeaning(patternId, args)
}
JsonPatternUnarchiver.prototype._reference = function(json) {
  var name = json["name"]
  if(!(name in this.references)) {
    throw new Error("reference to non-existent argument '" + name + "' when parsing pattern '" + this.id + "'")
  }
  return this.references[name]
}


///////////////////////////////////////////////
///// BEGIN UTILITIES /////////////////////////
///////////////////////////////////////////////


// copied from: http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm#Anchor-Creatin-49778
function extend(subClass, baseClass) {
   function inheritance() {}
   inheritance.prototype = baseClass.prototype;

   subClass.prototype = new inheritance();
   subClass.prototype.constructor = subClass;
   subClass.baseConstructor = baseClass;
   subClass.superClass = baseClass.prototype;
}

// extremely basic HTML escape
function escapeHTML(str) {
  return (str || "").replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;')
}

// set and get objects associated with dom elements
function objFor(dom) {
  return $(dom).data("obj")
}
function setObjFor(dom, obj) {
  $(dom).data("obj", obj)
}

// clears any selected text in the window
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

// set equality: returns true if all the items in a are == to one in b, in any order, and the reverse
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

// CPS-style map for arrays
// calls f(c, e, arrayIndex, arrayValue) for each item
// calls c(resultingArray) when finished
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


///////////////////////////////////////////////
///// BEGIN LANGUAGE //////////////////////////
///////////////////////////////////////////////


// TEMPLATES

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
Template.prototype.asJSON = function() {
  return { template: this.text }
}
function ExplicitTemplate(text) {
  this.text = text
  this.components = [text]
  this.params = []
}


// PATTERNS

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
Pattern.prototype.asJSON = function() {
  return {
    id: this.id,
    representations: _.map(this.representations, function(r) { return r.asJSON() }),
    arguments: _.map(this.references, function(r) { return r.asJSON(true) }),
    meaning: this.meaning.asJSON(true)
  }
}
Pattern.prototype.setMeaning = function(newMeaning) {
  this.meaning = newMeaning
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


// MEANINGS

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

function argsReplacingReferences(oldArgs, argsHash) {
  var newArgs = {}
  for(var argName in oldArgs) {
    newArgs[argName] = oldArgs[argName].replacingReferences(argsHash)
  }
  return newArgs
}

function ArgumentReference(name, type) {
  this.name = name
  this.type = type
}
ArgumentReference.prototype.asJSON = function(omitPrefix) {
  var json = { name: this.name }
  if(this.type) {
    json["type"] = this.type
  }
  if(omitPrefix) {
    return json
  } else {
    return { reference: json }
  }
}
ArgumentReference.prototype.replacingReferences = function(argsHash) {
  return argsHash.get(this) || this
}
ArgumentReference.prototype.notifying = function(beginf, endf) {
  this.notifyBeginF = beginf
  this.notifyEndF = endf
  return this
}
ArgumentReference.prototype.evaluate = function(c, e) {
  if(this.notifyBeginF) this.notifyBeginF()
  if(this.notifyEndF) this.notifyEndF()
  e(new Error("'" + this.name + "' is required"))
}
// ArgumentReference.prototype.pattern = function() {
//   return new StringPattern("argument " + this.name)
// }

function JavascriptMeaning(jsSource, args) {
  this.jsSource = jsSource
  this.args = args
}
JavascriptMeaning.prototype.asJSON = function() {
  return { javascript_meaning: this.jsSource }
}
JavascriptMeaning.prototype.notifying = function(beginf, endf) {
  this.notifyBeginF = beginf
  this.notifyEndF = endf
  return this
}
JavascriptMeaning.prototype.replacingReferences = function(argsHash) {
  return new JavascriptMeaning(this.jsSource, argsReplacingReferences(this.args, argsHash))
}
JavascriptMeaning.prototype.evaluate = function(c, e, os) {
  if(!this.f) {
    try {
      this.f = eval("(function(c, e, os, args) {" + this.jsSource + "})")
    } catch(exc) {
      e(new Error("failed to compile native implementation: " + exc.message))
      return
    }
  }
  if(this.notifyBeginF) this.notifyBeginF()
  this.f(function() {
    if(this.notifyEndF) this.notifyEndF()
    c.apply(null, arguments)
  }.bind(this), function() {
    if(this.notifyEndF) this.notifyEndF()
    e.apply(null, arguments)
  }.bind(this), os, this.args)
}

function NativeMeaning(components) {
  if(components instanceof Array) {
    this.components = components
  } else {
    this.components = [components]
  }
}
NativeMeaning.prototype.notifying = function(beginf, endf) {
  this.notifyBeginF = beginf
  this.notifyEndF = endf
  return this
}
NativeMeaning.prototype.asJSON = function(includePrefix) {
  var json = _.map(this.components, function(c) { return c.asJSON() })
  if(includePrefix) {
    return { native_meaning: json }
  } else {
    return json
  }
}
NativeMeaning.prototype.replacingReferences = function(argsHash) {
  return new NativeMeaning(_.map(this.components, function(component) { return component.replacingReferences(argsHash) }))
}
NativeMeaning.prototype.evaluate = function(c, e, os) {
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

// basic data types, like numbers and strings
function _BasicMeaning() {
}
_BasicMeaning.prototype.replacingReferences = function() {
  return this
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

function InvocationMeaning(patternId, args, options) {
  options = options || {}
  
  this.patternId = patternId
  this.representationIndex = options.representationIndex || 0
  this.args = args
}
InvocationMeaning.prototype.asJSON = function() {
  var convertedArgs = {}
  for(var i in this.args) { convertedArgs[i] = this.args[i].asJSON() }
  return {
    invocation: {
      pattern: this.patternId,
      representation_index: this.representationIndex,
      arguments: convertedArgs
    }
  }
}
InvocationMeaning.prototype._meaning = function() {
  if(!this.meaning) {
    this.meaning = this.pattern().apply(this.args || {})
  }
  return this.meaning
}
InvocationMeaning.prototype.pattern = function() {
  var pattern = patterns[this.patternId] // XXX
  if(!pattern) {
    throw new Error("couldn't find pattern '" + this.patternId + "'")
  }
  
  return pattern
}
InvocationMeaning.prototype.replacingReferences = function(argsHash) {
  return this._meaning().replacingReferences(argsHash)
}
InvocationMeaning.prototype.evaluate = function(c, e, os) {
  this._meaning().evaluate(c, e, os)
}

function NumberMeaning(value) {
  this.value = value
}
extend(NumberMeaning, _BasicMeaning)
NumberMeaning.prototype.toString = function() {
  return this.value.toString()
}
NumberMeaning.prototype.asJSON = function() {
  return { number: this.value }
}
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
NumberMeaning.prototype.pattern = function() {
  return new NumberPattern(this.value)
}

function BoolMeaning(value) {
  this.value = value
}
extend(BoolMeaning, _BasicMeaning)
BoolMeaning.prototype.toString = function() {
  return this.value.toString()
}
BoolMeaning.prototype.asJSON = function() {
  return { boolean: this.value }
}
BoolMeaning.prototype.jsValue = function() {
  return this.value
}
BoolMeaning.prototype.boolValue = function() {
  return this.value
}
BoolMeaning.prototype.stringValue = function() {
  return this.value.toString()
}
BoolMeaning.prototype.pattern = function() {
  return new BoolPattern(this.value)
}

function StringMeaning(value) {
  this.value = value
}
extend(StringMeaning, _BasicMeaning)
StringMeaning.prototype.toString = function() {
  return "\"" + this.value.toString() + "\""
}
StringMeaning.prototype.asJSON = function() {
  return { string: this.value }
}
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
StringMeaning.prototype.pattern = function() {
  return new StringPattern(this.value)
}

function InternalException(type) {
  this.type = this.message = type
}

function ExceptionMeaning(value) {
  this.value = new InternalException(value)
}
extend(ExceptionMeaning, _BasicMeaning)
ExceptionMeaning.prototype.toString = function() {
  return "exception<" + this.value.type + ">"
}
ExceptionMeaning.prototype.asJSON = function() {
  return { exception: this.value.type }
}
ExceptionMeaning.prototype.jsValue = function() {
  return this.value
}
ExceptionMeaning.prototype.exceptionValue = function() {
  return this.value
}


///////////////////////////////////////////////
///// BEGIN VIEW //////////////////////////////
///////////////////////////////////////////////


// GLOBALS
var paletteView


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
        for(var pattern in patterns) {
          if(!isNaN(parseFloat(pattern))) continue // skip non-numeric keys (they're backward-compatibility dupes)
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
              (function(pattern, i) {
                matches.push({
                  value: patterns[pattern].representations[i].text,
                  result: function() { return new PatternView(patterns[pattern], { representationIndex: i }) }
                })
              })(pattern, i)
            }
          }
        }
        callback(matches);
      }.bind(this),
      select: function(event, ui) {
        this.accept(ui.item["result"]())
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
MultiSlotView.prototype.accept = function(views) {
  this.massAccepting = true
  
  try {
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
  } finally {
    this.massAccepting = false
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
MultiSlotView.prototype.beenDraggedUpon = function() {
  if(!this.massAccepting)
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
  return new NativeMeaning(meanings)
}


// PATTERN VIEW

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
          var pos = ui.helper.position()
          this.setParent(null)
          this.dom.appendTo($("#program"))
          this.dom.css({ position: "absolute", top: pos.top + "px", left: pos.left + "px" })
        }
      }.bind(this),
    });
  }
  
  // right-clickable
  this.dom.bind('contextmenu', function(e) {
    clearSelection() // right-clicking usually selects the word under the cursor
    
    var menu = new MenuBuilder()
    menu.add(this.sourceDom.is(":hidden") ? "Show Source" : "Hide Source", this.toggleSourceView.bind(this))
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
PatternView.prototype.acceptArgument = function(argumentName, view) {
  this.slotViewsByParam[argumentName].accept(view)
}
PatternView.prototype.toggleSourceView = function(instant) {
  if(this.sourceDom.is(":hidden")) {
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
    menu.add("Delete", function() { this.parent.release(this) }.bind(this))
    menu.open(e)
    
    return false
 }.bind(this));
}
ArgumentReferenceView.prototype.toString = function() {
  return "ArgumentReferenceView(" + this.argumentReference + ")"
}
ArgumentReferenceView.prototype.setParent = function(parent) {
  if(this.parent == parent)
    return
  if(this.parent)
    this.parent.release(this)
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
    menu.add("Delete", function() { this.parent.release(this) }.bind(this))
    menu.add("Show Source", function() { alert(this.javascriptMeaning.jsSource) }.bind(this))
    menu.open(e)
    
    return false
 }.bind(this));
}
JavascriptCodeView.prototype.toString = function() {
  return "JavascriptCodeView(" + this.argumentReference + ")"
}
JavascriptCodeView.prototype.setParent = function(parent) {
  if(this.parent == parent)
    return
  if(this.parent)
    this.parent.release(this)
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


// CREATE VIEW
// takes an invocation or argument refrence or what-have-you and creates the proper view

function createView(unit) {
  if(unit instanceof InvocationMeaning) {
    var patternView = new PatternView(unit.pattern())
    
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


// FLASH

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


// THEME

var themes = ["colorful", "minimal"]
var themeIndex = 0
function changeTheme() {
  $("body").removeClass(themes[themeIndex])
  themeIndex = (themeIndex + 1) % themes.length
  $("body").addClass(themes[themeIndex])
}


// AUDIO

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


// INITIALIZATION

function loadEnvironment() {
  $.ajax({
    url: "/default/patterns.json",
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
  
  paletteView.addSection("Music")
  paletteView.add(patterns["play"])
  paletteView.add(patterns["note-do"])
  paletteView.add(patterns["note-re"])
  paletteView.add(patterns["note-mi"])
  
  paletteView.addSection("Timing")
  paletteView.add(patterns["after-beats"])
  
  paletteView.addSection("Program Flow")
  paletteView.add(patterns["while"])
  paletteView.add(patterns["loop"])
  paletteView.add(patterns["break"])
  paletteView.add(patterns["maybe-block"])
  
  paletteView.addSection("Miscellaneous")
  for(var i in patterns)
    paletteView.add(patterns[i])
  
  // set up 'new bubble' button
  
  var newBubble = function() {
    var myCode = new PatternView(patterns["my-code"], { drag: "free" })
    myCode.dom.appendTo($("#program"))
    myCode.toggleSourceView(true /* instant */)
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
  
  flash($("body"), "blue")
}

$(loadEnvironment)

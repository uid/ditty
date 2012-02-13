
// TEMPLATES

function Template(text, options) {
  options = options || {}
  
  this.text = text
  if(options["style"]) { this.style = options["style"] }
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

function JavascriptMeaning(jsSource, args) {
  this.jsSource = jsSource
  this.args = args
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
ExceptionMeaning.prototype.jsValue = function() {
  return this.value
}
ExceptionMeaning.prototype.exceptionValue = function() {
  return this.value
}
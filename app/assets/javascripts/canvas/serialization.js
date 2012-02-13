/*
 * main functions: jsonSerialize(obj) and jsonUnserialize(json)
 * 
 * Both work with parsed JSON objects, like what JSON.stringify
 * accepts and JSON.parse emits.
*/


function compilePatterns(json) {
  for(var i in json) {
    if("show" in json[i] && !json[i]["show"]) continue
    try {
      // XXX for now, index patterns by both ID and key
      patterns[json[i]["id"]] = new jsonUnserialize(json[i])
      if(json[i]["key"]) {
        patterns[json[i]["key"]] = patterns[json[i]["id"]]
      }
    } catch(e) {
      $.achtung({ message: "Couldn't load pattern '" + i + "': " + e.message, timeout: 5 })
    }
  }
}

function jsonUnserialize(jsonObj) {
  return new JsonPatternUnarchiver().unarchive(jsonObj)
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

function jsonSerialize(unit) {
  if(unit instanceof Pattern) {
    var json = {
      id: unit.id,
      representations: _.map(unit.representations, jsonSerialize),
      arguments: _.map(unit.references, function(r) {
        // inline because ArgumentReferences are interpreted as references in the top-level if-statement
        var json = { name: r.name }
        if(r.type) {
          json["type"] = r.type
        }
        return json
      }),
    }
    if("components" in unit.meaning) {
      json.meaning = { native_meaning: _.map(unit.meaning.components, jsonSerialize) }
    } else {
      json.meaning = { javascript_meaning: unit.meaning.jsSource }
    }
    if(unit.key) {
      json.key = unit.key
    }
    return json
  } else if(unit instanceof InvocationMeaning) {
    var argsJSON = {}
    for(var argName in unit.args) {
      argsJSON[argName] = jsonSerialize(unit.args[argName])
    }
    return { invocation: { pattern: unit.patternId, arguments: argsJSON } }
  } else if(unit instanceof NativeMeaning) {
    return _.map(unit.components, jsonSerialize)
  } else if(unit instanceof ArgumentReference) {
    return { reference: { name: unit.name } }
  } else if(unit instanceof Template) {
    var json = { template: unit.text }
    if(unit.style) { json.style = unit.style }
    return json
  } else if(unit instanceof NumberMeaning) {
    return { number: unit.value }
  } else if(unit instanceof BoolMeaning) {
    return { boolean: unit.value }
  } else if(unit instanceof StringMeaning) {
    return { string: unit.value }
  } else {
    throw new Error("what kind of unit is this?")
  }
}

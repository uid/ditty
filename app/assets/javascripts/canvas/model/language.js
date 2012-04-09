
// maintains template.parameters and template.components
// template.parameters is an array of the names of the parameters (in order of appearance)
// template.components is an array of objects, each like one of these
//   { text: "static text" }
//   { parameter: "name" }
var Template = Backbone.Model.extend({
  defaults: {
    template: ""
  },
  
  initialize: function() {
    this._changed()
    this.bind("change:template", this._changed, this)
  },
  
  validate: function(attrs) {
    var parsed = this._parse(attrs.template || "")
    if(parsed.error) {
      return parsed.error
    }
  },
  
  _changed: function() {
    var attrs = this._parse(this.attributes.template)
    this.components = attrs.components
    this.parameters = attrs.parameters
    this.text = attrs.text
  },
  
  _parse: function(text) {
    var components = []
    var parameters = []
    
    var result
    var i = 0
    var paramRegexp = /\[([^\]]+)\]/gi
    while((result = paramRegexp.exec(text)) != null) {
      var nonParamText = text.slice(i, paramRegexp.lastIndex - result[1].length - 2)
      if(nonParamText != "")
        components.push({ text: nonParamText })
      components.push({ parameter: result[1] })
      if(parameters.indexOf(result[1]) != -1) {
        return { error: "duplicate parameter " + result[1] }
      } else {
        parameters.push(result[1])
      }
      i = paramRegexp.lastIndex
    }
    var nonParamText = text.slice(i)
    if(nonParamText != "")
      components.push({ text: nonParamText })
    
    return {
      components: components,
      parameters: parameters,
      text: $("<div />").html(text).text()
    }
  },
})
var TemplateCollection = Backbone.Collection.extend({
  model: Template,
})


var MeaningCollection = Backbone.Collection.extend({
  // monkey-patch _prepareModel to make it polymorphic!
  _prepareModel: function(model, options) {
    if (!(model instanceof Backbone.Model)) {
      if("invocation" in model) {
        model = new Invocation(model["invocation"])
      } else if("reference" in model) {
        model = new ArgumentReference(model["reference"])
      } else if("number" in model) {
        model = new NumberMeaning({ number: model["number"] })
      } else if("boolean" in model) {
        model = new BooleanMeaning({ boolean: model["boolean"] })
      } else if("string" in model) {
        model = new StringMeaning({ string: model["string"] })
      } else {
        throw new Error("don't recognize this kind of model")
      }
    }
    return Backbone.Collection.prototype._prepareModel.call(this, model, options)
  },
  
  compile: function() {
    return this.map(function(m) { return m.compile() })
  },
})


// representations, arguments, meaning
var Pattern = Backbone.Model.extend({
  paramsWrapper: "pattern",
  
  defaults: function() {
    return {
      representations: [{ template: randomPhrase() }],
      arguments: [],
    }
  },
  
  initialize: function() {
    this.templates = this.nestCollection("representations", new TemplateCollection(this.get("representations")))
    this.arguments = this.nestCollection("arguments", new ArgumentReferenceCollection(this.get("arguments")))
    
    this._meaningHack()
    if(this.has("native_meaning")) {
      this.native_meaning = this.nestCollection("native_meaning", new MeaningCollection(this.get("native_meaning")))
      
      this.native_meaning.on("add remove change", function() {
        this.trigger("change:native_meaning", this, this.native_meaning, { changes: { native_meaning: true } })
        this.trigger("change", this, { changes: { native_meaning: true } })
      }, this)
    } else if(this.has("javascript_meaning")) {
      this.javascript_meaning = this.get("javascript_meaning")
      this.on("change:javascript_meaning", function() { this.javascript_meaning = this.get("javascript_meaning") }, this)
    }
    
    this.templates.on("add remove change", function() {
      this.trigger("change:representations", this, this.templates, { changes: { representations: true } })
      this.trigger("change", this, { changes: { representations: true } })
    }, this)
    this.arguments.on("add remove change", function() {
      this.trigger("change:representations", this, this.templates, { changes: { representations: true } })
      this.trigger("change", this, { changes: { representations: true } })
    }, this)
  },
  
  set: function(attributes) {
    var ret = Backbone.Model.prototype.set.apply(this, arguments)
    if(attributes.representations && this.templates) {
      this.templates.reset(attributes.representations)
    }
    if(attributes.arguments && this.arguments) {
      this.arguments.reset(attributes.arguments)
    }
    if(attributes.native_meaning && this.native_meaning) {
      this.native_meaning.reset(attributes.native_meaning)
    }
    return ret
  },
  
  toJSON: function() {
    var json = Backbone.Model.prototype.toJSON.apply(this, arguments)
    delete json.representations
    json.representations = this.templates
    json.arguments = this.arguments
    if(this.native_meaning) json.native_meaning = this.native_meaning
    if(this.javascript_meaning) json.javascript_meaning = this.javascript_meaning
    return json
  },
  
  // TODO!
  isMine: function() {
    return false
  },
  
  _meaningHack: function() {
    if(!this.has("meaning")) return
    var meaning = this.get("meaning")
    if("native_meaning" in meaning) {
      this.set("native_meaning", meaning["native_meaning"])
    } else if("javascript_meaning" in meaning) {
      this.set("javascript_meaning", meaning["javascript_meaning"])
    }
    this.unset("meaning")
  },
  
  getArgument: function(name) {
    return this.arguments.where({ name: name })[0]
  },
  
  compile: function() {
    if(this.native_meaning) {
      return this.native_meaning.map(function(m) { return m.compile() })
    } else if(this.javascript_meaning) {
      return [new VM.IJavascript(this.javascript_meaning)]
    } else {
      throw new Error("this pattern has no meaning")
    }
  },
})

var PatternCollection = Backbone.Collection.extend({
  model: Pattern,
  url: "/patterns",
})

// pattern, arguments, representationIndex
var Invocation = Backbone.DeepModel.extend({
  defaults: {
    arguments: {},
    representationIndex: 0,
    expanded: false,
  },
  
  initialize: function() {
    // XXX data munging
    this.attributes["arguments"] || (this.attributes["arguments"] = {})
    this.arguments = {}
    var args = this.get("arguments")
    for(var i in args) {
      if(!_.isArray(args[i])) {
        args[i] = [args[i]]
      }
      this._nestArgument(i, args[i])
    }
  },
  
  set: function(attributes) {
    var ret = Backbone.DeepModel.prototype.set.apply(this, arguments)
    if(attributes.arguments && this.arguments) {
      console.log("invocation set arguments", attributes.arguments, this.arguments)
      // this.arguments.reset(attributes.arguments)
    }
    return ret
  },
  
  toJSON: function(options) {
    var json = Backbone.DeepModel.prototype.toJSON.apply(this, arguments)
    json.arguments = this.arguments
    return { invocation: json }
  },
  
  getPattern: function() {
    if(!this._pattern) {
      var pattern = this.get("pattern")
      this._pattern = Patterns.get(pattern)
      if(!pattern) {
        throw new Error("no pattern!")
      }
      
      // XXX do I need this? it would cause every invocation that contains an invocation of the given pattern to be saved
      // this._pattern.on("change", function(pattern, event) {
      //   this.trigger("change:pattern", this, pattern, { changes: { pattern: true } })
      //   this.trigger("change", this, { changes: { pattern: true } })
      // }, this)
    }
    return this._pattern
  },
  
  getCurrentTemplate: function() {
    return this.getPattern().templates.at(this.get("representationIndex"))
  },
  
  // getter which creates an empty value for that argument if there isn't one
  argumentValue: function(name) {
    if(!this.arguments[name]) {
      var arg = this.get("arguments")[name] = []
      this._nestArgument(name, arg)
    }
    return this.arguments[name]
  },
  
  _nestArgument: function(name, arg) {
    this.arguments[name] = this.nestCollection("arguments." + name, new MeaningCollection(arg))
    
    this.arguments[name].on("add remove change", function() {
      this.trigger("change:arguments", this, this.arguments, { changes: { arguments: true } })
      this.trigger("change", this, { changes: { arguments: true } })
    }, this)
  },
  
  compile: function() {
    var args = _.inject(this.arguments, function(args, mc, name) {
      args[name] = mc.compile()
      return args
    }, {})
    return new VM.ICall(this.getPattern().compile(), args)
  },
})

var ArgumentReference = Backbone.Model.extend({
  defaults: {
    name: "",
  },
  
  compile: function() {
    return new VM.INamedReference(this.get("name"))
  },
})
var ArgumentReferenceCollection = Backbone.Collection.extend({ model: ArgumentReference })

var NumberMeaning = Backbone.Model.extend({
  defaults: {
    number: 0,
  },
  
  compile: function() {
    return this.get("number")
  },
  
  getValue: function() { 
    return this.get("number")
  },
})

var BooleanMeaning = Backbone.Model.extend({
  defaults: {
    boolean: false,
  },
  
  compile: function() {
    return this.get("boolean")
  },
  
  getValue: function() {
    return this.get("boolean")
  },
})

var StringMeaning = Backbone.Model.extend({
  defaults: {
    string: "",
  },
  
  compile: function() {
    return this.get("string")
  },
  
  getValue: function() {
    return this.get("string")
  },
})

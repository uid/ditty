
var VM = {}

VM.INamedReference = my.Class({
  constructor: function(name) { this.name = name },
  toString: function() { return "Reference: " + this.name },
})

VM.IPushEnv = my.Class({
  constructor: function(env) { this.env = env },
  toString: function() { return "Push Env" },
})

VM.IPopEnv = my.Class({
  constructor: function() { this.runOnUnwind = true },
  toString: function() { return "Pop Env" },
})

VM.LoopMarker = my.Class({
  toString: function() { return "Loop Marker" },
})

VM.ICall = my.Class({
  constructor: function(frame, args) { this.frame = frame; this.args = args },
  toString: function() { return "Call(frame: [" + this.frame + "]; args: " + myToString(this.args) + ")" },
})

VM.IPause = my.Class({
  toString: function() { return "Pause" },
})

VM.IJavascript = my.Class({
  constructor: function(source, noSave) {
    if(typeof(source) === "string") {
      this.f = eval("(function(vm, env){" + source + "})")
    } else {
      // assume it's a function
      this.f = source
    }
    this.noSave = noSave
  },
  
  toString: function() {
    return "Javascript: " + this.f
  }
})

VM.IClosure = my.Class({
  constructor: function(frame, env) {
    this.frame = frame.slice(0)
    this.frame.unshift(new VM.IPushEnv(env))
    this.frame.push(new VM.IPopEnv())
  },
  
  toString: function() { return "Closure(frame: [" + this.frame + "]; env: " + this.env + ")" },
})

var Env = my.Class({
  // noTraverse: if true, lookup will not check the parent env (defaults to false)
  constructor: function(values, parent, noTraverse) {
    this.values = values || {}
    if(parent) this.parent = parent
    if(noTraverse) this.noTraverse = noTraverse
  },
  
  set: function(name, value) {
    this.values[name] = value
  },
  
  contains: function(name) {
    if(name in this.values) return true
    if(!this.noTraverse && this.parent) return this.parent.contains(name)
    return false
  },
  
  lookup: function(name) {
    if(name in this.values) {
      return this.values[name]
    }
    if(!this.noTraverse && this.parent) {
      return this.parent.lookup(name)
    }
    throw new Error("\"" + name + "\" is required")
  },
})

var Context = my.Class({
  // keeps a dupe of the frames
  constructor: function(frames, envs, options) {
    options || (options = {})
    
    this.frames = _.map(frames, function(f) { return f.slice(0) }) // 2-level clone
    this.envs = envs.slice(0)
    
    if(options.finished) {
      this.finishedCallback = options.finished
    }
    if(options.error) {
      this.errorCallback = options.error
    }
  },
  
  reset: function() {
    delete this.frames
    delete this.envs
  },
  
  runOne: function(instr) {
    if(typeof(instr) === "string" || typeof(instr) === "number" || typeof(instr) === "boolean" || instr instanceof Array)
    {
      this.result = instr
    }
    else if(instr instanceof VM.INamedReference)
    {
      try {
        this.frames[0].unshift(this.envs[0].lookup(instr.name))
      } catch(e) {
        if(this.errorCallback) {
          this.errorCallback(e)
        }
        this.unwind()
        this.finished = true
      }
    }
    else if(instr instanceof VM.IPushEnv)
    {
      this.envs.unshift(instr.env)
    }
    else if(instr instanceof VM.IPopEnv)
    {
      this.envs.shift()
    }
    else if(instr instanceof VM.ICall)
    {
      var parentEnv = this.envs[0]
      var env = new Env(_.inject(instr.args, function(env, frames, name) {
        if(!(frames instanceof Array)) {
          alert("encapsulated something other than an array", frames)
          alert("encapsulated something other than an array")
        }
        // add the value if there's anything to add
        if(frames.length > 0) {
          env[name] = new VM.IClosure(frames, parentEnv) // TODO: also save the frame so that break and return can work
        }
        return env
      }, {}))
      var frame = instr.frame.slice(0)
      frame.push(new VM.IPopEnv)
      this.frames.unshift(frame)
      this.envs.unshift(env)
    }
    else if(instr instanceof VM.IClosure)
    {
      delete this.result
      this.frames = [instr.frame.slice(0)].concat(this.frames)
    }
    else if(instr instanceof VM.IPause)
    {
      this.paused = true
    }
    else if(instr instanceof VM.IJavascript)
    {
      var result
      try {
        result = instr.f(this, this.envs[0])
      } catch(e) {
        if(this.errorCallback) {
          this.errorCallback(e)
        }
        this.unwind()
        this.finished = true
      }
      if(!instr.noSave) {
        this.result = result
      }
    }
    else
    {
      console.log("unrecognized instruction", instr)
      throw new Error("unrecognized instruction")
    }
  },
  
  slowRun: function() {
    var instr = this._shift()
    if(typeof(instr) !== "undefined") {
      this.runOne(instr)
      if(this.paused) {
        delete this.paused
      } else {
        setTimeout(function() {
          this.slowRun()
        }.bind(this), 1)
      }
    } else if(!this.finished) {
      this.finished = true
      
      var result = this.result
      delete this.result
      if(this.finishedCallback) {
        this.finishedCallback(result)
      }
    }
  },
  
  run: function() {
    while(true) {
      var instr = this._shift()
      if(typeof(instr) !== "undefined") {
        this.runOne(instr)
        if(this.paused) {
          delete this.paused
          return
        }
      } else if(!this.finished) {
        this.finished = true
        
        var result = this.result
        delete this.result
        if(this.finishedCallback) {
          this.finishedCallback(result)
        }
        return result
      } else {
        return
      }
    }
  },
  
  // removes and returns the next scheduled instruction
  _shift: function() {
    while(this.frames.length > 0) {
      if(this.frames[0].length > 0) {
        return this.frames[0].shift()
      } else {
        this.frames.shift()
      }
    }
  },
  
  // call like continuation(frame, frame, frame, ..., c)
  // will execute all the given frames, then call c() with an array of all the results
  continuation: function() {
    var frames = Array.prototype.slice.call(arguments, 0, -1)
    var c = arguments[arguments.length - 1]
    
    var results = []
    
    var newFrames = []
    
    for(var i in frames) {
      newFrames.push(frames[i])
      newFrames.push(new VM.IJavascript(function(vm, env) {
        results.push(vm.result)
      }))
    }
    
    this.frames[0].unshift(new VM.IJavascript(function() { return c(results) }))
    this.frames.unshift(newFrames)
  },
  
  // call like continuation(frame, frame, frame, ...)
  // will execute all the given frames
  delegate: function() {
    var frames = Array.prototype.slice.call(arguments, 0)
    this.frames.unshift(frames)
  },
  
  beginLoop: function() {
    this.frames[0].unshift(new VM.LoopMarker())
  },
  
  breakLoop: function() {
    var saved = []
    
    while(true) {
      var instr = this._shift()
      if(typeof(instr) === "undefined") {
        throw new Error("used 'break' when not inside a loop")
      } else if(instr.runOnUnwind) {
        saved.push(instr)
      } else if(instr instanceof VM.LoopMarker) {
        break
      }
    }
    
    this.frames.unshift(saved)
  },
  
  unwind: function() {
    var saved = []
    
    while(true) {
      var instr = this._shift()
      if(typeof(instr) === "undefined") {
        break
      } else if(instr.runOnUnwind) {
        saved.push(instr)
      }
    }
    
    this.frames.unshift(saved)
    
    delete this.result
  },
  
  stop: function() {
    this.unwind()
    this.run()
  },
  
  debugDom: function(done) {
    this.dom = this.dom || $("<div></div>")
    this.dom.html("")
    
    if(done) {
      this.dom.text("Done!")
      return
    }
    
    var table = $("<table></table>").appendTo(this.dom).append("<tr><th>Frames</th><th>Envs</th><th>Return</th></tr>")
    var row = $("<tr></tr>").appendTo(table)
    this.framesDebugDom().appendTo(row)
    this.envsDebugDom().appendTo(row)
    $("<td></td>").text(("result" in this) ? ("" + this.result) : "").appendTo(row)
    
    table.disableSelection()
    table.click(function() {
      var instr = this._shift()
      if(typeof(instr) !== "undefined") {
        this.runOne(instr)
        this.debugDom()
      } else {
        this.debugDom(true)
      }
    }.bind(this))
    
    return this.dom
  },
  
  framesDebugDom: function() {
    var td = $("<td></td>")
    _.each(this.frames.slice(0).reverse(), function(frame) {
      this.frameDebugDom(frame, td)
    }.bind(this))
    return td
  },
  
  frameDebugDom: function(frame, parent) {
    var table = $("<table></table>").appendTo(parent)
    _.each(frame.slice(0).reverse(), function(instr) {
      var row = $("<tr></tr>").appendTo(table)
      $("<td></td>").text("" + instr).appendTo(row)
    })
  },
  
  envsDebugDom: function() {
    var td = $("<td></td>")
    _.each(this.envs.slice(0).reverse(), function(env) {
      this.envDebugDom(env, td)
    }.bind(this))
    return td
  },
  
  envDebugDom: function(env, parent) {
    var table = $("<table></table>").appendTo(parent)
    _.each(env.values, function(value, key) {
      $("<tr></tr>").append($("<th></th>").text(key)).append($("<td></td>").text(myToString(value))).appendTo(table)
    })
    if(env.parent) {
      var row = $("<tr></tr>").appendTo(table)
      this.envDebugDom(env.parent, $("<td colspan='2'></td>").appendTo(row))
    }
  },
})

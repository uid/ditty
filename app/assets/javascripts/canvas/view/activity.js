
View.ActivityViewer = my.Class({
  constructor: function(dom, options) {
    options || (options = {})
    
    this.dom = dom
    View.setObjFor(this.dom, this)
    
    this.dom.text("[stuff goes here]")
  },
  
  opened: function() {
    this._fetch()
  },
  
  _fetch: function() {
    if(this.loading) {
      return
    }
    
    this.loading = true
    
    this.dom.html("<img src='/assets/spinner.gif' />")
    
    var error = function() {
      this.dom.text("Failed to load recent activity.")
      this.loading = false
    }
    
    var loadEvents = function() {
      $.ajax({
        url: "/chat",
        dataType: "json",
        success: function(data) {
          this.dom.empty()
          var events = data["events"]
          for(var i in events) {
            this._addEvent(events[i])
          }
          this.loading = false
        }.bind(this),
        error: error.bind(this)
      })
    }
    
    Patterns.fetch({
      success: loadEvents.bind(this),
      error: error.bind(this)
    })
  },
  
  _addEvent: function(ev) {
    if(ev.type == "pattern_created") this._newPatternDom(ev)
    else if(ev.type == "pattern_updated") this._updatedPatternDom(ev)
    else console.log("unrecognized event", ev)
  },
  
  _newPatternDom: function(ev) {
    var pattern = Patterns.get(ev.pattern.id)
    if(!pattern) {
      console.log("activity log mentioned unknown pattern", ev.pattern)
      return
    }
    
    var pv = new View.BubbleBlower(function(parent) { return new View.InvocationView(new Invocation({ pattern: pattern.id }), { parent: parent }) })
    
    var dom = $("<div class='event'></div>").appendTo(this.dom)
    
    if(ev.user.id == Globals.currentUser.id) {
      dom.append($("<span class='user you'></span>").text("You"))
    } else {
      dom.append($("<span class='user'></span>").text(ev.user.readable_name))
    }
    dom.append(" <span class='action'>created</span> ")
    dom.append("this " + ev.ago + " ago:")
    dom.append("<br />")
    dom.append(pv.dom)
    
    // var view = new View.BubbleBlower(function(parent) { return new View.InvocationView(new Invocation({ pattern: pattern.id }), { parent: parent }) })
    // try {
    //   var pattern = jsonUnserialize(ev.pattern)
    //   if(!this.batching) {
    //     patterns[pattern.id] = pattern
    //   }
    //   var pv = new PatternView(pattern)
    //   dom.append(pv.dom)
    // } catch(e) {
    //   dom.append("[error]")
    // }
  },
  
  _updatedPatternDom: function(ev, dom) {
    dom.append(ev.ago + " ago, ")
    dom.append($("<span class='chat-user'></span>").text(ev.user.readable_name))
    dom.append(" changed ")
    // try {
    //   var pattern = jsonUnserialize(ev.pattern)
    //   if(!this.batching) {
    //     patterns[pattern.id] = pattern
    //   }
    //   var pv = new PatternView(pattern)
    //   dom.append(pv.dom)
    // } catch(e) {
    //   dom.append("[error]")
    // }
  },
})

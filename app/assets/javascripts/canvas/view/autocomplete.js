View.patternAutocomplete = function(input, dropped, dismiss) {
  // input.focusout(dismiss)
  input.keydown(function(ev) { if(ev.keyCode == 27) { dismiss() } })
  
  input.autocomplete({
    delay: 0,
    autoFocus: true,
    minLength: 0,
    source: function(request, callback) {
      var matches = []
      var maxMatches = 30
      
      if(/^-?[0-9.]+$/i.exec(request.term) && !isNaN(parseFloat(request.term))) {
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
        if(request.term[0] == "\"") {
          item.append(" (quotes are unnecessary)")
        }
        matches.push({ value: item, result: view })
      }
      
      if(request.term.indexOf("\\n") != -1) {
        var view = new View.BasicMeaningView(new StringMeaning({ string: request.term.replace(/\\n/g, "\n") }))
        var item = $("<div>string: </div>").append(view.dom)
        matches.push({ value: item, result: view })
      }
      
      if(request.term.trim().length > 0) {
        var view = new View.ArgumentReferenceView(new ArgumentReference({ name: request.term }))
        var item = $("<div>variable reference: </div>").append(view.dom)
        matches.push({ value: item, result: view })
      }
      
      if(maxMatches > matches.length) {
        var keywords = request.term.toLowerCase().split(" ")
        var keywordMatches = []
        for(var pid in Patterns.models) {
          if(isNaN(parseFloat(pid))) continue // skip non-numeric keys (they're backward-compatibility dupes)
          
          var pattern = Patterns.models[pid]
          
          if(!Globals.social && (!pattern.isMine() && !pattern.isBuiltIn())) continue
          if(pattern.get("is_solution") && !pattern.isMine()) continue
        
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
            
            // if so, remember it
            if(found) {
              keywordMatches.push({ minIndex: minIndex, invocation: new Invocation({ pattern: pattern.id, representationIndex: i }) })
            }
          }
        }
        keywordMatches.sort(function(a, b) { return a.minIndex - b.minIndex })
        
        // turn the top results into matches
        matches.push.apply(matches, _.map(keywordMatches.slice(0, maxMatches - matches.length), function(m) {
          var view = new View.FakeInvocationView(m.invocation)
          var realView = function() { return new View.InvocationView(m.invocation) }
          
          var dom = $("<div />").append(view.dom)
          
          var pattern = m.invocation.getPattern()
          var creator = pattern.get("creator")
          if(pattern.isBuiltIn()) {
            // dom.prepend($("<p class='author'>built-in</p>"))
          } else if(pattern.isMine()) {
            dom.prepend($("<p class='author'>created by <span class='me'>you</span></p>"))
          } else {
            dom.prepend($("<p class='author'>created by " + (creator.readable_name || "anonymous") + "</p>"))
          }
          
          return { value: dom, result: view, realResult: realView }
        }))
      }
      
      // wrap all matches in a no-click dom
      _.each(matches, function(m) {
        var dom = $("<div style='position: relative'></div>")
        var preventClicksDom = $("<div style='position: absolute; left: 0; top: 0; width: 100%; height: 100%'></div>")
        dom.append(m.value)
        dom.append(preventClicksDom)
        m.value = dom
      })
      
      callback(matches)
    },
    select: function(event, ui) {
      var v = ui.item["result"]
      if("realResult" in ui.item) {
        v = ui.item["realResult"]()
      }
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

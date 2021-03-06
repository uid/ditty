
View.Palette = my.Class({
  constructor: function(dom, patterns, options) {
    options || (options = {})
    
    this.dom = dom
    View.setObjFor(this.dom, this)
    
    this.patterns = patterns
    this.categories = options.categories || []
    
    this.dom.append("<h3>New Command</h3>")
    this.dom.append($("<button>Create New Command +</button>").click(_.bind(this.createCommand, this)))
    
    this.itemsDom = $("<div />").appendTo(this.dom)
    
    this.patterns.on("reset", this.patternsReset, this)
    this.patterns.on("add", this.patternAdded, this)
    
    this.patternsReset()
  },
  
  createCommand: function() {
    var name = randomPhrase()
    
    // put the placeholder in place
    var view = new View.PromisedInvocation({ name: name })
    Globals.canvas.dropped(view)
    scrollIntoView(view.dom)
    
    // start creating the pattern
    console.log("creating new pattern...")
    var pattern = Patterns.create({ representations: [{ template: name }], native_meaning: [] }, {
      wait: true,
      success: function() {
        var invocation = new Invocation({ pattern: pattern.id })
        var realView = new View.InvocationView(invocation)
        view.loadSuccess(realView)
        realView.toggleSource()
        // realView.editTemplate()
      },
      error: function() {
        console.log("pattern create failed", arguments)
        view.loadError()
      },
    })
  },
  
  patternsReset: function() {
    this.categoryDoms = {}
    this.categoryMoreDoms = {}
    this.patternViews = {}
    
    this.itemsDom.empty()
    this.renderCategories()
    
    for(var i in this.patterns.models) {
      this.patternAdded(this.patterns.models[i])
    }
  },
  
  renderCategories: function() {
    for(var i in this.categories) {
      var name = this.categories[i]
      $("<h3></h3>").text(name).appendTo(this.itemsDom)
      if(name == "Numbers") {
        $("<p></p>").text("To get specific numbers, type them.").appendTo(this.itemsDom)
      }
      this.categoryDoms[name] = $("<div />").appendTo(this.itemsDom)
    }
  },
  
  patternAdded: function(pattern) {
    var category = pattern.get("category")
    var featured = pattern.get("featured")
    
    if(category && category in this.categoryDoms) {
      var view = new View.BubbleBlower(function(parent) { return new View.InvocationView(new Invocation({ pattern: pattern.id }), { parent: parent }) }, { parent: this })
      this.patternViews[pattern.id] = view
      
      if(featured) {
        this.categoryDoms[category].append(view.dom)
      } else {
        if(!(category in this.categoryMoreDoms)) {
          var dom = $("<div></div>").hide()
          var expander = $("<a href='#' class='more'>More&#8230;</a>").click(function() { dom.animate({ height: "toggle", opacity: "toggle" }); return false})
          this.categoryDoms[category].after(dom).after(expander)
          this.categoryMoreDoms[category] = dom
        }
        this.categoryMoreDoms[category].append(view.dom)
      }
    } else if(category) {
      console.log("won't add pattern with unrecognized category to palette", pattern, category)
    }
  },
})

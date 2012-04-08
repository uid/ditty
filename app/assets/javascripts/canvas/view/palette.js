
View.Palette = my.Class({
	constructor: function(dom, patterns, options) {
		options || (options = {})
		
		this.dom = dom
		View.setObjFor(this.dom, this)
		
		this.patterns = patterns
		this.categories = options.categories || []
		
		this.dom.append("<h3>New Command</h3>")
		this.dom.append($("<button>Create New Command +</button>").click(function() {
		  // var pattern = new Pattern({ representations: [{ template: randomPhrase() }], native_meaning: [] })
		  // Patterns.add(pattern)
		  // var invocation = new Invocation({ pattern: pattern.cid }) // XXX: cid
		  // var view = new View.InvocationView(invocation)
		  // Globals.canvas.dropped(view)
		  // view.toggleSource()
		  // scrollIntoView(view.dom)
		}))
		
		this.categoryDoms = {}
		this.categoryMoreDoms = {}
		this.patternViews = {}
		this.renderCategories()
		
		this.patterns.on("reset", this.patternsReset, this)
		this.patterns.on("add", this.patternAdded, this)
		this.patterns.on("change", this.patternChanged, this)
		this.patterns.on("remove", this.patternRemoved, this)
		
		this.patternsReset()
	},
	
	renderCategories: function() {
		for(var i in this.categories) {
			var name = this.categories[i]
			$("<h3></h3>").text(name).appendTo(this.dom)
			if(name == "Numbers") {
				$("<p></p>").text("To get specific numbers, type them.").appendTo(this.dom)
			}
			this.categoryDoms[name] = $("<div />").appendTo(this.dom)
		}
	},
	
	patternsReset: function() {
		// safe to assume this happens only once, on load
		for(var i in this.patterns.models) {
			this.patternAdded(this.patterns.models[i])
		}
	},
	
	patternAdded: function(pattern) {
		var category = pattern.get("category")
		var featured = pattern.get("featured")
		
		if(category && category in this.categoryDoms) {
			var view = new View.BubbleBlower(function(parent) { return new View.InvocationView(new Invocation({ pattern: pattern.id }), { parent: parent }) })
			this.patternViews[pattern.id] = view
			
			if(featured) {
				this.categoryDoms[category].append(view.dom)
			} else {
				if(!(category in this.categoryMoreDoms)) {
					var dom = $("<div></div>").hide()
					var expander = $("<a href='#' class='more'>More&#8230;</a>").click(function() { dom.animate({ height: "toggle", opacity: "toggle" }); return false})
					this.categoryDoms[category].after(expander).after(dom)
					this.categoryMoreDoms[category] = dom
				}
				this.categoryMoreDoms[category].append(view.dom)
			}
		} else if(category) {
			console.log("won't add pattern with unrecognized category to palette", pattern, category)
		}
	},
	
	patternChanged: function(pattern) {
		console.log("pattern changed", pattern, pattern.get("category"))
	},
	
	patternRemoved: function(pattern) {
		console.log("pattern removed", pattern, pattern.get("category"))
	},
})

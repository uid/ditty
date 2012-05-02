var SelectionRectangle = my.Class({
  constructor: function(x1, y1, x2, y2) {
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
  },
  
  intersectsDom: function(dom) {
    var n = this.normalized()
    return dom.offset().left < n.x2
        && dom.offset().left + dom.outerWidth() > n.x1
        && dom.offset().top < n.y2
        && dom.offset().top + dom.outerHeight() > n.y1
  },
  
  intersectsDomFromOutside: function(dom) {
    var n = this.normalized()
    return this.intersectsDom(dom) &&
          (dom.offset().left > n.x1 ||
           dom.offset().left + dom.outerWidth() < n.x2 ||
           dom.offset().top > n.y1 ||
           dom.offset().top + dom.outerHeight() < n.y2)
  },
  
  normalized: function() {
    var x1 = (this.x1 < this.x2) ? this.x1 : this.x2
    var y1 = (this.y1 < this.y2) ? this.y1 : this.y2
    var x2 = (this.x1 < this.x2) ? this.x2 : this.x1
    var y2 = (this.y1 < this.y2) ? this.y2 : this.y1
    return new SelectionRectangle(x1, y1, x2, y2)
  },
  
  // for use as the argument to jQuery's css() function
  css: function() {
    var n = this.normalized()
    return { left: n.x1, top: n.y1, width: n.x2 - n.x1, height: n.y2 - n.y1 }
  },
})


var SelectionManager = my.Class({
  constructor: function(options) {
    options || (options = {})
    
    this.rectangle = $("<div id='selection'></div>").appendTo("body")
    this.rect = new SelectionRectangle()
    
    this.handler = options.handler
    
    // disable right click
    $(document).bind('contextmenu', function(e) { return false })
    
    // click handlers
    $(document).mousedown(_.bind(this.mousedown, this))
    $(document).mouseup(_.bind(this.mouseup, this))
    $(document).mousemove(_.bind(this.mousemove, this))
    
    this.updateSelection = _.throttle(this.updateSelection, 100)
  },
  
  mousedown: function(e) {
    if(e.button != 2 && !e.ctrlKey) return
    
    this.selecting = true
  
    this.rect.x1 = this.rect.x2 = e.pageX
    this.rect.y1 = this.rect.y2 = e.pageY
    
    this.rectangle.css(this.rect.css())
    this.rectangle.show()
    
    this.clearSelection = _.once(function() { View.clearSelection() })
    
    if(this.handler) this.handler.selectionBegan({ rect: this.rect })
  },
  
  mouseup: function() {
    this.selecting = false
    this.rectangle.hide()
    
    if(this.handler) this.handler.selectionEnded({ rect: this.rect })
  },
  
  mousemove: function(e) {
    if(!this.selecting) return
    
    this.rect.x2 = e.pageX
    this.rect.y2 = e.pageY
    
    this.rectangle.css(this.rect.css())
    
    this.clearSelection()
    
    if(this.handler) this.handler.selectionChanged({ rect: this.rect })
  },
})


/* ditty-specific selection handler */

var BubbleSelectionHandler = my.Class({
  selectionBegan: function(e) {
    this.selectionChanged(e)
  },
  
  selectionChanged: function(e) {
    _.each(this.selected, function(obj) { obj.dom.css({ border: "" }) })
    
    this.selectionsFromOutside = []
    this.selections = []
    
    $(".bubble").each(function(i, dom) {
      dom = $(dom)
      var obj = View.objFor(dom)
      if(obj) {
        if(e.rect.intersectsDom(dom)) {
          this.selections.push(obj)
        }
        if(e.rect.intersectsDomFromOutside(dom)) {
          this.selectionsFromOutside.push(obj)
        }
      }
    }.bind(this))
    
    if(this.selectionsFromOutside.length > 0) {
      // create hashtable mapping to selected objects from their parents
      var ht = new Hashtable()
      for(var i in this.selectionsFromOutside) {
        var obj = this.selectionsFromOutside[i]
        var parent = obj.directContainer()
        if(!parent) continue
        if(ht.containsKey(parent)) {
          ht.get(parent).push(obj)
        } else {
          ht.put(parent, [obj])
        }
      }
      
      var parentDepth = function(entry) { return entry[0].dom.parents().length }
      
      // if multiple are selected with the same parent, select the highest set
      var groups = _.filter(ht.entries(), function(e) { return e[1].length > 1 })
      if(groups.length > 0) {
        // pick the highest group
        this.selected = _.sortBy(groups, parentDepth)[0][1]
      } else {
        // otherwise, take the deepest
        this.selected = _.sortBy(ht.entries(), parentDepth)[0][1]
      }
      
      // TODO: ensure contiguous
    } else if(this.selections.length > 0) {
      // choose the deepest item
      this.selected = [_.sortBy(this.selections, function(o) { return -o.dom.parents().length })[0]]
    } else {
      this.selected = []
    }
    
    _.each(this.selected, function(obj) { obj.dom.css({ border: "1px solid black" }) })
  },
  
  selectionEnded: function(e) {
    $(".bubble").each(function(i, dom) {
      dom = $(dom)
      obj = View.objFor(dom)
      dom.css({ border: "" })
    }.bind(this))
  },
})

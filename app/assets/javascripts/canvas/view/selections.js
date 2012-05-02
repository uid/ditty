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
    this.begun = false // user hasn't moved mouse enough yet
  },
  
  selectionChanged: function(e) {
    if(!this.begun && DittyMath.distance(e.rect.x1, e.rect.y1, e.rect.x2, e.rect.y2) < 5) return
    
    this.begun = true
    
    var oldSelected = this.selected
    
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
      var group
      if(groups.length > 0) {
        // pick the highest group
        group = _.sortBy(groups, parentDepth)[0]
      } else {
        // otherwise, take the deepest out of all of them
        group = _.sortBy(ht.entries(), parentDepth)[0]
      }
      
      if(group[0] instanceof View.MultiSlotView) {
        // ensure it's a contiguous selection
        this.selected = group[0].continuousSelection(group[1])
      } else {
        this.selected = group[1]
      }
      
      this.selectedParent = group[0]
    } else if(this.selections.length > 0) {
      // choose the deepest item
      this.selected = [_.sortBy(this.selections, function(o) { return -o.dom.parents().length })[0]]
      this.selectedParent = this.selected[0].directContainer()
    } else {
      this.selected = []
      delete this.selectedParent
    }
    
    var newlySelected = _.without(this.selected, oldSelected)
    var deselected = _.without(oldSelected, this.selected)
    this.overs || (this.overs = new Hashtable)
    
    _.each(deselected, _.bind(function(o) {
      this.overs.get(o).remove()
      this.overs.remove(o)
    }, this))
    
    _.each(newlySelected, _.bind(function(o) {
      var dom = $("<div class='selection-cover'></div>").appendTo($("body"))
      dom.css({
        top: o.dom.offset().top,
        left: o.dom.offset().left,
        width: o.dom.outerWidth(),
        height: o.dom.outerHeight(),
      })
      this.overs.put(o, dom)
    }, this))
  },
  
  selectionEnded: function(e) {
    if(this.selectedParent && (this.selectedParent instanceof View.MultiSlotView)) {
      this.selectedParent.beginFold(this.selected)
    }
    
    if(this.overs) {
      this.overs.each(function(obj, over) { over.remove() })
      delete this.overs
    }
    delete this.selected
  },
})

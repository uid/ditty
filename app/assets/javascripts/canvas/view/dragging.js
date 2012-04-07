
var dragging = false // whether a drag is taking place
var noclick = false // stays true a little longer after dragging becomes false

View.draggable = {
  decorate: function(klass) {
    klass.prototype.setParent = View.draggable.setParent
    klass.prototype.droppableEnter = View.draggable.droppableEnter
    klass.prototype.droppableLeave = View.draggable.droppableLeave
  },
  
  draggable: function(obj, dom, options) {
    var opts = {
      cursor: "move",
      opacity: 0.5,
      revert: true,
      revertDuration: 0,
      zIndex: 1,
      distance: 10, // # of pixels you must move the cursor
      helper: "clone",
      appendTo: "body",
      start: View.draggable.start.bind(obj),
      drag: View.draggable.drag.bind(obj),
      stop: View.draggable.stop.bind(obj),
    }
    for(var i in options) {
      opts[i] = options[i]
    }
    dom.draggable(opts)
    obj.hovered = []
  },
  
  // fired when a drag begins
  start: function(ev, ui) {
    dragging = true
    noclick = true
  },
  
  // fired as the mouse moves during a drag
  drag: function(ev, ui) {
    this.lastOffset = ui.helper.offset()
    this.lastMousePos = { top: ev.pageY, left: ev.pageX }
    
    var nearest = undefined, dist = 10000
    for(var i in this.hovered) {
      var o = this.hovered[i]
      var rectX = DittyMath.clamp(ev.pageX, o.dom.offset().left, o.dom.offset().left + o.dom.outerWidth())
      var rectY = DittyMath.clamp(ev.pageY, o.dom.offset().top, o.dom.offset().top + o.dom.outerHeight())
      var d = DittyMath.distance(ev.pageX, ev.pageY, rectX, rectY)
      if(d < dist) {
        nearest = o
        dist = d
      }
    }
    if(dist > 15) {
      nearest = undefined
    }
    if(this.currentDragTarget != nearest) {
      if(this.currentDragTarget) {
        this.currentDragTarget.dom.removeClass("drag-hover")
      }
      this.currentDragTarget = nearest
      if(this.currentDragTarget) {
        this.currentDragTarget.dom.addClass("drag-hover")
      }
    }
  },
  
  // fired when a drag completes
  stop: function(ev, ui) {
    if(this.currentDragTarget) {
      if(this.parent) this.parent.dragout(this, this.currentDragTarget)
      this.currentDragTarget.dropped(this)
      this.currentDragTarget.dom.removeClass("drag-hover")
      if(this.droppedOn) {
        this.droppedOn(this.currentDragTarget)
      }
    } else if(this.droppedNowhere) {
      this.droppedNowhere(this.lastOffset, this.lastMousePos)
    }
    
    this.hovered = []
    dragging = false
    setTimeout(function() { noclick = false }, 100)
    delete this.currentDragTarget
    delete this.lastOffset
    delete this.lastMousePos
  },
  
  setParent: function(parent) {
    if(parent == this.parent) return
    if(this.parent) this.parent.release(this)
    this.parent = parent
    if(this.parentChanged) this.parentChanged()
  },
  
  // called by droppables who are within dropping distance
  droppableEnter: function(droppable) {
    this.hovered.push(droppable)
  },
  
  // called by droppables who are within dropping distance
  droppableLeave: function(droppable) {
    this.hovered = _.without(this.hovered, droppable)
  },
}

View.droppable = {
  droppable: function(obj, dom, options) {
    var opts = {
      tolerance: "touch",
      over: View.droppable.over.bind(obj),
      out: View.droppable.out.bind(obj),
      accept: function(elem) {
        return elem.has(this.dom).length == 0
      }.bind(obj)
    }
    for(var i in options) {
      opts[i] = options[i]
    }
    dom.droppable(opts)
  },
  
  over: function(ev, ui) {
    View.objFor(ui.draggable).droppableEnter(this)
  },
  
  out: function(ev, ui) {
    View.objFor(ui.draggable).droppableLeave(this)
  },
}


View.ActivityViewer = my.Class({
  constructor: function(dom, options) {
    options || (options = {})
    
    this.dom = dom
    View.setObjFor(this.dom, this)
    
    this.dom.text("[stuff goes here]")
  },
  
  opened: function() {
    this.dom.html("<img src='/assets/spinner.gif' />")
  },
})

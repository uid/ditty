
// set and get objects associated with dom elements
View.objFor = function(dom) {
  return $(dom).data("obj")
}
View.setObjFor = function(dom, obj) {
  $(dom).data("obj", obj)
}


// wraps given event handler function to do 2 things:
//  1) return immediately if the event target isn't the currentTarget
//  2) return immediately if the global variable 'noclick' is true
//     (the view/dragging.js sets it to true when a drag is taking place)
var safeClick = function(f) {
  return function(e) {
    if(e.target != e.currentTarget) return
    if(noclick) return
    return f.apply(null /* this */, arguments)
  }
}

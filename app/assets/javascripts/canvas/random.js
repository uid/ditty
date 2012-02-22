
// copied from: http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm#Anchor-Creatin-49778
function extend(subClass, baseClass) {
   function inheritance() {}
   inheritance.prototype = baseClass.prototype;

   subClass.prototype = new inheritance();
   subClass.prototype.constructor = subClass;
   subClass.baseConstructor = baseClass;
   subClass.superClass = baseClass.prototype;
}

// extremely basic HTML escape
function escapeHTML(str) {
  return (str || "").replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;')
}

// set and get objects associated with dom elements
function objFor(dom) {
  return $(dom).data("obj")
}
function setObjFor(dom, obj) {
  $(dom).data("obj", obj)
}

// clears any selected text in the window
function clearSelection() {
  if(window.getSelection) {
    if(window.getSelection().empty) {  // Chrome
      window.getSelection().empty();
    } else if(window.getSelection().removeAllRanges) {  // Firefox
      window.getSelection().removeAllRanges();
    }
  } else if(document.selection) {  // IE?
    document.selection.empty();
  }
}

// set equality: returns true if all the items in a are == to one in b, in any order, and the reverse
function setEq(a, b) {
  if(a.length != b.length) return false
  for(var i in a) {
    var found = false
    for(var j in b) {
      if(a[i] == b[j]) {
        found = true
        break
      }
    }
    if(!found) return false
  }
  for(var i in b) {
    var found = false
    for(var j in a) {
      if(a[j] == b[i]) {
        found = true
        break
      }
    }
    if(!found) return false
  }
  return true
}

// CPS-style map for arrays
// calls f(c, e, arrayIndex, arrayValue) for each item
// calls c(resultingArray) when finished
function cpsMap(f, c, e, arr) {
  var results = []
  var loop = function(i) {
    if(i >= arr.length) {
      c(results)
    } else {
      f(function(result) {
        results.push(result)
        loop(i + 1)
      }, e, i, arr[i])
    }
  }
  loop(0)
}

// returns an array with the provided elements removed
// (the provided elements are unnamed arguments after 'arr')
function arrayRemove(arr) {
    var what, a = arguments, L = a.length, ax
    while(L > 1 && arr.length) {
        what= a[--L]
        while((ax = arr.indexOf(what))!= -1) {
            arr.splice(ax, 1)
        }
    }
    return arr
}


// works like underscore.js' debounce, with two differences:
// 1) supports asynchronous operations by providing the function with
//    a callback to indicate when the operation is complete
// 2) if the wrapper is called multiple times while in progress,
//    the function will be called only once afterward. this makes it
//    appropriate for wrapping functions that save to the server.
// example:
//   var f = debounceCollapse(function(finish) {
//     console.log("executing...")
//     setTimeout(function() {
//       console.log("done!")
//       finish()
//     }, 300)
//   })
function debounceCollapse(doit) {
  var inProgress = false
  var goAgain = false // true if another request came while the last was processing
  
  var f = function() {
    if(inProgress) {
      goAgain = true
      return
    }
    
    inProgress = true
    
    doit(function() {
      var again = goAgain
      inProgress = false
      goAgain = false
      if(again) {
        f()
      }
    })
  }
  
  return f
}


// we can all use random colors every once in a while

function intToHex(n) {
  var s = n.toString(16)
  if(s.length < 2) {
    return "0" + s
  }
  return s
}

function colorHex(r, g, b) {
  return "#" + intToHex(r) + intToHex(g) + intToHex(b)
}

function randomColor() {
  var r = Math.floor(Math.random() * 256)
  var g = Math.floor(Math.random() * 256)
  var b = Math.floor(Math.random() * 256)
  return colorHex(r,g,b)
}

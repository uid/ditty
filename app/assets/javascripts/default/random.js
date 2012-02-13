
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

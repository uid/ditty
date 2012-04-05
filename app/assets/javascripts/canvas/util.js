
var DittyMath = {
  distance: function(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
  },
  
  clamp: function(val, min, max) {
    if(val < min) return min
    if(val > max) return max
    return val
  },
}


// strings: returns the string surounded by quotes (but doesn't bother escaping)
// arrays: includes square brackets, and recurses for each element
// numbers, booleans, functions: delegates to the default toString()
// objects with 'myToString': returns the value of that function
// everything else: surrounds with {} and recurses for all keys and values
function myToString(v, seen) {
  seen || (seen = [])
  
  if(seen.indexOf(v) != -1) return "..."
  seen2 = seen.concat([v])
  
  if(typeof(v) === "string") {
    return "\"" + v + "\""
  } else if(typeof(v) === "number" || typeof(v) === "boolean" || typeof(v) === "function") {
    return "" + v
  } else if(v instanceof Array) {
    return "[" + _.map(v, function(v2) { return myToString(v2, seen2) }) + "]"
  } else if(v && "myToString" in v) {
    return v.myToString()
  } else if(v instanceof HTMLElement) {
    return "HTMLElement(...)"
  } else if(v instanceof jQuery) {
    return "jQuery(...)"
  } else {
    // return "" + v
    return  "{" + _.map(v, function(v, k) { return k + ": " + myToString(v, seen2) }).join(", ") + "}"
  }
}


// shuffles an array (supposedly Fisher-Yates, but I didn't check)
// adapted from http://snippets.dzone.com/posts/show/849
function shuffle(arr) {
  for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
    return arr
}


// returns a random element from the array
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}


// capitalizes the first letter of a string
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


// generates an "adjective-noun"-looking random phrase using some goofy rules
function randomPhrase() {
  var cons_syllables = ["kon", "fab", "al", "el", "il", "ol", "ul", "krog", "blug", "kem", "moop", "rad", "korm", "delph", "dib", "kek", "deop", "tok", "mig", "tet", "grep", "loog", "tonk", "garf", "yap", "tulk", "krin", "zid", "nik", "zot", "kob", "xor", "aw", "ew", "iw", "ow", "uw", "ar", "er", "ir", "or", "ur", "at", "et", "it", "ot", "ut", "ay", "ey", "iy", "oy", "uy", "ap", "ep", "ip", "op", "up", "as", "es", "is", "os", "us", "ad", "ed", "id", "od", "ud", "af", "ef", "if", "of", "uf", "ag", "eg", "ig", "og", "ug", "ah", "eh", "ih", "oh", "uh", "ak", "ek", "ik", "ok", "uk", "al", "el", "il", "ol", "ul", "az", "ez", "iz", "oz", "uz", "ax", "ex", "ix", "ox", "ux", "ack", "eck", "ick", "ock", "uck", "av", "ev", "iv", "ov", "uv", "ab", "eb", "ib", "ob", "ub", "an", "en", "in", "on", "un", "am", "em", "im", "om", "um"]
  var first_suffixes = ["ic", "ated", "aceous", "aholic", "atory", "ibant", "arpic", "idic", "inal", "inic", "emic", "ergic", "est", "erous", "ating", "ful", "genic", "iatric", "izating", "itious", "ling", "lithic", "lytic", "merous", "morphic", "morphous", "oic", "parous", "pathic", "phagous", "philiac", "philous", "phobic", "ploid", "scopic", "thermic", "trophic", "tropic", "ular", "wise", "worthy", "wide", "zoic", "zygous"]
  var second_suffixes = ["ator", "izer"]
  
  var randomWord = function(suffixes) {
    var num_syllables = Math.floor(Math.random() * 2) + 1
    shuffle(cons_syllables)
    return cons_syllables.slice(0, num_syllables).join("") + randomPick(suffixes)
  }
  
  return capitalize(randomWord(first_suffixes)) + " " + capitalize(randomWord(second_suffixes))
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


// a couple helpers for generating random colors
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


function playAudio(uri) {
  var audio = document.createElement('audio')
  audio.controls = true
  audio.src = uri
  audio.play()
}



var htmlEncode = function(str) {
  return $("<div />").text(str).html()
}

var visibleWhitespace = function(str, options) {
  options || (options = {})
  
  if(!("space" in options) || options.space) {
    str = str.replace(/ /g, "<span class='whitespace'>&#9251;</span>")
  }
  if(!("lineBreak" in options) || options.lineBreak) {
    str = str.replace(/\n/g, "<span class='whitespace'>&#8629;</span>\n")
  }
  
  return str
}


// for now, only bothers getting the upper left corner into view
var scrollIntoView = function(dom) {
  if($("body").scrollTop() > dom.offset().top) {
    $("body").animate({ scrollTop: dom.offset().top - 50 })
  }
  if($("body").scrollLeft() > dom.offset().left) {
    $("body").animate({ scrollLeft: dom.offset().left - 50 })
  }
}

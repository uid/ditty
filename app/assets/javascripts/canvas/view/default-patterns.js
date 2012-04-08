
// kinda janky because it used to be used to create the palette
// now it just saves all the core patterns to Patterns
function loadDefaultPatterns() {
  
  var sectionName
  var addSection = function(name) {
    sectionName = name
  }
  var add = function(patternAttributes, hiddenByDefault) {
    patternAttributes.category = sectionName
    if(!hiddenByDefault) patternAttributes.featured = true
    return Patterns.create(patternAttributes, { wait: true })
  }
  
  
  addSection("Text Processing")
  
  // array model
  
  var inputString = add({
    representations: [{ template: "input string" }],
    arguments: [],
    javascript_meaning: "return Globals.harness.input.text",
  })
  add({
    representations: [{ template: "output string" }],
    arguments: [],
    javascript_meaning: "return Globals.harness.output.text",
  })
  add({
    representations: [{ template: "set output to [string]" }],
    arguments: [{ name: "string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { Globals.harness.output.setText(vals[0]) })",
  })
  
  // stream model
  
  // add({
  //   representations: [{ template: "read next character" }],
  //   arguments: [],
  //   javascript_meaning: "var c = Globals.harness.input.characterAtCursor(); Globals.harness.input.advanceCursor(1); return c",
  // })
  // add({
  //   representations: [{ template: "seek to input position [position]" }],
  //   arguments: [{ name: "position" }],
  //   javascript_meaning: "vm.continuation(env.lookup('position'), function(vals) { Globals.harness.input.setCursorPosition(vals[0]) })",
  // })
  // add({
  //   representations: [{ template: "write [text]" }],
  //   arguments: [{ name: "text" }],
  //   javascript_meaning: "vm.continuation(env.lookup('text'), function(vals) { Globals.harness.output.appendText(vals[0]) })",
  // })
  
  // cursor model
  
  // add({
  //   representations: [{ template: "input cursor" }],
  //   arguments: [],
  //   javascript_meaning: "return Globals.harness.input",
  // })
  // add({
  //   representations: [{ template: "output cursor" }],
  //   arguments: [],
  //   javascript_meaning: "return Globals.harness.output",
  // })
  // add({
  //   representations: [{ template: "input length" }],
  //   arguments: [],
  //   javascript_meaning: "return Globals.harness.input.text.length",
  // })
  // add({
  //   representations: [{ template: "output length" }],
  //   arguments: [],
  //   javascript_meaning: "return Globals.harness.output.text.length",
  // })
  // add({
  //   representations: [{ template: "character at [cursor]" }],
  //   arguments: [{ name: "cursor" }],
  //   javascript_meaning: "vm.continuation(env.lookup('cursor'), function(vals) { return vals[0].characterAtCursor() })",
  // })
  // add({
  //   representations: [{ template: "position of [cursor]" }],
  //   arguments: [{ name: "cursor" }],
  //   javascript_meaning: "vm.continuation(env.lookup('cursor'), function(vals) { return vals[0].cursorPosition })",
  // })
  // add({
  //   representations: [{ template: "insert [text] at [cursor]" }],
  //   arguments: [{ name: "cursor" }, { name: "text" }],
  //   javascript_meaning: "vm.continuation(env.lookup('cursor'), env.lookup('text'), function(vals) { vals[0].insertText(vals[1]) })",
  // })
  // add({
  //   representations: [{ template: "set position of [cursor] to [position]" }],
  //   arguments: [{ name: "cursor" }, { name: "position" }],
  //   javascript_meaning: "vm.continuation(env.lookup('cursor'), env.lookup('position'), function(vals) { vals[0].setCursorPosition(vals[1]) })",
  // })
  
  
  addSection("Debugging")
  
  add({
    representations: [{ template: "display [object]" }],
    arguments: [{ name: "object" }],
    javascript_meaning: "vm.continuation(env.lookup('object'), function(vals) { $.achtung({ message: myToString(vals[0]), timeout: 5, className: 'debug' }) })",
  })
  // add({
  //   representations: [{ template: "Pause execution." }],
  //   arguments: [],
  //   javascript_meaning: "vm.delegate(new VM.IPause)",
  // }, true)
  
  
  addSection("Strings")
  
  add({
    representations: [{ template: "length of [string]" }],
    arguments: [{ name: "string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { return vals[0].length })",
  })
  add({
    representations: [{ template: "character of [string] at position [position]" }],
    arguments: [{ name: "string" }, { name: "position" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), env.lookup('position'), function(vals) { return vals[0][vals[1]] })",
  })
  add({
    representations: [{ template: "[string 1] + [string 2]" }],
    arguments: [{ name: "string 1" }, { name: "string 2" }],
    javascript_meaning: "vm.continuation(env.lookup('string 1'), env.lookup('string 2'), function(vals) { return vals[0] + vals[1] })",
  })
  add({
    representations: [{ template: "empty string" }],
    arguments: [],
    javascript_meaning: "return ''",
  }, true)
  add({
    representations: [{ template: "line break character" }],
    arguments: [],
    javascript_meaning: "return \"\\n\"",
  }, true)
  add({
    representations: [
      { template: "characters of [string] between [start position] and [end position]" },
      { template: "slice of [string] from character [start position] to [end position]" },
      { template: "substring of [string] from character [start position] to [end position]" },
    ],
    arguments: [{ name: "string" }, { name: "start position" }, { name: "end position" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), env.lookup('start position'), env.lookup('end position'), function(vals) { return vals[0].substr(vals[1], vals[2]) })",
  }, true)
  add({
    representations: [{ template: "position of [search string] in [string]" }],
    arguments: [{ name: "string" }, { name: "search string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), env.lookup('search string'), function(vals) { return vals[0].indexOf(vals[1]) })",
  }, true)
  add({
    representations: [{ template: "[string] with [search string] replaced with [replacement string]" }],
    arguments: [{ name: "string" }, { name: "search string" }, { name: "replacement string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), env.lookup('search string'), env.lookup('replacement string'), function(vals) { return vals[0].split(vals[1]).join(vals[2]) })",
  }, true)
  add({
    representations: [{ template: "components of [string] separated by [separator]" }],
    arguments: [{ name: "string" }, { name: "separator" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), env.lookup('separator'), function(vals) { return vals[0].split(vals[1]) })",
  }, true)
  add({
    representations: [{ template: "lowercase version of [string]" }],
    arguments: [{ name: "string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { return vals[0].toLowerCase() })",
  }, true)
  add({
    representations: [{ template: "uppercase version of [string]" }],
    arguments: [{ name: "string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { return vals[0].toUpperCase() })",
  }, true)
  add({
    representations: [{ template: "[value] is a string" }],
    arguments: [{ name: "value" }],
    javascript_meaning: "vm.continuation(env.lookup('value'), function(vals) { return typeof(vals[0]) === 'string' })",
  }, true)
  
  
  addSection("Numbers")
  
  $("#palette").append("<p>To get specific numbers, type them.</p>")
  
  add({
    representations: [{ template: "[left number] &plus; [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] + vals[1] })",
  })
  add({
    representations: [{ template: "[left number] &minus; [right number]" }, { template: "[left number] - [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] - vals[1] })",
  })
  add({
    representations: [{ template: "[left number] &times; [right number]" }, { template: "[left number] * [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] * vals[1] })",
  }, true)
  add({
    representations: [{ template: "[left number] &divide; [right number]" }, { template: "[left number] / [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] / vals[1] })",
  }, true)
  add({
    representations: [{ template: "[left number] % [right number]" }, { template: "[left number] mod [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] % vals[1] })",
  }, true)
  add({
    representations: [{ template: "-[number]" }],
    arguments: [{ name: "number" }],
    javascript_meaning: "vm.continuation(env.lookup('number'), function(vals) { return -vals[0] })",
  }, true)
  // add({
  //   representations: [{ template: "[string] as a floating point number" }],
  //   arguments: [{ name: "string" }],
  //   javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { return parseFloat(vals[0]) })",
  // }, true)
  add({
    representations: [{ template: "[string] as an integer" }],
    arguments: [{ name: "string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { return parseInt(vals[0]) })",
  }, true)
  add({
    representations: [{ template: "[number] as a string" }],
    arguments: [{ name: "number" }],
    javascript_meaning: "vm.continuation(env.lookup('number'), function(vals) { return \"\" + vals[0] })",
  }, true)
  add({
    representations: [{ template: "[number] is a number" }],
    arguments: [{ name: "number" }],
    javascript_meaning: "vm.continuation(env.lookup('number'), function(vals) { return typeof(vals[0]) === 'number' })",
  }, true)
  add({
    representations: [{ template: "[number] is a valid number" }],
    arguments: [{ name: "number" }],
    javascript_meaning: "vm.continuation(env.lookup('number'), function(vals) { return !isNaN(vals[0]) })",
  }, true)
  // add({
  //   representations: [{ template: "[number] as a string" }],
  //   arguments: [{ name: "number" }],
  //   javascript_meaning: "vm.continuation(env.lookup('number'), function(vals) { return '' + vals[0] })",
  // }, true)
  
  
  addSection("Comparison")
  
  add({
    representations: [{ template: "[left thing] == [right thing]" }, { template: "[left thing] equals [right thing]" }],
    arguments: [{ name: "left thing" }, { name: "right thing" }],
    javascript_meaning: "vm.continuation(env.lookup('left thing'), env.lookup('right thing'), function(vals) { return vals[0] == vals[1] })",
  })
  add({
    representations: [{ template: "[left thing] &ne; [right thing]" }, { template: "[left thing] != [right thing]" }],
    arguments: [{ name: "left thing" }, { name: "right thing" }],
    javascript_meaning: "vm.continuation(env.lookup('left thing'), env.lookup('right thing'), function(vals) { return vals[0] != vals[1] })",
  })
  add({
    representations: [{ template: "[left number] &lt; [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] < vals[1] })",
  }, true)
  add({
    representations: [{ template: "[left number] &gt; [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] > vals[1] })",
  }, true)
  add({
    representations: [{ template: "[left number] &le; [right number]" }, { template: "[left number] &lt;= [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] <= vals[1] })",
  }, true)
  add({
    representations: [{ template: "[left number] &ge; [right number]" }, { template: "[left number] &gt;= [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] >= vals[1] })",
  }, true)
  
  
  addSection("Logic")
  
  var logicalNegationPattern = add({
    representations: [{ template: "! [boolean]" }],
    arguments: [{ name: "boolean" }],
    javascript_meaning: "vm.continuation(env.lookup('boolean'), function(vals) { return !vals[0] })",
  })
  add({
    representations: [{ template: "[left boolean] &amp;&amp; [right boolean]" }, { template: "[left boolean] and [right boolean]" }],
    arguments: [{ name: "left boolean" }, { name: "right boolean" }],
    javascript_meaning: "vm.continuation(env.lookup('left boolean'), env.lookup('right boolean'), function(vals) { return vals[0] && vals[1] })",
  })
  add({
    representations: [{ template: "[left boolean] || [right boolean]" }, { template: "[left boolean] or [right boolean]" }],
    arguments: [{ name: "left boolean" }, { name: "right boolean" }],
    javascript_meaning: "vm.continuation(env.lookup('left boolean'), env.lookup('right boolean'), function(vals) { return vals[0] || vals[1] })",
  })
  add({
    representations: [{ template: "[condition] ? [value if true] : [value if false]" }, { template: "[value if true] if [condition] else [value if false]" }],
    arguments: [{ name: "condition" }, { name: "value if true" }, { name: "value if false" }],
    javascript_meaning: "vm.continuation(env.lookup('condition'), function(vals) { vm.delegate(vals[0] ? env.lookup('value if true') : env.lookup('value if false')) })",
  }, true)
  
  
  addSection("Control Flow")
  
  var ifPattern = add({
    representations: [{ template: "if([condition]) {<br />[actions]<br />}" }],
    arguments: [{ name: "condition" }, { name: "actions", type: "instructions" }],
    javascript_meaning: "vm.continuation(env.lookup('condition'), function(vals) { if(vals[0]) { vm.delegate(env.lookup('actions')) } })",
  })
  add({
    representations: [{ template: "if([condition]) {<br />[actions if true]<br />} else {<br />[actions if false]<br />}" }],
    arguments: [{ name: "condition" }, { name: "actions if true", type: "instructions" }, { name: "actions if false", type: "instructions" }],
    javascript_meaning: "vm.continuation(env.lookup('condition'), function(vals) { vm.delegate(vals[0] ? env.lookup('actions if true') : env.lookup('actions if false')) })",
  })
  var loopPattern = add({
    representations: [{ template: "loop {<br />[actions]<br />}" }],
    arguments: [{ name: "actions", type: "instructions" }],
    javascript_meaning: "vm.beginLoop(); var f = function() { vm.continuation(env.lookup('actions'), f) }; f()",
  })
  var breakPattern = add({
    representations: [{ template: "Break." }],
    arguments: [],
    javascript_meaning: "vm.breakLoop()",
  })
  // add({
  //   representations: [{ template: "while([condition]) {<br />[actions]<br />}" }],
  //   arguments: [{ name: "condition" }, { name: "actions", type: "instructions" }],
  //   native_meaning: [
  //     {
  //       invocation: {
  //         pattern: loopPattern,
  //         arguments: {
  //           actions: [
  //             {
  //               invocation: {
  //                 pattern: ifPattern,
  //                 arguments: {
  //                   condition: {
  //                     invocation: {
  //                       pattern: logicalNegationPattern,
  //                       arguments: {
  //                         boolean: { reference: { name: "condition" } }
  //                       }
  //                     }
  //                   },
  //                   actions: {
  //                     invocation: { pattern: breakPattern }
  //                   }
  //                 }
  //               }
  //             },
  //             { reference: { name: "actions" } }
  //           ]
  //         }
  //       }
  //     }
  //   ],
  // })
  
  
  addSection("Variables")
  
  add({
    representations: [{ template: "Set value of [variable name] to [value]." }, { template: "Set [variable name] = [value]." }],
    arguments: [{ name: "variable name" }, { name: "value" }],
    javascript_meaning: "vm.continuation(env.lookup('variable name'), env.lookup('value'), function(vals) { vm.envs[1].set(vals[0], vals[1]); return vals[1] })",
  })
  add({
    representations: [{ template: "value of [variable name]" }],
    arguments: [{ name: "variable name" }],
    javascript_meaning: "vm.continuation(env.lookup('variable name'), function(vals) { if(!vm.envs[1].contains(vals[0])) { throw new Error('variable \"' + vals[0] + '\" does not exist') } else { return vm.envs[1].lookup(vals[0]) } })",
  })
  
  
  addSection("Objects")
  
  add({
    representations: [{ template: "new object" }],
    arguments: [],
    javascript_meaning: "return {}",
  })
  add({
    representations: [{ template: "Set the value of [key string] in [object] to [value]." }],
    arguments: [{ name: "object" }, { name: "key string" }, { name: "value" }],
    javascript_meaning: "vm.continuation(env.lookup('object'), env.lookup('key string'), env.lookup('value'), function(vals) { return vals[0][vals[1]] = vals[2] })",
  })
  add({
    representations: [{ template: "value of [key string] in [object]" }],
    arguments: [{ name: "object" }, { name: "key string" }],
    javascript_meaning: "vm.continuation(env.lookup('object'), env.lookup('key string'), function(vals) { return vals[0][vals[1]] })",
  })
  add({
    representations: [{ template: "keys of [object]" }],
    arguments: [{ name: "object" }],
    javascript_meaning: "vm.continuation(env.lookup('object'), function(vals) { return _.keys(vals[0]) })",
  }, true)
  add({
    representations: [{ template: "remove value for [key string] in [object]" }],
    arguments: [{ name: "object" }, { name: "key string" }],
    javascript_meaning: "vm.continuation(env.lookup('object'), env.lookup('key string'), function(vals) { delete vals[0][vals[1]] })",
  }, true)
  add({
    representations: [{ template: "[value] is an object" }],
    arguments: [{ name: "value" }],
    javascript_meaning: "vm.continuation(env.lookup('value'), function(vals) { return (typeof(vals[0]) === 'object') && !(vals[0] instanceof Array) })",
  }, true)
  
  
  addSection("Arrays")
  
  add({
    representations: [{ template: "new array" }],
    arguments: [],
    javascript_meaning: "return []",
  })
  add({
    representations: [{ template: "number of items in [array]" }, { template: "length of [array]" }],
    arguments: [{ name: "array" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), function(vals) { return vals[0].length })",
  })
  add({
    representations: [{ template: "value of [array] at index [index]" }],
    arguments: [{ name: "array" }, { name: "index" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), env.lookup('index'), function(vals) { return vals[0][vals[1]] })",
  })
  add({
    representations: [{ template: "set value of [array] at index [index] to [value]" }],
    arguments: [{ name: "array" }, { name: "index" }, { name: "value" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), env.lookup('index'), env.lookup('value'), function(vals) { return vals[0][vals[1]] = vals[2] })",
  })
  add({
    representations: [{ template: "append [value] to [array]" }, { template: "push [value] onto [array]" }],
    arguments: [{ name: "array" }, { name: "value" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), env.lookup('value'), function(vals) { vals[0].push(vals[1]); return vals[1] })",
  }, true)
  add({
    representations: [{ template: "prepend [value] to [array]" }, { template: "unshift [value] onto [array]" }],
    arguments: [{ name: "array" }, { name: "value" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), env.lookup('value'), function(vals) { vals[0].unshift(vals[1]); return vals[1] })",
  }, true)
  add({
    representations: [{ template: "pop value from end of [array]" }],
    arguments: [{ name: "array" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), function(vals) { return vals[0].pop() })",
  }, true)
  add({
    representations: [{ template: "shift value from beginning of [array]" }],
    arguments: [{ name: "array" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), function(vals) { return vals[0].shift() })",
  }, true)
  add({
    representations: [{ template: "values in [array] joined by [string]" }],
    arguments: [{ name: "array" }, { name: "string" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), env.lookup('string'), function(vals) { return vals[0].join(vals[1]) })",
  }, true)
  add({
    representations: [{ template: "[array] reversed" }],
    arguments: [{ name: "array" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), function(vals) { return vals[0].slice(0).reverse() })",
  }, true)
  add({
    representations: [{ template: "[first array] + [second array]" }],
    arguments: [{ name: "first array" }, { name: "second array" }],
    javascript_meaning: "vm.continuation(env.lookup('first array'), env.lookup('second array'), function(vals) { return vals[0].concat(vals[1]) })",
  }, true)
  add({
    representations: [{ template: "position of [object] in [array]" }],
    arguments: [{ name: "object" }, { name: "array" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), env.lookup('object'), function(vals) { return vals[0].indexOf(vals[1]) })",
  }, true)
  add({
    representations: [{ template: "[value] is an array" }],
    arguments: [{ name: "value" }],
    javascript_meaning: "vm.continuation(env.lookup('value'), function(vals) { return vals[0] instanceof Array })",
  }, true)
}

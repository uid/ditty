
function addDefaultPatterns() {
  var addSection = function(name) {
    $("#palette").append($("<h3></h3>").text(name))
  }
  var addHiddenSection = function() {
    var dom = $("<div></div>").hide()
    var expander = $("<a href='#'>More&#8230;</a>").click(function() { dom.animate({ height: "toggle", opacity: "toggle" }); return false})
    $("<div></div>").append(expander).append(dom).appendTo($("#palette"))
    return dom
  }
  var add = function(patternAttributes, section) {
    var pattern = new Pattern(patternAttributes)
    Patterns.add(pattern);
    (section || $("#palette")).append(new View.BubbleBlower(function(parent) { return new View.InvocationView(new Invocation({ pattern: pattern.cid }), { parent: parent }) }).dom)
    return pattern.cid
  }
  
  
  var more
  
  
  addSection("New Command")
  
  add({
    representations: [{ template: "New Command +" }],
    arguments: [],
    native_meaning: [],
  })
  
  
  addSection("Text Processing")
  
  // array model
  
  add({
    representations: [{ template: "input string" }],
    arguments: [],
    javascript_meaning: "return Globals.harness.input.text",
  })
  add({
    representations: [{ template: "output string" }],
    arguments: [],
    javascript_meaning: "return Globals.harness.output.text",
  }, more)
  add({
    representations: [{ template: "set output to [string]" }],
    arguments: [{ name: "string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { Globals.harness.output.setText(vals[0]) })",
  }, more)
  
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
  
  more = addHiddenSection()
  
  add({
    representations: [
      { template: "characters of [string] between [start position] and [end position]" },
      { template: "slice of [string] from character [start position] to [end position]" },
      { template: "substring of [string] from character [start position] to [end position]" },
    ],
    arguments: [{ name: "string" }, { name: "start position" }, { name: "end position" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), env.lookup('start position'), env.lookup('end position'), function(vals) { return vals[0].substr(vals[1], vals[2]) })",
  }, more)
  add({
    representations: [{ template: "position of [search string] in [string]" }],
    arguments: [{ name: "string" }, { name: "search string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), env.lookup('search string'), function(vals) { return vals[0].indexOf(vals[1]) })",
  }, more)
  add({
    representations: [{ template: "[string] with [search string] replaced with [replacement string]" }],
    arguments: [{ name: "string" }, { name: "search string" }, { name: "replacement string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), env.lookup('search string'), env.lookup('replacement string'), function(vals) { return vals[0].replace(vals[1], vals[2]) })",
  }, more)
  add({
    representations: [{ template: "components of [string] separated by [separator]" }],
    arguments: [{ name: "string" }, { name: "separator" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), env.lookup('separator'), function(vals) { return vals[0].split(vals[1]) })",
  }, more)
  add({
    representations: [{ template: "lowercase version of [string]" }],
    arguments: [{ name: "string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { return vals[0].toLowerCase() })",
  }, more)
  add({
    representations: [{ template: "uppercase version of [string]" }],
    arguments: [{ name: "string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { return vals[0].toUpperCase() })",
  }, more)
  add({
    representations: [{ template: "[object] is a string" }],
    arguments: [{ name: "object" }],
    javascript_meaning: "vm.continuation(env.lookup('object'), function(vals) { return typeof(vals[0]) === 'string' })",
  }, more)
  
  
  addSection("Numbers")
  
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
  
  more = addHiddenSection()
  
  add({
    representations: [{ template: "[left number] &times; [right number]" }, { template: "[left number] * [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] * vals[1] })",
  }, more)
  add({
    representations: [{ template: "[left number] &divide; [right number]" }, { template: "[left number] / [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] / vals[1] })",
  }, more)
  add({
    representations: [{ template: "[left number] % [right number]" }, { template: "[left number] mod [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] % vals[1] })",
  }, more)
  add({
    representations: [{ template: "-[number]" }],
    arguments: [{ name: "number" }],
    javascript_meaning: "vm.continuation(env.lookup('number'), function(vals) { return -vals[0] })",
  }, more)
  // add({
  //   representations: [{ template: "[string] as a floating point number" }],
  //   arguments: [{ name: "string" }],
  //   javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { return parseFloat(vals[0]) })",
  // }, more)
  add({
    representations: [{ template: "[string] as an integer" }],
    arguments: [{ name: "string" }],
    javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { return parseInt(vals[0]) })",
  }, more)
  add({
    representations: [{ template: "[number] is a valid number" }],
    arguments: [{ name: "number" }],
    javascript_meaning: "vm.continuation(env.lookup('number'), function(vals) { return !isNaN(vals[0]) })",
  }, more)
  // add({
  //   representations: [{ template: "[number] as a string" }],
  //   arguments: [{ name: "number" }],
  //   javascript_meaning: "vm.continuation(env.lookup('number'), function(vals) { return '' + vals[0] })",
  // }, more)
  
  
  addSection("Comparisons")
  
  add({
    representations: [{ template: "[left number] &lt; [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] < vals[1] })",
  })
  add({
    representations: [{ template: "[left number] &gt; [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] > vals[1] })",
  })
  add({
    representations: [{ template: "[left number] == [right number]" }, { template: "[left number] equals [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] == vals[1] })",
  })
  add({
    representations: [{ template: "[left number] &ne; [right number]" }, { template: "[left number] != [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] != vals[1] })",
  })
  
  more = addHiddenSection()
  
  add({
    representations: [{ template: "[left number] &le; [right number]" }, { template: "[left number] &lt;= [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] <= vals[1] })",
  }, more)
  add({
    representations: [{ template: "[left number] &ge; [right number]" }, { template: "[left number] &gt;= [right number]" }],
    arguments: [{ name: "left number" }, { name: "right number" }],
    javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] >= vals[1] })",
  }, more)
  
  
  addSection("Logic")
  
  var logicalNegationPattern = add({
    representations: [{ template: "![boolean]" }],
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
  
  more = addHiddenSection()
  
  add({
    representations: [{ template: "[condition] ? [value if true] : [value if false]" }, { template: "[value if true] if [condition] else [value if false]" }],
    arguments: [{ name: "condition" }, { name: "value if true" }, { name: "value if false" }],
    javascript_meaning: "vm.continuation(env.lookup('condition'), function(vals) { vm.delegate(vals[0] ? env.lookup('value if true') : env.lookup('value if false')) })",
  }, more)
  
  
  addSection("Control Flow")
  
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
  add({
    representations: [{ template: "while([condition]) {<br />[actions]<br />}" }],
    arguments: [{ name: "condition" }, { name: "actions", type: "instructions" }],
    native_meaning: [
      {
        invocation: {
          pattern: loopPattern,
          arguments: {
            actions: [
              {
                invocation: {
                  pattern: ifPattern,
                  arguments: {
                    condition: {
                      invocation: {
                        pattern: logicalNegationPattern,
                        arguments: {
                          boolean: { reference: { name: "condition" } }
                        }
                      }
                    },
                    actions: {
                      invocation: { pattern: breakPattern }
                    }
                  }
                }
              },
              { reference: { name: "actions" } }
            ]
          }
        }
      }
    ],
  })
  
  
  addSection("Variables")
  
  add({
    representations: [{ template: "Set value of [variable name] to [value]." }],
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
    representations: [{ template: "Set the value of [key] in [object] to [value]." }],
    arguments: [{ name: "object" }, { name: "key" }, { name: "value" }],
    javascript_meaning: "vm.continuation(env.lookup('object'), env.lookup('key'), env.lookup('value'), function(vals) { return vals[0][vals[1]] = vals[2] })",
  })
  add({
    representations: [{ template: "value of [key] in [object]" }],
    arguments: [{ name: "object" }, { name: "key" }],
    javascript_meaning: "vm.continuation(env.lookup('object'), env.lookup('key'), function(vals) { return vals[0][vals[1]] })",
  })
  
  more = addHiddenSection()
  
  add({
    representations: [{ template: "keys of [object]" }],
    arguments: [{ name: "object" }],
    javascript_meaning: "vm.continuation(env.lookup('object'), function(vals) { return _.keys(vals[0]) })",
  }, more)
  add({
    representations: [{ template: "remove value for [key] in [object]" }],
    arguments: [{ name: "object" }, { name: "key" }],
    javascript_meaning: "vm.continuation(env.lookup('object'), env.lookup('key'), function(vals) { delete vals[0][vals[1]] })",
  }, more)
  
  
  addSection("Arrays")
  
  add({
    representations: [{ template: "new array" }],
    arguments: [],
    javascript_meaning: "return []",
  })
  add({
    representations: [{ template: "number of items in [array]" }],
    arguments: [{ name: "array" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), function(vals) { return vals[0].length })",
  })
  add({
    representations: [{ template: "set value of [array] at index [index] to [value]" }],
    arguments: [{ name: "array" }, { name: "index" }, { name: "value" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), env.lookup('index'), env.lookup('value'), function(vals) { return vals[0][vals[1]] = vals[2] })",
  })
  add({
    representations: [{ template: "value of [array] at index [index]" }],
    arguments: [{ name: "array" }, { name: "index" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), env.lookup('index'), function(vals) { return vals[0][vals[1]] })",
  })
  add({
    representations: [{ template: "append [value] to [array]" }, { template: "push [value] onto [array]" }],
    arguments: [{ name: "array" }, { name: "value" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), env.lookup('value'), function(vals) { vals[0].push(vals[1]); return vals[1] })",
  })
  
  more = addHiddenSection()
  
  add({
    representations: [{ template: "pop value from end of [array]" }],
    arguments: [{ name: "array" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), function(vals) { return vals[0].pop() })",
  }, more)
  add({
    representations: [{ template: "[array] reversed" }],
    arguments: [{ name: "array" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), function(vals) { return vals[0].slice(0).reverse() })",
  }, more)
  add({
    representations: [{ template: "[first array] + [second array]" }],
    arguments: [{ name: "first array" }, { name: "second array" }],
    javascript_meaning: "vm.continuation(env.lookup('first array'), env.lookup('second array'), function(vals) { return vals[0].concat(vals[1]) })",
  }, more)
  add({
    representations: [{ template: "position of [object] in [array]" }],
    arguments: [{ name: "object" }, { name: "array" }],
    javascript_meaning: "vm.continuation(env.lookup('array'), env.lookup('object'), function(vals) { return vals[0].indexOf(vals[1]) })",
  }, more)
  add({
    representations: [{ template: "[object] is an array" }],
    arguments: [{ name: "object" }],
    javascript_meaning: "vm.continuation(env.lookup('object'), function(vals) { return vals[0] instanceof Array })",
  }, more)
}

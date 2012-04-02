//= require_tree ./canvas/ext
//= require_tree ./canvas

var Patterns = new PatternCollection
var Globals = {}


$(function() {
  $("#loading").hide()
  
  $("body").addClass("no-drag-in-progress")
  $("body").bind("dragstart", function(e, ui) {
    $("body").removeClass("no-drag-in-progress");
    $("body").addClass("drag-in-progress")
  })
  $("body").bind("dragstop", function(e, ui) {
    $("body").addClass("no-drag-in-progress");
    $("body").removeClass("drag-in-progress")
  })
  
  Globals.happyInput = new View.HappyTextbox({ text: "One, two, three, four, five." })
  Globals.happyOutput = new View.HappyTextbox()
  
  var table = $("<table style='width: 80%' />").appendTo($("body"))
  $("<tr><th>Input</th><th>Output</th></tr>").appendTo(table)
  var row = $("<tr />").appendTo(table)
  Globals.happyInput.dom.appendTo($("<td style='width: 50%' />").appendTo(row))
  Globals.happyOutput.dom.appendTo($("<td style='width: 50%' />").appendTo(row))
  
  // return
  // Patterns.fetch({
  //   success: function() {
      
      $("#canvas").append(new View.TrashView().dom)
      
      // Patterns.each(function(p) {
      //   p.templates.each(function(t, i) {
      //     $("body").append(new View.InvocationView(new Invocation({ pattern: p.id, representationIndex: i })).dom)
      //   })
      // })
      
      // $("body").append(new View.InvocationView(new Invocation({ pattern: 136 })).dom)
      // $("body").append(new View.InvocationView(new Invocation({ pattern: 161 })).dom)
      // $("body").append(new View.InvocationView(new Invocation({ pattern: 161, representationIndex: 1 })).dom)
      // $("body").append(new View.InvocationView(new Invocation({ pattern: 161 })).dom)
      
      // $("body").append(new View.InvocationView(new Invocation({ pattern: 134 })).dom)
      // var pattern = Patterns.get(134)
      // pattern.set("javascript_meaning", "vm.continuation(env.lookup('message'), function(vals) { setTimeout(function() { alert(vals[0]) }, 230) })")
      
      var add = function(patternAttributes) {
        var pattern = new Pattern(patternAttributes)
        Patterns.add(pattern)
        $("body").append(new View.BubbleBlower(function(parent) { return new View.InvocationView(new Invocation({ pattern: pattern.cid }), { parent: parent }) }).dom)
        return pattern.cid
      }
      add({
        representations: [{ template: "debug" }],
        arguments: [],
        javascript_meaning: "alert('debug')",
      })
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
      })
      add({
        representations: [{ template: "[left number] &divide; [right number]" }, { template: "[left number] / [right number]" }],
        arguments: [{ name: "left number" }, { name: "right number" }],
        javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] / vals[1] })",
      })
      add({
        representations: [{ template: "[left number] % [right number]" }, { template: "[left number] mod [right number]" }],
        arguments: [{ name: "left number" }, { name: "right number" }],
        javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] % vals[1] })",
      })
      add({
        representations: [{ template: "[left number] &lt; [right number]" }],
        arguments: [{ name: "left number" }, { name: "right number" }],
        javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] < vals[1] })",
      })
      add({
        representations: [{ template: "[left number] &le; [right number]" }, { template: "[left number] &lt;= [right number]" }],
        arguments: [{ name: "left number" }, { name: "right number" }],
        javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] <= vals[1] })",
      })
      add({
        representations: [{ template: "[left number] == [right number]" }, { template: "[left number] equals [right number]" }],
        arguments: [{ name: "left number" }, { name: "right number" }],
        javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] == vals[1] })",
      })
      add({
        representations: [{ template: "[left number] &ge; [right number]" }, { template: "[left number] &gt;= [right number]" }],
        arguments: [{ name: "left number" }, { name: "right number" }],
        javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] >= vals[1] })",
      })
      add({
        representations: [{ template: "[left number] &gt; [right number]" }],
        arguments: [{ name: "left number" }, { name: "right number" }],
        javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] > vals[1] })",
      })
      add({
        representations: [{ template: "[left number] &ne; [right number]" }, { template: "[left number] != [right number]" }],
        arguments: [{ name: "left number" }, { name: "right number" }],
        javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] != vals[1] })",
      })
      add({
        representations: [{ template: "-[number]" }],
        arguments: [{ name: "number" }],
        javascript_meaning: "vm.continuation(env.lookup('number'), function(vals) { return -vals[0] })",
      })
      var logicalNegationPattern = add({
        representations: [{ template: "![boolean]" }],
        arguments: [{ name: "boolean" }],
        javascript_meaning: "vm.continuation(env.lookup('boolean'), function(vals) { return !vals[0] })",
      })
      add({
        representations: [{ template: "[left boolean] and [right boolean]" }, { template: "[left boolean] &amp;&amp; [right boolean]" }],
        arguments: [{ name: "left boolean" }, { name: "right boolean" }],
        javascript_meaning: "vm.continuation(env.lookup('left boolean'), env.lookup('right boolean'), function(vals) { return vals[0] && vals[1] })",
      })
      add({
        representations: [{ template: "[left boolean] or [right boolean]" }, { template: "[left boolean] || [right boolean]" }],
        arguments: [{ name: "left boolean" }, { name: "right boolean" }],
        javascript_meaning: "vm.continuation(env.lookup('left boolean'), env.lookup('right boolean'), function(vals) { return vals[0] || vals[1] })",
      })
      add({
        representations: [{ template: "[condition] ? [value if true] : [value if false]" }, { template: "[value if true] if [condition] else [value if false]" }],
        arguments: [{ name: "condition" }, { name: "value if true" }, { name: "value if false" }],
        javascript_meaning: "vm.continuation(env.lookup('condition'), function(vals) { vm.delegate(vals[0] ? env.lookup('value if true') : env.lookup('value if false')) })",
      })
      add({
        representations: [{ template: "[string 1] + [string 2]" }],
        arguments: [{ name: "string 1" }, { name: "string 2" }],
        javascript_meaning: "vm.continuation(env.lookup('string 1'), env.lookup('string 2'), function(vals) { return vals[0] + vals[1] })",
      })
      add({
        representations: [{ template: "[string] as a floating point number" }],
        arguments: [{ name: "string" }],
        javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { return parseFloat(vals[0]) })",
      })
      add({
        representations: [{ template: "[string] as an integer" }],
        arguments: [{ name: "string" }],
        javascript_meaning: "vm.continuation(env.lookup('string'), function(vals) { return parseInt(vals[0]) })",
      })
      add({
        representations: [{ template: "[number] is a valid number" }],
        arguments: [{ name: "number" }],
        javascript_meaning: "vm.continuation(env.lookup('number'), function(vals) { return !isNaN(vals[0]) })",
      })
      add({
        representations: [{ template: "[number] as a string" }],
        arguments: [{ name: "number" }],
        javascript_meaning: "vm.continuation(env.lookup('number'), function(vals) { return '' + vals[0] })",
      })
      add({
        representations: [{ template: "new object" }],
        arguments: [],
        javascript_meaning: "return {}",
      })
      add({
        representations: [{ template: "keys of [object]" }],
        arguments: [{ name: "object" }],
        javascript_meaning: "vm.continuation(env.lookup('object'), function(vals) { return _.keys(vals[0]) })",
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
      add({
        representations: [{ template: "remove value for [key] in [object]" }],
        arguments: [{ name: "object" }, { name: "key" }],
        javascript_meaning: "vm.continuation(env.lookup('object'), env.lookup('key'), function(vals) { delete vals[0][vals[1]] })",
      })
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
        representations: [{ template: "append [value] to [array]" }],
        arguments: [{ name: "array" }, { name: "value" }],
        javascript_meaning: "vm.continuation(env.lookup('array'), env.lookup('value'), function(vals) { vals[0].push(vals[1]); return vals[1] })",
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
        representations: [{ template: "maybe" }],
        arguments: [],
        javascript_meaning: "return Math.random() > 0.5",
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
      add({
        representations: [{ template: "Set value of [variable name] to [value]." }],
        arguments: [{ name: "variable name" }, { name: "value" }],
        javascript_meaning: "vm.continuation(env.lookup('variable name'), env.lookup('value'), function(vals) { vm.envs[1].set(vals[0], vals[1]); return vals[1] })",
      })
      add({
        representations: [{ template: "value of [variable name]" }],
        arguments: [{ name: "variable name" }],
        javascript_meaning: "vm.continuation(env.lookup('variable name'), function(vals) { return vm.envs[1].lookup(vals[0]) })",
      })
      add({
        representations: [{ template: "Show a popup displaying [value]." }],
        arguments: [{ name: "value" }],
        javascript_meaning: "vm.continuation(env.lookup('value'), function(vals) { alert(myToString(vals[0])) })",
      })
      
      // CURSORS
      add({
        representations: [{ template: "input cursor" }],
        arguments: [],
        javascript_meaning: "return Globals.happyInput",
      })
      add({
        representations: [{ template: "output cursor" }],
        arguments: [],
        javascript_meaning: "return Globals.happyOutput",
      })
      add({
        representations: [{ template: "input length" }],
        arguments: [],
        javascript_meaning: "return Globals.happyInput.text.length",
      })
      add({
        representations: [{ template: "output length" }],
        arguments: [],
        javascript_meaning: "return Globals.happyInput.text.length",
      })
      add({
        representations: [{ template: "character at [cursor]" }],
        arguments: [{ name: "cursor" }],
        javascript_meaning: "vm.continuation(env.lookup('cursor'), function(vals) { return vals[0].characterAtCursor() })",
      })
      add({
        representations: [{ template: "position of [cursor]" }],
        arguments: [{ name: "cursor" }],
        javascript_meaning: "vm.continuation(env.lookup('cursor'), function(vals) { return vals[0].cursorPosition })",
      })
      add({
        representations: [{ template: "insert [text] at [cursor]" }],
        arguments: [{ name: "cursor" }, { name: "text" }],
        javascript_meaning: "vm.continuation(env.lookup('cursor'), env.lookup('text'), function(vals) { vals[0].insertText(vals[1]) })",
      })
      add({
        representations: [{ template: "set position of [cursor] to [position]" }],
        arguments: [{ name: "cursor" }, { name: "position" }],
        javascript_meaning: "vm.continuation(env.lookup('cursor'), env.lookup('position'), function(vals) { vals[0].setCursorPosition(vals[1]) })",
      })
      
      // USER CODE
      add({
        representations: [{ template: "My Code" }],
        arguments: [],
        native_meaning: [],
      })
      
      // var addPattern = new Pattern({
      //   representations: [{ template: "[left number] + [right number]" }],
      //   arguments: [{ name: "left number" }, { name: "right number" }],
      //   javascript_meaning: "vm.continuation(env.lookup('left number'), env.lookup('right number'), function(vals) { return vals[0] + vals[1] })",
      // })
      // var invocation = new Invocation({
      //   pattern: addPattern,
      //   arguments: { "left number" : { number: 4 }, "right number" : { number: 2 } }
      // })
      // $("body").append(new View.InvocationView(invocation).dom)
      
      // var invocation2 = new Invocation({
      //   pattern: addPattern,
      //   arguments: { "left number" : { number: 4 }, "right number" : { number: 2 } }
      // })
      // $("body").append(new View.InvocationView(invocation2).dom)
      // for(var i = 0; i < 10; i++) {
      //   $("body").append(new View.BasicMeaningView(new NumberMeaning({ number: i })).dom)
      // }
      
      $("body").append("<div id='debugger'></div>")
      
  //   }
  // })
})

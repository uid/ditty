
var Submission = Backbone.DeepModel.extend({
  defaults: {
    solutions: {}
  },
})

View.TaskHarness = my.Class({
  constructor: function(hud, tasks) {
    this.tasks = tasks
    this.submission = new Submission()
    
    this.dom = $("<div class='task'></div>")
    View.setObjFor(this.dom, this)
    
    this.exampleInput = new View.HappyTextbox({ showCursor: false })
    this.exampleOutput = new View.HappyTextbox({ showCursor: false })
    this.input = new View.HappyTextbox({ showCursor: false, editable: true })
    this.output = new View.HappyTextbox({ showCursor: false })
    hud.find(".example-text .input .input-placeholder").replaceWith(this.exampleInput.dom)
    hud.find(".example-text .output .output-placeholder").replaceWith(this.exampleOutput.dom)
    hud.find(".text .input .input-placeholder").replaceWith(this.input.dom)
    hud.find(".text .output .output-placeholder").replaceWith(this.output.dom)
    
    this.descriptionDom = hud.find(".title .description .description")
    this.taskList = hud.find(".title .description select")
    
    this.taskList.change(function() {
      this.taskIndex = this.taskList.val()
      this.render()
    }.bind(this))
    
    hud.find(".text .input button").click(function() {
      var task = this.tasks.at(this.taskIndex)
      this.input.setText(task.get("example_before"))
    }.bind(this))
    
    hud.find(".text .output button").click(function() {
      this.output.setText("")
    }.bind(this))
    
    this.solutionSlot = new View.SlotView({
      fillerHtml: "Drag your solution<br />to this task here",
      drop: this.solutionDropped.bind(this),
      dragout: this.solutionRemoved.bind(this)
    })
    hud.find(".solution").append(this.solutionSlot.dom)
    
    var newSolutionButton = $("<button>Create New Solution Bubble +</button>").click(function() {
      var adjectives = ["awesome", "best", "perfect", "awe-inspiring", "breathtaking", "magnificient", "wonderful", "amazing", "stunning", "impressive", "jaw-dropping", "mind-blowing", "excellent", "marvelous", "wondrous", "greatest", "finest", "supreme", "unrivaled", "unbeatable", "ultimate", "flawless", "quintessential", "exemplary", "superb", "immaculate"]
      var taskName = this.tasks.at(this.taskIndex).get("title")
      var solutionName = "my " + randomPick(adjectives) + " solution to \"" + taskName + "\""
      
      // put the placeholder in place
      var view = new View.PromisedInvocation({ name: solutionName })
      Globals.canvas.dropped(view)
      scrollIntoView(view.dom)
      
      // start creating the pattern
      var pattern = Patterns.create({ representations: [{ template: solutionName }], native_meaning: [] }, {
        wait: true,
        success: function() {
          var invocation = new Invocation({ pattern: pattern.id })
          var realView = new View.InvocationView(invocation)
          view.loadSuccess(realView)
          realView.toggleSource()
        },
        error: view.loadError.bind(view)
      })
    }.bind(this)).appendTo(hud.find(".solution"))
    
    this.taskIndex = 0
    this.render()
  },
  
  setupTaskList: function() {
    if(this.tasks.length == 0) return
    
    var section
    var sectionDom
    this.taskList.empty()
    this.tasks.each(function(task, index) {
      if(!section || task.get("section").get("name") != section.get("name")) {
        section = task.get("section")
        sectionDom = $("<optgroup></optgroup>").attr("label", section.get("name")).appendTo(this.taskList)
      }
      var title = "Task " + (index + 1) + " of " + this.tasks.length + ": " + task.get("title")
      sectionDom.append($("<option></option>").attr("value", index).attr("selected", index == this.taskIndex).text(title)) // XXX: cid
    }.bind(this))
  },
  
  render: function() {
    this.setupTaskList()
    
    var task = this.tasks.at(this.taskIndex)
    
    this.solutionSlot.eject()
    if(this.submission.has("solutions." + task.cid)) {
      var solution = this.submission.get("solutions." + task.cid)
      var view = View.viewForMeaning(solution)
      this.solutionSlot.dropped(view)
    }
    
    this.descriptionDom.empty()
    
    this.descriptionDom.append($("<div />").html(task.get("description")))
    
    this.exampleInput.setText(task.get("example_before"))
    this.exampleOutput.setText(task.get("example_after"))
    this.input.setText(task.get("example_before"))
    this.output.setText("")
  },
  
  solutionDropped: function(view) {
    this.submission.set("solutions." + this.tasks.at(this.taskIndex).cid, view.model) // XXX: cid
  },
  
  solutionRemoved: function(view, target) {
    this.submission.unset("solutions." + this.tasks.at(this.taskIndex).cid) // XXX: cid
  },
})

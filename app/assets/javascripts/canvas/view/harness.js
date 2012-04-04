
View.TaskHarness = my.Class({
  constructor: function(hud, tasks) {
    this.tasks = tasks
    
    this.dom = $("<div class='task'></div>")
    View.setObjFor(this.dom, this)
    
    this.exampleInput = new View.HappyTextbox({ showCursor: false })
    this.exampleOutput = new View.HappyTextbox({ showCursor: false })
    this.input = new View.HappyTextbox({ showCursor: false })
    this.output = new View.HappyTextbox({ showCursor: false })
    hud.find(".example-text .input .input-placeholder").replaceWith(this.exampleInput.dom)
    hud.find(".example-text .output .output-placeholder").replaceWith(this.exampleOutput.dom)
    hud.find(".text .input .input-placeholder").replaceWith(this.input.dom)
    hud.find(".text .output .output-placeholder").replaceWith(this.output.dom)
    
    this.solutionSlot = new View.SlotView({ fillerHtml: "<div>Drag your solution</div><div>to this task here</div>" })
    
    this.prevButtonDom = hud.find(".title .prev button")
    this.nextButtonDom = hud.find(".title .next button")
    this.descriptionDom = hud.find(".title .description .description")
    this.taskList = hud.find(".title .description select")
    hud.find(".text .input button").click(function() {
      this.input.setText(this.task.get("example_before"))
    }.bind(this))
    
    hud.find(".title .next").prepend(this.solutionSlot.dom)
    
    this.setupTaskList()
    this.setTask(tasks.at(0))
  },
  
  setupTaskList: function() {
    if(this.tasks.length == 0) return
    
    var section
    var sectionDom
    this.tasks.each(function(task) {
      if(!section || task.get("section").name != section.name) { // XXX: cid
        section = task.get("section")
        sectionDom = $("<optgroup></optgroup>").attr("label", section.get("name")).appendTo(this.taskList)
      }
      sectionDom.append($("<option></option>").attr("value", task.cid).text(task.get("title"))) // XXX: cid
    }.bind(this))
  },
  
  setTask: function(task) {
    this.task = task
    
    this.descriptionDom.empty()
    
    this.descriptionDom.append($("<div />").html(task.get("description")))
    
    this.exampleInput.setText(task.get("example_before"))
    this.exampleOutput.setText(task.get("example_after"))
    this.input.setText(task.get("example_before"))
  },
})

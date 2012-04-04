
View.TaskHarness = my.Class({
  constructor: function(hud) {
    this.dom = $("<div class='task'></div>")
    View.setObjFor(this.dom, this)
    
    this.input = new View.HappyTextbox({ showCursor: false, text: "Use the Force, Luke." })
    this.output = new View.HappyTextbox({ showCursor: false })
    this.solutionSlot = new View.SlotView({ fillerHtml: "<div>Drag your solution</div><div>to this task here</div>" })
    
    this.prevButtonDom = hud.find(".title .prev button")
    this.nextButtonDom = hud.find(".title .next button")
    this.currentExampleDom = hud.find(".title .description .current")
    this.totalExamplesDom = hud.find(".title .description .total")
    this.descriptionDom = hud.find(".title .description .description")
    
    hud.find(".title .next").prepend(this.solutionSlot.dom)
    
    this.descriptionDom.html("<div>Copy the input text without the commas.</div><div>Example: <q><tt>Use the Force, Luke.</tt></q> becomes <q><tt>Use the Force Luke.</tt></q></div>")
    
    hud.find(".text .input .input-placeholder").replaceWith(this.input.dom)
    hud.find(".text .output .output-placeholder").replaceWith(this.output.dom)
  },
})

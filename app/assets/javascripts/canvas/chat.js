var Chat = {}

Chat.ChatView = my.Class({
  constructor: function(dom) {
    this.dom = dom
    this.toggleButton = $("<button>Chat</button>").appendTo(this.dom)
    this.bottomDom = $("<div></div>").appendTo(this.dom)
    this.historyDom = $("<div id='chat-history'></div>").appendTo(this.bottomDom)
    this.entryDom = $("<div id='chat-entry'></div>").appendTo(this.bottomDom)
    
    // toggle
    this.toggleButton.click(this.toggleVisibility.bind(this))
    
    // start hidden
    $(this.toggleVisibility.bind(this))
    
    // entry
    this.slotView = new SlotView(this, "Drag or type something here to chat")
    this.sendButton = $("<button>Send</button>")
    this.sendButton.click(this.sendClicked.bind(this))
    this.entryDom.append(this.slotView.dom)
    this.entryDom.append(this.sendButton)
    
    // fetch backlog
    this.loading = true
    this.historyDom.text("Loading chat history...")
    this.fetchBacklog()
    
    // subscribe
    var pusher = new Pusher('7539baa0432dfe0bed06')
    var chatChannel = pusher.subscribe("chat")
    chatChannel.bind("event", this.received.bind(this))
  },
  
  toggleVisibility: function() {
    this.bottomDom.animate(
      { height: 'toggle' },
      { duration: 300 }
    )
    this.scrollToBottom()
  },
  
  scrollToBottom: function() {
    this.historyDom.scrollTop(10000)
  },
  
  fetchBacklog: function() {
    $.ajax({
      url: "/chat",
      dataType: "json",
      success: function(data) {
        var events = data["events"]
        events.reverse()
        this.batching = true
        for(var i in events) {
          this.addEvent(events[i])
        }
        delete this.batching
      }.bind(this),
      error: function() {
        // this.historyDom.text("Couldn't get chat history!")
      }.bind(this)
    })
  },
  
  send: function(json) {
    $.ajax({
      type: "POST",
      url: "/chat",
      data: { "chat[message]" : json },
      success: function(data) {
        this.slotView.release(this.slotView.child())
      }.bind(this),
      error: function(data) {
        // put it back in the box?
        alert("couldn't send message")
      },
      dataType: "json"
    })
  },
  
  received: function(ev) {
    this.addEvent(ev.event)
  },
  
  sendClicked: function() {
    var json = jsonSerialize(this.slotView.child().meaning(true /* hackhack */))
    json["expanded"] = this.slotView.child().isExpanded()
    this.send(JSON.stringify(json))
    // this.slotView.release(this.slotView.child())
  },
  
  setupHistoryDom: function() {
    this.historyDom.html("")
    delete this.loading
  },
  
  addEvent: function(ev) {
    if(this.loading) {
      this.setupHistoryDom()
    }
    var dom = $("<div class='chat-event'></div>")
    this.historyDom.append(dom)
    if(ev.type == "pattern_created") this.newPatternDom(ev, dom)
    else if(ev.type == "pattern_updated") this.updatedPatternDom(ev, dom)
    else if(ev.type == "chat") this.chatDom(ev, dom)
    
    this.scrollToBottom()
  },
  
  newPatternDom: function(ev, dom) {
    dom.append($("<span class='chat-user'></span>").text(ev.user.readable_name))
    dom.append(" created ")
    try {
      var pattern = jsonUnserialize(ev.pattern)
      if(!this.batching) {
        patterns[pattern.id] = pattern
      }
      var pv = new PatternView(pattern)
      dom.append(pv.dom)
    } catch(e) {
      dom.append("[error]")
    }
  },
  
  updatedPatternDom: function(ev, dom) {
    dom.append($("<span class='chat-user'></span>").text(ev.user.readable_name))
    dom.append(" changed ")
    try {
      var pattern = jsonUnserialize(ev.pattern)
      if(!this.batching) {
        patterns[pattern.id] = pattern
      }
      var pv = new PatternView(pattern)
      dom.append(pv.dom)
    } catch(e) {
      dom.append("[error]")
    }
  },
  
  chatDom: function(ev, dom) {
    dom.append($("<span class='chat-user'></span>").text(ev.user.readable_name))
    dom.append(" said ")
    try {
      var view = createView(jsonUnserializeMeaning(ev.chat.invocation))
      dom.append(view.dom)
      if(ev.chat.invocation.expanded) view.toggleSourceView(true /* instant */)
    } catch(e) {
      dom.append("[error]")
    }
  },
})

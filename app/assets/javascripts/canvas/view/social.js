function setSocial(value) {
  Globals.social = value
  if(value) {
    $("#activity-tab-button").show()
  } else {
    $("#activity-tab-button").hide()
  }
}

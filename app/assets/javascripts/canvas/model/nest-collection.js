
// forked from https://gist.github.com/1610397
// creates a collection which forwards all changes back to the given attribute
// if the attribute's array has insertions or deletions, those changes won't be reflected in the collection,
//   though changes to existing items will
Backbone.Model.prototype.nestCollection = function(attributeName, nestedCollection) {
  var arr = this.get(attributeName)
  for(var i = 0; i < nestedCollection.length; i++) {
    arr[i] = nestedCollection.at(i).attributes
  }
  nestedCollection.bind("reset", function() {
    var arr = this.get(attributeName)
    for(var i = 0; i < nestedCollection.length; i++) {
      arr[i] = nestedCollection.at(i).attributes
    }
  }.bind(this))
  nestedCollection.bind("add", function(initiative) {
    // if(!this.get(attributeName)) {
    //   this.attributes[attributeName] = []
    // }
    this.get(attributeName).push(initiative.attributes)
  }.bind(this))
  nestedCollection.bind("remove", function(initiative) {
    // var updateObj = {}
    // updateObj[attributeName] = _.without(this.get(attributeName), initiative.attributes)
    // this.set(updateObj)
    if(attributeName.indexOf(".") == -1) {
      this.attributes[attributeName] = _.without(this.get(attributeName), initiative.attributes)
    } else if(this.silentSet) {
      this.silentSet(attributeName, _.without(this.get(attributeName), initiative.attributes))
    } else {
      throw new Error("looks like you're gonna have to write this code")
    }
  }.bind(this))
  return nestedCollection
}


// forked from https://gist.github.com/1610397
// creates a collection which forwards all changes back to the given attribute
// if the attribute's array has insertions or deletions, those changes won't be reflected in the collection,
//   though changes to existing items will
Backbone.Model.prototype.nestCollection = function(attributeName, nestedCollection) {
  // for(var i = 0; i < nestedCollection.length; i++) {
  //   this.attributes[attributeName][i] = nestedCollection.at(i).attributes
  // }
  var arr = this.get(attributeName)
  for(var i = 0; i < nestedCollection.length; i++) {
    arr[i] = nestedCollection.at(i).attributes
  }
  nestedCollection.bind("add", function(initiative) {
    // if(!this.get(attributeName)) {
    //   this.attributes[attributeName] = []
    // }
    this.get(attributeName).push(initiative.attributes)
  }.bind(this))
  nestedCollection.bind("remove", function(initiative) {
    this.set({ attributeName: _.without(this.get(attributeName), initiative.attributes) })
  }.bind(this))
  return nestedCollection
}

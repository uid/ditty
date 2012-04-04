
// For all of the tasks below, you will be given a description of a type of text
// transformation and asked to create a command that performs it! You will be presented
// with several example input and output sets to test with.

var TaskSections = new Backbone.Collection
TaskSections.add({ name: "Easy" })
TaskSections.add({ name: "Medium" })
TaskSections.add({ name: "Hard" })

var Tasks = new Backbone.Collection
Tasks.add({
  title: "Remove all commas",
  description: "Remove all commas.",
  example_before: "\"Use the Force, Luke,\" said Obi-Wan.",
  example_after: "\"Use the Force Luke\" said Obi-Wan.",
  section: TaskSections.at(0),
})

/*
do as many of these as you can in an hour
visible tiers of difficulty
notes fields
(a) output all of the lines of text containing a certain word or phrase
(b) replace all instances of a given string with another string
(c) count the number of lines and words in a file
(d) count the number of times each word appears in the file
(e) trim all whitespace from the beginning and end of each line and, reduce multiple consecutive whitespace characters elsewhere to just one
(f) check that a file contains correctly nested parentheses
(g) output the sum of all numbers found on each line of text
(h) print a particular field of a CSV (comma-separated values) file
(i) remove C and C++ style comments from a file (single line and block)
(j) pretty-print a simple JSON file
(k) convert JSON to XML according to some simple rules
*/

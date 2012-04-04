
// For all of the tasks below, you will be given a description of a type of text
// transformation and asked to create a command that performs it! You will be presented
// with several example input and output sets to test with.

var Tasks = new Backbone.Collection
Tasks.add({
  description: "Duplicate the input text.",
  examples: [
    { input: "Welcome to Ditty.", output: "Welcome to Ditty." },
    { input: "4,692,222", output: "4692222" },
    { input: ",", output: "" },
    { input: "", output: "" },
  ]
})
Tasks.add({
  description: "Remove all commas.",
  examples: [
    { input: "Use the Force, Luke.", output: "Use the Force Luke." },
    { input: "4,692,222", output: "4692222" },
    { input: ",", output: "" },
    { input: "", output: "" },
  ]
})
Tasks.add({
  description: "Output all of the lines of text containing a certain word or phrase."
})

/*
do as many of these as you can in an hour
visible tiers of difficulty
notes fields
current input position
no I/O
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


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
Tasks.add({
  title: "grep",
  description: "Output all lines containing \"pumpkin\", including the line break if there is one.",
  example_before: "turn into a pumpkin at midnight\nescort your plump kin home\npumpkin harvest time is the best time\n",
  example_after: "turn into a pumpkin at midnight\npumpkin harvest time is the best time\n",
  section: TaskSections.at(0),
})
Tasks.add({
  title: "wc (lines)",
  description: "Output the number of lines in the input.",
  example_before: "Mountain Dew Code Red\nYou tantalize my taste buds\nYou are my Mana\n",
  example_after: "3",
  section: TaskSections.at(0),
})
Tasks.add({
  title: "wc (words)",
  description: "Output the number of words in the input.",
  example_before: "Mountain Dew Code Red\nYou tantalize my taste buds\nYou are my Mana\n",
  example_after: "13",
  section: TaskSections.at(0),
})
Tasks.add({
  title: "trim",
  description: "Trim space characters from the beginning and end of each line.",
  example_before: "   some programmers   \n     never sleep      ",
  example_after: "some programmers\nnever sleep",
  section: TaskSections.at(1),
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

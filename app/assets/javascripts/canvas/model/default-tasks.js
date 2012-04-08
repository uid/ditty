
// For all of the tasks below, you will be given a description of a type of text
// transformation and asked to create a command that performs it! You will be presented
// with several example input and output sets to test with.

var TaskSections = new Backbone.Collection
TaskSections.add({ name: "Easy" })
TaskSections.add({ name: "Medium" })
TaskSections.add({ name: "Hard" })

var Tasks = new Backbone.Collection
Tasks.add({
  title: "commas",
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
  section: TaskSections.at(1),
})
Tasks.add({
  title: "parentheses",
  description: "Output 'true' if the input has correctly-nested parentheses. If it doesn't, output 'false'.",
  example_before: "is every parens (y'know (these things))\n(matched (with) (another (one?))",
  example_after: "3",
  section: TaskSections.at(1),
})
Tasks.add({
  title: "trim",
  description: "Trim space characters from the beginning and end of each line.",
  example_before: "   some programmers   \n     never sleep      ",
  example_after: "some programmers\nnever sleep",
  section: TaskSections.at(1),
})
Tasks.add({
  title: "csv",
  description: "Print the second value in the CSV-formatted input for each line.",
  example_before: "a,b,c\ndo,re,mi\n,all alone,",
  example_after: "b\nre\nall alone",
  section: TaskSections.at(1),
})
Tasks.add({
  title: "sum",
  description: "Sum the numbers found on each line.",
  example_before: "1 + 1 = ?\nI ate 3 apples.\nMy 7 kids have 2 friends!\n",
  example_after: "2\n3\n9\n",
  section: TaskSections.at(2),
})
Tasks.add({
  title: "c comments",
  description: "Remove all C-style comments from the input.",
  example_before: "int main(int argc) { // my program\n  printf(\"%d\\n\", argc); // num args\n}\n",
  example_after: "int main(int argc) { \n  printf(\"%d\\n\", argc); \n}\n",
  section: TaskSections.at(2),
})
Tasks.add({
  title: "c++ comments",
  description: "Remove all C++-style comments from the input.",
  example_before: "I sometimes use /* this style\nof comment in */ everyday\nconversation.",
  example_after: "I sometimes use  everyday\nconversation.",
  section: TaskSections.at(2),
})
Tasks.add({
  title: "pretty print",
  description: "Print the given JSON object with proper indentation.",
  example_before: "{a:1,b:2}",
  example_after: "{\n  a: 1\n  b: 2\n}",
  section: TaskSections.at(2),
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

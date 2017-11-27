Graphing Scrubbing Calculator
=============================

[![Live demo](https://img.shields.io/badge/Live%20demo-%E2%86%92-9D6EB3.svg?style=flat-square)](http://alexwarth.github.io/projects/scrub/index.html)

I got inspired by Bret Victor's [scrubbing calculator](http://worrydream.com/ScrubbingCalculator/), and decided to spend some time exploring what I call "text++" user interfaces, i.e., text-based user interfaces in which some of text you type automatically gets widget-like "superpowers".

I started out by implementing my own version of the scrubbing calculator, which I then extended with a fleeting mode for graphing. This gave me a pretty good understanding of what it takes to implement such a user interface -- not that I'd advise anyone to do it the way I did it here!

I then developed a framework that makes it easier for programmers to implement text++ user interfaces. This framework is based on my idea of editable views, which was a reaction against a common kind of interface in which the user gets two panes: one in which he can edit some source text, and another in which that text is rendered. (Several Markdown editors work this way.) I used this framework to implement an editor for arithmetic expressions in which all numbers are scrubbable, and fractions (which the user types using the "/" operator) are automatically rendered two-dimensionally. See [this repo](https://github.com/alexwarth/textPlusPlus) for more details.

-- Alex Warth, August 2013

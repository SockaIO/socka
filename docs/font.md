# Using Bitmap Font with Pixi.js

We chose to use Bitmap text as the way to display text information with Pixi.js. This document explains the different steps required.

## Prepare the Font file

Pixi uses Bitmap Font (XML AngelCode format). On the documentation they do not point to any generator on Linux. In order to generate the font
we have been using this website http://kvazars.com/littera/ with success.

Using your favorite tool you need to generate the font. Take care of the following elements:
- The font color should be plain white (the coloring is done by pixi)
- Make sure you include all the characters you want (particularly the numbers)
- Give it a proper name
- Export it to the XML (.fnt) format

## Use it with Pixi

To use the imported font simply Load the fnt file as a texture (the png file will be automatically loaded). And you can them use the font simply by referring to its name.

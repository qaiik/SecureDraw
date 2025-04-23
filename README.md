# SecureDraw
SecureDraw is a JavaScript library to enable drawing and recreation of images using logs to prevent manipulation of image canvases.

## Purpose
This library was created for developers who want to enable drawing in their application, but don't want the user to be able to send their own images or inject custom data.

## Installation
Add the following script tag to your html head:
```html
<script src="https://cdn.jsdelivr.net/gh/qaiik/SecureDraw@latest/dist/SecureDraw.min.js"></script>
```
Or for the lossless version:
```html
<script src="https://cdn.jsdelivr.net/gh/qaiik/SecureDraw@latest/dist/sd-lossless.min.js"></script>
```

Then, the library can be accessed as SecureDraw.<br/>  
You can also import SecureDraw as a module like so:
```js
//Importing SecureDraw as a module
import { Canvas, Display } from "https://cdn.jsdelivr.net/gh/qaiik/SecureDraw@latest/dist/SecureDraw.module.min.js";

//or for lossless
import { Canvas, Display } from "https://cdn.jsdelivr.net/gh/qaiik/SecureDraw@latest/dist/sd-lossless.module.min.js";
```

## Lossless vs Regular
When loading an image drawn from a regular SecureDraw canvas, it is more or less the same as the original. But drawings with very small brush sizes ~1 can become quite choppy.
<br/>SecureDraw lossless mode aims to fix this by encoding  xy positions as strings with a set amount of decimal points to preserve accuracy, but with a significant filesize increase.

It's up to you to decide.

Lossless example: [https://msst.glitch.me](https://msst.glitch.me)  
Lossy example: [https://secure-test.glitch.me](https://msst.glitch.me)<br/><br/>To set up a drawing canvas, use the `Canvas` class:
```js
const drawCanvas = new SecureDraw.Canvas(
  canvas, //HTML Canvas element to draw on
  5,      //Initial brush width
  "black" //Initial brush color
);

//Or for lossless
const drawCanvas = new SecureDraw.Canvas(
  canvas,       //HTML Canvas element to draw on
  5,            //Initial brush width
  "black",       //Initial brush color
  {
    accuracy: 1 //sets the amount of decimal places used in xy positions.
  }
);

//Clearing the canvas
drawCanvas.clear(); //not required initially, clears canvas

//Brush colors: Any CSS color will work
drawCanvas.setColor("aquamarine");
drawCanvas.setColor("#ac33ff");

//Setting the brush size
drawCanvas.setBrushSize(5); //sets the size of the brush


//Exporting the image -- out and export are aliases for exportAs but default to base64.
drawCanvas.exportAs('base64'); //Returns the Base64 encoded binary of the image log - smaller than text but bigger than binary.
drawCanvas.exportAs('text');   //Returns the human-readable log format of the image, inefficient for transmission
drawCanvas.exportAs('binary'); //Returns a regular array of bytes.


```

## Displaying images
Because of the way SecureDraw encodes images, you must use the `Display` class to show them on a page. Displays are not meant to be cleared or updated.

```js
const ImageDisplay = new SecureDraw.Display(
    canvas, //the canvas to display the image to
    {       //Validation settings
      allowExactColor: true, //If enabled, images that use exact hex colors are allowed. Otherwise, only css named colors can be used.
      minSize: 1,            //The minimum brush size an image can have to prevent people from trying to create accurate images programatically,
      minAverageSCD: 3,      //Minimum average set color distance - computationally expensive - see validation section.
    }
);

//Loading images -- if validation fails, no image will be drawn to the canvas and it will remain blank by default
ImageDisplay.loadBase64('...');       // returns boolean of whether validation was passed
ImageDisplay.loadBinary(binaryArray); // returns boolean of whether validation was passed

//Loading from text format is discouraged as data is very large but can be done manually
ImageDisplay.object.loadFromLog('--log text--'); //will always load - ignores validation rules.

//As stated before, displays are not meant to be cleared, but it can still be done manually like so:
ImageDisplay.object.wipe();
```

## Validation
* allowExactColor (true/false):
  *  sets whether exact hexadecimal or rgb colors can be used in an image. Setting it to false is useful in preventing realistic images.<br/>
* minSize (integer):
  * sets the minimum size of the brush. An image will fail validation if any circle stroke is below the minimum size.<br/><br/>
* minAverageSCD (integer):
  * sets the minimum distance between set color operations on average. For example, 50 circles may be drawn on average in between color switches. Always switching colors after 1 click is extremely unlikely for humans.

Overall, the above settings exist to combat users forging logs with small brush size and exact colors to create a realistic image.<br/>

Switching colors after every single click is highly suspicious, so `minAverageSCD` was made to combat this by limiting the average distance between color changes to be higher than a certain threshold. However, `minAverageSCD` is computationally expensive and could lead to false positives on some basic images depending on your settings.

# Mechanism
The core principal of SecureDraw is that it never directly sends images over the internet. Images are stored and sent in a log format, not as a PNG or JPEG. <br/>
The log format of SecureDraw only allows two basic operations - SETCOLOR and CIRCLE, which means no one can ever send raw pixel data or create complex images.  

  Even if the user manages to use drawImage or putImageData on the canvas, it won't matter as it is only shown client side and doesnt affect the log -  
  The log can only be modifed by direct user actions.  

  The log format can then be shortened into a binary representation and base64 encoded to be sent over the web.  Once the client recieves the log data, it can validate and reconstruct it locally using the `Display` class.  
  
Unfortunately, even if the log is recieved in binary or base64 format, it has to be unpacked and converted to text, which may make the program slow, especially for large images, but its not usually an issue.
<br/>Even though the log format is large, because it uses simple operations, it sometimes smaller than traditional image formats like PNG.

# Challenges
Overall, SecureDraw is mostly reliable, but faces some challenges:
* Speed:
  * Due to the requirement of processing on every image being displayed or drawn, SecureDraw may not scale well. I will work to optimize it in the future.
* Repition of operations is considered valid:
  * While unlikely, a user could technically choose to send several of the same operation in a row. This could be prevented serverside, as it may mess with minAverageSCD.
* Double encoding:
  * Secure draw always keeps both a binary and text log format for every single image class, which may present memory or computation issues.  
* Ocassional strange behavior:
    * While mostly patched, I've noted a few instances where a random image of 1 brush size scribbles has failed violation for seemingly no reason, but this isn't common.
 
<br/>-winter 4/22/25-21:40
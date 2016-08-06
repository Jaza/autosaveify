# Autosaveify

Automatic AJAX form submission with feedback and styling.

Simply drop in the Autosaveify JS and CSS files, and mark-up your forms per
the examples. Then, whenever the user changes the form input values, the form
will be submitted to the server, and a coloured icon (or status box) will
indicate when the save is pending, is in progress, has succeeded, or has failed.

## Live demo
**https://jaza.github.io/autosaveify/demo.html**

## Documentation
**https://jaza.github.io/autosaveify/**

Inspired by [X-editable](https://vitalets.github.io/x-editable/), but aims to
be simpler and lighter. Rather than providing custom popup or inline editing
widgets, Autosaveify leaves the form editing interface as-is, and just
concentrates on communicating the save status to the user.

The style of the JS is inspired by [Twitter Bootstrap](http://getbootstrap.com/).
Like the Bootstrap JS plugins, Autosaveify can be used purely via the HTML5
Data API, without having to write a single line of JavaScript; or it can be
used via a JS API. Also like Bootstrap's JS, Autosaveify depends on
[jQuery](http://jquery.com/) (however it also depends on
[Underscore.js](http://underscorejs.org/)), and it follows the Bootstrap
conventions for options, methods, and custom events.

Autosaveify is designed to be used on a Bootstrap-powered web page (currently
Bootstrap 3). The CSS and the example markup look good and work properly on
top of Bootstrap's standard CSS and markup. However, feel free to try it out
in a non-Bootstrap environment. You will need to write your own CSS to get it
looking and working as expected (please consider contributing your CSS back
if you do this).

Autosaveify includes some CSS and some examples that use third-party form
widgets, including
[Bootstrap Datetimepicker](https://eonasdan.github.io/bootstrap-datetimepicker/),
[Select2](https://select2.github.io/), and
[Dante Editor](https://michelson.github.io/Dante/). These widgets and their
respective JS and CSS files are not required by Autosaveify, they're just
the widgets that have been tested together with it. Feel free to experiment
using other custom widgets with Autosaveify.

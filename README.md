# News Aggregator
Udacity [Browser Rendering Optimization](https://www.udacity.com/course/browser-rendering-optimization--ud860) Course Work

**Please note: this code is intended for you to hone your debugging skills. It contains a lot of code that you should not use in production!**

This is a simple web app that shows the top stories from [Hacker News](https://news.ycombinator.com/news) via [its API](http://blog.ycombinator.com/hacker-news-api).

Unfortunately it has a bunch of performance issues, such as:

* Layout Thrashing
* Expensive painting
* Unnecessary layouts
* Long-running and badly-timed JavaScript
* Bad touch handling

Your mission is to find and fix the issues, and make the app gloriously performant!

## License

See /LICENSE for more.

This is not a Google product.

## Getting started

URLs of the optimized version of the portfolio
* Repository: https://github.com/icsantos/news-aggregator

URLs of the original version of the portfolio
* Repository: http://github.com/udacity/news-aggregator
* Live site: http://udacity.github.io/news-aggregator/

## Steps taken

* Used `requestAnimationFrame` to load batches of stories.

* Created and reused one `section` element for displaying story details, instead of creating one `section` element per story detail that the user clicked on.

* Used `document.querySelector('.story#s-' + key)` to find a specific story, instead of looping through the output of `document.querySelectorAll('.story')`.

* Used CSS classes `visible` and `hidden` to control the page containing story details sliding in and out of view.

* Removed function that was restyling the color and size of the story title and score.



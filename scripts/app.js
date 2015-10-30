/**
 *
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
APP.Main = (function () {

  var LAZY_LOAD_THRESHOLD = 300;
  var $ = document.querySelector.bind(document);

  var stories = null;
  var storyStart = 0;
  var count = 100;
  var main = $('main');
  var inDetails = false;
  var storyLoadCount = 0;
  var localeData = {
    data : {
      intl : {
        locales : 'en-US'
      }
    }
  };

  var tmplStory = $('#tmpl-story').textContent;
  var tmplStoryDetails = $('#tmpl-story-details').textContent;
  var tmplStoryDetailsComment = $('#tmpl-story-details-comment').textContent;

  if (typeof HandlebarsIntl !== 'undefined') {
    HandlebarsIntl.registerWith(Handlebars);
  } else {

    // Remove references to formatRelative, because Intl isn't supported.
    var intlRelative = /, {{ formatRelative time }}/;
    tmplStory = tmplStory.replace(intlRelative, '');
    tmplStoryDetails = tmplStoryDetails.replace(intlRelative, '');
    tmplStoryDetailsComment = tmplStoryDetailsComment.replace(intlRelative, '');
  }

  var storyTemplate =
    Handlebars.compile(tmplStory);
  var storyDetailsTemplate =
    Handlebars.compile(tmplStoryDetails);
  var storyDetailsCommentTemplate =
    Handlebars.compile(tmplStoryDetailsComment);

  // create where we're going to display the story
  // we're showing only one story detail at a time so we'll just reuse this each time
  var storyDetails = document.createElement('section');
  storyDetails.classList.add('story-details');
  document.body.appendChild(storyDetails);

  // As every single story arrives it pushes its content in
  function onStoryData(key, details) {

    details.time *= 1000;
    var story = document.querySelector('.story#s-' + key);
    var html = storyTemplate(details);
    story.innerHTML = html;
    story.addEventListener('click', onStoryClick.bind(this, details));
    story.classList.add('clickable');

    // Tick down. When zero we can batch in the next load.
    storyLoadCount--;
  }

  function onStoryClick(details) {

    if (details.url) {
      details.urlobj = new URL(details.url);
    }

    // Create and append the story
    var storyDetailsHtml = storyDetailsTemplate(details);
    var kids = details.kids;
    var commentHtml = storyDetailsCommentTemplate({
        by : '',
        text : 'Loading comment...'
      });

    storyDetails.innerHTML = storyDetailsHtml;

    var commentsElement = storyDetails.querySelector('.js-comments');
    var storyHeader = storyDetails.querySelector('.js-header');
    var storyContent = storyDetails.querySelector('.js-content');
    var closeButton = storyDetails.querySelector('.js-close');
    var headerHeight = storyHeader.getBoundingClientRect().height;

    closeButton.addEventListener('click', hideStory.bind(this, details.id));
    storyContent.style.paddingTop = headerHeight + 'px';

    // show the story details
    showStory();

    if (typeof kids === 'undefined') {
      return;
    }
    
    var comment, k;
    function onStoryComment(commentDetails) {
      commentDetails.time *= 1000;

      comment = commentsElement.querySelector(
          '#sdc-' + commentDetails.id);
      comment.innerHTML = storyDetailsCommentTemplate(
          commentDetails,
          localeData);
    }

    for (k = 0; k < kids.length; k++) {

      comment = document.createElement('aside');
      comment.setAttribute('id', 'sdc-' + kids[k]);
      comment.classList.add('story-details__comment');
      comment.innerHTML = commentHtml;
      commentsElement.appendChild(comment);

      // Update the comment with the live data.
      APP.Data.getStoryComment(kids[k], onStoryComment.bind(this));
    }
  }

  function showStory() {
    if (inDetails) {
      return;
    }
    inDetails = true;

    // Find out where it currently is.
    var left = storyDetails.getBoundingClientRect().left;

    function animate() {
      // Figure out where it needs to go.
      left -= left * 0.1;

      // Set up the next bit of the animation if there is more to do.
      if (Math.abs(left) > 0.5) {
        requestAnimationFrame(animate);
      } else {
        left = 0;
      }
      storyDetails.style.left = left + 'px';
    }

    storyDetails.style.opacity = 1;
    document.body.classList.add('details-active');
    requestAnimationFrame(animate);
  }

  function hideStory() {
    if (!inDetails) {
      return;
    }
    inDetails = false;

    // Find out where it currently is.
    var target = main.getBoundingClientRect().width + 100;
    var left = storyDetails.getBoundingClientRect().left;

    function animate() {
      // Figure out where it needs to go.
      left += (target - left) * 0.1;

      // Set up the next bit of the animation if there is more to do.
      if (Math.abs(left - target) > 0.5) {
        requestAnimationFrame(animate);
      } else {
        left = target;
      }

      storyDetails.style.left = left + 'px';
    }

    storyDetails.style.opacity = 0;
    document.body.classList.remove('details-active');
    requestAnimationFrame(animate);
  }

  main.addEventListener('touchstart', function (evt) {

    // I just wanted to test what happens if touchstart
    // gets canceled. Hope it doesn't block scrolling on mobiles...
    if (Math.random() > 0.97) {
      evt.preventDefault();
    }

  });

  main.addEventListener('scroll', function () {

    var header = $('header');
    var headerTitles = header.querySelector('.header__title-wrapper');
    var scrollTopCapped = Math.min(70, main.scrollTop);
    var scaleString = 'scale(' + (1 - (scrollTopCapped / 300)) + ')';

    header.style.height = (156 - scrollTopCapped) + 'px';
    headerTitles.style.webkitTransform = scaleString;
    headerTitles.style.transform = scaleString;

    // Check if we need to load the next batch of stories.
    var loadThreshold = (main.scrollHeight - main.offsetHeight - LAZY_LOAD_THRESHOLD);
    if (main.scrollTop > loadThreshold) {
      requestAnimationFrame(loadStoryBatch);
    }
  });

  function loadStoryBatch() {

    if (storyLoadCount > 0) {
      return;
    }

    storyLoadCount = count;

    var end = storyStart + count;
    for (var i = storyStart; i < end; i++) {

      if (i >= stories.length) {
        return;
      }

      var key = String(stories[i]);
      var story = document.createElement('div');
      story.setAttribute('id', 's-' + key);
      story.classList.add('story');
      story.innerHTML = storyTemplate({
          title : '...',
          score : '-',
          by : '...',
          time : 0
        });
      main.appendChild(story);

      APP.Data.getStoryById(stories[i], onStoryData.bind(this, key));
    }

    storyStart += count;

    requestAnimationFrame(loadStoryBatch);
  }

  // Bootstrap in the stories.
  APP.Data.getTopStories(function (data) {
    stories = data;
    requestAnimationFrame(loadStoryBatch);
    main.classList.remove('loading');
  });

})();

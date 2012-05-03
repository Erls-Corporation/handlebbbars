// JSLint settings:
/*global alert, clearTimeout, console, Handlebars, jQuery, setTimeout, Zepto*/

// JS Module Pattern:
// http://j.mp/module-pattern

// Redefine: $, window, document, undefined.
var APP = (function($, window, document, undefined) {
  // Fire things off, once the DOM is ready.
  $(document).ready(function() {
    APP.go();
  });

  // Empty vars. Some assigned after DOM is ready.
  var body, error, error_link, error_timer, list, loading, logo, markup, page_picker, template;

  // Private variables used as "constants".
  var cache = window.localStorage ? window.localStorage : {};
  var base = 'http://api.dribbble.com/shots/popular?per_page=30&page=';
  var search = window.location.search;
  var number = search ? search.split('?page=')[1] : 1;
  var one_hour = 3600000;
  var ten_seconds = 10000;

  // Internet Explorer detection.
  function IE(version) {
    var b = document.createElement('b');
    b.innerHTML = '<!--[if IE ' + version + ']><br><![endif]-->';
    return !!b.getElementsByTagName('br').length;
  }

  // Identify Internet Explorer 9.
  var IE9 = IE(9);

  // Expose contents of APP.
  return {
    // APP.go
    go: function() {
      var i, j = this.init;

      for (i in j) {
        // Run everything in APP.init
        j.hasOwnProperty(i) && j[i]();
      }
    },
    // APP.init
    init: {
      // APP.init.assign_dom_vars
      assign_dom_vars: function() {
        // Assigned when DOM is ready.
        body = $(document.body);
        logo = $('#logo')[0];
        page_picker = $('#page_picker');
        list = $('#list');
        loading = $('#loading');
        error = $('#error');
        error_link = error.find('a')[0];
        markup = $('#_template-list-item').html().replace(/\s\s+/g, '');
        template = Handlebars.compile(markup);
      },
      // APP.init.set_page_number
      set_page_number: function() {
        logo.href = error_link.href = './index.html?page=' + number;
        page_picker.val(number);
        APP.util.load_api_page(number);
      },
      // APP.init.page_picker
      page_picker: function() {
        page_picker.on('change', function() {
          logo.href = error_link.href = './index.html?page=' + this.value;
          APP.util.load_api_page(this.value);
        });
      },
      // APP.init.nav_shortcuts
      nav_shortcuts: function() {
        // Logic to determine prev/next
        // page, or go to beginning/end.
        function change_page(goto) {
          clearTimeout(error_timer);
          goto === 'prev' ? number-- : number++;
          number > 25 && (number = 1);
          number < 1 && (number = 25);
          APP.init.set_page_number();
        }

        // Watch for swipes.
        body.on('swipeLeft', function() {
          loading[0].style.display === 'none' && change_page('next');
          return false;
        }).on('swipeRight', function() {
          loading[0].style.display === 'none' && change_page('prev');
          return false;

        // Watch for "J" or "K" pressed.
        }).on('keydown', function(ev) {
          switch (ev.keyCode) {
            case 74:
              ev.preventDefault();
              loading[0].style.display === 'none' && change_page('prev');
              break;
            case 75:
              ev.preventDefault();
              loading[0].style.display === 'none' && change_page('next');
              break;
          }
        });
      }
    },
    // APP.util
    util: {
      // APP.util.load_api_page
      load_api_page: function(page) {
        var url_key = base + page;
        var time_key = 'time_' + page;
        var time_now = Date.now();

        list.html('');
        error.hide();
        loading.show();

        if (cache[url_key] && time_now - cache[time_key] < one_hour) {
          loading.hide();
          list.html(cache[url_key]);
        }
        else {
          $.ajax({
            url: url_key,
            type: 'get',
            async: false,
            cache: true,
            callback: 'process_json',
            contentType: 'application/json',
            dataType: 'jsonp',
            success: function(data) {
              /*
                If need be, sanitize Twitter usernames.
                Since we prefix all usernames with "@",
                we want to get just the username itself.

                Examples:
                - "http://twitter.com/#!/nathansmith"
                - "@nathansmith"

                Would be changed to:
                - "nathansmith"
              */

              data.shots.forEach(function(shot) {
                var twitter_url;
                var username = shot.player.twitter_screen_name;

                if (username) {
                  if (username.match(/\//)) {
                    twitter_url = username.split('/');
                    username = twitter_url[twitter_url.length - 1];
                  }

                  shot.player.twitter_screen_name = username.replace(/\@/g, '');
                }

                // Custom attribute, to identify if browser
                // is IE9. Used in the Handlebars template.
                shot.IE9 = IE9;
              });

              loading.hide();
              cache[time_key] = time_now;
              cache[url_key] = template(data);
              list.html(cache[url_key]);
            }
          });

          // Poor man's error callback, because
          // there's no error condition for JSONP.
          error_timer = setTimeout(function() {
            if (loading[0].style.display !== 'none') {
              loading.hide();
              error.show();
            }
          }, ten_seconds);
        }
      }
    }
  };
// Parameters: Zepto/jQuery, window, document.
})(typeof Zepto === 'function' ? Zepto : jQuery, this, this.document);
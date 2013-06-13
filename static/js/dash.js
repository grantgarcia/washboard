function plural(array) {
    return array.length == 1 ? '' : 's';
}

function kw_list(array) {
    if (!array || !array.length) {
        return "";
    }
    var clone = array.slice(0);
    return function build() {
        if (clone.length == 1) {
            return '<span class="keyword">' + clone[0] + '</span>';
        }
        if (clone.length == 2) {
            return '<span class="keyword">' + clone[0] + '</span> and <span class="keyword">' + clone[1] + '</span>';
        }
        return '<span class="keyword">' + clone.shift() + '</span>, <span class="keyword">' + build();
    }();
}

function best_fit(elements, target_width) {
    var best = 0;
    var best_width = 0;
    $.each(elements, function(i, item) {
        if ((item.width < target_width && item.width > best_width) ||
            // ^ Too small, but bigger than the next best option
            (item.width >= target_width &&
                (best_width < target_width || item.width < best_width))) {
            // ^ Big enough, but not excessive
            best = i;
            best_width = item.width;
        }
    });
    return elements[best];
}

function special_entities(html) {
    return html
        .replace('&#160;', ' ')
        .replace('&#8217;', "'")
        .replace('&#8220;', '"')
        .replace('&#8221;', '"')
        .replace('&amp;', '&')
        .replace('&lt;', '<')
        .replace('&gt;', '>');
}

function expand(id) {
    var this_post = $('#post_' + id);
    this_post.find('.photos').animate(
        {opacity: 0},
        600,
        function() {
            this_post.find('.photos').css('display', 'none');
            this_post.addClass('hr')
                .css('max-width', Math.max(540, hr_widths[id]))
                .find('.hr_photos')
                .css('display', 'block')
                .css('opacity', 0)
                .animate({opacity: 1}, 600)
                .find('img')
                .each(function(i, img) {
                    $(img).attr('src', $(img).attr('hr-src'));
                }
            );
            $('body').animate(
                {scrollTop: this_post.offset().top - 5},
                200
            );
        }
    );
}

function collapse(id) {
    var this_post = $('#post_' + id);
    this_post.find('.hr_photos').animate(
        {opacity: 0},
        600,
        function() {
            this_post.find('.hr_photos').css('display', 'none');
            this_post.removeClass('hr')
                .css('max-width', 'none')
                .find('.photos')
                .css('display', 'block')
                .css('opacity', 0)
                .animate({opacity: 1}, 600);
            $('body').animate(
                {scrollTop: this_post.offset().top - 5},
                200
            );
        }
    );
}

function toggle_album_art(id) {
    var this_post = $('#post_' + id);
    this_post.find('.album_art').toggleClass('expanded');
}

function chooseblog(id, blog) {
    $('#reblog_' + id).find('.chooseblog').text(blog);
}

// TODO: separation of presentation from logic (no more .css()!)
function notes(id) {
    var notes = $('#post_' + id).find('.notes');
    // Open notes
    if (notes.css('display') != 'block') {
        // Calculate the height now so it can be reused later
        if (notes.data('height')) {
            var height = notes.data('height');
        }
        else {
            notes.css({
                'display': 'block',
                'position': 'absolute',
                'visibility': 'hidden',
                'margin-right': '20px',
            });
            var height = notes.height();
            notes.data('height', height);
            notes.removeAttr('style');
        }
        notes.css({
            'height': 0,
            // Account for margin 'skip' at start of animation
            'margin-bottom': '-20px',
            'display': 'block',
        });
        notes.animate({
            'height': height,
            'margin-bottom': 0,
        });
    }
    // Close notes
    else {
        notes.animate({
            'height': 0,
            // Account for margin 'skip' at end of animation
            'margin-bottom': '-20px',
        }, {complete: function() {
            notes.css('display', 'none');
        }});
    }
}

function hide(id, hide_url) {
    $.ajax('/hide', {
        data: {
            post: hide_url,
            csrfmiddlewaretoken: csrf_token
        },
        dataType: 'json',
        type: 'POST'
    }).success(function(data) {
        if (data.meta.status != 200) {
            alert(data.meta.msg);
        }
    }).fail(function() {
        alert('The server was unable to hide the post permanently, sorry.');
    }).always(function() {
        $('#post_' + id).animate({opacity: 0}, 600, function() {
            setTimeout(function() {
                $('#post_' + id).css('display', 'none');
            }, 300);
        });
    });
}

function check_id(post) {
    // Check post's ID against currently loaded posts
    if (Washboard.well_ordered && post.id >= $(posts).last().prop('id')) {
        // If it wasn't posted before the last post, ignore it
        // and note that we're now one more post behind
        console.log(post.id + ' >= ' + $(posts).last().prop('id'));
        behind_by++;
        return true;
    }
    else if (!featured_tag && 'featured_timestamp' in post) {
        featured_tag = true;
    }
}

function is_blacklisted(post) {

    // Check if this post was specifically hidden
    for (var hp = 0; hp < Washboard.hidden_posts.length; hp++) {
        if ((post.reblogged_root_url || post.post_url) == Washboard.hidden_posts[hp].post) {
            return true;
        }
    }
    
    // Check blacklist / whitelist
    blacklist_keywords = [];
    whitelist_keywords = [];
    // 0 = show post; 1 = hide with notification; 2 = hide without notification
    blacklist_level = 0;
    whitelist = false;
    
    // Find elements to be scanned
    scan = [];
    $.each(scan_attributes, function(a, attribute) {
        if (post[attribute]) {
            scan.push(post[attribute]);
        }
    });
    // Add tags
    if (post.tags) {
        $.each(post.tags, function(t, tag) {
            scan.push('#' + tag);
        });
    }

    // Iterate over elements to be scanned
    $.each(scan, function(s, scan_element) {
        // Iterate over the user's rules
        $.each(Washboard.rules, function(r, rule) {
            var kw = rule.keyword;

            // Convert "whole words" to Regex patterns
            if (rule.whole_word) {
                kw = new RegExp(
                    // Match whitespace or start of line
                    '(?:^|\\W)'
                    // Escape metacharacters within the keyword
                    + kw.replace(/[-[\]{}()*+?.,\/\\^$|#\s]/g, "\\$&")
                    // Match whitespace or end of line
                    + '(?=\\W|$)', 'i'
                );
                rule.regex = true;
            }

            scanned = special_entities(scan_element);
            if ((rule.regex && scanned.search(kw) >= 0) ||
                (!rule.regex && scanned.toLowerCase().indexOf(kw.toLowerCase()) >= 0)) {
                
                // Blacklist
                if (rule.blacklist) {
                    // Hide with notification
                    if (rule.show_notification) {
                        blacklist_level = Math.max(blacklist_level, 1);
                    }
                    // Hide without notification
                    else {
                        blacklist_level = 2;
                    }
                    if (blacklist_keywords.indexOf(rule.keyword) == -1) {
                        blacklist_keywords.push(rule.keyword);
                    }
                }
                // Whitelist
                else {
                    whitelist = true;
                    if (whitelist_keywords.indexOf(rule.keyword) == -1) {
                        whitelist_keywords.push(rule.keyword);
                    }
                }
            }
        });
    });
    
    /* If both blacklisted and whitelisted keywords were matched: show the post
     * if none of the blacklisted keywords hid the notification. If at least
     * one blacklisted keyword hides the notification, don't show the post,
     * but do show the notification. */
    if (whitelist && blacklist_level) {
        blacklist_level--;
    }
    
    // Do not show the post or notification; return now
    if (blacklist_level == 2) {
        return true;
    }

    // Hide the post under a notification
    if (blacklist_level == 1) {
        
        notification = {touchscreen: touchscreen};

        // Construct notification text
        notification.text = 'This post contains the keyword' +
            plural(blacklist_keywords) + ' ' + kw_list(blacklist_keywords);
        if (whitelist_keywords.length) {
            notification.text += ', but also matched the whitelisted keyword'
                + plural(whitelist_keywords) + ' ' + kw_list(whitelist_keywords);
        }
        notification.text += '.';

        return notification;
    }
    
    // Not blacklisted
    return false;
}

function read_more(postelem) {
    postelem.find('p').contents().filter(function() {
        // Select comment nodes
        return this.nodeType == 8;
    }).each(function(i, e) {
        
        // Check contents of comment
        if (e.nodeValue == ' more ') {

            // Replace comment with "Read more" link
            var more_link = $(document.createElement('a'))
                    .html('Read more &rarr;')
                    .addClass('read_more js')
                    .on('click', function(e) {
                        $(this).closest('.post').find('.cut.under').removeClass('under').addClass('over');
                        $(this).remove();
                    });
            $(e).replaceWith(more_link);

            // Hide anything that appears after the comment but within
            // the same paragraph by iterating over sibling nodes
            var parent_node = more_link.get(0).parentNode;
            var sibling = more_link.get(0).nextSibling;
            while (sibling) {
                // Add appropriate classes to element nodes
                if (sibling.nodeType == 1) {
                    $(sibling).addClass('cut under');
                }
                // Wrap text nodes in <span class="cut under">...</span>
                else if (sibling.nodeType == 3) {
                    var span = $(document.createElement('span'))
                        .text(sibling.nodeValue)
                        .addClass('cut under')
                        .get(0);
                    parent_node.replaceChild(span, sibling);
                    sibling = span;
                }
                // Unknown node type
                else {
                    console.log("Unable to hide nodeType " + sibling.nodeType);
                    console.log(sibling);
                }
                sibling = sibling.nextSibling;
            }

            // Hide everything else
            more_link.parent().nextAll().addClass('cut under')
        }
    });
}

function compile(post) {
    
    // Fix date for timeago()
    post.date = post.date.replace(' ', 'T').replace(' GMT', 'Z');
    
    // Initial context
    context = {
        post: post,
        dashboard: 'http://www.tumblr.com/dashboard/10/' + (post.id + 1),
        mine: Washboard.blogs.indexOf(post.blog_name) >= 0,
        hide_url: post.reblogged_root_url || post.post_url
    };

    // Assemble photoset
    if (post.type == 'photo') {

        // Get photoset layout, or a pseudo-layout for a single image
        if (post.photoset_layout) {
            layout = post.photoset_layout;
        }
        else {
            layout = '1';
        }

        var rows = [];
        var row = {height: 700, count: layout[0], photos: []};
        var last_row = 0;

        // Get the widest photo's width: when showing HR photos, don't make the
        // post any wider than it needs to be
        var largest_width = 0;
        $.each(post.photos, function(ph, photo) {
            largest_width = Math.max(largest_width, best_fit(photo.alt_sizes, 1280).width);
        });
        hr_widths[post.id] = largest_width;

        // Insert each photo
        $.each(post.photos, function(ph, photo) {

            // Determine which row this photo belongs to
            var running_total = 0;
            var running_row = 0;
            while (running_total <= ph) {
                running_total += parseInt(layout[running_row]);
                running_row++;
            }
            running_row--;

            // If it's the first photo of a new row, push the previous row and
            // start a new one
            if (running_row > last_row) {
                rows.push(row);
                // TODO: duplicated default row
                row = {height: 700, count: layout[running_row], photos: []};
            }
            last_row = running_row;

            // Determine optimal photo sizes to load
            var target_size = optimal_sizes[layout[running_row]];
            var best_photo = best_fit(photo.alt_sizes, target_size);
            var hr_photo = best_fit(photo.alt_sizes, window.innerWidth);
            
            // Recalculate row height
            row.height = Math.min(row.height,
                optimal_sizes[layout[running_row]] / best_photo.width * best_photo.height)
            row.photos.push({url: best_photo.url, hr_url: hr_photo.url})
        });
        rows.push(row);
        context.rows = rows;
    }

    // If the quote is plain text, wrap it in a paragraph tag
    if (post.type == 'quote') {
        if (post.text.indexOf('<') == -1) {
            post.text = '<p>' + post.text + '</p>';
        }
    }

    // Determine asker's avatar for answer posts
    if (post.type == 'answer') {
        context.asking_avatar = (post.asking_name == 'Anonymous') ?
            'http://assets.tumblr.com/images/anonymous_avatar_24.gif' :
            ('http://api.tumblr.com/v2/blog/' + post.asking_name + '.tumblr.com/avatar/24');
    }

    // Assemble tags with URL-safe counterparts
    context.tags = []
    $.each(post.tags, function(t, tag) {
        context.tags.push({
            tag: tag,
            safe_tag: encodeURIComponent(tag),
        });
    });

    // Insert info menu
    var info_template = Handlebars.compile($('#info-template').html());
    var info_html = info_template(context);
    $('#dropdowns').append(info_html);
    $('#info_' + post.id).find('.timeago').timeago();
    
    // Render post to HTML
    var inner_template = Handlebars.compile($('#' + post.type + '-template').html());
    var inner_html = inner_template(context);
    var post_template = Handlebars.compile($('#post-template').html());
    context.inner_html = inner_html;
    return post_template(context);
}

function dash(data, textStatus, jqXHR) {
    try {
        // Global variable for debugging purposes
        d = data;
        
        // Some methods return posts in data.response.posts,
        // others in data.response
        if ('posts' in data.response) {
            post_list = data.response.posts;
        }
        else {
            post_list = data.response;
        }

        // Build posts
        $.each(post_list, function(p, post) {
            
            var blacklisted = is_blacklisted(post);
            
            // Blacklisted with no notification: skip immediately
            if (blacklisted == true) {
                return true;
            }

            // Compile the post's HTML
            var post_elem = $($.parseHTML(compile(post)));
            
            // Add notification if necessary
            if (blacklisted) {
                var notification_template = Handlebars.compile(
                    $('#notification-template').html()
                );
                post_elem.append(notification_template(blacklisted));
                post_elem.addClass('blacklisted');
                
                // Add listeners for touchscreens
                if (touchscreen) {
                    post_elem.on('touchstart', touchstart);
                    post_elem.on('touchend', touchend);
                }
                // Default to a simple click listener
                else {
                    post_elem.on('click', unhide);
                }
            }

            // Parse read-more breaks
            read_more(post_elem);
            
            // Add to the page
            $('#posts').append(post_elem);
        });

        // Reset "Load more" footer
        if ($('#load_more').hasClass('loading')) {
            $('#load_more').text('Load more');
            $('#load_more').removeClass('loading');
        }

        // Convert new audio elements to MediaElement players
        // This has to be done after they've been inserted into the document
        $('audio.new').mediaelementplayer({
            audioWidth: '100%',
            audioHeight: 30,
            startVolume: 0.8,
            loop: false,
            enableAutosize: true,
            features: ['playpause', 'progress', 'current', 'duration', 'tracks', 'volume'],
            iPadUseNativeControls: false,
            iPhoneUseNativeControls: true,
            AndroidUseNativeControls: false
        });
        $('audio.new').removeClass('new');
    }
    catch (e) {
        load_more_error();
        console.log(e.stack);
    }
}

function touchstart(e) {
    // Don't re-allow selection if we've already received another tap
    clearTimeout(allow_selection);
    
    // Disallow selection
    $('body').attr('style', '-webkit-user-select: none; -webkit-touch-callout: none');

    // Unhide after 1 second
    unhiding = setTimeout(function() {
        var prog = $(e.currentTarget).find('.progress');
        prog.stop()
            .css('opacity', .25)
            .animate(
                {width: '100%'},
                1000,
                function() {
                    unhide(e.currentTarget);
                    // Re-allow selection
                    $('body').removeAttr('style');
                    // Remove touch handlers
                    $(e.currentTarget).off('touchstart').off('touchend');
                }
            );
    }, 50);
}

function touchend(e) {
    // Re-allow selection after 300ms; without the delay,
    // iOS will try to select the progress slider immediately upon touchend
    allow_selection = setTimeout(function() {
        $('body').removeAttr('style');
    }, 300);

    // Stop unhiding the post
    clearTimeout(unhiding);
    var prog = $(e.currentTarget).find('.progress');
    prog.stop()
        .animate(
            {opacity: 0},
            200,
            function() {
                $(this).css('opacity', 0).css('width', 0);
            }
        );
}

function unhide(a) {
    var post = $(a).closest('.post');

    // Fade out notification to white
    post.children().animate(
        {opacity: 0},
        500,
        function() {
            // Fade in post from white
            post.removeClass('blacklisted');
            post.children().css('opacity', 0).animate(
                {opacity: 1},
                600,
                // Remove the opacity declaration after animation
                function() {
                    post.children().css('opacity', '');
                    post.children().each(function(c, child) {
                        $(child).attr('style') || $(child).removeAttr('style')
                    });
                });
        }
    );
}

function apicall(endpoint, data, callback) {
    var _data = $.extend(data, {
        csrfmiddlewaretoken: csrf_token,
        endpoint: endpoint,
    });
    _data = $.extend(Washboard.parameters, _data);
    console.log(_data);
    $.ajax({
        type: 'POST',
        url: '/api',
        data: _data,
        success: callback,
        error: load_more_error,
        dataType: 'json',
    });
}

function dashboard(data) {
    var _data = $.extend({
        reblog_info: 'true',
        notes_info: 'true'
    }, data);
    apicall(Washboard.endpoint, _data, dash);
}

function like(id) {
    // Determine whether to like or unlike the post
    endpoint = $('#post_' + id).find('.like').hasClass('liked') ? 'unlike' : 'like';

    // Assemble parameters
    parameters = {
        id: id,
        reblog_key: $('#post_' + id).data('reblog-key'),
    }
    
    // Send the API request
    apicall(endpoint, parameters, function(data) {
        if (data.meta.status == 200) {
            $('#post_' + id).find('.like').toggleClass('liked');
        }
        else {
            console.log('Like error');
            console.log(data);
        }
    });
}

function reblog(id) {
    // Create reblog box if it doesn't exist yet
    if (!$('#reblog_' + id).length) {
        var this_post = $('#post_' + id);
        
        var reblog_source = $('#reblog-template').html();
        var reblog_template = Handlebars.compile(reblog_source);
        var reblog_html = reblog_template({
            id: id,
            username: Washboard.username,
        });
        this_post.after(reblog_html);
        
        // Insert blog menu
        var chooseblog_template = Handlebars.compile($('#chooseblog-template').html());
        var chooseblog_html = chooseblog_template({
            id: id,
            blogs: Washboard.blogs,
        });
        $('#dropdowns').append(chooseblog_html);
    }

    // Locate reblog box
    var reblog_box = $('#reblog_' + id);
    
    // Open if closed
    if (reblog_box.hasClass('closed')) {
        // Close any other action boxes that are open
        $('.action-box').addClass('closed');

        // Calculate box's height for animations
        if (!reblog_box.attr('style')) {
            reblog_box.addClass('get-height').removeClass('closed');
            reblog_box.css('height', reblog_box.height());
            reblog_box.addClass('closed').removeClass('get-height');
        }
        reblog_box.removeClass('closed');
    }
    // Close if opened
    else {
        reblog_box.addClass('closed');
    }
}

function reply(id) {
    // Create reply box if it doesn't exist yet
    if (!$('#reply_' + id).length) {
        var this_post = $('#post_' + id);
        
        var reply_source = $('#reply-template').html();
        var reply_template = Handlebars.compile(reply_source);
        var reply_html = reply_template({id: id});
        this_post.after(reply_html);
    }

    // Locate reply box
    var reply_box = $('#reply_' + id);
    
    // Open if closed
    if (reply_box.hasClass('closed')) {
        // Close any other action boxes that are open
        $('.action-box').addClass('closed');

        // Calculate box's height for animations
        if (!reply_box.attr('style')) {
            reply_box.addClass('get-height').removeClass('closed');
            reply_box.css('height', reply_box.height());
            reply_box.addClass('closed').removeClass('get-height');
        }
        reply_box.removeClass('closed');
        setTimeout(function() { 
            reply_box.find('.reply').click().focus();
        }, 200);
    }
    // Close if opened
    else {
        reply_box.addClass('closed');
    }
}

function reply_keypress(id, e) {
    if ((e.which || e.keyCode || e.charCode) == 13) {
        if (e.target.value.length) {
            submit_reply(id, e.target.value);
        }
    }
}

// also: 'mine' context variable, dropdowns, info button, blacklisting, oh god there's so much left to do

function submit_reply(id, reply_text) {
    var this_post = $('#post_' + id);

    data = {
        post_id: id,
        reblog_key: $('#post_' + id).data('reblog-key'),
        reply_text: $('#reply_' + id).find('.reply').prop('value'),
    };
    apicall('reply', data, function(data) {
        if (data.meta.status == 200) {
            $('#reply_' + id)
                .addClass('closed')
                .find('.reply')
                .prop('value', '');
        }
        else {
            console.log('Reply error');
            console.log(data);
        }
    });
}

function load_redirect_query() {
    redirect_query = '?redirect_to=' + encodeURIComponent(Washboard.base_url +
        location.pathname.slice(1) + '?session=' + session)
    $('#new a').each(function(n, new_link) {
        $(new_link).attr('href', $(new_link).attr('href') + redirect_query);
    });
}

function load_more() {
    if (Washboard.well_ordered || !featured_tag) {
        // Set the offset, accounting for posts that have been made since initial load
        dashboard({
            offset: $('#posts').children().length + behind_by * 2
        });
    }
    else {
        dashboard({
            before: d.response[d.response.length - 1].featured_timestamp
        });
    }
    $('#load_more').text('Loading...');
    $('#load_more').addClass('loading');
}

function load_more_error() {
    $('#load_more').text('There was an error while loading your posts. Try again?');
    $('#load_more').removeClass('loading');
}

function save_session() {
    try {
        localStorage.setItem('session_' + session, JSON.stringify({
            'behind_by': behind_by,
            'posts': posts,
            'position': $('body').scrollTop(),
        }));
    }
    catch (err) {
        console.log('Ran out of localStorage quota. Clearing...');
        if (err.name.toLowerCase().indexOf('quota') > -1) {
            localStorage.clear();
            localStorage.setItem('sessions', JSON.stringify([session]));
        }
    }
}

$(function() {
    // Get scale for photos
    // TODO: adjust when window resizes?
    scale = Math.min(500, window.innerWidth) / 500;
    optimal_sizes = {'1': 500 * scale, '2': 245 * scale, '3': 160 * scale};
    
    // Detect touch screen
    touchscreen = 'ontouchstart' in window;
    
    // Initial variables
    posts = [];
    hr_widths = {};
    behind_by = 0;
    allow_selection = -1;
    unhiding = -1;
    featured_tag = false;
    scan_attributes = ['reblogged_from_name', 'title', 'body', 'caption',
        'text', 'source', 'url', 'description', 'label', 'phrase',
        'asking_name', 'question', 'answer'];
    
    query = URI(location.search).query(true);
    hash = URI('?' + location.hash.slice(1)).query(true);
    session = hash.session || query.session;

    $('#load_more').text('Loading...');
    dashboard();
    /*
    // Load session, if present
    if (session) {
        session_data = JSON.parse(localStorage.getItem('session_' + session));
        if (session_data) {
            load_redirect_query();
            behind_by = session_data.behind_by;
            dash({
                'meta': {'status': 304, 'msg': 'Not Modified'},
                'response': {'posts': session_data.posts}
            });
            $('body').scrollTop(session_data.position);
        }
        else {
            session = null;
        }
    }

    // Otherwise, start a new session and load the first page of the dashboard
    if (!session) {
        session = (new Date()).getTime().toString();
        location.hash = 'session=' + session;
        load_redirect_query();

        // Record this session
        var sessions = [];
        if (localStorage.getItem('sessions')) {
            sessions = JSON.parse(localStorage.getItem('sessions'));
        }
        sessions.push(session);
        localStorage.setItem('sessions', JSON.stringify(sessions));
        
        dashboard();
    }

    // Clean up outdated sessions
    if (localStorage.getItem('sessions')) {
        var sessions = JSON.parse(localStorage.getItem('sessions'));
        var time = new Date().getTime();
        for (var s in sessions) {
            // Expire sessions after 1 hour
            if (time - sessions[s] > 3600000) {
                console.log('Removing outdated session ' + sessions[s]);
                localStorage.removeItem('session_' + sessions[s]);
                sessions.splice(s, 1);
            }
        }
        localStorage.setItem('sessions', JSON.stringify(sessions));
    }
        
    save_session_interval = setInterval(save_session, 5000);
    */
});

Handlebars.registerHelper("debug", function(optionalValue) {
  console.log("Current Context");
  console.log("====================");
  console.log(this);
 
  if (optionalValue) {
    console.log("Value");
    console.log("====================");
    console.log(optionalValue);
  }
});

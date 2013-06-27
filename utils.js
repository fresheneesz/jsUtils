var Utils = {

	// aligns elements horizontally (along the vertical axis)
    alignHorizontal: function(cssSelector_list)
    {   var maxLeftOffset = 0;
        var node = $(cssSelector_list);
        node.each(function()
        {   var thisLeftOffset = $(this).offset().left;
            if(thisLeftOffset > maxLeftOffset)
            {   maxLeftOffset = thisLeftOffset;
            }
        });
        node.each(function()
        {   var thisLeftOffset = $(this).offset().left;
            if(thisLeftOffset != maxLeftOffset)
            {   var currentMargin = $(this).css("margin-left");
                if(currentMargin=="auto")
                {   currentMargin = "0";
                }else
                {   currentMargin = currentMargin.substring(0,currentMargin.length-2);
                }
                var newMarginLeft = parseInt(currentMargin)+parseInt(maxLeftOffset-thisLeftOffset);

                // the following if statement is ie8 hackery because in some (iframe related) conditions, ie8 may return the real offset multiplied by 100 (wtf! right?)
                if(newMarginLeft >= 100 && $.browser.msie && $.browser.version >= 8 && $.browser.version <= 9)
                {   $(this).css({"margin-left":newMarginLeft/100});
                }else
                {   $(this).css({"margin-left":newMarginLeft});
                }
            }
        });
    },
    // returns true if all the keys in the 'needles' object are also keys in the 'haystack' object
    allIn: function(needles, haystack) {
        for(n in needles) {
            if( ! (n in haystack)) {
                return false;
            }
        }
        return true;
    },

    absolutizeStaticUrl: function(url) {
        if(url === null || url === undefined) return null;
        var absolutizedUrl;
        toolJS.simpleGetJax('/tools/sale2?hash=<%=request.getParameter("hash")%>&username=<%=request.getParameter("username")%>&expire_by=<%=request.getParameter("expire_by")%>&role=<%=request.getAttribute("roles")%>&action=absolutizeStaticUrl', {url: url},function(result) {
            absolutizedUrl = result;
        }, undefined, undefined, false);

        return absolutizedUrl;
    },
    
    // compares the given members of each object, if any aren't equal, it returns false
    // members can contain members with sub-members using dot notation (e.g. "member.submember.b")
    compareObjectMembers: function(a,b, members) {
        var getMember = function(o,m) {
            var result = o;
            var parts = m.split('.');
            for(n in parts) {
                result = result[parts[n]];
            }
            return result;
        };

        for(n in members) { var m = members[n];

            if(getMember(a,m) !== getMember(b,m)) {
                return false;
            }
        }
        return true;
    },
    
    createScrim: function() {
        $("body").append('<div id="scrimscreen" style="'
                +'background-image:url(\'${staticBaseUrl}/images/scrim.png\');' // this is just a semi-transparent gray image
                +'background-repeat: repeat;'
                +'height:100%;'
                +'width:100%;'
                +'position: absolute;'
                +'z-index: 10;'
                +'top: 0;'
            +'"></div>')
                .append("");
	},

    // request is canceled if another call is made before the request on the cancelObject has finished
    // cancelList is the list of cancelObjects to cancel when the request is made (the cancelObject need not be put in that list)
    cancelableAjax: function(cancelObject, cancelList, url, data, success, finallyFunc) {
        cancelList.push(cancelObject);
        for(n in cancelList) {
            if(cancelList[n].request != undefined)
            {   cancelList[n].request.abort();
            }
        }

        cancelObject.request = toolJS.simpleGetJax(url, data, function(data) {
            cancelObject.request = undefined;
            if(success != undefined) {
                success(data);
            }
        }, finallyFunc);
    },

    dirname: function(path)
    {   // Returns the directory name component of the path
        //
        // version: 909.322
        // discuss at: http://phpjs.org/functions/dirname
        // +   original by: Ozh
        // +   improved by: XoraX (http://www.xorax.info)
        // *     example 1: dirname('/etc/passwd');
        // *     returns 1: '/etc'
        // *     example 2: dirname('c:/Temp/x');
        // *     returns 2: 'c:/Temp'
        // *     example 3: dirname('/dir/test/');
        // *     returns 3: '/dir'

        return path.replace(/\\/g,'/').replace(/\/[^\/]*\/?$/, '');
    },

    fillUndefined: function(object, value, members) {
        for(n in members) {
            var k = members[n];
            if(object[k] === undefined) {
                object[k]=value;
            }
        }
        return object;
    },
    getPageHeight: function() {
        function getUpdatedHeight(element, originalMaxHeight) {
            var top = element.offset().top;
            if(typeof(top)!='undefined'){
                var height = element.outerHeight();
                return Math.max(originalMaxHeight, top+height);
            } else {
                return originalMaxHeight;
            }
        }

        var maxhrel = 0;
        if( ! $.browser.msie) {
            maxhrel = $("html").outerHeight(); //get the page height
        } else {
            // in IE and chrome, the outerHeight of the html and body tags seem to be more like the window height
            $('body').children(":not(script)").each(function(){ //get all body children
                maxhrel=getUpdatedHeight($(this), maxhrel);
            });
        }

        var atotoffset=0;  // absolute element offset position from the top
        $.each($('body *:not(script)'),function(){   //get all elements
            if ($(this).css('position') == 'absolute' && $(this).css('display') !== 'none'){ // absolute and displayed?
                atotoffset=getUpdatedHeight($(this), atotoffset);
            }
        });

        return Math.max(maxhrel, atotoffset);
    },

    // cacheable getScript
    getScript: function(url, callback, cache) {
        $.ajax({
            type: "GET",
            url: url,
            success: callback,
            dataType: "script",
            cache: cache
        });
    },

    // this is only verified to work for scripts included using html script tags and jquery's getScript function
    getCurScriptURL: function(callback) {
        var scripts = document.getElementsByTagName("script");
        var scriptURI = scripts[scripts.length - 1].src;

        if (scriptURI != "")            // static include
        {
            callback(scriptURI);
        } else if ($ != undefined)    // jQuery ajax
        {
            $(document).ajaxSuccess(function(e, xhr, s) {
                callback(s.url);
            });
        } else {
            throw("Could not resolve current script's URL");
        }
    },

    // Reads a page's GET URL variables and returns them as an associative array.
    // Author: Uzbek Jon <%-- (found at: http://jquery-howto.blogspot.com/2009/09/get-url-parameters-values-with-jquery.html) --%>
    // urldecode added by Billy Tetrud
    getUrlVars: function() {
        var vars = [];
        var indexOfQuestionMark = window.location.href.indexOf('?');
        if (indexOfQuestionMark !== -1) {
            var params = window.location.href.slice(indexOfQuestionMark + 1).split('&');
            for (var i = 0; i < params.length; i++) {
                var param = params[i].split('=');
                if (param.length == 2)
                    vars[param[0]] = PlaydomUtils.urldecode(param[1]);
            }
        }
        return vars;
    },

    isRelativeUrl: function(url) {
        return url.indexOf("://") === -1; 
    },

    loadScripts: function(scriptURLs, callback, cache) {
        var loadedScripts = 0;  // crappy semaphore that relies on the fact that asynchronous js callbacks are really run serially

        if (cache == undefined) {
            cache = true;    // default value
        }

        var getScriptFuntion = function(thisUrl, thisCallback, ignore) {
            return $.getScript(thisUrl, thisCallback);
        };
        if (PlaydomUtils.getScript != undefined) {
            getScriptFuntion = PlaydomUtils.getScript;
        }

        if (typeof(scriptURLs) === 'string') {
            scriptURLs = [scriptURLs];
        }

        for (n in scriptURLs) {
            getScriptFuntion(scriptURLs[n], function(a, b) {
                loadedScripts += 1;
                if (scriptURLs.length == loadedScripts) {
                    if (callback !== undefined) {
                        callback();
                    }
                } // else don't run
            }, true /*cache*/);
        }
    },
    

    // runs a function after an iframe node's content has loaded
    // note, this almost certainly won't work for frames loaded from a different domain
    onReady: function(iframeNode, f) {
        var windowDocument = iframeNode[0].contentWindow.document;
        var iframeDocument = windowDocument?windowDocument : iframeNode[0].contentWindow.document;

        if(iframeDocument.readyState === 'complete') {
            f();
        } else {
            iframeNode.load(function() {
				var n = 0;
                var i = setInterval(function() {
                    if(iframeDocument.readyState === 'complete') {
                        f();
                        clearInterval(i);
                    } else {
						n++;
						if(n > 20)		// stop after too many times
							clearInterval(i); 
					}
                }, 10);
            });
        }
    },
	
    // properties of objects given as later arguments will overwrite the properties of earlier arguments if they conflict
    objMerge: function() {
        var args = Array.prototype.slice.call(arguments);

        // returns true if obj contains rather than inherits property (or if obj doesn't have the hasOwnProperty method)
        function containsOwnProperty(obj, property) {
            return !obj.hasOwnProperty || obj.hasOwnProperty(property);
        }

        var result = {};
        for (var n in args) {
            if (containsOwnProperty(args, n)) {
                for (var attrname in args[n]) {
                    if (containsOwnProperty(args[n], attrname)) {
                        result[attrname] = args[n][attrname];
                    }
                }
            }
        }
        return result;
    },

    // data should be a javascript object
    postRequest: function(url, dataString, timeout/*=10000*/, dataType/*=jquery default*/) {
        if(!timeout) timeout = 10000;

        var failure=null;
        var result = null;
        var options = {
            async: false,
            processData: false,
            cache: false,
            timeout: timeout,

            type: "POST",
            url: url,
            data: dataString,

            error: function (data, status, exception) {
                failure = data+" "+status+" "+exception;
            },
            success: function(returnedData) {
                result = returnedData;
            }
        };
        if(dataType != undefined) options.dataType = dataType;
        
        $.ajax(options);

        if(failure !== null) {
            throw failure;
        }

        return result;
    },

    // parameters should be an object where the keys are the parameters to replace, and their values are the values to replace them with
    populateParameterizedString: function (rawUrl, parameters)
    {   var result = rawUrl;
        for(x in parameters) {
            result = result.replace("$"+"{"+x+"}", parameters[x]);
        }
        return result;
    },
    preloadImage: function(imageURL)
    {   if (document.images){
            var preloadImage = new Image();
            preloadImage.src = imageURL;
            return preloadImage;
        }

        return undefined;
    },
    // parse a date in yyyy-mm-dd format
    parseDate: function (dateString) {
      var parts = dateString.match(/(\d+)/g);
      // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
      return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
    },
	
	// options can have members:
    // htmlClass
    // closeButtonClass
    // onClose - callback
    popOverlay: function(url, height, width, options) {
        var overlay = $('<div></div>');
        overlay.css({width: '100%', height: $('body').outerHeight(true), position: 'absolute', zIndex: 10000,
            "background-image": 'url(https://offer0-a.akamaihd.net/offer/images/scrim.png)'});

        var innerDiv = $('<div></div>');
        var innerDivCss = {margin: 'auto', width: width, height: height, position: 'relative'};
        if (options != undefined && options.htmlClass !== undefined) {
            innerDiv.addClass(options.htmlClass);
        } else {
            innerDivCss.top = '20%';
        }
        innerDiv.css(innerDivCss);

        var closeButton = $('<div></div>');
        var closeButtonCss = {position: 'absolute', cursor: 'pointer'};
        var closeButtonClassSet = options != undefined && options.closeButtonClass !== undefined;
        if (closeButtonClassSet) {
            closeButton.addClass(options.closeButtonClass);
        } else {
            closeButtonCss.backgroundImage = 'url("https://offer0-a.akamaihd.net/offer/images/close.png")';
            closeButtonCss.backgroundPosition = 'top';
            closeButtonCss.height = '22px';
            closeButtonCss.width = '22px';
            closeButtonCss.top = '-20px';
            closeButtonCss.right = '-20px';

        }
        closeButton.css(closeButtonCss);
        closeButton.hover(function() {
            if (closeButtonClassSet)
                closeButton.css({backgroundPosition: 'bottom'});
        }, function() { // release hover
            closeButton.css(closeButtonCss);
        });
        closeButton.click(function() {
            overlay.remove();
            if (options != undefined && options.onClose !== undefined) options.onClose();
        });

        var iframe = $('<iframe src="' + url + '">');
        iframe.css({width: '100%', height: '100%'});

        overlay.prepend(innerDiv);
        innerDiv.prepend(closeButton);
        innerDiv.prepend(iframe);

        $('body').prepend(overlay);
    },

    range: function(start,end) {
        var result = [];
        for(var n=start; n<=end; n++) {
            result.push(n);
        }
        return result;
    },
    
    // sets a callback onto an event
    // the callback for the event is removed after the first execution (so it doesn't happen next time the event happens)
    // $node is a jquery object
    // (is jquery 'once' or maybe 'one' similar to this?)
    setSingleUseCallback: function($node, eventType, callback)
    {   var eventHandler = function()
        {   $node.unbind(eventType, eventHandler);
            callback();

        };

        $node.bind(eventType, eventHandler);
    },
    
    
    simpleGetJax: function (url, data, success, finallyFunc, failure, async) {
        if(async === undefined) async = true;
        return $.ajax({
            async: async,
            type: "GET",
            url: url,
            data: data,
            error: function (data, status, exception) {
                if(failure){failure(status, exception);}
                if(finallyFunc != undefined){finallyFunc();}
            },
            success: function(returnedData)
            {   try {
                    success(returnedData);
                } catch(e) {
                    if(failure){failure(e.message, e);}
                }
                if(finallyFunc != undefined){finallyFunc();}
            },
            timeout: 20000
        });
    },

    setUpToolTip: function(mainSelector, tipSelector) {
        $(mainSelector).live('mouseenter', function() {
            $(this).siblings(tipSelector).show();
        });
        $(mainSelector).live('mouseleave', function() {
            $(this).siblings(tipSelector).hide();
        });
    },

    // creates a function that runs the 'callback' after being called with all the neccessary keys
    // the callback will receive a single object as an argument, containing one list of arguments per 'key' 
    synchronize: function(keysIn, callback) {
        var keyList = toolJS.toObject(keysIn);
        var keys = {};
        return function (keyIn) {
            return function() {
                keys[keyIn] = arguments;
                if(toolJS.allIn(keyList, keys)) {
                    callback(keys);
                    keys = {}; // reset keys
                }
            };
        };
    },
    // maps the 'values' list to a list of values depending on whether the value is in 'list' or not 
    setKeysFromArray: function(list, values, ifIn, ifNotIn) {
        var listObject = toolJS.toObject(list);
        var result = {};
        for(n in values) {
            var item = values[n];

            if(item in listObject) {
                result[item] = ifIn;
            } else {
                result[item] = ifNotIn;
            }
        }
        return result;
    },
    
    timeToString: function (time) {
        if(time == null || time == undefined)
            return null;
        return time.year+'-'+time.month+'-'+time.day+' '+time.hours+':'+time.minutes;
    },

    // converts the elements of an array to an object
    // value is the value to put in
    toObject: function(a, value) {
        if(value == undefined) {
            value = null;
        }
        var o = {};
        for(var i=0;i<a.length;i++) {
            o[a[i]]=value;
        }
        return o;
    },

    // URL-encodes string
    // version: 911.718
    // discuss at: http://phpjs.org/functions/urlencode
    // Original Author: Philip Peterson, reimplimented by Brett Zamir
    urlencode: function(str)
    {   str = (str+'').toString();
        return encodeURIComponent(str)
            .replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28')
            .replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
    },

    // Decodes URL-encoded string
    // version: 911.718
    // discuss at: http://phpjs.org/functions/urldecode
    // Original Author: Philip Peterson, reimplimented by Brett Zamir
    urldecode: function(str) {
        return decodeURIComponent(str).replace(/\+/g, '%20');
    },

    urlExists: function(url) {
        result = false;
        $.ajax({
            url:url,
            type:'HEAD',
            async: false,
            success: function() {
                result = true;
            }
        });
        return result;
    }
};

// library for sending cross-domain calls requiring only a single file to be hosted on the other end and be passed to the frame that needs to communicate with it (xdEventReciever.html)
var xdJsEvents = // namespace-like object
{   /*RESERVED*/ grandChildCommunicationFrame: undefined,    // this should be reserved for use by a child frame (which should set this to its window object)

    // triggers a cross-domain event, which will be caught and handled by a file that will generate a javascript event in the ancestor iframe        // xdEventSenderUrl holds the URL of the cross-domain file to call
    trigger: function(eventName, xdEventSenderUrl, messageObject, level) {
        level = level || 1;
        var GETparams = 'e=' + eventName;
        GETparams += '&L=' + level;
        if (messageObject != undefined) {
            GETparams += '&m=' + PlaydomUtils.urlencode(JSON.stringify(messageObject));
        }
        $("body").append(' <iframe style="display:none;height:0;width:0;" src="' + xdEventSenderUrl + '?' + GETparams + '"></iframe>');
    },

    triggerChild: function(eventName, xdEventSenderUrl, messageObject) {
        if (xdJsEvents.grandChildCommunicationFrame != undefined) {
            xdJsEvents.grandChildCommunicationFrame.xdJsEvents.trigger(eventName, xdEventSenderUrl, messageObject, 1);
        }
    },

    // initializes a command receiver
    // callback should receive a data-object, and the eventName in that order
    bind: function(eventName, callback) {
        $('body').bind(eventName, function(event, data) {
            callback(data, eventName);
        });
    },

    // should be called by the child
    registerParentToChildCommunication: function(xdEventSenderUrl, level) {
        level = level || 1;
        var GETparams = 't=regPtC';	// type = register Parent to Child (communication)
        GETparams += '&L=' + level;
        $("body").append(' <iframe style="display:none;height:0;width:0;" src="' + xdEventSenderUrl + '?' + GETparams + '"></iframe>');
    },

    /* private */ getAncestorWindowObject: function(level) {    // find the iframe level (has to be iframes whos source is in the same domain)
        var windowToCall = window.parent.parent;
        if (level != undefined && level > 1) {
            for (var n = 1; n < level; n++) {
                windowToCall = windowToCall.parent;
            }
        }

        return windowToCall;
    },

    // run expects some a arguments (e.g. ?e=something&m={...})
    // Should only be used in xd event receiver files
    // e: the event name
    // m: a message object
    // L: level (how many iframes up it is from the caller)
    /* private */ run: function() {
        var args = PlaydomUtils.getUrlVars();
        if (args.t !== undefined && args.t === 'regPtC') {
            for (var n = 1; n <= args.L; n++) {
                try {
                    xdJsEvents.registerWindowWithAncestor(n);
                } catch(e) { /* ignore */
                }
            }
        } else {
            xdJsEvents.triggerAncestor(args.e, JSON.parse(args.m), args.L);
        }
    },
    // does a same-domain event trigger in an ancestor iframe
    /* private */ triggerAncestor: function(eventName, param, level) {
        xdJsEvents.getAncestorWindowObject(level).$('body').trigger(eventName, [param]);
    },

    /* private */ registerWindowWithAncestor: function(level) {
        xdJsEvents.getAncestorWindowObject(level).xdJsEvents.grandChildCommunicationFrame = window;
    }
};

validate: {
    integer: function(value) {  //validateInteger
        return 0 <= parseInt(value);
    },
    // positive real
    real: function(value) {
        return 0 <= parseFloat(value);
    },

    date: function(date) {
        return true;
    },
	email: function(addr,man,callback) {
	    if (addr == '' && man) {
	       callback('email address is mandatory');
	       return false;
	    }
	    if (addr == '') return true;
	    var invalidChars = '\/\'\\ ";:?!()[]\{\}^|';
	    for (i=0; i<invalidChars.length; i++) {
	       if (addr.indexOf(invalidChars.charAt(i),0) > -1) {
	          callback('email address contains invalid characters');
	          return false;
	       }
	    }
	    for (i=0; i<addr.length; i++) {
	       if (addr.charCodeAt(i)>127) {
	          callback("email address contains non ascii characters.");
	          return false;
	       }
	    }
	
	    var atPos = addr.indexOf('@',0);
	    if (atPos == -1) {
	       callback('email address must contain an @');
	       return false;
	    }
	    if (atPos == 0) {
	       callback('email address must not start with @');
	       return false;
	    }
	    if (addr.indexOf('@', atPos + 1) > - 1) {
	       callback('email address must contain only one @');
	       return false;
	    }
	    if (addr.indexOf('.', atPos) == -1) {
	       callback('email address must contain a period in the domain name');
	       return false;
	    }
	    if (addr.indexOf('@.',0) != -1) {
	       callback('period must not immediately follow @ in email address');
	       return false;
	    }
	    if (addr.indexOf('.@',0) != -1){
	       callback('period must not immediately precede @ in email address');
	       return false;
	    }
	    if (addr.indexOf('..',0) != -1) {
	       callback('two periods must not be adjacent in email address');
	       return false;
	    }
	    var suffix = addr.substring(addr.lastIndexOf('.')+1);
	    if (suffix.length != 2 && suffix != 'com' && suffix != 'net' && suffix != 'org' && suffix != 'edu' && suffix != 'int' && suffix != 'mil' && suffix != 'gov' & suffix != 'arpa' && suffix != 'biz' && suffix != 'aero' && suffix != 'name' && suffix != 'coop' && suffix != 'info' && suffix != 'pro' && suffix != 'museum') {
	       callback('invalid primary domain in email address');
	       return false;
	    }
	    return true;
	},
	
	addressZip: function(zip,man,isUS, callback) {
	    if (zip == '' && man) {
	       callback('postal code is mandatory');
	       return false;
	    }
	    if (zip == '') return true;
	    if (isUS) {
	        var zipExp =  /^\d{5}([\-]\d{4})?$/;
	        var alphaExp = /^[0-9\-]+$/;
	        if(!zip.match(alphaExp)){
	            callback("Numbers and dash only for Postal Code for USA.");
	            return false;
	        }
	        if(!zip.match(zipExp)){
	            callback("Postal Code Format is not right.");
	            return false;
	        }
	    }
	    return true;
	},
	
	addressState: function(state, man, isUS, callback) {
	    if (state == '' && man) {
	       callback('state is mandatory');
	       return false;
	    }
	    if (state == '') return true;
	    var alphaExp = /^[0-9a-zA-Z]+$/;
	
	    if (isUS) {
	        var letterExp = /^[a-zA-Z]+$/;
	        if(!state.match(letterExp)){
	            callback("Letters Only in State for USA.");
	            return false;
	        }
	    } else {
	        if(!state.match(alphaExp)){
	            callback("Numbers and Letters Only in State.");
	            return false;
	        }
	    }
	    return true;
	}
}


/**
 * Function : dump()
 * Arguments: The data - array,hash(associative array),object
 *    The level - OPTIONAL
 * Returns  : The textual representation of the array.
 * This function was inspired by the print_r function of PHP.
 * This will accept some data as the argument and return a
 * text that will be a more readable version of the
 * array/hash/object that is given.
 * Docs: http://www.openjs.com/scripts/others/dump_function_php_print_r.php
 */
function dump(arr,level) {
    var dumped_text = "";
    if(!level) level = 0;

    //The padding given at the beginning of the line.
    var level_padding = "";
    for(var j=0;j<level+1;j++) level_padding += "    ";

    if(typeof(arr) == 'object') { //Array/Hashes/Objects
        for(var item in arr) {
            var value = arr[item];

            if(typeof(value) == 'object') { //If it is an array,
                dumped_text += level_padding + "'" + item + "' ...\n";
                dumped_text += dump(value,level+1);
            } else {
                dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
            }
        }
    } else { //Stings/Chars/Numbers etc.
        dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
    }
    return dumped_text;
}

// add odd or even class to rows
$.fn.reOddify = function () {
    return this.each(function() {
        var odd=false;
        $(this).children('tbody').children('tr').each(function() {
            $(this).removeClass('odd');
            if(odd) {
                $(this).addClass('odd');
                odd = false;
            } else {
                odd=true;
            }
        });
    });
};

// create a shallow copy of an object
$.shallow = function(obj) {
    var newObj = (obj instanceof Array) ? [] : {};
    for (i in obj) {
        if(!obj.hasOwnProperty || obj.hasOwnProperty(i)) {
            newObj[i] = obj[i];
        }
    }
    return newObj;
};

var originalVal = $.fn.val;
$.fn.val = function(value) {
    var thisNode = $(this);

    if(thisNode.attr("type") == "checkbox" || thisNode.attr("type") == "radio") {
        if(value !== undefined) {
            thisNode.attr("checked", value);
        } else {
            return thisNode.attr("checked");
        }
    } /*else if(thisNode.is("textarea")) {

    } */else {
        return originalVal.apply(this, arguments);
    }
};

$.fn.modifiableInput = function (callback) {
    return this.each(function() {
        var thisNode = $(this);
        var originalValue = $(this).val();

        var nodeToAddClass, type;
        if(thisNode.attr("type") == "checkbox" || thisNode.attr("type") == "radio") {
            type='checkbox';
            nodeToAddClass = thisNode.parent();
        } else {
            type='input';
            nodeToAddClass = thisNode;
        }

        thisNode.data("originalValue", originalValue);

        thisNode.bind('change keyup', function() {
            var originalValue = thisNode.data("originalValue");
            var isOriginalValue = $(this).val() === originalValue;

            if( ! isOriginalValue) {
                nodeToAddClass.addClass("modified");
            } else {
                nodeToAddClass.removeClass("modified");
            }

            if(callback != undefined) {
                callback.apply(thisNode, [isOriginalValue]);
            }
        });

        thisNode.bind('revert', function() {
            var originalValue = thisNode.data("originalValue");
            $(this).val(originalValue);
        });

        thisNode.overrideNodeMethod('resetOriginal', function (value) {
            this.val(value);
            this.data("originalValue",value);
        });
    });
};
$.fn.resetOriginal = function() {       // set this equal to a particular node's val as a default for the above ^
    $(this).val.apply(this, arguments);
};


// overrides a method thats supposed to be called on a single node (a method like val)
$.fn.overrideNodeMethod = function(methodName, action, defaultAction) {
    var originalVal = $.fn[methodName];
    var thisNode = this;
    $.fn[methodName] = function() {
        if (this[0]==thisNode[0]) {
            return action.apply(this, arguments);
        } else {
            return originalVal.apply(this, arguments);
        }
    };
};

// takes a drop down and turns it into a text field with a drop down
$.fn.comboBox = function () {//textValue

    // transfers html attributes from one element to another
    var transferAttributes = function(originalNode, newJqueryElement) {
        var attributes = [];
        $.each(originalNode.attributes, function(i, attrib){
            attributes.push(attrib);
        });

        for(var n in attributes) {
            var attrObject = {};
            attrObject[attributes[n].name] = attributes[n].value;
            $(originalNode).removeAttr(attributes[n].name);
            newJqueryElement.attr(attrObject);
        }
    };

    return this.each(function() {

        var changeList = function(listItems) {
            list.html('');
            for(value in listItems) {   var text = listItems[value];
                var option = $('<li>'+text+'</li>');
                option.data('value', value);
                list.append(option);
            }

            list.css({left:textField.width()+dropdownArrow.width()-list.width()-1});

            list.find('li').click(function() {
                container.val($(this).text());
                container.data("value", $(this).data('value'));
                list.hide();
                textField.change();
            });
        };

        var container = $('<div style="position:relative;"></div>');

        // create a text field that has the same classes and size that the drop down did
            // also set its id to the id of hte drop down after
        transferAttributes(this, container);
        container.data('value',container.attr('value'));

        var textField = $('<textarea></textarea>');
        if(container.attr('text') !== undefined) {
            textField.text(container.attr('text'));
        } else {
            textField.text(container.data('value'));
        }
        textField.css({width:'100%'});
        textField.css({height:'100%'});
        container.prepend(textField);

        // create a dropdown arrow
        var dropdownArrow = $('<div class="dropDownArrow">v</div>');
        dropdownArrow.css({position: 'absolute'});
        dropdownArrow.css({height: '100%'});
        dropdownArrow.css({top: '1px'});

        container.prepend(dropdownArrow);

        // create list elements that act as the new drop down
            // position list under arrow
        var list = $('<ol class="dropDownList"></ol>');
        list.css({'list-style-type': 'none', position: 'absolute', 'z-index': 1000});


        container.append(list);

        // hook up arrow to showing the list
        dropdownArrow.click(function(event) {
            list.toggle();
            event.stopPropagation();
        });
        $(document).click(function(event) {
            if($(event.target).parents().index(list) == -1) {
                if(list.is(":visible")) {
                    list.hide();    // hide if menu is open and it something else is clicked
                }
            }
        });

        // write the new html and hide the original
        $(this).hide();
        $(this).after(container);
        list.hide();

        // write the list
        var valueMap = [];
        $(this).find('option').each(function() {
            valueMap[$(this).attr('value')] = $(this).text();
        });
        changeList(valueMap);

        // position arrow over end of text field, and list under the drop down arrow
        dropdownArrow.css({left: textField.width()});


        // forward some jquery methods from container to the input field
        container.overrideNodeMethod('val', function (newValue) {
            if(newValue !== undefined) {
                container.data('value',newValue);
                if(valueMap[newValue] !== undefined) { // if list has that value
                    textField.val(valueMap[newValue]);
                } else {
                    textField.val(newValue);
                }
                return container;
            } else {
                return container.data('value');
            }
        });

        container.overrideNodeMethod('bind', function (events, callback) {
            textField.bind(events, callback);
        });

        container.overrideNodeMethod('changeList', function(newList) {
            changeList(newList);
        });

        textField.change(function(event) {
            if(event.originalEvent) {
                container.val(textField.val());
            }
        });
    });
};
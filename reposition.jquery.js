
(function($,window,undefined){
  // A jQuery object containing all non-window elements to which the resize
  // event is bound.
  var elems = $([]),
    
    // Extend $.resize if it already exists, otherwise create it.
    reposition = $.reposition = $.extend($.reposition, {}),
    timeout_id, // for clearing the interval
    
    dataName = 'reposition-special-event',
  
  // The numeric interval (in milliseconds) at which the resize event polling
  // loop executes. Defaults to 250.  
  	reposition.delay = 250;
      
  $.event.special.reposition = {    
    // Called only when the first 'reposition' event callback is bound on a particular element.
    setup: function() {      
      var elem = $(this);
      elems = elems.add( elem ); // Add this element to the list of internal elements to monitor.
      
      // Initialize data store on the element.
      var pos = elem.position();
      $.data(this, dataName, {t: pos.top, l: pos.left} );
      
      // If this is the first element added, start the polling loop.
      if (elems.length === 1) {
        loop();
      }
    },
    
    // Called only when the last 'resize' event callback is unbound per element.
    teardown: function() {
      var elem = $(this);
      elems = elems.not(elem); // Remove this element from the list of internal elements to monitor.
      elem.removeData(dataName); // Remove any data stored on the element.
      
      // If this is the last element removed, stop the polling loop.
      if (elems.length === 0) {
        clearTimeout(timeout_id);
      }
    }
  };

  function loop() {
    timeout_id = setTimeout(function(){
      elems.each(function() {
        var elem = $(this),
          pos = elem.position(),
          top = pos.top,
          left = pos.left,
          data = $.data(this, dataName);
        
        // If element size has changed since the last time, update the element data store and trigger the 'resize' event.
        if (top !== data.t || left !== data.l) {
		  data.t = top; data.l = left;
          elem.trigger('reposition', [top,left]);
        }        
      });
      
      loop();      
    }, delay);    
  };
    
})(jQuery,this);
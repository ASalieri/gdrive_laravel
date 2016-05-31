function LoaderView() {
  this.template = [
    '<div class="preloader"><div class="loader">Loading...</div></div>'
  ].join('');
}

(function() {
  var self = this;

  self.initialize = function(appendTo) {
    self.appendTo = appendTo;
    return self.render();
  };

  self.render = function () {
    self.loader = $('<div class="preloader"><div class="loader">Loading...</div></div>');
    self.loader.appendTo(self.appendTo);
    return self.loader.hide().fadeIn("fast");
  }

  self.destroy = function() {
    return self.loader.fadeOut("fast", function() {
      return self.loader.remove();
    });
  }
}).call(LoaderView.prototype);
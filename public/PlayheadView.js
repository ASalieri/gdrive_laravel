function PlayheadView() {
  this.tagName = 'div';
  this.className = 'wrapper-playhead';
  this.height = 0;
  this.template = [
    '<div class="wrapper-video">',
    '<video poster="" src="{{video_uri}}" type="video/mp4" controls="controls" height="auto" width="100%">',
    'Your browser does not support the video tag.',
    '</video>',
    '</div>',
    '<div class="wrapper-video-playhead">',
    '<div class="wrapper-playhead">',
    '<img src="{{graph_uri}}" class="img-responsive full-width"/>',
    '<canvas width="1200" height="100"></canvas>',
    '</div>',
    '</div>'
  ].join('');
  this.el = null;
  this.$el = null;
}

(function() {
  this.$render = function(dataset) {
    var template;
    var tpl = Handlebars.compile(this.template);
    template = tpl(dataset);
    this.el = template;
    this.$el = $(this.el);
    this.cvs = this.$el.find("canvas")[0];
    this.ctx = this.cvs.getContext('2d');
    // this.$body = $('body');
    this.$body = $('.wrapper-playhead');
    return this.$el;
  };

  this.setPercentage = function(_percentage) {
    var h, p, start, w, width, x, $container;
    h = $(this.cvs).parent().height();
    $container = $('.'+this.className);
    w = $container.width();
    start = w * .2;
    width = w - start - (w * .148);
    x = start + width * _percentage;

    this.cvs.height = h;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, h);
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.lineWidth = 3;
    return this.ctx.stroke();
  };

}).call(PlayheadView.prototype);
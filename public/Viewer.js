function Viewer() {
  var self = this;
  $(window).bind("resize", function() {
    return self.onResize();
  });
}

(function() {
  var self = this;

  self.main_file = { id: null, name: '', url: ''};
  self.media_assets = [];
  self.playheadView = null;
  self.player = null;
  self.isPlaying = false;
  self.requestId = 0;
  self.contentLoadedCallback = function(){};

  /**
   * Builds HTML from json manifest file, that is fethced form Google Drive.
   * @param data
   * @returns {string}
   */
  self.$getViewContent = function(data) {
    var mainFileContent = "<span class='center'><h1>Invalid file format</h1></span>";

    if (!data.type)
      return mainFileContent;

    switch (data.type.toLowerCase()) {
      case 'coreograph':
        if (data.content.video_uri && data.content.graph_uri) {
          self.playheadView = new PlayheadView();
          mainFileContent = self.playheadView.$render(data.content);
        }
        break;
      case 'reflection':
      case 'report':
        if (data.content && typeof data.content == 'string')
          mainFileContent = $(data.content);
        break;
      default:
        break;
    }

    return mainFileContent;
  };

  self.fetchFilesBuildContentAndDraw = function(main_file_id) {

    var main_request = gapi.client.drive.files.get({
      'fileId': main_file_id,
      'fields': "id,webContentLink,parents,name,originalFilename,fileExtension,kind"
    });

    main_request.execute(function(resp) {
      if (!resp)
        return;

      // Process only 'json' or 'jsonp' files
      if (!resp.fileExtension.toLowerCase().match(/^nysciwork?$/))
        return;

      self.main_file.id = resp.id;
      self.main_file.name = resp.originalFilename;
      self.main_file.url = resp.webContentLink;

      var fetchResourcesDirId = function (project_parent_id, callback) {
        var request = gapi.client.drive.files.list({
          'q' : "'"+project_parent_id+"' in parents and name = 'Resources'",
          'fields': "files(id,name,originalFilename,webContentLink,kind)"
        });

        request.execute(function(resp) {
          if (resp && resp.files && resp.files[0]) {
            callback(resp.files[0].id);
          }
        })
      };

      var getMediaAsstesData = function (files) {
        var media_assets = [];
        for (var i = 0; i < files.length; i++) {
          if (files[i].kind == 'drive#file' && files[i].id != main_file_id) {
            media_assets.push({
              id: files[i].id,
              name: files[i].originalFilename,
              url: files[i].webContentLink
            });
          }
        }
        return media_assets;
      };

      var triggerFetchingMainFile = function(files_data) {
        var main_file_data = self.main_file;
        $.ajax({
          url: main_file_data.url,
          method: "GET",
          async: false,
          dataType: 'jsonp',
          contentType: "application/octet-stream"
        });
      };

      var retrieveAllFilesInFolder = function(folderId, callback) {
        var retrievePageOfChildren = function(request, result) {
          request.execute(function(resp) {
            result.push(resp.files);
            var nextPageToken = resp.nextPageToken;
            if (nextPageToken) {
              request = gapi.client.drive.files.list({
                'q' : "'"+folderId+"' in parents",
                'pageToken': nextPageToken,
                'fields': "files(id,name,originalFilename,webContentLink,kind)"
              });
              retrievePageOfChildren(request, result);
            } else {
              callback(result);
            }
          });
        };
        var initialRequest = gapi.client.drive.files.list({
          'q' : "'"+folderId+"' in parents",
          'fields': "files(id,name,originalFilename,webContentLink,kind)"
        });
        retrievePageOfChildren(initialRequest, []);
      };


      fetchResourcesDirId(resp.parents[0], function (resources_id) {
        retrieveAllFilesInFolder(resources_id, function(files_list) {
          self.media_assets = getMediaAsstesData(files_list[0]);
          triggerFetchingMainFile(self.files_data);
        });
      });
    });
  };

  self.$buildContent = function($main_file_content) {
    var $html, $media, _i, _len, poster;

    $html = $main_file_content;
    $media = $html.filter('video, img')
      .add($html.find('video, img'));
    /* for now, make all images relative to the report. */

    var getMediaUrlFromDrive = function(originalAssetName) {
      var media_assets = self.media_assets;
      for (var i = 0; i < media_assets.length; i++) {
        if (media_assets[i].name == originalAssetName) {
          return media_assets[i].url;
        }
      }
      return originalAssetName;
    };

    var replaceMediaUrl = function (media) {
      var src, poster;

      src = $(media).attr("src");
      if (src)
        $(media).attr("src", (getMediaUrlFromDrive(src)));

      poster = $(media).attr("poster");
      if (poster)
        $(media).attr("poster", getMediaUrlFromDrive(poster));
    };

    for (_i = 0, _len = $media.length; _i < _len; _i++) {
      replaceMediaUrl($media[_i]);
    }

    return $html;
  };

  self.renderView = function (data) {
    var $content;

    // Build content
    $content = self.$buildContent(self.$getViewContent(data));

    var isCoreographContent = function (data) {
      if (!data.type)
        return false;

      var type = data.type.toLowerCase();

      return ('coreograph' === type);
    }

    // Draw
    $('.main-content').html("").append($content);
    // Set video controls for CoreoGraph view
    if (isCoreographContent(data)) {
      self.setCoreographVideoControls();
    }

    self.contentLoadedCallback();

    $('.main-content').show();
  };

  self.setCoreographVideoControls = function () {
    var $video, player, _this = self;

    $video = $('.wrapper-video video');

    _this.player = $video[0];
    _this.isPlaying = false;
    $video.bind('ended', function() {
      return _this.isPlaying = false;
    });
    $video.bind('pause', function() {
      return _this.isPlaying = false;
    });
    $video.bind('playing', function() {
      return _this.isPlaying = true;
    });
    $video.bind('seeking', function () {
      _this.renderFrame(true);
    });

    $('.wrapper-video').click(function() {
      if (_this.player.currentTime === _this.player.duration) {
        _this.player.currentTime = 0;
        return _this.player.load();
      } else {
        if (_this.player.paused) {
          return _this.player.play();
        } else {
          return _this.player.pause();
        }
      }
    });

    _this.percentage = 0;
    return _this.requestId = window.requestAnimFrame(function() {
      return _this.renderFrame();
    });
  };

  self.renderFrame = function(forceRender_) {
    var _this = this;
    if (forceRender_ == null) {
      forceRender_ = false;
    }
    if (_this.player) {
      if (_this.isPlaying || forceRender_) {
        _this.percentage = _this.player.currentTime / _this.player.duration;
        _this.playheadView.setPercentage(_this.percentage);
      }
    }
    return _this.requestId = window.requestAnimFrame(function() {
      return _this.renderFrame();
    });
  };

  self.onResize = function() {
    return self.renderFrame(true);
  };

  self.setContentLoadedCallback = function(callback) {
    if (typeof callback == 'function')
      self.contentLoadedCallback = callback;
  }

}).call(Viewer.prototype);
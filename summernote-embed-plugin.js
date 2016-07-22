(function(factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(window.jQuery);
    }
}(function($) {
  var embedToSummernote = function (context) {
    var self = this;

    var options = context.options;
    var inToolbar = false;

    for (var idx in options.toolbar) {
      // toolbar => [groupName, [list of button]]
      var buttons = options.toolbar[idx][1];
      if ($.inArray('embed', buttons) > -1) {
        inToolbar = true;
        break;
      }
    }

    if (!inToolbar) {
      return;
    }

    var ui = $.summernote.ui;
    var $editor = context.layoutInfo.editor;

    context.memo('button.embed', function () {
      var button = ui.button({
        contents: '<i class="fa fa-share-square-o">',
        tooltip: lang.embedButton.tooltip,
        click: function (event) {
          self.show();
        }
      });

      return button.render();
    });

    this.show = function () {
      context.invoke('editor.saveRange');
    };
  };
});

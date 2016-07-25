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

      self.showEmbedDialog()
        .then(function (data) {
          context.invoke('editor.restoreRange');
          self.insertEmbedToEditor(data.uri);
          ui.hideDialog(self.$dialog);
        }).fail(function () {
          context.invoke('editor.restoreRange');
        });
    };

    this.showEmbedDialog = function () {
      self.$embedInput.value = '';

      return $.Deferred(function (deferred) {
        ui.onDialogShown(self.$dialog, function () {
          context.triggerEvent('dialog.shown');
          self.$embedInput.focus();

          self.$addButton.click(function (event) {
            event.preventDefault();
            deferred.resolve({
              uri: self.embedInput.value
            });
          });
        });

        ui.onDialogHidden(self.$dialog, function () {
          self.$addButton.off('click');
          if (deferred.state() === 'pending') {
            deferred.reject();
          }
        });

        ui.showDialog(self.$dialog);
      });
    };

    this.createDialog = function ($container) {
      var dialogOption = {
        title: 'Title', // Change to dynamic
        body: 'body', // Change body
        footer: 'footer', // Change to button
        closeOnEscape: true
      };

      self.$dialog = ui.dialog(dialogOption).render().appendTo($container);
      self.$addBtn = self.$dialog.find('#btn-add');
      self.$embedInput = self.$dialog.find('#input-autocomplete')[0];
      self.$embedContainer = self.$dialog.find('#embed-in-dialog')[0];
    };

    this.insertEmbedToEditor = function (iframe) {
      var $div = $('<div>');

      $div.css({
        'position': 'relative',
        'padding-top': '25px',
        'padding-bottom': '56.25%',
        'height': '0'
      });

      $iframe = $(iframe, {
        height: '250px'
      });

      $iframe.css({
        'position': 'absolute',
        'top': '0',
        'left': '0',
        'width': '60%',
        'height': '60%'
      });

      $div.html($iframe);
      context.invoke('editor.insertNode', $div[0]);
    };

    this.initialize = function() {
      var $container = options.dialogsInBody ? $(document.body) : $editor;
      self.createDialog($container);
    };

    this.destroy = function() {
      ui.hideDialog(self.$dialog);
      self.$dialog.remove();
    };
  };
});

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
    var lang = options.langInfo;

    context.memo('button.embed', function () {
      var button = ui.button({
        contents: '<i class="note-icon-frame">',
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

          self.$addBtn.click(function (event) {
            event.preventDefault();
            deferred.resolve({
              uri: self.$embedInput.value
            });
          });
        });

        ui.onDialogHidden(self.$dialog, function () {
          self.$addBtn.off('click');
          if (deferred.state() === 'pending') {
            deferred.reject();
          }
        });

        ui.showDialog(self.$dialog);
      });
    };

    this.createDialog = function ($container) {
      var dialogOption = {
        title: lang.embedDialog.title,
        body: '<div class="form-group">' +
        '<label>' + lang.embedDialog.label + '</label>' +
        '<input id="input-autocomplete" class="form-control" type="text" placeholder="' + lang.embedDialog.placeholder + '" />' +
        '</div>',
        footer: '<button href="#" id="btn-add" class="btn btn-primary">' + lang.embedDialog.button + '</button>',
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
        'overflow': 'hidden',
        'padding-top': '25px',
        'padding-bottom': '67.5%',
        'margin-bottom': '10px',
        'height': '0'
      });

      $iframe = $(iframe, {
        height: '250px'
      });

      $iframe.css({
        'position': 'absolute',
        'top': '0',
        'left': '0',
        'width': '100%',
        'height': '100%'
      });

      $div.html($iframe);
      context.invoke('editor.insertNode', $div[0]);
    };

    // This events will be attached when editor is initialized.
    this.events = {
      // This will be called after modules are initialized.
      'summernote.init': function(we, e) {
      }
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

  $.extend(true, $.summernote, {
    lang: {
      'en-US': {
        embedButton: {
          tooltip: "Embed"
        },
        embedDialog: {
          title: "Insert Embed",
          label: "Place name or Address",
          placeholder: "e.g. Eiffel Tower",
          button: "Insert Map"
        }
      }
    },
    plugins: {
      'embed': embedToSummernote
    }
  });
}));

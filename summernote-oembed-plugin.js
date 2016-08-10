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
      if ($.inArray('oembed', buttons) > -1) {
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

    var oEmbedOptions = {
      service: 'https://noembed.com/'
    };

    options.oEmbed = $.extend(oEmbedOptions, options.oEmbed);

    context.memo('button.oembed', function () {
      var button = ui.button({
        contents: '<i class="note-icon-frame">',
        tooltip: lang.oEmbedButton.tooltip,
        click: function (event) {
          self.show();
        }
      });

      return button.render();
    });

    this.show = function () {
      context.invoke('editor.saveRange');

      self.showEmbedDialog()
        .then(function showEmbedDialogCb (data) {
          context.invoke('editor.restoreRange');
          self.insertEmbedToEditor(data.uri);
          ui.hideDialog(self.$dialog);
        }).fail(function () {
          context.invoke('editor.restoreRange');
        });
    };

    this.showEmbedDialog = function () {
      self.disableAddButton();
      self.$embedInput.value = '';

      return $.Deferred(function (deferred) {
        ui.onDialogShown(self.$dialog, function dialogShownCb () {
          context.triggerEvent('dialog.shown');
          self.$embedInput.focus();

          self.$addBtn.on('click', function addEmbedCb (event) {
            event.preventDefault();
            deferred.resolve({
              uri: self.$embedInput.value
            });
          });
        });

        ui.onDialogHidden(self.$dialog, function dialogHiddenCb () {
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
        title: lang.oEmbedDialog.title,
        body: '<div class="form-group">' +
        '<label>' + lang.oEmbedDialog.label + '</label>' +
        '<input id="input-autocomplete" class="form-control" type="text" placeholder="' + lang.oEmbedDialog.placeholder + '" />' +
        '</div>' +
        '<div id="embed-in-dialog"></div>',
        footer: '<button href="#" id="btn-add" class="btn btn-primary">' + lang.oEmbedDialog.button + '</button>',
        closeOnEscape: true
      };

      self.$dialog = ui.dialog(dialogOption).render().appendTo($container);
      self.$addBtn = self.$dialog.find('#btn-add');
      self.$embedInput = self.$dialog.find('#input-autocomplete')[0];
      self.$embedContainer = self.$dialog.find('#embed-in-dialog')[0];
    };

    this.enableAddButton = function() {
      if (self.$embedInput.value && self.$embedInput.value.length > 0) {
        self.$addBtn.attr("disabled", false);
      }
    };

    this.disableAddButton = function() {
      self.$addBtn.attr("disabled", true);
    };

    this.insertEmbedToEditor = function (iframe) {
      var $div = $('<div>');


      $.getJSON(options.oEmbed.service+'?url='+iframe)
        .done(function (data) {
          $div.html(self.normalizeEmbed(data.html));

          context.invoke('editor.insertNode', $div[0]);
          self.$embedContainer.innerHTML = '';
        });
    };

    this.normalizeEmbed = function(data){

    if(data){
      var $div = $('<div>');
    var $iframe = $(data).find("iframe");

    $div.css({
      'position': 'relative',
      'padding-top': '25px',
      'padding-bottom': '56.25%',
      'height': '0'
    });
    $iframe.css({
      'position': 'absolute',
      'top': '0',
      'left': '0',
      'width': '100%',
      'height': '100%'
    });
    $iframe.removeAttr("width");
    $iframe.removeAttr("height");

    $div.html($iframe);

    return $div;

    }  else{
      console.log(lang);
      throw new Error(lang.errorMessage.invalid_provider);
    }

    };

    this.initOembed = function () {

      self.$embedInput.addEventListener('input', function (event) {

        var url = this.value;

        setTimeout(function () {
          if(options.oEmbed.spinner){
            self.$embedContainer.innerHTML = options.oEmbed.spinner;
          }

          $.getJSON(options.oEmbed.service+'?url='+url)
          .done(function (data) {

              var content;
              try{
                content = self.normalizeEmbed(data.html);

              }catch(e){

                content = e.message;
              }

              $(self.$embedContainer).html(content);


            self.enableAddButton();
          });
        }, 1000);
      });
    };

    this.initialize = function() {
      var $container = options.dialogsInBody ? $(document.body) : $editor;
      self.createDialog($container);
    };

    this.destroy = function() {
      ui.hideDialog(self.$dialog);
      self.$dialog.remove();
    };

    this.events = {
      // This will be called after modules are initialized.
      'summernote.init': function(we, e) {
        self.initOembed();
      }
    };

  };

  $.extend(true, $.summernote, {
    lang: {
      'en-US': {
        oEmbedButton: {
          tooltip: "Embed"
        },
        oEmbedDialog: {
          title: "Insert Embed",
          label: "Place your embed url link",
          placeholder: "E.g. https://www.youtube.com/watch?v=sJ9HR-kcZHg",
          button: "Insert"
        },
        errorMessage: {
          invalid_provider: 'Invalid Provider!'
        }
      },
      'pt-BR': {
        oEmbedButton: {
          tooltip: "Adicionar Embed"
        },
        oEmbedDialog: {
          title: "Inserir Embed",
          label: "Coloque a url do seu embed",
          placeholder: "Ex.: https://www.youtube.com/watch?v=sJ9HR-kcZHg",
          button: "Inserir"
        },
        errorMessage: {
          invalid_provider: 'Provedor inválido'
        }
      }
    },
    plugins: {
      'oembed': embedToSummernote
    }
  });
}));

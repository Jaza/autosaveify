/* ========================================================================
 * Autosaveify
 * https://github.com/Jaza/autosaveify
 * ========================================================================
 * Copyright Jeremy Epstein
 * Licensed under Apache License, Version 2.0
 * ======================================================================== */

(function($, _, window) {
  'use strict';

  // AUTOSAVEIFY CLASS DEFINITION
  // ============================

  var toggle      = '[data-toggle="autosaveify"]';
  var Autosaveify = function(el, options) {
    this.$formEl           = null;
    this.options           = null;
    this.save              = null;
    this.successMsgTimeout = null;

    this.init(el, options);
  }

  Autosaveify.VERSION = '0.1.1';

  Autosaveify.DEFAULTS = {
    // How long to wait (in milliseconds) for a user to stop typing,
    // before attempting to do an autosave.
    pendingDelayInMs: 2000,
    // How long the success message should stay visible each time it shows.
    successMsgDurationInMs: 5000,
    hideOnBlur: false,
    fakeSuccess: false,
    saveUrl: null
  };

  Autosaveify.prototype.init = function(el, options) {
    this.$formEl = $(el);

    var elIds = this.getElIds();
    if (!elIds.length) {
      return;
    }

    this.options = $.extend({}, Autosaveify.DEFAULTS, options);

    // Don't need to try and manually check if the full delay has elapsed
    // since last user input, Underscore.js debounce() gives us this for free.
    this.save = _.debounce(
      this.saveNow,
      this.options.pendingDelayInMs);

    this.successMsgTimeout = null;

    var isSaveIcon = this.isSaveIcon();
    var $this = this;

    this.$formEl.addClass('autosaveify-enabled');

    $.each(elIds, function(i, elId) {
      var eventName = (
        $(elId).attr('type') &&
        (['checkbox', 'radio'].indexOf($(elId).attr('type')) !== -1))
          ? 'change'
          : 'input';

      if ($(elId).hasClass('dante-enable')) {
        elId = $this.$formEl.find('.dante-editable')[0];
      }

      $(elId).on(
        eventName + '.autosaveify.data-api', $.proxy($this.saveIfValid, $this));
    });

    // Toggle autosave status visibility depending on when an input box has
    // focus.
    this.$formEl
      .find('.autosaveify-field, .dante-editable')
      .on('focus.autosaveify.data-api', $.proxy(this.showStatus, this))
      .on('blur.autosaveify.data-api', $.proxy(this.hideStatus, this));
  };

  Autosaveify.prototype.isSaveIcon = function() {
    return !(this.$formEl.find('.autosaveify-status-wrapper').length);
  };

  Autosaveify.prototype.getElIds = function() {
    var elIds = [];

    this.$formEl.find('.autosaveify-field[id]').each(function(i) {
      elIds.push('#' + $(this).attr('id'));
    });

    return elIds;
  };

  // Generic function for setting a message that shows the current
  // autosave status, depending on message type and indicator format.
  Autosaveify.prototype.showMsg = function(labelText, messageType) {
    var isSaveIcon = this.isSaveIcon();

    var suffixToRemove1 = null,
        suffixToRemove2 = null,
        suffixToRemove3 = null;

    if (messageType === 'success') {
      suffixToRemove1 = 'warning';
      suffixToRemove2 = 'danger';
      suffixToRemove3 = 'default';
    }
    else if (messageType === 'warning') {
      suffixToRemove1 = 'success';
      suffixToRemove2 = 'danger';
      suffixToRemove3 = 'default';
    }
    else if (messageType === 'danger') {
      suffixToRemove1 = 'success';
      suffixToRemove2 = 'warning';
      suffixToRemove3 = 'default';
    }
    else if (messageType === 'default') {
      suffixToRemove1 = 'success';
      suffixToRemove2 = 'warning';
      suffixToRemove3 = 'danger';
    }

    if (isSaveIcon) {
      if (!(this.$formEl.find('.autosaveify-icon-wrapper').attr('title') === labelText)) {
        var classToAdd = 'btn-' + messageType,
            classToRemove1 = 'btn-' + suffixToRemove1,
            classToRemove2 = 'btn-' + suffixToRemove2,
            classToRemove3 = 'btn-' + suffixToRemove3;

        this.$formEl.find('.autosaveify-icon-wrapper')
          .removeClass(classToRemove1)
          .removeClass(classToRemove2)
          .removeClass(classToRemove3)
          .addClass(classToAdd)
          .attr('title', labelText);
      }
    }
    else {
      if (!(this.$formEl.find('.autosaveify-status').html() === labelText)) {
        var classToAdd = 'alert-' + messageType,
            classToRemove1 = 'alert-' + suffixToRemove1,
            classToRemove2 = 'alert-' + suffixToRemove2,
            classToRemove3 = 'alert-' + suffixToRemove3;

        this.$formEl.find('.autosaveify-status')
          .removeClass(classToRemove1)
          .removeClass(classToRemove2)
          .removeClass(classToRemove3)
          .addClass(classToAdd)
          .find('.autosaveify-status-text').html(labelText);
      }
    }
  };

  Autosaveify.prototype.showSuccessMsg = function(serverMsg) {
    var $this = this;

    var msg = 'Saved';
    if (serverMsg) {
      msg += ': ' + serverMsg;
    }

    clearTimeout(this.successMsgTimeout);
    this.showMsg(msg, 'success');

    this.successMsgTimeout = setTimeout(
      function() {
        $this.showMsg(
          'No changes to save', 'default');
      }, $this.options.successMsgDurationInMs);
  };

  Autosaveify.prototype.saveNow = function() {
    this.$formEl.trigger($.Event('save.autosaveify'));
    var doneEventName = 'saved.autosaveify';

    // More than 'x' ms has passed since the user last inputted
    // something, so we can stop pending.
    this.$formEl.removeClass('autosaveify-pending');

    if (this.options.fakeSuccess) {
      // Fake success.
      this.showSuccessMsg();
      this.$formEl.trigger(doneEventName);
      return;
    }

    // Alert the user that an autosave is now in progress.
    this.showMsg('Saving', 'warning');

    var $this = this;
    var formData = this.$formEl.serializeArray();
    var formMethod = this.$formEl.attr('method');

    var formUrl = this.options.saveUrl
      ? this.options.saveUrl
      : this.$formEl.attr('action');

    this.$formEl.addClass('autosaveify-inprogress');

    // Attempt to perform the autosave via AJAX.
    $.ajax(
      {
        type: formMethod,
        url: formUrl,
        data: formData
      })
      .done(function(data, textStatus, jqXHR) {
        // Yay! Autosave worked. The server may include a custom
        // success message in its response text.
        // Any failure due to validation error should return a status
        // other than 200 (e.g. 400), which will be caught by the fail()
        // handler.
        $this.showSuccessMsg(data);
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        var errorMsg = 'Autosave failed: ';
        if (errorThrown) {
          // Autosave failed due to server returning
          // bad status.
          if (jqXHR.responseText) {
            // Response text provided, could be a 400 error, in which
            // case the response text probably contains a reason why
            // validation failed.
            errorMsg += jqXHR.responseText;
          }
          else {
            // No response text, probably a 500 error.
            errorMsg += 'server encountered an error';
          }
        }
        else {
          // Autosave failed due to server not being
          // reached (probably network error).
          errorMsg += "couldn't connect to server";
        }

        $this.showMsg(errorMsg, 'danger');
      })
      .always(function(a, textStatus, b) {
        $this.$formEl.removeClass('autosaveify-inprogress');
        $this.$formEl.trigger(doneEventName);
      });
  };

  Autosaveify.prototype.validate = function() {
    this.$formEl.trigger($.Event('validate.autosaveify'));
    var doneEventName = 'validated.autosaveify';

    var elIds = this.getElIds();
    if (!elIds.length) {
      this.$formEl.trigger(doneEventName);
      return false;
    }

    var $this = this;
    var isAllRequiredDataProvided = true;

    $.each(elIds, function(i, elId) {
      if ($this.$formEl.find(elId).attr('required') && !($this.$formEl.find(elId).val())) {
        isAllRequiredDataProvided = false;
      }
    });

    // Submission content is required by server-side validation,
    // so don't try to autosave if it's not set yet.
    if (!isAllRequiredDataProvided) {
      var labelText = elIds.length > 1
        ? 'No autosave because some required fields are blank'
        : 'No autosave while content is blank';
      this.showMsg(labelText, 'warning');

      this.$formEl.trigger(doneEventName);
      return false;
    }

    // Don't autosave now if another autosave is already in progress.
    if (this.$formEl.hasClass('autosaveify-inprogress')) {
      this.$formEl.trigger(doneEventName);
      return false;
    }

    this.$formEl.addClass('autosaveify-pending');

    // While we're pending, alert the user that they have
    // unsaved changes at this time.
    this.showMsg('Unsaved changes', 'warning');

    this.$formEl.trigger(doneEventName);
    return true;
  };

  Autosaveify.prototype.saveIfValid = function(e) {
    if (this.validate()) {
      // Every 'x' ms (determined by pendingDelayInMs), see if
      // we can do an autosave.
      this.save();
    }
  };

  Autosaveify.prototype.showStatus = function(e) {
    var isSaveIcon = this.isSaveIcon();

    if (!isSaveIcon) {
      this.$formEl.find('.autosaveify-status-wrapper').removeClass('hidden');
    }

    if (isSaveIcon && this.options.hideOnBlur) {
      this.$formEl.find('.autosaveify-icon-wrapper').removeClass('hidden');
    }

    return true;
  };

  Autosaveify.prototype.hideStatus = function(e) {
    var isSaveIcon = this.isSaveIcon();

    if (!isSaveIcon) {
      this.$formEl.find('.autosaveify-status-wrapper').addClass('hidden');
    }

    if (isSaveIcon && this.options.hideOnBlur) {
      this.$formEl.find('.autosaveify-icon-wrapper').addClass('hidden');
    }

    return true;
  };

  Autosaveify.prototype.destroy = function() {
    clearTimeout(this.successMsgTimeout);

    // Not supported in latest stable Underscore.js (1.8.3).
    // Is supported in Underscore.js master, should be in next stable release.
    // this.save.cancel();

    this.$formEl
      .off('.autosaveify')
      .removeData('autosaveify')
      .removeClass('autosaveify-enabled')
      .removeClass('autosaveify-inprogress')
      .removeClass('autosaveify-pending');

    this.$formEl.find('.autosaveify-field')
      .off('.autosaveify');

    this.$formEl           = null;
    this.options           = null;
    this.save              = null;
    this.successMsgTimeout = null;
  };


  // AUTOSAVEIFY PLUGIN DEFINITION
  // =============================

  function Plugin(option) {
    return this.each(function() {
      var $this   = $(this);
      var data    = $this.data('autosaveify');
      var options = typeof option === 'object' && option;

      if (!data) {
        $this.data('autosaveify', (data = new Autosaveify(this, options)));
      }

      if (typeof option === 'string') {
        data[option]();
      }
    })
  }

  var old = $.fn.autosaveify;

  $.fn.autosaveify             = Plugin;
  $.fn.autosaveify.Constructor = Autosaveify;


  // AUTOSAVEIFY NO CONFLICT
  // =======================

  $.fn.autosaveify.noConflict = function() {
    $.fn.autosaveify = old;
    return this;
  };


  // AUTOSAVEIFY DATA-API
  // ====================

  $(window).on('load', function() {
    $(toggle).each(function() {
      var $formEl = $(this);
      var data = $formEl.data();

      Plugin.call($formEl, data);
    })
  });

}).call(this, jQuery, _, window);

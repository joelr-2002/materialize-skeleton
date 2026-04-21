(function($) {
  'use strict';

  let _defaults = {
    copyText: 'Copy',
    copiedText: 'Copied!'
  };

  /**
   * @class
   *
   */
  class CodeSnippet extends Component {
    /**
     * Construct CodeSnippet instance
     * @constructor
     * @param {Element} el
     * @param {Object} options
     */
    constructor(el, options) {
      super(CodeSnippet, el, options);

      this.el.M_CodeSnippet = this;

      /**
       * Options for the code snippet
       */
      this.options = $.extend({}, CodeSnippet.defaults, options);

      this._setupSnippet();
      this._setupEventHandlers();
    }

    static get defaults() {
      return _defaults;
    }

    static init(els, options) {
      return super.init(this, els, options);
    }

    /**
     * Get Instance
     */
    static getInstance(el) {
      let domElem = !!el.jquery ? el[0] : el;
      return domElem.M_CodeSnippet;
    }

    /**
     * Teardown component
     */
    destroy() {
      this._removeEventHandlers();
      if (this.$copyBtn) {
        this.$copyBtn.remove();
      }
      this.el.M_CodeSnippet = undefined;
    }

    /**
     * Setup Code Snippet
     */
    _setupSnippet() {
      this.$el.addClass('code-snippet');
      this.$el.css('position', 'relative');
      
      // Add copy button
      this.$copyBtn = $(
        '<button class="btn-copy" aria-label="Copy to clipboard" title="Copy to clipboard">' +
        '<i class="material-icons">content_copy</i>' +
        '</button>'
      );
      this.$el.append(this.$copyBtn);
    }

    /**
     * Setup Event Handlers
     */
    _setupEventHandlers() {
      this._handleCopyBound = this._handleCopy.bind(this);
      this.$copyBtn.on('click', this._handleCopyBound);
      
      // Reset state on mouse leave
      this._handleMouseLeaveBound = this._handleMouseLeave.bind(this);
      this.$el.on('mouseleave', this._handleMouseLeaveBound);
    }

    /**
     * Remove Event Handlers
     */
    _removeEventHandlers() {
      this.$copyBtn.off('click', this._handleCopyBound);
      this.$el.off('mouseleave', this._handleMouseLeaveBound);
    }

    /**
     * Handle Copy
     */
    _handleCopy(e) {
      let codeElement = this.el.querySelector('code');
      if (!codeElement) return;

      let textToCopy = codeElement.innerText;
      
      // Use Clipboard API if available
      if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          this._showCopiedState();
        }).catch(err => {
          console.error('Could not copy text: ', err);
        });
      } else {
        // Fallback for older browsers
        let textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          this._showCopiedState();
        } catch (err) {
          console.error('Could not copy text: ', err);
        }
        document.body.removeChild(textArea);
      }
    }
    
    _showCopiedState() {
      this.$copyBtn.html('<i class="material-icons">check</i>');
      this.$copyBtn.addClass('copied');
      if (typeof M !== 'undefined' && M.toast) {
        M.toast({html: this.options.copiedText, displayLength: 2000});
      }
    }
    
    _handleMouseLeave() {
      setTimeout(() => {
        this.$copyBtn.html('<i class="material-icons">content_copy</i>');
        this.$copyBtn.removeClass('copied');
      }, 300);
    }
  }

  M.CodeSnippet = CodeSnippet;

  if (M.jQueryLoaded) {
    M.initializeJqueryWrapper(CodeSnippet, 'codeSnippet', 'M_CodeSnippet');
  }
})(cash);
(function($) {
  'use strict';

  let _defaults = {
    onChange: null,
    clickable: true
  };

  /**
   * @class
   *
   */
  class Steps extends Component {
    /**
     * Construct Steps instance
     * @constructor
     * @param {Element} el
     * @param {Object} options
     */
    constructor(el, options) {
      super(Steps, el, options);

      this.el.M_Steps = this;

      /**
       * Options for the steps
       */
      this.options = $.extend({}, Steps.defaults, options);

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
      return domElem.M_Steps;
    }

    /**
     * Teardown component
     */
    destroy() {
      this._removeEventHandlers();
      this.el.M_Steps = undefined;
    }

    /**
     * Setup Event Handlers
     */
    _setupEventHandlers() {
      this._handleStepClickBound = this._handleStepClick.bind(this);
      
      if (this.options.clickable) {
        this.$el.find('.step').each((stepElem, index) => {
          $(stepElem).on('click', (e) => this._handleStepClickBound(e, index));
        });
      }
    }

    /**
     * Remove Event Handlers
     */
    _removeEventHandlers() {
      this.$el.find('.step').each((stepElem) => {
        $(stepElem).off('click', this._handleStepClickBound);
      });
    }

    /**
     * Handle Step Click
     */
    _handleStepClick(e, index) {
      if (!this.options.clickable) return;
      
      let stepElem = $(e.currentTarget);
      if (stepElem.hasClass('disabled')) return;

      if (typeof this.options.onChange === 'function') {
        this.options.onChange(index, stepElem[0]);
      }
    }
  }

  M.Steps = Steps;

  if (M.jQueryLoaded) {
    M.initializeJqueryWrapper(Steps, 'steps', 'M_Steps');
  }
})(cash);

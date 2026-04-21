(function($) {
  'use strict';

  let _defaults = {
    theme: 'light'
  };

  /**
   * @class
   *
   */
  class Skeleton extends Component {
    /**
     * Construct Skeleton instance
     * @constructor
     * @param {Element} el
     * @param {Object} options
     */
    constructor(el, options) {
      super(Skeleton, el, options);

      this.el.M_Skeleton = this;

      /**
       * Options for the skeleton
       */
      this.options = $.extend({}, Skeleton.defaults, options);

      this._setupSkeleton();
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
      return domElem.M_Skeleton;
    }

    /**
     * Teardown component
     */
    destroy() {
      this.el.M_Skeleton = undefined;
      this.$el.removeClass('skeleton');
    }

    /**
     * Setup skeleton element
     */
    _setupSkeleton() {
      this.$el.addClass('skeleton');
    }
  }

  M.Skeleton = Skeleton;

  if (M.jQueryLoaded) {
    M.initializeJqueryWrapper(Skeleton, 'skeleton', 'M_Skeleton');
  }
})(cash);

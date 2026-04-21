(function($) {
  'use strict';

  let _defaults = {
    data: [], // Tree data structure
    onChange: null // Callback when selection is finalized
  };

  /**
   * @class
   *
   */
  class Cascader extends Component {
    /**
     * Construct Cascader instance
     * @constructor
     * @param {Element} el
     * @param {Object} options
     */
    constructor(el, options) {
      super(Cascader, el, options);

      this.el.M_Cascader = this;

      /**
       * Options for the cascader
       */
      this.options = $.extend({}, Cascader.defaults, options);

      this.isOpen = false;
      this.selectedOptions = [];

      this._setupDropdown();
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
      return domElem.M_Cascader;
    }

    /**
     * Teardown component
     */
    destroy() {
      this._removeEventHandlers();
      if (this.$menus) {
        this.$menus.remove();
      }
      this.el.M_Cascader = undefined;
    }

    _setupDropdown() {
      this.$menus = $('<div class="cascader-menus"></div>');
      $('body').append(this.$menus);
      this._renderColumn(this.options.data, 0);
    }

    _setupEventHandlers() {
      this._handleInputClickBound = this._handleInputClick.bind(this);
      this._handleDocumentClickBound = this._handleDocumentClick.bind(this);

      this.el.addEventListener('click', this._handleInputClickBound);
      document.addEventListener('click', this._handleDocumentClickBound);
    }

    _removeEventHandlers() {
      this.el.removeEventListener('click', this._handleInputClickBound);
      document.removeEventListener('click', this._handleDocumentClickBound);
    }

    _handleInputClick(e) {
      e.stopPropagation();
      this.open();
    }

    _handleDocumentClick(e) {
      if (!this.isOpen) return;
      let $target = $(e.target);
      if (!$target.closest('.cascader-menus').length && $target[0] !== this.el) {
        this.close();
      }
    }

    _renderColumn(data, level) {
      // Remove any columns at this level or deeper
      if (!this.$menus || !this.$menus[0]) return;
      
      let menus = this.$menus[0].querySelectorAll('.cascader-menu');
      for (let i = 0; i < menus.length; i++) {
        if (parseInt(menus[i].getAttribute('data-level')) >= level) {
          menus[i].remove();
        }
      }

      if (!data || !data.length) return;

      let $menu = $('<ul class="cascader-menu"></ul>');
      $menu.attr('data-level', level);

      for (let i = 0; i < data.length; i++) {
        let item = data[i];
        let hasChildren = item.children && item.children.length > 0;
        let $li = $('<li class="cascader-menu-item"></li>');
        
        $li[0].innerHTML = item.label || item.value;
        
        if (hasChildren) {
          let expand = document.createElement('span');
          expand.className = 'cascader-menu-item-expand';
          expand.innerHTML = '&#9656;'; // Right triangle
          $li[0].appendChild(expand);
        }

        $li[0].addEventListener('click', (e) => {
          e.stopPropagation();
          let items = $menu[0].querySelectorAll('.cascader-menu-item');
          for (let j = 0; j < items.length; j++) {
            items[j].classList.remove('active');
          }
          $li[0].classList.add('active');

          this.selectedOptions[level] = item;
          // Clear deeper selections
          this.selectedOptions.splice(level + 1);

          if (hasChildren) {
            this._renderColumn(item.children, level + 1);
          } else {
            this._finishSelection();
          }
        });

        $menu.append($li);
      }

      this.$menus.append($menu);
    }

    _finishSelection() {
      let labels = this.selectedOptions.map(opt => opt.label || opt.value).join(' / ');
      this.$el.val(labels);
      
      if (typeof this.options.onChange === 'function') {
        this.options.onChange(this.selectedOptions);
      }
      this.close();
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      let rect = this.el.getBoundingClientRect();
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      this.$menus.css({
        top: (rect.bottom + scrollTop) + 'px',
        left: (rect.left + scrollLeft) + 'px'
      });
      this.$menus.addClass('active');
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.$menus.removeClass('active');
    }
  }

  M.Cascader = Cascader;

  if (M.jQueryLoaded) {
    M.initializeJqueryWrapper(Cascader, 'cascader', 'M_Cascader');
  }
})(cash);

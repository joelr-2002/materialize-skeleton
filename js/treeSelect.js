(function($) {
  'use strict';

  let _defaults = {
    data: [], // Array of objects with id, title, children
    multiple: false, // If true, checkboxes are shown
    onChange: null, // Callback when selection changes
    closeOnSelect: true // Close dropdown when a leaf node is selected (single select)
  };

  class TreeSelect extends Component {
    constructor(el, options) {
      super(TreeSelect, el, options);

      this.el.M_TreeSelect = this;
      this.options = $.extend({}, TreeSelect.defaults, options);

      this.isOpen = false;
      this.selectedOptions = []; // Array of selected nodes
      this.expandedNodes = new Set(); // Set of expanded node IDs

      this._setupDropdown();
      this._setupEventHandlers();
    }

    static get defaults() {
      return _defaults;
    }

    static init(els, options) {
      return super.init(this, els, options);
    }

    static getInstance(el) {
      let domElem = !!el.jquery ? el[0] : el;
      return domElem.M_TreeSelect;
    }

    destroy() {
      this._removeEventHandlers();
      if (this.$dropdown) {
        this.$dropdown.remove();
      }
      this.el.M_TreeSelect = undefined;
    }

    _setupDropdown() {
      this.$dropdown = $('<div class="tree-select-dropdown"></div>');
      this.$treeContainer = $('<ul class="tree-select-container"></ul>');
      this.$dropdown.append(this.$treeContainer);
      $('body').append(this.$dropdown);
      
      this._renderTree();
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
      if (!$target.closest('.tree-select-dropdown').length && $target[0] !== this.el) {
        this.close();
      }
    }

    _renderTree() {
      this.$treeContainer.empty();
      this._renderNodes(this.options.data, this.$treeContainer, 0);
    }

    _renderNodes(nodes, container, level) {
      nodes.forEach(node => {
        let hasChildren = node.children && node.children.length > 0;
        let isExpanded = this.expandedNodes.has(node.id);
        let isSelected = this.selectedOptions.find(n => n.id === node.id);

        let $li = $(`<li class="tree-node" data-id="${node.id}" data-level="${level}"></li>`);
        
        let paddingLeft = level * 24 + 16;
        let $content = $(`<div class="tree-node-content" style="padding-left: ${paddingLeft}px"></div>`);
        
        if (isSelected) {
          $content.addClass('selected');
        }

        // Expand/Collapse Icon
        let $expandIcon = $('<span class="tree-expand-icon"></span>');
        if (hasChildren) {
          $expandIcon.html(isExpanded ? '&#9662;' : '&#9656;'); // Down / Right triangle
          $expandIcon.on('click', (e) => {
            e.stopPropagation();
            this._toggleNode(node.id);
          });
        } else {
          $expandIcon.addClass('leaf');
        }
        $content.append($expandIcon);

        // Checkbox (if multiple)
        if (this.options.multiple) {
          let checked = isSelected ? 'checked' : '';
          let $checkbox = $(`<label class="tree-checkbox"><input type="checkbox" ${checked} /><span></span></label>`);
          $checkbox.on('click', (e) => {
            e.stopPropagation(); // Let the content click handle selection
          });
          $content.append($checkbox);
        }

        // Title
        let $title = $(`<span class="tree-title">${node.title}</span>`);
        $content.append($title);

        // Click handler for selection
        $content.on('click', (e) => {
          e.stopPropagation();
          this._handleNodeSelect(node);
        });

        $li.append($content);

        // Children container
        if (hasChildren) {
          let $childrenContainer = $('<ul class="tree-children"></ul>');
          if (!isExpanded) {
            $childrenContainer.hide();
          }
          this._renderNodes(node.children, $childrenContainer, level + 1);
          $li.append($childrenContainer);
        }

        container.append($li);
      });
    }

    _toggleNode(id) {
      if (this.expandedNodes.has(id)) {
        this.expandedNodes.delete(id);
      } else {
        this.expandedNodes.add(id);
      }
      this._renderTree();
    }

    _handleNodeSelect(node) {
      if (this.options.multiple) {
        let index = this.selectedOptions.findIndex(n => n.id === node.id);
        if (index > -1) {
          this.selectedOptions.splice(index, 1);
        } else {
          this.selectedOptions.push(node);
        }
      } else {
        this.selectedOptions = [node];
        if (this.options.closeOnSelect && (!node.children || node.children.length === 0)) {
          this.close();
        }
      }

      this._updateInput();
      this._renderTree();

      if (typeof this.options.onChange === 'function') {
        this.options.onChange(this.selectedOptions);
      }
    }

    _updateInput() {
      let titles = this.selectedOptions.map(n => n.title).join(', ');
      this.$el.val(titles);
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      let rect = this.el.getBoundingClientRect();
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      this.$dropdown.css({
        top: (rect.bottom + scrollTop) + 'px',
        left: (rect.left + scrollLeft) + 'px',
        width: rect.width + 'px'
      });
      this.$dropdown.addClass('active');
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.$dropdown.removeClass('active');
    }
  }

  M.TreeSelect = TreeSelect;

  if (M.jQueryLoaded) {
    M.initializeJqueryWrapper(TreeSelect, 'treeSelect', 'M_TreeSelect');
  }
})(cash);
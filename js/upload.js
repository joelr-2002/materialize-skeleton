(function($, document) {
  'use strict';

  let _defaults = {
    action: '',
    name: 'file',
    multiple: false,
    directory: false,
    accept: '',
    listType: 'text', // 'text', 'picture-card', 'picture-circle'
    showUploadList: true,
    defaultFileList: [],
    pastable: false,
    drag: false,
    headers: {},
    beforeUpload: null,
    onChange: null,
    onRemove: null,
    onDrop: null,
    onPreview: null
  };

  class Upload extends Component {
    constructor(el, options) {
      super(Upload, el, options);

      this.el.M_Upload = this;
      this.options = $.extend({}, Upload.defaults, options);

      this.fileList = this.options.defaultFileList.slice();
      this._setupDOM();
      this._setupEventHandlers();
      this._renderFileList();
    }

    static get defaults() {
      return _defaults;
    }

    static init(els, options) {
      return super.init(this, els, options);
    }

    static getInstance(el) {
      let domElem = !!el.jquery ? el[0] : el;
      return domElem.M_Upload;
    }

    destroy() {
      this._removeEventHandlers();
      this.$input.remove();
      if (this.$listContainer) {
        this.$listContainer.remove();
      }
      this.el.M_Upload = undefined;
    }

    _setupDOM() {
      this.$el.addClass('upload-container');
      
      // Create hidden file input
      this.$input = $('<input type="file" class="upload-input">');
      this.$input.attr('name', this.options.name);
      if (this.options.multiple) this.$input.attr('multiple', 'multiple');
      if (this.options.directory) {
        this.$input.attr('webkitdirectory', 'webkitdirectory');
        this.$input.attr('directory', 'directory');
      }
      if (this.options.accept) this.$input.attr('accept', this.options.accept);
      
      this.$el.append(this.$input);

      // Setup dragger classes
      if (this.options.drag) {
        this.$el.addClass('upload-dragger');
      }

      // Setup list container
      if (this.options.showUploadList && this.options.listType !== 'picture-card' && this.options.listType !== 'picture-circle') {
        this.$listContainer = $('<div class="upload-list"></div>');
        this.$el.after(this.$listContainer);
      } else if (this.options.showUploadList) {
        this.$listContainer = $(`<div class="upload-list-${this.options.listType}"></div>`);
        this.$el.before(this.$listContainer);
      }
    }

    _setupEventHandlers() {
      this._handleClickBound = this._handleClick.bind(this);
      this._handleChangeBound = this._handleChange.bind(this);
      this._handleDragOverBound = this._handleDragOver.bind(this);
      this._handleDragLeaveBound = this._handleDragLeave.bind(this);
      this._handleDropBound = this._handleDrop.bind(this);
      this._handlePasteBound = this._handlePaste.bind(this);

      this.el.addEventListener('click', this._handleClickBound);
      this.$input[0].addEventListener('change', this._handleChangeBound);

      if (this.options.drag) {
        this.el.addEventListener('dragover', this._handleDragOverBound);
        this.el.addEventListener('dragleave', this._handleDragLeaveBound);
        this.el.addEventListener('drop', this._handleDropBound);
      }

      if (this.options.pastable) {
        document.addEventListener('paste', this._handlePasteBound);
      }
    }

    _removeEventHandlers() {
      this.el.removeEventListener('click', this._handleClickBound);
      this.$input[0].removeEventListener('change', this._handleChangeBound);

      if (this.options.drag) {
        this.el.removeEventListener('dragover', this._handleDragOverBound);
        this.el.removeEventListener('dragleave', this._handleDragLeaveBound);
        this.el.removeEventListener('drop', this._handleDropBound);
      }

      if (this.options.pastable) {
        document.removeEventListener('paste', this._handlePasteBound);
      }
    }

    _handleClick(e) {
      if (e.target.closest('.upload-list-item-remove')) return;
      if (e.target.closest('.upload-list-item-preview')) return;
      this.$input[0].click();
    }

    _handleDragOver(e) {
      e.preventDefault();
      this.$el.addClass('dragover');
    }

    _handleDragLeave(e) {
      e.preventDefault();
      this.$el.removeClass('dragover');
    }

    _handleDrop(e) {
      e.preventDefault();
      this.$el.removeClass('dragover');
      if (typeof this.options.onDrop === 'function') {
        this.options.onDrop(e);
      }
      let files = e.dataTransfer.files;
      if (files && files.length) {
        this._processFiles(files);
      }
    }

    _handlePaste(e) {
      let items = (e.clipboardData || e.originalEvent.clipboardData).items;
      let files = [];
      for (let index in items) {
        let item = items[index];
        if (item.kind === 'file') {
          let blob = item.getAsFile();
          files.push(blob);
        }
      }
      if (files.length > 0) {
        this._processFiles(files);
      }
    }

    _handleChange(e) {
      let files = e.target.files;
      if (files && files.length) {
        this._processFiles(files);
      }
      // Reset input so same file can be selected again
      this.$input.val('');
    }

    _processFiles(files) {
      let fileArr = Array.from(files);
      
      if (!this.options.multiple) {
        fileArr = [fileArr[0]];
      }

      fileArr.forEach(file => {
        let uid = 'rc-upload-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        let uploadFile = {
          uid: uid,
          name: file.name,
          status: 'uploading',
          percent: 0,
          originFileObj: file,
          size: file.size,
          type: file.type
        };

        let shouldUpload = true;
        let p = Promise.resolve(true);

        if (typeof this.options.beforeUpload === 'function') {
          let result = this.options.beforeUpload(file, fileArr);
          if (result === false) {
            shouldUpload = false;
          } else if (result === Upload.LIST_IGNORE) {
            return; // skip this file
          } else if (result instanceof Promise) {
            p = result.then(res => {
              if (res === false) shouldUpload = false;
              if (res === Upload.LIST_IGNORE) return Promise.reject(Upload.LIST_IGNORE);
            }).catch(err => {
              if (err !== Upload.LIST_IGNORE) shouldUpload = false;
              else return Promise.reject(err);
            });
          }
        }

        p.then(() => {
          if (!shouldUpload) {
            uploadFile.status = 'error';
          }

          if (!this.options.multiple) {
            this.fileList = [uploadFile];
          } else {
            this.fileList.push(uploadFile);
          }

          this._triggerChange(uploadFile);
          this._renderFileList();

          if (shouldUpload && this.options.action) {
            this._uploadFile(uploadFile);
          }
        }).catch(err => {
          if (err === Upload.LIST_IGNORE) {
            // ignore
          }
        });
      });
    }

    _uploadFile(uploadFile) {
      let xhr = new XMLHttpRequest();
      let formData = new FormData();
      formData.append(this.options.name, uploadFile.originFileObj);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          uploadFile.percent = Math.round((e.loaded / e.total) * 100);
          this._triggerChange(uploadFile);
          this._renderFileList();
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          uploadFile.status = 'done';
          try {
            uploadFile.response = JSON.parse(xhr.responseText);
          } catch(e) {
            uploadFile.response = xhr.responseText;
          }
        } else {
          uploadFile.status = 'error';
          uploadFile.error = new Error('Upload Error: ' + xhr.status);
        }
        this._triggerChange(uploadFile);
        this._renderFileList();
      };

      xhr.onerror = () => {
        uploadFile.status = 'error';
        uploadFile.error = new Error('Network Error');
        this._triggerChange(uploadFile);
        this._renderFileList();
      };

      xhr.open('POST', this.options.action, true);
      
      for (let key in this.options.headers) {
        xhr.setRequestHeader(key, this.options.headers[key]);
      }

      xhr.send(formData);
    }

    _triggerChange(file) {
      if (typeof this.options.onChange === 'function') {
        this.options.onChange({
          file: file,
          fileList: this.fileList.slice()
        });
      }
    }

    _handleRemove(file) {
      if (typeof this.options.onRemove === 'function') {
        let result = this.options.onRemove(file);
        if (result === false) return;
        if (result instanceof Promise) {
          result.then(res => {
            if (res !== false) this._removeFileFromList(file);
          });
          return;
        }
      }
      this._removeFileFromList(file);
    }

    _removeFileFromList(file) {
      this.fileList = this.fileList.filter(f => f.uid !== file.uid);
      this._triggerChange($.extend({}, file, { status: 'removed' }));
      this._renderFileList();
    }

    _renderFileList() {
      if (!this.options.showUploadList || !this.$listContainer) return;
      
      this.$listContainer.empty();
      
      this.fileList.forEach(file => {
        let $item;

        if (this.options.listType === 'picture-card' || this.options.listType === 'picture-circle') {
          $item = $(`<div class="upload-list-item ${file.status}"></div>`);
          
          if (file.url || file.thumbUrl) {
            $item.append(`<img src="${file.url || file.thumbUrl}" alt="${file.name}">`);
          } else if (file.originFileObj && file.originFileObj.type.startsWith('image/')) {
            // Generate temporary preview
            let reader = new FileReader();
            reader.onload = (e) => {
              if ($item.find('img').length === 0) {
                file.thumbUrl = e.target.result;
                $item.prepend(`<img src="${e.target.result}" alt="${file.name}">`);
              }
            };
            reader.readAsDataURL(file.originFileObj);
          } else {
            $item.append('<i class="material-icons">insert_drive_file</i>');
          }

          let $actions = $('<div class="upload-list-item-actions"></div>');
          
          let $previewBtn = $('<i class="material-icons upload-list-item-preview">visibility</i>');
          $previewBtn.on('click', (e) => {
            e.stopPropagation();
            if (typeof this.options.onPreview === 'function') this.options.onPreview(file);
          });
          $actions.append($previewBtn);

          let $removeBtn = $('<i class="material-icons upload-list-item-remove">delete</i>');
          $removeBtn.on('click', (e) => {
            e.stopPropagation();
            this._handleRemove(file);
          });
          $actions.append($removeBtn);

          $item.append($actions);

          if (file.status === 'uploading') {
             // add a small progress overlay
             $item.append(`<div style="position:absolute; bottom:0; left:0; height:4px; background:#26a69a; width:${file.percent}%"></div>`);
          }
        } else {
          // Text List
          $item = $(`<div class="upload-list-item upload-list-item-${file.status}"></div>`);
          
          let icon = file.status === 'uploading' ? 'cloud_upload' : (file.status === 'error' ? 'error_outline' : 'attach_file');
          
          let $info = $(`
            <div class="upload-list-item-info">
              <i class="material-icons">${icon}</i>
              <span class="upload-list-item-name">${file.name}</span>
            </div>
          `);
          
          let $removeBtn = $('<i class="material-icons upload-list-item-remove">close</i>');
          $removeBtn.on('click', (e) => {
            e.stopPropagation();
            this._handleRemove(file);
          });

          $item.append($info).append($removeBtn);

          if (file.status === 'uploading') {
            let $progress = $(`
              <div class="upload-list-item-progress">
                <div class="determinate" style="width: ${file.percent}%"></div>
              </div>
            `);
            $item.append($progress);
          }
        }

        this.$listContainer.append($item);
      });
    }
  }

  Upload.LIST_IGNORE = 'LIST_IGNORE';
  M.Upload = Upload;

  if (M.jQueryLoaded) {
    M.initializeJqueryWrapper(Upload, 'upload', 'M_Upload');
  }
})(cash, document);

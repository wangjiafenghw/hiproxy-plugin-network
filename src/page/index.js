/**
 * @file home page module
 * @author zdying
 */

window.modPage = {
  $el: null,

  tableData: [],

  tableDataMap: {},

  init: function () {
    this.$el = $('#js-network-table');
    this.initEvent();
    this.initSocket();
  },

  initEvent: function () {
    this.$el.on('click', 'tbody tr', function (eve) {
      let $curr = $(eve.currentTarget);
      let data = $curr.data();
      let key = data.key;
      let currInfo = this.tableDataMap[key];

      window.networkDetail.show(currInfo);
    }.bind(this));
  },

  initSocket: function () {
    let socket = io('http://127.0.0.1:9998');

    socket.on('pageReady', (data) => {
      console.log('page ready:', data);
    });

    socket.on('data', data => {
      let length = data.toString().length;
      let maxLen = 1 * 1024 * 1024;
      let obj = JSON.parse(data);
      let socketData = obj.socketData || '';
      let path = obj.path;
      let isSocketIOURL = /^\/(socket\.io|network)/.test(path);

      if (isSocketIOURL) {
        console.warn('socket.io本身的请求，忽略');
        return;
      }

      //obj.originLength = socketData.length;

      if (obj.originLength > maxLen) {
        obj.socketData = '内容太长，无法查看！';
      }
      console.log('origin::::', obj);

      this.onArrive(obj);
    });

    socket.on('connectreq', data => {
      if (data.hostname === location.hostname && data.port === '9998') {
        // 忽略插件本身的请求
      } else {
        this.onArrive(data);
      }
    });
  },

  onArrive: function (data) {
    this.tableData.push(data);
    this.renderTable();
  },

  renderTable: function () {
    let data = this.getRenderData();
    let html = this.getTableHTML(data);

    $('#js-table-body').html(html);
    this.scrollToBottom();
  },

  getRenderData: function () {
    let data = this.tableData;

    let renderData = data && data.map((item, index) => {
      let {id, resHeaders = {}, socketData = '', statusCode, url, method, hostname, port, path, time} = item;
      let contentType = resHeaders['content-type'] || '';
      let length = resHeaders['content-length'] || socketData.length;
      let fileType = this.getFileType(item);

      this.tableDataMap[id] = item;
  
      if (item.type === 'connect') {
        return {
          key: id,
          name: ['UNKNOW', 'ssl-error'],
          id: id,
          method: 'CONNECT',
          protocol: 'HTTPS',
          status: '',
          address: hostname + ':' + port,
          targetAddress: '',
          targetPath: '',
          type: '',
          size: 'N/A',
          time: 'N/A'
        };
      }
  
      let {host, protocol = ''} = url;
  
      return {
        key: id,
        name: [item.url.path, fileType],
        id: id,
        method: method,
        protocol: protocol.replace(':', '').toUpperCase(),
        status: statusCode,
        address: host,
        targetAddress: hostname ? hostname + (port ? ':' + port : '') : '',
        targetPath: path || '',
        // type: getContentType(contentType),
        type: contentType,
        size: length, // getSizeLabel(length),
        time: time // getTimeLabel(time)
      };
    });

    return renderData;
  },

  getFileType: function (t) {
    const files = [
      'css', 'file', 'html', 'javascript',
      'jpg', 'png', 'pdf', 'json', 'svg', 'gif', 'ico',
      'txt', 'xml', 'zip'
    ];
    let {resHeaders = {}} = t;
    let contentType = resHeaders['content-type'] || '';
    let fileType = contentType.split(';')[0].split('/')[1] || '';
    if (t.type === 'connect') {
      return 'ssl-error';
    }
  
    fileType = fileType.trim();
  
    if (fileType.indexOf('+')) {
      fileType = fileType.split('+')[0];
    }
  
    if (fileType === 'jpeg') {
      fileType = 'jpg';
    } else if (fileType === 'x-javascript') {
      fileType = 'javascript';
    } else if (fileType === 'x-ico' || fileType === 'x-icon') {
      fileType = 'ico';
    }
  
    if (files.indexOf(fileType) === -1) {
      fileType = 'text';
    }
  
    return fileType;
  },

  getTableHTML: function (data) {
    let html = data.map(item => {
      let arr = item.name[0].split('/');
      return [
        `<tr data-key=${item.key}>`,
        // `  <td>${arr.slice(-1)}<br/><span class="text-gray">${arr.slice(0, -1).join('/')}</span></td>`,
        `  <td>
             <div class="network-name" title="${item.name[0]}">
               <img class="file-type-img" src="../../icons/${item.name[1]}.png" alt="">
               <span class="url-path">
               ${arr.slice(-1)[0] || '/'}<br/><span class="text-gray">${arr.slice(0, -1).join('/')}</span>
               </span>
             </div>
           </td>`,
        `  <td>${item.method}</td>`,
        `  <td>${item.status}<br/><span class="text-gray">${item.statusMessage || ''}</span></td>`,
        `  <td>${item.protocol}</td>`,
        `  <td>${item.address}</td>`,
        `  <td>${item.targetAddress}</td>`,
        `  <td>${item.targetPath}</td>`,
        `  <td>${item.type}</td>`,
        `  <td>${item.size}b</td>`,
        `  <td><strong>${item.time}ms</strong></td>`,
        `</tr>`
      ]
    });

    return html.join('');
  },

  scrollToBottom() {
    let $body = $('#js-body');
    let offsetHeight = $body[0].offsetHeight;
    let scrollHeight = $body[0].scrollHeight;

    $body.scrollTop(scrollHeight - offsetHeight);
  }
}
/*
 akcy.amd.js 1.0
 author:zh
 updatetime: 2015-07-06 11:28
 2015-07-06 11:28 增加了导出方法excelexport
 2015-07-08 11:46 修改了from load 兼容webapi2 传参写法
 2015-07-14 10:17 新增的download方法，添加了两个验证\
 2015-07-21 10:03 增加操作权限验证
 2015-07-28 13:43 修改了fiexd table bug
 2015-08-04 14:41 ui中新增一个浮动停靠控件
 2015-08-20 18:03 增加 ko.dateFormat
 2015-11-05 09:12 扩展date 新增add函数
 2015-11-16 11:24 修复一个knockout在datepicker上value值的问题
 2015-12-02 13:48 fiexd table after先计算一次表头
*/

define(["jquery", "ko"], function ($, ko) {
    var _ = function (selector) {
        return new _.fn.init(selector);
    }

    _.fn = _.prototype = {
        constructor: _,
        init: function (selector) {
            if (!selector) {
                return this;
            }
            this.$dom = $(selector);
        },
        $dom: undefined
    };

    _.fn.init.prototype = _.fn;

    _.version = "1.0";

    //cookie
    _.cookie = function (name, value, options) {
        /// <summary>
        /// 操作cookies方法
        /// name and value given, set cookie
        /// only name given, get cookie
        /// </summary>
        /// <param name="name" type="string">
        /// 键
        /// </param>
        /// <param name="value" type="string">
        /// 值
        /// </param>
        /// <param name="options" type="object">
        /// 参数{expires='',path='',domain='',secure=''}
        /// </param>
        if (typeof value != 'undefined') { // name and value given, set cookie
            options = options || {};
            if (value === null) {
                value = '';
                options.expires = -1;
            }
            var expires = '';
            if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
                var date;
                if (typeof options.expires == 'number') {
                    date = new Date();
                    date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
                } else {
                    date = options.expires;
                }
                expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
            }
            var path = options.path ? '; path=' + options.path : '; path=/';
            var domain = options.domain ? '; domain=' + options.domain : '';
            var secure = options.secure ? '; secure' : '';
            document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
        } else { // only name given, get cookie
            var cookieValue = "";
            if (document.cookie && document.cookie != '') {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i].trim();
                    // Does this cookie string begin with the name we want?
                    if (cookie.substring(0, name.length + 1) == (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
    };

    _.session = {
        set: function (value) {
            return $.Deferred(function (defer) {
                _.cookie("ak_sessionid", value, {expires: 1});
                defer.resolve();
            }).promise();
        },
        get: function () {
            return _.cookie("ak_sessionid");
        }
    };

    _.currentuser = {
        set: function (value) {
            return $.Deferred(function (defer) {
                _.cookie("ak_currentuser", value, {expires: 1});
                defer.resolve();
            }).promise();
        },
        get: function () {
            return _.cookie("ak_currentuser");
        }
    };

    _.apitoken = {
        set: function () {

        },
        get: function () {
            return "1qaz@WSX";
        }
    };

    //viewmodel
    _.viewmodel = {
        modelbase: function (defaultModel) {
            var self = this;
            this.modelName = '';
            this.options = function (options) {
                self.options = new defaultModel(options);
                return this;
            };
            this.getInstance = function () {
                if (typeof (self.options) == "function") {
                    throw Error('perform the "options" first!');
                    return undefined;
                } else if (typeof (self.options) == "object") {
                    return self.options;
                }
            };
            this.optionsExtend = function (options) {
                if (self.getInstance != undefined) {
                    self.options = $.extend(true, options, $.extend(true, {}, self.options, options));
                }
                return this;
            };
            this.bind = function (modelName) {
                this.modelName = modelName;
                if (this.getInstance != undefined) {
                    var viewModel = self.options;
                    //将属性填入viewModel
                    if (viewModel.fields != undefined && typeof (viewModel.fields) == 'function') {
                        for (var i = 0; i < viewModel.fields().length; i++) {
                            viewModel[viewModel.fields()[i].field] = viewModel.fields()[i].value;
                            //原集合取消监控，做reset模版
                            var value = viewModel.fields()[i].value();
                            viewModel.fields()[i].value = value == undefined ? '' : value;
                        }
                    }
                    //绑定viewModel
                    var doms = $("[data-model='" + modelName + "']");
                    if (doms.length > 0) {
                        for (var i = 0; i < doms.length; i++) {
                            ko.applyBindings(viewModel, doms[i]);
                            $(doms[i]).show();
                        }
                    } else {
                        throw new Error("Could not find 'data-model'!")
                    }
                }
                return this;
            };
            this.load = function () {
                this.getInstance().search();
                return this;
            };
            this.convertPostModel = function (obj, fields) {
                for (var item in obj) {
                    for (var index in fields) {
                        //查找表单字段
                        if (item == fields[index]['field']) {
                            //如果表单字段是个数组,就给他用逗号连接
                            if (typeof (obj[item]) == 'object' && obj[item] != null) {
                                obj[item] = obj[item].join(',');
                            }

                            obj.fields[index]["value"] = obj[item];
                        }
                    }
                }
                return obj;
            };
        },
        form: function () {
            var f_self = this;
            var defaultModel = function (options) {
                var self = this;

                //表单字段和输入值
                self.fields = ko.observableArray(options.fields);

                //重置表单属性
                self.reset = function () {
                    var self = f_self.getInstance();
                    for (var i = 0; i < self.fields().length; i++) {
                        self[self.fields()[i].field](self.fields()[i].value);
                    }
                }


                //表单Add提交地址
                self.dataAddUrl = options.dataAddUrl;

                //点击Add按钮
                self.add = function (data, context) {
                    //表单验证
                    if (!_.validate.check($('[data-model=' + f_self.modelName + ']'))) {
                        return false;
                    }
                    ;

                    var self = f_self.getInstance();

                    //点击Add按钮前执行
                    if (self.beforeAdd && self.beforeAdd.call(this, data, context) === false) {
                        return false;
                    }
                    ;

                    var obj = f_self.convertPostModel(ko.toJS(self), self.fields());
                    var json = JSON.stringify(obj);
                    _.ajaxpost(self.dataAddUrl, json).done(function (rst) {
                        if (self.added) self.added(JSON.parse(json), rst);
                    });
                };

                //表单Update提交地址
                self.dataUpdateUrl = options.dataUpdateUrl;

                //点击Update按钮
                self.update = function (data, context) {
                    //表单验证
                    if (!_.validate.check($('[data-model=' + f_self.modelName + ']'))) {
                        return false;
                    }
                    ;

                    var self = f_self.getInstance();

                    //点击Update按钮前执行
                    if (self.beforeUpdate && self.beforeUpdate.call(this, data, context) === false) {
                        return false;
                    }
                    ;

                    var obj = f_self.convertPostModel(ko.toJS(self), self.fields());
                    var json = JSON.stringify(obj);
                    _.ajaxpost(self.dataUpdateUrl, json).done(function (rst) {
                        if (self.updated) self.updated(JSON.parse(json), rst);
                    });
                };

                //表单Delete提交地址
                self.dataDeleteUrl = options.dataDeleteUrl;

                //点击Delete按钮
                self.delete = function () {
                    var data = arguments[0];
                    var actionOrContext = arguments[1];
                    var self = f_self.getInstance();

                    //点击Delete按钮前执行
                    if (self.beforeDelete && self.beforeDelete.call(this, data, actionOrContext) === false) {
                        return false;
                    }
                    ;

                    _.confirm("确认要删除这条数据？", function () {
                        var obj = typeof (actionOrContext) == 'string' ? data : f_self.convertPostModel(ko.toJS(self), self.fields());
                        var json = JSON.stringify(obj);
                        _.ajaxpost(self.dataDeleteUrl, json).done(function (rst) {
                            if (self.deleted) self.deleted(JSON.parse(json), rst);
                        });
                    });
                };
            }
            _.viewmodel.modelbase.call(this, defaultModel);
            this.load = function () {
                if (typeof (arguments[0]) == 'object') {
                    var model = arguments[0];
                    var callback = arguments[1];
                    for (var item in model) {
                        for (var item2 in f_self.getInstance()) {
                            if (item == item2) {
                                f_self.getInstance()[item2](model[item]);
                            }
                        }
                    }
                    if (typeof (callback) == 'function') {
                        callback();
                    }
                } else if (typeof (arguments[0] == 'string') && typeof (arguments[1] == 'object')) {
                    var url = arguments[0];
                    var data = arguments[1];
                    var callback = arguments[2];
                    var urlargs = "";
                    var isHasEmpty = true;
                    for (var item in data) {
                        if (data[item] == '' || data[item] == undefined || data[item] == null) {
                            isHasEmpty = false;
                            break;
                        } else {
                            if (urlargs.length == 0) {
                                urlargs += "?";
                            } else {
                                urlargs += "&";
                            }
                            urlargs += item + "=" + data[item];
                        }
                    }
                    if (isHasEmpty) {
                        _.ajaxpost(url + urlargs).done(function (rst) {
                            //将viewmodel中键拿来比较，如果相同，赋值过去
                            for (var item in rst) {
                                for (var item2 in f_self.getInstance()) {
                                    if (item == item2) {
                                        f_self.getInstance()[item2](rst[item]);
                                    }
                                }
                            }
                            if (typeof (callback) == 'function') {
                                callback(rst);
                            }
                        });
                    }
                }
                return this;
            }
        },
        table: function () {
            var t_self = this;
            var defaultModel = function (options) {
                var self = this;
                self.OpenOrder = function () {
                    var jtoNo = $(this)[0].JTO_No;
                    _.openOrder(jtoNo);
                }
                self.exceptionClick = function () {
                    var jeid = $(this)[0].JE_ID;
                    _.exceptionClick(jeid);
                }
                self.OpenContract = function () {

                    var jtoNo = $(this)[0].PCVC_Contract_No;
                    _.openContract(jtoNo);
                }
                //数据集
                self.recordSet = ko.observableArray();

                //排序
                //orderField，defaultOrderBy & isAsc: 当前排序字段名，默认排序字段名和方向（升序/降序）
                self.orderField = ko.observable(options.defaultOrderBy);
                self.isAsc = ko.observable(false);

                //分页
                self.count = ko.observable();//总记录数
                self.totalPages = ko.observable();//总页数
                self.pageNumbers = ko.observableArray();//页码列表
                self.pageSize = ko.observable(options.pageSize || 10);//显示数
                self.pageSizeStart = ko.observable();//显示数开始值
                self.pageSizeEnd = ko.observable();//显示数结束值
                self.pageIndex = ko.observable(1);//当前页
                self.showStartPagerDot = ko.observable(false);//页面开始部分是否显示点号
                self.showEndPagerDot = ko.observable(false);//页面结束部分是否显示点号
                self.pagerCount = 8;//如果分页的页面太多，截取部分页面进行显示，默认设置显示9个页面

                //固定表头
                self.fixed = ko.observable(options.fixed || false);
                self.fixedHeight = ko.observable(options.fixedHeight || 360);

                //作为显示数据的表格的头部：显示文字和对应的字段名（辅助排序）
                self.headers = ko.observableArray(options.headers);

                //查询地址
                self.dataQueryUrl = options.dataQueryUrl;

                //查询条件：标签和输入值
                self.fields = ko.observableArray(options.fields);

                //Search按钮
                self.search = function () {
                    var self = t_self.getInstance();

                    //点击Search按钮前执行
                    if (self.beforeSearch && self.beforeSearch.call(this) === false) {
                        return false;
                    }
                    ;

                    var obj = t_self.convertPostModel(ko.toJS(self), self.fields());
                    var json = JSON.stringify(obj);
                    _.ajaxpost(self.dataQueryUrl, json).done(function (rst) {
                        self.recordSet(rst.Data);
                        self.count(rst.Count);
                        self.resetPageNumbders();
                        if (self.searched) self.searched(JSON.parse(json), rst);

                        if (self.fixed()) {
                            var $thead1 = t_self.$fixedTableBody.find("table thead");
                            var $thear2 = t_self.$fixedTableHeader.find("table thead");
                            $thead1.html($thear2.html());
                            var $th1 = $thead1.find("tr th");
                            var $th2 = $thear2.find("tr th");
                            $th1.each(function (i, d) {
                                $th2.eq(i).width($(d).width());
                            });

                        }
                    });
                };

                //重置查询属性
                self.reset = function () {
                    var self = t_self.getInstance();
                    for (var i = 0; i < self.fields().length; i++) {
                        self[self.fields()[i].field](self.fields()[i].value);
                    }
                }

                //获取数据之后根据记录数重置页码
                self.resetPageNumbders = function () {
                    var self = t_self.getInstance();
                    //计算显示页数
                    self.totalPages(Math.ceil(self.count() / self.pageSize()));
                    self.pageNumbers.removeAll();
                    var start = 1, end = self.pagerCount;
                    if (self.pageIndex() >= self.pagerCount) {
                        start = self.pageIndex() - Math.floor(self.pagerCount / 2);
                        self.showStartPagerDot(true);
                    } else {
                        self.showStartPagerDot(false);
                    }
                    ;
                    end = start + self.pagerCount - 1;
                    if (end > self.totalPages()) {
                        end = self.totalPages();
                        self.showEndPagerDot(false);
                    } else {
                        self.showEndPagerDot(true);
                    }
                    ;
                    for (var i = start; i <= end; i++) {
                        self.pageNumbers.push(i);
                    }
                    ;
                    //计算显示条数
                    self.pageSizeStart((self.pageIndex() - 1) * self.pageSize() + 1);
                    self.pageSizeEnd(self.pageIndex() * self.pageSize() > self.count() ? self.count() : self.pageIndex() * self.pageSize());
                };

                //点击表格头部进行排序
                self.sort = function (header) {
                    var self = t_self.getInstance();
                    if (self.orderField() == header.field) {
                        self.isAsc(!self.isAsc());
                    }
                    self.orderField(header.field);
                    self.pageIndex(1);
                    self.search();
                };

                //点击页码获取当前页数据
                self.turnPage = function (pageIndex) {
                    var self = t_self.getInstance();
                    self.pageIndex(pageIndex);
                    self.search();
                };

                //首页
                self.firstPage = function () {
                    var self = t_self.getInstance();
                    self.turnPage(1);
                };

                //末页
                self.lastPage = function () {
                    var self = t_self.getInstance();
                    self.turnPage(self.totalPages());
                };

                //上一页
                self.prevPage = function () {
                    var self = t_self.getInstance();
                    if (self.pageIndex() > 1) {
                        self.turnPage(self.pageIndex() - 1);
                    }
                };

                //下一页
                self.nextPage = function () {
                    var self = t_self.getInstance();
                    if (self.pageIndex() < self.totalPages()) {
                        self.turnPage(self.pageIndex() + 1);
                    }
                };

                //刷新数据集
                self.refresh = function () {
                    var self = t_self.getInstance();
                    var array = new Array();
                    for (var i = 0; i < self.recordSet().length; i++) {
                        array.push(self.recordSet()[i]);
                    }
                    self.recordSet.removeAll();
                    self.recordSet(array);
                };
            };
            _.viewmodel.modelbase.call(this, defaultModel);
            _.aop.before(t_self, "bind", function (modelName) {
                var self = t_self.getInstance();
                if (self.fixed()) {

                    var $table;
                    $table = $('[data-model=' + modelName + '] table.forfixed:eq(0)');
                    if ($table.length <= 0) {
                        $table = $('[data-model=' + modelName + '] table:eq(0)')

                    }
                    $table.css("margin", "0px");
                    var $fixedTable = $([
                        '<div class="fixed-table">',
                        '<div class="fixed-table-container">',
                        '<div class="fixed-table-header"></div>',
                        '<div class="fixed-table-body">',
                        '</div>',
                        '</div>',
                        '</div>'].join(''));

                    $fixedTable.insertAfter($table);
                    var $fixedTableContainer = $fixedTable.find('.fixed-table-container').height(self.fixedHeight());
                    var $fixedTableBody = $fixedTable.find('.fixed-table-body').html($table);
                    var $fixedTableHeader = $fixedTable.find('.fixed-table-header');

                    t_self.$table = $table;
                    t_self.$fixedTableContainer = $fixedTableContainer;
                    t_self.$fixedTableBody = $fixedTableBody;
                    t_self.$fixedTableHeader = $fixedTableHeader;
                }
            });
            _.aop.after(t_self, "bind", function (modelName) {
                var self = t_self.getInstance();
                setTimeout(function () {
                    if (self.fixed()) {
                        var getScrollBarWidth = function () {
                            var inner = $('<p/>').addClass('fixed-table-scroll-inner'),
                                outer = $('<div/>').addClass('fixed-table-scroll-outer'),
                                w1, w2;

                            outer.append(inner);
                            $('body').append(outer);

                            w1 = inner[0].offsetWidth;
                            outer.css('overflow', 'scroll');
                            w2 = inner[0].offsetWidth;

                            if (w1 == w2) {
                                w2 = outer[0].clientWidth;
                            }

                            outer.remove();
                            return w1 - w2;
                        };
                        var $thead = t_self.$table.find('thead');
                        var $scrollWidth = t_self.$table.width() > t_self.$fixedTableBody.width() ? getScrollBarWidth() : 0;
                        var $width = t_self.$table.outerWidth();
                        var $class = t_self.$table.attr("class");
                        //把真表头固定了
                        t_self.$fixedTableHeader.css('margin-right', $scrollWidth);
                        $("<table></table>").attr("class", $class).css("margin", "0px").css('width', $width).html($thead).appendTo(t_self.$fixedTableHeader);
                        //制造一个假表头填回table
                        var $oldthead = $thead.clone();
                        var $oldheight = "-" + $thead.height() + "px";
                        //使真表头盖住假表头
                        t_self.$table.prepend($oldthead).css('margin-top', $oldheight);
                        t_self.$fixedTableBody.height(t_self.$fixedTableContainer.height() - $thead.outerHeight());
                        //滚动事件
                        t_self.$fixedTableBody.off('scroll').on('scroll', function () {
                            t_self.$fixedTableHeader.scrollLeft($(this).scrollLeft());
                        });

                        if (self.fixed()) {
                            var $th1 = t_self.$fixedTableBody.find("table thead tr th");
                            var $th2 = t_self.$fixedTableHeader.find("table thead tr th");
                            $th1.each(function (i, d) {
                                $th2.eq(i).width($(d).width());
                            });
                        }
                    }
                }, 1000);
            });
        },
        edittable: function () {
            var et_self = this;
            var defaultModel = function (options) {
                var self = this;

                //数据集
                self.recordSet = ko.observableArray();

                //排序
                //orderField，defaultOrderBy & isAsc: 当前排序字段名，默认排序字段名和方向（升序/降序）
                self.orderField = ko.observable(options.defaultOrderBy);
                self.isAsc = ko.observable(false);

                //分页
                self.count = ko.observable();//总记录数
                self.totalPages = ko.observable();//总页数
                self.pageNumbers = ko.observableArray();//页码列表
                self.pageSize = ko.observable(options.pageSize || 10);//显示数
                self.pageSizeStart = ko.observable();//显示数开始值
                self.pageSizeEnd = ko.observable();//显示数结束值
                self.pageIndex = ko.observable(1);//当前页
                self.showStartPagerDot = ko.observable(false);//页面开始部分是否显示点号
                self.showEndPagerDot = ko.observable(false);//页面结束部分是否显示点号
                self.pagerCount = 8;//如果分页的页面太多，截取部分页面进行显示，默认设置显示9个页面

                //作为显示数据的表格的头部：显示文字和对应的字段名（辅助排序）
                self.headers = ko.observableArray(options.headers);

                //查询地址
                self.dataQueryUrl = options.dataQueryUrl;

                //查询条件：标签和输入值
                self.fields = ko.observableArray(options.fields);

                //Search按钮
                self.search = function () {
                    var self = et_self.getInstance();

                    //点击Search按钮前执行
                    if (self.beforeSearch && self.beforeSearch.call(this) === false) {
                        return false;
                    }
                    ;

                    var obj = et_self.convertPostModel(ko.toJS(self), self.fields());
                    var json = JSON.stringify(obj);
                    _.ajaxpost(self.dataQueryUrl, json).done(function (rst) {
                        self.recordSet(rst.Data);
                        self.count(rst.Count);
                        self.resetPageNumbders();
                        if (self.searched) self.searched(JSON.parse(json), rst);
                    });
                };

                //重置查询属性
                self.reset = function () {
                    var self = et_self.getInstance();
                    for (var i = 0; i < self.fields().length; i++) {
                        self[self.fields()[i].field](self.fields()[i].value);
                    }
                }

                //获取数据之后根据记录数重置页码
                self.resetPageNumbders = function () {
                    var self = et_self.getInstance();
                    //计算显示页数
                    self.totalPages(Math.ceil(self.count() / self.pageSize()));
                    self.pageNumbers.removeAll();
                    var start = 1, end = self.pagerCount;
                    if (self.pageIndex() >= self.pagerCount) {
                        start = self.pageIndex() - Math.floor(self.pagerCount / 2);
                        self.showStartPagerDot(true);
                    } else {
                        self.showStartPagerDot(false);
                    }
                    ;
                    end = start + self.pagerCount - 1;
                    if (end > self.totalPages()) {
                        end = self.totalPages();
                        self.showEndPagerDot(false);
                    } else {
                        self.showEndPagerDot(true);
                    }
                    ;
                    for (var i = start; i <= end; i++) {
                        self.pageNumbers.push(i);
                    }
                    ;
                    //计算显示条数
                    self.pageSizeStart((self.pageIndex() - 1) * self.pageSize() + 1);
                    self.pageSizeEnd(self.pageIndex() * self.pageSize() > self.count() ? self.count() : self.pageIndex() * self.pageSize());
                };

                //点击表格头部进行排序
                self.sort = function (header) {
                    var self = et_self.getInstance();
                    if (self.orderField() == header.field) {
                        self.isAsc(!self.isAsc());
                    }
                    self.orderField(header.field);
                    self.pageIndex(1);
                    self.search();
                };

                //点击页码获取当前页数据
                self.turnPage = function (pageIndex) {
                    var self = et_self.getInstance();
                    self.pageIndex(pageIndex);
                    self.search();
                };

                //首页
                self.firstPage = function () {
                    var self = et_self.getInstance();
                    self.turnPage(1);
                };

                //末页
                self.lastPage = function () {
                    var self = et_self.getInstance();
                    self.turnPage(self.totalPages());
                };

                //上一页
                self.prevPage = function () {
                    var self = et_self.getInstance();
                    if (self.pageIndex() > 1) {
                        self.turnPage(self.pageIndex() - 1);
                    }
                };

                //下一页
                self.nextPage = function () {
                    var self = et_self.getInstance();
                    if (self.pageIndex() < self.totalPages()) {
                        self.turnPage(self.pageIndex() + 1);
                    }
                };

                //刷新数据集
                self.refresh = function () {
                    var self = et_self.getInstance();
                    var array = new Array();
                    for (var i = 0; i < self.recordSet().length; i++) {
                        array.push(self.recordSet()[i]);
                    }
                    self.recordSet.removeAll();
                    self.recordSet(array);
                };

                //数据行模型
                self.rowFields = options.rowFields || function () {
                };

                //点击AddRow按钮
                self.addRow = function () {
                    if (typeof (self.rowFields) == "function") {
                        var row = new self.rowFields();
                        row["new"] = true;
                        this.recordSet.unshift(row);
                    } else {
                        throw new Error("'rowFields' must be constructor;like this  function () { this.fields1 = defaultvalue1 , this.fields2 = defaultvalue2 }");
                    }
                };

                //编辑行Add提交地址
                self.dataAddUrl = options.dataAddUrl;

                //点击编辑行Add按钮
                self.add = function (data, context) {
                    //表单验证
                    if (!_.validate.check($(context.toElement).closest("tr.editable-editrow"))) {
                        return false;
                    }
                    ;

                    var self = et_self.getInstance();

                    //点击Add按钮前执行
                    if (self.beforeAdd && self.beforeAdd.call(this, data, context) === false) {
                        return false;
                    }
                    ;

                    var json = ko.toJSON(data);
                    _.ajaxpost(self.dataAddUrl, json).done(function (rst) {
                        self.edited(data, context);
                        self.search();
                        if (self.added) self.added(JSON.parse(json), rst);
                    });
                };

                //表单Update提交地址
                self.dataUpdateUrl = options.dataUpdateUrl;

                //点击Update按钮
                self.update = function (data, context) {
                    //表单验证
                    if (!_.validate.check($(context.toElement).closest("tr.editable-editrow"))) {
                        return false;
                    }
                    ;

                    var self = et_self.getInstance();

                    //点击Update按钮前执行
                    if (self.beforeUpdate && self.beforeUpdate.call(this, data, context) === false) {
                        return false;
                    }
                    ;

                    var json = ko.toJSON(data);
                    _.ajaxpost(self.dataUpdateUrl, json).done(function (rst) {
                        self.edited(data, context);
                        self.search();
                        if (self.updated) self.updated(JSON.parse(json), rst);
                    });
                };

                // 表单Delete提交地址
                self.dataDeleteUrl = options.dataDeleteUrl;

                //点击Delete按钮
                self.delete = function (data) {
                    _.confirm("确认要删除这条数据？", function () {
                        var self = et_self.getInstance();

                        //点击Delete按钮前执行
                        if (self.beforeDelete && self.beforeDelete.call(this, data, context) === false) {
                            return false;
                        }
                        ;

                        if (data["new"]) {
                            self.recordSet.remove(data);
                            if (self.deleted) self.deleted(JSON.parse(json), rst);
                        } else {
                            var json = ko.toJSON(data);
                            _.ajaxpost(self.dataDeleteUrl, json).done(function (rst) {
                                self.recordSet.remove(data);
                                if (self.deleted) self.deleted(JSON.parse(json), rst);
                            });
                        }
                    });
                };

                //列表提交地址
                self.allSubmitUrl = options.allSubmitUrl;

                //提交整个列表
                self.allSubmit = function () {
                    //表单验证
                    if (!_.validate.check($('[data-model=' + et_self.modelName + ']'))) {
                        return false;
                    }
                    ;

                    var self = et_self.getInstance();

                    //点击recordSetSubmit按钮前执行
                    if (self.beforeAllSubmit && self.beforeAllSubmit.call(this, data, context) === false) {
                        return false;
                    }
                    ;

                    var json = ko.toJSON(self);
                    _.ajaxpost(self.allSubmitUrl, json).done(function (rst) {
                        if (self.allSubmited) self.allSubmited(JSON.parse(json), rst);
                    });
                };

                //显示edit行
                self.editing = function (data, context) {
                    if (context.target.nodeName.toLowerCase() == "a") {
                        var row = $(context.toElement).closest("tr.editable-datarow");
                        row.hide();
                        row.next().show();
                    }
                };

                //隐藏edit行
                self.edited = function (data, context) {
                    if (context.target.nodeName.toLowerCase() == "a") {
                        var row = $(context.toElement).closest("tr.editable-editrow");
                        row.hide();
                        row.prev().show();
                    }
                };
            };
            _.viewmodel.modelbase.call(this, defaultModel);
        },
        structuretree: function () {
            var ot_self = this;
            var defaultModel = function (options) {
                var self = this;

                //数据集
                self.recordSet = ko.observable();

                //获取数据集地址
                self.dataQueryUrl = options.dataQueryUrl;

                //查询数据源
                self.search = function () {
                    var self = ot_self.getInstance();

                    //点击Search按钮前执行
                    if (self.beforeSearch && self.beforeSearch.call(this) === false) {
                        return false;
                    }
                    ;

                    _.ajaxpost(self.dataQueryUrl, undefined).done(function (rst) {
                        self.recordSet(rst);

                        if (self.searched) self.searched(rst);
                    });
                };

                //鼠标进入节点
                self.nodeMouseover = function (data, context) {
                    $(context.toElement).find('.actions').stop(true, true).fadeIn();
                };

                //鼠标移出节点
                self.nodeMouseout = function (data, context) {
                    $(context.toElement).find('.actions').stop(true, true).fadeOut();
                };

                //点击节点
                self.nodeClick = function (data, context) {
                    $(context.toElement).closest("tr").nextAll("tr").fadeToggle("fast");
                };

                //添加子项
                self.addChild = function (data, context) {
                    throw Error('methods "addChild(data, context)" must be override !');
                };

                //点击Update按钮
                self.update = function (data, context) {
                    throw Error('methods "update(data, context)" must be override !');
                };

                //点击Delete按钮
                self.delete = function (data, context) {
                    throw Error('methods "delete(data, context)" must be override !');
                };
            };
            _.viewmodel.modelbase.call(this, defaultModel);
        },
        tree: function () {
            var t_self = this;
            var defaultModel = function (options) {
                var self = this;

                //数据集
                self.recordSet = ko.observable();

                //获取数据集地址
                self.dataQueryUrl = options.dataQueryUrl;

                //查询数据源
                self.search = function () {
                    var self = t_self.getInstance();

                    //点击Search按钮前执行
                    if (self.beforeSearch && self.beforeSearch.call(this) === false) {
                        return false;
                    }
                    ;

                    _.ajaxpost(self.dataQueryUrl, undefined).done(function (rst) {
                        self.recordSet(rst);

                        if (self.searched) self.searched(rst);
                    });
                };

                //点击节点
                self.nodeClick = function (data, context) {
                    var self = t_self.getInstance();

                    //点击Search按钮前执行
                    if (self.beforeNodeClick && self.beforeNodeClick.call(this, data, context) === false) {
                        return false;
                    }
                    ;

                    $('.tree-handle').each(function () {
                        $(this).removeClass('selected');
                    })
                    $(context.toElement).closest('.tree-handle').addClass('selected');
                    if (self.nodeClicked) self.nodeClicked(data, context);
                };

                //折叠动画
                self.folding = function (data, context) {
                    var i = $(context.toElement);
                    if (i.hasClass('fa-minus-square')) {
                        i.removeClass('fa-minus-square').addClass('fa-plus-square');
                        i.attr('data-original-title', '展开').parent().next().fadeOut();
                    } else if (i.hasClass('fa-plus-square')) {
                        i.removeClass('fa-plus-square').addClass('fa-minus-square');
                        i.attr('data-original-title', '收起').parent().next().fadeIn();
                    }
                };
            };
            _.viewmodel.modelbase.call(this, defaultModel);
        }
    };

    _.querymethod = {
        "equal": 0,//等于
        "lessThan": 1,//小于
        "greaterThan": 2,//大于
        "lessThanOrEqual": 3,//小于等于
        "greaterThanOrEqual": 4,//大于等于
        "like": 6,//Like
        "in": 7,//In
        "notEqual": 9,//大于
        "startsWith": 10,//Like
        "endsWith": 11,//Like
        "contains": 12,//Like
        "stdIn": 13//In
    };

    _.form = function () {
        return new _.viewmodel.form();
    };

    _.table = function () {
        return new _.viewmodel.table();
    };

    _.edittable = function () {
        return new _.viewmodel.edittable();
    };

    _.structuretree = function () {
        return new _.viewmodel.structuretree();
    };

    _.tree = function () {
        return new _.viewmodel.tree();
    };

    //cache
    _.cache = {};

    _.createcache = function (requestfun) {
        return function (key, callback) {
            if (!_.cache[key]) {
                _.cache[key] = $.Deferred(function (defer) {
                    requestfun(defer, key);
                }).promise();
            }
            return _.cache[key].done(callback);
        };
    };

    _.ajaxcache = _.createcache(function (defer, url) {
        $.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            beforeSend: function (request) {
                request.setRequestHeader("Token", _.apitoken.get());
                request.setRequestHeader("SessionID", _.session.get());
            },
            success: defer.resolve,
            error: defer.reject
        });
    });

    //aop
    _.aop = {
        before: function (target, method, advice) {
            var original = target[method];
            target[method] = function () {
                advice.apply(this, arguments);
                original.apply(target, arguments);
            }
            return target
        },
        after: function (target, method, advice) {
            var original = target[method];
            target[method] = function () {
                original.apply(target, arguments);
                advice.apply(this, arguments);
                return target;
            }
            return target
        },
        around: function (target, method, advice) {
            var original = target[method];
            target[method] = function () {
                advice.apply(this, arguments);
                original.apply(target, arguments);
                advice.apply(this, arguments);
                return target;
            }
            return target
        }
    };

    //data
    _.validate = {
        message: {
            required: "必须填写该字段",
            remote: "请修正该字段",
            email: "请输入正确格式的电子邮件",
            url: "请输入合法的网址",
            date: "请输入合法的日期",
            dateISO: "请输入合法的日期 (ISO).",
            number: "请输入合法的数字",
            digits: "只能输入大于0的整数",
            ints: "只能输入整数",
            creditcard: "请输入合法的信用卡号",
            equalTo: "请再次输入相同的值",
            accept: "请输入拥有合法后缀名的字符串",
            year: "请输入正确的4位数年份",
            maxlength: "请输入一个长度最多是 {0} 的字符串",
            minlength: "请输入一个长度最少是 {0} 的字符串",
            rangelength: "请输入一个长度介于 {0} 和 {1} 之间的字符串",
            range: "请输入一个介于 {0} 和 {1} 之间的值",
            max: "请输入一个最大为 {0} 的值",
            min: "请输入一个最小为 {0} 的值",
            ip: "请输入合法的IP地址",
            cn: "只能输入中文",
            en: "只能输入英文",
            loginName: "只能输入数字、26个英文字母或者下划线",
            mobile: '请输入正确的手机号码',
            phone: '请输入正确的电话号码'
        },
        check: function (container, msg) {
            var self = this;
            if (container.length == 0) {
                return false;
            }
            this.clear();

            var getval = function (element) {
                if (element.is("span") || element.is("label")) {
                    return element.html().trim();
                }
                var type = element.attr("type"),
                    val = element.val();
                if (type === "radio" || type === "checkbox") {
                    var array = new Array();
                    $("input[name='" + element.attr("name") + "']:checked").each(function () {
                        array.push($(this).val());
                    })
                    return array.join(',');
                }

                if (typeof val === "string") {
                    return val.replace(/\r/g, "");
                }
                return val;
            };

            var checkrules = function (element) {
                var data_rule = element.attr('data-rule');
                if (data_rule == undefined || data_rule == "") {
                    return "";
                }
                var rules = data_rule.split(',');
                var val = getval(element);
                var rst = "";
                for (var i = 0; i < rules.length; i++) {
                    var rule;
                    var param;
                    if (rules[i].split(':').length > 1) {
                        rule = rules[i].split(':')[0];
                        if (rules[i].indexOf('[') != -1 && rules[i].indexOf(']') != -1) {
                            if (rules[i].indexOf('|') == -1) {
                                throw Error('多个参数必须用[]将数据扩起，并且用|分隔')
                            }
                            param = rules[i].toString().replace('[', '').replace(']', '').split('|');
                        } else {
                            param = rules[i].split(':')[1];
                        }
                    } else {
                        rule = rules[i];
                    }

                    for (var j in self.methods) {
                        if (rule == j) {
                            if (self.methods[j](val, param) === false) {
                                rst = String.format(self.message[j], param);
                            }
                        }
                    }
                }
                return rst;
            };

            var showerror = function (element, errMsg) {
                var $group = $(element).closest("div.form-group");
                $group.addClass("has-error");
                var $error = $("<label class='control-label error-label'>" + errMsg + "</label>");
                $(element).closest(".input-group").parent().append($error);
            };

            var valid = true;
            container.find('[data-rule]').each(function () {
                $(this).removeClass('error');
                var rst = checkrules($(this));
                if (rst != "") {
                    valid = false;
                    showerror($(this), rst);
                }
            });
            if (msg == undefined && !valid) {
                _.alert.warning("请改正错误后再进行操作");
            }
            return valid;
        },
        methods: {
            required: function (value) {
                return $.trim(value).length > 0;
            },
            email: function (value) {
                if (this.required(value)) {
                    return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
                } else {
                    return "";
                }
            },
            url: function (value) {
                if (this.required(value)) {
                    return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
                } else {
                    return "";
                }
            },
            date: function (value) {
                if (this.required(value)) {
                    return !/Invalid|NaN/.test(new Date(value).toString());
                } else {
                    return "";
                }
            },
            dateISO: function (value) {
                if (this.required(value)) {
                    return /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(value);
                } else {
                    return "";
                }
            },
            number: function (value) {
                if (this.required(value)) {
                    return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
                } else {
                    return "";
                }
            },
            digits: function (value) {
                if (this.required(value)) {
                    return /^\d+$/.test(value);
                } else {
                    return "";
                }
            },
            creditcard: function (value) {
                if (this.required(value)) {
                    if (/[^0-9 \-]+/.test(value)) {
                        return false;
                    }
                    var nCheck = 0,
                        nDigit = 0,
                        bEven = false;

                    value = value.replace(/\D/g, "");

                    for (var n = value.length - 1; n >= 0; n--) {
                        var cDigit = value.charAt(n);
                        nDigit = parseInt(cDigit, 10);
                        if (bEven) {
                            if ((nDigit *= 2) > 9) {
                                nDigit -= 9;
                            }
                        }
                        nCheck += nDigit;
                        bEven = !bEven;
                    }

                    return (nCheck % 10) === 0;
                } else {
                    return "";
                }
            },
            minlength: function (value, param) {
                if (this.required(value)) {
                    var length = $.isArray(value) ? value.length : value.toString().trim().length;
                    return length >= param;
                } else {
                    return "";
                }
            },
            maxlength: function (value, param) {
                if (this.required(value)) {
                    var length = $.isArray(value) ? value.length : value.toString().trim().length;
                    return length <= param;
                } else {
                    return "";
                }
            },
            rangelength: function (value, param) {
                if (this.required(value)) {
                    var length = $.isArray(value) ? value.length : value.toString().trim().length;
                    return (length >= param[0] && length <= param[1]);
                } else {
                    return "";
                }
            },
            min: function (value, param) {
                if (this.required(value)) {
                    return value >= param;
                } else {
                    return "";
                }
            },
            max: function (value, param) {
                if (this.required(value)) {
                    return value <= param;
                } else {
                    return "";
                }
            },
            range: function (value, param) {
                if (this.required(value)) {
                    return (value >= param[0] && value <= param[1]);
                } else {
                    return "";
                }
            },
            equalTo: function (value, param) {
                if (this.required(value)) {
                    var target = $(param);
                    return value === target.val();
                } else {
                    return "";
                }
            },
            remote: function (value, param) {
                if (this.required(value)) {
                    var rst = false;
                    var data = {};
                    data["data"] = value;
                    $.ajax({
                        async: false,
                        type: "POST",
                        url: param,
                        dataType: 'json',
                        data: data,
                        success: function (rst) {
                            rst = rst;
                        }
                    });
                    return rst;
                } else {
                    return "";
                }
            },
            year: function (value) {
                if (this.required(value)) {
                    if (!value.isPositiveInteger()) {
                        rtn = data_rule[i];
                    } else {
                        if (thisVal.length != 4) {
                            rtn = data_rule[i];
                        }
                    }
                } else {
                    return "";
                }
            },
            ip: function (value) {
                if (this.required(value)) {
                    if ("/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/g".test(value)) {
                        if (RegExp.$1 < 256 && RegExp.$2 < 256 && RegExp.$3 < 256 && RegExp.$4 < 256) {
                            return true;
                        }
                    }
                    return false;
                } else {
                    return "";
                }
            },
            cn: function (value) {
                if (this.required(value)) {
                    return /^[\u4e00-\u9fa5]*$/.test(value);
                } else {
                    return "";
                }
            },
            en: function (value) {
                if (this.required(value)) {
                    return /^[a-zA-Z]*$/.test(value);
                } else {
                    return "";
                }
            },
            loginName: function (value) {
                if (this.required(value)) {
                    return /^\w*$/.test(value);
                } else {
                    return "";
                }
            },
            mobile: function (value) {
                return value.length == 0 || value.length == 11 && /^1[3|4|5|7|8]\d{9}$/.test(value);
            },
            phone: function (value) {
                return value.length == 0 || /^0\d{2,3}-?\d{7,8}$/.test(value) || /^\d{7,8}$/.test(value);
            }
        },
        clear: function () {
            $("div.form-group").each(function () {
                $(this).removeClass("has-error");
                $(this).find(".error-label").remove();
            });
        }
    };

    _.ajaxget = function (url) {
        return $.ajax({
            url: url,
            dataType: "json",
            type: "GET",
            contentType: "application/json; charset=utf-8",
            beforeSend: function (request) {
                request.setRequestHeader("Token", _.apitoken.get());
                request.setRequestHeader("SessionID", _.session.get());
              //  _.showloading();
            },
            complete: function () {
            //    _.hideloading();
            },
            error: _.ajaxerror
        });
    };

    _.ajaxpost = function (url, data) {
        return $.ajax({
            url: url,
            dataType: "json",
            type: "POST",
            contentType: "application/json; charset=utf-8",
            data: data,
            beforeSend: function (request) {
                request.setRequestHeader("Token", _.apitoken.get());
                request.setRequestHeader("SessionID", _.session.get());
                _.showloading();
            },
            complete: function () {
                _.hideloading();
            },
            error: _.ajaxerror
        });
    };

    _.ajaxpostsilent = function (url, data) {
        return $.ajax({
            url: url,
            dataType: "json",
            type: "POST",
            beforeSend: function (request) {
                request.setRequestHeader("Token", _.apitoken.get());
                request.setRequestHeader("SessionID", _.session.get());
            },
            contentType: "application/json; charset=utf-8",
            data: data
        });
    };

    _.ajaxerror = function (XMLHttpRequest, textStatus, errorThrown) {
        /// <summary>交互错误统一处理方法</summary>
        var message = '{0} Code:{1}';
        var status = XMLHttpRequest.status;
        switch (status) {
            case 403:
                _.alert.error('未获得权限，请联系管理员!');
                break;
            case 401:
                _.alert.error('您的登录凭证过期,请重新登录!');
                break;
            case 404:
                _.alert.error('请求未找到!');
                break;
            case 500:
                _.alert.error('内部服务器错误!');
                break;
            case 501:
                _.alert.error(XMLHttpRequest.responseJSON);
                break;
            default:
                _.alert.error(String.format(message, '服务不可用!', status));
                break;
        }
    };

    //ui
    _.showloading = function (msg) {
        return $.Deferred(function (defer) {
            if (typeof (window.showloading) == "function") {
                window.showloading(msg);
            } else {
                window.parent.showloading(msg);
            }
            defer.resolve();
        }).promise();
    };

    _.hideloading = function (callback) {
        return $.Deferred(function (defer) {
            if (typeof (window.hideloading) == "function") {
                window.hideloading();
            } else {
                window.parent.hideloading();
            }
            defer.resolve();
        }).promise();
    };

    _.alert = {
        error: function (msg) {
            if (typeof (window.showalert) == "function") {
                window.showalert("error", msg);
            } else {
                window.parent.showalert("error", msg);
            }
        },
        warning: function (msg) {
            if (typeof (window.showalert) == "function") {
                window.showalert("warning", msg);
            } else {
                window.parent.showalert("warning", msg);
            }
        },
        success: function (msg) {
            if (typeof (window.showalert) == "function") {
                window.showalert("success", msg);
            } else {
                window.parent.showalert("success", msg);
            }
        },
        info: function (msg) {
            if (typeof (window.showalert) == "function") {
                window.showalert("info", msg);
            } else {
                window.parent.showalert("info", msg);
            }
        }
    };

    _.confirm = function (msg, callback) {
        if (typeof (window.showconfirm) == "function") {
            window.showconfirm(msg, callback);
        } else {
            window.parent.showconfirm(msg, callback);
        }
    };

    _.showmodal = function (id) {
        return $.Deferred(function (defer) {
            $('#' + id).modal({
                backdrop: 'static',
                keyboard: false
            }).on("shown.bs.modal", function () {
                defer.resolve();
            });
        }).promise();
    };

    _.hidemodal = function (id) {
        return $.Deferred(function (defer) {
            $('#' + id).modal('hide').on("hidden.bs.modal", function () {
                defer.resolve();
            });
            ;
        }).promise();
    };

    _.openwindow = function (title, pageid, refresh, url) {
        if (typeof (window.openwindow) == "function") {
            window.openwindow(title, pageid, refresh, url);
        } else {
            window.parent.openwindow(title, pageid, refresh, url);
        }
    };

    _.showupload = function (callback, data, exts, isauto, ismulti) {
        return $.Deferred(function (defer) {
            if (typeof (window.showupload) == "function") {
                window.showupload(callback, data, exts, isauto || false, ismulti || true);
            } else {
                window.parent.showupload(callback, data, exts, isauto || false, ismulti || true);
            }
            defer.resolve();
        }).promise();
    };

    _.download = function (src) {
        return $.Deferred(function (defer) {
            if (typeof (window.download) == "function") {
                window.download(src);
            } else {
                window.parent.download(src);
            }

        }).promise();
    };

    _.exceptionClick = function (jeID) {
        return $.Deferred(function (order) {

            if (typeof (window.exceptionClick) == "function") {
                window.exceptionClick(jeID);

            } else {
                window.parent.exceptionClick(jeID);
            }
        }).promise();


    }

    _.openOrder = function (orderNo) {
        return $.Deferred(function (order) {

            if (typeof (window.openOrder) == "function") {
                window.openOrder(orderNo);

            } else {
                window.parent.openOrder(orderNo);
            }
        }).promise();


    }

    _.openContract = function (contractNo) {
        return $.Deferred(function (contract) {

            if (typeof (window.openContract) == "function") {
                window.openContract(contractNo);

            } else {
                window.parent.openContract(contractNo);
            }
        }).promise();


    }
    _.excelexport = function (tableSearch, excalCode, user, subTitle, extra, info, sql) {
        var parStr;
        if (excalCode != undefined) {
            parStr = "excalCode=" + excalCode;
        }
        if (user != undefined) {
            parStr += "&user=" + user;
        }
        if (subTitle != undefined) {
            parStr += "&subTitle=" + subTitle;
        }
        if (extra != undefined) {
            parStr += "&extra=" + extra;
        }
        if (info != undefined) {
            parStr += "&info=" + info;
        }
        if (sql != undefined) {
            parStr += "&sql=" + sql;
        }
        var parTplt = "&{0}${1}={2}";
        if (tableSearch != undefined) {
            var obj = tableSearch.convertPostModel(ko.toJS(tableSearch.getInstance()), tableSearch.getInstance().fields());
            for (var item in obj) {
                for (var i = 0; i < tableSearch.getInstance().fields().length; i++) {
                    if (item == tableSearch.getInstance().fields()[i].field) {
                        if (obj[item] != "" && obj[item] != undefined) {
                            parStr += String.format(parTplt, tableSearch.getInstance().fields()[i].field, tableSearch.getInstance().fields()[i].method, obj[item]);
                        }
                    }
                }
            }
        }
        _.download("/excelexport?" + parStr);
    }
    _.txtexport = function (tableSearch, txtCode, user, branchName, ids) {
        var parStr;
        if (txtCode != undefined) {
            parStr = "txtCode=" + txtCode;
        }
        if (user != undefined && user != '') {
            parStr += "&user=" + user;
        }
        if (branchName != undefined && branchName != '') {
            parStr += "&branchName=" + branchName;
        }
        if (ids != undefined && ids != '') {
            parStr += "&ids=" + ids;
        }
        var parTplt = "&{0}${1}={2}";
        if (tableSearch != undefined) {
            var obj = tableSearch.convertPostModel(ko.toJS(tableSearch.getInstance()), tableSearch.getInstance().fields());
            for (var item in obj) {
                for (var i = 0; i < tableSearch.getInstance().fields().length; i++) {
                    if (item == tableSearch.getInstance().fields()[i].field) {
                        if (obj[item] != "" && obj[item] != undefined) {
                            parStr += String.format(parTplt, tableSearch.getInstance().fields()[i].field, tableSearch.getInstance().fields()[i].method, obj[item]);
                        }
                    }
                }
            }
        }
        _.download("/txtexport?" + parStr);

    }
    _.ui = function () {

        // IE mode
        var isRTL = false;
        var isIE8 = false;
        var isIE9 = false;
        var isIE10 = false;

        var resizeHandlers = [];

        var globalImgPath = 'global/img/';

        var globalPluginsPath = 'global/plugins/';

        var globalCssPath = 'global/css/';

        // theme layout color set

        var brandColors = {
            'blue': '#89C4F4',
            'red': '#F3565D',
            'green': '#1bbc9b',
            'purple': '#9b59b6',
            'grey': '#95a5a6',
            'yellow': '#F8CB00'
        };


        var newUi = function () {
            (function ($) {

                // $('#side-nav').metisMenu();

                $('[data-toggle="popover"]').popover();

                $('[data-toggle="tooltip"]').tooltip();

                $(".mobile-menu-icon").on("click", function (event) {
                    event.preventDefault();
                });

                var $window = $(window), $container = $('div.page-container');

                $(".sidebar-collapse-icon").on("click", function (event) {
                    event.preventDefault();
                    $container.toggleClass('sidebar-collapsed').toggleClass('can-resize');
                });

                var $is_collapsed = false;
                if ($container.hasClass('sidebar-collapsed')) {
                    $is_collapsed = true;
                }
                $(window).on("resize", function () {

                    var window_width = $window.outerWidth();
                    if (window_width < 951 && window_width > 767) {
                        if ($container.hasClass('can-resize') === false) {
                            $container.addClass('sidebar-collapsed');
                        }
                    } else if (window_width < 767) {
                        $container.removeClass('sidebar-collapsed');
                        $container.removeClass('can-resize');
                    } else {
                        if ($container.hasClass('can-resize') === false && $is_collapsed === false) {
                            $container.removeClass('sidebar-collapsed');
                        }
                    }

                }).trigger('resize');

                $('body').on('click', '.panel > .panel-heading > .panel-tool-options li > a[data-rel="reload"]', function (ev) {
                    ev.preventDefault();

                    var $this = $(this).closest('.panel');

                    $this.block({
                        message: '',
                        css: {
                            border: 'none',
                            padding: '15px',
                            backgroundColor: '#fff',
                            '-webkit-border-radius': '10px',
                            '-moz-border-radius': '10px',
                            opacity: .5,
                            color: '#fff',
                            width: '50%'
                        },
                        overlayCSS: {backgroundColor: '#FFF'}
                    });
                    $this.addClass('reloading');

                    setTimeout(function () {
                        $this.unblock();
                        $this.removeClass('reloading');
                    }, 900);

                }).on('click', '.panel > .panel-heading > .panel-tool-options li > a[data-rel="close"]', function (ev) {
                    ev.preventDefault();

                    var $this = $(this);
                    var $panel = $this.closest('.panel');

                    $panel.fadeOut(500, function () {
                        $panel.remove();
                    });

                }).on('click', '.panel > .panel-heading > .panel-tool-options li > a[data-rel="collapse"]', function (ev) {
                    ev.preventDefault();

                    var $this = $(this),
                        $panel = $this.closest('.panel'),
                        $body = $panel.children('.panel-body, .table'),
                        do_collapse = !$panel.hasClass('panel-collapse');

                    if ($panel.is('[data-collapsed="1"]')) {
                        $panel.attr('data-collapsed', 0);
                        $body.hide();
                        do_collapse = false;
                    }

                    if (do_collapse) {
                        $body.slideUp('normal');
                        $panel.addClass('panel-collapse');
                    } else {
                        $body.slideDown('normal');
                        $panel.removeClass('panel-collapse');
                    }
                });

                // removeable-list -- remove parent elements
                var $removalList = $(".removeable-list");
                $(".removeable-list .remove").each(function () {
                    var $this = $(this);
                    $this.on("click", function (event) {
                        event.preventDefault();

                        var $parent = $this.parent('li');
                        $parent.slideUp(500, function () {
                            $parent.delay(3000).remove();

                            if ($removalList.find("li").length == 0) {
                                $removalList.html('<li class="text-danger"><p>All items has been deleted.</p></li>');
                            }
                        });
                    });
                });

                var $filterBtn = $(".toggle-filter");
                var $filterBoxId = $filterBtn.attr('data-block-id');
                var $filterBox = $('#' + $filterBoxId);

                if ($filterBox.hasClass('visible-box')) {
                    $filterBtn.parent('li').addClass('active');
                }

                $filterBtn.on("click", function (event) {
                    event.preventDefault();

                    if ($filterBox.hasClass('visible-box')) {
                        $filterBtn.parent('li').removeClass('active');
                        $filterBox.removeClass('visible-box').addClass('hidden-box').slideUp();
                    } else {
                        $filterBtn.parent('li').addClass('active');
                        $filterBox.removeClass('hidden-box').addClass('visible-box').slideDown();
                    }
                });
            })(jQuery);

            function showTooltip(x, y, contents) {
                var $windowWidth = $(window).width();
                var leftValue = x + 20;
                var toolTipWidth = 160;
                if ($windowWidth < (leftValue + toolTipWidth)) {
                    leftValue = x - 32 - toolTipWidth;
                }

                $('<div id="flotTip" > ' + contents + ' </div>').css({
                    top: y - 16,
                    left: leftValue,
                    position: 'absolute',
                    padding: '5px 10px',
                    border: '1px solid #111111',
                    'min-width': toolTipWidth,
                    background: '#ffffff',
                    background: '-moz-linear-gradient(top,  #ffffff 0%, #f9f9f9 100%)',
                    background: '-webkit-gradient(linear, left top, left bottom, color-stop(0%,#ffffff), color-stop(100%,#f9f9f9))',
                    background: '-webkit-linear-gradient(top,  #ffffff 0%,#f9f9f9 100%)',
                    background: '-o-linear-gradient(top,  #ffffff 0%,#f9f9f9 100%)',
                    background: '-ms-linear-gradient(top,  #ffffff 0%,#f9f9f9 100%)',
                    background: 'linear-gradient(to bottom,  #ffffff 0%,#f9f9f9 100%)',
                    '-webkit-border-radius': '5px',
                    '-moz-border-radius': '5px',
                    'border-radius': '5px',
                    'z-index': '100'
                }).appendTo('body').fadeIn();
            }

            /*
             * This function will remove its parent element
             *
             * @param $eleObj
             * @param $parentEle
             */

            function removeElement($ele, $parentEle) {
                var $this = $($ele);
                $this.parent($parentEle).css({
                    opacity: '0'
                });
            }

        }
        var newPage = function () {

        }

        // initializes main settings
        var handleInit = function () {

            if ($('body').css('direction') === 'rtl') {
                isRTL = true;
            }

            isIE8 = !!navigator.userAgent.match(/MSIE 8.0/);
            isIE9 = !!navigator.userAgent.match(/MSIE 9.0/);
            isIE10 = !!navigator.userAgent.match(/MSIE 10.0/);

            if (isIE10) {
                $('html').addClass('ie10'); // detect IE10 version
            }

            if (isIE10 || isIE9 || isIE8) {
                $('html').addClass('ie'); // detect IE10 version
            }
        };

        // runs callback functions set by _.ui.addResponsiveHandler().
        var _runResizeHandlers = function () {
            // reinitialize other subscribed elements
            for (var i = 0; i < resizeHandlers.length; i++) {
                var each = resizeHandlers[i];
                each.call();
            }
        };

        // Hanlde 100% height elements(block, portlet, etc)
        var handle100HeightContent = function () {

            var target = $('.full-height-content');
            var resBreakpointMd = _.ui.getResponsiveBreakpoint('md');
            var height;

            height = _.ui.getViewPort().height -
                $('.page-header').outerHeight(true) -
                $('.page-footer').outerHeight(true) -
                $('.page-title').outerHeight(true) -
                $('.page-bar').outerHeight(true);

            if (target.hasClass('portlet')) {
                var portletBody = target.find('.portlet-body');

                if (_.ui.getViewPort().width < resBreakpointMd) {
                    _.ui.destroySlimScroll(portletBody.find('.full-height-content-body')); // destroy slimscroll
                    return;
                }

                height = height -
                    target.find('.portlet-title').outerHeight(true) -
                    parseInt(target.find('.portlet-body').css('padding-top')) -
                    parseInt(target.find('.portlet-body').css('padding-bottom')) - 2;

                if (target.hasClass("full-height-content-scrollable")) {
                    height = height - 35;
                    portletBody.find('.full-height-content-body').css('height', height);
                    _.ui.initSlimScroll(portletBody.find('.full-height-content-body'));
                } else {
                    portletBody.css('min-height', height);
                }
            } else {
                if (_.ui.getViewPort().width < resBreakpointMd) {
                    _.ui.destroySlimScroll(target.find('.full-height-content-body')); // destroy slimscroll
                    return;
                }

                if (target.hasClass("full-height-content-scrollable")) {
                    height = height - 35;
                    target.find('.full-height-content-body').css('height', height);
                    _.ui.initSlimScroll(target.find('.full-height-content-body'));
                } else {
                    target.css('min-height', height);
                }
            }
        };

        // handle the layout reinitialization on window resize
        var handleOnResize = function () {
            var resize;
            if (isIE8) {
                var currheight;
                $(window).resize(function () {
                    if (currheight == document.documentElement.clientHeight) {
                        return; //quite event since only body resized not window.
                    }
                    if (resize) {
                        clearTimeout(resize);
                    }
                    resize = setTimeout(function () {
                        _runResizeHandlers();
                    }, 50); // wait 50ms until window resize finishes.
                    currheight = document.documentElement.clientHeight; // store last body client height
                });
            } else {
                $(window).resize(function () {
                    if (resize) {
                        clearTimeout(resize);
                    }
                    resize = setTimeout(function () {
                        _runResizeHandlers();
                    }, 50); // wait 50ms until window resize finishes.
                });
            }
        };

        // Handles portlet tools & actions
        var handlePortletTools = function () {
            // handle portlet remove
            $('body').on('click', '.portlet > .portlet-title > .tools > a.remove', function (e) {
                e.preventDefault();
                var portlet = $(this).closest(".portlet");

                if ($('body').hasClass('page-portlet-fullscreen')) {
                    $('body').removeClass('page-portlet-fullscreen');
                }

                portlet.find('.portlet-title a').tooltip('destroy');

                portlet.remove();
            });

            // handle portlet fullscreen
            $('body').on('click', '.portlet > .portlet-title .fullscreen', function (e) {
                e.preventDefault();
                var portlet = $(this).closest(".portlet");
                if (portlet.hasClass('portlet-fullscreen')) {
                    $(this).removeClass('on');
                    portlet.removeClass('portlet-fullscreen');
                    $('body').removeClass('page-portlet-fullscreen');
                    portlet.children('.portlet-body').css('height', 'auto');
                } else {
                    var height = _.ui.getViewPort().height -
                        portlet.children('.portlet-title').outerHeight() -
                        parseInt(portlet.children('.portlet-body').css('padding-top')) -
                        parseInt(portlet.children('.portlet-body').css('padding-bottom'));

                    $(this).addClass('on');
                    portlet.addClass('portlet-fullscreen');
                    $('body').addClass('page-portlet-fullscreen');
                    portlet.children('.portlet-body').css('height', height);
                }
            });

            $('body').on('click', '.portlet > .portlet-title > .tools > .collapse, .portlet .portlet-title > .tools > .expand', function (e) {
                e.preventDefault();
                var el = $(this).closest(".portlet").children(".portlet-body");
                if ($(this).hasClass("collapse")) {
                    $(this).removeClass("collapse").addClass("expand");
                    el.slideUp(200);
                } else {
                    $(this).removeClass("expand").addClass("collapse");
                    el.slideDown(200);
                }
            });
        };

        // Handlesmaterial design checkboxes
        var handleMaterialDesign = function () {

            // Material design ckeckbox and radio effects
            $('body').on('click', '.md-checkbox > label, .md-radio > label', function () {
                var the = $(this);
                // find the first span which is our circle/bubble
                var el = $(this).children('span:first-child');

                // add the bubble class (we do this so it doesnt show on page load)
                el.addClass('inc');

                // clone it
                var newone = el.clone(true);

                // add the cloned version before our original
                el.before(newone);

                // remove the original so that it is ready to run on next click
                $("." + el.attr("class") + ":last", the).remove();
            });

            if ($('body').hasClass('page-md')) {
                // Material design click effect
                // credit where credit's due; http://thecodeplayer.com/walkthrough/ripple-click-effect-google-material-design
                $('body').on('click', 'a.btn, button.btn, input.btn, label.btn', function (e) {
                    var element, circle, d, x, y;

                    element = $(this);

                    if (element.find(".md-click-circle").length == 0) {
                        element.prepend("<span class='md-click-circle'></span>");
                    }

                    circle = element.find(".md-click-circle");
                    circle.removeClass("md-click-animate");

                    if (!circle.height() && !circle.width()) {
                        d = Math.max(element.outerWidth(), element.outerHeight());
                        circle.css({height: d, width: d});
                    }

                    x = e.pageX - element.offset().left - circle.width() / 2;
                    y = e.pageY - element.offset().top - circle.height() / 2;

                    circle.css({top: y + 'px', left: x + 'px'}).addClass("md-click-animate");
                });
            }

            // Floating labels
            var handleInput = function (el) {
                if (el.val() != "") {
                    el.addClass('edited');
                } else {
                    el.removeClass('edited');
                }
            }

            $('body').on('keydown', '.form-md-floating-label > .form-control', function (e) {
                handleInput($(this));
            });
            $('body').on('blur', '.form-md-floating-label > .form-control', function (e) {
                handleInput($(this));
            });
        }

        // Handles custom checkboxes & radios using jQuery iCheck plugin
        var handleiCheck = function () {
            if (!$().iCheck) {
                return;
            }

            $('.icheck').each(function () {
                var checkboxClass = $(this).attr('data-checkbox') ? $(this).attr('data-checkbox') : 'icheckbox_minimal-grey';
                var radioClass = $(this).attr('data-radio') ? $(this).attr('data-radio') : 'iradio_minimal-grey';

                if (checkboxClass.indexOf('_line') > -1 || radioClass.indexOf('_line') > -1) {
                    $(this).iCheck({
                        checkboxClass: checkboxClass,
                        radioClass: radioClass,
                        insert: '<div class="icheck_line-icon"></div>' + $(this).attr("data-label")
                    });
                } else {
                    $(this).iCheck({
                        checkboxClass: checkboxClass,
                        radioClass: radioClass
                    });
                }
            });
        };

        var handlePortamento = function () {
            if (!$().portamento) {
                return;
            }
            ;
            $(".portamento").portamento();
        }

        // Handles Bootstrap switches
        var handleBootstrapSwitch = function () {
            if (!$().bootstrapSwitch) {
                return;
            }
            $('.make-switch').bootstrapSwitch();
        };

        // Handles Bootstrap confirmations
        var handleBootstrapConfirmation = function () {
            if (!$().confirmation) {
                return;
            }
            $('[data-toggle=confirmation]').confirmation({
                container: 'body',
                btnOkClass: 'btn-xs btn-success',
                btnCancelClass: 'btn-xs btn-danger'
            });
        }

        // Handles Bootstrap Accordions.
        var handleAccordions = function () {
            $('body').on('shown.bs.collapse', '.accordion.scrollable', function (e) {
                _.ui.scrollTo($(e.target));
            });
        };

        // Handles Bootstrap Tabs.
        var handleTabs = function () {
            //activate tab if tab id provided in the URL
            if (location.hash) {
                var tabid = location.hash.substr(1);
                $('a[href="#' + tabid + '"]').parents('.tab-pane:hidden').each(function () {
                    var tabid = $(this).attr("id");
                    $('a[href="#' + tabid + '"]').click();
                });
                $('a[href="#' + tabid + '"]').click();
            }

            if ($().tabdrop) {
                $('.tabbable-tabdrop .nav-pills, .tabbable-tabdrop .nav-tabs').tabdrop({
                    text: '<i class="fa fa-ellipsis-v"></i>&nbsp;<i class="fa fa-angle-down"></i>'
                });
            }
        };

        // Handles Bootstrap Modals.
        var handleModals = function () {
            // fix stackable modal issue: when 2 or more modals opened, closing one of modal will remove .modal-open class.
            $('body').on('hide.bs.modal', function () {
                if ($('.modal:visible').size() > 1 && $('html').hasClass('modal-open') === false) {
                    $('html').addClass('modal-open');
                } else if ($('.modal:visible').size() <= 1) {
                    $('html').removeClass('modal-open');
                }
            });

            // fix page scrollbars issue
            $('body').on('show.bs.modal', '.modal', function () {
                if ($(this).hasClass("modal-scroll")) {
                    $('body').addClass("modal-open-noscroll");
                }
            });

            // fix page scrollbars issue
            $('body').on('hide.bs.modal', '.modal', function () {
                $('body').removeClass("modal-open-noscroll");
            });

            // remove ajax content and remove cache on modal closed
            $('body').on('hidden.bs.modal', '.modal:not(.modal-cached)', function () {
                $(this).removeData('bs.modal');
            });
        };

        // Handles Bootstrap Tooltips.
        var handleTooltips = function () {
            // global tooltips
            $('.tooltips').tooltip({
                placement: 'auto'
            });

            // portlet tooltips
            $('.portlet > .portlet-title .fullscreen').tooltip({
                container: 'body',
                title: '全屏显示',
                placement: 'auto'
            });
            $('.portlet > .portlet-title > .tools > .reload').tooltip({
                container: 'body',
                title: '点击刷新',
                placement: 'auto'
            });
            $('.portlet > .portlet-title > .tools > .search').tooltip({
                container: 'body',
                title: '点击搜索',
                placement: 'auto'
            });
            $('.portlet > .portlet-title > .tools > .remove').tooltip({
                container: 'body',
                title: '关闭窗口',
                placement: 'auto'
            });
            $('.portlet > .portlet-title > .tools > .config').tooltip({
                container: 'body',
                title: '点击设置',
                placement: 'auto'
            });
            $('.portlet > .portlet-title > .tools > .collapse, .portlet > .portlet-title > .tools > .expand').tooltip({
                container: 'body',
                title: '点击折叠',
                placement: 'auto'
            });
        };

        // Handles Bootstrap Dropdowns
        var handleDropdowns = function () {
            /*
              Hold dropdown on click
            */
            $('body').on('click', '.dropdown-menu.hold-on-click', function (e) {
                e.stopPropagation();
            });
        };

        var handleAlerts = function () {
            $('body').on('click', '[data-close="alert"]', function (e) {
                $(this).parent('.alert').hide();
                $(this).closest('.note').hide();
                e.preventDefault();
            });

            $('body').on('click', '[data-close="note"]', function (e) {
                $(this).closest('.note').hide();
                e.preventDefault();
            });

            $('body').on('click', '[data-remove="note"]', function (e) {
                $(this).closest('.note').remove();
                e.preventDefault();
            });
        };

        // Handle Hower Dropdowns
        var handleDropdownHover = function () {
            $('[data-hover="dropdown"]').not('.hover-initialized').each(function () {
                $(this).dropdownHover();
                $(this).addClass('hover-initialized');
            });
        };

        // Handles Bootstrap Popovers

        // last popep popover
        var lastPopedPopover;

        var handlePopovers = function () {
            $('.popovers').popover();

            // close last displayed popover

            $(document).on('click.bs.popover.data-api', function (e) {
                if (lastPopedPopover) {
                    lastPopedPopover.popover('hide');
                }
            });
        };

        // Handles scrollable contents using jQuery SlimScroll plugin or PerfectScroll plugin
        var handleScrollers = function () {
            _.ui.initSlimScroll('.scroller');

            _.ui.initPerfectScroll(".perfect-scroll")
        };

        // Handles Image Preview using jQuery Fancybox plugin
        var handleFancybox = function () {
            if (!jQuery.fancybox) {
                return;
            }

            if ($(".fancybox-button").size() > 0) {
                $(".fancybox-button").fancybox({
                    groupAttr: 'data-rel',
                    prevEffect: 'none',
                    nextEffect: 'none',
                    closeBtn: true,
                    helpers: {
                        title: {
                            type: 'inside'
                        }
                    }
                });
            }

            /*
             *  Thumbnail helper. Disable animations, hide close button, arrows and slide to next gallery item if clicked
             */

            if ($('.fancybox-thumbs').size() > 0) {
                $('.fancybox-thumbs').fancybox({
                    prevEffect: 'none',
                    nextEffect: 'none',

                    closeBtn: false,
                    arrows: false,
                    nextClick: true,

                    helpers: {
                        thumbs: {
                            width: 50,
                            height: 50
                        }
                    }
                });
            }
        };

        // Handles Image Preview using jQuery Pulsate plugin
        var handlePulsate = function () {
            if (!jQuery().pulsate) {
                return;
            }

            if ($('.pulsate-regular').size() > 0) {
                $('.pulsate-regular').each(function () {
                    $(this).pulsate({
                        color: "#bf1c56"
                    });
                })
            }
        }

        // Fix input placeholder issue for IE8 and IE9
        var handleFixInputPlaceholderForIE = function () {
            //fix html5 placeholder attribute for ie7 & ie8
            if (isIE8 || isIE9) { // ie8 & ie9
                // this is html5 placeholder fix for inputs, inputs with placeholder-no-fix class will be skipped(e.g: we need this for password fields)
                $('input[placeholder]:not(.placeholder-no-fix), textarea[placeholder]:not(.placeholder-no-fix)').each(function () {
                    var input = $(this);

                    if (input.val() === '' && input.attr("placeholder") !== '') {
                        input.addClass("placeholder").val(input.attr('placeholder'));
                    }

                    input.focus(function () {
                        if (input.val() == input.attr('placeholder')) {
                            input.val('');
                        }
                    });

                    input.blur(function () {
                        if (input.val() === '' || input.val() == input.attr('placeholder')) {
                            input.val(input.attr('placeholder'));
                        }
                    });
                });
            }
        };

        // Handle Select2 Dropdowns
        var handleSelect2 = function () {
            if ($().select2) {
                $('.select2me').select2({
                    placeholder: "Select",
                    allowClear: true
                });
            }
        };

        var handleDatepicker = function () {
            if ($().datepicker) {
                $('.date-picker').datepicker({
                    rtl: _.ui.isRTL(),
                    autoclose: true,
                    format: 'yyyy-mm-dd',
                    todayBtn: "linked",
                    language: 'zh-CN'
                });
            }

            if ($().datetimepicker) {
                $('.datetime-picker').datetimepicker({
                    isRTL: _.ui.isRTL(),
                    format: "yyyy-mm-dd hh:ii",
                    showMeridian: true,
                    autoclose: true,
                    pickerPosition: (_.ui.isRTL() ? "bottom-right" : "bottom-left"),
                    todayBtn: true,
                    language: "zh-CN"
                });
            }
        }

        //* END:CORE HANDLERS *//

        return {

            //main function to initiate the theme
            init: function () {
                //IMPORTANT!!!: Do not modify the core handlers call order.
                newUi();
                //Core handlers
                handleInit(); // initialize core variables
                handleOnResize(); // set and handle responsive
                handle100HeightContent();

                //UI Component handlers
                handleMaterialDesign(); // handle material design
                handleiCheck(); // handles custom icheck radio and checkboxes
                handleBootstrapSwitch(); // handle bootstrap switch plugin
                handleScrollers(); // handles slim scrolling contents
                handleFancybox(); // handle fancy box
                handleSelect2(); // handle custom Select2 dropdowns
                handleDatepicker();   // handle datepicker
                handlePortletTools(); // handles portlet action bar functionality(refresh, configure, toggle, remove)
                handleAlerts(); //handle closabled alerts
                handleDropdowns(); // handle dropdowns
                handleTabs(); // handle tabs
                handleTooltips(); // handle bootstrap tooltips
                handlePopovers(); // handles bootstrap popovers
                handleAccordions(); //handles accordions
                handleModals(); // handle modals
                handleBootstrapConfirmation(); // handle bootstrap confirmations
                handlePulsate(); // handle pulsate
                handlePortamento();
                // Hacks
                handleFixInputPlaceholderForIE(); //IE8 & IE9 input placeholder issue fix
                // handle table tr select
                $(".table-cur").delegate("tr", "click", function () {
                    $(this).addClass("cur-row").siblings().removeClass("cur-row");
                });
                //after init show body
                $("body").show();
            },

            //main function to initiate core javascript after ajax complete
            initAjax: function () {
                handleiCheck(); // handles custom icheck radio and checkboxes
                handleBootstrapSwitch(); // handle bootstrap switch plugin
                handleDropdownHover(); // handles dropdown hover
                handleScrollers(); // handles slim scrolling contents
                handleSelect2(); // handle custom Select2 dropdowns
                handleDatepicker();   // handle datepicker
                handleFancybox(); // handle fancy box
                handleDropdowns(); // handle dropdowns
                handleTooltips(); // handle bootstrap tooltips
                handlePopovers(); // handles bootstrap popovers
                handleAccordions(); //handles accordions
                handleBootstrapConfirmation(); // handle bootstrap confirmations
            },

            //init main components
            initComponents: function () {
                this.initAjax();
            },

            //public function to remember last opened popover that needs to be closed on click
            setLastPopedPopover: function (el) {
                lastPopedPopover = el;
            },

            //public function to add callback a function which will be called on window resize
            addResizeHandler: function (func) {
                resizeHandlers.push(func);
            },

            //public functon to call _runresizeHandlers
            runResizeHandlers: function () {
                _runResizeHandlers();
            },

            // wr_.uier function to scroll(focus) to an element
            scrollTo: function (el, offeset) {
                var pos = (el && el.size() > 0) ? el.offset().top : 0;

                if (el) {
                    if ($('body').hasClass('page-header-fixed')) {
                        pos = pos - $('.page-header').height();
                    }
                    pos = pos + (offeset ? offeset : -1 * el.height());
                }

                $('html,body').animate({
                    scrollTop: pos
                }, 'slow');
            },

            initSlimScroll: function (el) {
                $(el).each(function () {
                    if ($(this).attr("data-initialized")) {
                        return; // exit
                    }

                    if ($(this).attr("data-height")) {
                        height = $(this).attr("data-height");
                    } else {
                        height = $(this).css('height');
                    }

                    $(this).slimScroll({
                        allowPageScroll: true, // allow page scroll when the element scroll is ended
                        size: '8px',
                        color: ($(this).attr("data-handle-color") ? $(this).attr("data-handle-color") : '#999'),
                        wrapperClass: ($(this).attr("data-wrapper-class") ? $(this).attr("data-wrapper-class") : 'slimScrollDiv'),
                        railColor: ($(this).attr("data-rail-color") ? $(this).attr("data-rail-color") : '#EFEFEF'),
                        position: isRTL ? 'left' : 'right',
                        height: height,
                        alwaysVisible: ($(this).attr("data-always-visible") == "1" ? true : false),
                        railVisible: true,
                        disableFadeOut: true
                    });

                    $(this).attr("data-initialized", "1");
                });
            },

            destroySlimScroll: function (el) {
                $(el).each(function () {
                    if ($(this).attr("data-initialized") === "1") { // destroy existing instance before updating the height
                        $(this).removeAttr("data-initialized");
                        $(this).removeAttr("style");

                        var attrList = {};

                        // store the custom attribures so later we will reassign.
                        if ($(this).attr("data-handle-color")) {
                            attrList["data-handle-color"] = $(this).attr("data-handle-color");
                        }
                        if ($(this).attr("data-wrapper-class")) {
                            attrList["data-wrapper-class"] = $(this).attr("data-wrapper-class");
                        }
                        if ($(this).attr("data-rail-color")) {
                            attrList["data-rail-color"] = $(this).attr("data-rail-color");
                        }
                        if ($(this).attr("data-always-visible")) {
                            attrList["data-always-visible"] = $(this).attr("data-always-visible");
                        }
                        if ($(this).attr("data-rail-visible")) {
                            attrList["data-rail-visible"] = $(this).attr("data-rail-visible");
                        }

                        $(this).slimScroll({
                            wrapperClass: ($(this).attr("data-wrapper-class") ? $(this).attr("data-wrapper-class") : 'slimScrollDiv'),
                            destroy: true
                        });

                        var the = $(this);

                        // reassign custom attributes
                        $.each(attrList, function (key, value) {
                            the.attr(key, value);
                        });

                    }
                });
            },

            initPerfectScroll: function (el) {
                if (!$().perfectScrollbar) {
                    return;
                }
                $(el).each(function () {
                    $(this).perfectScrollbar();
                })
            },

            updatePerfectScroll: function (el) {
                if (!$().perfectScrollbar) {
                    return;
                }
                $(el).each(function () {
                    $(this).perfectScrollbar('update');
                });
            },

            destroyPerfectScroll: function (el) {
                if (!$().perfectScrollbar) {
                    return;
                }
                $(el).each(function () {
                    $(this).perfectScrollbar('destroy');
                });
            },

            // function to scroll to the top
            scrollTop: function () {
                _.ui.scrollTo();
            },

            // wr_.uier function to  block element(indicate loading)
            blockUI: function (options) {
                options = $.extend(true, {}, options);
                var html = '';
                if (options.animate) {
                    html = '<div class="loading-message ' + (options.boxed ? 'loading-message-boxed' : '') + '">' + '<div class="block-spinner-bar"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>' + '</div>';
                } else if (options.iconOnly) {
                    html = '<div class="loading-message ' + (options.boxed ? 'loading-message-boxed' : '') + '"><img src="' + this.getGlobalImgPath() + 'loading-spinner-grey.gif" align=""></div>';
                } else if (options.textOnly) {
                    html = '<div class="loading-message ' + (options.boxed ? 'loading-message-boxed' : '') + '"><span>&nbsp;&nbsp;' + (options.message ? options.message : 'LOADING...') + '</span></div>';
                } else {
                    html = '<div class="loading-message ' + (options.boxed ? 'loading-message-boxed' : '') + '"><img src="' + this.getGlobalImgPath() + 'loading-spinner-grey.gif" align=""><span>&nbsp;&nbsp;' + (options.message ? options.message : 'LOADING...') + '</span></div>';
                }

                if (options.target) { // element blocking
                    var el = $(options.target);
                    if (el.height() <= ($(window).height())) {
                        options.cenrerY = true;
                    }
                    el.block({
                        message: html,
                        baseZ: options.zIndex ? options.zIndex : 1000,
                        centerY: options.cenrerY !== undefined ? options.cenrerY : false,
                        css: {
                            top: '25%',
                            border: '0',
                            padding: '0',
                            backgroundColor: 'none'
                        },
                        overlayCSS: {
                            backgroundColor: options.overlayColor ? options.overlayColor : '#555',
                            opacity: options.boxed ? 0.05 : 0.1,
                            cursor: 'wait'
                        }
                    });
                } else { // page blocking
                    $.blockUI({
                        message: html,
                        baseZ: options.zIndex ? options.zIndex : 1000,
                        css: {
                            border: '0',
                            padding: '0',
                            backgroundColor: 'none'
                        },
                        overlayCSS: {
                            backgroundColor: options.overlayColor ? options.overlayColor : '#555',
                            opacity: options.boxed ? 0.05 : 0.1,
                            cursor: 'wait'
                        }
                    });
                }
            },

            // wr_.uier function to  un-block element(finish loading)
            unblockUI: function (target) {
                if (target) {
                    $(target).unblock({
                        onUnblock: function () {
                            $(target).css('position', '');
                            $(target).css('zoom', '');
                        }
                    });
                } else {
                    $.unblockUI();
                }
            },

            startPageLoading: function (options) {
                if (options && options.animate) {
                    $('.page-spinner-bar').remove();
                    $('body').append('<div class="page-spinner-bar"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>');
                } else {
                    $('.page-loading').remove();
                    $('body').append('<div class="page-loading"><img src="' + this.getGlobalImgPath() + 'loading-spinner-grey.gif"/>&nbsp;&nbsp;<span>' + (options && options.message ? options.message : 'Loading...') + '</span></div>');
                }
            },

            stopPageLoading: function () {
                $('.page-loading, .page-spinner-bar').remove();
            },

            alert: function (options) {

                options = $.extend(true, {
                    container: "", // alerts parent container(by default placed after the page breadcrumbs)
                    place: "append", // "append" or "prepend" in container
                    type: 'success', // alert's type
                    message: "", // alert's message
                    close: true, // make alert closable
                    reset: true, // close all previouse alerts first
                    focus: true, // auto scroll to the alert after shown
                    closeInSeconds: 0, // auto close after defined seconds
                    icon: "" // put icon before the message
                }, options);

                var id = _.ui.getUniqueID("_.ui_alert");

                var html = '<div id="' + id + '" class="_.ui-alerts alert alert-' + options.type + ' fade in">' + (options.close ? '<button type="button" class="close" data-dismiss="alert" aria-hidden="true"></button>' : '') + (options.icon !== "" ? '<i class="fa-lg fa fa-' + options.icon + '"></i>  ' : '') + options.message + '</div>';

                if (options.reset) {
                    $('._.ui-alerts').remove();
                }

                if (!options.container) {
                    if ($('body').hasClass("page-container-bg-solid")) {
                        $('.page-title').after(html);
                    } else {
                        if ($('.page-bar').size() > 0) {
                            $('.page-bar').after(html);
                        } else {
                            $('.page-breadcrumb').after(html);
                        }
                    }
                } else {
                    if (options.place == "append") {
                        $(options.container).append(html);
                    } else {
                        $(options.container).prepend(html);
                    }
                }

                if (options.focus) {
                    _.ui.scrollTo($('#' + id));
                }

                if (options.closeInSeconds > 0) {
                    setTimeout(function () {
                        $('#' + id).remove();
                    }, options.closeInSeconds * 1000);
                }

                return id;
            },

            // initializes uniform elements
            initUniform: function (els) {
                if (els) {
                    $(els).each(function () {
                        if ($(this).parents(".checker").size() === 0) {
                            $(this).show();
                            $(this).uniform();
                        }
                    });
                } else {
                    handleUniform();
                }
            },

            //wr_.uier function to update/sync jquery uniform checkbox & radios
            updateUniform: function (els) {
                $.uniform.update(els); // update the uniform checkbox & radios UI after the actual input control state changed
            },

            //public function to initialize the fancybox plugin
            initFancybox: function () {
                handleFancybox();
            },

            //public helper function to get actual input value(used in IE9 and IE8 due to placeholder attribute not supported)
            getActualVal: function (el) {
                el = $(el);
                if (el.val() === el.attr("placeholder")) {
                    return "";
                }
                return el.val();
            },

            //public function to get a paremeter by name from URL
            getURLParameter: function (paramName) {
                var searchString = window.location.search.substring(1),
                    i, val, params = searchString.split("&");

                for (i = 0; i < params.length; i++) {
                    val = params[i].split("=");
                    if (val[0] == paramName) {
                        return unescape(val[1]);
                    }
                }
                return null;
            },

            // check for device touch support
            isTouchDevice: function () {
                try {
                    document.createEvent("TouchEvent");
                    return true;
                } catch (e) {
                    return false;
                }
            },

            // To get the correct viewport width based on  http://andylangton.co.uk/articles/javascript/get-viewport-size-javascript/
            getViewPort: function () {
                var e = window,
                    a = 'inner';
                if (!('innerWidth' in window)) {
                    a = 'client';
                    e = document.documentElement || document.body;
                }

                return {
                    width: e[a + 'Width'],
                    height: e[a + 'Height']
                };
            },

            getUniqueID: function (prefix) {
                return 'prefix_' + Math.floor(Math.random() * (new Date()).getTime());
            },

            // check IE8 mode
            isIE8: function () {
                return isIE8;
            },

            // check IE9 mode
            isIE9: function () {
                return isIE9;
            },

            //check RTL mode
            isRTL: function () {
                return isRTL;
            },

            getGlobalImgPath: function () {
                return "/Application/global/Img/";
            },

            getGlobalPluginsPath: function () {
                return "/Application/global/Plugins/";
            },

            getGlobalCssPath: function () {
                return "/Application/global/Css/";
            },

            // get layout color code by color name
            getBrandColor: function (name) {
                if (brandColors[name]) {
                    return brandColors[name];
                } else {
                    return '';
                }
            },

            getResponsiveBreakpoint: function (size) {
                // bootstrap responsive breakpoints
                var sizes = {
                    'xs': 480,     // extra small
                    'sm': 768,     // small
                    'md': 992,     // medium
                    'lg': 1200     // large
                };

                return sizes[size] ? sizes[size] : 0;
            }
        };
    }();

    //hub
    _.hub = function () {


        var options = {
            receiveChat: function () {
            },
            receiveMessage: function () {
            },
            initSuccess: function () {
            }
        };

        var messageHubProxy = undefined;

        return {
            init: function (options2) {

                var connection = $.hubConnection();

                messageHubProxy = connection.createHubProxy("messageHub");

                messageHubProxy.on("receiveChat", function (message) {
                    if (typeof (options.receiveChat) == "function") {
                        options.receiveChat(message);
                    }
                });

                messageHubProxy.on("receiveMessage", function (message) {
                    if (typeof (options.receiveMessage) == "function") {
                        options.receiveMessage(message);
                    }
                });

                connection.qs = {"user": _.currentuser.get()};

                options = $.extend({}, options, options2);
                connection.start().done(function () {
                    options.initSuccess();
                });
            },
            sendChat: function (user, message) {
                return messageHubProxy.invoke("sendChat", user, message);
            }
        };
    }();

    //tools
    _.tools = {
        bytesToSize: function (bytes) {
            if (bytes === 0) return '0 B';

            var k = 1024;

            sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

            i = Math.floor(Math.log(bytes) / Math.log(k));

            //return (bytes / Math.pow(k, i)) + ' ' + sizes[i];
            //toPrecision(3) 后面保留一位小数，如1.0GB
            return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
        }
    };

    //ko extend
    ko.bindingHandlers.select2 = {
        init: function (el, valueAccessor, allBindingsAccessor, viewModel) {
            ko.utils.domNodeDisposal.addDisposeCallback(el, function () {
                $(el).select2('destroy');
            });

            var allBindings = allBindingsAccessor(),
                select2 = ko.utils.unwrapObservable(allBindings.select2);

            $(el).select2(select2);
        },
        update: function (el, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor();

            if ("value" in allBindings) {
                $(el).select2("val", allBindings.value());
            } else if ("selectedOptions" in allBindings) {
                var converted = [];
                var textAccessor = function (value) {
                    return value;
                };
                if ("optionsText" in allBindings) {
                    textAccessor = function (value) {
                        var valueAccessor = function (item) {
                            return item;
                        }
                        if ("optionsValue" in allBindings) {
                            valueAccessor = function (item) {
                                return item[allBindings.optionsValue];
                            }
                        }
                        var items = $.grep(allBindings.options(), function (e) {
                            return valueAccessor(e) == value
                        });
                        if (items.length == 0 || items.length > 1) {
                            return "UNKNOWN";
                        }
                        return items[0][allBindings.optionsText];
                    }
                }
                $.each(allBindings.selectedOptions(), function (key, value) {
                    converted.push({id: value, text: textAccessor(value)});
                });
                $(el).select2("data", converted);
            }
        }
    };

    ko.bindingHandlers.select2icon = {
        init: function (el, valueAccessor, allBindingsAccessor, viewModel) {
            ko.utils.domNodeDisposal.addDisposeCallback(el, function () {
                $(el).select2('destroy');
            });

            var allBindings = allBindingsAccessor(),
                select2 = ko.utils.unwrapObservable(allBindings.select2icon);

            var select2icon = function (e) {
                return "<i class='" + e.text + "'></i> ." + e.text;
            };

            $(el).select2({
                formatResult: select2icon,
                formatSelection: select2icon,
                escapeMarkup: function (e) {
                    return e;
                }
            });
        },
        update: function (el, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor();

            if ("value" in allBindings) {
                $(el).select2("val", allBindings.value());
            } else if ("selectedOptions" in allBindings) {
                var converted = [];
                var textAccessor = function (value) {
                    return value;
                };
                if ("optionsText" in allBindings) {
                    textAccessor = function (value) {
                        var valueAccessor = function (item) {
                            return item;
                        }
                        if ("optionsValue" in allBindings) {
                            valueAccessor = function (item) {
                                return item[allBindings.optionsValue];
                            }
                        }
                        var items = $.grep(allBindings.options(), function (e) {
                            return valueAccessor(e) == value
                        });
                        if (items.length == 0 || items.length > 1) {
                            return "UNKNOWN";
                        }
                        return items[0][allBindings.optionsText];
                    }
                }
                $.each(allBindings.selectedOptions(), function (key, value) {
                    converted.push({id: value, text: textAccessor(value)});
                });
                $(el).select2("data", converted);
            }
        }
    };
    ko.bindingHandlers.autocomplete = {
        init: function (el, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor(),
                autocomplete = ko.utils.unwrapObservable(allBindings.autocomplete);
            $(el).autocomplete(autocomplete);
        },
        update: function (el, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor(),
                autocomplete = ko.utils.unwrapObservable(allBindings.autocomplete);
        }
    };
    ko.bindingHandlers.checked10 = {
        init: function (el, valueAccessor) {
            var updateHandler = function () {
                var elementValue = el.checked ? "1" : "0",
                    modelValue = valueAccessor(),
                    currentValue = ko.utils.unwrapObservable(modelValue);
                if (elementValue === currentValue)
                    return;

                if (ko.isObservable(modelValue)) {
                    modelValue(elementValue);
                }
            };
            ko.utils.registerEventHandler(el, "click", updateHandler);
        },
        update: function (element, valueAccessor) {
            element.checked = ("1" == ko.utils.unwrapObservable(valueAccessor()));
        }
    };

    ko.bindingHandlers.datepicker = {
        init: function (el, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor(),
                datepicker = ko.utils.unwrapObservable(allBindings.datepicker);
            if (datepicker == true) {
                datepicker = {
                    rtl: _.ui.isRTL(),
                    autoclose: true,
                    format: "yyyy-mm-dd"
                };
            }
            ;
            if (value != undefined) {
                $(el).val(value.substring(0, 10));
            }
            $(el).datepicker(datepicker);
        },
        update: function (el, valueAccessor, allBindingsAccessor, viewModel) {

        }
    };

    ko.bindingHandlers.optionsLinkage = {
        init: function (el, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor(),
                optionsLinkage = ko.utils.unwrapObservable(allBindings.optionsLinkage);
            $(el).data("child", optionsLinkage.child().concat());
            optionsLinkage.child([]);
            if (optionsLinkage.child2) {
                $(el).data("child2", optionsLinkage.child2().concat());
                optionsLinkage.child2([]);
            }
            if (optionsLinkage.child3) {
                $(el).data("child3", optionsLinkage.child3().concat());
                optionsLinkage.child3([]);
            }
            if (optionsLinkage.child4) {
                $(el).data("child4", optionsLinkage.child4().concat());
                optionsLinkage.child4([]);
            }
            if (optionsLinkage.child5) {
                $(el).data("child5", optionsLinkage.child5().concat());
                optionsLinkage.child5([]);
            }
        },
        update: function (el, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor(),
                optionsLinkage = ko.utils.unwrapObservable(allBindings.optionsLinkage);
            optionsLinkage.child([]);
            if (optionsLinkage.child2) {
                optionsLinkage.child2([]);
            }
            if (optionsLinkage.child3) {
                optionsLinkage.child3([]);
            }
            if (optionsLinkage.child4) {
                optionsLinkage.child4([]);
            }
            if (optionsLinkage.child5) {
                optionsLinkage.child5([]);
            }
            if (optionsLinkage.parent != undefined) {
                var child = $(el).data("child");
                for (var i = 0; i < child.length; i++) {
                    if (child[i].parent == optionsLinkage.parent) {
                        optionsLinkage.child.push(child[i]);
                    }
                }
                if (optionsLinkage.child2) {
                    var child2 = $(el).data("child2");
                    for (var i = 0; i < child2.length; i++) {
                        if (child2[i].parent == optionsLinkage.parent) {
                            optionsLinkage.child2.push(child2[i]);
                        }
                    }
                }
                if (optionsLinkage.child3) {
                    var child3 = $(el).data("child3");
                    for (var i = 0; i < child3.length; i++) {
                        if (child3[i].parent == optionsLinkage.parent) {
                            optionsLinkage.child3.push(child3[i]);
                        }
                    }
                }
                if (optionsLinkage.child4) {
                    var child4 = $(el).data("child4");
                    for (var i = 0; i < child4.length; i++) {
                        if (child4[i].parent == optionsLinkage.parent) {
                            optionsLinkage.child4.push(child4[i]);
                        }
                    }
                }
                if (optionsLinkage.child5) {
                    var child5 = $(el).data("child5");
                    for (var i = 0; i < child5.length; i++) {
                        if (child5[i].parent == optionsLinkage.parent) {
                            optionsLinkage.child5.push(child5[i]);
                        }
                    }
                }
            }
            if (optionsLinkage.callback) {
                optionsLinkage.callback(el, viewModel);
            }
        }
    };

    ko.bindingHandlers.data = {
        init: function (el, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor(),
                data = ko.utils.unwrapObservable(allBindings.data);
            $(el).data(data.name, data.value);
        },
        update: function (el, valueAccessor, allBindingsAccessor, viewModel) {

        }
    };

    ko.bindingHandlers.dateFormat = {
        init: function (el, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor(),
                dateFormat = ko.utils.unwrapObservable(allBindings.dateFormat),
                text = ko.utils.unwrapObservable(allBindings.text);
            if (typeof (dateFormat) == "string") {
                var val;
                val = (new Date(text)).format(dateFormat);
                $(el).html(val);
            }
        },
        update: function (el, valueAccessor, allBindingsAccessor, viewModel) {

        }
    }

    //string extend
    $.extend(String.prototype, {
        // 在字符串末尾追加字符串
        append: function (str) {
            /// <summary>
            /// 在字符串末尾追加字符串
            /// </summary>
            /// <param name="str" type="string">
            /// 追加字的符串
            /// </param>
            return this.concat(str);
        },
        // 删除指定索引位置的字符，索引无效将不删除任何字符
        removeAt: function (index) {
            /// <summary>
            /// 删除指定索引位置的字符，索引无效将不删除任何字符
            /// </summary>
            /// <param name="index" type="int">
            /// 索引值
            /// </param>
            if (index < 0 || index >= this.length) {
                return this.valueOf();
            } else if (index == 0) {
                return this.substring(1, this.length);
            } else if (index == this.length - 1) {
                return this.substring(0, this.length - 1);
            } else {
                return this.substring(0, index) + this.substring(index + 1);
            }
        },
        // 删除指定索引间的字符串.sIndex和eIndex所在的字符不被删除
        removeAtScope: function (sIndex, eIndex) {
            /// <summary>
            /// 删除指定索引间的字符串.sIndex和eIndex所在的字符不被删除符
            /// </summary>
            /// <param name="sIndex" type="int">
            /// 起始索引值
            /// </param>
            /// <param name="eIndex" type="int">
            /// 结束索引值
            /// </param>
            if (sIndex == eIndex) {
                return this.deleteCharAt(sIndex);
            } else {
                if (sIndex > eIndex) {
                    var tIndex = eIndex;
                    eIndex = sIndex;
                    sIndex = tIndex;
                }
                if (sIndex < 0) sIndex = 0;
                if (eIndex > this.length - 1) eIndex = this.length - 1;
                return this.substring(0, sIndex + 1) + this.substring(eIndex, this.length);
            }
        },
        // 比较两个字符串是否相等,其实也可以直接使用==进行比较
        equals: function (str) {
            /// <summary>
            /// 比较两个字符串是否相等,其实也可以直接使用==进行比较
            /// </summary>
            /// <param name="str" type="string">
            /// 字符串
            /// </param>
            if (this.length != str.length) {
                return false;
            } else {
                for (var i = 0; i < this.length; i++) {
                    if (this.charAt(i) != str.charAt(i)) {
                        return false;
                    }
                }
                return true;
            }
        },
        // 比较两个字符串是否相等，不区分大小写
        equalsIgnoreCase: function (str) {
            /// <summary>
            /// 比较两个字符串是否相等，不区分大小写
            /// </summary>
            /// <param name="str" type="string">
            /// 字符串
            /// </param>
            if (this.length != str.length) {
                return false;
            } else {
                var tmp1 = this.toLowerCase();
                var tmp2 = str.toLowerCase();
                return tmp1.equals(tmp2);
            }
        },
        // 将指定的字符串插入到指定的位置后面,索引无效将直接追加到字符串的末尾
        insert: function (index, str) {
            /// <summary>
            /// 将指定的字符串插入到指定的位置后面,索引无效将直接追加到字符串的末尾
            /// </summary>
            /// <param name="index" type="int">
            /// 索引值
            /// </param>
            /// <param name="str" type="string">
            /// 字符串
            /// </param>
            if (index < 0 || index >= this.length - 1) {
                return this.append(str);
            }
            return this.substring(0, index + 1) + str + this.substring(index + 1);
        },
        // 将指定的位置的字符设置为另外指定的字符或字符串.索引无效将直接返回不做任何处理
        setAt: function (index, str) {
            /// <summary>
            /// 将指定的位置的字符设置为另外指定的字符或字符串.索引无效将直接返回不做任何处理
            /// </summary>
            /// <param name="index" type="int">
            /// 索引值
            /// </param>
            /// <param name="str" type="string">
            /// 字符串
            /// </param>
            if (index < 0 || index > this.length - 1) {
                return this.valueOf();
            }
            return this.substring(0, index) + str + this.substring(index + 1);
        },
        // 清除两边的空格
        trim: function () {
            /// <summary>
            /// 清除两边的空格
            /// </summary>
            return this.replace(/(^\s*)|(\s*$)/g, '');
        },
        // 除去左边空格
        trimLeft: function () {
            /// <summary>
            /// 除去左边空格
            /// </summary>
            return this.replace(/^s+/g, "");
        },
        // 除去右边空格
        trimRight: function () {
            /// <summary>
            /// 除去右边空格
            /// </summary>
            return this.replace(/s+$/g, "");
        },
        // 逆序
        reverse: function () {
            return this.split("").reverse().join("");
        },
        // 合并多个空白为一个空白
        resetBlank: function () {
            /// <summary>
            /// 合并多个空白为一个空白
            /// </summary>
            var regEx = /\s+/g;
            return this.replace(regEx, ' ');
        },
        // 保留数字
        getNumber: function () {
            /// <summary>
            /// 保留数字
            /// </summary>
            var regEx = /[^\d]/g;
            return this.replace(regEx, '');
        },
        // 保留中文
        getCN: function () {
            /// <summary>
            /// 保留中文
            /// </summary>
            var regEx = /[^\u4e00-\u9fa5\uf900-\ufa2d]/g;
            return this.replace(regEx, '');
        },
        // 保留字母
        getEN: function () {
            /// <summary>
            /// 保留字母
            /// </summary>
            return this.replace(/[^A-Za-z]/g, "");
        },
        // String转化为Int
        toInt: function () {
            /// <summary>
            /// String转化为Int
            /// </summary>
            return isNaN(parseInt(this)) ? this.toString() : parseInt(this);
        },
        // String转化为Float
        toFloat: function () {
            /// <summary>
            /// String转化为Int
            /// </summary>
            return isNaN(parseFloat(this)) ? this.toString() : parseFloat(this);
        },
        // String转化为字符数组
        toCharArray: function () {
            /// <summary>
            /// String转化为字符数组
            /// </summary>
            return this.split("");
        },
        // String转化为Json对象
        toJson: function () {
            /// <summary>
            /// String转化为Json对象
            /// </summary>
            return JSON.parse(this);
        },
        // 得到字节长度
        getRealLength: function () {
            /// <summary>
            /// 得到字节长度
            /// </summary>
            var regEx = /^[\u4e00-\u9fa5\uf900-\ufa2d]+$/;
            if (regEx.test(this)) {
                return this.length * 2;
            } else {
                var oMatches = this.match(/[\x00-\xff]/g);
                var oLength = this.length * 2 - oMatches.length;
                return oLength;
            }
        },
        // 从左截取指定长度的字串
        left: function (n) {
            /// <summary>
            /// 从左截取指定长度的字串
            /// </summary>
            /// <param name="n" type="number">
            /// 长度
            /// </param>
            return this.slice(0, n);
        },
        // 从右截取指定长度的字串
        right: function (n) {
            /// <summary>
            /// 从右截取指定长度的字串
            /// </summary>
            /// <param name="n" type="number">
            /// 长度
            /// </param>
            return this.slice(this.length - n);
        },
        // HTML编码
        htmlEncode: function () {
            /// <summary>
            /// HTML编码
            /// </summary>
            var re = this;
            var q1 = [/x26/g, /x3C/g, /x3E/g, /x20/g];
            var q2 = ["&", "<", ">", " "];
            for (var i = 0; i < q1.length; i++)
                re = re.replace(q1[i], q2[i]);
            return re;
        },
        // Unicode转化
        ascW: function () {
            /// <summary>
            /// Unicode转化
            /// </summary>
            var strText = "";
            for (var i = 0; i < this.length; i++)
                strText += "&#" + this.charCodeAt(i) + ";";
            return strText;
        },
        // 获取文件全名
        getFileName: function () {
            /// <summary>
            /// 获取文件全名
            /// </summary>
            var regEx = /^.*\/([^\/\?]*).*$/;
            return this.replace(regEx, '$1');
        },
        // 获取文件扩展名
        getExtensionName: function () {
            /// <summary>
            /// 获取文件扩展名
            /// </summary>
            var regEx = /^.*\/[^\/]*(\.[^\.\?]*).*$/;
            return this.replace(regEx, '$1');
        },
        //替换所有
        replaceAll: function (oldstr, newstr) {
            /// <summary>
            /// 替换所有
            /// </summary>
            /// <param name="oldstr" type="string">
            /// 旧字符
            /// </param>
            /// <param name="newstr" type="string">
            /// 新字符
            /// </param>
            return this.replace(new RegExp(oldstr, "gm"), newstr);
        },
        //是否正整数
        isPositiveInteger: function () {
            /// <summary>
            /// 是否正整数
            /// </summary>
            return (new RegExp(/^[1-9]\d*$/).test(this));
        },
        //是否整数
        isInteger: function () {
            /// <summary>
            /// 是否整数
            /// </summary>
            return (new RegExp(/^\d+$/).test(this));
        },
        //是否数字
        isNumber: function (value, element) {
            /// <summary>
            /// 是否数字
            /// </summary>
            return (new RegExp(/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/).test(this));
        },
        //是否以某个字符串开始
        startsWith: function (pattern) {
            /// <summary>
            /// 是否以某个字符串开始
            /// </summary>
            return this.indexOf(pattern) === 0;
        },
        //是否以某个字符串结尾
        endsWith: function (pattern) {
            /// <summary>
            /// 是否以某个字符串结尾
            /// </summary>
            var d = this.length - pattern.length;
            return d >= 0 && this.lastIndexOf(pattern) === d;
        },
        //是否密码格式
        isValidPwd: function () {
            /// <summary>
            /// 是否密码格式
            /// </summary>
            return (new RegExp(/^([_]|[a-zA-Z0-9]){6,32}$/).test(this));
        },
        //是否email格式
        isValidMail: function () {
            /// <summary>
            /// 是否email格式
            /// </summary>
            return (new RegExp(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/).test(this.trim()));
        },
        //是否手机号码格式
        isPhone: function () {
            /// <summary>
            /// 是否手机号码格式
            /// </summary>
            return (new RegExp(/(^([0-9]{3,4}[-])?\d{3,8}(-\d{1,6})?$)|(^\([0-9]{3,4}\)\d{3,8}(\(\d{1,6}\))?$)|(^\d{3,8}$)/).test(this));
        },
        //是否是链接
        isUrl: function () {
            /// <summary>
            /// 是否是链接
            /// </summary>
            return (new RegExp(/^[a-zA-z]+:\/\/([a-zA-Z0-9\-\.]+)([-\w .\/?%&=:]*)$/).test(this));
        },
        //是否是外部链接
        isExternalUrl: function () {
            /// <summary>
            /// 是否是外部链接
            /// </summary>
            return this.isUrl() && this.indexOf("://" + document.domain) == -1;
        },
        //获取url参数值
        getUrlParm: function (name) {
            /// <summary>
            /// 获取url参数值
            /// </summary>
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(this);
            if (results == null)
                return "";
            else
                return results[1];
        }
    });

    $.extend(String, {
        format: function () {
            if (arguments.length == 0) {
                return '';
            }

            if (arguments.length == 1) {
                return arguments[0];
            }

            var reg = /{(\d+)?}/g;
            var args = arguments;
            var result = arguments[0].replace(reg, function ($0, $1) {
                return args[parseInt($1) + 1];
            });
            return result;
        }
    });

    //number extend
    $.extend(Number.prototype, {
        // 数字补零
        zeroPadding: function (oCount) {
            /// <summary>
            /// 数字补零
            /// </summary>
            /// <param name="oCount" type="int">
            /// 补零个数
            /// </param>
            var strText = this.toString();
            while (strText.length < oCount) {
                strText = '0' + strText;
            }
            return strText;
        }
    });

    $.extend(Number, {
        random: function (min, max) {
            var Range = max - min;
            var Rand = Math.random();
            return (min + Math.round(Rand * Range));
        }
    });

    //array extend
    $.extend(Array.prototype, {
        // 数字数组由大到小排序
        maxToMin: function () {
            /// <summary>
            /// 数字数组由大到小排序
            /// </summary>
            var oValue;
            for (var i = 0; i < this.length; i++) {
                for (var j = 0; j <= i; j++) {
                    if (this[i] > this[j]) {
                        oValue = this[i];
                        this[i] = this[j];
                        this[j] = oValue;
                    }
                }
            }
            return this;
        },
        // 数字数组由小到大排序
        minToMax: function () {
            /// <summary>
            /// 数字数组由小到大排序
            /// </summary>
            var oValue;
            for (var i = 0; i < this.length; i++) {
                for (var j = 0; j <= i; j++) {
                    if (this[i] < this[j]) {
                        oValue = this[i];
                        this[i] = this[j];
                        this[j] = oValue;
                    }
                }
            }
            return this;
        },
        // 获得数字数组中最大项
        getMax: function () {
            /// <summary>
            /// 获得数字数组中最大项
            /// </summary>
            var oValue = 0;
            for (var i = 0; i < this.length; i++) {
                if (this[i] > oValue) {
                    oValue = this[i];
                }
            }
            return oValue;
        },
        // 获得数字数组中最小项
        getMin: function () {
            /// <summary>
            /// 获得数字数组中最小项
            /// </summary>
            var oValue = 0;
            for (var i = 0; i < this.length; i++) {
                if (this[i] < oValue) {
                    oValue = this[i];
                }
            }
            return oValue;
        },
        // 将数据批量加入到数据
        pushRange: function (items) {
            /// <summary>
            /// 将数据批量加入到数据
            /// </summary>
            /// <param name="items" type="array">
            /// 数组子项集合
            /// </param>
            var length = items.length;

            if (length != 0) {
                for (var index = 0; index < length; index++) {
                    this.push(items[index]);
                }
            }
        },
        // 清空数组
        clear: function () {
            /// <summary>
            /// 清空数组
            /// </summary>
            if (this.length > 0) {
                this.splice(0, this.length);
            }
        },
        // 数组是否为空
        isEmpty: function () {
            /// <summary>
            /// 数组是否为空
            /// </summary>
            if (this.length == 0)
                return true;
            else
                return false;
        },
        // 复制一个同样的数组
        clone: function () {
            /// <summary>
            /// 复制一个同样的数组
            /// </summary>
            var clonedArray = [];
            var length = this.length;

            for (var index = 0; index < length; index++) {
                clonedArray[index] = this[index];
            }
            return clonedArray;
        },
        // 是否包含某一项
        contains: function (item) {
            /// <summary>
            /// 是否包含某一项
            /// </summary>
            /// <param name="item" type="object">
            /// 数组子项
            /// </param>
            var index = this.indexOf(item);
            return (index >= 0);
        },
        // 找到数组中某一项索引
        indexOf: function (item) {
            /// <summary>
            /// 找到数组中某一项索引
            /// </summary>
            /// <param name="item" type="object">
            /// 数组子项
            /// </param>
            var length = this.length;

            if (length != 0) {
                for (var index = 0; index < length; index++) {
                    if (this[index] == item) {
                        return index;
                    }
                }
            }

            return -1;
        },
        // 将数据项插入到指定索引
        insert: function (index, item) {
            /// <summary>
            /// 将数据项插入到指定索引
            /// </summary>
            /// <param name="index" type="int">
            /// 索引值
            /// </param>
            /// <param name="item" type="object">
            /// 数组子项
            /// </param>
            this.splice(index, 0, item);
        },
        // 获得将数组每一项末尾追加字符的数组
        joinstr: function (str) {
            /// <summary>
            /// 获得将数组每一项末尾追加字符的数组
            /// </summary>
            /// <param name="str" type="string">
            /// 追加的字符
            /// </param>
            var new_arr = new Array(this.length);
            for (var i = 0; i < this.length; i++) {
                new_arr[i] = this[i] + str
            }
            return new_arr;
        },
        // 删除指定数据项
        remove: function (item) {
            /// <summary>
            /// 删除指定数据项
            /// </summary>
            /// <param name="item" type="object">
            /// 数组子项
            /// </param>
            var index = this.indexOf(item);

            if (index >= 0) {
                this.splice(index, 1);
            }
        },
        // 通过索引删除指定数据项
        removeAt: function (index) {
            /// <summary>
            /// 删除指定数据项
            /// </summary>
            /// <param name="index" type="int">
            /// 索引值
            /// </param>
            this.splice(index, 1);
        },
        // each是一个集合迭代函数，它接受一个函数作为参数和一组可选的参数
        // 这个迭代函数依次将集合的每一个元素和可选参数用函数进行计算，并将计算得的结果集返回
        each: function (fn) {
            /// <summary>
            /// each是一个集合迭代函数，它接受一个函数作为参数和一组可选的参数
            /// 这个迭代函数依次将集合的每一个元素和可选参数用函数进行计算，并将计算得的结果集返回
            /// 例：var a = [1,2,3,4].each(function(x){return x < 0 ? x : null});
            /// </summary>
            /// <param name="fn" type="function">
            /// 筛选方法
            /// </param>
            /// <param name="param" type="object">
            /// 零个或多个可选的用户自定义参数
            /// </param>
            fn = fn || Function.K;
            var a = [];
            var args = Array.prototype.slice.call(arguments, 1);
            for (var i = 0; i < this.length; i++) {
                var res = fn.apply(this, [this[i], i].concat(args));
                if (res != null) a.push(res);
            }
            return a;
        },
        //得到一个数组不重复的元素集合
        uniquelize: function () {
            /// <summary>
            /// 得到一个数组不重复的元素集合
            /// </summary>
            var ra = new Array();
            for (var i = 0; i < this.length; i++) {
                if (!ra.contains(this[i])) {
                    ra.push(this[i]);
                }
            }
            return ra;
        }
    });

    $.extend(Array, {
        //求两个集合的补集
        complement: function (a, b) {
            /// <summary>
            /// 求两个集合的补集
            /// </summary>
            /// <param name="a" type="array">
            /// 集合a
            /// </param>
            /// <param name="b" type="array">
            /// 集合b
            /// </param>
            return Array.minus(Array.union(a, b), Array.intersect(a, b));
        },
        //求两个集合的交集
        intersect: function (a, b) {
            /// <summary>
            /// 求两个集合的交集
            /// </summary>
            /// <param name="a" type="array">
            /// 集合a
            /// </param>
            /// <param name="b" type="array">
            /// 集合b
            /// </param>
            return a.uniquelize().each(function (o) {
                return b.contains(o) ? o : null
            });
        },
        //求两个集合的差集
        minus: function (a, b) {
            /// <summary>
            /// 求两个集合的差集
            /// </summary>
            /// <param name="a" type="array">
            /// 集合a
            /// </param>
            /// <param name="b" type="array">
            /// 集合b
            /// </param>
            return a.uniquelize().each(function (o) {
                return b.contains(o) ? null : o
            });
        },
        //求两个集合的并集
        union: function (a, b) {
            /// <summary>
            /// 求两个集合的并集
            /// </summary>
            /// <param name="a" type="array">
            /// 集合a
            /// </param>
            /// <param name="b" type="array">
            /// 集合b
            /// </param>
            return a.concat(b).uniquelize();
        }
    });

    //date extend
    $.extend(Date.prototype, {
        // 获取当前时间的中文形式
        getCNDate: function () {
            /// <summary>
            /// 获取当前时间的中文形式
            /// </summary>
            var oDateText = '';
            oDateText += this.getFullYear().LenWithZero(4) + new Number(24180).ChrW();
            oDateText += this.getMonth().LenWithZero(2) + new Number(26376).ChrW();
            oDateText += this.getDate().LenWithZero(2) + new Number(26085).ChrW();
            oDateText += this.getHours().LenWithZero(2) + new Number(26102).ChrW();
            oDateText += this.getMinutes().LenWithZero(2) + new Number(20998).ChrW();
            oDateText += this.getSeconds().LenWithZero(2) + new Number(31186).ChrW();
            oDateText += new Number(32).ChrW() + new Number(32).ChrW() + new Number(26143).ChrW() + new Number(26399).ChrW() + new String('26085199682010819977222352011620845').substr(this.getDay() * 5, 5).ToInt().ChrW();
            return oDateText;
        },
        // 扩展Date格式化
        format: function (format) {
            /// <summary>
            /// 扩展Date格式化
            /// </summary>
            /// <param name="format" type="string">
            /// format信息
            /// </param>
            var o = {
                "M+": this.getMonth() + 1, //月份
                "d+": this.getDate(), //日
                "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
                "H+": this.getHours(), //小时
                "m+": this.getMinutes(), //分
                "s+": this.getSeconds(), //秒
                "q+": Math.floor((this.getMonth() + 3) / 3), //季度
                "S": this.getMilliseconds() //毫秒
            };
            var week = {
                "0": "\u65e5",
                "1": "\u4e00",
                "2": "\u4e8c",
                "3": "\u4e09",
                "4": "\u56db",
                "5": "\u4e94",
                "6": "\u516d"
            };
            if (/(y+)/.test(format)) {
                format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
            }
            if (/(E+)/.test(format)) {
                format = format.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "\u661f\u671f" : "\u5468") : "") + week[this.getDay() + ""]);
            }
            for (var k in o) {
                if (new RegExp("(" + k + ")").test(format)) {
                    format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                }
            }
            return format;
        },
        //计算时差
        diff: function (interval, objDate) {
            //若参数不足或 objDate 不是日期类型則回传 undefined
            if (arguments.length < 2 || objDate.constructor != Date) {
                return undefined;
            }
            switch (interval) {
                //计算秒差
                case 's':
                    return parseInt((objDate - this) / 1000);
                //计算分差
                case 'n':
                    return parseInt((objDate - this) / 60000);
                //计算時差
                case 'h':
                    return parseInt((objDate - this) / 3600000);
                //计算日差
                case 'd':
                    return parseInt((objDate - this) / 86400000);
                //计算周差
                case 'w':
                    return parseInt((objDate - this) / (86400000 * 7));
                //计算月差
                case 'm':
                    return (objDate.getMonth() + 1) + ((objDate.getFullYear() - this.getFullYear()) * 12) - (this.getMonth() + 1);
                //计算年差
                case 'y':
                    return objDate.getFullYear() - this.getFullYear();
                //输入有误
                default:
                    return undefined;
            }
        },
        //增加时间
        add: function (interval, number) {
            var dtTmp = this;

            switch (interval) {
                //增加秒
                case 's':
                    return new Date(Date.parse(dtTmp) + (1000 * number));
                //增加分
                case 'n':
                    return new Date(Date.parse(dtTmp) + (60000 * number));
                //增加時
                case 'h':
                    return new Date(Date.parse(dtTmp) + (3600000 * number));
                //增加日
                case 'd':
                    return new Date(Date.parse(dtTmp) + (86400000 * number));
                //增加周
                case 'w':
                    return new Date(Date.parse(dtTmp) + ((86400000 * 7) * number));
                //增加季
                case 'q':
                    return new Date(dtTmp.getFullYear(), (dtTmp.getMonth()) + number * 3, dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());
                //增加月
                case 'm':
                    return new Date(dtTmp.getFullYear(), (dtTmp.getMonth()) + number, dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());
                //增加年
                case 'y':
                    return new Date((dtTmp.getFullYear() + number), dtTmp.getMonth(), dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());

            }
        }
    });

    return _;
});




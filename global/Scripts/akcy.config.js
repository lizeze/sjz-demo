
require.config({
    baseUrl: '/global',
    paths: {
        "jquery": "plugins/jquery.min",
        "jquery-migrate": "plugins/jquery-migrate.min",
        "jquery-ui": "plugins/jquery-ui/jquery-ui.min",
        "bootstrap": "plugins/bootstrap/js/bootstrap.min",
        "bootstrap-hover-dropdown": "plugins/bootstrap-hover-dropdown/bootstrap-hover-dropdown.min",// bootstrap 下拉菜单
        "jquery-slimscroll": "plugins/jquery-slimscroll/jquery.slimscroll.min", //滚动条插件
        "jquery-perfect-scrollbar": "plugins/jquery-perfect-scrollbar/perfect-scrollbar.min", //滚动条插件 垂直 水平 都有
        "jquery-blockui": "plugins/jquery.blockui.min", //loading插件
        "jquery-cokie": "plugins/jquery.cokie.min", //cookies
        "jquery-uniform": "plugins/uniform/jquery.uniform.min", //form 美化插件
        "bootstrap-switch": "plugins/bootstrap-switch/js/bootstrap-switch.min",//switch checkbox 插件
        "jquery-select2": "plugins/select2/select2.min",//dropdown插件
        "jquery-validation": "plugins/jquery-validation/js/jquery.validate.min",//数据验证插件
        "jquery-backstretch": "plugins/backstretch/jquery.backstretch.min",//背景插件
        "jquery-gritter": "plugins/gritter/js/jquery.gritter.min", //提示控件
        "bootstrap-datepicker-plugin": "plugins/bootstrap-datepicker/js/bootstrap-datepicker",//时间控件中文包
        "bootstrap-datepicker": "plugins/bootstrap-datepicker/js/locales/bootstrap-datepicker.zh-CN",//时间控件
        "bootstrap-datetimepicker": "plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min",//时间控件含有时分秒
        "bootstrap-datetimepickerlocal": "plugins/bootstrap-datetimepicker/js/locales/bootstrap-datetimepicker.zh-CN",//时间控件中文化
        "moment": "plugins/fullcalendar/lib/moment.min",//日期时间处理
        "jquery-fullcalendar": "plugins/fullcalendar/fullcalendar.min",//日程管理插件
        "jquery-uploadify": "plugins/jquery-uploadify/jquery.uploadify",//上传插件
        "jquery-hotkeys": "plugins/jquery-hotkeys/jquery.hotkeys",//按键插件
        "jquery-pulsate": "plugins/jquery.pulsate.min",//脉搏提示插件
        "jquery-portamento": "plugins/jquery-portamento/portamento.min",//滑动定位
        "jquery-print-area": "plugins/jquery-print-area/jquery.PrintArea",//网页区域打印
        "jquery-barcode": "plugins/jquery-barcode/jquery-barcode.min",//生成一维码，二维码
        "jquery-qrcode": "plugins/jquery-qrcode/jquery.qrcode.min",//qrcode生成
        "jquery-jstree": "Plugins/jstree/dist/jstree.min",//树
        "bootstrap-summernote":"Plugins/bootstrap-summernote/summernote",

        //图表
        "jquery-highcharts": "plugins/jquery-highcharts/highcharts",

        //看图插件
        "jquery-fancybox": "plugins/fancybox/source/jquery.fancybox",
        "jquery-fancybox-thumbs": "plugins/fancybox/source/helpers/jquery.fancybox-thumbs",

        //通信组件
        "signalr": "/signalr/hubs?ak",
        "jquery-signalr": "/scripts/jquery.signalR-2.2.0.min",

        "ko": "plugins/knockout/knockout-3.3.0.min",
        "akcy": "scripts/akcy.amd"
    },
    map: {
        "*": {
            "css": "scripts/css.min"
        }
    },
    shim: {
        "akcy": ["jquery", "ko", "css!/global/Css/components-md.css", "css!/global/Css/plugins-md.css"],
        "jquery-migrate": ["jquery"],
        "jquery-ui": ["jquery", "css!plugins/jquery-ui/jquery-ui.min.css"],
        "bootstrap": ["jquery"],
        "bootstrap-hover-dropdown": ["jquery"],
        "jquery-slimscroll": ["jquery"],
        "jquery-perfect-scrollbar": ["jquery", "css!plugins/jquery-perfect-scrollbar/perfect-scrollbar.min.css"],
        "jquery-blockui": ["jquery"],
        "jquery-cokie": ["jquery"],
        "jquery-uniform": ["jquery", "css!plugins/uniform/css/uniform.default.css"],
        "bootstrap-switch": ["jquery", "css!plugins/bootstrap-switch/css/bootstrap-switch.min.css"],
        "jquery-select2": ["jquery", "css!plugins/select2/select2.css"],
        "jquery-backstretch": ["jquery"],
        "jquery-gritter": ["jquery", "css!plugins/gritter/css/jquery.gritter.css"],
        "bootstrap-datepicker-plugin": ["jquery", "css!plugins/bootstrap-datepicker/css/datepicker.css"],
        "bootstrap-datepicker": ["jquery", "bootstrap-datepicker-plugin"],
        "bootstrap-datetimepicker": ["jquery","css!plugins/bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css"],
        "jquery-fullcalendar": ["jquery", "moment", "jquery-ui", "css!plugins/fullcalendar/fullcalendar.min.css"],
        "jquery-uploadify": ["jquery", "css!plugins/jquery-uploadify/uploadify.css"],
        "jquery-hotkeys": ["jquery", "jquery-migrate"],
        "jquery-pulsate": ["jquery", "jquery-migrate"],
        "jquery-portamento": ["jquery", "css!plugins/jquery-portamento/portamento.css"],
        "jquery-print-area": ["jquery"],
        "jquery-barcode": ["jquery"],
        "jquery-qrcode": ["jquery"],
        "bootstrap-datetimepickerlocal": ["jquery", "bootstrap-datetimepicker"],
        "jquery-jstree": ["jquery", "css!Plugins/jstree/dist/themes/default/style.min.css"],
        "bootstrap-summernote": ["jquery", "bootstrap","css!Plugins/bootstrap-summernote/summernote.css"],

        "jquery-highcharts": ["jquery"],

        "jquery-fancybox": ["jquery", "jquery-migrate", "css!plugins/fancybox/source/jquery.fancybox.css"],
        "jquery-fancybox-thumbs": ["jquery", "jquery-migrate", "jquery-fancybox", "css!plugins/fancybox/source/helpers/jquery.fancybox-thumbs.css"],

        "jquery-signalr": ["jquery"],
        "signalr": ["jquery-signalr"]
    }
});

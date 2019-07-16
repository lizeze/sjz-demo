require([
    "jquery",
    "ko",
    "bootstrap",
    "bootstrap-datepicker",
    "akcy"], function ($, ko) {
    var akcy = arguments[arguments.length - 1];
    akcy.ui.init();
        // $('.datetimepicker').datetimepicker({
        //     format: 'YYYY-MM-DD',
        //     locale: moment.locale('zh-cn')
        // }
    akcy.ajaxget('http://localhost:51532/api/demo/test?id=1').done(function (data) {

         console.log(data)
    })
    // var currentuser = window.parent.currentuser();
    // var userName = currentuser.username;

        // var form = akcy.form().options({
        //     fields: [
        //         { field: 'JE_ID', value: ko.observable(0) },
        //
        //     ],
        //     dataAddUrl: '/ak56api/jobexception/AddJobException',
        //     dataUpdateUrl: '/ak56api/jobexception/UpdateJobException',
        //     dataDeleteUrl: '/ak56api/jobexception/DeleteJobException'
        // }).optionsExtend({
        //
        // }).bind("jobexpform");



});

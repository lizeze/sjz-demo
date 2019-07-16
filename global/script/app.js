var cmdApp = function () {

     this.url = 'http://192.168.199.219:51532/api'
    this.ajaxpost = function (url, data, callback) {
        $.ajax({
            url: this.url + url,
            dataType: "json",
            type: "POST",
            data: data,
            contentType: "application/json; charset=utf-8",
            beforeSend: function (request) {

            },
            complete: function (data) {
                callback && callback(data)
            },

        });
    }


}
var app = new cmdApp();
function login() {
    var username = $('#username').val();
    var password = $('#pwd').val();
   

    $.ajax({
        url: app.url + "/home/login?username=" + username + "&password=" + password,
        type: "POST",
        contentType: "application/json; charset=utf-8",
        beforeSend: function (request) {
          // window.location.href='../'
        },
        complete: function (data) {
            
        },error:function(){
            alert('用户名密码不正确')
        }


    });

}
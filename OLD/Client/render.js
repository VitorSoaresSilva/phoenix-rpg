function ShowLoginPage(){
    var template = document.getElementById("loginTemplate").innerHTML;
    var rendered = Mustache.render(template,
        {rooms:[
            {"name":"aa"},
            {"name":"bb"},
        ]
    });
    changeTemplate(rendered);
    const btnNewGame = document.getElementById('btnNewGame');
    btnNewGame.addEventListener('click',()=>socket.emit('newRoom'))
}

function changeTemplate(template){
    document.getElementById("mainTemplate").innerHTML = template;
}
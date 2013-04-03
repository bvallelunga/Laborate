/* Requires */
var base = require('./config.js');
var utils = require('./utils.js');
var io = base.io;

/* Socket Events */
io.sockets.on('connection', function (socket) {
    var session = {};

    socket.on('join', function(data) {
        utils.session_authentication(data, function(success) {
            if(success) {
                if(session == data['session']) {
                    socket.leave(session);
                }
                socket.join(data['session']);
                session = data;
                socket.broadcast.to(session['session']).emit('users' , {"from": data['from'], "name": data['name'], "join": true});
            }
        });
    });

    socket.on('editor', function(data) {
        socket.broadcast.to(session['session']).emit('editor', data);

        if("extras" in data) {
            if("breakpoint" in data["extras"]) {
                utils.session_breakpoint(session['session'], data["extras"]["breakpoint"]);
            }
        } else {
            utils.session_document(session['session'], data);
        }
    });

    socket.on('users', function(data) {
        socket.broadcast.to(session['session']).emit('users' , data);
    });

    socket.on('cursors', function (data) {
        socket.broadcast.to(session['session']).emit('cursors' , data);
    });

    socket.on('chatRoom', function (data) {
        socket.broadcast.to(session['session']).emit('chatRoom' , data);
        session["name"] = data["name"];
    });

    socket.on('disconnect', function(data) {
        socket.broadcast.to(session['session']).emit('users' , {"from": session['from'], "name": session['name'], "leave": true});
    });
});
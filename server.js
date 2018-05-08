const MongoClient = require('mongodb').MongoClient;
const io = require('socket.io').listen(4000);

let url = 'mongodb://127.0.0.1/socketchat';

/*
* Connect to MongoDB
*/
MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    console.log('Connected to MongoDB');

    // Set db constants
    const socketchat = db.db('socketchat');
    const users = socketchat.collection('users');
    const messages = socketchat.collection('messages');


    /*
    * Connect to socket.io
    */
    io.on('connection', function (socket) {

        console.log('Connected to socket.io, ID: ' + socket.id);

        /*
        * Handle enter chat / log on
        */
        socket.on("username", function (username) {
            console.log(username);

            users.find().toArray(function (err, res) {
                if (err) throw err;
                socket.emit('users', res); 
            });

            messages.find().toArray(function (err, res) {
                if (err) throw err;
                socket.emit('messages', res); 
            });

            users.insertOne({socketID: socket.id, username: username});

            socket.broadcast.emit('logon', {
                socketID: socket.id,
                username: username
            });
        });

        /*
        * Handle log off
        */
        socket.on('disconnect', function () {
            console.log('User ' + socket.id + ' disconnected!');

            users.deleteOne({socketID: socket.id}, function () {
                socket.broadcast.emit('logoff', socket.id);
            });
        });

        /*
        * Handle chat input
        */
        socket.on('input', function (data) {

            if (data.publicChat) {
                messages.insertOne({username: data.username, message: data.message, date: data.date});
            }

            io.emit('output', data);
        });

        /*
        * Handle second user trigger
        */
        socket.on('secondUserTrigger', function (data) {
            socket.to(data.secondUserID).emit('secondUserChatWindow', data);
        });

    });


});
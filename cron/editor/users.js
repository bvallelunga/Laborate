var redis = require('redis');
var redisClient = redis.createClient();
redisClient.select(require('../config').redis);

redisClient.keys("editor*", function(error, documents) {
    if(!error && documents.length != 0) {
        console.log(documents);
        redisClient.end();
    } else {
        redisClient.end();
    }
});

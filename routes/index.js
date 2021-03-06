var express = require('express');
var router = express.Router();

var getHeader = require('haru-nodejs-util').common.getHeader;
var crawlerConfig = config.crawlerConfig;
var store = require('haru-nodejs-store');
var RabbitMQ = require('../connectors/rabbitmq.js');
var rabbitmq = new RabbitMQ();
var async = require('async');
var _ = require('underscore');



router.post('/fetch', function(req, res) {
    var input = getHeader(req);

    var options = req.body;
    var markets = Object.keys(options);

    async.times(markets.length, function(n, next) {
        var market = markets[n];
        var option = options[market];

        option['market'] = market;

        if( crawlerConfig[market] ){
            option['locations'].forEach(function(location) {
                if( _.contains(crawlerConfig[market], location) ) {
                    var msg  = {
                        market: market,
                        page: 1,
                        location: location,
                        packageName: option.packageName,
                        applicationId: input.applicationId
                    };
                    var strMsg = JSON.stringify(msg);

                    store.get('public').hset('review:fetch', _genJobKey(msg), strMsg);
                    rabbitmq.publish('crawler', strMsg);
                }
            });
        }

        function _genJobKey(msg){
            return msg.market+':'+msg.location+':'+msg.packageName+':'+msg.applicationId;
        };


        next(null, null);

    },function done(error, results) {
        res.json({});
    });

});

module.exports = router;

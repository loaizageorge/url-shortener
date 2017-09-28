var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var url = 'mongodb://root:root@ds149874.mlab.com:49874/xchendo-timestamp-microservice';

router.get('/new/:url*', function(req,res){
// slice off the '/new/', we only care about the rest
var paramURL = req.url.slice(5);
if (!validateURL(paramURL)) {
  res.send({
    error: "The url is invalid. Must follow the format http(s)://.foo.bar"
  });
  res.end();
} else {
  // connect to dat db
  mongo.connect(url, function(err, db){
  console.log("we shouldn't be here'");
    if(err){ return err; }
    var mycollection = db.collection('urls');
    
    var count = mycollection.count(function(err,num){
      if(err){ return err; }
      var short = `${req.hostname}/${num}`;

      // insert into database
      var doc = {
        original_url: paramURL,
        short_url: short
      };
      
      // insert into database
      mycollection.insert(doc, function(err,data){
        if(err){ throw err;}
        // _id is returned for some reason, but I don't want it returned
        delete doc['_id'];
        res.send(JSON.stringify(doc));
        db.close();
      });
      
    });
  });
}
});

// Short url will redirect to original url
router.get('/:id', function(req,res,next){
//check if param is an int, and then search for it in our db
var short = req.params.id;
if (isNaN(short)) {
  res.send({
    error: "Query not valid, must be a number" //better wording
  });
} else {
  // connect to dat db
  mongo.connect(url, function(err,db){
    if(err){return err;}

  var short_url = `${req.hostname}/${short}`;
    var mycollection = db.collection('urls');
    mycollection.find({
            'short_url' : short_url
    }).toArray(function(err, documents){
        //redirect to the original_url
      console.log(documents);
      if(err){
        throw new Error(err);
      }
      if(documents[0]){
        res.redirect(documents[0]['original_url']);
        db.close()
      }
      res.send({Error: "Not found"});
    });
  });
}
});

function validateURL(url){
  var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
  console.log(urlPattern.test(url));
  return urlPattern.test(url);
}

module.exports = router;
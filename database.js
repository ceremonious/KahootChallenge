var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var url = "mongodb://localhost:27017/KahootChallenge";

var obj = JSON.parse(fs.readFileSync('testkahoot.json', 'utf8'));
/*for(var i = 0; i < obj.entities.length; i++) {
  insertKahoot(obj.entities[i], i + 2);
}*/
insertKahoot(obj, 101);

function insertKahoot(kahoot, index) {
  delete kahoot.metadata;
  kahoot.index = index;
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    db.collection("Kahoots").count(function(err, count) {
      if (err) throw err;
      db.collection("Kahoots").insertOne(kahoot, function(err, res) {
        if (err) throw err;
        console.log("1 record inserted");
        db.close();
      });
    });
  });
}

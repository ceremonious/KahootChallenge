var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var url = "mongodb://localhost:27017/KahootChallenge";

var obj = JSON.parse(fs.readFileSync('mykahoot.json', 'utf8'));
console.log(obj);
insertKahoot(obj);

function insertKahoot(kahoot) {
  delete kahoot.metadata;
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    db.collection("Kahoots").count(function(err, count) {
      if (err) throw err;
      kahoot.index = count;
      db.collection("Kahoots").insertOne(kahoot, function(err, res) {
        if (err) throw err;
        console.log("1 record inserted");
        db.close();
      });
    });
  });
}

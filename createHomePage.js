var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/KahootChallenge";
var fs = require('fs');

MongoClient.connect('mongodb://localhost:27017/KahootChallenge', function(err,database) {
    if (err) throw err;
    kahoots = database.collection("Kahoots");
    kahoots.find().toArray(function (err, result) {
  		if (err) throw err;
      var boxes = [];
  		for(var i = 0; i < result.length; i++) {
        var cover = result[i].cover ? result[i].cover : "";
        var description = result[i].description;
        if(description.length > 120) {
          description = description.substring(0, 120) + "...";
        }
        boxes.push(`<div class="kahootBox1">
          <div class="kahootBox2">
            <div class="kahootBox3">
              <div class="kahootPicture" style="background-image: url('`+ cover +`')">
                <div class="numQuestions">`+ result[i].questions.length +` Questions</div>
              </div>
              <div class="kahootBoxContent">
                <main class="kahootInfo">
                  <h1 class="title1"><a class="title2">`+ result[i].title +`</a></h1>
                  <p class="description">`+ description +`</p>
                </main>
                <footer class="footer">
                  <span class="author">`+ result[i].creator_username +`</span>
                </footer>
              </div>
            </div>
          </div>
        </div>`);
      }
      fs.writeFile('homePage.txt', boxes.join(''));
  	});
})



//<li><a href="/play/%d"><p>%s</p></a></li>

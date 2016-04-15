 // #####################################
// Library Conference Papers Bot v 1.2 ##
// ######################################

// Create a simple server to keep the bot running
var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Library Conference Proposals Bot\n');
}).listen(8080);

// REQUIRE packages
 require('dotenv').load();
var random = require("random-js")();
var fs =require("fs");
var request = require("request");
var FeedParser = require ("feedparser");
var WordPOS = require('wordpos');
var pos = require('pos');
var Twit = require('twit');
// initiate wordpos
wordpos = new WordPOS();

// initiate simple-twitter
var T = new Twit({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token: process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// capitalisation function
var capitalise = function(x) {
    return x.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

// title case - capitalise the initial letter of the word when called
function titleCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Set timeout to loop the whole thing every 2.1 hours
var timerVar = setInterval (function () {writeAbstracts()}, 7.56e+6);

// Run the bot when the timer expires
function writeAbstracts() {

	// function with closure to add stuff to an array from inside other functions
	var addToArray = (function(sentence){
		var sArray = [];
		return function(sentence) {
			sArray.push(sentence)
			// Once we have 10 headlines we choose one at random
			if (sArray.length > 9) {
				choice = random.pick(sArray)
				var option1 = '\n' + choice;
				// then we push it to the options.txt file
				fs.appendFileSync('options.txt', option1);
				console.log(option1)
			}
		}
	})();

	// set a Date variable for yesterday.
	var dateNow = new Date();
	var newest = dateNow - 8.64e+7;
	// use the random value to pick a line from the phrases.txt file.
	var phrases = fs.readFileSync('phrases.txt').toString().split('\n');
	cliche = random.pick(phrases)

	// Get Reuters tech news from their RSS feed
	var req = request("http://feeds.reuters.com/reuters/technologyNews");
	var feedparser = new FeedParser();

	// deal with any errors in FeedParser
	req.on('error', function (error) {
	  console.error(error); 
	});

	req.on('response', function (res) {
	  var stream = this;
	  // deal with any errors in the feed
	  if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
	  stream.pipe(feedparser);
	});

	// deal with any errors in feedparser
	feedparser.on('error', function(error) {
	  console.error(error); 
	});

	feedparser.on('readable', function() {
	  // here we go... 
	  var stream = this
	      , meta = this.meta
	      , item;	

	  while (item = stream.read()) {
		t = item.title;

		var words = new pos.Lexer().lex(t);
		var tagger = new pos.Tagger();
		var taggedWords = tagger.tag(words);
		var hasColon = t.includes(":");
		var colon = t.lastIndexOf(":");
		var sentence = t.slice(0, colon);
		var joiner = [': what it means for ',': ramifications for ',': how it could revolutionise ',': how it could influence ']

		if (hasColon) {
			var mySentence = (titleCase(sentence) + random.pick(joiner) + cliche + '.');
			addToArray(mySentence)
		} else {
		    		for (i in taggedWords) {
					    var taggedWord = taggedWords[i];
					    var word = taggedWord[0];
					    var tag = taggedWord[1];

					    if (tag === "IN") {
					    	return makePhrase(word)
					    } else if (tag === "TO") {
					 	   return getPhrase(word)    	
					    } else if (tag === "PDT") {
					    	return getPhrase(word)
					    }
					};

					function makePhrase(word) {
						var array = t.split(" ");
						var splitter = array.indexOf(word);
						var start = splitter + 1;
						var newArray = array.slice(start);
						var string = newArray.toString();
						var sentence = string.replace(/,/g," ");
						var finalSentence = sentence.replace(/  /g, " & ");
						var mySentence = (titleCase(finalSentence) + random.pick(joiner) + cliche + '.');
						addToArray(mySentence)
					};

					function getPhrase(word) {
						var array = t.split(" ");
						var splitter = array.indexOf(word);
						var newArray = array.slice(0, splitter);
						var string = newArray.toString();
						var sentence = string.replace(/,/g," ");
						var finalSentence = sentence.replace(/  /g, " & ");
						var mySentence = (titleCase(finalSentence) + random.pick(joiner) + cliche + '.');
						addToArray(mySentence)
					};
				}
		}
	});
	// generate some random nouns.
	var rNoun = wordpos.randNoun({count: 2}, function(rN){
		// define a variable to find underscores
		var cleanup = /_/g;
		// use it to replace underscores with spaces in each noun
		// we need to do this because wordpos creates them with underscores
		var noun1 = rN[0];
		var noun2 = rN[1];
		var cleanFirst = noun1.replace(cleanup, " ");
		var cleanSecond = noun2.replace(cleanup, " ");
		// initial capitalise
		var capOne = capitalise(cleanFirst);
		var capTwo = capitalise(cleanSecond);
		// if it's a three-letter word, it's probably a TLA so capitalise it.
		if (capOne.length == 3) {
			var cleanOne = capOne.toUpperCase();
		} else var cleanOne = capOne;
		if (capTwo.length == 3) {
			var cleanTwo = capTwo.toUpperCase();
		} else var cleanTwo = capTwo;
		// check for abbreviations
		var oneHasDots = /\w\./ig.test(cleanOne);
		var twoHasDots = /\w\./ig.test(cleanTwo);
		if (oneHasDots) {
			var clean1 = cleanOne.toUpperCase();
		} else var clean1 = cleanOne;
		if (twoHasDots) {
			var clean2 = cleanTwo.toUpperCase();
		} else var clean2 = cleanTwo;

		// randomly choose one of the top ten trending topics from Australian Twitter
		// remember if you're testing this that you can only hit the REST API 15 times
		// each 15 minutes (i.e. once every 60000 milliseconds)
		var rTrend = random.integer(1,11);
		var rT = rTrend - 1;
		T.get('trends/place', {id:'23424748'}, function(err, data, response){
			var trends = data[0];
			var tTopic = trends.trends[rT].name;
			// add a second sentence to options.txt
			var Option2 = '\n' + "How " + tTopic + " Can Transform " + cliche + ".";
			fs.appendFileSync('options.txt', Option2);
		});

		// append the final two sentences to options.txt
		var pairs = ["Why " + clean1 + " Could be the " + clean2 + " of Libraries.", "How Libraries are Bringing " + clean1 + " and " + clean2 + " Together at Last."]
		var Option3 = '\n' + random.pick(pairs);
		fs.appendFileSync('options.txt', Option3);
		var futurePast = ["Is " + clean1 + " the Future of Libraries?","Are Libraries the Original " + clean1 + "?", "Has " + clean1 + " Killed Libraries?"]
		var Option4 = '\n' + random.pick(futurePast);
		fs.appendFileSync('options.txt', Option4);

	});

	// randomly pick one of the lines we created in the phrases.txt file.
	var options = fs.readFileSync('options.txt').toString().split('\n');
	tweet = random.pick(options);

	//tweet the title!
	T.post('statuses/update', {status: tweet}, function(err, data, response){
		if (err) {
			console.log(err);
		}
	})

	// record when it looped to help with troubleshooting if needed
	var loopDate = new Date();
	console.log('looped at ' + loopDate);

	// clear out the file for the next run.
	fs.writeFileSync('options.txt', " ");
}
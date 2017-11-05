 // #####################################
// Library Conference Papers Bot v 1.5 ##
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
//initiate twit
var T = new Twit({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token: process.env.TWITTER_ACCESS_TOKEN,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// title case - capitalise each word in the string
function titleCase(string) {
		var phrase = "";
		var arr = string.split(" ");
		for (i=0; i < arr.length; i++) {
			str = arr[i];
			var first = str[0];
			// if the word includes a quote mark at the start, capitalise the next character instead
			if (first === '"' || first === "'") {
				newStr = str.charAt(0) + str.charAt(1).toUpperCase() + str.slice(2);
			// if it's already capitalised, just send it back - this avoids dropping the case on an acronym
			// note this will also mean we ignore numbers
			} else if (first == first.toUpperCase()){
				newStr = str;
			} else {
				newStr = str.charAt(0).toUpperCase() + str.slice(1);
			}
			phrase += (" " + newStr);
		}
	    return phrase.trim();
};

// clean up the words we get out of wordpos
var cleanUp = (function(){
	var phrase = "";
	return {
		spaceCap: function(x){
      try {
        // replace underscores with spaces and titlecase the result
  			var word = titleCase(x.replace(/_/g, " "));
  			return cleanUp.abbr(titleCase(word));
      } catch(e) {
        console.error(`************ \n Caught error at line 62: \n ${e}`)
        // on error restart loop
        startList(getNews, getRest)
      }

		},
		abbr: function(word){
			// capitalise abbreviations and three letter acronyms
			// unfortunately this also capitalises the occassional three letter word
			word = word.trim();
			if (word.length === 3 || /\w\./ig.test(word)) {
				word = word.toUpperCase();
			}
			phrase = "";
			return word;
		}
	}
})();

// organise sentences from the Reuters headlines
var addSentence = (function(){
	var array = [];
	function addItem(title){
		array.push(title)
	}
	return {
		// push an item into the array
		into: function(title){
			addItem(title);
		},
		// get the value of the array (used for testing).
		value: function(){
			return array;
		},
		// pick a random sentence from the array and add to the tweetables list
		choose: function(){
			var sentence = random.pick(array);
			array = [];
			return tweetables.put(sentence);
		}
	}
})();

// We collect possible phrases and send the tweet here when called
var tweetables = (function(){
	var array = [];
	function addOption(option){
		array.push(option);
	}
	return {
		put: function(option){
			addOption(option)
		},
		show: function(){
			// get the value of the array (used for testing).
			return array;
		},
		choose: function(){
			//tweet the title!
			T.post('statuses/update', {status: random.pick(array)}, function(err, data, response){
				if (err) {
					if (err.code == '170') {
						writeAbstracts();
						console.log("Restarted loop due to error 170.")
					} else {
						console.log(err);
					}
				} else {
					console.log(data.text);
				}
			});
			// clear the array for the next go-around
			array = [];
			// record when it looped to help with troubleshooting if needed
			var loopDate = new Date();
			console.log('Looped at ' + loopDate);
		}
	}
})();

// Set timeout to loop every 2.1 hours
var timerVar = setInterval (function () {writeAbstracts()}, 7.56e+6);

// Run the bot when the interval expires
function writeAbstracts() {

	function getNews(cliche){
		// set a Date variable for yesterday.
		var dateNow = new Date();
		var newest = dateNow - 8.64e+7;

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
			var joiner = [': What it Means for ',': Ramifications for ',': How it Could Revolutionise ',': How it Could Influence ',' - Why This Could be Bigger Than ','? Not Without '];

		    // get the bit AFTER the break word
			function makePhrase(word) {
				var position = t.indexOf(word) + word.length + 1;
				var finalSentence = t.slice(position);
				if (random.bool()){
					var mySentence = (titleCase(finalSentence) + random.pick(joiner) + cliche + '.');
				} else {
					var mySentence = ('What Does "' + titleCase(finalSentence) + '" Mean for ' + cliche + '?');
				}
				addSentence.into(mySentence);
			};
			// get the bit BEFORE the break word
			function getPhrase(word) {
				var position = t.indexOf(word);
				var finalSentence = t.slice(0,position);
				if (random.bool()){
					var mySentence = (titleCase(finalSentence) + random.pick(joiner) + cliche + '.');
				} else {
					var mySentence = (titleCase(finalSentence) + ' But Librarians Are Still Obsessed with ' + cliche + '.');
				}
				addSentence.into(mySentence);
			};

			// if there is a colon, break the headline there and use the bit before the colon
			// exclude anything that's simply 'Exclusive:'
			if (hasColon && (sentence !== 'Exclusive')) {
				var mySentence = (titleCase(sentence) + random.pick(joiner) + cliche + '.');
				 addSentence.into(mySentence);
			} else {
		    		for (i in taggedWords) {
					    var taggedWord = taggedWords[i];
					    var word = taggedWord[0];
					    var tag = taggedWord[1];
					    // check for useful break words (see https://www.npmjs.com/package/pos for more info on tags)
					    if (tag === "IN") {
					    	makePhrase(word);
					   	} else if (tag === "CC"){
					   		makePhrase(word);
					   	} else if (tag === "PDT") {
					    	getPhrase(word);
					    }
					}
				}
			}
		});

		feedparser.on('end', () => {
			// Once all the headlines have been checked, choose one of the sentences in the array and send off to the tweetables array
  			addSentence.choose();
		});
	};

	function getRest(cliche) {

	// randomly choose one of the top trending topics from Australian Twitter
	// excluding hashtags
	// remember if you're testing this that you can only hit the REST API 15 times
	// each 15 minutes (i.e. once every 60000 milliseconds)
	T.get('trends/place', {id:'23424748', exclude: 'hashtags'}, function(err, data, response){
		if (err) throw err;
		var trends = data[0].trends;
		// The API usually returns the top 50 trends, but we don't know how many aren't hashtags, so find out here.
		var trendsTotal = trends.length - 1;
		var rT = random.integer(0,trendsTotal);
		var tTopic = trends[rT].name;
			// add a second sentence to options.txt
			var Option2 = "How " + titleCase(tTopic) + " Can Transform " + cliche + ".";
			tweetables.put(Option2);
		});

		// generate some random nouns.
		var rNoun = wordpos.randNoun({count: 2}, function(rN){

			var noun1 = rN[0];
			var noun2 = rN[1];
			// clean up the wordpos output
			var clean1 = cleanUp.spaceCap(noun1);
			var clean2 = cleanUp.spaceCap(noun2);

			// append the final two sentences to options.txt
			var pairs = ["Why " + titleCase(clean1) + " Could be the " + titleCase(clean2) + " of Libraries.", "How Libraries are Bringing " + clean1 + " and " + titleCase(clean2) + " Together at Last.", "Is " + titleCase(clean1) + " the Next " + titleCase(clean2) + " of Libraries?"];
			var Option3 = random.pick(pairs);
			tweetables.put(Option3);
			var futurePast = ["Is " + titleCase(clean1) + " the Future of Libraries?","Are Libraries the Original " + titleCase(clean1) + "?", "Has " + titleCase(clean1) + " Killed Libraries?","Why Putting " + titleCase(clean1) + " in Libraries Isn't a Crazy Idea.",titleCase(clean2) + " Could be a Game Changer for Libraries.", "What This Year's Movers and Shakers are doing with " + titleCase(clean2) + ".", "Why Libraries Should be Lending " + titleCase(clean2) + "."];
			var Option4 = random.pick(futurePast);
			tweetables.put(Option4);
		});
		// now trigger the tweet
		tweetables.choose();
	};

	function startList(news, rest) {
		// use the random value to pick a line from the phrases.txt file.
		var phrases = fs.readFileSync('phrases.txt').toString().split('\n');
		var cliche = random.pick(phrases)
		// get the Reuters headlines
		news(cliche);
		// now get everything else
		rest(cliche);
	}

	// GO!
	// We do it like this to ensure that the Reuters feed is dealt with before anthing else runs
	startList(getNews, getRest)
};

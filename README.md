# lib_papers

This is a simple Twitter bot that tweets satirical and mostly non-sensical library conference paper titles.

The main file is fairly heavily commented so you should be able to follow along by reading the code. It uses a pre-populated list of cliche phrases, the top ten Twitter trending terms in Australia, the Reuters tech news RSS feed, and some random nouns, and mixes them up to create new conference paper topics. It them chooses one of four possibilities at random and tweets it. Every 2.1 hours it repeats the process.

## Version 2.0
Refactored to remove pointless self-invoking functions and server, added a bit more bug tracking, and generally cleaned up code that wasn't doing much. Minor title-casing and spacing fixes.

## Version 1.5
Fixed bug with Twitter trends, added more paper title structures, fixed some title-casing issues.
## Version 1.4
Filtered out hashtags from trends, to avoid being too spammy.

## Version 1.3
Bug fixes.

## Version 1.2
Brings in better parsing of the headlines, using *pos*, and some efficiencies in the use of random-js.

## Demo
See it in action at [@lib_papers](https://twitter.com/lib_papers).

## Requirements
* nodejs
* a twitter account and app keys
* put your keys in a .env file (not included in this repo for obvious reasons)

## NPM dependencies
* dotenv
* feedparser
* fs
* random-js
* request
* twit
* wordpos
* pos

## License
MIT (Hugh Rundle 2015-2016)

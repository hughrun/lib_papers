# lib_papers v 0.2

This is a simple Twitter bot that tweets satirical and mostly non-sensical library conference paper titles.

The main file is fairly heavily commented so you should be able to follow along by reading the code. It uses a pre-populated list of cliche phrases, the top ten Twitter trending terms in Australia, the Reuters tech news RSS feed, and some random nouns, and mixes them up to create new conference paper topics. It them chooses one of four possibilities at random and tweets it. Every 2.1 hours it repeats the process.

See it in action at [@lib_papers](https://twitter.com/lib_papers).

## Requirements
* nodejs ()
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

## license
MIT (Hugh Rundle 2016)
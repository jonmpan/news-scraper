var axios = require("axios");
var cheerio = require("cheerio");
var currentUser = require("../models/User.js");
var mongoose = require("mongoose");
mongoose.Promise = Promise;

module.exports = function(app){
	//Get homepage
	app.get('/', isLoggedIn, function(req,res){
		console.log('----------------------------------------------------');
		var hbsObject = {userInfo:{dataValues:req.user}};
		console.log(hbsObject);
		console.log('----------------------------------------------------');
		res.render('index', hbsObject);
	});

	app.get('/scrape',isLoggedIn,function(req,res){
		currentUser.findOne({_id:req.user._id}).then((userInfo)=>{
			console.log(userInfo);
			var hbsObject = {userInfo:{dataValues:userInfo}};
			res.render('scrape', hbsObject);
			// var results = [];
			// if(userInfo.subreddits.length > 0){
			// 	userInfo.subreddits.forEach((subreddit)=>{
			// 		scrapeSubreddit(subreddit,results);
			// 	})
			// }
		})
	})
}

function isLoggedIn(req, res, next){
		if(req.isAuthenticated()){
			// console.log('isAuthenticated'+req.user);
			return next();
		} else {
			// req.flash('error_msg', 'You are not logged in');
			console.log('not logged in');
			res.redirect('/users/login');
		}
}

function scrapeSubreddit(subreddit,results){
	axios.get("http://www.reddit.com"+subreddit).then((response)=>{
		var $ = cheerio.load(response.data);
		$("p.title").each(function(i, element) {
			var title = $(this).children("a").text();
			var link = $(this).children("a").attr("href");
			results.push({
				title:title,
				link:link
			})
		})
		console.log(results);
	})
}
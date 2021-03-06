var axios = require("axios");
var cheerio = require("cheerio");
var currentUser = require("../models/User.js");
var mongoose = require("mongoose");
mongoose.Promise = Promise;

function scrapeSubreddit(subreddit,res){
	axios.get("http://www.reddit.com"+subreddit).then((response)=>{
		var results = {
			subreddit:subreddit,
			urls:[]
		};
		var $ = cheerio.load(response.data);
		$("div.thing").each(function(i, element) {
			var title = $(this).children("div").children("div").children("p.title").children("a").text().replace(/"/g, '&quot;');
			var url = $(this).attr("data-permalink").replace(/"/g, '&quot;');
			var score = $(this).attr("data-score");
			var commentsCount = $(this).attr("data-comments-count");
			results.urls.push({
				title:title,
				url:url,
				score:score,
				commentsCount:commentsCount
			})
		})
		// console.log(results);
		res.json(results);
	})
}

function testScrapeSubreddit(subreddit){
	axios.get("http://www.reddit.com"+subreddit).then((response)=>{
		var results = {
			subreddit:subreddit,
			urls:[]
		};
		var $ = cheerio.load(response.data);
		$("div.thing").each(function(i, element) {
			var title = $(this).children("div").children("div").children("p.title").children("a").text().replace(/"/g, '&quot;');
			var url = $(this).attr("data-permalink").replace(/"/g, '&quot;');
			var score = $(this).attr("data-score");
			var commentsCount = $(this).attr("data-comments-count");
			results.urls.push({
				title:title,
				url:url,
				score:score,
				commentsCount:commentsCount
			})
		})
		// console.log(results);
		return results;
	})
}

module.exports = function(app){
	//Get homepage
	app.post('/api/scrape', isLoggedIn, function(req,res){
		console.log('attempt to scrape');
		console.log(req.body);
		var subreddit = req.body.subreddit;
		scrapeSubreddit(subreddit,res);
	});

	app.get('/api/testpushurl', isLoggedIn, function(req,res){
		var testObj = {
			url:"poop.com",
			comments:[],
			title:"i lik epoop"
		}
		currentUser.findOneAndUpdate(
			{_id:req.user._id},
			{$push: {"favorites": testObj}}
		).then(function(){
			currentUser.findById(req.user._id).then((result)=>{
				console.log(result);
				res.json(result);
			});
		});
	})

	// app.post('/api/checkfavorite', isLoggedIn, function(req,res){
	// 	console.log('checking favorites');
	// 	console.log(req.body);
	// 	res.json(true);
	// })

	app.get('/api/getuser', isLoggedIn, function(req,res){
		currentUser.findOne({_id:req.user._id},"favorites").then((result)=>{
			res.json(result);
		})
	})

	app.post('/api/favorite/new', isLoggedIn, function(req,res){
		console.log('New Favorite Start');
		var newFavorite = {
			url:req.body.url.replace(/"/g, '&quot;'),
			title:req.body.title.replace(/"/g, '&quot;'),
			comments:[]
		}
		currentUser.findOne({_id:req.user._id}).then((result)=>{
			var counter = 0;
			result.favorites.forEach((data)=>{
				if(data.title != req.body.title && data.url != req.body.url){
					counter++;
				}
			})
			console.log('counter:'+counter+' length: '+result.favorites.length);
			if(counter<result.favorites.length){
				console.log('already favorited');
				res.send('already favorited');
			}
			else{
				currentUser.findOneAndUpdate(
					{_id:req.user._id},
					{$push: {"favorites": newFavorite}}
				).then((result)=>{
					console.log('favorited');
					res.send('favorited');
				});
			}
		})
	})

	app.post('/api/favorite/delete', isLoggedIn, function(req,res){
		console.log('Remove Favorite Start');
		console.log(req.body.title);
		var removeFavorite = {
			url:req.body.url,
			title:req.body.title
		}
		currentUser.update({_id:req.user._id},{$pull:{favorites:{url:req.body.url,title:req.body.title}}}).then((result)=>{
			console.log('deleted or attempted to delete something');
			console.log(result);
			res.json(result);
		})
	})

	app.post('/api/addsubreddit', isLoggedIn, function(req,res){
		var subreddit = req.body.subreddit;
		// var subreddit = "poop";
		// var testUserId = "5ab1748431e21e6c7f283391";
		currentUser.findOneAndUpdate(
			{"_id":req.user._id},
			{$push:{"subreddits":subreddit}}
		).then(function(){
			currentUser.findById(req.user._id).then((result)=>{
				console.log(result);
				res.json(result);
			});
		});
	})

	app.post('/api/addcomment', isLoggedIn, function(req,res){
		var data = {
			comment:req.body.comment
		};
		var favoriteId = req.body.favoriteId;
		currentUser.findOneAndUpdate(
			{"favorites._id":favoriteId},
			{$push:{"favorites.$.comments": data } }
		).then(function(){
			currentUser.findById(req.user._id).then((result)=>{
				console.log(result);
				res.json(result);
			});
		});
	})

	app.post('/api/updatecomment', isLoggedIn, function(req,res){
		var commentUpdate = req.body.comment;
		var favoriteId = req.body.favoriteId;
		var commentId = req.body._id;

		currentUser.findById(req.user._id, function(err,userInfo){
			console.log(userInfo);
			userInfo.favorites.forEach((eachFavorite)=>{
				if(eachFavorite._id == favoriteId){
					eachFavorite.comments.forEach((eachComment)=>{
						if(eachComment._id == commentId){
							console.log("found comment");
							console.log(eachComment.comment);
							eachComment.comment = commentUpdate;
							console.log(eachComment.comment);
						}
					})
				}
			})
			userInfo.save(function(err){
				console.log('saved comment update');
				currentUser.findById(req.user._id).then((result)=>{
					console.log(result);
					res.json(result);
				});
			})
		})
	})

	app.post('/api/deletecomment', isLoggedIn, function(req,res){
		var commentId = req.body._id;
		var favoriteId = req.body.favoriteId;
		var tempCommentArray = [];

		currentUser.findById(req.user._id, function(err,userInfo){
			console.log(userInfo);
			userInfo.favorites.forEach((eachFavorite)=>{
				if(eachFavorite._id == favoriteId){
					eachFavorite.comments.forEach((eachComment)=>{
						if(eachComment._id == commentId){
							console.log("doing nothing");
						}
						else{
							console.log("pushing to temp array");
							tempCommentArray.push(eachComment);
						}
					})
				}
			})
			userInfo.favorites.forEach((eachFavorite)=>{
				if(eachFavorite._id == favoriteId){
					eachFavorite.comments = tempCommentArray;
					console.log(eachFavorite.comments);
				}
			})
			console.log('attempt to save after this');
			userInfo.save(function(err){
				console.log('hopefully deleted comment');
				currentUser.findById(req.user._id).then((result)=>{
					console.log(result);
					res.json(result);
				});
			})
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

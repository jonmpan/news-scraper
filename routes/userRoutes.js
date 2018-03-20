var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

module.exports = function(app){
	var User = require('../models/User.js');
	//Register
	function alreadyLoggedIn(req, res, next){
		if(req.isAuthenticated()){
			req.flash('success_msg','You are already logged in');
			res.redirect('/');
			
		} else {
			console.log('not logged in');
			return next();
		}
	}

	app.get('/users/register',alreadyLoggedIn,function(req,res){
		res.render('register');
	})
	//Login
	app.get('/users/login',alreadyLoggedIn,function(req,res){
		res.render('login');
	})

	//Registers new user
	app.post('/users/register',function(req,res){
		var name = req.body.name;
		var email = req.body.email;
		var username = req.body.username;
		var password = req.body.password;
		var password2 = req.body.password2;
		var subreddits = ["/","/r/mildlyinteresting"];

		var hbUserData = [{
			name,
			email,
			username,
			password,
			password2
		}]
		//Validation
		req.checkBody('name','Name is required').notEmpty();
		req.checkBody('email','Email is required').notEmpty();
		req.checkBody('email','Email is not valid').isEmail();
		req.checkBody('username','Username is required').notEmpty();
		req.checkBody('password','Password is required').notEmpty();
		req.checkBody('password2','Passwords do not match').equals(req.body.password);

		var errors = req.validationErrors();

		if(errors){
			console.log(errors);
			console.log('YES ERRORS');
			console.log(hbUserData);
			res.render('register', {
				errors,
				hbUserData
			});
		} else {
			User.getUserByUsername(username, function(err,userInfo){
				if(userInfo){
					var errors = [{param: 'username',
						msg: 'Username already exists',
						value: username
					}]
					console.log(userInfo);
					console.log('Username already exists');
					res.render('register', {	
						errors,
						hbUserData
					});
				}
				if(!userInfo){
					var query = {email:email};
					User.findOne(query,function(err,emailInfo){
						if(emailInfo){
							var errors = [{param: 'email',
								msg: 'Email already registered',
								value: email
							}]
							console.log('Email already registered');
							res.render('register', {	
								errors,
								hbUserData
							});
						}
						if(!emailInfo){
							var newUser = new User({
								name,
								email,
								username,
								subreddits,
								password
							});
							User.createUser(newUser,function(err, user){
								if(err) throw err;
								console.log(user);
							})
							req.flash('success_msg','You are registered and can now login');
							res.redirect('/users/login');
						}
					})
				}
			})
		}
	})

	passport.use(new LocalStrategy(
		function(username, password, done) {
			User.getUserByUsername(username, function(err,userInfo){
				if(err) throw err;
				if(!userInfo){
					return done(null, false, {message:'User Does Not Exist'});
				}

				User.comparePassword(password, userInfo.password, function(err, isMatch){
					if(err) throw err;
					if(isMatch){
						return done(null, userInfo);
					} else {
						return done(null, false, {message:'Invalid Password'});
					}
				});
			});
		}
	));

	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.getUserById(id, function(err, user) {
			done(err, user);
		});
	});

	app.post('/users/login',
		passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login', failureFlash:true}),
		function(req, res) {
			res.redirect('/');
		}
	);

	app.get('/users/logout', function(req, res){
		req.logout();
		req.flash('success_msg', 'You are logged out');
		res.redirect('/users/login');
	});
}
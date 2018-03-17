module.exports = function(app){
	//Get homepage
	app.get('/', isLoggedIn, function(req,res){
		console.log('----------------------------------------------------');
		var hbsObject = {userInfo:{dataValues:req.user}};
		console.log(hbsObject);
		console.log('----------------------------------------------------');
		res.render('index', hbsObject);

	});

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
}
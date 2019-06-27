//import modules
var mysql = require('mysql');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');

var nodemailer = require('nodemailer');app.use(bodyParser());
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

//store details for blog database connection
var con = mysql.createConnection({
    host: "aaifq4nujtbooh.croqfqilteuu.ap-south-1.rds.amazonaws.com",
    user: "aryanagarwala",
    password: "aryan123",   
    database: "tdcdb",
    port: '3306',
});

//store email details
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'thedebatecenter.com@gmail.com',
    pass: 'Avengedsevenfold1234!'
  }
});

//connect to blog database
con.connect(function(err){
    if(err) throw err;
    else console.log("Connected to Db");
});
//Start server
var port = process.env.PORT || 3000;
app.listen(port,()=>{
  console.log(`Listening on port ` + port);
    console.log(__dirname);
});

//Variable used in AJAX requests
var tosend;

//return title and id for the sidebars
function loadsidebar(res){
    con.query("SELECT TITLE,ID FROM Articles", function(err, result, fields){
        if(err) throw err;
        tosend = result;
        var yo = "";
        for(var i = 0;i<tosend.length;i++){
            yo+='<li id = \"'+ (i+1) +'\" index = \"' + tosend[i].ID + '\" onclick = \"renderarticle(' + (i+1) + ')\">' + tosend[i].TITLE + '</li>';
        }
        res.send(yo);
    });
}

//send article info to render
function sendinfo(req, res){
    con.query("SELECT TITLE,HYP,ARG,USERA, LIKES, Obj FROM Articles WHERE ID=" +  req.query.ID, function(err, result, fields){
        if(err) throw err;
        tosend = result;
        var i = 0;
        var likedusers = JSON.parse(result[0].Obj).likers;
        for(var a = 0;a<likedusers.length;a++){
            if(likedusers[a]==req.query.user){
                i = 1;
            }
        }
        var yo = {title:result[0].TITLE, hyp: result[0].HYP, arg: result[0].ARG, likes: result[0].LIKES, user: result[0].USERA, liked: i};
        res.send(yo);
    });
    con.query("UPDATE Articles SET VIEWS = VIEWS + 1 WHERE ID=" + req.query.ID, function(err, result, fields){
    });
}

//send debate info to render
function senddebate(req, res){
    con.query("SELECT Obj FROM Articles WHERE ID = " + req.query.ID, function(err, result, fields){
        if(err) throw err;
        var obj = JSON.parse(result[0].Obj);
        var liked;
        var side = "0";
        if(obj.likersfor.indexOf(req.query.user)>=0){
            liked = 1;
        }
        else if(obj.likersagainst.indexOf(req.query.user)>=0){
            liked = 2;
        }
        for(var i = 0;i<obj.debatesfor.length;i++){
            if(obj.debatesfor[i][1] == req.query.user)
                side = "for";
        }
        for(var i = 0;i<obj.debatesagainst.length;i++){
            if(obj.debatesagainst[i][1] == req.query.user)
                side = "against";
        }
        var tosend = {fordeb : obj.debatesfor, againstdeb: obj.debatesagainst, likesfor: obj.likersfor.length, likesagainst: obj.likersagainst.length, liked: liked, side: side};
        console.log(tosend);
        res.send(tosend);
    });
}

//add a new article
function insert(title, hypothesis, arg, user){
    con.query(`INSERT INTO Articles (TITLE, HYP, ARG, USERA, Obj) VALUES ('${title}', '${hypothesis}', '${arg}', '${user}', '{"likers":[],"debatesfor":[],"debatesagainst":[],"likersfor":[],"likersagainst":[]}')`, function(err, result, fields){
        if(err) throw err;
        con.query('SELECT Obj FROM `User Accounts` WHERE USERNAME = \'' + user + "\'", function(err, result, fields){
           if(err) throw err;
            var obj1 = JSON.parse(result[0].Obj);
            obj1.articles.push(title);
            con.query('UPDATE `User Accounts` SET Obj = \'' + JSON.stringify(obj1) + '\' WHERE USERNAME = \'' + user + "\'", function(err, result, fields){});
        });
        con.query('SELECT Obj FROM `User Accounts` WHERE USERNAME = \'' + user + "\'", function(err, result, fields){
           if(err) throw err;
            var obj1 = JSON.parse(result[0].Obj);
            obj1.articles.push(title);
            con.query('UPDATE `User Accounts` SET Obj = \'' + JSON.stringify(obj1) + '\' WHERE USERNAME = \'' + user + "\'", function(err, result, fields){});
        });
    });
}

//like/unlike an article
function like(req, res){
    con.query("SELECT LIKES, Obj FROM Articles WHERE ID=" + req.query.ID, function(err, result, fields){
        if(err) throw err;
        var likes = result[0].LIKES;
        var i = 0;
        var obj1 = JSON.parse(result[0].Obj);
        var likes1 = obj1.likers;
        for(var a = 0;a<likes1.length && i===0;a++){
            if(likes1[a]===req.query.user){
                i = 1;
                break;
            }
        }
        if(i===0){
            likes+=1;
            likes1.push(req.query.user);
        }
        else{
            likes-=1;
            likes1.splice(likes1.indexOf(req.query.user), 1);
        }
        obj1.likers = likes1;
        var stringver = JSON.stringify(obj1).replace(/\'/g, "\\\'");
        con.query(`UPDATE Articles SET LIKES =  ${likes}, Obj = '${stringver}' WHERE ID = ${req.query.ID}`, function(err, result, fields){
            if(err) throw err;
        });
    });
}

//checking if username or email address is already taken while signing up
function validate(req, res){
    con.query("SELECT USERNAME, EMAIL FROM `User Accounts` WHERE USERNAME = \'" +req.query.name +'\' OR EMAIL = \'' + req.query.email +'\'', function(err, result, fields){
        if(err) throw err;
        if(result.length<1){
            res.send("Okay!")
        }
        else{
            if(req.query.email === result[0].EMAIL){
                res.send("ee");
            }
            else{
                res.send("eu");
            }
        }
    });
}

//add new user account
function adduser(req, res){
    const username = req.body.user;
    const password = req.body.pass;
    const email = req.body.email;
    const code = Math.trunc(Math.random()*10000000000);
    const userws = username.replace(/ /g,"%20");
    const text = 'thedebatecenter.com/confirmacc?user=' + userws +'&code=' + code;
    con.query('INSERT INTO `User Accounts` (USERNAME, PASSWORD, EMAIL, CODE, Obj) VALUES (\''+username+'\',\''+ password+'\',\''+email+'\',\''+ code +'\',\'' + '{"articles":[]}' +'\')', function(err, result, fields){
        if(err) throw err;
    });
    var mailOptions = {
        from: 'The Debate Center',
        to: email,
        subject: 'The Debate Center: Confirmation. DO NOT REPLY.',
        text: `Click on this link to confirm your account:\n${text}`
    }
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
        } else {
        }
    });
}

//format the article correctly
function format(req){
    var title = req.body.title.replace(/\r\n/g,'</p><p>');
    title = title.replace(/\'/g, "\\\'");
    var hypothesis = req.body.hypothesis.replace(/\r\n/g,'</p><p>');
    hypothesis = hypothesis.replace(/\'/g, "\\\'");
    var arg = req.body.arg.replace(/\r\n/g,'</p><p>');
    arg = arg.replace(/\'/g, "\\\'");
    insert(title.trim(), hypothesis.trim(), arg.trim(), req.query.user);
}

//email confirmation
function confirm(req,res){
    con.query('SELECT CODE FROM `User Accounts` WHERE USERNAME = \'' + req.query.user +'\'', function(err, result, fields){
        if(err) throw err;
        if(result[0].code == req.body.code){
            con.query('UPDATE `User Accounts` SET CONFIRM = 1, CODE = ' + Math.random()*10000000000 + ' WHERE USERNAME = \'' + req.query.user +'\'', function(err, result, fields){
                if(err) throw err;
                res.render('confirmed.html');
            });
        }
        else{
            res.render('invalid.html');
        }
    });
}

//log in 
function login(req, res){
    con.query("SELECT PASSWORD, CONFIRM FROM `User Accounts` WHERE USERNAME = \'" + req.body.user + "\'", function(err, result, fields){
        if(err) throw err;
        if(req.body.pass === result[0].PASSWORD && result[0].CONFIRM === 1)
            res.render('loggedin.html');
        else
            res.render('incorrectpassword.html');
    });
}

//delete an article
function deleteart(req, res){
    con.query("SELECT TITLE FROM Articles WHERE ID = " + req.query.ID, function(err,res,fields){
        if(err) throw err;
        con.query("SELECT Obj FROM `User Accounts` WHERE USERNAME = \'" + req.query.user + "\'", function(err,result,fields){
            if(err) throw err;
            var obj1 = JSON.parse(result[0].Obj);
            obj1.articles.splice(obj1.articles.indexOf(res[0].TITLE), 1);
            var stringver = JSON.stringify(obj1);
            con.query("UPDATE `User Accounts` SET Obj = \'" + stringver + "\' WHERE USERNAME = \'" + req.query.user +"\'" , function(err,result,fields){
                if(err) throw err;
            });
        });
    });
    con.query("DELETE FROM Articles WHERE ID = " + req.query.ID, function(err,result,fields){
        if(err) throw err;
        res.send("Done");
    });
}

//add a debate
function adddebate(req, res){
    con.query("SELECT Obj FROM Articles WHERE ID = " + req.query.ID, function(err,result,fields){
        if(err) throw err;
        var arg = req.body.arg.replace(/\r\n/g,'</p><p>').trim();
        arg = arg.replace(/\'/g, "\\\'").replace(/\"/g, "\\\"");
        var obj = JSON.parse(result[0].Obj);
        var deb9 = [arg, req.query.user];
        if(req.query.side === 'for'){
            obj.debatesfor.push(deb9);
        }
        else{
            obj.debatesagainst.push(deb9);
        }
        var objinsert = JSON.stringify(obj);
        con.query('UPDATE `Articles` SET Obj = \'' + objinsert + '\' WHERE ID = \'' + req.query.ID + "\'", function(err, res, fields){});
    });
}


//Check if there's a title match
function checksub(req, res){
    var title = req.query.title.replace(/\r\n/g,'</p><p>');
    title = title.replace(/\'/g, "\\\'").trim();
    con.query("SELECT TITLE FROM Articles WHERE TITLE = \'" + title + '\'', function(err, result, fields){
        if(err) throw err;
        if(result.length<1){
            res.send("0");
        }
        else{
            res.send("1");
        }
    });
}

//Load the table for the user page
function table(req, res){
    con.query("SELECT TITLE, VIEWS, LIKES, DATEA, WINS FROM Articles WHERE USERA = \'" + req.query.user + "\'", function(err, result, fields){
        if(err) throw err;
        var tosend = {title:[], views:[], likes:[], datea:[], wins:[]};
        for(var i = 0;i < result.length;i++){
            tosend.title.push(result[i].TITLE);
            tosend.views.push(result[i].VIEWS);
            tosend.likes.push(result[i].LIKES);
            tosend.datea.push(result[i].DATEA);
            tosend.wins.push(result[i].WINS);
        }
        res.send(tosend);
    });
}

//like a debate side
function likedebate(req, res){
    con.query("SELECT Obj FROM Articles WHERE ID = " + req.query.ID, function(err, result, fields){
        var side = req.query.side;
        var obj = JSON.parse(result[0].Obj);
        if(side==='for'){
        obj.likersfor.push(req.query.user);
        }
        else{
        obj.likersagainst.push(req.query.user);
        }
        con.query("UPDATE Articles SET Obj = \'" + JSON.stringify(obj) +"\' WHERE ID = " +req.query.ID, function(err, result, fields){
            res.send("ok");
        });
    });
}

//unlike a debate side
function unlikedebate(req, res){
    con.query("SELECT Obj FROM Articles WHERE ID = " + req.query.ID, function(err, result, fields){
        if(err) throw err;
        var obj = JSON.parse(result[0].Obj);
        var side = req.query.side;
        if(side==='for'){
            obj.likersfor.splice(obj.likersfor.indexOf(req.query.user), 1);
        }
        else{
            obj.likersagainst.splice(obj.likersagainst.indexOf(req.query.user), 1);
        }
        con.query("UPDATE Articles SET Obj = \'" + JSON.stringify(obj) +"\' WHERE ID = " + req.query.ID, function(err, result, fields){
            res.send("ok");
    });
    });
}
//return title and id for the user sidebar
function loadusersidebar(res){
    con.query("SELECT USERNAME,ID FROM `User Accounts`", function(err, result, fields){
        if(err) throw err;
        tosend = result;
        var yo = "";
        for(var i = 0;i<tosend.length;i++){
            yo+='<li id = \"'+ (i+1) +'\" index = \"' + tosend[i].ID + '\" onclick = \"renderuser(' + (i+1) + ')\">' + tosend[i].USERNAME + '</li>';
        }
        console.log(yo);
        res.send(yo);
    });
}
app.get('/load', (req, res, next)=>{
    loadsidebar(res);
});
app.get('/loaduser', (req, res, next)=>{
    console.log("HELLO");
    loadusersidebar(res);
});
app.post('/deb', (req, res, next)=>{
    adddebate(req,res);
    res.render("redir.html");
});
app.post('/sub', (req, res)=>{
    format(req);
    res.render('Thank.html')
});
app.post('/signup', (req, res)=>{
    adduser(req,res);
    res.render('signupconfirm.html');
});
app.post('/login', (req, res)=>{
    login(req,res);
});
app.get('/render', (req, res, next)=>{
    sendinfo(req, res);
});
app.get('/renderdebate', (req, res, next)=>{
    senddebate(req, res);
});
app.get('/like', (req, res, next)=>{
    like(req, res);
    res.send("bs");
});
app.get('/validate', (req, res, next)=>{
    validate(req, res);

});
app.get('/confirmacc', (req, res, next)=>{
    confirm(req, res);

});
app.get('/delete', (req, res, next)=>{
    deleteart(req, res);

});
app.get('/checksub', (req, res, next)=>{
    checksub(req, res);

});
app.get('/table', (req, res, next)=>{
    table(req, res);

});
app.get('/likedebate', (req, res, next)=>{
    likedebate(req, res);

});
app.get('/unlikedebate', (req, res, next)=>{
    unlikedebate(req, res);

});
app.get('/', (req, res, next)=>{
    res.render("index.html");

});
// global vars
var game;
var message;

// start game when page is loaded
$(document).ready(function(){
  game = new Game();
  message = new Message("Press Space to Play");
  
  game.init();
  
  // detect keypresses
  $(document).keydown(function(evt){
    var fireKeyNormalEvent = game.keyDown(evt);
    if(!fireKeyNormalEvent) evt.preventDefault();
  });
  $(document).keyup(function(evt){ 
    var fireKeyNormalEvent = game.keyUp(evt);
    if(!fireKeyNormalEvent) evt.preventDefault();
  });
  
  $('#message').on('click','.playbutton',function(event){
	  event.preventDefault();
	  game.keyDown(32);
	  setTimeout(function(){ game.keyUp(32); },10);
  });
  

	$(document).bind(
	  'touchmove',
	  function(event) {
	    event.preventDefault();
	  }
	);
  
  
  $('#canvas,body').on("swiperight", function(event){
	  event.preventDefault();
	  game.keyDown(39);
	  setTimeout(function(){ game.keyUp(39); },10);
  });    
  
  $('#canvas,body').on("swipeleft", function(event){
	  event.preventDefault();
	  game.keyDown(37);
	  setTimeout(function(){ game.keyUp(37); },10);
  });
  
  $('#canvas,body').on("swipeup", function(event){
	  event.preventDefault();
	  game.keyDown(38);
	  setTimeout(function(){ game.keyUp(38); },10);
  });
  
  $('#canvas,body').on("swipedown", function(event){
	  event.preventDefault();
	  game.keyDown(40);
	  setTimeout(function(){ game.keyUp(40); },10);
  });

});

// Point class
function Point(x,y)
{  
  this.x = x;
  this.y = y;
}

function lengthOfLine(x1,y1,x2,y2)
{
  if(x1 == x2)
    return Math.abs(y1-y2);
  else if (y1 == y2)
    return Math.abs(x1-x2);
}

function pointExistsOnLine(a,b, point)
{
  pointOnLine = false;
  
  if(a.x == b.x && point.x == a.x && isBetween(a.y, b.y, point.y)) pointOnLine = true; // vertical line
  else if(a.y == b.y && point.y == a.y && isBetween(a.x, b.x, point.x)) pointOnLine = true; // horizontal line
  
  return pointOnLine;
}

function pointExistsInBox(box, point)
{
  if(point.x >= box.x && point.x <= box.x+box.width && point.y >= box.y && point.y <= box.y+box.height)
    return true;
}

function isBetween(a,b,p)
{
  between = false;
  
  if(a > b) // line runs bottom to top
  {
    if(p <= a && p >= b)
      between = true;
  }  
  else if(b > a) // line runs top to bottom
  {
    if(p <= b && p >= a)
      between = true;    
  }
  
  return between;
}



//==// GAME CLASS //==//

// worm todo:
// figure out inheritance for obstacles
// levels

function Game()
{
  // game control
  this.frameInterval = 30;
  this.maxIterationsBetweenObstacles = 250;
  this.minIterationsBetweenObstacles = 50;
  this.firstObstacle = 5;
  this.scale = 6;
  this.width = 100;
  this.height = 100;
  
  this.gameOver = false;
  
  this.pointsLost = 0;
  
  // SCORE
  this.score = 0;
  this.extrascore = 100;
  
  this.doublePoints = 0;
  
  // temporary
  this.stopgameafteriterations = 0; // 0 turns this off
  this.currentiterations = 0;
  
  this.canvas = document.getElementById('canvas');
  this.ctx;
  
  // game timing
  this.intervalVar;
  this.gameRunning = false;

  // game size
  $("#canvas").attr("width",this.width*this.scale);
  $("#canvas").attr("height",this.height*this.scale);
  $("#wrap").css("width",this.width*this.scale +2 +"px"); // +2 for border
  $("#wrap").css("height",this.height*this.scale +2 +"px");
  
  $("#message").css("width",this.width*this.scale -40 +"px");
  
  $("#message").css("top",(this.height*this.scale)/2 - 275 + "px");
  
  // game objects
  this.worms;
  this.obstacles;
  
  this.nextObstacle; // frames until the next apple is created
  
  // input
  this.rightKey = false;
  this.leftKey = false;
  this.upKey = false;
  this.downKey = false;

  if (this.canvas.getContext)
  {
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(this.scale,this.scale);
    this.ctx.lineCap = "square";
    this.ctx.lineJoin = "square";
    this.ctx.strokeStyle = "#000";
  }
  else
  {
    // browser doesn't support canvas
    alert('your browser kinda sucks buddy!');
  }
}

Game.prototype.init = function()
{
  this.worms = [];
  this.obstacles = [];
  this.nextObstacle = this.firstObstacle;
  
  this.score = 0;
  this.extrascore = 100;
  this.pointsLost = 0;
  this.doublePoints = 0;
  
  this.gameOver = false;
  
  clearInterval(this.intervalVar);
  this.gameRunning = false; // will wait for user input to begin
  
  // create a worm
  this.worms.push(new Worm(this.width/2,0,this.width/2,-10));
  
  this.updateScore();
}

Game.prototype.frame = function()
{
  // timing
  var start = new Date().getTime();

  
  this.ctx.clearRect(0, 0, this.width, this.height);
  
  // temporary
  this.currentiterations++;
  if(this.stopgameafteriterations!=0 && this.currentiterations>=this.stopgameafteriterations)
    this.pause();
  
  // check for keypresses for worm 0 (human) and execute turn if found
  if(this.rightKey) {this.worms[0].turn("e"); this.rightKey=false;}
  else if(this.leftKey) {this.worms[0].turn("w"); this.leftKey=false;}
  else if(this.upKey) {this.worms[0].turn("n"); this.upKey=false;}
  else if(this.downKey) {this.worms[0].turn("s"); this.downKey=false;}
  
  // obstacles
  for(var i=0;i<this.obstacles.length;i++)
  {
    this.obstacles[i].act(this.ctx)
  }    
  
  // worms
  for(var i=0;i<this.worms.length;i++)
  {      
    this.worms[i].act(this.ctx);
  }
  
  // new obstacles
  if(this.nextObstacle > 0) this.nextObstacle--;
  else this.addObstacle();
    
  // handle score
  // double points effects
  if(game.doublePoints > 0) this.doublePoints--;  
  if(this.pointsLost > 0) {
    this.extrascore--;
    this.pointsLost--;
    this.updateScore();
  }
  
  this.drawScore(this.score);
}
  
Game.prototype.pause = function()
{
  clearInterval(this.intervalVar);
  this.gameRunning = false;
  
  message.pause(this.score);
}

Game.prototype.play = function()
{
  if(this.gameOver) this.init();

  var game = this;
  this.intervalVar = setInterval(function(){ game.frame() }, this.frameInterval);
  this.gameRunning = true;
  
  message.clear();
}

Game.prototype.lose = function(worm)
{
  //print you lost
  message.lose(this.score);
  
  // reset game
  clearInterval(this.intervalVar);
  this.gameRunning = false;
  this.gameOver = true;
}

Game.prototype.updateScore = function()
{
  this.score = this.worms[0].checkLength() + this.extrascore - 110;
  this.drawScore();
}

Game.prototype.drawScore = function()
{
  this.write(this.score, 1, this.height-1);
  if(this.doublePoints > 0) {
      this.write('x', this.width-4, this.height-1, 2);
      this.write('2', this.width-3, this.height-1);
  }
}

Game.prototype.write = function(text,x,y,size)
{
  if(typeof size !== 'number') size = 3;
  this.ctx.beginPath();
  this.ctx.font = 'normal '+size+'px ArcadeClassic';
  this.ctx.fillStyle = 'rgb(0,0,0)';
  this.ctx.fill();
  this.ctx.fillText(text, x, y);
  this.ctx.closePath();
}

Game.prototype.saveScore = function(name)
{
  var score = this.score
  $.post( "save_highscore.php", { name: name, score: score  })
  .done(function( data ) {
  	message.scoreboard();
  });
}

Game.prototype.keyDown = function(evt)
{
  var key;
  if(typeof evt == 'number') key = evt;
  else key = evt.keyCode;
  
  var fireKeyNormalEvent = true;
  
  if (key == 39) this.rightKey = true;
  else if (key == 37) this.leftKey = true;
  else if (key == 38) {
  	if(this.gameRunning) this.upKey = true;
  	else $('.score-prev:visible').trigger('click');
  }
  else if (key == 40) {
  	if(this.gameRunning) this.downKey = true;
  	else $('.score-next:visible').trigger('click');
  }
  else if (key == 13) { // enter for highscore form
    if($('.highscore').is(":focus")) $('.highscore_save').trigger('click');
  }  
  else if (key == 32) { // space for pause
    
    if($('.highscore').is(":focus") && $.trim($('.highscore').val()) == "") $('.highscore_save').trigger('click');
    
    if(! $('.highscore').is(":focus")) {
      if(this.gameRunning)
        this.pause();
      else
        this.play();
        
      fireKeyNormalEvent = false;
    }
  }
  
  return fireKeyNormalEvent;
}

Game.prototype.keyUp = function(evt)
{
  var key;
  if(typeof evt == 'number') key = evt;
  else key = evt.keyCode;

  var fireKeyNormalEvent = true;
  
  if (key == 39) this.rightKey = false;
  else if (key == 37) this.leftKey = false;
  else if (key == 38) this.upKey = false;
  else if (key == 40) this.downKey = false;  
  
  return fireKeyNormalEvent;  
}

Game.prototype.addObstacle = function()
{
  this.nextObstacle = Math.floor( Math.random()*(this.maxIterationsBetweenObstacles - this.minIterationsBetweenObstacles) ) + this.minIterationsBetweenObstacles;
  this.obstacles.push( new Obstacle( Math.floor(Math.random()*(this.width-2)), Math.floor(Math.random()*(this.height-2)) ) );
}



//==// WORM CLASS //==//

function Worm(head_x, head_y, tail_x, tail_y)
{
  this.head = new Point(head_x, head_y);
  this.tail = new Point(tail_x, tail_y);
  this.points = [];
  this.direction = "s";
  
  this.toGrow = 0; // the number of steps to grow
  
  this.points.push(this.tail);
  this.points.push(this.head);
}

Worm.prototype.act = function(ctx)
{
  this.move();
  this.draw(ctx);
  this.detectCollision();
}

Worm.prototype.draw = function(ctx)
{
  // start drawing at the tail
  ctx.beginPath();
  ctx.moveTo(this.tail.x,this.tail.y);
  
  // plot our points
  for(var i=1;i<this.points.length;i++)
  {
    ctx.lineTo(this.points[i].x,this.points[i].y);
  }
  
  ctx.stroke();
}

Worm.prototype.move = function()
{
  // MOVE THE HEAD
  switch(this.direction)
  {
    case "s":
      // add to y
      this.head.y += 1;
    break;
    case "n":
      // subtract from y
      this.head.y -= 1;      
    break;      
    case "e":
      // add to x
      this.head.x += 1;
    break;
    case "w":
      // subtract from x
      this.head.x -= 1;  
    break;        
  }
  
  //  points get removed as the tail reaches them
  
  if(this.tail.x == this.points[1].x && (this.tail.y == this.points[1].y)) // tail has reached point
  {
    this.tail = this.points[1];
    this.points.shift(); // remove tail
  }
  
  // MOVE THE TAIL
  
  if(this.toGrow == 0) // only move tail if we're not growing, because that's how we grow! :D
  {
    // move tail towards next point
    if(this.tail.x == this.points[1].x) // moving vertically
    {
      if(this.tail.y < this.points[1].y) // moving south
        this.tail.y += 1;
      else           // moving north
        this.tail.y -= 1;
    }
    else if(this.tail.y == this.points[1].y) // if moving horizontally    
    {
      if(this.tail.x < this.points[1].x) // moving east
        this.tail.x += 1;
      else           // moving west
        this.tail.x -= 1;  
    }
  }
  else
  {
    this.toGrow--;
    
    game.updateScore();
  }
}

Worm.prototype.turn = function(direction)
{
  var oppositeDir;

  switch(this.direction)
  {
    case "s":
      oppositeDir = "n";
      break;
    case "n":
      oppositeDir = "s";
      break;      
    case "e":
      oppositeDir = "w";
      break;
    case "w":
      oppositeDir = "e";  
      break;        
  }

  if(direction != oppositeDir) {
    this.direction = direction;
  
    // new head
    this.head = new Point(this.head.x,this.head.y);
    this.points.push(this.head);
  }
}

Worm.prototype.grow = function(amount)
{
  this.toGrow+=amount;
}

Worm.prototype.detectCollision = function()
{
  var collisions = 0;
  
  // checks for collisions with self
  for(var i=0;i<this.points.length-1;i++) // loops through points
  {
    // check if head overlaps with any point on the worm's body
    // this will always fire at least once when we check the head against itself
    if( pointExistsOnLine(this.points[i], this.points[i+1], this.head) )
      collisions++;
  }
  if(collisions>1) this.collide(); // collided with ourself!
  
  
  // checks for collisions with walls
  if(this.head.x < 0 || this.head.x > game.width || this.head.y < 0 || this.head.y > game.height)
    game.lose(this);
  
  // checks for collisions with obstacles
  for(var i=0;i<game.obstacles.length;i++) // loops through obstacles
  {
    // check if head overlaps with any point on the worm's body
    // this will always fire at least once when we check the head against itself
    if( pointExistsInBox(game.obstacles[i], this.head) )
    {
      game.obstacles[i].collide(this); // if we found a collision
    }
  }
  
}

Worm.prototype.collide = function()
{
  game.lose(this);
}

Worm.prototype.checkLength = function()
{
  var l = 0;
  
  for(i=0;i<this.points.length;i++)
  {
    if(i+1 < this.points.length) // if we're not done
    {
      l += lengthOfLine(this.points[i].x,this.points[i].y, this.points[i+1].x,this.points[i+1].y)
    }
  }
  
  return l;
}


//==// OBSTACLE CLASS //==//

var ICONS = {
  "pack": [
      //[img,      grow, weight, pointslost, life, explodetime] 
        [0, 5, 1000, 0], // dot
        [1, 10, 200, 0], // larger dot
        [2, 0, 100, 1, 2000, 10], // ? box
        [3, 15, 20, 0], // cherry
        [4, 20, 10, 0],
        [5, 0, 30, 0, 1500, 21], // crossbones
        [6, 16, 25, 0],
        [7, 10, 20, 0],
        [8, 20, 19, 0],
        [9, 21, 18, 0],
        [10, 22, 17, 0],
        [11, 23, 16, 0],
        [12, 24, 15, 0],
        [13, 25, 14, 0],
        [14, 26, 13, 0],
        [15, 27, 12, 0],
        [16, 28, 10, 0],
        [17, 29, 9, 0],
        [18, 30, 8, 0],
        [19, 30, 7, 0],
        [20, 30, 6, 0],
        [21, 125, 60, 0, 50, 10], // pacman monster
        [22, 30, 5, 0],
        [23, 30, 5, 0],
        [24, 30, 5, 0],
        [25, 30, 5, 0],
        [26, 30, 5, 0],
        [27, 35, 4, 0],
        [28, 40, 3, 0],
        [29, 50, 2, 0],
        [30, 0, 1, 0], // heart
        [31, 50, 50, 0, 200, 21] // bomb
    ]
};

function Obstacle(x, y)
{
  this.x = x;
  this.y = y;
  this.width = 16/game.scale;
  this.height = 16/game.scale;
  
  this.age = 0;
  this.maxAge = 2000;
  
  this.explodeFrames = -1; // number of frames something sticks around
  
  this.ICONSet = 'pack';
  this.pickedICON = this.getRandomImage(ICONS[this.ICONSet]);

  // adjust maxAge
  if(typeof this.pickedICON[4] === 'number') this.maxAge = this.pickedICON[4];
  
  this.image = new Image();
  this.image.src = "food/"+this.ICONSet+"/"+this.pickedICON[0]+".png";
}

Obstacle.prototype.act = function(ctx)
{
  // obstacles show an explode effect
  if(this.explodeFrames > 0)
  {
    if(this.pickedICON[0] == 2 || this.pickedICON[0] == 5 || this.pickedICON[0] == 21 || this.pickedICON[0] == 31) this.explodeImage(); // bombs switch exploding images
    this.explodeFrames--;
  }
  
  // objects age
  this.age++;
  if(this.explodeFrames == 0) this.destroy();
  else if(this.explodeFrames == -1 && this.age > this.maxAge) this.explode();
  
  // draw obstacle
  this.draw(ctx);
}

Obstacle.prototype.explode = function()
{
  this.explodeFrames = 4;
  if(typeof this.pickedICON[5] === 'number') this.explodeFrames = this.pickedICON[5];
  this.explodeImage();
}

var explodeImages;
imgpreload(["food/pack/explode0.png","food/pack/explode1.png","food/pack/explode2.png"], function( images ) {
	explodeImages = images;
});

Obstacle.prototype.explodeImage = function()
{
  var explodeNum = Math.floor(Math.random() * 3); // different explosion types
  this.image = explodeImages[explodeNum];
}

Obstacle.prototype.draw = function(ctx)
{  
  ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
}

Obstacle.prototype.collide = function(worm)
{
 if(this.explodeFrames == -1) {
	  var toGrow = this.pickedICON[1];
	  var toLose = this.pickedICON[3];
	
	  switch(this.pickedICON[0])
	  {
	    case 2: // cactus / ? box
	      if(Math.random() <= .1) toGrow += 100;
	      break;
	    case 3: // cherry
	      game.doublePoints += 1500;
	      break;
	    case 5: // skull
	      game.lose(worm);
	      break;
	    case 21: // pacman monster
	      game.doublePoints += 750;
	      break;
	    case 30: // heart
	      toGrow += game.score;
	      break;
	    case 31: // exploding bomb
	      if(this.age > this.maxAge) game.lose(worm);
	      break;
	  }
	
	  // apply
	  if(game.doublePoints > 0) toGrow *= 2;
	  if(toGrow > 0) worm.grow(toGrow);
	  game.pointsLost += toLose;
	  
	  this.explode();
  }
}

Obstacle.prototype.getRandomImage = function(level) {
    var fishTotalWeight = 0, fishCumWeight = 0, i;
    // sum up the weights
    for (i = 0; i < level.length; i++) {
        fishTotalWeight += level[i][2];
    }
    var random = Math.floor(Math.random() * fishTotalWeight);
    // now find which bucket out random value is in

    for (i = 0; i < level.length; i++) {
        fishCumWeight += level[i][2];
        if (random < fishCumWeight) {
            return(level[i]);
        }
    }
}

Obstacle.prototype.destroy = function()
{
  for(var i=0;i<game.obstacles.length;i++)
  {
    if(game.obstacles[i] == this)
    {
      game.obstacles.splice(i,1); // remove this obstacle
    }
  }
}



//==// MESSAGE CLASS //==//

function Message()
{
  // starting message
  $("#message").html('<strong class="title">- WORM -</strong>\n<p class="controls">Control worm <img src="img/keys.png" alt="" class="arrow key"> Arrow keys</p><p>To &nbsp;Play <a href="play" class="playbutton"><img src="img/space.png" class="space key" alt=""></a> Space</p>');  
  
  // SCOREBOARD
  this.scoreboard();
}

Message.prototype.scoreboard = function()
{
  if($('.scoreboard').length == 0) $("#message").append('<h3 class="scores">High Scores</h3><div class="scoreboard" style="display:none;"></div><a href="prev page" class="score-page score-prev hidden"><span>prev</span></a><span class="score-pagenum hidden">0</span><a href="next page" class="score-page score-next hidden"><span>next</span></a>');
  this.page = 0;
  this.loadScoreboard(this.page,function(){
	  $('.score-next').fadeIn(200);
  });
  var message = this;
  $('.score-page').on('click',function(event){
    event.preventDefault();
    var arrow = $(this);
    
    // change page
    if(arrow.hasClass('score-prev')) message.page--;
    else message.page++;
    
    // load board
    $(".scoreboard").fadeOut(300,function(){
      message.loadScoreboard(message.page);
    });
    
    // control hiding/showing of arrows / page number
    $('.score-pagenum').text(message.page+1);
    
    if(message.page == 0) $('.score-prev,.score-pagenum').hide();
    else $('.score-prev,.score-pagenum').show();
    
    if(message.page == 2) $('.score-next').hide();
    else $('.score-next').show();
  });
}

Message.prototype.loadScoreboard = function(page,callback)
{
  $(".scoreboard").load("highscores.php?page="+page,function(){
    $(".scoreboard").fadeIn(200);
    if(typeof callback === 'function') callback();
  });  
}

Message.prototype.lose = function(score)
{
  var madeSave = score > 850;
  
  var message_html = '<strong class=\"gameover\">GAME OVER</strong>';
  
  if(madeSave)
    message_html += '<p><span class="enter_name">Enter Name</span> <input type="text" class="highscore" maxlength="6"> <input type="image" src="img/enter.png" class="highscore_save" value="save"> </p>';

  message_html += '<p class="finalscore">Score <span>' + score + '</span></p>';

  message_html += '\nTry Again <a href="play" class="playbutton"><img src="img/space.png" class="space key" alt=""></a> Space';

  $("#message").html(message_html);
  $("#message").fadeIn(300,function(){
    $('.highscore').trigger('focus');
  });
  
  // SCOREBOARD
  if(!madeSave) {
    this.scoreboard();
  }
  
  $('.highscore_save').on('click',function(event){
    event.preventDefault();
    var highscore_name = $('.highscore').val();
    game.saveScore(highscore_name);
    $('.highscore_save').parent().slideUp(300);
  });
}

Message.prototype.pause = function(score)
{
  $("#message").html('<strong class="paused">Paused</strong>\nResume <a href="play" class="playbutton"><img src="img/space.png" class="space key" alt=""></a> Space');
  $("#message").append('<p class="pausescore">Score <span>' + score + '</span></p>')
  $("#message").fadeIn();
  
  // SCOREBOARD
  this.scoreboard();
}

Message.prototype.clear = function()
{
  $("#message").fadeOut("fast");
}





/*
 * Copyright (C) 2012 Eike Send
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
 
function imgpreload( imgs, callback ) {
  "use strict";
  var loaded = 0;
  var images = [];
  imgs = Object.prototype.toString.apply( imgs ) === '[object Array]' ? imgs : [imgs];
  var inc = function() {
    loaded += 1;
    if ( loaded === imgs.length && callback ) {
      callback( images );
    }
  };
  for ( var i = 0; i < imgs.length; i++ ) {
    images[i] = new Image();
    images[i].onabort = inc;
    images[i].onerror = inc;
    images[i].onload = inc;
    images[i].src = imgs[i];
  }
}
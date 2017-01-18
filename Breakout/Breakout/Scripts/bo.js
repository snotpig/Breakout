"use strict";
const width = 600, height = 400, COLUMNS = 15, psX = 385, spkX = 443;
var banner = document.getElementById('game');
var hsTable = document.getElementById('hs-tbl');
var touch = false, fullWidth = false, hiScores = [], hiScore=false;
var btn = document.getElementById('btn');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var rKey = false, lKey = false, boost = false;
var T, sounds, soundOn = false, paused = false, sbDown;
var levels, ball = {}, pad, rows, brickCount, bricks = [], gap;
var timer, bTimer, lives, gmOvr, showPB, newLvl, lastRender, sound;
var score, level, velSq, time, bonus;
if(storageAvailable('localStorage')) {
    soundOn = localStorage.getItem('BO1701soundOn') === 'true';
}
btn.addEventListener('click', start);
banner.addEventListener('dblclick', dblClick);
document.addEventListener("keyup", keyUp);
loadHiScores();

function start(e) {
    e.stopPropagation();
    canvas.style.display = 'block';
    banner.style.display = 'none';
    canvas.addEventListener('dblclick', dblClick);
    document.addEventListener("keydown", keyDown);
    document.addEventListener("click", mouseClick);
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mouseup", mouseUp);
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("touchmove", touchMove);
    document.addEventListener("touchstart", touchStart);
    loadSounds();
    createLevels();
    initGame();
}

function initGame() {
    ctx.clearRect(0,0,width,height);
    gmOvr = showPB = sbDown = false;
    pad = { x: 300, y: 380, dx: 7, size: 30 };
    lives = 3;
    timer = bTimer = score = bonus = 0;
    level = 1;
    bricks=[];
    startLevel();
    lastRender = performance.now();
    requestAnimationFrame(draw);
}

function loseLife() {
    lives--;
    sound = 'lose';
    if (lives === 0) gameOver();
    else serve();
}

function serve() {
    var o = (pad.x - 300)/10;
    var s = Math.sign(o);
    ball.x = pad.x - o;
    ball.y = 363;
    ball.dx = 2*(Math.random() - s);
    ball.dy = -Math.sqrt(levels[level].velSq - ball.dx * ball.dx);
    timer = 60;
}

function levelUp() {
    var tb = Math.round((2000 * (level+4) - time)/10);
//    console.log('level: ' + level + ', tb: ' + tb);//<<<<<<<<<<<<<<<<<
    if(tb < 0) tb = 0;
    bonus = 100*level + tb;
    bTimer = 100;
    level++;
    startLevel();
}
    
function startLevel() {
    rows = levels[level].rows;
    gap = levels[level].gap;
    velSq = levels[level].velSq;
    serve();    
    time = 0;
    newLvl = true;
    timer = 90;
}

function gameOver() {
    checkHi();
    gmOvr = true;
    timer = 2;
}
//////////////////////////////////////////////////////////////////////////////
/////////////////////////////// UPDATE ///////////////////////////////////////
function update() { //return;
    if(paused) return;
    if(bTimer) return --bTimer;
    else if(bonus) {
        var b = bonus > 100? 10 : 1;
        bonus -= b;
        score += b;
        return;
    }
    if(timer>1) return --timer;
    if(timer > 0) {
        timer--;
        if (gmOvr && !hiScore) showPB = true;
        else if(newLvl) {
            createBricks(rows);
            newLvl = false;
        }
    }
    if(gmOvr) return;
    time++;
    var bst = boost? 6: 0;
    pad.x += (rKey? pad.dx+bst : 0) - (lKey? pad.dx+bst : 0);
    if(pad.x<0) pad.x = 0;
    if(pad.x>width) pad.x = width;
    
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    if(ball.y > height + 10) {
//        ball.dy = -ball.dy;//<<<<<<<<<<<<
        loseLife();
        return;
    }
    
    // walls
    if((ball.x < 10) && (ball.dx < 0) ||
        ((ball.x > width-10) && (ball.dx > 0))) {
            ball.dx = -0.9 * ball.dx;
            var mdy = Math.sqrt(levels[level].velSq - ball.dx*ball.dx);
            ball.dy = Math.sign(ball.dy) * mdy;
            sound = 'wall';
            return;
    }
    if((ball.y < 10) && (ball.dy < 0)) {
        ball.dy = -ball.dy;
        sound = 'top';
        return;
    }
    
    // paddle
    if((ball.y>pad.y-17) && (ball.y<pad.y+0) && (ball.dy>0)) {
        if((ball.x<pad.x+pad.size+9) && (ball.x>pad.x-pad.size-9)){
            var velSq = levels[level].velSq;
            var p = (ball.x - pad.x)/pad.size;
            //p = p*p*Math.sign(p);
            ball.dx = ball.dx*(1 - Math.abs(p)) + 3.0*p;
            if(ball.dx*ball.dx > 0.6*velSq) {
                ball.dx = Math.sqrt(velSq-2) * Math.sign(ball.dx);
            }
            ball.dy = -Math.sqrt(velSq - ball.dx*ball.dx);
            sound = 'paddle';
            return;
        }
    } 

    // bricks
    if(ball.y <= gap+22*rows)  {
        var i = bricks.findIndex(function(b) {
            if(b) {
                var x1 = 11, x2 = 37, y = 10;
                var s1 = (b.x+x1-ball.x)*(b.x+x1-ball.x)+(b.y+y-ball.y)*(b.y+y-ball.y);
                var s2 = (b.x+x2-ball.x)*(b.x+x2-ball.x)+(b.y+y-ball.y)*(b.y+y-ball.y);
                return((s1 < 21*21) || (s2 < 21*21));
            }});
        if(i >= 0) {
            var t = Math.abs(ball.x - (bricks[i].x + 24));
            if(Math.abs(ball.x-(bricks[i].x+24)) >= 28) ball.dx = -ball.dx;
            else ball.dy = -ball.dy;
            delete bricks[i];
            score += 10;
            brickCount--;
            sound = 'brick';
            if(brickCount === 0) levelUp();
        }
    }
}
/////////////////////////////////////////////////////////////////////////////
///////////////////////////// DRAW //////////////////////////////////////////
function draw(t) {
    T = (gmOvr || paused)? 500 : 15;
    var delta = (t - lastRender);
    if(delta >= T) {
        var ticks = Math.floor(delta/T);
        while(ticks > 0){
            update();
            ticks--;
        }
        lastRender = t;
        ctx.clearRect(0,0,width, height);
        drawBricks();
        if(timer === 0) drawBall();
        drawPaddle();
        drawTopLine();
        if(soundOn && sound) {
            sounds[sound].play();
        }
        sound = undefined;
        if(bTimer) drawLvlClr();
        if(bonus && bTimer<70) drawBonus();
        if(gmOvr) drawgmOvr();
        if(paused) drawPaused();
    }
    requestAnimationFrame(draw);
}

function drawBricks() {
    bricks.forEach(function(b) {
        drawBrick(b.x, b.y, b.col);
    });
    
    function drawBrick(x, y, colour) {
        const colours = [
            ['#3333ff', '#3333aa', '#5555ff'], // blue
            ['#13c713', '#13a713', '#35e735'], // green
            ['#c73333', '#a73535', '#e75555'], // red
            ['#33c7ff', '#33a7aa', '#55e7ff'], // cyan
            ['#c737c7', '#a737a7', '#e762e7'], // magenta
            ['#e7e033', '#c7c733', '#f7f755'], // yellow
            ['#8023ff', '#6323b3', '#9043ff'], // violet
            ['#875023', '#723a13', '#976043'], // brown
            ['#ff9922', '#e98800', '#ffb524']  // Orange
        ]
        const L = 38, H = 16;
        const b = Math.round(0.14*H);
        const p = Math.round(L/4);
        const m = Math.round(H/2);
    
        ctx.fillStyle = colours[colour][0];
        ctx.fillRect(x,y,L,H);

        ctx.strokeStyle = colours[colour][0];
        ctx.fillStyle = colours[colour][1];
        ctx.beginPath();   
        ctx.moveTo(x+b,y+b);
        ctx.lineTo(x+p,y+m);
        ctx.lineTo(x+L-p,y+m);
        ctx.lineTo(x+L-b,y+b);
        ctx.lineTo(x+b,y+b);
        ctx.stroke();
        ctx.fill();

        ctx.fillStyle = colours[colour][2];
        ctx.beginPath();
        ctx.moveTo(x+b,y+H-b);
        ctx.lineTo(x+p,y+m);
        ctx.lineTo(x+L-p,y+m);
        ctx.lineTo(x+L-b,y+H-b);
        ctx.lineTo(x+b,y+H-b);
        ctx.stroke();
        ctx.fill();
    }  
}

function drawBall() {
    var grd=ctx.createRadialGradient(ball.x, ball.y-4,0,ball.x, ball.y,10);
    grd.addColorStop(0,"#eeeeff");
    grd.addColorStop(1,"#8899ff");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, 2*Math.PI);
    ctx.fillStyle = grd;
    ctx.fill();
}

function drawPaddle() {  
    var grad = ctx.createLinearGradient(pad.x, 375, pad.x, 384);
    grad.addColorStop(0, '#ff2222');
    grad.addColorStop(1, '#66ff77');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pad.x-pad.size+7, pad.y, 7, Math.PI/2, -Math.PI/2);
    ctx.arc(pad.x+pad.size-7, pad.y, 7, -Math.PI/2, Math.PI/2);
    ctx.fill();
}

function drawTopLine() {
    ctx.font = '26px Verdana';
    ctx.fillStyle = 'rgba(150,230,255,0.95)'; // l blue
    ctx.fillText('Level ' + level, 250, 21);
    ctx.fillStyle = 'rgba(231,227,51,0.95)'; //yellow
    ctx.fillText('Score: ' + score, 1, 21);
    if(lives > 0) ctx.fillStyle = 'rgba(22,185,22,0.95)'; //green
    else ctx.fillStyle = 'rgba(255,38,38,0.95)'; //red
    ctx.fillText('Lives: ' + lives, 495, 21);
    drawPauseBtn();
    drawSpkr();
}

function drawLvlClr() {
    ctx.font = 'bold 48px Tahoma';
    var grad = ctx.createLinearGradient(160, 90, 160, 120);
    grad.addColorStop(0, '#c0ccff');
    grad.addColorStop(0.33, '#ffffaa');
    grad.addColorStop(0.66, '#ffcccc');
    grad.addColorStop(1, '#aaffff');   
    ctx.fillStyle = grad;
    ctx.fillText('Level Cleared!', 130, 120);
}

function drawBonus() {
    ctx.font = 'bold 36px Tahoma';
    var grad = ctx.createLinearGradient(180, 210, 360, 240);
    grad.addColorStop(0, '#d78d38');
    grad.addColorStop(0.33, '#f7d02e');
    grad.addColorStop(0.66, '#d78d38');
    grad.addColorStop(1, '#f7d02e');   
    ctx.fillStyle = grad;
    ctx.fillText('Bonus:  ' + bonus, 180, 220);
}

function drawPaused() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0, width, height);
    ctx.font = '38px Verdana'; 
    ctx.fillStyle = '#ffffee';  
    ctx.fillText('PAUSED', 220, 215);
}

function drawSpkr() {
    var x=spkX, y=1;
    ctx.strokeStyle = 'rgba(255,255,200,0.8)';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    if(soundOn) {
        ctx.fillStyle = 'rgba(255,255,200,0.8)';
        ctx.beginPath();
        ctx.moveTo(x+16,y+5);
        ctx.lineTo(x+21,y+2);
        ctx.moveTo(x+16,y+11);
        ctx.lineTo(x+23,y+11);
        ctx.moveTo(x+16,y+17);
        ctx.lineTo(x+20,y+20);
        ctx.stroke();
    }
    ctx.fillRect(x+0,y+5,4,12);
    ctx.beginPath();
    ctx.moveTo(x+6,y+5);
    ctx.lineTo(x+14,y+0);
    ctx.lineTo(x+14,y+22);
    ctx.lineTo(x+6,y+17);
    ctx.lineTo(x+6,y+2);
    ctx.fill();
}

function drawPauseBtn() {
    var y=3;
    if(paused) ctx.fillStyle = 'rgba(255,255,200,0.8)';
    else ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(psX,y,5,17);
    ctx.fillRect(psX+7,y,5,17);
}
function drawgmOvr() {
    ctx.font = '70px Tahoma';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,30, width, height-30);
    ctx.fillStyle = 'rgba(150,230,255,0.95)';
    ctx.fillText('Game Over', 124, 210);
    if(!showPB) return;
    var x = 250, y = 270, w = 100, h = 36, r = 5;  
    if(sbDown) ctx.fillStyle = '#000000';
    else {
        var grd = ctx.createLinearGradient(x+w/2,y,x+w/2,y+h);
        grd.addColorStop(0, '#444444');
        grd.addColorStop(0.1, '#111111');
        grd.addColorStop(0.8, '#222222');
        grd.addColorStop(0.95, '#000000');  
        ctx.fillStyle = grd;
    }
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.arcTo(x+w,y,x+w,y+r, 10);
    ctx.lineTo(x+w,y+h-r);
    ctx.arcTo(x+w,y+h,x+w-r,y+h, 10);
    ctx.lineTo(x+r,y+h);
    ctx.arcTo(x,y+h,x,y+h-r, 10);
    ctx.lineTo(x,y+r);
    ctx.arcTo(x,y,x+r,y, 10);
    ctx.stroke();
    ctx.fill();
    
    ctx.fillStyle = '#50ff70';
    ctx.font = '18px Tahoma';
    ctx.fillText('Play again', x+9, y+23);
}
//////////////////////////////////////////////////////////////
///////////////////////////// Setup //////////////////////////
function loadSounds() {
    sounds = {};
    sounds.wall = new Audio('../Sound/w.wav');
    sounds.brick = new Audio('../Sound/b.wav');
    sounds.top = new Audio('../Sound/t.wav');
    sounds.paddle = new Audio('../Sound/p.wav');
    sounds.lose = new Audio('../Sound/l.wav');
}

function createLevels() {
    levels = [];
    for(var i=0; i<15; i++) {
        var lvl = {
            rows: i===0? 1 : 6 + i,
            gap: (i>10)? 30 : 80 - 5*i,
            velSq: 24 + 2*i
        }
        levels.push(lvl);
    }
}

function createBricks(rows) {
    bricks = [];
    for(var r=0; r<rows; r++) {
        for(var c=0; c<COLUMNS; c++) {
            bricks.push({ x: 1+40*c, y: gap+18*r, col: Math.floor(9*Math.random()) });
        }
    }
    brickCount = COLUMNS * rows;
}
///////////////////////////////////////////////////////////////
///////////////////////////// Handlers ////////////////////////
function keyDown(e) {
    if (hiScore) return;
    if (e.keyCode === 39) {
        rKey = true;
    }
    else if(e.keyCode === 37) lKey = true;
    else if(e.keyCode === 32) boost = true;
}

function keyUp(e) {
    if (hiScore) return;
    if(e.keyCode === 39) rKey = false;
    else if(e.keyCode === 37) lKey = false;
    else if(e.keyCode === 32)  boost = false;
    else if(e.keyCode === 80)  paused = !paused;
    else if(e.keyCode === 87) {
        fullWidth = !fullWidth;
        resize();
    }
    else if(e.keyCode === 27) {
        fullWidth = false;
        resize();
    }
    else if(e.keyCode === 83)  soundOn = !soundOn;
    else if(showPB && e.keyCode === 13) initGame();
    else if (hiScore && e.keyCode === 13) submitScore(e);
}

function mouseMove(e) {
    var relX = (e.clientX - canvas.offsetLeft) * width / canvas.offsetWidth;
    var relY = (e.clientY - canvas.offsetTop) * height / canvas.offsetHeight;
    if(!gmOvr && !paused && !timer) {
        if(relX >= 0 && relX <= canvas.width) {
            pad.x = relX;
        }
    }
    if(showPB &&(relX>=250)&&(relX<=350)&&(relY>=270)&&(relY<=306)) {
            canvas.style.cursor = 'pointer';
     }
    else if((relX>=spkX)&&(relX<=spkX+20)&&(relY>=0)&&(relY<=22)) {
        canvas.style.cursor = 'pointer';
    }
    else if((relX>=psX)&&(relX<=psX+16)&&(relY>=0)&&(relY<=22)) {
        canvas.style.cursor = 'pointer';
    }
    else canvas.style.cursor=(gmOvr||paused||(relY<=22))? 'default' : 'none';
}

function touchMove(e) {
    e.preventDefault();
    var relX=(e.changedTouches[0].clientX-canvas.offsetLeft)*width/canvas.offsetWidth;
    var relY = (e.clientY - canvas.offsetTop) * height / canvas.offsetHeight;
    if(!gmOvr && !paused && !timer) {
        if(relX > 0 && relX < canvas.width) {
            pad.x = relX - pad.size/2;
        }
    }
}

function touchStart(e) { touch = true; }

function mouseClick(e) {
    var relX = (e.clientX - canvas.offsetLeft) * width / canvas.offsetWidth;
    var relY = (e.clientY - canvas.offsetTop) * height / canvas.offsetHeight;
    if((relX>=spkX)&&(relX<=spkX+20)&&(relY>=0)&&(relY<=22)) {
        soundOn = !soundOn;
        if(storageAvailable('localStorage')) {
            localStorage.setItem('BO1701soundOn', soundOn.toString());
        }
    }
    else if(!gmOvr&&(relX>=psX)&&(relX<=psX+16)&&(relY>=0)&&(relY<=22)) {
        paused=!paused;   
    }
    else if(!gmOvr) {
        if((relX>=0)&&(relX<=width)&&(relY>=0)&&(relY<=height)) paused = false;
        else paused = true;
    }
}

function mouseDown(e) {
    var relX = (e.clientX - canvas.offsetLeft) * width / canvas.offsetWidth;
    var relY = (e.clientY - canvas.offsetTop) * height / canvas.offsetHeight;
    if(showPB) {
        if((relX>=250)&&(relX<=350)&&(relY>=270)&&(relY<=306)) {
            sbDown = true;
        }
    }
}

function mouseUp(e) {
    var relX = (e.clientX - canvas.offsetLeft) * width / canvas.offsetWidth;
    var relY = (e.clientY - canvas.offsetTop) * height / canvas.offsetHeight;
    if(sbDown) {
        if((relX>=250)&&(relX<=350)&&(relY>=270)&&(relY<=306)) {
            initGame();
        }
    }
    sbDown = false;
}

function dblClick() {
    fullWidth = !fullWidth;
    resize();
}

function resize() {
    var r = 0.667 + (touch? 0.1 : 0);
    if(fullWidth && window.innerWidth > width) {
        if(window.innerHeight > r*window.innerWidth) canvas.style.width = '100%';
        else {
            var newWidth = Math.floor(window.innerHeight/r);
            banner.style.width = canvas.style.width = newWidth + 'px';
            banner.style.height = 0.667 * newWidth + 'px';
        }
    }
    else {
        banner.style.width = canvas.style.width = '600px';
        banner.style.height = '400px';
    }
}
///////////////////////////////////////////////////////////////
///////////////////////////// Hi Score ////////////////////////

function loadHiScores() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                hiScores = JSON.parse(xhttp.responseText);
                displayScores();
            }
            else console.log('Error: ' + xhttp.statusText);
        }
    };
    xhttp.open("GET", '/Scores/get', true);
    xhttp.send();
}

function displayScores() {
    for (var i=0; i<hiScores.length; i++) {
        document.getElementById('hs-n'+i).innerHTML = hiScores[i].name;
        document.getElementById('hs-s' + i).innerHTML = hiScores[i].score;
    }
}

function checkHi() {
    var num = hiScores.length;
    if (num<6 || num && score > hiScores[num - 1].score) {
        setTimeout(function () {
            hiScore = true;
            fullWidth = false;
            resize();
            document.getElementById('hs-list').style.display = 'none';
            document.getElementById('hs-dlg').style.display = 'block';
            document.getElementById('btn-submit').addEventListener('click', submitScore);
        }, 700);
    }
}

function submitScore() {
    var txtbx = document.getElementById('txt-name');
    var name = txtbx.value.replace(/[\"<>]+/g, '_');
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function (e) {
        if(this.readyState === 4) {
            if(this.status === 200) {
                hiScores = JSON.parse(xhttp.responseText);
                txtbx.value = '';
                document.getElementById('hs-dlg').style.display = 'none';
                document.getElementById('hs-list').style.display = 'block';
                displayScores();
                hiScore = false;
                showPB = true;
            }
            else console.log('Error: ' + xhttp.statusText);
        }
    };
    xhttp.open("POST", '/Scores/add', true);
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhttp.setRequestHeader('Accept', 'application/json');
    var str = 'score=' + score + '&name=' + name;
    xhttp.send(str);
}
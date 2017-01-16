"use strict";
var btn = document.getElementById('btn');
var canvas = document.getElementById('canvas');
var banner = document.getElementById('game');
var hsTable = document.getElementById(hs_tbl);
var fullWidth = false, hiScores = [], hiScore=false;
btn.addEventListener('click', start, false);
canvas.addEventListener('dblclick', dblClick, false);
banner.addEventListener('dblclick', dblClick, false);
document.addEventListener("keyup", pKeyUp, false);
loadHiScores();

if (!Math.sign) {
  Math.sign = function(x) {
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
      return Number(x);
    }
    return x > 0 ? 1 : -1;
  };
}

if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this === null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return k.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return -1.
      return -1;
    }
  });
}

function start() {
    canvas.style.display = 'block';
    banner.style.display = 'none';
    breakout();
}

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
        document.getElementById('hs_n'+i).innerHTML = hiScores[i].name;
        document.getElementById('hs_s' + i).innerHTML = hiScores[i].score;
    }
}

function checkHi() {
    var num = hiScores.length;
    if (num<6 || num && score > hiScores[num - 1].score) {
        setTimeout(function () {
            hiScore = true;
            fullWidth = false;
            adjustWidth();
            document.getElementById('hs_list').style.display = 'none';
            document.getElementById('hs_dlg').style.display = 'block';
            document.getElementById('btn_submit').addEventListener('click', submitScore);
        }, 700);
    }
}

function submitScore(e) {
    var name = document.getElementById('txt_name').value.replace(/[\"<>]+/g, '_');
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function (e) {
        if(this.readyState === 4) {
            if(this.status === 200) {
                hiScores = JSON.parse(xhttp.responseText);
                document.getElementById('hs_dlg').style.display = 'none';
                document.getElementById('hs_list').style.display = 'block';
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

function dblClick() {
    fullWidth = !fullWidth;
    adjustWidth();
}

function pKeyUp(e) {
    if (e.charCode === 27) {
        fullWidth = false;
        adjustWidth();
    }
    else if (hiScore && e.keyCode === 13) submitScore(e);
    keyUp(e);
}

function adjustWidth() {
    if(fullWidth && window.innerWidth > width) {
        if(window.innerHeight > 0.66*window.innerWidth) canvas.style.width = '100%';
        else {
            var newWidth = Math.floor(1.5*window.innerHeight);
            banner.style.width = canvas.style.width = newWidth + 'px';
            banner.style.height = 0.66 * newWidth + 'px';
        }
    }
    else {
        banner.style.width = canvas.style.width = '600px';
        banner.style.height = '400px';
    }
}
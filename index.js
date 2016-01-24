var Bacon = require('baconjs');

var body = $('body'),
    container = $('.container'),
    WHITE = [255,255,255];

function xyFromEvent(e){ return [e.clientX, e.clientY]; }
function toHueSaturation(v){ return [Math.round(v[0] * (360 / body.width()) * 10) / 10, Math.round(v[1] * (100 / body.height()) * 10) / 10]; }

function getScrollPosition(){ return Math.round(container.scrollTop() / container.height() * 100); }
function lightnessFromScrollPosition(v){ return v < 0 ? 0 : v > 100 ? 100 : v; }

$(function(){
  container.scrollTop(container.height() / 2);

  var mousePositionStream = body
    .asEventStream('mousemove')
    .map(xyFromEvent)
    .map(toHueSaturation);

  var vScrollStream = $('.container')
    .asEventStream('scroll')
    .startWith(0)
    .map(getScrollPosition)
    .map(lightnessFromScrollPosition);

  var clickStream = body
    .asEventStream('click')
    .filter(function(e){
      // filter out clicks on the .locked element
      return !$(e.target).hasClass('locked') && !$(e.target).is('.hide-help')
    })
    .scan(1, function(a){ return !a; });


  var closeHelpStream = $('.hide-help')
    .asEventStream('click')
    .onValue(function(){
      $('.help').fadeOut();
    });

  Bacon.combineWith(
    function(pos, scroll, unlocked){ return unlocked && pos.concat(scroll); }, mousePositionStream, vScrollStream, clickStream)
    .onValue(function(v){
      if(v){
        $('.container').css('background', 'hsl('+v[0]+', '+v[1]+'%, '+v[2]+'%)');
        $('.help').css('color', 'hsl('+v[0]+', '+v[1]+'%, '+v[2]+'%)');

        var contrast = getRGBColorContrast(hslToRgb(v[0], v[1], v[2]), WHITE);
        if(contrast[0] < 125 || contrast[1] < 485){
          $('.help').css('background', 'rgba(0,0,0,0.45)');
        } else {
          $('.help').css('background', 'rgba(255,255,255,0.45)');
        }

        $('.color').html(v.join(' ') + '<br>' + container.css('background-color'));
        $('.color').removeClass('locked');
        if($('.container').css('transition') !== 'none') {
          setTimeout(function(){
            $('.container').css('transition', 'none');
            $('.color').html(v.join(' ') + '<br>' + container.css('background-color'));
          }, 250);
        }
      } else {
        $('.color').addClass('locked');
        $('.container').css('transition', 'background 250ms ease-out');
      }
  });
});


// HELPER FUNCTIONS -- things to do with colors
function getRGBColorContrast(F, B){
    var abs= Math.abs,
    BG= (B[0]*299 + B[1]*587 + B[2]*114)/1000,
    FG= (F[0]*299 + F[1]*587 + F[2]*114)/1000,
    bright= Math.round(Math.abs(BG - FG)),
    diff= abs(B[0]-F[0])+abs(B[1]-F[1])+abs(B[2]-F[2]);
    return [bright, diff];
}

function hslToRgb(h, s, l){
    var r, g, b;

    h /= 360;
    s /= 100;
    l /= 100;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}




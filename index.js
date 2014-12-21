var Bacon = require('baconjs');

var body = $('body'),
    container = $('.container');

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
    .filter(function(e){ return !$(e.target).hasClass('locked');  }) // filter out clicks on the .locked element
    .scan(1, function(a){ return !a; });

  Bacon.combineWith(
    function(pos, scroll, unlocked){ return unlocked && pos.concat(scroll); }, mousePositionStream, vScrollStream, clickStream)
    .onValue(function(v){
      if(v){
        $('.container').css('background', 'hsl('+v[0]+', '+v[1]+'%, '+v[2]+'%)');
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



var Bacon = require('baconjs');

var body = $('body');

function xyFromEvent(v){ return [v.clientX, v.clientY]; }
function toHueSaturation(v){
  v[0] = (v[0] * (360 / body.width())).toFixed(2);
  v[1] = (v[1] * (100 / body.height())).toFixed(2);
  return v;
}

$(function(){
  // Simple click example
  var mousePos = body
    .asEventStream('mousemove')
    .map(xyFromEvent)
    .map(toHueSaturation);

  var vScroll = $('.container')
    .asEventStream('scroll')
    .startWith(0)
    .map(function(){
      var val = $('.container').scrollTop() / 10;
      return val < 0 ? 0 :
        val > 100 ? 100 : val;
    });

  var color = Bacon.combineWith(function(pos, scroll){ return pos.concat(scroll); }, mousePos, vScroll)
         .onValue(function(v){
            console.log(v);
            $('.container').css('background', 'hsl('+v[0]+', '+v[1]+'%, '+v[2]+'%)');
            $('.color').html(v.join(' ') + '<br>' + $('.container').css('background-color'));
          });

});



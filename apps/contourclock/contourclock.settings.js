(function(back) {
  Bangle.setUI("");
  g.reset();
  let is12;
  let getHours = function(d) {
    let h = d.getHours();
    if (is12===undefined) is12 = (require('Storage').readJSON('setting.json',1)||{})["12hour"];
    if (!is12) return h;
    return (h%12==0) ? 12 : h%12;
  };
  let settings = require('Storage').readJSON('contourclock.json', true) || {};
  if (settings.fontIndex==undefined) {
    settings.drawMode = 1;
    settings.fontIndex=0;
    settings.widgets=true;
    settings.weekday=true;
    settings.date=true;
    settings.hideWhenLocked=false;
    settings.tapToShow=false;
    settings.twistToShow=false;
    require('Storage').writeJSON("contourclock.json", settings);
  }
  let fontList = require("Storage").list(/^contourclock-.*.js$/);
  function drawClock() {
    g.clearRect(0,g.getHeight()-36,g.getWidth()-1,g.getHeight()-36+16);
    g.setFont('6x8:2x2').setFontAlign(0,-1).
      drawString(fontList[settings.fontIndex].substring(13,fontList[settings.fontIndex].length-3),g.getWidth()/2,g.getHeight()-36);
    let font = eval(require('Storage').read(fontList[settings.fontIndex]));
    let x=0;
    let y = g.getHeight()/2-font.characters[0].height/2;
    let date = new Date();
    g.clearRect(0,38,g.getWidth()-1,138);
    let d1=parseInt(getHours(date)/10);
    let d2=parseInt(getHours(date)%10);
    let d3=10;
    let d4=parseInt(date.getMinutes()/10);
    let d5=parseInt(date.getMinutes()%10);
    let w1=font.characters[d1].width;
    let w2=font.characters[d2].width;
    let w3=font.characters[d3].width;
    let w4=font.characters[d4].width;
    let w5=font.characters[d5].width;
    let squeeze=(g.getWidth()-w5)/(w1+w2+w3+w4);
    let fg=g.getColor();
    let bg=g.getBgColor();
    if (settings.drawMode<0) {
      g.setColor(bg);
      g.setBgColor(fg);
    }
    g.drawImage(font.characters[d1],x,y);
    x+=parseInt(w1*squeeze);
    g.drawImage(font.characters[d2],x,y);
    x+=parseInt(w2*squeeze);
    g.drawImage(font.characters[d3],x,y);
    x+=parseInt(w3*squeeze);
    g.drawImage(font.characters[d4],x,y);
    x+=parseInt(w4*squeeze);
    g.drawImage(font.characters[d5],x,y);        
    if (settings.drawMode<0) {
      g.setColor(fg);
      g.setBgColor(bg);
    }
  }
  function mainMenu() {
    E.showMenu({
      "" : { "title" : "ContourClock" },
      "< Back" : () => back(),
      'Widgets': {
        value: (settings.widgets !== undefined ? settings.widgets : true),
        onchange : v => {settings.widgets=v; require('Storage').writeJSON('contourclock.json', settings);}
      },
      'Weekday': {
        value: (settings.weekday !== undefined ? settings.weekday : true),
        onchange : v => {settings.weekday=v; require('Storage').writeJSON('contourclock.json', settings);}
      },
      'Date': {
        value: (settings.date !== undefined ? settings.date : true),
        onchange : v => {settings.date=v; require('Storage').writeJSON('contourclock.json', settings);}
      },
      'Hide widgets, weekday and date when locked': {
        value: (settings.hideWhenLocked !== undefined ? settings.hideWhenLocked : false),
        onchange : v => {settings.hideWhenLocked=v; require('Storage').writeJSON('contourclock.json', settings);}
      },
      'Tap to show': {
        value: (settings.tapToShow !== undefined ? settings.tapToShow : false),
        onchange : v => {settings.tapToShow=v; require('Storage').writeJSON('contourclock.json', settings);}
      },
      'Twist to show': {
        value: (settings.twistToShow !== undefined ? settings.twistToShow : false),
        onchange : v => {settings.twistToShow=v; require('Storage').writeJSON('contourclock.json', settings);}
      },
      'set Font': () => fontMenu() 
    });
  }
  function fontMenu() {
    Bangle.setUI("");
    savedIndex=settings.fontIndex;
    saveListener = setWatch(function() {          //save changes and return to settings menu
      require('Storage').writeJSON('contourclock.json', settings);
      Bangle.removeAllListeners('swipe');
      Bangle.removeAllListeners('lock');
      mainMenu();
    }, BTN, { repeat:false, edge:'falling' });
    lockListener = Bangle.on('lock', function () { //discard changes and return to clock
      settings.fontIndex=savedIndex;
      require('Storage').writeJSON('contourclock.json', settings);
      Bangle.removeAllListeners('swipe');
      Bangle.removeAllListeners('lock');
      mainMenu();
    });
    swipeListener = Bangle.on('swipe', function (direction) {
      settings.fontIndex=Math.clip(settings.fontIndex+direction*settings.drawMode,-1,fontList.length-1);
      if (settings.fontIndex<0) {
        settings.fontIndex=0;
        settings.drawMode=settings.drawMode*-1;
      }
      drawClock(settings.fontIndex);
    });
    g.reset();
    g.clearRect(0,24,g.getWidth()-1,g.getHeight()-1);
    drawClock(settings.fontIndex);
    g.setFont('6x8:2x2').setFontAlign(0,-1).drawString('Button to save',g.getWidth()/2,g.getHeight()-18);
  }
  mainMenu();
})
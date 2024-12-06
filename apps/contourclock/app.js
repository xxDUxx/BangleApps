{
  let is12;
  let getHours = function(d) {
    let h = d.getHours();
    if (is12===undefined) is12 = (require('Storage').readJSON('setting.json',1)||{})["12hour"];
    if (!is12) return h;
    return (h%12==0) ? 12 : h%12;
  };
  let drawTimeout;
  let extrasTimer=0;
  let settings = require('Storage').readJSON("contourclock.json", true) || {};
  if (settings.fontIndex == undefined) {
    settings.drawMode = 1;
    settings.fontIndex = 0;
    settings.widgets = true;
    settings.weekday = true;
    settings.hideWhenLocked = false;
    settings.tapToShow = false;
    settings.twistToShow = false;
    settings.date = true;
    require('Storage').writeJSON("contourclock.json", settings);
  }
  require("FontTeletext10x18Ascii").add(Graphics);
  let fontList = require("Storage").list(/^contourclock-.*.js$/);
  let font = eval(require('Storage').read(fontList[settings.fontIndex]));
  let drawClock = function () {
    g.clearRect(0,g.getHeight()-36,g.getWidth()-1,g.getHeight()-36+16);
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
  };
  let onLock = function(locked) {if (!locked) showExtras();};
  let showExtras = function() { //show extras for 5s
    drawExtras();
    extrasTimer = 5000-60000-(Date.now()%60000);
    if (extrasTimer<0) {  //schedule next redraw early to hide extras
      if (drawTimeout) clearTimeout(drawTimeout);
      drawTimeout = setTimeout(function() {
        drawTimeout = undefined;
        draw();
      }, 5000);
    }
  };
  let hideExtras = function() {
    g.reset();
    g.clearRect(0, 138, g.getWidth() - 1, 176);
    if (settings.widgets) require("widget_utils").hide();
  };
  let drawExtras = function() { //draw date, day of the week and widgets
    let date = new Date();
    g.reset();
    g.clearRect(0, 138, g.getWidth() - 1, 176);
    g.setFont("Teletext10x18Ascii").setFontAlign(0, 1);
    if (settings.weekday) g.drawString(require("locale").dow(date).toUpperCase(), g.getWidth() / 2, g.getHeight() - 18);
    if (settings.date) g.drawString(require('locale').date(date, 1), g.getWidth() / 2, g.getHeight());
    if (settings.widgets) require("widget_utils").show();
  };
  let draw = function() {
    if (extrasTimer>0) { //schedule next draw early to remove extras
      drawTimeout = setTimeout(function() {
        drawTimeout = undefined;
        draw();
      }, extrasTimer);
      extrasTimer=0;
    } else {
      if (settings.hideWhenLocked) hideExtras();
      drawTimeout = setTimeout(function() {
        drawTimeout = undefined;
        draw();
      }, 60000 - (Date.now() % 60000));
    }
    g.reset();
    if (!settings.hideWhenLocked) drawExtras();
    let t1=Date.now();
    drawClock();
    print ("T:"+(Date.now()-t1));
    print ("M:"+process.memory().usage+"/"+process.memory().total);
  };
  if (settings.hideWhenLocked) {
    Bangle.on('lock', onLock);
    if (settings.tapToShow) Bangle.on('tap', showExtras);
    if (settings.twistToShow) Bangle.on('twist', showExtras);
  }
  Bangle.setUI({
    mode: "clock",
    remove: function() {
      if (settings.hideWhenLocked) {
        Bangle.removeListener('lock', onLock);
        if (settings.tapToShow) Bangle.removeListener('tap', showExtras);
        if (settings.twistToShow) Bangle.removeListener('twist', showExtras);
      }
      if (drawTimeout) {
        clearTimeout(drawTimeout);
        drawTimeout = undefined;
      }
      if (settings.hideWhenLocked && settings.widgets) require("widget_utils").show();
      g.reset();
      g.clear();
    }
  });
  g.clear();
  if (settings.widgets) {
    Bangle.loadWidgets();
    Bangle.drawWidgets();
  }
  draw();
  if (!settings.hideWhenLocked || !Bangle.isLocked()) showExtras();
}

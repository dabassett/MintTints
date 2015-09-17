// color helpers and utilities

var tc = require('tinycolor');

var Tint = function (color) {
  this.tiny = tc(color);
};

Tint.prototype = {
  // the maximum contrast [1, 21] that this color can achieve 
  maxContrast: function () {
    return Math.round(
      Math.max(tc.readability(this.tiny, 'black'),
               tc.readability(this.tiny, 'white')) * 10) / 10;
  },
  // return a new Tint that has been color shifted in
  //   one or more of the hswl dimensions
  shift: function (shifts) {
    var hswl = this.tiny.toHswl();
    return new Tint(Tint.normalize({
      h: (shifts.h || 0) + hswl.h,
      s: (shifts.s || 0) + hswl.s,
      wl: (shifts.wl || 0) + hswl.wl,
    }));
  },
  // create a 2d slice of the color solid with this color at the origin
  // and varying two other attributes
  colorslice: function (n) {
    var hswl = this.tiny.toHswl();
    var slice = new Array(n);
    var satChange, lumChange;
    for (var i = 0; i < n; i++) {
      slice[i] = new Array(n);
      lumChange = 0.8 * Tint.indexToPercentage(i, n);
      for (var j = 0; j < n; j++) {
        satChange = 0.9 * Tint.indexToPercentage(j, n);
        slice[i][j] = new Tint({
          h: hswl.h,
          s: Tint.adjustAttr(hswl.s, satChange),
          wl: Tint.adjustAttr(hswl.wl, lumChange) 
        });
      }
    }
    return slice;
  },
  toStr: function () {
    return this.tiny.toHexString();
  }
};

// adjust an attribute by a set percentage on the color solid
// Tint.adjustAttr(0.5, 0.5) => 0.75
// Tint.adjustAttr(0.3, 0.1) => 0.33
// Tint.adjustAttr(0.5, -0.5) => 0.25
// Tint.adjustAttr(0.4, 1) => 1
// Tint.adjustAttr(0.4, -1 => 0
Tint.adjustAttr = function(attr, percent) {
  if (percent < 0) {
    return attr * (1 + percent);
  } else {
    return attr + percent * (1 - attr);
  }
};

// clamp the hswl attributes to valid values
Tint.normalize = function(hswl) {
  var out = {h: 0, s: 0, wl: 0};
  hswl = hswl || {};
  if (hswl.h) {
    out.h = Tint.normalizeHue(hswl.h);
  }
  if (hswl.s) {
    out.s = Tint.normalize01(hswl.s);
  }
  if (hswl.wl) {
    out.wl = Tint.normalize01(hswl.wl);
  }
  return out;
};

// cyclically map any hue input (negative too!) to [0, 360]
//   120 => 120
//   375 => 15
//   -42 => 318
Tint.normalizeHue = function(hue) {
  return ((hue % -360) + 360) % 360;
};

// clamp saturation or luminance to valid range [0, 1]
Tint.normalize01 = function(attr) {
  return Math.max(0, Math.min(attr, 1));
};

// convert an array index to a percentage of total
//   returns [-1,1], with 0 representing the origin
Tint.indexToPercentage = function(idx, total) {
  return ((idx * 2.0) / (total - 1)) - 1;
};

module.exports = Tint;

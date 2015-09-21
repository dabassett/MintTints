'use strict';

var tc = require('tinycolor');

// the primary color model
var Tint = function (color) {
  this.tiny = tc(color);
  this.hswl = this.tiny.toHswl();
  this.rgb = this.tiny.toRgb();
  this.r = this.rgb.r;
  this.g = this.rgb.g;
  this.b = this.rgb.b;
  this.h = this.hswl.h;
  this.s = this.hswl.s;
  this.wl = this.hswl.wl;
};

Tint.prototype = {
  // the maximum contrast [1, 21] that this color can achieve
  maxContrast: function () {
    return Math.max(tc.readability(this.tiny, 'black'),
      tc.readability(this.tiny, 'white'));
  },

  // return a new Tint that attempts to meet the
  // WCAG contrast requirement
  contrastColor: function (contrast, opts) {
    // default to always return a color unless explicitly set to false
    opts = opts || {};
    if (typeof opts.returnBestFit === 'undefined') {
      opts.returnBestFit = true;
    }
    opts.contrastRatio = contrast;
    return new Tint(tc.getReadable(this.tiny, opts));
  },

  // return true when this color meets or exceeds
  //  the specified contrast ratio, false otherwise
  hasContrast: function (otherTint, contrast) {
    if (tc.readability(this.tiny, otherTint.tiny) >= contrast) {
      return true;
    }
    return false;
  },

  // return a new Tint that has had one or more attributes set to
  // the provided values. Setting all three values essentially
  // produces a new color
  set: function (attrs) {
    return new Tint(Tint.normalize({
      h: attrs.h || this.h,
      s: attrs.s || this.s,
      wl: attrs.wl || this.wl
    }));
  },

  // return a new Tint that has been color shifted in
  // one or more of the hswl dimensions
  shift: function (attrs) {
    return new Tint(Tint.normalize({
      h: (attrs.h || 0) + this.h,
      s: (attrs.s || 0) + this.s,
      wl: (attrs.wl || 0) + this.wl
    }));
  },

  // return a new Tint that mixes the colors of the current Tint and
  // either a second Tint object or itself with altered attributes.
  // Use amount [0, 100] to control the percentage strength of the blend
  // color
  blend: function (tintOrSetOpts, amount) {
    var blendTint;
    if (typeof amount === 'undefined') {
      amount = 50;
    }
    if (tintOrSetOpts instanceof Tint) {
      blendTint = tintOrSetOpts;
    } else {
      blendTint = this.set(tintOrSetOpts);
    }
    return new Tint(tc.mix(this.tiny, blendTint.tiny, amount));
  },

  // create a 2d slice of the color solid with this color at the origin
  // and varying two other attributes
  colorslice: function (n) {
    var slice = new Array(n);
    var satChange, lumChange;
    for (var i = 0; i < n; i++) {
      slice[i] = new Array(n);
      lumChange = 0.8 * Tint.indexToPercentage(i, n);
      for (var j = 0; j < n; j++) {
        satChange = 0.9 * Tint.indexToPercentage(j, n);
        slice[i][j] = new Tint({
          h: this.h,
          s: Tint.adjustAttr(this.s, satChange),
          wl: Tint.adjustAttr(this.wl, lumChange)
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

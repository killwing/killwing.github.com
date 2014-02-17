var WIDTH = 640;
var HEIGHT = 360;
function EgWidget(id, draw, update, reset) {
    this.canvas = document.getElementById(id);
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.context = this.canvas.getContext('2d');
    this.draw = draw;
    this.update = update;
    this.reset = reset;
    this.pause = false;

    this.mouse = new Vector(0, 0);
    this.canvas.onmousemove = this.onMousemove.bind(this);

    if (update) {
        var pauseBtn = document.createElement('button');
        pauseBtn.innerHTML = 'PAUSE';
        pauseBtn.onclick = this.onPause.bind(this);
        this.canvas.parentNode.insertBefore(pauseBtn, this.canvas.nextSibling);

        var resetBtn = document.createElement('button');
        resetBtn.innerHTML = 'RESET';
        resetBtn.onclick = this.onReset.bind(this);
        this.canvas.parentNode.insertBefore(resetBtn, this.canvas.nextSibling);
    }
}
EgWidget.prototype.run = function() {
    if (this.pause) {
        return;
    }

    if (this.update) {
        requestAnimationFrame(this.run.bind(this));
        this.update();
    }
    this.draw(this.context);
};
EgWidget.prototype.onPause = function() {
    this.pause = !this.pause;
    if (!this.pause) {
        requestAnimationFrame(this.run.bind(this));
    }
};
EgWidget.prototype.onReset = function() {
    this.reset && this.reset();
    this.clear();
    if (this.pause) {
        requestAnimationFrame(this.run.bind(this));
        this.pause = false;
    }
};
EgWidget.prototype.onMousemove = function(e) {
    if (!this.pause) {
        var x;
        var y;
        if (e.pageX || e.pageY) {
            x = e.pageX;
            y = e.pageY;
        } else {
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        this.mouse.x = x - this.canvas.offsetLeft;
        this.mouse.y = y - this.canvas.offsetTop;
    }
};
EgWidget.prototype.clear = function() {
    //this.canvas.width = this.canvas.width;
    this.context.save();
    this.context.translate(0, 0);
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.restore();
}

var Random = {};
Random.random = function() { // [0.0, 1.0)
    return Math.random();
};
Random.arbitrary = function(min, max) { // [min, max)
    return Math.random() * (max - min) + min;
}
Random.uniform = function(min, max) { // integer in [min, max]
    // Using Math.round() will give you a non-uniform distribution!
    return Math.floor(Math.random() * (max - min + 1) + min);
};

// translate from http://docs.oracle.com/javase/7/docs/api/java/util/Random.html#nextGaussian()
var spare = null;
Random.gauss = function(mu, sigma) {
    mu = mu || 0;
    sigma = sigma || 1;

    if (spare !== null) {
        var v = mu + sigma * spare;
        spare = null;
        return v;
    } else {
        var u, v, s;
        do {
            u = Math.random() * 2 - 1;  // [-1, 1)
            v = Math.random() * 2 - 1;
            s = u * u + v * v;
        } while (s >= 1 || s == 0);
        var mul = Math.sqrt(-2.0 * Math.log(s) / s);
        spare = v * mul;
        return mu + sigma * u * mul;
    }
};

// translate from http://mrl.nyu.edu/~perlin/noise/
var permutation = [151,160,137,91,90,15,
    131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
    190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
    88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,
    77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
    102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
    135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,
    5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
    223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,
    129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,
    251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,
    49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

var p = [];
for (var i = 0; i < 256 ; i++) {
    p[256+i] = p[i] = permutation[i];
}

var fade = function(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
};
var lerp = function(t, a, b) {
    return a + t * (b - a);
};
var grad = function(hash, x, y, z) {
    var h = hash & 15;
    var u = h < 8 ? x : y;
    var v = h < 4 ? y : h == 12 || h == 14 ? x : z;
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
};
Random.noise = function(x, y, z) {
    x = x || 0;
    y = y || 0;
    z = z || 0;

    var X = Math.floor(x) & 255;
    var Y = Math.floor(y) & 255;
    var Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    var u = fade(x);
    var v = fade(y);
    var w = fade(z);

    var A = p[X  ]+Y, AA = p[A]+Z, AB = p[A+1]+Z;
    var B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;

    return lerp(w, lerp(v, lerp(u, grad(p[AA  ], x  , y  , z   ),
                                   grad(p[BA  ], x-1, y  , z   )),
                           lerp(u, grad(p[AB  ], x  , y-1, z   ),
                                   grad(p[BB  ], x-1, y-1, z   ))),
                   lerp(v, lerp(u, grad(p[AA+1], x  , y  , z-1 ),
                                   grad(p[BA+1], x-1, y  , z-1 )),
                           lerp(u, grad(p[AB+1], x  , y-1, z-1 ),
                                   grad(p[BB+1], x-1, y-1, z-1 ))))
            * 0.5 + 0.5; // from 0.0 to 1.0, rather than -1.0 to 1.0
};


var Util = {};
Util.map = function(v, min1, max1, min2, max2) {
    return ((v - min1) / (max1 - min1)) * (max2 - min2) + min2;
};
Util.constrain = function(v, min, max) {
    if (v < min) {
        return min;
    } else if (v > max) {
        return max;
    } else {
        return v;
    }
};


function Vector(x, y) {
    this.set(x, y);
};
Vector.random2D = function() {
    var r = Math.random() * 2 * Math.PI;
    return new Vector(Math.cos(r), Math.sin(r));
};
Vector.add = function(v1, v2) {
    return new Vector(v1.x + v2.x, v1.y + v2.y);
};
Vector.sub = function(v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
};
Vector.mult = function(v, n) {
    return new Vector(v.x * n, v.y * n);
};
Vector.div = function(v, n) {
    return new Vector(v.x / n, v.y / n);
};
Vector.prototype.set = function(x, y) {
    if (typeof x === 'object' && typeof y === 'undefined') {
        this.x = x.x;
        this.y = x.y;
    } else {
        this.x = x;
        this.y = y;
    }
};
Vector.prototype.reset = function() {
    this.x = 0;
    this.y = 0;
};
Vector.prototype.debug = function() {
    console.debug('x: ', this.x, 'y: ', this.y);
};
Vector.prototype.add = function(v) {
    this.x += v.x;
    this.y += v.y;
};
Vector.prototype.sub = function(v) {
    this.x -= v.x;
    this.y -= v.y;
};
Vector.prototype.mult = function(n) {
    this.x *= n;
    this.y *= n;
};
Vector.prototype.div = function(n) {
    this.x /= n;
    this.y /= n;
};
Vector.prototype.mag = function(v) {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
Vector.prototype.normalize = function(v) {
    var m = this.mag();
    if (m != 0) {
        this.div(m);
    }
};
Vector.prototype.limit = function(max) {
    if (this.mag() > max) {
        this.normalize();
        this.mult(max);
    }
};
Vector.prototype.heading = function() {
    return Math.atan2(this.y, this.x);
};


function Mover(location, velocity, acceleration, mass) {
    this.location = location || new Vector(0, 0);
    this.velocity = velocity || new Vector(0, 0);
    this.acceleration = acceleration || new Vector(0, 0);
    this.topSpeed = 0;
    this.mass = mass || 5;
}
Mover.prototype.update = function() {
    this.velocity.add(this.acceleration);
    if (this.topSpeed != 0) {
        this.velocity.limit(this.topSpeed);
    }
    this.location.add(this.velocity);
};
Mover.prototype.display = function(ctx, noclear) {
    if (!noclear) {
        ctx.canvas.width = ctx.canvas.width;
    }
    ctx.beginPath();
    ctx.arc(this.location.x, this.location.y, this.mass * 32/5, 0, 2 * Math.PI, false);
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
};
Mover.prototype.limitSpeed = function(s) {
    this.topSpeed = s;
};
Mover.prototype.checkEdges = function(width, height) {
    if (this.location.x > width) {
        this.location.x = 0;
    } else if (this.location.x < 0) {
        this.location.x = width;
    }

    if (this.location.y > height) {
        this.location.y = 0;
    } else if (this.location.y < 0) {
        this.location.y = height;
    }
};
Mover.prototype.checkWalls = function(width, height) {
    if (this.location.x > width) {
        this.location.x = width;
        this.velocity.x *= -1;
    } else if (this.location.x < 0) {
        this.location.x = 0;
        this.velocity.x *= -1;
    }

    if (this.location.y > height) {
        this.location.y = height;
        this.velocity.y *= -1;
    } else if (this.location.y < 0) {
        this.location.y = 0;
        this.velocity.y *= -1;
    }
};
Mover.prototype.applyForce = function(force) {
    var f = Vector.div(force, this.mass);
    this.acceleration.add(f);
};
Mover.prototype.applyGravity = function() {
    var g = 9.8 * 0.01;
    this.acceleration.add(new Vector(0, g));
};
Mover.prototype.applyFriction = function(c) {
    var friction = Vector.mult(this.velocity, -1);
    friction.normalize();
    var normal = 1;
    friction.mult(c * normal);

    this.applyForce(friction);
};
Mover.prototype.applyFluidResistance = function(c) {
    var density = 1;
    var area = 1;
    var speed = this.velocity.mag();
    var drag = Vector.mult(this.velocity, -1);
    drag.normalize();
    drag.mult(speed * speed * c * density * area * 0.5);

    this.applyForce(drag);
};
Mover.prototype.applyUniversalG = function(m) {
    var force = Vector.sub(m.location, this.location);
    var distance = force.mag();
    distance = Util.constrain(distance, 10, 25);

    var G = 4;
    force.normalize();
    var strength = (G * this.mass * m.mass) / (distance * distance);
    force.mult(strength);

    this.applyForce(force);
};

(function example_0_1() {
    function Walker(x, y) {
        this.x = x;
        this.y = y;
    }
    Walker.prototype.display = function(ctx) {
        ctx.fillRect(this.x, this.y, 1, 1);
    };
    Walker.prototype.step = function(reset) {
        var choice = Random.uniform(0, 3);
        if (choice == 0) {
          this.x++;
        } else if (choice == 1) {
          this.x--;
        } else if (choice == 2) {
          this.y++;
        } else {
          this.y--;
        }
    };

    var w = new Walker(WIDTH/2, HEIGHT/2);
    var ew = new EgWidget('example_0_1', w.display.bind(w), w.step.bind(w), function() {
        w.x = ew.width/2;
        w.y = ew.height/2;
    });
    ew.run();
})();

(function example_0_2() {
    var randomCounts = [];
    randomCounts.length = 20;

    var ew = new EgWidget('example_0_2', function(ctx) {
        var w = ew.width / randomCounts.length;
        for (var x = 0; x < randomCounts.length; x++) {
            ctx.fillRect(x * w, ew.height - randomCounts[x], w - 1, randomCounts[x]);
        }
    }, function() {
        var index = Random.uniform(0, randomCounts.length - 1);
        if (randomCounts[index] === undefined) {
            randomCounts[index] = 0;
        } else {
            randomCounts[index]++;
        }
    }, function() {
        randomCounts = [];
        randomCounts.length = 20;
    });
    ew.run();
})();

(function example_0_3() {
    function Walker(x, y) {
        this.x = x;
        this.y = y;
    }
    Walker.prototype.display = function(ctx) {
        ctx.fillRect(this.x, this.y, 1, 1);
    };
    Walker.prototype.step = function() {
        var r = Math.random();
        if (r < 0.4) {
          this.x++;
        } else if (r < 0.6) {
          this.x--;
        } else if (r < 0.8) {
          this.y++;
        } else {
          this.y--;
        }
    };

    var w = new Walker(WIDTH/2, HEIGHT/2);
    var ew = new EgWidget('example_0_3', w.display.bind(w), w.step.bind(w), function() {
        w.x = ew.width/2;
        w.y = ew.height/2;
    });
    ew.run();
})();

(function example_0_4() {
    var x;
    var ew = new EgWidget('example_0_4', function(ctx) {
        ctx.beginPath();
        ctx.arc(x, 180, 16, 0, 2 * Math.PI, false);
        ctx.fill();
    }, function() {
        x = Random.gauss(320, 60);
    });
    ew.context.globalAlpha = 0.1;
    ew.run();
})();


(function example_0_5() {
    function Walker() {
        this.x = 0;
        this.y = 0;
        this.tx = 0;
        this.ty = 10000;
    }
    Walker.prototype.display = function(ctx) {
        //ctx.fillRect(this.x, this.y, 1, 1);
        ctx.canvas.width = ctx.canvas.width;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 16, 0, 2 * Math.PI, false);
        ctx.fill();
    };
    Walker.prototype.step = function() {
        this.x = Util.map(Random.noise(this.tx), 0, 1, 0, ew.width);
        this.y = Util.map(Random.noise(this.ty), 0, 1, 0, ew.height);

        this.tx += 0.01;
        this.ty += 0.01;
    };

    var w = new Walker;
    var ew = new EgWidget('example_0_5', w.display.bind(w), w.step.bind(w), function() {
        w.tx = 0;
        w.ty = 10000;
    });
    ew.run();
})();

(function example_0_6() {
    var ew = new EgWidget('example_0_6', function(ctx) {
        var imgData = ctx.createImageData(ew.width, ew.height);
        var xoff = 0.0;
        for (var x = 0; x < imgData.width; x++) {
            var yoff = 0.0;
            for (var y = 0; y < imgData.height; y++) {
                var bright = Util.map(Random.noise(xoff, yoff), 0, 1, 0, 255);
                imgData.data[(x + y * imgData.width) * 4] = imgData.data[(x + y * imgData.width) * 4 + 1] = imgData.data[(x + y * imgData.width) * 4 + 2] = bright;
                imgData.data[(x + y * imgData.width) * 4 + 3] = 255;
                yoff += 0.01;
            }
            xoff += 0.01;
        }
        ctx.putImageData(imgData, 0, 0);
    });
    ew.run();
})();

(function example_1_1() {
    var x = 100;
    var y = 100;
    var xspeed = 1;
    var yspeed = 3.3;

    var ew = new EgWidget('example_1_1', function(ctx) {
        ctx.canvas.width = ctx.canvas.width;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, 2 * Math.PI, false);
        ctx.fill();
    }, function() {
        x = x + xspeed;
        y = y + yspeed;
        if (x > ew.width || x < 0) {
            xspeed *= -1;
        }
        if (y > ew.height || y < 0) {
            yspeed *= -1;
        }
    }, function() {
        x = 100;
        y = 100;
        xspeed = 1;
        yspeed = 3.3;
    });
    ew.run();
})();

(function example_1_2() {
    var location = new Vector(100, 100);
    var velocity = new Vector(2.5, 5);
    var ew = new EgWidget('example_1_2', function(ctx) {
        ctx.canvas.width = ctx.canvas.width;
        ctx.beginPath();
        ctx.arc(location.x, location.y, 16, 0, 2 * Math.PI, false);
        ctx.fill();
    }, function() {
        location.add(velocity);
        if (location.x > ew.width || location.x < 0) {
            velocity.x *= -1;
        }
        if (location.y > ew.height || location.y < 0) {
            velocity.y *= -1;
        }
    }, function() {
        location.set(100, 100);
        velocity.set(2.5, 5);
    });
    ew.run();
})();


(function example_1_3() {
    var center = new Vector(WIDTH/2, HEIGHT/2);
    var ew = new EgWidget('example_1_3', function(ctx) {
        ctx.clearRect(-ew.width/2, -ew.height/2, ew.width, ew.height);

        var dir = Vector.sub(ew.mouse, center);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(dir.x, dir.y);
        ctx.stroke();
    }, function() {});
    ew.context.translate(center.x, center.y);
    ew.run();
})();

(function example_1_4() {
    var center = new Vector(WIDTH/2, HEIGHT/2);
    var ew = new EgWidget('example_1_4', function(ctx) {
        ctx.clearRect(-ew.width/2, -ew.height/2, ew.width, ew.height);

        var dir = Vector.sub(ew.mouse, center);
        dir.mult(0.5);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(dir.x, dir.y);
        ctx.stroke();
    }, function() {});
    ew.context.translate(center.x, center.y);
    ew.run();
})();

(function example_1_5() {
    var center = new Vector(WIDTH/2, HEIGHT/2);
    var ew = new EgWidget('example_1_5', function(ctx) {
        ctx.clearRect(0, 0, ew.width, ew.height);

        var dir = Vector.sub(ew.mouse, center);
        ctx.fillRect(0, 0, dir.mag(), 10);

        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(dir.x, dir.y);
        ctx.stroke();
        ctx.restore();
    }, function() {});
    ew.run();
})();

(function example_1_6() {
    var center = new Vector(WIDTH/2, HEIGHT/2);
    var ew = new EgWidget('example_1_6', function(ctx) {
        ctx.clearRect(-ew.width/2, -ew.height/2, ew.width, ew.height);

        var dir = Vector.sub(ew.mouse, center);
        dir.normalize();
        dir.mult(50);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(dir.x, dir.y);
        ctx.stroke();
    }, function() {});
    ew.context.translate(center.x, center.y);
    ew.run();
})();

(function example_1_7() {
    var m = new Mover(new Vector(Random.arbitrary(0, WIDTH), Random.arbitrary(0, HEIGHT)),
                      new Vector(Random.arbitrary(-2, 2), Random.arbitrary(-2, 2)));
    var ew = new EgWidget('example_1_7', m.display.bind(m), function() {
        m.update();
        m.checkEdges(ew.width, ew.height);
    }, function() {
        m.location.set(Random.arbitrary(0, WIDTH), Random.arbitrary(0, HEIGHT));
        m.velocity.set(Random.arbitrary(-2, 2), Random.arbitrary(-2, 2));
    });
    ew.run();
})();

(function example_1_8() {
    var m = new Mover(new Vector(WIDTH/2, HEIGHT/2), new Vector(0, 0), new Vector(-0.001, 0.01));
    m.limitSpeed(10);
    var ew = new EgWidget('example_1_8', m.display.bind(m), function() {
        m.update();
        m.checkEdges(ew.width, ew.height);
    }, function() {
        m.location.set(WIDTH/2, HEIGHT/2);
        m.velocity.set(0, 0);
        m.acceleration.set(-0.001,0.01);
    });
    ew.run();
})();

(function example_1_9() {
    var m = new Mover(new Vector(WIDTH/2, HEIGHT/2));
    m.limitSpeed(5);
    var ew = new EgWidget('example_1_9', m.display.bind(m), function() {
        m.acceleration = Vector.random2D();
        m.acceleration.mult(Random.arbitrary(0, 2));
        m.update();
        m.checkEdges(ew.width, ew.height);
    }, function() {
        m.location.set(WIDTH/2, HEIGHT/2);
        m.velocity.set(0, 0);
        m.acceleration.set(0, 0);
    });
    ew.run();
})();

(function example_1_10() {
    var m = new Mover(new Vector(WIDTH/2, HEIGHT/2));
    m.limitSpeed(5);
    var ew = new EgWidget('example_1_10', m.display.bind(m), function() {
        var dir = Vector.sub(ew.mouse, m.location);
        dir.normalize();
        dir.mult(0.5);
        m.acceleration = dir;
        m.update();
    }, function() {
        m.location.set(WIDTH/2, HEIGHT/2);
        m.velocity.set(0, 0);
        m.acceleration.set(0, 0);
    });
    ew.run();
})();

(function example_1_11() {
    var movers = [];
    for (var i = 0; i < 20; i++) {
        var m = new Mover(new Vector(Random.arbitrary(0, WIDTH), Random.arbitrary(0, HEIGHT)));
        m.limitSpeed(5);
        movers.push(m);
    }
    var ew = new EgWidget('example_1_11', function(ctx) {
        ew.clear();
        movers.forEach(function(m) {
            m.display(ctx, true);
        });
    }, function() {
        movers.forEach(function(m) {
            var dir = Vector.sub(ew.mouse, m.location);
            dir.normalize();
            dir.mult(0.2);
            m.acceleration = dir;
            m.update();
        });
    }, function() {
        movers.forEach(function(m) {
            m.location.set(Random.arbitrary(0, WIDTH), Random.arbitrary(0, HEIGHT));
            m.velocity.set(0, 0);
            m.acceleration.set(0, 0);
        });
    });
    ew.run();
})();

(function example_2_1() {
    var m = new Mover;
    var wind = new Vector(0.01, 0);
    var gravity = new Vector(0, 0.1);
    var ew = new EgWidget('example_2_1', m.display.bind(m), function() {
        m.acceleration.reset();
        m.applyForce(wind);
        m.applyForce(gravity);
        m.update();
        m.checkWalls(ew.width, ew.height);
    }, function() {
        m.location.reset();
        m.velocity.reset();
        m.acceleration.reset();
    });
    ew.run();
})();

(function example_2_2() {
    var movers = [];
    var wind = new Vector(0.01, 0);
    var gravity = new Vector(0, 0.1);
    for (var i = 0; i < 20; i++) {
        movers.push(new Mover(null, null, null, Random.arbitrary(0.1, 5)));
    }
    var ew = new EgWidget('example_2_2', function(ctx) {
        ew.clear();
        movers.forEach(function(m) {
            m.display(ctx, true);
        });
    }, function() {
        movers.forEach(function(m) {
            m.acceleration.reset();
            m.applyForce(wind);
            m.applyForce(gravity);
            m.update();
            m.checkWalls(ew.width, ew.height);
        });
    }, function() {
        movers.forEach(function(m) {
            m.location.reset();
            m.velocity.reset();
            m.acceleration.reset();
        });
    });
    ew.run();
})();

(function example_2_3() {
    var movers = [];
    var wind = new Vector(0.01, 0);
    for (var i = 0; i < 20; i++) {
        movers.push(new Mover(null, null, null, Random.arbitrary(0.1, 5)));
    }
    var ew = new EgWidget('example_2_3', function(ctx) {
        ew.clear();
        movers.forEach(function(m) {
            m.display(ctx, true);
        });
    }, function() {
        movers.forEach(function(m) {
            m.acceleration.reset();
            m.applyForce(wind);
            m.applyGravity();
            m.update();
            m.checkWalls(ew.width, ew.height);
        });
    }, function() {
        movers.forEach(function(m) {
            m.location.reset();
            m.velocity.reset();
            m.acceleration.reset();
        });
    });
    ew.run();
})();

(function example_2_4() {
    var movers = [];
    var wind = new Vector(0.01, 0);
    for (var i = 0; i < 5; i++) {
        movers.push(new Mover(null, null, null, Random.arbitrary(1, 5)));
    }
    var ew = new EgWidget('example_2_4', function(ctx) {
        ew.clear();
        movers.forEach(function(m) {
            m.display(ctx, true);
        });
    }, function() {
        movers.forEach(function(m) {
            m.acceleration.reset();
            m.applyForce(wind);
            m.applyGravity();
            m.applyFriction(0.05);
            m.update();
            m.checkWalls(ew.width, ew.height);
        });
    }, function() {
        movers.forEach(function(m) {
            m.location.reset();
            m.velocity.reset();
            m.acceleration.reset();
        });
    });
    ew.run();
})();

(function example_2_5() {
    var movers = [];
    for (var i = 0; i < 10; i++) {
        movers.push(new Mover(new Vector(Random.arbitrary(0, WIDTH), 0), null, null, Random.arbitrary(1, 5)));
    }
    var ew = new EgWidget('example_2_5', function(ctx) {
        ew.clear();
        movers.forEach(function(m) {
            m.display(ctx, true);
        });
        // draw fluid
        ctx.globalAlpha = 0.5;
        ctx.fillRect(0, ew.height/2, ew.width, ew.height/2);
    }, function() {
        movers.forEach(function(m) {
            m.acceleration.reset();
            if (m.location.y > ew.height/2) {
                m.applyFluidResistance(0.1);
            }
            m.applyGravity();
            m.update();
            m.checkWalls(ew.width, ew.height);
        });
    }, function() {
        movers.forEach(function(m) {
            m.location.set(Random.arbitrary(0, WIDTH), 0);
            m.velocity.reset();
            m.acceleration.reset();
        });
    });
    ew.run();
})();

(function example_2_6() {
    function Attractor() {
        this.location = new Vector(WIDTH/2, HEIGHT/2);
        this.mass = 20;
    }
    Attractor.prototype.display = function(ctx) {
        ctx.beginPath();
        ctx.arc(this.location.x, this.location.y, this.mass * 1.5, 0, 2 * Math.PI, false);
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
    }

    var a = new Attractor;
    var m = new Mover(new Vector(WIDTH/3, HEIGHT/3), new Vector(0, 3), null, 2);
    var ew = new EgWidget('example_2_6', function(ctx) {
        ew.clear();
        a.display(ctx);
        m.display(ctx, true);
    }, function() {
        m.acceleration.reset();
        m.applyUniversalG(a);
        m.update();
    }, function() {
        m.location.set(WIDTH/3, HEIGHT/3);
        m.velocity.set(0, 1);
        m.acceleration.reset();
    });
    ew.run();
})();

(function example_2_7() {
    function Attractor() {
        this.location = new Vector(WIDTH/2, HEIGHT/2);
        this.mass = 20;
    }
    Attractor.prototype.display = function(ctx) {
        ctx.beginPath();
        ctx.arc(this.location.x, this.location.y, this.mass * 1.5, 0, 2 * Math.PI, false);
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
    }

    var a = new Attractor;
    var movers = [];
    for (var i = 0; i < 10; i++) {
        movers.push(new Mover(new Vector(Random.arbitrary(0, WIDTH), Random.arbitrary(0, HEIGHT)), null, null, Random.arbitrary(1, 5)));
    }
    var ew = new EgWidget('example_2_7', function(ctx) {
        ew.clear();
        movers.forEach(function(m) {
            m.display(ctx, true);
        });
        a.display(ctx);
    }, function() {
        movers.forEach(function(m) {
            m.acceleration.reset();
            m.applyUniversalG(a);
            m.update();
        });
    }, function() {
        movers.forEach(function(m) {
            m.location.set(Random.arbitrary(0, WIDTH), Random.arbitrary(0, HEIGHT));
            m.velocity.reset();
            m.acceleration.reset();
        });
    });
    ew.run();
})();

(function example_2_8() {
    var movers = [];
    for (var i = 0; i < 10; i++) {
        movers.push(new Mover(new Vector(Random.arbitrary(0, WIDTH), Random.arbitrary(0, HEIGHT)), null, null, Random.arbitrary(1, 5)));
    }
    var ew = new EgWidget('example_2_8', function(ctx) {
        ew.clear();
        movers.forEach(function(m) {
            m.display(ctx, true);
        });
    }, function() {
        movers.forEach(function(m1) {
            m1.acceleration.reset();
            movers.forEach(function(m2) {
                m1 != m2 && m1.applyUniversalG(m2);
            });
            m1.update();
        });
    }, function() {
        movers.forEach(function(m) {
            m.location.set(Random.arbitrary(0, WIDTH), Random.arbitrary(0, HEIGHT));
            m.velocity.reset();
            m.acceleration.reset();
        });
    });
    ew.run();
})();

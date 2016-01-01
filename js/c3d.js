'use strict';

const WIDTH = 640;
const HEIGHT = 360;
class EgWidget {
    constructor(id, draw, update, reset) {
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
        this.frameCnt = 0;

        this.mouse = {x: 0, y: 0}
        this.canvas.onmousemove = this.onMousemove.bind(this);

        // set origin to the center of the canvas
        this.context.translate(WIDTH / 2, HEIGHT / 2);

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

    run() {
        if (this.pause) {
            return;
        }

        this.frameCnt++;
        if (this.update) {
            requestAnimationFrame(this.run.bind(this));
            this.update();
        }
        this.draw(this.context);
    }

    onPause() {
        this.pause = !this.pause;
        if (!this.pause) {
            requestAnimationFrame(this.run.bind(this));
        }
    }

    onReset() {
        this.reset && this.reset();
        this.clear();
        if (this.pause) {
            requestAnimationFrame(this.run.bind(this));
            this.pause = false;
        }
    }

    onMousemove(e) {
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
    }

    clear() {
        //this.canvas.width = this.canvas.width;
        this.context.save();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.restore();
    }
}

class Dot {
    constructor(x, y, z, r) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.r = r;
        this.f = 200;
    }

    rotatex(alpha) {
        let sin = Math.sin(alpha);
        let cos = Math.cos(alpha);
        let y = this.y * cos - this.z * sin;
        let z = this.y * sin + this.z * cos;
        this.y = y;
        this.z = z;
    }

    rotatey(beta) {
        let sin = Math.sin(beta);
        let cos = Math.cos(beta);
        let z = this.z * cos - this.x * sin;
        let x = this.z * sin + this.x * cos;
        this.z = z;
        this.x = x;
    }

    rotatez(gamma) {
        let sin = Math.sin(gamma);
        let cos = Math.cos(gamma);
        let x = this.x * cos - this.y * sin;
        let y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
    }

    display(ctx, c) {
        if (!c) {
            c = {x: 0, y: 0, z: 0}
        }
        let scale = (this.f + this.z + c.z) / this.f;
        this.xx = (this.x + c.x) * scale;
        this.yy = (this.y + c.y) * scale;
        let r = this.r * scale;

        ctx.beginPath();
        ctx.arc(this.xx, this.yy, r, 0, 2 * Math.PI, false);
        ctx.globalAlpha = Math.min(1, scale);
        ctx.fill();
        ctx.closePath();
    }
}

class Cube {
    constructor(x, y, z, l) {
        let r = 1;
        this.dots = [];
        this.dots.push(new Dot(x, y, z, r));
        this.dots.push(new Dot(x + l, y, z, r));
        this.dots.push(new Dot(x + l, y + l, z, r));
        this.dots.push(new Dot(x, y + l, z, r));
        this.dots.push(new Dot(x, y, z + l, r));
        this.dots.push(new Dot(x + l, y, z + l, r));
        this.dots.push(new Dot(x + l, y + l, z + l, r));
        this.dots.push(new Dot(x, y + l, z + l, r));
    }

    rotatex(a) {
        this.dots.forEach((d) => {
            d.rotatex(a);
        });
    }

    rotatey(a) {
        this.dots.forEach((d) => {
            d.rotatey(a);
        });
    }

    rotatez(a) {
        this.dots.forEach((d) => {
            d.rotatez(a);
        });
    }

    display(ctx, camera) {
        this.dots.forEach((d) => {
            d.display(ctx, camera);
        });

        // draw border
        ctx.beginPath();
        ctx.moveTo(this.dots[0].xx, this.dots[0].yy);
        ctx.lineTo(this.dots[1].xx, this.dots[1].yy);
        ctx.lineTo(this.dots[2].xx, this.dots[2].yy);
        ctx.lineTo(this.dots[3].xx, this.dots[3].yy);
        ctx.lineTo(this.dots[0].xx, this.dots[0].yy);
        ctx.moveTo(this.dots[4].xx, this.dots[4].yy);
        ctx.lineTo(this.dots[5].xx, this.dots[5].yy);
        ctx.lineTo(this.dots[6].xx, this.dots[6].yy);
        ctx.lineTo(this.dots[7].xx, this.dots[7].yy);
        ctx.lineTo(this.dots[4].xx, this.dots[4].yy);
        ctx.lineTo(this.dots[0].xx, this.dots[0].yy);
        ctx.moveTo(this.dots[1].xx, this.dots[1].yy);
        ctx.lineTo(this.dots[5].xx, this.dots[5].yy);
        ctx.moveTo(this.dots[2].xx, this.dots[2].yy);
        ctx.lineTo(this.dots[6].xx, this.dots[6].yy);
        ctx.moveTo(this.dots[3].xx, this.dots[3].yy);
        ctx.lineTo(this.dots[7].xx, this.dots[7].yy);
        ctx.stroke();
    }
}

(function dot_rotation() {
    let dot = new Dot(100, 0, 0, 20);
    let ew = new EgWidget('dot_rotation', (ctx) => {
        ew.clear();
        dot.display(ctx);
    }, () => {
        dot.rotatey(0.01);
    });
    ew.run();
})();

(function cube() {
    let cube = new Cube(-50, -50, -50, 100);
    let ew = new EgWidget('cube', (ctx) => {
        ew.clear();
        cube.display(ctx);
    }, () => {
        cube.rotatex(0.01);
        cube.rotatez(0.01);
    });
    ew.run();
})();

(function camera() {
    let v = 0;
    let cam = {x: 0, y: 0, z: 0}
    let cube = new Cube(-50, -50, -50, 100);
    let ew = new EgWidget('camera', (ctx) => {
        ew.clear();
        cube.display(ctx, cam);
    }, () => {
        v += 0.01;
        cam.x = WIDTH / 2 * Math.sin(v);
    });
    ew.run();
})();

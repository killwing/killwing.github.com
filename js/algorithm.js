'use strict';

let WIDTH = 640;
let HEIGHT = 360;
let N = 20;

// http://clrs.cc/
let COLOR = {
    UNSORTED: '#FF4136',
    SORTED: '#2ECC40'
};

function VisWidget(sort) {
    this.svg = d3.select('#'+sort.name).attr('width', WIDTH).attr('height', HEIGHT);
    this.speed = 1000;
    this.sort = sort;

    this.init();

    // init draw
    this.svg.selectAll('rect')
        .data(this.bars)
        .enter()
        .append('rect')
        .attr('x', function(d, i) { return d.x; })
        .attr('y', function(d, i) { return d.y; })
        .attr('width', function(d, i) { return d.w; })
        .attr('height', function(d, i) { return d.h; })
        .attr('fill', COLOR.UNSORTED);

    // controls
    let svgElem = document.getElementById(sort.name);
    let resetBtn = document.createElement('button');
    resetBtn.innerHTML = 'RESET';
    resetBtn.onclick = this.onReset.bind(this);
    svgElem.parentNode.insertBefore(resetBtn, svgElem.nextSibling);

    let stepBtn = document.createElement('button');
    stepBtn.innerHTML = 'STEP';
    stepBtn.onclick = this.onStep.bind(this);
    svgElem.parentNode.insertBefore(stepBtn, svgElem.nextSibling);

    let playBtn = document.createElement('button');
    playBtn.innerHTML = 'PLAY';
    playBtn.onclick = this.onPlay.bind(this);
    svgElem.parentNode.insertBefore(playBtn, svgElem.nextSibling);
}
VisWidget.prototype.init = function() {
    this.bars = [];
    this.values = [];
    for (let i = 0; i < N; ++i) {
        let b = {};
        b.w = WIDTH / N - 1;
        b.h = Math.random() * HEIGHT;
        b.x = i * (WIDTH / N);
        b.y = HEIGHT - b.h;
        b.s = 'UNSORTED'; // state

        this.bars.push(b);
        this.values.push(b);
    }
    this.gen = new this.sort(this.values, this.swap.bind(this));
};
VisWidget.prototype.update = function() {
    let ret = this.gen.next();
    if (ret.done) {
        this.done();
        return;
    }

    // update state
    this.values[ret.value].s = 'SORTED';

    // redraw
    this.svg.selectAll('rect')
        .data(this.bars)
        .transition()
        .duration(1000)
        .attr('x', function(d, i) { return d.x; })
        .attr('y', function(d, i) { return d.y; })
        .attr('width', function(d, i) { return d.w; })
        .attr('height', function(d, i) { return d.h; })
        .attr('fill', function(d, i) { return COLOR[d.s]; })
};
VisWidget.prototype.swap = function(i, j) {
    // swap pos first
    let temp = this.values[i].x;
    this.values[i].x = this.values[j].x;
    this.values[j].x = temp;

    // swap the bar referenced
    temp = this.values[i];
    this.values[i] = this.values[j];
    this.values[j] = temp;
};
VisWidget.prototype.onPlay = function() {
    this.timerId = setInterval(this.update.bind(this), this.speed);
};
VisWidget.prototype.onStep = function() {
    // stop play first
    if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
    } else {
        this.update();
    }
};
VisWidget.prototype.onReset = function() {
    clearInterval(this.timerId);
    this.timerId = null;
    this.init();

    this.svg.selectAll('rect')
        .data(this.bars)
        .attr('x', function(d, i) { return d.x; })
        .attr('y', function(d, i) { return d.y; })
        .attr('width', function(d, i) { return d.w; })
        .attr('height', function(d, i) { return d.h; })
        .attr('fill', COLOR.UNSORTED);
};
VisWidget.prototype.done = function() {
    clearInterval(this.timerId);
    this.timerId = null;
    this.svg.selectAll('rect').attr('fill', COLOR.SORTED);
}

function *selection(a, swap) {
    for (let i = 0; i != a.length-1; ++i) {
        let t = i; // min pos
        // select minimum to front
        for (let j = i+1; j != a.length; ++j) {
            if (a[j].h < a[t].h) { // compare height as value
                t = j;
            }
        }
        swap(i, t);
        yield i;
    }
};
new VisWidget(selection);


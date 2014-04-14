'use strict';

const WIDTH = 640;
const HEIGHT = 360;
const N = 20;
const SPEED = 1000;
const OFFSET = 30;

// http://clrs.cc/
const COLOR = {
    UNSORTED: '#FF4136',
    SORTED: '#2ECC40',
    INACTIVE: '#DDDDDD',
    LEFT: '#01FF70',
    RIGHT: '#3D9970',
    HALF: '#7FDBFF'
};

function BarData() {
    this.bars = [];
    this.values = [];
    this.length = N;
    for (let i = 0; i < N; ++i) {
        let b = {};
        b.w = WIDTH / N - 1;
        b.h = Math.random() * HEIGHT;
        b.x = i * (WIDTH / N);
        b.y = HEIGHT - b.h;
        b.s = 'UNSORTED';
        b.a = true; // active

        this.bars.push(b);
        this.values.push(b);
    }
}
BarData.prototype.swap = function(i, j) {
    if (i == j) {
        return;
    }

    // swap pos first
    let temp = this.values[i].x;
    this.values[i].x = this.values[j].x;
    this.values[j].x = temp;

    // swap the bar referenced
    temp = this.values[i];
    this.values[i] = this.values[j];
    this.values[j] = temp;
};
BarData.prototype.get = function(i) {
    return this.values[i];
};
BarData.prototype.up = function(i) {
    this.values[i].preX = undefined;
    this.values[i].y -= OFFSET;
    return this.values[i];
};
BarData.prototype.down = function(i, v) {
    if (this.values[i].preX !== undefined) {
        v.preX = v.x; // backup
        v.x = this.values[i].preX;
    } else {
        v.preX = v.x; // backup
        v.x = this.values[i].x;
    }
    this.values[i] = v;
    this.values[i].y += OFFSET;
}
BarData.prototype.less = function(i, j) {
    return this.values[i].h < this.values[j].h;
};
BarData.prototype.greaterValue = function(i, v) {
    return this.values[i].h > v.h;
};
BarData.lessEqual = function(x, y) {
    return x.h <= y.h;
};
BarData.prototype.assign = function(i, j) {
    if (this.emptyX !== undefined) {
        let newEmptyX = this.values[j].x;
        this.values[j].x = this.emptyX;
        this.emptyX = newEmptyX;
        this.values[i] = this.values[j];
    } else {
        this.emptyX = this.values[j].x; // save empty pos
        this.values[j].x = this.values[i].x;
        this.values[i] = this.values[j];
    }
};
BarData.prototype.assignValue = function(i, v) {
    if (this.emptyX !== undefined) {
        v.x = this.emptyX;
        this.values[i] = v;
        this.emptyX = undefined;
    } // else no empty pos, other value can not be assigned
};
BarData.prototype.setState = function(e) {
    if (e.s == 'GROUP') {
        this.values.forEach(function(value, i) {
            value.a = e.a(i);
        });
    } else {
        if (e.i instanceof Array) { // set range
            for (var i = e.i[0]; i <= e.i[1]; ++i) {
                this.values[i].s = e.s(i);
                this.values[i].a = e.a ? e.a(i) : true;
            };
        } else {
            this.values[e.i].s = e.s;
        }
    }
};

function BarWidget(sort) {
    this.svg = d3.select('#'+sort.name).attr('width', WIDTH).attr('height', HEIGHT);
    this.speed = SPEED;
    this.sort = sort;

    this.init();

    // init draw
    this.svg.selectAll('rect')
        .data(this.data.bars)
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
BarWidget.prototype.init = function() {
    this.data = new BarData;
    this.gen = new this.sort(this.data);
};
BarWidget.prototype.update = function() {
    let ret = this.gen.next();
    if (ret.done) {
        this.done();
        return;
    }

    // update state
    this.data.setState(ret.value);

    // redraw
    this.svg.selectAll('rect')
        .data(this.data.bars)
        .transition()
        .duration(this.speed)
        .attr('x', function(d, i) { return d.x; })
        .attr('y', function(d, i) { return d.y; })
        .attr('width', function(d, i) { return d.w; })
        .attr('height', function(d, i) { return d.h; })
        .attr('fill', function(d, i) { return d.a ? COLOR[d.s] : COLOR.INACTIVE; })
};
BarWidget.prototype.onPlay = function() {
    if (!this.timerId) {
        this.timerId = setInterval(this.update.bind(this), this.speed);
    }
};
BarWidget.prototype.onStep = function() {
    // stop play first
    if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
    } else {
        this.update();
    }
};
BarWidget.prototype.onReset = function() {
    clearInterval(this.timerId);
    this.timerId = null;
    this.init();

    this.svg.selectAll('rect')
        .data(this.data.bars)
        .attr('x', function(d, i) { return d.x; })
        .attr('y', function(d, i) { return d.y; })
        .attr('width', function(d, i) { return d.w; })
        .attr('height', function(d, i) { return d.h; })
        .attr('fill', COLOR.UNSORTED);
};
BarWidget.prototype.done = function() {
    clearInterval(this.timerId);
    this.timerId = null;
    this.svg.selectAll('rect').transition().attr('fill', COLOR.SORTED);
};


function TreeData() {
    this.length = N;
    this.values = [];
    for (let i = 0; i < this.length; ++i) {
        this.values.push({ value: Math.floor(Math.random() * 100), s: 'UNSORTED', children: [] });
    }

    // build tree from array
    let tree = {};
    let i = 0;
    let q = [];
    if (i < this.length) {
        let node = this.values[i++];
        tree = node;
        q.push(node);
    }
    while (i < this.length) {
        let p = q.shift();

        let nodeL = this.values[i++];
        p.children.push(nodeL);
        q.push(nodeL);

        if (i < this.length) {
            let nodeR = this.values[i++];
            p.children.push(nodeR);
            q.push(nodeR);
        }
    }

    this.tree = d3.layout.tree().size([WIDTH, HEIGHT]);
    this.nodes = this.tree.nodes(tree);
    this.links = this.tree.links(this.nodes);

    // set height between nodes
    this.nodes.forEach(function(d) { d.y = d.depth * 70 + 30; });
}
TreeData.prototype.swap = function(i, j) {
    if (i == j) {
        return;
    }

    // swap pos first
    let temp = this.values[i].x;
    this.values[i].x = this.values[j].x;
    this.values[j].x = temp;

    temp = this.values[i].y;
    this.values[i].y = this.values[j].y;
    this.values[j].y = temp;

    //// swap the node referenced
    temp = this.values[i];
    this.values[i] = this.values[j];
    this.values[j] = temp;
};
TreeData.prototype.greater = function(i, j) {
    return this.values[i].value > this.values[j].value;
};
TreeData.prototype.greaterEqual = function(i, j) {
    return this.values[i].value >= this.values[j].value;
};
TreeData.prototype.setState = function(e) {
    if (e.i instanceof Array) { // set range
        for (var i = e.i[0]; i <= e.i[1]; ++i) {
            this.values[i].s = e.s;
        };
    } else {
        this.values[e.i].s = e.s;
        if (e.ii !== undefined) { // extra
            this.values[e.ii].s = e.ss;
        }
    }
};

function TreeWidget(sort) {
    this.svg = d3.select('#'+sort.name).attr('width', WIDTH).attr('height', HEIGHT);
    this.speed = SPEED;
    this.sort = sort;

    this.diagonal = d3.svg.diagonal().projection(function(d) { return [d.x, d.y]; });

    this.init();

    // init draw
    this.svg.selectAll('path')
        .data(this.data.links)
        .enter()
        .append('path')
        .attr('d', this.diagonal)
        .attr('stroke', COLOR.INACTIVE)
        .attr('stroke-width', '2px')
        .attr('fill', 'none');

    let svgNodes = this.svg.selectAll('g')
        .data(this.data.nodes)
        .enter()
        .append('g')
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });

    svgNodes.append('circle')
        .attr('r', 20)
        .attr('fill', function(d) { return COLOR[d.s]; });

    svgNodes.append('text')
        .attr('text-anchor', 'middle')
        .text(function(d) { return d.value; });

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
TreeWidget.prototype.init = function() {
    this.data = new TreeData;
    this.gen = new this.sort(this.data);
};
TreeWidget.prototype.update = function() {
    let ret = this.gen.next();
    if (ret.done) {
        this.done();
        return;
    }

    // update state
    this.data.setState(ret.value);

    // redraw
    this.svg.selectAll('g')
        .data(this.data.nodes)
        .transition()
        .duration(this.speed)
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });

    this.svg.selectAll('g circle')
        .data(this.data.nodes)
        .transition()
        .duration(this.speed)
        .attr('fill', function(d) { return COLOR[d.s]; });
};
TreeWidget.prototype.onPlay = function() {
    if (!this.timerId) {
        this.timerId = setInterval(this.update.bind(this), this.speed);
    }
};
TreeWidget.prototype.onStep = function() {
    // stop play first
    if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
    } else {
        this.update();
    }
};
TreeWidget.prototype.onReset = function() {
    clearInterval(this.timerId);
    this.timerId = null;
    this.init();

    this.svg.selectAll('g')
        .data(this.data.nodes)
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });

    this.svg.selectAll('g circle')
        .data(this.data.nodes)
        .attr('fill', function(d) { return COLOR.UNSORTED; });

    this.svg.selectAll('g text')
        .data(this.data.nodes)
        .text(function(d) { return d.value; });
};
TreeWidget.prototype.done = function() {
    clearInterval(this.timerId);
    this.timerId = null;
    this.svg.selectAll('g circle').transition().attr('fill', COLOR.SORTED);
};

function *selection(a) {
    for (let i = 0; i != a.length-1; ++i) {
        let min = i;
        for (let j = i+1; j != a.length; ++j) {
            if (a.less(j, min)) {
                min = j;
            }
        }
        a.swap(i, min);
        yield {i: i, s: 'SORTED'};
    }
}
new BarWidget(selection);

function *insertion(a) {
    yield {i: 0, s: 'SORTED'}; // the 1st one is always sorted, change state for it
    for (let i = 1; i != a.length; ++i) {
        let insert = a.get(i);
        let j = i;
        for (; j > 0; --j) {
            if (a.greaterValue(j-1, insert)) {
                a.assign(j, j-1);
            } else {
                break;
            }
        }
        a.assignValue(j, insert);
        yield {i: j, s: 'SORTED'};
    }
}
new BarWidget(insertion);

function *shell(a) {
    let d = 1;
    while (d < a.length/3) {
        d = 3 * d + 1; // 1, 4, 13, 40
    }

    while (d) {
        yield {i: [0, a.length-1], s: function() {
            return 'UNSORTED';
        }, a: function() {
            return (d == 1) ? true : false;
        }}; // reset state

        for (let i = d; i != a.length; ++i) {
            if (d != 1) {
                yield {s: 'GROUP', a: function(index) {
                    return (index - i % d) % d == 0;
                }}; // focus current group
            }
            if (i - d < d) {
                yield {i: i-d, s: 'SORTED'}; // make 1st of group sorted
            }

            let insert = a.get(i);
            let j = i;
            for (; j >= d; j -= d) {
                if (a.greaterValue(j-d, insert)) {
                    a.assign(j, j-d);
                } else {
                    break;
                }
            }

            a.assignValue(j, insert);
            yield {i: j, s: 'SORTED'};
        }

        d = Math.floor(d/3);
    }
};
new BarWidget(shell);

function *quick(a, l, r) {
    l = (l == undefined) ? 0 : l;
    r = (r == undefined) ? a.length-1 : r;

    yield {i: [l, r], s: function() { return 'UNSORTED'; }}; // reset state

    var m = l;
    for (var i = l+1; i <= r; ++i) {
        if (a.less(i, l)) {
            ++m;
            a.swap(i, m);
            yield {i: m, s: 'LEFT'};
        } else {
            yield {i: i, s: 'RIGHT'};
        }
    }
    a.swap(l, m);
    yield {i: m, s: 'SORTED'};

    if (l < m-1) {
        yield *quick(a, l, m-1);
    } else {
        yield {i: l, s: 'SORTED'};
    }

    if (m+1 < r) {
        yield *quick(a, m+1, r);
    } else {
        yield {i: r, s: 'SORTED'};
    }
};
new BarWidget(quick);


function *merge(a, l, r) {
    l = (l == undefined) ? 0 : l;
    r = (r == undefined) ? a.length-1 : r;
    if (l >= r) {
        return;
    }

    let m = Math.floor((l+r)/2);
    yield *merge(a, l, m);
    yield *merge(a, m+1, r);

    let aux = [];
    for (let i = l; i <= r; ++i) {
        aux[i] = a.up(i);
    }
    yield {i: [0, a.length-1], s: function(i) {
        if (i > m && i <= r) {
            return 'RIGHT';
        } else if (i >= l && i <= m) {
            return 'LEFT';
        } else {
            return 'UNSORTED';
        }
    }}; // reset state

    let x = l;
    let y = m + 1;
    for (let i = l; i <= r; ++i) {
        if (x > m) {
            a.down(i, aux[y++]);
        } else if (y > r) {
            a.down(i, aux[x++]);
        } else if (BarData.lessEqual(aux[x], aux[y])) {
            a.down(i, aux[x++]);
        } else {
            a.down(i, aux[y++]);
        }
        yield {i: i, s: 'SORTED'};
    }
}
new BarWidget(merge);

function *heap(a) {
    function *sink(l, r) {
        let j = l;
        while (2*j+1 <= r) {
            let p = 2*j+1;
            if (p+1 <= r && a.greater(p+1, p)) {
                ++p;
            }
            if (a.greaterEqual(j, p)) {
                yield {i: j, s: 'HALF'};
                break;
            }
            a.swap(p, j);
            j = p;

            // update state
            if (2*p+1 <= r) {
                yield {i: p, s: 'UNSORTED'};
            } else {
                yield {i: p, s: 'HALF'};
            }
        }
    };

    let n = a.length - 1;
    yield {i: [Math.floor((n-1)/2)+1, n], s: 'HALF'};
    for (let i = Math.floor((n-1)/2); i >= 0; --i) {
        yield *sink(i, n);
    }

    while (n > 0) {
        a.swap(0, n);
        yield {i: n, s: 'SORTED', ii: 0, ss: 'UNSORTED'};
        n--;
        yield *sink(0, n);
    }
}
new TreeWidget(heap);

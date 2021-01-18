function assert(...args) {
  console.assert(...args);
}

function print(...args) {
  console.log(...args);
}

function min(a, b) {
  return Math.min(a, b);
}

function max(a, b) {
  return Math.max(a, b);
}

function floor(a) {
  return Math.floor(a);
}

function round(a) {
  return Math.round(a);
}

function ceil(a) {
  return Math.ceil(a);
}

function clamp(value, a, b) {
  return min(max(value, a), b);
}

class Vector2 {
  x = 0;
  y = 0;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
};

function v2(...args) {
  return new Vector2(...args);
}

function v2_add(v0, v1) {
  return v2(v0.x + v1.x, v0.y + v1.y);
}

class Vector4 {
  x = 0;
  y = 0;
  z = 0;
  w = 0;

  constructor(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
};

function v4(...args) {
  return new Vector4(...args);
}

class Rectangle2 {
  x0 = 0;
  y0 = 0;
  x1 = 0;
  y1 = 0;

  constructor(x0, y0, x1, y1) {
    if (typeof x1 !== "undefined") {
      this.x0 = x0;
      this.y0 = y0;
      this.x1 = x1;
      this.y1 = y1;
    } else {
      assert(x0 instanceof Vector2);
      assert(y0 instanceof Vector2);

      this.x0 = x0.x;
      this.y0 = x0.y;
      this.x1 = y0.x;
      this.y1 = y0.y;
    }
  }

  get p0() {
    return v2(this.x0, this.y0);
  }

  get p1() {
    return v2(this.x1, this.y1);
  }

  size() {
    return v2(this.x1 - this.x0, this.y1 - this.y0);
  }

  center() {
    const s = this.size();
    return v2(this.x0 + s.x / 2, this.y0 + s.y / 2);
  }

  width() { return abs(this.x1 - this.x0); }

  height() { return abs(this.y1 - this.y0); }
};

function r2(...args) {
  return new Rectangle2(...args);
}

function center_in_bounds(rect, size) {
  const center = rect.center();

  return r2(
    center.x - size.x * 0.5,
    center.y - size.y * 0.5,
    center.x + size.x * 0.5,
    center.y + size.y * 0.5,
  );
}

const v4_white = v4(1, 1, 1, 1);
const v4_black = v4(0, 0, 0, 1);

function S(...args) {
  return args[0];
}

const imgui_elements = {};

function imgui_hash(value) {
  value ^= (value >> 20) ^ (value >> 12);
  return value ^ (value >> 7) ^ (value >> 4);
}

function imgui_unique_vec2_id(pos, id) {
  return imgui_hash(pos.x) + imgui_hash(pos.y) + id;
}

function imgui_unique_id(rect, id) {
  return imgui_hash(rect.x0) + imgui_hash(rect.y0) + imgui_hash(rect.x1) + imgui_hash(rect.y1) + id;
}

function v4_to_css_color(v) {
  const r = clamp(v.x, 0, 1) * 255;
  const g = clamp(v.y, 0, 1) * 255;
  const b = clamp(v.z, 0, 1) * 255;
  const a = clamp(v.w, 0, 1);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function to_px(val) {
  return `${val}px`;
}

const ruler = document.createElement('div');
document.body.appendChild(ruler);
ruler.style.display = 'inline-table';
ruler.style.visibility = 'hidden';
ruler.style.position = 'absolute';
ruler.style.left = '-99999px';

function measure_text_width(font, text) {
  ruler.innerText = text;
  return ruler.offsetWidth;
}

function measure_text_height(font, text) {
  ruler.innerText = text;
  return ruler.offsetHeight;
}

function measure_text_size(font, text) {
  ruler.innerText = text;
  return v2(ruler.offsetWidth, ruler.offsetHeight);
}

const command_buffer = [];
const regions = [];

function draw_rect(rect, color, style = null) {
  command_buffer.push({ type: 'rect', rect, color, style });
}

function draw_text(font, text, rect, color = v4_white, anchor = v2(0, 0), scale = v2(1, 1)) {
  command_buffer.push({ type: 'text', font, text, rect, color, anchor, scale });
}

function begin_region(rect, style = null) {
  const id = regions.length;

  const region = { type: 'begin_region', id, rect, style };
  regions.push(region);
  command_buffer.push(region);

  return id;
}

function end_region(id) {
  command_buffer.push({ type: 'end_region' });
}

function begin_clipping_region(rect) {
  return begin_region(rect, { overflow: 'hidden' });
}

function end_clipping_region(id) {
  return end_region(id);
}

function draw_button(rect, text) {
  const id = imgui_unique_id(rect, 1);

  const region = begin_clipping_region(rect);
  draw_rect(rect, v4(0, 0, 0, 1), { radius: 8 });
  draw_text(null, text, rect, v4_white, v2(0.5, 0.5));
  end_clipping_region(region);

  return false;
}

let window_width = window.innerWidth;
let window_height = window.innerHeight;
const window_size = v2(window_width, window_height);

let root = null;

function init(el) {
  root = el;
  tick();
}

function tick() {
  do_one_frame();
  window.requestAnimationFrame(tick);
}

function do_one_frame() {
  window_width = window.innerWidth;
  window_height = window.innerHeight;
  window_size.x = window_width;
  window_size.y = window_height;

  render();

  root.innerHTML = '';

  let active_region = null;
  for (let i = 0; i < command_buffer.length; i++) {
    const cmd = command_buffer[i];

    switch (cmd.type) {
      case 'rect': {
        const pos = cmd.rect.p0;
        const size = cmd.rect.size();

        if (active_region) {
          pos.x -= active_region.cmd.x0;
          pos.y -= active_region.cmd.y0;
        }

        const el = document.createElement('div');
        el.style.background = v4_to_css_color(cmd.color);
        el.style.position = 'absolute';
        el.style.left = pos.x + 'px';
        el.style.top = pos.y + 'px';
        el.style.width = size.x + 'px';
        el.style.height = size.y + 'px';

        if (cmd.style.radius) {
          el.style.borderRadius = cmd.style.radius + 'px';
        }

        if (active_region) {
          active_region.el.appendChild(el);
        } else {
          root.appendChild(el);
        }
      } break;

      case 'text': {
        const pos = cmd.rect.p0;
        const size = cmd.rect.size();

        if (active_region) {
          pos.x -= active_region.cmd.x0;
          pos.y -= active_region.cmd.y0;
        }

        const el = document.createElement('div');
        el.style.color = v4_to_css_color(cmd.color);
        el.style.position = 'absolute';
        el.style.left = pos.x + 'px';
        el.style.top = pos.y + 'px';
        el.style.width = size.x + 'px';
        el.style.height = size.y + 'px';
        el.innerText = cmd.text;

        if (cmd.anchor.x === 0.5) {
          el.style.display = 'flex';
          el.style.textAlign = 'center';
          el.style.justifyContent = 'center';
        }

        if (cmd.anchor.y === 0.5) {
          el.style.display = 'flex';
          el.style.alignItems = 'center';
        }

        if (active_region) {
          active_region.el.appendChild(el);
        } else {
          root.appendChild(el);
        }
      } break;

      case 'begin_region': {
        const el = document.createElement('div');

        const pos = cmd.rect.p0;
        const size = cmd.rect.size();

        el.style.position = 'absolute';
        el.style.left = pos.x + 'px';
        el.style.top = pos.y + 'px';
        el.style.width = size.x + 'px';
        el.style.height = size.y + 'px';

        if (cmd.style.overflow) {
          el.style.overflow = cmd.style.overflow;
        }

        if (active_region) {
          active_region.el.appendChild(el);
        } else {
          root.appendChild(el);
        }

        active_region = { el, cmd, parent: active_region };

      } break;

      case 'end_region': {
        assert(active_region);

        if (active_region.parent) {
          active_region = active_region.parent;
        } else {
          active_region = null;
        }
      } break;
    }
  }

  command_buffer.length = 0;
  regions.length = 0;
}

function render() {
  const screen_bounds = r2(v2(0, 0), window_size);

  const button_rect = center_in_bounds(screen_bounds, v2(256, 48));

  if (draw_button(button_rect, S("Hello, world!"))) {
    print("CLICKED!");
  }
}

//init(document.getElementById('app'));
root = document.getElementById('app');
do_one_frame();

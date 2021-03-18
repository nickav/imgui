//
// Functions
//

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

//
// Math
//

class Vector2 {
  x = 0;
  y = 0;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

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
}

function v4(...args) {
  return new Vector4(...args);
}

class Rectangle2 {
  x0 = 0;
  y0 = 0;
  x1 = 0;
  y1 = 0;

  constructor(x0, y0, x1, y1) {
    if (typeof x1 !== 'undefined') {
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

  width() {
    return abs(this.x1 - this.x0);
  }

  height() {
    return abs(this.y1 - this.y0);
  }
}

function r2(...args) {
  return new Rectangle2(...args);
}

function center_in_bounds(rect, size) {
  const center = rect.center();

  return r2(center.x - size.x * 0.5, center.y - size.y * 0.5, center.x + size.x * 0.5, center.y + size.y * 0.5);
}

//
// Strings
//

function S(...args) {
  return args[0];
}

//
// Constants
//

const v4_white = v4(1, 1, 1, 1);
const v4_black = v4(0, 0, 0, 1);
const v4_red = v4(1, 0, 0, 1);
const v4_green = v4(0, 1, 0, 1);
const v4_blue = v4(0, 0, 1, 1);

const v2_one = v2(1, 1);
const v2_zero = v2(0, 0);
const v2_center = v2(0.5, 0.5);

const KEY_SPACE = 32;
const KEY_RIGHT = 39;
const KEY_LEFT = 37;
const KEY_N = 78;
const KEY_P = 80;

//
// Fonts
//

const ruler = document.createElement('div');
document.body.appendChild(ruler);
ruler.style.display = 'inline-table';
ruler.style.visibility = 'hidden';
ruler.style.position = 'absolute';
ruler.style.left = '-99999px';

function normalize_styles(css_styles) {
  Object.keys(css_styles).forEach((key) => {
    const prop = css_styles[key];

    if (typeof prop === 'number') {
      css_styles[key] += 'px';
    } else if (prop instanceof Vector2) {
      css_styles[key] = `${prop.x}px ${prop.y}px`;
    } else if (prop instanceof Vector4) {
      css_styles[key] = v4_to_css_color(prop);
    }
  });

  return css_styles;
}

function style_ruler(ruler, font) {
  Object.assign(
    ruler.style,
    normalize_styles({
      fontFamily: '',
      fontSize: '',
      fontStyle: '',
      fontVariant: '',
      fontWeight: '',
      letterSpacing: '',
      lineHeight: '',
      ...font,
    })
  );
}

function measure_text_width(font, text) {
  style_ruler(ruler, font);
  ruler.innerText = text;
  return ruler.offsetWidth;
}

function measure_text_height(font, text) {
  style_ruler(ruler, font);
  ruler.innerText = text;
  return ruler.offsetHeight;
}

function measure_text_size(font, text) {
  style_ruler(ruler, font);
  ruler.innerText = text;
  return v2(ruler.offsetWidth, ruler.offsetHeight);
}

//
// Imgui
//

const input = {
  mouse: {
    position: v2(0, 0),
    state: {
      is_down: false,
      just_released: false,
      just_pressed: false,
    },
  },
  keyboard: {
    keys: [],
    last_key_code: 0,
  },
};

function bind_input_listeners() {
  window.addEventListener('mousemove', (event) => {
    input.mouse.position.x = event.pageX;
    input.mouse.position.y = event.pageY;
  });

  window.addEventListener('mousedown', (event) => {
    input.mouse.state.just_pressed = true;
    input.mouse.state.is_down = true;
  });

  window.addEventListener('mouseup', (event) => {
    input.mouse.state.just_released = true;
    input.mouse.state.is_down = false;
  });

  document.addEventListener('keydown', (event) => {
    const key_code = event.keyCode;

    input.keyboard.keys[key_code] = {
      just_pressed: !event.repeat,
      is_down: true,
      just_released: false,
    };

    input.keyboard.last_key_code = key_code;
  });

  document.addEventListener('keyup', (event) => {
    const key_code = event.keyCode;

    input.keyboard.keys[key_code] = {
      just_pressed: false,
      is_down: false,
      just_released: true,
    };
  });
}

function input_end_frame() {
  input.mouse.state.just_pressed = false;
  input.mouse.state.just_released = false;

  for (let i = 0; i < input.keyboard.keys.length; i += 1) {
    const key = input.keyboard.keys[i];

    if (key) {
      key.just_pressed = false;
      key.just_released = false;
    }
  }
}

const imgui = {
  focus_id: 0,
  hover_id: 0,
  next_hover_id: 0,
  drag_id: 0,
};

// @Robustness: make these better hash functions
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

function is_focused(id) {
  return imgui.focus_id == id;
}

function is_hovered(id) {
  return imgui.hover_id == id;
}

function imgui_end_frame() {
  imgui.hover_id = imgui.next_hover_id;
  imgui.next_hover_id = 0;

  input_end_frame();
}

function mouse_pressed() {
  return input.mouse.state.just_pressed;
}

function mouse_down() {
  return input.mouse.state.is_down;
}

function mouse_released() {
  return input.mouse.state.just_released;
}

function keyboard_pressed(key_code) {
  return input.keyboard.keys[key_code]?.just_pressed;
}

function keyboard_down(key_code) {
  return input.keyboard.keys[key_code]?.is_down;
}

function keyboard_released(key_code) {
  return input.keyboard.keys[key_code]?.just_released;
}

function rectangle_contains(rect, point) {
  return point.x >= rect.x0 && point.x <= rect.x1 && point.y >= rect.y0 && point.y <= rect.y1;
}

function imgui_hover(id, rect) {
  const mouse = input.mouse.position;
  if (rectangle_contains(rect, mouse)) {
    imgui.next_hover_id = id;
  }

  return imgui.hover_id === id;
}

function imgui_click(id, rect) {
  if (imgui.hover_id == id && mouse_pressed()) {
    imgui.focus_id = id;
    return true;
  }

  const mouse = input.mouse.position;
  if (rectangle_contains(rect, mouse)) {
    imgui.next_hover_id = id;
  }

  return false;
}

//
// Draw
//

const command_buffer = [];
const regions = [];

function draw_clear(color) {
  command_buffer.length = 0;
  regions.length = 0;

  document.body.style.backgroundColor = v4_to_css_color(color);
}

function draw_rect(rect, color, style = null) {
  command_buffer.push({ type: 'rect', rect, color, style });
}

function draw_text(font, text, rect, color = v4_white, anchor = v2(0, 0)) {
  command_buffer.push({ type: 'text', style: font, text, rect, color, anchor });
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

const element_cache = [];

function get_element_from_cache(id, cmd, root) {
  // @Incomplete: more robust scanning for matching elements
  const it = element_cache[id];

  if (it) {
    if (it.cmd.type === cmd.type && it.el.parentElement === root) {
      it.el.style.display = 'block';
      return it.el;
    }
  }

  const el = document.createElement('div');
  root.appendChild(el);
  element_cache[id] = { el, cmd };

  return el;
}

function apply_changed_styles(el, styles) {
  Object.keys(styles).forEach((key) => {
    if (el.style[key] !== styles[key]) {
      el.style[key] = styles[key];
    }
  });
}

function apply_element_styles(el, rect, styles, active_region) {
  const pos = rect.p0;
  const size = rect.size();

  if (active_region) {
    pos.x -= active_region.cmd.x0;
    pos.y -= active_region.cmd.y0;
  }

  const css_styles = {
    position: 'absolute',
    left: pos.x,
    top: pos.y,
    width: size.x,
    height: size.y,
    ...styles,
  };

  apply_changed_styles(el, normalize_styles(css_styles));
}

function render_to_dom(root) {
  element_cache.forEach(it => it.el.style.display = 'none');

  let active_region = null;
  for (let i = 0; i < command_buffer.length; i++) {
    const cmd = command_buffer[i];

    switch (cmd.type) {
      case 'rect':
        {
          const el = get_element_from_cache(i, cmd, active_region ? active_region.el : root);
          apply_element_styles(el, cmd.rect, { ...cmd.style, background: v4_to_css_color(cmd.color) }, active_region);
        }
        break;

      case 'text':
        {
          const el = get_element_from_cache(i, cmd, active_region ? active_region.el : root);
          const styles = { ...cmd.style, color: v4_to_css_color(cmd.color) };

          if (cmd.anchor.x === 0.5) {
            styles.display = 'flex';
            styles.textAlign = 'center';
            styles.justifyContent = 'center';
          }

          if (cmd.anchor.y === 0.5) {
            styles.display = 'flex';
            styles.alignItems = 'center';
          }

          apply_element_styles(el, cmd.rect, styles, active_region);

          if (el.innerText !== cmd.text) {
            el.innerText = cmd.text;
          }
        }
        break;

      case 'begin_region':
        {
          const el = get_element_from_cache(i, cmd, active_region ? active_region.el : root);
          apply_element_styles(el, cmd.rect, cmd.style, active_region);

          active_region = { el, cmd, parent: active_region };
        }
        break;

      case 'end_region':
        {
          assert(active_region);

          if (active_region.parent) {
            active_region = active_region.parent;
          } else {
            active_region = null;
          }
        }
        break;
    }
  }

  command_buffer.length = 0;
  regions.length = 0;

  let cursor = 'default';
  if (imgui.hover_id) {
    cursor = 'pointer';
  }

  if (document.body.style.cursor !== cursor) {
    document.body.style.cursor = cursor;
  }
}

//
// Main
//

let window_width = window.innerWidth;
let window_height = window.innerHeight;
const window_size = v2(window_width, window_height);
let should_quit = false;

let root = null;

function init(el) {
  root = el;
}

function run() {
  should_quit = false;
  bind_input_listeners();
  tick();
}

function tick() {
  do_one_frame();
  if (!should_quit) window.requestAnimationFrame(tick);
}

function do_one_frame() {
  assert(root);

  window_width = window.innerWidth;
  window_height = window.innerHeight;
  window_size.x = window_width;
  window_size.y = window_height;

  draw();
  render_to_dom(root);

  imgui_end_frame();
}

//
// User Code
//

const main_font = {
  fontFamily: 'monospace',
  fontSize: 48,
};

const state = {
  backgroundColor: v4(1, 1, 1, 1),
  slideIndex: 0,
};

function draw_button(rect, text) {
  const id = imgui_unique_id(rect, 1);

  const is_click = imgui_click(id, rect);
  const is_hover = is_hovered(id);

  let color = v4(0, 0, 0, 1);
  if (is_hover) color.x = 0.3;
  if (is_click) color = v4(0, 1, 0, 1);

  const region = begin_clipping_region(rect);
  draw_rect(rect, color, { borderRadius: 8 });
  draw_text(null, text, rect, v4_white, v2(0.5, 0.5));
  end_clipping_region(region);

  return is_click;
}

const totalSlides = 3;

function draw_slide(index) {
  draw_clear(v4_black);

  const screen_bounds = r2(v2(0, 0), window_size);

  switch (index) {
    case 0:
      {
        draw_text(main_font, S('IMGUIs'), screen_bounds, v4_white, v2_center);
      }
      return;

    case 1:
      {
        draw_clear(v4_red);
        draw_text(main_font, S('are fun!'), screen_bounds, v4_white, v2_center);
      }
      return;

    case 2: {
      draw_demo();
    }
  }
}

function draw_demo() {
  draw_clear(state.backgroundColor);

  const text_rect = r2(0, 0, window_width, 32);

  const mouse = input.mouse.position;
  draw_rect(text_rect, v4(1, 1, 1, 0.4));
  draw_text(null, S(`input.mouse.position = v2(${mouse.x}, ${mouse.y})`), text_rect, v4_black, v2(0.5, 0.5));

  const screen_bounds = r2(v2(0, 0), window_size);
  const button_rect = center_in_bounds(screen_bounds, v2(256, 48));

  if (draw_button(button_rect, S('Hello, sailor!'))) {
    state.backgroundColor = v4(Math.random(), Math.random(), Math.random(), 1);
    print('CLICKED!');
  }
}

function draw() {
  if (keyboard_pressed(KEY_SPACE) || keyboard_pressed(KEY_RIGHT) || keyboard_pressed(KEY_N)) {
    state.slideIndex += 1;
    state.slideIndex %= totalSlides;
  }

  if (keyboard_pressed(KEY_LEFT) || keyboard_pressed(KEY_P)) {
    state.slideIndex -= 1;
    if (state.slideIndex < 0) state.slideIndex += totalSlides;
  }

  draw_slide(state.slideIndex);
}

const app = document.getElementById('app');
init(app);
do_one_frame();
run();

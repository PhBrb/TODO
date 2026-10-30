(() => {
  "use strict";

  // Wheel select: a scroll-snap list that acts like a picker wheel. Flick or
  // scroll with the mouse wheel to move, it snaps to the nearest option and
  // fires onChange. Keyboard arrows work when the wheel has focus.
  const ITEM_HEIGHT_PX = 32;

  function createWheelSelect(options, { selected, label, onChange } = {}) {
    const wrap = document.createElement("div");
    wrap.className = "wheel-select";
    wrap.setAttribute("role", "listbox");
    wrap.setAttribute("aria-label", label || "");
    wrap.tabIndex = 0;

    const track = document.createElement("div");
    track.className = "wheel-select-track";
    wrap.appendChild(track);

    const items = options.map(([value, text], index) => {
      const item = document.createElement("div");
      item.className = "wheel-select-item";
      item.textContent = text;
      item.dataset.value = String(value);
      item.setAttribute("role", "option");
      item.setAttribute("id", `wheel-item-${index}`);
      track.appendChild(item);
      return item;
    });

    let value = String(selected ?? options[0][0]);
    let suppressScroll = false;
    let scrollTimer = null;

    function indexOfValue(v) {
      const i = options.findIndex(([opt]) => String(opt) === v);
      return i === -1 ? 0 : i;
    }

    function emit() {
      wrap.setAttribute("aria-activedescendant", items[indexOfValue(value)].id);
      onChange?.(value);
    }

    function scrollTopForIndex(i) {
      return ITEM_HEIGHT_PX + i * ITEM_HEIGHT_PX;
    }

    function selectByIndex(i, scroll = true) {
      i = Math.max(0, Math.min(options.length - 1, i));
      value = String(options[i][0]);
      items.forEach((el, idx) => el.classList.toggle("selected", idx === i));
      if (scroll) {
        suppressScroll = true;
        track.scrollTo({ top: scrollTopForIndex(i), behavior: "smooth" });
      }
      emit();
    }

    function itemIndexAtCenter() {
      return Math.round((track.scrollTop - ITEM_HEIGHT_PX) / ITEM_HEIGHT_PX);
    }

    track.addEventListener("scroll", () => {
      if (suppressScroll) return;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        selectByIndex(itemIndexAtCenter(), true);
      }, 80);
    });

    track.addEventListener("scrollend", () => {
      if (suppressScroll) {
        suppressScroll = false;
        return;
      }
      clearTimeout(scrollTimer);
      selectByIndex(itemIndexAtCenter(), true);
    });

    wrap.addEventListener("keydown", (ev) => {
      const i = indexOfValue(value);
      if (ev.key === "ArrowUp" || ev.key === "ArrowLeft") {
        ev.preventDefault();
        selectByIndex(i - 1);
      } else if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
        ev.preventDefault();
        selectByIndex(i + 1);
      } else if (ev.key === "Home") {
        ev.preventDefault();
        selectByIndex(0);
      } else if (ev.key === "End") {
        ev.preventDefault();
        selectByIndex(options.length - 1);
      }
    });

    selectByIndex(indexOfValue(value), false);
    requestAnimationFrame(() => {
      track.scrollTop = scrollTopForIndex(indexOfValue(value));
    });

    return {
      el: wrap,
      get value() {
        return value;
      },
      set value(v) {
        selectByIndex(indexOfValue(v));
      },
      set disabled(d) {
        wrap.classList.toggle("disabled", d);
        wrap.tabIndex = d ? -1 : 0;
      },
    };
  }

  window.WheelSelect = { createWheelSelect };
})();

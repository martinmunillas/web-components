const getUnitLocalized = (locale, key, value) => {
  return new Intl.RelativeTimeFormat(locale)
    .formatToParts(value, key)[2]
    ?.value.trim();
};

class Countdown extends HTMLElement {
  static get observedAttributes() {
    return ["ends", "breakpoint1", "breakpoint2", "locale"];
  }

  constructor() {
    super();
    this.initialiseClock = this.initialiseClock.bind(this);
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (newValue !== oldValue) {
      this[attrName] = newValue;
      if (attrName !== "ends") {
        this.render();
      }
    }
  }

  render() {
    const { shadowRoot, breakpoint1, breakpoint2, template } = this;
    const templateNode = document.getElementById(template);

    shadowRoot.innerHTML = templateNode
      ? document.importNode(templateNode.content, true).outerHTML
      : this._defaultTemplate(breakpoint1, breakpoint2);

    this.initialiseClock(this.ends);
  }

  _defaultTemplate(breakpoint1, breakpoint2) {
    return `
            <style>
              time {
                display: grid;
                gap: 1rem;
              }
              @media screen and (min-width: ${breakpoint1}) {
                time {
                  grid-template-columns: repeat(2, 1fr);
                }
              }
              @media screen and (min-width: ${breakpoint2}) {
                time {
                  grid-template-columns: repeat(4, 1fr);
                }
              }
              .number, .unit {
                display: block;
              }
              .number {
                font-size: var(--countdown-number-font-size);
              }
              .unit {
                font-size: var(--countdown-unit-font-size);
              }
            </style>
            <slot name="heading"></slot>
            <time></time>`;
  }

  _createCountdownItem(key, value, locale) {
    const countdownItem = document.createElement("span");
    countdownItem.className = "item";

    const timeLeft = document.createElement("span");
    timeLeft.className = `number ${key}`;
    timeLeft.textContent = value;

    const unit = document.createElement("span");
    unit.className = "unit";
    unit.textContent = getUnitLocalized(locale, key, value);

    countdownItem.appendChild(timeLeft);
    countdownItem.appendChild(unit);

    return countdownItem;
  }

  _getTimeRemaining(endTime) {
    const total = Date.parse(endTime) - Date.parse(new Date());
    const second = Math.floor((total / 1000) % 60);
    const minute = Math.floor((total / 1000 / 60) % 60);
    const hour = Math.floor((total / (1000 * 60 * 60)) % 24);
    const day = Math.floor(total / (1000 * 60 * 60 * 24));
    return {
      total,
      day,
      hour,
      minute,
      second,
    };
  }

  initialiseClock(endDate) {
    const { shadowRoot, _createCountdownItem, _getTimeRemaining, locale } =
      this;
    const timeRemaining = _getTimeRemaining(endDate);
    const clock = shadowRoot.querySelector("time");
    clock.innerHTML = "";

    Object.entries(timeRemaining).forEach(([key, value]) => {
      if (key !== "total") {
        clock.appendChild(_createCountdownItem(key, value, locale));
      }
    });

    const updateClock = () => {
      const updatedTime = _getTimeRemaining(endDate);
      if (updatedTime.total <= 0) {
        clearInterval(this.interval);
        return;
      }
      clock.querySelectorAll(".item").forEach((item, index) => {
        const [key] = Object.keys(updatedTime).filter(
          (_, i) => i === index + 1
        );
        item.querySelector(".number").textContent = updatedTime[key];
        item.querySelector(".unit").textContent = getUnitLocalized(
          locale,
          key,
          updatedTime[key]
        );
      });
    };

    this.interval = setInterval(updateClock, 1000);
    updateClock();
  }

  get ends() {
    return this.getAttribute("ends");
  }

  set ends(value) {
    this.setAttribute("ends", value);
    this.initialiseClock(value);
  }

  get breakpoint1() {
    return this.getAttribute("breakpoint1");
  }

  set breakpoint1(value) {
    this.setAttribute("breakpoint1", value);
  }

  get breakpoint2() {
    return this.getAttribute("breakpoint2");
  }

  set breakpoint2(value) {
    this.setAttribute("breakpoint2", value);
  }

  get template() {
    return this.getAttribute("template");
  }

  set template(value) {
    this.setAttribute("template", value);
  }

  get locale() {
    return this.getAttribute("locale") || "en";
  }

  set locale(value) {
    this.setAttribute("locale", value);
  }
}

customElements.define("count-down", Countdown);

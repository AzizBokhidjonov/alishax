const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
for (const key of [
  "window",
  "document",
  "navigator",
  "Node",
  "Element",
  "HTMLElement",
  "HTMLSelectElement",
  "HTMLInputElement",
  "HTMLFormElement",
  "DocumentFragment",
  "Event",
  "CustomEvent",
  "MouseEvent",
  "FocusEvent",
  "MutationObserver",
]) {
  Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true });
}
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = require("react");
const { createRoot } = require("react-dom/client");
async function mount(Component, props = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await React.act(async () => root.render(React.createElement(Component, props)));
  return {
    container,
    async render(nextProps) {
      await React.act(async () => root.render(React.createElement(Component, nextProps)));
    },
    async close() {
      await React.act(async () => root.unmount());
      container.remove();
    },
  };
}
async function change(control, value) {
  await React.act(async () => {
    const prototype =
      control.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(control, value);
    control.dispatchEvent(
      new Event(control.tagName === "SELECT" ? "change" : "input", { bubbles: true }),
    );
  });
}
async function submit(container) {
  await React.act(async () => {
    container
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}
module.exports = { React, mount, change, submit };

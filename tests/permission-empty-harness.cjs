const { React, mount } = require("./dom.cjs");
const { loadSource } = require("./load-source.cjs");
const translations = { useTranslation: () => ({ t: (key) => key, i18n: { language: "uz" } }) };
const box = ({ children }) => React.createElement("div", null, children);
const button = ({ children, className, variant, size, ...props }) =>
  React.createElement("button", props, children);
const click = async (element) => React.act(async () => element.click());
module.exports = { React, mount, loadSource, translations, box, button, click };

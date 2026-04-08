// content/injector.js
const script = document.createElement('script');
script.src = browser.runtime.getURL('content/injected.js');
script.onload = () => script.remove();
document.documentElement.appendChild(script);
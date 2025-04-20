/**
 * Injects a script file into the specified HTML node.
 * 
 * @param {string} file - The path to the JavaScript file to inject
 * @param {string} node - The HTML tag name of the parent node where the script should be injected
 * @returns {void}
 */
export function injectScript(file: string, node: string) {
  const parent = document.getElementsByTagName(node)[0];
  const scriptElement = document.createElement('script');
  scriptElement.setAttribute('type', 'text/javascript');
  scriptElement.setAttribute('src', file);
  parent.appendChild(scriptElement);
}

/**
 * Creates and injects an iframe element into the specified node.
 * 
 * @param {string} id - The unique identifier for the iframe element
 * @param {string} src - The source URL for the iframe content
 * @param {Node} node - The parent node where the iframe should be injected
 * @returns {HTMLIFrameElement} The created iframe element
 */
export const injectIframe = (id: string, src: string, node: Node) => {
  const iframe = document.createElement('iframe');
  iframe.id = id;
  iframe.src = src;
  // @ts-ignore
  iframe.style = 'width: 0px;height: 0px';
  node.appendChild(iframe);
  return iframe;
};

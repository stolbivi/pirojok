export function injectScript(file: string, node: string) {
  const parent = document.getElementsByTagName(node)[0];
  const scriptElement = document.createElement('script');
  scriptElement.setAttribute('type', 'text/javascript');
  scriptElement.setAttribute('src', file);
  parent.appendChild(scriptElement);
}

export const injectIframe = (id: string, src: string, node: Node) => {
  const iframe = document.createElement('iframe');
  iframe.id = id;
  iframe.src = src;
  // @ts-ignore
  iframe.style = 'width: 0px;height: 0px';
  node.appendChild(iframe);
  return iframe;
};

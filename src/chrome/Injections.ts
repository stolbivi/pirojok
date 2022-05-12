export function injectScript(file: string, node: string) {
    let parent = document.getElementsByTagName(node)[0];
    let scriptElement = document.createElement('script');
    scriptElement.setAttribute('type', 'text/javascript');
    scriptElement.setAttribute('src', file);
    parent.appendChild(scriptElement);
}

export const injectIframe = (id: string, src: string, node: Node) => {
    let iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.src = src;
    // @ts-ignore
    iframe.style = "width: 0px;height: 0px"
    node.appendChild(iframe);
    return iframe;
}

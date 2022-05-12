interface WatchProps {
  subtree?: boolean;
  childList?: boolean;
  attributes?: boolean;
  attributeFilter?: string[];
  attributeOldValue?: boolean;
  characterData?: boolean;
  characterDataOldValue?: boolean;
  onAdd?: (node: Node) => void;
  onRemove?: (target: Node, node: Node) => void;
}

export class DynamicUI {
  watch<WatchProperties extends WatchProps>(target: Node, options: WatchProperties) {
    const MutationObserver = window.MutationObserver;
    const observer = new MutationObserver((ms) =>
      ms.forEach((m) => {
        // console.log("Mutation:", m);
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (options.onAdd) {
              options.onAdd(node);
            }
          });
          m.removedNodes.forEach((node) => {
            if (options.onRemove) {
              options.onRemove(m.target, node);
            }
          });
        }
      }),
    );
    observer.observe(target, options);
    return observer;
  }
}

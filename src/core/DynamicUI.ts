interface WatchProps {
    subtree?: boolean;
    childList?: boolean;
    attributes?: boolean;
    attributeFilter?: Array<string>;
    attributeOldValue?: boolean;
    characterData?: boolean;
    characterDataOldValue?: boolean;
    onAdd?: (node: Node) => void;
    onRemove?: (target: Node, node: Node) => void;
}

export class DynamicUI {

    watch<WatchProperties extends WatchProps>(
        target: Node,
        options: WatchProperties
    ) {
        let MutationObserver = window.MutationObserver;
        let observer = new MutationObserver((ms) =>
            ms.forEach((m) => {
                // console.log("Mutation:", m);
                if (m.type === "childList") {
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
            })
        );
        observer.observe(target, options);
        return observer;
    }

}

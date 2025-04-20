/**
 * Interface defining the configuration options for watching DOM mutations
 */
interface WatchProps {
  /** Whether to observe the entire subtree of nodes */
  subtree?: boolean;
  /** Whether to observe additions and removals of child nodes */
  childList?: boolean;
  /** Whether to observe changes to attributes */
  attributes?: boolean;
  /** Array of attribute names to observe (only used if attributes is true) */
  attributeFilter?: string[];
  /** Whether to record the previous value of attributes */
  attributeOldValue?: boolean;
  /** Whether to observe changes to text content */
  characterData?: boolean;
  /** Whether to record the previous value of text content */
  characterDataOldValue?: boolean;
  /** Callback function when a node is added */
  onAdd?: (node: Node) => void;
  /** Callback function when a node is removed */
  onRemove?: (target: Node, node: Node) => void;
}

/**
 * A utility class for observing and reacting to DOM mutations
 * Provides methods to watch for changes in the DOM tree and execute callbacks
 */
export class DynamicUI {
  /**
   * Sets up a mutation observer on a target node with specified options
   * @param target - The DOM node to observe
   * @param options - Configuration options for the mutation observer
   * @returns The MutationObserver instance
   */
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

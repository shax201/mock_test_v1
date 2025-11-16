import { useEffect } from 'react';

/**
 * A hook to fix hydration issues caused by third-party libraries or browser extensions
 * that add invalid attributes to form elements.
 */
export const useHydrationFix = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clean up any invalid attributes that might be added by third-party libraries
    // This is especially useful to handle issues like "ckeyboarddefined" that may 
    // be added by accessibility libraries or browser extensions
    const cleanInvalidAttributes = () => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(input => {
        // Check for attributes that might be added by third-party libraries
        // with typos or invalid names
        const attributes = Array.from(input.attributes);
        attributes.forEach(attr => {
          // Look for the specific typo "ckeyboarddefined" or similar keyboard-related typos
          if (attr.name.includes('keyboard') && !attr.name.startsWith('data-') && 
              !attr.name.startsWith('aria-') && attr.name !== 'keyboard' && 
              !attr.name.includes('data-keyboard')) {
            // Remove the attribute if it's not a standard one
            input.removeAttribute(attr.name);
          }
        });
      });
    };

    // Use MutationObserver to watch for new attributes being added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const target = mutation.target as Element;
          if (target.tagName === 'INPUT' && mutation.attributeName?.includes('keyboard')) {
            // Check if the attribute name is the problematic one
            const attributeName = mutation.attributeName;
            if (attributeName && attributeName.includes('keyboard') && 
                !attributeName.startsWith('data-') && 
                !attributeName.startsWith('aria-') && 
                attributeName !== 'keyboard') {
              target.removeAttribute(attributeName);
            }
          }
        } else if (mutation.type === 'childList') {
          // Check for new input elements added to the DOM
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // ELEMENT_NODE
              const element = node as Element;
              if (element.tagName === 'INPUT') {
                cleanInvalidAttributesOnElement(element as HTMLInputElement);
              } else {
                // Check all input children if it's a container
                const inputs = element.querySelectorAll('input');
                inputs.forEach(input => cleanInvalidAttributesOnElement(input));
              }
            }
          });
        }
      });
    });

    // Helper function to clean attributes on a specific element
    const cleanInvalidAttributesOnElement = (element: HTMLInputElement) => {
      const attributes = Array.from(element.attributes);
      attributes.forEach(attr => {
        if (attr.name.includes('keyboard') && !attr.name.startsWith('data-') && 
            !attr.name.startsWith('aria-') && attr.name !== 'keyboard') {
          element.removeAttribute(attr.name);
        }
      });
    };

    // Run initial cleanup
    cleanInvalidAttributes();

    // Start observing
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['type', 'id', 'class', 'value'] // Observe for any attribute changes
    });

    // Additional periodic cleanup as a backup
    const intervalId = setInterval(cleanInvalidAttributes, 1000);

    // Cleanup function
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, []);
};
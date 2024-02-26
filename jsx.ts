namespace JSX {
    export interface ElementAttributesProperty {
        props: {}; // Specify the type of your component props
    }
  
    export interface IntrinsicElements {
        [elemName: string]: any; // Allow any element
    }

    export interface ElementChildrenAttribute {
        children: {}; // Specify the type children
    }
}
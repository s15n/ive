const componentRegistry: { [key: string]: {
    states: State<any>[],
    component: ((values: any[], props?: any) => HTMLElement),
} } = {};


function jsxChildren(children: any[], element: { appendChild: (child: HTMLElement | Text) => void }): any | undefined {
    for (let child of children) {
        if (child === null || child === undefined) {
            continue;
        } else if (child instanceof HTMLElement) {
            element.appendChild(child);
        } else if (Array.isArray(child)) {
            jsxChildren(child, element);
        } else {
            element.appendChild(document.createTextNode(`${child}`));
        }
    }
}


function _jsx(type: string | Function, props: any, ...children: any[]) {
    if (typeof type === 'function') {
        return type({ ...props, children: children });
    } else if (typeof type === 'string') {
        const element = document.createElement(type);
        for (let name in props) {
            if (name.startsWith('on:')) {
                const eventName = name.slice(3);
                element.addEventListener(eventName, props[name]);
                continue;
            }
            element.setAttribute(name, props[name]);
        }
        jsxChildren(children, element);
        return element;
    }
}

function _jsxFragment({ children }: { children: any[] }) {
    const fragment = document.createDocumentFragment();
    jsxChildren(children, fragment);
    return fragment;
}




type State<T> = {
    uuid: string;
    value: T;
    set(newValue: T): void
}

function createState<T>(initialValue: T): State<T> {
    return {
        uuid: crypto.randomUUID(),
        value: initialValue,
        set(newValue: T) {
            if (this.value === newValue) {
                return;
            }
            this.value = newValue;

            document.querySelectorAll(`[ive-watch-${this.uuid}]`).forEach((element) => {
                handleUpdate(element as HTMLElement);
            });
        },
    };
}

function handleUpdate(element: HTMLElement) {
    if (!document.body.contains(element))
        return;

    const registryEntry = componentRegistry[element.getAttribute('ive-component')!];
    let newElement = registryEntry.component(registryEntry.states.map((state: State<any>) => state.value));
    element.getAttributeNames().forEach((name) => {
        if (name.startsWith('ive-')) {
            newElement.setAttribute(name, element.getAttribute(name)!);
        }
    });

    element.replaceWith(newElement);
}




export function watch<
    R extends HTMLElement,
    P extends { [key: string]: any } | undefined
>(
    states: State<any>[], 
    component: ((values: any[], props: P) => R)
): (props: P) => R  {
    const uuid = crypto.randomUUID();
    componentRegistry[uuid] = {
        states: states,
        component: component,
    };

    return (props: any) => {
        const element = component(states.map(state => state.value), props);
        states.forEach((state) => {
            (element as HTMLElement).setAttribute(`ive-watch-${state.uuid}`, '');
        });
        element.setAttribute('ive-component', uuid);
        return element;
    };
}


export function memo(component: any) {
    return component;
}


export function wait<
    T,
    R extends HTMLElement,
    P extends { [key: string]: any } | undefined
>(
    promise: Promise<T>,
    component: ((value: T, props: P) => R),
    loading?: ((props: P) => R),
    error?: ((error: any, props: P) => R),
) {
    const state = createState<{
        status: 'pending' | 'ready' | 'error', 
        value:  T | undefined,
        error: any | undefined,
    }>({ status: 'pending', value: undefined, error: undefined });
    promise.then((value) => {
        state.set({ status: 'ready', value: value, error: undefined });
    }).catch((error) => {
        state.set({ status: 'error', value: undefined, error: error });
    });
    return watch([state], ([value], props) => {
        if (value.status === 'pending') {
            if (loading)
                return loading(props as any);
            else return document.createElement('div');
        } else if (value.status === 'error') {
            if (error)
                return error(value.error, props as any);
            else return document.createElement('div');
        } else {
            return component(value.value, props as any);
        }
    });
}


export function router(path: string, routes: { [key: string]: (
    HTMLElement | ((props?: any) => HTMLElement) | Promise<{ default: ((props?: any) => HTMLElement) }>
) }, notFound?: ((path: string) => HTMLElement)) {

    const regexes = {} as { [key: string]: RegExp };
    Object.keys(routes).forEach((route) => {
        let regex = route.replace(/\//g, '\\/');
        for (let match of route.matchAll(/{([^}]+)}/g)) {
            regex = regex.replace(match[0], `(?<${match[0].slice(1, -1)}>[^\\/]+)`);
        }
        regexes[route] = new RegExp(`^${regex}$`);
    });
    
    let params: { [key: string]: string } = {};
    const page = createState<any>(undefined);
    const loadPage = () => {
        let pagePath = window.location.pathname;
        if (pagePath.startsWith(path)) {
            pagePath = pagePath.slice(path.length - 1);
        } else {
            return;
        }
        for (let route in routes) {
            let match = pagePath.match(regexes[route]);
            params = match?.groups ?? {};
            if (match) {
                if (routes[route] instanceof HTMLElement) {
                    page.set(() => routes[route]);
                } else if (typeof routes[route] === 'function') {
                    page.set(routes[route]);
                } else {
                    (routes[route] as Promise<{ default: ((props?: any) => HTMLElement) }>).then((module) => {
                        page.set(module.default);
                    });
                }
                return;
            }
        }
        if (notFound)
            page.set(() => notFound(pagePath));
    };
    window.addEventListener('popstate', loadPage);
    loadPage();
    return watch([page], ([component]) => {
        if (component === undefined) {
            return document.createElement('div');
        }
        return component(params);
    });
}


export function routeTo(href: string, replace: boolean = false) {
    const state = { href: href };
    if (replace) {
        history.replaceState(state, '', href);
    } else {
        history.pushState(state, '', href);
    }
    window.dispatchEvent(new PopStateEvent('popstate', { state: state }));
}




export default {
    _jsx: _jsx,
    _jsxFragment: _jsxFragment,
    createState: createState,
    watch: watch,
    memo: memo,
    wait: wait,
    router: router,
    routeTo: routeTo,
}
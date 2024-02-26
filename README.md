# IVE

An extremely lightweight front-end framework best used
alongside Vite and TypeScript.

## Installation

Create a vite project (creates a new folder with the project name)
```bash
npm init vite
```
Use the following settings:
- Select framework: `vanilla`
- Select variant: `TypeScript`

Install IVE
```bash
npm install ive-fw
```

## Usage

```typescript
import ive from 'ive-fw/ive';
```

You have to add the following to your `tsconfig.json` file:
```jsonc
{
  "compilerOptions": {
    /* ... */
    "jsx": "preserve",
    "jsxFactory": "ive._jsx",
    "jsxFragmentFactory": "ive._jsxFragment",
    /* ... */
  }
}
```

And you might need to add this line somewhere in your code (best in a separate `jsx.ts` file)
```typescript
import 'ive-fw/jsx';
```

And you're good to go!

## Example

### Hello, World!

Create a new file `App.tsx` with the following content:
```tsx
import ive from 'ive-fw/ive';

const Hello = ({ name }: { name: string }) => (
    <h1>Hello, {name}!</h1>
);

export default () => (
    <div>
        <Hello name="World" />
    </div>
);
```

Render this component in `main.ts`:
```typescript
import App from './App';

document.body.appendChild(App());
```

### Counter with State

Create a new file `Counter.tsx` with the following content:
```tsx
import ive from 'ive-fw/ive';

const counter = ive.createState(0);

export default ive.watch([counter], ([count]) => (
    <div>
        <h1>Counter</h1>
        <p>{count}</p>
        <button on:click={() => counter.set(count + 1)}>Increment</button>
    </div>
));
```
This component will be re-rendered every time the `counter` state changes.

Keep in mind that events need to be prefixed with `on:` in ive in order to work.


### Fetching Data (awaiting Promises)

Ive provides a convenience function `ive.wait` to await promises.
Though it really is just a wrapper around `ive.watch`.

Create a new file `Posts.tsx` with the following content:
```tsx
import ive from 'ive-fw/ive';

export default ive.wait(fetch('https://jsonplaceholder.typicode.com/posts').then((response) => response.json()), (posts) => (
    <div>
        <h1>Posts</h1>
        <ul>
            {posts.map((post: any) => (
                <li key={post.id}>
                    <h2>{post.title}</h2>
                    <p>{post.body}</p>
                </li>
            ))}
        </ul>
    </div>
), () => ( // optional loading component
    <div>
        <h1>Loading...</h1>
    </div>
), (error) => ( // optional error component
    <div>
        <h1>Error</h1>
        <p>{JSON.stringify(error)}</p>
    </div>
));
```

### Routing

Ive provides a convenience function `ive.router` to conditionally render components based on the current route.
Again, it really is just a wrapper around `ive.watch`.

Create a new file `Routing.tsx` with the following content:
```tsx
import ive from 'ive-fw/ive';

const Home = () => (
    <div>
        <h1>Home</h1>
        <p>Welcome to the home page!</p>
        <Link href="/about">About</Link>
    </div>
);

const About = () => (
    <div>
        <h1>About</h1>
        <p>Learn more about us!</p>
    </div>
);

const Greet = ({ name }: { name: string }) => (
    <div>
        <h1>Greet</h1>
        <p>Hello, {name}!</p>
    </div>
);

export default ive.router("/", {
    '/': <Home />, // statically rendered
    '/about': About, // lazily rendered
    '/greet/{name}': Greet, // lazily rendered with parameters
}, () => ( // optional fallback route
    <div>
        <h1>404</h1>
        <p>Page not found!</p>
    </div>
));
```

You could also use dynamic imports to lazily load components:
```tsx
export default ive.route({
    '/greet/{name}': import('./Greet')
});
```
import ive from "./ive";

export default ({ href, replace, children }: { href: string, replace?: boolean, children?: any }) => {
    return (
        <a href="#" on:click={(e: any) => {
            ive.routeTo(href, replace);
            e.preventDefault();
        }}>
            {children}
        </a>
    );
}
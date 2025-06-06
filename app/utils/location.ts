export function isHomeActive(path: string) {
    return path === "/";
}

export function isExplorerActive(path: string) {
    return path.startsWith("/v") || path.startsWith("/poap") || path.startsWith("/event");
}

export function isOGActive(path: string) {
    return path.startsWith("/og");
}

export function isCardActive(path: string) {
    return path.startsWith("/card");
}

export function isSponsorsActive(path: string) {
    return path.startsWith("/sponsors");
}

export function isContactActive(path: string) {
    return path.startsWith("/contact");
}
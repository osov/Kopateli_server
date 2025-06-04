export function deep_clone<T>(data: T) {
    return JSON.parse(JSON.stringify(data)) as T;
}


export function shuffle<T>(array: T[]) {
    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}
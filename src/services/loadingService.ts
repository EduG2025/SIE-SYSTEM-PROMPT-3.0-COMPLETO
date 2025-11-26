
type Listener = (isLoading: boolean) => void;

class LoadingService {
    private listeners: Listener[] = [];
    private count = 0;

    start() {
        this.count++;
        this.notify();
    }

    stop() {
        this.count = Math.max(0, this.count - 1);
        this.notify();
    }

    subscribe(listener: Listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        const isLoading = this.count > 0;
        this.listeners.forEach(l => l(isLoading));
    }
}

export const loadingService = new LoadingService();

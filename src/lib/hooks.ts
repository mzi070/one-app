"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── useDebounce ────────────────────────────────────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─── useLocalStorage ──────────────────────────────────────────────────────────
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ─── useFetch ──────────────────────────────────────────────────────────────────────
interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useFetch<T>(url: string | null, options?: RequestInit): UseFetchState<T> {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: !!url,
    error: null,
  });

  useEffect(() => {
    if (!url) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetch(url, { ...options, signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState({ data: null, loading: false, error: error as Error });
      });

    return () => controller.abort();
  }, [url, options?.body]);

  return state;
}

// ─── useAsync ────────────────────────────────────────────────────────────────────────────────────────────────
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: unknown[] = []
): UseFetchState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await asyncFn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, deps);

  return { ...state, execute };
}

// ─── useToggle ────────────────────────────────────────────────────────────────────────
export function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}

// ─── useInterval ─────────────────────────────────────────────────────────────────
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ─── usePrevious ────────────────────────────────────────────────────────────────────────────────────────
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

// ─── useOnClickOutside ────────────────────────────────────────────────────────
export function useOnClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// ─── useMediaQuery ────────────────────────────────────────────────────────────────
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

// ─── useWindowSize ────────────────────────────────────────────────────────────
export function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

// ─── useCopyToClipboard ────────────────────────────────────────────────────────
export function useCopyToClipboard(): [string | null, (text: string) => Promise<void>] {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
    } catch (error) {
      setCopiedText(null);
    }
  }, []);

  return [copiedText, copy];
}

// ─── useHover ────────────────────────────────────────────────────────────────────
export function useHover(): [boolean, (element: React.RefObject<HTMLElement | null>) => void] {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  const handleMouseEnter = () => setHovered(true);
  const handleMouseLeave = () => setHovered(false);

  const attachRef = (element: React.RefObject<HTMLElement | null>) => {
    if (element?.current) {
      element.current.addEventListener("mouseenter", handleMouseEnter);
      element.current.addEventListener("mouseleave", handleMouseLeave);
    }
  };

  return [hovered, attachRef];
}

// ─── useListState ───────────────────────────────────────────────────────────
export function useListState<T>(): [
  T[],
  {
    add: (item: T) => void;
    remove: (index: number) => void;
    update: (index: number, item: T) => void;
    clear: () => void;
  }
] {
  const [list, setList] = useState<T[]>([]);

  const add = useCallback((item: T) => setList((prev) => [...prev, item]), []);
  const remove = useCallback((index: number) => setList((prev) => prev.filter((_, i) => i !== index)), []);
  const update = useCallback((index: number, item: T) => {
    setList((prev) => prev.map((existing, i) => (i === index ? item : existing)));
  }, []);
  const clear = useCallback(() => setList([]), []);

  return [list, { add, remove, update, clear }];
}
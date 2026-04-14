"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── useBarcodeScanner ────────────────────────────────────────────────────────────────
export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  options: { enabled?: boolean; timeout?: number } = {}
) {
  const { enabled = true, timeout = 100 } = options;
  const buffer = useRef<string>("");
  const lastKeyTime = useRef<number>(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const now = Date.now();
      if (now - lastKeyTime.current > timeout) {
        buffer.current = "";
      }
      lastKeyTime.current = now;

      if (event.key === "Enter") {
        if (buffer.current.length > 0) {
          onScan(buffer.current);
          buffer.current = "";
        }
        return;
      }

      if (event.key.length === 1) {
        buffer.current += event.key;
      }
    },
    [enabled, timeout, onScan]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);

  return { buffer };
}

export function useBarcodeInput(initialValue = "") {
  const [value, setValue] = useState(initialValue);
  const [isScanning, setIsScanning] = useState(false);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    setIsScanning(newValue.length > 20);
  }, []);

  const clear = useCallback(() => {
    setValue("");
    setIsScanning(false);
  }, []);

  return { value, setValue: handleChange, clear, isScanning };
}

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
    } catch {
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
      } catch {
        // ignore storage errors
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
  const bodyRef = useRef(options?.body);
  bodyRef.current = options?.body;

  useEffect(() => {
    if (!url) {
      setState((prev) => prev.loading || prev.data || prev.error ? { data: null, loading: false, error: null } : prev);
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetch(url, { ...options, body: bodyRef.current, signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState({ data: null, loading: false, error: err as Error });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return state;
}

// ─── useAsync ────────────────────────────────────────────────────────────────────────────────────────────────
export function useAsync<T>(
  asyncFn: () => Promise<T>,
): UseFetchState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  const fnRef = useRef(asyncFn);
  useEffect(() => { fnRef.current = asyncFn; });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err as Error });
    }
  }, []);

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
  const ref = useRef<T | undefined>(undefined);
  const [prev, setPrev] = useState<T | undefined>(undefined);
  useEffect(() => {
    setPrev(ref.current);
    ref.current = value;
  }, [value]);
  return prev;
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
    setMatches(media.matches); // eslint-disable-line react-hooks/set-state-in-effect -- sync init from external API
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

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
    } catch {
      setCopiedText(null);
    }
  }, []);

  return [copiedText, copy];
}

// ─── useHover ────────────────────────────────────────────────────────────────────
export function useHover(): [boolean, (element: React.RefObject<HTMLElement | null>) => void] {
  const [hovered, setHovered] = useState(false);

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
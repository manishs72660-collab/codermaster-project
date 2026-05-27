export function* binary(arr, target) {
  const a = arr.slice().sort((x, y) => x - y);
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    yield { type: "visit", indices: [mid], range: [lo, hi], array: a.slice(), line: 3, message: `mid=${mid} val=${a[mid]}` };
    if (a[mid] === target) {
      yield { type: "found", indices: [mid], array: a.slice(), line: 4, message: `Found at ${mid}` };
      return;
    }
    if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
  }
  yield { type: "done", indices: [], array: a.slice(), line: 5, message: "Not found" };
}

export const binaryMeta = {
  name: "Binary Search",
  time: { best: "O(1)", avg: "O(log n)", worst: "O(log n)" },
  space: "O(1)",
  pseudocode: [
    "function binarySearch(arr, target):",
    "  lo = 0; hi = n-1",
    "  while lo <= hi:",
    "    mid = (lo+hi)/2",
    "    if arr[mid] == target: return mid",
    "    else if arr[mid] < target: lo = mid+1",
    "    else hi = mid-1",
  ],
};

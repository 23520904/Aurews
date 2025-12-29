import { debounce } from "../src/utils/debounce";

jest.useFakeTimers();

test("debounce delays execution", () => {
  const fn = jest.fn();
  const d = debounce(fn, 300);
  d();
  d();
  expect(fn).not.toHaveBeenCalled();
  jest.advanceTimersByTime(299);
  expect(fn).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(fn).toHaveBeenCalledTimes(1);
});


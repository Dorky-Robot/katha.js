import assert from "assert";
import * as katha from "./katha.js";

const {
  threadFirst,
  compose,
  identity,
  composePredicates,
  curry,
  pipe,
  mapObject,
  filterObject,
  maybe,
  either,
  foldObject,
} = katha;

describe("threadFirst", () => {
  const sum = (x, y) => x + y;
  const diff = (x, y) => x - y;
  const str = (x) => x.toString();

  it('should transform a string "3" to "-4"', () => {
    const result = threadFirst("3", parseInt, [sum, 3], [diff, 10], str);
    assert.strictEqual(result, "-4");
  });

  it("should handle only direct functions", () => {
    const result = threadFirst(
      5,
      (x) => x + 3,
      (x) => x * 2,
      (x) => 5 - x
    );
    assert.strictEqual(result, 5 - (5 + 3) * 2);
  });

  it("should throw an error for invalid function format", () => {
    assert.throws(() => {
      threadFirst(5, 123); // 123 is neither a function nor an array
    }, /Invalid function format/);
  });
});

describe("compose", () => {
  it("should compose multiple functions into a single function", () => {
    const add2 = (x) => x + 2;
    const multiplyBy3 = (x) => x * 3;

    const composed = compose(add2, multiplyBy3);
    const result = composed(4);
    assert.strictEqual(result, 4 * 3 + 2);
  });

  it("should return the initial value if no functions are provided", () => {
    const composed = compose();
    const result = composed(5);
    assert.strictEqual(result, 5);
  });
});

describe("identity", () => {
  it("should return the input value unchanged", () => {
    assert.strictEqual(identity(5), 5);
    assert.strictEqual(identity("test"), "test");
    assert.deepEqual(identity({ a: 1, b: 2 }), { a: 1, b: 2 });
  });
});

describe("composePredicates", () => {
  it("should return true if all predicates return true", () => {
    const isEven = (x) => x % 2 === 0;
    const isPositive = (x) => x > 0;

    const composed = composePredicates(isEven, isPositive);
    const result = composed(4);
    assert.strictEqual(result, true);
  });

  it("should return false if any predicate returns false", () => {
    const isEven = (x) => x % 2 === 0;
    const isPositive = (x) => x > 0;

    const composed = composePredicates(isEven, isPositive);
    const result = composed(-2);
    assert.strictEqual(result, false);
  });
});

describe("curry", () => {
  const sum = (x, y) => x + y;
  const asyncSum = async (x, y) => Promise.resolve(x + y);

  it("should correctly curry a function", () => {
    const curriedSum = curry(sum);
    assert.strictEqual(curriedSum(2)(3), 5);
  });

  it("should handle multiple arguments at once", () => {
    const curriedSum = curry(sum);
    assert.strictEqual(curriedSum(2, 3), 5);
  });

  it("should work with async functions", async () => {
    const curriedAsyncSum = curry(asyncSum);
    assert.strictEqual(await curriedAsyncSum(2)(3), 5);
    assert.strictEqual(await curriedAsyncSum(2, 3), 5);
  });

  it("should allow partial application with async functions", async () => {
    const curriedAsyncSum = curry(asyncSum);
    const add2 = curriedAsyncSum(2);
    assert.strictEqual(await add2(3), 5);
    assert.strictEqual(await add2(5), 7);
  });

  it("should handle functions with more than two arguments", () => {
    const multiply3 = (x, y, z) => x * y * z;
    const curriedMultiply3 = curry(multiply3);
    assert.strictEqual(curriedMultiply3(2)(3)(4), 24);
    assert.strictEqual(curriedMultiply3(2, 3)(4), 24);
    assert.strictEqual(curriedMultiply3(2)(3, 4), 24);
    assert.strictEqual(curriedMultiply3(2, 3, 4), 24);
  });

  it("should work with functions that return functions", () => {
    const createAdder = (x) => (y) => x + y;
    const curriedCreateAdder = curry(createAdder);
    const add5 = curriedCreateAdder(5);
    assert.strictEqual(add5(3), 8);
  });

  it("should maintain the correct context", function () {
    const obj = {
      value: 5,
      add: function (x) { return this.value + x; }
    };
    const curriedAdd = curry(obj.add.bind(obj));
    assert.strictEqual(curriedAdd(3), 8);
  });

  it("should handle edge cases", () => {
    const identity = curry(x => x);
    assert.strictEqual(identity(5), 5);

    const constant = curry(() => 42);
    assert.strictEqual(constant(), 42);
  });

  it("should work with async functions that return functions", async () => {
    const asyncCreateAdder = async (x) => (y) => x + y;
    const curriedAsyncCreateAdder = curry(asyncCreateAdder);
    const add5Promise = curriedAsyncCreateAdder(5);
    const add5 = await add5Promise;
    assert.strictEqual(add5(3), 8);
  });

  it("should handle complex nested currying scenarios", async () => {
    const complexFunction = curry(async (a, b) => {
      const sum = await asyncSum(a, b);
      return curry((c, d) => sum + c + d);
    });

    const step1 = complexFunction(1);
    const step2 = await step1(2);
    const result = await step2(3)(4);
    assert.strictEqual(result, 10); // 1 + 2 + 3 + 4
  });
});

describe("pipe", () => {
  const double = (x) => x * 2;
  const addThree = (x) => x + 3;
  const asyncDouble = async (x) => x * 2;

  it("should correctly pipe multiple synchronous functions", async () => {
    const piped = pipe(double, addThree);
    const result = await piped(2);
    assert.strictEqual(result, 7);  // (2 * 2) + 3
  });

  it("should correctly pipe synchronous and asynchronous functions", async () => {
    const piped = pipe(double, asyncDouble, addThree);
    const result = await piped(2);
    assert.strictEqual(result, 11);  // ((2 * 2) * 2) + 3
  });

  it("should handle all asynchronous functions", async () => {
    const piped = pipe(asyncDouble, asyncDouble);
    const result = await piped(2);
    assert.strictEqual(result, 8);  // (2 * 2) * 2
  });

  // Ensure that the pipe implementation can handle an initial asynchronous function
  it("should handle initial asynchronous function", async () => {
    const piped = pipe(asyncDouble, double, addThree);
    const result = await piped(2);
    assert.strictEqual(result, 11);  // ((2 * 2) * 2) + 3
  });
});

describe("mapObject", () => {
  const double = (x) => x * 2;

  it("should correctly map object values", () => {
    const obj = { a: 1, b: 2 };
    const mapped = mapObject(double)(obj);
    assert.deepStrictEqual(mapped, { a: 2, b: 4 });
  });

  it("should correctly map array values", () => {
    const arr = [1, 2, 3];
    const mapped = mapObject(double)(arr);
    assert.deepStrictEqual(mapped, [2, 4, 6]);
  });

  it("should correctly map values passed as multiple arguments", () => {
    const double = x => x * 2;
    const result = mapObject(double)(null, 1, 2, 3);  // null is intended to be ignored
    assert.deepStrictEqual(result, [2, 4, 6]);  // Check without the leading 0 that would result from null being processed
  });
});

describe("filterObject", () => {
  const isEven = (x) => x % 2 === 0;

  it("should correctly filter object keys", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const filtered = filterObject(isEven)(obj);
    assert.deepStrictEqual(filtered, { b: 2 });
  });
});

describe("maybe", () => {
  const double = (x) => x * 2;

  it("should apply the function when the input is not null or undefined", () => {
    const maybeDouble = maybe(double);
    assert.strictEqual(maybeDouble(4), 8);
  });

  it("should return the input as is when it is null or undefined", () => {
    const maybeDouble = maybe(double);
    assert.strictEqual(maybeDouble(null), null);
    assert.strictEqual(maybeDouble(undefined), undefined);
  });
});

describe("either", () => {
  const double = (x) => x * 2;

  it("should apply the right function for non-null input", () => {
    const eitherTest = either(() => "left", double);
    assert.strictEqual(eitherTest(4), 8);
  });

  it("should apply the left function for null input", () => {
    const eitherTest = either(() => "left", double);
    assert.strictEqual(eitherTest(null), "left");
  });
});

describe("foldObject", () => {
  it("should correctly fold object values", () => {
    const sumValues = (acc, value) => acc + value;
    const obj = { a: 1, b: 2, c: 3 };
    const folded = foldObject(sumValues, 0)(obj);
    assert.strictEqual(folded, 6);
  });
});

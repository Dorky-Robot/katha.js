/**
 * Composes multiple functions into a single function. This function takes a sequence of functions and returns a new function. This new function, when called with an argument, applies the composed functions in sequence from right to left, passing the result of each function to the next.
 *
 * @param {...Function} fns - The functions to compose. Each function should accept a single argument and return a value.
 * @returns {Function} A composed function that, when called with an initial value, sequentially applies the input functions from right to left.
 *
 * Example:
 *  const addOne = x => x + 1;
 *  const double = x => x * 2;
 *  const composedFunc = compose(double, addOne);
 *  composedFunc(3); // Returns 8 (3 + 1, then 4 * 2)
 */
export const compose =
  (...fns) =>
    (initialVal) =>
      fns.reduceRight((val, fn) => fn(val), initialVal);

/**
 * A utility function that returns the input value unchanged. Often used as a default or placeholder function in functional programming.
 *
 * @param {*} x - The input value.
 * @returns {*} The same input value, unchanged.
 *
 * Example:
 *  identity(5); // Returns 5
 */
export const identity = (x) => x;

/**
 * Applies a sequence of functions or function-argument pairs to an initial value. This function is similar to 'compose', but allows for functions to be called with additional arguments. The functions can be provided as standalone functions or as arrays. In the case of arrays, the first element should be the function, and the remaining elements should be its arguments.
 *
 * @param {*} x - The initial value.
 * @param {...(Function|Array)} fns - Functions to apply, or arrays where the first element is a function and the remaining elements are its arguments.
 * @returns {*} The result of sequentially applying the functions to the initial value.
 * @throws {Error} If a function is not provided in a valid format.
 *
 * Example:
 *  const add = (x, y) => x + y;
 *  const multiply = (x, y) => x * y;
 *  threadFirst(2, [add, 2], [multiply, 3]); // Returns 12 ((2 + 2) * 3)
 */
export const threadFirst = (x, ...fns) => {
  return fns.reduce((acc, fn) => {
    if (typeof fn === "function") {
      return fn(acc);
    } else if (Array.isArray(fn)) {
      const [func, ...args] = fn;
      return func(acc, ...args);
    }
    throw new Error("Invalid function format");
  }, x);
};

/**
 * Composes multiple predicate functions into a single predicate function. This function takes a sequence of predicates and returns a new function. When this new function is called with an argument, it applies all the predicates to the input and returns true only if all predicates return true.
 *
 * @param {...Function} predicates - Predicate functions to compose. Each predicate should accept a single argument and return a boolean.
 * @returns {Function} A composed predicate function.
 *
 * Example:
 *  const isEven = x => x % 2 === 0;
 *  const isPositive = x => x > 0;
 *  const composedPredicate = composePredicates(isEven, isPositive);
 *  composedPredicate(4); // Returns true
 *  composedPredicate(-2); // Returns false
 */
export const composePredicates = (...predicates) => {
  return (input) => predicates.every((pred) => pred(input));
};

/**
 * Transforms a function to support currying. In currying, a function with multiple arguments is transformed into a sequence of functions, each with a single argument. Each function returns another function that takes the next argument, until all arguments have been provided.
 *
 * @param {Function} fn - The function to curry. This function should have a fixed number of arguments.
 * @returns {Function} A curried version of the input function.
 *
 * Example:
 *  const sum = (a, b, c) => a + b + c;
 *  const curriedSum = curry(sum);
 *  curriedSum(1)(2)(3); // Returns 6
 */
export const curry = (fn) => {
  const curried = (...args) =>
    args.length >= fn.length
      ? fn(...args)
      : (...more) => curried(...args, ...more);

  return (...args) => {
    const result = curried(...args);
    return result instanceof Promise
      ? result.then(resolvedResult =>
        resolvedResult instanceof Function
          ? curry(resolvedResult)
          : resolvedResult
      )
      : result;
  };
};
/**
 * Similar to 'compose', 'pipe' takes a sequence of functions and returns a new function. However, unlike 'compose', 'pipe' applies the functions from left to right. This is useful for creating a pipeline of functions where the output of one function is the input to the next.
 *
 * @param {...Function} fns - The functions to apply in sequence. Each function should accept a single argument and return a value.
 * @returns {Function} A piped function that applies the input functions from left to right.
 *
 * Example:
 *  const addOne = x => x + 1;
 *  const double = x => x * 2;
 *  const pipedFunc = pipe(addOne, double);
 *  pipedFunc(3); // Returns 8 (4 * 2)
 */
export const pipe = (...fns) => (initialVal) => {
  return fns.reduce((acc, fn) => {
    if (acc instanceof Promise) {
      return acc.then(fn);
    }
    return fn(acc);
  }, initialVal);
};

/**
 * Maps values using a provided function across various data structures: objects, arrays, or multiple arguments.
 * When given an object, it returns a new object with each value transformed by the function.
 * When given an array, it returns a new array with each element transformed.
 * When multiple arguments are passed, it maps the function over each argument starting from the second one.
 *
 * @param {Function} fn - A function to apply to each value. The function receives the value as its argument.
 * @returns {Function} A function that:
 *   - Takes an object and returns a new object with transformed values.
 *   - Takes an array and returns a new array with transformed elements.
 *   - Takes multiple arguments and returns an array of transformed values.
 *
 * Example:
 *   // For object:
 *   const double = x => x * 2;
 *   const obj = { a: 1, b: 2 };
 *   console.log(mapObject(double)(obj)); // Returns { a: 2, b: 4 }
 *
 *   // For array:
 *   const arr = [1, 2, 3];
 *   console.log(mapObject(double)(arr)); // Returns [2, 4, 6]
 *
 *   // For multiple arguments:
 *   console.log(mapObject(double)(null, 1, 2, 3)); // Returns [2, 4, 6]
 */
export const mapObject = (fn) => {
  return function (...args) {
    const input = args[0];
    if (Array.isArray(input)) {
      return input.map(fn);
    } else if (input !== null && typeof input === 'object') {
      return Object.keys(input).reduce((acc, key) => {
        acc[key] = fn(input[key]);
        return acc;
      }, {});
    } else {
      // If the first argument is null, start mapping from the second argument
      return args.slice(input === null ? 1 : 0).map(fn);
    }
  };
};
/**
 * Filters an object's properties based on a predicate function. This function takes a predicate and returns a new function. The new function, when applied to an object, returns a new object containing only the properties for which the predicate returns true.
 *
 * @param {Function} predicate - A function that takes a value and its key, and returns a boolean.
 * @returns {Function} A function that filters an object's properties based on the predicate.
 *
 * Example:
 *  const isEven = x => x % 2 === 0;
 *  const obj = { a: 1, b: 2, c: 3 };
 *  filterObject(isEven)(obj); // Returns { b: 2 }
 */
export const filterObject = (predicate) => (obj) =>
  Object.keys(obj).reduce((acc, key) => {
    if (predicate(obj[key], key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});

/**
 * Applies a function to an input value, unless the input is null or undefined, in which case the input is returned as-is. This function is useful for applying transformations to values that may be nullable, without the need to explicitly check for null or undefined.
 *
 * @param {Function} fn - A function to apply to the input value.
 * @returns {Function} A function that applies 'fn' to the input unless the input is null or undefined.
 *
 * Example:
 *  const double = x => x * 2;
 *  maybe(double)(5); // Returns 10
 *  maybe(double)(null); // Returns null
 */
export const maybe = (fn) => (input) => input == null ? input : fn(input);

/**
 * Chooses between two functions based on whether the input is null or undefined. If the input is null or undefined, 'fnLeft' is called, otherwise 'fnRight' is called with the input.
 *
 * @param {Function} fnLeft - A function to call if the input is null or undefined.
 * @param {Function} fnRight - A function to call if the input is not null or undefined.
 * @returns {Function} A function that applies 'fnLeft' or 'fnRight' based on the input.
 *
 * Example:
 *  const handleNull = () => 'Null input';
 *  const double = x => x * 2;
 *  either(handleNull, double)(null); // Returns 'Null input'
 *  either(handleNull, double)(5); // Returns 10
 */
export const either = (fnLeft, fnRight) => (input) =>
  input == null ? fnLeft() : fnRight(input);

/**
 * Reduces (folds) an object's key-value pairs to a single value using a provided reducer function. This function iterates over each key-value pair of an object and applies the reducer function to accumulate a result, starting with an initial value.
 *
 * @param {Function} fn - A reducer function that takes three arguments: the accumulator, the current value, and the current key. It returns the updated accumulator.
 * @param {*} initialValue - The initial value to start the accumulation.
 * @returns {Function} A function that takes an object and returns the accumulated value after applying the reducer function to each key-value pair in the object.
 *
 * Example:
 *  const sumValues = (acc, value) => acc + value;
 *  const obj = { a: 1, b: 2, c: 3 };
 *  foldObject(sumValues, 0)(obj); // Returns 6, as it sums the values 1, 2, and 3
 */
export const foldObject = (fn, initialValue) => (obj) =>
  Object.keys(obj).reduce((acc, key) => fn(acc, obj[key], key), initialValue);

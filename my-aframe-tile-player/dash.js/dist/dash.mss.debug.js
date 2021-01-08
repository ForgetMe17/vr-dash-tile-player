(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){
"use strict";

var bigInt = (function (undefined) {
  "use strict";var BASE = 1e7,
      LOG_BASE = 7,
      MAX_INT = 9007199254740992,
      MAX_INT_ARR = smallToArray(MAX_INT),
      DEFAULT_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";var supportsNativeBigInt = typeof BigInt === "function";function Integer(v, radix, alphabet, caseSensitive) {
    if (typeof v === "undefined") return Integer[0];if (typeof radix !== "undefined") return +radix === 10 && !alphabet ? parseValue(v) : parseBase(v, radix, alphabet, caseSensitive);return parseValue(v);
  }function BigInteger(value, sign) {
    this.value = value;this.sign = sign;this.isSmall = false;
  }BigInteger.prototype = Object.create(Integer.prototype);function SmallInteger(value) {
    this.value = value;this.sign = value < 0;this.isSmall = true;
  }SmallInteger.prototype = Object.create(Integer.prototype);function NativeBigInt(value) {
    this.value = value;
  }NativeBigInt.prototype = Object.create(Integer.prototype);function isPrecise(n) {
    return -MAX_INT < n && n < MAX_INT;
  }function smallToArray(n) {
    if (n < 1e7) return [n];if (n < 1e14) return [n % 1e7, Math.floor(n / 1e7)];return [n % 1e7, Math.floor(n / 1e7) % 1e7, Math.floor(n / 1e14)];
  }function arrayToSmall(arr) {
    trim(arr);var length = arr.length;if (length < 4 && compareAbs(arr, MAX_INT_ARR) < 0) {
      switch (length) {case 0:
          return 0;case 1:
          return arr[0];case 2:
          return arr[0] + arr[1] * BASE;default:
          return arr[0] + (arr[1] + arr[2] * BASE) * BASE;}
    }return arr;
  }function trim(v) {
    var i = v.length;while (v[--i] === 0);v.length = i + 1;
  }function createArray(length) {
    var x = new Array(length);var i = -1;while (++i < length) {
      x[i] = 0;
    }return x;
  }function truncate(n) {
    if (n > 0) return Math.floor(n);return Math.ceil(n);
  }function add(a, b) {
    var l_a = a.length,
        l_b = b.length,
        r = new Array(l_a),
        carry = 0,
        base = BASE,
        sum,
        i;for (i = 0; i < l_b; i++) {
      sum = a[i] + b[i] + carry;carry = sum >= base ? 1 : 0;r[i] = sum - carry * base;
    }while (i < l_a) {
      sum = a[i] + carry;carry = sum === base ? 1 : 0;r[i++] = sum - carry * base;
    }if (carry > 0) r.push(carry);return r;
  }function addAny(a, b) {
    if (a.length >= b.length) return add(a, b);return add(b, a);
  }function addSmall(a, carry) {
    var l = a.length,
        r = new Array(l),
        base = BASE,
        sum,
        i;for (i = 0; i < l; i++) {
      sum = a[i] - base + carry;carry = Math.floor(sum / base);r[i] = sum - carry * base;carry += 1;
    }while (carry > 0) {
      r[i++] = carry % base;carry = Math.floor(carry / base);
    }return r;
  }BigInteger.prototype.add = function (v) {
    var n = parseValue(v);if (this.sign !== n.sign) {
      return this.subtract(n.negate());
    }var a = this.value,
        b = n.value;if (n.isSmall) {
      return new BigInteger(addSmall(a, Math.abs(b)), this.sign);
    }return new BigInteger(addAny(a, b), this.sign);
  };BigInteger.prototype.plus = BigInteger.prototype.add;SmallInteger.prototype.add = function (v) {
    var n = parseValue(v);var a = this.value;if (a < 0 !== n.sign) {
      return this.subtract(n.negate());
    }var b = n.value;if (n.isSmall) {
      if (isPrecise(a + b)) return new SmallInteger(a + b);b = smallToArray(Math.abs(b));
    }return new BigInteger(addSmall(b, Math.abs(a)), a < 0);
  };SmallInteger.prototype.plus = SmallInteger.prototype.add;NativeBigInt.prototype.add = function (v) {
    return new NativeBigInt(this.value + parseValue(v).value);
  };NativeBigInt.prototype.plus = NativeBigInt.prototype.add;function subtract(a, b) {
    var a_l = a.length,
        b_l = b.length,
        r = new Array(a_l),
        borrow = 0,
        base = BASE,
        i,
        difference;for (i = 0; i < b_l; i++) {
      difference = a[i] - borrow - b[i];if (difference < 0) {
        difference += base;borrow = 1;
      } else borrow = 0;r[i] = difference;
    }for (i = b_l; i < a_l; i++) {
      difference = a[i] - borrow;if (difference < 0) difference += base;else {
        r[i++] = difference;break;
      }r[i] = difference;
    }for (; i < a_l; i++) {
      r[i] = a[i];
    }trim(r);return r;
  }function subtractAny(a, b, sign) {
    var value;if (compareAbs(a, b) >= 0) {
      value = subtract(a, b);
    } else {
      value = subtract(b, a);sign = !sign;
    }value = arrayToSmall(value);if (typeof value === "number") {
      if (sign) value = -value;return new SmallInteger(value);
    }return new BigInteger(value, sign);
  }function subtractSmall(a, b, sign) {
    var l = a.length,
        r = new Array(l),
        carry = -b,
        base = BASE,
        i,
        difference;for (i = 0; i < l; i++) {
      difference = a[i] + carry;carry = Math.floor(difference / base);difference %= base;r[i] = difference < 0 ? difference + base : difference;
    }r = arrayToSmall(r);if (typeof r === "number") {
      if (sign) r = -r;return new SmallInteger(r);
    }return new BigInteger(r, sign);
  }BigInteger.prototype.subtract = function (v) {
    var n = parseValue(v);if (this.sign !== n.sign) {
      return this.add(n.negate());
    }var a = this.value,
        b = n.value;if (n.isSmall) return subtractSmall(a, Math.abs(b), this.sign);return subtractAny(a, b, this.sign);
  };BigInteger.prototype.minus = BigInteger.prototype.subtract;SmallInteger.prototype.subtract = function (v) {
    var n = parseValue(v);var a = this.value;if (a < 0 !== n.sign) {
      return this.add(n.negate());
    }var b = n.value;if (n.isSmall) {
      return new SmallInteger(a - b);
    }return subtractSmall(b, Math.abs(a), a >= 0);
  };SmallInteger.prototype.minus = SmallInteger.prototype.subtract;NativeBigInt.prototype.subtract = function (v) {
    return new NativeBigInt(this.value - parseValue(v).value);
  };NativeBigInt.prototype.minus = NativeBigInt.prototype.subtract;BigInteger.prototype.negate = function () {
    return new BigInteger(this.value, !this.sign);
  };SmallInteger.prototype.negate = function () {
    var sign = this.sign;var small = new SmallInteger(-this.value);small.sign = !sign;return small;
  };NativeBigInt.prototype.negate = function () {
    return new NativeBigInt(-this.value);
  };BigInteger.prototype.abs = function () {
    return new BigInteger(this.value, false);
  };SmallInteger.prototype.abs = function () {
    return new SmallInteger(Math.abs(this.value));
  };NativeBigInt.prototype.abs = function () {
    return new NativeBigInt(this.value >= 0 ? this.value : -this.value);
  };function multiplyLong(a, b) {
    var a_l = a.length,
        b_l = b.length,
        l = a_l + b_l,
        r = createArray(l),
        base = BASE,
        product,
        carry,
        i,
        a_i,
        b_j;for (i = 0; i < a_l; ++i) {
      a_i = a[i];for (var j = 0; j < b_l; ++j) {
        b_j = b[j];product = a_i * b_j + r[i + j];carry = Math.floor(product / base);r[i + j] = product - carry * base;r[i + j + 1] += carry;
      }
    }trim(r);return r;
  }function multiplySmall(a, b) {
    var l = a.length,
        r = new Array(l),
        base = BASE,
        carry = 0,
        product,
        i;for (i = 0; i < l; i++) {
      product = a[i] * b + carry;carry = Math.floor(product / base);r[i] = product - carry * base;
    }while (carry > 0) {
      r[i++] = carry % base;carry = Math.floor(carry / base);
    }return r;
  }function shiftLeft(x, n) {
    var r = [];while (n-- > 0) r.push(0);return r.concat(x);
  }function multiplyKaratsuba(x, y) {
    var n = Math.max(x.length, y.length);if (n <= 30) return multiplyLong(x, y);n = Math.ceil(n / 2);var b = x.slice(n),
        a = x.slice(0, n),
        d = y.slice(n),
        c = y.slice(0, n);var ac = multiplyKaratsuba(a, c),
        bd = multiplyKaratsuba(b, d),
        abcd = multiplyKaratsuba(addAny(a, b), addAny(c, d));var product = addAny(addAny(ac, shiftLeft(subtract(subtract(abcd, ac), bd), n)), shiftLeft(bd, 2 * n));trim(product);return product;
  }function useKaratsuba(l1, l2) {
    return -.012 * l1 - .012 * l2 + 15e-6 * l1 * l2 > 0;
  }BigInteger.prototype.multiply = function (v) {
    var n = parseValue(v),
        a = this.value,
        b = n.value,
        sign = this.sign !== n.sign,
        abs;if (n.isSmall) {
      if (b === 0) return Integer[0];if (b === 1) return this;if (b === -1) return this.negate();abs = Math.abs(b);if (abs < BASE) {
        return new BigInteger(multiplySmall(a, abs), sign);
      }b = smallToArray(abs);
    }if (useKaratsuba(a.length, b.length)) return new BigInteger(multiplyKaratsuba(a, b), sign);return new BigInteger(multiplyLong(a, b), sign);
  };BigInteger.prototype.times = BigInteger.prototype.multiply;function multiplySmallAndArray(a, b, sign) {
    if (a < BASE) {
      return new BigInteger(multiplySmall(b, a), sign);
    }return new BigInteger(multiplyLong(b, smallToArray(a)), sign);
  }SmallInteger.prototype._multiplyBySmall = function (a) {
    if (isPrecise(a.value * this.value)) {
      return new SmallInteger(a.value * this.value);
    }return multiplySmallAndArray(Math.abs(a.value), smallToArray(Math.abs(this.value)), this.sign !== a.sign);
  };BigInteger.prototype._multiplyBySmall = function (a) {
    if (a.value === 0) return Integer[0];if (a.value === 1) return this;if (a.value === -1) return this.negate();return multiplySmallAndArray(Math.abs(a.value), this.value, this.sign !== a.sign);
  };SmallInteger.prototype.multiply = function (v) {
    return parseValue(v)._multiplyBySmall(this);
  };SmallInteger.prototype.times = SmallInteger.prototype.multiply;NativeBigInt.prototype.multiply = function (v) {
    return new NativeBigInt(this.value * parseValue(v).value);
  };NativeBigInt.prototype.times = NativeBigInt.prototype.multiply;function square(a) {
    var l = a.length,
        r = createArray(l + l),
        base = BASE,
        product,
        carry,
        i,
        a_i,
        a_j;for (i = 0; i < l; i++) {
      a_i = a[i];carry = 0 - a_i * a_i;for (var j = i; j < l; j++) {
        a_j = a[j];product = 2 * (a_i * a_j) + r[i + j] + carry;carry = Math.floor(product / base);r[i + j] = product - carry * base;
      }r[i + l] = carry;
    }trim(r);return r;
  }BigInteger.prototype.square = function () {
    return new BigInteger(square(this.value), false);
  };SmallInteger.prototype.square = function () {
    var value = this.value * this.value;if (isPrecise(value)) return new SmallInteger(value);return new BigInteger(square(smallToArray(Math.abs(this.value))), false);
  };NativeBigInt.prototype.square = function (v) {
    return new NativeBigInt(this.value * this.value);
  };function divMod1(a, b) {
    var a_l = a.length,
        b_l = b.length,
        base = BASE,
        result = createArray(b.length),
        divisorMostSignificantDigit = b[b_l - 1],
        lambda = Math.ceil(base / (2 * divisorMostSignificantDigit)),
        remainder = multiplySmall(a, lambda),
        divisor = multiplySmall(b, lambda),
        quotientDigit,
        shift,
        carry,
        borrow,
        i,
        l,
        q;if (remainder.length <= a_l) remainder.push(0);divisor.push(0);divisorMostSignificantDigit = divisor[b_l - 1];for (shift = a_l - b_l; shift >= 0; shift--) {
      quotientDigit = base - 1;if (remainder[shift + b_l] !== divisorMostSignificantDigit) {
        quotientDigit = Math.floor((remainder[shift + b_l] * base + remainder[shift + b_l - 1]) / divisorMostSignificantDigit);
      }carry = 0;borrow = 0;l = divisor.length;for (i = 0; i < l; i++) {
        carry += quotientDigit * divisor[i];q = Math.floor(carry / base);borrow += remainder[shift + i] - (carry - q * base);carry = q;if (borrow < 0) {
          remainder[shift + i] = borrow + base;borrow = -1;
        } else {
          remainder[shift + i] = borrow;borrow = 0;
        }
      }while (borrow !== 0) {
        quotientDigit -= 1;carry = 0;for (i = 0; i < l; i++) {
          carry += remainder[shift + i] - base + divisor[i];if (carry < 0) {
            remainder[shift + i] = carry + base;carry = 0;
          } else {
            remainder[shift + i] = carry;carry = 1;
          }
        }borrow += carry;
      }result[shift] = quotientDigit;
    }remainder = divModSmall(remainder, lambda)[0];return [arrayToSmall(result), arrayToSmall(remainder)];
  }function divMod2(a, b) {
    var a_l = a.length,
        b_l = b.length,
        result = [],
        part = [],
        base = BASE,
        guess,
        xlen,
        highx,
        highy,
        check;while (a_l) {
      part.unshift(a[--a_l]);trim(part);if (compareAbs(part, b) < 0) {
        result.push(0);continue;
      }xlen = part.length;highx = part[xlen - 1] * base + part[xlen - 2];highy = b[b_l - 1] * base + b[b_l - 2];if (xlen > b_l) {
        highx = (highx + 1) * base;
      }guess = Math.ceil(highx / highy);do {
        check = multiplySmall(b, guess);if (compareAbs(check, part) <= 0) break;guess--;
      } while (guess);result.push(guess);part = subtract(part, check);
    }result.reverse();return [arrayToSmall(result), arrayToSmall(part)];
  }function divModSmall(value, lambda) {
    var length = value.length,
        quotient = createArray(length),
        base = BASE,
        i,
        q,
        remainder,
        divisor;remainder = 0;for (i = length - 1; i >= 0; --i) {
      divisor = remainder * base + value[i];q = truncate(divisor / lambda);remainder = divisor - q * lambda;quotient[i] = q | 0;
    }return [quotient, remainder | 0];
  }function divModAny(self, v) {
    var value,
        n = parseValue(v);if (supportsNativeBigInt) {
      return [new NativeBigInt(self.value / n.value), new NativeBigInt(self.value % n.value)];
    }var a = self.value,
        b = n.value;var quotient;if (b === 0) throw new Error("Cannot divide by zero");if (self.isSmall) {
      if (n.isSmall) {
        return [new SmallInteger(truncate(a / b)), new SmallInteger(a % b)];
      }return [Integer[0], self];
    }if (n.isSmall) {
      if (b === 1) return [self, Integer[0]];if (b == -1) return [self.negate(), Integer[0]];var abs = Math.abs(b);if (abs < BASE) {
        value = divModSmall(a, abs);quotient = arrayToSmall(value[0]);var remainder = value[1];if (self.sign) remainder = -remainder;if (typeof quotient === "number") {
          if (self.sign !== n.sign) quotient = -quotient;return [new SmallInteger(quotient), new SmallInteger(remainder)];
        }return [new BigInteger(quotient, self.sign !== n.sign), new SmallInteger(remainder)];
      }b = smallToArray(abs);
    }var comparison = compareAbs(a, b);if (comparison === -1) return [Integer[0], self];if (comparison === 0) return [Integer[self.sign === n.sign ? 1 : -1], Integer[0]];if (a.length + b.length <= 200) value = divMod1(a, b);else value = divMod2(a, b);quotient = value[0];var qSign = self.sign !== n.sign,
        mod = value[1],
        mSign = self.sign;if (typeof quotient === "number") {
      if (qSign) quotient = -quotient;quotient = new SmallInteger(quotient);
    } else quotient = new BigInteger(quotient, qSign);if (typeof mod === "number") {
      if (mSign) mod = -mod;mod = new SmallInteger(mod);
    } else mod = new BigInteger(mod, mSign);return [quotient, mod];
  }BigInteger.prototype.divmod = function (v) {
    var result = divModAny(this, v);return { quotient: result[0], remainder: result[1] };
  };NativeBigInt.prototype.divmod = SmallInteger.prototype.divmod = BigInteger.prototype.divmod;BigInteger.prototype.divide = function (v) {
    return divModAny(this, v)[0];
  };NativeBigInt.prototype.over = NativeBigInt.prototype.divide = function (v) {
    return new NativeBigInt(this.value / parseValue(v).value);
  };SmallInteger.prototype.over = SmallInteger.prototype.divide = BigInteger.prototype.over = BigInteger.prototype.divide;BigInteger.prototype.mod = function (v) {
    return divModAny(this, v)[1];
  };NativeBigInt.prototype.mod = NativeBigInt.prototype.remainder = function (v) {
    return new NativeBigInt(this.value % parseValue(v).value);
  };SmallInteger.prototype.remainder = SmallInteger.prototype.mod = BigInteger.prototype.remainder = BigInteger.prototype.mod;BigInteger.prototype.pow = function (v) {
    var n = parseValue(v),
        a = this.value,
        b = n.value,
        value,
        x,
        y;if (b === 0) return Integer[1];if (a === 0) return Integer[0];if (a === 1) return Integer[1];if (a === -1) return n.isEven() ? Integer[1] : Integer[-1];if (n.sign) {
      return Integer[0];
    }if (!n.isSmall) throw new Error("The exponent " + n.toString() + " is too large.");if (this.isSmall) {
      if (isPrecise(value = Math.pow(a, b))) return new SmallInteger(truncate(value));
    }x = this;y = Integer[1];while (true) {
      if (b & 1 === 1) {
        y = y.times(x);--b;
      }if (b === 0) break;b /= 2;x = x.square();
    }return y;
  };SmallInteger.prototype.pow = BigInteger.prototype.pow;NativeBigInt.prototype.pow = function (v) {
    var n = parseValue(v);var a = this.value,
        b = n.value;var _0 = BigInt(0),
        _1 = BigInt(1),
        _2 = BigInt(2);if (b === _0) return Integer[1];if (a === _0) return Integer[0];if (a === _1) return Integer[1];if (a === BigInt(-1)) return n.isEven() ? Integer[1] : Integer[-1];if (n.isNegative()) return new NativeBigInt(_0);var x = this;var y = Integer[1];while (true) {
      if ((b & _1) === _1) {
        y = y.times(x);--b;
      }if (b === _0) break;b /= _2;x = x.square();
    }return y;
  };BigInteger.prototype.modPow = function (exp, mod) {
    exp = parseValue(exp);mod = parseValue(mod);if (mod.isZero()) throw new Error("Cannot take modPow with modulus 0");var r = Integer[1],
        base = this.mod(mod);while (exp.isPositive()) {
      if (base.isZero()) return Integer[0];if (exp.isOdd()) r = r.multiply(base).mod(mod);exp = exp.divide(2);base = base.square().mod(mod);
    }return r;
  };NativeBigInt.prototype.modPow = SmallInteger.prototype.modPow = BigInteger.prototype.modPow;function compareAbs(a, b) {
    if (a.length !== b.length) {
      return a.length > b.length ? 1 : -1;
    }for (var i = a.length - 1; i >= 0; i--) {
      if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
    }return 0;
  }BigInteger.prototype.compareAbs = function (v) {
    var n = parseValue(v),
        a = this.value,
        b = n.value;if (n.isSmall) return 1;return compareAbs(a, b);
  };SmallInteger.prototype.compareAbs = function (v) {
    var n = parseValue(v),
        a = Math.abs(this.value),
        b = n.value;if (n.isSmall) {
      b = Math.abs(b);return a === b ? 0 : a > b ? 1 : -1;
    }return -1;
  };NativeBigInt.prototype.compareAbs = function (v) {
    var a = this.value;var b = parseValue(v).value;a = a >= 0 ? a : -a;b = b >= 0 ? b : -b;return a === b ? 0 : a > b ? 1 : -1;
  };BigInteger.prototype.compare = function (v) {
    if (v === Infinity) {
      return -1;
    }if (v === -Infinity) {
      return 1;
    }var n = parseValue(v),
        a = this.value,
        b = n.value;if (this.sign !== n.sign) {
      return n.sign ? 1 : -1;
    }if (n.isSmall) {
      return this.sign ? -1 : 1;
    }return compareAbs(a, b) * (this.sign ? -1 : 1);
  };BigInteger.prototype.compareTo = BigInteger.prototype.compare;SmallInteger.prototype.compare = function (v) {
    if (v === Infinity) {
      return -1;
    }if (v === -Infinity) {
      return 1;
    }var n = parseValue(v),
        a = this.value,
        b = n.value;if (n.isSmall) {
      return a == b ? 0 : a > b ? 1 : -1;
    }if (a < 0 !== n.sign) {
      return a < 0 ? -1 : 1;
    }return a < 0 ? 1 : -1;
  };SmallInteger.prototype.compareTo = SmallInteger.prototype.compare;NativeBigInt.prototype.compare = function (v) {
    if (v === Infinity) {
      return -1;
    }if (v === -Infinity) {
      return 1;
    }var a = this.value;var b = parseValue(v).value;return a === b ? 0 : a > b ? 1 : -1;
  };NativeBigInt.prototype.compareTo = NativeBigInt.prototype.compare;BigInteger.prototype.equals = function (v) {
    return this.compare(v) === 0;
  };NativeBigInt.prototype.eq = NativeBigInt.prototype.equals = SmallInteger.prototype.eq = SmallInteger.prototype.equals = BigInteger.prototype.eq = BigInteger.prototype.equals;BigInteger.prototype.notEquals = function (v) {
    return this.compare(v) !== 0;
  };NativeBigInt.prototype.neq = NativeBigInt.prototype.notEquals = SmallInteger.prototype.neq = SmallInteger.prototype.notEquals = BigInteger.prototype.neq = BigInteger.prototype.notEquals;BigInteger.prototype.greater = function (v) {
    return this.compare(v) > 0;
  };NativeBigInt.prototype.gt = NativeBigInt.prototype.greater = SmallInteger.prototype.gt = SmallInteger.prototype.greater = BigInteger.prototype.gt = BigInteger.prototype.greater;BigInteger.prototype.lesser = function (v) {
    return this.compare(v) < 0;
  };NativeBigInt.prototype.lt = NativeBigInt.prototype.lesser = SmallInteger.prototype.lt = SmallInteger.prototype.lesser = BigInteger.prototype.lt = BigInteger.prototype.lesser;BigInteger.prototype.greaterOrEquals = function (v) {
    return this.compare(v) >= 0;
  };NativeBigInt.prototype.geq = NativeBigInt.prototype.greaterOrEquals = SmallInteger.prototype.geq = SmallInteger.prototype.greaterOrEquals = BigInteger.prototype.geq = BigInteger.prototype.greaterOrEquals;BigInteger.prototype.lesserOrEquals = function (v) {
    return this.compare(v) <= 0;
  };NativeBigInt.prototype.leq = NativeBigInt.prototype.lesserOrEquals = SmallInteger.prototype.leq = SmallInteger.prototype.lesserOrEquals = BigInteger.prototype.leq = BigInteger.prototype.lesserOrEquals;BigInteger.prototype.isEven = function () {
    return (this.value[0] & 1) === 0;
  };SmallInteger.prototype.isEven = function () {
    return (this.value & 1) === 0;
  };NativeBigInt.prototype.isEven = function () {
    return (this.value & BigInt(1)) === BigInt(0);
  };BigInteger.prototype.isOdd = function () {
    return (this.value[0] & 1) === 1;
  };SmallInteger.prototype.isOdd = function () {
    return (this.value & 1) === 1;
  };NativeBigInt.prototype.isOdd = function () {
    return (this.value & BigInt(1)) === BigInt(1);
  };BigInteger.prototype.isPositive = function () {
    return !this.sign;
  };SmallInteger.prototype.isPositive = function () {
    return this.value > 0;
  };NativeBigInt.prototype.isPositive = SmallInteger.prototype.isPositive;BigInteger.prototype.isNegative = function () {
    return this.sign;
  };SmallInteger.prototype.isNegative = function () {
    return this.value < 0;
  };NativeBigInt.prototype.isNegative = SmallInteger.prototype.isNegative;BigInteger.prototype.isUnit = function () {
    return false;
  };SmallInteger.prototype.isUnit = function () {
    return Math.abs(this.value) === 1;
  };NativeBigInt.prototype.isUnit = function () {
    return this.abs().value === BigInt(1);
  };BigInteger.prototype.isZero = function () {
    return false;
  };SmallInteger.prototype.isZero = function () {
    return this.value === 0;
  };NativeBigInt.prototype.isZero = function () {
    return this.value === BigInt(0);
  };BigInteger.prototype.isDivisibleBy = function (v) {
    var n = parseValue(v);if (n.isZero()) return false;if (n.isUnit()) return true;if (n.compareAbs(2) === 0) return this.isEven();return this.mod(n).isZero();
  };NativeBigInt.prototype.isDivisibleBy = SmallInteger.prototype.isDivisibleBy = BigInteger.prototype.isDivisibleBy;function isBasicPrime(v) {
    var n = v.abs();if (n.isUnit()) return false;if (n.equals(2) || n.equals(3) || n.equals(5)) return true;if (n.isEven() || n.isDivisibleBy(3) || n.isDivisibleBy(5)) return false;if (n.lesser(49)) return true;
  }function millerRabinTest(n, a) {
    var nPrev = n.prev(),
        b = nPrev,
        r = 0,
        d,
        t,
        i,
        x;while (b.isEven()) b = b.divide(2), r++;next: for (i = 0; i < a.length; i++) {
      if (n.lesser(a[i])) continue;x = bigInt(a[i]).modPow(b, n);if (x.isUnit() || x.equals(nPrev)) continue;for (d = r - 1; d != 0; d--) {
        x = x.square().mod(n);if (x.isUnit()) return false;if (x.equals(nPrev)) continue next;
      }return false;
    }return true;
  }BigInteger.prototype.isPrime = function (strict) {
    var isPrime = isBasicPrime(this);if (isPrime !== undefined) return isPrime;var n = this.abs();var bits = n.bitLength();if (bits <= 64) return millerRabinTest(n, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]);var logN = Math.log(2) * bits.toJSNumber();var t = Math.ceil(strict === true ? 2 * Math.pow(logN, 2) : logN);for (var a = [], i = 0; i < t; i++) {
      a.push(bigInt(i + 2));
    }return millerRabinTest(n, a);
  };NativeBigInt.prototype.isPrime = SmallInteger.prototype.isPrime = BigInteger.prototype.isPrime;BigInteger.prototype.isProbablePrime = function (iterations) {
    var isPrime = isBasicPrime(this);if (isPrime !== undefined) return isPrime;var n = this.abs();var t = iterations === undefined ? 5 : iterations;for (var a = [], i = 0; i < t; i++) {
      a.push(bigInt.randBetween(2, n.minus(2)));
    }return millerRabinTest(n, a);
  };NativeBigInt.prototype.isProbablePrime = SmallInteger.prototype.isProbablePrime = BigInteger.prototype.isProbablePrime;BigInteger.prototype.modInv = function (n) {
    var t = bigInt.zero,
        newT = bigInt.one,
        r = parseValue(n),
        newR = this.abs(),
        q,
        lastT,
        lastR;while (!newR.isZero()) {
      q = r.divide(newR);lastT = t;lastR = r;t = newT;r = newR;newT = lastT.subtract(q.multiply(newT));newR = lastR.subtract(q.multiply(newR));
    }if (!r.isUnit()) throw new Error(this.toString() + " and " + n.toString() + " are not co-prime");if (t.compare(0) === -1) {
      t = t.add(n);
    }if (this.isNegative()) {
      return t.negate();
    }return t;
  };NativeBigInt.prototype.modInv = SmallInteger.prototype.modInv = BigInteger.prototype.modInv;BigInteger.prototype.next = function () {
    var value = this.value;if (this.sign) {
      return subtractSmall(value, 1, this.sign);
    }return new BigInteger(addSmall(value, 1), this.sign);
  };SmallInteger.prototype.next = function () {
    var value = this.value;if (value + 1 < MAX_INT) return new SmallInteger(value + 1);return new BigInteger(MAX_INT_ARR, false);
  };NativeBigInt.prototype.next = function () {
    return new NativeBigInt(this.value + BigInt(1));
  };BigInteger.prototype.prev = function () {
    var value = this.value;if (this.sign) {
      return new BigInteger(addSmall(value, 1), true);
    }return subtractSmall(value, 1, this.sign);
  };SmallInteger.prototype.prev = function () {
    var value = this.value;if (value - 1 > -MAX_INT) return new SmallInteger(value - 1);return new BigInteger(MAX_INT_ARR, true);
  };NativeBigInt.prototype.prev = function () {
    return new NativeBigInt(this.value - BigInt(1));
  };var powersOfTwo = [1];while (2 * powersOfTwo[powersOfTwo.length - 1] <= BASE) powersOfTwo.push(2 * powersOfTwo[powersOfTwo.length - 1]);var powers2Length = powersOfTwo.length,
      highestPower2 = powersOfTwo[powers2Length - 1];function shift_isSmall(n) {
    return Math.abs(n) <= BASE;
  }BigInteger.prototype.shiftLeft = function (v) {
    var n = parseValue(v).toJSNumber();if (!shift_isSmall(n)) {
      throw new Error(String(n) + " is too large for shifting.");
    }if (n < 0) return this.shiftRight(-n);var result = this;if (result.isZero()) return result;while (n >= powers2Length) {
      result = result.multiply(highestPower2);n -= powers2Length - 1;
    }return result.multiply(powersOfTwo[n]);
  };NativeBigInt.prototype.shiftLeft = SmallInteger.prototype.shiftLeft = BigInteger.prototype.shiftLeft;BigInteger.prototype.shiftRight = function (v) {
    var remQuo;var n = parseValue(v).toJSNumber();if (!shift_isSmall(n)) {
      throw new Error(String(n) + " is too large for shifting.");
    }if (n < 0) return this.shiftLeft(-n);var result = this;while (n >= powers2Length) {
      if (result.isZero() || result.isNegative() && result.isUnit()) return result;remQuo = divModAny(result, highestPower2);result = remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];n -= powers2Length - 1;
    }remQuo = divModAny(result, powersOfTwo[n]);return remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
  };NativeBigInt.prototype.shiftRight = SmallInteger.prototype.shiftRight = BigInteger.prototype.shiftRight;function bitwise(x, y, fn) {
    y = parseValue(y);var xSign = x.isNegative(),
        ySign = y.isNegative();var xRem = xSign ? x.not() : x,
        yRem = ySign ? y.not() : y;var xDigit = 0,
        yDigit = 0;var xDivMod = null,
        yDivMod = null;var result = [];while (!xRem.isZero() || !yRem.isZero()) {
      xDivMod = divModAny(xRem, highestPower2);xDigit = xDivMod[1].toJSNumber();if (xSign) {
        xDigit = highestPower2 - 1 - xDigit;
      }yDivMod = divModAny(yRem, highestPower2);yDigit = yDivMod[1].toJSNumber();if (ySign) {
        yDigit = highestPower2 - 1 - yDigit;
      }xRem = xDivMod[0];yRem = yDivMod[0];result.push(fn(xDigit, yDigit));
    }var sum = fn(xSign ? 1 : 0, ySign ? 1 : 0) !== 0 ? bigInt(-1) : bigInt(0);for (var i = result.length - 1; i >= 0; i -= 1) {
      sum = sum.multiply(highestPower2).add(bigInt(result[i]));
    }return sum;
  }BigInteger.prototype.not = function () {
    return this.negate().prev();
  };NativeBigInt.prototype.not = SmallInteger.prototype.not = BigInteger.prototype.not;BigInteger.prototype.and = function (n) {
    return bitwise(this, n, function (a, b) {
      return a & b;
    });
  };NativeBigInt.prototype.and = SmallInteger.prototype.and = BigInteger.prototype.and;BigInteger.prototype.or = function (n) {
    return bitwise(this, n, function (a, b) {
      return a | b;
    });
  };NativeBigInt.prototype.or = SmallInteger.prototype.or = BigInteger.prototype.or;BigInteger.prototype.xor = function (n) {
    return bitwise(this, n, function (a, b) {
      return a ^ b;
    });
  };NativeBigInt.prototype.xor = SmallInteger.prototype.xor = BigInteger.prototype.xor;var LOBMASK_I = 1 << 30,
      LOBMASK_BI = (BASE & -BASE) * (BASE & -BASE) | LOBMASK_I;function roughLOB(n) {
    var v = n.value,
        x = typeof v === "number" ? v | LOBMASK_I : typeof v === "bigint" ? v | BigInt(LOBMASK_I) : v[0] + v[1] * BASE | LOBMASK_BI;return x & -x;
  }function integerLogarithm(value, base) {
    if (base.compareTo(value) <= 0) {
      var tmp = integerLogarithm(value, base.square(base));var p = tmp.p;var e = tmp.e;var t = p.multiply(base);return t.compareTo(value) <= 0 ? { p: t, e: e * 2 + 1 } : { p: p, e: e * 2 };
    }return { p: bigInt(1), e: 0 };
  }BigInteger.prototype.bitLength = function () {
    var n = this;if (n.compareTo(bigInt(0)) < 0) {
      n = n.negate().subtract(bigInt(1));
    }if (n.compareTo(bigInt(0)) === 0) {
      return bigInt(0);
    }return bigInt(integerLogarithm(n, bigInt(2)).e).add(bigInt(1));
  };NativeBigInt.prototype.bitLength = SmallInteger.prototype.bitLength = BigInteger.prototype.bitLength;function max(a, b) {
    a = parseValue(a);b = parseValue(b);return a.greater(b) ? a : b;
  }function min(a, b) {
    a = parseValue(a);b = parseValue(b);return a.lesser(b) ? a : b;
  }function gcd(a, b) {
    a = parseValue(a).abs();b = parseValue(b).abs();if (a.equals(b)) return a;if (a.isZero()) return b;if (b.isZero()) return a;var c = Integer[1],
        d,
        t;while (a.isEven() && b.isEven()) {
      d = min(roughLOB(a), roughLOB(b));a = a.divide(d);b = b.divide(d);c = c.multiply(d);
    }while (a.isEven()) {
      a = a.divide(roughLOB(a));
    }do {
      while (b.isEven()) {
        b = b.divide(roughLOB(b));
      }if (a.greater(b)) {
        t = b;b = a;a = t;
      }b = b.subtract(a);
    } while (!b.isZero());return c.isUnit() ? a : a.multiply(c);
  }function lcm(a, b) {
    a = parseValue(a).abs();b = parseValue(b).abs();return a.divide(gcd(a, b)).multiply(b);
  }function randBetween(a, b) {
    a = parseValue(a);b = parseValue(b);var low = min(a, b),
        high = max(a, b);var range = high.subtract(low).add(1);if (range.isSmall) return low.add(Math.floor(Math.random() * range));var digits = toBase(range, BASE).value;var result = [],
        restricted = true;for (var i = 0; i < digits.length; i++) {
      var top = restricted ? digits[i] : BASE;var digit = truncate(Math.random() * top);result.push(digit);if (digit < top) restricted = false;
    }return low.add(Integer.fromArray(result, BASE, false));
  }var parseBase = function parseBase(text, base, alphabet, caseSensitive) {
    alphabet = alphabet || DEFAULT_ALPHABET;text = String(text);if (!caseSensitive) {
      text = text.toLowerCase();alphabet = alphabet.toLowerCase();
    }var length = text.length;var i;var absBase = Math.abs(base);var alphabetValues = {};for (i = 0; i < alphabet.length; i++) {
      alphabetValues[alphabet[i]] = i;
    }for (i = 0; i < length; i++) {
      var c = text[i];if (c === "-") continue;if (c in alphabetValues) {
        if (alphabetValues[c] >= absBase) {
          if (c === "1" && absBase === 1) continue;throw new Error(c + " is not a valid digit in base " + base + ".");
        }
      }
    }base = parseValue(base);var digits = [];var isNegative = text[0] === "-";for (i = isNegative ? 1 : 0; i < text.length; i++) {
      var c = text[i];if (c in alphabetValues) digits.push(parseValue(alphabetValues[c]));else if (c === "<") {
        var start = i;do {
          i++;
        } while (text[i] !== ">" && i < text.length);digits.push(parseValue(text.slice(start + 1, i)));
      } else throw new Error(c + " is not a valid character");
    }return parseBaseFromArray(digits, base, isNegative);
  };function parseBaseFromArray(digits, base, isNegative) {
    var val = Integer[0],
        pow = Integer[1],
        i;for (i = digits.length - 1; i >= 0; i--) {
      val = val.add(digits[i].times(pow));pow = pow.times(base);
    }return isNegative ? val.negate() : val;
  }function stringify(digit, alphabet) {
    alphabet = alphabet || DEFAULT_ALPHABET;if (digit < alphabet.length) {
      return alphabet[digit];
    }return "<" + digit + ">";
  }function toBase(n, base) {
    base = bigInt(base);if (base.isZero()) {
      if (n.isZero()) return { value: [0], isNegative: false };throw new Error("Cannot convert nonzero numbers to base 0.");
    }if (base.equals(-1)) {
      if (n.isZero()) return { value: [0], isNegative: false };if (n.isNegative()) return { value: [].concat.apply([], Array.apply(null, Array(-n.toJSNumber())).map(Array.prototype.valueOf, [1, 0])), isNegative: false };var arr = Array.apply(null, Array(n.toJSNumber() - 1)).map(Array.prototype.valueOf, [0, 1]);arr.unshift([1]);return { value: [].concat.apply([], arr), isNegative: false };
    }var neg = false;if (n.isNegative() && base.isPositive()) {
      neg = true;n = n.abs();
    }if (base.isUnit()) {
      if (n.isZero()) return { value: [0], isNegative: false };return { value: Array.apply(null, Array(n.toJSNumber())).map(Number.prototype.valueOf, 1), isNegative: neg };
    }var out = [];var left = n,
        divmod;while (left.isNegative() || left.compareAbs(base) >= 0) {
      divmod = left.divmod(base);left = divmod.quotient;var digit = divmod.remainder;if (digit.isNegative()) {
        digit = base.minus(digit).abs();left = left.next();
      }out.push(digit.toJSNumber());
    }out.push(left.toJSNumber());return { value: out.reverse(), isNegative: neg };
  }function toBaseString(n, base, alphabet) {
    var arr = toBase(n, base);return (arr.isNegative ? "-" : "") + arr.value.map(function (x) {
      return stringify(x, alphabet);
    }).join("");
  }BigInteger.prototype.toArray = function (radix) {
    return toBase(this, radix);
  };SmallInteger.prototype.toArray = function (radix) {
    return toBase(this, radix);
  };NativeBigInt.prototype.toArray = function (radix) {
    return toBase(this, radix);
  };BigInteger.prototype.toString = function (radix, alphabet) {
    if (radix === undefined) radix = 10;if (radix !== 10) return toBaseString(this, radix, alphabet);var v = this.value,
        l = v.length,
        str = String(v[--l]),
        zeros = "0000000",
        digit;while (--l >= 0) {
      digit = String(v[l]);str += zeros.slice(digit.length) + digit;
    }var sign = this.sign ? "-" : "";return sign + str;
  };SmallInteger.prototype.toString = function (radix, alphabet) {
    if (radix === undefined) radix = 10;if (radix != 10) return toBaseString(this, radix, alphabet);return String(this.value);
  };NativeBigInt.prototype.toString = SmallInteger.prototype.toString;NativeBigInt.prototype.toJSON = BigInteger.prototype.toJSON = SmallInteger.prototype.toJSON = function () {
    return this.toString();
  };BigInteger.prototype.valueOf = function () {
    return parseInt(this.toString(), 10);
  };BigInteger.prototype.toJSNumber = BigInteger.prototype.valueOf;SmallInteger.prototype.valueOf = function () {
    return this.value;
  };SmallInteger.prototype.toJSNumber = SmallInteger.prototype.valueOf;NativeBigInt.prototype.valueOf = NativeBigInt.prototype.toJSNumber = function () {
    return parseInt(this.toString(), 10);
  };function parseStringValue(v) {
    if (isPrecise(+v)) {
      var x = +v;if (x === truncate(x)) return supportsNativeBigInt ? new NativeBigInt(BigInt(x)) : new SmallInteger(x);throw new Error("Invalid integer: " + v);
    }var sign = v[0] === "-";if (sign) v = v.slice(1);var split = v.split(/e/i);if (split.length > 2) throw new Error("Invalid integer: " + split.join("e"));if (split.length === 2) {
      var exp = split[1];if (exp[0] === "+") exp = exp.slice(1);exp = +exp;if (exp !== truncate(exp) || !isPrecise(exp)) throw new Error("Invalid integer: " + exp + " is not a valid exponent.");var text = split[0];var decimalPlace = text.indexOf(".");if (decimalPlace >= 0) {
        exp -= text.length - decimalPlace - 1;text = text.slice(0, decimalPlace) + text.slice(decimalPlace + 1);
      }if (exp < 0) throw new Error("Cannot include negative exponent part for integers");text += new Array(exp + 1).join("0");v = text;
    }var isValid = /^([0-9][0-9]*)$/.test(v);if (!isValid) throw new Error("Invalid integer: " + v);if (supportsNativeBigInt) {
      return new NativeBigInt(BigInt(sign ? "-" + v : v));
    }var r = [],
        max = v.length,
        l = LOG_BASE,
        min = max - l;while (max > 0) {
      r.push(+v.slice(min, max));min -= l;if (min < 0) min = 0;max -= l;
    }trim(r);return new BigInteger(r, sign);
  }function parseNumberValue(v) {
    if (supportsNativeBigInt) {
      return new NativeBigInt(BigInt(v));
    }if (isPrecise(v)) {
      if (v !== truncate(v)) throw new Error(v + " is not an integer.");return new SmallInteger(v);
    }return parseStringValue(v.toString());
  }function parseValue(v) {
    if (typeof v === "number") {
      return parseNumberValue(v);
    }if (typeof v === "string") {
      return parseStringValue(v);
    }if (typeof v === "bigint") {
      return new NativeBigInt(v);
    }return v;
  }for (var i = 0; i < 1e3; i++) {
    Integer[i] = parseValue(i);if (i > 0) Integer[-i] = parseValue(-i);
  }Integer.one = Integer[1];Integer.zero = Integer[0];Integer.minusOne = Integer[-1];Integer.max = max;Integer.min = min;Integer.gcd = gcd;Integer.lcm = lcm;Integer.isInstance = function (x) {
    return x instanceof BigInteger || x instanceof SmallInteger || x instanceof NativeBigInt;
  };Integer.randBetween = randBetween;Integer.fromArray = function (digits, base, isNegative) {
    return parseBaseFromArray(digits.map(parseValue), parseValue(base || 10), isNegative);
  };return Integer;
})();if (typeof module !== "undefined" && module.hasOwnProperty("exports")) {
  module.exports = bigInt;
}if (typeof define === "function" && define.amd) {
  define("big-integer", [], function () {
    return bigInt;
  });
}

},{}],2:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @module FactoryMaker
 * @ignore
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var FactoryMaker = (function () {

    var instance = undefined;
    var singletonContexts = [];
    var singletonFactories = {};
    var classFactories = {};

    function extend(name, childInstance, override, context) {
        if (!context[name] && childInstance) {
            context[name] = {
                instance: childInstance,
                override: override
            };
        }
    }

    /**
     * Use this method from your extended object.  this.factory is injected into your object.
     * this.factory.getSingletonInstance(this.context, 'VideoModel')
     * will return the video model for use in the extended object.
     *
     * @param {Object} context - injected into extended object as this.context
     * @param {string} className - string name found in all dash.js objects
     * with name __dashjs_factory_name Will be at the bottom. Will be the same as the object's name.
     * @returns {*} Context aware instance of specified singleton name.
     * @memberof module:FactoryMaker
     * @instance
     */
    function getSingletonInstance(context, className) {
        for (var i in singletonContexts) {
            var obj = singletonContexts[i];
            if (obj.context === context && obj.name === className) {
                return obj.instance;
            }
        }
        return null;
    }

    /**
     * Use this method to add an singleton instance to the system.  Useful for unit testing to mock objects etc.
     *
     * @param {Object} context
     * @param {string} className
     * @param {Object} instance
     * @memberof module:FactoryMaker
     * @instance
     */
    function setSingletonInstance(context, className, instance) {
        for (var i in singletonContexts) {
            var obj = singletonContexts[i];
            if (obj.context === context && obj.name === className) {
                singletonContexts[i].instance = instance;
                return;
            }
        }
        singletonContexts.push({
            name: className,
            context: context,
            instance: instance
        });
    }

    /**
     * Use this method to remove all singleton instances associated with a particular context.
     *
     * @param {Object} context
     * @memberof module:FactoryMaker
     * @instance
     */
    function deleteSingletonInstances(context) {
        singletonContexts = singletonContexts.filter(function (x) {
            return x.context !== context;
        });
    }

    /*------------------------------------------------------------------------------------------*/

    // Factories storage Management

    /*------------------------------------------------------------------------------------------*/

    function getFactoryByName(name, factoriesArray) {
        return factoriesArray[name];
    }

    function updateFactory(name, factory, factoriesArray) {
        if (name in factoriesArray) {
            factoriesArray[name] = factory;
        }
    }

    /*------------------------------------------------------------------------------------------*/

    // Class Factories Management

    /*------------------------------------------------------------------------------------------*/

    function updateClassFactory(name, factory) {
        updateFactory(name, factory, classFactories);
    }

    function getClassFactoryByName(name) {
        return getFactoryByName(name, classFactories);
    }

    function getClassFactory(classConstructor) {
        var factory = getFactoryByName(classConstructor.__dashjs_factory_name, classFactories);

        if (!factory) {
            factory = function (context) {
                if (context === undefined) {
                    context = {};
                }
                return {
                    create: function create() {
                        return merge(classConstructor, context, arguments);
                    }
                };
            };

            classFactories[classConstructor.__dashjs_factory_name] = factory; // store factory
        }
        return factory;
    }

    /*------------------------------------------------------------------------------------------*/

    // Singleton Factory MAangement

    /*------------------------------------------------------------------------------------------*/

    function updateSingletonFactory(name, factory) {
        updateFactory(name, factory, singletonFactories);
    }

    function getSingletonFactoryByName(name) {
        return getFactoryByName(name, singletonFactories);
    }

    function getSingletonFactory(classConstructor) {
        var factory = getFactoryByName(classConstructor.__dashjs_factory_name, singletonFactories);
        if (!factory) {
            factory = function (context) {
                var instance = undefined;
                if (context === undefined) {
                    context = {};
                }
                return {
                    getInstance: function getInstance() {
                        // If we don't have an instance yet check for one on the context
                        if (!instance) {
                            instance = getSingletonInstance(context, classConstructor.__dashjs_factory_name);
                        }
                        // If there's no instance on the context then create one
                        if (!instance) {
                            instance = merge(classConstructor, context, arguments);
                            singletonContexts.push({
                                name: classConstructor.__dashjs_factory_name,
                                context: context,
                                instance: instance
                            });
                        }
                        return instance;
                    }
                };
            };
            singletonFactories[classConstructor.__dashjs_factory_name] = factory; // store factory
        }

        return factory;
    }

    function merge(classConstructor, context, args) {

        var classInstance = undefined;
        var className = classConstructor.__dashjs_factory_name;
        var extensionObject = context[className];

        if (extensionObject) {

            var extension = extensionObject.instance;

            if (extensionObject.override) {
                //Override public methods in parent but keep parent.

                classInstance = classConstructor.apply({ context: context }, args);
                extension = extension.apply({
                    context: context,
                    factory: instance,
                    parent: classInstance
                }, args);

                for (var prop in extension) {
                    if (classInstance.hasOwnProperty(prop)) {
                        classInstance[prop] = extension[prop];
                    }
                }
            } else {
                //replace parent object completely with new object. Same as dijon.

                return extension.apply({
                    context: context,
                    factory: instance
                }, args);
            }
        } else {
            // Create new instance of the class
            classInstance = classConstructor.apply({ context: context }, args);
        }

        // Add getClassName function to class instance prototype (used by Debug)
        classInstance.getClassName = function () {
            return className;
        };

        return classInstance;
    }

    instance = {
        extend: extend,
        getSingletonInstance: getSingletonInstance,
        setSingletonInstance: setSingletonInstance,
        deleteSingletonInstances: deleteSingletonInstances,
        getSingletonFactory: getSingletonFactory,
        getSingletonFactoryByName: getSingletonFactoryByName,
        updateSingletonFactory: updateSingletonFactory,
        getClassFactory: getClassFactory,
        getClassFactoryByName: getClassFactoryByName,
        updateClassFactory: updateClassFactory
    };

    return instance;
})();

exports["default"] = FactoryMaker;
module.exports = exports["default"];

},{}],3:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var ErrorsBase = (function () {
    function ErrorsBase() {
        _classCallCheck(this, ErrorsBase);
    }

    _createClass(ErrorsBase, [{
        key: 'extend',
        value: function extend(errors, config) {
            if (!errors) return;

            var override = config ? config.override : false;
            var publicOnly = config ? config.publicOnly : false;

            for (var err in errors) {
                if (!errors.hasOwnProperty(err) || this[err] && !override) continue;
                if (publicOnly && errors[err].indexOf('public_') === -1) continue;
                this[err] = errors[err];
            }
        }
    }]);

    return ErrorsBase;
})();

exports['default'] = ErrorsBase;
module.exports = exports['default'];

},{}],4:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var EventsBase = (function () {
    function EventsBase() {
        _classCallCheck(this, EventsBase);
    }

    _createClass(EventsBase, [{
        key: 'extend',
        value: function extend(events, config) {
            if (!events) return;

            var override = config ? config.override : false;
            var publicOnly = config ? config.publicOnly : false;

            for (var evt in events) {
                if (!events.hasOwnProperty(evt) || this[evt] && !override) continue;
                if (publicOnly && events[evt].indexOf('public_') === -1) continue;
                this[evt] = events[evt];
            }
        }
    }]);

    return EventsBase;
})();

exports['default'] = EventsBase;
module.exports = exports['default'];

},{}],5:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _streamingVoFragmentRequest = _dereq_('../streaming/vo/FragmentRequest');

var _streamingVoFragmentRequest2 = _interopRequireDefault(_streamingVoFragmentRequest);

function MssFragmentInfoController(config) {

    config = config || {};

    var instance = undefined,
        logger = undefined,
        fragmentModel = undefined,
        started = undefined,
        type = undefined,
        loadFragmentTimeout = undefined,
        startTime = undefined,
        startFragmentTime = undefined,
        index = undefined;

    var streamProcessor = config.streamProcessor;
    var baseURLController = config.baseURLController;
    var debug = config.debug;
    var controllerType = 'MssFragmentInfoController';

    function setup() {
        logger = debug.getLogger(instance);
    }

    function initialize() {
        type = streamProcessor.getType();
        fragmentModel = streamProcessor.getFragmentModel();

        started = false;
        startTime = null;
        startFragmentTime = null;
    }

    function start() {
        if (started) return;

        logger.debug('Start');

        started = true;
        startTime = new Date().getTime();
        index = 0;

        loadNextFragmentInfo();
    }

    function stop() {
        if (!started) return;

        logger.debug('Stop');

        clearTimeout(loadFragmentTimeout);
        started = false;
        startTime = null;
        startFragmentTime = null;
    }

    function reset() {
        stop();
    }

    function loadNextFragmentInfo() {
        if (!started) return;

        // Get last segment from SegmentTimeline
        var representation = getCurrentRepresentation();
        var manifest = representation.adaptation.period.mpd.manifest;
        var adaptation = manifest.Period_asArray[representation.adaptation.period.index].AdaptationSet_asArray[representation.adaptation.index];
        var segments = adaptation.SegmentTemplate.SegmentTimeline.S_asArray;
        var segment = segments[segments.length - 1];

        // logger.debug('Last fragment time: ' + (segment.t / adaptation.SegmentTemplate.timescale));

        // Generate segment request
        var request = getRequestForSegment(adaptation, representation, segment);

        // Send segment request
        requestFragment.call(this, request);
    }

    function getRequestForSegment(adaptation, representation, segment) {
        var timescale = adaptation.SegmentTemplate.timescale;
        var request = new _streamingVoFragmentRequest2['default']();

        request.mediaType = type;
        request.type = 'FragmentInfoSegment';
        // request.range = segment.mediaRange;
        request.startTime = segment.t / timescale;
        request.duration = segment.d / timescale;
        request.timescale = timescale;
        // request.availabilityStartTime = segment.availabilityStartTime;
        // request.availabilityEndTime = segment.availabilityEndTime;
        // request.wallStartTime = segment.wallStartTime;
        request.quality = representation.index;
        request.index = index++;
        request.mediaInfo = streamProcessor.getMediaInfo();
        request.adaptationIndex = representation.adaptation.index;
        request.representationId = representation.id;
        request.url = baseURLController.resolve(representation.path).url + adaptation.SegmentTemplate.media;
        request.url = request.url.replace('$Bandwidth$', representation.bandwidth);
        request.url = request.url.replace('$Time$', segment.tManifest ? segment.tManifest : segment.t);
        request.url = request.url.replace('/Fragments(', '/FragmentInfo(');

        return request;
    }

    function getCurrentRepresentation() {
        var representationController = streamProcessor.getRepresentationController();
        var representation = representationController.getCurrentRepresentation();
        return representation;
    }

    function requestFragment(request) {
        // logger.debug('Load FragmentInfo for time: ' + request.startTime);
        if (streamProcessor.getFragmentModel().isFragmentLoadedOrPending(request)) {
            // We may have reached end of timeline in case of start-over streams
            logger.debug('End of timeline');
            stop();
            return;
        }

        fragmentModel.executeRequest(request);
    }

    function fragmentInfoLoaded(e) {
        if (!started) return;

        var request = e.request;
        if (!e.response) {
            logger.error('Load error', request.url);
            return;
        }

        var deltaFragmentTime = undefined,
            deltaTime = undefined,
            delay = undefined;

        // logger.debug('FragmentInfo loaded: ', request.url);

        if (!startFragmentTime) {
            startFragmentTime = request.startTime;
        }

        // Determine delay before requesting next FragmentInfo
        deltaTime = (new Date().getTime() - startTime) / 1000;
        deltaFragmentTime = request.startTime + request.duration - startFragmentTime;
        delay = Math.max(0, deltaFragmentTime - deltaTime);

        // Set timeout for requesting next FragmentInfo
        clearTimeout(loadFragmentTimeout);
        loadFragmentTimeout = setTimeout(function () {
            loadFragmentTimeout = null;
            loadNextFragmentInfo();
        }, delay * 1000);
    }

    function getType() {
        return type;
    }

    instance = {
        initialize: initialize,
        controllerType: controllerType,
        start: start,
        fragmentInfoLoaded: fragmentInfoLoaded,
        getType: getType,
        reset: reset
    };

    setup();

    return instance;
}

MssFragmentInfoController.__dashjs_factory_name = 'MssFragmentInfoController';
exports['default'] = dashjs.FactoryMaker.getClassFactory(MssFragmentInfoController);
/* jshint ignore:line */
module.exports = exports['default'];

},{"../streaming/vo/FragmentRequest":17}],6:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _streamingVoDashJSError = _dereq_('../streaming/vo/DashJSError');

var _streamingVoDashJSError2 = _interopRequireDefault(_streamingVoDashJSError);

var _errorsMssErrors = _dereq_('./errors/MssErrors');

var _errorsMssErrors2 = _interopRequireDefault(_errorsMssErrors);

var _streamingMediaPlayerEvents = _dereq_('../streaming/MediaPlayerEvents');

var _streamingMediaPlayerEvents2 = _interopRequireDefault(_streamingMediaPlayerEvents);

/**
 * @module MssFragmentMoofProcessor
 * @ignore
 * @param {Object} config object
 */
function MssFragmentMoofProcessor(config) {

    config = config || {};
    var instance = undefined,
        type = undefined,
        logger = undefined;
    var dashMetrics = config.dashMetrics;
    var playbackController = config.playbackController;
    var errorHandler = config.errHandler;
    var eventBus = config.eventBus;
    var ISOBoxer = config.ISOBoxer;
    var debug = config.debug;

    function setup() {
        logger = debug.getLogger(instance);
        type = '';
    }

    function processTfrf(request, tfrf, tfdt, streamProcessor) {
        var representationController = streamProcessor.getRepresentationController();
        var representation = representationController.getCurrentRepresentation();

        var manifest = representation.adaptation.period.mpd.manifest;
        var adaptation = manifest.Period_asArray[representation.adaptation.period.index].AdaptationSet_asArray[representation.adaptation.index];
        var timescale = adaptation.SegmentTemplate.timescale;

        type = streamProcessor.getType();

        // Process tfrf only for live streams or start-over static streams (timeShiftBufferDepth > 0)
        if (manifest.type !== 'dynamic' && !manifest.timeShiftBufferDepth) {
            return;
        }

        if (!tfrf) {
            errorHandler.error(new _streamingVoDashJSError2['default'](_errorsMssErrors2['default'].MSS_NO_TFRF_CODE, _errorsMssErrors2['default'].MSS_NO_TFRF_MESSAGE));
            return;
        }

        // Get adaptation's segment timeline (always a SegmentTimeline in Smooth Streaming use case)
        var segments = adaptation.SegmentTemplate.SegmentTimeline.S;
        var entries = tfrf.entry;
        var entry = undefined,
            segmentTime = undefined,
            range = undefined;
        var segment = null;
        var t = 0;
        var availabilityStartTime = null;

        if (entries.length === 0) {
            return;
        }

        // Consider only first tfrf entry (to avoid pre-condition failure on fragment info requests)
        entry = entries[0];

        // In case of start-over streams, check if we have reached end of original manifest duration (set in timeShiftBufferDepth)
        // => then do not update anymore timeline
        if (manifest.type === 'static') {
            // Get first segment time
            segmentTime = segments[0].tManifest ? parseFloat(segments[0].tManifest) : segments[0].t;
            if (entry.fragment_absolute_time > segmentTime + manifest.timeShiftBufferDepth * timescale) {
                return;
            }
        }

        // logger.debug('entry - t = ', (entry.fragment_absolute_time / timescale));

        // Get last segment time
        segmentTime = segments[segments.length - 1].tManifest ? parseFloat(segments[segments.length - 1].tManifest) : segments[segments.length - 1].t;
        // logger.debug('Last segment - t = ', (segmentTime / timescale));

        // Check if we have to append new segment to timeline
        if (entry.fragment_absolute_time <= segmentTime) {
            // Update DVR window range => set range end to end time of current segment
            range = {
                start: segments[0].t / timescale,
                end: tfdt.baseMediaDecodeTime / timescale + request.duration
            };

            updateDVR(request.mediaType, range, streamProcessor.getStreamInfo().manifestInfo);
            return;
        }

        // logger.debug('Add new segment - t = ', (entry.fragment_absolute_time / timescale));
        segment = {};
        segment.t = entry.fragment_absolute_time;
        segment.d = entry.fragment_duration;
        // If timestamps starts at 0 relative to 1st segment (dynamic to static) then update segment time
        if (segments[0].tManifest) {
            segment.t -= parseFloat(segments[0].tManifest) - segments[0].t;
            segment.tManifest = entry.fragment_absolute_time;
        }

        // Patch previous segment duration
        var lastSegment = segments[segments.length - 1];
        if (lastSegment.t + lastSegment.d !== segment.t) {
            logger.debug('Patch segment duration - t = ', lastSegment.t + ', d = ' + lastSegment.d + ' => ' + (segment.t - lastSegment.t));
            lastSegment.d = segment.t - lastSegment.t;
        }

        segments.push(segment);

        // In case of static start-over streams, update content duration
        if (manifest.type === 'static') {
            if (type === 'video') {
                segment = segments[segments.length - 1];
                var end = (segment.t + segment.d) / timescale;
                if (end > representation.adaptation.period.duration) {
                    eventBus.trigger(_streamingMediaPlayerEvents2['default'].MANIFEST_VALIDITY_CHANGED, { sender: this, newDuration: end });
                }
            }
            return;
        }
        // In case of live streams, update segment timeline according to DVR window
        else if (manifest.timeShiftBufferDepth && manifest.timeShiftBufferDepth > 0) {
                // Get timestamp of the last segment
                segment = segments[segments.length - 1];
                t = segment.t;

                // Determine the segments' availability start time
                availabilityStartTime = Math.round((t - manifest.timeShiftBufferDepth * timescale) / timescale);

                // Remove segments prior to availability start time
                segment = segments[0];
                while (Math.round(segment.t / timescale) < availabilityStartTime) {
                    // logger.debug('Remove segment  - t = ' + (segment.t / timescale));
                    segments.splice(0, 1);
                    segment = segments[0];
                }

                // Update DVR window range => set range end to end time of current segment
                range = {
                    start: segments[0].t / timescale,
                    end: tfdt.baseMediaDecodeTime / timescale + request.duration
                };

                updateDVR(type, range, streamProcessor.getStreamInfo().manifestInfo);
            }

        representationController.updateRepresentation(representation, true);
    }

    function updateDVR(type, range, manifestInfo) {
        var dvrInfos = dashMetrics.getCurrentDVRInfo(type);
        if (!dvrInfos || range.end > dvrInfos.range.end) {
            logger.debug('Update DVR range: [' + range.start + ' - ' + range.end + ']');
            dashMetrics.addDVRInfo(type, playbackController.getTime(), manifestInfo, range);
        }
    }

    // This function returns the offset of the 1st byte of a child box within a container box
    function getBoxOffset(parent, type) {
        var offset = 8;
        var i = 0;

        for (i = 0; i < parent.boxes.length; i++) {
            if (parent.boxes[i].type === type) {
                return offset;
            }
            offset += parent.boxes[i].size;
        }
        return offset;
    }

    function convertFragment(e, streamProcessor) {
        var i = undefined;

        // e.request contains request description object
        // e.response contains fragment bytes
        var isoFile = ISOBoxer.parseBuffer(e.response);
        // Update track_Id in tfhd box
        var tfhd = isoFile.fetch('tfhd');
        tfhd.track_ID = e.request.mediaInfo.index + 1;

        // Add tfdt box
        var tfdt = isoFile.fetch('tfdt');
        var traf = isoFile.fetch('traf');
        if (tfdt === null) {
            tfdt = ISOBoxer.createFullBox('tfdt', traf, tfhd);
            tfdt.version = 1;
            tfdt.flags = 0;
            tfdt.baseMediaDecodeTime = Math.floor(e.request.startTime * e.request.timescale);
        }

        var trun = isoFile.fetch('trun');

        // Process tfxd boxes
        // This box provide absolute timestamp but we take the segment start time for tfdt
        var tfxd = isoFile.fetch('tfxd');
        if (tfxd) {
            tfxd._parent.boxes.splice(tfxd._parent.boxes.indexOf(tfxd), 1);
            tfxd = null;
        }
        var tfrf = isoFile.fetch('tfrf');
        processTfrf(e.request, tfrf, tfdt, streamProcessor);
        if (tfrf) {
            tfrf._parent.boxes.splice(tfrf._parent.boxes.indexOf(tfrf), 1);
            tfrf = null;
        }

        // If protected content in PIFF1.1 format (sepiff box = Sample Encryption PIFF)
        // => convert sepiff box it into a senc box
        // => create saio and saiz boxes (if not already present)
        var sepiff = isoFile.fetch('sepiff');
        if (sepiff !== null) {
            sepiff.type = 'senc';
            sepiff.usertype = undefined;

            var _saio = isoFile.fetch('saio');
            if (_saio === null) {
                // Create Sample Auxiliary Information Offsets Box box (saio)
                _saio = ISOBoxer.createFullBox('saio', traf);
                _saio.version = 0;
                _saio.flags = 0;
                _saio.entry_count = 1;
                _saio.offset = [0];

                var saiz = ISOBoxer.createFullBox('saiz', traf);
                saiz.version = 0;
                saiz.flags = 0;
                saiz.sample_count = sepiff.sample_count;
                saiz.default_sample_info_size = 0;
                saiz.sample_info_size = [];

                if (sepiff.flags & 0x02) {
                    // Sub-sample encryption => set sample_info_size for each sample
                    for (i = 0; i < sepiff.sample_count; i += 1) {
                        // 10 = 8 (InitializationVector field size) + 2 (subsample_count field size)
                        // 6 = 2 (BytesOfClearData field size) + 4 (BytesOfEncryptedData field size)
                        saiz.sample_info_size[i] = 10 + 6 * sepiff.entry[i].NumberOfEntries;
                    }
                } else {
                    // No sub-sample encryption => set default sample_info_size = InitializationVector field size (8)
                    saiz.default_sample_info_size = 8;
                }
            }
        }

        tfhd.flags &= 0xFFFFFE; // set tfhd.base-data-offset-present to false
        tfhd.flags |= 0x020000; // set tfhd.default-base-is-moof to true
        trun.flags |= 0x000001; // set trun.data-offset-present to true

        // Update trun.data_offset field that corresponds to first data byte (inside mdat box)
        var moof = isoFile.fetch('moof');
        var length = moof.getLength();
        trun.data_offset = length + 8;

        // Update saio box offset field according to new senc box offset
        var saio = isoFile.fetch('saio');
        if (saio !== null) {
            var trafPosInMoof = getBoxOffset(moof, 'traf');
            var sencPosInTraf = getBoxOffset(traf, 'senc');
            // Set offset from begin fragment to the first IV field in senc box
            saio.offset[0] = trafPosInMoof + sencPosInTraf + 16; // 16 = box header (12) + sample_count field size (4)
        }

        // Write transformed/processed fragment into request reponse data
        e.response = isoFile.write();
    }

    function updateSegmentList(e, streamProcessor) {
        // e.request contains request description object
        // e.response contains fragment bytes
        if (!e.response) {
            throw new Error('e.response parameter is missing');
        }

        var isoFile = ISOBoxer.parseBuffer(e.response);
        // Update track_Id in tfhd box
        var tfhd = isoFile.fetch('tfhd');
        tfhd.track_ID = e.request.mediaInfo.index + 1;

        // Add tfdt box
        var tfdt = isoFile.fetch('tfdt');
        var traf = isoFile.fetch('traf');
        if (tfdt === null) {
            tfdt = ISOBoxer.createFullBox('tfdt', traf, tfhd);
            tfdt.version = 1;
            tfdt.flags = 0;
            tfdt.baseMediaDecodeTime = Math.floor(e.request.startTime * e.request.timescale);
        }

        var tfrf = isoFile.fetch('tfrf');
        processTfrf(e.request, tfrf, tfdt, streamProcessor);
        if (tfrf) {
            tfrf._parent.boxes.splice(tfrf._parent.boxes.indexOf(tfrf), 1);
            tfrf = null;
        }
    }

    function getType() {
        return type;
    }

    instance = {
        convertFragment: convertFragment,
        updateSegmentList: updateSegmentList,
        getType: getType
    };

    setup();
    return instance;
}

MssFragmentMoofProcessor.__dashjs_factory_name = 'MssFragmentMoofProcessor';
exports['default'] = dashjs.FactoryMaker.getClassFactory(MssFragmentMoofProcessor);
/* jshint ignore:line */
module.exports = exports['default'];

},{"../streaming/MediaPlayerEvents":13,"../streaming/vo/DashJSError":15,"./errors/MssErrors":10}],7:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _errorsMssErrors = _dereq_('./errors/MssErrors');

var _errorsMssErrors2 = _interopRequireDefault(_errorsMssErrors);

/**
 * @module MssFragmentMoovProcessor
 * @ignore
 * @param {Object} config object
 */
function MssFragmentMoovProcessor(config) {
    config = config || {};
    var NALUTYPE_SPS = 7;
    var NALUTYPE_PPS = 8;
    var constants = config.constants;
    var ISOBoxer = config.ISOBoxer;

    var protectionController = config.protectionController;
    var instance = undefined,
        period = undefined,
        adaptationSet = undefined,
        representation = undefined,
        contentProtection = undefined,
        timescale = undefined,
        trackId = undefined;

    function createFtypBox(isoFile) {
        var ftyp = ISOBoxer.createBox('ftyp', isoFile);
        ftyp.major_brand = 'iso6';
        ftyp.minor_version = 1; // is an informative integer for the minor version of the major brand
        ftyp.compatible_brands = []; //is a list, to the end of the box, of brands isom, iso6 and msdh
        ftyp.compatible_brands[0] = 'isom'; // => decimal ASCII value for isom
        ftyp.compatible_brands[1] = 'iso6'; // => decimal ASCII value for iso6
        ftyp.compatible_brands[2] = 'msdh'; // => decimal ASCII value for msdh

        return ftyp;
    }

    function createMoovBox(isoFile) {

        // moov box
        var moov = ISOBoxer.createBox('moov', isoFile);

        // moov/mvhd
        createMvhdBox(moov);

        // moov/trak
        var trak = ISOBoxer.createBox('trak', moov);

        // moov/trak/tkhd
        createTkhdBox(trak);

        // moov/trak/mdia
        var mdia = ISOBoxer.createBox('mdia', trak);

        // moov/trak/mdia/mdhd
        createMdhdBox(mdia);

        // moov/trak/mdia/hdlr
        createHdlrBox(mdia);

        // moov/trak/mdia/minf
        var minf = ISOBoxer.createBox('minf', mdia);

        switch (adaptationSet.type) {
            case constants.VIDEO:
                // moov/trak/mdia/minf/vmhd
                createVmhdBox(minf);
                break;
            case constants.AUDIO:
                // moov/trak/mdia/minf/smhd
                createSmhdBox(minf);
                break;
            default:
                break;
        }

        // moov/trak/mdia/minf/dinf
        var dinf = ISOBoxer.createBox('dinf', minf);

        // moov/trak/mdia/minf/dinf/dref
        createDrefBox(dinf);

        // moov/trak/mdia/minf/stbl
        var stbl = ISOBoxer.createBox('stbl', minf);

        // Create empty stts, stsc, stco and stsz boxes
        // Use data field as for codem-isoboxer unknown boxes for setting fields value

        // moov/trak/mdia/minf/stbl/stts
        var stts = ISOBoxer.createFullBox('stts', stbl);
        stts._data = [0, 0, 0, 0, 0, 0, 0, 0]; // version = 0, flags = 0, entry_count = 0

        // moov/trak/mdia/minf/stbl/stsc
        var stsc = ISOBoxer.createFullBox('stsc', stbl);
        stsc._data = [0, 0, 0, 0, 0, 0, 0, 0]; // version = 0, flags = 0, entry_count = 0

        // moov/trak/mdia/minf/stbl/stco
        var stco = ISOBoxer.createFullBox('stco', stbl);
        stco._data = [0, 0, 0, 0, 0, 0, 0, 0]; // version = 0, flags = 0, entry_count = 0

        // moov/trak/mdia/minf/stbl/stsz
        var stsz = ISOBoxer.createFullBox('stsz', stbl);
        stsz._data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // version = 0, flags = 0, sample_size = 0, sample_count = 0

        // moov/trak/mdia/minf/stbl/stsd
        createStsdBox(stbl);

        // moov/mvex
        var mvex = ISOBoxer.createBox('mvex', moov);

        // moov/mvex/trex
        createTrexBox(mvex);

        if (contentProtection && protectionController) {
            var supportedKS = protectionController.getSupportedKeySystemsFromContentProtection(contentProtection);
            createProtectionSystemSpecificHeaderBox(moov, supportedKS);
        }
    }

    function createMvhdBox(moov) {

        var mvhd = ISOBoxer.createFullBox('mvhd', moov);

        mvhd.version = 1; // version = 1  in order to have 64bits duration value

        mvhd.creation_time = 0; // the creation time of the presentation => ignore (set to 0)
        mvhd.modification_time = 0; // the most recent time the presentation was modified => ignore (set to 0)
        mvhd.timescale = timescale; // the time-scale for the entire presentation => 10000000 for MSS
        mvhd.duration = period.duration === Infinity ? 0xFFFFFFFFFFFFFFFF : Math.round(period.duration * timescale); // the length of the presentation (in the indicated timescale) =>  take duration of period
        mvhd.rate = 1.0; // 16.16 number, '1.0' = normal playback
        mvhd.volume = 1.0; // 8.8 number, '1.0' = full volume
        mvhd.reserved1 = 0;
        mvhd.reserved2 = [0x0, 0x0];
        mvhd.matrix = [1, 0, 0, // provides a transformation matrix for the video;
        0, 1, 0, // (u,v,w) are restricted here to (0,0,1)
        0, 0, 16384];
        mvhd.pre_defined = [0, 0, 0, 0, 0, 0];
        mvhd.next_track_ID = trackId + 1; // indicates a value to use for the track ID of the next track to be added to this presentation

        return mvhd;
    }

    function createTkhdBox(trak) {

        var tkhd = ISOBoxer.createFullBox('tkhd', trak);

        tkhd.version = 1; // version = 1  in order to have 64bits duration value
        tkhd.flags = 0x1 | // Track_enabled (0x000001): Indicates that the track is enabled
        0x2 | // Track_in_movie (0x000002):  Indicates that the track is used in the presentation
        0x4; // Track_in_preview (0x000004):  Indicates that the track is used when previewing the presentation

        tkhd.creation_time = 0; // the creation time of the presentation => ignore (set to 0)
        tkhd.modification_time = 0; // the most recent time the presentation was modified => ignore (set to 0)
        tkhd.track_ID = trackId; // uniquely identifies this track over the entire life-time of this presentation
        tkhd.reserved1 = 0;
        tkhd.duration = period.duration === Infinity ? 0xFFFFFFFFFFFFFFFF : Math.round(period.duration * timescale); // the duration of this track (in the timescale indicated in the Movie Header Box) =>  take duration of period
        tkhd.reserved2 = [0x0, 0x0];
        tkhd.layer = 0; // specifies the front-to-back ordering of video tracks; tracks with lower numbers are closer to the viewer => 0 since only one video track
        tkhd.alternate_group = 0; // specifies a group or collection of tracks => ignore
        tkhd.volume = 1.0; // '1.0' = full volume
        tkhd.reserved3 = 0;
        tkhd.matrix = [1, 0, 0, // provides a transformation matrix for the video;
        0, 1, 0, // (u,v,w) are restricted here to (0,0,1)
        0, 0, 16384];
        tkhd.width = representation.width; // visual presentation width
        tkhd.height = representation.height; // visual presentation height

        return tkhd;
    }

    function createMdhdBox(mdia) {

        var mdhd = ISOBoxer.createFullBox('mdhd', mdia);

        mdhd.version = 1; // version = 1  in order to have 64bits duration value

        mdhd.creation_time = 0; // the creation time of the presentation => ignore (set to 0)
        mdhd.modification_time = 0; // the most recent time the presentation was modified => ignore (set to 0)
        mdhd.timescale = timescale; // the time-scale for the entire presentation
        mdhd.duration = period.duration === Infinity ? 0xFFFFFFFFFFFFFFFF : Math.round(period.duration * timescale); // the duration of this media (in the scale of the timescale). If the duration cannot be determined then duration is set to all 1s.
        mdhd.language = adaptationSet.lang || 'und'; // declares the language code for this media
        mdhd.pre_defined = 0;

        return mdhd;
    }

    function createHdlrBox(mdia) {

        var hdlr = ISOBoxer.createFullBox('hdlr', mdia);

        hdlr.pre_defined = 0;
        switch (adaptationSet.type) {
            case constants.VIDEO:
                hdlr.handler_type = 'vide';
                break;
            case constants.AUDIO:
                hdlr.handler_type = 'soun';
                break;
            default:
                hdlr.handler_type = 'meta';
                break;
        }
        hdlr.name = representation.id;
        hdlr.reserved = [0, 0, 0];

        return hdlr;
    }

    function createVmhdBox(minf) {

        var vmhd = ISOBoxer.createFullBox('vmhd', minf);

        vmhd.flags = 1;

        vmhd.graphicsmode = 0; // specifies a composition mode for this video track, from the following enumerated set, which may be extended by derived specifications: copy = 0 copy over the existing image
        vmhd.opcolor = [0, 0, 0]; // is a set of 3 colour values (red, green, blue) available for use by graphics modes

        return vmhd;
    }

    function createSmhdBox(minf) {

        var smhd = ISOBoxer.createFullBox('smhd', minf);

        smhd.flags = 1;

        smhd.balance = 0; // is a fixed-point 8.8 number that places mono audio tracks in a stereo space; 0 is centre (the normal value); full left is -1.0 and full right is 1.0.
        smhd.reserved = 0;

        return smhd;
    }

    function createDrefBox(dinf) {

        var dref = ISOBoxer.createFullBox('dref', dinf);

        dref.entry_count = 1;
        dref.entries = [];

        var url = ISOBoxer.createFullBox('url ', dref, false);
        url.location = '';
        url.flags = 1;

        dref.entries.push(url);

        return dref;
    }

    function createStsdBox(stbl) {

        var stsd = ISOBoxer.createFullBox('stsd', stbl);

        stsd.entries = [];
        switch (adaptationSet.type) {
            case constants.VIDEO:
            case constants.AUDIO:
                stsd.entries.push(createSampleEntry(stsd));
                break;
            default:
                break;
        }

        stsd.entry_count = stsd.entries.length; // is an integer that counts the actual entries
        return stsd;
    }

    function createSampleEntry(stsd) {
        var codec = representation.codecs.substring(0, representation.codecs.indexOf('.'));

        switch (codec) {
            case 'avc1':
                return createAVCVisualSampleEntry(stsd, codec);
            case 'mp4a':
                return createMP4AudioSampleEntry(stsd, codec);
            default:
                throw {
                    code: _errorsMssErrors2['default'].MSS_UNSUPPORTED_CODEC_CODE,
                    message: _errorsMssErrors2['default'].MSS_UNSUPPORTED_CODEC_MESSAGE,
                    data: {
                        codec: codec
                    }
                };
        }
    }

    function createAVCVisualSampleEntry(stsd, codec) {
        var avc1 = undefined;

        if (contentProtection) {
            avc1 = ISOBoxer.createBox('encv', stsd, false);
        } else {
            avc1 = ISOBoxer.createBox('avc1', stsd, false);
        }

        // SampleEntry fields
        avc1.reserved1 = [0x0, 0x0, 0x0, 0x0, 0x0, 0x0];
        avc1.data_reference_index = 1;

        // VisualSampleEntry fields
        avc1.pre_defined1 = 0;
        avc1.reserved2 = 0;
        avc1.pre_defined2 = [0, 0, 0];
        avc1.height = representation.height;
        avc1.width = representation.width;
        avc1.horizresolution = 72; // 72 dpi
        avc1.vertresolution = 72; // 72 dpi
        avc1.reserved3 = 0;
        avc1.frame_count = 1; // 1 compressed video frame per sample
        avc1.compressorname = [0x0A, 0x41, 0x56, 0x43, 0x20, 0x43, 0x6F, 0x64, // = 'AVC Coding';
        0x69, 0x6E, 0x67, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        avc1.depth = 0x0018; // 0x0018 – images are in colour with no alpha.
        avc1.pre_defined3 = 65535;
        avc1.config = createAVC1ConfigurationRecord();
        if (contentProtection) {
            // Create and add Protection Scheme Info Box
            var sinf = ISOBoxer.createBox('sinf', avc1);

            // Create and add Original Format Box => indicate codec type of the encrypted content
            createOriginalFormatBox(sinf, codec);

            // Create and add Scheme Type box
            createSchemeTypeBox(sinf);

            // Create and add Scheme Information Box
            createSchemeInformationBox(sinf);
        }

        return avc1;
    }

    function createAVC1ConfigurationRecord() {

        var avcC = null;
        var avcCLength = 15; // length = 15 by default (0 SPS and 0 PPS)

        // First get all SPS and PPS from codecPrivateData
        var sps = [];
        var pps = [];
        var AVCProfileIndication = 0;
        var AVCLevelIndication = 0;
        var profile_compatibility = 0;

        var nalus = representation.codecPrivateData.split('00000001').slice(1);
        var naluBytes = undefined,
            naluType = undefined;

        for (var _i = 0; _i < nalus.length; _i++) {
            naluBytes = hexStringtoBuffer(nalus[_i]);

            naluType = naluBytes[0] & 0x1F;

            switch (naluType) {
                case NALUTYPE_SPS:
                    sps.push(naluBytes);
                    avcCLength += naluBytes.length + 2; // 2 = sequenceParameterSetLength field length
                    break;
                case NALUTYPE_PPS:
                    pps.push(naluBytes);
                    avcCLength += naluBytes.length + 2; // 2 = pictureParameterSetLength field length
                    break;
                default:
                    break;
            }
        }

        // Get profile and level from SPS
        if (sps.length > 0) {
            AVCProfileIndication = sps[0][1];
            profile_compatibility = sps[0][2];
            AVCLevelIndication = sps[0][3];
        }

        // Generate avcC buffer
        avcC = new Uint8Array(avcCLength);

        var i = 0;
        // length
        avcC[i++] = (avcCLength & 0xFF000000) >> 24;
        avcC[i++] = (avcCLength & 0x00FF0000) >> 16;
        avcC[i++] = (avcCLength & 0x0000FF00) >> 8;
        avcC[i++] = avcCLength & 0x000000FF;
        avcC.set([0x61, 0x76, 0x63, 0x43], i); // type = 'avcC'
        i += 4;
        avcC[i++] = 1; // configurationVersion = 1
        avcC[i++] = AVCProfileIndication;
        avcC[i++] = profile_compatibility;
        avcC[i++] = AVCLevelIndication;
        avcC[i++] = 0xFF; // '11111' + lengthSizeMinusOne = 3
        avcC[i++] = 0xE0 | sps.length; // '111' + numOfSequenceParameterSets
        for (var n = 0; n < sps.length; n++) {
            avcC[i++] = (sps[n].length & 0xFF00) >> 8;
            avcC[i++] = sps[n].length & 0x00FF;
            avcC.set(sps[n], i);
            i += sps[n].length;
        }
        avcC[i++] = pps.length; // numOfPictureParameterSets
        for (var n = 0; n < pps.length; n++) {
            avcC[i++] = (pps[n].length & 0xFF00) >> 8;
            avcC[i++] = pps[n].length & 0x00FF;
            avcC.set(pps[n], i);
            i += pps[n].length;
        }

        return avcC;
    }

    function createMP4AudioSampleEntry(stsd, codec) {
        var mp4a = undefined;

        if (contentProtection) {
            mp4a = ISOBoxer.createBox('enca', stsd, false);
        } else {
            mp4a = ISOBoxer.createBox('mp4a', stsd, false);
        }

        // SampleEntry fields
        mp4a.reserved1 = [0x0, 0x0, 0x0, 0x0, 0x0, 0x0];
        mp4a.data_reference_index = 1;

        // AudioSampleEntry fields
        mp4a.reserved2 = [0x0, 0x0];
        mp4a.channelcount = representation.audioChannels;
        mp4a.samplesize = 16;
        mp4a.pre_defined = 0;
        mp4a.reserved_3 = 0;
        mp4a.samplerate = representation.audioSamplingRate << 16;

        mp4a.esds = createMPEG4AACESDescriptor();

        if (contentProtection) {
            // Create and add Protection Scheme Info Box
            var sinf = ISOBoxer.createBox('sinf', mp4a);

            // Create and add Original Format Box => indicate codec type of the encrypted content
            createOriginalFormatBox(sinf, codec);

            // Create and add Scheme Type box
            createSchemeTypeBox(sinf);

            // Create and add Scheme Information Box
            createSchemeInformationBox(sinf);
        }

        return mp4a;
    }

    function createMPEG4AACESDescriptor() {

        // AudioSpecificConfig (see ISO/IEC 14496-3, subpart 1) => corresponds to hex bytes contained in 'codecPrivateData' field
        var audioSpecificConfig = hexStringtoBuffer(representation.codecPrivateData);

        // ESDS length = esds box header length (= 12) +
        //               ES_Descriptor header length (= 5) +
        //               DecoderConfigDescriptor header length (= 15) +
        //               decoderSpecificInfo header length (= 2) +
        //               AudioSpecificConfig length (= codecPrivateData length)
        var esdsLength = 34 + audioSpecificConfig.length;
        var esds = new Uint8Array(esdsLength);

        var i = 0;
        // esds box
        esds[i++] = (esdsLength & 0xFF000000) >> 24; // esds box length
        esds[i++] = (esdsLength & 0x00FF0000) >> 16; // ''
        esds[i++] = (esdsLength & 0x0000FF00) >> 8; // ''
        esds[i++] = esdsLength & 0x000000FF; // ''
        esds.set([0x65, 0x73, 0x64, 0x73], i); // type = 'esds'
        i += 4;
        esds.set([0, 0, 0, 0], i); // version = 0, flags = 0
        i += 4;
        // ES_Descriptor (see ISO/IEC 14496-1 (Systems))
        esds[i++] = 0x03; // tag = 0x03 (ES_DescrTag)
        esds[i++] = 20 + audioSpecificConfig.length; // size
        esds[i++] = (trackId & 0xFF00) >> 8; // ES_ID = track_id
        esds[i++] = trackId & 0x00FF; // ''
        esds[i++] = 0; // flags and streamPriority

        // DecoderConfigDescriptor (see ISO/IEC 14496-1 (Systems))
        esds[i++] = 0x04; // tag = 0x04 (DecoderConfigDescrTag)
        esds[i++] = 15 + audioSpecificConfig.length; // size
        esds[i++] = 0x40; // objectTypeIndication = 0x40 (MPEG-4 AAC)
        esds[i] = 0x05 << 2; // streamType = 0x05 (Audiostream)
        esds[i] |= 0 << 1; // upStream = 0
        esds[i++] |= 1; // reserved = 1
        esds[i++] = 0xFF; // buffersizeDB = undefined
        esds[i++] = 0xFF; // ''
        esds[i++] = 0xFF; // ''
        esds[i++] = (representation.bandwidth & 0xFF000000) >> 24; // maxBitrate
        esds[i++] = (representation.bandwidth & 0x00FF0000) >> 16; // ''
        esds[i++] = (representation.bandwidth & 0x0000FF00) >> 8; // ''
        esds[i++] = representation.bandwidth & 0x000000FF; // ''
        esds[i++] = (representation.bandwidth & 0xFF000000) >> 24; // avgbitrate
        esds[i++] = (representation.bandwidth & 0x00FF0000) >> 16; // ''
        esds[i++] = (representation.bandwidth & 0x0000FF00) >> 8; // ''
        esds[i++] = representation.bandwidth & 0x000000FF; // ''

        // DecoderSpecificInfo (see ISO/IEC 14496-1 (Systems))
        esds[i++] = 0x05; // tag = 0x05 (DecSpecificInfoTag)
        esds[i++] = audioSpecificConfig.length; // size
        esds.set(audioSpecificConfig, i); // AudioSpecificConfig bytes

        return esds;
    }

    function createOriginalFormatBox(sinf, codec) {
        var frma = ISOBoxer.createBox('frma', sinf);
        frma.data_format = stringToCharCode(codec);
    }

    function createSchemeTypeBox(sinf) {
        var schm = ISOBoxer.createFullBox('schm', sinf);

        schm.flags = 0;
        schm.version = 0;
        schm.scheme_type = 0x63656E63; // 'cenc' => common encryption
        schm.scheme_version = 0x00010000; // version set to 0x00010000 (Major version 1, Minor version 0)
    }

    function createSchemeInformationBox(sinf) {
        var schi = ISOBoxer.createBox('schi', sinf);

        // Create and add Track Encryption Box
        createTrackEncryptionBox(schi);
    }

    function createProtectionSystemSpecificHeaderBox(moov, keySystems) {
        var pssh_bytes = undefined,
            pssh = undefined,
            i = undefined,
            parsedBuffer = undefined;

        for (i = 0; i < keySystems.length; i += 1) {
            pssh_bytes = keySystems[i].initData;
            if (pssh_bytes) {
                parsedBuffer = ISOBoxer.parseBuffer(pssh_bytes);
                pssh = parsedBuffer.fetch('pssh');
                if (pssh) {
                    ISOBoxer.Utils.appendBox(moov, pssh);
                }
            }
        }
    }

    function createTrackEncryptionBox(schi) {
        var tenc = ISOBoxer.createFullBox('tenc', schi);

        tenc.flags = 0;
        tenc.version = 0;

        tenc.default_IsEncrypted = 0x1;
        tenc.default_IV_size = 8;
        tenc.default_KID = contentProtection && contentProtection.length > 0 && contentProtection[0]['cenc:default_KID'] ? contentProtection[0]['cenc:default_KID'] : [0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0];
    }

    function createTrexBox(moov) {
        var trex = ISOBoxer.createFullBox('trex', moov);

        trex.track_ID = trackId;
        trex.default_sample_description_index = 1;
        trex.default_sample_duration = 0;
        trex.default_sample_size = 0;
        trex.default_sample_flags = 0;

        return trex;
    }

    function hexStringtoBuffer(str) {
        var buf = new Uint8Array(str.length / 2);
        var i = undefined;

        for (i = 0; i < str.length / 2; i += 1) {
            buf[i] = parseInt('' + str[i * 2] + str[i * 2 + 1], 16);
        }
        return buf;
    }

    function stringToCharCode(str) {
        var code = 0;
        var i = undefined;

        for (i = 0; i < str.length; i += 1) {
            code |= str.charCodeAt(i) << (str.length - i - 1) * 8;
        }
        return code;
    }

    function generateMoov(rep) {
        if (!rep || !rep.adaptation) {
            return;
        }

        var isoFile = undefined,
            arrayBuffer = undefined;

        representation = rep;
        adaptationSet = representation.adaptation;

        period = adaptationSet.period;
        trackId = adaptationSet.index + 1;
        contentProtection = period.mpd.manifest.Period_asArray[period.index].AdaptationSet_asArray[adaptationSet.index].ContentProtection;

        timescale = period.mpd.manifest.Period_asArray[period.index].AdaptationSet_asArray[adaptationSet.index].SegmentTemplate.timescale;

        isoFile = ISOBoxer.createFile();
        createFtypBox(isoFile);
        createMoovBox(isoFile);

        arrayBuffer = isoFile.write();

        return arrayBuffer;
    }

    instance = {
        generateMoov: generateMoov
    };

    return instance;
}

MssFragmentMoovProcessor.__dashjs_factory_name = 'MssFragmentMoovProcessor';
exports['default'] = dashjs.FactoryMaker.getClassFactory(MssFragmentMoovProcessor);
/* jshint ignore:line */
module.exports = exports['default'];

},{"./errors/MssErrors":10}],8:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _MssFragmentMoofProcessor = _dereq_('./MssFragmentMoofProcessor');

var _MssFragmentMoofProcessor2 = _interopRequireDefault(_MssFragmentMoofProcessor);

var _MssFragmentMoovProcessor = _dereq_('./MssFragmentMoovProcessor');

var _MssFragmentMoovProcessor2 = _interopRequireDefault(_MssFragmentMoovProcessor);

// Add specific box processors not provided by codem-isoboxer library

function arrayEqual(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every(function (element, index) {
        return element === arr2[index];
    });
}

function saioProcessor() {
    this._procFullBox();
    if (this.flags & 1) {
        this._procField('aux_info_type', 'uint', 32);
        this._procField('aux_info_type_parameter', 'uint', 32);
    }
    this._procField('entry_count', 'uint', 32);
    this._procFieldArray('offset', this.entry_count, 'uint', this.version === 1 ? 64 : 32);
}

function saizProcessor() {
    this._procFullBox();
    if (this.flags & 1) {
        this._procField('aux_info_type', 'uint', 32);
        this._procField('aux_info_type_parameter', 'uint', 32);
    }
    this._procField('default_sample_info_size', 'uint', 8);
    this._procField('sample_count', 'uint', 32);
    if (this.default_sample_info_size === 0) {
        this._procFieldArray('sample_info_size', this.sample_count, 'uint', 8);
    }
}

function sencProcessor() {
    this._procFullBox();
    this._procField('sample_count', 'uint', 32);
    if (this.flags & 1) {
        this._procField('IV_size', 'uint', 8);
    }
    this._procEntries('entry', this.sample_count, function (entry) {
        this._procEntryField(entry, 'InitializationVector', 'data', 8);
        if (this.flags & 2) {
            this._procEntryField(entry, 'NumberOfEntries', 'uint', 16);
            this._procSubEntries(entry, 'clearAndCryptedData', entry.NumberOfEntries, function (clearAndCryptedData) {
                this._procEntryField(clearAndCryptedData, 'BytesOfClearData', 'uint', 16);
                this._procEntryField(clearAndCryptedData, 'BytesOfEncryptedData', 'uint', 32);
            });
        }
    });
}

function uuidProcessor() {
    var tfxdUserType = [0x6D, 0x1D, 0x9B, 0x05, 0x42, 0xD5, 0x44, 0xE6, 0x80, 0xE2, 0x14, 0x1D, 0xAF, 0xF7, 0x57, 0xB2];
    var tfrfUserType = [0xD4, 0x80, 0x7E, 0xF2, 0xCA, 0x39, 0x46, 0x95, 0x8E, 0x54, 0x26, 0xCB, 0x9E, 0x46, 0xA7, 0x9F];
    var sepiffUserType = [0xA2, 0x39, 0x4F, 0x52, 0x5A, 0x9B, 0x4f, 0x14, 0xA2, 0x44, 0x6C, 0x42, 0x7C, 0x64, 0x8D, 0xF4];

    if (arrayEqual(this.usertype, tfxdUserType)) {
        this._procFullBox();
        if (this._parsing) {
            this.type = 'tfxd';
        }
        this._procField('fragment_absolute_time', 'uint', this.version === 1 ? 64 : 32);
        this._procField('fragment_duration', 'uint', this.version === 1 ? 64 : 32);
    }

    if (arrayEqual(this.usertype, tfrfUserType)) {
        this._procFullBox();
        if (this._parsing) {
            this.type = 'tfrf';
        }
        this._procField('fragment_count', 'uint', 8);
        this._procEntries('entry', this.fragment_count, function (entry) {
            this._procEntryField(entry, 'fragment_absolute_time', 'uint', this.version === 1 ? 64 : 32);
            this._procEntryField(entry, 'fragment_duration', 'uint', this.version === 1 ? 64 : 32);
        });
    }

    if (arrayEqual(this.usertype, sepiffUserType)) {
        if (this._parsing) {
            this.type = 'sepiff';
        }
        sencProcessor.call(this);
    }
}

function MssFragmentProcessor(config) {

    config = config || {};
    var context = this.context;
    var dashMetrics = config.dashMetrics;
    var playbackController = config.playbackController;
    var eventBus = config.eventBus;
    var protectionController = config.protectionController;
    var ISOBoxer = config.ISOBoxer;
    var debug = config.debug;
    var mssFragmentMoovProcessor = undefined,
        mssFragmentMoofProcessor = undefined,
        instance = undefined;

    function setup() {
        ISOBoxer.addBoxProcessor('uuid', uuidProcessor);
        ISOBoxer.addBoxProcessor('saio', saioProcessor);
        ISOBoxer.addBoxProcessor('saiz', saizProcessor);
        ISOBoxer.addBoxProcessor('senc', sencProcessor);

        mssFragmentMoovProcessor = (0, _MssFragmentMoovProcessor2['default'])(context).create({
            protectionController: protectionController,
            constants: config.constants,
            ISOBoxer: ISOBoxer });

        mssFragmentMoofProcessor = (0, _MssFragmentMoofProcessor2['default'])(context).create({
            dashMetrics: dashMetrics,
            playbackController: playbackController,
            ISOBoxer: ISOBoxer,
            eventBus: eventBus,
            debug: debug,
            errHandler: config.errHandler
        });
    }

    function generateMoov(rep) {
        return mssFragmentMoovProcessor.generateMoov(rep);
    }

    function processFragment(e, streamProcessor) {
        if (!e || !e.request || !e.response) {
            throw new Error('e parameter is missing or malformed');
        }

        if (e.request.type === 'MediaSegment') {
            // MediaSegment => convert to Smooth Streaming moof format
            mssFragmentMoofProcessor.convertFragment(e, streamProcessor);
        } else if (e.request.type === 'FragmentInfoSegment') {
            // FragmentInfo (live) => update segments list
            mssFragmentMoofProcessor.updateSegmentList(e, streamProcessor);

            // Stop event propagation (FragmentInfo must not be added to buffer)
            e.sender = null;
        }
    }

    instance = {
        generateMoov: generateMoov,
        processFragment: processFragment
    };

    setup();

    return instance;
}

MssFragmentProcessor.__dashjs_factory_name = 'MssFragmentProcessor';
exports['default'] = dashjs.FactoryMaker.getClassFactory(MssFragmentProcessor);
/* jshint ignore:line */
module.exports = exports['default'];

},{"./MssFragmentMoofProcessor":6,"./MssFragmentMoovProcessor":7}],9:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _streamingVoDataChunk = _dereq_('../streaming/vo/DataChunk');

var _streamingVoDataChunk2 = _interopRequireDefault(_streamingVoDataChunk);

var _streamingVoFragmentRequest = _dereq_('../streaming/vo/FragmentRequest');

var _streamingVoFragmentRequest2 = _interopRequireDefault(_streamingVoFragmentRequest);

var _MssFragmentInfoController = _dereq_('./MssFragmentInfoController');

var _MssFragmentInfoController2 = _interopRequireDefault(_MssFragmentInfoController);

var _MssFragmentProcessor = _dereq_('./MssFragmentProcessor');

var _MssFragmentProcessor2 = _interopRequireDefault(_MssFragmentProcessor);

var _parserMssParser = _dereq_('./parser/MssParser');

var _parserMssParser2 = _interopRequireDefault(_parserMssParser);

var _errorsMssErrors = _dereq_('./errors/MssErrors');

var _errorsMssErrors2 = _interopRequireDefault(_errorsMssErrors);

var _streamingVoDashJSError = _dereq_('../streaming/vo/DashJSError');

var _streamingVoDashJSError2 = _interopRequireDefault(_streamingVoDashJSError);

var _streamingUtilsInitCache = _dereq_('../streaming/utils/InitCache');

var _streamingUtilsInitCache2 = _interopRequireDefault(_streamingUtilsInitCache);

function MssHandler(config) {

    config = config || {};
    var context = this.context;
    var eventBus = config.eventBus;
    var events = config.events;
    var constants = config.constants;
    var initSegmentType = config.initSegmentType;
    var dashMetrics = config.dashMetrics;
    var playbackController = config.playbackController;
    var streamController = config.streamController;
    var protectionController = config.protectionController;
    var mssFragmentProcessor = (0, _MssFragmentProcessor2['default'])(context).create({
        dashMetrics: dashMetrics,
        playbackController: playbackController,
        protectionController: protectionController,
        streamController: streamController,
        eventBus: eventBus,
        constants: constants,
        ISOBoxer: config.ISOBoxer,
        debug: config.debug,
        errHandler: config.errHandler
    });
    var mssParser = undefined,
        fragmentInfoControllers = undefined,
        initCache = undefined,
        instance = undefined;

    function setup() {
        fragmentInfoControllers = [];
        initCache = (0, _streamingUtilsInitCache2['default'])(context).getInstance();
    }

    function getStreamProcessor(type) {
        return streamController.getActiveStreamProcessors().filter(function (processor) {
            return processor.getType() === type;
        })[0];
    }

    function getFragmentInfoController(type) {
        return fragmentInfoControllers.filter(function (controller) {
            return controller.getType() === type;
        })[0];
    }

    function createDataChunk(request, streamId, endFragment) {
        var chunk = new _streamingVoDataChunk2['default']();

        chunk.streamId = streamId;
        chunk.mediaInfo = request.mediaInfo;
        chunk.segmentType = request.type;
        chunk.start = request.startTime;
        chunk.duration = request.duration;
        chunk.end = chunk.start + chunk.duration;
        chunk.index = request.index;
        chunk.quality = request.quality;
        chunk.representationId = request.representationId;
        chunk.endFragment = endFragment;

        return chunk;
    }

    function startFragmentInfoControllers() {

        // Create MssFragmentInfoControllers for each StreamProcessor of active stream (only for audio, video or fragmentedText)
        var processors = streamController.getActiveStreamProcessors();
        processors.forEach(function (processor) {
            if (processor.getType() === constants.VIDEO || processor.getType() === constants.AUDIO || processor.getType() === constants.FRAGMENTED_TEXT) {

                var fragmentInfoController = getFragmentInfoController(processor.getType());
                if (!fragmentInfoController) {
                    fragmentInfoController = (0, _MssFragmentInfoController2['default'])(context).create({
                        streamProcessor: processor,
                        baseURLController: config.baseURLController,
                        debug: config.debug
                    });
                    fragmentInfoController.initialize();
                    fragmentInfoControllers.push(fragmentInfoController);
                }
                fragmentInfoController.start();
            }
        });
    }

    function stopFragmentInfoControllers() {
        fragmentInfoControllers.forEach(function (c) {
            c.reset();
        });
        fragmentInfoControllers = [];
    }

    function onInitFragmentNeeded(e) {
        var streamProcessor = getStreamProcessor(e.mediaType);
        if (!streamProcessor) return;

        // Create init segment request
        var representationController = streamProcessor.getRepresentationController();
        var representation = representationController.getCurrentRepresentation();
        var mediaInfo = streamProcessor.getMediaInfo();

        var request = new _streamingVoFragmentRequest2['default']();
        request.mediaType = representation.adaptation.type;
        request.type = initSegmentType;
        request.range = representation.range;
        request.quality = representation.index;
        request.mediaInfo = mediaInfo;
        request.representationId = representation.id;

        var chunk = createDataChunk(request, mediaInfo.streamInfo.id, e.type !== events.FRAGMENT_LOADING_PROGRESS);

        try {
            // Generate init segment (moov)
            chunk.bytes = mssFragmentProcessor.generateMoov(representation);

            // Notify init segment has been loaded
            eventBus.trigger(events.INIT_FRAGMENT_LOADED, { chunk: chunk }, { streamId: mediaInfo.streamInfo.id, mediaType: representation.adaptation.type });
        } catch (e) {
            config.errHandler.error(new _streamingVoDashJSError2['default'](e.code, e.message, e.data));
        }

        // Change the sender value to stop event to be propagated
        e.sender = null;
    }

    function onSegmentMediaLoaded(e) {
        if (e.error) return;

        var streamProcessor = getStreamProcessor(e.request.mediaType);
        if (!streamProcessor) return;

        // Process moof to transcode it from MSS to DASH (or to update segment timeline for SegmentInfo fragments)
        mssFragmentProcessor.processFragment(e, streamProcessor);

        if (e.request.type === 'FragmentInfoSegment') {
            // If FragmentInfo loaded, then notify corresponding MssFragmentInfoController
            var fragmentInfoController = getFragmentInfoController(e.request.mediaType);
            if (fragmentInfoController) {
                fragmentInfoController.fragmentInfoLoaded(e);
            }
        }

        // Start MssFragmentInfoControllers in case of start-over streams
        var manifestInfo = e.request.mediaInfo.streamInfo.manifestInfo;
        if (!manifestInfo.isDynamic && manifestInfo.DVRWindowSize !== Infinity) {
            startFragmentInfoControllers();
        }
    }

    function onPlaybackPaused() {
        if (playbackController.getIsDynamic() && playbackController.getTime() !== 0) {
            startFragmentInfoControllers();
        }
    }

    function onPlaybackSeekAsked() {
        if (playbackController.getIsDynamic() && playbackController.getTime() !== 0) {
            startFragmentInfoControllers();
        }
    }

    function onTTMLPreProcess(ttmlSubtitles) {
        if (!ttmlSubtitles || !ttmlSubtitles.data) {
            return;
        }

        ttmlSubtitles.data = ttmlSubtitles.data.replace(/http:\/\/www.w3.org\/2006\/10\/ttaf1/gi, 'http://www.w3.org/ns/ttml');
    }

    function registerEvents() {
        eventBus.on(events.INIT_FRAGMENT_NEEDED, onInitFragmentNeeded, instance, { priority: dashjs.FactoryMaker.getSingletonFactoryByName(eventBus.getClassName()).EVENT_PRIORITY_HIGH }); /* jshint ignore:line */
        eventBus.on(events.PLAYBACK_PAUSED, onPlaybackPaused, instance, { priority: dashjs.FactoryMaker.getSingletonFactoryByName(eventBus.getClassName()).EVENT_PRIORITY_HIGH }); /* jshint ignore:line */
        eventBus.on(events.PLAYBACK_SEEK_ASKED, onPlaybackSeekAsked, instance, { priority: dashjs.FactoryMaker.getSingletonFactoryByName(eventBus.getClassName()).EVENT_PRIORITY_HIGH }); /* jshint ignore:line */
        eventBus.on(events.FRAGMENT_LOADING_COMPLETED, onSegmentMediaLoaded, instance, { priority: dashjs.FactoryMaker.getSingletonFactoryByName(eventBus.getClassName()).EVENT_PRIORITY_HIGH }); /* jshint ignore:line */
        eventBus.on(events.TTML_TO_PARSE, onTTMLPreProcess, instance);
    }

    function reset() {
        if (mssParser) {
            mssParser.reset();
            mssParser = undefined;
        }

        eventBus.off(events.INIT_FRAGMENT_NEEDED, onInitFragmentNeeded, this);
        eventBus.off(events.PLAYBACK_PAUSED, onPlaybackPaused, this);
        eventBus.off(events.PLAYBACK_SEEK_ASKED, onPlaybackSeekAsked, this);
        eventBus.off(events.FRAGMENT_LOADING_COMPLETED, onSegmentMediaLoaded, this);
        eventBus.off(events.TTML_TO_PARSE, onTTMLPreProcess, this);

        // Reset FragmentInfoControllers
        stopFragmentInfoControllers();
    }

    function createMssParser() {
        mssParser = (0, _parserMssParser2['default'])(context).create(config);
        return mssParser;
    }

    instance = {
        reset: reset,
        createMssParser: createMssParser,
        registerEvents: registerEvents
    };

    setup();

    return instance;
}

MssHandler.__dashjs_factory_name = 'MssHandler';
var factory = dashjs.FactoryMaker.getClassFactory(MssHandler); /* jshint ignore:line */
factory.errors = _errorsMssErrors2['default'];
dashjs.FactoryMaker.updateClassFactory(MssHandler.__dashjs_factory_name, factory); /* jshint ignore:line */
exports['default'] = factory;
/* jshint ignore:line */
module.exports = exports['default'];

},{"../streaming/utils/InitCache":14,"../streaming/vo/DashJSError":15,"../streaming/vo/DataChunk":16,"../streaming/vo/FragmentRequest":17,"./MssFragmentInfoController":5,"./MssFragmentProcessor":8,"./errors/MssErrors":10,"./parser/MssParser":12}],10:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreErrorsErrorsBase = _dereq_('../../core/errors/ErrorsBase');

var _coreErrorsErrorsBase2 = _interopRequireDefault(_coreErrorsErrorsBase);

/**
 * @class
 *
 */

var MssErrors = (function (_ErrorsBase) {
  _inherits(MssErrors, _ErrorsBase);

  function MssErrors() {
    _classCallCheck(this, MssErrors);

    _get(Object.getPrototypeOf(MssErrors.prototype), 'constructor', this).call(this);
    /**
     * Error code returned when no tfrf box is detected in MSS live stream
     */
    this.MSS_NO_TFRF_CODE = 200;

    /**
     * Error code returned when one of the codecs defined in the manifest is not supported
     */
    this.MSS_UNSUPPORTED_CODEC_CODE = 201;

    this.MSS_NO_TFRF_MESSAGE = 'Missing tfrf in live media segment';
    this.MSS_UNSUPPORTED_CODEC_MESSAGE = 'Unsupported codec';
  }

  return MssErrors;
})(_coreErrorsErrorsBase2['default']);

var mssErrors = new MssErrors();
exports['default'] = mssErrors;
module.exports = exports['default'];

},{"../../core/errors/ErrorsBase":3}],11:[function(_dereq_,module,exports){
(function (global){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _MssHandler = _dereq_('./MssHandler');

var _MssHandler2 = _interopRequireDefault(_MssHandler);

// Shove both of these into the global scope
var context = typeof window !== 'undefined' && window || global;

var dashjs = context.dashjs;
if (!dashjs) {
  dashjs = context.dashjs = {};
}

dashjs.MssHandler = _MssHandler2['default'];

exports['default'] = dashjs;
exports.MssHandler = _MssHandler2['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./MssHandler":9}],12:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @module MssParser
 * @ignore
 * @param {Object} config object
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _externalsBigInteger = _dereq_('../../../externals/BigInteger');

var _externalsBigInteger2 = _interopRequireDefault(_externalsBigInteger);

function MssParser(config) {
    config = config || {};
    var BASE64 = config.BASE64;
    var debug = config.debug;
    var constants = config.constants;
    var manifestModel = config.manifestModel;
    var mediaPlayerModel = config.mediaPlayerModel;
    var settings = config.settings;

    var DEFAULT_TIME_SCALE = 10000000.0;
    var SUPPORTED_CODECS = ['AAC', 'AACL', 'AVC1', 'H264', 'TTML', 'DFXP'];
    // MPEG-DASH Role and accessibility mapping for text tracks according to ETSI TS 103 285 v1.1.1 (section 7.1.2)
    var ROLE = {
        'CAPT': 'main',
        'SUBT': 'alternate',
        'DESC': 'main'
    };
    var ACCESSIBILITY = {
        'DESC': '2'
    };
    var samplingFrequencyIndex = {
        96000: 0x0,
        88200: 0x1,
        64000: 0x2,
        48000: 0x3,
        44100: 0x4,
        32000: 0x5,
        24000: 0x6,
        22050: 0x7,
        16000: 0x8,
        12000: 0x9,
        11025: 0xA,
        8000: 0xB,
        7350: 0xC
    };
    var mimeTypeMap = {
        'video': 'video/mp4',
        'audio': 'audio/mp4',
        'text': 'application/mp4'
    };

    var instance = undefined,
        logger = undefined,
        initialBufferSettings = undefined;

    function setup() {
        logger = debug.getLogger(instance);
    }

    function mapPeriod(smoothStreamingMedia, timescale) {
        var period = {};
        var streams = undefined,
            adaptation = undefined;

        // For each StreamIndex node, create an AdaptationSet element
        period.AdaptationSet_asArray = [];
        streams = smoothStreamingMedia.getElementsByTagName('StreamIndex');
        for (var i = 0; i < streams.length; i++) {
            adaptation = mapAdaptationSet(streams[i], timescale);
            if (adaptation !== null) {
                period.AdaptationSet_asArray.push(adaptation);
            }
        }

        if (period.AdaptationSet_asArray.length > 0) {
            period.AdaptationSet = period.AdaptationSet_asArray.length > 1 ? period.AdaptationSet_asArray : period.AdaptationSet_asArray[0];
        }

        return period;
    }

    function mapAdaptationSet(streamIndex, timescale) {
        var adaptationSet = {};
        var representations = [];
        var segmentTemplate = undefined;
        var qualityLevels = undefined,
            representation = undefined,
            segments = undefined,
            i = undefined;

        var name = streamIndex.getAttribute('Name');
        var type = streamIndex.getAttribute('Type');
        var lang = streamIndex.getAttribute('Language');
        var fallBackId = lang ? type + '_' + lang : type;

        adaptationSet.id = name || fallBackId;
        adaptationSet.contentType = type;
        adaptationSet.lang = lang || 'und';
        adaptationSet.mimeType = mimeTypeMap[type];
        adaptationSet.subType = streamIndex.getAttribute('Subtype');
        adaptationSet.maxWidth = streamIndex.getAttribute('MaxWidth');
        adaptationSet.maxHeight = streamIndex.getAttribute('MaxHeight');

        // Map text tracks subTypes to MPEG-DASH AdaptationSet role and accessibility (see ETSI TS 103 285 v1.1.1, section 7.1.2)
        if (adaptationSet.subType) {
            if (ROLE[adaptationSet.subType]) {
                var role = {
                    schemeIdUri: 'urn:mpeg:dash:role:2011',
                    value: ROLE[adaptationSet.subType]
                };
                adaptationSet.Role = role;
                adaptationSet.Role_asArray = [role];
            }
            if (ACCESSIBILITY[adaptationSet.subType]) {
                var accessibility = {
                    schemeIdUri: 'urn:tva:metadata:cs:AudioPurposeCS:2007',
                    value: ACCESSIBILITY[adaptationSet.subType]
                };
                adaptationSet.Accessibility = accessibility;
                adaptationSet.Accessibility_asArray = [accessibility];
            }
        }

        // Create a SegmentTemplate with a SegmentTimeline
        segmentTemplate = mapSegmentTemplate(streamIndex, timescale);

        qualityLevels = streamIndex.getElementsByTagName('QualityLevel');
        // For each QualityLevel node, create a Representation element
        for (i = 0; i < qualityLevels.length; i++) {
            // Propagate BaseURL and mimeType
            qualityLevels[i].BaseURL = adaptationSet.BaseURL;
            qualityLevels[i].mimeType = adaptationSet.mimeType;

            // Set quality level id
            qualityLevels[i].Id = adaptationSet.id + '_' + qualityLevels[i].getAttribute('Index');

            // Map Representation to QualityLevel
            representation = mapRepresentation(qualityLevels[i], streamIndex);

            if (representation !== null) {
                // Copy SegmentTemplate into Representation
                representation.SegmentTemplate = segmentTemplate;

                representations.push(representation);
            }
        }

        if (representations.length === 0) {
            return null;
        }

        adaptationSet.Representation = representations.length > 1 ? representations : representations[0];
        adaptationSet.Representation_asArray = representations;

        // Set SegmentTemplate
        adaptationSet.SegmentTemplate = segmentTemplate;

        segments = segmentTemplate.SegmentTimeline.S_asArray;

        return adaptationSet;
    }

    function mapRepresentation(qualityLevel, streamIndex) {
        var representation = {};
        var type = streamIndex.getAttribute('Type');
        var fourCCValue = null;

        representation.id = qualityLevel.Id;
        representation.bandwidth = parseInt(qualityLevel.getAttribute('Bitrate'), 10);
        representation.mimeType = qualityLevel.mimeType;
        representation.width = parseInt(qualityLevel.getAttribute('MaxWidth'), 10);
        representation.height = parseInt(qualityLevel.getAttribute('MaxHeight'), 10);

        fourCCValue = qualityLevel.getAttribute('FourCC');

        // If FourCC not defined at QualityLevel level, then get it from StreamIndex level
        if (fourCCValue === null || fourCCValue === '') {
            fourCCValue = streamIndex.getAttribute('FourCC');
        }

        // If still not defined (optionnal for audio stream, see https://msdn.microsoft.com/en-us/library/ff728116%28v=vs.95%29.aspx),
        // then we consider the stream is an audio AAC stream
        if (fourCCValue === null || fourCCValue === '') {
            if (type === constants.AUDIO) {
                fourCCValue = 'AAC';
            } else if (type === constants.VIDEO) {
                logger.debug('FourCC is not defined whereas it is required for a QualityLevel element for a StreamIndex of type "video"');
                return null;
            }
        }

        // Check if codec is supported
        if (SUPPORTED_CODECS.indexOf(fourCCValue.toUpperCase()) === -1) {
            // Do not send warning
            logger.warn('Codec not supported: ' + fourCCValue);
            return null;
        }

        // Get codecs value according to FourCC field
        if (fourCCValue === 'H264' || fourCCValue === 'AVC1') {
            representation.codecs = getH264Codec(qualityLevel);
        } else if (fourCCValue.indexOf('AAC') >= 0) {
            representation.codecs = getAACCodec(qualityLevel, fourCCValue);
            representation.audioSamplingRate = parseInt(qualityLevel.getAttribute('SamplingRate'), 10);
            representation.audioChannels = parseInt(qualityLevel.getAttribute('Channels'), 10);
        } else if (fourCCValue.indexOf('TTML') || fourCCValue.indexOf('DFXP')) {
            representation.codecs = constants.STPP;
        }

        representation.codecPrivateData = '' + qualityLevel.getAttribute('CodecPrivateData');
        representation.BaseURL = qualityLevel.BaseURL;

        return representation;
    }

    function getH264Codec(qualityLevel) {
        var codecPrivateData = qualityLevel.getAttribute('CodecPrivateData').toString();
        var nalHeader = undefined,
            avcoti = undefined;

        // Extract from the CodecPrivateData field the hexadecimal representation of the following
        // three bytes in the sequence parameter set NAL unit.
        // => Find the SPS nal header
        nalHeader = /00000001[0-9]7/.exec(codecPrivateData);
        // => Find the 6 characters after the SPS nalHeader (if it exists)
        avcoti = nalHeader && nalHeader[0] ? codecPrivateData.substr(codecPrivateData.indexOf(nalHeader[0]) + 10, 6) : undefined;

        return 'avc1.' + avcoti;
    }

    function getAACCodec(qualityLevel, fourCCValue) {
        var samplingRate = parseInt(qualityLevel.getAttribute('SamplingRate'), 10);
        var codecPrivateData = qualityLevel.getAttribute('CodecPrivateData').toString();
        var objectType = 0;
        var codecPrivateDataHex = undefined,
            arr16 = undefined,
            indexFreq = undefined,
            extensionSamplingFrequencyIndex = undefined;

        //chrome problem, in implicit AAC HE definition, so when AACH is detected in FourCC
        //set objectType to 5 => strange, it should be 2
        if (fourCCValue === 'AACH') {
            objectType = 0x05;
        }
        //if codecPrivateData is empty, build it :
        if (codecPrivateData === undefined || codecPrivateData === '') {
            objectType = 0x02; //AAC Main Low Complexity => object Type = 2
            indexFreq = samplingFrequencyIndex[samplingRate];
            if (fourCCValue === 'AACH') {
                // 4 bytes :     XXXXX         XXXX          XXXX             XXXX                  XXXXX      XXX   XXXXXXX
                //           ' ObjectType' 'Freq Index' 'Channels value'   'Extens Sampl Freq'  'ObjectType'  'GAS' 'alignment = 0'
                objectType = 0x05; // High Efficiency AAC Profile = object Type = 5 SBR
                codecPrivateData = new Uint8Array(4);
                extensionSamplingFrequencyIndex = samplingFrequencyIndex[samplingRate * 2]; // in HE AAC Extension Sampling frequence
                // equals to SamplingRate*2
                //Freq Index is present for 3 bits in the first byte, last bit is in the second
                codecPrivateData[0] = objectType << 3 | indexFreq >> 1;
                codecPrivateData[1] = indexFreq << 7 | qualityLevel.Channels << 3 | extensionSamplingFrequencyIndex >> 1;
                codecPrivateData[2] = extensionSamplingFrequencyIndex << 7 | 0x02 << 2; // origin object type equals to 2 => AAC Main Low Complexity
                codecPrivateData[3] = 0x0; //alignment bits

                arr16 = new Uint16Array(2);
                arr16[0] = (codecPrivateData[0] << 8) + codecPrivateData[1];
                arr16[1] = (codecPrivateData[2] << 8) + codecPrivateData[3];
                //convert decimal to hex value
                codecPrivateDataHex = arr16[0].toString(16);
                codecPrivateDataHex = arr16[0].toString(16) + arr16[1].toString(16);
            } else {
                // 2 bytes :     XXXXX         XXXX          XXXX              XXX
                //           ' ObjectType' 'Freq Index' 'Channels value'   'GAS = 000'
                codecPrivateData = new Uint8Array(2);
                //Freq Index is present for 3 bits in the first byte, last bit is in the second
                codecPrivateData[0] = objectType << 3 | indexFreq >> 1;
                codecPrivateData[1] = indexFreq << 7 | parseInt(qualityLevel.getAttribute('Channels'), 10) << 3;
                // put the 2 bytes in an 16 bits array
                arr16 = new Uint16Array(1);
                arr16[0] = (codecPrivateData[0] << 8) + codecPrivateData[1];
                //convert decimal to hex value
                codecPrivateDataHex = arr16[0].toString(16);
            }

            codecPrivateData = '' + codecPrivateDataHex;
            codecPrivateData = codecPrivateData.toUpperCase();
            qualityLevel.setAttribute('CodecPrivateData', codecPrivateData);
        } else if (objectType === 0) {
            objectType = (parseInt(codecPrivateData.substr(0, 2), 16) & 0xF8) >> 3;
        }

        return 'mp4a.40.' + objectType;
    }

    function mapSegmentTemplate(streamIndex, timescale) {
        var segmentTemplate = {};
        var mediaUrl = undefined,
            streamIndexTimeScale = undefined,
            url = undefined;

        url = streamIndex.getAttribute('Url');
        mediaUrl = url ? url.replace('{bitrate}', '$Bandwidth$') : null;
        mediaUrl = mediaUrl ? mediaUrl.replace('{start time}', '$Time$') : null;

        streamIndexTimeScale = streamIndex.getAttribute('TimeScale');
        streamIndexTimeScale = streamIndexTimeScale ? parseFloat(streamIndexTimeScale) : timescale;

        segmentTemplate.media = mediaUrl;
        segmentTemplate.timescale = streamIndexTimeScale;

        segmentTemplate.SegmentTimeline = mapSegmentTimeline(streamIndex, segmentTemplate.timescale);

        return segmentTemplate;
    }

    function mapSegmentTimeline(streamIndex, timescale) {
        var segmentTimeline = {};
        var chunks = streamIndex.getElementsByTagName('c');
        var segments = [];
        var segment = undefined,
            prevSegment = undefined,
            tManifest = undefined,
            i = undefined,
            j = undefined,
            r = undefined;
        var duration = 0;

        for (i = 0; i < chunks.length; i++) {
            segment = {};

            // Get time 't' attribute value
            tManifest = chunks[i].getAttribute('t');

            // => segment.tManifest = original timestamp value as a string (for constructing the fragment request url, see DashHandler)
            // => segment.t = number value of timestamp (maybe rounded value, but only for 0.1 microsecond)
            if (tManifest && (0, _externalsBigInteger2['default'])(tManifest).greater((0, _externalsBigInteger2['default'])(Number.MAX_SAFE_INTEGER))) {
                segment.tManifest = tManifest;
            }
            segment.t = parseFloat(tManifest);

            // Get duration 'd' attribute value
            segment.d = parseFloat(chunks[i].getAttribute('d'));

            // If 't' not defined for first segment then t=0
            if (i === 0 && !segment.t) {
                segment.t = 0;
            }

            if (i > 0) {
                prevSegment = segments[segments.length - 1];
                // Update previous segment duration if not defined
                if (!prevSegment.d) {
                    if (prevSegment.tManifest) {
                        prevSegment.d = (0, _externalsBigInteger2['default'])(tManifest).subtract((0, _externalsBigInteger2['default'])(prevSegment.tManifest)).toJSNumber();
                    } else {
                        prevSegment.d = segment.t - prevSegment.t;
                    }
                    duration += prevSegment.d;
                }
                // Set segment absolute timestamp if not set in manifest
                if (!segment.t) {
                    if (prevSegment.tManifest) {
                        segment.tManifest = (0, _externalsBigInteger2['default'])(prevSegment.tManifest).add((0, _externalsBigInteger2['default'])(prevSegment.d)).toString();
                        segment.t = parseFloat(segment.tManifest);
                    } else {
                        segment.t = prevSegment.t + prevSegment.d;
                    }
                }
            }

            if (segment.d) {
                duration += segment.d;
            }

            // Create new segment
            segments.push(segment);

            // Support for 'r' attribute (i.e. "repeat" as in MPEG-DASH)
            r = parseFloat(chunks[i].getAttribute('r'));
            if (r) {

                for (j = 0; j < r - 1; j++) {
                    prevSegment = segments[segments.length - 1];
                    segment = {};
                    segment.t = prevSegment.t + prevSegment.d;
                    segment.d = prevSegment.d;
                    if (prevSegment.tManifest) {
                        segment.tManifest = (0, _externalsBigInteger2['default'])(prevSegment.tManifest).add((0, _externalsBigInteger2['default'])(prevSegment.d)).toString();
                    }
                    duration += segment.d;
                    segments.push(segment);
                }
            }
        }

        segmentTimeline.S = segments;
        segmentTimeline.S_asArray = segments;
        segmentTimeline.duration = duration / timescale;

        return segmentTimeline;
    }

    function getKIDFromProtectionHeader(protectionHeader) {
        var prHeader = undefined,
            wrmHeader = undefined,
            xmlReader = undefined,
            KID = undefined;

        // Get PlayReady header as byte array (base64 decoded)
        prHeader = BASE64.decodeArray(protectionHeader.firstChild.data);

        // Get Right Management header (WRMHEADER) from PlayReady header
        wrmHeader = getWRMHeaderFromPRHeader(prHeader);

        if (wrmHeader) {
            // Convert from multi-byte to unicode
            wrmHeader = new Uint16Array(wrmHeader.buffer);

            // Convert to string
            wrmHeader = String.fromCharCode.apply(null, wrmHeader);

            // Parse <WRMHeader> to get KID field value
            xmlReader = new DOMParser().parseFromString(wrmHeader, 'application/xml');
            KID = xmlReader.querySelector('KID').textContent;

            // Get KID (base64 decoded) as byte array
            KID = BASE64.decodeArray(KID);

            // Convert UUID from little-endian to big-endian
            convertUuidEndianness(KID);
        }

        return KID;
    }

    function getWRMHeaderFromPRHeader(prHeader) {
        var length = undefined,
            recordCount = undefined,
            recordType = undefined,
            recordLength = undefined,
            recordValue = undefined;
        var i = 0;

        // Parse PlayReady header

        // Length - 32 bits (LE format)
        length = (prHeader[i + 3] << 24) + (prHeader[i + 2] << 16) + (prHeader[i + 1] << 8) + prHeader[i];
        i += 4;

        // Record count - 16 bits (LE format)
        recordCount = (prHeader[i + 1] << 8) + prHeader[i];
        i += 2;

        // Parse records
        while (i < prHeader.length) {
            // Record type - 16 bits (LE format)
            recordType = (prHeader[i + 1] << 8) + prHeader[i];
            i += 2;

            // Check if Rights Management header (record type = 0x01)
            if (recordType === 0x01) {

                // Record length - 16 bits (LE format)
                recordLength = (prHeader[i + 1] << 8) + prHeader[i];
                i += 2;

                // Record value => contains <WRMHEADER>
                recordValue = new Uint8Array(recordLength);
                recordValue.set(prHeader.subarray(i, i + recordLength));
                return recordValue;
            }
        }

        return null;
    }

    function convertUuidEndianness(uuid) {
        swapBytes(uuid, 0, 3);
        swapBytes(uuid, 1, 2);
        swapBytes(uuid, 4, 5);
        swapBytes(uuid, 6, 7);
    }

    function swapBytes(bytes, pos1, pos2) {
        var temp = bytes[pos1];
        bytes[pos1] = bytes[pos2];
        bytes[pos2] = temp;
    }

    function createPRContentProtection(protectionHeader) {
        var pro = {
            __text: protectionHeader.firstChild.data,
            __prefix: 'mspr'
        };
        return {
            schemeIdUri: 'urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95',
            value: 'com.microsoft.playready',
            pro: pro,
            pro_asArray: pro
        };
    }

    function createWidevineContentProtection(KID) {
        var widevineCP = {
            schemeIdUri: 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed',
            value: 'com.widevine.alpha'
        };
        if (!KID) return widevineCP;
        // Create Widevine CENC header (Protocol Buffer) with KID value
        var wvCencHeader = new Uint8Array(2 + KID.length);
        wvCencHeader[0] = 0x12;
        wvCencHeader[1] = 0x10;
        wvCencHeader.set(KID, 2);

        // Create a pssh box
        var length = 12 /* box length, type, version and flags */ + 16 /* SystemID */ + 4 /* data length */ + wvCencHeader.length;
        var pssh = new Uint8Array(length);
        var i = 0;

        // Set box length value
        pssh[i++] = (length & 0xFF000000) >> 24;
        pssh[i++] = (length & 0x00FF0000) >> 16;
        pssh[i++] = (length & 0x0000FF00) >> 8;
        pssh[i++] = length & 0x000000FF;

        // Set type ('pssh'), version (0) and flags (0)
        pssh.set([0x70, 0x73, 0x73, 0x68, 0x00, 0x00, 0x00, 0x00], i);
        i += 8;

        // Set SystemID ('edef8ba9-79d6-4ace-a3c8-27dcd51d21ed')
        pssh.set([0xed, 0xef, 0x8b, 0xa9, 0x79, 0xd6, 0x4a, 0xce, 0xa3, 0xc8, 0x27, 0xdc, 0xd5, 0x1d, 0x21, 0xed], i);
        i += 16;

        // Set data length value
        pssh[i++] = (wvCencHeader.length & 0xFF000000) >> 24;
        pssh[i++] = (wvCencHeader.length & 0x00FF0000) >> 16;
        pssh[i++] = (wvCencHeader.length & 0x0000FF00) >> 8;
        pssh[i++] = wvCencHeader.length & 0x000000FF;

        // Copy Widevine CENC header
        pssh.set(wvCencHeader, i);

        // Convert to BASE64 string
        pssh = String.fromCharCode.apply(null, pssh);
        pssh = BASE64.encodeASCII(pssh);

        widevineCP.pssh = { __text: pssh };

        return widevineCP;
    }

    function processManifest(xmlDoc, manifestLoadedTime) {
        var manifest = {};
        var contentProtections = [];
        var smoothStreamingMedia = xmlDoc.getElementsByTagName('SmoothStreamingMedia')[0];
        var protection = xmlDoc.getElementsByTagName('Protection')[0];
        var protectionHeader = null;
        var period = undefined,
            adaptations = undefined,
            contentProtection = undefined,
            KID = undefined,
            timestampOffset = undefined,
            startTime = undefined,
            segments = undefined,
            timescale = undefined,
            segmentDuration = undefined,
            i = undefined,
            j = undefined;

        // Set manifest node properties
        manifest.protocol = 'MSS';
        manifest.profiles = 'urn:mpeg:dash:profile:isoff-live:2011';
        manifest.type = smoothStreamingMedia.getAttribute('IsLive') === 'TRUE' ? 'dynamic' : 'static';
        timescale = smoothStreamingMedia.getAttribute('TimeScale');
        manifest.timescale = timescale ? parseFloat(timescale) : DEFAULT_TIME_SCALE;
        var dvrWindowLength = parseFloat(smoothStreamingMedia.getAttribute('DVRWindowLength'));
        // If the DVRWindowLength field is omitted for a live presentation or set to 0, the DVR window is effectively infinite
        if (manifest.type === 'dynamic' && (dvrWindowLength === 0 || isNaN(dvrWindowLength))) {
            dvrWindowLength = Infinity;
        }
        // Star-over
        if (dvrWindowLength === 0 && smoothStreamingMedia.getAttribute('CanSeek') === 'TRUE') {
            dvrWindowLength = Infinity;
        }

        if (dvrWindowLength > 0) {
            manifest.timeShiftBufferDepth = dvrWindowLength / manifest.timescale;
        }

        var duration = parseFloat(smoothStreamingMedia.getAttribute('Duration'));
        manifest.mediaPresentationDuration = duration === 0 ? Infinity : duration / manifest.timescale;
        // By default, set minBufferTime to 2 sec. (but set below according to video segment duration)
        manifest.minBufferTime = 2;
        manifest.ttmlTimeIsRelative = true;

        // Live manifest with Duration = start-over
        if (manifest.type === 'dynamic' && duration > 0) {
            manifest.type = 'static';
            // We set timeShiftBufferDepth to initial duration, to be used by MssFragmentController to update segment timeline
            manifest.timeShiftBufferDepth = duration / manifest.timescale;
            // Duration will be set according to current segment timeline duration (see below)
        }

        if (manifest.type === 'dynamic' && manifest.timeShiftBufferDepth < Infinity) {
            manifest.refreshManifestOnSwitchTrack = true; // Refresh manifest when switching tracks
            manifest.doNotUpdateDVRWindowOnBufferUpdated = true; // DVRWindow is update by MssFragmentMoofPocessor based on tfrf boxes
            manifest.ignorePostponeTimePeriod = true; // Never update manifest
        }

        // Map period node to manifest root node
        manifest.Period = mapPeriod(smoothStreamingMedia, manifest.timescale);
        manifest.Period_asArray = [manifest.Period];

        // Initialize period start time
        period = manifest.Period;
        period.start = 0;

        // Uncomment to test live to static manifests
        // if (manifest.type !== 'static') {
        //     manifest.type = 'static';
        //     manifest.mediaPresentationDuration = manifest.timeShiftBufferDepth;
        //     manifest.timeShiftBufferDepth = null;
        // }

        // ContentProtection node
        if (protection !== undefined) {
            protectionHeader = xmlDoc.getElementsByTagName('ProtectionHeader')[0];

            // Some packagers put newlines into the ProtectionHeader base64 string, which is not good
            // because this cannot be correctly parsed. Let's just filter out any newlines found in there.
            protectionHeader.firstChild.data = protectionHeader.firstChild.data.replace(/\n|\r/g, '');

            // Get KID (in CENC format) from protection header
            KID = getKIDFromProtectionHeader(protectionHeader);

            // Create ContentProtection for PlayReady
            contentProtection = createPRContentProtection(protectionHeader);
            contentProtection['cenc:default_KID'] = KID;
            contentProtections.push(contentProtection);

            // Create ContentProtection for Widevine (as a CENC protection)
            contentProtection = createWidevineContentProtection(KID);
            contentProtection['cenc:default_KID'] = KID;
            contentProtections.push(contentProtection);

            manifest.ContentProtection = contentProtections;
            manifest.ContentProtection_asArray = contentProtections;
        }

        adaptations = period.AdaptationSet_asArray;

        for (i = 0; i < adaptations.length; i += 1) {
            adaptations[i].SegmentTemplate.initialization = '$Bandwidth$';
            // Propagate content protection information into each adaptation
            if (manifest.ContentProtection !== undefined) {
                adaptations[i].ContentProtection = manifest.ContentProtection;
                adaptations[i].ContentProtection_asArray = manifest.ContentProtection_asArray;
            }

            if (adaptations[i].contentType === 'video') {
                // Get video segment duration
                segmentDuration = adaptations[i].SegmentTemplate.SegmentTimeline.S_asArray[0].d / adaptations[i].SegmentTemplate.timescale;
                // Set minBufferTime to one segment duration
                manifest.minBufferTime = segmentDuration;

                if (manifest.type === 'dynamic') {
                    // Set availabilityStartTime
                    segments = adaptations[i].SegmentTemplate.SegmentTimeline.S_asArray;
                    var endTime = (segments[segments.length - 1].t + segments[segments.length - 1].d) / adaptations[i].SegmentTemplate.timescale * 1000;
                    manifest.availabilityStartTime = new Date(manifestLoadedTime.getTime() - endTime);

                    // Match timeShiftBufferDepth to video segment timeline duration
                    if (manifest.timeShiftBufferDepth > 0 && manifest.timeShiftBufferDepth !== Infinity && manifest.timeShiftBufferDepth > adaptations[i].SegmentTemplate.SegmentTimeline.duration) {
                        manifest.timeShiftBufferDepth = adaptations[i].SegmentTemplate.SegmentTimeline.duration;
                    }
                }
            }
        }

        // Cap minBufferTime to timeShiftBufferDepth
        manifest.minBufferTime = Math.min(manifest.minBufferTime, manifest.timeShiftBufferDepth ? manifest.timeShiftBufferDepth : Infinity);

        // In case of live streams:
        // 1- configure player buffering properties according to target live delay
        // 2- adapt live delay and then buffers length in case timeShiftBufferDepth is too small compared to target live delay (see PlaybackController.computeLiveDelay())
        if (manifest.type === 'dynamic') {
            var targetLiveDelay = mediaPlayerModel.getLiveDelay();
            if (!targetLiveDelay) {
                var liveDelayFragmentCount = settings.get().streaming.liveDelayFragmentCount !== null && !isNaN(settings.get().streaming.liveDelayFragmentCount) ? settings.get().streaming.liveDelayFragmentCount : 4;
                targetLiveDelay = segmentDuration * liveDelayFragmentCount;
            }
            var targetDelayCapping = Math.max(manifest.timeShiftBufferDepth - 10, /*END_OF_PLAYLIST_PADDING*/manifest.timeShiftBufferDepth / 2);
            var liveDelay = Math.min(targetDelayCapping, targetLiveDelay);
            // Consider a margin of one segment in order to avoid Precondition Failed errors (412), for example if audio and video are not correctly synchronized
            var bufferTime = liveDelay - segmentDuration;

            // Store initial buffer settings
            initialBufferSettings = {
                'streaming': {
                    'liveDelay': settings.get().streaming.liveDelay,
                    'stableBufferTime': settings.get().streaming.stableBufferTime,
                    'bufferTimeAtTopQuality': settings.get().streaming.bufferTimeAtTopQuality,
                    'bufferTimeAtTopQualityLongForm': settings.get().streaming.bufferTimeAtTopQualityLongForm
                }
            };

            settings.update({
                'streaming': {
                    'liveDelay': liveDelay,
                    'stableBufferTime': bufferTime,
                    'bufferTimeAtTopQuality': bufferTime,
                    'bufferTimeAtTopQualityLongForm': bufferTime
                }
            });
        }

        // Delete Content Protection under root manifest node
        delete manifest.ContentProtection;
        delete manifest.ContentProtection_asArray;

        // In case of VOD streams, check if start time is greater than 0
        // Then determine timestamp offset according to higher audio/video start time
        // (use case = live stream delinearization)
        if (manifest.type === 'static') {
            // In case of start-over stream and manifest reloading (due to track switch)
            // we consider previous timestampOffset to keep timelines synchronized
            var prevManifest = manifestModel.getValue();
            if (prevManifest && prevManifest.timestampOffset) {
                timestampOffset = prevManifest.timestampOffset;
            } else {
                for (i = 0; i < adaptations.length; i++) {
                    if (adaptations[i].contentType === constants.AUDIO || adaptations[i].contentType === constants.VIDEO) {
                        segments = adaptations[i].SegmentTemplate.SegmentTimeline.S_asArray;
                        startTime = segments[0].t;
                        if (timestampOffset === undefined) {
                            timestampOffset = startTime;
                        }
                        timestampOffset = Math.min(timestampOffset, startTime);
                        // Correct content duration according to minimum adaptation's segment timeline duration
                        // in order to force <video> element sending 'ended' event
                        manifest.mediaPresentationDuration = Math.min(manifest.mediaPresentationDuration, adaptations[i].SegmentTemplate.SegmentTimeline.duration);
                    }
                }
            }
            if (timestampOffset > 0) {
                // Patch segment templates timestamps and determine period start time (since audio/video should not be aligned to 0)
                manifest.timestampOffset = timestampOffset;
                for (i = 0; i < adaptations.length; i++) {
                    segments = adaptations[i].SegmentTemplate.SegmentTimeline.S_asArray;
                    for (j = 0; j < segments.length; j++) {
                        if (!segments[j].tManifest) {
                            segments[j].tManifest = segments[j].t.toString();
                        }
                        segments[j].t -= timestampOffset;
                    }
                    if (adaptations[i].contentType === constants.AUDIO || adaptations[i].contentType === constants.VIDEO) {
                        period.start = Math.max(segments[0].t, period.start);
                        adaptations[i].SegmentTemplate.presentationTimeOffset = period.start;
                    }
                }
                period.start /= manifest.timescale;
            }
        }

        // Floor the duration to get around precision differences between segments timestamps and MSE buffer timestamps
        // and then avoid 'ended' event not being raised
        manifest.mediaPresentationDuration = Math.floor(manifest.mediaPresentationDuration * 1000) / 1000;
        period.duration = manifest.mediaPresentationDuration;

        return manifest;
    }

    function parseDOM(data) {
        var xmlDoc = null;

        if (window.DOMParser) {
            var parser = new window.DOMParser();

            xmlDoc = parser.parseFromString(data, 'text/xml');
            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                throw new Error('parsing the manifest failed');
            }
        }

        return xmlDoc;
    }

    function getMatchers() {
        return null;
    }

    function getIron() {
        return null;
    }

    function internalParse(data) {
        var xmlDoc = null;
        var manifest = null;

        var startTime = window.performance.now();

        // Parse the MSS XML manifest
        xmlDoc = parseDOM(data);

        var xmlParseTime = window.performance.now();

        if (xmlDoc === null) {
            return null;
        }

        // Convert MSS manifest into DASH manifest
        manifest = processManifest(xmlDoc, new Date());

        var mss2dashTime = window.performance.now();

        logger.info('Parsing complete: (xmlParsing: ' + (xmlParseTime - startTime).toPrecision(3) + 'ms, mss2dash: ' + (mss2dashTime - xmlParseTime).toPrecision(3) + 'ms, total: ' + ((mss2dashTime - startTime) / 1000).toPrecision(3) + 's)');

        return manifest;
    }

    function reset() {
        // Restore initial buffer settings
        if (initialBufferSettings) {
            settings.update(initialBufferSettings);
        }
    }

    instance = {
        parse: internalParse,
        getMatchers: getMatchers,
        getIron: getIron,
        reset: reset
    };

    setup();

    return instance;
}

MssParser.__dashjs_factory_name = 'MssParser';
exports['default'] = dashjs.FactoryMaker.getClassFactory(MssParser);
/* jshint ignore:line */
module.exports = exports['default'];

},{"../../../externals/BigInteger":1}],13:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreEventsEventsBase = _dereq_('../core/events/EventsBase');

var _coreEventsEventsBase2 = _interopRequireDefault(_coreEventsEventsBase);

/**
 * @class
 * @implements EventsBase
 */

var MediaPlayerEvents = (function (_EventsBase) {
  _inherits(MediaPlayerEvents, _EventsBase);

  /**
   * @description Public facing external events to be used when developing a player that implements dash.js.
   */

  function MediaPlayerEvents() {
    _classCallCheck(this, MediaPlayerEvents);

    _get(Object.getPrototypeOf(MediaPlayerEvents.prototype), 'constructor', this).call(this);
    /**
     * Triggered when playback will not start yet
     * as the MPD's availabilityStartTime is in the future.
     * Check delay property in payload to determine time before playback will start.
     * @event MediaPlayerEvents#AST_IN_FUTURE
     */
    this.AST_IN_FUTURE = 'astInFuture';

    /**
     * Triggered when the video element's buffer state changes to stalled.
     * Check mediaType in payload to determine type (Video, Audio, FragmentedText).
     * @event MediaPlayerEvents#BUFFER_EMPTY
     */
    this.BUFFER_EMPTY = 'bufferStalled';

    /**
     * Triggered when the video element's buffer state changes to loaded.
     * Check mediaType in payload to determine type (Video, Audio, FragmentedText).
     * @event MediaPlayerEvents#BUFFER_LOADED
     */
    this.BUFFER_LOADED = 'bufferLoaded';

    /**
     * Triggered when the video element's buffer state changes, either stalled or loaded. Check payload for state.
     * @event MediaPlayerEvents#BUFFER_LEVEL_STATE_CHANGED
     */
    this.BUFFER_LEVEL_STATE_CHANGED = 'bufferStateChanged';

    /**
     * Triggered when a dynamic stream changed to static (transition phase between Live and On-Demand).
     * @event MediaPlayerEvents#DYNAMIC_TO_STATIC
     */
    this.DYNAMIC_TO_STATIC = 'dynamicToStatic';

    /**
     * Triggered when there is an error from the element or MSE source buffer.
     * @event MediaPlayerEvents#ERROR
     */
    this.ERROR = 'error';
    /**
     * Triggered when a fragment download has completed.
     * @event MediaPlayerEvents#FRAGMENT_LOADING_COMPLETED
     */
    this.FRAGMENT_LOADING_COMPLETED = 'fragmentLoadingCompleted';

    /**
     * Triggered when a partial fragment download has completed.
     * @event MediaPlayerEvents#FRAGMENT_LOADING_PROGRESS
     */
    this.FRAGMENT_LOADING_PROGRESS = 'fragmentLoadingProgress';
    /**
     * Triggered when a fragment download has started.
     * @event MediaPlayerEvents#FRAGMENT_LOADING_STARTED
     */
    this.FRAGMENT_LOADING_STARTED = 'fragmentLoadingStarted';

    /**
     * Triggered when a fragment download is abandoned due to detection of slow download base on the ABR abandon rule..
     * @event MediaPlayerEvents#FRAGMENT_LOADING_ABANDONED
     */
    this.FRAGMENT_LOADING_ABANDONED = 'fragmentLoadingAbandoned';

    /**
     * Triggered when {@link module:Debug} logger methods are called.
     * @event MediaPlayerEvents#LOG
     */
    this.LOG = 'log';

    //TODO refactor with internal event
    /**
     * Triggered when the manifest load is complete
     * @event MediaPlayerEvents#MANIFEST_LOADED
     */
    this.MANIFEST_LOADED = 'manifestLoaded';

    /**
     * Triggered anytime there is a change to the overall metrics.
     * @event MediaPlayerEvents#METRICS_CHANGED
     */
    this.METRICS_CHANGED = 'metricsChanged';

    /**
     * Triggered when an individual metric is added, updated or cleared.
     * @event MediaPlayerEvents#METRIC_CHANGED
     */
    this.METRIC_CHANGED = 'metricChanged';

    /**
     * Triggered every time a new metric is added.
     * @event MediaPlayerEvents#METRIC_ADDED
     */
    this.METRIC_ADDED = 'metricAdded';

    /**
     * Triggered every time a metric is updated.
     * @event MediaPlayerEvents#METRIC_UPDATED
     */
    this.METRIC_UPDATED = 'metricUpdated';

    /**
     * Triggered at the stream end of a period.
     * @event MediaPlayerEvents#PERIOD_SWITCH_COMPLETED
     */
    this.PERIOD_SWITCH_COMPLETED = 'periodSwitchCompleted';

    /**
     * Triggered when a new period starts.
     * @event MediaPlayerEvents#PERIOD_SWITCH_STARTED
     */
    this.PERIOD_SWITCH_STARTED = 'periodSwitchStarted';

    /**
     * Triggered when an ABR up /down switch is initiated; either by user in manual mode or auto mode via ABR rules.
     * @event MediaPlayerEvents#QUALITY_CHANGE_REQUESTED
     */
    this.QUALITY_CHANGE_REQUESTED = 'qualityChangeRequested';

    /**
     * Triggered when the new ABR quality is being rendered on-screen.
     * @event MediaPlayerEvents#QUALITY_CHANGE_RENDERED
     */
    this.QUALITY_CHANGE_RENDERED = 'qualityChangeRendered';

    /**
     * Triggered when the new track is being rendered.
     * @event MediaPlayerEvents#TRACK_CHANGE_RENDERED
     */
    this.TRACK_CHANGE_RENDERED = 'trackChangeRendered';

    /**
     * Triggered when the source is setup and ready.
     * @event MediaPlayerEvents#SOURCE_INITIALIZED
     */
    this.SOURCE_INITIALIZED = 'sourceInitialized';

    /**
     * Triggered when a stream (period) is being loaded
     * @event MediaPlayerEvents#STREAM_INITIALIZING
     */
    this.STREAM_INITIALIZING = 'streamInitializing';

    /**
     * Triggered when a stream (period) is loaded
     * @event MediaPlayerEvents#STREAM_UPDATED
     */
    this.STREAM_UPDATED = 'streamUpdated';

    /**
     * Triggered when a stream (period) is updated
     * @event MediaPlayerEvents#STREAM_INITIALIZED
     */
    this.STREAM_INITIALIZED = 'streamInitialized';

    /**
     * Triggered when the player has been reset.
     * @event MediaPlayerEvents#STREAM_TEARDOWN_COMPLETE
     */
    this.STREAM_TEARDOWN_COMPLETE = 'streamTeardownComplete';

    /**
     * Triggered once all text tracks detected in the MPD are added to the video element.
     * @event MediaPlayerEvents#TEXT_TRACKS_ADDED
     */
    this.TEXT_TRACKS_ADDED = 'allTextTracksAdded';

    /**
     * Triggered when a text track is added to the video element's TextTrackList
     * @event MediaPlayerEvents#TEXT_TRACK_ADDED
     */
    this.TEXT_TRACK_ADDED = 'textTrackAdded';

    /**
     * Triggered when a ttml chunk is parsed.
     * @event MediaPlayerEvents#TTML_PARSED
     */
    this.TTML_PARSED = 'ttmlParsed';

    /**
     * Triggered when a ttml chunk has to be parsed.
     * @event MediaPlayerEvents#TTML_TO_PARSE
     */
    this.TTML_TO_PARSE = 'ttmlToParse';

    /**
     * Triggered when a caption is rendered.
     * @event MediaPlayerEvents#CAPTION_RENDERED
     */
    this.CAPTION_RENDERED = 'captionRendered';

    /**
     * Triggered when the caption container is resized.
     * @event MediaPlayerEvents#CAPTION_CONTAINER_RESIZE
     */
    this.CAPTION_CONTAINER_RESIZE = 'captionContainerResize';

    /**
     * Sent when enough data is available that the media can be played,
     * at least for a couple of frames.  This corresponds to the
     * HAVE_ENOUGH_DATA readyState.
     * @event MediaPlayerEvents#CAN_PLAY
     */
    this.CAN_PLAY = 'canPlay';

    /**
     * Sent when playback completes.
     * @event MediaPlayerEvents#PLAYBACK_ENDED
     */
    this.PLAYBACK_ENDED = 'playbackEnded';

    /**
     * Sent when an error occurs.  The element's error
     * attribute contains more information.
     * @event MediaPlayerEvents#PLAYBACK_ERROR
     */
    this.PLAYBACK_ERROR = 'playbackError';

    /**
     * Sent when playback is not allowed (for example if user gesture is needed).
     * @event MediaPlayerEvents#PLAYBACK_NOT_ALLOWED
     */
    this.PLAYBACK_NOT_ALLOWED = 'playbackNotAllowed';

    /**
     * The media's metadata has finished loading; all attributes now
     * contain as much useful information as they're going to.
     * @event MediaPlayerEvents#PLAYBACK_METADATA_LOADED
     */
    this.PLAYBACK_METADATA_LOADED = 'playbackMetaDataLoaded';

    /**
     * Sent when playback is paused.
     * @event MediaPlayerEvents#PLAYBACK_PAUSED
     */
    this.PLAYBACK_PAUSED = 'playbackPaused';

    /**
     * Sent when the media begins to play (either for the first time, after having been paused,
     * or after ending and then restarting).
     *
     * @event MediaPlayerEvents#PLAYBACK_PLAYING
     */
    this.PLAYBACK_PLAYING = 'playbackPlaying';

    /**
     * Sent periodically to inform interested parties of progress downloading
     * the media. Information about the current amount of the media that has
     * been downloaded is available in the media element's buffered attribute.
     * @event MediaPlayerEvents#PLAYBACK_PROGRESS
     */
    this.PLAYBACK_PROGRESS = 'playbackProgress';

    /**
     * Sent when the playback speed changes.
     * @event MediaPlayerEvents#PLAYBACK_RATE_CHANGED
     */
    this.PLAYBACK_RATE_CHANGED = 'playbackRateChanged';

    /**
     * Sent when a seek operation completes.
     * @event MediaPlayerEvents#PLAYBACK_SEEKED
     */
    this.PLAYBACK_SEEKED = 'playbackSeeked';

    /**
     * Sent when a seek operation begins.
     * @event MediaPlayerEvents#PLAYBACK_SEEKING
     */
    this.PLAYBACK_SEEKING = 'playbackSeeking';

    /**
     * Sent when a seek operation has been asked.
     * @event MediaPlayerEvents#PLAYBACK_SEEK_ASKED
     */
    this.PLAYBACK_SEEK_ASKED = 'playbackSeekAsked';

    /**
     * Sent when the video element reports stalled
     * @event MediaPlayerEvents#PLAYBACK_STALLED
     */
    this.PLAYBACK_STALLED = 'playbackStalled';

    /**
     * Sent when playback of the media starts after having been paused;
     * that is, when playback is resumed after a prior pause event.
     *
     * @event MediaPlayerEvents#PLAYBACK_STARTED
     */
    this.PLAYBACK_STARTED = 'playbackStarted';

    /**
     * The time indicated by the element's currentTime attribute has changed.
     * @event MediaPlayerEvents#PLAYBACK_TIME_UPDATED
     */
    this.PLAYBACK_TIME_UPDATED = 'playbackTimeUpdated';

    /**
     * Sent when the media playback has stopped because of a temporary lack of data.
     *
     * @event MediaPlayerEvents#PLAYBACK_WAITING
     */
    this.PLAYBACK_WAITING = 'playbackWaiting';

    /**
     * Manifest validity changed - As a result of an MPD validity expiration event.
     * @event MediaPlayerEvents#MANIFEST_VALIDITY_CHANGED
     */
    this.MANIFEST_VALIDITY_CHANGED = 'manifestValidityChanged';

    /**
     * A gap occured in the timeline which requires a seek to the next period
     * @event MediaPlayerEvents#GAP_CAUSED_SEEK_TO_PERIOD_END
     */
    this.GAP_CAUSED_SEEK_TO_PERIOD_END = 'gapCausedSeekToPeriodEnd';

    /**
     * A gap occured in the timeline which requires an internal seek
     * @event MediaPlayerEvents#GAP_CAUSED_INTERNAL_SEEK
     */
    this.GAP_CAUSED_INTERNAL_SEEK = 'gapCausedInternalSeek';

    /**
     * Dash events are triggered at their respective start points on the timeline.
     * @event MediaPlayerEvents#EVENT_MODE_ON_START
     */
    this.EVENT_MODE_ON_START = 'eventModeOnStart';

    /**
     * Dash events are triggered as soon as they were parsed.
     * @event MediaPlayerEvents#EVENT_MODE_ON_RECEIVE
     */
    this.EVENT_MODE_ON_RECEIVE = 'eventModeOnReceive';
  }

  return MediaPlayerEvents;
})(_coreEventsEventsBase2['default']);

var mediaPlayerEvents = new MediaPlayerEvents();
exports['default'] = mediaPlayerEvents;
module.exports = exports['default'];

},{"../core/events/EventsBase":4}],14:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Represents data structure to keep and drive {DataChunk}
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreFactoryMaker = _dereq_('../../core/FactoryMaker');

var _coreFactoryMaker2 = _interopRequireDefault(_coreFactoryMaker);

function InitCache() {

    var data = {};

    function save(chunk) {
        var id = chunk.streamId;
        var representationId = chunk.representationId;

        data[id] = data[id] || {};
        data[id][representationId] = chunk;
    }

    function extract(streamId, representationId) {
        if (data && data[streamId] && data[streamId][representationId]) {
            return data[streamId][representationId];
        } else {
            return null;
        }
    }

    function reset() {
        data = {};
    }

    var instance = {
        save: save,
        extract: extract,
        reset: reset
    };

    return instance;
}

InitCache.__dashjs_factory_name = 'InitCache';
exports['default'] = _coreFactoryMaker2['default'].getSingletonFactory(InitCache);
module.exports = exports['default'];

},{"../../core/FactoryMaker":2}],15:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @class
 * @ignore
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DashJSError = function DashJSError(code, message, data) {
  _classCallCheck(this, DashJSError);

  this.code = code || null;
  this.message = message || null;
  this.data = data || null;
};

exports["default"] = DashJSError;
module.exports = exports["default"];

},{}],16:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @class
 * @ignore
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataChunk =
//Represents a data structure that keep all the necessary info about a single init/media segment
function DataChunk() {
  _classCallCheck(this, DataChunk);

  this.streamId = null;
  this.mediaInfo = null;
  this.segmentType = null;
  this.quality = NaN;
  this.index = NaN;
  this.bytes = null;
  this.start = NaN;
  this.end = NaN;
  this.duration = NaN;
  this.representationId = null;
  this.endFragment = null;
};

exports["default"] = DataChunk;
module.exports = exports["default"];

},{}],17:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _voMetricsHTTPRequest = _dereq_('../vo/metrics/HTTPRequest');

/**
 * @class
 * @ignore
 */

var FragmentRequest = (function () {
    function FragmentRequest(url) {
        _classCallCheck(this, FragmentRequest);

        this.action = FragmentRequest.ACTION_DOWNLOAD;
        this.startTime = NaN;
        this.mediaStartTime = NaN;
        this.mediaType = null;
        this.mediaInfo = null;
        this.type = null;
        this.duration = NaN;
        this.timescale = NaN;
        this.range = null;
        this.url = url || null;
        this.serviceLocation = null;
        this.requestStartDate = null;
        this.firstByteDate = null;
        this.requestEndDate = null;
        this.quality = NaN;
        this.index = NaN;
        this.availabilityStartTime = null;
        this.availabilityEndTime = null;
        this.wallStartTime = null;
        this.bytesLoaded = NaN;
        this.bytesTotal = NaN;
        this.delayLoadingTime = NaN;
        this.responseType = 'arraybuffer';
        this.representationId = null;
    }

    _createClass(FragmentRequest, [{
        key: 'isInitializationRequest',
        value: function isInitializationRequest() {
            return this.type && this.type === _voMetricsHTTPRequest.HTTPRequest.INIT_SEGMENT_TYPE;
        }
    }, {
        key: 'setInfo',
        value: function setInfo(info) {
            this.type = info && info.init ? _voMetricsHTTPRequest.HTTPRequest.INIT_SEGMENT_TYPE : _voMetricsHTTPRequest.HTTPRequest.MEDIA_SEGMENT_TYPE;
            this.url = info && info.url ? info.url : null;
            this.range = info && info.range ? info.range.start + '-' + info.range.end : null;
            this.mediaType = info && info.mediaType ? info.mediaType : null;
        }
    }]);

    return FragmentRequest;
})();

FragmentRequest.ACTION_DOWNLOAD = 'download';
FragmentRequest.ACTION_COMPLETE = 'complete';

exports['default'] = FragmentRequest;
module.exports = exports['default'];

},{"../vo/metrics/HTTPRequest":18}],18:[function(_dereq_,module,exports){
/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @classdesc This Object holds reference to the HTTPRequest for manifest, fragment and xlink loading.
 * Members which are not defined in ISO23009-1 Annex D should be prefixed by a _ so that they are ignored
 * by Metrics Reporting code.
 * @ignore
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var HTTPRequest =
/**
 * @class
 */
function HTTPRequest() {
  _classCallCheck(this, HTTPRequest);

  /**
   * Identifier of the TCP connection on which the HTTP request was sent.
   * @public
   */
  this.tcpid = null;
  /**
   * This is an optional parameter and should not be included in HTTP request/response transactions for progressive download.
   * The type of the request:
   * - MPD
   * - XLink expansion
   * - Initialization Fragment
   * - Index Fragment
   * - Media Fragment
   * - Bitstream Switching Fragment
   * - other
   * @public
   */
  this.type = null;
  /**
   * The original URL (before any redirects or failures)
   * @public
   */
  this.url = null;
  /**
   * The actual URL requested, if different from above
   * @public
   */
  this.actualurl = null;
  /**
   * The contents of the byte-range-spec part of the HTTP Range header.
   * @public
   */
  this.range = null;
  /**
   * Real-Time | The real time at which the request was sent.
   * @public
   */
  this.trequest = null;
  /**
   * Real-Time | The real time at which the first byte of the response was received.
   * @public
   */
  this.tresponse = null;
  /**
   * The HTTP response code.
   * @public
   */
  this.responsecode = null;
  /**
   * The duration of the throughput trace intervals (ms), for successful requests only.
   * @public
   */
  this.interval = null;
  /**
   * Throughput traces, for successful requests only.
   * @public
   */
  this.trace = [];

  /**
   * Type of stream ("audio" | "video" etc..)
   * @public
   */
  this._stream = null;
  /**
   * Real-Time | The real time at which the request finished.
   * @public
   */
  this._tfinish = null;
  /**
   * The duration of the media requests, if available, in milliseconds.
   * @public
   */
  this._mediaduration = null;
  /**
   * The media segment quality
   * @public
   */
  this._quality = null;
  /**
   * all the response headers from request.
   * @public
   */
  this._responseHeaders = null;
  /**
   * The selected service location for the request. string.
   * @public
   */
  this._serviceLocation = null;
}

/**
 * @classdesc This Object holds reference to the progress of the HTTPRequest.
 * @ignore
 */
;

var HTTPRequestTrace =
/**
* @class
*/
function HTTPRequestTrace() {
  _classCallCheck(this, HTTPRequestTrace);

  /**
   * Real-Time | Measurement stream start.
   * @public
   */
  this.s = null;
  /**
   * Measurement stream duration (ms).
   * @public
   */
  this.d = null;
  /**
   * List of integers counting the bytes received in each trace interval within the measurement stream.
   * @public
   */
  this.b = [];
};

HTTPRequest.GET = 'GET';
HTTPRequest.HEAD = 'HEAD';
HTTPRequest.MPD_TYPE = 'MPD';
HTTPRequest.XLINK_EXPANSION_TYPE = 'XLinkExpansion';
HTTPRequest.INIT_SEGMENT_TYPE = 'InitializationSegment';
HTTPRequest.INDEX_SEGMENT_TYPE = 'IndexSegment';
HTTPRequest.MEDIA_SEGMENT_TYPE = 'MediaSegment';
HTTPRequest.BITSTREAM_SWITCHING_SEGMENT_TYPE = 'BitstreamSwitchingSegment';
HTTPRequest.OTHER_TYPE = 'other';

exports.HTTPRequest = HTTPRequest;
exports.HTTPRequestTrace = HTTPRequestTrace;

},{}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJIOi9EQVNIL215LWFmcmFtZS10aWxlLXBsYXllci9kYXNoLmpzL2V4dGVybmFscy9CaWdJbnRlZ2VyLmpzIiwiSDovREFTSC9teS1hZnJhbWUtdGlsZS1wbGF5ZXIvZGFzaC5qcy9zcmMvY29yZS9GYWN0b3J5TWFrZXIuanMiLCJIOi9EQVNIL215LWFmcmFtZS10aWxlLXBsYXllci9kYXNoLmpzL3NyYy9jb3JlL2Vycm9ycy9FcnJvcnNCYXNlLmpzIiwiSDovREFTSC9teS1hZnJhbWUtdGlsZS1wbGF5ZXIvZGFzaC5qcy9zcmMvY29yZS9ldmVudHMvRXZlbnRzQmFzZS5qcyIsIkg6L0RBU0gvbXktYWZyYW1lLXRpbGUtcGxheWVyL2Rhc2guanMvc3JjL21zcy9Nc3NGcmFnbWVudEluZm9Db250cm9sbGVyLmpzIiwiSDovREFTSC9teS1hZnJhbWUtdGlsZS1wbGF5ZXIvZGFzaC5qcy9zcmMvbXNzL01zc0ZyYWdtZW50TW9vZlByb2Nlc3Nvci5qcyIsIkg6L0RBU0gvbXktYWZyYW1lLXRpbGUtcGxheWVyL2Rhc2guanMvc3JjL21zcy9Nc3NGcmFnbWVudE1vb3ZQcm9jZXNzb3IuanMiLCJIOi9EQVNIL215LWFmcmFtZS10aWxlLXBsYXllci9kYXNoLmpzL3NyYy9tc3MvTXNzRnJhZ21lbnRQcm9jZXNzb3IuanMiLCJIOi9EQVNIL215LWFmcmFtZS10aWxlLXBsYXllci9kYXNoLmpzL3NyYy9tc3MvTXNzSGFuZGxlci5qcyIsIkg6L0RBU0gvbXktYWZyYW1lLXRpbGUtcGxheWVyL2Rhc2guanMvc3JjL21zcy9lcnJvcnMvTXNzRXJyb3JzLmpzIiwiSDovREFTSC9teS1hZnJhbWUtdGlsZS1wbGF5ZXIvZGFzaC5qcy9zcmMvbXNzL2luZGV4LmpzIiwiSDovREFTSC9teS1hZnJhbWUtdGlsZS1wbGF5ZXIvZGFzaC5qcy9zcmMvbXNzL3BhcnNlci9Nc3NQYXJzZXIuanMiLCJIOi9EQVNIL215LWFmcmFtZS10aWxlLXBsYXllci9kYXNoLmpzL3NyYy9zdHJlYW1pbmcvTWVkaWFQbGF5ZXJFdmVudHMuanMiLCJIOi9EQVNIL215LWFmcmFtZS10aWxlLXBsYXllci9kYXNoLmpzL3NyYy9zdHJlYW1pbmcvdXRpbHMvSW5pdENhY2hlLmpzIiwiSDovREFTSC9teS1hZnJhbWUtdGlsZS1wbGF5ZXIvZGFzaC5qcy9zcmMvc3RyZWFtaW5nL3ZvL0Rhc2hKU0Vycm9yLmpzIiwiSDovREFTSC9teS1hZnJhbWUtdGlsZS1wbGF5ZXIvZGFzaC5qcy9zcmMvc3RyZWFtaW5nL3ZvL0RhdGFDaHVuay5qcyIsIkg6L0RBU0gvbXktYWZyYW1lLXRpbGUtcGxheWVyL2Rhc2guanMvc3JjL3N0cmVhbWluZy92by9GcmFnbWVudFJlcXVlc3QuanMiLCJIOi9EQVNIL215LWFmcmFtZS10aWxlLXBsYXllci9kYXNoLmpzL3NyYy9zdHJlYW1pbmcvdm8vbWV0cmljcy9IVFRQUmVxdWVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxNQUFNLEdBQUMsQ0FBQSxVQUFTLFNBQVMsRUFBQztBQUFDLGNBQVksQ0FBQyxJQUFJLElBQUksR0FBQyxHQUFHO01BQUMsUUFBUSxHQUFDLENBQUM7TUFBQyxPQUFPLEdBQUMsZ0JBQWdCO01BQUMsV0FBVyxHQUFDLFlBQVksQ0FBQyxPQUFPLENBQUM7TUFBQyxnQkFBZ0IsR0FBQyxzQ0FBc0MsQ0FBQyxJQUFJLG9CQUFvQixHQUFDLE9BQU8sTUFBTSxLQUFHLFVBQVUsQ0FBQyxTQUFTLE9BQU8sQ0FBQyxDQUFDLEVBQUMsS0FBSyxFQUFDLFFBQVEsRUFBQyxhQUFhLEVBQUM7QUFBQyxRQUFHLE9BQU8sQ0FBQyxLQUFHLFdBQVcsRUFBQyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLE9BQU8sS0FBSyxLQUFHLFdBQVcsRUFBQyxPQUFNLENBQUMsS0FBSyxLQUFHLEVBQUUsSUFBRSxDQUFDLFFBQVEsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUMsU0FBUyxDQUFDLENBQUMsRUFBQyxLQUFLLEVBQUMsUUFBUSxFQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQUMsU0FBUyxVQUFVLENBQUMsS0FBSyxFQUFDLElBQUksRUFBQztBQUFDLFFBQUksQ0FBQyxLQUFLLEdBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUMsS0FBSyxDQUFBO0dBQUMsVUFBVSxDQUFDLFNBQVMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLFlBQVksQ0FBQyxLQUFLLEVBQUM7QUFBQyxRQUFJLENBQUMsS0FBSyxHQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBQyxJQUFJLENBQUE7R0FBQyxZQUFZLENBQUMsU0FBUyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQVMsWUFBWSxDQUFDLEtBQUssRUFBQztBQUFDLFFBQUksQ0FBQyxLQUFLLEdBQUMsS0FBSyxDQUFBO0dBQUMsWUFBWSxDQUFDLFNBQVMsR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLFNBQVMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxXQUFNLENBQUMsT0FBTyxHQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsT0FBTyxDQUFBO0dBQUMsU0FBUyxZQUFZLENBQUMsQ0FBQyxFQUFDO0FBQUMsUUFBRyxDQUFDLEdBQUMsR0FBRyxFQUFDLE9BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsR0FBQyxJQUFJLEVBQUMsT0FBTSxDQUFDLENBQUMsR0FBQyxHQUFHLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQyxHQUFDLEdBQUcsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBQyxHQUFHLENBQUMsR0FBQyxHQUFHLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtHQUFDLFNBQVMsWUFBWSxDQUFDLEdBQUcsRUFBQztBQUFDLFFBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLE1BQU0sR0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUcsTUFBTSxHQUFDLENBQUMsSUFBRSxVQUFVLENBQUMsR0FBRyxFQUFDLFdBQVcsQ0FBQyxHQUFDLENBQUMsRUFBQztBQUFDLGNBQU8sTUFBTSxHQUFFLEtBQUssQ0FBQztBQUFDLGlCQUFPLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFBQyxpQkFBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQUMsaUJBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBQyxJQUFJLENBQUM7QUFBUSxpQkFBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQSxHQUFFLElBQUksQ0FBQSxDQUFDO0tBQUMsT0FBTyxHQUFHLENBQUE7R0FBQyxTQUFTLElBQUksQ0FBQyxDQUFDLEVBQUM7QUFBQyxRQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtHQUFDLFNBQVMsV0FBVyxDQUFDLE1BQU0sRUFBQztBQUFDLFFBQUksQ0FBQyxHQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU0sRUFBRSxDQUFDLEdBQUMsTUFBTSxFQUFDO0FBQUMsT0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtLQUFDLE9BQU8sQ0FBQyxDQUFBO0dBQUMsU0FBUyxRQUFRLENBQUMsQ0FBQyxFQUFDO0FBQUMsUUFBRyxDQUFDLEdBQUMsQ0FBQyxFQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsUUFBSSxHQUFHLEdBQUMsQ0FBQyxDQUFDLE1BQU07UUFBQyxHQUFHLEdBQUMsQ0FBQyxDQUFDLE1BQU07UUFBQyxDQUFDLEdBQUMsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQUMsS0FBSyxHQUFDLENBQUM7UUFBQyxJQUFJLEdBQUMsSUFBSTtRQUFDLEdBQUc7UUFBQyxDQUFDLENBQUMsS0FBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxHQUFHLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxTQUFHLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxLQUFLLENBQUMsS0FBSyxHQUFDLEdBQUcsSUFBRSxJQUFJLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsR0FBRyxHQUFDLEtBQUssR0FBQyxJQUFJLENBQUE7S0FBQyxPQUFNLENBQUMsR0FBQyxHQUFHLEVBQUM7QUFBQyxTQUFHLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUMsR0FBRyxLQUFHLElBQUksR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLEdBQUcsR0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFBO0tBQUMsSUFBRyxLQUFLLEdBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUE7R0FBQyxTQUFTLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsUUFBRyxDQUFDLENBQUMsTUFBTSxJQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTtHQUFDLFNBQVMsUUFBUSxDQUFDLENBQUMsRUFBQyxLQUFLLEVBQUM7QUFBQyxRQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTTtRQUFDLENBQUMsR0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFBQyxJQUFJLEdBQUMsSUFBSTtRQUFDLEdBQUc7UUFBQyxDQUFDLENBQUMsS0FBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxTQUFHLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLElBQUksR0FBQyxLQUFLLENBQUMsS0FBSyxHQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxHQUFHLEdBQUMsS0FBSyxHQUFDLElBQUksQ0FBQyxLQUFLLElBQUUsQ0FBQyxDQUFBO0tBQUMsT0FBTSxLQUFLLEdBQUMsQ0FBQyxFQUFDO0FBQUMsT0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsS0FBSyxHQUFDLElBQUksQ0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLENBQUE7S0FBQyxPQUFPLENBQUMsQ0FBQTtHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsUUFBSSxDQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsSUFBSSxDQUFDLElBQUksS0FBRyxDQUFDLENBQUMsSUFBSSxFQUFDO0FBQUMsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFBO0tBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxDQUFDLEtBQUs7UUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUM7QUFBQyxhQUFPLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7R0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsUUFBSSxDQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBRyxDQUFDLEdBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUM7QUFBQyxhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUE7S0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBQztBQUFDLFVBQUcsU0FBUyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsRUFBQyxPQUFPLElBQUksWUFBWSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFdBQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsUUFBUSxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxRQUFJLEdBQUcsR0FBQyxDQUFDLENBQUMsTUFBTTtRQUFDLEdBQUcsR0FBQyxDQUFDLENBQUMsTUFBTTtRQUFDLENBQUMsR0FBQyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFBQyxNQUFNLEdBQUMsQ0FBQztRQUFDLElBQUksR0FBQyxJQUFJO1FBQUMsQ0FBQztRQUFDLFVBQVUsQ0FBQyxLQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLGdCQUFVLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxVQUFVLEdBQUMsQ0FBQyxFQUFDO0FBQUMsa0JBQVUsSUFBRSxJQUFJLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQTtPQUFDLE1BQUssTUFBTSxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsVUFBVSxDQUFBO0tBQUMsS0FBSSxDQUFDLEdBQUMsR0FBRyxFQUFDLENBQUMsR0FBQyxHQUFHLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxnQkFBVSxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsSUFBRyxVQUFVLEdBQUMsQ0FBQyxFQUFDLFVBQVUsSUFBRSxJQUFJLENBQUMsS0FBSTtBQUFDLFNBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLFVBQVUsQ0FBQyxNQUFLO09BQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLFVBQVUsQ0FBQTtLQUFDLE9BQUssQ0FBQyxHQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLE9BQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUE7R0FBQyxTQUFTLFdBQVcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLElBQUksRUFBQztBQUFDLFFBQUksS0FBSyxDQUFDLElBQUcsVUFBVSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsSUFBRSxDQUFDLEVBQUM7QUFBQyxXQUFLLEdBQUMsUUFBUSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTtLQUFDLE1BQUk7QUFBQyxXQUFLLEdBQUMsUUFBUSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxJQUFJLENBQUE7S0FBQyxLQUFLLEdBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUcsT0FBTyxLQUFLLEtBQUcsUUFBUSxFQUFDO0FBQUMsVUFBRyxJQUFJLEVBQUMsS0FBSyxHQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7S0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLEtBQUssRUFBQyxJQUFJLENBQUMsQ0FBQTtHQUFDLFNBQVMsYUFBYSxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsSUFBSSxFQUFDO0FBQUMsUUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU07UUFBQyxDQUFDLEdBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQztRQUFDLElBQUksR0FBQyxJQUFJO1FBQUMsQ0FBQztRQUFDLFVBQVUsQ0FBQyxLQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLGdCQUFVLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxJQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsVUFBVSxHQUFDLENBQUMsR0FBQyxVQUFVLEdBQUMsSUFBSSxHQUFDLFVBQVUsQ0FBQTtLQUFDLENBQUMsR0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxPQUFPLENBQUMsS0FBRyxRQUFRLEVBQUM7QUFBQyxVQUFHLElBQUksRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxDQUFBO0dBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxRQUFJLENBQUMsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxJQUFJLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUM7QUFBQyxhQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUE7S0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLENBQUMsS0FBSztRQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBQyxPQUFPLGFBQWEsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxXQUFXLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7R0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsUUFBSSxDQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBRyxDQUFDLEdBQUMsQ0FBQyxLQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUM7QUFBQyxhQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUE7S0FBQyxJQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBQztBQUFDLGFBQU8sSUFBSSxZQUFZLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO0tBQUMsT0FBTyxhQUFhLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFdBQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFDLFlBQVU7QUFBQyxXQUFPLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFDLFlBQVU7QUFBQyxRQUFJLElBQUksR0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxHQUFDLElBQUksWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxLQUFLLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFDLFlBQVU7QUFBQyxXQUFPLElBQUksWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO0dBQUMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBQyxZQUFVO0FBQUMsV0FBTyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBQyxZQUFVO0FBQUMsV0FBTyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBQyxZQUFVO0FBQUMsV0FBTyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFFLENBQUMsR0FBQyxJQUFJLENBQUMsS0FBSyxHQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO0dBQUMsQ0FBQyxTQUFTLFlBQVksQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsUUFBSSxHQUFHLEdBQUMsQ0FBQyxDQUFDLE1BQU07UUFBQyxHQUFHLEdBQUMsQ0FBQyxDQUFDLE1BQU07UUFBQyxDQUFDLEdBQUMsR0FBRyxHQUFDLEdBQUc7UUFBQyxDQUFDLEdBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUFDLElBQUksR0FBQyxJQUFJO1FBQUMsT0FBTztRQUFDLEtBQUs7UUFBQyxDQUFDO1FBQUMsR0FBRztRQUFDLEdBQUcsQ0FBQyxLQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLFNBQUcsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLFdBQUcsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLEdBQUcsR0FBQyxHQUFHLEdBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBQyxPQUFPLEdBQUMsS0FBSyxHQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBRSxLQUFLLENBQUE7T0FBQztLQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtHQUFDLFNBQVMsYUFBYSxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxRQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTTtRQUFDLENBQUMsR0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFBQyxJQUFJLEdBQUMsSUFBSTtRQUFDLEtBQUssR0FBQyxDQUFDO1FBQUMsT0FBTztRQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLGFBQU8sR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLE9BQU8sR0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFBO0tBQUMsT0FBTSxLQUFLLEdBQUMsQ0FBQyxFQUFDO0FBQUMsT0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsS0FBSyxHQUFDLElBQUksQ0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLENBQUE7S0FBQyxPQUFPLENBQUMsQ0FBQTtHQUFDLFNBQVMsU0FBUyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxRQUFJLENBQUMsR0FBQyxFQUFFLENBQUMsT0FBTSxDQUFDLEVBQUUsR0FBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FBQyxTQUFTLGlCQUFpQixDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxRQUFJLENBQUMsR0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUcsQ0FBQyxJQUFFLEVBQUUsRUFBQyxPQUFPLFlBQVksQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztRQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO1FBQUMsRUFBRSxHQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7UUFBQyxJQUFJLEdBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxPQUFPLEdBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFDLEVBQUUsQ0FBQyxFQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsU0FBUyxDQUFDLEVBQUUsRUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxPQUFPLENBQUE7R0FBQyxTQUFTLFlBQVksQ0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFDO0FBQUMsV0FBTSxDQUFDLElBQUksR0FBQyxFQUFFLEdBQUMsSUFBSSxHQUFDLEVBQUUsR0FBQyxLQUFLLEdBQUMsRUFBRSxHQUFDLEVBQUUsR0FBQyxDQUFDLENBQUE7R0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFFBQUksQ0FBQyxHQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLEtBQUs7UUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUs7UUFBQyxJQUFJLEdBQUMsSUFBSSxDQUFDLElBQUksS0FBRyxDQUFDLENBQUMsSUFBSTtRQUFDLEdBQUcsQ0FBQyxJQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUM7QUFBQyxVQUFHLENBQUMsS0FBRyxDQUFDLEVBQUMsT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEtBQUcsQ0FBQyxFQUFDLE9BQU8sSUFBSSxDQUFDLElBQUcsQ0FBQyxLQUFHLENBQUMsQ0FBQyxFQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsR0FBRyxHQUFDLElBQUksRUFBQztBQUFDLGVBQU8sSUFBSSxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBQyxHQUFHLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQTtPQUFDLENBQUMsR0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUE7S0FBQyxJQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBQyxPQUFPLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUE7R0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFNBQVMscUJBQXFCLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxJQUFJLEVBQUM7QUFBQyxRQUFHLENBQUMsR0FBQyxJQUFJLEVBQUM7QUFBQyxhQUFPLElBQUksVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUE7S0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUE7R0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLGdCQUFnQixHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsUUFBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUM7QUFBQyxhQUFPLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO0tBQUMsT0FBTyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtHQUFDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFFBQUcsQ0FBQyxDQUFDLEtBQUssS0FBRyxDQUFDLEVBQUMsT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsS0FBSyxLQUFHLENBQUMsRUFBQyxPQUFPLElBQUksQ0FBQyxJQUFHLENBQUMsQ0FBQyxLQUFLLEtBQUcsQ0FBQyxDQUFDLEVBQUMsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBQyxJQUFJLENBQUMsS0FBSyxFQUFDLElBQUksQ0FBQyxJQUFJLEtBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFdBQU8sVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFdBQU8sSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFNBQVMsTUFBTSxDQUFDLENBQUMsRUFBQztBQUFDLFFBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNO1FBQUMsQ0FBQyxHQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDO1FBQUMsSUFBSSxHQUFDLElBQUk7UUFBQyxPQUFPO1FBQUMsS0FBSztRQUFDLENBQUM7UUFBQyxHQUFHO1FBQUMsR0FBRyxDQUFDLEtBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQUMsU0FBRyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxHQUFDLEdBQUcsR0FBQyxHQUFHLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLFdBQUcsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFDLENBQUMsSUFBRSxHQUFHLEdBQUMsR0FBRyxDQUFBLEFBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBQyxPQUFPLEdBQUMsS0FBSyxHQUFDLElBQUksQ0FBQTtPQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUMsS0FBSyxDQUFBO0tBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0dBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsWUFBVTtBQUFDLFdBQU8sSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBQyxLQUFLLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsWUFBVTtBQUFDLFFBQUksS0FBSyxHQUFDLElBQUksQ0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBQyxPQUFPLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUMsS0FBSyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsV0FBTyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtHQUFDLENBQUMsU0FBUyxPQUFPLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFFBQUksR0FBRyxHQUFDLENBQUMsQ0FBQyxNQUFNO1FBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQyxNQUFNO1FBQUMsSUFBSSxHQUFDLElBQUk7UUFBQyxNQUFNLEdBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFBQywyQkFBMkIsR0FBQyxDQUFDLENBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQztRQUFDLE1BQU0sR0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBRSxDQUFDLEdBQUMsMkJBQTJCLENBQUEsQUFBQyxDQUFDO1FBQUMsU0FBUyxHQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUMsTUFBTSxDQUFDO1FBQUMsT0FBTyxHQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUMsTUFBTSxDQUFDO1FBQUMsYUFBYTtRQUFDLEtBQUs7UUFBQyxLQUFLO1FBQUMsTUFBTTtRQUFDLENBQUM7UUFBQyxDQUFDO1FBQUMsQ0FBQyxDQUFDLElBQUcsU0FBUyxDQUFDLE1BQU0sSUFBRSxHQUFHLEVBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLDJCQUEyQixHQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSSxLQUFLLEdBQUMsR0FBRyxHQUFDLEdBQUcsRUFBQyxLQUFLLElBQUUsQ0FBQyxFQUFDLEtBQUssRUFBRSxFQUFDO0FBQUMsbUJBQWEsR0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLElBQUcsU0FBUyxDQUFDLEtBQUssR0FBQyxHQUFHLENBQUMsS0FBRywyQkFBMkIsRUFBQztBQUFDLHFCQUFhLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUMsR0FBRyxDQUFDLEdBQUMsSUFBSSxHQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQyxDQUFBLEdBQUUsMkJBQTJCLENBQUMsQ0FBQTtPQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLGFBQUssSUFBRSxhQUFhLEdBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUUsU0FBUyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsSUFBRSxLQUFLLEdBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQSxBQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxJQUFHLE1BQU0sR0FBQyxDQUFDLEVBQUM7QUFBQyxtQkFBUyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsR0FBQyxNQUFNLEdBQUMsSUFBSSxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsQ0FBQTtTQUFDLE1BQUk7QUFBQyxtQkFBUyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQTtTQUFDO09BQUMsT0FBTSxNQUFNLEtBQUcsQ0FBQyxFQUFDO0FBQUMscUJBQWEsSUFBRSxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLGVBQUssSUFBRSxTQUFTLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxHQUFDLElBQUksR0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxLQUFLLEdBQUMsQ0FBQyxFQUFDO0FBQUMscUJBQVMsQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLEdBQUMsS0FBSyxHQUFDLElBQUksQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFBO1dBQUMsTUFBSTtBQUFDLHFCQUFTLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFBO1dBQUM7U0FBQyxNQUFNLElBQUUsS0FBSyxDQUFBO09BQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFDLGFBQWEsQ0FBQTtLQUFDLFNBQVMsR0FBQyxXQUFXLENBQUMsU0FBUyxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUE7R0FBQyxTQUFTLE9BQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsUUFBSSxHQUFHLEdBQUMsQ0FBQyxDQUFDLE1BQU07UUFBQyxHQUFHLEdBQUMsQ0FBQyxDQUFDLE1BQU07UUFBQyxNQUFNLEdBQUMsRUFBRTtRQUFDLElBQUksR0FBQyxFQUFFO1FBQUMsSUFBSSxHQUFDLElBQUk7UUFBQyxLQUFLO1FBQUMsSUFBSTtRQUFDLEtBQUs7UUFBQyxLQUFLO1FBQUMsS0FBSyxDQUFDLE9BQU0sR0FBRyxFQUFDO0FBQUMsVUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDO0FBQUMsY0FBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFRO09BQUMsSUFBSSxHQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFDLElBQUksQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLEdBQUMsSUFBSSxHQUFDLElBQUksQ0FBQyxJQUFJLEdBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUMsQ0FBQyxDQUFDLEdBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxJQUFJLEdBQUMsR0FBRyxFQUFDO0FBQUMsYUFBSyxHQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQSxHQUFFLElBQUksQ0FBQTtPQUFDLEtBQUssR0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFFO0FBQUMsYUFBSyxHQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUMsS0FBSyxDQUFDLENBQUMsSUFBRyxVQUFVLENBQUMsS0FBSyxFQUFDLElBQUksQ0FBQyxJQUFFLENBQUMsRUFBQyxNQUFNLEtBQUssRUFBRSxDQUFBO09BQUMsUUFBTSxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUMsUUFBUSxDQUFDLElBQUksRUFBQyxLQUFLLENBQUMsQ0FBQTtLQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO0dBQUMsU0FBUyxXQUFXLENBQUMsS0FBSyxFQUFDLE1BQU0sRUFBQztBQUFDLFFBQUksTUFBTSxHQUFDLEtBQUssQ0FBQyxNQUFNO1FBQUMsUUFBUSxHQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7UUFBQyxJQUFJLEdBQUMsSUFBSTtRQUFDLENBQUM7UUFBQyxDQUFDO1FBQUMsU0FBUztRQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxHQUFDLE1BQU0sR0FBQyxDQUFDLEVBQUMsQ0FBQyxJQUFFLENBQUMsRUFBQyxFQUFFLENBQUMsRUFBQztBQUFDLGFBQU8sR0FBQyxTQUFTLEdBQUMsSUFBSSxHQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsUUFBUSxDQUFDLE9BQU8sR0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLEdBQUMsT0FBTyxHQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUE7S0FBQyxPQUFNLENBQUMsUUFBUSxFQUFDLFNBQVMsR0FBQyxDQUFDLENBQUMsQ0FBQTtHQUFDLFNBQVMsU0FBUyxDQUFDLElBQUksRUFBQyxDQUFDLEVBQUM7QUFBQyxRQUFJLEtBQUs7UUFBQyxDQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsb0JBQW9CLEVBQUM7QUFBQyxhQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtLQUFDLElBQUksQ0FBQyxHQUFDLElBQUksQ0FBQyxLQUFLO1FBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBRyxDQUFDLEtBQUcsQ0FBQyxFQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxJQUFHLElBQUksQ0FBQyxPQUFPLEVBQUM7QUFBQyxVQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUM7QUFBQyxlQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksWUFBWSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO09BQUMsT0FBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQTtLQUFDLElBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBQztBQUFDLFVBQUcsQ0FBQyxLQUFHLENBQUMsRUFBQyxPQUFNLENBQUMsSUFBSSxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxJQUFFLENBQUMsQ0FBQyxFQUFDLE9BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLEdBQUcsR0FBQyxJQUFJLEVBQUM7QUFBQyxhQUFLLEdBQUMsV0FBVyxDQUFDLENBQUMsRUFBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEdBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksU0FBUyxHQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLElBQUksQ0FBQyxJQUFJLEVBQUMsU0FBUyxHQUFDLENBQUMsU0FBUyxDQUFDLElBQUcsT0FBTyxRQUFRLEtBQUcsUUFBUSxFQUFDO0FBQUMsY0FBRyxJQUFJLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUMsUUFBUSxHQUFDLENBQUMsUUFBUSxDQUFDLE9BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBQyxJQUFJLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO1NBQUMsT0FBTSxDQUFDLElBQUksVUFBVSxDQUFDLFFBQVEsRUFBQyxJQUFJLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxJQUFJLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO09BQUMsQ0FBQyxHQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUFDLElBQUksVUFBVSxHQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxVQUFVLEtBQUcsQ0FBQyxDQUFDLEVBQUMsT0FBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxJQUFHLFVBQVUsS0FBRyxDQUFDLEVBQUMsT0FBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxNQUFNLElBQUUsR0FBRyxFQUFDLEtBQUssR0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxHQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxHQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBQyxJQUFJLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxJQUFJO1FBQUMsR0FBRyxHQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFHLE9BQU8sUUFBUSxLQUFHLFFBQVEsRUFBQztBQUFDLFVBQUcsS0FBSyxFQUFDLFFBQVEsR0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUMsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUE7S0FBQyxNQUFLLFFBQVEsR0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLEVBQUMsS0FBSyxDQUFDLENBQUMsSUFBRyxPQUFPLEdBQUcsS0FBRyxRQUFRLEVBQUM7QUFBQyxVQUFHLEtBQUssRUFBQyxHQUFHLEdBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFDLElBQUksWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0tBQUMsTUFBSyxHQUFHLEdBQUMsSUFBSSxVQUFVLENBQUMsR0FBRyxFQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU0sQ0FBQyxRQUFRLEVBQUMsR0FBRyxDQUFDLENBQUE7R0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFFBQUksTUFBTSxHQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTSxFQUFDLFFBQVEsRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsU0FBUyxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFdBQU8sU0FBUyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxXQUFPLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFdBQU8sU0FBUyxDQUFDLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxXQUFPLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFFBQUksQ0FBQyxHQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLEtBQUs7UUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUs7UUFBQyxLQUFLO1FBQUMsQ0FBQztRQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsS0FBRyxDQUFDLEVBQUMsT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEtBQUcsQ0FBQyxFQUFDLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxLQUFHLENBQUMsRUFBQyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsS0FBRyxDQUFDLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsSUFBSSxFQUFDO0FBQUMsYUFBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQyxJQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsR0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFHLElBQUksQ0FBQyxPQUFPLEVBQUM7QUFBQyxVQUFHLFNBQVMsQ0FBQyxLQUFLLEdBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxPQUFPLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO0tBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQyxDQUFDLEdBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU0sSUFBSSxFQUFDO0FBQUMsVUFBRyxDQUFDLEdBQUMsQ0FBQyxLQUFHLENBQUMsRUFBQztBQUFDLFNBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBO09BQUMsSUFBRyxDQUFDLEtBQUcsQ0FBQyxFQUFDLE1BQU0sQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFBO0tBQUMsT0FBTyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsUUFBSSxDQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLElBQUksQ0FBQyxLQUFLO1FBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUFDLEVBQUUsR0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQUMsRUFBRSxHQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsS0FBRyxFQUFFLEVBQUMsT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEtBQUcsRUFBRSxFQUFDLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxLQUFHLEVBQUUsRUFBQyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsS0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU0sSUFBSSxFQUFDO0FBQUMsVUFBRyxDQUFDLENBQUMsR0FBQyxFQUFFLENBQUEsS0FBSSxFQUFFLEVBQUM7QUFBQyxTQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtPQUFDLElBQUcsQ0FBQyxLQUFHLEVBQUUsRUFBQyxNQUFNLENBQUMsSUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtLQUFDLE9BQU8sQ0FBQyxDQUFBO0dBQUMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxVQUFTLEdBQUcsRUFBQyxHQUFHLEVBQUM7QUFBQyxPQUFHLEdBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBRyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFBQyxJQUFJLEdBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFNLEdBQUcsQ0FBQyxVQUFVLEVBQUUsRUFBQztBQUFDLFVBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFDLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUFDLE9BQU8sQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLFVBQVUsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsUUFBRyxDQUFDLENBQUMsTUFBTSxLQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUM7QUFBQyxhQUFPLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQyxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxFQUFDLENBQUMsSUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxVQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDLE9BQU8sQ0FBQyxDQUFBO0dBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxRQUFJLENBQUMsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQyxLQUFLO1FBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBRyxDQUFDLENBQUMsT0FBTyxFQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sVUFBVSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxRQUFJLENBQUMsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBQztBQUFDLE9BQUMsR0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQyxPQUFNLENBQUMsQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFFBQUksQ0FBQyxHQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFHLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsUUFBRyxDQUFDLEtBQUcsUUFBUSxFQUFDO0FBQUMsYUFBTSxDQUFDLENBQUMsQ0FBQTtLQUFDLElBQUcsQ0FBQyxLQUFHLENBQUMsUUFBUSxFQUFDO0FBQUMsYUFBTyxDQUFDLENBQUE7S0FBQyxJQUFJLENBQUMsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQyxLQUFLO1FBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBRyxJQUFJLENBQUMsSUFBSSxLQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUM7QUFBQyxhQUFPLENBQUMsQ0FBQyxJQUFJLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO0tBQUMsSUFBRyxDQUFDLENBQUMsT0FBTyxFQUFDO0FBQUMsYUFBTyxJQUFJLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtLQUFDLE9BQU8sVUFBVSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsSUFBRSxJQUFJLENBQUMsSUFBSSxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxBQUFDLENBQUE7R0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsUUFBRyxDQUFDLEtBQUcsUUFBUSxFQUFDO0FBQUMsYUFBTSxDQUFDLENBQUMsQ0FBQTtLQUFDLElBQUcsQ0FBQyxLQUFHLENBQUMsUUFBUSxFQUFDO0FBQUMsYUFBTyxDQUFDLENBQUE7S0FBQyxJQUFJLENBQUMsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQyxLQUFLO1FBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBRyxDQUFDLENBQUMsT0FBTyxFQUFDO0FBQUMsYUFBTyxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDLElBQUcsQ0FBQyxHQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsSUFBSSxFQUFDO0FBQUMsYUFBTyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtLQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsUUFBRyxDQUFDLEtBQUcsUUFBUSxFQUFDO0FBQUMsYUFBTSxDQUFDLENBQUMsQ0FBQTtLQUFDLElBQUcsQ0FBQyxLQUFHLENBQUMsUUFBUSxFQUFDO0FBQUMsYUFBTyxDQUFDLENBQUE7S0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxXQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFdBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsV0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxXQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLGVBQWUsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFdBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsZUFBZSxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsZUFBZSxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsY0FBYyxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsV0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEdBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsWUFBVTtBQUFDLFdBQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxLQUFJLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsWUFBVTtBQUFDLFdBQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQSxLQUFJLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsWUFBVTtBQUFDLFdBQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQSxLQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUFDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUMsWUFBVTtBQUFDLFdBQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQSxLQUFJLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUMsWUFBVTtBQUFDLFdBQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQSxLQUFJLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUMsWUFBVTtBQUFDLFdBQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQSxLQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUFDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUMsWUFBVTtBQUFDLFdBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBQyxZQUFVO0FBQUMsV0FBTyxJQUFJLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUMsWUFBVTtBQUFDLFdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUMsWUFBVTtBQUFDLFdBQU8sSUFBSSxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFDLFlBQVU7QUFBQyxXQUFPLEtBQUssQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsWUFBVTtBQUFDLFdBQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUcsQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxZQUFVO0FBQUMsV0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxLQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUFDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsWUFBVTtBQUFDLFdBQU8sS0FBSyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxZQUFVO0FBQUMsV0FBTyxJQUFJLENBQUMsS0FBSyxLQUFHLENBQUMsQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUMsWUFBVTtBQUFDLFdBQU8sSUFBSSxDQUFDLEtBQUssS0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsYUFBYSxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsUUFBSSxDQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFDLE9BQU8sS0FBSyxDQUFDLElBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFDLE9BQU8sSUFBSSxDQUFDLElBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEVBQUMsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLGFBQWEsR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLGFBQWEsR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxTQUFTLFlBQVksQ0FBQyxDQUFDLEVBQUM7QUFBQyxRQUFJLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUMsT0FBTyxLQUFLLENBQUMsSUFBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxPQUFPLElBQUksQ0FBQyxJQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUMsT0FBTyxLQUFLLENBQUMsSUFBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFDLE9BQU8sSUFBSSxDQUFBO0dBQUMsU0FBUyxlQUFlLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFFBQUksS0FBSyxHQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUU7UUFBQyxDQUFDLEdBQUMsS0FBSztRQUFDLENBQUMsR0FBQyxDQUFDO1FBQUMsQ0FBQztRQUFDLENBQUM7UUFBQyxDQUFDO1FBQUMsQ0FBQyxDQUFDLE9BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBQyxLQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxVQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsU0FBUyxDQUFDLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBQyxTQUFTLEtBQUksQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxJQUFFLENBQUMsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLFNBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFDLE9BQU8sS0FBSyxDQUFDLElBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBQyxTQUFTLElBQUksQ0FBQTtPQUFDLE9BQU8sS0FBSyxDQUFBO0tBQUMsT0FBTyxJQUFJLENBQUE7R0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBQyxVQUFTLE1BQU0sRUFBQztBQUFDLFFBQUksT0FBTyxHQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFHLE9BQU8sS0FBRyxTQUFTLEVBQUMsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxHQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFHLElBQUksSUFBRSxFQUFFLEVBQUMsT0FBTyxlQUFlLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUMsRUFBRSxFQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUMsRUFBRSxFQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxHQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFHLElBQUksR0FBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLENBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxFQUFFLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQUMsT0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQyxPQUFPLGVBQWUsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsZUFBZSxHQUFDLFVBQVMsVUFBVSxFQUFDO0FBQUMsUUFBSSxPQUFPLEdBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUcsT0FBTyxLQUFHLFNBQVMsRUFBQyxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUMsVUFBVSxLQUFHLFNBQVMsR0FBQyxDQUFDLEdBQUMsVUFBVSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsRUFBRSxFQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLE9BQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQyxPQUFPLGVBQWUsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsZUFBZSxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsZUFBZSxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsUUFBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLElBQUk7UUFBQyxJQUFJLEdBQUMsTUFBTSxDQUFDLEdBQUc7UUFBQyxDQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUFDLElBQUksR0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQUMsQ0FBQztRQUFDLEtBQUs7UUFBQyxLQUFLLENBQUMsT0FBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBQztBQUFDLE9BQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLENBQUMsR0FBQyxJQUFJLENBQUMsSUFBSSxHQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtLQUFDLElBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUMsT0FBTyxHQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBQyxtQkFBbUIsQ0FBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUMsRUFBQztBQUFDLE9BQUMsR0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO0tBQUMsSUFBRyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUM7QUFBQyxhQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtLQUFDLE9BQU8sQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksR0FBQyxZQUFVO0FBQUMsUUFBSSxLQUFLLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFHLElBQUksQ0FBQyxJQUFJLEVBQUM7QUFBQyxhQUFPLGFBQWEsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFDLFlBQVU7QUFBQyxRQUFJLEtBQUssR0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUcsS0FBSyxHQUFDLENBQUMsR0FBQyxPQUFPLEVBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxXQUFXLEVBQUMsS0FBSyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFDLFlBQVU7QUFBQyxXQUFPLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFDLFlBQVU7QUFBQyxRQUFJLEtBQUssR0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUcsSUFBSSxDQUFDLElBQUksRUFBQztBQUFDLGFBQU8sSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQTtLQUFDLE9BQU8sYUFBYSxDQUFDLEtBQUssRUFBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLElBQUksR0FBQyxZQUFVO0FBQUMsUUFBSSxLQUFLLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFHLEtBQUssR0FBQyxDQUFDLEdBQUMsQ0FBQyxPQUFPLEVBQUMsT0FBTyxJQUFJLFlBQVksQ0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxXQUFXLEVBQUMsSUFBSSxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFDLFlBQVU7QUFBQyxXQUFPLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLElBQUksV0FBVyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTSxDQUFDLEdBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLElBQUUsSUFBSSxFQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxhQUFhLEdBQUMsV0FBVyxDQUFDLE1BQU07TUFBQyxhQUFhLEdBQUMsV0FBVyxDQUFDLGFBQWEsR0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLGFBQWEsQ0FBQyxDQUFDLEVBQUM7QUFBQyxXQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUUsSUFBSSxDQUFBO0dBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxRQUFJLENBQUMsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsSUFBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFDLFlBQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFDLDZCQUE2QixDQUFDLENBQUE7S0FBQyxJQUFHLENBQUMsR0FBQyxDQUFDLEVBQUMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxNQUFNLEdBQUMsSUFBSSxDQUFDLElBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFDLE9BQU8sTUFBTSxDQUFDLE9BQU0sQ0FBQyxJQUFFLGFBQWEsRUFBQztBQUFDLFlBQU0sR0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBRSxhQUFhLEdBQUMsQ0FBQyxDQUFBO0tBQUMsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBQyxVQUFTLENBQUMsRUFBQztBQUFDLFFBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsWUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUMsNkJBQTZCLENBQUMsQ0FBQTtLQUFDLElBQUcsQ0FBQyxHQUFDLENBQUMsRUFBQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLE1BQU0sR0FBQyxJQUFJLENBQUMsT0FBTSxDQUFDLElBQUUsYUFBYSxFQUFDO0FBQUMsVUFBRyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUUsTUFBTSxDQUFDLFVBQVUsRUFBRSxJQUFFLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBQyxPQUFPLE1BQU0sQ0FBQyxNQUFNLEdBQUMsU0FBUyxDQUFDLE1BQU0sRUFBQyxhQUFhLENBQUMsQ0FBQyxNQUFNLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxHQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLGFBQWEsR0FBQyxDQUFDLENBQUE7S0FBQyxNQUFNLEdBQUMsU0FBUyxDQUFDLE1BQU0sRUFBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsR0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxTQUFTLE9BQU8sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLEVBQUUsRUFBQztBQUFDLEtBQUMsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEdBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRTtRQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsSUFBSSxJQUFJLEdBQUMsS0FBSyxHQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBQyxDQUFDO1FBQUMsSUFBSSxHQUFDLEtBQUssR0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUMsQ0FBQyxDQUFDLElBQUksTUFBTSxHQUFDLENBQUM7UUFBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLElBQUksT0FBTyxHQUFDLElBQUk7UUFBQyxPQUFPLEdBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxHQUFDLEVBQUUsQ0FBQyxPQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFDO0FBQUMsYUFBTyxHQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUMsYUFBYSxDQUFDLENBQUMsTUFBTSxHQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFHLEtBQUssRUFBQztBQUFDLGNBQU0sR0FBQyxhQUFhLEdBQUMsQ0FBQyxHQUFDLE1BQU0sQ0FBQTtPQUFDLE9BQU8sR0FBQyxTQUFTLENBQUMsSUFBSSxFQUFDLGFBQWEsQ0FBQyxDQUFDLE1BQU0sR0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsSUFBRyxLQUFLLEVBQUM7QUFBQyxjQUFNLEdBQUMsYUFBYSxHQUFDLENBQUMsR0FBQyxNQUFNLENBQUE7T0FBQyxJQUFJLEdBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7S0FBQyxJQUFJLEdBQUcsR0FBQyxFQUFFLENBQUMsS0FBSyxHQUFDLENBQUMsR0FBQyxDQUFDLEVBQUMsS0FBSyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsTUFBTSxDQUFDLE1BQU0sR0FBQyxDQUFDLEVBQUMsQ0FBQyxJQUFFLENBQUMsRUFBQyxDQUFDLElBQUUsQ0FBQyxFQUFDO0FBQUMsU0FBRyxHQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0tBQUMsT0FBTyxHQUFHLENBQUE7R0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBQyxZQUFVO0FBQUMsV0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsV0FBTyxPQUFPLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxhQUFPLENBQUMsR0FBQyxDQUFDLENBQUE7S0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsV0FBTyxPQUFPLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxhQUFPLENBQUMsR0FBQyxDQUFDLENBQUE7S0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsV0FBTyxPQUFPLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxhQUFPLENBQUMsR0FBQyxDQUFDLENBQUE7S0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksU0FBUyxHQUFDLENBQUMsSUFBRSxFQUFFO01BQUMsVUFBVSxHQUFDLENBQUMsSUFBSSxHQUFDLENBQUMsSUFBSSxDQUFBLElBQUcsSUFBSSxHQUFDLENBQUMsSUFBSSxDQUFBLEFBQUMsR0FBQyxTQUFTLENBQUMsU0FBUyxRQUFRLENBQUMsQ0FBQyxFQUFDO0FBQUMsUUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUs7UUFBQyxDQUFDLEdBQUMsT0FBTyxDQUFDLEtBQUcsUUFBUSxHQUFDLENBQUMsR0FBQyxTQUFTLEdBQUMsT0FBTyxDQUFDLEtBQUcsUUFBUSxHQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxJQUFJLEdBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO0dBQUMsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUMsSUFBSSxFQUFDO0FBQUMsUUFBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFFLENBQUMsRUFBQztBQUFDLFVBQUksR0FBRyxHQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFFLENBQUMsR0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLEdBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUE7S0FBQyxPQUFNLEVBQUMsQ0FBQyxFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUE7R0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBQyxZQUFVO0FBQUMsUUFBSSxDQUFDLEdBQUMsSUFBSSxDQUFDLElBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEVBQUM7QUFBQyxPQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDLElBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLEVBQUM7QUFBQyxhQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDLE9BQU8sTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxLQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUE7R0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsS0FBQyxHQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBO0dBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLEtBQUMsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsT0FBTyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUMsT0FBTyxDQUFDLENBQUMsSUFBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUM7UUFBQyxDQUFDLENBQUMsT0FBTSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFDO0FBQUMsT0FBQyxHQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQyxPQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBQztBQUFDLE9BQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0tBQUMsR0FBRTtBQUFDLGFBQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFDO0FBQUMsU0FBQyxHQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7T0FBQyxJQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxTQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtPQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO0tBQUMsUUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxLQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUE7R0FBQyxTQUFTLFdBQVcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsS0FBQyxHQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO1FBQUMsSUFBSSxHQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEdBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxLQUFLLENBQUMsT0FBTyxFQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTSxHQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxHQUFDLEVBQUU7UUFBQyxVQUFVLEdBQUMsSUFBSSxDQUFDLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQUMsVUFBSSxHQUFHLEdBQUMsVUFBVSxHQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEdBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUcsS0FBSyxHQUFDLEdBQUcsRUFBQyxVQUFVLEdBQUMsS0FBSyxDQUFBO0tBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFDLElBQUksRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO0dBQUMsSUFBSSxTQUFTLEdBQUMsU0FBVixTQUFTLENBQVUsSUFBSSxFQUFDLElBQUksRUFBQyxRQUFRLEVBQUMsYUFBYSxFQUFDO0FBQUMsWUFBUSxHQUFDLFFBQVEsSUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLEdBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUcsQ0FBQyxhQUFhLEVBQUM7QUFBQyxVQUFJLEdBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsR0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7S0FBQyxJQUFJLE1BQU0sR0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksT0FBTyxHQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxjQUFjLEdBQUMsRUFBRSxDQUFDLEtBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsUUFBUSxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLG9CQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBO0tBQUMsS0FBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFBQyxVQUFJLENBQUMsR0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEtBQUcsR0FBRyxFQUFDLFNBQVMsSUFBRyxDQUFDLElBQUksY0FBYyxFQUFDO0FBQUMsWUFBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUUsT0FBTyxFQUFDO0FBQUMsY0FBRyxDQUFDLEtBQUcsR0FBRyxJQUFFLE9BQU8sS0FBRyxDQUFDLEVBQUMsU0FBUyxNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsR0FBQyxnQ0FBZ0MsR0FBQyxJQUFJLEdBQUMsR0FBRyxDQUFDLENBQUE7U0FBQztPQUFDO0tBQUMsSUFBSSxHQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLE1BQU0sR0FBQyxFQUFFLENBQUMsSUFBSSxVQUFVLEdBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFHLEdBQUcsQ0FBQyxLQUFJLENBQUMsR0FBQyxVQUFVLEdBQUMsQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLFVBQUksQ0FBQyxHQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsSUFBSSxjQUFjLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUcsQ0FBQyxLQUFHLEdBQUcsRUFBQztBQUFDLFlBQUksS0FBSyxHQUFDLENBQUMsQ0FBQyxHQUFFO0FBQUMsV0FBQyxFQUFFLENBQUE7U0FBQyxRQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBRyxHQUFHLElBQUUsQ0FBQyxHQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtPQUFDLE1BQUssTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLEdBQUMsMkJBQTJCLENBQUMsQ0FBQTtLQUFDLE9BQU8sa0JBQWtCLENBQUMsTUFBTSxFQUFDLElBQUksRUFBQyxVQUFVLENBQUMsQ0FBQTtHQUFDLENBQUMsU0FBUyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUMsSUFBSSxFQUFDLFVBQVUsRUFBQztBQUFDLFFBQUksR0FBRyxHQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFBQyxHQUFHLEdBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUFDLENBQUMsQ0FBQyxLQUFJLENBQUMsR0FBQyxNQUFNLENBQUMsTUFBTSxHQUFDLENBQUMsRUFBQyxDQUFDLElBQUUsQ0FBQyxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQUMsU0FBRyxHQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQUMsT0FBTyxVQUFVLEdBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFDLEdBQUcsQ0FBQTtHQUFDLFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBQyxRQUFRLEVBQUM7QUFBQyxZQUFRLEdBQUMsUUFBUSxJQUFFLGdCQUFnQixDQUFDLElBQUcsS0FBSyxHQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUM7QUFBQyxhQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUFDLE9BQU0sR0FBRyxHQUFDLEtBQUssR0FBQyxHQUFHLENBQUE7R0FBQyxTQUFTLE1BQU0sQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFDO0FBQUMsUUFBSSxHQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBQztBQUFDLFVBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFDLE9BQU0sRUFBQyxLQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxVQUFVLEVBQUMsS0FBSyxFQUFDLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQywyQ0FBMkMsQ0FBQyxDQUFBO0tBQUMsSUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxVQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBQyxPQUFNLEVBQUMsS0FBSyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsVUFBVSxFQUFDLEtBQUssRUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFDLE9BQU0sRUFBQyxLQUFLLEVBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxVQUFVLEVBQUMsS0FBSyxFQUFDLENBQUMsSUFBSSxHQUFHLEdBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU0sRUFBQyxLQUFLLEVBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFDLEdBQUcsQ0FBQyxFQUFDLFVBQVUsRUFBQyxLQUFLLEVBQUMsQ0FBQTtLQUFDLElBQUksR0FBRyxHQUFDLEtBQUssQ0FBQyxJQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsSUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUM7QUFBQyxTQUFHLEdBQUMsSUFBSSxDQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7S0FBQyxJQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBQztBQUFDLFVBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFDLE9BQU0sRUFBQyxLQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxVQUFVLEVBQUMsS0FBSyxFQUFDLENBQUMsT0FBTSxFQUFDLEtBQUssRUFBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDLEVBQUMsVUFBVSxFQUFDLEdBQUcsRUFBQyxDQUFBO0tBQUMsSUFBSSxHQUFHLEdBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxHQUFDLENBQUM7UUFBQyxNQUFNLENBQUMsT0FBTSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBRSxDQUFDLEVBQUM7QUFBQyxZQUFNLEdBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEdBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssR0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUcsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFDO0FBQUMsYUFBSyxHQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxHQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtPQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUE7S0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLE9BQU0sRUFBQyxLQUFLLEVBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFDLFVBQVUsRUFBQyxHQUFHLEVBQUMsQ0FBQTtHQUFDLFNBQVMsWUFBWSxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUMsUUFBUSxFQUFDO0FBQUMsUUFBSSxHQUFHLEdBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMsQ0FBQyxPQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBQyxHQUFHLEdBQUMsRUFBRSxDQUFBLEdBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBUyxDQUFDLEVBQUM7QUFBQyxhQUFPLFNBQVMsQ0FBQyxDQUFDLEVBQUMsUUFBUSxDQUFDLENBQUE7S0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0dBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUMsVUFBUyxLQUFLLEVBQUM7QUFBQyxXQUFPLE1BQU0sQ0FBQyxJQUFJLEVBQUMsS0FBSyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFDLFVBQVMsS0FBSyxFQUFDO0FBQUMsV0FBTyxNQUFNLENBQUMsSUFBSSxFQUFDLEtBQUssQ0FBQyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBQyxVQUFTLEtBQUssRUFBQztBQUFDLFdBQU8sTUFBTSxDQUFDLElBQUksRUFBQyxLQUFLLENBQUMsQ0FBQTtHQUFDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUMsVUFBUyxLQUFLLEVBQUMsUUFBUSxFQUFDO0FBQUMsUUFBRyxLQUFLLEtBQUcsU0FBUyxFQUFDLEtBQUssR0FBQyxFQUFFLENBQUMsSUFBRyxLQUFLLEtBQUcsRUFBRSxFQUFDLE9BQU8sWUFBWSxDQUFDLElBQUksRUFBQyxLQUFLLEVBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUMsSUFBSSxDQUFDLEtBQUs7UUFBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU07UUFBQyxHQUFHLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQUMsS0FBSyxHQUFDLFNBQVM7UUFBQyxLQUFLLENBQUMsT0FBTSxFQUFFLENBQUMsSUFBRSxDQUFDLEVBQUM7QUFBQyxXQUFLLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBQyxLQUFLLENBQUE7S0FBQyxJQUFJLElBQUksR0FBQyxJQUFJLENBQUMsSUFBSSxHQUFDLEdBQUcsR0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLEdBQUMsR0FBRyxDQUFBO0dBQUMsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBQyxVQUFTLEtBQUssRUFBQyxRQUFRLEVBQUM7QUFBQyxRQUFHLEtBQUssS0FBRyxTQUFTLEVBQUMsS0FBSyxHQUFDLEVBQUUsQ0FBQyxJQUFHLEtBQUssSUFBRSxFQUFFLEVBQUMsT0FBTyxZQUFZLENBQUMsSUFBSSxFQUFDLEtBQUssRUFBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7R0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFDLFlBQVU7QUFBQyxXQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQTtHQUFDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUMsWUFBVTtBQUFDLFdBQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQTtHQUFDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUMsWUFBVTtBQUFDLFdBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQTtHQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUMsWUFBVTtBQUFDLFdBQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQTtHQUFDLENBQUMsU0FBUyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUM7QUFBQyxRQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUMsVUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEtBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFDLE9BQU8sb0JBQW9CLEdBQUMsSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsR0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDLElBQUksSUFBSSxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBRyxHQUFHLENBQUMsSUFBRyxJQUFJLEVBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEdBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFHLEtBQUssQ0FBQyxNQUFNLEdBQUMsQ0FBQyxFQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLEdBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUcsS0FBSyxDQUFDLE1BQU0sS0FBRyxDQUFDLEVBQUM7QUFBQyxVQUFJLEdBQUcsR0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUcsR0FBRyxFQUFDLEdBQUcsR0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFHLEdBQUcsS0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsR0FBQyxHQUFHLEdBQUMsMkJBQTJCLENBQUMsQ0FBQyxJQUFJLElBQUksR0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxZQUFZLEdBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFHLFlBQVksSUFBRSxDQUFDLEVBQUM7QUFBQyxXQUFHLElBQUUsSUFBSSxDQUFDLE1BQU0sR0FBQyxZQUFZLEdBQUMsQ0FBQyxDQUFDLElBQUksR0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxZQUFZLENBQUMsR0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksR0FBQyxDQUFDLENBQUMsQ0FBQTtPQUFDLElBQUcsR0FBRyxHQUFDLENBQUMsRUFBQyxNQUFNLElBQUksS0FBSyxDQUFDLG9EQUFvRCxDQUFDLENBQUMsSUFBSSxJQUFFLElBQUksS0FBSyxDQUFDLEdBQUcsR0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFDLElBQUksQ0FBQTtLQUFDLElBQUksT0FBTyxHQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFHLENBQUMsT0FBTyxFQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLEdBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxvQkFBb0IsRUFBQztBQUFDLGFBQU8sSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksR0FBQyxHQUFHLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7S0FBQyxJQUFJLENBQUMsR0FBQyxFQUFFO1FBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQyxNQUFNO1FBQUMsQ0FBQyxHQUFDLFFBQVE7UUFBQyxHQUFHLEdBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQyxPQUFNLEdBQUcsR0FBQyxDQUFDLEVBQUM7QUFBQyxPQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLElBQUcsR0FBRyxHQUFDLENBQUMsRUFBQyxHQUFHLEdBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUE7S0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDLENBQUE7R0FBQyxTQUFTLGdCQUFnQixDQUFDLENBQUMsRUFBQztBQUFDLFFBQUcsb0JBQW9CLEVBQUM7QUFBQyxhQUFPLElBQUksWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0tBQUMsSUFBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBQyxVQUFHLENBQUMsS0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLEdBQUMscUJBQXFCLENBQUMsQ0FBQyxPQUFPLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFBO0tBQUMsT0FBTyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtHQUFDLFNBQVMsVUFBVSxDQUFDLENBQUMsRUFBQztBQUFDLFFBQUcsT0FBTyxDQUFDLEtBQUcsUUFBUSxFQUFDO0FBQUMsYUFBTyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDLElBQUcsT0FBTyxDQUFDLEtBQUcsUUFBUSxFQUFDO0FBQUMsYUFBTyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDLElBQUcsT0FBTyxDQUFDLEtBQUcsUUFBUSxFQUFDO0FBQUMsYUFBTyxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUFDLE9BQU8sQ0FBQyxDQUFBO0dBQUMsS0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUFDLFdBQU8sQ0FBQyxDQUFDLENBQUMsR0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRyxDQUFDLEdBQUMsQ0FBQyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQUMsT0FBTyxDQUFDLEdBQUcsR0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksR0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsR0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQUMsV0FBTyxDQUFDLFlBQVksVUFBVSxJQUFFLENBQUMsWUFBWSxZQUFZLElBQUUsQ0FBQyxZQUFZLFlBQVksQ0FBQTtHQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBQyxVQUFTLE1BQU0sRUFBQyxJQUFJLEVBQUMsVUFBVSxFQUFDO0FBQUMsV0FBTyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUUsRUFBRSxDQUFDLEVBQUMsVUFBVSxDQUFDLENBQUE7R0FBQyxDQUFDLE9BQU8sT0FBTyxDQUFBO0NBQUMsQ0FBQSxFQUFFLENBQUMsSUFBRyxPQUFPLE1BQU0sS0FBRyxXQUFXLElBQUUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsRUFBQztBQUFDLFFBQU0sQ0FBQyxPQUFPLEdBQUMsTUFBTSxDQUFBO0NBQUMsSUFBRyxPQUFPLE1BQU0sS0FBRyxVQUFVLElBQUUsTUFBTSxDQUFDLEdBQUcsRUFBQztBQUFDLFFBQU0sQ0FBQyxhQUFhLEVBQUMsRUFBRSxFQUFDLFlBQVU7QUFBQyxXQUFPLE1BQU0sQ0FBQTtHQUFDLENBQUMsQ0FBQTtDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNrQ25uK0IsSUFBTSxZQUFZLEdBQUksQ0FBQSxZQUFZOztBQUU5QixRQUFJLFFBQVEsWUFBQSxDQUFDO0FBQ2IsUUFBSSxpQkFBaUIsR0FBRyxFQUFFLENBQUM7QUFDM0IsUUFBTSxrQkFBa0IsR0FBRyxFQUFFLENBQUM7QUFDOUIsUUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDOztBQUUxQixhQUFTLE1BQU0sQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUU7QUFDcEQsWUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxhQUFhLEVBQUU7QUFDakMsbUJBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRztBQUNaLHdCQUFRLEVBQUUsYUFBYTtBQUN2Qix3QkFBUSxFQUFFLFFBQVE7YUFDckIsQ0FBQztTQUNMO0tBQ0o7Ozs7Ozs7Ozs7Ozs7O0FBY0QsYUFBUyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFO0FBQzlDLGFBQUssSUFBTSxDQUFDLElBQUksaUJBQWlCLEVBQUU7QUFDL0IsZ0JBQU0sR0FBRyxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLGdCQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO0FBQ25ELHVCQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUM7YUFDdkI7U0FDSjtBQUNELGVBQU8sSUFBSSxDQUFDO0tBQ2Y7Ozs7Ozs7Ozs7O0FBV0QsYUFBUyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRTtBQUN4RCxhQUFLLElBQU0sQ0FBQyxJQUFJLGlCQUFpQixFQUFFO0FBQy9CLGdCQUFNLEdBQUcsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxnQkFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtBQUNuRCxpQ0FBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQ3pDLHVCQUFPO2FBQ1Y7U0FDSjtBQUNELHlCQUFpQixDQUFDLElBQUksQ0FBQztBQUNuQixnQkFBSSxFQUFFLFNBQVM7QUFDZixtQkFBTyxFQUFFLE9BQU87QUFDaEIsb0JBQVEsRUFBRSxRQUFRO1NBQ3JCLENBQUMsQ0FBQztLQUNOOzs7Ozs7Ozs7QUFTRCxhQUFTLHdCQUF3QixDQUFDLE9BQU8sRUFBRTtBQUN2Qyx5QkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsVUFBQSxDQUFDO21CQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssT0FBTztTQUFBLENBQUMsQ0FBQztLQUM1RTs7Ozs7Ozs7QUFRRCxhQUFTLGdCQUFnQixDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7QUFDNUMsZUFBTyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDL0I7O0FBRUQsYUFBUyxhQUFhLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUU7QUFDbEQsWUFBSSxJQUFJLElBQUksY0FBYyxFQUFFO0FBQ3hCLDBCQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDO1NBQ2xDO0tBQ0o7Ozs7Ozs7O0FBUUQsYUFBUyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQ3ZDLHFCQUFhLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztLQUNoRDs7QUFFRCxhQUFTLHFCQUFxQixDQUFDLElBQUksRUFBRTtBQUNqQyxlQUFPLGdCQUFnQixDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztLQUNqRDs7QUFFRCxhQUFTLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRTtBQUN2QyxZQUFJLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsRUFBRSxjQUFjLENBQUMsQ0FBQzs7QUFFdkYsWUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNWLG1CQUFPLEdBQUcsVUFBVSxPQUFPLEVBQUU7QUFDekIsb0JBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtBQUN2QiwyQkFBTyxHQUFHLEVBQUUsQ0FBQztpQkFDaEI7QUFDRCx1QkFBTztBQUNILDBCQUFNLEVBQUUsa0JBQVk7QUFDaEIsK0JBQU8sS0FBSyxDQUFDLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztxQkFDdEQ7aUJBQ0osQ0FBQzthQUNMLENBQUM7O0FBRUYsMEJBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLE9BQU8sQ0FBQztTQUNwRTtBQUNELGVBQU8sT0FBTyxDQUFDO0tBQ2xCOzs7Ozs7OztBQVFELGFBQVMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtBQUMzQyxxQkFBYSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztLQUNwRDs7QUFFRCxhQUFTLHlCQUF5QixDQUFDLElBQUksRUFBRTtBQUNyQyxlQUFPLGdCQUFnQixDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0tBQ3JEOztBQUVELGFBQVMsbUJBQW1CLENBQUMsZ0JBQWdCLEVBQUU7QUFDM0MsWUFBSSxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMscUJBQXFCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztBQUMzRixZQUFJLENBQUMsT0FBTyxFQUFFO0FBQ1YsbUJBQU8sR0FBRyxVQUFVLE9BQU8sRUFBRTtBQUN6QixvQkFBSSxRQUFRLFlBQUEsQ0FBQztBQUNiLG9CQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7QUFDdkIsMkJBQU8sR0FBRyxFQUFFLENBQUM7aUJBQ2hCO0FBQ0QsdUJBQU87QUFDSCwrQkFBVyxFQUFFLHVCQUFZOztBQUVyQiw0QkFBSSxDQUFDLFFBQVEsRUFBRTtBQUNYLG9DQUFRLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLENBQUM7eUJBQ3BGOztBQUVELDRCQUFJLENBQUMsUUFBUSxFQUFFO0FBQ1gsb0NBQVEsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3ZELDZDQUFpQixDQUFDLElBQUksQ0FBQztBQUNuQixvQ0FBSSxFQUFFLGdCQUFnQixDQUFDLHFCQUFxQjtBQUM1Qyx1Q0FBTyxFQUFFLE9BQU87QUFDaEIsd0NBQVEsRUFBRSxRQUFROzZCQUNyQixDQUFDLENBQUM7eUJBQ047QUFDRCwrQkFBTyxRQUFRLENBQUM7cUJBQ25CO2lCQUNKLENBQUM7YUFDTCxDQUFDO0FBQ0YsOEJBQWtCLENBQUMsZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsR0FBRyxPQUFPLENBQUM7U0FDeEU7O0FBRUQsZUFBTyxPQUFPLENBQUM7S0FDbEI7O0FBRUQsYUFBUyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTs7QUFFNUMsWUFBSSxhQUFhLFlBQUEsQ0FBQztBQUNsQixZQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQztBQUN6RCxZQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRTNDLFlBQUksZUFBZSxFQUFFOztBQUVqQixnQkFBSSxTQUFTLEdBQUcsZUFBZSxDQUFDLFFBQVEsQ0FBQzs7QUFFekMsZ0JBQUksZUFBZSxDQUFDLFFBQVEsRUFBRTs7O0FBRTFCLDZCQUFhLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUMsT0FBTyxFQUFQLE9BQU8sRUFBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3hELHlCQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztBQUN4QiwyQkFBTyxFQUFQLE9BQU87QUFDUCwyQkFBTyxFQUFFLFFBQVE7QUFDakIsMEJBQU0sRUFBRSxhQUFhO2lCQUN4QixFQUFFLElBQUksQ0FBQyxDQUFDOztBQUVULHFCQUFLLElBQU0sSUFBSSxJQUFJLFNBQVMsRUFBRTtBQUMxQix3QkFBSSxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3BDLHFDQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUN6QztpQkFDSjthQUVKLE1BQU07OztBQUVILHVCQUFPLFNBQVMsQ0FBQyxLQUFLLENBQUM7QUFDbkIsMkJBQU8sRUFBUCxPQUFPO0FBQ1AsMkJBQU8sRUFBRSxRQUFRO2lCQUNwQixFQUFFLElBQUksQ0FBQyxDQUFDO2FBRVo7U0FDSixNQUFNOztBQUVILHlCQUFhLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUMsT0FBTyxFQUFQLE9BQU8sRUFBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzNEOzs7QUFHRCxxQkFBYSxDQUFDLFlBQVksR0FBRyxZQUFZO0FBQUMsbUJBQU8sU0FBUyxDQUFDO1NBQUMsQ0FBQzs7QUFFN0QsZUFBTyxhQUFhLENBQUM7S0FDeEI7O0FBRUQsWUFBUSxHQUFHO0FBQ1AsY0FBTSxFQUFFLE1BQU07QUFDZCw0QkFBb0IsRUFBRSxvQkFBb0I7QUFDMUMsNEJBQW9CLEVBQUUsb0JBQW9CO0FBQzFDLGdDQUF3QixFQUFFLHdCQUF3QjtBQUNsRCwyQkFBbUIsRUFBRSxtQkFBbUI7QUFDeEMsaUNBQXlCLEVBQUUseUJBQXlCO0FBQ3BELDhCQUFzQixFQUFFLHNCQUFzQjtBQUM5Qyx1QkFBZSxFQUFFLGVBQWU7QUFDaEMsNkJBQXFCLEVBQUUscUJBQXFCO0FBQzVDLDBCQUFrQixFQUFFLGtCQUFrQjtLQUN6QyxDQUFDOztBQUVGLFdBQU8sUUFBUSxDQUFDO0NBRW5CLENBQUEsRUFBRSxBQUFDLENBQUM7O3FCQUVVLFlBQVk7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQ3ZPckIsVUFBVTthQUFWLFVBQVU7OEJBQVYsVUFBVTs7O2lCQUFWLFVBQVU7O2VBQ0wsZ0JBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRTtBQUNwQixnQkFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPOztBQUVwQixnQkFBSSxRQUFRLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ2hELGdCQUFJLFVBQVUsR0FBRyxNQUFNLEdBQUcsTUFBTSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7O0FBR3BELGlCQUFLLElBQU0sR0FBRyxJQUFJLE1BQU0sRUFBRTtBQUN0QixvQkFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxBQUFDLEVBQUUsU0FBUztBQUN0RSxvQkFBSSxVQUFVLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxTQUFTO0FBQ2xFLG9CQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBRTNCO1NBQ0o7OztXQWRDLFVBQVU7OztxQkFpQkQsVUFBVTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDakJuQixVQUFVO2FBQVYsVUFBVTs4QkFBVixVQUFVOzs7aUJBQVYsVUFBVTs7ZUFDTCxnQkFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFO0FBQ3BCLGdCQUFJLENBQUMsTUFBTSxFQUFFLE9BQU87O0FBRXBCLGdCQUFJLFFBQVEsR0FBRyxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDaEQsZ0JBQUksVUFBVSxHQUFHLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQzs7QUFHcEQsaUJBQUssSUFBTSxHQUFHLElBQUksTUFBTSxFQUFFO0FBQ3RCLG9CQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEFBQUMsRUFBRSxTQUFTO0FBQ3RFLG9CQUFJLFVBQVUsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFNBQVM7QUFDbEUsb0JBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7YUFFM0I7U0FDSjs7O1dBZEMsVUFBVTs7O3FCQWlCRCxVQUFVOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzBDQ3BCRyxpQ0FBaUM7Ozs7QUFFN0QsU0FBUyx5QkFBeUIsQ0FBQyxNQUFNLEVBQUU7O0FBRXZDLFVBQU0sR0FBRyxNQUFNLElBQUksRUFBRSxDQUFDOztBQUV0QixRQUFJLFFBQVEsWUFBQTtRQUNSLE1BQU0sWUFBQTtRQUNOLGFBQWEsWUFBQTtRQUNiLE9BQU8sWUFBQTtRQUNQLElBQUksWUFBQTtRQUNKLG1CQUFtQixZQUFBO1FBQ25CLFNBQVMsWUFBQTtRQUNULGlCQUFpQixZQUFBO1FBQ2pCLEtBQUssWUFBQSxDQUFDOztBQUVWLFFBQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUM7QUFDL0MsUUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUM7QUFDbkQsUUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUMzQixRQUFNLGNBQWMsR0FBRywyQkFBMkIsQ0FBQzs7QUFFbkQsYUFBUyxLQUFLLEdBQUc7QUFDYixjQUFNLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUN0Qzs7QUFFRCxhQUFTLFVBQVUsR0FBRztBQUNsQixZQUFJLEdBQUcsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2pDLHFCQUFhLEdBQUcsZUFBZSxDQUFDLGdCQUFnQixFQUFFLENBQUM7O0FBRW5ELGVBQU8sR0FBRyxLQUFLLENBQUM7QUFDaEIsaUJBQVMsR0FBRyxJQUFJLENBQUM7QUFDakIseUJBQWlCLEdBQUcsSUFBSSxDQUFDO0tBQzVCOztBQUVELGFBQVMsS0FBSyxHQUFHO0FBQ2IsWUFBSSxPQUFPLEVBQUUsT0FBTzs7QUFFcEIsY0FBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFdEIsZUFBTyxHQUFHLElBQUksQ0FBQztBQUNmLGlCQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNqQyxhQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUVWLDRCQUFvQixFQUFFLENBQUM7S0FDMUI7O0FBRUQsYUFBUyxJQUFJLEdBQUc7QUFDWixZQUFJLENBQUMsT0FBTyxFQUFFLE9BQU87O0FBRXJCLGNBQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRXJCLG9CQUFZLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNsQyxlQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ2hCLGlCQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLHlCQUFpQixHQUFHLElBQUksQ0FBQztLQUM1Qjs7QUFFRCxhQUFTLEtBQUssR0FBRztBQUNiLFlBQUksRUFBRSxDQUFDO0tBQ1Y7O0FBRUQsYUFBUyxvQkFBb0IsR0FBRztBQUM1QixZQUFJLENBQUMsT0FBTyxFQUFFLE9BQU87OztBQUdyQixZQUFNLGNBQWMsR0FBRyx3QkFBd0IsRUFBRSxDQUFDO0FBQ2xELFlBQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDL0QsWUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzFJLFlBQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQztBQUN0RSxZQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQzs7Ozs7QUFLOUMsWUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQzs7O0FBRzFFLHVCQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN2Qzs7QUFFRCxhQUFTLG9CQUFvQixDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFO0FBQy9ELFlBQUksU0FBUyxHQUFHLFVBQVUsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDO0FBQ3JELFlBQUksT0FBTyxHQUFHLDZDQUFxQixDQUFDOztBQUVwQyxlQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN6QixlQUFPLENBQUMsSUFBSSxHQUFHLHFCQUFxQixDQUFDOztBQUVyQyxlQUFPLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDO0FBQzFDLGVBQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUM7QUFDekMsZUFBTyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7Ozs7QUFJOUIsZUFBTyxDQUFDLE9BQU8sR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDO0FBQ3ZDLGVBQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxFQUFFLENBQUM7QUFDeEIsZUFBTyxDQUFDLFNBQVMsR0FBRyxlQUFlLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDbkQsZUFBTyxDQUFDLGVBQWUsR0FBRyxjQUFjLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztBQUMxRCxlQUFPLENBQUMsZ0JBQWdCLEdBQUcsY0FBYyxDQUFDLEVBQUUsQ0FBQztBQUM3QyxlQUFPLENBQUMsR0FBRyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO0FBQ3BHLGVBQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMzRSxlQUFPLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9GLGVBQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7O0FBRW5FLGVBQU8sT0FBTyxDQUFDO0tBQ2xCOztBQUVELGFBQVMsd0JBQXdCLEdBQUc7QUFDaEMsWUFBTSx3QkFBd0IsR0FBRyxlQUFlLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztBQUMvRSxZQUFNLGNBQWMsR0FBRyx3QkFBd0IsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO0FBQzNFLGVBQU8sY0FBYyxDQUFDO0tBQ3pCOztBQUVELGFBQVMsZUFBZSxDQUFDLE9BQU8sRUFBRTs7QUFFOUIsWUFBSSxlQUFlLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsRUFBRTs7QUFFdkUsa0JBQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUNoQyxnQkFBSSxFQUFFLENBQUM7QUFDUCxtQkFBTztTQUNWOztBQUVELHFCQUFhLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3pDOztBQUVELGFBQVMsa0JBQWtCLENBQUUsQ0FBQyxFQUFFO0FBQzVCLFlBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTzs7QUFFckIsWUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUMxQixZQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtBQUNiLGtCQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDeEMsbUJBQU87U0FDVjs7QUFFRCxZQUFJLGlCQUFpQixZQUFBO1lBQ2pCLFNBQVMsWUFBQTtZQUNULEtBQUssWUFBQSxDQUFDOzs7O0FBSVYsWUFBSSxDQUFDLGlCQUFpQixFQUFFO0FBQ3BCLDZCQUFpQixHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7U0FDekM7OztBQUdELGlCQUFTLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLFNBQVMsQ0FBQSxHQUFJLElBQUksQ0FBQztBQUN0RCx5QkFBaUIsR0FBRyxBQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFFBQVEsR0FBSSxpQkFBaUIsQ0FBQztBQUMvRSxhQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUcsaUJBQWlCLEdBQUcsU0FBUyxDQUFFLENBQUM7OztBQUdyRCxvQkFBWSxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDbEMsMkJBQW1CLEdBQUcsVUFBVSxDQUFDLFlBQVk7QUFDekMsK0JBQW1CLEdBQUcsSUFBSSxDQUFDO0FBQzNCLGdDQUFvQixFQUFFLENBQUM7U0FDMUIsRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDcEI7O0FBRUQsYUFBUyxPQUFPLEdBQUc7QUFDZixlQUFPLElBQUksQ0FBQztLQUNmOztBQUVELFlBQVEsR0FBRztBQUNQLGtCQUFVLEVBQUUsVUFBVTtBQUN0QixzQkFBYyxFQUFFLGNBQWM7QUFDOUIsYUFBSyxFQUFFLEtBQUs7QUFDWiwwQkFBa0IsRUFBRSxrQkFBa0I7QUFDdEMsZUFBTyxFQUFFLE9BQU87QUFDaEIsYUFBSyxFQUFFLEtBQUs7S0FDZixDQUFDOztBQUVGLFNBQUssRUFBRSxDQUFDOztBQUVSLFdBQU8sUUFBUSxDQUFDO0NBQ25COztBQUVELHlCQUF5QixDQUFDLHFCQUFxQixHQUFHLDJCQUEyQixDQUFDO3FCQUMvRCxNQUFNLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyx5QkFBeUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzQ0NoTHJELDZCQUE2Qjs7OzsrQkFDL0Isb0JBQW9COzs7OzBDQUV2QixnQ0FBZ0M7Ozs7Ozs7OztBQU9uRCxTQUFTLHdCQUF3QixDQUFDLE1BQU0sRUFBRTs7QUFFdEMsVUFBTSxHQUFHLE1BQU0sSUFBSSxFQUFFLENBQUM7QUFDdEIsUUFBSSxRQUFRLFlBQUE7UUFDUixJQUFJLFlBQUE7UUFDSixNQUFNLFlBQUEsQ0FBQztBQUNYLFFBQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7QUFDdkMsUUFBTSxrQkFBa0IsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUM7QUFDckQsUUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztBQUN2QyxRQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO0FBQ2pDLFFBQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7QUFDakMsUUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQzs7QUFFM0IsYUFBUyxLQUFLLEdBQUc7QUFDYixjQUFNLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNuQyxZQUFJLEdBQUcsRUFBRSxDQUFDO0tBQ2I7O0FBRUQsYUFBUyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFO0FBQ3ZELFlBQU0sd0JBQXdCLEdBQUcsZUFBZSxDQUFDLDJCQUEyQixFQUFFLENBQUM7QUFDL0UsWUFBTSxjQUFjLEdBQUcsd0JBQXdCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQzs7QUFFM0UsWUFBTSxRQUFRLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUMvRCxZQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUksWUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUM7O0FBRXZELFlBQUksR0FBRyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7OztBQUdqQyxZQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssU0FBUyxJQUFJLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFO0FBQy9ELG1CQUFPO1NBQ1Y7O0FBRUQsWUFBSSxDQUFDLElBQUksRUFBRTtBQUNQLHdCQUFZLENBQUMsS0FBSyxDQUFDLHdDQUFnQiw2QkFBVSxnQkFBZ0IsRUFBRSw2QkFBVSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7QUFDL0YsbUJBQU87U0FDVjs7O0FBR0QsWUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO0FBQzlELFlBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDM0IsWUFBSSxLQUFLLFlBQUE7WUFDTCxXQUFXLFlBQUE7WUFDWCxLQUFLLFlBQUEsQ0FBQztBQUNWLFlBQUksT0FBTyxHQUFHLElBQUksQ0FBQztBQUNuQixZQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDVixZQUFJLHFCQUFxQixHQUFHLElBQUksQ0FBQzs7QUFFakMsWUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUN0QixtQkFBTztTQUNWOzs7QUFHRCxhQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7O0FBSW5CLFlBQUksUUFBUSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7O0FBRTVCLHVCQUFXLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEYsZ0JBQUksS0FBSyxDQUFDLHNCQUFzQixHQUFJLFdBQVcsR0FBSSxRQUFRLENBQUMsb0JBQW9CLEdBQUcsU0FBUyxBQUFDLEFBQUMsRUFBRTtBQUM1Rix1QkFBTzthQUNWO1NBQ0o7Ozs7O0FBS0QsbUJBQVcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7OztBQUk5SSxZQUFJLEtBQUssQ0FBQyxzQkFBc0IsSUFBSSxXQUFXLEVBQUU7O0FBRTdDLGlCQUFLLEdBQUc7QUFDSixxQkFBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUztBQUNoQyxtQkFBRyxFQUFFLEFBQUMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLFNBQVMsR0FBSSxPQUFPLENBQUMsUUFBUTthQUNqRSxDQUFDOztBQUVGLHFCQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLGFBQWEsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ2xGLG1CQUFPO1NBQ1Y7OztBQUdELGVBQU8sR0FBRyxFQUFFLENBQUM7QUFDYixlQUFPLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQztBQUN6QyxlQUFPLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQzs7QUFFcEMsWUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFO0FBQ3ZCLG1CQUFPLENBQUMsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvRCxtQkFBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsc0JBQXNCLENBQUM7U0FDcEQ7OztBQUdELFlBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2hELFlBQUksV0FBVyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxLQUFLLE9BQU8sQ0FBQyxDQUFDLEVBQUU7QUFDN0Msa0JBQU0sQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUUsV0FBVyxDQUFDLENBQUMsR0FBRyxRQUFRLEdBQUcsV0FBVyxDQUFDLENBQUMsR0FBRyxNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQyxDQUFDO0FBQy9ILHVCQUFXLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQztTQUM3Qzs7QUFFRCxnQkFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzs7O0FBR3ZCLFlBQUksUUFBUSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDNUIsZ0JBQUksSUFBSSxLQUFLLE9BQU8sRUFBRTtBQUNsQix1QkFBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLG9CQUFJLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQSxHQUFJLFNBQVMsQ0FBQztBQUM5QyxvQkFBSSxHQUFHLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO0FBQ2pELDRCQUFRLENBQUMsT0FBTyxDQUFDLHdDQUFPLHlCQUF5QixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztpQkFDMUY7YUFDSjtBQUNELG1CQUFPO1NBQ1Y7O2FBRUksSUFBSSxRQUFRLENBQUMsb0JBQW9CLElBQUksUUFBUSxDQUFDLG9CQUFvQixHQUFHLENBQUMsRUFBRTs7QUFFekUsdUJBQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4QyxpQkFBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7OztBQUdkLHFDQUFxQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUksUUFBUSxDQUFDLG9CQUFvQixHQUFHLFNBQVMsQ0FBQyxHQUFJLFNBQVMsQ0FBQyxDQUFDOzs7QUFHbEcsdUJBQU8sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEIsdUJBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxHQUFHLHFCQUFxQixFQUFFOztBQUU5RCw0QkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdEIsMkJBQU8sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ3pCOzs7QUFHRCxxQkFBSyxHQUFHO0FBQ0oseUJBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVM7QUFDaEMsdUJBQUcsRUFBRSxBQUFDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxTQUFTLEdBQUksT0FBTyxDQUFDLFFBQVE7aUJBQ2pFLENBQUM7O0FBRUYseUJBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUN4RTs7QUFFRCxnQ0FBd0IsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdkU7O0FBRUQsYUFBUyxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUU7QUFDMUMsWUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JELFlBQUksQ0FBQyxRQUFRLElBQUssS0FBSyxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQUFBQyxFQUFFO0FBQy9DLGtCQUFNLENBQUMsS0FBSyxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDNUUsdUJBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNuRjtLQUNKOzs7QUFHRCxhQUFTLFlBQVksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFO0FBQ2hDLFlBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUNmLFlBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFVixhQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3RDLGdCQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtBQUMvQix1QkFBTyxNQUFNLENBQUM7YUFDakI7QUFDRCxrQkFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1NBQ2xDO0FBQ0QsZUFBTyxNQUFNLENBQUM7S0FDakI7O0FBRUQsYUFBUyxlQUFlLENBQUMsQ0FBQyxFQUFFLGVBQWUsRUFBRTtBQUN6QyxZQUFJLENBQUMsWUFBQSxDQUFDOzs7O0FBSU4sWUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRWpELFlBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbkMsWUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOzs7QUFHOUMsWUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQyxZQUFNLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25DLFlBQUksSUFBSSxLQUFLLElBQUksRUFBRTtBQUNmLGdCQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2xELGdCQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztBQUNqQixnQkFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixnQkFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNwRjs7QUFFRCxZQUFNLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7O0FBSW5DLFlBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakMsWUFBSSxJQUFJLEVBQUU7QUFDTixnQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMvRCxnQkFBSSxHQUFHLElBQUksQ0FBQztTQUNmO0FBQ0QsWUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQyxtQkFBVyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztBQUNwRCxZQUFJLElBQUksRUFBRTtBQUNOLGdCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQy9ELGdCQUFJLEdBQUcsSUFBSSxDQUFDO1NBQ2Y7Ozs7O0FBS0QsWUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2QyxZQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7QUFDakIsa0JBQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLGtCQUFNLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQzs7QUFFNUIsZ0JBQUksS0FBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakMsZ0JBQUksS0FBSSxLQUFLLElBQUksRUFBRTs7QUFFZixxQkFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzVDLHFCQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztBQUNqQixxQkFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixxQkFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7QUFDckIscUJBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFbEIsb0JBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2xELG9CQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztBQUNqQixvQkFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixvQkFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO0FBQ3hDLG9CQUFJLENBQUMsd0JBQXdCLEdBQUcsQ0FBQyxDQUFDO0FBQ2xDLG9CQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDOztBQUUzQixvQkFBSSxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksRUFBRTs7QUFFckIseUJBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFOzs7QUFHekMsNEJBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxBQUFDLENBQUM7cUJBQ3pFO2lCQUNKLE1BQU07O0FBRUgsd0JBQUksQ0FBQyx3QkFBd0IsR0FBRyxDQUFDLENBQUM7aUJBQ3JDO2FBQ0o7U0FDSjs7QUFFRCxZQUFJLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQztBQUN2QixZQUFJLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQztBQUN2QixZQUFJLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQzs7O0FBR3ZCLFlBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbkMsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQzlCLFlBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQzs7O0FBRzlCLFlBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakMsWUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQ2YsZ0JBQUksYUFBYSxHQUFHLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDL0MsZ0JBQUksYUFBYSxHQUFHLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7O0FBRS9DLGdCQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLGFBQWEsR0FBRyxhQUFhLEdBQUcsRUFBRSxDQUFDO1NBQ3ZEOzs7QUFHRCxTQUFDLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztLQUNoQzs7QUFFRCxhQUFTLGlCQUFpQixDQUFDLENBQUMsRUFBRSxlQUFlLEVBQUU7OztBQUczQyxZQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtBQUNiLGtCQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7U0FDdEQ7O0FBRUQsWUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRWpELFlBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbkMsWUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOzs7QUFHOUMsWUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQyxZQUFJLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2pDLFlBQUksSUFBSSxLQUFLLElBQUksRUFBRTtBQUNmLGdCQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2xELGdCQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztBQUNqQixnQkFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixnQkFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNwRjs7QUFFRCxZQUFJLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2pDLG1CQUFXLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQ3BELFlBQUksSUFBSSxFQUFFO0FBQ04sZ0JBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0QsZ0JBQUksR0FBRyxJQUFJLENBQUM7U0FDZjtLQUNKOztBQUVELGFBQVMsT0FBTyxHQUFHO0FBQ2YsZUFBTyxJQUFJLENBQUM7S0FDZjs7QUFFRCxZQUFRLEdBQUc7QUFDUCx1QkFBZSxFQUFFLGVBQWU7QUFDaEMseUJBQWlCLEVBQUUsaUJBQWlCO0FBQ3BDLGVBQU8sRUFBRSxPQUFPO0tBQ25CLENBQUM7O0FBRUYsU0FBSyxFQUFFLENBQUM7QUFDUixXQUFPLFFBQVEsQ0FBQztDQUNuQjs7QUFFRCx3QkFBd0IsQ0FBQyxxQkFBcUIsR0FBRywwQkFBMEIsQ0FBQztxQkFDN0QsTUFBTSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsd0JBQXdCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7K0JDM1RyRCxvQkFBb0I7Ozs7Ozs7OztBQU8zQyxTQUFTLHdCQUF3QixDQUFDLE1BQU0sRUFBRTtBQUN0QyxVQUFNLEdBQUcsTUFBTSxJQUFJLEVBQUUsQ0FBQztBQUN0QixRQUFNLFlBQVksR0FBRyxDQUFDLENBQUM7QUFDdkIsUUFBTSxZQUFZLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLFFBQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFDbkMsUUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQzs7QUFFakMsUUFBSSxvQkFBb0IsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUM7QUFDdkQsUUFBSSxRQUFRLFlBQUE7UUFDUixNQUFNLFlBQUE7UUFDTixhQUFhLFlBQUE7UUFDYixjQUFjLFlBQUE7UUFDZCxpQkFBaUIsWUFBQTtRQUNqQixTQUFTLFlBQUE7UUFDVCxPQUFPLFlBQUEsQ0FBQzs7QUFFWixhQUFTLGFBQWEsQ0FBQyxPQUFPLEVBQUU7QUFDNUIsWUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDL0MsWUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUM7QUFDMUIsWUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFDdkIsWUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztBQUM1QixZQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDO0FBQ25DLFlBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDbkMsWUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQzs7QUFFbkMsZUFBTyxJQUFJLENBQUM7S0FDZjs7QUFFRCxhQUFTLGFBQWEsQ0FBQyxPQUFPLEVBQUU7OztBQUc1QixZQUFJLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQzs7O0FBRy9DLHFCQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7OztBQUdwQixZQUFJLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQzs7O0FBRzVDLHFCQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7OztBQUdwQixZQUFJLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQzs7O0FBRzVDLHFCQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7OztBQUdwQixxQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDOzs7QUFHcEIsWUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRTVDLGdCQUFRLGFBQWEsQ0FBQyxJQUFJO0FBQ3RCLGlCQUFLLFNBQVMsQ0FBQyxLQUFLOztBQUVoQiw2QkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BCLHNCQUFNO0FBQUEsQUFDVixpQkFBSyxTQUFTLENBQUMsS0FBSzs7QUFFaEIsNkJBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwQixzQkFBTTtBQUFBLEFBQ1Y7QUFDSSxzQkFBTTtBQUFBLFNBQ2I7OztBQUdELFlBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDOzs7QUFHNUMscUJBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7O0FBR3BCLFlBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDOzs7Ozs7QUFNNUMsWUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDaEQsWUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7O0FBR3RDLFlBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2hELFlBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7OztBQUd0QyxZQUFJLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNoRCxZQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOzs7QUFHdEMsWUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDaEQsWUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7OztBQUdsRCxxQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDOzs7QUFHcEIsWUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7OztBQUc1QyxxQkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVwQixZQUFJLGlCQUFpQixJQUFJLG9CQUFvQixFQUFFO0FBQzNDLGdCQUFJLFdBQVcsR0FBRyxvQkFBb0IsQ0FBQywyQ0FBMkMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3RHLG1EQUF1QyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztTQUM5RDtLQUNKOztBQUVELGFBQVMsYUFBYSxDQUFDLElBQUksRUFBRTs7QUFFekIsWUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRWhELFlBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDOztBQUVqQixZQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztBQUN2QixZQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsS0FBSyxRQUFRLEdBQUcsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDO0FBQzVHLFlBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO0FBQ2hCLFlBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLFlBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ25CLFlBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDNUIsWUFBSSxDQUFDLE1BQU0sR0FBRyxDQUNWLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztBQUNQLFNBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztBQUNQLFNBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUNkLENBQUM7QUFDRixZQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN0QyxZQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUM7O0FBRWpDLGVBQU8sSUFBSSxDQUFDO0tBQ2Y7O0FBRUQsYUFBUyxhQUFhLENBQUMsSUFBSSxFQUFFOztBQUV6QixZQUFJLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7QUFDakIsWUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHO0FBQ1osV0FBRztBQUNILFdBQUcsQ0FBQzs7QUFFUixZQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztBQUN2QixZQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO0FBQ3hCLFlBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ25CLFlBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsS0FBSyxRQUFRLEdBQUcsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDO0FBQzVHLFlBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDNUIsWUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDZixZQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQztBQUN6QixZQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztBQUNsQixZQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztBQUNuQixZQUFJLENBQUMsTUFBTSxHQUFHLENBQ1YsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0FBQ1AsU0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0FBQ1AsU0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQ2QsQ0FBQztBQUNGLFlBQUksQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQztBQUNsQyxZQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUM7O0FBRXBDLGVBQU8sSUFBSSxDQUFDO0tBQ2Y7O0FBRUQsYUFBUyxhQUFhLENBQUMsSUFBSSxFQUFFOztBQUV6QixZQUFJLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7O0FBRWpCLFlBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLFlBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7QUFDM0IsWUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7QUFDM0IsWUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxLQUFLLFFBQVEsR0FBRyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLENBQUM7QUFDNUcsWUFBSSxDQUFDLFFBQVEsR0FBRyxhQUFhLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQztBQUM1QyxZQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQzs7QUFFckIsZUFBTyxJQUFJLENBQUM7S0FDZjs7QUFFRCxhQUFTLGFBQWEsQ0FBQyxJQUFJLEVBQUU7O0FBRXpCLFlBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUVoRCxZQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztBQUNyQixnQkFBUSxhQUFhLENBQUMsSUFBSTtBQUN0QixpQkFBSyxTQUFTLENBQUMsS0FBSztBQUNoQixvQkFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUM7QUFDM0Isc0JBQU07QUFBQSxBQUNWLGlCQUFLLFNBQVMsQ0FBQyxLQUFLO0FBQ2hCLG9CQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQztBQUMzQixzQkFBTTtBQUFBLEFBQ1Y7QUFDSSxvQkFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUM7QUFDM0Isc0JBQU07QUFBQSxTQUNiO0FBQ0QsWUFBSSxDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsRUFBRSxDQUFDO0FBQzlCLFlBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztBQUUxQixlQUFPLElBQUksQ0FBQztLQUNmOztBQUVELGFBQVMsYUFBYSxDQUFDLElBQUksRUFBRTs7QUFFekIsWUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRWhELFlBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUVmLFlBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztBQUV6QixlQUFPLElBQUksQ0FBQztLQUNmOztBQUVELGFBQVMsYUFBYSxDQUFDLElBQUksRUFBRTs7QUFFekIsWUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRWhELFlBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUVmLFlBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDOztBQUVsQixlQUFPLElBQUksQ0FBQztLQUNmOztBQUVELGFBQVMsYUFBYSxDQUFDLElBQUksRUFBRTs7QUFFekIsWUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRWhELFlBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDOztBQUVsQixZQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDdEQsV0FBRyxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFDbEIsV0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7O0FBRWQsWUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRXZCLGVBQU8sSUFBSSxDQUFDO0tBQ2Y7O0FBRUQsYUFBUyxhQUFhLENBQUMsSUFBSSxFQUFFOztBQUV6QixZQUFJLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDbEIsZ0JBQVEsYUFBYSxDQUFDLElBQUk7QUFDdEIsaUJBQUssU0FBUyxDQUFDLEtBQUssQ0FBQztBQUNyQixpQkFBSyxTQUFTLENBQUMsS0FBSztBQUNoQixvQkFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMzQyxzQkFBTTtBQUFBLEFBQ1Y7QUFDSSxzQkFBTTtBQUFBLFNBQ2I7O0FBRUQsWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUN2QyxlQUFPLElBQUksQ0FBQztLQUNmOztBQUVELGFBQVMsaUJBQWlCLENBQUMsSUFBSSxFQUFFO0FBQzdCLFlBQUksS0FBSyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDOztBQUVuRixnQkFBUSxLQUFLO0FBQ1QsaUJBQUssTUFBTTtBQUNQLHVCQUFPLDBCQUEwQixDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztBQUFBLEFBQ25ELGlCQUFLLE1BQU07QUFDUCx1QkFBTyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFBQSxBQUNsRDtBQUNJLHNCQUFNO0FBQ0Ysd0JBQUksRUFBRSw2QkFBVSwwQkFBMEI7QUFDMUMsMkJBQU8sRUFBRSw2QkFBVSw2QkFBNkI7QUFDaEQsd0JBQUksRUFBRTtBQUNGLDZCQUFLLEVBQUUsS0FBSztxQkFDZjtpQkFDSixDQUFDO0FBQUEsU0FDVDtLQUNKOztBQUVELGFBQVMsMEJBQTBCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUM3QyxZQUFJLElBQUksWUFBQSxDQUFDOztBQUVULFlBQUksaUJBQWlCLEVBQUU7QUFDbkIsZ0JBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDbEQsTUFBTTtBQUNILGdCQUFJLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ2xEOzs7QUFHRCxZQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNoRCxZQUFJLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDOzs7QUFHOUIsWUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7QUFDdEIsWUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDbkIsWUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDOUIsWUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDO0FBQ3BDLFlBQUksQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQztBQUNsQyxZQUFJLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUMxQixZQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztBQUN6QixZQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztBQUNuQixZQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztBQUNyQixZQUFJLENBQUMsY0FBYyxHQUFHLENBQ2xCLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO0FBQzlDLFlBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQzlDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQzlDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQ2pELENBQUM7QUFDRixZQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztBQUNwQixZQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztBQUMxQixZQUFJLENBQUMsTUFBTSxHQUFHLDZCQUE2QixFQUFFLENBQUM7QUFDOUMsWUFBSSxpQkFBaUIsRUFBRTs7QUFFbkIsZ0JBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDOzs7QUFHNUMsbUNBQXVCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDOzs7QUFHckMsK0JBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7OztBQUcxQixzQ0FBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNwQzs7QUFFRCxlQUFPLElBQUksQ0FBQztLQUNmOztBQUVELGFBQVMsNkJBQTZCLEdBQUc7O0FBRXJDLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQztBQUNoQixZQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7OztBQUdwQixZQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDYixZQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDYixZQUFJLG9CQUFvQixHQUFHLENBQUMsQ0FBQztBQUM3QixZQUFJLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUMzQixZQUFJLHFCQUFxQixHQUFHLENBQUMsQ0FBQzs7QUFFOUIsWUFBSSxLQUFLLEdBQUcsY0FBYyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkUsWUFBSSxTQUFTLFlBQUE7WUFBRSxRQUFRLFlBQUEsQ0FBQzs7QUFFeEIsYUFBSyxJQUFJLEVBQUMsR0FBRyxDQUFDLEVBQUUsRUFBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBQyxFQUFFLEVBQUU7QUFDbkMscUJBQVMsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQzs7QUFFeEMsb0JBQVEsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDOztBQUUvQixvQkFBUSxRQUFRO0FBQ1oscUJBQUssWUFBWTtBQUNiLHVCQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3BCLDhCQUFVLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFDbkMsMEJBQU07QUFBQSxBQUNWLHFCQUFLLFlBQVk7QUFDYix1QkFBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNwQiw4QkFBVSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ25DLDBCQUFNO0FBQUEsQUFDVjtBQUNJLDBCQUFNO0FBQUEsYUFDYjtTQUNKOzs7QUFHRCxZQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQ2hCLGdDQUFvQixHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxpQ0FBcUIsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEMsOEJBQWtCLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2xDOzs7QUFHRCxZQUFJLEdBQUcsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRWxDLFlBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFVixZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUEsSUFBSyxFQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBLElBQUssRUFBRSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQSxJQUFLLENBQUMsQ0FBQztBQUMzQyxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBSSxVQUFVLEdBQUcsVUFBVSxBQUFDLENBQUM7QUFDdEMsWUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLFNBQUMsSUFBSSxDQUFDLENBQUM7QUFDUCxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDZCxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxvQkFBb0IsQ0FBQztBQUNqQyxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxxQkFBcUIsQ0FBQztBQUNsQyxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxrQkFBa0IsQ0FBQztBQUMvQixZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDakIsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDOUIsYUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDakMsZ0JBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUEsSUFBSyxDQUFDLENBQUM7QUFDMUMsZ0JBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxBQUFDLENBQUM7QUFDckMsZ0JBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3BCLGFBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1NBQ3RCO0FBQ0QsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUN2QixhQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNqQyxnQkFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQSxJQUFLLENBQUMsQ0FBQztBQUMxQyxnQkFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxNQUFNLEFBQUMsQ0FBQztBQUNyQyxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDcEIsYUFBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7U0FDdEI7O0FBRUQsZUFBTyxJQUFJLENBQUM7S0FDZjs7QUFFRCxhQUFTLHlCQUF5QixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDNUMsWUFBSSxJQUFJLFlBQUEsQ0FBQzs7QUFFVCxZQUFJLGlCQUFpQixFQUFFO0FBQ25CLGdCQUFJLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ2xELE1BQU07QUFDSCxnQkFBSSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNsRDs7O0FBR0QsWUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDaEQsWUFBSSxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQzs7O0FBRzlCLFlBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDNUIsWUFBSSxDQUFDLFlBQVksR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFDO0FBQ2pELFlBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBQ3BCLFlBQUksQ0FBQyxVQUFVLEdBQUcsY0FBYyxDQUFDLGlCQUFpQixJQUFJLEVBQUUsQ0FBQzs7QUFFekQsWUFBSSxDQUFDLElBQUksR0FBRywwQkFBMEIsRUFBRSxDQUFDOztBQUV6QyxZQUFJLGlCQUFpQixFQUFFOztBQUVuQixnQkFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7OztBQUc1QyxtQ0FBdUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7OztBQUdyQywrQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7O0FBRzFCLHNDQUEwQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3BDOztBQUVELGVBQU8sSUFBSSxDQUFDO0tBQ2Y7O0FBRUQsYUFBUywwQkFBMEIsR0FBRzs7O0FBR2xDLFlBQUksbUJBQW1CLEdBQUcsaUJBQWlCLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Ozs7Ozs7QUFPN0UsWUFBSSxVQUFVLEdBQUcsRUFBRSxHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQztBQUNqRCxZQUFJLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFdEMsWUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUVWLFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQSxJQUFLLEVBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUEsSUFBSyxFQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBLElBQUssQ0FBQyxDQUFDO0FBQzNDLFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFJLFVBQVUsR0FBRyxVQUFVLEFBQUMsQ0FBQztBQUN0QyxZQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdEMsU0FBQyxJQUFJLENBQUMsQ0FBQztBQUNQLFlBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMxQixTQUFDLElBQUksQ0FBQyxDQUFDOztBQUVQLFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNqQixZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsbUJBQW1CLENBQUMsTUFBTSxDQUFDO0FBQzVDLFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQSxJQUFLLENBQUMsQ0FBQztBQUNwQyxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBSSxPQUFPLEdBQUcsTUFBTSxBQUFDLENBQUM7QUFDL0IsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7QUFHZCxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDakIsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQztBQUM1QyxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDakIsWUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUM7QUFDcEIsWUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEIsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2YsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNqQixZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDakIsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQSxJQUFLLEVBQUUsQ0FBQztBQUMxRCxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFBLElBQUssRUFBRSxDQUFDO0FBQzFELFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUEsSUFBSyxDQUFDLENBQUM7QUFDekQsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUksY0FBYyxDQUFDLFNBQVMsR0FBRyxVQUFVLEFBQUMsQ0FBQztBQUNwRCxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFBLElBQUssRUFBRSxDQUFDO0FBQzFELFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUEsSUFBSyxFQUFFLENBQUM7QUFDMUQsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQSxJQUFLLENBQUMsQ0FBQztBQUN6RCxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBSSxjQUFjLENBQUMsU0FBUyxHQUFHLFVBQVUsQUFBQyxDQUFDOzs7QUFHcEQsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQztBQUN2QyxZQUFJLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxDQUFDOztBQUVqQyxlQUFPLElBQUksQ0FBQztLQUNmOztBQUVELGFBQVMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUMxQyxZQUFJLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM1QyxZQUFJLENBQUMsV0FBVyxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzlDOztBQUVELGFBQVMsbUJBQW1CLENBQUMsSUFBSSxFQUFFO0FBQy9CLFlBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUVoRCxZQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLFlBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0FBQzlCLFlBQUksQ0FBQyxjQUFjLEdBQUcsVUFBVSxDQUFDO0tBQ3BDOztBQUVELGFBQVMsMEJBQTBCLENBQUMsSUFBSSxFQUFFO0FBQ3RDLFlBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDOzs7QUFHNUMsZ0NBQXdCLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDbEM7O0FBRUQsYUFBUyx1Q0FBdUMsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO0FBQy9ELFlBQUksVUFBVSxZQUFBO1lBQ1YsSUFBSSxZQUFBO1lBQ0osQ0FBQyxZQUFBO1lBQ0QsWUFBWSxZQUFBLENBQUM7O0FBRWpCLGFBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3ZDLHNCQUFVLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztBQUNwQyxnQkFBSSxVQUFVLEVBQUU7QUFDWiw0QkFBWSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDaEQsb0JBQUksR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLG9CQUFJLElBQUksRUFBRTtBQUNOLDRCQUFRLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ3hDO2FBQ0o7U0FDSjtLQUNKOztBQUVELGFBQVMsd0JBQXdCLENBQUMsSUFBSSxFQUFFO0FBQ3BDLFlBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUVoRCxZQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNmLFlBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDOztBQUVqQixZQUFJLENBQUMsbUJBQW1CLEdBQUcsR0FBRyxDQUFDO0FBQy9CLFlBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLFlBQUksQ0FBQyxXQUFXLEdBQUcsQUFBQyxpQkFBaUIsSUFBSSxBQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBSSxDQUFDLElBQUksaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsR0FDL0csaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ25JOztBQUVELGFBQVMsYUFBYSxDQUFDLElBQUksRUFBRTtBQUN6QixZQUFJLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7QUFDeEIsWUFBSSxDQUFDLGdDQUFnQyxHQUFHLENBQUMsQ0FBQztBQUMxQyxZQUFJLENBQUMsdUJBQXVCLEdBQUcsQ0FBQyxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUM7QUFDN0IsWUFBSSxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQzs7QUFFOUIsZUFBTyxJQUFJLENBQUM7S0FDZjs7QUFFRCxhQUFTLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtBQUM1QixZQUFJLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3pDLFlBQUksQ0FBQyxZQUFBLENBQUM7O0FBRU4sYUFBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3BDLGVBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDM0Q7QUFDRCxlQUFPLEdBQUcsQ0FBQztLQUNkOztBQUVELGFBQVMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFO0FBQzNCLFlBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNiLFlBQUksQ0FBQyxZQUFBLENBQUM7O0FBRU4sYUFBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDaEMsZ0JBQUksSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEdBQUksQ0FBQyxBQUFDLENBQUM7U0FDM0Q7QUFDRCxlQUFPLElBQUksQ0FBQztLQUNmOztBQUVELGFBQVMsWUFBWSxDQUFDLEdBQUcsRUFBRTtBQUN2QixZQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtBQUN6QixtQkFBTztTQUNWOztBQUVELFlBQUksT0FBTyxZQUFBO1lBQ1AsV0FBVyxZQUFBLENBQUM7O0FBRWhCLHNCQUFjLEdBQUcsR0FBRyxDQUFDO0FBQ3JCLHFCQUFhLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQzs7QUFFMUMsY0FBTSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUM7QUFDOUIsZUFBTyxHQUFHLGFBQWEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ2xDLHlCQUFpQixHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLGlCQUFpQixDQUFDOztBQUVsSSxpQkFBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUM7O0FBRWxJLGVBQU8sR0FBRyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDaEMscUJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN2QixxQkFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDOztBQUV2QixtQkFBVyxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQzs7QUFFOUIsZUFBTyxXQUFXLENBQUM7S0FDdEI7O0FBRUQsWUFBUSxHQUFHO0FBQ1Asb0JBQVksRUFBRSxZQUFZO0tBQzdCLENBQUM7O0FBRUYsV0FBTyxRQUFRLENBQUM7Q0FDbkI7O0FBRUQsd0JBQXdCLENBQUMscUJBQXFCLEdBQUcsMEJBQTBCLENBQUM7cUJBQzdELE1BQU0sQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLHdCQUF3QixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3Q0NobkJ2Qyw0QkFBNEI7Ozs7d0NBQzVCLDRCQUE0Qjs7Ozs7O0FBSWpFLFNBQVMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDNUIsV0FBTyxBQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLE1BQU0sSUFBSyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsT0FBTyxFQUFFLEtBQUssRUFBRTtBQUN6RSxlQUFPLE9BQU8sS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbEMsQ0FBQyxDQUFDO0NBQ047O0FBRUQsU0FBUyxhQUFhLEdBQUc7QUFDckIsUUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3BCLFFBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUU7QUFDaEIsWUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzdDLFlBQUksQ0FBQyxVQUFVLENBQUMseUJBQXlCLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQzFEO0FBQ0QsUUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzNDLFFBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLEFBQUMsSUFBSSxDQUFDLE9BQU8sS0FBSyxDQUFDLEdBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0NBQzVGOztBQUVELFNBQVMsYUFBYSxHQUFHO0FBQ3JCLFFBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNwQixRQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFO0FBQ2hCLFlBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3QyxZQUFJLENBQUMsVUFBVSxDQUFDLHlCQUF5QixFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztLQUMxRDtBQUNELFFBQUksQ0FBQyxVQUFVLENBQUMsMEJBQTBCLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3ZELFFBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM1QyxRQUFJLElBQUksQ0FBQyx3QkFBd0IsS0FBSyxDQUFDLEVBQUU7QUFDckMsWUFBSSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztLQUMxRTtDQUNKOztBQUVELFNBQVMsYUFBYSxHQUFHO0FBQ3JCLFFBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNwQixRQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDNUMsUUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRTtBQUNoQixZQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDekM7QUFDRCxRQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLFVBQVUsS0FBSyxFQUFFO0FBQzNELFlBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMvRCxZQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFO0FBQ2hCLGdCQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDM0QsZ0JBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsVUFBVSxtQkFBbUIsRUFBRTtBQUNyRyxvQkFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxrQkFBa0IsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDMUUsb0JBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2FBQ2pGLENBQUMsQ0FBQztTQUNOO0tBQ0osQ0FBQyxDQUFDO0NBQ047O0FBRUQsU0FBUyxhQUFhLEdBQUc7QUFDckIsUUFBSSxZQUFZLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNwSCxRQUFJLFlBQVksR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BILFFBQUksY0FBYyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRXRILFFBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLEVBQUU7QUFDekMsWUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3BCLFlBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUNmLGdCQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztTQUN0QjtBQUNELFlBQUksQ0FBQyxVQUFVLENBQUMsd0JBQXdCLEVBQUUsTUFBTSxFQUFFLEFBQUMsSUFBSSxDQUFDLE9BQU8sS0FBSyxDQUFDLEdBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ2xGLFlBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsTUFBTSxFQUFFLEFBQUMsSUFBSSxDQUFDLE9BQU8sS0FBSyxDQUFDLEdBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0tBQ2hGOztBQUVELFFBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLEVBQUU7QUFDekMsWUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3BCLFlBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUNmLGdCQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztTQUN0QjtBQUNELFlBQUksQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzdDLFlBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsVUFBVSxLQUFLLEVBQUU7QUFDN0QsZ0JBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sRUFBRSxBQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssQ0FBQyxHQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUM5RixnQkFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxFQUFFLEFBQUMsSUFBSSxDQUFDLE9BQU8sS0FBSyxDQUFDLEdBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQzVGLENBQUMsQ0FBQztLQUNOOztBQUVELFFBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsY0FBYyxDQUFDLEVBQUU7QUFDM0MsWUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQ2YsZ0JBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO1NBQ3hCO0FBQ0QscUJBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDNUI7Q0FDSjs7QUFFRCxTQUFTLG9CQUFvQixDQUFDLE1BQU0sRUFBRTs7QUFFbEMsVUFBTSxHQUFHLE1BQU0sSUFBSSxFQUFFLENBQUM7QUFDdEIsUUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUM3QixRQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO0FBQ3ZDLFFBQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDO0FBQ3JELFFBQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7QUFDakMsUUFBTSxvQkFBb0IsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUM7QUFDekQsUUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztBQUNqQyxRQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQzNCLFFBQUksd0JBQXdCLFlBQUE7UUFDeEIsd0JBQXdCLFlBQUE7UUFDeEIsUUFBUSxZQUFBLENBQUM7O0FBRWIsYUFBUyxLQUFLLEdBQUc7QUFDYixnQkFBUSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDaEQsZ0JBQVEsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ2hELGdCQUFRLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNoRCxnQkFBUSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUM7O0FBRWhELGdDQUF3QixHQUFHLDJDQUF5QixPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDaEUsZ0NBQW9CLEVBQUUsb0JBQW9CO0FBQzFDLHFCQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVM7QUFDM0Isb0JBQVEsRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUFDOztBQUV6QixnQ0FBd0IsR0FBRywyQ0FBeUIsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ2hFLHVCQUFXLEVBQUUsV0FBVztBQUN4Qiw4QkFBa0IsRUFBRSxrQkFBa0I7QUFDdEMsb0JBQVEsRUFBRSxRQUFRO0FBQ2xCLG9CQUFRLEVBQUUsUUFBUTtBQUNsQixpQkFBSyxFQUFFLEtBQUs7QUFDWixzQkFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVO1NBQ2hDLENBQUMsQ0FBQztLQUNOOztBQUVELGFBQVMsWUFBWSxDQUFDLEdBQUcsRUFBRTtBQUN2QixlQUFPLHdCQUF3QixDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNyRDs7QUFFRCxhQUFTLGVBQWUsQ0FBQyxDQUFDLEVBQUUsZUFBZSxFQUFFO0FBQ3pDLFlBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtBQUNqQyxrQkFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1NBQzFEOztBQUVELFlBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssY0FBYyxFQUFFOztBQUVuQyxvQ0FBd0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1NBRWhFLE1BQU0sSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxxQkFBcUIsRUFBRTs7QUFFakQsb0NBQXdCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDOzs7QUFHL0QsYUFBQyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7U0FDbkI7S0FDSjs7QUFFRCxZQUFRLEdBQUc7QUFDUCxvQkFBWSxFQUFFLFlBQVk7QUFDMUIsdUJBQWUsRUFBRSxlQUFlO0tBQ25DLENBQUM7O0FBRUYsU0FBSyxFQUFFLENBQUM7O0FBRVIsV0FBTyxRQUFRLENBQUM7Q0FDbkI7O0FBRUQsb0JBQW9CLENBQUMscUJBQXFCLEdBQUcsc0JBQXNCLENBQUM7cUJBQ3JELE1BQU0sQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLG9CQUFvQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQ0MxSmxELDJCQUEyQjs7OzswQ0FDckIsaUNBQWlDOzs7O3lDQUN2Qiw2QkFBNkI7Ozs7b0NBQ2xDLHdCQUF3Qjs7OzsrQkFDbkMsb0JBQW9COzs7OytCQUNwQixvQkFBb0I7Ozs7c0NBQ2xCLDZCQUE2Qjs7Ozt1Q0FDL0IsOEJBQThCOzs7O0FBRXBELFNBQVMsVUFBVSxDQUFDLE1BQU0sRUFBRTs7QUFFeEIsVUFBTSxHQUFHLE1BQU0sSUFBSSxFQUFFLENBQUM7QUFDdEIsUUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUM3QixRQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO0FBQ2pDLFFBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDN0IsUUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUNuQyxRQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDO0FBQy9DLFFBQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7QUFDdkMsUUFBTSxrQkFBa0IsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUM7QUFDckQsUUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUM7QUFDakQsUUFBTSxvQkFBb0IsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUM7QUFDekQsUUFBTSxvQkFBb0IsR0FBRyx1Q0FBcUIsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzlELG1CQUFXLEVBQUUsV0FBVztBQUN4QiwwQkFBa0IsRUFBRSxrQkFBa0I7QUFDdEMsNEJBQW9CLEVBQUUsb0JBQW9CO0FBQzFDLHdCQUFnQixFQUFFLGdCQUFnQjtBQUNsQyxnQkFBUSxFQUFFLFFBQVE7QUFDbEIsaUJBQVMsRUFBRSxTQUFTO0FBQ3BCLGdCQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7QUFDekIsYUFBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO0FBQ25CLGtCQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7S0FDaEMsQ0FBQyxDQUFDO0FBQ0gsUUFBSSxTQUFTLFlBQUE7UUFDVCx1QkFBdUIsWUFBQTtRQUN2QixTQUFTLFlBQUE7UUFDVCxRQUFRLFlBQUEsQ0FBQzs7QUFFYixhQUFTLEtBQUssR0FBRztBQUNiLCtCQUF1QixHQUFHLEVBQUUsQ0FBQztBQUM3QixpQkFBUyxHQUFHLDBDQUFVLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0tBQ2hEOztBQUVELGFBQVMsa0JBQWtCLENBQUMsSUFBSSxFQUFFO0FBQzlCLGVBQU8sZ0JBQWdCLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBQSxTQUFTLEVBQUk7QUFDcEUsbUJBQU8sU0FBUyxDQUFDLE9BQU8sRUFBRSxLQUFLLElBQUksQ0FBQztTQUN2QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDVDs7QUFFRCxhQUFTLHlCQUF5QixDQUFDLElBQUksRUFBRTtBQUNyQyxlQUFPLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxVQUFBLFVBQVUsRUFBSTtBQUNoRCxtQkFBUSxVQUFVLENBQUMsT0FBTyxFQUFFLEtBQUssSUFBSSxDQUFFO1NBQzFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNUOztBQUVELGFBQVMsZUFBZSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFO0FBQ3JELFlBQU0sS0FBSyxHQUFHLHVDQUFlLENBQUM7O0FBRTlCLGFBQUssQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQzFCLGFBQUssQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQztBQUNwQyxhQUFLLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDakMsYUFBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO0FBQ2hDLGFBQUssQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztBQUNsQyxhQUFLLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztBQUN6QyxhQUFLLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDNUIsYUFBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0FBQ2hDLGFBQUssQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7QUFDbEQsYUFBSyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7O0FBRWhDLGVBQU8sS0FBSyxDQUFDO0tBQ2hCOztBQUVELGFBQVMsNEJBQTRCLEdBQUc7OztBQUdwQyxZQUFJLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0FBQzlELGtCQUFVLENBQUMsT0FBTyxDQUFDLFVBQVUsU0FBUyxFQUFFO0FBQ3BDLGdCQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxTQUFTLENBQUMsS0FBSyxJQUN2QyxTQUFTLENBQUMsT0FBTyxFQUFFLEtBQUssU0FBUyxDQUFDLEtBQUssSUFDdkMsU0FBUyxDQUFDLE9BQU8sRUFBRSxLQUFLLFNBQVMsQ0FBQyxlQUFlLEVBQUU7O0FBRW5ELG9CQUFJLHNCQUFzQixHQUFHLHlCQUF5QixDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQzVFLG9CQUFJLENBQUMsc0JBQXNCLEVBQUU7QUFDekIsMENBQXNCLEdBQUcsNENBQTBCLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUMvRCx1Q0FBZSxFQUFFLFNBQVM7QUFDMUIseUNBQWlCLEVBQUUsTUFBTSxDQUFDLGlCQUFpQjtBQUMzQyw2QkFBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO3FCQUN0QixDQUFDLENBQUM7QUFDSCwwQ0FBc0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNwQywyQ0FBdUIsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztpQkFDeEQ7QUFDRCxzQ0FBc0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUNsQztTQUNKLENBQUMsQ0FBQztLQUNOOztBQUVELGFBQVMsMkJBQTJCLEdBQUc7QUFDbkMsK0JBQXVCLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQyxFQUFJO0FBQ2pDLGFBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNiLENBQUMsQ0FBQztBQUNILCtCQUF1QixHQUFHLEVBQUUsQ0FBQztLQUNoQzs7QUFFRCxhQUFTLG9CQUFvQixDQUFDLENBQUMsRUFBRTtBQUM3QixZQUFJLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDdEQsWUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPOzs7QUFHN0IsWUFBSSx3QkFBd0IsR0FBRyxlQUFlLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztBQUM3RSxZQUFJLGNBQWMsR0FBRyx3QkFBd0IsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO0FBQ3pFLFlBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQyxZQUFZLEVBQUUsQ0FBQzs7QUFFL0MsWUFBSSxPQUFPLEdBQUcsNkNBQXFCLENBQUM7QUFDcEMsZUFBTyxDQUFDLFNBQVMsR0FBRyxjQUFjLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztBQUNuRCxlQUFPLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQztBQUMvQixlQUFPLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUM7QUFDckMsZUFBTyxDQUFDLE9BQU8sR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDO0FBQ3ZDLGVBQU8sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0FBQzlCLGVBQU8sQ0FBQyxnQkFBZ0IsR0FBRyxjQUFjLENBQUMsRUFBRSxDQUFDOztBQUU3QyxZQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLHlCQUF5QixDQUFDLENBQUM7O0FBRTdHLFlBQUk7O0FBRUEsaUJBQUssQ0FBQyxLQUFLLEdBQUcsb0JBQW9CLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDOzs7QUFHaEUsb0JBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUN4QyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFDaEIsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFLGNBQWMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQ25GLENBQUM7U0FDTCxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ1Isa0JBQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHdDQUFnQixDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDdkU7OztBQUdELFNBQUMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0tBQ25COztBQUVELGFBQVMsb0JBQW9CLENBQUMsQ0FBQyxFQUFFO0FBQzdCLFlBQUksQ0FBQyxDQUFDLEtBQUssRUFBRyxPQUFPOztBQUVyQixZQUFJLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzlELFlBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTzs7O0FBRzdCLDRCQUFvQixDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7O0FBRXpELFlBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUsscUJBQXFCLEVBQUU7O0FBRTFDLGdCQUFJLHNCQUFzQixHQUFHLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDNUUsZ0JBQUksc0JBQXNCLEVBQUU7QUFDeEIsc0NBQXNCLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDaEQ7U0FDSjs7O0FBR0QsWUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQztBQUMvRCxZQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsSUFBSSxZQUFZLENBQUMsYUFBYSxLQUFLLFFBQVEsRUFBRTtBQUNwRSx3Q0FBNEIsRUFBRSxDQUFDO1NBQ2xDO0tBQ0o7O0FBRUQsYUFBUyxnQkFBZ0IsR0FBRztBQUN4QixZQUFJLGtCQUFrQixDQUFDLFlBQVksRUFBRSxJQUFJLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRTtBQUN6RSx3Q0FBNEIsRUFBRSxDQUFDO1NBQ2xDO0tBQ0o7O0FBRUQsYUFBUyxtQkFBbUIsR0FBRztBQUMzQixZQUFJLGtCQUFrQixDQUFDLFlBQVksRUFBRSxJQUFJLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRTtBQUN6RSx3Q0FBNEIsRUFBRSxDQUFDO1NBQ2xDO0tBQ0o7O0FBRUQsYUFBUyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUU7QUFDckMsWUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUU7QUFDdkMsbUJBQU87U0FDVjs7QUFFRCxxQkFBYSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3Q0FBd0MsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO0tBQzFIOztBQUVELGFBQVMsY0FBYyxHQUFHO0FBQ3RCLGdCQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7QUFDbkwsZ0JBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7QUFDMUssZ0JBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLG1CQUFtQixFQUFFLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztBQUNqTCxnQkFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsMEJBQTBCLEVBQUUsb0JBQW9CLEVBQUUsUUFBUSxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMseUJBQXlCLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO0FBQ3pMLGdCQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDakU7O0FBRUQsYUFBUyxLQUFLLEdBQUc7QUFDYixZQUFJLFNBQVMsRUFBRTtBQUNYLHFCQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDbEIscUJBQVMsR0FBRyxTQUFTLENBQUM7U0FDekI7O0FBRUQsZ0JBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3RFLGdCQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDN0QsZ0JBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BFLGdCQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQywwQkFBMEIsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM1RSxnQkFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDOzs7QUFHM0QsbUNBQTJCLEVBQUUsQ0FBQztLQUNqQzs7QUFFRCxhQUFTLGVBQWUsR0FBRztBQUN2QixpQkFBUyxHQUFHLGtDQUFVLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QyxlQUFPLFNBQVMsQ0FBQztLQUNwQjs7QUFFRCxZQUFRLEdBQUc7QUFDUCxhQUFLLEVBQUUsS0FBSztBQUNaLHVCQUFlLEVBQUUsZUFBZTtBQUNoQyxzQkFBYyxFQUFFLGNBQWM7S0FDakMsQ0FBQzs7QUFFRixTQUFLLEVBQUUsQ0FBQzs7QUFFUixXQUFPLFFBQVEsQ0FBQztDQUNuQjs7QUFFRCxVQUFVLENBQUMscUJBQXFCLEdBQUcsWUFBWSxDQUFDO0FBQ2hELElBQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2hFLE9BQU8sQ0FBQyxNQUFNLCtCQUFZLENBQUM7QUFDM0IsTUFBTSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMscUJBQXFCLEVBQUUsT0FBTyxDQUFDLENBQUM7cUJBQ25FLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7b0NDbk9DLDhCQUE4Qjs7Ozs7Ozs7O0lBSy9DLFNBQVM7WUFBVCxTQUFTOztBQUNGLFdBRFAsU0FBUyxHQUNDOzBCQURWLFNBQVM7O0FBRVAsK0JBRkYsU0FBUyw2Q0FFQzs7OztBQUlSLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxHQUFHLENBQUM7Ozs7O0FBSzVCLFFBQUksQ0FBQywwQkFBMEIsR0FBRyxHQUFHLENBQUM7O0FBRXRDLFFBQUksQ0FBQyxtQkFBbUIsR0FBRyxvQ0FBb0MsQ0FBQztBQUNoRSxRQUFJLENBQUMsNkJBQTZCLEdBQUcsbUJBQW1CLENBQUM7R0FDNUQ7O1NBZkMsU0FBUzs7O0FBa0JmLElBQUksU0FBUyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7cUJBQ2pCLFNBQVM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzBCQ3ZCRCxjQUFjOzs7OztBQUdyQyxJQUFJLE9BQU8sR0FBRyxBQUFDLE9BQU8sTUFBTSxLQUFLLFdBQVcsSUFBSSxNQUFNLElBQUssTUFBTSxDQUFDOztBQUVsRSxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQzVCLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDVCxRQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7Q0FDaEM7O0FBRUQsTUFBTSxDQUFDLFVBQVUsMEJBQWEsQ0FBQzs7cUJBRWhCLE1BQU07UUFDWixVQUFVOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzttQ0NQQSwrQkFBK0I7Ozs7QUFFbEQsU0FBUyxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQ3ZCLFVBQU0sR0FBRyxNQUFNLElBQUksRUFBRSxDQUFDO0FBQ3RCLFFBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDN0IsUUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUMzQixRQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO0FBQ25DLFFBQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7QUFDM0MsUUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUM7QUFDakQsUUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQzs7QUFFakMsUUFBTSxrQkFBa0IsR0FBRyxVQUFVLENBQUM7QUFDdEMsUUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7O0FBRXpFLFFBQU0sSUFBSSxHQUFHO0FBQ1QsY0FBTSxFQUFFLE1BQU07QUFDZCxjQUFNLEVBQUUsV0FBVztBQUNuQixjQUFNLEVBQUUsTUFBTTtLQUNqQixDQUFDO0FBQ0YsUUFBTSxhQUFhLEdBQUc7QUFDbEIsY0FBTSxFQUFFLEdBQUc7S0FDZCxDQUFDO0FBQ0YsUUFBTSxzQkFBc0IsR0FBRztBQUMzQixhQUFLLEVBQUUsR0FBRztBQUNWLGFBQUssRUFBRSxHQUFHO0FBQ1YsYUFBSyxFQUFFLEdBQUc7QUFDVixhQUFLLEVBQUUsR0FBRztBQUNWLGFBQUssRUFBRSxHQUFHO0FBQ1YsYUFBSyxFQUFFLEdBQUc7QUFDVixhQUFLLEVBQUUsR0FBRztBQUNWLGFBQUssRUFBRSxHQUFHO0FBQ1YsYUFBSyxFQUFFLEdBQUc7QUFDVixhQUFLLEVBQUUsR0FBRztBQUNWLGFBQUssRUFBRSxHQUFHO0FBQ1YsWUFBSSxFQUFFLEdBQUc7QUFDVCxZQUFJLEVBQUUsR0FBRztLQUNaLENBQUM7QUFDRixRQUFNLFdBQVcsR0FBRztBQUNoQixlQUFPLEVBQUUsV0FBVztBQUNwQixlQUFPLEVBQUUsV0FBVztBQUNwQixjQUFNLEVBQUUsaUJBQWlCO0tBQzVCLENBQUM7O0FBRUYsUUFBSSxRQUFRLFlBQUE7UUFDUixNQUFNLFlBQUE7UUFDTixxQkFBcUIsWUFBQSxDQUFDOztBQUcxQixhQUFTLEtBQUssR0FBRztBQUNiLGNBQU0sR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ3RDOztBQUVELGFBQVMsU0FBUyxDQUFDLG9CQUFvQixFQUFFLFNBQVMsRUFBRTtBQUNoRCxZQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDbEIsWUFBSSxPQUFPLFlBQUE7WUFDUCxVQUFVLFlBQUEsQ0FBQzs7O0FBR2YsY0FBTSxDQUFDLHFCQUFxQixHQUFHLEVBQUUsQ0FBQztBQUNsQyxlQUFPLEdBQUcsb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDbkUsYUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDckMsc0JBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDckQsZ0JBQUksVUFBVSxLQUFLLElBQUksRUFBRTtBQUNyQixzQkFBTSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNqRDtTQUNKOztBQUVELFlBQUksTUFBTSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDekMsa0JBQU0sQ0FBQyxhQUFhLEdBQUcsQUFBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBSSxNQUFNLENBQUMscUJBQXFCLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3JJOztBQUVELGVBQU8sTUFBTSxDQUFDO0tBQ2pCOztBQUVELGFBQVMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRTtBQUM5QyxZQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFDekIsWUFBTSxlQUFlLEdBQUcsRUFBRSxDQUFDO0FBQzNCLFlBQUksZUFBZSxZQUFBLENBQUM7QUFDcEIsWUFBSSxhQUFhLFlBQUE7WUFDYixjQUFjLFlBQUE7WUFDZCxRQUFRLFlBQUE7WUFDUixDQUFDLFlBQUEsQ0FBQzs7QUFFTixZQUFNLElBQUksR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlDLFlBQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUMsWUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNsRCxZQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVuRCxxQkFBYSxDQUFDLEVBQUUsR0FBRyxJQUFJLElBQUksVUFBVSxDQUFDO0FBQ3RDLHFCQUFhLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztBQUNqQyxxQkFBYSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksS0FBSyxDQUFDO0FBQ25DLHFCQUFhLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQyxxQkFBYSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVELHFCQUFhLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQscUJBQWEsQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQzs7O0FBR2hFLFlBQUksYUFBYSxDQUFDLE9BQU8sRUFBRTtBQUN2QixnQkFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQzdCLG9CQUFJLElBQUksR0FBRztBQUNQLCtCQUFXLEVBQUUseUJBQXlCO0FBQ3RDLHlCQUFLLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7aUJBQ3JDLENBQUM7QUFDRiw2QkFBYSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDMUIsNkJBQWEsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN2QztBQUNELGdCQUFJLGFBQWEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDdEMsb0JBQUksYUFBYSxHQUFHO0FBQ2hCLCtCQUFXLEVBQUUseUNBQXlDO0FBQ3RELHlCQUFLLEVBQUUsYUFBYSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7aUJBQzlDLENBQUM7QUFDRiw2QkFBYSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7QUFDNUMsNkJBQWEsQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2FBQ3pEO1NBQ0o7OztBQUdELHVCQUFlLEdBQUcsa0JBQWtCLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDOztBQUU3RCxxQkFBYSxHQUFHLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQzs7QUFFakUsYUFBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztBQUV2Qyx5QkFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDO0FBQ2pELHlCQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUM7OztBQUduRCx5QkFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxhQUFhLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDOzs7QUFHdEYsMEJBQWMsR0FBRyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7O0FBRWxFLGdCQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7O0FBRXpCLDhCQUFjLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQzs7QUFFakQsK0JBQWUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7YUFDeEM7U0FDSjs7QUFFRCxZQUFJLGVBQWUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQzlCLG1CQUFPLElBQUksQ0FBQztTQUNmOztBQUVELHFCQUFhLENBQUMsY0FBYyxHQUFHLEFBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUksZUFBZSxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRyxxQkFBYSxDQUFDLHNCQUFzQixHQUFHLGVBQWUsQ0FBQzs7O0FBR3ZELHFCQUFhLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQzs7QUFFaEQsZ0JBQVEsR0FBRyxlQUFlLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQzs7QUFFckQsZUFBTyxhQUFhLENBQUM7S0FDeEI7O0FBRUQsYUFBUyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFO0FBQ2xELFlBQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQztBQUMxQixZQUFNLElBQUksR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlDLFlBQUksV0FBVyxHQUFHLElBQUksQ0FBQzs7QUFFdkIsc0JBQWMsQ0FBQyxFQUFFLEdBQUcsWUFBWSxDQUFDLEVBQUUsQ0FBQztBQUNwQyxzQkFBYyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM5RSxzQkFBYyxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDO0FBQ2hELHNCQUFjLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzNFLHNCQUFjLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDOztBQUU3RSxtQkFBVyxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7OztBQUdsRCxZQUFJLFdBQVcsS0FBSyxJQUFJLElBQUksV0FBVyxLQUFLLEVBQUUsRUFBRTtBQUM1Qyx1QkFBVyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDcEQ7Ozs7QUFJRCxZQUFJLFdBQVcsS0FBSyxJQUFJLElBQUksV0FBVyxLQUFLLEVBQUUsRUFBRTtBQUM1QyxnQkFBSSxJQUFJLEtBQUssU0FBUyxDQUFDLEtBQUssRUFBRTtBQUMxQiwyQkFBVyxHQUFHLEtBQUssQ0FBQzthQUN2QixNQUFNLElBQUksSUFBSSxLQUFLLFNBQVMsQ0FBQyxLQUFLLEVBQUU7QUFDakMsc0JBQU0sQ0FBQyxLQUFLLENBQUMsMkdBQTJHLENBQUMsQ0FBQztBQUMxSCx1QkFBTyxJQUFJLENBQUM7YUFDZjtTQUNKOzs7QUFHRCxZQUFJLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTs7QUFFNUQsa0JBQU0sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsV0FBVyxDQUFDLENBQUM7QUFDbkQsbUJBQU8sSUFBSSxDQUFDO1NBQ2Y7OztBQUdELFlBQUksV0FBVyxLQUFLLE1BQU0sSUFBSSxXQUFXLEtBQUssTUFBTSxFQUFFO0FBQ2xELDBCQUFjLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUN0RCxNQUFNLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDeEMsMEJBQWMsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFlBQVksRUFBRSxXQUFXLENBQUMsQ0FBQztBQUMvRCwwQkFBYyxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzNGLDBCQUFjLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ3RGLE1BQU0sSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDbkUsMEJBQWMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztTQUMxQzs7QUFFRCxzQkFBYyxDQUFDLGdCQUFnQixHQUFHLEVBQUUsR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDckYsc0JBQWMsQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQzs7QUFFOUMsZUFBTyxjQUFjLENBQUM7S0FDekI7O0FBRUQsYUFBUyxZQUFZLENBQUMsWUFBWSxFQUFFO0FBQ2hDLFlBQUksZ0JBQWdCLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2hGLFlBQUksU0FBUyxZQUFBO1lBQ1QsTUFBTSxZQUFBLENBQUM7Ozs7O0FBTVgsaUJBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7QUFFcEQsY0FBTSxHQUFHLFNBQVMsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUksZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUksU0FBUyxDQUFDOztBQUUzSCxlQUFPLE9BQU8sR0FBRyxNQUFNLENBQUM7S0FDM0I7O0FBRUQsYUFBUyxXQUFXLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRTtBQUM1QyxZQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3RSxZQUFJLGdCQUFnQixHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNoRixZQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7QUFDbkIsWUFBSSxtQkFBbUIsWUFBQTtZQUNuQixLQUFLLFlBQUE7WUFDTCxTQUFTLFlBQUE7WUFDVCwrQkFBK0IsWUFBQSxDQUFDOzs7O0FBSXBDLFlBQUksV0FBVyxLQUFLLE1BQU0sRUFBRTtBQUN4QixzQkFBVSxHQUFHLElBQUksQ0FBQztTQUNyQjs7QUFFRCxZQUFJLGdCQUFnQixLQUFLLFNBQVMsSUFBSSxnQkFBZ0IsS0FBSyxFQUFFLEVBQUU7QUFDM0Qsc0JBQVUsR0FBRyxJQUFJLENBQUM7QUFDbEIscUJBQVMsR0FBRyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNqRCxnQkFBSSxXQUFXLEtBQUssTUFBTSxFQUFFOzs7QUFHeEIsMEJBQVUsR0FBRyxJQUFJLENBQUM7QUFDbEIsZ0NBQWdCLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsK0NBQStCLEdBQUcsc0JBQXNCLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDOzs7QUFHM0UsZ0NBQWdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQUFBQyxVQUFVLElBQUksQ0FBQyxHQUFLLFNBQVMsSUFBSSxDQUFDLEFBQUMsQ0FBQztBQUMzRCxnQ0FBZ0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxBQUFDLFNBQVMsSUFBSSxDQUFDLEdBQUssWUFBWSxDQUFDLFFBQVEsSUFBSSxDQUFDLEFBQUMsR0FBSSwrQkFBK0IsSUFBSSxDQUFDLEFBQUMsQ0FBQztBQUMvRyxnQ0FBZ0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxBQUFDLCtCQUErQixJQUFJLENBQUMsR0FBSyxJQUFJLElBQUksQ0FBQyxBQUFDLENBQUM7QUFDM0UsZ0NBQWdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDOztBQUUxQixxQkFBSyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLHFCQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUEsR0FBSSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1RCxxQkFBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLEdBQUksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRTVELG1DQUFtQixHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsbUNBQW1CLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBRXZFLE1BQU07OztBQUdILGdDQUFnQixHQUFHLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUVyQyxnQ0FBZ0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxBQUFDLFVBQVUsSUFBSSxDQUFDLEdBQUssU0FBUyxJQUFJLENBQUMsQUFBQyxDQUFDO0FBQzNELGdDQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLEFBQUMsU0FBUyxJQUFJLENBQUMsR0FBSyxRQUFRLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEFBQUMsQ0FBQzs7QUFFcEcscUJBQUssR0FBRyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixxQkFBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLEdBQUksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRTVELG1DQUFtQixHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDL0M7O0FBRUQsNEJBQWdCLEdBQUcsRUFBRSxHQUFHLG1CQUFtQixDQUFDO0FBQzVDLDRCQUFnQixHQUFHLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2xELHdCQUFZLENBQUMsWUFBWSxDQUFDLGtCQUFrQixFQUFFLGdCQUFnQixDQUFDLENBQUM7U0FDbkUsTUFBTSxJQUFJLFVBQVUsS0FBSyxDQUFDLEVBQUU7QUFDekIsc0JBQVUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQSxJQUFLLENBQUMsQ0FBQztTQUMxRTs7QUFFRCxlQUFPLFVBQVUsR0FBRyxVQUFVLENBQUM7S0FDbEM7O0FBRUQsYUFBUyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFO0FBQ2hELFlBQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUMzQixZQUFJLFFBQVEsWUFBQTtZQUNSLG9CQUFvQixZQUFBO1lBQ3BCLEdBQUcsWUFBQSxDQUFDOztBQUVSLFdBQUcsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3RDLGdCQUFRLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNoRSxnQkFBUSxHQUFHLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7O0FBRXhFLDRCQUFvQixHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDN0QsNEJBQW9CLEdBQUcsb0JBQW9CLEdBQUcsVUFBVSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsU0FBUyxDQUFDOztBQUUzRix1QkFBZSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7QUFDakMsdUJBQWUsQ0FBQyxTQUFTLEdBQUcsb0JBQW9CLENBQUM7O0FBRWpELHVCQUFlLENBQUMsZUFBZSxHQUFHLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRTdGLGVBQU8sZUFBZSxDQUFDO0tBQzFCOztBQUVELGFBQVMsa0JBQWtCLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRTtBQUNoRCxZQUFNLGVBQWUsR0FBRyxFQUFFLENBQUM7QUFDM0IsWUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3JELFlBQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNwQixZQUFJLE9BQU8sWUFBQTtZQUNQLFdBQVcsWUFBQTtZQUNYLFNBQVMsWUFBQTtZQUNULENBQUMsWUFBQTtZQUFDLENBQUMsWUFBQTtZQUFDLENBQUMsWUFBQSxDQUFDO0FBQ1YsWUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDOztBQUVqQixhQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDaEMsbUJBQU8sR0FBRyxFQUFFLENBQUM7OztBQUdiLHFCQUFTLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7OztBQUl4QyxnQkFBSSxTQUFTLElBQUksc0NBQU8sU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLHNDQUFPLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUU7QUFDekUsdUJBQU8sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO2FBQ2pDO0FBQ0QsbUJBQU8sQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7QUFHbEMsbUJBQU8sQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzs7O0FBR3BELGdCQUFJLEFBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7QUFDekIsdUJBQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2pCOztBQUVELGdCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDUCwyQkFBVyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDOztBQUU1QyxvQkFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUU7QUFDaEIsd0JBQUksV0FBVyxDQUFDLFNBQVMsRUFBRTtBQUN2QixtQ0FBVyxDQUFDLENBQUMsR0FBRyxzQ0FBTyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsc0NBQU8sV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7cUJBQzFGLE1BQU07QUFDSCxtQ0FBVyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUM7cUJBQzdDO0FBQ0QsNEJBQVEsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDO2lCQUM3Qjs7QUFFRCxvQkFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7QUFDWix3QkFBSSxXQUFXLENBQUMsU0FBUyxFQUFFO0FBQ3ZCLCtCQUFPLENBQUMsU0FBUyxHQUFHLHNDQUFPLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsc0NBQU8sV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDeEYsK0JBQU8sQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztxQkFDN0MsTUFBTTtBQUNILCtCQUFPLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQztxQkFDN0M7aUJBQ0o7YUFDSjs7QUFFRCxnQkFBSSxPQUFPLENBQUMsQ0FBQyxFQUFFO0FBQ1gsd0JBQVEsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQ3pCOzs7QUFHRCxvQkFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzs7O0FBR3ZCLGFBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzVDLGdCQUFJLENBQUMsRUFBRTs7QUFFSCxxQkFBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBSSxDQUFDLEdBQUcsQ0FBQyxBQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDMUIsK0JBQVcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM1QywyQkFBTyxHQUFHLEVBQUUsQ0FBQztBQUNiLDJCQUFPLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUMxQywyQkFBTyxDQUFDLENBQUMsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDO0FBQzFCLHdCQUFJLFdBQVcsQ0FBQyxTQUFTLEVBQUU7QUFDdkIsK0JBQU8sQ0FBQyxTQUFTLEdBQUksc0NBQU8sV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxzQ0FBTyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztxQkFDNUY7QUFDRCw0QkFBUSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDdEIsNEJBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQzFCO2FBQ0o7U0FDSjs7QUFFRCx1QkFBZSxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUM7QUFDN0IsdUJBQWUsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBQ3JDLHVCQUFlLENBQUMsUUFBUSxHQUFHLFFBQVEsR0FBRyxTQUFTLENBQUM7O0FBRWhELGVBQU8sZUFBZSxDQUFDO0tBQzFCOztBQUVELGFBQVMsMEJBQTBCLENBQUMsZ0JBQWdCLEVBQUU7QUFDbEQsWUFBSSxRQUFRLFlBQUE7WUFDUixTQUFTLFlBQUE7WUFDVCxTQUFTLFlBQUE7WUFDVCxHQUFHLFlBQUEsQ0FBQzs7O0FBR1IsZ0JBQVEsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7O0FBR2hFLGlCQUFTLEdBQUcsd0JBQXdCLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRS9DLFlBQUksU0FBUyxFQUFFOztBQUVYLHFCQUFTLEdBQUcsSUFBSSxXQUFXLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7QUFHOUMscUJBQVMsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7OztBQUd2RCxxQkFBUyxHQUFHLEFBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBRSxlQUFlLENBQUMsU0FBUyxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDNUUsZUFBRyxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDOzs7QUFHakQsZUFBRyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7OztBQUc5QixpQ0FBcUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM5Qjs7QUFFRCxlQUFPLEdBQUcsQ0FBQztLQUNkOztBQUVELGFBQVMsd0JBQXdCLENBQUMsUUFBUSxFQUFFO0FBQ3hDLFlBQUksTUFBTSxZQUFBO1lBQ04sV0FBVyxZQUFBO1lBQ1gsVUFBVSxZQUFBO1lBQ1YsWUFBWSxZQUFBO1lBQ1osV0FBVyxZQUFBLENBQUM7QUFDaEIsWUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7OztBQUtWLGNBQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBLElBQUssUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUEsQUFBQyxJQUFJLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLEFBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEcsU0FBQyxJQUFJLENBQUMsQ0FBQzs7O0FBR1AsbUJBQVcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLEdBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25ELFNBQUMsSUFBSSxDQUFDLENBQUM7OztBQUdQLGVBQU8sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUU7O0FBRXhCLHNCQUFVLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxHQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRCxhQUFDLElBQUksQ0FBQyxDQUFDOzs7QUFHUCxnQkFBSSxVQUFVLEtBQUssSUFBSSxFQUFFOzs7QUFHckIsNEJBQVksR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLEdBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BELGlCQUFDLElBQUksQ0FBQyxDQUFDOzs7QUFHUCwyQkFBVyxHQUFHLElBQUksVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzNDLDJCQUFXLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDO0FBQ3hELHVCQUFPLFdBQVcsQ0FBQzthQUN0QjtTQUNKOztBQUVELGVBQU8sSUFBSSxDQUFDO0tBQ2Y7O0FBRUQsYUFBUyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUU7QUFDakMsaUJBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLGlCQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN0QixpQkFBUyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdEIsaUJBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3pCOztBQUVELGFBQVMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQ2xDLFlBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixhQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFCLGFBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDdEI7O0FBR0QsYUFBUyx5QkFBeUIsQ0FBQyxnQkFBZ0IsRUFBRTtBQUNqRCxZQUFJLEdBQUcsR0FBRztBQUNOLGtCQUFNLEVBQUUsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLElBQUk7QUFDeEMsb0JBQVEsRUFBRSxNQUFNO1NBQ25CLENBQUM7QUFDRixlQUFPO0FBQ0gsdUJBQVcsRUFBRSwrQ0FBK0M7QUFDNUQsaUJBQUssRUFBRSx5QkFBeUI7QUFDaEMsZUFBRyxFQUFFLEdBQUc7QUFDUix1QkFBVyxFQUFFLEdBQUc7U0FDbkIsQ0FBQztLQUNMOztBQUVELGFBQVMsK0JBQStCLENBQUMsR0FBRyxFQUFFO0FBQzFDLFlBQUksVUFBVSxHQUFHO0FBQ2IsdUJBQVcsRUFBRSwrQ0FBK0M7QUFDNUQsaUJBQUssRUFBRSxvQkFBb0I7U0FDOUIsQ0FBQztBQUNGLFlBQUksQ0FBQyxHQUFHLEVBQ0osT0FBTyxVQUFVLENBQUM7O0FBRXRCLFlBQU0sWUFBWSxHQUFHLElBQUksVUFBVSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDcEQsb0JBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDdkIsb0JBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDdkIsb0JBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDOzs7QUFHekIsWUFBTSxNQUFNLEdBQUcsRUFBRSw2Q0FBNkMsRUFBRSxrQkFBa0IsQ0FBQyxxQkFBcUIsWUFBWSxDQUFDLE1BQU0sQ0FBQztBQUM1SCxZQUFJLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsQyxZQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7OztBQUdWLFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQSxJQUFLLEVBQUUsQ0FBQztBQUN4QyxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUEsSUFBSyxFQUFFLENBQUM7QUFDeEMsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFBLElBQUssQ0FBQyxDQUFDO0FBQ3ZDLFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFJLE1BQU0sR0FBRyxVQUFVLEFBQUMsQ0FBQzs7O0FBR2xDLFlBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDOUQsU0FBQyxJQUFJLENBQUMsQ0FBQzs7O0FBR1AsWUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQy9HLFNBQUMsSUFBSSxFQUFFLENBQUM7OztBQUdSLFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUEsSUFBSyxFQUFFLENBQUM7QUFDckQsWUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQSxJQUFLLEVBQUUsQ0FBQztBQUNyRCxZQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFBLElBQUssQ0FBQyxDQUFDO0FBQ3BELFlBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsVUFBVSxBQUFDLENBQUM7OztBQUcvQyxZQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQzs7O0FBRzFCLFlBQUksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDN0MsWUFBSSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRWhDLGtCQUFVLENBQUMsSUFBSSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDOztBQUVu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QUcsS0FBSyxDQUFDO0FBQ3hCLFdBQVcsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO0FBQzFCLFdBQVcsQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQzdCLFdBQVcsQ0FBQyxvQkFBb0IsR0FBRyxnQkFBZ0IsQ0FBQztBQUNwRCxXQUFXLENBQUMsaUJBQWlCLEdBQUcsdUJBQXVCLENBQUM7QUFDeEQsV0FBVyxDQUFDLGtCQUFrQixHQUFHLGNBQWMsQ0FBQztBQUNoRCxXQUFXLENBQUMsa0JBQWtCLEdBQUcsY0FBYyxDQUFDO0FBQ2hELFdBQVcsQ0FBQyxnQ0FBZ0MsR0FBRywyQkFBMkIsQ0FBQztBQUMzRSxXQUFXLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQzs7UUFFeEIsV0FBVyxHQUFYLFdBQVc7UUFBRSxnQkFBZ0IsR0FBaEIsZ0JBQWdCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwidmFyIGJpZ0ludD1mdW5jdGlvbih1bmRlZmluZWQpe1widXNlIHN0cmljdFwiO3ZhciBCQVNFPTFlNyxMT0dfQkFTRT03LE1BWF9JTlQ9OTAwNzE5OTI1NDc0MDk5MixNQVhfSU5UX0FSUj1zbWFsbFRvQXJyYXkoTUFYX0lOVCksREVGQVVMVF9BTFBIQUJFVD1cIjAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5elwiO3ZhciBzdXBwb3J0c05hdGl2ZUJpZ0ludD10eXBlb2YgQmlnSW50PT09XCJmdW5jdGlvblwiO2Z1bmN0aW9uIEludGVnZXIodixyYWRpeCxhbHBoYWJldCxjYXNlU2Vuc2l0aXZlKXtpZih0eXBlb2Ygdj09PVwidW5kZWZpbmVkXCIpcmV0dXJuIEludGVnZXJbMF07aWYodHlwZW9mIHJhZGl4IT09XCJ1bmRlZmluZWRcIilyZXR1cm4rcmFkaXg9PT0xMCYmIWFscGhhYmV0P3BhcnNlVmFsdWUodik6cGFyc2VCYXNlKHYscmFkaXgsYWxwaGFiZXQsY2FzZVNlbnNpdGl2ZSk7cmV0dXJuIHBhcnNlVmFsdWUodil9ZnVuY3Rpb24gQmlnSW50ZWdlcih2YWx1ZSxzaWduKXt0aGlzLnZhbHVlPXZhbHVlO3RoaXMuc2lnbj1zaWduO3RoaXMuaXNTbWFsbD1mYWxzZX1CaWdJbnRlZ2VyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEludGVnZXIucHJvdG90eXBlKTtmdW5jdGlvbiBTbWFsbEludGVnZXIodmFsdWUpe3RoaXMudmFsdWU9dmFsdWU7dGhpcy5zaWduPXZhbHVlPDA7dGhpcy5pc1NtYWxsPXRydWV9U21hbGxJbnRlZ2VyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEludGVnZXIucHJvdG90eXBlKTtmdW5jdGlvbiBOYXRpdmVCaWdJbnQodmFsdWUpe3RoaXMudmFsdWU9dmFsdWV9TmF0aXZlQmlnSW50LnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEludGVnZXIucHJvdG90eXBlKTtmdW5jdGlvbiBpc1ByZWNpc2Uobil7cmV0dXJuLU1BWF9JTlQ8biYmbjxNQVhfSU5UfWZ1bmN0aW9uIHNtYWxsVG9BcnJheShuKXtpZihuPDFlNylyZXR1cm5bbl07aWYobjwxZTE0KXJldHVybltuJTFlNyxNYXRoLmZsb29yKG4vMWU3KV07cmV0dXJuW24lMWU3LE1hdGguZmxvb3Iobi8xZTcpJTFlNyxNYXRoLmZsb29yKG4vMWUxNCldfWZ1bmN0aW9uIGFycmF5VG9TbWFsbChhcnIpe3RyaW0oYXJyKTt2YXIgbGVuZ3RoPWFyci5sZW5ndGg7aWYobGVuZ3RoPDQmJmNvbXBhcmVBYnMoYXJyLE1BWF9JTlRfQVJSKTwwKXtzd2l0Y2gobGVuZ3RoKXtjYXNlIDA6cmV0dXJuIDA7Y2FzZSAxOnJldHVybiBhcnJbMF07Y2FzZSAyOnJldHVybiBhcnJbMF0rYXJyWzFdKkJBU0U7ZGVmYXVsdDpyZXR1cm4gYXJyWzBdKyhhcnJbMV0rYXJyWzJdKkJBU0UpKkJBU0V9fXJldHVybiBhcnJ9ZnVuY3Rpb24gdHJpbSh2KXt2YXIgaT12Lmxlbmd0aDt3aGlsZSh2Wy0taV09PT0wKTt2Lmxlbmd0aD1pKzF9ZnVuY3Rpb24gY3JlYXRlQXJyYXkobGVuZ3RoKXt2YXIgeD1uZXcgQXJyYXkobGVuZ3RoKTt2YXIgaT0tMTt3aGlsZSgrK2k8bGVuZ3RoKXt4W2ldPTB9cmV0dXJuIHh9ZnVuY3Rpb24gdHJ1bmNhdGUobil7aWYobj4wKXJldHVybiBNYXRoLmZsb29yKG4pO3JldHVybiBNYXRoLmNlaWwobil9ZnVuY3Rpb24gYWRkKGEsYil7dmFyIGxfYT1hLmxlbmd0aCxsX2I9Yi5sZW5ndGgscj1uZXcgQXJyYXkobF9hKSxjYXJyeT0wLGJhc2U9QkFTRSxzdW0saTtmb3IoaT0wO2k8bF9iO2krKyl7c3VtPWFbaV0rYltpXStjYXJyeTtjYXJyeT1zdW0+PWJhc2U/MTowO3JbaV09c3VtLWNhcnJ5KmJhc2V9d2hpbGUoaTxsX2Epe3N1bT1hW2ldK2NhcnJ5O2NhcnJ5PXN1bT09PWJhc2U/MTowO3JbaSsrXT1zdW0tY2FycnkqYmFzZX1pZihjYXJyeT4wKXIucHVzaChjYXJyeSk7cmV0dXJuIHJ9ZnVuY3Rpb24gYWRkQW55KGEsYil7aWYoYS5sZW5ndGg+PWIubGVuZ3RoKXJldHVybiBhZGQoYSxiKTtyZXR1cm4gYWRkKGIsYSl9ZnVuY3Rpb24gYWRkU21hbGwoYSxjYXJyeSl7dmFyIGw9YS5sZW5ndGgscj1uZXcgQXJyYXkobCksYmFzZT1CQVNFLHN1bSxpO2ZvcihpPTA7aTxsO2krKyl7c3VtPWFbaV0tYmFzZStjYXJyeTtjYXJyeT1NYXRoLmZsb29yKHN1bS9iYXNlKTtyW2ldPXN1bS1jYXJyeSpiYXNlO2NhcnJ5Kz0xfXdoaWxlKGNhcnJ5PjApe3JbaSsrXT1jYXJyeSViYXNlO2NhcnJ5PU1hdGguZmxvb3IoY2FycnkvYmFzZSl9cmV0dXJuIHJ9QmlnSW50ZWdlci5wcm90b3R5cGUuYWRkPWZ1bmN0aW9uKHYpe3ZhciBuPXBhcnNlVmFsdWUodik7aWYodGhpcy5zaWduIT09bi5zaWduKXtyZXR1cm4gdGhpcy5zdWJ0cmFjdChuLm5lZ2F0ZSgpKX12YXIgYT10aGlzLnZhbHVlLGI9bi52YWx1ZTtpZihuLmlzU21hbGwpe3JldHVybiBuZXcgQmlnSW50ZWdlcihhZGRTbWFsbChhLE1hdGguYWJzKGIpKSx0aGlzLnNpZ24pfXJldHVybiBuZXcgQmlnSW50ZWdlcihhZGRBbnkoYSxiKSx0aGlzLnNpZ24pfTtCaWdJbnRlZ2VyLnByb3RvdHlwZS5wbHVzPUJpZ0ludGVnZXIucHJvdG90eXBlLmFkZDtTbWFsbEludGVnZXIucHJvdG90eXBlLmFkZD1mdW5jdGlvbih2KXt2YXIgbj1wYXJzZVZhbHVlKHYpO3ZhciBhPXRoaXMudmFsdWU7aWYoYTwwIT09bi5zaWduKXtyZXR1cm4gdGhpcy5zdWJ0cmFjdChuLm5lZ2F0ZSgpKX12YXIgYj1uLnZhbHVlO2lmKG4uaXNTbWFsbCl7aWYoaXNQcmVjaXNlKGErYikpcmV0dXJuIG5ldyBTbWFsbEludGVnZXIoYStiKTtiPXNtYWxsVG9BcnJheShNYXRoLmFicyhiKSl9cmV0dXJuIG5ldyBCaWdJbnRlZ2VyKGFkZFNtYWxsKGIsTWF0aC5hYnMoYSkpLGE8MCl9O1NtYWxsSW50ZWdlci5wcm90b3R5cGUucGx1cz1TbWFsbEludGVnZXIucHJvdG90eXBlLmFkZDtOYXRpdmVCaWdJbnQucHJvdG90eXBlLmFkZD1mdW5jdGlvbih2KXtyZXR1cm4gbmV3IE5hdGl2ZUJpZ0ludCh0aGlzLnZhbHVlK3BhcnNlVmFsdWUodikudmFsdWUpfTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLnBsdXM9TmF0aXZlQmlnSW50LnByb3RvdHlwZS5hZGQ7ZnVuY3Rpb24gc3VidHJhY3QoYSxiKXt2YXIgYV9sPWEubGVuZ3RoLGJfbD1iLmxlbmd0aCxyPW5ldyBBcnJheShhX2wpLGJvcnJvdz0wLGJhc2U9QkFTRSxpLGRpZmZlcmVuY2U7Zm9yKGk9MDtpPGJfbDtpKyspe2RpZmZlcmVuY2U9YVtpXS1ib3Jyb3ctYltpXTtpZihkaWZmZXJlbmNlPDApe2RpZmZlcmVuY2UrPWJhc2U7Ym9ycm93PTF9ZWxzZSBib3Jyb3c9MDtyW2ldPWRpZmZlcmVuY2V9Zm9yKGk9Yl9sO2k8YV9sO2krKyl7ZGlmZmVyZW5jZT1hW2ldLWJvcnJvdztpZihkaWZmZXJlbmNlPDApZGlmZmVyZW5jZSs9YmFzZTtlbHNle3JbaSsrXT1kaWZmZXJlbmNlO2JyZWFrfXJbaV09ZGlmZmVyZW5jZX1mb3IoO2k8YV9sO2krKyl7cltpXT1hW2ldfXRyaW0ocik7cmV0dXJuIHJ9ZnVuY3Rpb24gc3VidHJhY3RBbnkoYSxiLHNpZ24pe3ZhciB2YWx1ZTtpZihjb21wYXJlQWJzKGEsYik+PTApe3ZhbHVlPXN1YnRyYWN0KGEsYil9ZWxzZXt2YWx1ZT1zdWJ0cmFjdChiLGEpO3NpZ249IXNpZ259dmFsdWU9YXJyYXlUb1NtYWxsKHZhbHVlKTtpZih0eXBlb2YgdmFsdWU9PT1cIm51bWJlclwiKXtpZihzaWduKXZhbHVlPS12YWx1ZTtyZXR1cm4gbmV3IFNtYWxsSW50ZWdlcih2YWx1ZSl9cmV0dXJuIG5ldyBCaWdJbnRlZ2VyKHZhbHVlLHNpZ24pfWZ1bmN0aW9uIHN1YnRyYWN0U21hbGwoYSxiLHNpZ24pe3ZhciBsPWEubGVuZ3RoLHI9bmV3IEFycmF5KGwpLGNhcnJ5PS1iLGJhc2U9QkFTRSxpLGRpZmZlcmVuY2U7Zm9yKGk9MDtpPGw7aSsrKXtkaWZmZXJlbmNlPWFbaV0rY2Fycnk7Y2Fycnk9TWF0aC5mbG9vcihkaWZmZXJlbmNlL2Jhc2UpO2RpZmZlcmVuY2UlPWJhc2U7cltpXT1kaWZmZXJlbmNlPDA/ZGlmZmVyZW5jZStiYXNlOmRpZmZlcmVuY2V9cj1hcnJheVRvU21hbGwocik7aWYodHlwZW9mIHI9PT1cIm51bWJlclwiKXtpZihzaWduKXI9LXI7cmV0dXJuIG5ldyBTbWFsbEludGVnZXIocil9cmV0dXJuIG5ldyBCaWdJbnRlZ2VyKHIsc2lnbil9QmlnSW50ZWdlci5wcm90b3R5cGUuc3VidHJhY3Q9ZnVuY3Rpb24odil7dmFyIG49cGFyc2VWYWx1ZSh2KTtpZih0aGlzLnNpZ24hPT1uLnNpZ24pe3JldHVybiB0aGlzLmFkZChuLm5lZ2F0ZSgpKX12YXIgYT10aGlzLnZhbHVlLGI9bi52YWx1ZTtpZihuLmlzU21hbGwpcmV0dXJuIHN1YnRyYWN0U21hbGwoYSxNYXRoLmFicyhiKSx0aGlzLnNpZ24pO3JldHVybiBzdWJ0cmFjdEFueShhLGIsdGhpcy5zaWduKX07QmlnSW50ZWdlci5wcm90b3R5cGUubWludXM9QmlnSW50ZWdlci5wcm90b3R5cGUuc3VidHJhY3Q7U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5zdWJ0cmFjdD1mdW5jdGlvbih2KXt2YXIgbj1wYXJzZVZhbHVlKHYpO3ZhciBhPXRoaXMudmFsdWU7aWYoYTwwIT09bi5zaWduKXtyZXR1cm4gdGhpcy5hZGQobi5uZWdhdGUoKSl9dmFyIGI9bi52YWx1ZTtpZihuLmlzU21hbGwpe3JldHVybiBuZXcgU21hbGxJbnRlZ2VyKGEtYil9cmV0dXJuIHN1YnRyYWN0U21hbGwoYixNYXRoLmFicyhhKSxhPj0wKX07U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5taW51cz1TbWFsbEludGVnZXIucHJvdG90eXBlLnN1YnRyYWN0O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUuc3VidHJhY3Q9ZnVuY3Rpb24odil7cmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodGhpcy52YWx1ZS1wYXJzZVZhbHVlKHYpLnZhbHVlKX07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5taW51cz1OYXRpdmVCaWdJbnQucHJvdG90eXBlLnN1YnRyYWN0O0JpZ0ludGVnZXIucHJvdG90eXBlLm5lZ2F0ZT1mdW5jdGlvbigpe3JldHVybiBuZXcgQmlnSW50ZWdlcih0aGlzLnZhbHVlLCF0aGlzLnNpZ24pfTtTbWFsbEludGVnZXIucHJvdG90eXBlLm5lZ2F0ZT1mdW5jdGlvbigpe3ZhciBzaWduPXRoaXMuc2lnbjt2YXIgc21hbGw9bmV3IFNtYWxsSW50ZWdlcigtdGhpcy52YWx1ZSk7c21hbGwuc2lnbj0hc2lnbjtyZXR1cm4gc21hbGx9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUubmVnYXRlPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQoLXRoaXMudmFsdWUpfTtCaWdJbnRlZ2VyLnByb3RvdHlwZS5hYnM9ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IEJpZ0ludGVnZXIodGhpcy52YWx1ZSxmYWxzZSl9O1NtYWxsSW50ZWdlci5wcm90b3R5cGUuYWJzPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBTbWFsbEludGVnZXIoTWF0aC5hYnModGhpcy52YWx1ZSkpfTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLmFicz1mdW5jdGlvbigpe3JldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWU+PTA/dGhpcy52YWx1ZTotdGhpcy52YWx1ZSl9O2Z1bmN0aW9uIG11bHRpcGx5TG9uZyhhLGIpe3ZhciBhX2w9YS5sZW5ndGgsYl9sPWIubGVuZ3RoLGw9YV9sK2JfbCxyPWNyZWF0ZUFycmF5KGwpLGJhc2U9QkFTRSxwcm9kdWN0LGNhcnJ5LGksYV9pLGJfajtmb3IoaT0wO2k8YV9sOysraSl7YV9pPWFbaV07Zm9yKHZhciBqPTA7ajxiX2w7KytqKXtiX2o9YltqXTtwcm9kdWN0PWFfaSpiX2orcltpK2pdO2NhcnJ5PU1hdGguZmxvb3IocHJvZHVjdC9iYXNlKTtyW2kral09cHJvZHVjdC1jYXJyeSpiYXNlO3JbaStqKzFdKz1jYXJyeX19dHJpbShyKTtyZXR1cm4gcn1mdW5jdGlvbiBtdWx0aXBseVNtYWxsKGEsYil7dmFyIGw9YS5sZW5ndGgscj1uZXcgQXJyYXkobCksYmFzZT1CQVNFLGNhcnJ5PTAscHJvZHVjdCxpO2ZvcihpPTA7aTxsO2krKyl7cHJvZHVjdD1hW2ldKmIrY2Fycnk7Y2Fycnk9TWF0aC5mbG9vcihwcm9kdWN0L2Jhc2UpO3JbaV09cHJvZHVjdC1jYXJyeSpiYXNlfXdoaWxlKGNhcnJ5PjApe3JbaSsrXT1jYXJyeSViYXNlO2NhcnJ5PU1hdGguZmxvb3IoY2FycnkvYmFzZSl9cmV0dXJuIHJ9ZnVuY3Rpb24gc2hpZnRMZWZ0KHgsbil7dmFyIHI9W107d2hpbGUobi0tID4wKXIucHVzaCgwKTtyZXR1cm4gci5jb25jYXQoeCl9ZnVuY3Rpb24gbXVsdGlwbHlLYXJhdHN1YmEoeCx5KXt2YXIgbj1NYXRoLm1heCh4Lmxlbmd0aCx5Lmxlbmd0aCk7aWYobjw9MzApcmV0dXJuIG11bHRpcGx5TG9uZyh4LHkpO249TWF0aC5jZWlsKG4vMik7dmFyIGI9eC5zbGljZShuKSxhPXguc2xpY2UoMCxuKSxkPXkuc2xpY2UobiksYz15LnNsaWNlKDAsbik7dmFyIGFjPW11bHRpcGx5S2FyYXRzdWJhKGEsYyksYmQ9bXVsdGlwbHlLYXJhdHN1YmEoYixkKSxhYmNkPW11bHRpcGx5S2FyYXRzdWJhKGFkZEFueShhLGIpLGFkZEFueShjLGQpKTt2YXIgcHJvZHVjdD1hZGRBbnkoYWRkQW55KGFjLHNoaWZ0TGVmdChzdWJ0cmFjdChzdWJ0cmFjdChhYmNkLGFjKSxiZCksbikpLHNoaWZ0TGVmdChiZCwyKm4pKTt0cmltKHByb2R1Y3QpO3JldHVybiBwcm9kdWN0fWZ1bmN0aW9uIHVzZUthcmF0c3ViYShsMSxsMil7cmV0dXJuLS4wMTIqbDEtLjAxMipsMisxNWUtNipsMSpsMj4wfUJpZ0ludGVnZXIucHJvdG90eXBlLm11bHRpcGx5PWZ1bmN0aW9uKHYpe3ZhciBuPXBhcnNlVmFsdWUodiksYT10aGlzLnZhbHVlLGI9bi52YWx1ZSxzaWduPXRoaXMuc2lnbiE9PW4uc2lnbixhYnM7aWYobi5pc1NtYWxsKXtpZihiPT09MClyZXR1cm4gSW50ZWdlclswXTtpZihiPT09MSlyZXR1cm4gdGhpcztpZihiPT09LTEpcmV0dXJuIHRoaXMubmVnYXRlKCk7YWJzPU1hdGguYWJzKGIpO2lmKGFiczxCQVNFKXtyZXR1cm4gbmV3IEJpZ0ludGVnZXIobXVsdGlwbHlTbWFsbChhLGFicyksc2lnbil9Yj1zbWFsbFRvQXJyYXkoYWJzKX1pZih1c2VLYXJhdHN1YmEoYS5sZW5ndGgsYi5sZW5ndGgpKXJldHVybiBuZXcgQmlnSW50ZWdlcihtdWx0aXBseUthcmF0c3ViYShhLGIpLHNpZ24pO3JldHVybiBuZXcgQmlnSW50ZWdlcihtdWx0aXBseUxvbmcoYSxiKSxzaWduKX07QmlnSW50ZWdlci5wcm90b3R5cGUudGltZXM9QmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHk7ZnVuY3Rpb24gbXVsdGlwbHlTbWFsbEFuZEFycmF5KGEsYixzaWduKXtpZihhPEJBU0Upe3JldHVybiBuZXcgQmlnSW50ZWdlcihtdWx0aXBseVNtYWxsKGIsYSksc2lnbil9cmV0dXJuIG5ldyBCaWdJbnRlZ2VyKG11bHRpcGx5TG9uZyhiLHNtYWxsVG9BcnJheShhKSksc2lnbil9U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5fbXVsdGlwbHlCeVNtYWxsPWZ1bmN0aW9uKGEpe2lmKGlzUHJlY2lzZShhLnZhbHVlKnRoaXMudmFsdWUpKXtyZXR1cm4gbmV3IFNtYWxsSW50ZWdlcihhLnZhbHVlKnRoaXMudmFsdWUpfXJldHVybiBtdWx0aXBseVNtYWxsQW5kQXJyYXkoTWF0aC5hYnMoYS52YWx1ZSksc21hbGxUb0FycmF5KE1hdGguYWJzKHRoaXMudmFsdWUpKSx0aGlzLnNpZ24hPT1hLnNpZ24pfTtCaWdJbnRlZ2VyLnByb3RvdHlwZS5fbXVsdGlwbHlCeVNtYWxsPWZ1bmN0aW9uKGEpe2lmKGEudmFsdWU9PT0wKXJldHVybiBJbnRlZ2VyWzBdO2lmKGEudmFsdWU9PT0xKXJldHVybiB0aGlzO2lmKGEudmFsdWU9PT0tMSlyZXR1cm4gdGhpcy5uZWdhdGUoKTtyZXR1cm4gbXVsdGlwbHlTbWFsbEFuZEFycmF5KE1hdGguYWJzKGEudmFsdWUpLHRoaXMudmFsdWUsdGhpcy5zaWduIT09YS5zaWduKX07U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseT1mdW5jdGlvbih2KXtyZXR1cm4gcGFyc2VWYWx1ZSh2KS5fbXVsdGlwbHlCeVNtYWxsKHRoaXMpfTtTbWFsbEludGVnZXIucHJvdG90eXBlLnRpbWVzPVNtYWxsSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHk7TmF0aXZlQmlnSW50LnByb3RvdHlwZS5tdWx0aXBseT1mdW5jdGlvbih2KXtyZXR1cm4gbmV3IE5hdGl2ZUJpZ0ludCh0aGlzLnZhbHVlKnBhcnNlVmFsdWUodikudmFsdWUpfTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLnRpbWVzPU5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubXVsdGlwbHk7ZnVuY3Rpb24gc3F1YXJlKGEpe3ZhciBsPWEubGVuZ3RoLHI9Y3JlYXRlQXJyYXkobCtsKSxiYXNlPUJBU0UscHJvZHVjdCxjYXJyeSxpLGFfaSxhX2o7Zm9yKGk9MDtpPGw7aSsrKXthX2k9YVtpXTtjYXJyeT0wLWFfaSphX2k7Zm9yKHZhciBqPWk7ajxsO2orKyl7YV9qPWFbal07cHJvZHVjdD0yKihhX2kqYV9qKStyW2kral0rY2Fycnk7Y2Fycnk9TWF0aC5mbG9vcihwcm9kdWN0L2Jhc2UpO3JbaStqXT1wcm9kdWN0LWNhcnJ5KmJhc2V9cltpK2xdPWNhcnJ5fXRyaW0ocik7cmV0dXJuIHJ9QmlnSW50ZWdlci5wcm90b3R5cGUuc3F1YXJlPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBCaWdJbnRlZ2VyKHNxdWFyZSh0aGlzLnZhbHVlKSxmYWxzZSl9O1NtYWxsSW50ZWdlci5wcm90b3R5cGUuc3F1YXJlPWZ1bmN0aW9uKCl7dmFyIHZhbHVlPXRoaXMudmFsdWUqdGhpcy52YWx1ZTtpZihpc1ByZWNpc2UodmFsdWUpKXJldHVybiBuZXcgU21hbGxJbnRlZ2VyKHZhbHVlKTtyZXR1cm4gbmV3IEJpZ0ludGVnZXIoc3F1YXJlKHNtYWxsVG9BcnJheShNYXRoLmFicyh0aGlzLnZhbHVlKSkpLGZhbHNlKX07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5zcXVhcmU9ZnVuY3Rpb24odil7cmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodGhpcy52YWx1ZSp0aGlzLnZhbHVlKX07ZnVuY3Rpb24gZGl2TW9kMShhLGIpe3ZhciBhX2w9YS5sZW5ndGgsYl9sPWIubGVuZ3RoLGJhc2U9QkFTRSxyZXN1bHQ9Y3JlYXRlQXJyYXkoYi5sZW5ndGgpLGRpdmlzb3JNb3N0U2lnbmlmaWNhbnREaWdpdD1iW2JfbC0xXSxsYW1iZGE9TWF0aC5jZWlsKGJhc2UvKDIqZGl2aXNvck1vc3RTaWduaWZpY2FudERpZ2l0KSkscmVtYWluZGVyPW11bHRpcGx5U21hbGwoYSxsYW1iZGEpLGRpdmlzb3I9bXVsdGlwbHlTbWFsbChiLGxhbWJkYSkscXVvdGllbnREaWdpdCxzaGlmdCxjYXJyeSxib3Jyb3csaSxsLHE7aWYocmVtYWluZGVyLmxlbmd0aDw9YV9sKXJlbWFpbmRlci5wdXNoKDApO2Rpdmlzb3IucHVzaCgwKTtkaXZpc29yTW9zdFNpZ25pZmljYW50RGlnaXQ9ZGl2aXNvcltiX2wtMV07Zm9yKHNoaWZ0PWFfbC1iX2w7c2hpZnQ+PTA7c2hpZnQtLSl7cXVvdGllbnREaWdpdD1iYXNlLTE7aWYocmVtYWluZGVyW3NoaWZ0K2JfbF0hPT1kaXZpc29yTW9zdFNpZ25pZmljYW50RGlnaXQpe3F1b3RpZW50RGlnaXQ9TWF0aC5mbG9vcigocmVtYWluZGVyW3NoaWZ0K2JfbF0qYmFzZStyZW1haW5kZXJbc2hpZnQrYl9sLTFdKS9kaXZpc29yTW9zdFNpZ25pZmljYW50RGlnaXQpfWNhcnJ5PTA7Ym9ycm93PTA7bD1kaXZpc29yLmxlbmd0aDtmb3IoaT0wO2k8bDtpKyspe2NhcnJ5Kz1xdW90aWVudERpZ2l0KmRpdmlzb3JbaV07cT1NYXRoLmZsb29yKGNhcnJ5L2Jhc2UpO2JvcnJvdys9cmVtYWluZGVyW3NoaWZ0K2ldLShjYXJyeS1xKmJhc2UpO2NhcnJ5PXE7aWYoYm9ycm93PDApe3JlbWFpbmRlcltzaGlmdCtpXT1ib3Jyb3crYmFzZTtib3Jyb3c9LTF9ZWxzZXtyZW1haW5kZXJbc2hpZnQraV09Ym9ycm93O2JvcnJvdz0wfX13aGlsZShib3Jyb3chPT0wKXtxdW90aWVudERpZ2l0LT0xO2NhcnJ5PTA7Zm9yKGk9MDtpPGw7aSsrKXtjYXJyeSs9cmVtYWluZGVyW3NoaWZ0K2ldLWJhc2UrZGl2aXNvcltpXTtpZihjYXJyeTwwKXtyZW1haW5kZXJbc2hpZnQraV09Y2FycnkrYmFzZTtjYXJyeT0wfWVsc2V7cmVtYWluZGVyW3NoaWZ0K2ldPWNhcnJ5O2NhcnJ5PTF9fWJvcnJvdys9Y2Fycnl9cmVzdWx0W3NoaWZ0XT1xdW90aWVudERpZ2l0fXJlbWFpbmRlcj1kaXZNb2RTbWFsbChyZW1haW5kZXIsbGFtYmRhKVswXTtyZXR1cm5bYXJyYXlUb1NtYWxsKHJlc3VsdCksYXJyYXlUb1NtYWxsKHJlbWFpbmRlcildfWZ1bmN0aW9uIGRpdk1vZDIoYSxiKXt2YXIgYV9sPWEubGVuZ3RoLGJfbD1iLmxlbmd0aCxyZXN1bHQ9W10scGFydD1bXSxiYXNlPUJBU0UsZ3Vlc3MseGxlbixoaWdoeCxoaWdoeSxjaGVjazt3aGlsZShhX2wpe3BhcnQudW5zaGlmdChhWy0tYV9sXSk7dHJpbShwYXJ0KTtpZihjb21wYXJlQWJzKHBhcnQsYik8MCl7cmVzdWx0LnB1c2goMCk7Y29udGludWV9eGxlbj1wYXJ0Lmxlbmd0aDtoaWdoeD1wYXJ0W3hsZW4tMV0qYmFzZStwYXJ0W3hsZW4tMl07aGlnaHk9YltiX2wtMV0qYmFzZStiW2JfbC0yXTtpZih4bGVuPmJfbCl7aGlnaHg9KGhpZ2h4KzEpKmJhc2V9Z3Vlc3M9TWF0aC5jZWlsKGhpZ2h4L2hpZ2h5KTtkb3tjaGVjaz1tdWx0aXBseVNtYWxsKGIsZ3Vlc3MpO2lmKGNvbXBhcmVBYnMoY2hlY2sscGFydCk8PTApYnJlYWs7Z3Vlc3MtLX13aGlsZShndWVzcyk7cmVzdWx0LnB1c2goZ3Vlc3MpO3BhcnQ9c3VidHJhY3QocGFydCxjaGVjayl9cmVzdWx0LnJldmVyc2UoKTtyZXR1cm5bYXJyYXlUb1NtYWxsKHJlc3VsdCksYXJyYXlUb1NtYWxsKHBhcnQpXX1mdW5jdGlvbiBkaXZNb2RTbWFsbCh2YWx1ZSxsYW1iZGEpe3ZhciBsZW5ndGg9dmFsdWUubGVuZ3RoLHF1b3RpZW50PWNyZWF0ZUFycmF5KGxlbmd0aCksYmFzZT1CQVNFLGkscSxyZW1haW5kZXIsZGl2aXNvcjtyZW1haW5kZXI9MDtmb3IoaT1sZW5ndGgtMTtpPj0wOy0taSl7ZGl2aXNvcj1yZW1haW5kZXIqYmFzZSt2YWx1ZVtpXTtxPXRydW5jYXRlKGRpdmlzb3IvbGFtYmRhKTtyZW1haW5kZXI9ZGl2aXNvci1xKmxhbWJkYTtxdW90aWVudFtpXT1xfDB9cmV0dXJuW3F1b3RpZW50LHJlbWFpbmRlcnwwXX1mdW5jdGlvbiBkaXZNb2RBbnkoc2VsZix2KXt2YXIgdmFsdWUsbj1wYXJzZVZhbHVlKHYpO2lmKHN1cHBvcnRzTmF0aXZlQmlnSW50KXtyZXR1cm5bbmV3IE5hdGl2ZUJpZ0ludChzZWxmLnZhbHVlL24udmFsdWUpLG5ldyBOYXRpdmVCaWdJbnQoc2VsZi52YWx1ZSVuLnZhbHVlKV19dmFyIGE9c2VsZi52YWx1ZSxiPW4udmFsdWU7dmFyIHF1b3RpZW50O2lmKGI9PT0wKXRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkaXZpZGUgYnkgemVyb1wiKTtpZihzZWxmLmlzU21hbGwpe2lmKG4uaXNTbWFsbCl7cmV0dXJuW25ldyBTbWFsbEludGVnZXIodHJ1bmNhdGUoYS9iKSksbmV3IFNtYWxsSW50ZWdlcihhJWIpXX1yZXR1cm5bSW50ZWdlclswXSxzZWxmXX1pZihuLmlzU21hbGwpe2lmKGI9PT0xKXJldHVybltzZWxmLEludGVnZXJbMF1dO2lmKGI9PS0xKXJldHVybltzZWxmLm5lZ2F0ZSgpLEludGVnZXJbMF1dO3ZhciBhYnM9TWF0aC5hYnMoYik7aWYoYWJzPEJBU0Upe3ZhbHVlPWRpdk1vZFNtYWxsKGEsYWJzKTtxdW90aWVudD1hcnJheVRvU21hbGwodmFsdWVbMF0pO3ZhciByZW1haW5kZXI9dmFsdWVbMV07aWYoc2VsZi5zaWduKXJlbWFpbmRlcj0tcmVtYWluZGVyO2lmKHR5cGVvZiBxdW90aWVudD09PVwibnVtYmVyXCIpe2lmKHNlbGYuc2lnbiE9PW4uc2lnbilxdW90aWVudD0tcXVvdGllbnQ7cmV0dXJuW25ldyBTbWFsbEludGVnZXIocXVvdGllbnQpLG5ldyBTbWFsbEludGVnZXIocmVtYWluZGVyKV19cmV0dXJuW25ldyBCaWdJbnRlZ2VyKHF1b3RpZW50LHNlbGYuc2lnbiE9PW4uc2lnbiksbmV3IFNtYWxsSW50ZWdlcihyZW1haW5kZXIpXX1iPXNtYWxsVG9BcnJheShhYnMpfXZhciBjb21wYXJpc29uPWNvbXBhcmVBYnMoYSxiKTtpZihjb21wYXJpc29uPT09LTEpcmV0dXJuW0ludGVnZXJbMF0sc2VsZl07aWYoY29tcGFyaXNvbj09PTApcmV0dXJuW0ludGVnZXJbc2VsZi5zaWduPT09bi5zaWduPzE6LTFdLEludGVnZXJbMF1dO2lmKGEubGVuZ3RoK2IubGVuZ3RoPD0yMDApdmFsdWU9ZGl2TW9kMShhLGIpO2Vsc2UgdmFsdWU9ZGl2TW9kMihhLGIpO3F1b3RpZW50PXZhbHVlWzBdO3ZhciBxU2lnbj1zZWxmLnNpZ24hPT1uLnNpZ24sbW9kPXZhbHVlWzFdLG1TaWduPXNlbGYuc2lnbjtpZih0eXBlb2YgcXVvdGllbnQ9PT1cIm51bWJlclwiKXtpZihxU2lnbilxdW90aWVudD0tcXVvdGllbnQ7cXVvdGllbnQ9bmV3IFNtYWxsSW50ZWdlcihxdW90aWVudCl9ZWxzZSBxdW90aWVudD1uZXcgQmlnSW50ZWdlcihxdW90aWVudCxxU2lnbik7aWYodHlwZW9mIG1vZD09PVwibnVtYmVyXCIpe2lmKG1TaWduKW1vZD0tbW9kO21vZD1uZXcgU21hbGxJbnRlZ2VyKG1vZCl9ZWxzZSBtb2Q9bmV3IEJpZ0ludGVnZXIobW9kLG1TaWduKTtyZXR1cm5bcXVvdGllbnQsbW9kXX1CaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZtb2Q9ZnVuY3Rpb24odil7dmFyIHJlc3VsdD1kaXZNb2RBbnkodGhpcyx2KTtyZXR1cm57cXVvdGllbnQ6cmVzdWx0WzBdLHJlbWFpbmRlcjpyZXN1bHRbMV19fTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLmRpdm1vZD1TbWFsbEludGVnZXIucHJvdG90eXBlLmRpdm1vZD1CaWdJbnRlZ2VyLnByb3RvdHlwZS5kaXZtb2Q7QmlnSW50ZWdlci5wcm90b3R5cGUuZGl2aWRlPWZ1bmN0aW9uKHYpe3JldHVybiBkaXZNb2RBbnkodGhpcyx2KVswXX07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5vdmVyPU5hdGl2ZUJpZ0ludC5wcm90b3R5cGUuZGl2aWRlPWZ1bmN0aW9uKHYpe3JldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWUvcGFyc2VWYWx1ZSh2KS52YWx1ZSl9O1NtYWxsSW50ZWdlci5wcm90b3R5cGUub3Zlcj1TbWFsbEludGVnZXIucHJvdG90eXBlLmRpdmlkZT1CaWdJbnRlZ2VyLnByb3RvdHlwZS5vdmVyPUJpZ0ludGVnZXIucHJvdG90eXBlLmRpdmlkZTtCaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2Q9ZnVuY3Rpb24odil7cmV0dXJuIGRpdk1vZEFueSh0aGlzLHYpWzFdfTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLm1vZD1OYXRpdmVCaWdJbnQucHJvdG90eXBlLnJlbWFpbmRlcj1mdW5jdGlvbih2KXtyZXR1cm4gbmV3IE5hdGl2ZUJpZ0ludCh0aGlzLnZhbHVlJXBhcnNlVmFsdWUodikudmFsdWUpfTtTbWFsbEludGVnZXIucHJvdG90eXBlLnJlbWFpbmRlcj1TbWFsbEludGVnZXIucHJvdG90eXBlLm1vZD1CaWdJbnRlZ2VyLnByb3RvdHlwZS5yZW1haW5kZXI9QmlnSW50ZWdlci5wcm90b3R5cGUubW9kO0JpZ0ludGVnZXIucHJvdG90eXBlLnBvdz1mdW5jdGlvbih2KXt2YXIgbj1wYXJzZVZhbHVlKHYpLGE9dGhpcy52YWx1ZSxiPW4udmFsdWUsdmFsdWUseCx5O2lmKGI9PT0wKXJldHVybiBJbnRlZ2VyWzFdO2lmKGE9PT0wKXJldHVybiBJbnRlZ2VyWzBdO2lmKGE9PT0xKXJldHVybiBJbnRlZ2VyWzFdO2lmKGE9PT0tMSlyZXR1cm4gbi5pc0V2ZW4oKT9JbnRlZ2VyWzFdOkludGVnZXJbLTFdO2lmKG4uc2lnbil7cmV0dXJuIEludGVnZXJbMF19aWYoIW4uaXNTbWFsbCl0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZXhwb25lbnQgXCIrbi50b1N0cmluZygpK1wiIGlzIHRvbyBsYXJnZS5cIik7aWYodGhpcy5pc1NtYWxsKXtpZihpc1ByZWNpc2UodmFsdWU9TWF0aC5wb3coYSxiKSkpcmV0dXJuIG5ldyBTbWFsbEludGVnZXIodHJ1bmNhdGUodmFsdWUpKX14PXRoaXM7eT1JbnRlZ2VyWzFdO3doaWxlKHRydWUpe2lmKGImMT09PTEpe3k9eS50aW1lcyh4KTstLWJ9aWYoYj09PTApYnJlYWs7Yi89Mjt4PXguc3F1YXJlKCl9cmV0dXJuIHl9O1NtYWxsSW50ZWdlci5wcm90b3R5cGUucG93PUJpZ0ludGVnZXIucHJvdG90eXBlLnBvdztOYXRpdmVCaWdJbnQucHJvdG90eXBlLnBvdz1mdW5jdGlvbih2KXt2YXIgbj1wYXJzZVZhbHVlKHYpO3ZhciBhPXRoaXMudmFsdWUsYj1uLnZhbHVlO3ZhciBfMD1CaWdJbnQoMCksXzE9QmlnSW50KDEpLF8yPUJpZ0ludCgyKTtpZihiPT09XzApcmV0dXJuIEludGVnZXJbMV07aWYoYT09PV8wKXJldHVybiBJbnRlZ2VyWzBdO2lmKGE9PT1fMSlyZXR1cm4gSW50ZWdlclsxXTtpZihhPT09QmlnSW50KC0xKSlyZXR1cm4gbi5pc0V2ZW4oKT9JbnRlZ2VyWzFdOkludGVnZXJbLTFdO2lmKG4uaXNOZWdhdGl2ZSgpKXJldHVybiBuZXcgTmF0aXZlQmlnSW50KF8wKTt2YXIgeD10aGlzO3ZhciB5PUludGVnZXJbMV07d2hpbGUodHJ1ZSl7aWYoKGImXzEpPT09XzEpe3k9eS50aW1lcyh4KTstLWJ9aWYoYj09PV8wKWJyZWFrO2IvPV8yO3g9eC5zcXVhcmUoKX1yZXR1cm4geX07QmlnSW50ZWdlci5wcm90b3R5cGUubW9kUG93PWZ1bmN0aW9uKGV4cCxtb2Qpe2V4cD1wYXJzZVZhbHVlKGV4cCk7bW9kPXBhcnNlVmFsdWUobW9kKTtpZihtb2QuaXNaZXJvKCkpdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHRha2UgbW9kUG93IHdpdGggbW9kdWx1cyAwXCIpO3ZhciByPUludGVnZXJbMV0sYmFzZT10aGlzLm1vZChtb2QpO3doaWxlKGV4cC5pc1Bvc2l0aXZlKCkpe2lmKGJhc2UuaXNaZXJvKCkpcmV0dXJuIEludGVnZXJbMF07aWYoZXhwLmlzT2RkKCkpcj1yLm11bHRpcGx5KGJhc2UpLm1vZChtb2QpO2V4cD1leHAuZGl2aWRlKDIpO2Jhc2U9YmFzZS5zcXVhcmUoKS5tb2QobW9kKX1yZXR1cm4gcn07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5tb2RQb3c9U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5tb2RQb3c9QmlnSW50ZWdlci5wcm90b3R5cGUubW9kUG93O2Z1bmN0aW9uIGNvbXBhcmVBYnMoYSxiKXtpZihhLmxlbmd0aCE9PWIubGVuZ3RoKXtyZXR1cm4gYS5sZW5ndGg+Yi5sZW5ndGg/MTotMX1mb3IodmFyIGk9YS5sZW5ndGgtMTtpPj0wO2ktLSl7aWYoYVtpXSE9PWJbaV0pcmV0dXJuIGFbaV0+YltpXT8xOi0xfXJldHVybiAwfUJpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmVBYnM9ZnVuY3Rpb24odil7dmFyIG49cGFyc2VWYWx1ZSh2KSxhPXRoaXMudmFsdWUsYj1uLnZhbHVlO2lmKG4uaXNTbWFsbClyZXR1cm4gMTtyZXR1cm4gY29tcGFyZUFicyhhLGIpfTtTbWFsbEludGVnZXIucHJvdG90eXBlLmNvbXBhcmVBYnM9ZnVuY3Rpb24odil7dmFyIG49cGFyc2VWYWx1ZSh2KSxhPU1hdGguYWJzKHRoaXMudmFsdWUpLGI9bi52YWx1ZTtpZihuLmlzU21hbGwpe2I9TWF0aC5hYnMoYik7cmV0dXJuIGE9PT1iPzA6YT5iPzE6LTF9cmV0dXJuLTF9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUuY29tcGFyZUFicz1mdW5jdGlvbih2KXt2YXIgYT10aGlzLnZhbHVlO3ZhciBiPXBhcnNlVmFsdWUodikudmFsdWU7YT1hPj0wP2E6LWE7Yj1iPj0wP2I6LWI7cmV0dXJuIGE9PT1iPzA6YT5iPzE6LTF9O0JpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmU9ZnVuY3Rpb24odil7aWYodj09PUluZmluaXR5KXtyZXR1cm4tMX1pZih2PT09LUluZmluaXR5KXtyZXR1cm4gMX12YXIgbj1wYXJzZVZhbHVlKHYpLGE9dGhpcy52YWx1ZSxiPW4udmFsdWU7aWYodGhpcy5zaWduIT09bi5zaWduKXtyZXR1cm4gbi5zaWduPzE6LTF9aWYobi5pc1NtYWxsKXtyZXR1cm4gdGhpcy5zaWduPy0xOjF9cmV0dXJuIGNvbXBhcmVBYnMoYSxiKSoodGhpcy5zaWduPy0xOjEpfTtCaWdJbnRlZ2VyLnByb3RvdHlwZS5jb21wYXJlVG89QmlnSW50ZWdlci5wcm90b3R5cGUuY29tcGFyZTtTbWFsbEludGVnZXIucHJvdG90eXBlLmNvbXBhcmU9ZnVuY3Rpb24odil7aWYodj09PUluZmluaXR5KXtyZXR1cm4tMX1pZih2PT09LUluZmluaXR5KXtyZXR1cm4gMX12YXIgbj1wYXJzZVZhbHVlKHYpLGE9dGhpcy52YWx1ZSxiPW4udmFsdWU7aWYobi5pc1NtYWxsKXtyZXR1cm4gYT09Yj8wOmE+Yj8xOi0xfWlmKGE8MCE9PW4uc2lnbil7cmV0dXJuIGE8MD8tMToxfXJldHVybiBhPDA/MTotMX07U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5jb21wYXJlVG89U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5jb21wYXJlO05hdGl2ZUJpZ0ludC5wcm90b3R5cGUuY29tcGFyZT1mdW5jdGlvbih2KXtpZih2PT09SW5maW5pdHkpe3JldHVybi0xfWlmKHY9PT0tSW5maW5pdHkpe3JldHVybiAxfXZhciBhPXRoaXMudmFsdWU7dmFyIGI9cGFyc2VWYWx1ZSh2KS52YWx1ZTtyZXR1cm4gYT09PWI/MDphPmI/MTotMX07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5jb21wYXJlVG89TmF0aXZlQmlnSW50LnByb3RvdHlwZS5jb21wYXJlO0JpZ0ludGVnZXIucHJvdG90eXBlLmVxdWFscz1mdW5jdGlvbih2KXtyZXR1cm4gdGhpcy5jb21wYXJlKHYpPT09MH07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5lcT1OYXRpdmVCaWdJbnQucHJvdG90eXBlLmVxdWFscz1TbWFsbEludGVnZXIucHJvdG90eXBlLmVxPVNtYWxsSW50ZWdlci5wcm90b3R5cGUuZXF1YWxzPUJpZ0ludGVnZXIucHJvdG90eXBlLmVxPUJpZ0ludGVnZXIucHJvdG90eXBlLmVxdWFscztCaWdJbnRlZ2VyLnByb3RvdHlwZS5ub3RFcXVhbHM9ZnVuY3Rpb24odil7cmV0dXJuIHRoaXMuY29tcGFyZSh2KSE9PTB9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUubmVxPU5hdGl2ZUJpZ0ludC5wcm90b3R5cGUubm90RXF1YWxzPVNtYWxsSW50ZWdlci5wcm90b3R5cGUubmVxPVNtYWxsSW50ZWdlci5wcm90b3R5cGUubm90RXF1YWxzPUJpZ0ludGVnZXIucHJvdG90eXBlLm5lcT1CaWdJbnRlZ2VyLnByb3RvdHlwZS5ub3RFcXVhbHM7QmlnSW50ZWdlci5wcm90b3R5cGUuZ3JlYXRlcj1mdW5jdGlvbih2KXtyZXR1cm4gdGhpcy5jb21wYXJlKHYpPjB9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUuZ3Q9TmF0aXZlQmlnSW50LnByb3RvdHlwZS5ncmVhdGVyPVNtYWxsSW50ZWdlci5wcm90b3R5cGUuZ3Q9U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5ncmVhdGVyPUJpZ0ludGVnZXIucHJvdG90eXBlLmd0PUJpZ0ludGVnZXIucHJvdG90eXBlLmdyZWF0ZXI7QmlnSW50ZWdlci5wcm90b3R5cGUubGVzc2VyPWZ1bmN0aW9uKHYpe3JldHVybiB0aGlzLmNvbXBhcmUodik8MH07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5sdD1OYXRpdmVCaWdJbnQucHJvdG90eXBlLmxlc3Nlcj1TbWFsbEludGVnZXIucHJvdG90eXBlLmx0PVNtYWxsSW50ZWdlci5wcm90b3R5cGUubGVzc2VyPUJpZ0ludGVnZXIucHJvdG90eXBlLmx0PUJpZ0ludGVnZXIucHJvdG90eXBlLmxlc3NlcjtCaWdJbnRlZ2VyLnByb3RvdHlwZS5ncmVhdGVyT3JFcXVhbHM9ZnVuY3Rpb24odil7cmV0dXJuIHRoaXMuY29tcGFyZSh2KT49MH07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5nZXE9TmF0aXZlQmlnSW50LnByb3RvdHlwZS5ncmVhdGVyT3JFcXVhbHM9U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5nZXE9U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5ncmVhdGVyT3JFcXVhbHM9QmlnSW50ZWdlci5wcm90b3R5cGUuZ2VxPUJpZ0ludGVnZXIucHJvdG90eXBlLmdyZWF0ZXJPckVxdWFscztCaWdJbnRlZ2VyLnByb3RvdHlwZS5sZXNzZXJPckVxdWFscz1mdW5jdGlvbih2KXtyZXR1cm4gdGhpcy5jb21wYXJlKHYpPD0wfTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLmxlcT1OYXRpdmVCaWdJbnQucHJvdG90eXBlLmxlc3Nlck9yRXF1YWxzPVNtYWxsSW50ZWdlci5wcm90b3R5cGUubGVxPVNtYWxsSW50ZWdlci5wcm90b3R5cGUubGVzc2VyT3JFcXVhbHM9QmlnSW50ZWdlci5wcm90b3R5cGUubGVxPUJpZ0ludGVnZXIucHJvdG90eXBlLmxlc3Nlck9yRXF1YWxzO0JpZ0ludGVnZXIucHJvdG90eXBlLmlzRXZlbj1mdW5jdGlvbigpe3JldHVybih0aGlzLnZhbHVlWzBdJjEpPT09MH07U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5pc0V2ZW49ZnVuY3Rpb24oKXtyZXR1cm4odGhpcy52YWx1ZSYxKT09PTB9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUuaXNFdmVuPWZ1bmN0aW9uKCl7cmV0dXJuKHRoaXMudmFsdWUmQmlnSW50KDEpKT09PUJpZ0ludCgwKX07QmlnSW50ZWdlci5wcm90b3R5cGUuaXNPZGQ9ZnVuY3Rpb24oKXtyZXR1cm4odGhpcy52YWx1ZVswXSYxKT09PTF9O1NtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNPZGQ9ZnVuY3Rpb24oKXtyZXR1cm4odGhpcy52YWx1ZSYxKT09PTF9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUuaXNPZGQ9ZnVuY3Rpb24oKXtyZXR1cm4odGhpcy52YWx1ZSZCaWdJbnQoMSkpPT09QmlnSW50KDEpfTtCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc1Bvc2l0aXZlPWZ1bmN0aW9uKCl7cmV0dXJuIXRoaXMuc2lnbn07U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5pc1Bvc2l0aXZlPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudmFsdWU+MH07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5pc1Bvc2l0aXZlPVNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNQb3NpdGl2ZTtCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc05lZ2F0aXZlPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuc2lnbn07U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5pc05lZ2F0aXZlPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudmFsdWU8MH07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5pc05lZ2F0aXZlPVNtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNOZWdhdGl2ZTtCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc1VuaXQ9ZnVuY3Rpb24oKXtyZXR1cm4gZmFsc2V9O1NtYWxsSW50ZWdlci5wcm90b3R5cGUuaXNVbml0PWZ1bmN0aW9uKCl7cmV0dXJuIE1hdGguYWJzKHRoaXMudmFsdWUpPT09MX07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5pc1VuaXQ9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5hYnMoKS52YWx1ZT09PUJpZ0ludCgxKX07QmlnSW50ZWdlci5wcm90b3R5cGUuaXNaZXJvPWZ1bmN0aW9uKCl7cmV0dXJuIGZhbHNlfTtTbWFsbEludGVnZXIucHJvdG90eXBlLmlzWmVybz1mdW5jdGlvbigpe3JldHVybiB0aGlzLnZhbHVlPT09MH07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5pc1plcm89ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy52YWx1ZT09PUJpZ0ludCgwKX07QmlnSW50ZWdlci5wcm90b3R5cGUuaXNEaXZpc2libGVCeT1mdW5jdGlvbih2KXt2YXIgbj1wYXJzZVZhbHVlKHYpO2lmKG4uaXNaZXJvKCkpcmV0dXJuIGZhbHNlO2lmKG4uaXNVbml0KCkpcmV0dXJuIHRydWU7aWYobi5jb21wYXJlQWJzKDIpPT09MClyZXR1cm4gdGhpcy5pc0V2ZW4oKTtyZXR1cm4gdGhpcy5tb2QobikuaXNaZXJvKCl9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUuaXNEaXZpc2libGVCeT1TbWFsbEludGVnZXIucHJvdG90eXBlLmlzRGl2aXNpYmxlQnk9QmlnSW50ZWdlci5wcm90b3R5cGUuaXNEaXZpc2libGVCeTtmdW5jdGlvbiBpc0Jhc2ljUHJpbWUodil7dmFyIG49di5hYnMoKTtpZihuLmlzVW5pdCgpKXJldHVybiBmYWxzZTtpZihuLmVxdWFscygyKXx8bi5lcXVhbHMoMyl8fG4uZXF1YWxzKDUpKXJldHVybiB0cnVlO2lmKG4uaXNFdmVuKCl8fG4uaXNEaXZpc2libGVCeSgzKXx8bi5pc0RpdmlzaWJsZUJ5KDUpKXJldHVybiBmYWxzZTtpZihuLmxlc3Nlcig0OSkpcmV0dXJuIHRydWV9ZnVuY3Rpb24gbWlsbGVyUmFiaW5UZXN0KG4sYSl7dmFyIG5QcmV2PW4ucHJldigpLGI9blByZXYscj0wLGQsdCxpLHg7d2hpbGUoYi5pc0V2ZW4oKSliPWIuZGl2aWRlKDIpLHIrKztuZXh0OmZvcihpPTA7aTxhLmxlbmd0aDtpKyspe2lmKG4ubGVzc2VyKGFbaV0pKWNvbnRpbnVlO3g9YmlnSW50KGFbaV0pLm1vZFBvdyhiLG4pO2lmKHguaXNVbml0KCl8fHguZXF1YWxzKG5QcmV2KSljb250aW51ZTtmb3IoZD1yLTE7ZCE9MDtkLS0pe3g9eC5zcXVhcmUoKS5tb2Qobik7aWYoeC5pc1VuaXQoKSlyZXR1cm4gZmFsc2U7aWYoeC5lcXVhbHMoblByZXYpKWNvbnRpbnVlIG5leHR9cmV0dXJuIGZhbHNlfXJldHVybiB0cnVlfUJpZ0ludGVnZXIucHJvdG90eXBlLmlzUHJpbWU9ZnVuY3Rpb24oc3RyaWN0KXt2YXIgaXNQcmltZT1pc0Jhc2ljUHJpbWUodGhpcyk7aWYoaXNQcmltZSE9PXVuZGVmaW5lZClyZXR1cm4gaXNQcmltZTt2YXIgbj10aGlzLmFicygpO3ZhciBiaXRzPW4uYml0TGVuZ3RoKCk7aWYoYml0czw9NjQpcmV0dXJuIG1pbGxlclJhYmluVGVzdChuLFsyLDMsNSw3LDExLDEzLDE3LDE5LDIzLDI5LDMxLDM3XSk7dmFyIGxvZ049TWF0aC5sb2coMikqYml0cy50b0pTTnVtYmVyKCk7dmFyIHQ9TWF0aC5jZWlsKHN0cmljdD09PXRydWU/MipNYXRoLnBvdyhsb2dOLDIpOmxvZ04pO2Zvcih2YXIgYT1bXSxpPTA7aTx0O2krKyl7YS5wdXNoKGJpZ0ludChpKzIpKX1yZXR1cm4gbWlsbGVyUmFiaW5UZXN0KG4sYSl9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUuaXNQcmltZT1TbWFsbEludGVnZXIucHJvdG90eXBlLmlzUHJpbWU9QmlnSW50ZWdlci5wcm90b3R5cGUuaXNQcmltZTtCaWdJbnRlZ2VyLnByb3RvdHlwZS5pc1Byb2JhYmxlUHJpbWU9ZnVuY3Rpb24oaXRlcmF0aW9ucyl7dmFyIGlzUHJpbWU9aXNCYXNpY1ByaW1lKHRoaXMpO2lmKGlzUHJpbWUhPT11bmRlZmluZWQpcmV0dXJuIGlzUHJpbWU7dmFyIG49dGhpcy5hYnMoKTt2YXIgdD1pdGVyYXRpb25zPT09dW5kZWZpbmVkPzU6aXRlcmF0aW9ucztmb3IodmFyIGE9W10saT0wO2k8dDtpKyspe2EucHVzaChiaWdJbnQucmFuZEJldHdlZW4oMixuLm1pbnVzKDIpKSl9cmV0dXJuIG1pbGxlclJhYmluVGVzdChuLGEpfTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLmlzUHJvYmFibGVQcmltZT1TbWFsbEludGVnZXIucHJvdG90eXBlLmlzUHJvYmFibGVQcmltZT1CaWdJbnRlZ2VyLnByb3RvdHlwZS5pc1Byb2JhYmxlUHJpbWU7QmlnSW50ZWdlci5wcm90b3R5cGUubW9kSW52PWZ1bmN0aW9uKG4pe3ZhciB0PWJpZ0ludC56ZXJvLG5ld1Q9YmlnSW50Lm9uZSxyPXBhcnNlVmFsdWUobiksbmV3Uj10aGlzLmFicygpLHEsbGFzdFQsbGFzdFI7d2hpbGUoIW5ld1IuaXNaZXJvKCkpe3E9ci5kaXZpZGUobmV3Uik7bGFzdFQ9dDtsYXN0Uj1yO3Q9bmV3VDtyPW5ld1I7bmV3VD1sYXN0VC5zdWJ0cmFjdChxLm11bHRpcGx5KG5ld1QpKTtuZXdSPWxhc3RSLnN1YnRyYWN0KHEubXVsdGlwbHkobmV3UikpfWlmKCFyLmlzVW5pdCgpKXRocm93IG5ldyBFcnJvcih0aGlzLnRvU3RyaW5nKCkrXCIgYW5kIFwiK24udG9TdHJpbmcoKStcIiBhcmUgbm90IGNvLXByaW1lXCIpO2lmKHQuY29tcGFyZSgwKT09PS0xKXt0PXQuYWRkKG4pfWlmKHRoaXMuaXNOZWdhdGl2ZSgpKXtyZXR1cm4gdC5uZWdhdGUoKX1yZXR1cm4gdH07TmF0aXZlQmlnSW50LnByb3RvdHlwZS5tb2RJbnY9U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5tb2RJbnY9QmlnSW50ZWdlci5wcm90b3R5cGUubW9kSW52O0JpZ0ludGVnZXIucHJvdG90eXBlLm5leHQ9ZnVuY3Rpb24oKXt2YXIgdmFsdWU9dGhpcy52YWx1ZTtpZih0aGlzLnNpZ24pe3JldHVybiBzdWJ0cmFjdFNtYWxsKHZhbHVlLDEsdGhpcy5zaWduKX1yZXR1cm4gbmV3IEJpZ0ludGVnZXIoYWRkU21hbGwodmFsdWUsMSksdGhpcy5zaWduKX07U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5uZXh0PWZ1bmN0aW9uKCl7dmFyIHZhbHVlPXRoaXMudmFsdWU7aWYodmFsdWUrMTxNQVhfSU5UKXJldHVybiBuZXcgU21hbGxJbnRlZ2VyKHZhbHVlKzEpO3JldHVybiBuZXcgQmlnSW50ZWdlcihNQVhfSU5UX0FSUixmYWxzZSl9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUubmV4dD1mdW5jdGlvbigpe3JldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWUrQmlnSW50KDEpKX07QmlnSW50ZWdlci5wcm90b3R5cGUucHJldj1mdW5jdGlvbigpe3ZhciB2YWx1ZT10aGlzLnZhbHVlO2lmKHRoaXMuc2lnbil7cmV0dXJuIG5ldyBCaWdJbnRlZ2VyKGFkZFNtYWxsKHZhbHVlLDEpLHRydWUpfXJldHVybiBzdWJ0cmFjdFNtYWxsKHZhbHVlLDEsdGhpcy5zaWduKX07U21hbGxJbnRlZ2VyLnByb3RvdHlwZS5wcmV2PWZ1bmN0aW9uKCl7dmFyIHZhbHVlPXRoaXMudmFsdWU7aWYodmFsdWUtMT4tTUFYX0lOVClyZXR1cm4gbmV3IFNtYWxsSW50ZWdlcih2YWx1ZS0xKTtyZXR1cm4gbmV3IEJpZ0ludGVnZXIoTUFYX0lOVF9BUlIsdHJ1ZSl9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUucHJldj1mdW5jdGlvbigpe3JldHVybiBuZXcgTmF0aXZlQmlnSW50KHRoaXMudmFsdWUtQmlnSW50KDEpKX07dmFyIHBvd2Vyc09mVHdvPVsxXTt3aGlsZSgyKnBvd2Vyc09mVHdvW3Bvd2Vyc09mVHdvLmxlbmd0aC0xXTw9QkFTRSlwb3dlcnNPZlR3by5wdXNoKDIqcG93ZXJzT2ZUd29bcG93ZXJzT2ZUd28ubGVuZ3RoLTFdKTt2YXIgcG93ZXJzMkxlbmd0aD1wb3dlcnNPZlR3by5sZW5ndGgsaGlnaGVzdFBvd2VyMj1wb3dlcnNPZlR3b1twb3dlcnMyTGVuZ3RoLTFdO2Z1bmN0aW9uIHNoaWZ0X2lzU21hbGwobil7cmV0dXJuIE1hdGguYWJzKG4pPD1CQVNFfUJpZ0ludGVnZXIucHJvdG90eXBlLnNoaWZ0TGVmdD1mdW5jdGlvbih2KXt2YXIgbj1wYXJzZVZhbHVlKHYpLnRvSlNOdW1iZXIoKTtpZighc2hpZnRfaXNTbWFsbChuKSl7dGhyb3cgbmV3IEVycm9yKFN0cmluZyhuKStcIiBpcyB0b28gbGFyZ2UgZm9yIHNoaWZ0aW5nLlwiKX1pZihuPDApcmV0dXJuIHRoaXMuc2hpZnRSaWdodCgtbik7dmFyIHJlc3VsdD10aGlzO2lmKHJlc3VsdC5pc1plcm8oKSlyZXR1cm4gcmVzdWx0O3doaWxlKG4+PXBvd2VyczJMZW5ndGgpe3Jlc3VsdD1yZXN1bHQubXVsdGlwbHkoaGlnaGVzdFBvd2VyMik7bi09cG93ZXJzMkxlbmd0aC0xfXJldHVybiByZXN1bHQubXVsdGlwbHkocG93ZXJzT2ZUd29bbl0pfTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLnNoaWZ0TGVmdD1TbWFsbEludGVnZXIucHJvdG90eXBlLnNoaWZ0TGVmdD1CaWdJbnRlZ2VyLnByb3RvdHlwZS5zaGlmdExlZnQ7QmlnSW50ZWdlci5wcm90b3R5cGUuc2hpZnRSaWdodD1mdW5jdGlvbih2KXt2YXIgcmVtUXVvO3ZhciBuPXBhcnNlVmFsdWUodikudG9KU051bWJlcigpO2lmKCFzaGlmdF9pc1NtYWxsKG4pKXt0aHJvdyBuZXcgRXJyb3IoU3RyaW5nKG4pK1wiIGlzIHRvbyBsYXJnZSBmb3Igc2hpZnRpbmcuXCIpfWlmKG48MClyZXR1cm4gdGhpcy5zaGlmdExlZnQoLW4pO3ZhciByZXN1bHQ9dGhpczt3aGlsZShuPj1wb3dlcnMyTGVuZ3RoKXtpZihyZXN1bHQuaXNaZXJvKCl8fHJlc3VsdC5pc05lZ2F0aXZlKCkmJnJlc3VsdC5pc1VuaXQoKSlyZXR1cm4gcmVzdWx0O3JlbVF1bz1kaXZNb2RBbnkocmVzdWx0LGhpZ2hlc3RQb3dlcjIpO3Jlc3VsdD1yZW1RdW9bMV0uaXNOZWdhdGl2ZSgpP3JlbVF1b1swXS5wcmV2KCk6cmVtUXVvWzBdO24tPXBvd2VyczJMZW5ndGgtMX1yZW1RdW89ZGl2TW9kQW55KHJlc3VsdCxwb3dlcnNPZlR3b1tuXSk7cmV0dXJuIHJlbVF1b1sxXS5pc05lZ2F0aXZlKCk/cmVtUXVvWzBdLnByZXYoKTpyZW1RdW9bMF19O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUuc2hpZnRSaWdodD1TbWFsbEludGVnZXIucHJvdG90eXBlLnNoaWZ0UmlnaHQ9QmlnSW50ZWdlci5wcm90b3R5cGUuc2hpZnRSaWdodDtmdW5jdGlvbiBiaXR3aXNlKHgseSxmbil7eT1wYXJzZVZhbHVlKHkpO3ZhciB4U2lnbj14LmlzTmVnYXRpdmUoKSx5U2lnbj15LmlzTmVnYXRpdmUoKTt2YXIgeFJlbT14U2lnbj94Lm5vdCgpOngseVJlbT15U2lnbj95Lm5vdCgpOnk7dmFyIHhEaWdpdD0wLHlEaWdpdD0wO3ZhciB4RGl2TW9kPW51bGwseURpdk1vZD1udWxsO3ZhciByZXN1bHQ9W107d2hpbGUoIXhSZW0uaXNaZXJvKCl8fCF5UmVtLmlzWmVybygpKXt4RGl2TW9kPWRpdk1vZEFueSh4UmVtLGhpZ2hlc3RQb3dlcjIpO3hEaWdpdD14RGl2TW9kWzFdLnRvSlNOdW1iZXIoKTtpZih4U2lnbil7eERpZ2l0PWhpZ2hlc3RQb3dlcjItMS14RGlnaXR9eURpdk1vZD1kaXZNb2RBbnkoeVJlbSxoaWdoZXN0UG93ZXIyKTt5RGlnaXQ9eURpdk1vZFsxXS50b0pTTnVtYmVyKCk7aWYoeVNpZ24pe3lEaWdpdD1oaWdoZXN0UG93ZXIyLTEteURpZ2l0fXhSZW09eERpdk1vZFswXTt5UmVtPXlEaXZNb2RbMF07cmVzdWx0LnB1c2goZm4oeERpZ2l0LHlEaWdpdCkpfXZhciBzdW09Zm4oeFNpZ24/MTowLHlTaWduPzE6MCkhPT0wP2JpZ0ludCgtMSk6YmlnSW50KDApO2Zvcih2YXIgaT1yZXN1bHQubGVuZ3RoLTE7aT49MDtpLT0xKXtzdW09c3VtLm11bHRpcGx5KGhpZ2hlc3RQb3dlcjIpLmFkZChiaWdJbnQocmVzdWx0W2ldKSl9cmV0dXJuIHN1bX1CaWdJbnRlZ2VyLnByb3RvdHlwZS5ub3Q9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5uZWdhdGUoKS5wcmV2KCl9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUubm90PVNtYWxsSW50ZWdlci5wcm90b3R5cGUubm90PUJpZ0ludGVnZXIucHJvdG90eXBlLm5vdDtCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbmQ9ZnVuY3Rpb24obil7cmV0dXJuIGJpdHdpc2UodGhpcyxuLGZ1bmN0aW9uKGEsYil7cmV0dXJuIGEmYn0pfTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLmFuZD1TbWFsbEludGVnZXIucHJvdG90eXBlLmFuZD1CaWdJbnRlZ2VyLnByb3RvdHlwZS5hbmQ7QmlnSW50ZWdlci5wcm90b3R5cGUub3I9ZnVuY3Rpb24obil7cmV0dXJuIGJpdHdpc2UodGhpcyxuLGZ1bmN0aW9uKGEsYil7cmV0dXJuIGF8Yn0pfTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLm9yPVNtYWxsSW50ZWdlci5wcm90b3R5cGUub3I9QmlnSW50ZWdlci5wcm90b3R5cGUub3I7QmlnSW50ZWdlci5wcm90b3R5cGUueG9yPWZ1bmN0aW9uKG4pe3JldHVybiBiaXR3aXNlKHRoaXMsbixmdW5jdGlvbihhLGIpe3JldHVybiBhXmJ9KX07TmF0aXZlQmlnSW50LnByb3RvdHlwZS54b3I9U21hbGxJbnRlZ2VyLnByb3RvdHlwZS54b3I9QmlnSW50ZWdlci5wcm90b3R5cGUueG9yO3ZhciBMT0JNQVNLX0k9MTw8MzAsTE9CTUFTS19CST0oQkFTRSYtQkFTRSkqKEJBU0UmLUJBU0UpfExPQk1BU0tfSTtmdW5jdGlvbiByb3VnaExPQihuKXt2YXIgdj1uLnZhbHVlLHg9dHlwZW9mIHY9PT1cIm51bWJlclwiP3Z8TE9CTUFTS19JOnR5cGVvZiB2PT09XCJiaWdpbnRcIj92fEJpZ0ludChMT0JNQVNLX0kpOnZbMF0rdlsxXSpCQVNFfExPQk1BU0tfQkk7cmV0dXJuIHgmLXh9ZnVuY3Rpb24gaW50ZWdlckxvZ2FyaXRobSh2YWx1ZSxiYXNlKXtpZihiYXNlLmNvbXBhcmVUbyh2YWx1ZSk8PTApe3ZhciB0bXA9aW50ZWdlckxvZ2FyaXRobSh2YWx1ZSxiYXNlLnNxdWFyZShiYXNlKSk7dmFyIHA9dG1wLnA7dmFyIGU9dG1wLmU7dmFyIHQ9cC5tdWx0aXBseShiYXNlKTtyZXR1cm4gdC5jb21wYXJlVG8odmFsdWUpPD0wP3twOnQsZTplKjIrMX06e3A6cCxlOmUqMn19cmV0dXJue3A6YmlnSW50KDEpLGU6MH19QmlnSW50ZWdlci5wcm90b3R5cGUuYml0TGVuZ3RoPWZ1bmN0aW9uKCl7dmFyIG49dGhpcztpZihuLmNvbXBhcmVUbyhiaWdJbnQoMCkpPDApe249bi5uZWdhdGUoKS5zdWJ0cmFjdChiaWdJbnQoMSkpfWlmKG4uY29tcGFyZVRvKGJpZ0ludCgwKSk9PT0wKXtyZXR1cm4gYmlnSW50KDApfXJldHVybiBiaWdJbnQoaW50ZWdlckxvZ2FyaXRobShuLGJpZ0ludCgyKSkuZSkuYWRkKGJpZ0ludCgxKSl9O05hdGl2ZUJpZ0ludC5wcm90b3R5cGUuYml0TGVuZ3RoPVNtYWxsSW50ZWdlci5wcm90b3R5cGUuYml0TGVuZ3RoPUJpZ0ludGVnZXIucHJvdG90eXBlLmJpdExlbmd0aDtmdW5jdGlvbiBtYXgoYSxiKXthPXBhcnNlVmFsdWUoYSk7Yj1wYXJzZVZhbHVlKGIpO3JldHVybiBhLmdyZWF0ZXIoYik/YTpifWZ1bmN0aW9uIG1pbihhLGIpe2E9cGFyc2VWYWx1ZShhKTtiPXBhcnNlVmFsdWUoYik7cmV0dXJuIGEubGVzc2VyKGIpP2E6Yn1mdW5jdGlvbiBnY2QoYSxiKXthPXBhcnNlVmFsdWUoYSkuYWJzKCk7Yj1wYXJzZVZhbHVlKGIpLmFicygpO2lmKGEuZXF1YWxzKGIpKXJldHVybiBhO2lmKGEuaXNaZXJvKCkpcmV0dXJuIGI7aWYoYi5pc1plcm8oKSlyZXR1cm4gYTt2YXIgYz1JbnRlZ2VyWzFdLGQsdDt3aGlsZShhLmlzRXZlbigpJiZiLmlzRXZlbigpKXtkPW1pbihyb3VnaExPQihhKSxyb3VnaExPQihiKSk7YT1hLmRpdmlkZShkKTtiPWIuZGl2aWRlKGQpO2M9Yy5tdWx0aXBseShkKX13aGlsZShhLmlzRXZlbigpKXthPWEuZGl2aWRlKHJvdWdoTE9CKGEpKX1kb3t3aGlsZShiLmlzRXZlbigpKXtiPWIuZGl2aWRlKHJvdWdoTE9CKGIpKX1pZihhLmdyZWF0ZXIoYikpe3Q9YjtiPWE7YT10fWI9Yi5zdWJ0cmFjdChhKX13aGlsZSghYi5pc1plcm8oKSk7cmV0dXJuIGMuaXNVbml0KCk/YTphLm11bHRpcGx5KGMpfWZ1bmN0aW9uIGxjbShhLGIpe2E9cGFyc2VWYWx1ZShhKS5hYnMoKTtiPXBhcnNlVmFsdWUoYikuYWJzKCk7cmV0dXJuIGEuZGl2aWRlKGdjZChhLGIpKS5tdWx0aXBseShiKX1mdW5jdGlvbiByYW5kQmV0d2VlbihhLGIpe2E9cGFyc2VWYWx1ZShhKTtiPXBhcnNlVmFsdWUoYik7dmFyIGxvdz1taW4oYSxiKSxoaWdoPW1heChhLGIpO3ZhciByYW5nZT1oaWdoLnN1YnRyYWN0KGxvdykuYWRkKDEpO2lmKHJhbmdlLmlzU21hbGwpcmV0dXJuIGxvdy5hZGQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKnJhbmdlKSk7dmFyIGRpZ2l0cz10b0Jhc2UocmFuZ2UsQkFTRSkudmFsdWU7dmFyIHJlc3VsdD1bXSxyZXN0cmljdGVkPXRydWU7Zm9yKHZhciBpPTA7aTxkaWdpdHMubGVuZ3RoO2krKyl7dmFyIHRvcD1yZXN0cmljdGVkP2RpZ2l0c1tpXTpCQVNFO3ZhciBkaWdpdD10cnVuY2F0ZShNYXRoLnJhbmRvbSgpKnRvcCk7cmVzdWx0LnB1c2goZGlnaXQpO2lmKGRpZ2l0PHRvcClyZXN0cmljdGVkPWZhbHNlfXJldHVybiBsb3cuYWRkKEludGVnZXIuZnJvbUFycmF5KHJlc3VsdCxCQVNFLGZhbHNlKSl9dmFyIHBhcnNlQmFzZT1mdW5jdGlvbih0ZXh0LGJhc2UsYWxwaGFiZXQsY2FzZVNlbnNpdGl2ZSl7YWxwaGFiZXQ9YWxwaGFiZXR8fERFRkFVTFRfQUxQSEFCRVQ7dGV4dD1TdHJpbmcodGV4dCk7aWYoIWNhc2VTZW5zaXRpdmUpe3RleHQ9dGV4dC50b0xvd2VyQ2FzZSgpO2FscGhhYmV0PWFscGhhYmV0LnRvTG93ZXJDYXNlKCl9dmFyIGxlbmd0aD10ZXh0Lmxlbmd0aDt2YXIgaTt2YXIgYWJzQmFzZT1NYXRoLmFicyhiYXNlKTt2YXIgYWxwaGFiZXRWYWx1ZXM9e307Zm9yKGk9MDtpPGFscGhhYmV0Lmxlbmd0aDtpKyspe2FscGhhYmV0VmFsdWVzW2FscGhhYmV0W2ldXT1pfWZvcihpPTA7aTxsZW5ndGg7aSsrKXt2YXIgYz10ZXh0W2ldO2lmKGM9PT1cIi1cIiljb250aW51ZTtpZihjIGluIGFscGhhYmV0VmFsdWVzKXtpZihhbHBoYWJldFZhbHVlc1tjXT49YWJzQmFzZSl7aWYoYz09PVwiMVwiJiZhYnNCYXNlPT09MSljb250aW51ZTt0aHJvdyBuZXcgRXJyb3IoYytcIiBpcyBub3QgYSB2YWxpZCBkaWdpdCBpbiBiYXNlIFwiK2Jhc2UrXCIuXCIpfX19YmFzZT1wYXJzZVZhbHVlKGJhc2UpO3ZhciBkaWdpdHM9W107dmFyIGlzTmVnYXRpdmU9dGV4dFswXT09PVwiLVwiO2ZvcihpPWlzTmVnYXRpdmU/MTowO2k8dGV4dC5sZW5ndGg7aSsrKXt2YXIgYz10ZXh0W2ldO2lmKGMgaW4gYWxwaGFiZXRWYWx1ZXMpZGlnaXRzLnB1c2gocGFyc2VWYWx1ZShhbHBoYWJldFZhbHVlc1tjXSkpO2Vsc2UgaWYoYz09PVwiPFwiKXt2YXIgc3RhcnQ9aTtkb3tpKyt9d2hpbGUodGV4dFtpXSE9PVwiPlwiJiZpPHRleHQubGVuZ3RoKTtkaWdpdHMucHVzaChwYXJzZVZhbHVlKHRleHQuc2xpY2Uoc3RhcnQrMSxpKSkpfWVsc2UgdGhyb3cgbmV3IEVycm9yKGMrXCIgaXMgbm90IGEgdmFsaWQgY2hhcmFjdGVyXCIpfXJldHVybiBwYXJzZUJhc2VGcm9tQXJyYXkoZGlnaXRzLGJhc2UsaXNOZWdhdGl2ZSl9O2Z1bmN0aW9uIHBhcnNlQmFzZUZyb21BcnJheShkaWdpdHMsYmFzZSxpc05lZ2F0aXZlKXt2YXIgdmFsPUludGVnZXJbMF0scG93PUludGVnZXJbMV0saTtmb3IoaT1kaWdpdHMubGVuZ3RoLTE7aT49MDtpLS0pe3ZhbD12YWwuYWRkKGRpZ2l0c1tpXS50aW1lcyhwb3cpKTtwb3c9cG93LnRpbWVzKGJhc2UpfXJldHVybiBpc05lZ2F0aXZlP3ZhbC5uZWdhdGUoKTp2YWx9ZnVuY3Rpb24gc3RyaW5naWZ5KGRpZ2l0LGFscGhhYmV0KXthbHBoYWJldD1hbHBoYWJldHx8REVGQVVMVF9BTFBIQUJFVDtpZihkaWdpdDxhbHBoYWJldC5sZW5ndGgpe3JldHVybiBhbHBoYWJldFtkaWdpdF19cmV0dXJuXCI8XCIrZGlnaXQrXCI+XCJ9ZnVuY3Rpb24gdG9CYXNlKG4sYmFzZSl7YmFzZT1iaWdJbnQoYmFzZSk7aWYoYmFzZS5pc1plcm8oKSl7aWYobi5pc1plcm8oKSlyZXR1cm57dmFsdWU6WzBdLGlzTmVnYXRpdmU6ZmFsc2V9O3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBjb252ZXJ0IG5vbnplcm8gbnVtYmVycyB0byBiYXNlIDAuXCIpfWlmKGJhc2UuZXF1YWxzKC0xKSl7aWYobi5pc1plcm8oKSlyZXR1cm57dmFsdWU6WzBdLGlzTmVnYXRpdmU6ZmFsc2V9O2lmKG4uaXNOZWdhdGl2ZSgpKXJldHVybnt2YWx1ZTpbXS5jb25jYXQuYXBwbHkoW10sQXJyYXkuYXBwbHkobnVsbCxBcnJheSgtbi50b0pTTnVtYmVyKCkpKS5tYXAoQXJyYXkucHJvdG90eXBlLnZhbHVlT2YsWzEsMF0pKSxpc05lZ2F0aXZlOmZhbHNlfTt2YXIgYXJyPUFycmF5LmFwcGx5KG51bGwsQXJyYXkobi50b0pTTnVtYmVyKCktMSkpLm1hcChBcnJheS5wcm90b3R5cGUudmFsdWVPZixbMCwxXSk7YXJyLnVuc2hpZnQoWzFdKTtyZXR1cm57dmFsdWU6W10uY29uY2F0LmFwcGx5KFtdLGFyciksaXNOZWdhdGl2ZTpmYWxzZX19dmFyIG5lZz1mYWxzZTtpZihuLmlzTmVnYXRpdmUoKSYmYmFzZS5pc1Bvc2l0aXZlKCkpe25lZz10cnVlO249bi5hYnMoKX1pZihiYXNlLmlzVW5pdCgpKXtpZihuLmlzWmVybygpKXJldHVybnt2YWx1ZTpbMF0saXNOZWdhdGl2ZTpmYWxzZX07cmV0dXJue3ZhbHVlOkFycmF5LmFwcGx5KG51bGwsQXJyYXkobi50b0pTTnVtYmVyKCkpKS5tYXAoTnVtYmVyLnByb3RvdHlwZS52YWx1ZU9mLDEpLGlzTmVnYXRpdmU6bmVnfX12YXIgb3V0PVtdO3ZhciBsZWZ0PW4sZGl2bW9kO3doaWxlKGxlZnQuaXNOZWdhdGl2ZSgpfHxsZWZ0LmNvbXBhcmVBYnMoYmFzZSk+PTApe2Rpdm1vZD1sZWZ0LmRpdm1vZChiYXNlKTtsZWZ0PWRpdm1vZC5xdW90aWVudDt2YXIgZGlnaXQ9ZGl2bW9kLnJlbWFpbmRlcjtpZihkaWdpdC5pc05lZ2F0aXZlKCkpe2RpZ2l0PWJhc2UubWludXMoZGlnaXQpLmFicygpO2xlZnQ9bGVmdC5uZXh0KCl9b3V0LnB1c2goZGlnaXQudG9KU051bWJlcigpKX1vdXQucHVzaChsZWZ0LnRvSlNOdW1iZXIoKSk7cmV0dXJue3ZhbHVlOm91dC5yZXZlcnNlKCksaXNOZWdhdGl2ZTpuZWd9fWZ1bmN0aW9uIHRvQmFzZVN0cmluZyhuLGJhc2UsYWxwaGFiZXQpe3ZhciBhcnI9dG9CYXNlKG4sYmFzZSk7cmV0dXJuKGFyci5pc05lZ2F0aXZlP1wiLVwiOlwiXCIpK2Fyci52YWx1ZS5tYXAoZnVuY3Rpb24oeCl7cmV0dXJuIHN0cmluZ2lmeSh4LGFscGhhYmV0KX0pLmpvaW4oXCJcIil9QmlnSW50ZWdlci5wcm90b3R5cGUudG9BcnJheT1mdW5jdGlvbihyYWRpeCl7cmV0dXJuIHRvQmFzZSh0aGlzLHJhZGl4KX07U21hbGxJbnRlZ2VyLnByb3RvdHlwZS50b0FycmF5PWZ1bmN0aW9uKHJhZGl4KXtyZXR1cm4gdG9CYXNlKHRoaXMscmFkaXgpfTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLnRvQXJyYXk9ZnVuY3Rpb24ocmFkaXgpe3JldHVybiB0b0Jhc2UodGhpcyxyYWRpeCl9O0JpZ0ludGVnZXIucHJvdG90eXBlLnRvU3RyaW5nPWZ1bmN0aW9uKHJhZGl4LGFscGhhYmV0KXtpZihyYWRpeD09PXVuZGVmaW5lZClyYWRpeD0xMDtpZihyYWRpeCE9PTEwKXJldHVybiB0b0Jhc2VTdHJpbmcodGhpcyxyYWRpeCxhbHBoYWJldCk7dmFyIHY9dGhpcy52YWx1ZSxsPXYubGVuZ3RoLHN0cj1TdHJpbmcodlstLWxdKSx6ZXJvcz1cIjAwMDAwMDBcIixkaWdpdDt3aGlsZSgtLWw+PTApe2RpZ2l0PVN0cmluZyh2W2xdKTtzdHIrPXplcm9zLnNsaWNlKGRpZ2l0Lmxlbmd0aCkrZGlnaXR9dmFyIHNpZ249dGhpcy5zaWduP1wiLVwiOlwiXCI7cmV0dXJuIHNpZ24rc3RyfTtTbWFsbEludGVnZXIucHJvdG90eXBlLnRvU3RyaW5nPWZ1bmN0aW9uKHJhZGl4LGFscGhhYmV0KXtpZihyYWRpeD09PXVuZGVmaW5lZClyYWRpeD0xMDtpZihyYWRpeCE9MTApcmV0dXJuIHRvQmFzZVN0cmluZyh0aGlzLHJhZGl4LGFscGhhYmV0KTtyZXR1cm4gU3RyaW5nKHRoaXMudmFsdWUpfTtOYXRpdmVCaWdJbnQucHJvdG90eXBlLnRvU3RyaW5nPVNtYWxsSW50ZWdlci5wcm90b3R5cGUudG9TdHJpbmc7TmF0aXZlQmlnSW50LnByb3RvdHlwZS50b0pTT049QmlnSW50ZWdlci5wcm90b3R5cGUudG9KU09OPVNtYWxsSW50ZWdlci5wcm90b3R5cGUudG9KU09OPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudG9TdHJpbmcoKX07QmlnSW50ZWdlci5wcm90b3R5cGUudmFsdWVPZj1mdW5jdGlvbigpe3JldHVybiBwYXJzZUludCh0aGlzLnRvU3RyaW5nKCksMTApfTtCaWdJbnRlZ2VyLnByb3RvdHlwZS50b0pTTnVtYmVyPUJpZ0ludGVnZXIucHJvdG90eXBlLnZhbHVlT2Y7U21hbGxJbnRlZ2VyLnByb3RvdHlwZS52YWx1ZU9mPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudmFsdWV9O1NtYWxsSW50ZWdlci5wcm90b3R5cGUudG9KU051bWJlcj1TbWFsbEludGVnZXIucHJvdG90eXBlLnZhbHVlT2Y7TmF0aXZlQmlnSW50LnByb3RvdHlwZS52YWx1ZU9mPU5hdGl2ZUJpZ0ludC5wcm90b3R5cGUudG9KU051bWJlcj1mdW5jdGlvbigpe3JldHVybiBwYXJzZUludCh0aGlzLnRvU3RyaW5nKCksMTApfTtmdW5jdGlvbiBwYXJzZVN0cmluZ1ZhbHVlKHYpe2lmKGlzUHJlY2lzZSgrdikpe3ZhciB4PSt2O2lmKHg9PT10cnVuY2F0ZSh4KSlyZXR1cm4gc3VwcG9ydHNOYXRpdmVCaWdJbnQ/bmV3IE5hdGl2ZUJpZ0ludChCaWdJbnQoeCkpOm5ldyBTbWFsbEludGVnZXIoeCk7dGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnRlZ2VyOiBcIit2KX12YXIgc2lnbj12WzBdPT09XCItXCI7aWYoc2lnbil2PXYuc2xpY2UoMSk7dmFyIHNwbGl0PXYuc3BsaXQoL2UvaSk7aWYoc3BsaXQubGVuZ3RoPjIpdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnRlZ2VyOiBcIitzcGxpdC5qb2luKFwiZVwiKSk7aWYoc3BsaXQubGVuZ3RoPT09Mil7dmFyIGV4cD1zcGxpdFsxXTtpZihleHBbMF09PT1cIitcIilleHA9ZXhwLnNsaWNlKDEpO2V4cD0rZXhwO2lmKGV4cCE9PXRydW5jYXRlKGV4cCl8fCFpc1ByZWNpc2UoZXhwKSl0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGludGVnZXI6IFwiK2V4cCtcIiBpcyBub3QgYSB2YWxpZCBleHBvbmVudC5cIik7dmFyIHRleHQ9c3BsaXRbMF07dmFyIGRlY2ltYWxQbGFjZT10ZXh0LmluZGV4T2YoXCIuXCIpO2lmKGRlY2ltYWxQbGFjZT49MCl7ZXhwLT10ZXh0Lmxlbmd0aC1kZWNpbWFsUGxhY2UtMTt0ZXh0PXRleHQuc2xpY2UoMCxkZWNpbWFsUGxhY2UpK3RleHQuc2xpY2UoZGVjaW1hbFBsYWNlKzEpfWlmKGV4cDwwKXRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBpbmNsdWRlIG5lZ2F0aXZlIGV4cG9uZW50IHBhcnQgZm9yIGludGVnZXJzXCIpO3RleHQrPW5ldyBBcnJheShleHArMSkuam9pbihcIjBcIik7dj10ZXh0fXZhciBpc1ZhbGlkPS9eKFswLTldWzAtOV0qKSQvLnRlc3Qodik7aWYoIWlzVmFsaWQpdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBpbnRlZ2VyOiBcIit2KTtpZihzdXBwb3J0c05hdGl2ZUJpZ0ludCl7cmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQoQmlnSW50KHNpZ24/XCItXCIrdjp2KSl9dmFyIHI9W10sbWF4PXYubGVuZ3RoLGw9TE9HX0JBU0UsbWluPW1heC1sO3doaWxlKG1heD4wKXtyLnB1c2goK3Yuc2xpY2UobWluLG1heCkpO21pbi09bDtpZihtaW48MCltaW49MDttYXgtPWx9dHJpbShyKTtyZXR1cm4gbmV3IEJpZ0ludGVnZXIocixzaWduKX1mdW5jdGlvbiBwYXJzZU51bWJlclZhbHVlKHYpe2lmKHN1cHBvcnRzTmF0aXZlQmlnSW50KXtyZXR1cm4gbmV3IE5hdGl2ZUJpZ0ludChCaWdJbnQodikpfWlmKGlzUHJlY2lzZSh2KSl7aWYodiE9PXRydW5jYXRlKHYpKXRocm93IG5ldyBFcnJvcih2K1wiIGlzIG5vdCBhbiBpbnRlZ2VyLlwiKTtyZXR1cm4gbmV3IFNtYWxsSW50ZWdlcih2KX1yZXR1cm4gcGFyc2VTdHJpbmdWYWx1ZSh2LnRvU3RyaW5nKCkpfWZ1bmN0aW9uIHBhcnNlVmFsdWUodil7aWYodHlwZW9mIHY9PT1cIm51bWJlclwiKXtyZXR1cm4gcGFyc2VOdW1iZXJWYWx1ZSh2KX1pZih0eXBlb2Ygdj09PVwic3RyaW5nXCIpe3JldHVybiBwYXJzZVN0cmluZ1ZhbHVlKHYpfWlmKHR5cGVvZiB2PT09XCJiaWdpbnRcIil7cmV0dXJuIG5ldyBOYXRpdmVCaWdJbnQodil9cmV0dXJuIHZ9Zm9yKHZhciBpPTA7aTwxZTM7aSsrKXtJbnRlZ2VyW2ldPXBhcnNlVmFsdWUoaSk7aWYoaT4wKUludGVnZXJbLWldPXBhcnNlVmFsdWUoLWkpfUludGVnZXIub25lPUludGVnZXJbMV07SW50ZWdlci56ZXJvPUludGVnZXJbMF07SW50ZWdlci5taW51c09uZT1JbnRlZ2VyWy0xXTtJbnRlZ2VyLm1heD1tYXg7SW50ZWdlci5taW49bWluO0ludGVnZXIuZ2NkPWdjZDtJbnRlZ2VyLmxjbT1sY207SW50ZWdlci5pc0luc3RhbmNlPWZ1bmN0aW9uKHgpe3JldHVybiB4IGluc3RhbmNlb2YgQmlnSW50ZWdlcnx8eCBpbnN0YW5jZW9mIFNtYWxsSW50ZWdlcnx8eCBpbnN0YW5jZW9mIE5hdGl2ZUJpZ0ludH07SW50ZWdlci5yYW5kQmV0d2Vlbj1yYW5kQmV0d2VlbjtJbnRlZ2VyLmZyb21BcnJheT1mdW5jdGlvbihkaWdpdHMsYmFzZSxpc05lZ2F0aXZlKXtyZXR1cm4gcGFyc2VCYXNlRnJvbUFycmF5KGRpZ2l0cy5tYXAocGFyc2VWYWx1ZSkscGFyc2VWYWx1ZShiYXNlfHwxMCksaXNOZWdhdGl2ZSl9O3JldHVybiBJbnRlZ2VyfSgpO2lmKHR5cGVvZiBtb2R1bGUhPT1cInVuZGVmaW5lZFwiJiZtb2R1bGUuaGFzT3duUHJvcGVydHkoXCJleHBvcnRzXCIpKXttb2R1bGUuZXhwb3J0cz1iaWdJbnR9aWYodHlwZW9mIGRlZmluZT09PVwiZnVuY3Rpb25cIiYmZGVmaW5lLmFtZCl7ZGVmaW5lKFwiYmlnLWludGVnZXJcIixbXSxmdW5jdGlvbigpe3JldHVybiBiaWdJbnR9KX0iLCIvKipcbiAqIFRoZSBjb3B5cmlnaHQgaW4gdGhpcyBzb2Z0d2FyZSBpcyBiZWluZyBtYWRlIGF2YWlsYWJsZSB1bmRlciB0aGUgQlNEIExpY2Vuc2UsXG4gKiBpbmNsdWRlZCBiZWxvdy4gVGhpcyBzb2Z0d2FyZSBtYXkgYmUgc3ViamVjdCB0byBvdGhlciB0aGlyZCBwYXJ0eSBhbmQgY29udHJpYnV0b3JcbiAqIHJpZ2h0cywgaW5jbHVkaW5nIHBhdGVudCByaWdodHMsIGFuZCBubyBzdWNoIHJpZ2h0cyBhcmUgZ3JhbnRlZCB1bmRlciB0aGlzIGxpY2Vuc2UuXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLCBEYXNoIEluZHVzdHJ5IEZvcnVtLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXQgbW9kaWZpY2F0aW9uLFxuICogYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuICogICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gKiAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gKiAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvbiBhbmQvb3JcbiAqICBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogICogTmVpdGhlciB0aGUgbmFtZSBvZiBEYXNoIEluZHVzdHJ5IEZvcnVtIG5vciB0aGUgbmFtZXMgb2YgaXRzXG4gKiAgY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZVxuICogIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICpcbiAqICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIEFTIElTIEFORCBBTllcbiAqICBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEXG4gKiAgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRSBESVNDTEFJTUVELlxuICogIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgSE9MREVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsXG4gKiAgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVFxuICogIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1JcbiAqICBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSxcbiAqICBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpXG4gKiAgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEVcbiAqICBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuLyoqXG4gKiBAbW9kdWxlIEZhY3RvcnlNYWtlclxuICogQGlnbm9yZVxuICovXG5jb25zdCBGYWN0b3J5TWFrZXIgPSAoZnVuY3Rpb24gKCkge1xuXG4gICAgbGV0IGluc3RhbmNlO1xuICAgIGxldCBzaW5nbGV0b25Db250ZXh0cyA9IFtdO1xuICAgIGNvbnN0IHNpbmdsZXRvbkZhY3RvcmllcyA9IHt9O1xuICAgIGNvbnN0IGNsYXNzRmFjdG9yaWVzID0ge307XG5cbiAgICBmdW5jdGlvbiBleHRlbmQobmFtZSwgY2hpbGRJbnN0YW5jZSwgb3ZlcnJpZGUsIGNvbnRleHQpIHtcbiAgICAgICAgaWYgKCFjb250ZXh0W25hbWVdICYmIGNoaWxkSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIGNvbnRleHRbbmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2U6IGNoaWxkSW5zdGFuY2UsXG4gICAgICAgICAgICAgICAgb3ZlcnJpZGU6IG92ZXJyaWRlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIGZyb20geW91ciBleHRlbmRlZCBvYmplY3QuICB0aGlzLmZhY3RvcnkgaXMgaW5qZWN0ZWQgaW50byB5b3VyIG9iamVjdC5cbiAgICAgKiB0aGlzLmZhY3RvcnkuZ2V0U2luZ2xldG9uSW5zdGFuY2UodGhpcy5jb250ZXh0LCAnVmlkZW9Nb2RlbCcpXG4gICAgICogd2lsbCByZXR1cm4gdGhlIHZpZGVvIG1vZGVsIGZvciB1c2UgaW4gdGhlIGV4dGVuZGVkIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0IC0gaW5qZWN0ZWQgaW50byBleHRlbmRlZCBvYmplY3QgYXMgdGhpcy5jb250ZXh0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZSAtIHN0cmluZyBuYW1lIGZvdW5kIGluIGFsbCBkYXNoLmpzIG9iamVjdHNcbiAgICAgKiB3aXRoIG5hbWUgX19kYXNoanNfZmFjdG9yeV9uYW1lIFdpbGwgYmUgYXQgdGhlIGJvdHRvbS4gV2lsbCBiZSB0aGUgc2FtZSBhcyB0aGUgb2JqZWN0J3MgbmFtZS5cbiAgICAgKiBAcmV0dXJucyB7Kn0gQ29udGV4dCBhd2FyZSBpbnN0YW5jZSBvZiBzcGVjaWZpZWQgc2luZ2xldG9uIG5hbWUuXG4gICAgICogQG1lbWJlcm9mIG1vZHVsZTpGYWN0b3J5TWFrZXJcbiAgICAgKiBAaW5zdGFuY2VcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRTaW5nbGV0b25JbnN0YW5jZShjb250ZXh0LCBjbGFzc05hbWUpIHtcbiAgICAgICAgZm9yIChjb25zdCBpIGluIHNpbmdsZXRvbkNvbnRleHRzKSB7XG4gICAgICAgICAgICBjb25zdCBvYmogPSBzaW5nbGV0b25Db250ZXh0c1tpXTtcbiAgICAgICAgICAgIGlmIChvYmouY29udGV4dCA9PT0gY29udGV4dCAmJiBvYmoubmFtZSA9PT0gY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iai5pbnN0YW5jZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gYWRkIGFuIHNpbmdsZXRvbiBpbnN0YW5jZSB0byB0aGUgc3lzdGVtLiAgVXNlZnVsIGZvciB1bml0IHRlc3RpbmcgdG8gbW9jayBvYmplY3RzIGV0Yy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzTmFtZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnN0YW5jZVxuICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6RmFjdG9yeU1ha2VyXG4gICAgICogQGluc3RhbmNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gc2V0U2luZ2xldG9uSW5zdGFuY2UoY29udGV4dCwgY2xhc3NOYW1lLCBpbnN0YW5jZSkge1xuICAgICAgICBmb3IgKGNvbnN0IGkgaW4gc2luZ2xldG9uQ29udGV4dHMpIHtcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IHNpbmdsZXRvbkNvbnRleHRzW2ldO1xuICAgICAgICAgICAgaWYgKG9iai5jb250ZXh0ID09PSBjb250ZXh0ICYmIG9iai5uYW1lID09PSBjbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICBzaW5nbGV0b25Db250ZXh0c1tpXS5pbnN0YW5jZSA9IGluc3RhbmNlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzaW5nbGV0b25Db250ZXh0cy5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IGNsYXNzTmFtZSxcbiAgICAgICAgICAgIGNvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICBpbnN0YW5jZTogaW5zdGFuY2VcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHJlbW92ZSBhbGwgc2luZ2xldG9uIGluc3RhbmNlcyBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0aWN1bGFyIGNvbnRleHQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICAgICAqIEBtZW1iZXJvZiBtb2R1bGU6RmFjdG9yeU1ha2VyXG4gICAgICogQGluc3RhbmNlXG4gICAgICovXG4gICAgZnVuY3Rpb24gZGVsZXRlU2luZ2xldG9uSW5zdGFuY2VzKGNvbnRleHQpIHtcbiAgICAgICAgc2luZ2xldG9uQ29udGV4dHMgPSBzaW5nbGV0b25Db250ZXh0cy5maWx0ZXIoeCA9PiB4LmNvbnRleHQgIT09IGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIC8vIEZhY3RvcmllcyBzdG9yYWdlIE1hbmFnZW1lbnRcblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIGZ1bmN0aW9uIGdldEZhY3RvcnlCeU5hbWUobmFtZSwgZmFjdG9yaWVzQXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGZhY3Rvcmllc0FycmF5W25hbWVdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUZhY3RvcnkobmFtZSwgZmFjdG9yeSwgZmFjdG9yaWVzQXJyYXkpIHtcbiAgICAgICAgaWYgKG5hbWUgaW4gZmFjdG9yaWVzQXJyYXkpIHtcbiAgICAgICAgICAgIGZhY3Rvcmllc0FycmF5W25hbWVdID0gZmFjdG9yeTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIC8vIENsYXNzIEZhY3RvcmllcyBNYW5hZ2VtZW50XG5cbiAgICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgICBmdW5jdGlvbiB1cGRhdGVDbGFzc0ZhY3RvcnkobmFtZSwgZmFjdG9yeSkge1xuICAgICAgICB1cGRhdGVGYWN0b3J5KG5hbWUsIGZhY3RvcnksIGNsYXNzRmFjdG9yaWVzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDbGFzc0ZhY3RvcnlCeU5hbWUobmFtZSkge1xuICAgICAgICByZXR1cm4gZ2V0RmFjdG9yeUJ5TmFtZShuYW1lLCBjbGFzc0ZhY3Rvcmllcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q2xhc3NGYWN0b3J5KGNsYXNzQ29uc3RydWN0b3IpIHtcbiAgICAgICAgbGV0IGZhY3RvcnkgPSBnZXRGYWN0b3J5QnlOYW1lKGNsYXNzQ29uc3RydWN0b3IuX19kYXNoanNfZmFjdG9yeV9uYW1lLCBjbGFzc0ZhY3Rvcmllcyk7XG5cbiAgICAgICAgaWYgKCFmYWN0b3J5KSB7XG4gICAgICAgICAgICBmYWN0b3J5ID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWVyZ2UoY2xhc3NDb25zdHJ1Y3RvciwgY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjbGFzc0ZhY3Rvcmllc1tjbGFzc0NvbnN0cnVjdG9yLl9fZGFzaGpzX2ZhY3RvcnlfbmFtZV0gPSBmYWN0b3J5OyAvLyBzdG9yZSBmYWN0b3J5XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhY3Rvcnk7XG4gICAgfVxuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgLy8gU2luZ2xldG9uIEZhY3RvcnkgTUFhbmdlbWVudFxuXG4gICAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlU2luZ2xldG9uRmFjdG9yeShuYW1lLCBmYWN0b3J5KSB7XG4gICAgICAgIHVwZGF0ZUZhY3RvcnkobmFtZSwgZmFjdG9yeSwgc2luZ2xldG9uRmFjdG9yaWVzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRTaW5nbGV0b25GYWN0b3J5QnlOYW1lKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGdldEZhY3RvcnlCeU5hbWUobmFtZSwgc2luZ2xldG9uRmFjdG9yaWVzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRTaW5nbGV0b25GYWN0b3J5KGNsYXNzQ29uc3RydWN0b3IpIHtcbiAgICAgICAgbGV0IGZhY3RvcnkgPSBnZXRGYWN0b3J5QnlOYW1lKGNsYXNzQ29uc3RydWN0b3IuX19kYXNoanNfZmFjdG9yeV9uYW1lLCBzaW5nbGV0b25GYWN0b3JpZXMpO1xuICAgICAgICBpZiAoIWZhY3RvcnkpIHtcbiAgICAgICAgICAgIGZhY3RvcnkgPSBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgICAgICAgICAgICAgIGxldCBpbnN0YW5jZTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0SW5zdGFuY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYW4gaW5zdGFuY2UgeWV0IGNoZWNrIGZvciBvbmUgb24gdGhlIGNvbnRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IGdldFNpbmdsZXRvbkluc3RhbmNlKGNvbnRleHQsIGNsYXNzQ29uc3RydWN0b3IuX19kYXNoanNfZmFjdG9yeV9uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlJ3Mgbm8gaW5zdGFuY2Ugb24gdGhlIGNvbnRleHQgdGhlbiBjcmVhdGUgb25lXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBtZXJnZShjbGFzc0NvbnN0cnVjdG9yLCBjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZXRvbkNvbnRleHRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjbGFzc0NvbnN0cnVjdG9yLl9fZGFzaGpzX2ZhY3RvcnlfbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2U6IGluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNpbmdsZXRvbkZhY3Rvcmllc1tjbGFzc0NvbnN0cnVjdG9yLl9fZGFzaGpzX2ZhY3RvcnlfbmFtZV0gPSBmYWN0b3J5OyAvLyBzdG9yZSBmYWN0b3J5XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFjdG9yeTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtZXJnZShjbGFzc0NvbnN0cnVjdG9yLCBjb250ZXh0LCBhcmdzKSB7XG5cbiAgICAgICAgbGV0IGNsYXNzSW5zdGFuY2U7XG4gICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNsYXNzQ29uc3RydWN0b3IuX19kYXNoanNfZmFjdG9yeV9uYW1lO1xuICAgICAgICBjb25zdCBleHRlbnNpb25PYmplY3QgPSBjb250ZXh0W2NsYXNzTmFtZV07XG5cbiAgICAgICAgaWYgKGV4dGVuc2lvbk9iamVjdCkge1xuXG4gICAgICAgICAgICBsZXQgZXh0ZW5zaW9uID0gZXh0ZW5zaW9uT2JqZWN0Lmluc3RhbmNlO1xuXG4gICAgICAgICAgICBpZiAoZXh0ZW5zaW9uT2JqZWN0Lm92ZXJyaWRlKSB7IC8vT3ZlcnJpZGUgcHVibGljIG1ldGhvZHMgaW4gcGFyZW50IGJ1dCBrZWVwIHBhcmVudC5cblxuICAgICAgICAgICAgICAgIGNsYXNzSW5zdGFuY2UgPSBjbGFzc0NvbnN0cnVjdG9yLmFwcGx5KHtjb250ZXh0fSwgYXJncyk7XG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uID0gZXh0ZW5zaW9uLmFwcGx5KHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgZmFjdG9yeTogaW5zdGFuY2UsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudDogY2xhc3NJbnN0YW5jZVxuICAgICAgICAgICAgICAgIH0sIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIGV4dGVuc2lvbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2xhc3NJbnN0YW5jZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NJbnN0YW5jZVtwcm9wXSA9IGV4dGVuc2lvbltwcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHsgLy9yZXBsYWNlIHBhcmVudCBvYmplY3QgY29tcGxldGVseSB3aXRoIG5ldyBvYmplY3QuIFNhbWUgYXMgZGlqb24uXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZXh0ZW5zaW9uLmFwcGx5KHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgZmFjdG9yeTogaW5zdGFuY2VcbiAgICAgICAgICAgICAgICB9LCBhcmdzKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQ3JlYXRlIG5ldyBpbnN0YW5jZSBvZiB0aGUgY2xhc3NcbiAgICAgICAgICAgIGNsYXNzSW5zdGFuY2UgPSBjbGFzc0NvbnN0cnVjdG9yLmFwcGx5KHtjb250ZXh0fSwgYXJncyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgZ2V0Q2xhc3NOYW1lIGZ1bmN0aW9uIHRvIGNsYXNzIGluc3RhbmNlIHByb3RvdHlwZSAodXNlZCBieSBEZWJ1ZylcbiAgICAgICAgY2xhc3NJbnN0YW5jZS5nZXRDbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7cmV0dXJuIGNsYXNzTmFtZTt9O1xuXG4gICAgICAgIHJldHVybiBjbGFzc0luc3RhbmNlO1xuICAgIH1cblxuICAgIGluc3RhbmNlID0ge1xuICAgICAgICBleHRlbmQ6IGV4dGVuZCxcbiAgICAgICAgZ2V0U2luZ2xldG9uSW5zdGFuY2U6IGdldFNpbmdsZXRvbkluc3RhbmNlLFxuICAgICAgICBzZXRTaW5nbGV0b25JbnN0YW5jZTogc2V0U2luZ2xldG9uSW5zdGFuY2UsXG4gICAgICAgIGRlbGV0ZVNpbmdsZXRvbkluc3RhbmNlczogZGVsZXRlU2luZ2xldG9uSW5zdGFuY2VzLFxuICAgICAgICBnZXRTaW5nbGV0b25GYWN0b3J5OiBnZXRTaW5nbGV0b25GYWN0b3J5LFxuICAgICAgICBnZXRTaW5nbGV0b25GYWN0b3J5QnlOYW1lOiBnZXRTaW5nbGV0b25GYWN0b3J5QnlOYW1lLFxuICAgICAgICB1cGRhdGVTaW5nbGV0b25GYWN0b3J5OiB1cGRhdGVTaW5nbGV0b25GYWN0b3J5LFxuICAgICAgICBnZXRDbGFzc0ZhY3Rvcnk6IGdldENsYXNzRmFjdG9yeSxcbiAgICAgICAgZ2V0Q2xhc3NGYWN0b3J5QnlOYW1lOiBnZXRDbGFzc0ZhY3RvcnlCeU5hbWUsXG4gICAgICAgIHVwZGF0ZUNsYXNzRmFjdG9yeTogdXBkYXRlQ2xhc3NGYWN0b3J5XG4gICAgfTtcblxuICAgIHJldHVybiBpbnN0YW5jZTtcblxufSgpKTtcblxuZXhwb3J0IGRlZmF1bHQgRmFjdG9yeU1ha2VyO1xuIiwiLyoqXG4gKiBUaGUgY29weXJpZ2h0IGluIHRoaXMgc29mdHdhcmUgaXMgYmVpbmcgbWFkZSBhdmFpbGFibGUgdW5kZXIgdGhlIEJTRCBMaWNlbnNlLFxuICogaW5jbHVkZWQgYmVsb3cuIFRoaXMgc29mdHdhcmUgbWF5IGJlIHN1YmplY3QgdG8gb3RoZXIgdGhpcmQgcGFydHkgYW5kIGNvbnRyaWJ1dG9yXG4gKiByaWdodHMsIGluY2x1ZGluZyBwYXRlbnQgcmlnaHRzLCBhbmQgbm8gc3VjaCByaWdodHMgYXJlIGdyYW50ZWQgdW5kZXIgdGhpcyBsaWNlbnNlLlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMywgRGFzaCBJbmR1c3RyeSBGb3J1bS5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0IG1vZGlmaWNhdGlvbixcbiAqIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICogIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuICogIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yXG4gKiAgb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgRGFzaCBJbmR1c3RyeSBGb3J1bSBub3IgdGhlIG5hbWVzIG9mIGl0c1xuICogIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmVcbiAqICB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqXG4gKiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBBUyBJUyBBTkQgQU5ZXG4gKiAgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC5cbiAqICBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULFxuICogIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVRcbiAqICBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SXG4gKiAgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksXG4gKiAgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKVxuICogIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFXG4gKiAgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cbi8qKlxuICogQGNsYXNzXG4gKiBAaWdub3JlXG4gKi9cbmNsYXNzIEVycm9yc0Jhc2Uge1xuICAgIGV4dGVuZCAoZXJyb3JzLCBjb25maWcpIHtcbiAgICAgICAgaWYgKCFlcnJvcnMpIHJldHVybjtcblxuICAgICAgICBsZXQgb3ZlcnJpZGUgPSBjb25maWcgPyBjb25maWcub3ZlcnJpZGUgOiBmYWxzZTtcbiAgICAgICAgbGV0IHB1YmxpY09ubHkgPSBjb25maWcgPyBjb25maWcucHVibGljT25seSA6IGZhbHNlO1xuXG5cbiAgICAgICAgZm9yIChjb25zdCBlcnIgaW4gZXJyb3JzKSB7XG4gICAgICAgICAgICBpZiAoIWVycm9ycy5oYXNPd25Qcm9wZXJ0eShlcnIpIHx8ICh0aGlzW2Vycl0gJiYgIW92ZXJyaWRlKSkgY29udGludWU7XG4gICAgICAgICAgICBpZiAocHVibGljT25seSAmJiBlcnJvcnNbZXJyXS5pbmRleE9mKCdwdWJsaWNfJykgPT09IC0xKSBjb250aW51ZTtcbiAgICAgICAgICAgIHRoaXNbZXJyXSA9IGVycm9yc1tlcnJdO1xuXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEVycm9yc0Jhc2U7IiwiLyoqXG4gKiBUaGUgY29weXJpZ2h0IGluIHRoaXMgc29mdHdhcmUgaXMgYmVpbmcgbWFkZSBhdmFpbGFibGUgdW5kZXIgdGhlIEJTRCBMaWNlbnNlLFxuICogaW5jbHVkZWQgYmVsb3cuIFRoaXMgc29mdHdhcmUgbWF5IGJlIHN1YmplY3QgdG8gb3RoZXIgdGhpcmQgcGFydHkgYW5kIGNvbnRyaWJ1dG9yXG4gKiByaWdodHMsIGluY2x1ZGluZyBwYXRlbnQgcmlnaHRzLCBhbmQgbm8gc3VjaCByaWdodHMgYXJlIGdyYW50ZWQgdW5kZXIgdGhpcyBsaWNlbnNlLlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMywgRGFzaCBJbmR1c3RyeSBGb3J1bS5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0IG1vZGlmaWNhdGlvbixcbiAqIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICogIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuICogIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yXG4gKiAgb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgRGFzaCBJbmR1c3RyeSBGb3J1bSBub3IgdGhlIG5hbWVzIG9mIGl0c1xuICogIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmVcbiAqICB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqXG4gKiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBBUyBJUyBBTkQgQU5ZXG4gKiAgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC5cbiAqICBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULFxuICogIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVRcbiAqICBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SXG4gKiAgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksXG4gKiAgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKVxuICogIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFXG4gKiAgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cbi8qKlxuICogQGNsYXNzXG4gKiBAaWdub3JlXG4gKi9cbmNsYXNzIEV2ZW50c0Jhc2Uge1xuICAgIGV4dGVuZCAoZXZlbnRzLCBjb25maWcpIHtcbiAgICAgICAgaWYgKCFldmVudHMpIHJldHVybjtcblxuICAgICAgICBsZXQgb3ZlcnJpZGUgPSBjb25maWcgPyBjb25maWcub3ZlcnJpZGUgOiBmYWxzZTtcbiAgICAgICAgbGV0IHB1YmxpY09ubHkgPSBjb25maWcgPyBjb25maWcucHVibGljT25seSA6IGZhbHNlO1xuXG5cbiAgICAgICAgZm9yIChjb25zdCBldnQgaW4gZXZlbnRzKSB7XG4gICAgICAgICAgICBpZiAoIWV2ZW50cy5oYXNPd25Qcm9wZXJ0eShldnQpIHx8ICh0aGlzW2V2dF0gJiYgIW92ZXJyaWRlKSkgY29udGludWU7XG4gICAgICAgICAgICBpZiAocHVibGljT25seSAmJiBldmVudHNbZXZ0XS5pbmRleE9mKCdwdWJsaWNfJykgPT09IC0xKSBjb250aW51ZTtcbiAgICAgICAgICAgIHRoaXNbZXZ0XSA9IGV2ZW50c1tldnRdO1xuXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEV2ZW50c0Jhc2U7IiwiLyoqXG4gKiBUaGUgY29weXJpZ2h0IGluIHRoaXMgc29mdHdhcmUgaXMgYmVpbmcgbWFkZSBhdmFpbGFibGUgdW5kZXIgdGhlIEJTRCBMaWNlbnNlLFxuICogaW5jbHVkZWQgYmVsb3cuIFRoaXMgc29mdHdhcmUgbWF5IGJlIHN1YmplY3QgdG8gb3RoZXIgdGhpcmQgcGFydHkgYW5kIGNvbnRyaWJ1dG9yXG4gKiByaWdodHMsIGluY2x1ZGluZyBwYXRlbnQgcmlnaHRzLCBhbmQgbm8gc3VjaCByaWdodHMgYXJlIGdyYW50ZWQgdW5kZXIgdGhpcyBsaWNlbnNlLlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMywgRGFzaCBJbmR1c3RyeSBGb3J1bS5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0IG1vZGlmaWNhdGlvbixcbiAqIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICogIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuICogIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yXG4gKiAgb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgRGFzaCBJbmR1c3RyeSBGb3J1bSBub3IgdGhlIG5hbWVzIG9mIGl0c1xuICogIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmVcbiAqICB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqXG4gKiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBBUyBJUyBBTkQgQU5ZXG4gKiAgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC5cbiAqICBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULFxuICogIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVRcbiAqICBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SXG4gKiAgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksXG4gKiAgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKVxuICogIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFXG4gKiAgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cblxuaW1wb3J0IEZyYWdtZW50UmVxdWVzdCBmcm9tICcuLi9zdHJlYW1pbmcvdm8vRnJhZ21lbnRSZXF1ZXN0JztcblxuZnVuY3Rpb24gTXNzRnJhZ21lbnRJbmZvQ29udHJvbGxlcihjb25maWcpIHtcblxuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblxuICAgIGxldCBpbnN0YW5jZSxcbiAgICAgICAgbG9nZ2VyLFxuICAgICAgICBmcmFnbWVudE1vZGVsLFxuICAgICAgICBzdGFydGVkLFxuICAgICAgICB0eXBlLFxuICAgICAgICBsb2FkRnJhZ21lbnRUaW1lb3V0LFxuICAgICAgICBzdGFydFRpbWUsXG4gICAgICAgIHN0YXJ0RnJhZ21lbnRUaW1lLFxuICAgICAgICBpbmRleDtcblxuICAgIGNvbnN0IHN0cmVhbVByb2Nlc3NvciA9IGNvbmZpZy5zdHJlYW1Qcm9jZXNzb3I7XG4gICAgY29uc3QgYmFzZVVSTENvbnRyb2xsZXIgPSBjb25maWcuYmFzZVVSTENvbnRyb2xsZXI7XG4gICAgY29uc3QgZGVidWcgPSBjb25maWcuZGVidWc7XG4gICAgY29uc3QgY29udHJvbGxlclR5cGUgPSAnTXNzRnJhZ21lbnRJbmZvQ29udHJvbGxlcic7XG5cbiAgICBmdW5jdGlvbiBzZXR1cCgpIHtcbiAgICAgICAgbG9nZ2VyID0gZGVidWcuZ2V0TG9nZ2VyKGluc3RhbmNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbml0aWFsaXplKCkge1xuICAgICAgICB0eXBlID0gc3RyZWFtUHJvY2Vzc29yLmdldFR5cGUoKTtcbiAgICAgICAgZnJhZ21lbnRNb2RlbCA9IHN0cmVhbVByb2Nlc3Nvci5nZXRGcmFnbWVudE1vZGVsKCk7XG5cbiAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICBzdGFydFRpbWUgPSBudWxsO1xuICAgICAgICBzdGFydEZyYWdtZW50VGltZSA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgIGlmIChzdGFydGVkKSByZXR1cm47XG5cbiAgICAgICAgbG9nZ2VyLmRlYnVnKCdTdGFydCcpO1xuXG4gICAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgaW5kZXggPSAwO1xuXG4gICAgICAgIGxvYWROZXh0RnJhZ21lbnRJbmZvKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgaWYgKCFzdGFydGVkKSByZXR1cm47XG5cbiAgICAgICAgbG9nZ2VyLmRlYnVnKCdTdG9wJyk7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KGxvYWRGcmFnbWVudFRpbWVvdXQpO1xuICAgICAgICBzdGFydGVkID0gZmFsc2U7XG4gICAgICAgIHN0YXJ0VGltZSA9IG51bGw7XG4gICAgICAgIHN0YXJ0RnJhZ21lbnRUaW1lID0gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgc3RvcCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWROZXh0RnJhZ21lbnRJbmZvKCkge1xuICAgICAgICBpZiAoIXN0YXJ0ZWQpIHJldHVybjtcblxuICAgICAgICAvLyBHZXQgbGFzdCBzZWdtZW50IGZyb20gU2VnbWVudFRpbWVsaW5lXG4gICAgICAgIGNvbnN0IHJlcHJlc2VudGF0aW9uID0gZ2V0Q3VycmVudFJlcHJlc2VudGF0aW9uKCk7XG4gICAgICAgIGNvbnN0IG1hbmlmZXN0ID0gcmVwcmVzZW50YXRpb24uYWRhcHRhdGlvbi5wZXJpb2QubXBkLm1hbmlmZXN0O1xuICAgICAgICBjb25zdCBhZGFwdGF0aW9uID0gbWFuaWZlc3QuUGVyaW9kX2FzQXJyYXlbcmVwcmVzZW50YXRpb24uYWRhcHRhdGlvbi5wZXJpb2QuaW5kZXhdLkFkYXB0YXRpb25TZXRfYXNBcnJheVtyZXByZXNlbnRhdGlvbi5hZGFwdGF0aW9uLmluZGV4XTtcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBhZGFwdGF0aW9uLlNlZ21lbnRUZW1wbGF0ZS5TZWdtZW50VGltZWxpbmUuU19hc0FycmF5O1xuICAgICAgICBjb25zdCBzZWdtZW50ID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgLy8gbG9nZ2VyLmRlYnVnKCdMYXN0IGZyYWdtZW50IHRpbWU6ICcgKyAoc2VnbWVudC50IC8gYWRhcHRhdGlvbi5TZWdtZW50VGVtcGxhdGUudGltZXNjYWxlKSk7XG5cbiAgICAgICAgLy8gR2VuZXJhdGUgc2VnbWVudCByZXF1ZXN0XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSBnZXRSZXF1ZXN0Rm9yU2VnbWVudChhZGFwdGF0aW9uLCByZXByZXNlbnRhdGlvbiwgc2VnbWVudCk7XG5cbiAgICAgICAgLy8gU2VuZCBzZWdtZW50IHJlcXVlc3RcbiAgICAgICAgcmVxdWVzdEZyYWdtZW50LmNhbGwodGhpcywgcmVxdWVzdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UmVxdWVzdEZvclNlZ21lbnQoYWRhcHRhdGlvbiwgcmVwcmVzZW50YXRpb24sIHNlZ21lbnQpIHtcbiAgICAgICAgbGV0IHRpbWVzY2FsZSA9IGFkYXB0YXRpb24uU2VnbWVudFRlbXBsYXRlLnRpbWVzY2FsZTtcbiAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgRnJhZ21lbnRSZXF1ZXN0KCk7XG5cbiAgICAgICAgcmVxdWVzdC5tZWRpYVR5cGUgPSB0eXBlO1xuICAgICAgICByZXF1ZXN0LnR5cGUgPSAnRnJhZ21lbnRJbmZvU2VnbWVudCc7XG4gICAgICAgIC8vIHJlcXVlc3QucmFuZ2UgPSBzZWdtZW50Lm1lZGlhUmFuZ2U7XG4gICAgICAgIHJlcXVlc3Quc3RhcnRUaW1lID0gc2VnbWVudC50IC8gdGltZXNjYWxlO1xuICAgICAgICByZXF1ZXN0LmR1cmF0aW9uID0gc2VnbWVudC5kIC8gdGltZXNjYWxlO1xuICAgICAgICByZXF1ZXN0LnRpbWVzY2FsZSA9IHRpbWVzY2FsZTtcbiAgICAgICAgLy8gcmVxdWVzdC5hdmFpbGFiaWxpdHlTdGFydFRpbWUgPSBzZWdtZW50LmF2YWlsYWJpbGl0eVN0YXJ0VGltZTtcbiAgICAgICAgLy8gcmVxdWVzdC5hdmFpbGFiaWxpdHlFbmRUaW1lID0gc2VnbWVudC5hdmFpbGFiaWxpdHlFbmRUaW1lO1xuICAgICAgICAvLyByZXF1ZXN0LndhbGxTdGFydFRpbWUgPSBzZWdtZW50LndhbGxTdGFydFRpbWU7XG4gICAgICAgIHJlcXVlc3QucXVhbGl0eSA9IHJlcHJlc2VudGF0aW9uLmluZGV4O1xuICAgICAgICByZXF1ZXN0LmluZGV4ID0gaW5kZXgrKztcbiAgICAgICAgcmVxdWVzdC5tZWRpYUluZm8gPSBzdHJlYW1Qcm9jZXNzb3IuZ2V0TWVkaWFJbmZvKCk7XG4gICAgICAgIHJlcXVlc3QuYWRhcHRhdGlvbkluZGV4ID0gcmVwcmVzZW50YXRpb24uYWRhcHRhdGlvbi5pbmRleDtcbiAgICAgICAgcmVxdWVzdC5yZXByZXNlbnRhdGlvbklkID0gcmVwcmVzZW50YXRpb24uaWQ7XG4gICAgICAgIHJlcXVlc3QudXJsID0gYmFzZVVSTENvbnRyb2xsZXIucmVzb2x2ZShyZXByZXNlbnRhdGlvbi5wYXRoKS51cmwgKyBhZGFwdGF0aW9uLlNlZ21lbnRUZW1wbGF0ZS5tZWRpYTtcbiAgICAgICAgcmVxdWVzdC51cmwgPSByZXF1ZXN0LnVybC5yZXBsYWNlKCckQmFuZHdpZHRoJCcsIHJlcHJlc2VudGF0aW9uLmJhbmR3aWR0aCk7XG4gICAgICAgIHJlcXVlc3QudXJsID0gcmVxdWVzdC51cmwucmVwbGFjZSgnJFRpbWUkJywgc2VnbWVudC50TWFuaWZlc3QgPyBzZWdtZW50LnRNYW5pZmVzdCA6IHNlZ21lbnQudCk7XG4gICAgICAgIHJlcXVlc3QudXJsID0gcmVxdWVzdC51cmwucmVwbGFjZSgnL0ZyYWdtZW50cygnLCAnL0ZyYWdtZW50SW5mbygnKTtcblxuICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDdXJyZW50UmVwcmVzZW50YXRpb24oKSB7XG4gICAgICAgIGNvbnN0IHJlcHJlc2VudGF0aW9uQ29udHJvbGxlciA9IHN0cmVhbVByb2Nlc3Nvci5nZXRSZXByZXNlbnRhdGlvbkNvbnRyb2xsZXIoKTtcbiAgICAgICAgY29uc3QgcmVwcmVzZW50YXRpb24gPSByZXByZXNlbnRhdGlvbkNvbnRyb2xsZXIuZ2V0Q3VycmVudFJlcHJlc2VudGF0aW9uKCk7XG4gICAgICAgIHJldHVybiByZXByZXNlbnRhdGlvbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXF1ZXN0RnJhZ21lbnQocmVxdWVzdCkge1xuICAgICAgICAvLyBsb2dnZXIuZGVidWcoJ0xvYWQgRnJhZ21lbnRJbmZvIGZvciB0aW1lOiAnICsgcmVxdWVzdC5zdGFydFRpbWUpO1xuICAgICAgICBpZiAoc3RyZWFtUHJvY2Vzc29yLmdldEZyYWdtZW50TW9kZWwoKS5pc0ZyYWdtZW50TG9hZGVkT3JQZW5kaW5nKHJlcXVlc3QpKSB7XG4gICAgICAgICAgICAvLyBXZSBtYXkgaGF2ZSByZWFjaGVkIGVuZCBvZiB0aW1lbGluZSBpbiBjYXNlIG9mIHN0YXJ0LW92ZXIgc3RyZWFtc1xuICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKCdFbmQgb2YgdGltZWxpbmUnKTtcbiAgICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZyYWdtZW50TW9kZWwuZXhlY3V0ZVJlcXVlc3QocmVxdWVzdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZnJhZ21lbnRJbmZvTG9hZGVkIChlKSB7XG4gICAgICAgIGlmICghc3RhcnRlZCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSBlLnJlcXVlc3Q7XG4gICAgICAgIGlmICghZS5yZXNwb25zZSkge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdMb2FkIGVycm9yJywgcmVxdWVzdC51cmwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRlbHRhRnJhZ21lbnRUaW1lLFxuICAgICAgICAgICAgZGVsdGFUaW1lLFxuICAgICAgICAgICAgZGVsYXk7XG5cbiAgICAgICAgLy8gbG9nZ2VyLmRlYnVnKCdGcmFnbWVudEluZm8gbG9hZGVkOiAnLCByZXF1ZXN0LnVybCk7XG5cbiAgICAgICAgaWYgKCFzdGFydEZyYWdtZW50VGltZSkge1xuICAgICAgICAgICAgc3RhcnRGcmFnbWVudFRpbWUgPSByZXF1ZXN0LnN0YXJ0VGltZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERldGVybWluZSBkZWxheSBiZWZvcmUgcmVxdWVzdGluZyBuZXh0IEZyYWdtZW50SW5mb1xuICAgICAgICBkZWx0YVRpbWUgPSAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWUpIC8gMTAwMDtcbiAgICAgICAgZGVsdGFGcmFnbWVudFRpbWUgPSAocmVxdWVzdC5zdGFydFRpbWUgKyByZXF1ZXN0LmR1cmF0aW9uKSAtIHN0YXJ0RnJhZ21lbnRUaW1lO1xuICAgICAgICBkZWxheSA9IE1hdGgubWF4KDAsIChkZWx0YUZyYWdtZW50VGltZSAtIGRlbHRhVGltZSkpO1xuXG4gICAgICAgIC8vIFNldCB0aW1lb3V0IGZvciByZXF1ZXN0aW5nIG5leHQgRnJhZ21lbnRJbmZvXG4gICAgICAgIGNsZWFyVGltZW91dChsb2FkRnJhZ21lbnRUaW1lb3V0KTtcbiAgICAgICAgbG9hZEZyYWdtZW50VGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9hZEZyYWdtZW50VGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICBsb2FkTmV4dEZyYWdtZW50SW5mbygpO1xuICAgICAgICB9LCBkZWxheSAqIDEwMDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFR5cGUoKSB7XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cblxuICAgIGluc3RhbmNlID0ge1xuICAgICAgICBpbml0aWFsaXplOiBpbml0aWFsaXplLFxuICAgICAgICBjb250cm9sbGVyVHlwZTogY29udHJvbGxlclR5cGUsXG4gICAgICAgIHN0YXJ0OiBzdGFydCxcbiAgICAgICAgZnJhZ21lbnRJbmZvTG9hZGVkOiBmcmFnbWVudEluZm9Mb2FkZWQsXG4gICAgICAgIGdldFR5cGU6IGdldFR5cGUsXG4gICAgICAgIHJlc2V0OiByZXNldFxuICAgIH07XG5cbiAgICBzZXR1cCgpO1xuXG4gICAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5Nc3NGcmFnbWVudEluZm9Db250cm9sbGVyLl9fZGFzaGpzX2ZhY3RvcnlfbmFtZSA9ICdNc3NGcmFnbWVudEluZm9Db250cm9sbGVyJztcbmV4cG9ydCBkZWZhdWx0IGRhc2hqcy5GYWN0b3J5TWFrZXIuZ2V0Q2xhc3NGYWN0b3J5KE1zc0ZyYWdtZW50SW5mb0NvbnRyb2xsZXIpOyAvKiBqc2hpbnQgaWdub3JlOmxpbmUgKi9cbiIsIi8qKlxuICogVGhlIGNvcHlyaWdodCBpbiB0aGlzIHNvZnR3YXJlIGlzIGJlaW5nIG1hZGUgYXZhaWxhYmxlIHVuZGVyIHRoZSBCU0QgTGljZW5zZSxcbiAqIGluY2x1ZGVkIGJlbG93LiBUaGlzIHNvZnR3YXJlIG1heSBiZSBzdWJqZWN0IHRvIG90aGVyIHRoaXJkIHBhcnR5IGFuZCBjb250cmlidXRvclxuICogcmlnaHRzLCBpbmNsdWRpbmcgcGF0ZW50IHJpZ2h0cywgYW5kIG5vIHN1Y2ggcmlnaHRzIGFyZSBncmFudGVkIHVuZGVyIHRoaXMgbGljZW5zZS5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMsIERhc2ggSW5kdXN0cnkgRm9ydW0uXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dCBtb2RpZmljYXRpb24sXG4gKiBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXNcbiAqICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uIGFuZC9vclxuICogIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKiAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIERhc2ggSW5kdXN0cnkgRm9ydW0gbm9yIHRoZSBuYW1lcyBvZiBpdHNcbiAqICBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlXG4gKiAgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgQVMgSVMgQU5EIEFOWVxuICogIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqICBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuXG4gKiAgSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCxcbiAqICBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUXG4gKiAgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUlxuICogIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLFxuICogIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSlcbiAqICBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRVxuICogIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5pbXBvcnQgRGFzaEpTRXJyb3IgZnJvbSAnLi4vc3RyZWFtaW5nL3ZvL0Rhc2hKU0Vycm9yJztcbmltcG9ydCBNc3NFcnJvcnMgZnJvbSAnLi9lcnJvcnMvTXNzRXJyb3JzJztcblxuaW1wb3J0IEV2ZW50cyBmcm9tICcuLi9zdHJlYW1pbmcvTWVkaWFQbGF5ZXJFdmVudHMnO1xuXG4vKipcbiAqIEBtb2R1bGUgTXNzRnJhZ21lbnRNb29mUHJvY2Vzc29yXG4gKiBAaWdub3JlXG4gKiBAcGFyYW0ge09iamVjdH0gY29uZmlnIG9iamVjdFxuICovXG5mdW5jdGlvbiBNc3NGcmFnbWVudE1vb2ZQcm9jZXNzb3IoY29uZmlnKSB7XG5cbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgbGV0IGluc3RhbmNlLFxuICAgICAgICB0eXBlLFxuICAgICAgICBsb2dnZXI7XG4gICAgY29uc3QgZGFzaE1ldHJpY3MgPSBjb25maWcuZGFzaE1ldHJpY3M7XG4gICAgY29uc3QgcGxheWJhY2tDb250cm9sbGVyID0gY29uZmlnLnBsYXliYWNrQ29udHJvbGxlcjtcbiAgICBjb25zdCBlcnJvckhhbmRsZXIgPSBjb25maWcuZXJySGFuZGxlcjtcbiAgICBjb25zdCBldmVudEJ1cyA9IGNvbmZpZy5ldmVudEJ1cztcbiAgICBjb25zdCBJU09Cb3hlciA9IGNvbmZpZy5JU09Cb3hlcjtcbiAgICBjb25zdCBkZWJ1ZyA9IGNvbmZpZy5kZWJ1ZztcblxuICAgIGZ1bmN0aW9uIHNldHVwKCkge1xuICAgICAgICBsb2dnZXIgPSBkZWJ1Zy5nZXRMb2dnZXIoaW5zdGFuY2UpO1xuICAgICAgICB0eXBlID0gJyc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc1RmcmYocmVxdWVzdCwgdGZyZiwgdGZkdCwgc3RyZWFtUHJvY2Vzc29yKSB7XG4gICAgICAgIGNvbnN0IHJlcHJlc2VudGF0aW9uQ29udHJvbGxlciA9IHN0cmVhbVByb2Nlc3Nvci5nZXRSZXByZXNlbnRhdGlvbkNvbnRyb2xsZXIoKTtcbiAgICAgICAgY29uc3QgcmVwcmVzZW50YXRpb24gPSByZXByZXNlbnRhdGlvbkNvbnRyb2xsZXIuZ2V0Q3VycmVudFJlcHJlc2VudGF0aW9uKCk7XG5cbiAgICAgICAgY29uc3QgbWFuaWZlc3QgPSByZXByZXNlbnRhdGlvbi5hZGFwdGF0aW9uLnBlcmlvZC5tcGQubWFuaWZlc3Q7XG4gICAgICAgIGNvbnN0IGFkYXB0YXRpb24gPSBtYW5pZmVzdC5QZXJpb2RfYXNBcnJheVtyZXByZXNlbnRhdGlvbi5hZGFwdGF0aW9uLnBlcmlvZC5pbmRleF0uQWRhcHRhdGlvblNldF9hc0FycmF5W3JlcHJlc2VudGF0aW9uLmFkYXB0YXRpb24uaW5kZXhdO1xuICAgICAgICBjb25zdCB0aW1lc2NhbGUgPSBhZGFwdGF0aW9uLlNlZ21lbnRUZW1wbGF0ZS50aW1lc2NhbGU7XG5cbiAgICAgICAgdHlwZSA9IHN0cmVhbVByb2Nlc3Nvci5nZXRUeXBlKCk7XG5cbiAgICAgICAgLy8gUHJvY2VzcyB0ZnJmIG9ubHkgZm9yIGxpdmUgc3RyZWFtcyBvciBzdGFydC1vdmVyIHN0YXRpYyBzdHJlYW1zICh0aW1lU2hpZnRCdWZmZXJEZXB0aCA+IDApXG4gICAgICAgIGlmIChtYW5pZmVzdC50eXBlICE9PSAnZHluYW1pYycgJiYgIW1hbmlmZXN0LnRpbWVTaGlmdEJ1ZmZlckRlcHRoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRmcmYpIHtcbiAgICAgICAgICAgIGVycm9ySGFuZGxlci5lcnJvcihuZXcgRGFzaEpTRXJyb3IoTXNzRXJyb3JzLk1TU19OT19URlJGX0NPREUsIE1zc0Vycm9ycy5NU1NfTk9fVEZSRl9NRVNTQUdFKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgYWRhcHRhdGlvbidzIHNlZ21lbnQgdGltZWxpbmUgKGFsd2F5cyBhIFNlZ21lbnRUaW1lbGluZSBpbiBTbW9vdGggU3RyZWFtaW5nIHVzZSBjYXNlKVxuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGFkYXB0YXRpb24uU2VnbWVudFRlbXBsYXRlLlNlZ21lbnRUaW1lbGluZS5TO1xuICAgICAgICBjb25zdCBlbnRyaWVzID0gdGZyZi5lbnRyeTtcbiAgICAgICAgbGV0IGVudHJ5LFxuICAgICAgICAgICAgc2VnbWVudFRpbWUsXG4gICAgICAgICAgICByYW5nZTtcbiAgICAgICAgbGV0IHNlZ21lbnQgPSBudWxsO1xuICAgICAgICBsZXQgdCA9IDA7XG4gICAgICAgIGxldCBhdmFpbGFiaWxpdHlTdGFydFRpbWUgPSBudWxsO1xuXG4gICAgICAgIGlmIChlbnRyaWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29uc2lkZXIgb25seSBmaXJzdCB0ZnJmIGVudHJ5ICh0byBhdm9pZCBwcmUtY29uZGl0aW9uIGZhaWx1cmUgb24gZnJhZ21lbnQgaW5mbyByZXF1ZXN0cylcbiAgICAgICAgZW50cnkgPSBlbnRyaWVzWzBdO1xuXG4gICAgICAgIC8vIEluIGNhc2Ugb2Ygc3RhcnQtb3ZlciBzdHJlYW1zLCBjaGVjayBpZiB3ZSBoYXZlIHJlYWNoZWQgZW5kIG9mIG9yaWdpbmFsIG1hbmlmZXN0IGR1cmF0aW9uIChzZXQgaW4gdGltZVNoaWZ0QnVmZmVyRGVwdGgpXG4gICAgICAgIC8vID0+IHRoZW4gZG8gbm90IHVwZGF0ZSBhbnltb3JlIHRpbWVsaW5lXG4gICAgICAgIGlmIChtYW5pZmVzdC50eXBlID09PSAnc3RhdGljJykge1xuICAgICAgICAgICAgLy8gR2V0IGZpcnN0IHNlZ21lbnQgdGltZVxuICAgICAgICAgICAgc2VnbWVudFRpbWUgPSBzZWdtZW50c1swXS50TWFuaWZlc3QgPyBwYXJzZUZsb2F0KHNlZ21lbnRzWzBdLnRNYW5pZmVzdCkgOiBzZWdtZW50c1swXS50O1xuICAgICAgICAgICAgaWYgKGVudHJ5LmZyYWdtZW50X2Fic29sdXRlX3RpbWUgPiAoc2VnbWVudFRpbWUgKyAobWFuaWZlc3QudGltZVNoaWZ0QnVmZmVyRGVwdGggKiB0aW1lc2NhbGUpKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGxvZ2dlci5kZWJ1ZygnZW50cnkgLSB0ID0gJywgKGVudHJ5LmZyYWdtZW50X2Fic29sdXRlX3RpbWUgLyB0aW1lc2NhbGUpKTtcblxuICAgICAgICAvLyBHZXQgbGFzdCBzZWdtZW50IHRpbWVcbiAgICAgICAgc2VnbWVudFRpbWUgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXS50TWFuaWZlc3QgPyBwYXJzZUZsb2F0KHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdLnRNYW5pZmVzdCkgOiBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXS50O1xuICAgICAgICAvLyBsb2dnZXIuZGVidWcoJ0xhc3Qgc2VnbWVudCAtIHQgPSAnLCAoc2VnbWVudFRpbWUgLyB0aW1lc2NhbGUpKTtcblxuICAgICAgICAvLyBDaGVjayBpZiB3ZSBoYXZlIHRvIGFwcGVuZCBuZXcgc2VnbWVudCB0byB0aW1lbGluZVxuICAgICAgICBpZiAoZW50cnkuZnJhZ21lbnRfYWJzb2x1dGVfdGltZSA8PSBzZWdtZW50VGltZSkge1xuICAgICAgICAgICAgLy8gVXBkYXRlIERWUiB3aW5kb3cgcmFuZ2UgPT4gc2V0IHJhbmdlIGVuZCB0byBlbmQgdGltZSBvZiBjdXJyZW50IHNlZ21lbnRcbiAgICAgICAgICAgIHJhbmdlID0ge1xuICAgICAgICAgICAgICAgIHN0YXJ0OiBzZWdtZW50c1swXS50IC8gdGltZXNjYWxlLFxuICAgICAgICAgICAgICAgIGVuZDogKHRmZHQuYmFzZU1lZGlhRGVjb2RlVGltZSAvIHRpbWVzY2FsZSkgKyByZXF1ZXN0LmR1cmF0aW9uXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB1cGRhdGVEVlIocmVxdWVzdC5tZWRpYVR5cGUsIHJhbmdlLCBzdHJlYW1Qcm9jZXNzb3IuZ2V0U3RyZWFtSW5mbygpLm1hbmlmZXN0SW5mbyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBsb2dnZXIuZGVidWcoJ0FkZCBuZXcgc2VnbWVudCAtIHQgPSAnLCAoZW50cnkuZnJhZ21lbnRfYWJzb2x1dGVfdGltZSAvIHRpbWVzY2FsZSkpO1xuICAgICAgICBzZWdtZW50ID0ge307XG4gICAgICAgIHNlZ21lbnQudCA9IGVudHJ5LmZyYWdtZW50X2Fic29sdXRlX3RpbWU7XG4gICAgICAgIHNlZ21lbnQuZCA9IGVudHJ5LmZyYWdtZW50X2R1cmF0aW9uO1xuICAgICAgICAvLyBJZiB0aW1lc3RhbXBzIHN0YXJ0cyBhdCAwIHJlbGF0aXZlIHRvIDFzdCBzZWdtZW50IChkeW5hbWljIHRvIHN0YXRpYykgdGhlbiB1cGRhdGUgc2VnbWVudCB0aW1lXG4gICAgICAgIGlmIChzZWdtZW50c1swXS50TWFuaWZlc3QpIHtcbiAgICAgICAgICAgIHNlZ21lbnQudCAtPSBwYXJzZUZsb2F0KHNlZ21lbnRzWzBdLnRNYW5pZmVzdCkgLSBzZWdtZW50c1swXS50O1xuICAgICAgICAgICAgc2VnbWVudC50TWFuaWZlc3QgPSBlbnRyeS5mcmFnbWVudF9hYnNvbHV0ZV90aW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGF0Y2ggcHJldmlvdXMgc2VnbWVudCBkdXJhdGlvblxuICAgICAgICBsZXQgbGFzdFNlZ21lbnQgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKGxhc3RTZWdtZW50LnQgKyBsYXN0U2VnbWVudC5kICE9PSBzZWdtZW50LnQpIHtcbiAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZygnUGF0Y2ggc2VnbWVudCBkdXJhdGlvbiAtIHQgPSAnLCBsYXN0U2VnbWVudC50ICsgJywgZCA9ICcgKyBsYXN0U2VnbWVudC5kICsgJyA9PiAnICsgKHNlZ21lbnQudCAtIGxhc3RTZWdtZW50LnQpKTtcbiAgICAgICAgICAgIGxhc3RTZWdtZW50LmQgPSBzZWdtZW50LnQgLSBsYXN0U2VnbWVudC50O1xuICAgICAgICB9XG5cbiAgICAgICAgc2VnbWVudHMucHVzaChzZWdtZW50KTtcblxuICAgICAgICAvLyBJbiBjYXNlIG9mIHN0YXRpYyBzdGFydC1vdmVyIHN0cmVhbXMsIHVwZGF0ZSBjb250ZW50IGR1cmF0aW9uXG4gICAgICAgIGlmIChtYW5pZmVzdC50eXBlID09PSAnc3RhdGljJykge1xuICAgICAgICAgICAgaWYgKHR5cGUgPT09ICd2aWRlbycpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50ID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgdmFyIGVuZCA9IChzZWdtZW50LnQgKyBzZWdtZW50LmQpIC8gdGltZXNjYWxlO1xuICAgICAgICAgICAgICAgIGlmIChlbmQgPiByZXByZXNlbnRhdGlvbi5hZGFwdGF0aW9uLnBlcmlvZC5kdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBldmVudEJ1cy50cmlnZ2VyKEV2ZW50cy5NQU5JRkVTVF9WQUxJRElUWV9DSEFOR0VELCB7IHNlbmRlcjogdGhpcywgbmV3RHVyYXRpb246IGVuZCB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gSW4gY2FzZSBvZiBsaXZlIHN0cmVhbXMsIHVwZGF0ZSBzZWdtZW50IHRpbWVsaW5lIGFjY29yZGluZyB0byBEVlIgd2luZG93XG4gICAgICAgIGVsc2UgaWYgKG1hbmlmZXN0LnRpbWVTaGlmdEJ1ZmZlckRlcHRoICYmIG1hbmlmZXN0LnRpbWVTaGlmdEJ1ZmZlckRlcHRoID4gMCkge1xuICAgICAgICAgICAgLy8gR2V0IHRpbWVzdGFtcCBvZiB0aGUgbGFzdCBzZWdtZW50XG4gICAgICAgICAgICBzZWdtZW50ID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICB0ID0gc2VnbWVudC50O1xuXG4gICAgICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIHNlZ21lbnRzJyBhdmFpbGFiaWxpdHkgc3RhcnQgdGltZVxuICAgICAgICAgICAgYXZhaWxhYmlsaXR5U3RhcnRUaW1lID0gTWF0aC5yb3VuZCgodCAtIChtYW5pZmVzdC50aW1lU2hpZnRCdWZmZXJEZXB0aCAqIHRpbWVzY2FsZSkpIC8gdGltZXNjYWxlKTtcblxuICAgICAgICAgICAgLy8gUmVtb3ZlIHNlZ21lbnRzIHByaW9yIHRvIGF2YWlsYWJpbGl0eSBzdGFydCB0aW1lXG4gICAgICAgICAgICBzZWdtZW50ID0gc2VnbWVudHNbMF07XG4gICAgICAgICAgICB3aGlsZSAoTWF0aC5yb3VuZChzZWdtZW50LnQgLyB0aW1lc2NhbGUpIDwgYXZhaWxhYmlsaXR5U3RhcnRUaW1lKSB7XG4gICAgICAgICAgICAgICAgLy8gbG9nZ2VyLmRlYnVnKCdSZW1vdmUgc2VnbWVudCAgLSB0ID0gJyArIChzZWdtZW50LnQgLyB0aW1lc2NhbGUpKTtcbiAgICAgICAgICAgICAgICBzZWdtZW50cy5zcGxpY2UoMCwgMSk7XG4gICAgICAgICAgICAgICAgc2VnbWVudCA9IHNlZ21lbnRzWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVcGRhdGUgRFZSIHdpbmRvdyByYW5nZSA9PiBzZXQgcmFuZ2UgZW5kIHRvIGVuZCB0aW1lIG9mIGN1cnJlbnQgc2VnbWVudFxuICAgICAgICAgICAgcmFuZ2UgPSB7XG4gICAgICAgICAgICAgICAgc3RhcnQ6IHNlZ21lbnRzWzBdLnQgLyB0aW1lc2NhbGUsXG4gICAgICAgICAgICAgICAgZW5kOiAodGZkdC5iYXNlTWVkaWFEZWNvZGVUaW1lIC8gdGltZXNjYWxlKSArIHJlcXVlc3QuZHVyYXRpb25cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHVwZGF0ZURWUih0eXBlLCByYW5nZSwgc3RyZWFtUHJvY2Vzc29yLmdldFN0cmVhbUluZm8oKS5tYW5pZmVzdEluZm8pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVwcmVzZW50YXRpb25Db250cm9sbGVyLnVwZGF0ZVJlcHJlc2VudGF0aW9uKHJlcHJlc2VudGF0aW9uLCB0cnVlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVEVlIodHlwZSwgcmFuZ2UsIG1hbmlmZXN0SW5mbykge1xuICAgICAgICBjb25zdCBkdnJJbmZvcyA9IGRhc2hNZXRyaWNzLmdldEN1cnJlbnREVlJJbmZvKHR5cGUpO1xuICAgICAgICBpZiAoIWR2ckluZm9zIHx8IChyYW5nZS5lbmQgPiBkdnJJbmZvcy5yYW5nZS5lbmQpKSB7XG4gICAgICAgICAgICBsb2dnZXIuZGVidWcoJ1VwZGF0ZSBEVlIgcmFuZ2U6IFsnICsgcmFuZ2Uuc3RhcnQgKyAnIC0gJyArIHJhbmdlLmVuZCArICddJyk7XG4gICAgICAgICAgICBkYXNoTWV0cmljcy5hZGREVlJJbmZvKHR5cGUsIHBsYXliYWNrQ29udHJvbGxlci5nZXRUaW1lKCksIG1hbmlmZXN0SW5mbywgcmFuZ2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBvZmZzZXQgb2YgdGhlIDFzdCBieXRlIG9mIGEgY2hpbGQgYm94IHdpdGhpbiBhIGNvbnRhaW5lciBib3hcbiAgICBmdW5jdGlvbiBnZXRCb3hPZmZzZXQocGFyZW50LCB0eXBlKSB7XG4gICAgICAgIGxldCBvZmZzZXQgPSA4O1xuICAgICAgICBsZXQgaSA9IDA7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHBhcmVudC5ib3hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHBhcmVudC5ib3hlc1tpXS50eXBlID09PSB0eXBlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9mZnNldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9mZnNldCArPSBwYXJlbnQuYm94ZXNbaV0uc2l6ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2Zmc2V0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbnZlcnRGcmFnbWVudChlLCBzdHJlYW1Qcm9jZXNzb3IpIHtcbiAgICAgICAgbGV0IGk7XG5cbiAgICAgICAgLy8gZS5yZXF1ZXN0IGNvbnRhaW5zIHJlcXVlc3QgZGVzY3JpcHRpb24gb2JqZWN0XG4gICAgICAgIC8vIGUucmVzcG9uc2UgY29udGFpbnMgZnJhZ21lbnQgYnl0ZXNcbiAgICAgICAgY29uc3QgaXNvRmlsZSA9IElTT0JveGVyLnBhcnNlQnVmZmVyKGUucmVzcG9uc2UpO1xuICAgICAgICAvLyBVcGRhdGUgdHJhY2tfSWQgaW4gdGZoZCBib3hcbiAgICAgICAgY29uc3QgdGZoZCA9IGlzb0ZpbGUuZmV0Y2goJ3RmaGQnKTtcbiAgICAgICAgdGZoZC50cmFja19JRCA9IGUucmVxdWVzdC5tZWRpYUluZm8uaW5kZXggKyAxO1xuXG4gICAgICAgIC8vIEFkZCB0ZmR0IGJveFxuICAgICAgICBsZXQgdGZkdCA9IGlzb0ZpbGUuZmV0Y2goJ3RmZHQnKTtcbiAgICAgICAgY29uc3QgdHJhZiA9IGlzb0ZpbGUuZmV0Y2goJ3RyYWYnKTtcbiAgICAgICAgaWYgKHRmZHQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRmZHQgPSBJU09Cb3hlci5jcmVhdGVGdWxsQm94KCd0ZmR0JywgdHJhZiwgdGZoZCk7XG4gICAgICAgICAgICB0ZmR0LnZlcnNpb24gPSAxO1xuICAgICAgICAgICAgdGZkdC5mbGFncyA9IDA7XG4gICAgICAgICAgICB0ZmR0LmJhc2VNZWRpYURlY29kZVRpbWUgPSBNYXRoLmZsb29yKGUucmVxdWVzdC5zdGFydFRpbWUgKiBlLnJlcXVlc3QudGltZXNjYWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRydW4gPSBpc29GaWxlLmZldGNoKCd0cnVuJyk7XG5cbiAgICAgICAgLy8gUHJvY2VzcyB0ZnhkIGJveGVzXG4gICAgICAgIC8vIFRoaXMgYm94IHByb3ZpZGUgYWJzb2x1dGUgdGltZXN0YW1wIGJ1dCB3ZSB0YWtlIHRoZSBzZWdtZW50IHN0YXJ0IHRpbWUgZm9yIHRmZHRcbiAgICAgICAgbGV0IHRmeGQgPSBpc29GaWxlLmZldGNoKCd0ZnhkJyk7XG4gICAgICAgIGlmICh0ZnhkKSB7XG4gICAgICAgICAgICB0ZnhkLl9wYXJlbnQuYm94ZXMuc3BsaWNlKHRmeGQuX3BhcmVudC5ib3hlcy5pbmRleE9mKHRmeGQpLCAxKTtcbiAgICAgICAgICAgIHRmeGQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0ZnJmID0gaXNvRmlsZS5mZXRjaCgndGZyZicpO1xuICAgICAgICBwcm9jZXNzVGZyZihlLnJlcXVlc3QsIHRmcmYsIHRmZHQsIHN0cmVhbVByb2Nlc3Nvcik7XG4gICAgICAgIGlmICh0ZnJmKSB7XG4gICAgICAgICAgICB0ZnJmLl9wYXJlbnQuYm94ZXMuc3BsaWNlKHRmcmYuX3BhcmVudC5ib3hlcy5pbmRleE9mKHRmcmYpLCAxKTtcbiAgICAgICAgICAgIHRmcmYgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgcHJvdGVjdGVkIGNvbnRlbnQgaW4gUElGRjEuMSBmb3JtYXQgKHNlcGlmZiBib3ggPSBTYW1wbGUgRW5jcnlwdGlvbiBQSUZGKVxuICAgICAgICAvLyA9PiBjb252ZXJ0IHNlcGlmZiBib3ggaXQgaW50byBhIHNlbmMgYm94XG4gICAgICAgIC8vID0+IGNyZWF0ZSBzYWlvIGFuZCBzYWl6IGJveGVzIChpZiBub3QgYWxyZWFkeSBwcmVzZW50KVxuICAgICAgICBjb25zdCBzZXBpZmYgPSBpc29GaWxlLmZldGNoKCdzZXBpZmYnKTtcbiAgICAgICAgaWYgKHNlcGlmZiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgc2VwaWZmLnR5cGUgPSAnc2VuYyc7XG4gICAgICAgICAgICBzZXBpZmYudXNlcnR5cGUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIGxldCBzYWlvID0gaXNvRmlsZS5mZXRjaCgnc2FpbycpO1xuICAgICAgICAgICAgaWYgKHNhaW8gPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgU2FtcGxlIEF1eGlsaWFyeSBJbmZvcm1hdGlvbiBPZmZzZXRzIEJveCBib3ggKHNhaW8pXG4gICAgICAgICAgICAgICAgc2FpbyA9IElTT0JveGVyLmNyZWF0ZUZ1bGxCb3goJ3NhaW8nLCB0cmFmKTtcbiAgICAgICAgICAgICAgICBzYWlvLnZlcnNpb24gPSAwO1xuICAgICAgICAgICAgICAgIHNhaW8uZmxhZ3MgPSAwO1xuICAgICAgICAgICAgICAgIHNhaW8uZW50cnlfY291bnQgPSAxO1xuICAgICAgICAgICAgICAgIHNhaW8ub2Zmc2V0ID0gWzBdO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc2FpeiA9IElTT0JveGVyLmNyZWF0ZUZ1bGxCb3goJ3NhaXonLCB0cmFmKTtcbiAgICAgICAgICAgICAgICBzYWl6LnZlcnNpb24gPSAwO1xuICAgICAgICAgICAgICAgIHNhaXouZmxhZ3MgPSAwO1xuICAgICAgICAgICAgICAgIHNhaXouc2FtcGxlX2NvdW50ID0gc2VwaWZmLnNhbXBsZV9jb3VudDtcbiAgICAgICAgICAgICAgICBzYWl6LmRlZmF1bHRfc2FtcGxlX2luZm9fc2l6ZSA9IDA7XG4gICAgICAgICAgICAgICAgc2Fpei5zYW1wbGVfaW5mb19zaXplID0gW107XG5cbiAgICAgICAgICAgICAgICBpZiAoc2VwaWZmLmZsYWdzICYgMHgwMikge1xuICAgICAgICAgICAgICAgICAgICAvLyBTdWItc2FtcGxlIGVuY3J5cHRpb24gPT4gc2V0IHNhbXBsZV9pbmZvX3NpemUgZm9yIGVhY2ggc2FtcGxlXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzZXBpZmYuc2FtcGxlX2NvdW50OyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIDEwID0gOCAoSW5pdGlhbGl6YXRpb25WZWN0b3IgZmllbGQgc2l6ZSkgKyAyIChzdWJzYW1wbGVfY291bnQgZmllbGQgc2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIDYgPSAyIChCeXRlc09mQ2xlYXJEYXRhIGZpZWxkIHNpemUpICsgNCAoQnl0ZXNPZkVuY3J5cHRlZERhdGEgZmllbGQgc2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhaXouc2FtcGxlX2luZm9fc2l6ZVtpXSA9IDEwICsgKDYgKiBzZXBpZmYuZW50cnlbaV0uTnVtYmVyT2ZFbnRyaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE5vIHN1Yi1zYW1wbGUgZW5jcnlwdGlvbiA9PiBzZXQgZGVmYXVsdCBzYW1wbGVfaW5mb19zaXplID0gSW5pdGlhbGl6YXRpb25WZWN0b3IgZmllbGQgc2l6ZSAoOClcbiAgICAgICAgICAgICAgICAgICAgc2Fpei5kZWZhdWx0X3NhbXBsZV9pbmZvX3NpemUgPSA4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRmaGQuZmxhZ3MgJj0gMHhGRkZGRkU7IC8vIHNldCB0ZmhkLmJhc2UtZGF0YS1vZmZzZXQtcHJlc2VudCB0byBmYWxzZVxuICAgICAgICB0ZmhkLmZsYWdzIHw9IDB4MDIwMDAwOyAvLyBzZXQgdGZoZC5kZWZhdWx0LWJhc2UtaXMtbW9vZiB0byB0cnVlXG4gICAgICAgIHRydW4uZmxhZ3MgfD0gMHgwMDAwMDE7IC8vIHNldCB0cnVuLmRhdGEtb2Zmc2V0LXByZXNlbnQgdG8gdHJ1ZVxuXG4gICAgICAgIC8vIFVwZGF0ZSB0cnVuLmRhdGFfb2Zmc2V0IGZpZWxkIHRoYXQgY29ycmVzcG9uZHMgdG8gZmlyc3QgZGF0YSBieXRlIChpbnNpZGUgbWRhdCBib3gpXG4gICAgICAgIGNvbnN0IG1vb2YgPSBpc29GaWxlLmZldGNoKCdtb29mJyk7XG4gICAgICAgIGxldCBsZW5ndGggPSBtb29mLmdldExlbmd0aCgpO1xuICAgICAgICB0cnVuLmRhdGFfb2Zmc2V0ID0gbGVuZ3RoICsgODtcblxuICAgICAgICAvLyBVcGRhdGUgc2FpbyBib3ggb2Zmc2V0IGZpZWxkIGFjY29yZGluZyB0byBuZXcgc2VuYyBib3ggb2Zmc2V0XG4gICAgICAgIGxldCBzYWlvID0gaXNvRmlsZS5mZXRjaCgnc2FpbycpO1xuICAgICAgICBpZiAoc2FpbyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IHRyYWZQb3NJbk1vb2YgPSBnZXRCb3hPZmZzZXQobW9vZiwgJ3RyYWYnKTtcbiAgICAgICAgICAgIGxldCBzZW5jUG9zSW5UcmFmID0gZ2V0Qm94T2Zmc2V0KHRyYWYsICdzZW5jJyk7XG4gICAgICAgICAgICAvLyBTZXQgb2Zmc2V0IGZyb20gYmVnaW4gZnJhZ21lbnQgdG8gdGhlIGZpcnN0IElWIGZpZWxkIGluIHNlbmMgYm94XG4gICAgICAgICAgICBzYWlvLm9mZnNldFswXSA9IHRyYWZQb3NJbk1vb2YgKyBzZW5jUG9zSW5UcmFmICsgMTY7IC8vIDE2ID0gYm94IGhlYWRlciAoMTIpICsgc2FtcGxlX2NvdW50IGZpZWxkIHNpemUgKDQpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBXcml0ZSB0cmFuc2Zvcm1lZC9wcm9jZXNzZWQgZnJhZ21lbnQgaW50byByZXF1ZXN0IHJlcG9uc2UgZGF0YVxuICAgICAgICBlLnJlc3BvbnNlID0gaXNvRmlsZS53cml0ZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVNlZ21lbnRMaXN0KGUsIHN0cmVhbVByb2Nlc3Nvcikge1xuICAgICAgICAvLyBlLnJlcXVlc3QgY29udGFpbnMgcmVxdWVzdCBkZXNjcmlwdGlvbiBvYmplY3RcbiAgICAgICAgLy8gZS5yZXNwb25zZSBjb250YWlucyBmcmFnbWVudCBieXRlc1xuICAgICAgICBpZiAoIWUucmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZS5yZXNwb25zZSBwYXJhbWV0ZXIgaXMgbWlzc2luZycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNvRmlsZSA9IElTT0JveGVyLnBhcnNlQnVmZmVyKGUucmVzcG9uc2UpO1xuICAgICAgICAvLyBVcGRhdGUgdHJhY2tfSWQgaW4gdGZoZCBib3hcbiAgICAgICAgY29uc3QgdGZoZCA9IGlzb0ZpbGUuZmV0Y2goJ3RmaGQnKTtcbiAgICAgICAgdGZoZC50cmFja19JRCA9IGUucmVxdWVzdC5tZWRpYUluZm8uaW5kZXggKyAxO1xuXG4gICAgICAgIC8vIEFkZCB0ZmR0IGJveFxuICAgICAgICBsZXQgdGZkdCA9IGlzb0ZpbGUuZmV0Y2goJ3RmZHQnKTtcbiAgICAgICAgbGV0IHRyYWYgPSBpc29GaWxlLmZldGNoKCd0cmFmJyk7XG4gICAgICAgIGlmICh0ZmR0ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0ZmR0ID0gSVNPQm94ZXIuY3JlYXRlRnVsbEJveCgndGZkdCcsIHRyYWYsIHRmaGQpO1xuICAgICAgICAgICAgdGZkdC52ZXJzaW9uID0gMTtcbiAgICAgICAgICAgIHRmZHQuZmxhZ3MgPSAwO1xuICAgICAgICAgICAgdGZkdC5iYXNlTWVkaWFEZWNvZGVUaW1lID0gTWF0aC5mbG9vcihlLnJlcXVlc3Quc3RhcnRUaW1lICogZS5yZXF1ZXN0LnRpbWVzY2FsZSk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGZyZiA9IGlzb0ZpbGUuZmV0Y2goJ3RmcmYnKTtcbiAgICAgICAgcHJvY2Vzc1RmcmYoZS5yZXF1ZXN0LCB0ZnJmLCB0ZmR0LCBzdHJlYW1Qcm9jZXNzb3IpO1xuICAgICAgICBpZiAodGZyZikge1xuICAgICAgICAgICAgdGZyZi5fcGFyZW50LmJveGVzLnNwbGljZSh0ZnJmLl9wYXJlbnQuYm94ZXMuaW5kZXhPZih0ZnJmKSwgMSk7XG4gICAgICAgICAgICB0ZnJmID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFR5cGUoKSB7XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cblxuICAgIGluc3RhbmNlID0ge1xuICAgICAgICBjb252ZXJ0RnJhZ21lbnQ6IGNvbnZlcnRGcmFnbWVudCxcbiAgICAgICAgdXBkYXRlU2VnbWVudExpc3Q6IHVwZGF0ZVNlZ21lbnRMaXN0LFxuICAgICAgICBnZXRUeXBlOiBnZXRUeXBlXG4gICAgfTtcblxuICAgIHNldHVwKCk7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5Nc3NGcmFnbWVudE1vb2ZQcm9jZXNzb3IuX19kYXNoanNfZmFjdG9yeV9uYW1lID0gJ01zc0ZyYWdtZW50TW9vZlByb2Nlc3Nvcic7XG5leHBvcnQgZGVmYXVsdCBkYXNoanMuRmFjdG9yeU1ha2VyLmdldENsYXNzRmFjdG9yeShNc3NGcmFnbWVudE1vb2ZQcm9jZXNzb3IpOyAvKiBqc2hpbnQgaWdub3JlOmxpbmUgKi9cbiIsIi8qKlxuICogVGhlIGNvcHlyaWdodCBpbiB0aGlzIHNvZnR3YXJlIGlzIGJlaW5nIG1hZGUgYXZhaWxhYmxlIHVuZGVyIHRoZSBCU0QgTGljZW5zZSxcbiAqIGluY2x1ZGVkIGJlbG93LiBUaGlzIHNvZnR3YXJlIG1heSBiZSBzdWJqZWN0IHRvIG90aGVyIHRoaXJkIHBhcnR5IGFuZCBjb250cmlidXRvclxuICogcmlnaHRzLCBpbmNsdWRpbmcgcGF0ZW50IHJpZ2h0cywgYW5kIG5vIHN1Y2ggcmlnaHRzIGFyZSBncmFudGVkIHVuZGVyIHRoaXMgbGljZW5zZS5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMsIERhc2ggSW5kdXN0cnkgRm9ydW0uXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dCBtb2RpZmljYXRpb24sXG4gKiBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXNcbiAqICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uIGFuZC9vclxuICogIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKiAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIERhc2ggSW5kdXN0cnkgRm9ydW0gbm9yIHRoZSBuYW1lcyBvZiBpdHNcbiAqICBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlXG4gKiAgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgQVMgSVMgQU5EIEFOWVxuICogIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqICBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuXG4gKiAgSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCxcbiAqICBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUXG4gKiAgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUlxuICogIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLFxuICogIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSlcbiAqICBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRVxuICogIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG4gaW1wb3J0IE1zc0Vycm9ycyBmcm9tICcuL2Vycm9ycy9Nc3NFcnJvcnMnO1xuXG4vKipcbiAqIEBtb2R1bGUgTXNzRnJhZ21lbnRNb292UHJvY2Vzc29yXG4gKiBAaWdub3JlXG4gKiBAcGFyYW0ge09iamVjdH0gY29uZmlnIG9iamVjdFxuICovXG5mdW5jdGlvbiBNc3NGcmFnbWVudE1vb3ZQcm9jZXNzb3IoY29uZmlnKSB7XG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIGNvbnN0IE5BTFVUWVBFX1NQUyA9IDc7XG4gICAgY29uc3QgTkFMVVRZUEVfUFBTID0gODtcbiAgICBjb25zdCBjb25zdGFudHMgPSBjb25maWcuY29uc3RhbnRzO1xuICAgIGNvbnN0IElTT0JveGVyID0gY29uZmlnLklTT0JveGVyO1xuXG4gICAgbGV0IHByb3RlY3Rpb25Db250cm9sbGVyID0gY29uZmlnLnByb3RlY3Rpb25Db250cm9sbGVyO1xuICAgIGxldCBpbnN0YW5jZSxcbiAgICAgICAgcGVyaW9kLFxuICAgICAgICBhZGFwdGF0aW9uU2V0LFxuICAgICAgICByZXByZXNlbnRhdGlvbixcbiAgICAgICAgY29udGVudFByb3RlY3Rpb24sXG4gICAgICAgIHRpbWVzY2FsZSxcbiAgICAgICAgdHJhY2tJZDtcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUZ0eXBCb3goaXNvRmlsZSkge1xuICAgICAgICBsZXQgZnR5cCA9IElTT0JveGVyLmNyZWF0ZUJveCgnZnR5cCcsIGlzb0ZpbGUpO1xuICAgICAgICBmdHlwLm1ham9yX2JyYW5kID0gJ2lzbzYnO1xuICAgICAgICBmdHlwLm1pbm9yX3ZlcnNpb24gPSAxOyAvLyBpcyBhbiBpbmZvcm1hdGl2ZSBpbnRlZ2VyIGZvciB0aGUgbWlub3IgdmVyc2lvbiBvZiB0aGUgbWFqb3IgYnJhbmRcbiAgICAgICAgZnR5cC5jb21wYXRpYmxlX2JyYW5kcyA9IFtdOyAvL2lzIGEgbGlzdCwgdG8gdGhlIGVuZCBvZiB0aGUgYm94LCBvZiBicmFuZHMgaXNvbSwgaXNvNiBhbmQgbXNkaFxuICAgICAgICBmdHlwLmNvbXBhdGlibGVfYnJhbmRzWzBdID0gJ2lzb20nOyAvLyA9PiBkZWNpbWFsIEFTQ0lJIHZhbHVlIGZvciBpc29tXG4gICAgICAgIGZ0eXAuY29tcGF0aWJsZV9icmFuZHNbMV0gPSAnaXNvNic7IC8vID0+IGRlY2ltYWwgQVNDSUkgdmFsdWUgZm9yIGlzbzZcbiAgICAgICAgZnR5cC5jb21wYXRpYmxlX2JyYW5kc1syXSA9ICdtc2RoJzsgLy8gPT4gZGVjaW1hbCBBU0NJSSB2YWx1ZSBmb3IgbXNkaFxuXG4gICAgICAgIHJldHVybiBmdHlwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZU1vb3ZCb3goaXNvRmlsZSkge1xuXG4gICAgICAgIC8vIG1vb3YgYm94XG4gICAgICAgIGxldCBtb292ID0gSVNPQm94ZXIuY3JlYXRlQm94KCdtb292JywgaXNvRmlsZSk7XG5cbiAgICAgICAgLy8gbW9vdi9tdmhkXG4gICAgICAgIGNyZWF0ZU12aGRCb3gobW9vdik7XG5cbiAgICAgICAgLy8gbW9vdi90cmFrXG4gICAgICAgIGxldCB0cmFrID0gSVNPQm94ZXIuY3JlYXRlQm94KCd0cmFrJywgbW9vdik7XG5cbiAgICAgICAgLy8gbW9vdi90cmFrL3RraGRcbiAgICAgICAgY3JlYXRlVGtoZEJveCh0cmFrKTtcblxuICAgICAgICAvLyBtb292L3RyYWsvbWRpYVxuICAgICAgICBsZXQgbWRpYSA9IElTT0JveGVyLmNyZWF0ZUJveCgnbWRpYScsIHRyYWspO1xuXG4gICAgICAgIC8vIG1vb3YvdHJhay9tZGlhL21kaGRcbiAgICAgICAgY3JlYXRlTWRoZEJveChtZGlhKTtcblxuICAgICAgICAvLyBtb292L3RyYWsvbWRpYS9oZGxyXG4gICAgICAgIGNyZWF0ZUhkbHJCb3gobWRpYSk7XG5cbiAgICAgICAgLy8gbW9vdi90cmFrL21kaWEvbWluZlxuICAgICAgICBsZXQgbWluZiA9IElTT0JveGVyLmNyZWF0ZUJveCgnbWluZicsIG1kaWEpO1xuXG4gICAgICAgIHN3aXRjaCAoYWRhcHRhdGlvblNldC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIGNvbnN0YW50cy5WSURFTzpcbiAgICAgICAgICAgICAgICAvLyBtb292L3RyYWsvbWRpYS9taW5mL3ZtaGRcbiAgICAgICAgICAgICAgICBjcmVhdGVWbWhkQm94KG1pbmYpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBjb25zdGFudHMuQVVESU86XG4gICAgICAgICAgICAgICAgLy8gbW9vdi90cmFrL21kaWEvbWluZi9zbWhkXG4gICAgICAgICAgICAgICAgY3JlYXRlU21oZEJveChtaW5mKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtb292L3RyYWsvbWRpYS9taW5mL2RpbmZcbiAgICAgICAgbGV0IGRpbmYgPSBJU09Cb3hlci5jcmVhdGVCb3goJ2RpbmYnLCBtaW5mKTtcblxuICAgICAgICAvLyBtb292L3RyYWsvbWRpYS9taW5mL2RpbmYvZHJlZlxuICAgICAgICBjcmVhdGVEcmVmQm94KGRpbmYpO1xuXG4gICAgICAgIC8vIG1vb3YvdHJhay9tZGlhL21pbmYvc3RibFxuICAgICAgICBsZXQgc3RibCA9IElTT0JveGVyLmNyZWF0ZUJveCgnc3RibCcsIG1pbmYpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBlbXB0eSBzdHRzLCBzdHNjLCBzdGNvIGFuZCBzdHN6IGJveGVzXG4gICAgICAgIC8vIFVzZSBkYXRhIGZpZWxkIGFzIGZvciBjb2RlbS1pc29ib3hlciB1bmtub3duIGJveGVzIGZvciBzZXR0aW5nIGZpZWxkcyB2YWx1ZVxuXG4gICAgICAgIC8vIG1vb3YvdHJhay9tZGlhL21pbmYvc3RibC9zdHRzXG4gICAgICAgIGxldCBzdHRzID0gSVNPQm94ZXIuY3JlYXRlRnVsbEJveCgnc3R0cycsIHN0YmwpO1xuICAgICAgICBzdHRzLl9kYXRhID0gWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdOyAvLyB2ZXJzaW9uID0gMCwgZmxhZ3MgPSAwLCBlbnRyeV9jb3VudCA9IDBcblxuICAgICAgICAvLyBtb292L3RyYWsvbWRpYS9taW5mL3N0Ymwvc3RzY1xuICAgICAgICBsZXQgc3RzYyA9IElTT0JveGVyLmNyZWF0ZUZ1bGxCb3goJ3N0c2MnLCBzdGJsKTtcbiAgICAgICAgc3RzYy5fZGF0YSA9IFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwXTsgLy8gdmVyc2lvbiA9IDAsIGZsYWdzID0gMCwgZW50cnlfY291bnQgPSAwXG5cbiAgICAgICAgLy8gbW9vdi90cmFrL21kaWEvbWluZi9zdGJsL3N0Y29cbiAgICAgICAgbGV0IHN0Y28gPSBJU09Cb3hlci5jcmVhdGVGdWxsQm94KCdzdGNvJywgc3RibCk7XG4gICAgICAgIHN0Y28uX2RhdGEgPSBbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF07IC8vIHZlcnNpb24gPSAwLCBmbGFncyA9IDAsIGVudHJ5X2NvdW50ID0gMFxuXG4gICAgICAgIC8vIG1vb3YvdHJhay9tZGlhL21pbmYvc3RibC9zdHN6XG4gICAgICAgIGxldCBzdHN6ID0gSVNPQm94ZXIuY3JlYXRlRnVsbEJveCgnc3RzeicsIHN0YmwpO1xuICAgICAgICBzdHN6Ll9kYXRhID0gWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdOyAvLyB2ZXJzaW9uID0gMCwgZmxhZ3MgPSAwLCBzYW1wbGVfc2l6ZSA9IDAsIHNhbXBsZV9jb3VudCA9IDBcblxuICAgICAgICAvLyBtb292L3RyYWsvbWRpYS9taW5mL3N0Ymwvc3RzZFxuICAgICAgICBjcmVhdGVTdHNkQm94KHN0YmwpO1xuXG4gICAgICAgIC8vIG1vb3YvbXZleFxuICAgICAgICBsZXQgbXZleCA9IElTT0JveGVyLmNyZWF0ZUJveCgnbXZleCcsIG1vb3YpO1xuXG4gICAgICAgIC8vIG1vb3YvbXZleC90cmV4XG4gICAgICAgIGNyZWF0ZVRyZXhCb3gobXZleCk7XG5cbiAgICAgICAgaWYgKGNvbnRlbnRQcm90ZWN0aW9uICYmIHByb3RlY3Rpb25Db250cm9sbGVyKSB7XG4gICAgICAgICAgICBsZXQgc3VwcG9ydGVkS1MgPSBwcm90ZWN0aW9uQ29udHJvbGxlci5nZXRTdXBwb3J0ZWRLZXlTeXN0ZW1zRnJvbUNvbnRlbnRQcm90ZWN0aW9uKGNvbnRlbnRQcm90ZWN0aW9uKTtcbiAgICAgICAgICAgIGNyZWF0ZVByb3RlY3Rpb25TeXN0ZW1TcGVjaWZpY0hlYWRlckJveChtb292LCBzdXBwb3J0ZWRLUyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVNdmhkQm94KG1vb3YpIHtcblxuICAgICAgICBsZXQgbXZoZCA9IElTT0JveGVyLmNyZWF0ZUZ1bGxCb3goJ212aGQnLCBtb292KTtcblxuICAgICAgICBtdmhkLnZlcnNpb24gPSAxOyAvLyB2ZXJzaW9uID0gMSAgaW4gb3JkZXIgdG8gaGF2ZSA2NGJpdHMgZHVyYXRpb24gdmFsdWVcblxuICAgICAgICBtdmhkLmNyZWF0aW9uX3RpbWUgPSAwOyAvLyB0aGUgY3JlYXRpb24gdGltZSBvZiB0aGUgcHJlc2VudGF0aW9uID0+IGlnbm9yZSAoc2V0IHRvIDApXG4gICAgICAgIG12aGQubW9kaWZpY2F0aW9uX3RpbWUgPSAwOyAvLyB0aGUgbW9zdCByZWNlbnQgdGltZSB0aGUgcHJlc2VudGF0aW9uIHdhcyBtb2RpZmllZCA9PiBpZ25vcmUgKHNldCB0byAwKVxuICAgICAgICBtdmhkLnRpbWVzY2FsZSA9IHRpbWVzY2FsZTsgLy8gdGhlIHRpbWUtc2NhbGUgZm9yIHRoZSBlbnRpcmUgcHJlc2VudGF0aW9uID0+IDEwMDAwMDAwIGZvciBNU1NcbiAgICAgICAgbXZoZC5kdXJhdGlvbiA9IHBlcmlvZC5kdXJhdGlvbiA9PT0gSW5maW5pdHkgPyAweEZGRkZGRkZGRkZGRkZGRkYgOiBNYXRoLnJvdW5kKHBlcmlvZC5kdXJhdGlvbiAqIHRpbWVzY2FsZSk7IC8vIHRoZSBsZW5ndGggb2YgdGhlIHByZXNlbnRhdGlvbiAoaW4gdGhlIGluZGljYXRlZCB0aW1lc2NhbGUpID0+ICB0YWtlIGR1cmF0aW9uIG9mIHBlcmlvZFxuICAgICAgICBtdmhkLnJhdGUgPSAxLjA7IC8vIDE2LjE2IG51bWJlciwgJzEuMCcgPSBub3JtYWwgcGxheWJhY2tcbiAgICAgICAgbXZoZC52b2x1bWUgPSAxLjA7IC8vIDguOCBudW1iZXIsICcxLjAnID0gZnVsbCB2b2x1bWVcbiAgICAgICAgbXZoZC5yZXNlcnZlZDEgPSAwO1xuICAgICAgICBtdmhkLnJlc2VydmVkMiA9IFsweDAsIDB4MF07XG4gICAgICAgIG12aGQubWF0cml4ID0gW1xuICAgICAgICAgICAgMSwgMCwgMCwgLy8gcHJvdmlkZXMgYSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggZm9yIHRoZSB2aWRlbztcbiAgICAgICAgICAgIDAsIDEsIDAsIC8vICh1LHYsdykgYXJlIHJlc3RyaWN0ZWQgaGVyZSB0byAoMCwwLDEpXG4gICAgICAgICAgICAwLCAwLCAxNjM4NFxuICAgICAgICBdO1xuICAgICAgICBtdmhkLnByZV9kZWZpbmVkID0gWzAsIDAsIDAsIDAsIDAsIDBdO1xuICAgICAgICBtdmhkLm5leHRfdHJhY2tfSUQgPSB0cmFja0lkICsgMTsgLy8gaW5kaWNhdGVzIGEgdmFsdWUgdG8gdXNlIGZvciB0aGUgdHJhY2sgSUQgb2YgdGhlIG5leHQgdHJhY2sgdG8gYmUgYWRkZWQgdG8gdGhpcyBwcmVzZW50YXRpb25cblxuICAgICAgICByZXR1cm4gbXZoZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVUa2hkQm94KHRyYWspIHtcblxuICAgICAgICBsZXQgdGtoZCA9IElTT0JveGVyLmNyZWF0ZUZ1bGxCb3goJ3RraGQnLCB0cmFrKTtcblxuICAgICAgICB0a2hkLnZlcnNpb24gPSAxOyAvLyB2ZXJzaW9uID0gMSAgaW4gb3JkZXIgdG8gaGF2ZSA2NGJpdHMgZHVyYXRpb24gdmFsdWVcbiAgICAgICAgdGtoZC5mbGFncyA9IDB4MSB8IC8vIFRyYWNrX2VuYWJsZWQgKDB4MDAwMDAxKTogSW5kaWNhdGVzIHRoYXQgdGhlIHRyYWNrIGlzIGVuYWJsZWRcbiAgICAgICAgICAgIDB4MiB8IC8vIFRyYWNrX2luX21vdmllICgweDAwMDAwMik6ICBJbmRpY2F0ZXMgdGhhdCB0aGUgdHJhY2sgaXMgdXNlZCBpbiB0aGUgcHJlc2VudGF0aW9uXG4gICAgICAgICAgICAweDQ7IC8vIFRyYWNrX2luX3ByZXZpZXcgKDB4MDAwMDA0KTogIEluZGljYXRlcyB0aGF0IHRoZSB0cmFjayBpcyB1c2VkIHdoZW4gcHJldmlld2luZyB0aGUgcHJlc2VudGF0aW9uXG5cbiAgICAgICAgdGtoZC5jcmVhdGlvbl90aW1lID0gMDsgLy8gdGhlIGNyZWF0aW9uIHRpbWUgb2YgdGhlIHByZXNlbnRhdGlvbiA9PiBpZ25vcmUgKHNldCB0byAwKVxuICAgICAgICB0a2hkLm1vZGlmaWNhdGlvbl90aW1lID0gMDsgLy8gdGhlIG1vc3QgcmVjZW50IHRpbWUgdGhlIHByZXNlbnRhdGlvbiB3YXMgbW9kaWZpZWQgPT4gaWdub3JlIChzZXQgdG8gMClcbiAgICAgICAgdGtoZC50cmFja19JRCA9IHRyYWNrSWQ7IC8vIHVuaXF1ZWx5IGlkZW50aWZpZXMgdGhpcyB0cmFjayBvdmVyIHRoZSBlbnRpcmUgbGlmZS10aW1lIG9mIHRoaXMgcHJlc2VudGF0aW9uXG4gICAgICAgIHRraGQucmVzZXJ2ZWQxID0gMDtcbiAgICAgICAgdGtoZC5kdXJhdGlvbiA9IHBlcmlvZC5kdXJhdGlvbiA9PT0gSW5maW5pdHkgPyAweEZGRkZGRkZGRkZGRkZGRkYgOiBNYXRoLnJvdW5kKHBlcmlvZC5kdXJhdGlvbiAqIHRpbWVzY2FsZSk7IC8vIHRoZSBkdXJhdGlvbiBvZiB0aGlzIHRyYWNrIChpbiB0aGUgdGltZXNjYWxlIGluZGljYXRlZCBpbiB0aGUgTW92aWUgSGVhZGVyIEJveCkgPT4gIHRha2UgZHVyYXRpb24gb2YgcGVyaW9kXG4gICAgICAgIHRraGQucmVzZXJ2ZWQyID0gWzB4MCwgMHgwXTtcbiAgICAgICAgdGtoZC5sYXllciA9IDA7IC8vIHNwZWNpZmllcyB0aGUgZnJvbnQtdG8tYmFjayBvcmRlcmluZyBvZiB2aWRlbyB0cmFja3M7IHRyYWNrcyB3aXRoIGxvd2VyIG51bWJlcnMgYXJlIGNsb3NlciB0byB0aGUgdmlld2VyID0+IDAgc2luY2Ugb25seSBvbmUgdmlkZW8gdHJhY2tcbiAgICAgICAgdGtoZC5hbHRlcm5hdGVfZ3JvdXAgPSAwOyAvLyBzcGVjaWZpZXMgYSBncm91cCBvciBjb2xsZWN0aW9uIG9mIHRyYWNrcyA9PiBpZ25vcmVcbiAgICAgICAgdGtoZC52b2x1bWUgPSAxLjA7IC8vICcxLjAnID0gZnVsbCB2b2x1bWVcbiAgICAgICAgdGtoZC5yZXNlcnZlZDMgPSAwO1xuICAgICAgICB0a2hkLm1hdHJpeCA9IFtcbiAgICAgICAgICAgIDEsIDAsIDAsIC8vIHByb3ZpZGVzIGEgdHJhbnNmb3JtYXRpb24gbWF0cml4IGZvciB0aGUgdmlkZW87XG4gICAgICAgICAgICAwLCAxLCAwLCAvLyAodSx2LHcpIGFyZSByZXN0cmljdGVkIGhlcmUgdG8gKDAsMCwxKVxuICAgICAgICAgICAgMCwgMCwgMTYzODRcbiAgICAgICAgXTtcbiAgICAgICAgdGtoZC53aWR0aCA9IHJlcHJlc2VudGF0aW9uLndpZHRoOyAvLyB2aXN1YWwgcHJlc2VudGF0aW9uIHdpZHRoXG4gICAgICAgIHRraGQuaGVpZ2h0ID0gcmVwcmVzZW50YXRpb24uaGVpZ2h0OyAvLyB2aXN1YWwgcHJlc2VudGF0aW9uIGhlaWdodFxuXG4gICAgICAgIHJldHVybiB0a2hkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZU1kaGRCb3gobWRpYSkge1xuXG4gICAgICAgIGxldCBtZGhkID0gSVNPQm94ZXIuY3JlYXRlRnVsbEJveCgnbWRoZCcsIG1kaWEpO1xuXG4gICAgICAgIG1kaGQudmVyc2lvbiA9IDE7IC8vIHZlcnNpb24gPSAxICBpbiBvcmRlciB0byBoYXZlIDY0Yml0cyBkdXJhdGlvbiB2YWx1ZVxuXG4gICAgICAgIG1kaGQuY3JlYXRpb25fdGltZSA9IDA7IC8vIHRoZSBjcmVhdGlvbiB0aW1lIG9mIHRoZSBwcmVzZW50YXRpb24gPT4gaWdub3JlIChzZXQgdG8gMClcbiAgICAgICAgbWRoZC5tb2RpZmljYXRpb25fdGltZSA9IDA7IC8vIHRoZSBtb3N0IHJlY2VudCB0aW1lIHRoZSBwcmVzZW50YXRpb24gd2FzIG1vZGlmaWVkID0+IGlnbm9yZSAoc2V0IHRvIDApXG4gICAgICAgIG1kaGQudGltZXNjYWxlID0gdGltZXNjYWxlOyAvLyB0aGUgdGltZS1zY2FsZSBmb3IgdGhlIGVudGlyZSBwcmVzZW50YXRpb25cbiAgICAgICAgbWRoZC5kdXJhdGlvbiA9IHBlcmlvZC5kdXJhdGlvbiA9PT0gSW5maW5pdHkgPyAweEZGRkZGRkZGRkZGRkZGRkYgOiBNYXRoLnJvdW5kKHBlcmlvZC5kdXJhdGlvbiAqIHRpbWVzY2FsZSk7IC8vIHRoZSBkdXJhdGlvbiBvZiB0aGlzIG1lZGlhIChpbiB0aGUgc2NhbGUgb2YgdGhlIHRpbWVzY2FsZSkuIElmIHRoZSBkdXJhdGlvbiBjYW5ub3QgYmUgZGV0ZXJtaW5lZCB0aGVuIGR1cmF0aW9uIGlzIHNldCB0byBhbGwgMXMuXG4gICAgICAgIG1kaGQubGFuZ3VhZ2UgPSBhZGFwdGF0aW9uU2V0LmxhbmcgfHwgJ3VuZCc7IC8vIGRlY2xhcmVzIHRoZSBsYW5ndWFnZSBjb2RlIGZvciB0aGlzIG1lZGlhXG4gICAgICAgIG1kaGQucHJlX2RlZmluZWQgPSAwO1xuXG4gICAgICAgIHJldHVybiBtZGhkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUhkbHJCb3gobWRpYSkge1xuXG4gICAgICAgIGxldCBoZGxyID0gSVNPQm94ZXIuY3JlYXRlRnVsbEJveCgnaGRscicsIG1kaWEpO1xuXG4gICAgICAgIGhkbHIucHJlX2RlZmluZWQgPSAwO1xuICAgICAgICBzd2l0Y2ggKGFkYXB0YXRpb25TZXQudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBjb25zdGFudHMuVklERU86XG4gICAgICAgICAgICAgICAgaGRsci5oYW5kbGVyX3R5cGUgPSAndmlkZSc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGNvbnN0YW50cy5BVURJTzpcbiAgICAgICAgICAgICAgICBoZGxyLmhhbmRsZXJfdHlwZSA9ICdzb3VuJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaGRsci5oYW5kbGVyX3R5cGUgPSAnbWV0YSc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaGRsci5uYW1lID0gcmVwcmVzZW50YXRpb24uaWQ7XG4gICAgICAgIGhkbHIucmVzZXJ2ZWQgPSBbMCwgMCwgMF07XG5cbiAgICAgICAgcmV0dXJuIGhkbHI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlVm1oZEJveChtaW5mKSB7XG5cbiAgICAgICAgbGV0IHZtaGQgPSBJU09Cb3hlci5jcmVhdGVGdWxsQm94KCd2bWhkJywgbWluZik7XG5cbiAgICAgICAgdm1oZC5mbGFncyA9IDE7XG5cbiAgICAgICAgdm1oZC5ncmFwaGljc21vZGUgPSAwOyAvLyBzcGVjaWZpZXMgYSBjb21wb3NpdGlvbiBtb2RlIGZvciB0aGlzIHZpZGVvIHRyYWNrLCBmcm9tIHRoZSBmb2xsb3dpbmcgZW51bWVyYXRlZCBzZXQsIHdoaWNoIG1heSBiZSBleHRlbmRlZCBieSBkZXJpdmVkIHNwZWNpZmljYXRpb25zOiBjb3B5ID0gMCBjb3B5IG92ZXIgdGhlIGV4aXN0aW5nIGltYWdlXG4gICAgICAgIHZtaGQub3Bjb2xvciA9IFswLCAwLCAwXTsgLy8gaXMgYSBzZXQgb2YgMyBjb2xvdXIgdmFsdWVzIChyZWQsIGdyZWVuLCBibHVlKSBhdmFpbGFibGUgZm9yIHVzZSBieSBncmFwaGljcyBtb2Rlc1xuXG4gICAgICAgIHJldHVybiB2bWhkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZVNtaGRCb3gobWluZikge1xuXG4gICAgICAgIGxldCBzbWhkID0gSVNPQm94ZXIuY3JlYXRlRnVsbEJveCgnc21oZCcsIG1pbmYpO1xuXG4gICAgICAgIHNtaGQuZmxhZ3MgPSAxO1xuXG4gICAgICAgIHNtaGQuYmFsYW5jZSA9IDA7IC8vIGlzIGEgZml4ZWQtcG9pbnQgOC44IG51bWJlciB0aGF0IHBsYWNlcyBtb25vIGF1ZGlvIHRyYWNrcyBpbiBhIHN0ZXJlbyBzcGFjZTsgMCBpcyBjZW50cmUgKHRoZSBub3JtYWwgdmFsdWUpOyBmdWxsIGxlZnQgaXMgLTEuMCBhbmQgZnVsbCByaWdodCBpcyAxLjAuXG4gICAgICAgIHNtaGQucmVzZXJ2ZWQgPSAwO1xuXG4gICAgICAgIHJldHVybiBzbWhkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZURyZWZCb3goZGluZikge1xuXG4gICAgICAgIGxldCBkcmVmID0gSVNPQm94ZXIuY3JlYXRlRnVsbEJveCgnZHJlZicsIGRpbmYpO1xuXG4gICAgICAgIGRyZWYuZW50cnlfY291bnQgPSAxO1xuICAgICAgICBkcmVmLmVudHJpZXMgPSBbXTtcblxuICAgICAgICBsZXQgdXJsID0gSVNPQm94ZXIuY3JlYXRlRnVsbEJveCgndXJsICcsIGRyZWYsIGZhbHNlKTtcbiAgICAgICAgdXJsLmxvY2F0aW9uID0gJyc7XG4gICAgICAgIHVybC5mbGFncyA9IDE7XG5cbiAgICAgICAgZHJlZi5lbnRyaWVzLnB1c2godXJsKTtcblxuICAgICAgICByZXR1cm4gZHJlZjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVTdHNkQm94KHN0YmwpIHtcblxuICAgICAgICBsZXQgc3RzZCA9IElTT0JveGVyLmNyZWF0ZUZ1bGxCb3goJ3N0c2QnLCBzdGJsKTtcblxuICAgICAgICBzdHNkLmVudHJpZXMgPSBbXTtcbiAgICAgICAgc3dpdGNoIChhZGFwdGF0aW9uU2V0LnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgY29uc3RhbnRzLlZJREVPOlxuICAgICAgICAgICAgY2FzZSBjb25zdGFudHMuQVVESU86XG4gICAgICAgICAgICAgICAgc3RzZC5lbnRyaWVzLnB1c2goY3JlYXRlU2FtcGxlRW50cnkoc3RzZCkpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHN0c2QuZW50cnlfY291bnQgPSBzdHNkLmVudHJpZXMubGVuZ3RoOyAvLyBpcyBhbiBpbnRlZ2VyIHRoYXQgY291bnRzIHRoZSBhY3R1YWwgZW50cmllc1xuICAgICAgICByZXR1cm4gc3RzZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVTYW1wbGVFbnRyeShzdHNkKSB7XG4gICAgICAgIGxldCBjb2RlYyA9IHJlcHJlc2VudGF0aW9uLmNvZGVjcy5zdWJzdHJpbmcoMCwgcmVwcmVzZW50YXRpb24uY29kZWNzLmluZGV4T2YoJy4nKSk7XG5cbiAgICAgICAgc3dpdGNoIChjb2RlYykge1xuICAgICAgICAgICAgY2FzZSAnYXZjMSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUFWQ1Zpc3VhbFNhbXBsZUVudHJ5KHN0c2QsIGNvZGVjKTtcbiAgICAgICAgICAgIGNhc2UgJ21wNGEnOlxuICAgICAgICAgICAgICAgIHJldHVybiBjcmVhdGVNUDRBdWRpb1NhbXBsZUVudHJ5KHN0c2QsIGNvZGVjKTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cge1xuICAgICAgICAgICAgICAgICAgICBjb2RlOiBNc3NFcnJvcnMuTVNTX1VOU1VQUE9SVEVEX0NPREVDX0NPREUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IE1zc0Vycm9ycy5NU1NfVU5TVVBQT1JURURfQ09ERUNfTUVTU0FHRSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29kZWM6IGNvZGVjXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQVZDVmlzdWFsU2FtcGxlRW50cnkoc3RzZCwgY29kZWMpIHtcbiAgICAgICAgbGV0IGF2YzE7XG5cbiAgICAgICAgaWYgKGNvbnRlbnRQcm90ZWN0aW9uKSB7XG4gICAgICAgICAgICBhdmMxID0gSVNPQm94ZXIuY3JlYXRlQm94KCdlbmN2Jywgc3RzZCwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXZjMSA9IElTT0JveGVyLmNyZWF0ZUJveCgnYXZjMScsIHN0c2QsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNhbXBsZUVudHJ5IGZpZWxkc1xuICAgICAgICBhdmMxLnJlc2VydmVkMSA9IFsweDAsIDB4MCwgMHgwLCAweDAsIDB4MCwgMHgwXTtcbiAgICAgICAgYXZjMS5kYXRhX3JlZmVyZW5jZV9pbmRleCA9IDE7XG5cbiAgICAgICAgLy8gVmlzdWFsU2FtcGxlRW50cnkgZmllbGRzXG4gICAgICAgIGF2YzEucHJlX2RlZmluZWQxID0gMDtcbiAgICAgICAgYXZjMS5yZXNlcnZlZDIgPSAwO1xuICAgICAgICBhdmMxLnByZV9kZWZpbmVkMiA9IFswLCAwLCAwXTtcbiAgICAgICAgYXZjMS5oZWlnaHQgPSByZXByZXNlbnRhdGlvbi5oZWlnaHQ7XG4gICAgICAgIGF2YzEud2lkdGggPSByZXByZXNlbnRhdGlvbi53aWR0aDtcbiAgICAgICAgYXZjMS5ob3JpenJlc29sdXRpb24gPSA3MjsgLy8gNzIgZHBpXG4gICAgICAgIGF2YzEudmVydHJlc29sdXRpb24gPSA3MjsgLy8gNzIgZHBpXG4gICAgICAgIGF2YzEucmVzZXJ2ZWQzID0gMDtcbiAgICAgICAgYXZjMS5mcmFtZV9jb3VudCA9IDE7IC8vIDEgY29tcHJlc3NlZCB2aWRlbyBmcmFtZSBwZXIgc2FtcGxlXG4gICAgICAgIGF2YzEuY29tcHJlc3Nvcm5hbWUgPSBbXG4gICAgICAgICAgICAweDBBLCAweDQxLCAweDU2LCAweDQzLCAweDIwLCAweDQzLCAweDZGLCAweDY0LCAvLyA9ICdBVkMgQ29kaW5nJztcbiAgICAgICAgICAgIDB4NjksIDB4NkUsIDB4NjcsIDB4MDAsIDB4MDAsIDB4MDAsIDB4MDAsIDB4MDAsXG4gICAgICAgICAgICAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLCAweDAwLFxuICAgICAgICAgICAgMHgwMCwgMHgwMCwgMHgwMCwgMHgwMCwgMHgwMCwgMHgwMCwgMHgwMCwgMHgwMFxuICAgICAgICBdO1xuICAgICAgICBhdmMxLmRlcHRoID0gMHgwMDE4OyAvLyAweDAwMTgg4oCTIGltYWdlcyBhcmUgaW4gY29sb3VyIHdpdGggbm8gYWxwaGEuXG4gICAgICAgIGF2YzEucHJlX2RlZmluZWQzID0gNjU1MzU7XG4gICAgICAgIGF2YzEuY29uZmlnID0gY3JlYXRlQVZDMUNvbmZpZ3VyYXRpb25SZWNvcmQoKTtcbiAgICAgICAgaWYgKGNvbnRlbnRQcm90ZWN0aW9uKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgYW5kIGFkZCBQcm90ZWN0aW9uIFNjaGVtZSBJbmZvIEJveFxuICAgICAgICAgICAgbGV0IHNpbmYgPSBJU09Cb3hlci5jcmVhdGVCb3goJ3NpbmYnLCBhdmMxKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGFuZCBhZGQgT3JpZ2luYWwgRm9ybWF0IEJveCA9PiBpbmRpY2F0ZSBjb2RlYyB0eXBlIG9mIHRoZSBlbmNyeXB0ZWQgY29udGVudFxuICAgICAgICAgICAgY3JlYXRlT3JpZ2luYWxGb3JtYXRCb3goc2luZiwgY29kZWMpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgYW5kIGFkZCBTY2hlbWUgVHlwZSBib3hcbiAgICAgICAgICAgIGNyZWF0ZVNjaGVtZVR5cGVCb3goc2luZik7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhbmQgYWRkIFNjaGVtZSBJbmZvcm1hdGlvbiBCb3hcbiAgICAgICAgICAgIGNyZWF0ZVNjaGVtZUluZm9ybWF0aW9uQm94KHNpbmYpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGF2YzE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQVZDMUNvbmZpZ3VyYXRpb25SZWNvcmQoKSB7XG5cbiAgICAgICAgbGV0IGF2Y0MgPSBudWxsO1xuICAgICAgICBsZXQgYXZjQ0xlbmd0aCA9IDE1OyAvLyBsZW5ndGggPSAxNSBieSBkZWZhdWx0ICgwIFNQUyBhbmQgMCBQUFMpXG5cbiAgICAgICAgLy8gRmlyc3QgZ2V0IGFsbCBTUFMgYW5kIFBQUyBmcm9tIGNvZGVjUHJpdmF0ZURhdGFcbiAgICAgICAgbGV0IHNwcyA9IFtdO1xuICAgICAgICBsZXQgcHBzID0gW107XG4gICAgICAgIGxldCBBVkNQcm9maWxlSW5kaWNhdGlvbiA9IDA7XG4gICAgICAgIGxldCBBVkNMZXZlbEluZGljYXRpb24gPSAwO1xuICAgICAgICBsZXQgcHJvZmlsZV9jb21wYXRpYmlsaXR5ID0gMDtcblxuICAgICAgICBsZXQgbmFsdXMgPSByZXByZXNlbnRhdGlvbi5jb2RlY1ByaXZhdGVEYXRhLnNwbGl0KCcwMDAwMDAwMScpLnNsaWNlKDEpO1xuICAgICAgICBsZXQgbmFsdUJ5dGVzLCBuYWx1VHlwZTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5hbHVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBuYWx1Qnl0ZXMgPSBoZXhTdHJpbmd0b0J1ZmZlcihuYWx1c1tpXSk7XG5cbiAgICAgICAgICAgIG5hbHVUeXBlID0gbmFsdUJ5dGVzWzBdICYgMHgxRjtcblxuICAgICAgICAgICAgc3dpdGNoIChuYWx1VHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgTkFMVVRZUEVfU1BTOlxuICAgICAgICAgICAgICAgICAgICBzcHMucHVzaChuYWx1Qnl0ZXMpO1xuICAgICAgICAgICAgICAgICAgICBhdmNDTGVuZ3RoICs9IG5hbHVCeXRlcy5sZW5ndGggKyAyOyAvLyAyID0gc2VxdWVuY2VQYXJhbWV0ZXJTZXRMZW5ndGggZmllbGQgbGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgTkFMVVRZUEVfUFBTOlxuICAgICAgICAgICAgICAgICAgICBwcHMucHVzaChuYWx1Qnl0ZXMpO1xuICAgICAgICAgICAgICAgICAgICBhdmNDTGVuZ3RoICs9IG5hbHVCeXRlcy5sZW5ndGggKyAyOyAvLyAyID0gcGljdHVyZVBhcmFtZXRlclNldExlbmd0aCBmaWVsZCBsZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgcHJvZmlsZSBhbmQgbGV2ZWwgZnJvbSBTUFNcbiAgICAgICAgaWYgKHNwcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBBVkNQcm9maWxlSW5kaWNhdGlvbiA9IHNwc1swXVsxXTtcbiAgICAgICAgICAgIHByb2ZpbGVfY29tcGF0aWJpbGl0eSA9IHNwc1swXVsyXTtcbiAgICAgICAgICAgIEFWQ0xldmVsSW5kaWNhdGlvbiA9IHNwc1swXVszXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdlbmVyYXRlIGF2Y0MgYnVmZmVyXG4gICAgICAgIGF2Y0MgPSBuZXcgVWludDhBcnJheShhdmNDTGVuZ3RoKTtcblxuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIC8vIGxlbmd0aFxuICAgICAgICBhdmNDW2krK10gPSAoYXZjQ0xlbmd0aCAmIDB4RkYwMDAwMDApID4+IDI0O1xuICAgICAgICBhdmNDW2krK10gPSAoYXZjQ0xlbmd0aCAmIDB4MDBGRjAwMDApID4+IDE2O1xuICAgICAgICBhdmNDW2krK10gPSAoYXZjQ0xlbmd0aCAmIDB4MDAwMEZGMDApID4+IDg7XG4gICAgICAgIGF2Y0NbaSsrXSA9IChhdmNDTGVuZ3RoICYgMHgwMDAwMDBGRik7XG4gICAgICAgIGF2Y0Muc2V0KFsweDYxLCAweDc2LCAweDYzLCAweDQzXSwgaSk7IC8vIHR5cGUgPSAnYXZjQydcbiAgICAgICAgaSArPSA0O1xuICAgICAgICBhdmNDW2krK10gPSAxOyAvLyBjb25maWd1cmF0aW9uVmVyc2lvbiA9IDFcbiAgICAgICAgYXZjQ1tpKytdID0gQVZDUHJvZmlsZUluZGljYXRpb247XG4gICAgICAgIGF2Y0NbaSsrXSA9IHByb2ZpbGVfY29tcGF0aWJpbGl0eTtcbiAgICAgICAgYXZjQ1tpKytdID0gQVZDTGV2ZWxJbmRpY2F0aW9uO1xuICAgICAgICBhdmNDW2krK10gPSAweEZGOyAvLyAnMTExMTEnICsgbGVuZ3RoU2l6ZU1pbnVzT25lID0gM1xuICAgICAgICBhdmNDW2krK10gPSAweEUwIHwgc3BzLmxlbmd0aDsgLy8gJzExMScgKyBudW1PZlNlcXVlbmNlUGFyYW1ldGVyU2V0c1xuICAgICAgICBmb3IgKGxldCBuID0gMDsgbiA8IHNwcy5sZW5ndGg7IG4rKykge1xuICAgICAgICAgICAgYXZjQ1tpKytdID0gKHNwc1tuXS5sZW5ndGggJiAweEZGMDApID4+IDg7XG4gICAgICAgICAgICBhdmNDW2krK10gPSAoc3BzW25dLmxlbmd0aCAmIDB4MDBGRik7XG4gICAgICAgICAgICBhdmNDLnNldChzcHNbbl0sIGkpO1xuICAgICAgICAgICAgaSArPSBzcHNbbl0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIGF2Y0NbaSsrXSA9IHBwcy5sZW5ndGg7IC8vIG51bU9mUGljdHVyZVBhcmFtZXRlclNldHNcbiAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCBwcHMubGVuZ3RoOyBuKyspIHtcbiAgICAgICAgICAgIGF2Y0NbaSsrXSA9IChwcHNbbl0ubGVuZ3RoICYgMHhGRjAwKSA+PiA4O1xuICAgICAgICAgICAgYXZjQ1tpKytdID0gKHBwc1tuXS5sZW5ndGggJiAweDAwRkYpO1xuICAgICAgICAgICAgYXZjQy5zZXQocHBzW25dLCBpKTtcbiAgICAgICAgICAgIGkgKz0gcHBzW25dLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhdmNDO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZU1QNEF1ZGlvU2FtcGxlRW50cnkoc3RzZCwgY29kZWMpIHtcbiAgICAgICAgbGV0IG1wNGE7XG5cbiAgICAgICAgaWYgKGNvbnRlbnRQcm90ZWN0aW9uKSB7XG4gICAgICAgICAgICBtcDRhID0gSVNPQm94ZXIuY3JlYXRlQm94KCdlbmNhJywgc3RzZCwgZmFsc2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbXA0YSA9IElTT0JveGVyLmNyZWF0ZUJveCgnbXA0YScsIHN0c2QsIGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNhbXBsZUVudHJ5IGZpZWxkc1xuICAgICAgICBtcDRhLnJlc2VydmVkMSA9IFsweDAsIDB4MCwgMHgwLCAweDAsIDB4MCwgMHgwXTtcbiAgICAgICAgbXA0YS5kYXRhX3JlZmVyZW5jZV9pbmRleCA9IDE7XG5cbiAgICAgICAgLy8gQXVkaW9TYW1wbGVFbnRyeSBmaWVsZHNcbiAgICAgICAgbXA0YS5yZXNlcnZlZDIgPSBbMHgwLCAweDBdO1xuICAgICAgICBtcDRhLmNoYW5uZWxjb3VudCA9IHJlcHJlc2VudGF0aW9uLmF1ZGlvQ2hhbm5lbHM7XG4gICAgICAgIG1wNGEuc2FtcGxlc2l6ZSA9IDE2O1xuICAgICAgICBtcDRhLnByZV9kZWZpbmVkID0gMDtcbiAgICAgICAgbXA0YS5yZXNlcnZlZF8zID0gMDtcbiAgICAgICAgbXA0YS5zYW1wbGVyYXRlID0gcmVwcmVzZW50YXRpb24uYXVkaW9TYW1wbGluZ1JhdGUgPDwgMTY7XG5cbiAgICAgICAgbXA0YS5lc2RzID0gY3JlYXRlTVBFRzRBQUNFU0Rlc2NyaXB0b3IoKTtcblxuICAgICAgICBpZiAoY29udGVudFByb3RlY3Rpb24pIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhbmQgYWRkIFByb3RlY3Rpb24gU2NoZW1lIEluZm8gQm94XG4gICAgICAgICAgICBsZXQgc2luZiA9IElTT0JveGVyLmNyZWF0ZUJveCgnc2luZicsIG1wNGEpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgYW5kIGFkZCBPcmlnaW5hbCBGb3JtYXQgQm94ID0+IGluZGljYXRlIGNvZGVjIHR5cGUgb2YgdGhlIGVuY3J5cHRlZCBjb250ZW50XG4gICAgICAgICAgICBjcmVhdGVPcmlnaW5hbEZvcm1hdEJveChzaW5mLCBjb2RlYyk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhbmQgYWRkIFNjaGVtZSBUeXBlIGJveFxuICAgICAgICAgICAgY3JlYXRlU2NoZW1lVHlwZUJveChzaW5mKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGFuZCBhZGQgU2NoZW1lIEluZm9ybWF0aW9uIEJveFxuICAgICAgICAgICAgY3JlYXRlU2NoZW1lSW5mb3JtYXRpb25Cb3goc2luZik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbXA0YTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVNUEVHNEFBQ0VTRGVzY3JpcHRvcigpIHtcblxuICAgICAgICAvLyBBdWRpb1NwZWNpZmljQ29uZmlnIChzZWUgSVNPL0lFQyAxNDQ5Ni0zLCBzdWJwYXJ0IDEpID0+IGNvcnJlc3BvbmRzIHRvIGhleCBieXRlcyBjb250YWluZWQgaW4gJ2NvZGVjUHJpdmF0ZURhdGEnIGZpZWxkXG4gICAgICAgIGxldCBhdWRpb1NwZWNpZmljQ29uZmlnID0gaGV4U3RyaW5ndG9CdWZmZXIocmVwcmVzZW50YXRpb24uY29kZWNQcml2YXRlRGF0YSk7XG5cbiAgICAgICAgLy8gRVNEUyBsZW5ndGggPSBlc2RzIGJveCBoZWFkZXIgbGVuZ3RoICg9IDEyKSArXG4gICAgICAgIC8vICAgICAgICAgICAgICAgRVNfRGVzY3JpcHRvciBoZWFkZXIgbGVuZ3RoICg9IDUpICtcbiAgICAgICAgLy8gICAgICAgICAgICAgICBEZWNvZGVyQ29uZmlnRGVzY3JpcHRvciBoZWFkZXIgbGVuZ3RoICg9IDE1KSArXG4gICAgICAgIC8vICAgICAgICAgICAgICAgZGVjb2RlclNwZWNpZmljSW5mbyBoZWFkZXIgbGVuZ3RoICg9IDIpICtcbiAgICAgICAgLy8gICAgICAgICAgICAgICBBdWRpb1NwZWNpZmljQ29uZmlnIGxlbmd0aCAoPSBjb2RlY1ByaXZhdGVEYXRhIGxlbmd0aClcbiAgICAgICAgbGV0IGVzZHNMZW5ndGggPSAzNCArIGF1ZGlvU3BlY2lmaWNDb25maWcubGVuZ3RoO1xuICAgICAgICBsZXQgZXNkcyA9IG5ldyBVaW50OEFycmF5KGVzZHNMZW5ndGgpO1xuXG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgLy8gZXNkcyBib3hcbiAgICAgICAgZXNkc1tpKytdID0gKGVzZHNMZW5ndGggJiAweEZGMDAwMDAwKSA+PiAyNDsgLy8gZXNkcyBib3ggbGVuZ3RoXG4gICAgICAgIGVzZHNbaSsrXSA9IChlc2RzTGVuZ3RoICYgMHgwMEZGMDAwMCkgPj4gMTY7IC8vICcnXG4gICAgICAgIGVzZHNbaSsrXSA9IChlc2RzTGVuZ3RoICYgMHgwMDAwRkYwMCkgPj4gODsgLy8gJydcbiAgICAgICAgZXNkc1tpKytdID0gKGVzZHNMZW5ndGggJiAweDAwMDAwMEZGKTsgLy8gJydcbiAgICAgICAgZXNkcy5zZXQoWzB4NjUsIDB4NzMsIDB4NjQsIDB4NzNdLCBpKTsgLy8gdHlwZSA9ICdlc2RzJ1xuICAgICAgICBpICs9IDQ7XG4gICAgICAgIGVzZHMuc2V0KFswLCAwLCAwLCAwXSwgaSk7IC8vIHZlcnNpb24gPSAwLCBmbGFncyA9IDBcbiAgICAgICAgaSArPSA0O1xuICAgICAgICAvLyBFU19EZXNjcmlwdG9yIChzZWUgSVNPL0lFQyAxNDQ5Ni0xIChTeXN0ZW1zKSlcbiAgICAgICAgZXNkc1tpKytdID0gMHgwMzsgLy8gdGFnID0gMHgwMyAoRVNfRGVzY3JUYWcpXG4gICAgICAgIGVzZHNbaSsrXSA9IDIwICsgYXVkaW9TcGVjaWZpY0NvbmZpZy5sZW5ndGg7IC8vIHNpemVcbiAgICAgICAgZXNkc1tpKytdID0gKHRyYWNrSWQgJiAweEZGMDApID4+IDg7IC8vIEVTX0lEID0gdHJhY2tfaWRcbiAgICAgICAgZXNkc1tpKytdID0gKHRyYWNrSWQgJiAweDAwRkYpOyAvLyAnJ1xuICAgICAgICBlc2RzW2krK10gPSAwOyAvLyBmbGFncyBhbmQgc3RyZWFtUHJpb3JpdHlcblxuICAgICAgICAvLyBEZWNvZGVyQ29uZmlnRGVzY3JpcHRvciAoc2VlIElTTy9JRUMgMTQ0OTYtMSAoU3lzdGVtcykpXG4gICAgICAgIGVzZHNbaSsrXSA9IDB4MDQ7IC8vIHRhZyA9IDB4MDQgKERlY29kZXJDb25maWdEZXNjclRhZylcbiAgICAgICAgZXNkc1tpKytdID0gMTUgKyBhdWRpb1NwZWNpZmljQ29uZmlnLmxlbmd0aDsgLy8gc2l6ZVxuICAgICAgICBlc2RzW2krK10gPSAweDQwOyAvLyBvYmplY3RUeXBlSW5kaWNhdGlvbiA9IDB4NDAgKE1QRUctNCBBQUMpXG4gICAgICAgIGVzZHNbaV0gPSAweDA1IDw8IDI7IC8vIHN0cmVhbVR5cGUgPSAweDA1IChBdWRpb3N0cmVhbSlcbiAgICAgICAgZXNkc1tpXSB8PSAwIDw8IDE7IC8vIHVwU3RyZWFtID0gMFxuICAgICAgICBlc2RzW2krK10gfD0gMTsgLy8gcmVzZXJ2ZWQgPSAxXG4gICAgICAgIGVzZHNbaSsrXSA9IDB4RkY7IC8vIGJ1ZmZlcnNpemVEQiA9IHVuZGVmaW5lZFxuICAgICAgICBlc2RzW2krK10gPSAweEZGOyAvLyAnJ1xuICAgICAgICBlc2RzW2krK10gPSAweEZGOyAvLyAnJ1xuICAgICAgICBlc2RzW2krK10gPSAocmVwcmVzZW50YXRpb24uYmFuZHdpZHRoICYgMHhGRjAwMDAwMCkgPj4gMjQ7IC8vIG1heEJpdHJhdGVcbiAgICAgICAgZXNkc1tpKytdID0gKHJlcHJlc2VudGF0aW9uLmJhbmR3aWR0aCAmIDB4MDBGRjAwMDApID4+IDE2OyAvLyAnJ1xuICAgICAgICBlc2RzW2krK10gPSAocmVwcmVzZW50YXRpb24uYmFuZHdpZHRoICYgMHgwMDAwRkYwMCkgPj4gODsgLy8gJydcbiAgICAgICAgZXNkc1tpKytdID0gKHJlcHJlc2VudGF0aW9uLmJhbmR3aWR0aCAmIDB4MDAwMDAwRkYpOyAvLyAnJ1xuICAgICAgICBlc2RzW2krK10gPSAocmVwcmVzZW50YXRpb24uYmFuZHdpZHRoICYgMHhGRjAwMDAwMCkgPj4gMjQ7IC8vIGF2Z2JpdHJhdGVcbiAgICAgICAgZXNkc1tpKytdID0gKHJlcHJlc2VudGF0aW9uLmJhbmR3aWR0aCAmIDB4MDBGRjAwMDApID4+IDE2OyAvLyAnJ1xuICAgICAgICBlc2RzW2krK10gPSAocmVwcmVzZW50YXRpb24uYmFuZHdpZHRoICYgMHgwMDAwRkYwMCkgPj4gODsgLy8gJydcbiAgICAgICAgZXNkc1tpKytdID0gKHJlcHJlc2VudGF0aW9uLmJhbmR3aWR0aCAmIDB4MDAwMDAwRkYpOyAvLyAnJ1xuXG4gICAgICAgIC8vIERlY29kZXJTcGVjaWZpY0luZm8gKHNlZSBJU08vSUVDIDE0NDk2LTEgKFN5c3RlbXMpKVxuICAgICAgICBlc2RzW2krK10gPSAweDA1OyAvLyB0YWcgPSAweDA1IChEZWNTcGVjaWZpY0luZm9UYWcpXG4gICAgICAgIGVzZHNbaSsrXSA9IGF1ZGlvU3BlY2lmaWNDb25maWcubGVuZ3RoOyAvLyBzaXplXG4gICAgICAgIGVzZHMuc2V0KGF1ZGlvU3BlY2lmaWNDb25maWcsIGkpOyAvLyBBdWRpb1NwZWNpZmljQ29uZmlnIGJ5dGVzXG5cbiAgICAgICAgcmV0dXJuIGVzZHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlT3JpZ2luYWxGb3JtYXRCb3goc2luZiwgY29kZWMpIHtcbiAgICAgICAgbGV0IGZybWEgPSBJU09Cb3hlci5jcmVhdGVCb3goJ2ZybWEnLCBzaW5mKTtcbiAgICAgICAgZnJtYS5kYXRhX2Zvcm1hdCA9IHN0cmluZ1RvQ2hhckNvZGUoY29kZWMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZVNjaGVtZVR5cGVCb3goc2luZikge1xuICAgICAgICBsZXQgc2NobSA9IElTT0JveGVyLmNyZWF0ZUZ1bGxCb3goJ3NjaG0nLCBzaW5mKTtcblxuICAgICAgICBzY2htLmZsYWdzID0gMDtcbiAgICAgICAgc2NobS52ZXJzaW9uID0gMDtcbiAgICAgICAgc2NobS5zY2hlbWVfdHlwZSA9IDB4NjM2NTZFNjM7IC8vICdjZW5jJyA9PiBjb21tb24gZW5jcnlwdGlvblxuICAgICAgICBzY2htLnNjaGVtZV92ZXJzaW9uID0gMHgwMDAxMDAwMDsgLy8gdmVyc2lvbiBzZXQgdG8gMHgwMDAxMDAwMCAoTWFqb3IgdmVyc2lvbiAxLCBNaW5vciB2ZXJzaW9uIDApXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlU2NoZW1lSW5mb3JtYXRpb25Cb3goc2luZikge1xuICAgICAgICBsZXQgc2NoaSA9IElTT0JveGVyLmNyZWF0ZUJveCgnc2NoaScsIHNpbmYpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbmQgYWRkIFRyYWNrIEVuY3J5cHRpb24gQm94XG4gICAgICAgIGNyZWF0ZVRyYWNrRW5jcnlwdGlvbkJveChzY2hpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVQcm90ZWN0aW9uU3lzdGVtU3BlY2lmaWNIZWFkZXJCb3gobW9vdiwga2V5U3lzdGVtcykge1xuICAgICAgICBsZXQgcHNzaF9ieXRlcyxcbiAgICAgICAgICAgIHBzc2gsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgcGFyc2VkQnVmZmVyO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBrZXlTeXN0ZW1zLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBwc3NoX2J5dGVzID0ga2V5U3lzdGVtc1tpXS5pbml0RGF0YTtcbiAgICAgICAgICAgIGlmIChwc3NoX2J5dGVzKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VkQnVmZmVyID0gSVNPQm94ZXIucGFyc2VCdWZmZXIocHNzaF9ieXRlcyk7XG4gICAgICAgICAgICAgICAgcHNzaCA9IHBhcnNlZEJ1ZmZlci5mZXRjaCgncHNzaCcpO1xuICAgICAgICAgICAgICAgIGlmIChwc3NoKSB7XG4gICAgICAgICAgICAgICAgICAgIElTT0JveGVyLlV0aWxzLmFwcGVuZEJveChtb292LCBwc3NoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVUcmFja0VuY3J5cHRpb25Cb3goc2NoaSkge1xuICAgICAgICBsZXQgdGVuYyA9IElTT0JveGVyLmNyZWF0ZUZ1bGxCb3goJ3RlbmMnLCBzY2hpKTtcblxuICAgICAgICB0ZW5jLmZsYWdzID0gMDtcbiAgICAgICAgdGVuYy52ZXJzaW9uID0gMDtcblxuICAgICAgICB0ZW5jLmRlZmF1bHRfSXNFbmNyeXB0ZWQgPSAweDE7XG4gICAgICAgIHRlbmMuZGVmYXVsdF9JVl9zaXplID0gODtcbiAgICAgICAgdGVuYy5kZWZhdWx0X0tJRCA9IChjb250ZW50UHJvdGVjdGlvbiAmJiAoY29udGVudFByb3RlY3Rpb24ubGVuZ3RoKSA+IDAgJiYgY29udGVudFByb3RlY3Rpb25bMF1bJ2NlbmM6ZGVmYXVsdF9LSUQnXSkgP1xuICAgICAgICAgICAgY29udGVudFByb3RlY3Rpb25bMF1bJ2NlbmM6ZGVmYXVsdF9LSUQnXSA6IFsweDAsIDB4MCwgMHgwLCAweDAsIDB4MCwgMHgwLCAweDAsIDB4MCwgMHgwLCAweDAsIDB4MCwgMHgwLCAweDAsIDB4MCwgMHgwLCAweDBdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZVRyZXhCb3gobW9vdikge1xuICAgICAgICBsZXQgdHJleCA9IElTT0JveGVyLmNyZWF0ZUZ1bGxCb3goJ3RyZXgnLCBtb292KTtcblxuICAgICAgICB0cmV4LnRyYWNrX0lEID0gdHJhY2tJZDtcbiAgICAgICAgdHJleC5kZWZhdWx0X3NhbXBsZV9kZXNjcmlwdGlvbl9pbmRleCA9IDE7XG4gICAgICAgIHRyZXguZGVmYXVsdF9zYW1wbGVfZHVyYXRpb24gPSAwO1xuICAgICAgICB0cmV4LmRlZmF1bHRfc2FtcGxlX3NpemUgPSAwO1xuICAgICAgICB0cmV4LmRlZmF1bHRfc2FtcGxlX2ZsYWdzID0gMDtcblxuICAgICAgICByZXR1cm4gdHJleDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoZXhTdHJpbmd0b0J1ZmZlcihzdHIpIHtcbiAgICAgICAgbGV0IGJ1ZiA9IG5ldyBVaW50OEFycmF5KHN0ci5sZW5ndGggLyAyKTtcbiAgICAgICAgbGV0IGk7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHN0ci5sZW5ndGggLyAyOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGJ1ZltpXSA9IHBhcnNlSW50KCcnICsgc3RyW2kgKiAyXSArIHN0cltpICogMiArIDFdLCAxNik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJ1ZjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdHJpbmdUb0NoYXJDb2RlKHN0cikge1xuICAgICAgICBsZXQgY29kZSA9IDA7XG4gICAgICAgIGxldCBpO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGNvZGUgfD0gc3RyLmNoYXJDb2RlQXQoaSkgPDwgKChzdHIubGVuZ3RoIC0gaSAtIDEpICogOCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVNb292KHJlcCkge1xuICAgICAgICBpZiAoIXJlcCB8fCAhcmVwLmFkYXB0YXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpc29GaWxlLFxuICAgICAgICAgICAgYXJyYXlCdWZmZXI7XG5cbiAgICAgICAgcmVwcmVzZW50YXRpb24gPSByZXA7XG4gICAgICAgIGFkYXB0YXRpb25TZXQgPSByZXByZXNlbnRhdGlvbi5hZGFwdGF0aW9uO1xuXG4gICAgICAgIHBlcmlvZCA9IGFkYXB0YXRpb25TZXQucGVyaW9kO1xuICAgICAgICB0cmFja0lkID0gYWRhcHRhdGlvblNldC5pbmRleCArIDE7XG4gICAgICAgIGNvbnRlbnRQcm90ZWN0aW9uID0gcGVyaW9kLm1wZC5tYW5pZmVzdC5QZXJpb2RfYXNBcnJheVtwZXJpb2QuaW5kZXhdLkFkYXB0YXRpb25TZXRfYXNBcnJheVthZGFwdGF0aW9uU2V0LmluZGV4XS5Db250ZW50UHJvdGVjdGlvbjtcblxuICAgICAgICB0aW1lc2NhbGUgPSBwZXJpb2QubXBkLm1hbmlmZXN0LlBlcmlvZF9hc0FycmF5W3BlcmlvZC5pbmRleF0uQWRhcHRhdGlvblNldF9hc0FycmF5W2FkYXB0YXRpb25TZXQuaW5kZXhdLlNlZ21lbnRUZW1wbGF0ZS50aW1lc2NhbGU7XG5cbiAgICAgICAgaXNvRmlsZSA9IElTT0JveGVyLmNyZWF0ZUZpbGUoKTtcbiAgICAgICAgY3JlYXRlRnR5cEJveChpc29GaWxlKTtcbiAgICAgICAgY3JlYXRlTW9vdkJveChpc29GaWxlKTtcblxuICAgICAgICBhcnJheUJ1ZmZlciA9IGlzb0ZpbGUud3JpdGUoKTtcblxuICAgICAgICByZXR1cm4gYXJyYXlCdWZmZXI7XG4gICAgfVxuXG4gICAgaW5zdGFuY2UgPSB7XG4gICAgICAgIGdlbmVyYXRlTW9vdjogZ2VuZXJhdGVNb292XG4gICAgfTtcblxuICAgIHJldHVybiBpbnN0YW5jZTtcbn1cblxuTXNzRnJhZ21lbnRNb292UHJvY2Vzc29yLl9fZGFzaGpzX2ZhY3RvcnlfbmFtZSA9ICdNc3NGcmFnbWVudE1vb3ZQcm9jZXNzb3InO1xuZXhwb3J0IGRlZmF1bHQgZGFzaGpzLkZhY3RvcnlNYWtlci5nZXRDbGFzc0ZhY3RvcnkoTXNzRnJhZ21lbnRNb292UHJvY2Vzc29yKTsgLyoganNoaW50IGlnbm9yZTpsaW5lICovXG4iLCIvKipcbiAqIFRoZSBjb3B5cmlnaHQgaW4gdGhpcyBzb2Z0d2FyZSBpcyBiZWluZyBtYWRlIGF2YWlsYWJsZSB1bmRlciB0aGUgQlNEIExpY2Vuc2UsXG4gKiBpbmNsdWRlZCBiZWxvdy4gVGhpcyBzb2Z0d2FyZSBtYXkgYmUgc3ViamVjdCB0byBvdGhlciB0aGlyZCBwYXJ0eSBhbmQgY29udHJpYnV0b3JcbiAqIHJpZ2h0cywgaW5jbHVkaW5nIHBhdGVudCByaWdodHMsIGFuZCBubyBzdWNoIHJpZ2h0cyBhcmUgZ3JhbnRlZCB1bmRlciB0aGlzIGxpY2Vuc2UuXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLCBEYXNoIEluZHVzdHJ5IEZvcnVtLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXQgbW9kaWZpY2F0aW9uLFxuICogYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuICogICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gKiAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gKiAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvbiBhbmQvb3JcbiAqICBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogICogTmVpdGhlciB0aGUgbmFtZSBvZiBEYXNoIEluZHVzdHJ5IEZvcnVtIG5vciB0aGUgbmFtZXMgb2YgaXRzXG4gKiAgY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZVxuICogIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICpcbiAqICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIEFTIElTIEFORCBBTllcbiAqICBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEXG4gKiAgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRSBESVNDTEFJTUVELlxuICogIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgSE9MREVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsXG4gKiAgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVFxuICogIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1JcbiAqICBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSxcbiAqICBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpXG4gKiAgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEVcbiAqICBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuXG5pbXBvcnQgTXNzRnJhZ21lbnRNb29mUHJvY2Vzc29yIGZyb20gJy4vTXNzRnJhZ21lbnRNb29mUHJvY2Vzc29yJztcbmltcG9ydCBNc3NGcmFnbWVudE1vb3ZQcm9jZXNzb3IgZnJvbSAnLi9Nc3NGcmFnbWVudE1vb3ZQcm9jZXNzb3InO1xuXG4vLyBBZGQgc3BlY2lmaWMgYm94IHByb2Nlc3NvcnMgbm90IHByb3ZpZGVkIGJ5IGNvZGVtLWlzb2JveGVyIGxpYnJhcnlcblxuZnVuY3Rpb24gYXJyYXlFcXVhbChhcnIxLCBhcnIyKSB7XG4gICAgcmV0dXJuIChhcnIxLmxlbmd0aCA9PT0gYXJyMi5sZW5ndGgpICYmIGFycjEuZXZlcnkoZnVuY3Rpb24gKGVsZW1lbnQsIGluZGV4KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50ID09PSBhcnIyW2luZGV4XTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2Fpb1Byb2Nlc3NvcigpIHtcbiAgICB0aGlzLl9wcm9jRnVsbEJveCgpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgMSkge1xuICAgICAgICB0aGlzLl9wcm9jRmllbGQoJ2F1eF9pbmZvX3R5cGUnLCAndWludCcsIDMyKTtcbiAgICAgICAgdGhpcy5fcHJvY0ZpZWxkKCdhdXhfaW5mb190eXBlX3BhcmFtZXRlcicsICd1aW50JywgMzIpO1xuICAgIH1cbiAgICB0aGlzLl9wcm9jRmllbGQoJ2VudHJ5X2NvdW50JywgJ3VpbnQnLCAzMik7XG4gICAgdGhpcy5fcHJvY0ZpZWxkQXJyYXkoJ29mZnNldCcsIHRoaXMuZW50cnlfY291bnQsICd1aW50JywgKHRoaXMudmVyc2lvbiA9PT0gMSkgPyA2NCA6IDMyKTtcbn1cblxuZnVuY3Rpb24gc2FpelByb2Nlc3NvcigpIHtcbiAgICB0aGlzLl9wcm9jRnVsbEJveCgpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgMSkge1xuICAgICAgICB0aGlzLl9wcm9jRmllbGQoJ2F1eF9pbmZvX3R5cGUnLCAndWludCcsIDMyKTtcbiAgICAgICAgdGhpcy5fcHJvY0ZpZWxkKCdhdXhfaW5mb190eXBlX3BhcmFtZXRlcicsICd1aW50JywgMzIpO1xuICAgIH1cbiAgICB0aGlzLl9wcm9jRmllbGQoJ2RlZmF1bHRfc2FtcGxlX2luZm9fc2l6ZScsICd1aW50JywgOCk7XG4gICAgdGhpcy5fcHJvY0ZpZWxkKCdzYW1wbGVfY291bnQnLCAndWludCcsIDMyKTtcbiAgICBpZiAodGhpcy5kZWZhdWx0X3NhbXBsZV9pbmZvX3NpemUgPT09IDApIHtcbiAgICAgICAgdGhpcy5fcHJvY0ZpZWxkQXJyYXkoJ3NhbXBsZV9pbmZvX3NpemUnLCB0aGlzLnNhbXBsZV9jb3VudCwgJ3VpbnQnLCA4KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNlbmNQcm9jZXNzb3IoKSB7XG4gICAgdGhpcy5fcHJvY0Z1bGxCb3goKTtcbiAgICB0aGlzLl9wcm9jRmllbGQoJ3NhbXBsZV9jb3VudCcsICd1aW50JywgMzIpO1xuICAgIGlmICh0aGlzLmZsYWdzICYgMSkge1xuICAgICAgICB0aGlzLl9wcm9jRmllbGQoJ0lWX3NpemUnLCAndWludCcsIDgpO1xuICAgIH1cbiAgICB0aGlzLl9wcm9jRW50cmllcygnZW50cnknLCB0aGlzLnNhbXBsZV9jb3VudCwgZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgICAgIHRoaXMuX3Byb2NFbnRyeUZpZWxkKGVudHJ5LCAnSW5pdGlhbGl6YXRpb25WZWN0b3InLCAnZGF0YScsIDgpO1xuICAgICAgICBpZiAodGhpcy5mbGFncyAmIDIpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2NFbnRyeUZpZWxkKGVudHJ5LCAnTnVtYmVyT2ZFbnRyaWVzJywgJ3VpbnQnLCAxNik7XG4gICAgICAgICAgICB0aGlzLl9wcm9jU3ViRW50cmllcyhlbnRyeSwgJ2NsZWFyQW5kQ3J5cHRlZERhdGEnLCBlbnRyeS5OdW1iZXJPZkVudHJpZXMsIGZ1bmN0aW9uIChjbGVhckFuZENyeXB0ZWREYXRhKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvY0VudHJ5RmllbGQoY2xlYXJBbmRDcnlwdGVkRGF0YSwgJ0J5dGVzT2ZDbGVhckRhdGEnLCAndWludCcsIDE2KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9jRW50cnlGaWVsZChjbGVhckFuZENyeXB0ZWREYXRhLCAnQnl0ZXNPZkVuY3J5cHRlZERhdGEnLCAndWludCcsIDMyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHV1aWRQcm9jZXNzb3IoKSB7XG4gICAgbGV0IHRmeGRVc2VyVHlwZSA9IFsweDZELCAweDFELCAweDlCLCAweDA1LCAweDQyLCAweEQ1LCAweDQ0LCAweEU2LCAweDgwLCAweEUyLCAweDE0LCAweDFELCAweEFGLCAweEY3LCAweDU3LCAweEIyXTtcbiAgICBsZXQgdGZyZlVzZXJUeXBlID0gWzB4RDQsIDB4ODAsIDB4N0UsIDB4RjIsIDB4Q0EsIDB4MzksIDB4NDYsIDB4OTUsIDB4OEUsIDB4NTQsIDB4MjYsIDB4Q0IsIDB4OUUsIDB4NDYsIDB4QTcsIDB4OUZdO1xuICAgIGxldCBzZXBpZmZVc2VyVHlwZSA9IFsweEEyLCAweDM5LCAweDRGLCAweDUyLCAweDVBLCAweDlCLCAweDRmLCAweDE0LCAweEEyLCAweDQ0LCAweDZDLCAweDQyLCAweDdDLCAweDY0LCAweDhELCAweEY0XTtcblxuICAgIGlmIChhcnJheUVxdWFsKHRoaXMudXNlcnR5cGUsIHRmeGRVc2VyVHlwZSkpIHtcbiAgICAgICAgdGhpcy5fcHJvY0Z1bGxCb3goKTtcbiAgICAgICAgaWYgKHRoaXMuX3BhcnNpbmcpIHtcbiAgICAgICAgICAgIHRoaXMudHlwZSA9ICd0ZnhkJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wcm9jRmllbGQoJ2ZyYWdtZW50X2Fic29sdXRlX3RpbWUnLCAndWludCcsICh0aGlzLnZlcnNpb24gPT09IDEpID8gNjQgOiAzMik7XG4gICAgICAgIHRoaXMuX3Byb2NGaWVsZCgnZnJhZ21lbnRfZHVyYXRpb24nLCAndWludCcsICh0aGlzLnZlcnNpb24gPT09IDEpID8gNjQgOiAzMik7XG4gICAgfVxuXG4gICAgaWYgKGFycmF5RXF1YWwodGhpcy51c2VydHlwZSwgdGZyZlVzZXJUeXBlKSkge1xuICAgICAgICB0aGlzLl9wcm9jRnVsbEJveCgpO1xuICAgICAgICBpZiAodGhpcy5fcGFyc2luZykge1xuICAgICAgICAgICAgdGhpcy50eXBlID0gJ3RmcmYnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Byb2NGaWVsZCgnZnJhZ21lbnRfY291bnQnLCAndWludCcsIDgpO1xuICAgICAgICB0aGlzLl9wcm9jRW50cmllcygnZW50cnknLCB0aGlzLmZyYWdtZW50X2NvdW50LCBmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2NFbnRyeUZpZWxkKGVudHJ5LCAnZnJhZ21lbnRfYWJzb2x1dGVfdGltZScsICd1aW50JywgKHRoaXMudmVyc2lvbiA9PT0gMSkgPyA2NCA6IDMyKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb2NFbnRyeUZpZWxkKGVudHJ5LCAnZnJhZ21lbnRfZHVyYXRpb24nLCAndWludCcsICh0aGlzLnZlcnNpb24gPT09IDEpID8gNjQgOiAzMik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChhcnJheUVxdWFsKHRoaXMudXNlcnR5cGUsIHNlcGlmZlVzZXJUeXBlKSkge1xuICAgICAgICBpZiAodGhpcy5fcGFyc2luZykge1xuICAgICAgICAgICAgdGhpcy50eXBlID0gJ3NlcGlmZic7XG4gICAgICAgIH1cbiAgICAgICAgc2VuY1Byb2Nlc3Nvci5jYWxsKHRoaXMpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gTXNzRnJhZ21lbnRQcm9jZXNzb3IoY29uZmlnKSB7XG5cbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgY29uc3QgY29udGV4dCA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCBkYXNoTWV0cmljcyA9IGNvbmZpZy5kYXNoTWV0cmljcztcbiAgICBjb25zdCBwbGF5YmFja0NvbnRyb2xsZXIgPSBjb25maWcucGxheWJhY2tDb250cm9sbGVyO1xuICAgIGNvbnN0IGV2ZW50QnVzID0gY29uZmlnLmV2ZW50QnVzO1xuICAgIGNvbnN0IHByb3RlY3Rpb25Db250cm9sbGVyID0gY29uZmlnLnByb3RlY3Rpb25Db250cm9sbGVyO1xuICAgIGNvbnN0IElTT0JveGVyID0gY29uZmlnLklTT0JveGVyO1xuICAgIGNvbnN0IGRlYnVnID0gY29uZmlnLmRlYnVnO1xuICAgIGxldCBtc3NGcmFnbWVudE1vb3ZQcm9jZXNzb3IsXG4gICAgICAgIG1zc0ZyYWdtZW50TW9vZlByb2Nlc3NvcixcbiAgICAgICAgaW5zdGFuY2U7XG5cbiAgICBmdW5jdGlvbiBzZXR1cCgpIHtcbiAgICAgICAgSVNPQm94ZXIuYWRkQm94UHJvY2Vzc29yKCd1dWlkJywgdXVpZFByb2Nlc3Nvcik7XG4gICAgICAgIElTT0JveGVyLmFkZEJveFByb2Nlc3Nvcignc2FpbycsIHNhaW9Qcm9jZXNzb3IpO1xuICAgICAgICBJU09Cb3hlci5hZGRCb3hQcm9jZXNzb3IoJ3NhaXonLCBzYWl6UHJvY2Vzc29yKTtcbiAgICAgICAgSVNPQm94ZXIuYWRkQm94UHJvY2Vzc29yKCdzZW5jJywgc2VuY1Byb2Nlc3Nvcik7XG5cbiAgICAgICAgbXNzRnJhZ21lbnRNb292UHJvY2Vzc29yID0gTXNzRnJhZ21lbnRNb292UHJvY2Vzc29yKGNvbnRleHQpLmNyZWF0ZSh7XG4gICAgICAgICAgICBwcm90ZWN0aW9uQ29udHJvbGxlcjogcHJvdGVjdGlvbkNvbnRyb2xsZXIsXG4gICAgICAgICAgICBjb25zdGFudHM6IGNvbmZpZy5jb25zdGFudHMsXG4gICAgICAgICAgICBJU09Cb3hlcjogSVNPQm94ZXJ9KTtcblxuICAgICAgICBtc3NGcmFnbWVudE1vb2ZQcm9jZXNzb3IgPSBNc3NGcmFnbWVudE1vb2ZQcm9jZXNzb3IoY29udGV4dCkuY3JlYXRlKHtcbiAgICAgICAgICAgIGRhc2hNZXRyaWNzOiBkYXNoTWV0cmljcyxcbiAgICAgICAgICAgIHBsYXliYWNrQ29udHJvbGxlcjogcGxheWJhY2tDb250cm9sbGVyLFxuICAgICAgICAgICAgSVNPQm94ZXI6IElTT0JveGVyLFxuICAgICAgICAgICAgZXZlbnRCdXM6IGV2ZW50QnVzLFxuICAgICAgICAgICAgZGVidWc6IGRlYnVnLFxuICAgICAgICAgICAgZXJySGFuZGxlcjogY29uZmlnLmVyckhhbmRsZXJcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVNb292KHJlcCkge1xuICAgICAgICByZXR1cm4gbXNzRnJhZ21lbnRNb292UHJvY2Vzc29yLmdlbmVyYXRlTW9vdihyZXApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NGcmFnbWVudChlLCBzdHJlYW1Qcm9jZXNzb3IpIHtcbiAgICAgICAgaWYgKCFlIHx8ICFlLnJlcXVlc3QgfHwgIWUucmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZSBwYXJhbWV0ZXIgaXMgbWlzc2luZyBvciBtYWxmb3JtZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlLnJlcXVlc3QudHlwZSA9PT0gJ01lZGlhU2VnbWVudCcpIHtcbiAgICAgICAgICAgIC8vIE1lZGlhU2VnbWVudCA9PiBjb252ZXJ0IHRvIFNtb290aCBTdHJlYW1pbmcgbW9vZiBmb3JtYXRcbiAgICAgICAgICAgIG1zc0ZyYWdtZW50TW9vZlByb2Nlc3Nvci5jb252ZXJ0RnJhZ21lbnQoZSwgc3RyZWFtUHJvY2Vzc29yKTtcblxuICAgICAgICB9IGVsc2UgaWYgKGUucmVxdWVzdC50eXBlID09PSAnRnJhZ21lbnRJbmZvU2VnbWVudCcpIHtcbiAgICAgICAgICAgIC8vIEZyYWdtZW50SW5mbyAobGl2ZSkgPT4gdXBkYXRlIHNlZ21lbnRzIGxpc3RcbiAgICAgICAgICAgIG1zc0ZyYWdtZW50TW9vZlByb2Nlc3Nvci51cGRhdGVTZWdtZW50TGlzdChlLCBzdHJlYW1Qcm9jZXNzb3IpO1xuXG4gICAgICAgICAgICAvLyBTdG9wIGV2ZW50IHByb3BhZ2F0aW9uIChGcmFnbWVudEluZm8gbXVzdCBub3QgYmUgYWRkZWQgdG8gYnVmZmVyKVxuICAgICAgICAgICAgZS5zZW5kZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaW5zdGFuY2UgPSB7XG4gICAgICAgIGdlbmVyYXRlTW9vdjogZ2VuZXJhdGVNb292LFxuICAgICAgICBwcm9jZXNzRnJhZ21lbnQ6IHByb2Nlc3NGcmFnbWVudFxuICAgIH07XG5cbiAgICBzZXR1cCgpO1xuXG4gICAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5Nc3NGcmFnbWVudFByb2Nlc3Nvci5fX2Rhc2hqc19mYWN0b3J5X25hbWUgPSAnTXNzRnJhZ21lbnRQcm9jZXNzb3InO1xuZXhwb3J0IGRlZmF1bHQgZGFzaGpzLkZhY3RvcnlNYWtlci5nZXRDbGFzc0ZhY3RvcnkoTXNzRnJhZ21lbnRQcm9jZXNzb3IpOyAvKiBqc2hpbnQgaWdub3JlOmxpbmUgKi9cbiIsIi8qKlxuICogVGhlIGNvcHlyaWdodCBpbiB0aGlzIHNvZnR3YXJlIGlzIGJlaW5nIG1hZGUgYXZhaWxhYmxlIHVuZGVyIHRoZSBCU0QgTGljZW5zZSxcbiAqIGluY2x1ZGVkIGJlbG93LiBUaGlzIHNvZnR3YXJlIG1heSBiZSBzdWJqZWN0IHRvIG90aGVyIHRoaXJkIHBhcnR5IGFuZCBjb250cmlidXRvclxuICogcmlnaHRzLCBpbmNsdWRpbmcgcGF0ZW50IHJpZ2h0cywgYW5kIG5vIHN1Y2ggcmlnaHRzIGFyZSBncmFudGVkIHVuZGVyIHRoaXMgbGljZW5zZS5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMsIERhc2ggSW5kdXN0cnkgRm9ydW0uXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dCBtb2RpZmljYXRpb24sXG4gKiBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXNcbiAqICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uIGFuZC9vclxuICogIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKiAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIERhc2ggSW5kdXN0cnkgRm9ydW0gbm9yIHRoZSBuYW1lcyBvZiBpdHNcbiAqICBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlXG4gKiAgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgQVMgSVMgQU5EIEFOWVxuICogIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqICBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuXG4gKiAgSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCxcbiAqICBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUXG4gKiAgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUlxuICogIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLFxuICogIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSlcbiAqICBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRVxuICogIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5cbmltcG9ydCBEYXRhQ2h1bmsgZnJvbSAnLi4vc3RyZWFtaW5nL3ZvL0RhdGFDaHVuayc7XG5pbXBvcnQgRnJhZ21lbnRSZXF1ZXN0IGZyb20gJy4uL3N0cmVhbWluZy92by9GcmFnbWVudFJlcXVlc3QnO1xuaW1wb3J0IE1zc0ZyYWdtZW50SW5mb0NvbnRyb2xsZXIgZnJvbSAnLi9Nc3NGcmFnbWVudEluZm9Db250cm9sbGVyJztcbmltcG9ydCBNc3NGcmFnbWVudFByb2Nlc3NvciBmcm9tICcuL01zc0ZyYWdtZW50UHJvY2Vzc29yJztcbmltcG9ydCBNc3NQYXJzZXIgZnJvbSAnLi9wYXJzZXIvTXNzUGFyc2VyJztcbmltcG9ydCBNc3NFcnJvcnMgZnJvbSAnLi9lcnJvcnMvTXNzRXJyb3JzJztcbmltcG9ydCBEYXNoSlNFcnJvciBmcm9tICcuLi9zdHJlYW1pbmcvdm8vRGFzaEpTRXJyb3InO1xuaW1wb3J0IEluaXRDYWNoZSBmcm9tICcuLi9zdHJlYW1pbmcvdXRpbHMvSW5pdENhY2hlJztcblxuZnVuY3Rpb24gTXNzSGFuZGxlcihjb25maWcpIHtcblxuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcbiAgICBjb25zdCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xuICAgIGNvbnN0IGV2ZW50QnVzID0gY29uZmlnLmV2ZW50QnVzO1xuICAgIGNvbnN0IGV2ZW50cyA9IGNvbmZpZy5ldmVudHM7XG4gICAgY29uc3QgY29uc3RhbnRzID0gY29uZmlnLmNvbnN0YW50cztcbiAgICBjb25zdCBpbml0U2VnbWVudFR5cGUgPSBjb25maWcuaW5pdFNlZ21lbnRUeXBlO1xuICAgIGNvbnN0IGRhc2hNZXRyaWNzID0gY29uZmlnLmRhc2hNZXRyaWNzO1xuICAgIGNvbnN0IHBsYXliYWNrQ29udHJvbGxlciA9IGNvbmZpZy5wbGF5YmFja0NvbnRyb2xsZXI7XG4gICAgY29uc3Qgc3RyZWFtQ29udHJvbGxlciA9IGNvbmZpZy5zdHJlYW1Db250cm9sbGVyO1xuICAgIGNvbnN0IHByb3RlY3Rpb25Db250cm9sbGVyID0gY29uZmlnLnByb3RlY3Rpb25Db250cm9sbGVyO1xuICAgIGNvbnN0IG1zc0ZyYWdtZW50UHJvY2Vzc29yID0gTXNzRnJhZ21lbnRQcm9jZXNzb3IoY29udGV4dCkuY3JlYXRlKHtcbiAgICAgICAgZGFzaE1ldHJpY3M6IGRhc2hNZXRyaWNzLFxuICAgICAgICBwbGF5YmFja0NvbnRyb2xsZXI6IHBsYXliYWNrQ29udHJvbGxlcixcbiAgICAgICAgcHJvdGVjdGlvbkNvbnRyb2xsZXI6IHByb3RlY3Rpb25Db250cm9sbGVyLFxuICAgICAgICBzdHJlYW1Db250cm9sbGVyOiBzdHJlYW1Db250cm9sbGVyLFxuICAgICAgICBldmVudEJ1czogZXZlbnRCdXMsXG4gICAgICAgIGNvbnN0YW50czogY29uc3RhbnRzLFxuICAgICAgICBJU09Cb3hlcjogY29uZmlnLklTT0JveGVyLFxuICAgICAgICBkZWJ1ZzogY29uZmlnLmRlYnVnLFxuICAgICAgICBlcnJIYW5kbGVyOiBjb25maWcuZXJySGFuZGxlclxuICAgIH0pO1xuICAgIGxldCBtc3NQYXJzZXIsXG4gICAgICAgIGZyYWdtZW50SW5mb0NvbnRyb2xsZXJzLFxuICAgICAgICBpbml0Q2FjaGUsXG4gICAgICAgIGluc3RhbmNlO1xuXG4gICAgZnVuY3Rpb24gc2V0dXAoKSB7XG4gICAgICAgIGZyYWdtZW50SW5mb0NvbnRyb2xsZXJzID0gW107XG4gICAgICAgIGluaXRDYWNoZSA9IEluaXRDYWNoZShjb250ZXh0KS5nZXRJbnN0YW5jZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFN0cmVhbVByb2Nlc3Nvcih0eXBlKSB7XG4gICAgICAgIHJldHVybiBzdHJlYW1Db250cm9sbGVyLmdldEFjdGl2ZVN0cmVhbVByb2Nlc3NvcnMoKS5maWx0ZXIocHJvY2Vzc29yID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwcm9jZXNzb3IuZ2V0VHlwZSgpID09PSB0eXBlO1xuICAgICAgICB9KVswXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRGcmFnbWVudEluZm9Db250cm9sbGVyKHR5cGUpIHtcbiAgICAgICAgcmV0dXJuIGZyYWdtZW50SW5mb0NvbnRyb2xsZXJzLmZpbHRlcihjb250cm9sbGVyID0+IHtcbiAgICAgICAgICAgIHJldHVybiAoY29udHJvbGxlci5nZXRUeXBlKCkgPT09IHR5cGUpO1xuICAgICAgICB9KVswXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEYXRhQ2h1bmsocmVxdWVzdCwgc3RyZWFtSWQsIGVuZEZyYWdtZW50KSB7XG4gICAgICAgIGNvbnN0IGNodW5rID0gbmV3IERhdGFDaHVuaygpO1xuXG4gICAgICAgIGNodW5rLnN0cmVhbUlkID0gc3RyZWFtSWQ7XG4gICAgICAgIGNodW5rLm1lZGlhSW5mbyA9IHJlcXVlc3QubWVkaWFJbmZvO1xuICAgICAgICBjaHVuay5zZWdtZW50VHlwZSA9IHJlcXVlc3QudHlwZTtcbiAgICAgICAgY2h1bmsuc3RhcnQgPSByZXF1ZXN0LnN0YXJ0VGltZTtcbiAgICAgICAgY2h1bmsuZHVyYXRpb24gPSByZXF1ZXN0LmR1cmF0aW9uO1xuICAgICAgICBjaHVuay5lbmQgPSBjaHVuay5zdGFydCArIGNodW5rLmR1cmF0aW9uO1xuICAgICAgICBjaHVuay5pbmRleCA9IHJlcXVlc3QuaW5kZXg7XG4gICAgICAgIGNodW5rLnF1YWxpdHkgPSByZXF1ZXN0LnF1YWxpdHk7XG4gICAgICAgIGNodW5rLnJlcHJlc2VudGF0aW9uSWQgPSByZXF1ZXN0LnJlcHJlc2VudGF0aW9uSWQ7XG4gICAgICAgIGNodW5rLmVuZEZyYWdtZW50ID0gZW5kRnJhZ21lbnQ7XG5cbiAgICAgICAgcmV0dXJuIGNodW5rO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0YXJ0RnJhZ21lbnRJbmZvQ29udHJvbGxlcnMoKSB7XG5cbiAgICAgICAgLy8gQ3JlYXRlIE1zc0ZyYWdtZW50SW5mb0NvbnRyb2xsZXJzIGZvciBlYWNoIFN0cmVhbVByb2Nlc3NvciBvZiBhY3RpdmUgc3RyZWFtIChvbmx5IGZvciBhdWRpbywgdmlkZW8gb3IgZnJhZ21lbnRlZFRleHQpXG4gICAgICAgIGxldCBwcm9jZXNzb3JzID0gc3RyZWFtQ29udHJvbGxlci5nZXRBY3RpdmVTdHJlYW1Qcm9jZXNzb3JzKCk7XG4gICAgICAgIHByb2Nlc3NvcnMuZm9yRWFjaChmdW5jdGlvbiAocHJvY2Vzc29yKSB7XG4gICAgICAgICAgICBpZiAocHJvY2Vzc29yLmdldFR5cGUoKSA9PT0gY29uc3RhbnRzLlZJREVPIHx8XG4gICAgICAgICAgICAgICAgcHJvY2Vzc29yLmdldFR5cGUoKSA9PT0gY29uc3RhbnRzLkFVRElPIHx8XG4gICAgICAgICAgICAgICAgcHJvY2Vzc29yLmdldFR5cGUoKSA9PT0gY29uc3RhbnRzLkZSQUdNRU5URURfVEVYVCkge1xuXG4gICAgICAgICAgICAgICAgbGV0IGZyYWdtZW50SW5mb0NvbnRyb2xsZXIgPSBnZXRGcmFnbWVudEluZm9Db250cm9sbGVyKHByb2Nlc3Nvci5nZXRUeXBlKCkpO1xuICAgICAgICAgICAgICAgIGlmICghZnJhZ21lbnRJbmZvQ29udHJvbGxlcikge1xuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudEluZm9Db250cm9sbGVyID0gTXNzRnJhZ21lbnRJbmZvQ29udHJvbGxlcihjb250ZXh0KS5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtUHJvY2Vzc29yOiBwcm9jZXNzb3IsXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXNlVVJMQ29udHJvbGxlcjogY29uZmlnLmJhc2VVUkxDb250cm9sbGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVidWc6IGNvbmZpZy5kZWJ1Z1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRJbmZvQ29udHJvbGxlci5pbml0aWFsaXplKCk7XG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50SW5mb0NvbnRyb2xsZXJzLnB1c2goZnJhZ21lbnRJbmZvQ29udHJvbGxlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZyYWdtZW50SW5mb0NvbnRyb2xsZXIuc3RhcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RvcEZyYWdtZW50SW5mb0NvbnRyb2xsZXJzKCkge1xuICAgICAgICBmcmFnbWVudEluZm9Db250cm9sbGVycy5mb3JFYWNoKGMgPT4ge1xuICAgICAgICAgICAgYy5yZXNldCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgZnJhZ21lbnRJbmZvQ29udHJvbGxlcnMgPSBbXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbkluaXRGcmFnbWVudE5lZWRlZChlKSB7XG4gICAgICAgIGxldCBzdHJlYW1Qcm9jZXNzb3IgPSBnZXRTdHJlYW1Qcm9jZXNzb3IoZS5tZWRpYVR5cGUpO1xuICAgICAgICBpZiAoIXN0cmVhbVByb2Nlc3NvcikgcmV0dXJuO1xuXG4gICAgICAgIC8vIENyZWF0ZSBpbml0IHNlZ21lbnQgcmVxdWVzdFxuICAgICAgICBsZXQgcmVwcmVzZW50YXRpb25Db250cm9sbGVyID0gc3RyZWFtUHJvY2Vzc29yLmdldFJlcHJlc2VudGF0aW9uQ29udHJvbGxlcigpO1xuICAgICAgICBsZXQgcmVwcmVzZW50YXRpb24gPSByZXByZXNlbnRhdGlvbkNvbnRyb2xsZXIuZ2V0Q3VycmVudFJlcHJlc2VudGF0aW9uKCk7XG4gICAgICAgIGxldCBtZWRpYUluZm8gPSBzdHJlYW1Qcm9jZXNzb3IuZ2V0TWVkaWFJbmZvKCk7XG5cbiAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgRnJhZ21lbnRSZXF1ZXN0KCk7XG4gICAgICAgIHJlcXVlc3QubWVkaWFUeXBlID0gcmVwcmVzZW50YXRpb24uYWRhcHRhdGlvbi50eXBlO1xuICAgICAgICByZXF1ZXN0LnR5cGUgPSBpbml0U2VnbWVudFR5cGU7XG4gICAgICAgIHJlcXVlc3QucmFuZ2UgPSByZXByZXNlbnRhdGlvbi5yYW5nZTtcbiAgICAgICAgcmVxdWVzdC5xdWFsaXR5ID0gcmVwcmVzZW50YXRpb24uaW5kZXg7XG4gICAgICAgIHJlcXVlc3QubWVkaWFJbmZvID0gbWVkaWFJbmZvO1xuICAgICAgICByZXF1ZXN0LnJlcHJlc2VudGF0aW9uSWQgPSByZXByZXNlbnRhdGlvbi5pZDtcblxuICAgICAgICBjb25zdCBjaHVuayA9IGNyZWF0ZURhdGFDaHVuayhyZXF1ZXN0LCBtZWRpYUluZm8uc3RyZWFtSW5mby5pZCwgZS50eXBlICE9PSBldmVudHMuRlJBR01FTlRfTE9BRElOR19QUk9HUkVTUyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIGluaXQgc2VnbWVudCAobW9vdilcbiAgICAgICAgICAgIGNodW5rLmJ5dGVzID0gbXNzRnJhZ21lbnRQcm9jZXNzb3IuZ2VuZXJhdGVNb292KHJlcHJlc2VudGF0aW9uKTtcblxuICAgICAgICAgICAgLy8gTm90aWZ5IGluaXQgc2VnbWVudCBoYXMgYmVlbiBsb2FkZWRcbiAgICAgICAgICAgIGV2ZW50QnVzLnRyaWdnZXIoZXZlbnRzLklOSVRfRlJBR01FTlRfTE9BREVELFxuICAgICAgICAgICAgICAgIHsgY2h1bms6IGNodW5rIH0sXG4gICAgICAgICAgICAgICAgeyBzdHJlYW1JZDogbWVkaWFJbmZvLnN0cmVhbUluZm8uaWQsIG1lZGlhVHlwZTogcmVwcmVzZW50YXRpb24uYWRhcHRhdGlvbi50eXBlIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbmZpZy5lcnJIYW5kbGVyLmVycm9yKG5ldyBEYXNoSlNFcnJvcihlLmNvZGUsIGUubWVzc2FnZSwgZS5kYXRhKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGFuZ2UgdGhlIHNlbmRlciB2YWx1ZSB0byBzdG9wIGV2ZW50IHRvIGJlIHByb3BhZ2F0ZWRcbiAgICAgICAgZS5zZW5kZXIgPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uU2VnbWVudE1lZGlhTG9hZGVkKGUpIHtcbiAgICAgICAgaWYgKGUuZXJyb3IpICByZXR1cm47XG5cbiAgICAgICAgbGV0IHN0cmVhbVByb2Nlc3NvciA9IGdldFN0cmVhbVByb2Nlc3NvcihlLnJlcXVlc3QubWVkaWFUeXBlKTtcbiAgICAgICAgaWYgKCFzdHJlYW1Qcm9jZXNzb3IpIHJldHVybjtcblxuICAgICAgICAvLyBQcm9jZXNzIG1vb2YgdG8gdHJhbnNjb2RlIGl0IGZyb20gTVNTIHRvIERBU0ggKG9yIHRvIHVwZGF0ZSBzZWdtZW50IHRpbWVsaW5lIGZvciBTZWdtZW50SW5mbyBmcmFnbWVudHMpXG4gICAgICAgIG1zc0ZyYWdtZW50UHJvY2Vzc29yLnByb2Nlc3NGcmFnbWVudChlLCBzdHJlYW1Qcm9jZXNzb3IpO1xuXG4gICAgICAgIGlmIChlLnJlcXVlc3QudHlwZSA9PT0gJ0ZyYWdtZW50SW5mb1NlZ21lbnQnKSB7XG4gICAgICAgICAgICAvLyBJZiBGcmFnbWVudEluZm8gbG9hZGVkLCB0aGVuIG5vdGlmeSBjb3JyZXNwb25kaW5nIE1zc0ZyYWdtZW50SW5mb0NvbnRyb2xsZXJcbiAgICAgICAgICAgIGxldCBmcmFnbWVudEluZm9Db250cm9sbGVyID0gZ2V0RnJhZ21lbnRJbmZvQ29udHJvbGxlcihlLnJlcXVlc3QubWVkaWFUeXBlKTtcbiAgICAgICAgICAgIGlmIChmcmFnbWVudEluZm9Db250cm9sbGVyKSB7XG4gICAgICAgICAgICAgICAgZnJhZ21lbnRJbmZvQ29udHJvbGxlci5mcmFnbWVudEluZm9Mb2FkZWQoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdGFydCBNc3NGcmFnbWVudEluZm9Db250cm9sbGVycyBpbiBjYXNlIG9mIHN0YXJ0LW92ZXIgc3RyZWFtc1xuICAgICAgICBsZXQgbWFuaWZlc3RJbmZvID0gZS5yZXF1ZXN0Lm1lZGlhSW5mby5zdHJlYW1JbmZvLm1hbmlmZXN0SW5mbztcbiAgICAgICAgaWYgKCFtYW5pZmVzdEluZm8uaXNEeW5hbWljICYmIG1hbmlmZXN0SW5mby5EVlJXaW5kb3dTaXplICE9PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgc3RhcnRGcmFnbWVudEluZm9Db250cm9sbGVycygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25QbGF5YmFja1BhdXNlZCgpIHtcbiAgICAgICAgaWYgKHBsYXliYWNrQ29udHJvbGxlci5nZXRJc0R5bmFtaWMoKSAmJiBwbGF5YmFja0NvbnRyb2xsZXIuZ2V0VGltZSgpICE9PSAwKSB7XG4gICAgICAgICAgICBzdGFydEZyYWdtZW50SW5mb0NvbnRyb2xsZXJzKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvblBsYXliYWNrU2Vla0Fza2VkKCkge1xuICAgICAgICBpZiAocGxheWJhY2tDb250cm9sbGVyLmdldElzRHluYW1pYygpICYmIHBsYXliYWNrQ29udHJvbGxlci5nZXRUaW1lKCkgIT09IDApIHtcbiAgICAgICAgICAgIHN0YXJ0RnJhZ21lbnRJbmZvQ29udHJvbGxlcnMoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uVFRNTFByZVByb2Nlc3ModHRtbFN1YnRpdGxlcykge1xuICAgICAgICBpZiAoIXR0bWxTdWJ0aXRsZXMgfHwgIXR0bWxTdWJ0aXRsZXMuZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHRtbFN1YnRpdGxlcy5kYXRhID0gdHRtbFN1YnRpdGxlcy5kYXRhLnJlcGxhY2UoL2h0dHA6XFwvXFwvd3d3LnczLm9yZ1xcLzIwMDZcXC8xMFxcL3R0YWYxL2dpLCAnaHR0cDovL3d3dy53My5vcmcvbnMvdHRtbCcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyRXZlbnRzKCkge1xuICAgICAgICBldmVudEJ1cy5vbihldmVudHMuSU5JVF9GUkFHTUVOVF9ORUVERUQsIG9uSW5pdEZyYWdtZW50TmVlZGVkLCBpbnN0YW5jZSwgeyBwcmlvcml0eTogZGFzaGpzLkZhY3RvcnlNYWtlci5nZXRTaW5nbGV0b25GYWN0b3J5QnlOYW1lKGV2ZW50QnVzLmdldENsYXNzTmFtZSgpKS5FVkVOVF9QUklPUklUWV9ISUdIIH0pOyAvKiBqc2hpbnQgaWdub3JlOmxpbmUgKi9cbiAgICAgICAgZXZlbnRCdXMub24oZXZlbnRzLlBMQVlCQUNLX1BBVVNFRCwgb25QbGF5YmFja1BhdXNlZCwgaW5zdGFuY2UsIHsgcHJpb3JpdHk6IGRhc2hqcy5GYWN0b3J5TWFrZXIuZ2V0U2luZ2xldG9uRmFjdG9yeUJ5TmFtZShldmVudEJ1cy5nZXRDbGFzc05hbWUoKSkuRVZFTlRfUFJJT1JJVFlfSElHSCB9KTsgLyoganNoaW50IGlnbm9yZTpsaW5lICovXG4gICAgICAgIGV2ZW50QnVzLm9uKGV2ZW50cy5QTEFZQkFDS19TRUVLX0FTS0VELCBvblBsYXliYWNrU2Vla0Fza2VkLCBpbnN0YW5jZSwgeyBwcmlvcml0eTogZGFzaGpzLkZhY3RvcnlNYWtlci5nZXRTaW5nbGV0b25GYWN0b3J5QnlOYW1lKGV2ZW50QnVzLmdldENsYXNzTmFtZSgpKS5FVkVOVF9QUklPUklUWV9ISUdIIH0pOyAvKiBqc2hpbnQgaWdub3JlOmxpbmUgKi9cbiAgICAgICAgZXZlbnRCdXMub24oZXZlbnRzLkZSQUdNRU5UX0xPQURJTkdfQ09NUExFVEVELCBvblNlZ21lbnRNZWRpYUxvYWRlZCwgaW5zdGFuY2UsIHsgcHJpb3JpdHk6IGRhc2hqcy5GYWN0b3J5TWFrZXIuZ2V0U2luZ2xldG9uRmFjdG9yeUJ5TmFtZShldmVudEJ1cy5nZXRDbGFzc05hbWUoKSkuRVZFTlRfUFJJT1JJVFlfSElHSCB9KTsgLyoganNoaW50IGlnbm9yZTpsaW5lICovXG4gICAgICAgIGV2ZW50QnVzLm9uKGV2ZW50cy5UVE1MX1RPX1BBUlNFLCBvblRUTUxQcmVQcm9jZXNzLCBpbnN0YW5jZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIGlmIChtc3NQYXJzZXIpIHtcbiAgICAgICAgICAgIG1zc1BhcnNlci5yZXNldCgpO1xuICAgICAgICAgICAgbXNzUGFyc2VyID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZXZlbnRCdXMub2ZmKGV2ZW50cy5JTklUX0ZSQUdNRU5UX05FRURFRCwgb25Jbml0RnJhZ21lbnROZWVkZWQsIHRoaXMpO1xuICAgICAgICBldmVudEJ1cy5vZmYoZXZlbnRzLlBMQVlCQUNLX1BBVVNFRCwgb25QbGF5YmFja1BhdXNlZCwgdGhpcyk7XG4gICAgICAgIGV2ZW50QnVzLm9mZihldmVudHMuUExBWUJBQ0tfU0VFS19BU0tFRCwgb25QbGF5YmFja1NlZWtBc2tlZCwgdGhpcyk7XG4gICAgICAgIGV2ZW50QnVzLm9mZihldmVudHMuRlJBR01FTlRfTE9BRElOR19DT01QTEVURUQsIG9uU2VnbWVudE1lZGlhTG9hZGVkLCB0aGlzKTtcbiAgICAgICAgZXZlbnRCdXMub2ZmKGV2ZW50cy5UVE1MX1RPX1BBUlNFLCBvblRUTUxQcmVQcm9jZXNzLCB0aGlzKTtcblxuICAgICAgICAvLyBSZXNldCBGcmFnbWVudEluZm9Db250cm9sbGVyc1xuICAgICAgICBzdG9wRnJhZ21lbnRJbmZvQ29udHJvbGxlcnMoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVNc3NQYXJzZXIoKSB7XG4gICAgICAgIG1zc1BhcnNlciA9IE1zc1BhcnNlcihjb250ZXh0KS5jcmVhdGUoY29uZmlnKTtcbiAgICAgICAgcmV0dXJuIG1zc1BhcnNlcjtcbiAgICB9XG5cbiAgICBpbnN0YW5jZSA9IHtcbiAgICAgICAgcmVzZXQ6IHJlc2V0LFxuICAgICAgICBjcmVhdGVNc3NQYXJzZXI6IGNyZWF0ZU1zc1BhcnNlcixcbiAgICAgICAgcmVnaXN0ZXJFdmVudHM6IHJlZ2lzdGVyRXZlbnRzXG4gICAgfTtcblxuICAgIHNldHVwKCk7XG5cbiAgICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbk1zc0hhbmRsZXIuX19kYXNoanNfZmFjdG9yeV9uYW1lID0gJ01zc0hhbmRsZXInO1xuY29uc3QgZmFjdG9yeSA9IGRhc2hqcy5GYWN0b3J5TWFrZXIuZ2V0Q2xhc3NGYWN0b3J5KE1zc0hhbmRsZXIpOyAvKiBqc2hpbnQgaWdub3JlOmxpbmUgKi9cbmZhY3RvcnkuZXJyb3JzID0gTXNzRXJyb3JzO1xuZGFzaGpzLkZhY3RvcnlNYWtlci51cGRhdGVDbGFzc0ZhY3RvcnkoTXNzSGFuZGxlci5fX2Rhc2hqc19mYWN0b3J5X25hbWUsIGZhY3RvcnkpOyAvKiBqc2hpbnQgaWdub3JlOmxpbmUgKi9cbmV4cG9ydCBkZWZhdWx0IGZhY3Rvcnk7IC8qIGpzaGludCBpZ25vcmU6bGluZSAqL1xuIiwiLyoqXG4gKiBUaGUgY29weXJpZ2h0IGluIHRoaXMgc29mdHdhcmUgaXMgYmVpbmcgbWFkZSBhdmFpbGFibGUgdW5kZXIgdGhlIEJTRCBMaWNlbnNlLFxuICogaW5jbHVkZWQgYmVsb3cuIFRoaXMgc29mdHdhcmUgbWF5IGJlIHN1YmplY3QgdG8gb3RoZXIgdGhpcmQgcGFydHkgYW5kIGNvbnRyaWJ1dG9yXG4gKiByaWdodHMsIGluY2x1ZGluZyBwYXRlbnQgcmlnaHRzLCBhbmQgbm8gc3VjaCByaWdodHMgYXJlIGdyYW50ZWQgdW5kZXIgdGhpcyBsaWNlbnNlLlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMywgRGFzaCBJbmR1c3RyeSBGb3J1bS5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0IG1vZGlmaWNhdGlvbixcbiAqIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICogIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuICogIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yXG4gKiAgb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgRGFzaCBJbmR1c3RyeSBGb3J1bSBub3IgdGhlIG5hbWVzIG9mIGl0c1xuICogIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmVcbiAqICB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqXG4gKiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBBUyBJUyBBTkQgQU5ZXG4gKiAgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC5cbiAqICBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULFxuICogIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVRcbiAqICBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SXG4gKiAgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksXG4gKiAgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKVxuICogIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFXG4gKiAgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cbmltcG9ydCBFcnJvcnNCYXNlIGZyb20gJy4uLy4uL2NvcmUvZXJyb3JzL0Vycm9yc0Jhc2UnO1xuLyoqXG4gKiBAY2xhc3NcbiAqXG4gKi9cbmNsYXNzIE1zc0Vycm9ycyBleHRlbmRzIEVycm9yc0Jhc2Uge1xuXHRjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFcnJvciBjb2RlIHJldHVybmVkIHdoZW4gbm8gdGZyZiBib3ggaXMgZGV0ZWN0ZWQgaW4gTVNTIGxpdmUgc3RyZWFtXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLk1TU19OT19URlJGX0NPREUgPSAyMDA7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVycm9yIGNvZGUgcmV0dXJuZWQgd2hlbiBvbmUgb2YgdGhlIGNvZGVjcyBkZWZpbmVkIGluIHRoZSBtYW5pZmVzdCBpcyBub3Qgc3VwcG9ydGVkXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLk1TU19VTlNVUFBPUlRFRF9DT0RFQ19DT0RFID0gMjAxO1xuXG4gICAgICAgIHRoaXMuTVNTX05PX1RGUkZfTUVTU0FHRSA9ICdNaXNzaW5nIHRmcmYgaW4gbGl2ZSBtZWRpYSBzZWdtZW50JztcbiAgICAgICAgdGhpcy5NU1NfVU5TVVBQT1JURURfQ09ERUNfTUVTU0FHRSA9ICdVbnN1cHBvcnRlZCBjb2RlYyc7XG4gICAgfVxufVxuXG5sZXQgbXNzRXJyb3JzID0gbmV3IE1zc0Vycm9ycygpO1xuZXhwb3J0IGRlZmF1bHQgbXNzRXJyb3JzOyIsIi8qKlxuICogVGhlIGNvcHlyaWdodCBpbiB0aGlzIHNvZnR3YXJlIGlzIGJlaW5nIG1hZGUgYXZhaWxhYmxlIHVuZGVyIHRoZSBCU0QgTGljZW5zZSxcbiAqIGluY2x1ZGVkIGJlbG93LiBUaGlzIHNvZnR3YXJlIG1heSBiZSBzdWJqZWN0IHRvIG90aGVyIHRoaXJkIHBhcnR5IGFuZCBjb250cmlidXRvclxuICogcmlnaHRzLCBpbmNsdWRpbmcgcGF0ZW50IHJpZ2h0cywgYW5kIG5vIHN1Y2ggcmlnaHRzIGFyZSBncmFudGVkIHVuZGVyIHRoaXMgbGljZW5zZS5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMsIERhc2ggSW5kdXN0cnkgRm9ydW0uXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dCBtb2RpZmljYXRpb24sXG4gKiBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXNcbiAqICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uIGFuZC9vclxuICogIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKiAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIERhc2ggSW5kdXN0cnkgRm9ydW0gbm9yIHRoZSBuYW1lcyBvZiBpdHNcbiAqICBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlXG4gKiAgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgQVMgSVMgQU5EIEFOWVxuICogIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqICBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuXG4gKiAgSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCxcbiAqICBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUXG4gKiAgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUlxuICogIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLFxuICogIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSlcbiAqICBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRVxuICogIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5cbmltcG9ydCBNc3NIYW5kbGVyIGZyb20gJy4vTXNzSGFuZGxlcic7XG5cbi8vIFNob3ZlIGJvdGggb2YgdGhlc2UgaW50byB0aGUgZ2xvYmFsIHNjb3BlXG52YXIgY29udGV4dCA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cpIHx8IGdsb2JhbDtcblxudmFyIGRhc2hqcyA9IGNvbnRleHQuZGFzaGpzO1xuaWYgKCFkYXNoanMpIHtcbiAgICBkYXNoanMgPSBjb250ZXh0LmRhc2hqcyA9IHt9O1xufVxuXG5kYXNoanMuTXNzSGFuZGxlciA9IE1zc0hhbmRsZXI7XG5cbmV4cG9ydCBkZWZhdWx0IGRhc2hqcztcbmV4cG9ydCB7IE1zc0hhbmRsZXIgfTtcbiIsIi8qKlxuICogVGhlIGNvcHlyaWdodCBpbiB0aGlzIHNvZnR3YXJlIGlzIGJlaW5nIG1hZGUgYXZhaWxhYmxlIHVuZGVyIHRoZSBCU0QgTGljZW5zZSxcbiAqIGluY2x1ZGVkIGJlbG93LiBUaGlzIHNvZnR3YXJlIG1heSBiZSBzdWJqZWN0IHRvIG90aGVyIHRoaXJkIHBhcnR5IGFuZCBjb250cmlidXRvclxuICogcmlnaHRzLCBpbmNsdWRpbmcgcGF0ZW50IHJpZ2h0cywgYW5kIG5vIHN1Y2ggcmlnaHRzIGFyZSBncmFudGVkIHVuZGVyIHRoaXMgbGljZW5zZS5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMsIERhc2ggSW5kdXN0cnkgRm9ydW0uXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dCBtb2RpZmljYXRpb24sXG4gKiBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXNcbiAqICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uIGFuZC9vclxuICogIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKiAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIERhc2ggSW5kdXN0cnkgRm9ydW0gbm9yIHRoZSBuYW1lcyBvZiBpdHNcbiAqICBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlXG4gKiAgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgQVMgSVMgQU5EIEFOWVxuICogIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqICBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuXG4gKiAgSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCxcbiAqICBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUXG4gKiAgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUlxuICogIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLFxuICogIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSlcbiAqICBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRVxuICogIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5cbi8qKlxuICogQG1vZHVsZSBNc3NQYXJzZXJcbiAqIEBpZ25vcmVcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgb2JqZWN0XG4gKi9cblxuaW1wb3J0IEJpZ0ludCBmcm9tICcuLi8uLi8uLi9leHRlcm5hbHMvQmlnSW50ZWdlcic7XG5cbmZ1bmN0aW9uIE1zc1BhcnNlcihjb25maWcpIHtcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgY29uc3QgQkFTRTY0ID0gY29uZmlnLkJBU0U2NDtcbiAgICBjb25zdCBkZWJ1ZyA9IGNvbmZpZy5kZWJ1ZztcbiAgICBjb25zdCBjb25zdGFudHMgPSBjb25maWcuY29uc3RhbnRzO1xuICAgIGNvbnN0IG1hbmlmZXN0TW9kZWwgPSBjb25maWcubWFuaWZlc3RNb2RlbDtcbiAgICBjb25zdCBtZWRpYVBsYXllck1vZGVsID0gY29uZmlnLm1lZGlhUGxheWVyTW9kZWw7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSBjb25maWcuc2V0dGluZ3M7XG5cbiAgICBjb25zdCBERUZBVUxUX1RJTUVfU0NBTEUgPSAxMDAwMDAwMC4wO1xuICAgIGNvbnN0IFNVUFBPUlRFRF9DT0RFQ1MgPSBbJ0FBQycsICdBQUNMJywgJ0FWQzEnLCAnSDI2NCcsICdUVE1MJywgJ0RGWFAnXTtcbiAgICAvLyBNUEVHLURBU0ggUm9sZSBhbmQgYWNjZXNzaWJpbGl0eSBtYXBwaW5nIGZvciB0ZXh0IHRyYWNrcyBhY2NvcmRpbmcgdG8gRVRTSSBUUyAxMDMgMjg1IHYxLjEuMSAoc2VjdGlvbiA3LjEuMilcbiAgICBjb25zdCBST0xFID0ge1xuICAgICAgICAnQ0FQVCc6ICdtYWluJyxcbiAgICAgICAgJ1NVQlQnOiAnYWx0ZXJuYXRlJyxcbiAgICAgICAgJ0RFU0MnOiAnbWFpbidcbiAgICB9O1xuICAgIGNvbnN0IEFDQ0VTU0lCSUxJVFkgPSB7XG4gICAgICAgICdERVNDJzogJzInXG4gICAgfTtcbiAgICBjb25zdCBzYW1wbGluZ0ZyZXF1ZW5jeUluZGV4ID0ge1xuICAgICAgICA5NjAwMDogMHgwLFxuICAgICAgICA4ODIwMDogMHgxLFxuICAgICAgICA2NDAwMDogMHgyLFxuICAgICAgICA0ODAwMDogMHgzLFxuICAgICAgICA0NDEwMDogMHg0LFxuICAgICAgICAzMjAwMDogMHg1LFxuICAgICAgICAyNDAwMDogMHg2LFxuICAgICAgICAyMjA1MDogMHg3LFxuICAgICAgICAxNjAwMDogMHg4LFxuICAgICAgICAxMjAwMDogMHg5LFxuICAgICAgICAxMTAyNTogMHhBLFxuICAgICAgICA4MDAwOiAweEIsXG4gICAgICAgIDczNTA6IDB4Q1xuICAgIH07XG4gICAgY29uc3QgbWltZVR5cGVNYXAgPSB7XG4gICAgICAgICd2aWRlbyc6ICd2aWRlby9tcDQnLFxuICAgICAgICAnYXVkaW8nOiAnYXVkaW8vbXA0JyxcbiAgICAgICAgJ3RleHQnOiAnYXBwbGljYXRpb24vbXA0J1xuICAgIH07XG5cbiAgICBsZXQgaW5zdGFuY2UsXG4gICAgICAgIGxvZ2dlcixcbiAgICAgICAgaW5pdGlhbEJ1ZmZlclNldHRpbmdzO1xuXG5cbiAgICBmdW5jdGlvbiBzZXR1cCgpIHtcbiAgICAgICAgbG9nZ2VyID0gZGVidWcuZ2V0TG9nZ2VyKGluc3RhbmNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXBQZXJpb2Qoc21vb3RoU3RyZWFtaW5nTWVkaWEsIHRpbWVzY2FsZSkge1xuICAgICAgICBjb25zdCBwZXJpb2QgPSB7fTtcbiAgICAgICAgbGV0IHN0cmVhbXMsXG4gICAgICAgICAgICBhZGFwdGF0aW9uO1xuXG4gICAgICAgIC8vIEZvciBlYWNoIFN0cmVhbUluZGV4IG5vZGUsIGNyZWF0ZSBhbiBBZGFwdGF0aW9uU2V0IGVsZW1lbnRcbiAgICAgICAgcGVyaW9kLkFkYXB0YXRpb25TZXRfYXNBcnJheSA9IFtdO1xuICAgICAgICBzdHJlYW1zID0gc21vb3RoU3RyZWFtaW5nTWVkaWEuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ1N0cmVhbUluZGV4Jyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyZWFtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYWRhcHRhdGlvbiA9IG1hcEFkYXB0YXRpb25TZXQoc3RyZWFtc1tpXSwgdGltZXNjYWxlKTtcbiAgICAgICAgICAgIGlmIChhZGFwdGF0aW9uICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcGVyaW9kLkFkYXB0YXRpb25TZXRfYXNBcnJheS5wdXNoKGFkYXB0YXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBlcmlvZC5BZGFwdGF0aW9uU2V0X2FzQXJyYXkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcGVyaW9kLkFkYXB0YXRpb25TZXQgPSAocGVyaW9kLkFkYXB0YXRpb25TZXRfYXNBcnJheS5sZW5ndGggPiAxKSA/IHBlcmlvZC5BZGFwdGF0aW9uU2V0X2FzQXJyYXkgOiBwZXJpb2QuQWRhcHRhdGlvblNldF9hc0FycmF5WzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBlcmlvZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXBBZGFwdGF0aW9uU2V0KHN0cmVhbUluZGV4LCB0aW1lc2NhbGUpIHtcbiAgICAgICAgY29uc3QgYWRhcHRhdGlvblNldCA9IHt9O1xuICAgICAgICBjb25zdCByZXByZXNlbnRhdGlvbnMgPSBbXTtcbiAgICAgICAgbGV0IHNlZ21lbnRUZW1wbGF0ZTtcbiAgICAgICAgbGV0IHF1YWxpdHlMZXZlbHMsXG4gICAgICAgICAgICByZXByZXNlbnRhdGlvbixcbiAgICAgICAgICAgIHNlZ21lbnRzLFxuICAgICAgICAgICAgaTtcblxuICAgICAgICBjb25zdCBuYW1lID0gc3RyZWFtSW5kZXguZ2V0QXR0cmlidXRlKCdOYW1lJyk7XG4gICAgICAgIGNvbnN0IHR5cGUgPSBzdHJlYW1JbmRleC5nZXRBdHRyaWJ1dGUoJ1R5cGUnKTtcbiAgICAgICAgY29uc3QgbGFuZyA9IHN0cmVhbUluZGV4LmdldEF0dHJpYnV0ZSgnTGFuZ3VhZ2UnKTtcbiAgICAgICAgY29uc3QgZmFsbEJhY2tJZCA9IGxhbmcgPyB0eXBlICsgJ18nICsgbGFuZyA6IHR5cGU7XG5cbiAgICAgICAgYWRhcHRhdGlvblNldC5pZCA9IG5hbWUgfHwgZmFsbEJhY2tJZDtcbiAgICAgICAgYWRhcHRhdGlvblNldC5jb250ZW50VHlwZSA9IHR5cGU7XG4gICAgICAgIGFkYXB0YXRpb25TZXQubGFuZyA9IGxhbmcgfHwgJ3VuZCc7XG4gICAgICAgIGFkYXB0YXRpb25TZXQubWltZVR5cGUgPSBtaW1lVHlwZU1hcFt0eXBlXTtcbiAgICAgICAgYWRhcHRhdGlvblNldC5zdWJUeXBlID0gc3RyZWFtSW5kZXguZ2V0QXR0cmlidXRlKCdTdWJ0eXBlJyk7XG4gICAgICAgIGFkYXB0YXRpb25TZXQubWF4V2lkdGggPSBzdHJlYW1JbmRleC5nZXRBdHRyaWJ1dGUoJ01heFdpZHRoJyk7XG4gICAgICAgIGFkYXB0YXRpb25TZXQubWF4SGVpZ2h0ID0gc3RyZWFtSW5kZXguZ2V0QXR0cmlidXRlKCdNYXhIZWlnaHQnKTtcblxuICAgICAgICAvLyBNYXAgdGV4dCB0cmFja3Mgc3ViVHlwZXMgdG8gTVBFRy1EQVNIIEFkYXB0YXRpb25TZXQgcm9sZSBhbmQgYWNjZXNzaWJpbGl0eSAoc2VlIEVUU0kgVFMgMTAzIDI4NSB2MS4xLjEsIHNlY3Rpb24gNy4xLjIpXG4gICAgICAgIGlmIChhZGFwdGF0aW9uU2V0LnN1YlR5cGUpIHtcbiAgICAgICAgICAgIGlmIChST0xFW2FkYXB0YXRpb25TZXQuc3ViVHlwZV0pIHtcbiAgICAgICAgICAgICAgICBsZXQgcm9sZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1lSWRVcmk6ICd1cm46bXBlZzpkYXNoOnJvbGU6MjAxMScsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBST0xFW2FkYXB0YXRpb25TZXQuc3ViVHlwZV1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGFkYXB0YXRpb25TZXQuUm9sZSA9IHJvbGU7XG4gICAgICAgICAgICAgICAgYWRhcHRhdGlvblNldC5Sb2xlX2FzQXJyYXkgPSBbcm9sZV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoQUNDRVNTSUJJTElUWVthZGFwdGF0aW9uU2V0LnN1YlR5cGVdKSB7XG4gICAgICAgICAgICAgICAgbGV0IGFjY2Vzc2liaWxpdHkgPSB7XG4gICAgICAgICAgICAgICAgICAgIHNjaGVtZUlkVXJpOiAndXJuOnR2YTptZXRhZGF0YTpjczpBdWRpb1B1cnBvc2VDUzoyMDA3JyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IEFDQ0VTU0lCSUxJVFlbYWRhcHRhdGlvblNldC5zdWJUeXBlXVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYWRhcHRhdGlvblNldC5BY2Nlc3NpYmlsaXR5ID0gYWNjZXNzaWJpbGl0eTtcbiAgICAgICAgICAgICAgICBhZGFwdGF0aW9uU2V0LkFjY2Vzc2liaWxpdHlfYXNBcnJheSA9IFthY2Nlc3NpYmlsaXR5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBhIFNlZ21lbnRUZW1wbGF0ZSB3aXRoIGEgU2VnbWVudFRpbWVsaW5lXG4gICAgICAgIHNlZ21lbnRUZW1wbGF0ZSA9IG1hcFNlZ21lbnRUZW1wbGF0ZShzdHJlYW1JbmRleCwgdGltZXNjYWxlKTtcblxuICAgICAgICBxdWFsaXR5TGV2ZWxzID0gc3RyZWFtSW5kZXguZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ1F1YWxpdHlMZXZlbCcpO1xuICAgICAgICAvLyBGb3IgZWFjaCBRdWFsaXR5TGV2ZWwgbm9kZSwgY3JlYXRlIGEgUmVwcmVzZW50YXRpb24gZWxlbWVudFxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcXVhbGl0eUxldmVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgLy8gUHJvcGFnYXRlIEJhc2VVUkwgYW5kIG1pbWVUeXBlXG4gICAgICAgICAgICBxdWFsaXR5TGV2ZWxzW2ldLkJhc2VVUkwgPSBhZGFwdGF0aW9uU2V0LkJhc2VVUkw7XG4gICAgICAgICAgICBxdWFsaXR5TGV2ZWxzW2ldLm1pbWVUeXBlID0gYWRhcHRhdGlvblNldC5taW1lVHlwZTtcblxuICAgICAgICAgICAgLy8gU2V0IHF1YWxpdHkgbGV2ZWwgaWRcbiAgICAgICAgICAgIHF1YWxpdHlMZXZlbHNbaV0uSWQgPSBhZGFwdGF0aW9uU2V0LmlkICsgJ18nICsgcXVhbGl0eUxldmVsc1tpXS5nZXRBdHRyaWJ1dGUoJ0luZGV4Jyk7XG5cbiAgICAgICAgICAgIC8vIE1hcCBSZXByZXNlbnRhdGlvbiB0byBRdWFsaXR5TGV2ZWxcbiAgICAgICAgICAgIHJlcHJlc2VudGF0aW9uID0gbWFwUmVwcmVzZW50YXRpb24ocXVhbGl0eUxldmVsc1tpXSwgc3RyZWFtSW5kZXgpO1xuXG4gICAgICAgICAgICBpZiAocmVwcmVzZW50YXRpb24gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBDb3B5IFNlZ21lbnRUZW1wbGF0ZSBpbnRvIFJlcHJlc2VudGF0aW9uXG4gICAgICAgICAgICAgICAgcmVwcmVzZW50YXRpb24uU2VnbWVudFRlbXBsYXRlID0gc2VnbWVudFRlbXBsYXRlO1xuXG4gICAgICAgICAgICAgICAgcmVwcmVzZW50YXRpb25zLnB1c2gocmVwcmVzZW50YXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcHJlc2VudGF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgYWRhcHRhdGlvblNldC5SZXByZXNlbnRhdGlvbiA9IChyZXByZXNlbnRhdGlvbnMubGVuZ3RoID4gMSkgPyByZXByZXNlbnRhdGlvbnMgOiByZXByZXNlbnRhdGlvbnNbMF07XG4gICAgICAgIGFkYXB0YXRpb25TZXQuUmVwcmVzZW50YXRpb25fYXNBcnJheSA9IHJlcHJlc2VudGF0aW9ucztcblxuICAgICAgICAvLyBTZXQgU2VnbWVudFRlbXBsYXRlXG4gICAgICAgIGFkYXB0YXRpb25TZXQuU2VnbWVudFRlbXBsYXRlID0gc2VnbWVudFRlbXBsYXRlO1xuXG4gICAgICAgIHNlZ21lbnRzID0gc2VnbWVudFRlbXBsYXRlLlNlZ21lbnRUaW1lbGluZS5TX2FzQXJyYXk7XG5cbiAgICAgICAgcmV0dXJuIGFkYXB0YXRpb25TZXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFwUmVwcmVzZW50YXRpb24ocXVhbGl0eUxldmVsLCBzdHJlYW1JbmRleCkge1xuICAgICAgICBjb25zdCByZXByZXNlbnRhdGlvbiA9IHt9O1xuICAgICAgICBjb25zdCB0eXBlID0gc3RyZWFtSW5kZXguZ2V0QXR0cmlidXRlKCdUeXBlJyk7XG4gICAgICAgIGxldCBmb3VyQ0NWYWx1ZSA9IG51bGw7XG5cbiAgICAgICAgcmVwcmVzZW50YXRpb24uaWQgPSBxdWFsaXR5TGV2ZWwuSWQ7XG4gICAgICAgIHJlcHJlc2VudGF0aW9uLmJhbmR3aWR0aCA9IHBhcnNlSW50KHF1YWxpdHlMZXZlbC5nZXRBdHRyaWJ1dGUoJ0JpdHJhdGUnKSwgMTApO1xuICAgICAgICByZXByZXNlbnRhdGlvbi5taW1lVHlwZSA9IHF1YWxpdHlMZXZlbC5taW1lVHlwZTtcbiAgICAgICAgcmVwcmVzZW50YXRpb24ud2lkdGggPSBwYXJzZUludChxdWFsaXR5TGV2ZWwuZ2V0QXR0cmlidXRlKCdNYXhXaWR0aCcpLCAxMCk7XG4gICAgICAgIHJlcHJlc2VudGF0aW9uLmhlaWdodCA9IHBhcnNlSW50KHF1YWxpdHlMZXZlbC5nZXRBdHRyaWJ1dGUoJ01heEhlaWdodCcpLCAxMCk7XG5cbiAgICAgICAgZm91ckNDVmFsdWUgPSBxdWFsaXR5TGV2ZWwuZ2V0QXR0cmlidXRlKCdGb3VyQ0MnKTtcblxuICAgICAgICAvLyBJZiBGb3VyQ0Mgbm90IGRlZmluZWQgYXQgUXVhbGl0eUxldmVsIGxldmVsLCB0aGVuIGdldCBpdCBmcm9tIFN0cmVhbUluZGV4IGxldmVsXG4gICAgICAgIGlmIChmb3VyQ0NWYWx1ZSA9PT0gbnVsbCB8fCBmb3VyQ0NWYWx1ZSA9PT0gJycpIHtcbiAgICAgICAgICAgIGZvdXJDQ1ZhbHVlID0gc3RyZWFtSW5kZXguZ2V0QXR0cmlidXRlKCdGb3VyQ0MnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHN0aWxsIG5vdCBkZWZpbmVkIChvcHRpb25uYWwgZm9yIGF1ZGlvIHN0cmVhbSwgc2VlIGh0dHBzOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvZmY3MjgxMTYlMjh2PXZzLjk1JTI5LmFzcHgpLFxuICAgICAgICAvLyB0aGVuIHdlIGNvbnNpZGVyIHRoZSBzdHJlYW0gaXMgYW4gYXVkaW8gQUFDIHN0cmVhbVxuICAgICAgICBpZiAoZm91ckNDVmFsdWUgPT09IG51bGwgfHwgZm91ckNDVmFsdWUgPT09ICcnKSB7XG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gY29uc3RhbnRzLkFVRElPKSB7XG4gICAgICAgICAgICAgICAgZm91ckNDVmFsdWUgPSAnQUFDJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gY29uc3RhbnRzLlZJREVPKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKCdGb3VyQ0MgaXMgbm90IGRlZmluZWQgd2hlcmVhcyBpdCBpcyByZXF1aXJlZCBmb3IgYSBRdWFsaXR5TGV2ZWwgZWxlbWVudCBmb3IgYSBTdHJlYW1JbmRleCBvZiB0eXBlIFwidmlkZW9cIicpO1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgY29kZWMgaXMgc3VwcG9ydGVkXG4gICAgICAgIGlmIChTVVBQT1JURURfQ09ERUNTLmluZGV4T2YoZm91ckNDVmFsdWUudG9VcHBlckNhc2UoKSkgPT09IC0xKSB7XG4gICAgICAgICAgICAvLyBEbyBub3Qgc2VuZCB3YXJuaW5nXG4gICAgICAgICAgICBsb2dnZXIud2FybignQ29kZWMgbm90IHN1cHBvcnRlZDogJyArIGZvdXJDQ1ZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IGNvZGVjcyB2YWx1ZSBhY2NvcmRpbmcgdG8gRm91ckNDIGZpZWxkXG4gICAgICAgIGlmIChmb3VyQ0NWYWx1ZSA9PT0gJ0gyNjQnIHx8IGZvdXJDQ1ZhbHVlID09PSAnQVZDMScpIHtcbiAgICAgICAgICAgIHJlcHJlc2VudGF0aW9uLmNvZGVjcyA9IGdldEgyNjRDb2RlYyhxdWFsaXR5TGV2ZWwpO1xuICAgICAgICB9IGVsc2UgaWYgKGZvdXJDQ1ZhbHVlLmluZGV4T2YoJ0FBQycpID49IDApIHtcbiAgICAgICAgICAgIHJlcHJlc2VudGF0aW9uLmNvZGVjcyA9IGdldEFBQ0NvZGVjKHF1YWxpdHlMZXZlbCwgZm91ckNDVmFsdWUpO1xuICAgICAgICAgICAgcmVwcmVzZW50YXRpb24uYXVkaW9TYW1wbGluZ1JhdGUgPSBwYXJzZUludChxdWFsaXR5TGV2ZWwuZ2V0QXR0cmlidXRlKCdTYW1wbGluZ1JhdGUnKSwgMTApO1xuICAgICAgICAgICAgcmVwcmVzZW50YXRpb24uYXVkaW9DaGFubmVscyA9IHBhcnNlSW50KHF1YWxpdHlMZXZlbC5nZXRBdHRyaWJ1dGUoJ0NoYW5uZWxzJyksIDEwKTtcbiAgICAgICAgfSBlbHNlIGlmIChmb3VyQ0NWYWx1ZS5pbmRleE9mKCdUVE1MJykgfHwgZm91ckNDVmFsdWUuaW5kZXhPZignREZYUCcpKSB7XG4gICAgICAgICAgICByZXByZXNlbnRhdGlvbi5jb2RlY3MgPSBjb25zdGFudHMuU1RQUDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcHJlc2VudGF0aW9uLmNvZGVjUHJpdmF0ZURhdGEgPSAnJyArIHF1YWxpdHlMZXZlbC5nZXRBdHRyaWJ1dGUoJ0NvZGVjUHJpdmF0ZURhdGEnKTtcbiAgICAgICAgcmVwcmVzZW50YXRpb24uQmFzZVVSTCA9IHF1YWxpdHlMZXZlbC5CYXNlVVJMO1xuXG4gICAgICAgIHJldHVybiByZXByZXNlbnRhdGlvbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRIMjY0Q29kZWMocXVhbGl0eUxldmVsKSB7XG4gICAgICAgIGxldCBjb2RlY1ByaXZhdGVEYXRhID0gcXVhbGl0eUxldmVsLmdldEF0dHJpYnV0ZSgnQ29kZWNQcml2YXRlRGF0YScpLnRvU3RyaW5nKCk7XG4gICAgICAgIGxldCBuYWxIZWFkZXIsXG4gICAgICAgICAgICBhdmNvdGk7XG5cblxuICAgICAgICAvLyBFeHRyYWN0IGZyb20gdGhlIENvZGVjUHJpdmF0ZURhdGEgZmllbGQgdGhlIGhleGFkZWNpbWFsIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBmb2xsb3dpbmdcbiAgICAgICAgLy8gdGhyZWUgYnl0ZXMgaW4gdGhlIHNlcXVlbmNlIHBhcmFtZXRlciBzZXQgTkFMIHVuaXQuXG4gICAgICAgIC8vID0+IEZpbmQgdGhlIFNQUyBuYWwgaGVhZGVyXG4gICAgICAgIG5hbEhlYWRlciA9IC8wMDAwMDAwMVswLTldNy8uZXhlYyhjb2RlY1ByaXZhdGVEYXRhKTtcbiAgICAgICAgLy8gPT4gRmluZCB0aGUgNiBjaGFyYWN0ZXJzIGFmdGVyIHRoZSBTUFMgbmFsSGVhZGVyIChpZiBpdCBleGlzdHMpXG4gICAgICAgIGF2Y290aSA9IG5hbEhlYWRlciAmJiBuYWxIZWFkZXJbMF0gPyAoY29kZWNQcml2YXRlRGF0YS5zdWJzdHIoY29kZWNQcml2YXRlRGF0YS5pbmRleE9mKG5hbEhlYWRlclswXSkgKyAxMCwgNikpIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIHJldHVybiAnYXZjMS4nICsgYXZjb3RpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEFBQ0NvZGVjKHF1YWxpdHlMZXZlbCwgZm91ckNDVmFsdWUpIHtcbiAgICAgICAgY29uc3Qgc2FtcGxpbmdSYXRlID0gcGFyc2VJbnQocXVhbGl0eUxldmVsLmdldEF0dHJpYnV0ZSgnU2FtcGxpbmdSYXRlJyksIDEwKTtcbiAgICAgICAgbGV0IGNvZGVjUHJpdmF0ZURhdGEgPSBxdWFsaXR5TGV2ZWwuZ2V0QXR0cmlidXRlKCdDb2RlY1ByaXZhdGVEYXRhJykudG9TdHJpbmcoKTtcbiAgICAgICAgbGV0IG9iamVjdFR5cGUgPSAwO1xuICAgICAgICBsZXQgY29kZWNQcml2YXRlRGF0YUhleCxcbiAgICAgICAgICAgIGFycjE2LFxuICAgICAgICAgICAgaW5kZXhGcmVxLFxuICAgICAgICAgICAgZXh0ZW5zaW9uU2FtcGxpbmdGcmVxdWVuY3lJbmRleDtcblxuICAgICAgICAvL2Nocm9tZSBwcm9ibGVtLCBpbiBpbXBsaWNpdCBBQUMgSEUgZGVmaW5pdGlvbiwgc28gd2hlbiBBQUNIIGlzIGRldGVjdGVkIGluIEZvdXJDQ1xuICAgICAgICAvL3NldCBvYmplY3RUeXBlIHRvIDUgPT4gc3RyYW5nZSwgaXQgc2hvdWxkIGJlIDJcbiAgICAgICAgaWYgKGZvdXJDQ1ZhbHVlID09PSAnQUFDSCcpIHtcbiAgICAgICAgICAgIG9iamVjdFR5cGUgPSAweDA1O1xuICAgICAgICB9XG4gICAgICAgIC8vaWYgY29kZWNQcml2YXRlRGF0YSBpcyBlbXB0eSwgYnVpbGQgaXQgOlxuICAgICAgICBpZiAoY29kZWNQcml2YXRlRGF0YSA9PT0gdW5kZWZpbmVkIHx8IGNvZGVjUHJpdmF0ZURhdGEgPT09ICcnKSB7XG4gICAgICAgICAgICBvYmplY3RUeXBlID0gMHgwMjsgLy9BQUMgTWFpbiBMb3cgQ29tcGxleGl0eSA9PiBvYmplY3QgVHlwZSA9IDJcbiAgICAgICAgICAgIGluZGV4RnJlcSA9IHNhbXBsaW5nRnJlcXVlbmN5SW5kZXhbc2FtcGxpbmdSYXRlXTtcbiAgICAgICAgICAgIGlmIChmb3VyQ0NWYWx1ZSA9PT0gJ0FBQ0gnKSB7XG4gICAgICAgICAgICAgICAgLy8gNCBieXRlcyA6ICAgICBYWFhYWCAgICAgICAgIFhYWFggICAgICAgICAgWFhYWCAgICAgICAgICAgICBYWFhYICAgICAgICAgICAgICAgICAgWFhYWFggICAgICBYWFggICBYWFhYWFhYXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICcgT2JqZWN0VHlwZScgJ0ZyZXEgSW5kZXgnICdDaGFubmVscyB2YWx1ZScgICAnRXh0ZW5zIFNhbXBsIEZyZXEnICAnT2JqZWN0VHlwZScgICdHQVMnICdhbGlnbm1lbnQgPSAwJ1xuICAgICAgICAgICAgICAgIG9iamVjdFR5cGUgPSAweDA1OyAvLyBIaWdoIEVmZmljaWVuY3kgQUFDIFByb2ZpbGUgPSBvYmplY3QgVHlwZSA9IDUgU0JSXG4gICAgICAgICAgICAgICAgY29kZWNQcml2YXRlRGF0YSA9IG5ldyBVaW50OEFycmF5KDQpO1xuICAgICAgICAgICAgICAgIGV4dGVuc2lvblNhbXBsaW5nRnJlcXVlbmN5SW5kZXggPSBzYW1wbGluZ0ZyZXF1ZW5jeUluZGV4W3NhbXBsaW5nUmF0ZSAqIDJdOyAvLyBpbiBIRSBBQUMgRXh0ZW5zaW9uIFNhbXBsaW5nIGZyZXF1ZW5jZVxuICAgICAgICAgICAgICAgIC8vIGVxdWFscyB0byBTYW1wbGluZ1JhdGUqMlxuICAgICAgICAgICAgICAgIC8vRnJlcSBJbmRleCBpcyBwcmVzZW50IGZvciAzIGJpdHMgaW4gdGhlIGZpcnN0IGJ5dGUsIGxhc3QgYml0IGlzIGluIHRoZSBzZWNvbmRcbiAgICAgICAgICAgICAgICBjb2RlY1ByaXZhdGVEYXRhWzBdID0gKG9iamVjdFR5cGUgPDwgMykgfCAoaW5kZXhGcmVxID4+IDEpO1xuICAgICAgICAgICAgICAgIGNvZGVjUHJpdmF0ZURhdGFbMV0gPSAoaW5kZXhGcmVxIDw8IDcpIHwgKHF1YWxpdHlMZXZlbC5DaGFubmVscyA8PCAzKSB8IChleHRlbnNpb25TYW1wbGluZ0ZyZXF1ZW5jeUluZGV4ID4+IDEpO1xuICAgICAgICAgICAgICAgIGNvZGVjUHJpdmF0ZURhdGFbMl0gPSAoZXh0ZW5zaW9uU2FtcGxpbmdGcmVxdWVuY3lJbmRleCA8PCA3KSB8ICgweDAyIDw8IDIpOyAvLyBvcmlnaW4gb2JqZWN0IHR5cGUgZXF1YWxzIHRvIDIgPT4gQUFDIE1haW4gTG93IENvbXBsZXhpdHlcbiAgICAgICAgICAgICAgICBjb2RlY1ByaXZhdGVEYXRhWzNdID0gMHgwOyAvL2FsaWdubWVudCBiaXRzXG5cbiAgICAgICAgICAgICAgICBhcnIxNiA9IG5ldyBVaW50MTZBcnJheSgyKTtcbiAgICAgICAgICAgICAgICBhcnIxNlswXSA9IChjb2RlY1ByaXZhdGVEYXRhWzBdIDw8IDgpICsgY29kZWNQcml2YXRlRGF0YVsxXTtcbiAgICAgICAgICAgICAgICBhcnIxNlsxXSA9IChjb2RlY1ByaXZhdGVEYXRhWzJdIDw8IDgpICsgY29kZWNQcml2YXRlRGF0YVszXTtcbiAgICAgICAgICAgICAgICAvL2NvbnZlcnQgZGVjaW1hbCB0byBoZXggdmFsdWVcbiAgICAgICAgICAgICAgICBjb2RlY1ByaXZhdGVEYXRhSGV4ID0gYXJyMTZbMF0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgIGNvZGVjUHJpdmF0ZURhdGFIZXggPSBhcnIxNlswXS50b1N0cmluZygxNikgKyBhcnIxNlsxXS50b1N0cmluZygxNik7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gMiBieXRlcyA6ICAgICBYWFhYWCAgICAgICAgIFhYWFggICAgICAgICAgWFhYWCAgICAgICAgICAgICAgWFhYXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICcgT2JqZWN0VHlwZScgJ0ZyZXEgSW5kZXgnICdDaGFubmVscyB2YWx1ZScgICAnR0FTID0gMDAwJ1xuICAgICAgICAgICAgICAgIGNvZGVjUHJpdmF0ZURhdGEgPSBuZXcgVWludDhBcnJheSgyKTtcbiAgICAgICAgICAgICAgICAvL0ZyZXEgSW5kZXggaXMgcHJlc2VudCBmb3IgMyBiaXRzIGluIHRoZSBmaXJzdCBieXRlLCBsYXN0IGJpdCBpcyBpbiB0aGUgc2Vjb25kXG4gICAgICAgICAgICAgICAgY29kZWNQcml2YXRlRGF0YVswXSA9IChvYmplY3RUeXBlIDw8IDMpIHwgKGluZGV4RnJlcSA+PiAxKTtcbiAgICAgICAgICAgICAgICBjb2RlY1ByaXZhdGVEYXRhWzFdID0gKGluZGV4RnJlcSA8PCA3KSB8IChwYXJzZUludChxdWFsaXR5TGV2ZWwuZ2V0QXR0cmlidXRlKCdDaGFubmVscycpLCAxMCkgPDwgMyk7XG4gICAgICAgICAgICAgICAgLy8gcHV0IHRoZSAyIGJ5dGVzIGluIGFuIDE2IGJpdHMgYXJyYXlcbiAgICAgICAgICAgICAgICBhcnIxNiA9IG5ldyBVaW50MTZBcnJheSgxKTtcbiAgICAgICAgICAgICAgICBhcnIxNlswXSA9IChjb2RlY1ByaXZhdGVEYXRhWzBdIDw8IDgpICsgY29kZWNQcml2YXRlRGF0YVsxXTtcbiAgICAgICAgICAgICAgICAvL2NvbnZlcnQgZGVjaW1hbCB0byBoZXggdmFsdWVcbiAgICAgICAgICAgICAgICBjb2RlY1ByaXZhdGVEYXRhSGV4ID0gYXJyMTZbMF0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb2RlY1ByaXZhdGVEYXRhID0gJycgKyBjb2RlY1ByaXZhdGVEYXRhSGV4O1xuICAgICAgICAgICAgY29kZWNQcml2YXRlRGF0YSA9IGNvZGVjUHJpdmF0ZURhdGEudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIHF1YWxpdHlMZXZlbC5zZXRBdHRyaWJ1dGUoJ0NvZGVjUHJpdmF0ZURhdGEnLCBjb2RlY1ByaXZhdGVEYXRhKTtcbiAgICAgICAgfSBlbHNlIGlmIChvYmplY3RUeXBlID09PSAwKSB7XG4gICAgICAgICAgICBvYmplY3RUeXBlID0gKHBhcnNlSW50KGNvZGVjUHJpdmF0ZURhdGEuc3Vic3RyKDAsIDIpLCAxNikgJiAweEY4KSA+PiAzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICdtcDRhLjQwLicgKyBvYmplY3RUeXBlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hcFNlZ21lbnRUZW1wbGF0ZShzdHJlYW1JbmRleCwgdGltZXNjYWxlKSB7XG4gICAgICAgIGNvbnN0IHNlZ21lbnRUZW1wbGF0ZSA9IHt9O1xuICAgICAgICBsZXQgbWVkaWFVcmwsXG4gICAgICAgICAgICBzdHJlYW1JbmRleFRpbWVTY2FsZSxcbiAgICAgICAgICAgIHVybDtcblxuICAgICAgICB1cmwgPSBzdHJlYW1JbmRleC5nZXRBdHRyaWJ1dGUoJ1VybCcpO1xuICAgICAgICBtZWRpYVVybCA9IHVybCA/IHVybC5yZXBsYWNlKCd7Yml0cmF0ZX0nLCAnJEJhbmR3aWR0aCQnKSA6IG51bGw7XG4gICAgICAgIG1lZGlhVXJsID0gbWVkaWFVcmwgPyBtZWRpYVVybC5yZXBsYWNlKCd7c3RhcnQgdGltZX0nLCAnJFRpbWUkJykgOiBudWxsO1xuXG4gICAgICAgIHN0cmVhbUluZGV4VGltZVNjYWxlID0gc3RyZWFtSW5kZXguZ2V0QXR0cmlidXRlKCdUaW1lU2NhbGUnKTtcbiAgICAgICAgc3RyZWFtSW5kZXhUaW1lU2NhbGUgPSBzdHJlYW1JbmRleFRpbWVTY2FsZSA/IHBhcnNlRmxvYXQoc3RyZWFtSW5kZXhUaW1lU2NhbGUpIDogdGltZXNjYWxlO1xuXG4gICAgICAgIHNlZ21lbnRUZW1wbGF0ZS5tZWRpYSA9IG1lZGlhVXJsO1xuICAgICAgICBzZWdtZW50VGVtcGxhdGUudGltZXNjYWxlID0gc3RyZWFtSW5kZXhUaW1lU2NhbGU7XG5cbiAgICAgICAgc2VnbWVudFRlbXBsYXRlLlNlZ21lbnRUaW1lbGluZSA9IG1hcFNlZ21lbnRUaW1lbGluZShzdHJlYW1JbmRleCwgc2VnbWVudFRlbXBsYXRlLnRpbWVzY2FsZSk7XG5cbiAgICAgICAgcmV0dXJuIHNlZ21lbnRUZW1wbGF0ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXBTZWdtZW50VGltZWxpbmUoc3RyZWFtSW5kZXgsIHRpbWVzY2FsZSkge1xuICAgICAgICBjb25zdCBzZWdtZW50VGltZWxpbmUgPSB7fTtcbiAgICAgICAgY29uc3QgY2h1bmtzID0gc3RyZWFtSW5kZXguZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2MnKTtcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBbXTtcbiAgICAgICAgbGV0IHNlZ21lbnQsXG4gICAgICAgICAgICBwcmV2U2VnbWVudCxcbiAgICAgICAgICAgIHRNYW5pZmVzdCxcbiAgICAgICAgICAgIGksaixyO1xuICAgICAgICBsZXQgZHVyYXRpb24gPSAwO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaHVua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNlZ21lbnQgPSB7fTtcblxuICAgICAgICAgICAgLy8gR2V0IHRpbWUgJ3QnIGF0dHJpYnV0ZSB2YWx1ZVxuICAgICAgICAgICAgdE1hbmlmZXN0ID0gY2h1bmtzW2ldLmdldEF0dHJpYnV0ZSgndCcpO1xuXG4gICAgICAgICAgICAvLyA9PiBzZWdtZW50LnRNYW5pZmVzdCA9IG9yaWdpbmFsIHRpbWVzdGFtcCB2YWx1ZSBhcyBhIHN0cmluZyAoZm9yIGNvbnN0cnVjdGluZyB0aGUgZnJhZ21lbnQgcmVxdWVzdCB1cmwsIHNlZSBEYXNoSGFuZGxlcilcbiAgICAgICAgICAgIC8vID0+IHNlZ21lbnQudCA9IG51bWJlciB2YWx1ZSBvZiB0aW1lc3RhbXAgKG1heWJlIHJvdW5kZWQgdmFsdWUsIGJ1dCBvbmx5IGZvciAwLjEgbWljcm9zZWNvbmQpXG4gICAgICAgICAgICBpZiAodE1hbmlmZXN0ICYmIEJpZ0ludCh0TWFuaWZlc3QpLmdyZWF0ZXIoQmlnSW50KE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKSkpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50LnRNYW5pZmVzdCA9IHRNYW5pZmVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlZ21lbnQudCA9IHBhcnNlRmxvYXQodE1hbmlmZXN0KTtcblxuICAgICAgICAgICAgLy8gR2V0IGR1cmF0aW9uICdkJyBhdHRyaWJ1dGUgdmFsdWVcbiAgICAgICAgICAgIHNlZ21lbnQuZCA9IHBhcnNlRmxvYXQoY2h1bmtzW2ldLmdldEF0dHJpYnV0ZSgnZCcpKTtcblxuICAgICAgICAgICAgLy8gSWYgJ3QnIG5vdCBkZWZpbmVkIGZvciBmaXJzdCBzZWdtZW50IHRoZW4gdD0wXG4gICAgICAgICAgICBpZiAoKGkgPT09IDApICYmICFzZWdtZW50LnQpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50LnQgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICBwcmV2U2VnbWVudCA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBwcmV2aW91cyBzZWdtZW50IGR1cmF0aW9uIGlmIG5vdCBkZWZpbmVkXG4gICAgICAgICAgICAgICAgaWYgKCFwcmV2U2VnbWVudC5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcmV2U2VnbWVudC50TWFuaWZlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZTZWdtZW50LmQgPSBCaWdJbnQodE1hbmlmZXN0KS5zdWJ0cmFjdChCaWdJbnQocHJldlNlZ21lbnQudE1hbmlmZXN0KSkudG9KU051bWJlcigpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldlNlZ21lbnQuZCA9IHNlZ21lbnQudCAtIHByZXZTZWdtZW50LnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gKz0gcHJldlNlZ21lbnQuZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gU2V0IHNlZ21lbnQgYWJzb2x1dGUgdGltZXN0YW1wIGlmIG5vdCBzZXQgaW4gbWFuaWZlc3RcbiAgICAgICAgICAgICAgICBpZiAoIXNlZ21lbnQudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldlNlZ21lbnQudE1hbmlmZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWdtZW50LnRNYW5pZmVzdCA9IEJpZ0ludChwcmV2U2VnbWVudC50TWFuaWZlc3QpLmFkZChCaWdJbnQocHJldlNlZ21lbnQuZCkpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWdtZW50LnQgPSBwYXJzZUZsb2F0KHNlZ21lbnQudE1hbmlmZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlZ21lbnQudCA9IHByZXZTZWdtZW50LnQgKyBwcmV2U2VnbWVudC5kO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2VnbWVudC5kKSB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb24gKz0gc2VnbWVudC5kO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDcmVhdGUgbmV3IHNlZ21lbnRcbiAgICAgICAgICAgIHNlZ21lbnRzLnB1c2goc2VnbWVudCk7XG5cbiAgICAgICAgICAgIC8vIFN1cHBvcnQgZm9yICdyJyBhdHRyaWJ1dGUgKGkuZS4gXCJyZXBlYXRcIiBhcyBpbiBNUEVHLURBU0gpXG4gICAgICAgICAgICByID0gcGFyc2VGbG9hdChjaHVua3NbaV0uZ2V0QXR0cmlidXRlKCdyJykpO1xuICAgICAgICAgICAgaWYgKHIpIHtcblxuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCAociAtIDEpOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldlNlZ21lbnQgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgc2VnbWVudCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBzZWdtZW50LnQgPSBwcmV2U2VnbWVudC50ICsgcHJldlNlZ21lbnQuZDtcbiAgICAgICAgICAgICAgICAgICAgc2VnbWVudC5kID0gcHJldlNlZ21lbnQuZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZTZWdtZW50LnRNYW5pZmVzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VnbWVudC50TWFuaWZlc3QgID0gQmlnSW50KHByZXZTZWdtZW50LnRNYW5pZmVzdCkuYWRkKEJpZ0ludChwcmV2U2VnbWVudC5kKSkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiArPSBzZWdtZW50LmQ7XG4gICAgICAgICAgICAgICAgICAgIHNlZ21lbnRzLnB1c2goc2VnbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2VnbWVudFRpbWVsaW5lLlMgPSBzZWdtZW50cztcbiAgICAgICAgc2VnbWVudFRpbWVsaW5lLlNfYXNBcnJheSA9IHNlZ21lbnRzO1xuICAgICAgICBzZWdtZW50VGltZWxpbmUuZHVyYXRpb24gPSBkdXJhdGlvbiAvIHRpbWVzY2FsZTtcblxuICAgICAgICByZXR1cm4gc2VnbWVudFRpbWVsaW5lO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEtJREZyb21Qcm90ZWN0aW9uSGVhZGVyKHByb3RlY3Rpb25IZWFkZXIpIHtcbiAgICAgICAgbGV0IHBySGVhZGVyLFxuICAgICAgICAgICAgd3JtSGVhZGVyLFxuICAgICAgICAgICAgeG1sUmVhZGVyLFxuICAgICAgICAgICAgS0lEO1xuXG4gICAgICAgIC8vIEdldCBQbGF5UmVhZHkgaGVhZGVyIGFzIGJ5dGUgYXJyYXkgKGJhc2U2NCBkZWNvZGVkKVxuICAgICAgICBwckhlYWRlciA9IEJBU0U2NC5kZWNvZGVBcnJheShwcm90ZWN0aW9uSGVhZGVyLmZpcnN0Q2hpbGQuZGF0YSk7XG5cbiAgICAgICAgLy8gR2V0IFJpZ2h0IE1hbmFnZW1lbnQgaGVhZGVyIChXUk1IRUFERVIpIGZyb20gUGxheVJlYWR5IGhlYWRlclxuICAgICAgICB3cm1IZWFkZXIgPSBnZXRXUk1IZWFkZXJGcm9tUFJIZWFkZXIocHJIZWFkZXIpO1xuXG4gICAgICAgIGlmICh3cm1IZWFkZXIpIHtcbiAgICAgICAgICAgIC8vIENvbnZlcnQgZnJvbSBtdWx0aS1ieXRlIHRvIHVuaWNvZGVcbiAgICAgICAgICAgIHdybUhlYWRlciA9IG5ldyBVaW50MTZBcnJheSh3cm1IZWFkZXIuYnVmZmVyKTtcblxuICAgICAgICAgICAgLy8gQ29udmVydCB0byBzdHJpbmdcbiAgICAgICAgICAgIHdybUhlYWRlciA9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgd3JtSGVhZGVyKTtcblxuICAgICAgICAgICAgLy8gUGFyc2UgPFdSTUhlYWRlcj4gdG8gZ2V0IEtJRCBmaWVsZCB2YWx1ZVxuICAgICAgICAgICAgeG1sUmVhZGVyID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKHdybUhlYWRlciwgJ2FwcGxpY2F0aW9uL3htbCcpO1xuICAgICAgICAgICAgS0lEID0geG1sUmVhZGVyLnF1ZXJ5U2VsZWN0b3IoJ0tJRCcpLnRleHRDb250ZW50O1xuXG4gICAgICAgICAgICAvLyBHZXQgS0lEIChiYXNlNjQgZGVjb2RlZCkgYXMgYnl0ZSBhcnJheVxuICAgICAgICAgICAgS0lEID0gQkFTRTY0LmRlY29kZUFycmF5KEtJRCk7XG5cbiAgICAgICAgICAgIC8vIENvbnZlcnQgVVVJRCBmcm9tIGxpdHRsZS1lbmRpYW4gdG8gYmlnLWVuZGlhblxuICAgICAgICAgICAgY29udmVydFV1aWRFbmRpYW5uZXNzKEtJRCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gS0lEO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFdSTUhlYWRlckZyb21QUkhlYWRlcihwckhlYWRlcikge1xuICAgICAgICBsZXQgbGVuZ3RoLFxuICAgICAgICAgICAgcmVjb3JkQ291bnQsXG4gICAgICAgICAgICByZWNvcmRUeXBlLFxuICAgICAgICAgICAgcmVjb3JkTGVuZ3RoLFxuICAgICAgICAgICAgcmVjb3JkVmFsdWU7XG4gICAgICAgIGxldCBpID0gMDtcblxuICAgICAgICAvLyBQYXJzZSBQbGF5UmVhZHkgaGVhZGVyXG5cbiAgICAgICAgLy8gTGVuZ3RoIC0gMzIgYml0cyAoTEUgZm9ybWF0KVxuICAgICAgICBsZW5ndGggPSAocHJIZWFkZXJbaSArIDNdIDw8IDI0KSArIChwckhlYWRlcltpICsgMl0gPDwgMTYpICsgKHBySGVhZGVyW2kgKyAxXSA8PCA4KSArIHBySGVhZGVyW2ldO1xuICAgICAgICBpICs9IDQ7XG5cbiAgICAgICAgLy8gUmVjb3JkIGNvdW50IC0gMTYgYml0cyAoTEUgZm9ybWF0KVxuICAgICAgICByZWNvcmRDb3VudCA9IChwckhlYWRlcltpICsgMV0gPDwgOCkgKyBwckhlYWRlcltpXTtcbiAgICAgICAgaSArPSAyO1xuXG4gICAgICAgIC8vIFBhcnNlIHJlY29yZHNcbiAgICAgICAgd2hpbGUgKGkgPCBwckhlYWRlci5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIFJlY29yZCB0eXBlIC0gMTYgYml0cyAoTEUgZm9ybWF0KVxuICAgICAgICAgICAgcmVjb3JkVHlwZSA9IChwckhlYWRlcltpICsgMV0gPDwgOCkgKyBwckhlYWRlcltpXTtcbiAgICAgICAgICAgIGkgKz0gMjtcblxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgUmlnaHRzIE1hbmFnZW1lbnQgaGVhZGVyIChyZWNvcmQgdHlwZSA9IDB4MDEpXG4gICAgICAgICAgICBpZiAocmVjb3JkVHlwZSA9PT0gMHgwMSkge1xuXG4gICAgICAgICAgICAgICAgLy8gUmVjb3JkIGxlbmd0aCAtIDE2IGJpdHMgKExFIGZvcm1hdClcbiAgICAgICAgICAgICAgICByZWNvcmRMZW5ndGggPSAocHJIZWFkZXJbaSArIDFdIDw8IDgpICsgcHJIZWFkZXJbaV07XG4gICAgICAgICAgICAgICAgaSArPSAyO1xuXG4gICAgICAgICAgICAgICAgLy8gUmVjb3JkIHZhbHVlID0+IGNvbnRhaW5zIDxXUk1IRUFERVI+XG4gICAgICAgICAgICAgICAgcmVjb3JkVmFsdWUgPSBuZXcgVWludDhBcnJheShyZWNvcmRMZW5ndGgpO1xuICAgICAgICAgICAgICAgIHJlY29yZFZhbHVlLnNldChwckhlYWRlci5zdWJhcnJheShpLCBpICsgcmVjb3JkTGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY29yZFZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29udmVydFV1aWRFbmRpYW5uZXNzKHV1aWQpIHtcbiAgICAgICAgc3dhcEJ5dGVzKHV1aWQsIDAsIDMpO1xuICAgICAgICBzd2FwQnl0ZXModXVpZCwgMSwgMik7XG4gICAgICAgIHN3YXBCeXRlcyh1dWlkLCA0LCA1KTtcbiAgICAgICAgc3dhcEJ5dGVzKHV1aWQsIDYsIDcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN3YXBCeXRlcyhieXRlcywgcG9zMSwgcG9zMikge1xuICAgICAgICBjb25zdCB0ZW1wID0gYnl0ZXNbcG9zMV07XG4gICAgICAgIGJ5dGVzW3BvczFdID0gYnl0ZXNbcG9zMl07XG4gICAgICAgIGJ5dGVzW3BvczJdID0gdGVtcDtcbiAgICB9XG5cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZVBSQ29udGVudFByb3RlY3Rpb24ocHJvdGVjdGlvbkhlYWRlcikge1xuICAgICAgICBsZXQgcHJvID0ge1xuICAgICAgICAgICAgX190ZXh0OiBwcm90ZWN0aW9uSGVhZGVyLmZpcnN0Q2hpbGQuZGF0YSxcbiAgICAgICAgICAgIF9fcHJlZml4OiAnbXNwcidcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjaGVtZUlkVXJpOiAndXJuOnV1aWQ6OWEwNGYwNzktOTg0MC00Mjg2LWFiOTItZTY1YmUwODg1Zjk1JyxcbiAgICAgICAgICAgIHZhbHVlOiAnY29tLm1pY3Jvc29mdC5wbGF5cmVhZHknLFxuICAgICAgICAgICAgcHJvOiBwcm8sXG4gICAgICAgICAgICBwcm9fYXNBcnJheTogcHJvXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlV2lkZXZpbmVDb250ZW50UHJvdGVjdGlvbihLSUQpIHtcbiAgICAgICAgbGV0IHdpZGV2aW5lQ1AgPSB7XG4gICAgICAgICAgICBzY2hlbWVJZFVyaTogJ3Vybjp1dWlkOmVkZWY4YmE5LTc5ZDYtNGFjZS1hM2M4LTI3ZGNkNTFkMjFlZCcsXG4gICAgICAgICAgICB2YWx1ZTogJ2NvbS53aWRldmluZS5hbHBoYSdcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFLSUQpXG4gICAgICAgICAgICByZXR1cm4gd2lkZXZpbmVDUDtcbiAgICAgICAgLy8gQ3JlYXRlIFdpZGV2aW5lIENFTkMgaGVhZGVyIChQcm90b2NvbCBCdWZmZXIpIHdpdGggS0lEIHZhbHVlXG4gICAgICAgIGNvbnN0IHd2Q2VuY0hlYWRlciA9IG5ldyBVaW50OEFycmF5KDIgKyBLSUQubGVuZ3RoKTtcbiAgICAgICAgd3ZDZW5jSGVhZGVyWzBdID0gMHgxMjtcbiAgICAgICAgd3ZDZW5jSGVhZGVyWzFdID0gMHgxMDtcbiAgICAgICAgd3ZDZW5jSGVhZGVyLnNldChLSUQsIDIpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIHBzc2ggYm94XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IDEyIC8qIGJveCBsZW5ndGgsIHR5cGUsIHZlcnNpb24gYW5kIGZsYWdzICovICsgMTYgLyogU3lzdGVtSUQgKi8gKyA0IC8qIGRhdGEgbGVuZ3RoICovICsgd3ZDZW5jSGVhZGVyLmxlbmd0aDtcbiAgICAgICAgbGV0IHBzc2ggPSBuZXcgVWludDhBcnJheShsZW5ndGgpO1xuICAgICAgICBsZXQgaSA9IDA7XG5cbiAgICAgICAgLy8gU2V0IGJveCBsZW5ndGggdmFsdWVcbiAgICAgICAgcHNzaFtpKytdID0gKGxlbmd0aCAmIDB4RkYwMDAwMDApID4+IDI0O1xuICAgICAgICBwc3NoW2krK10gPSAobGVuZ3RoICYgMHgwMEZGMDAwMCkgPj4gMTY7XG4gICAgICAgIHBzc2hbaSsrXSA9IChsZW5ndGggJiAweDAwMDBGRjAwKSA+PiA4O1xuICAgICAgICBwc3NoW2krK10gPSAobGVuZ3RoICYgMHgwMDAwMDBGRik7XG5cbiAgICAgICAgLy8gU2V0IHR5cGUgKCdwc3NoJyksIHZlcnNpb24gKDApIGFuZCBmbGFncyAoMClcbiAgICAgICAgcHNzaC5zZXQoWzB4NzAsIDB4NzMsIDB4NzMsIDB4NjgsIDB4MDAsIDB4MDAsIDB4MDAsIDB4MDBdLCBpKTtcbiAgICAgICAgaSArPSA4O1xuXG4gICAgICAgIC8vIFNldCBTeXN0ZW1JRCAoJ2VkZWY4YmE5LTc5ZDYtNGFjZS1hM2M4LTI3ZGNkNTFkMjFlZCcpXG4gICAgICAgIHBzc2guc2V0KFsweGVkLCAweGVmLCAweDhiLCAweGE5LCAgMHg3OSwgMHhkNiwgMHg0YSwgMHhjZSwgMHhhMywgMHhjOCwgMHgyNywgMHhkYywgMHhkNSwgMHgxZCwgMHgyMSwgMHhlZF0sIGkpO1xuICAgICAgICBpICs9IDE2O1xuXG4gICAgICAgIC8vIFNldCBkYXRhIGxlbmd0aCB2YWx1ZVxuICAgICAgICBwc3NoW2krK10gPSAod3ZDZW5jSGVhZGVyLmxlbmd0aCAmIDB4RkYwMDAwMDApID4+IDI0O1xuICAgICAgICBwc3NoW2krK10gPSAod3ZDZW5jSGVhZGVyLmxlbmd0aCAmIDB4MDBGRjAwMDApID4+IDE2O1xuICAgICAgICBwc3NoW2krK10gPSAod3ZDZW5jSGVhZGVyLmxlbmd0aCAmIDB4MDAwMEZGMDApID4+IDg7XG4gICAgICAgIHBzc2hbaSsrXSA9ICh3dkNlbmNIZWFkZXIubGVuZ3RoICYgMHgwMDAwMDBGRik7XG5cbiAgICAgICAgLy8gQ29weSBXaWRldmluZSBDRU5DIGhlYWRlclxuICAgICAgICBwc3NoLnNldCh3dkNlbmNIZWFkZXIsIGkpO1xuXG4gICAgICAgIC8vIENvbnZlcnQgdG8gQkFTRTY0IHN0cmluZ1xuICAgICAgICBwc3NoID0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBwc3NoKTtcbiAgICAgICAgcHNzaCA9IEJBU0U2NC5lbmNvZGVBU0NJSShwc3NoKTtcblxuICAgICAgICB3aWRldmluZUNQLnBzc2ggPSB7IF9fdGV4dDogcHNzaCB9O1xuXG4gICAgICAgIHJldHVybiB3aWRldmluZUNQO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NNYW5pZmVzdCh4bWxEb2MsIG1hbmlmZXN0TG9hZGVkVGltZSkge1xuICAgICAgICBjb25zdCBtYW5pZmVzdCA9IHt9O1xuICAgICAgICBjb25zdCBjb250ZW50UHJvdGVjdGlvbnMgPSBbXTtcbiAgICAgICAgY29uc3Qgc21vb3RoU3RyZWFtaW5nTWVkaWEgPSB4bWxEb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ1Ntb290aFN0cmVhbWluZ01lZGlhJylbMF07XG4gICAgICAgIGNvbnN0IHByb3RlY3Rpb24gPSB4bWxEb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ1Byb3RlY3Rpb24nKVswXTtcbiAgICAgICAgbGV0IHByb3RlY3Rpb25IZWFkZXIgPSBudWxsO1xuICAgICAgICBsZXQgcGVyaW9kLFxuICAgICAgICAgICAgYWRhcHRhdGlvbnMsXG4gICAgICAgICAgICBjb250ZW50UHJvdGVjdGlvbixcbiAgICAgICAgICAgIEtJRCxcbiAgICAgICAgICAgIHRpbWVzdGFtcE9mZnNldCxcbiAgICAgICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgICAgIHNlZ21lbnRzLFxuICAgICAgICAgICAgdGltZXNjYWxlLFxuICAgICAgICAgICAgc2VnbWVudER1cmF0aW9uLFxuICAgICAgICAgICAgaSwgajtcblxuICAgICAgICAvLyBTZXQgbWFuaWZlc3Qgbm9kZSBwcm9wZXJ0aWVzXG4gICAgICAgIG1hbmlmZXN0LnByb3RvY29sID0gJ01TUyc7XG4gICAgICAgIG1hbmlmZXN0LnByb2ZpbGVzID0gJ3VybjptcGVnOmRhc2g6cHJvZmlsZTppc29mZi1saXZlOjIwMTEnO1xuICAgICAgICBtYW5pZmVzdC50eXBlID0gc21vb3RoU3RyZWFtaW5nTWVkaWEuZ2V0QXR0cmlidXRlKCdJc0xpdmUnKSA9PT0gJ1RSVUUnID8gJ2R5bmFtaWMnIDogJ3N0YXRpYyc7XG4gICAgICAgIHRpbWVzY2FsZSA9ICBzbW9vdGhTdHJlYW1pbmdNZWRpYS5nZXRBdHRyaWJ1dGUoJ1RpbWVTY2FsZScpO1xuICAgICAgICBtYW5pZmVzdC50aW1lc2NhbGUgPSB0aW1lc2NhbGUgPyBwYXJzZUZsb2F0KHRpbWVzY2FsZSkgOiBERUZBVUxUX1RJTUVfU0NBTEU7XG4gICAgICAgIGxldCBkdnJXaW5kb3dMZW5ndGggPSBwYXJzZUZsb2F0KHNtb290aFN0cmVhbWluZ01lZGlhLmdldEF0dHJpYnV0ZSgnRFZSV2luZG93TGVuZ3RoJykpO1xuICAgICAgICAvLyBJZiB0aGUgRFZSV2luZG93TGVuZ3RoIGZpZWxkIGlzIG9taXR0ZWQgZm9yIGEgbGl2ZSBwcmVzZW50YXRpb24gb3Igc2V0IHRvIDAsIHRoZSBEVlIgd2luZG93IGlzIGVmZmVjdGl2ZWx5IGluZmluaXRlXG4gICAgICAgIGlmIChtYW5pZmVzdC50eXBlID09PSAnZHluYW1pYycgJiYgKGR2cldpbmRvd0xlbmd0aCA9PT0gMCB8fCBpc05hTihkdnJXaW5kb3dMZW5ndGgpKSkge1xuICAgICAgICAgICAgZHZyV2luZG93TGVuZ3RoID0gSW5maW5pdHk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gU3Rhci1vdmVyXG4gICAgICAgIGlmIChkdnJXaW5kb3dMZW5ndGggPT09IDAgJiYgc21vb3RoU3RyZWFtaW5nTWVkaWEuZ2V0QXR0cmlidXRlKCdDYW5TZWVrJykgPT09ICdUUlVFJykge1xuICAgICAgICAgICAgZHZyV2luZG93TGVuZ3RoID0gSW5maW5pdHk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZHZyV2luZG93TGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbWFuaWZlc3QudGltZVNoaWZ0QnVmZmVyRGVwdGggPSBkdnJXaW5kb3dMZW5ndGggLyBtYW5pZmVzdC50aW1lc2NhbGU7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZHVyYXRpb24gPSBwYXJzZUZsb2F0KHNtb290aFN0cmVhbWluZ01lZGlhLmdldEF0dHJpYnV0ZSgnRHVyYXRpb24nKSk7XG4gICAgICAgIG1hbmlmZXN0Lm1lZGlhUHJlc2VudGF0aW9uRHVyYXRpb24gPSAoZHVyYXRpb24gPT09IDApID8gSW5maW5pdHkgOiBkdXJhdGlvbiAvIG1hbmlmZXN0LnRpbWVzY2FsZTtcbiAgICAgICAgLy8gQnkgZGVmYXVsdCwgc2V0IG1pbkJ1ZmZlclRpbWUgdG8gMiBzZWMuIChidXQgc2V0IGJlbG93IGFjY29yZGluZyB0byB2aWRlbyBzZWdtZW50IGR1cmF0aW9uKVxuICAgICAgICBtYW5pZmVzdC5taW5CdWZmZXJUaW1lID0gMjtcbiAgICAgICAgbWFuaWZlc3QudHRtbFRpbWVJc1JlbGF0aXZlID0gdHJ1ZTtcblxuICAgICAgICAvLyBMaXZlIG1hbmlmZXN0IHdpdGggRHVyYXRpb24gPSBzdGFydC1vdmVyXG4gICAgICAgIGlmIChtYW5pZmVzdC50eXBlID09PSAnZHluYW1pYycgJiYgZHVyYXRpb24gPiAwKSB7XG4gICAgICAgICAgICBtYW5pZmVzdC50eXBlID0gJ3N0YXRpYyc7XG4gICAgICAgICAgICAvLyBXZSBzZXQgdGltZVNoaWZ0QnVmZmVyRGVwdGggdG8gaW5pdGlhbCBkdXJhdGlvbiwgdG8gYmUgdXNlZCBieSBNc3NGcmFnbWVudENvbnRyb2xsZXIgdG8gdXBkYXRlIHNlZ21lbnQgdGltZWxpbmVcbiAgICAgICAgICAgIG1hbmlmZXN0LnRpbWVTaGlmdEJ1ZmZlckRlcHRoID0gZHVyYXRpb24gLyBtYW5pZmVzdC50aW1lc2NhbGU7XG4gICAgICAgICAgICAvLyBEdXJhdGlvbiB3aWxsIGJlIHNldCBhY2NvcmRpbmcgdG8gY3VycmVudCBzZWdtZW50IHRpbWVsaW5lIGR1cmF0aW9uIChzZWUgYmVsb3cpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWFuaWZlc3QudHlwZSA9PT0gJ2R5bmFtaWMnICAmJiBtYW5pZmVzdC50aW1lU2hpZnRCdWZmZXJEZXB0aCA8IEluZmluaXR5KSB7XG4gICAgICAgICAgICBtYW5pZmVzdC5yZWZyZXNoTWFuaWZlc3RPblN3aXRjaFRyYWNrID0gdHJ1ZTsgLy8gUmVmcmVzaCBtYW5pZmVzdCB3aGVuIHN3aXRjaGluZyB0cmFja3NcbiAgICAgICAgICAgIG1hbmlmZXN0LmRvTm90VXBkYXRlRFZSV2luZG93T25CdWZmZXJVcGRhdGVkID0gdHJ1ZTsgLy8gRFZSV2luZG93IGlzIHVwZGF0ZSBieSBNc3NGcmFnbWVudE1vb2ZQb2Nlc3NvciBiYXNlZCBvbiB0ZnJmIGJveGVzXG4gICAgICAgICAgICBtYW5pZmVzdC5pZ25vcmVQb3N0cG9uZVRpbWVQZXJpb2QgPSB0cnVlOyAvLyBOZXZlciB1cGRhdGUgbWFuaWZlc3RcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1hcCBwZXJpb2Qgbm9kZSB0byBtYW5pZmVzdCByb290IG5vZGVcbiAgICAgICAgbWFuaWZlc3QuUGVyaW9kID0gbWFwUGVyaW9kKHNtb290aFN0cmVhbWluZ01lZGlhLCBtYW5pZmVzdC50aW1lc2NhbGUpO1xuICAgICAgICBtYW5pZmVzdC5QZXJpb2RfYXNBcnJheSA9IFttYW5pZmVzdC5QZXJpb2RdO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgcGVyaW9kIHN0YXJ0IHRpbWVcbiAgICAgICAgcGVyaW9kID0gbWFuaWZlc3QuUGVyaW9kO1xuICAgICAgICBwZXJpb2Quc3RhcnQgPSAwO1xuXG4gICAgICAgIC8vIFVuY29tbWVudCB0byB0ZXN0IGxpdmUgdG8gc3RhdGljIG1hbmlmZXN0c1xuICAgICAgICAvLyBpZiAobWFuaWZlc3QudHlwZSAhPT0gJ3N0YXRpYycpIHtcbiAgICAgICAgLy8gICAgIG1hbmlmZXN0LnR5cGUgPSAnc3RhdGljJztcbiAgICAgICAgLy8gICAgIG1hbmlmZXN0Lm1lZGlhUHJlc2VudGF0aW9uRHVyYXRpb24gPSBtYW5pZmVzdC50aW1lU2hpZnRCdWZmZXJEZXB0aDtcbiAgICAgICAgLy8gICAgIG1hbmlmZXN0LnRpbWVTaGlmdEJ1ZmZlckRlcHRoID0gbnVsbDtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIC8vIENvbnRlbnRQcm90ZWN0aW9uIG5vZGVcbiAgICAgICAgaWYgKHByb3RlY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcHJvdGVjdGlvbkhlYWRlciA9IHhtbERvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnUHJvdGVjdGlvbkhlYWRlcicpWzBdO1xuXG4gICAgICAgICAgICAvLyBTb21lIHBhY2thZ2VycyBwdXQgbmV3bGluZXMgaW50byB0aGUgUHJvdGVjdGlvbkhlYWRlciBiYXNlNjQgc3RyaW5nLCB3aGljaCBpcyBub3QgZ29vZFxuICAgICAgICAgICAgLy8gYmVjYXVzZSB0aGlzIGNhbm5vdCBiZSBjb3JyZWN0bHkgcGFyc2VkLiBMZXQncyBqdXN0IGZpbHRlciBvdXQgYW55IG5ld2xpbmVzIGZvdW5kIGluIHRoZXJlLlxuICAgICAgICAgICAgcHJvdGVjdGlvbkhlYWRlci5maXJzdENoaWxkLmRhdGEgPSBwcm90ZWN0aW9uSGVhZGVyLmZpcnN0Q2hpbGQuZGF0YS5yZXBsYWNlKC9cXG58XFxyL2csICcnKTtcblxuICAgICAgICAgICAgLy8gR2V0IEtJRCAoaW4gQ0VOQyBmb3JtYXQpIGZyb20gcHJvdGVjdGlvbiBoZWFkZXJcbiAgICAgICAgICAgIEtJRCA9IGdldEtJREZyb21Qcm90ZWN0aW9uSGVhZGVyKHByb3RlY3Rpb25IZWFkZXIpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgQ29udGVudFByb3RlY3Rpb24gZm9yIFBsYXlSZWFkeVxuICAgICAgICAgICAgY29udGVudFByb3RlY3Rpb24gPSBjcmVhdGVQUkNvbnRlbnRQcm90ZWN0aW9uKHByb3RlY3Rpb25IZWFkZXIpO1xuICAgICAgICAgICAgY29udGVudFByb3RlY3Rpb25bJ2NlbmM6ZGVmYXVsdF9LSUQnXSA9IEtJRDtcbiAgICAgICAgICAgIGNvbnRlbnRQcm90ZWN0aW9ucy5wdXNoKGNvbnRlbnRQcm90ZWN0aW9uKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIENvbnRlbnRQcm90ZWN0aW9uIGZvciBXaWRldmluZSAoYXMgYSBDRU5DIHByb3RlY3Rpb24pXG4gICAgICAgICAgICBjb250ZW50UHJvdGVjdGlvbiA9IGNyZWF0ZVdpZGV2aW5lQ29udGVudFByb3RlY3Rpb24oS0lEKTtcbiAgICAgICAgICAgIGNvbnRlbnRQcm90ZWN0aW9uWydjZW5jOmRlZmF1bHRfS0lEJ10gPSBLSUQ7XG4gICAgICAgICAgICBjb250ZW50UHJvdGVjdGlvbnMucHVzaChjb250ZW50UHJvdGVjdGlvbik7XG5cbiAgICAgICAgICAgIG1hbmlmZXN0LkNvbnRlbnRQcm90ZWN0aW9uID0gY29udGVudFByb3RlY3Rpb25zO1xuICAgICAgICAgICAgbWFuaWZlc3QuQ29udGVudFByb3RlY3Rpb25fYXNBcnJheSA9IGNvbnRlbnRQcm90ZWN0aW9ucztcbiAgICAgICAgfVxuXG4gICAgICAgIGFkYXB0YXRpb25zID0gcGVyaW9kLkFkYXB0YXRpb25TZXRfYXNBcnJheTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWRhcHRhdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGFkYXB0YXRpb25zW2ldLlNlZ21lbnRUZW1wbGF0ZS5pbml0aWFsaXphdGlvbiA9ICckQmFuZHdpZHRoJCc7XG4gICAgICAgICAgICAvLyBQcm9wYWdhdGUgY29udGVudCBwcm90ZWN0aW9uIGluZm9ybWF0aW9uIGludG8gZWFjaCBhZGFwdGF0aW9uXG4gICAgICAgICAgICBpZiAobWFuaWZlc3QuQ29udGVudFByb3RlY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGFkYXB0YXRpb25zW2ldLkNvbnRlbnRQcm90ZWN0aW9uID0gbWFuaWZlc3QuQ29udGVudFByb3RlY3Rpb247XG4gICAgICAgICAgICAgICAgYWRhcHRhdGlvbnNbaV0uQ29udGVudFByb3RlY3Rpb25fYXNBcnJheSA9IG1hbmlmZXN0LkNvbnRlbnRQcm90ZWN0aW9uX2FzQXJyYXk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhZGFwdGF0aW9uc1tpXS5jb250ZW50VHlwZSA9PT0gJ3ZpZGVvJykge1xuICAgICAgICAgICAgICAgIC8vIEdldCB2aWRlbyBzZWdtZW50IGR1cmF0aW9uXG4gICAgICAgICAgICAgICAgc2VnbWVudER1cmF0aW9uID0gYWRhcHRhdGlvbnNbaV0uU2VnbWVudFRlbXBsYXRlLlNlZ21lbnRUaW1lbGluZS5TX2FzQXJyYXlbMF0uZCAvIGFkYXB0YXRpb25zW2ldLlNlZ21lbnRUZW1wbGF0ZS50aW1lc2NhbGU7XG4gICAgICAgICAgICAgICAgLy8gU2V0IG1pbkJ1ZmZlclRpbWUgdG8gb25lIHNlZ21lbnQgZHVyYXRpb25cbiAgICAgICAgICAgICAgICBtYW5pZmVzdC5taW5CdWZmZXJUaW1lID0gc2VnbWVudER1cmF0aW9uO1xuXG4gICAgICAgICAgICAgICAgaWYgKG1hbmlmZXN0LnR5cGUgPT09ICdkeW5hbWljJyApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2V0IGF2YWlsYWJpbGl0eVN0YXJ0VGltZVxuICAgICAgICAgICAgICAgICAgICBzZWdtZW50cyA9IGFkYXB0YXRpb25zW2ldLlNlZ21lbnRUZW1wbGF0ZS5TZWdtZW50VGltZWxpbmUuU19hc0FycmF5O1xuICAgICAgICAgICAgICAgICAgICBsZXQgZW5kVGltZSA9IChzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXS50ICsgc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0uZCkgLyBhZGFwdGF0aW9uc1tpXS5TZWdtZW50VGVtcGxhdGUudGltZXNjYWxlICogMTAwMDtcbiAgICAgICAgICAgICAgICAgICAgbWFuaWZlc3QuYXZhaWxhYmlsaXR5U3RhcnRUaW1lID0gbmV3IERhdGUobWFuaWZlc3RMb2FkZWRUaW1lLmdldFRpbWUoKSAtIGVuZFRpbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIE1hdGNoIHRpbWVTaGlmdEJ1ZmZlckRlcHRoIHRvIHZpZGVvIHNlZ21lbnQgdGltZWxpbmUgZHVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hbmlmZXN0LnRpbWVTaGlmdEJ1ZmZlckRlcHRoID4gMCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgbWFuaWZlc3QudGltZVNoaWZ0QnVmZmVyRGVwdGggIT09IEluZmluaXR5ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5pZmVzdC50aW1lU2hpZnRCdWZmZXJEZXB0aCA+IGFkYXB0YXRpb25zW2ldLlNlZ21lbnRUZW1wbGF0ZS5TZWdtZW50VGltZWxpbmUuZHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hbmlmZXN0LnRpbWVTaGlmdEJ1ZmZlckRlcHRoID0gYWRhcHRhdGlvbnNbaV0uU2VnbWVudFRlbXBsYXRlLlNlZ21lbnRUaW1lbGluZS5kdXJhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhcCBtaW5CdWZmZXJUaW1lIHRvIHRpbWVTaGlmdEJ1ZmZlckRlcHRoXG4gICAgICAgIG1hbmlmZXN0Lm1pbkJ1ZmZlclRpbWUgPSBNYXRoLm1pbihtYW5pZmVzdC5taW5CdWZmZXJUaW1lLCAobWFuaWZlc3QudGltZVNoaWZ0QnVmZmVyRGVwdGggPyBtYW5pZmVzdC50aW1lU2hpZnRCdWZmZXJEZXB0aCA6IEluZmluaXR5KSk7XG5cbiAgICAgICAgLy8gSW4gY2FzZSBvZiBsaXZlIHN0cmVhbXM6XG4gICAgICAgIC8vIDEtIGNvbmZpZ3VyZSBwbGF5ZXIgYnVmZmVyaW5nIHByb3BlcnRpZXMgYWNjb3JkaW5nIHRvIHRhcmdldCBsaXZlIGRlbGF5XG4gICAgICAgIC8vIDItIGFkYXB0IGxpdmUgZGVsYXkgYW5kIHRoZW4gYnVmZmVycyBsZW5ndGggaW4gY2FzZSB0aW1lU2hpZnRCdWZmZXJEZXB0aCBpcyB0b28gc21hbGwgY29tcGFyZWQgdG8gdGFyZ2V0IGxpdmUgZGVsYXkgKHNlZSBQbGF5YmFja0NvbnRyb2xsZXIuY29tcHV0ZUxpdmVEZWxheSgpKVxuICAgICAgICBpZiAobWFuaWZlc3QudHlwZSA9PT0gJ2R5bmFtaWMnKSB7XG4gICAgICAgICAgICBsZXQgdGFyZ2V0TGl2ZURlbGF5ID0gbWVkaWFQbGF5ZXJNb2RlbC5nZXRMaXZlRGVsYXkoKTtcbiAgICAgICAgICAgIGlmICghdGFyZ2V0TGl2ZURlbGF5KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGl2ZURlbGF5RnJhZ21lbnRDb3VudCA9IHNldHRpbmdzLmdldCgpLnN0cmVhbWluZy5saXZlRGVsYXlGcmFnbWVudENvdW50ICE9PSBudWxsICYmICFpc05hTihzZXR0aW5ncy5nZXQoKS5zdHJlYW1pbmcubGl2ZURlbGF5RnJhZ21lbnRDb3VudCkgPyBzZXR0aW5ncy5nZXQoKS5zdHJlYW1pbmcubGl2ZURlbGF5RnJhZ21lbnRDb3VudCA6IDQ7XG4gICAgICAgICAgICAgICAgdGFyZ2V0TGl2ZURlbGF5ID0gc2VnbWVudER1cmF0aW9uICogbGl2ZURlbGF5RnJhZ21lbnRDb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB0YXJnZXREZWxheUNhcHBpbmcgPSBNYXRoLm1heChtYW5pZmVzdC50aW1lU2hpZnRCdWZmZXJEZXB0aCAtIDEwLypFTkRfT0ZfUExBWUxJU1RfUEFERElORyovLCBtYW5pZmVzdC50aW1lU2hpZnRCdWZmZXJEZXB0aCAvIDIpO1xuICAgICAgICAgICAgbGV0IGxpdmVEZWxheSA9IE1hdGgubWluKHRhcmdldERlbGF5Q2FwcGluZywgdGFyZ2V0TGl2ZURlbGF5KTtcbiAgICAgICAgICAgIC8vIENvbnNpZGVyIGEgbWFyZ2luIG9mIG9uZSBzZWdtZW50IGluIG9yZGVyIHRvIGF2b2lkIFByZWNvbmRpdGlvbiBGYWlsZWQgZXJyb3JzICg0MTIpLCBmb3IgZXhhbXBsZSBpZiBhdWRpbyBhbmQgdmlkZW8gYXJlIG5vdCBjb3JyZWN0bHkgc3luY2hyb25pemVkXG4gICAgICAgICAgICBsZXQgYnVmZmVyVGltZSA9IGxpdmVEZWxheSAtIHNlZ21lbnREdXJhdGlvbjtcblxuICAgICAgICAgICAgLy8gU3RvcmUgaW5pdGlhbCBidWZmZXIgc2V0dGluZ3NcbiAgICAgICAgICAgIGluaXRpYWxCdWZmZXJTZXR0aW5ncyA9IHtcbiAgICAgICAgICAgICAgICAnc3RyZWFtaW5nJzoge1xuICAgICAgICAgICAgICAgICAgICAnbGl2ZURlbGF5Jzogc2V0dGluZ3MuZ2V0KCkuc3RyZWFtaW5nLmxpdmVEZWxheSxcbiAgICAgICAgICAgICAgICAgICAgJ3N0YWJsZUJ1ZmZlclRpbWUnOiBzZXR0aW5ncy5nZXQoKS5zdHJlYW1pbmcuc3RhYmxlQnVmZmVyVGltZSxcbiAgICAgICAgICAgICAgICAgICAgJ2J1ZmZlclRpbWVBdFRvcFF1YWxpdHknOiBzZXR0aW5ncy5nZXQoKS5zdHJlYW1pbmcuYnVmZmVyVGltZUF0VG9wUXVhbGl0eSxcbiAgICAgICAgICAgICAgICAgICAgJ2J1ZmZlclRpbWVBdFRvcFF1YWxpdHlMb25nRm9ybSc6IHNldHRpbmdzLmdldCgpLnN0cmVhbWluZy5idWZmZXJUaW1lQXRUb3BRdWFsaXR5TG9uZ0Zvcm1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXR0aW5ncy51cGRhdGUoe1xuICAgICAgICAgICAgICAgICdzdHJlYW1pbmcnOiB7XG4gICAgICAgICAgICAgICAgICAgICdsaXZlRGVsYXknOiBsaXZlRGVsYXksXG4gICAgICAgICAgICAgICAgICAgICdzdGFibGVCdWZmZXJUaW1lJzogYnVmZmVyVGltZSxcbiAgICAgICAgICAgICAgICAgICAgJ2J1ZmZlclRpbWVBdFRvcFF1YWxpdHknOiBidWZmZXJUaW1lLFxuICAgICAgICAgICAgICAgICAgICAnYnVmZmVyVGltZUF0VG9wUXVhbGl0eUxvbmdGb3JtJzogYnVmZmVyVGltZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVsZXRlIENvbnRlbnQgUHJvdGVjdGlvbiB1bmRlciByb290IG1hbmlmZXN0IG5vZGVcbiAgICAgICAgZGVsZXRlIG1hbmlmZXN0LkNvbnRlbnRQcm90ZWN0aW9uO1xuICAgICAgICBkZWxldGUgbWFuaWZlc3QuQ29udGVudFByb3RlY3Rpb25fYXNBcnJheTtcblxuICAgICAgICAvLyBJbiBjYXNlIG9mIFZPRCBzdHJlYW1zLCBjaGVjayBpZiBzdGFydCB0aW1lIGlzIGdyZWF0ZXIgdGhhbiAwXG4gICAgICAgIC8vIFRoZW4gZGV0ZXJtaW5lIHRpbWVzdGFtcCBvZmZzZXQgYWNjb3JkaW5nIHRvIGhpZ2hlciBhdWRpby92aWRlbyBzdGFydCB0aW1lXG4gICAgICAgIC8vICh1c2UgY2FzZSA9IGxpdmUgc3RyZWFtIGRlbGluZWFyaXphdGlvbilcbiAgICAgICAgaWYgKG1hbmlmZXN0LnR5cGUgPT09ICdzdGF0aWMnKSB7XG4gICAgICAgICAgICAvLyBJbiBjYXNlIG9mIHN0YXJ0LW92ZXIgc3RyZWFtIGFuZCBtYW5pZmVzdCByZWxvYWRpbmcgKGR1ZSB0byB0cmFjayBzd2l0Y2gpXG4gICAgICAgICAgICAvLyB3ZSBjb25zaWRlciBwcmV2aW91cyB0aW1lc3RhbXBPZmZzZXQgdG8ga2VlcCB0aW1lbGluZXMgc3luY2hyb25pemVkXG4gICAgICAgICAgICB2YXIgcHJldk1hbmlmZXN0ID0gbWFuaWZlc3RNb2RlbC5nZXRWYWx1ZSgpO1xuICAgICAgICAgICAgaWYgKHByZXZNYW5pZmVzdCAmJiBwcmV2TWFuaWZlc3QudGltZXN0YW1wT2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgdGltZXN0YW1wT2Zmc2V0ID0gcHJldk1hbmlmZXN0LnRpbWVzdGFtcE9mZnNldDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGFkYXB0YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhZGFwdGF0aW9uc1tpXS5jb250ZW50VHlwZSA9PT0gY29uc3RhbnRzLkFVRElPIHx8IGFkYXB0YXRpb25zW2ldLmNvbnRlbnRUeXBlID09PSBjb25zdGFudHMuVklERU8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlZ21lbnRzID0gYWRhcHRhdGlvbnNbaV0uU2VnbWVudFRlbXBsYXRlLlNlZ21lbnRUaW1lbGluZS5TX2FzQXJyYXk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydFRpbWUgPSBzZWdtZW50c1swXS50O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRpbWVzdGFtcE9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wT2Zmc2V0ID0gc3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wT2Zmc2V0ID0gTWF0aC5taW4odGltZXN0YW1wT2Zmc2V0LCBzdGFydFRpbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29ycmVjdCBjb250ZW50IGR1cmF0aW9uIGFjY29yZGluZyB0byBtaW5pbXVtIGFkYXB0YXRpb24ncyBzZWdtZW50IHRpbWVsaW5lIGR1cmF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbiBvcmRlciB0byBmb3JjZSA8dmlkZW8+IGVsZW1lbnQgc2VuZGluZyAnZW5kZWQnIGV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5pZmVzdC5tZWRpYVByZXNlbnRhdGlvbkR1cmF0aW9uID0gTWF0aC5taW4obWFuaWZlc3QubWVkaWFQcmVzZW50YXRpb25EdXJhdGlvbiwgYWRhcHRhdGlvbnNbaV0uU2VnbWVudFRlbXBsYXRlLlNlZ21lbnRUaW1lbGluZS5kdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGltZXN0YW1wT2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIFBhdGNoIHNlZ21lbnQgdGVtcGxhdGVzIHRpbWVzdGFtcHMgYW5kIGRldGVybWluZSBwZXJpb2Qgc3RhcnQgdGltZSAoc2luY2UgYXVkaW8vdmlkZW8gc2hvdWxkIG5vdCBiZSBhbGlnbmVkIHRvIDApXG4gICAgICAgICAgICAgICAgbWFuaWZlc3QudGltZXN0YW1wT2Zmc2V0ID0gdGltZXN0YW1wT2Zmc2V0O1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBhZGFwdGF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBzZWdtZW50cyA9IGFkYXB0YXRpb25zW2ldLlNlZ21lbnRUZW1wbGF0ZS5TZWdtZW50VGltZWxpbmUuU19hc0FycmF5O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgc2VnbWVudHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2VnbWVudHNbal0udE1hbmlmZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VnbWVudHNbal0udE1hbmlmZXN0ID0gc2VnbWVudHNbal0udC50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VnbWVudHNbal0udCAtPSB0aW1lc3RhbXBPZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFkYXB0YXRpb25zW2ldLmNvbnRlbnRUeXBlID09PSBjb25zdGFudHMuQVVESU8gfHwgYWRhcHRhdGlvbnNbaV0uY29udGVudFR5cGUgPT09IGNvbnN0YW50cy5WSURFTykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGVyaW9kLnN0YXJ0ID0gTWF0aC5tYXgoc2VnbWVudHNbMF0udCwgcGVyaW9kLnN0YXJ0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkYXB0YXRpb25zW2ldLlNlZ21lbnRUZW1wbGF0ZS5wcmVzZW50YXRpb25UaW1lT2Zmc2V0ID0gcGVyaW9kLnN0YXJ0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBlcmlvZC5zdGFydCAvPSBtYW5pZmVzdC50aW1lc2NhbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGbG9vciB0aGUgZHVyYXRpb24gdG8gZ2V0IGFyb3VuZCBwcmVjaXNpb24gZGlmZmVyZW5jZXMgYmV0d2VlbiBzZWdtZW50cyB0aW1lc3RhbXBzIGFuZCBNU0UgYnVmZmVyIHRpbWVzdGFtcHNcbiAgICAgICAgLy8gYW5kIHRoZW4gYXZvaWQgJ2VuZGVkJyBldmVudCBub3QgYmVpbmcgcmFpc2VkXG4gICAgICAgIG1hbmlmZXN0Lm1lZGlhUHJlc2VudGF0aW9uRHVyYXRpb24gPSBNYXRoLmZsb29yKG1hbmlmZXN0Lm1lZGlhUHJlc2VudGF0aW9uRHVyYXRpb24gKiAxMDAwKSAvIDEwMDA7XG4gICAgICAgIHBlcmlvZC5kdXJhdGlvbiA9IG1hbmlmZXN0Lm1lZGlhUHJlc2VudGF0aW9uRHVyYXRpb247XG5cbiAgICAgICAgcmV0dXJuIG1hbmlmZXN0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlRE9NKGRhdGEpIHtcbiAgICAgICAgbGV0IHhtbERvYyA9IG51bGw7XG5cbiAgICAgICAgaWYgKHdpbmRvdy5ET01QYXJzZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlciA9IG5ldyB3aW5kb3cuRE9NUGFyc2VyKCk7XG5cbiAgICAgICAgICAgIHhtbERvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcoZGF0YSwgJ3RleHQveG1sJyk7XG4gICAgICAgICAgICBpZiAoeG1sRG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwYXJzZXJlcnJvcicpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BhcnNpbmcgdGhlIG1hbmlmZXN0IGZhaWxlZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHhtbERvYztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRNYXRjaGVycygpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0SXJvbigpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW50ZXJuYWxQYXJzZShkYXRhKSB7XG4gICAgICAgIGxldCB4bWxEb2MgPSBudWxsO1xuICAgICAgICBsZXQgbWFuaWZlc3QgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcblxuICAgICAgICAvLyBQYXJzZSB0aGUgTVNTIFhNTCBtYW5pZmVzdFxuICAgICAgICB4bWxEb2MgPSBwYXJzZURPTShkYXRhKTtcblxuICAgICAgICBjb25zdCB4bWxQYXJzZVRpbWUgPSB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAgICAgaWYgKHhtbERvYyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb252ZXJ0IE1TUyBtYW5pZmVzdCBpbnRvIERBU0ggbWFuaWZlc3RcbiAgICAgICAgbWFuaWZlc3QgPSBwcm9jZXNzTWFuaWZlc3QoeG1sRG9jLCBuZXcgRGF0ZSgpKTtcblxuICAgICAgICBjb25zdCBtc3MyZGFzaFRpbWUgPSB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAgICAgbG9nZ2VyLmluZm8oJ1BhcnNpbmcgY29tcGxldGU6ICh4bWxQYXJzaW5nOiAnICsgKHhtbFBhcnNlVGltZSAtIHN0YXJ0VGltZSkudG9QcmVjaXNpb24oMykgKyAnbXMsIG1zczJkYXNoOiAnICsgKG1zczJkYXNoVGltZSAtIHhtbFBhcnNlVGltZSkudG9QcmVjaXNpb24oMykgKyAnbXMsIHRvdGFsOiAnICsgKChtc3MyZGFzaFRpbWUgLSBzdGFydFRpbWUpIC8gMTAwMCkudG9QcmVjaXNpb24oMykgKyAncyknKTtcblxuICAgICAgICByZXR1cm4gbWFuaWZlc3Q7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIC8vIFJlc3RvcmUgaW5pdGlhbCBidWZmZXIgc2V0dGluZ3NcbiAgICAgICAgaWYgKGluaXRpYWxCdWZmZXJTZXR0aW5ncykge1xuICAgICAgICAgICAgc2V0dGluZ3MudXBkYXRlKGluaXRpYWxCdWZmZXJTZXR0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbnN0YW5jZSA9IHtcbiAgICAgICAgcGFyc2U6IGludGVybmFsUGFyc2UsXG4gICAgICAgIGdldE1hdGNoZXJzOiBnZXRNYXRjaGVycyxcbiAgICAgICAgZ2V0SXJvbjogZ2V0SXJvbixcbiAgICAgICAgcmVzZXQ6IHJlc2V0XG4gICAgfTtcblxuICAgIHNldHVwKCk7XG5cbiAgICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbk1zc1BhcnNlci5fX2Rhc2hqc19mYWN0b3J5X25hbWUgPSAnTXNzUGFyc2VyJztcbmV4cG9ydCBkZWZhdWx0IGRhc2hqcy5GYWN0b3J5TWFrZXIuZ2V0Q2xhc3NGYWN0b3J5KE1zc1BhcnNlcik7IC8qIGpzaGludCBpZ25vcmU6bGluZSAqL1xuIiwiLyoqXG4gKiBUaGUgY29weXJpZ2h0IGluIHRoaXMgc29mdHdhcmUgaXMgYmVpbmcgbWFkZSBhdmFpbGFibGUgdW5kZXIgdGhlIEJTRCBMaWNlbnNlLFxuICogaW5jbHVkZWQgYmVsb3cuIFRoaXMgc29mdHdhcmUgbWF5IGJlIHN1YmplY3QgdG8gb3RoZXIgdGhpcmQgcGFydHkgYW5kIGNvbnRyaWJ1dG9yXG4gKiByaWdodHMsIGluY2x1ZGluZyBwYXRlbnQgcmlnaHRzLCBhbmQgbm8gc3VjaCByaWdodHMgYXJlIGdyYW50ZWQgdW5kZXIgdGhpcyBsaWNlbnNlLlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMywgRGFzaCBJbmR1c3RyeSBGb3J1bS5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0IG1vZGlmaWNhdGlvbixcbiAqIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICogIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuICogIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yXG4gKiAgb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgRGFzaCBJbmR1c3RyeSBGb3J1bSBub3IgdGhlIG5hbWVzIG9mIGl0c1xuICogIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmVcbiAqICB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqXG4gKiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBBUyBJUyBBTkQgQU5ZXG4gKiAgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC5cbiAqICBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULFxuICogIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVRcbiAqICBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SXG4gKiAgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksXG4gKiAgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKVxuICogIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFXG4gKiAgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cbmltcG9ydCBFdmVudHNCYXNlIGZyb20gJy4uL2NvcmUvZXZlbnRzL0V2ZW50c0Jhc2UnO1xuXG4vKipcbiAqIEBjbGFzc1xuICogQGltcGxlbWVudHMgRXZlbnRzQmFzZVxuICovXG5jbGFzcyBNZWRpYVBsYXllckV2ZW50cyBleHRlbmRzIEV2ZW50c0Jhc2Uge1xuXG4gICAgLyoqXG4gICAgICogQGRlc2NyaXB0aW9uIFB1YmxpYyBmYWNpbmcgZXh0ZXJuYWwgZXZlbnRzIHRvIGJlIHVzZWQgd2hlbiBkZXZlbG9waW5nIGEgcGxheWVyIHRoYXQgaW1wbGVtZW50cyBkYXNoLmpzLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICAvKipcbiAgICAgICAgICogVHJpZ2dlcmVkIHdoZW4gcGxheWJhY2sgd2lsbCBub3Qgc3RhcnQgeWV0XG4gICAgICAgICAqIGFzIHRoZSBNUEQncyBhdmFpbGFiaWxpdHlTdGFydFRpbWUgaXMgaW4gdGhlIGZ1dHVyZS5cbiAgICAgICAgICogQ2hlY2sgZGVsYXkgcHJvcGVydHkgaW4gcGF5bG9hZCB0byBkZXRlcm1pbmUgdGltZSBiZWZvcmUgcGxheWJhY2sgd2lsbCBzdGFydC5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI0FTVF9JTl9GVVRVUkVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuQVNUX0lOX0ZVVFVSRSA9ICdhc3RJbkZ1dHVyZSc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXJlZCB3aGVuIHRoZSB2aWRlbyBlbGVtZW50J3MgYnVmZmVyIHN0YXRlIGNoYW5nZXMgdG8gc3RhbGxlZC5cbiAgICAgICAgICogQ2hlY2sgbWVkaWFUeXBlIGluIHBheWxvYWQgdG8gZGV0ZXJtaW5lIHR5cGUgKFZpZGVvLCBBdWRpbywgRnJhZ21lbnRlZFRleHQpLlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjQlVGRkVSX0VNUFRZXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLkJVRkZFUl9FTVBUWSA9ICdidWZmZXJTdGFsbGVkJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJpZ2dlcmVkIHdoZW4gdGhlIHZpZGVvIGVsZW1lbnQncyBidWZmZXIgc3RhdGUgY2hhbmdlcyB0byBsb2FkZWQuXG4gICAgICAgICAqIENoZWNrIG1lZGlhVHlwZSBpbiBwYXlsb2FkIHRvIGRldGVybWluZSB0eXBlIChWaWRlbywgQXVkaW8sIEZyYWdtZW50ZWRUZXh0KS5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI0JVRkZFUl9MT0FERURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuQlVGRkVSX0xPQURFRCA9ICdidWZmZXJMb2FkZWQnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyZWQgd2hlbiB0aGUgdmlkZW8gZWxlbWVudCdzIGJ1ZmZlciBzdGF0ZSBjaGFuZ2VzLCBlaXRoZXIgc3RhbGxlZCBvciBsb2FkZWQuIENoZWNrIHBheWxvYWQgZm9yIHN0YXRlLlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjQlVGRkVSX0xFVkVMX1NUQVRFX0NIQU5HRURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuQlVGRkVSX0xFVkVMX1NUQVRFX0NIQU5HRUQgPSAnYnVmZmVyU3RhdGVDaGFuZ2VkJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJpZ2dlcmVkIHdoZW4gYSBkeW5hbWljIHN0cmVhbSBjaGFuZ2VkIHRvIHN0YXRpYyAodHJhbnNpdGlvbiBwaGFzZSBiZXR3ZWVuIExpdmUgYW5kIE9uLURlbWFuZCkuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNEWU5BTUlDX1RPX1NUQVRJQ1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5EWU5BTUlDX1RPX1NUQVRJQyA9ICdkeW5hbWljVG9TdGF0aWMnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyZWQgd2hlbiB0aGVyZSBpcyBhbiBlcnJvciBmcm9tIHRoZSBlbGVtZW50IG9yIE1TRSBzb3VyY2UgYnVmZmVyLlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjRVJST1JcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuRVJST1IgPSAnZXJyb3InO1xuICAgICAgICAvKipcbiAgICAgICAgICogVHJpZ2dlcmVkIHdoZW4gYSBmcmFnbWVudCBkb3dubG9hZCBoYXMgY29tcGxldGVkLlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjRlJBR01FTlRfTE9BRElOR19DT01QTEVURURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuRlJBR01FTlRfTE9BRElOR19DT01QTEVURUQgPSAnZnJhZ21lbnRMb2FkaW5nQ29tcGxldGVkJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJpZ2dlcmVkIHdoZW4gYSBwYXJ0aWFsIGZyYWdtZW50IGRvd25sb2FkIGhhcyBjb21wbGV0ZWQuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNGUkFHTUVOVF9MT0FESU5HX1BST0dSRVNTXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLkZSQUdNRU5UX0xPQURJTkdfUFJPR1JFU1MgPSAnZnJhZ21lbnRMb2FkaW5nUHJvZ3Jlc3MnO1xuICAgICAgICAvKipcbiAgICAgICAgICogVHJpZ2dlcmVkIHdoZW4gYSBmcmFnbWVudCBkb3dubG9hZCBoYXMgc3RhcnRlZC5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI0ZSQUdNRU5UX0xPQURJTkdfU1RBUlRFRFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5GUkFHTUVOVF9MT0FESU5HX1NUQVJURUQgPSAnZnJhZ21lbnRMb2FkaW5nU3RhcnRlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXJlZCB3aGVuIGEgZnJhZ21lbnQgZG93bmxvYWQgaXMgYWJhbmRvbmVkIGR1ZSB0byBkZXRlY3Rpb24gb2Ygc2xvdyBkb3dubG9hZCBiYXNlIG9uIHRoZSBBQlIgYWJhbmRvbiBydWxlLi5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI0ZSQUdNRU5UX0xPQURJTkdfQUJBTkRPTkVEXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLkZSQUdNRU5UX0xPQURJTkdfQUJBTkRPTkVEID0gJ2ZyYWdtZW50TG9hZGluZ0FiYW5kb25lZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXJlZCB3aGVuIHtAbGluayBtb2R1bGU6RGVidWd9IGxvZ2dlciBtZXRob2RzIGFyZSBjYWxsZWQuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNMT0dcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuTE9HID0gJ2xvZyc7XG5cbiAgICAgICAgLy9UT0RPIHJlZmFjdG9yIHdpdGggaW50ZXJuYWwgZXZlbnRcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXJlZCB3aGVuIHRoZSBtYW5pZmVzdCBsb2FkIGlzIGNvbXBsZXRlXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNNQU5JRkVTVF9MT0FERURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuTUFOSUZFU1RfTE9BREVEID0gJ21hbmlmZXN0TG9hZGVkJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJpZ2dlcmVkIGFueXRpbWUgdGhlcmUgaXMgYSBjaGFuZ2UgdG8gdGhlIG92ZXJhbGwgbWV0cmljcy5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI01FVFJJQ1NfQ0hBTkdFRFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5NRVRSSUNTX0NIQU5HRUQgPSAnbWV0cmljc0NoYW5nZWQnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyZWQgd2hlbiBhbiBpbmRpdmlkdWFsIG1ldHJpYyBpcyBhZGRlZCwgdXBkYXRlZCBvciBjbGVhcmVkLlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjTUVUUklDX0NIQU5HRURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuTUVUUklDX0NIQU5HRUQgPSAnbWV0cmljQ2hhbmdlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXJlZCBldmVyeSB0aW1lIGEgbmV3IG1ldHJpYyBpcyBhZGRlZC5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI01FVFJJQ19BRERFRFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5NRVRSSUNfQURERUQgPSAnbWV0cmljQWRkZWQnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyZWQgZXZlcnkgdGltZSBhIG1ldHJpYyBpcyB1cGRhdGVkLlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjTUVUUklDX1VQREFURURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuTUVUUklDX1VQREFURUQgPSAnbWV0cmljVXBkYXRlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXJlZCBhdCB0aGUgc3RyZWFtIGVuZCBvZiBhIHBlcmlvZC5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1BFUklPRF9TV0lUQ0hfQ09NUExFVEVEXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlBFUklPRF9TV0lUQ0hfQ09NUExFVEVEID0gJ3BlcmlvZFN3aXRjaENvbXBsZXRlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXJlZCB3aGVuIGEgbmV3IHBlcmlvZCBzdGFydHMuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNQRVJJT0RfU1dJVENIX1NUQVJURURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuUEVSSU9EX1NXSVRDSF9TVEFSVEVEID0gJ3BlcmlvZFN3aXRjaFN0YXJ0ZWQnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyZWQgd2hlbiBhbiBBQlIgdXAgL2Rvd24gc3dpdGNoIGlzIGluaXRpYXRlZDsgZWl0aGVyIGJ5IHVzZXIgaW4gbWFudWFsIG1vZGUgb3IgYXV0byBtb2RlIHZpYSBBQlIgcnVsZXMuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNRVUFMSVRZX0NIQU5HRV9SRVFVRVNURURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuUVVBTElUWV9DSEFOR0VfUkVRVUVTVEVEID0gJ3F1YWxpdHlDaGFuZ2VSZXF1ZXN0ZWQnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyZWQgd2hlbiB0aGUgbmV3IEFCUiBxdWFsaXR5IGlzIGJlaW5nIHJlbmRlcmVkIG9uLXNjcmVlbi5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1FVQUxJVFlfQ0hBTkdFX1JFTkRFUkVEXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlFVQUxJVFlfQ0hBTkdFX1JFTkRFUkVEID0gJ3F1YWxpdHlDaGFuZ2VSZW5kZXJlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXJlZCB3aGVuIHRoZSBuZXcgdHJhY2sgaXMgYmVpbmcgcmVuZGVyZWQuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNUUkFDS19DSEFOR0VfUkVOREVSRURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuVFJBQ0tfQ0hBTkdFX1JFTkRFUkVEID0gJ3RyYWNrQ2hhbmdlUmVuZGVyZWQnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyZWQgd2hlbiB0aGUgc291cmNlIGlzIHNldHVwIGFuZCByZWFkeS5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1NPVVJDRV9JTklUSUFMSVpFRFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5TT1VSQ0VfSU5JVElBTElaRUQgPSAnc291cmNlSW5pdGlhbGl6ZWQnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyZWQgd2hlbiBhIHN0cmVhbSAocGVyaW9kKSBpcyBiZWluZyBsb2FkZWRcbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1NUUkVBTV9JTklUSUFMSVpJTkdcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuU1RSRUFNX0lOSVRJQUxJWklORyA9ICdzdHJlYW1Jbml0aWFsaXppbmcnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyZWQgd2hlbiBhIHN0cmVhbSAocGVyaW9kKSBpcyBsb2FkZWRcbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1NUUkVBTV9VUERBVEVEXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlNUUkVBTV9VUERBVEVEID0gJ3N0cmVhbVVwZGF0ZWQnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyZWQgd2hlbiBhIHN0cmVhbSAocGVyaW9kKSBpcyB1cGRhdGVkXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNTVFJFQU1fSU5JVElBTElaRURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuU1RSRUFNX0lOSVRJQUxJWkVEID0gJ3N0cmVhbUluaXRpYWxpemVkJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJpZ2dlcmVkIHdoZW4gdGhlIHBsYXllciBoYXMgYmVlbiByZXNldC5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1NUUkVBTV9URUFSRE9XTl9DT01QTEVURVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5TVFJFQU1fVEVBUkRPV05fQ09NUExFVEUgPSAnc3RyZWFtVGVhcmRvd25Db21wbGV0ZSc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXJlZCBvbmNlIGFsbCB0ZXh0IHRyYWNrcyBkZXRlY3RlZCBpbiB0aGUgTVBEIGFyZSBhZGRlZCB0byB0aGUgdmlkZW8gZWxlbWVudC5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1RFWFRfVFJBQ0tTX0FEREVEXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlRFWFRfVFJBQ0tTX0FEREVEID0gJ2FsbFRleHRUcmFja3NBZGRlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXJlZCB3aGVuIGEgdGV4dCB0cmFjayBpcyBhZGRlZCB0byB0aGUgdmlkZW8gZWxlbWVudCdzIFRleHRUcmFja0xpc3RcbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1RFWFRfVFJBQ0tfQURERURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuVEVYVF9UUkFDS19BRERFRCA9ICd0ZXh0VHJhY2tBZGRlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyaWdnZXJlZCB3aGVuIGEgdHRtbCBjaHVuayBpcyBwYXJzZWQuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNUVE1MX1BBUlNFRFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5UVE1MX1BBUlNFRCA9ICd0dG1sUGFyc2VkJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJpZ2dlcmVkIHdoZW4gYSB0dG1sIGNodW5rIGhhcyB0byBiZSBwYXJzZWQuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNUVE1MX1RPX1BBUlNFXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlRUTUxfVE9fUEFSU0UgPSAndHRtbFRvUGFyc2UnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmlnZ2VyZWQgd2hlbiBhIGNhcHRpb24gaXMgcmVuZGVyZWQuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNDQVBUSU9OX1JFTkRFUkVEXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLkNBUFRJT05fUkVOREVSRUQgPSAnY2FwdGlvblJlbmRlcmVkJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogVHJpZ2dlcmVkIHdoZW4gdGhlIGNhcHRpb24gY29udGFpbmVyIGlzIHJlc2l6ZWQuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNDQVBUSU9OX0NPTlRBSU5FUl9SRVNJWkVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuQ0FQVElPTl9DT05UQUlORVJfUkVTSVpFID0gJ2NhcHRpb25Db250YWluZXJSZXNpemUnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW50IHdoZW4gZW5vdWdoIGRhdGEgaXMgYXZhaWxhYmxlIHRoYXQgdGhlIG1lZGlhIGNhbiBiZSBwbGF5ZWQsXG4gICAgICAgICAqIGF0IGxlYXN0IGZvciBhIGNvdXBsZSBvZiBmcmFtZXMuICBUaGlzIGNvcnJlc3BvbmRzIHRvIHRoZVxuICAgICAgICAgKiBIQVZFX0VOT1VHSF9EQVRBIHJlYWR5U3RhdGUuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNDQU5fUExBWVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5DQU5fUExBWSA9ICdjYW5QbGF5JztcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VudCB3aGVuIHBsYXliYWNrIGNvbXBsZXRlcy5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1BMQVlCQUNLX0VOREVEXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlBMQVlCQUNLX0VOREVEID0gJ3BsYXliYWNrRW5kZWQnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW50IHdoZW4gYW4gZXJyb3Igb2NjdXJzLiAgVGhlIGVsZW1lbnQncyBlcnJvclxuICAgICAgICAgKiBhdHRyaWJ1dGUgY29udGFpbnMgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1BMQVlCQUNLX0VSUk9SXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlBMQVlCQUNLX0VSUk9SID0gJ3BsYXliYWNrRXJyb3InO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW50IHdoZW4gcGxheWJhY2sgaXMgbm90IGFsbG93ZWQgKGZvciBleGFtcGxlIGlmIHVzZXIgZ2VzdHVyZSBpcyBuZWVkZWQpLlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjUExBWUJBQ0tfTk9UX0FMTE9XRURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuUExBWUJBQ0tfTk9UX0FMTE9XRUQgPSAncGxheWJhY2tOb3RBbGxvd2VkJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIG1lZGlhJ3MgbWV0YWRhdGEgaGFzIGZpbmlzaGVkIGxvYWRpbmc7IGFsbCBhdHRyaWJ1dGVzIG5vd1xuICAgICAgICAgKiBjb250YWluIGFzIG11Y2ggdXNlZnVsIGluZm9ybWF0aW9uIGFzIHRoZXkncmUgZ29pbmcgdG8uXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNQTEFZQkFDS19NRVRBREFUQV9MT0FERURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuUExBWUJBQ0tfTUVUQURBVEFfTE9BREVEID0gJ3BsYXliYWNrTWV0YURhdGFMb2FkZWQnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW50IHdoZW4gcGxheWJhY2sgaXMgcGF1c2VkLlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjUExBWUJBQ0tfUEFVU0VEXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlBMQVlCQUNLX1BBVVNFRCA9ICdwbGF5YmFja1BhdXNlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbnQgd2hlbiB0aGUgbWVkaWEgYmVnaW5zIHRvIHBsYXkgKGVpdGhlciBmb3IgdGhlIGZpcnN0IHRpbWUsIGFmdGVyIGhhdmluZyBiZWVuIHBhdXNlZCxcbiAgICAgICAgICogb3IgYWZ0ZXIgZW5kaW5nIGFuZCB0aGVuIHJlc3RhcnRpbmcpLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjUExBWUJBQ0tfUExBWUlOR1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5QTEFZQkFDS19QTEFZSU5HID0gJ3BsYXliYWNrUGxheWluZyc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbnQgcGVyaW9kaWNhbGx5IHRvIGluZm9ybSBpbnRlcmVzdGVkIHBhcnRpZXMgb2YgcHJvZ3Jlc3MgZG93bmxvYWRpbmdcbiAgICAgICAgICogdGhlIG1lZGlhLiBJbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCBhbW91bnQgb2YgdGhlIG1lZGlhIHRoYXQgaGFzXG4gICAgICAgICAqIGJlZW4gZG93bmxvYWRlZCBpcyBhdmFpbGFibGUgaW4gdGhlIG1lZGlhIGVsZW1lbnQncyBidWZmZXJlZCBhdHRyaWJ1dGUuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNQTEFZQkFDS19QUk9HUkVTU1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5QTEFZQkFDS19QUk9HUkVTUyA9ICdwbGF5YmFja1Byb2dyZXNzJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VudCB3aGVuIHRoZSBwbGF5YmFjayBzcGVlZCBjaGFuZ2VzLlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjUExBWUJBQ0tfUkFURV9DSEFOR0VEXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlBMQVlCQUNLX1JBVEVfQ0hBTkdFRCA9ICdwbGF5YmFja1JhdGVDaGFuZ2VkJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VudCB3aGVuIGEgc2VlayBvcGVyYXRpb24gY29tcGxldGVzLlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjUExBWUJBQ0tfU0VFS0VEXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlBMQVlCQUNLX1NFRUtFRCA9ICdwbGF5YmFja1NlZWtlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbnQgd2hlbiBhIHNlZWsgb3BlcmF0aW9uIGJlZ2lucy5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1BMQVlCQUNLX1NFRUtJTkdcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuUExBWUJBQ0tfU0VFS0lORyA9ICdwbGF5YmFja1NlZWtpbmcnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW50IHdoZW4gYSBzZWVrIG9wZXJhdGlvbiBoYXMgYmVlbiBhc2tlZC5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1BMQVlCQUNLX1NFRUtfQVNLRURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuUExBWUJBQ0tfU0VFS19BU0tFRCA9ICdwbGF5YmFja1NlZWtBc2tlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbnQgd2hlbiB0aGUgdmlkZW8gZWxlbWVudCByZXBvcnRzIHN0YWxsZWRcbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1BMQVlCQUNLX1NUQUxMRURcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuUExBWUJBQ0tfU1RBTExFRCA9ICdwbGF5YmFja1N0YWxsZWQnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTZW50IHdoZW4gcGxheWJhY2sgb2YgdGhlIG1lZGlhIHN0YXJ0cyBhZnRlciBoYXZpbmcgYmVlbiBwYXVzZWQ7XG4gICAgICAgICAqIHRoYXQgaXMsIHdoZW4gcGxheWJhY2sgaXMgcmVzdW1lZCBhZnRlciBhIHByaW9yIHBhdXNlIGV2ZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjUExBWUJBQ0tfU1RBUlRFRFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5QTEFZQkFDS19TVEFSVEVEID0gJ3BsYXliYWNrU3RhcnRlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSB0aW1lIGluZGljYXRlZCBieSB0aGUgZWxlbWVudCdzIGN1cnJlbnRUaW1lIGF0dHJpYnV0ZSBoYXMgY2hhbmdlZC5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI1BMQVlCQUNLX1RJTUVfVVBEQVRFRFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5QTEFZQkFDS19USU1FX1VQREFURUQgPSAncGxheWJhY2tUaW1lVXBkYXRlZCc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbnQgd2hlbiB0aGUgbWVkaWEgcGxheWJhY2sgaGFzIHN0b3BwZWQgYmVjYXVzZSBvZiBhIHRlbXBvcmFyeSBsYWNrIG9mIGRhdGEuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNQTEFZQkFDS19XQUlUSU5HXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlBMQVlCQUNLX1dBSVRJTkcgPSAncGxheWJhY2tXYWl0aW5nJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogTWFuaWZlc3QgdmFsaWRpdHkgY2hhbmdlZCAtIEFzIGEgcmVzdWx0IG9mIGFuIE1QRCB2YWxpZGl0eSBleHBpcmF0aW9uIGV2ZW50LlxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjTUFOSUZFU1RfVkFMSURJVFlfQ0hBTkdFRFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5NQU5JRkVTVF9WQUxJRElUWV9DSEFOR0VEID0gJ21hbmlmZXN0VmFsaWRpdHlDaGFuZ2VkJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogQSBnYXAgb2NjdXJlZCBpbiB0aGUgdGltZWxpbmUgd2hpY2ggcmVxdWlyZXMgYSBzZWVrIHRvIHRoZSBuZXh0IHBlcmlvZFxuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjR0FQX0NBVVNFRF9TRUVLX1RPX1BFUklPRF9FTkRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuR0FQX0NBVVNFRF9TRUVLX1RPX1BFUklPRF9FTkQgPSAnZ2FwQ2F1c2VkU2Vla1RvUGVyaW9kRW5kJztcblxuICAgICAgICAvKipcbiAgICAgICAgICogQSBnYXAgb2NjdXJlZCBpbiB0aGUgdGltZWxpbmUgd2hpY2ggcmVxdWlyZXMgYW4gaW50ZXJuYWwgc2Vla1xuICAgICAgICAgKiBAZXZlbnQgTWVkaWFQbGF5ZXJFdmVudHMjR0FQX0NBVVNFRF9JTlRFUk5BTF9TRUVLXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLkdBUF9DQVVTRURfSU5URVJOQUxfU0VFSyA9ICdnYXBDYXVzZWRJbnRlcm5hbFNlZWsnO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEYXNoIGV2ZW50cyBhcmUgdHJpZ2dlcmVkIGF0IHRoZWlyIHJlc3BlY3RpdmUgc3RhcnQgcG9pbnRzIG9uIHRoZSB0aW1lbGluZS5cbiAgICAgICAgICogQGV2ZW50IE1lZGlhUGxheWVyRXZlbnRzI0VWRU5UX01PREVfT05fU1RBUlRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuRVZFTlRfTU9ERV9PTl9TVEFSVCA9ICdldmVudE1vZGVPblN0YXJ0JztcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGFzaCBldmVudHMgYXJlIHRyaWdnZXJlZCBhcyBzb29uIGFzIHRoZXkgd2VyZSBwYXJzZWQuXG4gICAgICAgICAqIEBldmVudCBNZWRpYVBsYXllckV2ZW50cyNFVkVOVF9NT0RFX09OX1JFQ0VJVkVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuRVZFTlRfTU9ERV9PTl9SRUNFSVZFID0gJ2V2ZW50TW9kZU9uUmVjZWl2ZSc7XG4gICAgfVxufVxuXG5sZXQgbWVkaWFQbGF5ZXJFdmVudHMgPSBuZXcgTWVkaWFQbGF5ZXJFdmVudHMoKTtcbmV4cG9ydCBkZWZhdWx0IG1lZGlhUGxheWVyRXZlbnRzO1xuIiwiLyoqXG4gKiBUaGUgY29weXJpZ2h0IGluIHRoaXMgc29mdHdhcmUgaXMgYmVpbmcgbWFkZSBhdmFpbGFibGUgdW5kZXIgdGhlIEJTRCBMaWNlbnNlLFxuICogaW5jbHVkZWQgYmVsb3cuIFRoaXMgc29mdHdhcmUgbWF5IGJlIHN1YmplY3QgdG8gb3RoZXIgdGhpcmQgcGFydHkgYW5kIGNvbnRyaWJ1dG9yXG4gKiByaWdodHMsIGluY2x1ZGluZyBwYXRlbnQgcmlnaHRzLCBhbmQgbm8gc3VjaCByaWdodHMgYXJlIGdyYW50ZWQgdW5kZXIgdGhpcyBsaWNlbnNlLlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMywgRGFzaCBJbmR1c3RyeSBGb3J1bS5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0IG1vZGlmaWNhdGlvbixcbiAqIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICogIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuICogIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yXG4gKiAgb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgRGFzaCBJbmR1c3RyeSBGb3J1bSBub3IgdGhlIG5hbWVzIG9mIGl0c1xuICogIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmVcbiAqICB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqXG4gKiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBBUyBJUyBBTkQgQU5ZXG4gKiAgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC5cbiAqICBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULFxuICogIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVRcbiAqICBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SXG4gKiAgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksXG4gKiAgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKVxuICogIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFXG4gKiAgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cblxuLyoqXG4gKiBSZXByZXNlbnRzIGRhdGEgc3RydWN0dXJlIHRvIGtlZXAgYW5kIGRyaXZlIHtEYXRhQ2h1bmt9XG4gKi9cblxuaW1wb3J0IEZhY3RvcnlNYWtlciBmcm9tICcuLi8uLi9jb3JlL0ZhY3RvcnlNYWtlcic7XG5cbmZ1bmN0aW9uIEluaXRDYWNoZSgpIHtcblxuICAgIGxldCBkYXRhID0ge307XG5cbiAgICBmdW5jdGlvbiBzYXZlIChjaHVuaykge1xuICAgICAgICBjb25zdCBpZCA9IGNodW5rLnN0cmVhbUlkO1xuICAgICAgICBjb25zdCByZXByZXNlbnRhdGlvbklkID0gY2h1bmsucmVwcmVzZW50YXRpb25JZDtcblxuICAgICAgICBkYXRhW2lkXSA9IGRhdGFbaWRdIHx8IHt9O1xuICAgICAgICBkYXRhW2lkXVtyZXByZXNlbnRhdGlvbklkXSA9IGNodW5rO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4dHJhY3QgKHN0cmVhbUlkLCByZXByZXNlbnRhdGlvbklkKSB7XG4gICAgICAgIGlmIChkYXRhICYmIGRhdGFbc3RyZWFtSWRdICYmIGRhdGFbc3RyZWFtSWRdW3JlcHJlc2VudGF0aW9uSWRdKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YVtzdHJlYW1JZF1bcmVwcmVzZW50YXRpb25JZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZnVuY3Rpb24gcmVzZXQgKCkge1xuICAgICAgICBkYXRhID0ge307XG4gICAgfVxuXG4gICAgY29uc3QgaW5zdGFuY2UgPSB7XG4gICAgICAgIHNhdmU6IHNhdmUsXG4gICAgICAgIGV4dHJhY3Q6IGV4dHJhY3QsXG4gICAgICAgIHJlc2V0OiByZXNldFxuICAgIH07XG5cbiAgICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbkluaXRDYWNoZS5fX2Rhc2hqc19mYWN0b3J5X25hbWUgPSAnSW5pdENhY2hlJztcbmV4cG9ydCBkZWZhdWx0IEZhY3RvcnlNYWtlci5nZXRTaW5nbGV0b25GYWN0b3J5KEluaXRDYWNoZSk7XG4iLCIvKipcbiAqIFRoZSBjb3B5cmlnaHQgaW4gdGhpcyBzb2Z0d2FyZSBpcyBiZWluZyBtYWRlIGF2YWlsYWJsZSB1bmRlciB0aGUgQlNEIExpY2Vuc2UsXG4gKiBpbmNsdWRlZCBiZWxvdy4gVGhpcyBzb2Z0d2FyZSBtYXkgYmUgc3ViamVjdCB0byBvdGhlciB0aGlyZCBwYXJ0eSBhbmQgY29udHJpYnV0b3JcbiAqIHJpZ2h0cywgaW5jbHVkaW5nIHBhdGVudCByaWdodHMsIGFuZCBubyBzdWNoIHJpZ2h0cyBhcmUgZ3JhbnRlZCB1bmRlciB0aGlzIGxpY2Vuc2UuXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLCBEYXNoIEluZHVzdHJ5IEZvcnVtLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXQgbW9kaWZpY2F0aW9uLFxuICogYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuICogICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gKiAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gKiAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvbiBhbmQvb3JcbiAqICBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogICogTmVpdGhlciB0aGUgbmFtZSBvZiBEYXNoIEluZHVzdHJ5IEZvcnVtIG5vciB0aGUgbmFtZXMgb2YgaXRzXG4gKiAgY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZVxuICogIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICpcbiAqICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIEFTIElTIEFORCBBTllcbiAqICBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEXG4gKiAgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRSBESVNDTEFJTUVELlxuICogIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgSE9MREVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsXG4gKiAgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVFxuICogIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1JcbiAqICBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSxcbiAqICBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpXG4gKiAgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEVcbiAqICBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuLyoqXG4gKiBAY2xhc3NcbiAqIEBpZ25vcmVcbiAqL1xuY2xhc3MgRGFzaEpTRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKGNvZGUsIG1lc3NhZ2UsIGRhdGEpIHtcbiAgICAgICAgdGhpcy5jb2RlID0gY29kZSB8fCBudWxsO1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8IG51bGw7XG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGEgfHwgbnVsbDtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IERhc2hKU0Vycm9yOyIsIi8qKlxuICogVGhlIGNvcHlyaWdodCBpbiB0aGlzIHNvZnR3YXJlIGlzIGJlaW5nIG1hZGUgYXZhaWxhYmxlIHVuZGVyIHRoZSBCU0QgTGljZW5zZSxcbiAqIGluY2x1ZGVkIGJlbG93LiBUaGlzIHNvZnR3YXJlIG1heSBiZSBzdWJqZWN0IHRvIG90aGVyIHRoaXJkIHBhcnR5IGFuZCBjb250cmlidXRvclxuICogcmlnaHRzLCBpbmNsdWRpbmcgcGF0ZW50IHJpZ2h0cywgYW5kIG5vIHN1Y2ggcmlnaHRzIGFyZSBncmFudGVkIHVuZGVyIHRoaXMgbGljZW5zZS5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMsIERhc2ggSW5kdXN0cnkgRm9ydW0uXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dCBtb2RpZmljYXRpb24sXG4gKiBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXNcbiAqICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uIGFuZC9vclxuICogIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKiAgKiBOZWl0aGVyIHRoZSBuYW1lIG9mIERhc2ggSW5kdXN0cnkgRm9ydW0gbm9yIHRoZSBuYW1lcyBvZiBpdHNcbiAqICBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlXG4gKiAgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgQVMgSVMgQU5EIEFOWVxuICogIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbiAqICBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuXG4gKiAgSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCxcbiAqICBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUXG4gKiAgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUlxuICogIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLFxuICogIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSlcbiAqICBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRVxuICogIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG5cbi8qKlxuICogQGNsYXNzXG4gKiBAaWdub3JlXG4gKi9cbmNsYXNzIERhdGFDaHVuayB7XG4gICAgLy9SZXByZXNlbnRzIGEgZGF0YSBzdHJ1Y3R1cmUgdGhhdCBrZWVwIGFsbCB0aGUgbmVjZXNzYXJ5IGluZm8gYWJvdXQgYSBzaW5nbGUgaW5pdC9tZWRpYSBzZWdtZW50XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuc3RyZWFtSWQgPSBudWxsO1xuICAgICAgICB0aGlzLm1lZGlhSW5mbyA9IG51bGw7XG4gICAgICAgIHRoaXMuc2VnbWVudFR5cGUgPSBudWxsO1xuICAgICAgICB0aGlzLnF1YWxpdHkgPSBOYU47XG4gICAgICAgIHRoaXMuaW5kZXggPSBOYU47XG4gICAgICAgIHRoaXMuYnl0ZXMgPSBudWxsO1xuICAgICAgICB0aGlzLnN0YXJ0ID0gTmFOO1xuICAgICAgICB0aGlzLmVuZCA9IE5hTjtcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IE5hTjtcbiAgICAgICAgdGhpcy5yZXByZXNlbnRhdGlvbklkID0gbnVsbDtcbiAgICAgICAgdGhpcy5lbmRGcmFnbWVudCA9IG51bGw7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBEYXRhQ2h1bms7IiwiLyoqXG4gKiBUaGUgY29weXJpZ2h0IGluIHRoaXMgc29mdHdhcmUgaXMgYmVpbmcgbWFkZSBhdmFpbGFibGUgdW5kZXIgdGhlIEJTRCBMaWNlbnNlLFxuICogaW5jbHVkZWQgYmVsb3cuIFRoaXMgc29mdHdhcmUgbWF5IGJlIHN1YmplY3QgdG8gb3RoZXIgdGhpcmQgcGFydHkgYW5kIGNvbnRyaWJ1dG9yXG4gKiByaWdodHMsIGluY2x1ZGluZyBwYXRlbnQgcmlnaHRzLCBhbmQgbm8gc3VjaCByaWdodHMgYXJlIGdyYW50ZWQgdW5kZXIgdGhpcyBsaWNlbnNlLlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMywgRGFzaCBJbmR1c3RyeSBGb3J1bS5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0IG1vZGlmaWNhdGlvbixcbiAqIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAqICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICogIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuICogIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gYW5kL29yXG4gKiAgb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqICAqIE5laXRoZXIgdGhlIG5hbWUgb2YgRGFzaCBJbmR1c3RyeSBGb3J1bSBub3IgdGhlIG5hbWVzIG9mIGl0c1xuICogIGNvbnRyaWJ1dG9ycyBtYXkgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmVcbiAqICB3aXRob3V0IHNwZWNpZmljIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbi5cbiAqXG4gKiAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBBUyBJUyBBTkQgQU5ZXG4gKiAgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuICogIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkUgRElTQ0xBSU1FRC5cbiAqICBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULFxuICogIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVRcbiAqICBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SXG4gKiAgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksXG4gKiAgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKVxuICogIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFXG4gKiAgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cblxuaW1wb3J0IHsgSFRUUFJlcXVlc3QgfSBmcm9tICcuLi92by9tZXRyaWNzL0hUVFBSZXF1ZXN0JztcblxuLyoqXG4gKiBAY2xhc3NcbiAqIEBpZ25vcmVcbiAqL1xuY2xhc3MgRnJhZ21lbnRSZXF1ZXN0IHtcbiAgICBjb25zdHJ1Y3Rvcih1cmwpIHtcbiAgICAgICAgdGhpcy5hY3Rpb24gPSBGcmFnbWVudFJlcXVlc3QuQUNUSU9OX0RPV05MT0FEO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IE5hTjtcbiAgICAgICAgdGhpcy5tZWRpYVN0YXJ0VGltZSA9IE5hTjtcbiAgICAgICAgdGhpcy5tZWRpYVR5cGUgPSBudWxsO1xuICAgICAgICB0aGlzLm1lZGlhSW5mbyA9IG51bGw7XG4gICAgICAgIHRoaXMudHlwZSA9IG51bGw7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSBOYU47XG4gICAgICAgIHRoaXMudGltZXNjYWxlID0gTmFOO1xuICAgICAgICB0aGlzLnJhbmdlID0gbnVsbDtcbiAgICAgICAgdGhpcy51cmwgPSB1cmwgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5zZXJ2aWNlTG9jYXRpb24gPSBudWxsO1xuICAgICAgICB0aGlzLnJlcXVlc3RTdGFydERhdGUgPSBudWxsO1xuICAgICAgICB0aGlzLmZpcnN0Qnl0ZURhdGUgPSBudWxsO1xuICAgICAgICB0aGlzLnJlcXVlc3RFbmREYXRlID0gbnVsbDtcbiAgICAgICAgdGhpcy5xdWFsaXR5ID0gTmFOO1xuICAgICAgICB0aGlzLmluZGV4ID0gTmFOO1xuICAgICAgICB0aGlzLmF2YWlsYWJpbGl0eVN0YXJ0VGltZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYXZhaWxhYmlsaXR5RW5kVGltZSA9IG51bGw7XG4gICAgICAgIHRoaXMud2FsbFN0YXJ0VGltZSA9IG51bGw7XG4gICAgICAgIHRoaXMuYnl0ZXNMb2FkZWQgPSBOYU47XG4gICAgICAgIHRoaXMuYnl0ZXNUb3RhbCA9IE5hTjtcbiAgICAgICAgdGhpcy5kZWxheUxvYWRpbmdUaW1lID0gTmFOO1xuICAgICAgICB0aGlzLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG4gICAgICAgIHRoaXMucmVwcmVzZW50YXRpb25JZCA9IG51bGw7XG4gICAgfVxuXG4gICAgaXNJbml0aWFsaXphdGlvblJlcXVlc3QoKSB7XG4gICAgICAgIHJldHVybiAodGhpcy50eXBlICYmIHRoaXMudHlwZSA9PT0gSFRUUFJlcXVlc3QuSU5JVF9TRUdNRU5UX1RZUEUpO1xuICAgIH1cblxuICAgIHNldEluZm8oaW5mbykge1xuICAgICAgICB0aGlzLnR5cGUgPSBpbmZvICYmIGluZm8uaW5pdCA/IEhUVFBSZXF1ZXN0LklOSVRfU0VHTUVOVF9UWVBFIDogSFRUUFJlcXVlc3QuTUVESUFfU0VHTUVOVF9UWVBFO1xuICAgICAgICB0aGlzLnVybCA9IGluZm8gJiYgaW5mby51cmwgPyBpbmZvLnVybCA6IG51bGw7XG4gICAgICAgIHRoaXMucmFuZ2UgPSBpbmZvICYmIGluZm8ucmFuZ2UgPyBpbmZvLnJhbmdlLnN0YXJ0ICsgJy0nICsgaW5mby5yYW5nZS5lbmQgOiBudWxsO1xuICAgICAgICB0aGlzLm1lZGlhVHlwZSA9IGluZm8gJiYgaW5mby5tZWRpYVR5cGUgPyBpbmZvLm1lZGlhVHlwZSA6IG51bGw7XG4gICAgfVxufVxuXG5GcmFnbWVudFJlcXVlc3QuQUNUSU9OX0RPV05MT0FEID0gJ2Rvd25sb2FkJztcbkZyYWdtZW50UmVxdWVzdC5BQ1RJT05fQ09NUExFVEUgPSAnY29tcGxldGUnO1xuXG5leHBvcnQgZGVmYXVsdCBGcmFnbWVudFJlcXVlc3Q7XG4iLCIvKipcbiAqIFRoZSBjb3B5cmlnaHQgaW4gdGhpcyBzb2Z0d2FyZSBpcyBiZWluZyBtYWRlIGF2YWlsYWJsZSB1bmRlciB0aGUgQlNEIExpY2Vuc2UsXG4gKiBpbmNsdWRlZCBiZWxvdy4gVGhpcyBzb2Z0d2FyZSBtYXkgYmUgc3ViamVjdCB0byBvdGhlciB0aGlyZCBwYXJ0eSBhbmQgY29udHJpYnV0b3JcbiAqIHJpZ2h0cywgaW5jbHVkaW5nIHBhdGVudCByaWdodHMsIGFuZCBubyBzdWNoIHJpZ2h0cyBhcmUgZ3JhbnRlZCB1bmRlciB0aGlzIGxpY2Vuc2UuXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLCBEYXNoIEluZHVzdHJ5IEZvcnVtLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXQgbW9kaWZpY2F0aW9uLFxuICogYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuICogICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gKiAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gKiAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvbiBhbmQvb3JcbiAqICBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICogICogTmVpdGhlciB0aGUgbmFtZSBvZiBEYXNoIEluZHVzdHJ5IEZvcnVtIG5vciB0aGUgbmFtZXMgb2YgaXRzXG4gKiAgY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb20gdGhpcyBzb2Z0d2FyZVxuICogIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICpcbiAqICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIEFTIElTIEFORCBBTllcbiAqICBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEXG4gKiAgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRSBESVNDTEFJTUVELlxuICogIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgSE9MREVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsXG4gKiAgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVFxuICogIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1JcbiAqICBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSxcbiAqICBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpXG4gKiAgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEVcbiAqICBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbiAqL1xuLyoqXG4gKiBAY2xhc3NkZXNjIFRoaXMgT2JqZWN0IGhvbGRzIHJlZmVyZW5jZSB0byB0aGUgSFRUUFJlcXVlc3QgZm9yIG1hbmlmZXN0LCBmcmFnbWVudCBhbmQgeGxpbmsgbG9hZGluZy5cbiAqIE1lbWJlcnMgd2hpY2ggYXJlIG5vdCBkZWZpbmVkIGluIElTTzIzMDA5LTEgQW5uZXggRCBzaG91bGQgYmUgcHJlZml4ZWQgYnkgYSBfIHNvIHRoYXQgdGhleSBhcmUgaWdub3JlZFxuICogYnkgTWV0cmljcyBSZXBvcnRpbmcgY29kZS5cbiAqIEBpZ25vcmVcbiAqL1xuY2xhc3MgSFRUUFJlcXVlc3Qge1xuICAgIC8qKlxuICAgICAqIEBjbGFzc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogSWRlbnRpZmllciBvZiB0aGUgVENQIGNvbm5lY3Rpb24gb24gd2hpY2ggdGhlIEhUVFAgcmVxdWVzdCB3YXMgc2VudC5cbiAgICAgICAgICogQHB1YmxpY1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50Y3BpZCA9IG51bGw7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGlzIGlzIGFuIG9wdGlvbmFsIHBhcmFtZXRlciBhbmQgc2hvdWxkIG5vdCBiZSBpbmNsdWRlZCBpbiBIVFRQIHJlcXVlc3QvcmVzcG9uc2UgdHJhbnNhY3Rpb25zIGZvciBwcm9ncmVzc2l2ZSBkb3dubG9hZC5cbiAgICAgICAgICogVGhlIHR5cGUgb2YgdGhlIHJlcXVlc3Q6XG4gICAgICAgICAqIC0gTVBEXG4gICAgICAgICAqIC0gWExpbmsgZXhwYW5zaW9uXG4gICAgICAgICAqIC0gSW5pdGlhbGl6YXRpb24gRnJhZ21lbnRcbiAgICAgICAgICogLSBJbmRleCBGcmFnbWVudFxuICAgICAgICAgKiAtIE1lZGlhIEZyYWdtZW50XG4gICAgICAgICAqIC0gQml0c3RyZWFtIFN3aXRjaGluZyBGcmFnbWVudFxuICAgICAgICAgKiAtIG90aGVyXG4gICAgICAgICAqIEBwdWJsaWNcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudHlwZSA9IG51bGw7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgb3JpZ2luYWwgVVJMIChiZWZvcmUgYW55IHJlZGlyZWN0cyBvciBmYWlsdXJlcylcbiAgICAgICAgICogQHB1YmxpY1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy51cmwgPSBudWxsO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjdHVhbCBVUkwgcmVxdWVzdGVkLCBpZiBkaWZmZXJlbnQgZnJvbSBhYm92ZVxuICAgICAgICAgKiBAcHVibGljXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmFjdHVhbHVybCA9IG51bGw7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgY29udGVudHMgb2YgdGhlIGJ5dGUtcmFuZ2Utc3BlYyBwYXJ0IG9mIHRoZSBIVFRQIFJhbmdlIGhlYWRlci5cbiAgICAgICAgICogQHB1YmxpY1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yYW5nZSA9IG51bGw7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWFsLVRpbWUgfCBUaGUgcmVhbCB0aW1lIGF0IHdoaWNoIHRoZSByZXF1ZXN0IHdhcyBzZW50LlxuICAgICAgICAgKiBAcHVibGljXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyZXF1ZXN0ID0gbnVsbDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlYWwtVGltZSB8IFRoZSByZWFsIHRpbWUgYXQgd2hpY2ggdGhlIGZpcnN0IGJ5dGUgb2YgdGhlIHJlc3BvbnNlIHdhcyByZWNlaXZlZC5cbiAgICAgICAgICogQHB1YmxpY1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmVzcG9uc2UgPSBudWxsO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIEhUVFAgcmVzcG9uc2UgY29kZS5cbiAgICAgICAgICogQHB1YmxpY1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZXNwb25zZWNvZGUgPSBudWxsO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGR1cmF0aW9uIG9mIHRoZSB0aHJvdWdocHV0IHRyYWNlIGludGVydmFscyAobXMpLCBmb3Igc3VjY2Vzc2Z1bCByZXF1ZXN0cyBvbmx5LlxuICAgICAgICAgKiBAcHVibGljXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmludGVydmFsID0gbnVsbDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRocm91Z2hwdXQgdHJhY2VzLCBmb3Igc3VjY2Vzc2Z1bCByZXF1ZXN0cyBvbmx5LlxuICAgICAgICAgKiBAcHVibGljXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnRyYWNlID0gW107XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFR5cGUgb2Ygc3RyZWFtIChcImF1ZGlvXCIgfCBcInZpZGVvXCIgZXRjLi4pXG4gICAgICAgICAqIEBwdWJsaWNcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3N0cmVhbSA9IG51bGw7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWFsLVRpbWUgfCBUaGUgcmVhbCB0aW1lIGF0IHdoaWNoIHRoZSByZXF1ZXN0IGZpbmlzaGVkLlxuICAgICAgICAgKiBAcHVibGljXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl90ZmluaXNoID0gbnVsbDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBkdXJhdGlvbiBvZiB0aGUgbWVkaWEgcmVxdWVzdHMsIGlmIGF2YWlsYWJsZSwgaW4gbWlsbGlzZWNvbmRzLlxuICAgICAgICAgKiBAcHVibGljXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9tZWRpYWR1cmF0aW9uID0gbnVsbDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBtZWRpYSBzZWdtZW50IHF1YWxpdHlcbiAgICAgICAgICogQHB1YmxpY1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcXVhbGl0eSA9IG51bGw7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBhbGwgdGhlIHJlc3BvbnNlIGhlYWRlcnMgZnJvbSByZXF1ZXN0LlxuICAgICAgICAgKiBAcHVibGljXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9yZXNwb25zZUhlYWRlcnMgPSBudWxsO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHNlbGVjdGVkIHNlcnZpY2UgbG9jYXRpb24gZm9yIHRoZSByZXF1ZXN0LiBzdHJpbmcuXG4gICAgICAgICAqIEBwdWJsaWNcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3NlcnZpY2VMb2NhdGlvbiA9IG51bGw7XG4gICAgfVxufVxuXG4vKipcbiAqIEBjbGFzc2Rlc2MgVGhpcyBPYmplY3QgaG9sZHMgcmVmZXJlbmNlIHRvIHRoZSBwcm9ncmVzcyBvZiB0aGUgSFRUUFJlcXVlc3QuXG4gKiBAaWdub3JlXG4gKi9cbmNsYXNzIEhUVFBSZXF1ZXN0VHJhY2Uge1xuICAgIC8qKlxuICAgICogQGNsYXNzXG4gICAgKi9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlYWwtVGltZSB8IE1lYXN1cmVtZW50IHN0cmVhbSBzdGFydC5cbiAgICAgICAgICogQHB1YmxpY1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zID0gbnVsbDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1lYXN1cmVtZW50IHN0cmVhbSBkdXJhdGlvbiAobXMpLlxuICAgICAgICAgKiBAcHVibGljXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmQgPSBudWxsO1xuICAgICAgICAvKipcbiAgICAgICAgICogTGlzdCBvZiBpbnRlZ2VycyBjb3VudGluZyB0aGUgYnl0ZXMgcmVjZWl2ZWQgaW4gZWFjaCB0cmFjZSBpbnRlcnZhbCB3aXRoaW4gdGhlIG1lYXN1cmVtZW50IHN0cmVhbS5cbiAgICAgICAgICogQHB1YmxpY1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5iID0gW107XG4gICAgfVxufVxuXG5IVFRQUmVxdWVzdC5HRVQgPSAnR0VUJztcbkhUVFBSZXF1ZXN0LkhFQUQgPSAnSEVBRCc7XG5IVFRQUmVxdWVzdC5NUERfVFlQRSA9ICdNUEQnO1xuSFRUUFJlcXVlc3QuWExJTktfRVhQQU5TSU9OX1RZUEUgPSAnWExpbmtFeHBhbnNpb24nO1xuSFRUUFJlcXVlc3QuSU5JVF9TRUdNRU5UX1RZUEUgPSAnSW5pdGlhbGl6YXRpb25TZWdtZW50JztcbkhUVFBSZXF1ZXN0LklOREVYX1NFR01FTlRfVFlQRSA9ICdJbmRleFNlZ21lbnQnO1xuSFRUUFJlcXVlc3QuTUVESUFfU0VHTUVOVF9UWVBFID0gJ01lZGlhU2VnbWVudCc7XG5IVFRQUmVxdWVzdC5CSVRTVFJFQU1fU1dJVENISU5HX1NFR01FTlRfVFlQRSA9ICdCaXRzdHJlYW1Td2l0Y2hpbmdTZWdtZW50JztcbkhUVFBSZXF1ZXN0Lk9USEVSX1RZUEUgPSAnb3RoZXInO1xuXG5leHBvcnQgeyBIVFRQUmVxdWVzdCwgSFRUUFJlcXVlc3RUcmFjZSB9O1xuIl19

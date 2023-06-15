/**
 * Class (for namespace purposes) containing static helper functions for
 * miscellaneous purposes (geometric functions in Geometry.js).
 */
class Helpers {

    /**
     * Creates deep clone of an array containing multiple objects.
     *
     * @param arr {Array} - array of objects
     * @returns {Array} - deep cloned array of objects
     */
    static cloneArrayOfObjects(arr) {
        const clonedArr = [];
        arr.forEach(obj => {
            clonedArr.push(Object.assign({}, obj));
        });
        return clonedArr;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Converts hex color to rgb color.
     *
     * @param hex {String} - color representation as hex code
     * @returns {String} - color representation as rgb code
     */
    static hexToRgb(hex) {
        //Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `rgb(${parseInt(result[1], 16)}, ` + `${parseInt(result[2], 16)}, ` +
            `${parseInt(result[3], 16)})` : null;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Converts rgb color to hex color.
     *
     * @param rgb {String} - rgb string "rgb(r, g, b)"
     * @returns {String} - color representation as 7-character hex code
     */
    static rgbToHex(rgb) {
        return '#' + rgb.replace(/[^\d,]/g, '').split(',')
            .map(val => {
                const hex = parseInt(val).toString(16);
                return hex.length === 1 ? '0' + hex : hex
            })
            .join('')
    }

    /*----------------------------------------------------------------------*/

    /**
     * Converts font size of an element from em to px, based on the given px
     * font size of a parent element.
     *
     * @param parentFontSize {Number} - px font size of parent element
     * @param emVal {Number} - em font size of given element
     * @returns {Number} - px font size to set element to
     */
    static emToPx(parentFontSize, emVal) {
        return emVal * parentFontSize;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Converts font size of an element from pt to px.
     *
     * @param ptVal {Number} - pt font size of given element
     * @returns {Number} - px font size to set element to
     */
    static ptToPx(ptVal) {
        return 4 / 3 * ptVal;
    }

    /*----------------------------------------------------------------------*/

    /**
     * From a given option parameter (which can be string and contain either
     * 'px' or 'em' or int (then assume it is in px), deduces the value in px
     * for this option (to be consistent with units). Requires px font size of
     * parent element for calculation of em values (as these are in relation to
     * parent text size).
     *
     * @param parentFontSize {Number} - px font size of parent element
     * @param opt {String|Number} - option parameter for font size
     */
    static convertOptStringToPx(parentFontSize, opt) {
        if (Number.isInteger(opt)) {
            return opt;
        }
        const unitMatch = opt.match(/em|px|pt/);
        const unit = unitMatch ? unitMatch[0] : 'px';
        const val = parseFloat(opt);
        switch (unit) {
            case 'px':
                return val;
            case 'em':
                return Helpers.emToPx(parentFontSize, val);
            case 'pt':
                return Helpers.ptToPx(val);
        }
    }

    /*----------------------------------------------------------------------*/

    /**
     * Based on a given object, creates a new object only containing fields with
     * specified keys.
     *
     * @param obj {Object} - the object to take fields from
     * @param keys {Array} - keys of the fields to take
     * @returns {Object} - the new object with only the specified fields
     */
    static filterObjectByKeys(obj, keys) {
        return keys.reduce((newObj, key) => {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = obj[key];
            }
            return newObj;
        }, {});
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds all possible combinations of elements within a given array. Allows
     * definition of how many elements should be contained in these
     * combinations.
     *
     * @param arr {Array} - array to create combinations for
     * @param min {Number} - minimum number of elements in returned
     * combinations
     * @param max {Number} - maximum number of elements in returned
     * combinations
     * @returns {Array} - array of all possible combinations
     */
    static findAllCombinations(arr, min, max) {
        if (!min) min = 0;
        if (!max) max = arr.length - 1;
        if (min > max) return [];
        const recCombine = function (n, src, got, all) {
            if (n === 0) {
                if (got.length > 0) {
                    all.push(got);
                }
                return;
            }
            for (let j = 0, len = src.length; j < len; j++) {
                recCombine(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
            }
        };
        const all = [];
        for (let i = min; i < max + 1; i++) {
            recCombine(i, arr, [], all);
        }
        if (max >= arr.length - 1) all.push(arr);
        return all;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Merges the entries of a given set or array into another given set.
     *
     * @param set1 {Set} - the set to merge entries into
     * @param set2 {Set|Array} - the set or array to take entries from
     */
    static mergeIntoSet(set1, set2) {
        if (!set1 && !set2) return;
        if (!set1) return;
        if (!set2) return;
        set2.forEach(entry => {
            set1.add(entry);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Deletes all entries of a given set or array which are in another
     * given set.
     *
     * @param set1 {Set} - the set to delete from
     * @param set2 {Set|Array} - the set or array to take entries
     * to delete from
     */
    static deleteFromSet(set1, set2) {
        if (!set1 || !set2) return;
        set2.forEach(entry => {
            set1.delete(entry);
        });
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds out whether two sets are unique of each other (no element of one
     * set contained within the other).
     *
     * @param set1 {Set} - first set
     * @param set2 {Set} - second set
     * @returns {Boolean} - whether sets are unique or not
     */
    static areSetsUnique(set1, set2) {
        for (const s1Entry of set1) {
            if (set2.has(s1Entry)) {
                return false;
            }
        }
        for (const s2Entry of set2) {
            if (set1.has(s2Entry)) {
                return false;
            }
        }
        return true;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds out whether two sets contain exactly the same elements.
     *
     * @param set1 {Set} - first st
     * @param set2 {Set} - second set
     * @returns {Boolean} - whether sets contains exactly the same elements or
     * not
     */
    static areSetsTheSame(set1, set2) {
        if (set1.size !== set2.size) {
            return false;
        }
        for (const s1Entry of set1) {
            if (!set2.has(s1Entry)) {
                return false;
            }
        }
        return true;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculates the symmetric difference of two sets and returns the resulting set.
     *
     * @param set1 {Set} - first set
     * @param set2 {Set} - second set
     * @returns {Set} - merged set from input sets
     */
    static getUniqueEntriesOfTwoSets(set1, set2) {
        const uniqueSet = new Set();
        for (const s1Entry of set1) {
            if (!set2.has(s1Entry)) {
                uniqueSet.add(s1Entry);
            }
        }
        for (const s2Entry of set2) {
            if (!set1.has(s2Entry)) {
                uniqueSet.add(s2Entry);
            }
        }
        return uniqueSet;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Calculate the intersection of two sets and return the resulting set.
     *
     * @param set1 {Set} - first set
     * @param set2 {Set} - second set
     * @returns {Set} - merged set from input sets
     */
    static getIntersectionOfTwoSets(set1, set2) {
        const intersectionSet = new Set();
        for (const s1Entry of set1) {
            if (set2.has(s1Entry)) {
                intersectionSet.add(s1Entry);
            }
        }
        return intersectionSet;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Round a value to a given decimal precision.
     *
     * @param value {Number} - value to round
     * @param decimals {Number} - decimal precision to round by
     * @returns {Number} - rounded value
     */
    static round(value, decimals) {
        return parseFloat(Math.round(value.toFixed(decimals + 1) + 'e' + decimals) + 'e-' +
            decimals);
    }

    /*----------------------------------------------------------------------*/

    /**
     * Creates a nested entry inside an object. Given two keys, make sure that
     * the key of the first nexted level is the smaller key, while the key for
     * the second nested level is the larger key.
     *
     * @param obj {Object} - object to make entry in
     * @param firstId {Number} - first key
     * @param secondId {Number} - second key
     * @param entry {*} - entry at nested position in object
     */
    static makeOrderedObjEntry(obj, firstId, secondId, entry) {
        const firstSmaller = (firstId < secondId);
        const first = firstSmaller ? firstId : secondId;
        const second = firstSmaller ? secondId : firstId;
        if (!obj[first]) {
            obj[first] = {};
        }
        obj[first][second] = entry;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Finds entry in nested object of depth 2. Given two keys, the first nexted
     * level is found by the smaller key, the second nested level is found by
     * the larger key.
     *
     * @param obj {Object} - object to find entry in
     * @param firstId {Number} - first key
     * @param secondId {Number} - second key
     * @returns {*} - entry at nested position in object
     */
    static getOrderedObjEntry(obj, firstId, secondId) {
        const firstSmaller = (firstId < secondId);
        const first = firstSmaller ? firstId : secondId;
        const second = firstSmaller ? secondId : firstId;
        return obj[first][second];
    };

    /*----------------------------------------------------------------------*/

    /**
     * Given two sets of two values, finds a common value.
     *
     * @param first_1 {Number} - first value of first set
     * @param first_2 {Number} - second value of first set
     * @param second_1 {Number} - first value of second set
     * @param second_2 {Number} - second value of second set
     * @returns {Object} - object of shared value and the remaining, non-shared
     * values
     */
    static findShared(first_1, first_2, second_1, second_2) {
        const res = {
            shared: undefined, leftFirst: undefined, leftSecond: undefined
        };
        const tryOut = (firstTest, secondTest, firstLeft, secondLeft) => {
            if (firstTest === secondTest) {
                res.shared = firstTest;
                res.leftFirst = firstLeft;
                res.leftSecond = secondLeft;
            }
        };
        tryOut(first_1, second_1, first_2, second_2);
        tryOut(first_2, second_1, first_1, second_2);
        tryOut(first_1, second_2, first_2, second_1);
        tryOut(first_2, second_2, first_1, second_1);
        return res;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Create a string listing the entries of an array in the format "item_1,
     * item_2, ... and itemN".
     *
     * @param arr {Array} - array with string entries to connect
     * @returns {String} - listing of the array entries
     */
    static orderedStringFromArr(arr) {
        const len = arr.length;
        return arr.reduce((accStr, entry, i) => {
            accStr += entry;
            if (i === len - 1) {
                accStr += '.';
            } else if (i === len - 2) {
                accStr += ' and ';
            } else {
                accStr += ', ';
            }
            return accStr;
        }, '');
    }

    /*----------------------------------------------------------------------*/

    /**
     * Translate polygon (defined by its coordinates) to a path (usable
     * directly for SVG path elements). Can also extend a previous path.
     *
     * @param arr {Array} - vertices of polygon
     * @param path {String} - optional path to extend
     * @returns {String} - path string extended by translated polygon path
     */
    static addFormToPath(arr, path = '') {
        const first = arr[0];
        path += `M${first.x} ${first.y}`;
        for (let i = 1, len = arr.length; i < len; ++i) {
            const cur = arr[i];
            path += ` L${cur.x} ${cur.y}`;
        }
        path += ` L ${first.x} ${first.y}`;
        return path;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Find the current position of a node on screen. Basically just uses
     * getBoundingClientRect(), but corrects the output for Microsoft Edge
     * (which gives back wrong kind of client rect).
     *
     * @param node {Element} - the node to get x and y coordinates for
     * @returns {Object} - current screen position of node, containing x- and
     * y-coordinates as mandatory fields
     */
    static getXYOfNode(node) {
        const boundingClient = node.getBoundingClientRect();
        if (!boundingClient.x) {
            return {
                x: boundingClient.left, y: boundingClient.top
            }
        }
        return boundingClient;
    }

    /*----------------------------------------------------------------------*/

    /**
     * Check if two values do not differ by more than a given tolerance.
     *
     * @param val1 {Number} - first value to compare
     * @param val2 {Number} - second value to compare
     * @param tolerance {Number} - allowed tolerance values may differ by
     * @returns {Boolean} - whether the two values are within the specified
     * tolerance
     */
    static isAlmostEqual(val1, val2, tolerance = 0.000001) {
        return Math.abs(val1 - val2) < tolerance;
    }

    /**
     * Creates deep clone of an nested object.
     *
     * @param obj {Array} - object to clone
     * @returns {Array} - deep cloned object
     */
    static deepCloneObject(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

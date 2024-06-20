const prime = 257; // 使用的素数

// Encrypt function
function encrypt(secret, n, num) {
    if (secret.length === 0 || n <= 0) {
        throw new Error('illegal input data');
    }

    if (num < n) {
        throw new Error('num has to be greater than n');
    }

    const result = initArray(num, secret.length);

    for (let j = 0; j < secret.length; j++) {
        const f = getPolynomial(n, secret[j]);
        for (let i = 0; i < num; i++) {
            if (j === 0) {
                result[i][0] = i + 1;
            }
            result[i][j + 1] = f(i + 1);
        }
    }

    const temp = decrypt(result, n);
    for (let i = 0; i < secret.length; i++) {
        if (temp[i] !== secret[i]) {
            return encrypt(secret, n, num);
        }
    }

    return result;
}

// Decrypt function
function decrypt(shares, n) {
    if (shares.length === 0) {
        throw new Error('illegal input data');
    }

    const x = Array.from({ length: n }, (_, i) => i + 1);
    const yss = initInt64Array(shares[0].length - 1, n);

    for (let i = 0; i < n; i++) {
        for (let j = 1; j < shares[i].length; j++) {
            yss[j - 1][i] = shares[i][j];
        }
    }

    const result = [];

    for (const ys of yss) {
        const secret = lagrange(0, x, ys);
        let tempSecret = secret % prime;
        if (tempSecret < 0) {
            tempSecret += prime;
        }
        result.push(tempSecret);
    }

    return new Uint8Array(result);
}

function initArray(a, b) {
    return Array.from({ length: a }, () => new Uint8Array(b + 1));
}

function getPolynomial(n, secretMsg) {
    const coefficients = Array.from({ length: n - 1 }, () => {
        let temp;
        do {
            temp = Math.floor(Math.random() * 256);
        } while (temp === 0);
        return temp;
    });

    return (x) => {
        let count = 0;
        for (let i = 0; i < coefficients.length; i++) {
            count += coefficients[i] * Math.pow(x, n - 1 - i);
        }
        count += secretMsg;
        return count % prime;
    };
}

function initInt64Array(a, b) {
    return Array.from({ length: a }, () => Array(b).fill(0));
}

// Lagrange interpolation
function lagrange(x, xs, ys) {
    let l = 0;
    for (let i = 0; i < xs.length; i++) {
        let term = ys[i];
        for (let j = 0; j < xs.length; j++) {
            if (i !== j) {
                term *= (x - xs[j]) / (xs[i] - xs[j]);
            }
        }
        l += term;
    }
    return l;
}

module.exports = { encrypt, decrypt };

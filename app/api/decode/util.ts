/* First step: JWT decode */
function parseToken(token: string) {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) {
        throw new Error("Invalid token format");
    }
    return { header, payload, signature };
}

function decodeToken(token: string) {
    return null;
}

function decodeHeader(header: string) {
    return null;
}

/* Second step: JWT decode */

function checkSignature(token: string) {
    return null;
}

/* Third step: decrypt JWE*/
function decryptToken(payload: string) {
    return null;
}

/* Fourth step: Educate Users */

function educateUsers() {
    return null;
}
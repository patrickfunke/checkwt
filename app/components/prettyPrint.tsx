
import * as Tooltip from '@radix-ui/react-tooltip';
import React from 'react';

const keyDescriptions: Record<string, string> = {
    iss: 'Issuer: Identifies principal that issued the JWT',
    sub: 'Subject: Identifies the subject of the JWT',
    aud: 'Audience: Identifies the recipients that the JWT is intended for',
    exp: 'Expiration Time: Identifies the expiration time on or after which the JWT must not be accepted',
    nbf: 'Not Before: Identifies the time before which the JWT must not be accepted',
    iat: 'Issued At: Identifies the time at which the JWT was issued',
    jti: 'JWT ID: Unique identifier for the JWT',
    alg: 'Algorithm: The algorithm used to sign or encrypt the JWT',
    typ: 'Type: The type of the token, typically "JWT"',
    enc: 'Encryption Algorithm: The algorithm used to encrypt the JWT (for JWE)',
    kid: 'Key ID: A hint indicating which key was used to secure the JWT',
    // Add more as needed
};

function renderValue(value: any, indent = 0): React.ReactNode {
    if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
            return [
                '[',
                value.map((item, i) => (
                    <React.Fragment key={i}>
                        <br />
                        {Array(indent + 2).fill(' ').join('')}
                        {renderValue(item, indent + 2)}{i < value.length - 1 ? ',' : ''}
                    </React.Fragment>
                )),
                <br key="arr-end" />,
                Array(indent).fill(' ').join(''),
                ']',
            ];
        } else {
            const entries = Object.entries(value);
            return [
                '{',
                entries.map(([k, v], i) => (
                    <React.Fragment key={k}>
                        <br />
                        {Array(indent + 2).fill(' ').join('')}
                        {keyDescriptions[k] ? (
                            <Tooltip.Root delayDuration={200}>
                                <Tooltip.Trigger asChild>
                                    <span className="key underline decoration-dashed decoration-2 cursor-help">
                                        {JSON.stringify(k)}
                                    </span>
                                </Tooltip.Trigger>
                                <Tooltip.Content className="z-50 bg-black text-white dark:bg-gray-200 dark:text-black rounded px-2 py-1 text-xs shadow-lg border border-gray-700 dark:border-gray-300">
                                    {keyDescriptions[k]}
                                </Tooltip.Content>
                            </Tooltip.Root>
                        ) : (
                            <span className="key">{JSON.stringify(k)}</span>
                        )}
                        <span className="punct">: </span>
                        {renderValue(v, indent + 2)}{i < entries.length - 1 ? ',' : ''}
                    </React.Fragment>
                )),
                <br key="obj-end" />,
                Array(indent).fill(' ').join(''),
                '}',
            ];
        }
    } else if (typeof value === 'string') {
        return <span className="string">{JSON.stringify(value)}</span>;
    } else if (typeof value === 'number') {
        return <span className="number">{String(value)}</span>;
    } else if (typeof value === 'boolean') {
        return <span className="boolean">{String(value)}</span>;
    } else if (value === null) {
        return <span className="null">null</span>;
    }
    return String(value);
}

export default function PrettyPrint({ data }: { data: any }) {
    let parsed: any = data;
    if (typeof data === 'string') {
        try {
            parsed = JSON.parse(data);
        } catch {
            // fallback to string
        }
    }
    return (
        <Tooltip.Provider>
            <pre className="json-pre font-mono text-sm">
                {renderValue(parsed, 0)}
            </pre>
        </Tooltip.Provider>
    );
}